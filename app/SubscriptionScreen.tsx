import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing } from "@/constants/theme";
import { useSubscription } from "@/context/SubscriptionContext";
import { useTheme } from "@/hooks/useTheme";

const FEATURES = [
    {
        icon: "fitness-outline",
        title: "Adaptive AI Coach",
        description: "Dynamic goals that adjust to your progress daily."
    },
    {
        icon: "people-outline",
        title: "Social Challenges Pro",
        description: "Create private challenges and compete with friends."
    },
    {
        icon: "nutrition-outline",
        title: "Advanced Nutrition",
        description: "Coming Soon: Detailed macro analysis and reports."
    },
];

export default function SubscriptionScreen() {
    const { isDark } = useTheme();
    const { upgradeToPro, isLoading, isPro } = useSubscription();
    const router = useRouter();

    const handleSubscribe = async () => {
        await upgradeToPro();
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.backgroundRoot : Colors.light.backgroundRoot }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Pressable onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
                </Pressable>

                <View style={styles.header}>
                    <Ionicons name="star" size={64} color={Colors.light.primary} />
                    <ThemedText style={styles.title} type="h1">Upgrade to Pro</ThemedText>
                    <ThemedText style={styles.subtitle}>Unlock your full fitness potential</ThemedText>
                </View>

                <View style={styles.featuresContainer}>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={[styles.featureCard, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }]}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault }]}>
                                <Ionicons name={feature.icon as any} size={24} color={Colors.light.primary} />
                            </View>
                            <View style={styles.textContainer}>
                                <ThemedText style={styles.featureTitle} type="h4">{feature.title}</ThemedText>
                                <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.pricingCard, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }]}>
                    <ThemedText style={styles.price}>$9.99<ThemedText style={styles.period}>/month</ThemedText></ThemedText>
                    <ThemedText style={styles.cancelText}>Cancel anytime. No commitment.</ThemedText>
                </View>

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: isDark ? Colors.dark.backgroundRoot : Colors.light.backgroundRoot }]}>
                <Pressable
                    style={[styles.subscribeButton, isPro && styles.disabledButton]}
                    onPress={handleSubscribe}
                    disabled={isLoading || isPro}
                >
                    <ThemedText style={styles.buttonText}>
                        {isLoading ? "Processing..." : isPro ? "Current Plan" : "Subscribe Now"}
                    </ThemedText>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: Spacing.sm,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginTop: Spacing.md,
    },
    title: {
        marginTop: Spacing.md,
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 18,
        opacity: 0.7,
        marginTop: Spacing.xs,
    },
    featuresContainer: {
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadows.soft,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        // backgroundColor handled inline
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        opacity: 0.7,
        lineHeight: 20,
    },
    pricingCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        ...Shadows.medium,
        marginBottom: Spacing.xl,
    },
    price: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    period: {
        fontSize: 16,
        fontWeight: 'normal',
        color: Colors.light.text,
    },
    cancelText: {
        marginTop: Spacing.sm,
        fontSize: 14,
        opacity: 0.6,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    subscribeButton: {
        backgroundColor: Colors.light.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        ...Shadows.medium,
    },
    disabledButton: {
        backgroundColor: Colors.light.text, // Gray out
        opacity: 0.5,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
