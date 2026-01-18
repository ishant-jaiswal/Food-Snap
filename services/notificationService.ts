import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Helper to detect if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Mock for Expo Go to prevent SDK 53 crash from 'expo-notifications' side-effects
const MockNotifications = {
    setNotificationHandler: () => {
        console.log("Notifications (Mock): Handler set");
    },
    setNotificationChannelAsync: async () => {
        console.log("Notifications (Mock): Channel set");
    },
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'mock-expo-go-token' }),
    scheduleNotificationAsync: async () => {
        console.log("Notifications (Mock): Scheduled local notification");
    },
    cancelAllScheduledNotificationsAsync: async () => {
        console.log("Notifications (Mock): Cancelled all");
    },
    addNotificationReceivedListener: (callback: any) => {
        console.log("Notifications (Mock): Listener added");
        return { remove: () => console.log("Notifications (Mock): Listener removed") };
    },
    AndroidImportance: { MAX: 5 },
    SchedulableTriggerInputTypes: { DAILY: 'daily' }
};

// Lazy load expo-notifications to avoid immediate side-effects (like Push Token registration)
// which crash Expo Go on SDK 53+
let Notifications: any;

function getExpoNotificationsPackage() {
    // If we are in Expo Go, return the mock immediately and do NOT require the real package.
    // Requiring the real package triggers 'DevicePushTokenAutoRegistration.fx.js' which crashes.
    if (isExpoGo) {
        return MockNotifications;
    }

    if (!Notifications) {
        Notifications = require('expo-notifications');
    }
    return Notifications;
}

export function initNotificationHandler() {
    const N = getExpoNotificationsPackage();
    N.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export async function registerForPushNotificationsAsync() {
    if (isExpoGo) {
        console.log("Expo Go detected: Notifications mocked to prevent crash.");
    }

    // Initialize handler when we start registering/using notifications
    initNotificationHandler();

    const N = getExpoNotificationsPackage();

    // Listen for incoming notifications to save them to history
    N.addNotificationReceivedListener((notification: any) => {
        const { title, body } = notification.request.content;
        addNotification(title || "New Notification", body || "");
    });

    let token;

    if (Platform.OS === 'android' && !isExpoGo) {
        try {
            await N.setNotificationChannelAsync('default', {
                name: 'default',
                importance: N.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        } catch (e) {
            console.warn("Error setting notification channel", e);
        }
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await N.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await N.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            // alert('Failed to get push token for push notification!');
            return;
        }
        // Need to get token logic here if we were using remote push, but for local we just need permission
        // token = (await N.getExpoPushTokenAsync()).data;
    } else {
        // alert('Must use physical device for Push Notifications');
    }

    return token;
}

export async function scheduleDailyReminder(title: string, body: string, hour: number, minute: number) {
    const N = getExpoNotificationsPackage();
    await N.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            type: N.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
        },
    });
}

export async function cancelAllNotifications() {
    const N = getExpoNotificationsPackage();
    await N.cancelAllScheduledNotificationsAsync();
}

export async function setupReminders() {
    // Ensure initialized if called directly
    initNotificationHandler();

    // Cancel existing to avoid duplicates on reload
    await cancelAllNotifications();
    console.log("Setting up reminders...");

    // Breakfast (8 AM)
    await scheduleDailyReminder("☀️ Morning Fuel!", "Time to log your healthy breakfast.", 8, 30);
    // Lunch (1 PM)
    await scheduleDailyReminder("🥗 Lunch Time!", "Don't forget to snap your lunch.", 13, 0);
    // Dinner (7 PM)
    await scheduleDailyReminder("🍽️ Dinner is served!", "Log your dinner to hit your macros.", 19, 0);
    // Water (Every 2 hours from 9 AM to 9 PM? - Harder with just simple trigger, stick to few main ones)
    await scheduleDailyReminder("💧 Stay Hydrated", "Have you had your water recently?", 11, 0);
    await scheduleDailyReminder("💧 Water Check", "Drink up! Keep that streak alive.", 16, 0);
}


// --- Persistence Logic ---

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationItem {
    id: string;
    title: string;
    body: string;
    date: string;
    read: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
}

const NOTIFICATION_STORAGE_KEY = 'user_notifications';

export const getNotifications = async (): Promise<NotificationItem[]> => {
    try {
        const json = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error("Error reading notifications:", error);
        return [];
    }
};

export const addNotification = async (title: string, body: string, type: NotificationItem['type'] = 'info') => {
    try {
        const current = await getNotifications();
        const newItem: NotificationItem = {
            id: Date.now().toString(),
            title,
            body,
            date: new Date().toISOString(),
            read: false,
            type
        };
        const updated = [newItem, ...current];
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
        return newItem;
    } catch (error) {
        console.error("Error adding notification:", error);
    }
};

export const markAsRead = async (id: string) => {
    try {
        const current = await getNotifications();
        const updated = current.map((item: NotificationItem) => item.id === id ? { ...item, read: true } : item);
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};

export const markAllAsRead = async () => {
    try {
        const current = await getNotifications();
        const updated = current.map((item: NotificationItem) => ({ ...item, read: true }));
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
};

export const getUnreadCount = async (): Promise<number> => {
    const current = await getNotifications();
    return current.filter((item: NotificationItem) => !item.read).length;
};
