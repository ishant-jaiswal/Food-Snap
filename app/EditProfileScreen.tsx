import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { calculateBMR, calculateMacros, calculateTDEE } from "@/utils/nutrition";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const genderOptions = ["Male", "Female", "Other"];
const activityLevels = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];

export default function EditProfileScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [age, setAge] = useState(String(user?.age || ""));
  const [gender, setGender] = useState(user?.gender || "Male");
  const [height, setHeight] = useState(String(user?.height || ""));
  const [weight, setWeight] = useState(String(user?.weight || ""));
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || "Moderate");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(user?.avatar || null);

  // Nutrition State
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>((user?.goal as any) || 'maintain');
  const [calorieTarget, setCalorieTarget] = useState(String(user?.calorieTarget || "2000"));
  const [proteinTarget, setProteinTarget] = useState(String(user?.proteinTarget || "150"));
  const [carbTarget, setCarbTarget] = useState(String(user?.carbTarget || "250"));
  const [fatTarget, setFatTarget] = useState(String(user?.fatTarget || "65"));
  const [waterTarget, setWaterTarget] = useState(String(user?.waterTarget || "8"));

  const handleRecommend = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (!w || !h || !a) return;

    const bmr = calculateBMR(w, h, a, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const macros = calculateMacros(tdee, w, goal);

    setCalorieTarget(String(macros.calories));
    setProteinTarget(String(macros.protein));
    setCarbTarget(String(macros.carbs));
    setFatTarget(String(macros.fats));
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    await updateUser({
      fullName,
      age: parseInt(age) || 0,
      gender,
      height: parseInt(height) || 0,
      weight: parseInt(weight) || 0,
      activityLevel,
      goal,
      calorieTarget: parseInt(calorieTarget),
      proteinTarget: parseInt(proteinTarget),
      carbTarget: parseInt(carbTarget),
      fatTarget: parseInt(fatTarget),
      waterTarget: parseInt(waterTarget),
      // In a real app, you would upload the image here and get a URL
      // For now we'll just log it or pass it if the backend supports it directly
      avatar: selectedImage || undefined,
    });
    navigation.goBack();
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.card,
      borderColor: theme.border,
      color: theme.text,
    }
  ];


  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg + 80,
          paddingBottom: 120,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickImage}>
            <View style={[styles.avatar, { borderColor: Colors.light.primary, overflow: 'hidden' }]}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Feather name="user" size={32} color={Colors.light.primary} />
              )}
            </View>
          </Pressable>
          <Pressable style={styles.changePhotoButton} onPress={handlePickImage}>
            <ThemedText style={[styles.changePhotoText, { color: Colors.light.primary }]}>
              Change Photo
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={inputStyle}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Age</ThemedText>
            <TextInput
              style={inputStyle}
              value={age}
              onChangeText={setAge}
              placeholder="Age"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Gender</ThemedText>
            <Pressable
              style={[inputStyle, styles.picker]}
              onPress={() => setShowGenderPicker(!showGenderPicker)}
            >
              <ThemedText style={styles.pickerText}>{gender}</ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {showGenderPicker ? (
          <View style={[styles.pickerOptions, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {genderOptions.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.pickerOption,
                  gender === option && { backgroundColor: `${Colors.light.primary}15` }
                ]}
                onPress={() => {
                  setGender(option);
                  setShowGenderPicker(false);
                }}
              >
                <ThemedText style={[
                  styles.pickerOptionText,
                  gender === option && { color: Colors.light.primary }
                ]}>
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Height (cm)</ThemedText>
            <TextInput
              style={inputStyle}
              value={height}
              onChangeText={setHeight}
              placeholder="Height"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Weight (kg)</ThemedText>
            <TextInput
              style={inputStyle}
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Activity Level</ThemedText>
          <Pressable
            style={[inputStyle, styles.picker]}
            onPress={() => setShowActivityPicker(!showActivityPicker)}
          >
            <ThemedText style={styles.pickerText}>{activityLevel}</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {showActivityPicker ? (
          <View style={[styles.pickerOptions, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {activityLevels.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.pickerOption,
                  activityLevel === option && { backgroundColor: `${Colors.light.primary}15` }
                ]}
                onPress={() => {
                  setActivityLevel(option);
                  setShowActivityPicker(false);
                }}
              >
                <ThemedText style={[
                  styles.pickerOptionText,
                  activityLevel === option && { color: Colors.light.primary }
                ]}>
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}


        <View style={styles.divider} />

        <ThemedText style={styles.sectionHeader}>Nutrition Goals</ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Goal</ThemedText>
          <View style={styles.goalSelector}>
            {(['lose', 'maintain', 'gain'] as const).map((g) => (
              <Pressable
                key={g}
                style={[
                  styles.goalOption,
                  goal === g && { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }
                ]}
                onPress={() => setGoal(g)}
              >
                <ThemedText style={[
                  styles.goalText,
                  goal === g && { color: '#FFF' }
                ]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.recommendButton} onPress={handleRecommend}>
          <Feather name="zap" size={16} color="#FFF" />
          <ThemedText style={styles.recommendButtonText}>Calculate Recommendations</ThemedText>
        </Pressable>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Calories</ThemedText>
            <TextInput
              style={inputStyle}
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Protein (g)</ThemedText>
            <TextInput
              style={inputStyle}
              value={proteinTarget}
              onChangeText={setProteinTarget}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Carbs (g)</ThemedText>
            <TextInput
              style={inputStyle}
              value={carbTarget}
              onChangeText={setCarbTarget}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Fat (g)</ThemedText>
            <TextInput
              style={inputStyle}
              value={fatTarget}
              onChangeText={setFatTarget}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Water Goal (Glasses)</ThemedText>
          <TextInput
            style={inputStyle}
            value={waterTarget}
            onChangeText={setWaterTarget}
            keyboardType="numeric"
            placeholder="e.g. 8"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={{ height: 20 }} />

      </KeyboardAwareScrollViewCompat>

      <View style={[styles.bottomBar, {
        backgroundColor: theme.backgroundRoot,
        paddingBottom: Math.max(insets.bottom, Spacing.md)
      }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  changePhotoButton: {
    paddingVertical: Spacing.xs,
  },
  changePhotoText: {
    ...Typography.bodyMedium,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.smallMedium,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    ...Typography.body,
  },
  pickerOptions: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  pickerOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  pickerOptionText: {
    ...Typography.body,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  saveButton: {
    height: Spacing.buttonHeight,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.soft,
  },
  saveButtonText: {
    ...Typography.button,
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.xl,
  },
  sectionHeader: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  goalSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goalOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  goalText: {
    ...Typography.captionMedium,
    fontWeight: '600',
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  recommendButtonText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 14,
  },
});
