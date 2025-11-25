import { UserProfile, Nationality } from '../types';
import { auth, db } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const authService = {
  restoreSession: async (): Promise<{ user: any, profile: UserProfile | null }> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
           const profile = await authService.getProfile(firebaseUser.uid);
           resolve({ user: firebaseUser, profile });
        } else {
           resolve({ user: null, profile: null });
        }
        unsubscribe();
      });
    });
  },

  signInWithGoogle: async (): Promise<{ user: any, isNewUser: boolean }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profile = await authService.getProfile(user.uid);
      return { user, isNewUser: !profile };
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  getProfile: async (uid?: string): Promise<UserProfile | null> => {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) return null;

    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  },

  saveProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    const currentProfile = await authService.getProfile(user.uid);
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      photoURL: user.photoURL || '',
      fullName: profileData.fullName || currentProfile?.fullName || '',
      gender: profileData.gender || currentProfile?.gender || 'male',
      phoneNumber: profileData.phoneNumber || currentProfile?.phoneNumber || '',
      nationality: profileData.nationality || currentProfile?.nationality || Nationality.TAIWAN,
      ownedOrchards: profileData.ownedOrchards || currentProfile?.ownedOrchards || '',
      skills: profileData.skills || currentProfile?.skills || [],
      creditScore: currentProfile?.creditScore || 4.8,
    };

    await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
    return newProfile;
  },
  
  formatPublicName: (profile: UserProfile | null): string => {
    if (!profile || !profile.fullName) return '貴賓';
    const surname = profile.fullName.charAt(0);
    const title = profile.gender === 'male' ? '先生' : '小姐';
    return `${surname}${title}`;
  }
};

export const formatPublicName = authService.formatPublicName;