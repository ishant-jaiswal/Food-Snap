import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { saveMealTemplate } from "@/services/foodService";
import { analyzeFoodImage } from "@/services/gemini";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CircularValueProps {
    label: string;
    value: string;
    unit: string;
    color: string;
}

function CircularValue({ label, value, unit, color }: CircularValueProps) {
    return (
        <View style={styles.circularContainer}>
            <View style={[styles.circle, { borderColor: color }]}>
                <ThemedText style={{ ...Typography.h3, color: '#FFF', fontWeight: 'bold' }}>{value || '0'}</ThemedText>
                <ThemedText style={{ ...Typography.caption, color: '#DDD' }}>{unit}</ThemedText>
            </View>
            <ThemedText style={{ ...Typography.caption, color: '#DDD', marginTop: 4 }}>{label}</ThemedText>
        </View>
    );
}

export default function CreateMealScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const router = useRouter();
    const params = useLocalSearchParams();

    const [mealName, setMealName] = useState("");
    const [cals, setCals] = useState("0");
    const [carbs, setCarbs] = useState("0");
    const [fat, setFat] = useState("0");
    const [protein, setProtein] = useState("0");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleBack = () => navigation.goBack();

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }

            // Offer choice between camera and library? For now defaults to library for emulator stability, user said "add photo"
            // Let's use an alert to choose
            Alert.alert("Add Photo", "Choose a source", [
                {
                    text: "Camera",
                    onPress: async () => {
                        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                        if (cameraStatus !== 'granted') {
                            Alert.alert('Permission needed', 'Camera permission is required.');
                            return;
                        }
                        let result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.5,
                        });
                        handleImageResult(result);
                    }
                },
                {
                    text: "Library",
                    onPress: async () => {
                        let result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.5,
                        });
                        handleImageResult(result);
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]);

        } catch (error) {
            console.error("Error picking image:", error);
        }
    };

    const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
        if (!result.canceled && result.assets[0].uri) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            analyzeImage(uri);
        }
    };

    const analyzeImage = async (uri: string) => {
        setIsLoading(true);
        try {
            const analysis = await analyzeFoodImage(uri);
            if (analysis) {
                setMealName(analysis.name || "Identified Meal");
                setCals(analysis.calories?.toString() || "0");
                setProtein(analysis.protein?.toString() || "0");
                setCarbs(analysis.carbs?.toString() || "0");
                setFat(analysis.fats?.toString() || "0");
                Alert.alert("Analysis Complete", "Nutrition info has been auto-filled!");
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            Alert.alert("Error", "Could not analyze the image. Please enter details manually.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!mealName.trim()) {
            Alert.alert("Missing Info", "Please enter a meal name.");
            return;
        }

        setIsLoading(true);
        try {
            await saveMealTemplate(user.id, {
                name: mealName,
                calories: Number(cals),
                protein: Number(protein),
                carbs: Number(carbs),
                fats: Number(fat),
                image_url: imageUri || null,
                items: [] // Could be populated if we identified breakdown
            });
            Alert.alert("Success", "Meal saved to My Meals!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("Save failed:", error);
            Alert.alert("Error", "Failed to save meal.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
            {/* Header / Image Area */}
            <View style={styles.headerImageContainer}>
                <ImageBackground
                    source={imageUri ? { uri: imageUri } : { uri: 'https://img.freepik.com/free-vector/blue-curve-background_53876-113112.jpg' }}
                    style={styles.headerBg}
                    resizeMode="cover"
                >
                    <SafeAreaView>
                        <View style={styles.navBar}>
                            <Pressable onPress={handleBack} style={styles.backButton}>
                                <Feather name="arrow-left" size={24} color="#FFF" />
                            </Pressable>
                            <ThemedText style={{ ...Typography.h4, color: '#FFF' }}>Create a Meal</ThemedText>
                            <Pressable style={styles.checkButton} onPress={handleSave}>
                                {isLoading ? <ActivityIndicator color="#FFF" /> : <Feather name="check" size={24} color="#FFF" />}
                            </Pressable>
                        </View>

                        <View style={styles.photoContainer}>
                            <Pressable style={styles.addPhotoCircle} onPress={pickImage}>
                                <Feather name={imageUri ? "edit-2" : "camera"} size={32} color="#FFF" />
                                <ThemedText style={styles.addPhotoText}>{imageUri ? "Change Photo" : "Add Photo"}</ThemedText>
                            </Pressable>
                        </View>
                    </SafeAreaView>
                    {/* Overlay for better text readability if image exists */}
                    {imageUri && <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: -1 }} />}
                </ImageBackground>
            </View>

            {/* Content Area */}
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Blue Banner */}
                <View style={styles.blueBanner}>
                    <ThemedText style={styles.brandText}>FoodSnap Diary</ThemedText>
                </View>

                <View style={styles.formContainer}>
                    <ThemedText style={styles.label}>Meal Name</ThemedText>
                    <TextInput
                        style={[styles.input, { borderBottomColor: Colors.light.primary }]}
                        value={mealName}
                        onChangeText={setMealName}
                        placeholder="e.g. Healthy Chicken Salad"
                        placeholderTextColor="#666"
                    />

                    {/* Circular Stats */}
                    <View style={styles.statsRow}>
                        <CircularValue label="Cal" value={cals} unit="kCal" color={Colors.light.orange} />
                        <CircularValue label="Carbs" value={carbs} unit="g" color={Colors.light.secondary} />
                        <CircularValue label="Fat" value={fat} unit="g" color={Colors.light.accent} />
                        <CircularValue label="Protein" value={protein} unit="g" color={Colors.light.primary} />
                    </View>

                    {/* Goal Info (Mock) */}
                    <View style={styles.goalInfoContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <ThemedText style={{ color: '#FFF' }}>Nutritional Breakdown</ThemedText>
                        </View>
                        <View style={{ gap: 12 }}>
                            <View style={styles.macroInputRow}>
                                <ThemedText style={{ color: '#DDD', width: 60 }}>Calories</ThemedText>
                                <TextInput
                                    style={styles.macroInput}
                                    value={cals}
                                    onChangeText={setCals}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                            <View style={styles.macroInputRow}>
                                <ThemedText style={{ color: '#DDD', width: 60 }}>Protein</ThemedText>
                                <TextInput
                                    style={styles.macroInput}
                                    value={protein}
                                    onChangeText={setProtein}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                            <View style={styles.macroInputRow}>
                                <ThemedText style={{ color: '#DDD', width: 60 }}>Carbs</ThemedText>
                                <TextInput
                                    style={styles.macroInput}
                                    value={carbs}
                                    onChangeText={setCarbs}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                            <View style={styles.macroInputRow}>
                                <ThemedText style={{ color: '#DDD', width: 60 }}>Fat</ThemedText>
                                <TextInput
                                    style={styles.macroInput}
                                    value={fat}
                                    onChangeText={setFat}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#555"
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    headerImageContainer: {
        height: 250,
        backgroundColor: '#007AFF',
    },
    headerBg: {
        width: '100%',
        height: '100%',
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20
    },
    checkButton: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20
    },
    photoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    addPhotoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    addPhotoText: {
        color: '#FFF',
        marginTop: 6,
        fontSize: 12,
        fontWeight: '600'
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#111',
    },
    blueBanner: {
        backgroundColor: '#0056b3',
        paddingVertical: 12,
        alignItems: 'center',
    },
    brandText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    formContainer: {
        padding: Spacing.lg,
    },
    label: {
        color: '#007AFF',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        borderBottomWidth: 2,
        color: '#FFF',
        fontSize: 20,
        paddingBottom: 8,
        marginBottom: 24,
        fontWeight: 'bold'
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingHorizontal: Spacing.sm,
    },
    circularContainer: {
        alignItems: 'center',
    },
    circle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalInfoContainer: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 20,
    },
    macroInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingVertical: 8
    },
    macroInput: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'right',
        flex: 1,
        padding: 4
    }
});
