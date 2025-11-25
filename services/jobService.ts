import { JobPost, JobApplication, UserProfile, ApplicationStatus } from '../types';
import { db } from './firebaseConfig';
import { collection, updateDoc, deleteDoc, doc, getDocs, query, where, setDoc, increment } from "firebase/firestore";

export const jobService = {
  getJobs: async (): Promise<JobPost[]> => {
    try {
      const q = query(collection(db, "jobs"));
      const querySnapshot = await getDocs(q);
      const jobs: JobPost[] = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as JobPost);
      });
      return jobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error("Error loading jobs", e);
      return [];
    }
  },

  addJob: async (job: JobPost): Promise<void> => {
    const jobRef = doc(collection(db, "jobs")); 
    const newJob = { ...job, id: jobRef.id };
    await setDoc(jobRef, newJob);
  },

  updateJob: async (updatedJob: JobPost): Promise<void> => {
    const jobRef = doc(db, "jobs", updatedJob.id);
    await updateDoc(jobRef, { ...updatedJob });
  },

  deleteJob: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "jobs", id));
  },

  getApplicationsByJobId: async (jobId: string): Promise<JobApplication[]> => {
    try {
      const q = query(collection(db, "applications"), where("jobId", "==", jobId));
      const querySnapshot = await getDocs(q);
      const apps: JobApplication[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
      return apps;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getApplicationsByWorkerId: async (workerId: string): Promise<JobApplication[]> => {
    try {
      const q = query(collection(db, "applications"), where("workerId", "==", workerId));
      const querySnapshot = await getDocs(q);
      const apps: JobApplication[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
      return apps;
    } catch (e) {
      return [];
    }
  },

  applyForJob: async (jobId: string, workerProfile: UserProfile): Promise<boolean> => {
    const q = query(
      collection(db, "applications"), 
      where("jobId", "==", jobId),
      where("workerId", "==", workerProfile.uid)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) return false;

    const newApp: JobApplication = {
      id: "",
      jobId,
      workerId: workerProfile.uid,
      workerName: workerProfile.fullName,
      workerProfileSnapshot: workerProfile,
      status: ApplicationStatus.PENDING,
      appliedAt: new Date().toISOString()
    };
    
    const appRef = doc(collection(db, "applications"));
    newApp.id = appRef.id;
    await setDoc(appRef, newApp);

    return true;
  },

  updateApplicationStatus: async (appId: string, newStatus: ApplicationStatus, currentJob: JobPost): Promise<boolean> => {
    const appRef = doc(db, "applications", appId);
    const jobRef = doc(db, "jobs", currentJob.id);

    try {
        await updateDoc(appRef, { status: newStatus });

        if (newStatus === ApplicationStatus.ACCEPTED) {
            if (currentJob.currentWorkers < currentJob.requiredWorkers) {
                await updateDoc(jobRef, {
                    currentWorkers: increment(1)
                });
            }
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  }
};