import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { identifyLeftoversAndSuggestRecipe, RecipeResult } from "@/services/gemini";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function RecipeGeneratorScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [recipes, setRecipes] = useState<RecipeResult[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    // If no permission, ask for it
    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText style={{ marginBottom: 20 }}>We need camera access to see your ingredients!</ThemedText>
                <Pressable onPress={requestPermission} style={styles.button}>
                    <ThemedText style={styles.buttonText}>Grant Permission</ThemedText>
                </Pressable>
            </View>
        );
    }

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    skipProcessing: true,
                });

                if (photo?.uri) {
                    processImage(photo.uri);
                }
            } catch (error) {
                Alert.alert("Error", "Failed to take photo.");
            }
        }
    };

    // Pick from gallery
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            processImage(result.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setImageUri(uri);
        setAnalyzing(true);
        setLoading(true);

        try {
            const results = await identifyLeftoversAndSuggestRecipe(uri, user?.dietTypes || []);
            if (results && results.length > 0) {
                setRecipes(results);
            } else {
                Alert.alert("AI Chef", "Simply couldn't find any good recipes for that. Try a clearer photo!");
                setImageUri(null); // Reset to try again
            }
        } catch (e) {
            Alert.alert("Error", "AI Chef is currently offline.");
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    const reset = () => {
        setImageUri(null);
        setRecipes([]);
        setAnalyzing(false);
    };

    if (imageUri && recipes.length > 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
                <View style={styles.header}>
                    <Pressable onPress={reset} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </Pressable>
                    <ThemedText style={styles.headerTitle}>AI Suggested Recipes</ThemedText>
                </View>

                <ScrollView contentContainerStyle={styles.resultsContent}>
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <View style={styles.overlay}>
                            <ThemedText style={styles.overlayText}>Based on your ingredients</ThemedText>
                        </View>
                    </View>

                    {recipes.map((recipe, index) => (
                        <View key={index} style={[styles.recipeCard, { backgroundColor: theme.card }]}>
                            <View style={styles.recipeHeader}>
                                <ThemedText style={styles.recipeName}>{recipe.name}</ThemedText>
                                <View style={styles.timeTag}>
                                    <Feather name="clock" size={14} color={Colors.light.primary} />
                                    <ThemedText style={styles.timeText}>{recipe.time}</ThemedText>
                                </View>
                            </View>

                            <ThemedText style={[styles.recipeDesc, { color: theme.textSecondary }]}>
                                {recipe.description}
                            </ThemedText>

                            <View style={styles.macrosRow}>
                                <View style={styles.macroTag}>
                                    <ThemedText style={styles.macroValue}>{recipe.protein}g</ThemedText>
                                    <ThemedText style={styles.macroLabel}>Protein</ThemedText>
                                </View>
                                <View style={styles.macroTag}>
                                    <ThemedText style={styles.macroValue}>{recipe.calories}</ThemedText>
                                    <ThemedText style={styles.macroLabel}>Kcal</ThemedText>
                                </View>
                                <View style={styles.macroTag}>
                                    <ThemedText style={styles.macroValue}>{recipe.carbs}g</ThemedText>
                                    <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
                                </View>
                                <View style={styles.macroTag}>
                                    <ThemedText style={styles.macroValue}>{recipe.fats}g</ThemedText>
                                    <ThemedText style={styles.macroLabel}>Fats</ThemedText>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <ThemedText style={styles.sectionHeader}>Instructions</ThemedText>
                            {recipe.instructions.map((step, idx) => (
                                <View key={idx} style={styles.instructionRow}>
                                    <ThemedText style={[styles.stepNum, { color: Colors.light.primary }]}>{idx + 1}.</ThemedText>
                                    <ThemedText style={[styles.stepText, { color: theme.text }]}>{step}</ThemedText>
                                </View>
                            ))}
                        </View>
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: "black" }]}>

            {/* Camera View */}
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

            {/* Permission / Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <ThemedText style={styles.analyzingText}>Analyzing Ingredients...</ThemedText>
                </View>
            )}

            {/* UI Overlay */}
            <SafeAreaView style={styles.cameraUi}>
                <View style={styles.cameraHeader}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <Feather name="x" size={24} color="white" />
                    </Pressable>
                    <ThemedText style={styles.cameraTitle}>AI Chef</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.cameraControls}>
                    <Pressable onPress={pickImage} style={styles.galleryButton}>
                        <Feather name="image" size={24} color="white" />
                    </Pressable>

                    <Pressable onPress={handleCapture} style={styles.captureButton}>
                        <View style={styles.captureInner} />
                    </Pressable>

                    <View style={{ width: 40 }} />
                </View>

                <ThemedText style={styles.hintText}>Snap a photo of your fridge or leftovers!</ThemedText>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    button: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
    // Camera UI
    cameraUi: {
        flex: 1,
        justifyContent: "space-between",
    },
    cameraHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    cameraTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowRadius: 3,
    },
    cameraControls: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: 40,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: "white",
        justifyContent: "center",
        alignItems: "center",
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "white",
    },
    galleryButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    hintText: {
        position: 'absolute',
        bottom: 130,
        alignSelf: 'center',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
        fontSize: 12,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    analyzingText: {
        color: "white",
        marginTop: 16,
        fontSize: 16,
        fontWeight: "600",
    },

    // Results UI
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        ...Typography.h4,
    },
    resultsContent: {
        padding: Spacing.lg,
    },
    previewContainer: {
        height: 200,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: Spacing.md,
    },
    overlayText: {
        color: 'white',
        ...Typography.bodyMedium,
    },
    recipeCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.soft,
    },
    recipeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    recipeName: {
        ...Typography.h4,
        flex: 1,
        marginRight: Spacing.md,
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    timeText: {
        ...Typography.caption,
        color: Colors.light.primary,
        fontWeight: '600',
    },
    recipeDesc: {
        ...Typography.body,
        marginBottom: Spacing.md,
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.lg,
    },
    macroTag: {
        alignItems: 'center',
    },
    macroValue: {
        ...Typography.bodyMedium,
        fontWeight: '700',
    },
    macroLabel: {
        ...Typography.caption,
        fontSize: 10,
        opacity: 0.7,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        ...Typography.h4,
        marginBottom: Spacing.md,
    },
    instructionRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    stepNum: {
        fontWeight: 'bold',
        marginRight: 8,
        width: 20,
    },
    stepText: {
        flex: 1,
        ...Typography.body,
        lineHeight: 20,
    },
});
