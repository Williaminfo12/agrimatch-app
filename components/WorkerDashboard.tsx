import React, { useState, useMemo, useEffect } from 'react';
import { Filter, AlertTriangle, X, Check, CheckCircle2, MessageCircle, Star, Mountain, MoveHorizontal } from 'lucide-react';
import { jobService } from '../services/jobService';
import { JobPost, UserProfile, ApplicationStatus } from '../types';

interface WorkerDashboardProps {
  userProfile?: UserProfile | null;
  onOpenChat: (job: JobPost) => void;
}

// Constants matching the Flutter design
const STYLES = {
  largeTitleSize: 'text-[28px]',
  bodyTextSize: 'text-[22px]',
  highlightColor: 'text-[#E06666]', // Red for missing workers
  salaryColor: 'text-[#38761D]',     // Green for salary
};

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ userProfile, onOpenChat }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Application State
  const [appliedJobs, setAppliedJobs] = useState<Map<string, ApplicationStatus>>(new Map());
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterTask, setFilterTask] = useState<string>('');
  const [filterMinSalary, setFilterMinSalary] = useState<number | ''>('');

  // Load jobs from service
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const jobs = await jobService.getJobs();
        setAllJobs(jobs);
        
        // Check existing applications
        if (userProfile) {
          const myApps = await jobService.getApplicationsByWorkerId(userProfile.uid);
          const appMap = new Map<string, ApplicationStatus>();
          myApps.forEach(app => appMap.set(app.jobId, app.status));
          setAppliedJobs(appMap);
        }
        setIsLoading(false);
    };

    fetchData();
  }, [userProfile]);

  // Extract unique options
  const availableLocations = useMemo(() => 
    Array.from(new Set(allJobs.map(j => j.locationDistrict || j.location.split('區')[0] + '區'))).filter(Boolean)
  , [allJobs]);
  
  const availableTasks = useMemo(() => 
    Array.from(new Set(allJobs.map(j => j.task))).filter(Boolean)
  , [allJobs]);

  // Filter and Sort
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...allJobs];
    if (filterLocation) result = result.filter(job => job.location.includes(filterLocation) || job.locationDistrict === filterLocation);
    if (filterTask) result = result.filter(job => job.task === filterTask);
    if (filterMinSalary !== '') result = result.filter(job => (job.salaryAmount || 0) >= (filterMinSalary as number));
    
    // Sort by commute time (simulated) or just creation date for now since logic is client-side sorted
    return result; 
  }, [allJobs, filterLocation, filterTask, filterMinSalary]);

  // Logic to check if user has ANY accepted job
  const hasAcceptedJob = useMemo(() => {
     return Array.from(appliedJobs.values()).includes(ApplicationStatus.ACCEPTED);
  }, [appliedJobs]);

  // Actions
  const handleApply = async (e: React.MouseEvent, job: JobPost) => {
    e.stopPropagation();
    if (!userProfile) return;
    if (hasAcceptedJob) {
       setNotification({ message: '您已有錄取工作，無法重複應徵', type: 'error' });
       setTimeout(() => setNotification(null), 3000);
       return;
    }
    
    const success = await jobService.applyForJob(job.id, userProfile);
    if (success) {
        setAppliedJobs(prev => new Map(prev).set(job.id, ApplicationStatus.PENDING));
        setNotification({ message: `成功應徵：${job.title}`, type: 'success' });
    } else {
        setNotification({ message: `已應徵過此工作`, type: 'error' });
    }
    
    // Auto hide notification
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenChat = (e: React.MouseEvent, job: JobPost) => {
    e.stopPropagation();
    onOpenChat(job);
  };

  const getRemainingWorkers = (job: JobPost) => {
    return (job.requiredWorkers || 0) - (job.currentWorkers || 0);
  };

  const resetFilters = () => {
    setFilterLocation('');
    setFilterTask('');
    setFilterMinSalary('');
  };

  const activeFiltersCount = [filterLocation, filterTask, filterMinSalary !== ''].filter(Boolean).length;

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in flex flex-col h-full relative">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
           <div className={`bg-${notification.type === 'success' ? 'green' : 'red'}-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              {notification.message}
           </div>
        </div>
      )}

      {/* App Bar Section */}
      <div className="flex justify-between items-center px-4 py-4 mb-2">
        <h2 className={`${STYLES.largeTitleSize} font-bold text-gray-900`}>尋找農務工作</h2>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
        >
          <Filter size={32} className="text-gray-700" />
          {activeFiltersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            </span>
          )}
        </button>
      </div>

      {/* Job List */}
      <div className="px-4 space-y-4 pb-8">
        {isLoading ? (
            <div className="text-center py-10 text-gray-500">載入中...</div>
        ) : filteredAndSortedJobs.length === 0 ? (
           <div className="bg-gray-50 w-full px-4 py-8 mb-4 text-center text-gray-500 font-medium rounded-xl">
              沒有符合篩選條件的工作，請稍後再來
           </div>
        ) : (
            filteredAndSortedJobs.map((job) => {
            const remaining = getRemainingWorkers(job);
            const isExpanded = selectedJobId === job.id;
            const appStatus = appliedJobs.get(job.id);
            const isApplied = appStatus !== undefined;
            const isAccepted = appStatus === ApplicationStatus.ACCEPTED;

            return (
                <div 
                key={job.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 border ${isAccepted ? 'border-green-400 ring-2 ring-green-100' : isApplied ? 'border-gray-300' : 'border-gray-100'}`}
                >
                <div 
                    className="p-6 cursor-pointer active:bg-gray-50"
                    onClick={() => setSelectedJobId(isExpanded ? null : job.id)}
                >
                    {/* 1. Header */}
                    <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-2">
                        <h3 className={`${STYLES.largeTitleSize} font-bold text-gray-800 flex items-center gap-2`}>
                            {job.title}
                            {isAccepted && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> 已錄取</span>}
                            {!isAccepted && isApplied && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full border border-gray-300">已應徵</span>}
                        </h3>
                        {/* Terrain Badge */}
                        {job.terrain === 'slope' ? (
                            <div className="flex items-center gap-1 text-orange-700 bg-orange-100 px-2 py-1 rounded-md self-start">
                            <Mountain size={18} />
                            <span className="text-sm font-bold">山坡地</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-md self-start">
                            <MoveHorizontal size={18} />
                            <span className="text-sm font-bold">平地</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-lg">
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-700 font-bold text-sm">
                            園主信用: {job.ownerCreditScore?.toFixed(1) || '4.5'}
                        </span>
                        </div>
                    </div>
                    </div>
                    
                    <hr className="border-gray-200 border-[1.5px] mb-4" />

                    {/* 2. Details */}
                    <div className="flex justify-between items-start">
                    <div className="flex flex-col items-start gap-2">
                        <span className={`${STYLES.bodyTextSize} text-gray-900`}>
                        地點: {job.location}
                        </span>
                        <span className={`${STYLES.bodyTextSize} text-gray-900 flex items-center gap-2`}>
                        日期: {job.date} {job.time && <span className="text-base text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{job.time}</span>}
                        </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-[26px] font-black ${STYLES.salaryColor}`}>
                        {job.payRate}
                        </span>
                        <span 
                        className={`text-[28px] font-black ${remaining > 0 ? STYLES.highlightColor : 'text-green-600'}`}
                        >
                        尚缺 {remaining} 名
                        </span>
                    </div>
                    </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 animate-fade-in">
                    <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                        {job.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Chat Button (Only if Accepted) */}
                        {isAccepted && (
                            <button
                            onClick={(e) => handleOpenChat(e, job)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm col-span-2"
                            >
                            <MessageCircle size={24} />
                            進入工作群組
                            </button>
                        )}
                        
                        {/* Apply Button (Only if NOT applied/accepted) */}
                        {!isApplied && (
                            <button 
                            onClick={(e) => handleApply(e, job)}
                            disabled={hasAcceptedJob}
                            className={`col-span-2 text-white text-lg font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all ${hasAcceptedJob ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#38761D] hover:bg-green-800'}`}
                            >
                            {hasAcceptedJob ? '已有錄取工作' : '立即應徵'}
                            </button>
                        )}

                        {/* Status Button (If Applied but not accepted yet) */}
                        {isApplied && !isAccepted && (
                            <button disabled className="col-span-2 bg-gray-200 text-gray-500 text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                已應徵，等待回覆
                            </button>
                        )}
                    </div>
                    </div>
                )}
                </div>
            );
            })
        )}
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-green-50 p-4 flex justify-between items-center border-b border-green-100">
              <h3 className="text-2xl font-bold text-green-900">篩選條件</h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-green-100 rounded-full text-green-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-lg font-bold text-gray-700 block">地區 (鄉/鎮/區)</label>
                <div className="grid grid-cols-3 gap-3">
                  {availableLocations.length > 0 ? availableLocations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => setFilterLocation(filterLocation === loc ? '' : loc)}
                      className={`py-2 px-2 rounded-lg text-base font-medium border-2 transition-all
                        ${filterLocation === loc 
                          ? 'border-green-600 bg-green-50 text-green-800' 
                          : 'border-gray-200 text-gray-600 hover:border-green-300 bg-white'}`}
                    >
                      {loc}
                    </button>
                  )) : <p className="text-gray-400 text-sm">尚無可篩選地區</p>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-lg font-bold text-gray-700 block">工作類型</label>
                <select 
                  value={filterTask}
                  onChange={(e) => setFilterTask(e.target.value)}
                  className="w-full p-3 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none bg-white"
                >
                  <option value="">所有類型</option>
                  {availableTasks.map(task => (
                    <option key={task} value={task}>{task}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-lg font-bold text-gray-700 block">最低薪資 (NT$)</label>
                <input
                  type="number"
                  placeholder="例如: 1500"
                  value={filterMinSalary}
                  onChange={(e) => setFilterMinSalary(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-3 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-4 bg-gray-50">
              <button 
                onClick={resetFilters}
                className="flex-1 py-3 text-gray-600 font-bold text-lg hover:bg-gray-200 rounded-xl transition-colors"
              >
                重置
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3 bg-green-700 text-white font-bold text-lg rounded-xl hover:bg-green-800 shadow-md transition-colors flex justify-center items-center gap-2"
              >
                <Check size={20} />
                套用篩選
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};