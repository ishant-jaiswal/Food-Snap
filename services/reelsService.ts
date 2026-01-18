import { getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    serverTimestamp,
    startAfter,
    updateDoc,
    where
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { db } from "../config/firebase";

export const uploadReel = async (userId: string, username: string, videoUri: string, caption: string, tags: string[], userProfileImage?: string) => {
    try {
        console.log("Starting upload for:", videoUri);

        // Ensure Auth
        const auth = getAuth();
        if (!auth.currentUser) {
            console.log("User not signed in, signing in anonymously...");
            await signInAnonymously(auth);
        }

        // 1. Create Blob via fetch (standard RN approach)
        console.log("Fetching blob...");
        const response = await fetch(videoUri);
        const blob = await response.blob();
        console.log("Blob created, size:", blob.size);

        const filename = `reels/${auth.currentUser?.uid || userId}/${Date.now()}.mp4`;

        // Ensure storage is initialized correctly
        const app = getApp();
        // Explicitly specify the bucket URL
        const storageInstance = getStorage(app, "gs://food-snap-962d7.firebasestorage.app");

        if (!storageInstance) {
            throw new Error("Firebase Storage could not be initialized");
        }

        const storageRef = ref(storageInstance, filename);

        const metadata = {
            contentType: 'video/mp4',
        };

        // Use Resumable upload
        const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error("Upload failure detail:", JSON.stringify(error));
                    // @ts-ignore
                    if (blob.close) blob.close();
                    reject(error);
                },
                async () => {
                    console.log("Upload complete, getting URL...");
                    const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    // @ts-ignore
                    if (blob.close) blob.close();

                    // 2. Save Metadata to Firestore
                    await addDoc(collection(db, "reels"), {
                        userId: auth.currentUser?.uid || userId,
                        username,
                        userProfileImage: userProfileImage || null,
                        videoUrl,
                        caption,
                        tags,
                        likesCount: 0,
                        commentsCount: 0,
                        sharesCount: 0,
                        createdAt: serverTimestamp(),
                        likes: []
                    });

                    resolve(true);
                }
            );
        });
    } catch (error) {
        console.error("Error uploading reel:", error);
        throw error;
    }
};

export const fetchReels = async (lastDoc = null) => {
    try {
        let q = query(
            collection(db, "reels"),
            orderBy("createdAt", "desc"),
            limit(5)
        );

        if (lastDoc) {
            q = query(
                collection(db, "reels"),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(5)
            );
        }

        const snapshot = await getDocs(q);
        const reels = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { reels, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) {
        console.error("Error fetching reels:", error);
        return { reels: [], lastDoc: null };
    }
};

export const fetchUserReels = async (userId: string) => {
    try {
        const q = query(
            collection(db, "reels"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching user reels:", error);
        return [];
    }
};

export const fetchReelById = async (reelId: string) => {
    try {
        const docRef = doc(db, "reels", reelId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such reel!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching reel:", error);
        return null;
    }
};

export const deleteReel = async (reelId: string) => {
    try {
        await deleteDoc(doc(db, "reels", reelId));
        return true;
    } catch (error) {
        console.error("Error deleting reel:", error);
        throw error;
    }
};

export const toggleLikeReel = async (reelId: string, userId: string, isLiked: boolean) => {
    const reelRef = doc(db, "reels", reelId);

    if (isLiked) {
        // Unlike
        await updateDoc(reelRef, {
            likesCount: increment(-1),
            likes: arrayRemove(userId)
        });
    } else {
        // Like
        await updateDoc(reelRef, {
            likesCount: increment(1),
            likes: arrayUnion(userId)
        });
    }
};

export const addComment = async (reelId: string, userId: string, username: string, text: string) => {
    try {
        await addDoc(collection(db, "reels", reelId, "comments"), {
            userId,
            username,
            text,
            createdAt: serverTimestamp()
        });

        const reelRef = doc(db, "reels", reelId);
        await updateDoc(reelRef, {
            commentsCount: increment(1)
        });
    } catch (error) {
        console.error("Error adding comment:", error);
    }
};

export const getComments = async (reelId: string) => {
    const q = query(collection(db, "reels", reelId, "comments"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const incrementShareCount = async (reelId: string) => {
    try {
        const reelRef = doc(db, "reels", reelId);
        await updateDoc(reelRef, {
            sharesCount: increment(1)
        });
    } catch (error) {
        console.error("Error incrementing share count:", error);
    }
};
