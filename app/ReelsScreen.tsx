import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { addComment, fetchReels, getComments, incrementShareCount, toggleLikeReel } from "@/services/reelsService";
import { followUser, isFollowing, unfollowUser } from "@/services/userService";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from 'expo-linking';
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Reel {
  id: string;
  userId: string;
  username: string;
  caption: string;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  music: string;
  videoUrl: string;
  createdAt: any;
  tags?: string[];
  userProfileImage?: string;
}
const reelsData: Reel[] = [
  {
    id: "1",
    userId: "user1",
    username: "healthychef",
    caption: "Easy 5-min protein breakfast bowl! Perfect for busy mornings.",
    likes: [],
    likesCount: 12500,
    commentsCount: 234,
    sharesCount: 89,
    music: "Morning Vibes - Chill Beats",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Demo Video
    createdAt: new Date(),
  },
  {
    id: "2",
    userId: "user2",
    username: "fitnessmom",
    caption: "Meal prep Sunday! 7 days of healthy lunches ready to go.",
    likes: [],
    likesCount: 8900,
    commentsCount: 156,
    sharesCount: 67,
    music: "Cooking Time - Jazz Mix",
    videoUrl: "https://www.w3schools.com/html/movie.mp4", // Demo Video
    createdAt: new Date(),
  },
  {
    id: "3",
    userId: "user3",
    username: "nutritionexpert",
    caption: "Why you should track your macros - game changer!",
    likes: [],
    likesCount: 15200,
    commentsCount: 445,
    sharesCount: 123,
    music: "Motivation - Hip Hop",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Demo Video
    createdAt: new Date(),
  },
];

// Separate component for each reel to manage its own video player state
const ReelItem = React.memo(function ReelItem(
  { item, index, isActive, containerHeight, navigation, toggleLike, isLiked, openComments, currentUser }: any) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // ✅ Initialize player ONCE – no play/pause logic here
  const player = useVideoPlayer(item.videoUrl);

  // ✅ SINGLE source of truth for auto play / pause
  useEffect(() => {
    player.loop = true;
    if (isActive) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isActive, player]);

  // ✅ Track progress safely
  useEffect(() => {
    let interval: any;

    if (isActive && isPlaying) {
      interval = setInterval(() => {
        if (player.duration > 0) {
          setProgress(player.currentTime / player.duration);
        }
      }, 250);
    }

    return () => interval && clearInterval(interval);
  }, [isActive, isPlaying]);

  // ✅ Tap to toggle play / pause (WORKING)
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

  // Follow status
  useEffect(() => {
    if (currentUser && item.userId && currentUser.id !== item.userId) {
      setIsFollowingUser(isFollowing(currentUser, item.userId) || false);
    }
  }, [currentUser, item.userId]);

  const handleFollow = async () => {
    if (!currentUser?.id) {
      Alert.alert("Sign In Required", "Please sign in to follow users.");
      return;
    }

    const next = !isFollowingUser;
    setIsFollowingUser(next);

    try {
      next
        ? await followUser(currentUser.id, item.userId)
        : await unfollowUser(currentUser.id, item.userId);
    } catch {
      setIsFollowingUser(!next);
    }
  };

  const handleShare = async () => {
    try {
      const url = Linking.createURL(`reel/${item.id}`, { scheme: 'foodsnap' });
      await Share.share({
        message: `Check out this reel by @${item.username}: ${url}`,
      });
      await incrementShareCount(item.id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.reelContainer, { height: containerHeight }]}>
      {/* VIDEO */}
      <Pressable onPress={togglePlayback} style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />

        {/* PLAY ICON */}
        {!isPlaying && (
          <View style={styles.pauseOverlay} pointerEvents="none">
            <Feather name="play" size={50} color="rgba(255,255,255,0.7)" />
          </View>
        )}
      </Pressable>

      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "transparent", "transparent", "rgba(0,0,0,0.8)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* TOP BAR */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <ThemedText style={styles.headerTitle}>Diet Reels</ThemedText>
        <Pressable onPress={() => navigation.navigate("CreateReel")} style={styles.cameraButton}>
          <Feather name="plus-square" size={28} color="#FFF" />
        </Pressable>
      </View>

      {/* RIGHT ACTIONS */}
      <View style={[styles.rightColumn, { bottom: tabBarHeight + Spacing.xl }]}>
        <Pressable style={styles.actionButton} onPress={() => toggleLike(item)}>
          <Feather name="heart" size={30} color={isLiked ? "#FF4757" : "#FFF"} />
          <ThemedText style={styles.actionCount}>{item.likesCount}</ThemedText>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => openComments(item)}>
          <Feather name="message-circle" size={30} color="#FFF" />
          <ThemedText style={styles.actionCount}>{item.commentsCount}</ThemedText>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Feather name="send" size={30} color="#FFF" />
          <ThemedText style={styles.actionCount}>{item.sharesCount}</ThemedText>
        </Pressable>
      </View>

      {/* USER INFO */}
      <View style={[styles.userInfo, { bottom: tabBarHeight + Spacing.xl }]}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            {item.userProfileImage ? (
              <Image
                source={{ uri: item.userProfileImage }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <Feather name="user" size={16} color="#FFF" />
            )}
          </View>

          <ThemedText style={styles.username}>@{item.username}</ThemedText>

          {currentUser?.id !== item.userId && (
            <Pressable
              onPress={handleFollow}
              style={[styles.followButton, isFollowingUser && styles.followingButton]}
            >
              <ThemedText style={styles.followText}>
                {isFollowingUser ? "Following" : "Follow"}
              </ThemedText>
            </Pressable>
          )}
        </View>

        <ThemedText style={styles.caption} numberOfLines={2}>
          {item.caption}
        </ThemedText>

        {item.music && (
          <View style={styles.musicRow}>
            <Feather name="music" size={14} color="#FFF" />
            <ThemedText style={styles.musicText}>{item.music}</ThemedText>
          </View>
        )}
      </View>

      {/* PROGRESS BAR */}
      <Pressable
        style={[styles.progressBarContainer, { bottom: tabBarHeight - 2 }]}
        onPress={(e) => {
          const percent = e.nativeEvent.locationX / width;
          if (player.duration > 0) {
            player.currentTime = percent * player.duration;
            setProgress(percent);
          }
        }}
      >
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </Pressable>
    </View>
  );
}
);

// Skeleton Loader Component
const ReelSkeleton = ({ height }: { height: number }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={[styles.reelContainer, { backgroundColor: "#1a1a1a", height }]}>
      {/* Sidebar Actions Skeleton */}
      <View style={[styles.rightColumn, { bottom: tabBarHeight + Spacing.xl }]}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.actionButton, { opacity: 0.3 }]}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#555", marginBottom: 4 }} />
            <View style={{ width: 20, height: 10, borderRadius: 4, backgroundColor: "#555" }} />
          </View>
        ))}
      </View>

      {/* Bottom Info Skeleton */}
      <View style={[styles.userInfo, { bottom: tabBarHeight + Spacing.xl }]}>
        <View style={[styles.userRow, { opacity: 0.3 }]}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#555", marginRight: 8 }} />
          <View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: "#555" }} />
        </View>
        <View style={{ width: "70%", height: 14, borderRadius: 4, backgroundColor: "#555", marginBottom: 8, opacity: 0.3 }} />
        <View style={{ width: "50%", height: 14, borderRadius: 4, backgroundColor: "#555", opacity: 0.3 }} />
      </View>
    </View>
  );
};

export default function ReelsScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(Dimensions.get("window").height);

  // Auth
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Comments State
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    setLoading(true);
    const { reels: newReels } = await fetchReels();
    setReels(newReels as Reel[]);
    setLoading(false);
  };

  // Stabilize handlers
  const handleLike = React.useCallback(async (item: Reel) => {
    if (!currentUserId) return;
    const isLiked = item.likes?.includes(currentUserId);
    await toggleLikeReel(item.id, currentUserId, isLiked);

    setReels(prev => prev.map(r => {
      if (r.id === item.id) {
        return {
          ...r,
          likesCount: isLiked ? r.likesCount - 1 : r.likesCount + 1,
          likes: isLiked ? r.likes.filter((id: string) => id !== currentUserId) : [...(r.likes || []), currentUserId]
        };
      }
      return r;
    }));
  }, [currentUserId]);

  const fetchReelComments = async (reelId: string) => {
    setLoadingComments(true);
    const fetchedComments = await getComments(reelId);
    setComments(fetchedComments);
    setLoadingComments(false);
  };

  const handleOpenComments = React.useCallback(async (reel: Reel) => {
    setActiveReel(reel);
    setCommentsModalVisible(true);
    fetchReelComments(reel.id);
  }, []);



  const handlePostComment = async () => {
    if (!newComment.trim() || !activeReel || !currentUserId) return;

    // Add locally for speed
    const tempComment = {
      id: Date.now().toString(),
      username: "You", // or user.displayName
      text: newComment,
      createdAt: { seconds: Date.now() / 1000 }
    };
    setComments(prev => [tempComment, ...prev]);
    setNewComment("");

    // API Call
    await addComment(activeReel.id, currentUserId, user?.fullName || "User", tempComment.text);

    // Increment count locally on reel
    setReels(prev => prev.map(r => r.id === activeReel.id ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r));
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {containerHeight > 0 && !loading && reels.length > 0 ? (
        <FlatList
          data={reels}
          renderItem={({ item, index }) => (
            <ReelItem
              item={item}
              index={index}
              isActive={index === activeIndex && isFocused}
              containerHeight={containerHeight}
              navigation={navigation}
              toggleLike={handleLike}
              isLiked={currentUserId ? item.likes?.includes(currentUserId) : false}
              openComments={handleOpenComments}
              currentUser={user}
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
      ) : null}

      {(loading || (reels.length === 0 && containerHeight > 0)) && (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          {loading ? <ActivityIndicator size="large" color={Colors.light.primary} /> :
            <ThemedText style={{ color: '#FFF' }}>No Reels Yet. Create one!</ThemedText>}
        </View>
      )}

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={commentsModalVisible}
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Comments</ThemedText>
              <Pressable onPress={() => setCommentsModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.light.text} />
              </Pressable>
            </View>

            {loadingComments ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Feather name="user" size={14} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.commentUser}>{item.username}</ThemedText>
                      <ThemedText style={styles.commentText}>{item.text}</ThemedText>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<ThemedText style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No comments yet.</ThemedText>}
              />
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#888"
                value={newComment}
                onChangeText={setNewComment}
              />
              <Pressable onPress={handlePostComment} style={styles.sendButton}>
                <Feather name="send" size={20} color={Colors.light.primary} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  reelContainer: {
    width,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    ...Typography.h3,
    color: "#FFFFFF",
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  rightColumn: {
    position: "absolute",
    right: Spacing.md,
    alignItems: "center",
    gap: 20,
    zIndex: 10,
  },
  actionButton: {
    alignItems: "center",
  },
  actionCount: {
    color: "#FFFFFF",
    ...Typography.caption,
    marginTop: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    position: "absolute",
    left: Spacing.lg,
    right: 80,
    zIndex: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    marginRight: 8,
  },
  username: {
    ...Typography.bodyMedium,
    color: "#FFFFFF",
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginRight: 12,
  },
  followButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  followingButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  followText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  caption: {
    ...Typography.body,
    color: "#FFFFFF",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  musicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  musicText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#111", // Dark Theme Modal
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
    paddingBottom: 30, // Safe area bottom
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentUser: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  commentText: {
    color: "#DDD",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#FFF",
    marginRight: 10,
  },
  sendButton: {
    padding: 8,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // Slight dim when paused
    zIndex: 5,
  },
  progressBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 20, // Taller hit area for easier scrubbing
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  progressBar: {
    height: 3, // Visual height
    backgroundColor: Colors.light.primary,
  },
});
