import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { deleteReel, fetchUserReels } from "@/services/reelsService";
import { Feather } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MyReelItem = React.memo(function MyReelItem(
    { item, index, isActive, containerHeight, onDelete }: any) {
    const insets = useSafeAreaInsets();
    const [isPlaying, setIsPlaying] = useState(true);

    const player = useVideoPlayer(item.videoUrl, (player) => {
        player.loop = true;
    });

    useEffect(() => {
        if (!player) return;
        if (isActive) {
            player.play();
            setIsPlaying(true);
        } else {
            player.pause();
            setIsPlaying(false);
        }
    }, [isActive, player]);

    const togglePlayback = () => {
        setIsPlaying((prev) => {
            if (prev) {
                player.pause();
                return false;
            } else {
                player.play();
                return true;
            }
        });
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Reel",
            "Are you sure you want to delete this reel? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete(item.id)
                }
            ]
        );
    };

    return (
        <View style={[styles.reelContainer, { height: containerHeight }]}>
            <Pressable onPress={togglePlayback} style={StyleSheet.absoluteFill}>
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    nativeControls={false}
                />
                {!isPlaying && (
                    <View style={styles.pauseOverlay} pointerEvents="none">
                        <Feather name="play" size={50} color="rgba(255,255,255,0.7)" />
                    </View>
                )}
            </Pressable>

            {/* Delete Button */}
            <Pressable style={[styles.deleteButton, { top: insets.top + Spacing.md }]} onPress={handleDelete}>
                <Feather name="trash-2" size={24} color="#FFF" />
            </Pressable>

            {/* User Info */}
            <View style={[styles.userInfo, { bottom: Spacing.xl }]}>
                <View style={styles.userRow}>
                    <View style={styles.avatarContainer}>
                        {item.userProfileImage ? (
                            <Image
                                source={{ uri: item.userProfileImage }}
                                style={styles.avatar}
                            />
                        ) : (
                            <Feather name="user" size={20} color="#FFF" />
                        )}
                    </View>
                    <ThemedText style={styles.username}>@{item.username}</ThemedText>
                </View>
                <ThemedText style={styles.caption} numberOfLines={2}>
                    {item.caption}
                </ThemedText>
            </View>
        </View>
    );
}
);

export default function MyReelsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [containerHeight, setContainerHeight] = useState(Dimensions.get("window").height);

    useEffect(() => {
        if (user?.id && isFocused) {
            loadReels();
        }
    }, [user?.id, isFocused]);

    const loadReels = async () => {
        if (!user?.id) return;
        setLoading(true);
        const myReels = await fetchUserReels(user.id);
        setReels(myReels);
        setLoading(false);
    };

    const handleDeleteReel = async (reelId: string) => {
        try {
            await deleteReel(reelId);
            setReels(prev => prev.filter(r => r.id !== reelId));
            if (reels.length <= 1) {
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete reel");
        }
    };

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={styles.container} onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}>
            {/* Header Back Button */}
            <Pressable
                style={[styles.backButton, { top: insets.top + Spacing.sm }]}
                onPress={() => navigation.goBack()}
            >
                <Feather name="arrow-left" size={28} color="#FFF" />
            </Pressable>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            ) : reels.length === 0 ? (
                <View style={styles.center}>
                    <ThemedText style={{ color: '#FFF' }}>No reels found.</ThemedText>
                </View>
            ) : (
                <FlatList
                    data={reels}
                    renderItem={({ item, index }) => (
                        <MyReelItem
                            item={item}
                            index={index}
                            isActive={index === activeIndex && isFocused}
                            containerHeight={containerHeight}
                            onDelete={handleDeleteReel}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    snapToInterval={containerHeight}
                    decelerationRate="fast"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    getItemLayout={(_, index) => ({
                        length: containerHeight,
                        offset: containerHeight * index,
                        index,
                    })}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reelContainer: {
        width,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        position: 'relative',
    },
    backButton: {
        position: "absolute",
        left: Spacing.lg,
        zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 20,
    },
    deleteButton: {
        position: "absolute",
        right: Spacing.lg,
        zIndex: 20,
        backgroundColor: 'rgba(255, 0, 0, 0.6)',
        padding: 10,
        borderRadius: 25,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 5,
    },
    userInfo: {
        position: "absolute",
        left: Spacing.lg,
        right: 80,
        zIndex: 10,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#FFF',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    username: {
        ...Typography.bodyMedium,
        color: "#FFFFFF",
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    caption: {
        ...Typography.body,
        color: "#FFFFFF",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
