import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { uploadReel } from "@/services/reelsService";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const editingOptions = [
  { id: "trim", icon: "scissors" as const, label: "Trim" },
  { id: "filter", icon: "sliders" as const, label: "Filter" },
  { id: "text", icon: "type" as const, label: "Text" },
  { id: "music", icon: "music" as const, label: "Music" },
  { id: "sticker", icon: "smile" as const, label: "Sticker" },
  { id: "effects", icon: "zap" as const, label: "Effects" },
];

const suggestedTags = ["#healthyfood", "#mealprep", "#nutrition", "#fitness", "#protein", "#cleaneating"];

export default function CreateReelScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!microphonePermission?.granted) await requestMicrophonePermission();
    })();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const cleanUpRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimer(0);
  };

  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      cameraRef.current.stopRecording();
      cleanUpRecording();
    } else {
      setIsRecording(true);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
        });
        if (video?.uri) {
          setVideoUri(video.uri);
        }
      } catch (error) {
        console.error("Recording failed", error);
        Alert.alert("Error", "Failed to record video");
      } finally {
        cleanUpRecording();
      }
    }
  };

  const handlePickVideo = async () => {
    try {
      console.log("Picking video...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "videos",
        allowsEditing: true,
        quality: 1,
      });
      console.log("Pick result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log("Setting URI:", result.assets[0].uri);
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Pick error:", error);
      Alert.alert("Error", "Failed to pick video");
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing(prev => (prev === "back" ? "front" : "back"));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const [uploading, setUploading] = useState(false);

  const handlePost = async () => {
    if (!videoUri) return;
    setUploading(true);
    try {
      if (!user) {
        Alert.alert("Error", "You must be logged in to post a reel.");
        return;
      }

      await uploadReel(
        user.id,
        user.fullName || "User",
        videoUri,
        caption,
        selectedTags,
        user.avatar
      );
      Alert.alert("Success", "Reel uploaded successfully!");
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // @ts-ignore
        navigation.navigate("Main");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload reel.");
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setVideoUri(null);
    setCaption("");
    setSelectedTags([]);
  };

  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
    player.play();
    player.muted = false;
  });

  if (!cameraPermission || !microphonePermission) {
    return <View style={styles.container} />; // Loading permissions
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ThemedText style={{ color: "#FFF", marginBottom: 20 }}>Camera permissions needed</ThemedText>
        <Pressable onPress={requestCameraPermission} style={styles.postButton}>
          <ThemedText style={styles.postButtonText}>Grant Permission</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {videoUri ? (
        <View style={styles.previewContainer}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </View>
      ) : (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          mode="video"
        />
      )}

      {!videoUri && (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        />
      )}

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable style={styles.topButton} onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // @ts-ignore
            navigation.navigate("Main");
          }
        }}>
          <Feather name="x" size={28} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.title}>{videoUri ? "Edit Reel" : "Create Reel"}</ThemedText>
        <Pressable style={[styles.uploadButton, { opacity: isRecording ? 0.5 : 1 }]}>
          <Feather name="settings" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <ThemedText style={styles.recordingTime}>{formatTime(timer)}</ThemedText>
        </View>
      )}

      {/* Controls */}
      {!videoUri ? (
        <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Pressable style={styles.sideButton} onPress={handlePickVideo} disabled={isRecording}>
            <Feather name="image" size={28} color="#FFFFFF" />
            <ThemedText style={styles.sideButtonLabel}>Gallery</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive
            ]}
            onPress={handleRecord}
          >
            <View style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerActive
            ]} />
          </Pressable>

          <Pressable style={styles.sideButton} onPress={toggleCameraFacing} disabled={isRecording}>
            <Feather name="refresh-cw" size={28} color="#FFFFFF" />
            <ThemedText style={styles.sideButtonLabel}>Flip</ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.editingPanel, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.editingHeader}>
            <ThemedText style={styles.editingTitle}>Add Details</ThemedText>
            <Pressable onPress={handleRetake}>
              <ThemedText style={[styles.redoText, { color: Colors.light.primary }]}>
                Re-record
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.editingOptions}>
            {editingOptions.map((option) => (
              <Pressable key={option.id} style={styles.editingOption}>
                <View style={[styles.editingOptionIcon, { backgroundColor: `${Colors.light.primary}20` }]}>
                  <Feather name={option.icon} size={20} color={Colors.light.primary} />
                </View>
                <ThemedText style={styles.editingOptionLabel}>{option.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.captionSection}>
            <TextInput
              style={[styles.captionInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={150}
            />
            <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
              {caption.length}/150
            </ThemedText>
          </View>

          <View style={styles.tagsSection}>
            <ThemedText style={styles.tagsLabel}>AI-Suggested Tags</ThemedText>
            <View style={styles.tagsContainer}>
              {suggestedTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tagChip,
                    { borderColor: theme.border },
                    selectedTags.includes(tag) && {
                      backgroundColor: `${Colors.light.primary}20`,
                      borderColor: Colors.light.primary,
                    }
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <ThemedText style={[
                    styles.tagText,
                    selectedTags.includes(tag) && { color: Colors.light.primary }
                  ]}>
                    {tag}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.postButton,
              { opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={handlePost}
          >
            <ThemedText style={styles.postButtonText}>Post Reel</ThemedText>
          </Pressable>
        </View>
      )}
      {/* Uploading Overlay */}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <ThemedText style={styles.uploadingText}>Posting Reel...</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 22,
  },
  title: {
    ...Typography.h4,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  uploadButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingIndicator: {
    position: "absolute",
    top: "15%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,0,0,0.8)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    zIndex: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  recordingTime: {
    color: "#FFFFFF",
    ...Typography.bodyMedium,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.xl,
  },
  sideButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  sideButtonLabel: {
    color: "#FFFFFF",
    ...Typography.caption,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonActive: {
    borderColor: "#FF4444",
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF4444",
  },
  recordButtonInnerActive: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  editingPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  editingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  editingTitle: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
  redoText: {
    ...Typography.bodyMedium,
  },
  editingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  editingOption: {
    alignItems: "center",
    width: "30%",
    marginBottom: Spacing.sm,
  },
  editingOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  editingOptionLabel: {
    color: "#FFFFFF",
    ...Typography.caption,
  },
  captionSection: {
    marginBottom: Spacing.lg,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: "top",
    ...Typography.body,
  },
  charCount: {
    ...Typography.caption,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  tagsSection: {
    marginBottom: Spacing.xl,
  },
  tagsLabel: {
    ...Typography.smallMedium,
    color: "#FFFFFF",
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    ...Typography.small,
    color: "#FFFFFF",
  },
  postButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.soft,
  },
  postButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  uploadingText: {
    ...Typography.h4,
    color: "#FFFFFF",
    marginTop: Spacing.md,
  },
});
