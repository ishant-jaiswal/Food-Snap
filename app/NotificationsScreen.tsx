import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotifications, markAllAsRead, markAsRead, NotificationItem } from "@/services/notificationService";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { settings, updateSettings } = useNotifications();
    const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleMarkRead = async (id: string) => {
        await markAsRead(id);
        loadNotifications();
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        loadNotifications();
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderInbox = () => (
        <View style={styles.inboxContainer}>
            {notifications.length > 0 && (
                <Pressable onPress={handleMarkAllRead} style={styles.markAllReadBtn}>
                    <ThemedText style={styles.markAllReadText}>Mark all as read</ThemedText>
                </Pressable>
            )}
            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="bell-off" size={48} color="rgba(255,255,255,0.3)" />
                        <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
                    </View>
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.notificationItem, !item.read && styles.unreadItem]}
                        onPress={() => handleMarkRead(item.id)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.read ? 'rgba(255,255,255,0.1)' : Colors.light.primary }]}>
                            <Feather name="bell" size={20} color="#FFF" />
                        </View>
                        <View style={styles.notificationContent}>
                            <View style={styles.notificationHeader}>
                                <ThemedText style={[styles.notificationTitle, !item.read && { fontWeight: '700', color: Colors.light.primary }]}>
                                    {item.title}
                                </ThemedText>
                                <ThemedText style={styles.notificationTime}>{formatDate(item.date)}</ThemedText>
                            </View>
                            <ThemedText style={styles.notificationBody} numberOfLines={2}>
                                {item.body}
                            </ThemedText>
                        </View>
                        {!item.read && <View style={styles.unreadDot} />}
                    </Pressable>
                )}
            />
        </View>
    );

    const renderSettings = () => (
        <ScrollView style={styles.content}>
            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>General</ThemedText>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <ThemedText style={styles.label}>Push Notifications</ThemedText>
                        <ThemedText style={styles.sublabel}>Receive alerts on your device</ThemedText>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: Colors.light.primary }}
                        thumbColor={settings.pushEnabled ? "#FFF" : "#f4f3f4"}
                        onValueChange={(val) => updateSettings('pushEnabled', val)}
                        value={settings.pushEnabled}
                    />
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <ThemedText style={styles.label}>Email Notifications</ThemedText>
                        <ThemedText style={styles.sublabel}>Receive updates via email</ThemedText>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: Colors.light.primary }}
                        thumbColor={settings.emailEnabled ? "#FFF" : "#f4f3f4"}
                        onValueChange={(val) => updateSettings('emailEnabled', val)}
                        value={settings.emailEnabled}
                    />
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Activity</ThemedText>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <ThemedText style={styles.label}>New Followers</ThemedText>
                        <ThemedText style={styles.sublabel}>Notify when someone follows you</ThemedText>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: Colors.light.primary }}
                        thumbColor={settings.newFollowers ? "#FFF" : "#f4f3f4"}
                        onValueChange={(val) => updateSettings('newFollowers', val)}
                        value={settings.newFollowers}
                    />
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <ThemedText style={styles.label}>Likes & Comments</ThemedText>
                        <ThemedText style={styles.sublabel}>Notify on interaction with your reels</ThemedText>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: Colors.light.primary }}
                        thumbColor={settings.likesComments ? "#FFF" : "#f4f3f4"}
                        onValueChange={(val) => updateSettings('likesComments', val)}
                        value={settings.likesComments}
                    />
                </View>
            </View>

        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#FFF" />
                </Pressable>
                <ThemedText style={styles.title}>Notifications</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, activeTab === 'inbox' && styles.activeTab]}
                    onPress={() => setActiveTab('inbox')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'inbox' && styles.activeTabText]}>Inbox</ThemedText>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                    onPress={() => setActiveTab('settings')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</ThemedText>
                </Pressable>
            </View>

            {activeTab === 'inbox' ? renderInbox() : renderSettings()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        backgroundColor: '#000',
    },
    backButton: {
        padding: 4,
    },
    title: {
        ...Typography.h3,
        color: "#FFF",
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.light.primary,
    },
    tabText: {
        ...Typography.bodyMedium,
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabText: {
        color: Colors.light.primary,
        fontWeight: 'bold',
    },
    inboxContainer: {
        flex: 1,
    },
    markAllReadBtn: {
        alignItems: 'flex-end',
        padding: Spacing.md,
    },
    markAllReadText: {
        ...Typography.caption,
        color: Colors.light.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: Spacing.md,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        ...Typography.body,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'flex-start',
    },
    unreadItem: {
        backgroundColor: 'rgba(255,193,7, 0.05)', // Slight gold tint for unread
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    notificationTitle: {
        ...Typography.bodyMedium,
        color: '#FFF',
        flex: 1,
        marginRight: 8,
    },
    notificationTime: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.4)',
    },
    notificationBody: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.7)',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.light.primary,
        marginLeft: Spacing.sm,
        marginTop: 6,
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h4,
        color: Colors.light.primary,
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: Spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    rowText: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    label: {
        ...Typography.body,
        color: "#FFF",
        marginBottom: 4,
    },
    sublabel: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.6)',
    },
});
