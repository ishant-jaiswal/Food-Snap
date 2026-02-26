import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useAuth, User } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { followUser, getUsersByIds, isFollowing, unfollowUser } from "@/services/userService";
import { Feather } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteParams = {
    UserList: {
        title: string;
        userIds: string[];
    };
};

export default function UserListScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'UserList'>>();
    const { title, userIds } = route.params;
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadUsers();
    }, [userIds]);

    const loadUsers = async () => {
        if (!userIds || userIds.length === 0) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchedUsers = await getUsersByIds(userIds);
        setUsers(fetchedUsers);

        // Check following status for each user
        if (currentUser?.id) {
            const statusMap: { [key: string]: boolean } = {};
            for (const user of fetchedUsers) {
                // @ts-ignore
                const following = await isFollowing(currentUser, user.id);
                statusMap[user.id] = following ?? false;
            }
            setFollowingStatus(statusMap);
        }

        setLoading(false);
    };

    const handleFollowToggle = async (targetUserId: string) => {
        if (!currentUser?.id) return;

        const isCurrentlyFollowing = followingStatus[targetUserId];

        // Optimistic update
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

        try {
            if (isCurrentlyFollowing) {
                await unfollowUser(currentUser.id, targetUserId);
            } else {
                await followUser(currentUser.id, targetUserId);
            }
        } catch (error) {
            // Revert on error
            setFollowingStatus(prev => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
            console.error("Failed to toggle follow", error);
        }
    };

    const renderItem = ({ item }: { item: User }) => {
        const isMe = currentUser?.id === item.id;
        const isFollowing = followingStatus[item.id];

        return (
            <View style={[styles.userItem, { borderBottomColor: theme.border }]}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
                        {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Feather name="user" size={20} color={theme.textSecondary} />
                        )}
                    </View>
                    <View>
                        <ThemedText style={styles.userName}>{item.fullName}</ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                            {item.email}
                        </ThemedText>
                    </View>
                </View>
                {!isMe && (
                    <Pressable
                        style={[
                            styles.followButton,
                            isFollowing
                                ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }
                                : { backgroundColor: Colors.light.primary }
                        ]}
                        onPress={() => handleFollowToggle(item.id)}
                    >
                        <ThemedText
                            style={[
                                styles.followButtonText,
                                isFollowing ? { color: theme.text } : { color: '#FFF' }
                            ]}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </ThemedText>
                    </Pressable>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle}>{title}</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <ThemedText style={{ color: theme.textSecondary }}>No users found</ThemedText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        ...Typography.h3,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    listContent: {
        padding: Spacing.lg,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        ...Typography.bodyMedium,
    },
    followButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        minWidth: 80,
        alignItems: 'center',
    },
    followButtonText: {
        ...Typography.smallMedium,
    }
});
