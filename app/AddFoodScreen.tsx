import { Feather } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { getMyMeals, logFoodItem } from "@/services/foodService";
import { analyzeFoodAudio, FoodAnalysisResult, getFoodSuggestions, searchFoodByName } from "@/services/gemini";

export default function AddFoodScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const router = useRouter();
    const params = useLocalSearchParams();

    const mealType = (params.mealType as string) || "Snack";
    const dateStr = (params.date as string) || new Date().toISOString().split("T")[0];

    // State
    const [searchText, setSearchText] = useState("");
    const [isSearchSubmitted, setIsSearchSubmitted] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("All");

    // My Meals State
    const [myMeals, setMyMeals] = useState<any[]>([]);

    // Fetch My Meals when tab changes
    React.useEffect(() => {
        if (activeTab === "My Meals" && user) {
            loadMyMeals();
        }
    }, [activeTab, user]);

    const loadMyMeals = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const meals = await getMyMeals(user.id);
            setMyMeals(meals);
        } catch (error) {
            console.error("Failed to load meals", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogMeal = async (meal: any) => {
        if (!user) return;
        try {
            await logFoodItem(user.id, {
                name: meal.name,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                image_url: meal.image_url || null,
                barcode: null,
                mealType: mealType as any,
                dateStr
            });
            Alert.alert("Success", `Logged ${meal.name} to ${mealType}!`, [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to log meal.");
        }
    };

    // ... inside renderMyMealsTab
    const renderMyMealsTab = () => {
        return (
            <View style={styles.myMealsContainer}>
                <View style={styles.mealActionsRow}>
                    <Pressable
                        style={[styles.mealActionBtn, { borderColor: Colors.light.primary, backgroundColor: theme.card }]}
                        onPress={handleCreateMeal}
                    >
                        <Feather name="layers" size={28} color={Colors.light.primary} />
                        <ThemedText style={[styles.mealActionText, { color: Colors.light.primary }]}>Create a Meal</ThemedText>
                    </Pressable>
                    <Pressable
                        style={[styles.mealActionBtn, { borderColor: theme.textSecondary, backgroundColor: theme.card }]}
                        onPress={() => { }} // Already on the list view
                    >
                        <Feather name="calendar" size={28} color={theme.textSecondary} />
                        <View style={{ position: 'absolute', bottom: 35, right: 35 }}><Feather name="plus-circle" size={14} color={theme.textSecondary} /></View>
                        <ThemedText style={[styles.mealActionText, { color: theme.textSecondary }]}>Copy Previous{'\n'}Meal</ThemedText>
                    </Pressable>
                </View>

                <ThemedText style={styles.sectionTitle}>Your Saved Meals</ThemedText>

                {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : myMeals.length === 0 ? (
                    /* Illustration/Empty State */
                    <View style={styles.emptyStateContainer}>
                        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                            <Image
                                source={{ uri: "https://img.icons8.com/color/96/sushi.png" }}
                                style={{ width: 80, height: 80 }}
                            />
                        </View>
                        <ThemedText style={styles.emptyStateTitle}>Log Your Go-To Meals Faster.</ThemedText>
                        <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                            Create and save your favorite meals to log quickly again and again.
                        </ThemedText>
                    </View>
                ) : (
                    <View>
                        {myMeals.map((meal) => (
                            <Pressable
                                key={meal.id}
                                style={[styles.searchResultItem, { backgroundColor: theme.card }]}
                                onPress={() => handleLogMeal(meal)}
                            >
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={styles.foodName}>{meal.name}</ThemedText>
                                    <ThemedText style={[styles.foodDetail, { color: theme.textSecondary }]}>
                                        {meal.calories} cal | P: {meal.protein}g C: {meal.carbs}g F: {meal.fats}g
                                    </ThemedText>
                                </View>
                                <View style={[styles.addButton, { borderColor: Colors.light.primary }]}>
                                    <Feather name="plus" size={20} color={Colors.light.primary} />
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // Debounced Search Effect
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchText.trim().length > 1 && !isSearchSubmitted) {
                const suggs = await getFoodSuggestions(searchText);
                setSuggestions(suggs);
            } else if (searchText.trim().length <= 1) {
                setSuggestions([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchText, isSearchSubmitted]);


    // Voice State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    const tabs = ["All", "My Meals", "My Recipes", "My Foods"];

    const handleBack = () => navigation.goBack();

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                const { status } = await requestPermission();
                if (status !== 'granted') {
                    alert('Permission to access microphone is required!');
                    return;
                }
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        setIsSearchSubmitted(true); // Ensure loading view is shown
        setIsLoading(true); // Show loading while processing
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
            try {
                // Determine file type from URI extension if needed, but Gemini handles mimeType
                const results = await analyzeFoodAudio(uri);
                processResults(results);
            } catch (error) {
                console.error("Audio processing failed", error);
                alert("Failed to process audio. Please try again.");
                setIsLoading(false);
            }
        }
    };

    const handleVoiceLog = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const processResults = (results: FoodAnalysisResult[]) => {
        // Transform incoming data to match UI requirements and avoid unique key errors
        const formattedResults = results.map((item, index) => ({
            id: `gemini-${Date.now()}-${index}`,
            name: item.name || "Unknown Food",
            detail: `${item.calories} cal, ${item.servingSize || '1 serving'}`,
            verified: true,
            raw: {
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbs: item.carbs || 0,
                fats: item.fats || 0
            }
        }));

        setIsLoading(false);
        setIsSearchSubmitted(true);
        setSearchResults(formattedResults);
    };

    const handleSaveAll = async () => {
        if (!user || searchResults.length === 0) return;

        setIsLoading(true);
        try {
            const promises = searchResults.map(item => {
                return logFoodItem(user.id, {
                    name: item.name,
                    calories: Number(item.raw.calories),
                    protein: Number(item.raw.protein),
                    carbs: Number(item.raw.carbs),
                    fats: Number(item.raw.fats),
                    image_url: null,
                    barcode: null,
                    mealType: mealType as any,
                    dateStr
                });
            });

            await Promise.all(promises);
            Alert.alert("Success", "All items saved successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save some items.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = () => {
        router.push({
            pathname: "/ScanFoodScreen",
            params: { mealType, date: dateStr }
        });
    };
    const handleManualEntry = () => {
        router.push({
            pathname: "/ManualFoodEntryScreen",
            params: { mealType, date: dateStr }
        });
    };
    const handleCreateMeal = () => {
        router.push({
            pathname: "/CreateMealScreen",
            params: { mealType, date: dateStr }
        });
    };

    // Search Handlers
    const handleSubmitSearch = async () => {
        if (searchText.trim().length > 0) {
            setIsSearchSubmitted(true);
            setIsLoading(true);
            Keyboard.dismiss();

            try {
                // Call Gemini API
                const results = await searchFoodByName(searchText);
                processResults(results);
            } catch (error) {
                console.error("Search failed", error);
                setSearchResults([]);
                setIsLoading(false);
            }
        }
    };

    const handleClearSearch = () => {
        setSearchText("");
        setIsSearchSubmitted(false);
        setSearchResults([]);
    };

    // Quick Save Handler
    const handleQuickSave = async (item: any) => {
        if (!user) return;

        try {
            await logFoodItem(user.id, {
                name: item.name,
                calories: Number(item.raw.calories),
                protein: Number(item.raw.protein),
                carbs: Number(item.raw.carbs),
                fats: Number(item.raw.fats),
                image_url: null,
                barcode: null,
                mealType: mealType as any,
                dateStr
            });
            Alert.alert("Success", `${item.name} added to ${mealType}!`);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save food.");
        }
    };

    // Render "All" Tab Content
    const renderAllTab = () => {
        // State 1: Search Submitted (Show Results)
        if (isSearchSubmitted) {
            return (
                <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                        <ThemedText style={styles.sectionTitle}>Search Results</ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Feather name="shield" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                            <ThemedText style={{ ...Typography.caption, color: theme.textSecondary }}>AI Verified</ThemedText>
                        </View>
                    </View>

                    {searchResults.length > 0 && (
                        <Pressable
                            style={{
                                backgroundColor: Colors.light.primary,
                                padding: 12,
                                borderRadius: BorderRadius.md,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: Spacing.md
                            }}
                            onPress={handleSaveAll}
                        >
                            <Feather name="save" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Save All Items ({searchResults.length})</ThemedText>
                        </Pressable>
                    )}

                    {isLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={Colors.light.primary} />
                            <ThemedText style={{ marginTop: 16, color: theme.textSecondary }}>Searching...</ThemedText>
                        </View>
                    ) : searchResults.length === 0 ? (
                        <ThemedText style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>No results found for "{searchText}"</ThemedText>
                    ) : (
                        searchResults.map((item) => (
                            <Pressable
                                key={item.id}
                                style={[styles.searchResultItem, { backgroundColor: theme.card, flexDirection: 'column', alignItems: 'flex-start' }]}
                                onPress={() => {
                                    router.push({
                                        pathname: "/ManualFoodEntryScreen",
                                        params: {
                                            mealType, date: dateStr,
                                            initialName: item.name,
                                            initialCalories: item.raw.calories.toString(),
                                            initialProtein: item.raw.protein.toString(),
                                            initialCarbs: item.raw.carbs.toString(),
                                            initialFats: item.raw.fats.toString()
                                        }
                                    });
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <ThemedText style={styles.foodName}>{item.name}</ThemedText>
                                            {item.verified && <Feather name="check-circle" size={14} color={Colors.light.success} />}
                                        </View>
                                        <ThemedText style={[styles.foodDetail, { color: theme.textSecondary }]}>{item.detail}</ThemedText>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        {/* Quick Save Button */}
                                        <Pressable
                                            style={[styles.addButton, { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary }]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleQuickSave(item);
                                            }}
                                        >
                                            <Feather name="check" size={20} color="#FFF" />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Macros Row */}
                                <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
                                    <View style={{ backgroundColor: theme.card, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Protein</ThemedText>
                                        <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>{item.raw?.protein || 0}g</ThemedText>
                                    </View>
                                    <View style={{ backgroundColor: theme.card, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Carbs</ThemedText>
                                        <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>{item.raw?.carbs || 0}g</ThemedText>
                                    </View>
                                    <View style={{ backgroundColor: theme.card, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Fats</ThemedText>
                                        <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>{item.raw?.fats || 0}g</ThemedText>
                                    </View>
                                    <View style={{ backgroundColor: theme.card, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                                        <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>Cal</ThemedText>
                                        <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>{item.raw?.calories || 0}</ThemedText>
                                    </View>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            );
        }

        // State 2: Typing but not submitted (Show Suggestions)
        if (searchText.length > 0) {
            return (
                <View>
                    <ThemedText style={styles.sectionTitle}>Suggestions</ThemedText>

                    {/* Default API Search item */}
                    <Pressable
                        style={styles.searchAllRow}
                        onPress={handleSubmitSearch}
                    >
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md }}>
                            <Feather name="search" size={16} color="#FFF" />
                        </View>
                        <ThemedText style={{ ...Typography.bodyMedium, color: Colors.light.primary, fontWeight: 'bold' }}>
                            Search for "{searchText}"
                        </ThemedText>
                    </Pressable>

                    {/* Auto-Suggestions */}
                    {suggestions.map((suggestion, idx) => (
                        <Pressable
                            key={idx}
                            style={styles.suggestionRow}
                            onPress={() => {
                                setSearchText(suggestion);
                                handleSubmitSearch(); // Trigger search immediately on tap
                            }}
                        >
                            <Feather name="search" size={16} color={theme.textSecondary} style={{ marginRight: 12 }} />
                            <ThemedText style={{ ...Typography.bodyMedium }}>{suggestion}</ThemedText>
                        </Pressable>
                    ))}
                </View>
            );
        }

        // State 3: Default (Quick Actions + Recent History)
        return (
            <View>
                <View style={styles.quickActions}>
                    <Pressable
                        style={[
                            styles.actionCard,
                            { backgroundColor: isRecording ? Colors.light.secondary : theme.card }
                        ]}
                        onPress={handleVoiceLog}
                    >
                        {isRecording ? (
                            <View style={styles.recordingContainer}>
                                <ActivityIndicator size="small" color="#FFF" />
                                <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Listening...</ThemedText>
                                <ThemedText style={{ color: '#FFF', fontSize: 10 }}>Tap to Stop</ThemedText>
                            </View>
                        ) : (
                            <>
                                <View style={styles.newBadge}><ThemedText style={styles.newBadgeText}>NEW</ThemedText></View>
                                <Feather name="mic" size={28} color={Colors.light.primary} style={{ marginBottom: 8 }} />
                                <ThemedText style={styles.actionText}>Voice Log</ThemedText>
                            </>
                        )}
                    </Pressable>
                    <Pressable style={[styles.actionCard, { backgroundColor: theme.card }]} onPress={handleScan}>
                        <Feather name="maximize" size={28} color={Colors.light.primary} style={{ marginBottom: 8 }} />
                        <ThemedText style={styles.actionText}>Scan a Barcode</ThemedText>
                    </Pressable>
                    <Pressable style={[styles.actionCard, { backgroundColor: theme.card }]} onPress={handleManualEntry}>
                        <Feather name="edit-3" size={28} color={Colors.light.primary} style={{ marginBottom: 8 }} />
                        <ThemedText style={styles.actionText}>Manual Entry</ThemedText>
                    </Pressable>
                </View>

                {/* History Mock */}
                <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Recent History</ThemedText>
                <Pressable
                    style={[styles.searchResultItem, { backgroundColor: theme.card }]}
                    onPress={() => {
                        router.push({
                            pathname: "/ManualFoodEntryScreen",
                            params: {
                                mealType, date: dateStr,
                                initialName: "White rice, cooked",
                                initialCalories: "121",
                                initialCarbs: "28",
                                initialProtein: "3.5",
                                initialFats: "0.4"
                            }
                        });
                    }}
                >
                    <View>
                        <ThemedText style={styles.foodName}>White rice, cooked</ThemedText>
                        <ThemedText style={[styles.foodDetail, { color: theme.textSecondary }]}>121 cal, 1.0 cup</ThemedText>
                    </View>
                    <View style={[styles.addButton, { borderColor: theme.border }]}>
                        <Feather name="plus" size={20} color={Colors.light.primary} />
                    </View>
                </Pressable>
            </View>
        );
    };



    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Add Food</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Feather name="search" size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search for a food"
                        placeholderTextColor={theme.textSecondary}
                        value={searchText}
                        onChangeText={(text) => {
                            setSearchText(text);
                            setIsSearchSubmitted(false); // Reset to suggestions when typing
                        }}
                        onSubmitEditing={handleSubmitSearch}
                    />
                    {searchText.length > 0 && (
                        <Pressable onPress={handleClearSearch}>
                            <Feather name="x" size={20} color={theme.textSecondary} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    {tabs.map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tabItem,
                                activeTab === tab && { borderBottomColor: Colors.light.primary, borderBottomWidth: 2 }
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.tabText,
                                    activeTab === tab ? { color: Colors.light.primary, fontWeight: '700' } : { color: theme.textSecondary }
                                ]}
                            >
                                {tab}
                            </ThemedText>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === "All" ? renderAllTab() : null}
                {activeTab === "My Meals" ? renderMyMealsTab() : null}
                {/* Other tabs can be empty or placeholders for now */}
                {activeTab === "My Recipes" && <ThemedText style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary }}>No recipes yet.</ThemedText>}
                {activeTab === "My Foods" && <ThemedText style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary }}>No custom foods yet.</ThemedText>}
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
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        ...Typography.h4,
    },
    searchContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 48,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        ...Typography.body,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    tabsContent: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
    },
    tabItem: {
        paddingVertical: Spacing.sm,
        marginBottom: -1, // Overlap border
    },
    tabText: {
        ...Typography.bodyMedium,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    actionCard: {
        flex: 1,
        height: 100,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.soft,
        position: 'relative',
    },
    newBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: Colors.light.secondary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    actionText: {
        ...Typography.captionMedium,
    },
    sectionTitle: {
        ...Typography.h4,
        fontSize: 16,
        marginBottom: Spacing.md,
    },
    // Search Results Styles
    searchResultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    searchAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    foodName: {
        ...Typography.bodyMedium,
        fontWeight: '600',
    },
    foodDetail: {
        ...Typography.caption,
        marginTop: 2,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    // My Meals Styles
    myMealsContainer: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    mealActionsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    mealActionBtn: {
        flex: 1,
        height: 100,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    mealActionText: {
        ...Typography.captionMedium,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyStateTitle: {
        ...Typography.h3,
        textAlign: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        color: Colors.light.secondary,
    },
    emptyStateText: {
        ...Typography.body,
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: 22,
    },
    recordingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
});
