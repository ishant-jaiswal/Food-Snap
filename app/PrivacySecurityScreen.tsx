import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { deleteUser, getAuth, updatePassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacySecurityScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { logout, user, updateUser } = useAuth();

    const [privateAccount, setPrivateAccount] = useState(user?.isPrivate || false);

    // Change Password Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (user) {
            setPrivateAccount(!!user.isPrivate);
        }
    }, [user]);

    const togglePrivateAccount = async (val: boolean) => {
        setPrivateAccount(val); // Optimistic update
        try {
            await updateUser({ isPrivate: val });
        } catch (error) {
            console.error("Failed to update privacy setting", error);
            setPrivateAccount(!val); // Revert on failure
            Alert.alert("Error", "Failed to update privacy setting. Please try again.");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            try {
                await updatePassword(user, newPassword);
                Alert.alert("Success", "Password updated successfully");
                setModalVisible(false);
                setNewPassword("");
                setConfirmPassword("");
            } catch (error: any) {
                if (error.code === 'auth/requires-recent-login') {
                    Alert.alert("Re-authentication Required", "Please log out and log back in to change your password.");
                } else {
                    Alert.alert("Error", error.message);
                }
            }
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to permanently delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const auth = getAuth();
                        const user = auth.currentUser;
                        if (user) {
                            try {
                                await deleteUser(user);
                                // Auth listener should handle logout, but we can force it
                                await logout();
                            } catch (error: any) {
                                if (error.code === 'auth/requires-recent-login') {
                                    Alert.alert("Re-authentication Required", "Please log out and log back in to delete your account.");
                                } else {
                                    Alert.alert("Error", error.message);
                                }
                            }
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#FFF" />
                </Pressable>
                <ThemedText style={styles.title}>Privacy & Security</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>

                {/* Privacy Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Account Privacy</ThemedText>

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Private Account</ThemedText>
                            <ThemedText style={styles.sublabel}>Only followers can see your reels</ThemedText>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: Colors.light.primary }}
                            thumbColor={privateAccount ? "#FFF" : "#f4f3f4"}
                            onValueChange={togglePrivateAccount}
                            value={privateAccount}
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Security Section */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Security</ThemedText>

                    <Pressable style={styles.actionRow} onPress={() => setModalVisible(true)}>
                        <ThemedText style={styles.label}>Change Password</ThemedText>
                        <Feather name="chevron-right" size={20} color={Colors.light.textSecondary} />
                    </Pressable>
                </View>

                <View style={styles.divider} />

                {/* Danger Zone */}
                <View style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: Colors.light.error }]}>Danger Zone</ThemedText>

                    <Pressable style={styles.actionRow} onPress={handleDeleteAccount}>
                        <ThemedText style={[styles.label, { color: Colors.light.error }]}>Delete Account</ThemedText>
                        <Feather name="trash-2" size={20} color={Colors.light.error} />
                    </Pressable>
                </View>

            </View>

            {/* Change Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ThemedText style={styles.modalTitle}>Change Password</ThemedText>

                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <View style={styles.modalButtons}>
                            <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <ThemedText style={styles.btnText}>Cancel</ThemedText>
                            </Pressable>
                            <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={handleChangePassword}>
                                <ThemedText style={styles.btnText}>Update</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 4,
    },
    title: {
        ...Typography.h3,
        color: "#FFF",
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h4,
        color: Colors.light.primary,
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: Spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    rowText: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    label: {
        ...Typography.body,
        color: "#FFF",
    },
    sublabel: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.md,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalView: {
        width: '85%',
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        ...Typography.h3,
        color: '#FFF',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 12,
        color: '#FFF',
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    modalBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelBtn: {
        backgroundColor: '#444',
    },
    saveBtn: {
        backgroundColor: Colors.light.primary,
    },
    btnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
