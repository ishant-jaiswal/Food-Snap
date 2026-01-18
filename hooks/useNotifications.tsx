import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
// Use import type to avoid runtime import side-effects
import Constants from 'expo-constants';
import type * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface NotificationSettings {
    pushEnabled: boolean;
    emailEnabled: boolean;
    newFollowers: boolean;
    likesComments: boolean;
}

interface NotificationContextType {
    expoPushToken: string | undefined;
    notification: Notifications.Notification | undefined;
    settings: NotificationSettings;
    updateSettings: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
    triggerNotification: (type: 'follower' | 'like' | 'system', title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_SETTINGS: NotificationSettings = {
    pushEnabled: true,
    emailEnabled: true,
    newFollowers: true,
    likesComments: true,
};

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
    const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

    // safeNotifications ref to hold the loaded module if available
    const notificationsRef = useRef<any>(null);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('notification_prefs');
            if (saved) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            }
        } catch (error) {
            console.error("Failed to load notification settings", error);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initNotifications = async () => {
            loadSettings();

            // Check if we are running in Expo Go
            const isExpoGo = Constants.appOwnership === 'expo';
            if (isExpoGo) {
                console.log("Running in Expo Go - Notifications disabled to prevent crash");
                return;
            }

            try {
                // Lazy load expo-notifications
                const NotificationsModule = require('expo-notifications');
                notificationsRef.current = NotificationsModule;

                // Configure handler
                NotificationsModule.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: false,
                        shouldShowBanner: true,
                        shouldShowList: true,
                    }),
                });

                if (isMounted) {
                    await registerForPushNotificationsAsync(NotificationsModule);

                    notificationListener.current = NotificationsModule.addNotificationReceivedListener((notification: Notifications.Notification) => {
                        if (isMounted) setNotification(notification);
                    });

                    responseListener.current = NotificationsModule.addNotificationResponseReceivedListener((response: any) => {
                        console.log(response);
                    });
                }
            } catch (error) {
                console.warn("Notifications module failed to load:", error);
            }
        };

        initNotifications();

        return () => {
            isMounted = false;
            try {
                if (notificationsRef.current) {
                    notificationListener.current?.remove();
                    responseListener.current?.remove();
                }
            } catch (e) {
                // ignore cleanup errors
            }
        };
    }, []);

    const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await AsyncStorage.setItem('notification_prefs', JSON.stringify(newSettings));
        } catch (error) {
            console.error("Failed to save notification settings", error);
        }
    };

    const triggerNotification = async (type: 'follower' | 'like' | 'system', title: string, body: string) => {
        const NotificationsModule = notificationsRef.current;
        if (!NotificationsModule) {
            console.log("Notifications module not loaded (likely Expo Go), skipping notification:", title);
            return;
        }

        // 1. Global Push Check
        if (!settings.pushEnabled) {
            console.log("Notification suppressed: Push disabled globally.");
            return;
        }

        // 2. Specific Type Check
        if (type === 'follower' && !settings.newFollowers) {
            console.log("Notification suppressed: New Followers disabled.");
            return;
        }
        if (type === 'like' && !settings.likesComments) {
            console.log("Notification suppressed: Likes/Comments disabled.");
            return;
        }

        // 3. Trigger Local Notification
        try {
            await NotificationsModule.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: { type },
                    sound: 'default',
                },
                trigger: null, // show immediately
            });
        } catch (error) {
            console.log("Failed to schedule notification:", error);
        }
    };

    async function registerForPushNotificationsAsync(NotificationsModule: any) {
        let token;

        if (Platform.OS === 'android') {
            await NotificationsModule.setNotificationChannelAsync('default', {
                name: 'default',
                importance: NotificationsModule.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            try {
                const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await NotificationsModule.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    console.log('Failed to get push token for push notification!');
                    return;
                }
                // token = (await NotificationsModule.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
            } catch (e) {
                console.log("Error getting permissions/token", e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (token) setExpoPushToken(token);
        return token;
    }

    return (
        <NotificationContext.Provider
            value={{
                expoPushToken,
                notification,
                settings,
                updateSettings,
                triggerNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
