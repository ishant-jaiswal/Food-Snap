import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { analyzeDietarySuitability, DietaryAnalysis, fetchProductByBarcode, ProductData } from "@/services/barcodeService";
import { logFoodItem } from "@/services/foodService";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanFoodScreen() {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const mealType = (params.mealType as "Breakfast" | "Lunch" | "Dinner" | "Snack") || "Snack";
    const dateStr = (params.date as string) || new Date().toISOString().split("T")[0];

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logging, setLogging] = useState(false);
    const [product, setProduct] = useState<ProductData | null>(null);
    const [analysis, setAnalysis] = useState<DietaryAnalysis | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    const handleLogFood = async () => {
        if (!product || !user) return;

        setLogging(true);
        try {
            await logFoodItem(user.id, {
                name: product.product_name,
                calories: product.nutriments?.energy_kcal_100g || 0,
                protein: product.nutriments?.proteins_100g || 0,
                carbs: product.nutriments?.carbohydrates_100g || 0,
                fats: product.nutriments?.fat_100g || 0,
                image_url: product.image_url,
                barcode: "",
                mealType,
                dateStr
            });
            Alert.alert("Success", "Food logged to your daily diary!", [
                { text: "OK", onPress: resetScan }
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to log food. Please try again.");
        } finally {
            setLogging(false);
        }
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        setLoading(true);
        setModalVisible(true);

        try {
            const productData = await fetchProductByBarcode(data);
            if (productData) {
                setProduct(productData);
                const result = analyzeDietarySuitability(productData, user?.dietTypes || []);
                setAnalysis(result);
            } else {
                setProduct(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetScan = () => {
        setScanned(false);
        setModalVisible(false);
        setProduct(null);
        setAnalysis(null);
    };

    if (!permission) {
        return <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: "center", alignItems: "center" }]}>
                <ThemedText style={{ marginBottom: Spacing.md }}>We need your permission to show the camera</ThemedText>
                <Pressable onPress={requestPermission} style={[styles.btn, { backgroundColor: Colors.light.primary }]}>
                    <ThemedText style={{ color: "#FFF" }}>Grant Permission</ThemedText>
                </Pressable>
            </View>
        );
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'safe': return Colors.light.secondary; // Green-ish
            case 'caution': return Colors.light.orange;
            case 'avoid': return Colors.light.primary; // Red/Attention
            default: return theme.textSecondary;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: "black" }]}>
            <View style={styles.headerOverlay}>
                <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Feather name="x" size={24} color="#FFF" />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Scan Barcode</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <ThemedText style={styles.overlayText}>Align code within frame</ThemedText>
                </View>
            </CameraView>

            {/* RESULT MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={resetScan}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.light.primary} />
                                <ThemedText style={{ marginTop: Spacing.md }}>Analyzing...</ThemedText>
                            </View>
                        ) : product ? (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
                                {/* HEADER IMAGE */}
                                <View style={styles.imageContainer}>
                                    {product.image_url ? (
                                        <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="contain" />
                                    ) : (
                                        <View style={[styles.placeholderImage, { backgroundColor: theme.backgroundSecondary }]}>
                                            <Feather name="image" size={40} color={theme.textSecondary} />
                                        </View>
                                    )}
                                </View>

                                {/* PRODUCT TITLE */}
                                <View style={styles.contentContainer}>
                                    <ThemedText style={styles.brandName}>{product.brands}</ThemedText>
                                    <ThemedText style={styles.productName}>{product.product_name}</ThemedText>

                                    {/* STATUS BADGE */}
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(analysis?.status)} 15`, borderColor: getStatusColor(analysis?.status) }]}>
                                        <Feather
                                            name={analysis?.status === 'safe' ? 'check-circle' : analysis?.status === 'avoid' ? 'alert-octagon' : 'alert-triangle'}
                                            size={20}
                                            color={getStatusColor(analysis?.status)}
                                        />
                                        <ThemedText style={[styles.statusText, { color: getStatusColor(analysis?.status) }]}>
                                            {analysis?.status === 'safe' ? 'Safe for you' : analysis?.status === 'avoid' ? 'Avoid' : 'Consume with Caution'}
                                        </ThemedText>
                                    </View>

                                    {/* REASONS */}
                                    {analysis && analysis.reasons.length > 0 && (
                                        <View style={styles.reasonContainer}>
                                            {analysis.reasons.map((reason, idx) => (
                                                <View key={idx} style={styles.reasonRow}>
                                                    <Feather name="x" size={14} color={Colors.light.primary} />
                                                    <ThemedText style={styles.reasonText}>{reason}</ThemedText>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* MACROS CARD */}
                                    <View style={[styles.macrosCard, { backgroundColor: theme.card, ...Shadows.soft }]}>
                                        <View style={styles.macroItem}>
                                            <ThemedText style={styles.macroValue}>{product.nutriments?.energy_kcal_100g || '-'}</ThemedText>
                                            <ThemedText style={styles.macroLabel}>kcal</ThemedText>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.macroItem}>
                                            <ThemedText style={[styles.macroValue, { color: Colors.light.primary }]}>{product.nutriments?.proteins_100g || '-'}g</ThemedText>
                                            <ThemedText style={styles.macroLabel}>Protein</ThemedText>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.macroItem}>
                                            <ThemedText style={styles.macroValue}>{product.nutriments?.carbohydrates_100g || '-'}g</ThemedText>
                                            <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.macroItem}>
                                            <ThemedText style={styles.macroValue}>{product.nutriments?.fat_100g || '-'}g</ThemedText>
                                            <ThemedText style={styles.macroLabel}>Fat</ThemedText>
                                        </View>
                                    </View>

                                    <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Ingredients</ThemedText>
                                    <ThemedText style={[styles.ingredientsText, { color: theme.textSecondary }]}>
                                        {product.ingredients_text || "No ingredients listed."}
                                    </ThemedText>

                                </View>
                            </ScrollView>
                        ) : (
                            <View style={styles.errorContainer}>
                                <Feather name="help-circle" size={48} color={theme.textSecondary} />
                                <ThemedText style={styles.errorTitle}>Product Not Found</ThemedText>
                                <ThemedText style={styles.errorText}>We couldn't find details for this barcode.</ThemedText>
                            </View>
                        )}

                        {/* BUTTONS */}
                        <View style={[styles.actionButtons, { borderTopColor: theme.border }]}>
                            <Pressable
                                style={[styles.actionBtn, { borderColor: theme.border, borderWidth: 1 }]}
                                onPress={resetScan}
                            >
                                <ThemedText>Scan Again</ThemedText>
                            </Pressable>
                            {product && (
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: Colors.light.primary }]}
                                    onPress={handleLogFood}
                                    disabled={logging}
                                >
                                    {logging ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <ThemedText style={{ color: "#FFF" }}>Log Food</ThemedText>
                                    )}
                                </Pressable>
                            )}
                        </View>

                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerOverlay: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    headerTitle: {
        color: "#FFF",
        ...Typography.bodyMedium,
        fontWeight: '600',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    overlayText: {
        color: '#FFF',
        marginTop: Spacing.lg,
        ...Typography.body,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        height: '80%',
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        height: 200,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
    },
    brandName: {
        ...Typography.caption,
        opacity: 0.7,
        marginBottom: 4,
    },
    productName: {
        ...Typography.h4,
        marginBottom: Spacing.md,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        alignSelf: 'flex-start',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    statusText: {
        ...Typography.smallMedium,
        fontWeight: '700',
    },
    reasonContainer: {
        marginBottom: Spacing.md,
        gap: 4,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    reasonText: {
        ...Typography.small,
        color: Colors.light.primary,
    },
    macrosCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginVertical: Spacing.md,
        ...Shadows.soft,
    },
    macroItem: {
        alignItems: 'center',
        flex: 1,
    },
    macroValue: {
        ...Typography.bodyMedium,
        fontWeight: '700',
    },
    macroLabel: {
        ...Typography.caption,
        opacity: 0.7,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    sectionTitle: {
        ...Typography.bodyMedium,
        fontWeight: '700',
        marginBottom: Spacing.sm,
    },
    ingredientsText: {
        ...Typography.small,
        lineHeight: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorTitle: {
        ...Typography.h4,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    errorText: {
        ...Typography.body,
        textAlign: 'center',
        opacity: 0.7,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderTopWidth: 1,
        gap: Spacing.md,
    },
    actionBtn: {
        flex: 1,
        height: 48,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btn: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    }
});
