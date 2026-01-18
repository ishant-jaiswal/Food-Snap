import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { logFoodItem } from "@/services/foodService";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddFoodScreen() {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const { user } = useAuth();
    const params = useLocalSearchParams();

    const mealType = (params.mealType as "Breakfast" | "Lunch" | "Dinner" | "Snack") || "Snack";
    const dateStr = (params.date as string) || new Date().toISOString().split("T")[0];
    const initialName = (params.initialName as string) || "";
    const initialCalories = (params.initialCalories as string) || "";
    const initialProtein = (params.initialProtein as string) || "";
    const initialCarbs = (params.initialCarbs as string) || "";
    const initialFats = (params.initialFats as string) || "";

    const [name, setName] = useState(initialName);
    const [calories, setCalories] = useState(initialCalories);
    const [protein, setProtein] = useState(initialProtein);
    const [carbs, setCarbs] = useState(initialCarbs);
    const [fats, setFats] = useState(initialFats);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !calories) {
            Alert.alert("Missing Info", "Please enter at least a name and calorie amount.");
            return;
        }
        if (!user) return;

        setLoading(true);
        try {
            await logFoodItem(user.id, {
                name,
                calories: Number(calories),
                protein: Number(protein) || 0,
                carbs: Number(carbs) || 0,
                fats: Number(fats) || 0,
                mealType,
                dateStr
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to save food.");
        } finally {
            setLoading(false);
        }
    };

    const handleScan = () => {
        // Navigate to scanner, passing mealType to log correctly
        // router.push not working well with params sometimes? ensure ScanFoodScreen handles params
        // @ts-ignore
        navigation.navigate("ScanFoodScreen", { mealType, date: dateStr });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Add to {mealType}</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <Pressable
                        style={[styles.scanButton, { backgroundColor: theme.card, borderColor: Colors.light.primary }]}
                        onPress={handleScan}
                    >
                        <Feather name="maximize" size={24} color={Colors.light.primary} />
                        <View style={styles.scanTextContainer}>
                            <ThemedText style={[styles.scanTitle, { color: Colors.light.primary }]}>Scan Barcode</ThemedText>
                            <ThemedText style={[styles.scanSubtitle, { color: theme.textSecondary }]}>Quickly add food by scanning</ThemedText>
                        </View>
                        <Feather name="chevron-right" size={24} color={Colors.light.primary} />
                    </Pressable>

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Manual Entry</ThemedText>

                    <View style={[styles.formCard, { backgroundColor: theme.card }]}>
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Food Name</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g., Banana"
                                placeholderTextColor={theme.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <ThemedText style={styles.label}>Calories</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={calories}
                                    onChangeText={setCalories}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.label, { color: Colors.light.primary }]}>Protein (g)</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={protein}
                                    onChangeText={setProtein}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.label, { color: Colors.light.secondary }]}>Carbs (g)</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={carbs}
                                    onChangeText={setCarbs}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.label, { color: Colors.light.accent }]}>Fat (g)</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="numeric"
                                    value={fats}
                                    onChangeText={setFats}
                                />
                            </View>
                        </View>

                    </View>

                </ScrollView>

                <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <Pressable
                        style={[styles.saveButton, { backgroundColor: Colors.light.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.saveButtonText}>Save Food</ThemedText>}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
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
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        ...Typography.h4,
    },
    content: {
        padding: Spacing.lg,
    },
    scanButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        borderStyle: 'dashed',
    },
    scanTextContainer: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    scanTitle: {
        ...Typography.bodyMedium,
        fontWeight: "700",
    },
    scanSubtitle: {
        ...Typography.caption,
    },
    sectionTitle: {
        ...Typography.smallMedium,
        marginBottom: Spacing.sm,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    formCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadows.soft,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        ...Typography.caption,
        marginBottom: Spacing.xs,
        fontWeight: "600",
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        ...Typography.body,
    },
    row: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 56,
        borderRadius: BorderRadius.full,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.medium,
    },
    saveButtonText: {
        ...Typography.button,
        color: "#FFFFFF",
    },
});
