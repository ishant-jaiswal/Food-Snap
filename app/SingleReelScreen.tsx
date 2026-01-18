import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { fetchReelById } from "@/services/reelsService";
import { Feather } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type SingleReelRouteProp = RouteProp<RootStackParamList, 'SingleReel'>;

export default function SingleReelScreen() {
    const route = useRoute<SingleReelRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const reelId = route.params?.reelId;

    const [reel, setReel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);

    const player = useVideoPlayer(reel?.videoUrl || "", (player) => {
        player.loop = true;
        player.play();
    });

    useEffect(() => {
        loadReel();
    }, [reelId]);

    const loadReel = async () => {
        if (!reelId) return;
        setLoading(true);
        const data = await fetchReelById(reelId);
        setReel(data);
        setLoading(false);
    };

    const togglePlayback = () => {
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!reel) {
        return (
            <View style={styles.center}>
                <ThemedText style={{ color: '#FFF' }}>Reel not found.</ThemedText>
                <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <ThemedText style={{ color: Colors.light.primary }}>Go Back</ThemedText>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Pressable style={[styles.backButton, { top: insets.top + 10 }]} onPress={() => navigation.navigate("Main")}>
                <Feather name="chevron-left" size={32} color="#FFF" />
            </Pressable>

            <Pressable onPress={togglePlayback} style={StyleSheet.absoluteFill}>
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    nativeControls={false}
                />
                {!isPlaying && (
                    <View style={styles.pauseOverlay} pointerEvents="none">
                        <Feather name="play" size={50} color="rgba(255,255,255,0.7)" />
                    </View>
                )}
            </Pressable>

            <View style={[styles.userInfo, { bottom: 40 }]}>
                <View style={styles.userRow}>
                    <View style={styles.avatarContainer}>
                        {reel.userProfileImage ? (
                            <Image
                                source={{ uri: reel.userProfileImage }}
                                style={styles.avatar}
                            />
                        ) : (
                            <Feather name="user" size={20} color="#FFF" />
                        )}
                    </View>
                    <ThemedText style={styles.username}>@{reel.username}</ThemedText>
                </View>
                <ThemedText style={styles.caption}>{reel.caption}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#000",
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 4
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        zIndex: 5,
    },
    userInfo: {
        position: "absolute",
        left: 20,
        right: 80,
        zIndex: 10,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#FFF',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    username: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "bold",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    caption: {
        fontSize: 14,
        color: "#FFFFFF",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
