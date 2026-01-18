import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { createChallenge } from "@/services/challengeService";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreateChallengeScreen() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [target, setTarget] = useState("");
    const [duration, setDuration] = useState("7");
    const [type, setType] = useState<'steps' | 'calories' | 'water' | 'workouts'>('steps');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !description || !target) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            await createChallenge({
                name,
                description,
                target: Number(target),
                duration: Number(duration),
                type,
                creatorId: user?.uid,
                isPrivate: true, // Pro challenges are private by default implies custom
            });
            Alert.alert("Success", "Challenge created!");
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to create challenge");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle} type="title">Create Challenge</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <ThemedText style={styles.label}>Challenge Name</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. Office Step Comp"
                    placeholderTextColor={theme.textSecondary}
                    value={name}
                    onChangeText={setName}
                />

                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    placeholder="What's the goal?"
                    placeholderTextColor={theme.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <ThemedText style={styles.label}>Challenge Type</ThemedText>
                <View style={styles.typeContainer}>
                    {(['steps', 'calories', 'water', 'workouts'] as const).map((t) => (
                        <Pressable
                            key={t}
                            style={[
                                styles.typeChip,
                                type === t && { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
                                type !== t && { borderColor: theme.border, backgroundColor: theme.surface }
                            ]}
                            onPress={() => setType(t)}
                        >
                            <ThemedText style={[
                                styles.typeText,
                                type === t && { color: 'white' },
                                type !== t && { color: theme.text }
                            ]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>

                <ThemedText style={styles.label}>Target ({type})</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    placeholder="e.g. 10000"
                    placeholderTextColor={theme.textSecondary}
                    value={target}
                    onChangeText={setTarget}
                    keyboardType="numeric"
                />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
                <Pressable
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <ThemedText style={styles.buttonText}>Create Challenge</ThemedText>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
    },
    headerTitle: {
        marginLeft: Spacing.sm,
    },
    content: {
        padding: Spacing.lg,
    },
    label: {
        ...Typography.subtitle,
        marginBottom: Spacing.xs,
        marginTop: Spacing.md,
    },
    input: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    typeChip: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    createButton: {
        backgroundColor: Colors.light.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        ...Shadows.md,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
