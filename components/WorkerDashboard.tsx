import React, { useState, useMemo, useEffect } from 'react';
import { Filter, CheckCircle2, MessageCircle, Star, Mountain, MoveHorizontal, X, Check, AlertTriangle } from 'lucide-react';
import { jobService } from '../services/jobService';
import { JobPost, UserProfile, ApplicationStatus } from '../types';

interface WorkerDashboardProps {
  userProfile?: UserProfile | null;
  onOpenChat: (job: JobPost) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ userProfile, onOpenChat }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<JobPost[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Map<string, ApplicationStatus>>(new Map());
  const [notification, setNotification] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
        const jobs = await jobService.getJobs();
        setAllJobs(jobs);
        if (userProfile) {
          const myApps = await jobService.getApplicationsByWorkerId(userProfile.uid);
          const appMap = new Map<string, ApplicationStatus>();
          myApps.forEach(app => appMap.set(app.jobId, app.status));
          setAppliedJobs(appMap);
        }
    };
    fetchData();
  }, [userProfile]);

  const filteredJobs = useMemo(() => {
    return filterLocation ? allJobs.filter(j => j.location.includes(filterLocation)) : allJobs;
  }, [allJobs, filterLocation]);

  const handleApply = async (e: React.MouseEvent, job: JobPost) => {
    e.stopPropagation();
    if (!userProfile) return;
    if (Array.from(appliedJobs.values()).includes(ApplicationStatus.ACCEPTED)) {
       setNotification('已有錄取工作'); setTimeout(() => setNotification(null), 3000); return;
    }
    const success = await jobService.applyForJob(job.id, userProfile);
    if (success) {
        setAppliedJobs(prev => new Map(prev).set(job.id, ApplicationStatus.PENDING));
        setNotification('成功應徵');
    }
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full relative p-4">
      {notification && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full font-bold">{notification}</div>}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">工作列表</h2>
        <button onClick={() => setIsFilterOpen(true)} className="p-2 bg-white rounded-full shadow"><Filter/></button>
      </div>

      <div className="space-y-4">
         {filteredJobs.map(job => {
            const appStatus = appliedJobs.get(job.id);
            const isAccepted = appStatus === ApplicationStatus.ACCEPTED;
            return (
                <div key={job.id} className={`bg-white rounded-xl shadow border p-5 ${isAccepted ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-100'}`} onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}>
                    <div className="flex justify-between">
                        <div>
                            <h3 className="text-xl font-bold">{job.title} {isAccepted && <span className="text-sm bg-green-600 text-white px-2 py-0.5 rounded-full">錄取</span>}</h3>
                            <p className="text-gray-500">{job.location} | {job.payRate}</p>
                        </div>
                        <div className="text-right">
                           <span className="text-orange-500 font-bold">缺 {job.requiredWorkers - job.currentWorkers} 人</span>
                        </div>
                    </div>
                    {selectedJobId === job.id && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-gray-700 mb-4">{job.description}</p>
                            {isAccepted ? (
                                <button onClick={(e) => { e.stopPropagation(); onOpenChat(job); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">進入群組</button>
                            ) : (
                                !appStatus && <button onClick={(e) => handleApply(e, job)} className="w-full bg-green-700 text-white py-3 rounded-xl font-bold">應徵</button>
                            )}
                        </div>
                    )}
                </div>
            );
         })}
      </div>

      {isFilterOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsFilterOpen(false)}>
             <div className="bg-white w-full max-w-sm rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                 <h3 className="text-xl font-bold mb-4">篩選地區</h3>
                 <input type="text" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} placeholder="輸入地區..." className="w-full p-3 border rounded-xl mb-4"/>
                 <button onClick={() => setIsFilterOpen(false)} className="w-full bg-green-700 text-white py-3 rounded-xl font-bold">確定</button>
             </div>
         </div>
      )}
    </div>
  );
};