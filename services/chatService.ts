import { ChatMessage, UserProfile, UserRole, JobPost, ApplicationStatus } from '../types';
import { db } from './firebaseConfig';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, getDocs, deleteDoc } from "firebase/firestore";
import { jobService } from './jobService';

export const chatService = {
  subscribeToMessages: (jobId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, "chats"), 
      where("jobId", "==", jobId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      callback(messages);
    });

    return unsubscribe;
  },

  sendMessage: async (jobId: string, user: UserProfile, role: UserRole, content: string): Promise<void> => {
    const newMessage = {
      jobId,
      senderId: user.uid,
      senderName: user.fullName || 'Unknown',
      senderRole: role,
      content,
      timestamp: new Date().toISOString()
    };
    
    await addDoc(collection(db, "chats"), newMessage);
  },

  deleteChatRoom: async (jobId: string): Promise<void> => {
    const q = query(collection(db, "chats"), where("jobId", "==", jobId));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (d) => {
      await deleteDoc(doc(db, "chats", d.id));
    });
  },

  getUserChats: async (userId: string): Promise<JobPost[]> => {
    const allJobs = await jobService.getJobs();
    const myApps = await jobService.getApplicationsByWorkerId(userId);
    
    const ownedJobs = allJobs.filter(j => j.ownerId === userId && j.status === 'active');
    
    const acceptedJobIds = myApps
        .filter(a => a.status === ApplicationStatus.ACCEPTED)
        .map(a => a.jobId);
    
    const workerJobs = allJobs.filter(j => acceptedJobIds.includes(j.id) && j.status === 'active');
    
    const combined = [...ownedJobs, ...workerJobs];
    const uniqueJobs = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    return uniqueJobs;
  }
};