import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PhotoSlot {
  id: string;
  label: string;
  angle: string;
  required: boolean;
  captured: boolean;
  uri?: string;
}

const initialSlots: PhotoSlot[] = [
  { id: "top", label: "TOP", angle: "90 deg", required: true, captured: false },
  { id: "angle", label: "ANGLE", angle: "45 deg", required: true, captured: false },
  { id: "side", label: "SIDE", angle: "0 deg", required: true, captured: false },
  { id: "ref", label: "REF", angle: "Optional", required: false, captured: false },
];

export default function FoodCaptureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const [slots, setSlots] = useState(initialSlots);
  const [activeSlot, setActiveSlot] = useState(0);

  /* ---------------- CAMERA STATE ---------------- */
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const hasPermission = permission?.granted;

  const capturedCount = slots.filter(s => s.captured).length;
  const requiredCount = slots.filter(s => s.required).length;
  const canAnalyze = slots.filter(s => s.required && s.captured).length === requiredCount;

  /* ---------------- CAMERA ACTIONS ---------------- */
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSlots(prev =>
        prev.map((slot, index) =>
          index === activeSlot ? { ...slot, captured: true, uri: result.assets[0].uri } : slot
        )
      );

      setCameraVisible(false);

      if (activeSlot < slots.length - 1) {
        setActiveSlot(activeSlot + 1);
      }
    }
  };

  const openCamera = () => {
    if (hasPermission) {
      setCameraVisible(true);
    } else {
      requestPermission();
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true, // Try this to speed up/fix capture
      });

      if (photo) {
        setSlots(prev =>
          prev.map((slot, index) =>
            index === activeSlot ? { ...slot, captured: true, uri: photo.uri } : slot
          )
        );

        setCameraVisible(false);

        if (activeSlot < slots.length - 1) {
          setActiveSlot(activeSlot + 1);
        }
      }
    } catch (error) {
      console.error("Camera Capture Error:", error);
      alert("Failed to take photo. Please try again.");
    }
  };

  const handleCapture = () => {
    openCamera();
  };

  const handleAnalyze = () => {
    navigation.navigate("PhotoOutput", { imageUri: slots[0].uri });
  };

  const handleSlotPress = (index: number) => {
    setActiveSlot(index);
  };

  const resetSlot = (index: number) => {
    setSlots(prev => prev.map((slot, i) =>
      i === index ? { ...slot, captured: false } : slot
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: Spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.title}>Capture Food</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <ThemedText style={[styles.instruction, { color: theme.textSecondary }]}>
          Take photos from different angles for accurate analysis
        </ThemedText>

        <View style={[styles.gridCard, { backgroundColor: theme.card }]}>
          <View style={styles.photoGrid}>
            {slots.map((slot, index) => (
              <Pressable
                key={slot.id}
                style={[
                  styles.photoSlot,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                  activeSlot === index && { borderColor: Colors.light.primary, borderWidth: 2 },
                  !slot.required && styles.optionalSlot,
                ]}
                onPress={() => handleSlotPress(index)}
              >
                {slot.captured && slot.uri ? (
                  <View style={styles.capturedSlot}>
                    <Image source={{ uri: slot.uri }} style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]} resizeMode="cover" />
                    <View style={styles.capturedOverlay}>
                      <Feather name="check-circle" size={24} color={Colors.light.primary} />
                    </View>
                    <Pressable
                      style={styles.resetButton}
                      onPress={() => resetSlot(index)}
                    >
                      <Feather name="x" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.emptySlot}>
                    <Feather name="camera" size={24} color={theme.textSecondary} />
                    <ThemedText style={styles.slotLabel}>{slot.label}</ThemedText>
                    <ThemedText style={[styles.slotAngle, { color: theme.textSecondary }]}>
                      {slot.angle}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.pagination}>
          {slots.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: theme.border },
                index === activeSlot && { backgroundColor: Colors.light.primary, width: 24 },
                slots[index].captured && { backgroundColor: Colors.light.primary },
              ]}
            />
          ))}
        </View>

        <ThemedText style={[styles.progress, { color: theme.textSecondary }]}>
          {capturedCount} of {requiredCount} required photos captured
        </ThemedText>
      </View>

      <View style={[styles.controls, { paddingBottom: Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [
            styles.captureButton,
            { opacity: pressed ? 0.9 : 1 }
          ]}
          onPress={handleCapture}
        >
          <View style={styles.captureButtonInner}>
            <Feather name="camera" size={28} color="#FFFFFF" />
          </View>
        </Pressable>

        {canAnalyze ? (
          <Pressable
            style={({ pressed }) => [
              styles.analyzeButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={handleAnalyze}
          >
            <Feather name="zap" size={20} color="#FFFFFF" />
            <ThemedText style={styles.analyzeButtonText}>Analyze Food</ThemedText>
          </Pressable>
        ) : (
          <View style={[styles.analyzeButton, styles.analyzeButtonDisabled]}>
            <Feather name="zap" size={20} color="rgba(255,255,255,0.5)" />
            <ThemedText style={[styles.analyzeButtonText, { opacity: 0.5 }]}>
              Capture All Photos
            </ThemedText>
          </View>
        )}
      </View>

      {/* CAMERA MODAL */}
      <Modal visible={cameraVisible} animationType="slide">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 50, paddingHorizontal: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable onPress={() => setCameraVisible(false)} style={{ padding: 10 }}>
                <Feather name="x" size={32} color="#FFF" />
              </Pressable>

              <Pressable style={styles.snapButton} onPress={takePicture} />

              <Pressable onPress={handlePickImage} style={{ padding: 10 }}>
                <Feather name="image" size={32} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </CameraView>
      </Modal>

      {Platform.OS === "web" ? (
        <View style={[styles.webNotice, { backgroundColor: `${Colors.light.accent}20` }]}>
          <Feather name="info" size={16} color={Colors.light.accent} />
          <ThemedText style={[styles.webNoticeText, { color: theme.text }]}>
            For best results, use Expo Go on your mobile device to capture photos
          </ThemedText>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.h4,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  instruction: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  gridCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  photoSlot: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionalSlot: {
    borderStyle: "dashed",
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  slotLabel: {
    ...Typography.bodyMedium,
  },
  slotAngle: {
    ...Typography.caption,
  },
  capturedSlot: {
    flex: 1,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  capturedOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  resetButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progress: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  controls: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.medium,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    width: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  analyzeButtonDisabled: {
    backgroundColor: Colors.light.primary,
    opacity: 0.5,
  },
  analyzeButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  webNoticeText: {
    ...Typography.small,
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: "space-between",
    padding: Spacing.xl,
  },
  snapButton: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF",
  },
  secondaryActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  secondaryActionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});