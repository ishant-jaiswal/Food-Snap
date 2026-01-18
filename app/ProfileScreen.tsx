import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useTheme } from "@/hooks/useTheme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { fetchUserReels } from "@/services/reelsService";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ProgressBarProps {
  value: number;
  maxValue: number;
  color: string;
  label: string;
}

function ProgressBar({ value, maxValue, color, label }: ProgressBarProps) {
  const { theme } = useTheme();
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarHeader}>
        <ThemedText style={styles.progressLabel}>{label}</ThemedText>
        <ThemedText style={[styles.progressValue, { color }]}>{value}/{maxValue}</ThemedText>
      </View>
      <View style={[styles.progressBarTrack, { backgroundColor: theme.backgroundSecondary }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentage}%`, backgroundColor: color }
          ]}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const today = new Date().toISOString().split("T")[0];
  const { totals } = useFoodLog(today);
  const [water, setWater] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(`water_${today}`).then(val => {
      if (val) setWater(parseInt(val));
    });
  }, [today]);

  const [myReels, setMyReels] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id && isFocused) {
      loadMyReels();
    }
  }, [user?.id, isFocused]);

  const loadMyReels = async () => {
    if (user?.id) {
      const reels = await fetchUserReels(user.id);
      setMyReels(reels);
    }
  };

  const socialStats = [
    {
      label: "Followers",
      value: (user?.followersCount || user?.followers?.length || 0).toString(),
      type: 'followers'
    },
    {
      label: "Following",
      value: (user?.followingCount || user?.following?.length || 0).toString(),
      type: 'following'
    },
    { label: "Reels", value: myReels.length.toString() },
  ];

  const activityStats = [
    { label: "Meals Logged", value: (user?.totalMealsLogged || 0).toString() },
    { label: "Day Streak", value: (user?.waterStreak || 0).toString() },
  ];

  const healthData = {
    calories: {
      current: totals.calories,
      goal: user?.calorieTarget || 2000,
      color: Colors.light.orange
    },
    protein: {
      current: totals.protein,
      goal: user?.proteinTarget || 150,
      color: Colors.light.primary
    },
    water: {
      current: water,
      goal: user?.waterTarget || 8,
      color: Colors.light.secondary
    },
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderStatCard = (stat: any, index: number) => (
    <Pressable
      key={stat.label}
      onPress={() => {
        if (stat.type === 'followers' || stat.type === 'following') {
          navigation.navigate("UserList", {
            title: stat.label,
            userIds: stat.type === 'followers' ? (user?.followers || []) : (user?.following || [])
          });
        }
      }}
      style={[
        styles.statCard,
        { backgroundColor: theme.card, shadowColor: 'transparent', borderWidth: 0, elevation: 2 } // Removed border, added elevation/shadow for better look
      ]}
    >
      <ThemedText style={[styles.statValue, { color: Colors.light.primary, fontSize: 20 }]}>
        {stat.value}
      </ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary, fontSize: 12 }]}>
        {stat.label}
      </ThemedText>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.lg,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: Spacing.xs }}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.title}>Profile</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Feather name="edit-2" size={20} color={theme.text} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { backgroundColor: theme.card }]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={20} color={Colors.light.error} />
            </Pressable>
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.avatarLarge, { borderColor: Colors.light.primary, overflow: 'hidden' }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Feather name="user" size={32} color={Colors.light.primary} />
            )}
          </View>
          <ThemedText style={styles.userName}>{user?.fullName || "User"}</ThemedText>
          <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>
            {user?.email || "user@example.com"}
          </ThemedText>
        </View>

        {/* Social Stats Row */}
        <View style={styles.statsRow}>
          {socialStats.map(renderStatCard)}
        </View>

        {/* Activity Stats Row */}
        <View style={[styles.statsRow, { marginTop: -Spacing.md }]}>
          {/* Using marginTop negative to pull them closer or just relying on existing spacing if sufficient. 
                 Actually, let's keep them distinct. separate row. */}
          {activityStats.map(renderStatCard)}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Health Overview</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Today</ThemedText>
          </View>
          <ProgressBar
            value={healthData.calories.current}
            maxValue={healthData.calories.goal}
            color={healthData.calories.color}
            label="Calories"
          />
          <ProgressBar
            value={healthData.protein.current}
            maxValue={healthData.protein.goal}
            color={healthData.protein.color}
            label="Protein (g)"
          />
          <ProgressBar
            value={healthData.water.current}
            maxValue={healthData.water.goal}
            color={healthData.water.color}
            label="Water (glasses)"
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>My Diet Reels</ThemedText>
            <Pressable onPress={() => navigation.navigate("CreateReel")}>
              <ThemedText style={[styles.cardAction, { color: Colors.light.primary }]}>
                Create New
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.reelGrid}>
            {myReels.map((reel) => (
              <Pressable
                key={reel.id}
                style={[styles.reelThumbnail, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => navigation.navigate("MyReels")}
              >
                {/* To show thumbnail, we'd need a third-party library or generate it on upload. 
                    For now, showing a placeholder or checks if we have a thumbnail URL eventually. */}
                <View style={styles.reelOverlay}>
                  <Feather name="play" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.reelViews}>
                  <Feather name="heart" size={12} color="#FFFFFF" />
                  <ThemedText style={styles.viewsText}>
                    {reel.likesCount || 0}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
            {myReels.length === 0 && (
              <View style={{ padding: 20, width: '100%', alignItems: 'center' }}>
                <ThemedText style={{ color: theme.textSecondary }}>No reels yet</ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.cardTitle}>Settings</ThemedText>

          <Pressable
            style={styles.settingItem}
            onPress={() => navigation.navigate("GoalPreference")}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${Colors.light.primary}20` }]}>
              <Feather name="target" size={20} color={Colors.light.primary} />
            </View>
            <ThemedText style={styles.settingLabel}>Goals & Preferences</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.settingItem}
            onPress={() => navigation.navigate("Notifications")}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${Colors.light.secondary}20` }]}>
              <Feather name="bell" size={20} color={Colors.light.secondary} />
            </View>
            <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.settingItem}
            onPress={() => navigation.navigate("PrivacySecurity")}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${Colors.light.accent}20` }]}>
              <Feather name="shield" size={20} color={Colors.light.accent} />
            </View>
            <ThemedText style={styles.settingLabel}>Privacy & Security</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.soft,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: Spacing.md,
  },
  userName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statValue: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: "center",
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h4,
  },
  cardSubtitle: {
    ...Typography.small,
  },
  cardAction: {
    ...Typography.smallMedium,
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
  },
  progressBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.small,
  },
  progressValue: {
    ...Typography.smallMedium,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  reelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  reelThumbnail: {
    width: "32.5%",
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  reelOverlay: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  reelViews: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewsText: {
    color: "#FFFFFF",
    ...Typography.caption,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    flex: 1,
  },
});
