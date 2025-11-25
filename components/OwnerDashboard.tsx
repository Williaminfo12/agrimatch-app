import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle2, Calendar, Clock, Mountain, MoveHorizontal, Trash2, Edit2, Users, Check, X, User, MessageCircle, MapPin, DollarSign, ChevronDown } from 'lucide-react';
import { jobService } from '../services/jobService';
import { chatService } from '../services/chatService';
import { JobPost, UserProfile, JobApplication, ApplicationStatus } from '../types';
import { formatPublicName } from '../services/authService';

interface OwnerDashboardProps {
  userProfile: UserProfile | null;
  onOpenChat: (job: JobPost) => void;
}

// Data Options - '其他' is handled programmatically
const CROP_OPTIONS = ['葡萄', '水梨', '柿子', '草莓', '高接梨', '柑橘', '火龍果', '甜桃'];
const TASK_OPTIONS = ['套袋', '剪枝', '採收', '噴藥', '除草', '搬運', '包裝', '疏果'];
const TIME_OPTIONS = ['08:00 - 17:00 (全天)', '08:00 - 12:00 (上午)', '13:00 - 17:00 (下午)', '06:00 - 10:00 (清晨)'];

// Location Data (Central Region Focus)
const REGION_DATA: Record<string, string[]> = {
  '台中市東勢區': ['東勢里', '中嵙里', '玉山里', '廣興里', '上城里', '下城里', '慶東里', '泰昌里'],
  '台中市后里區': ['后里里', '廣福里', '仁里里', '義里里', '厚里里', '墩北里', '太平里'],
  '台中市新社區': ['新社里', '大南里', '中和里', '月湖里', '復盛里', '協成里'],
  '台中市石岡區': ['石岡里', '萬安里', '九房里', '金星里', '龍興里', '土牛里'],
  '台中市和平區': ['梨山里', '博愛里', '天輪里', '南勢里'],
  '苗栗縣卓蘭鎮': ['老庄里', '新厝里', '中街里', '內灣里', '上新里', '坪林里'],
  '苗栗縣大湖鄉': ['大湖村', '富興村', '靜湖村', '明湖村', '栗林村'],
  '南投縣埔里鎮': ['埔里里', '清新里', '其它里'],
  '其他': []
};

// Salary Ranges
const HOURLY_RATES = Array.from({ length: 91 }, (_, i) => 100 + i * 10); // 100 - 1000
const DAILY_RATES = Array.from({ length: 41 }, (_, i) => 1000 + i * 100); // 1000 - 5000

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ userProfile, onOpenChat }) => {
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form States
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  
  const [crop, setCrop] = useState('');
  const [task, setTask] = useState('');
  
  // Location States
  const [district, setDistrict] = useState('');
  const [li, setLi] = useState('');
  const [customLocation, setCustomLocation] = useState(''); // When district is '其他'
  
  // Salary State
  const [salaryType, setSalaryType] = useState<'hourly' | 'daily'>('daily');
  const [salaryAmount, setSalaryAmount] = useState<number>(1500);

  const [requiredWorkers, setRequiredWorkers] = useState(1);
  const [description, setDescription] = useState('');
  const [terrain, setTerrain] = useState<'flat' | 'slope'>('flat');
  
  // Date & Time States
  const [jobDate, setJobDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [jobTime, setJobTime] = useState('');

  // UI States
  const [activePosts, setActivePosts] = useState<JobPost[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [currentApplicants, setCurrentApplicants] = useState<JobApplication[]>([]);

  // Load jobs on mount
  useEffect(() => {
    refreshJobs();
  }, [userProfile?.uid]);

  const refreshJobs = async () => {
    if (!userProfile?.uid) return;
    setIsLoading(true);
    const allJobs = await jobService.getJobs();
    const myJobs = allJobs.filter(job => job.ownerId === userProfile.uid);
    setActivePosts(myJobs);
    setIsLoading(false);
  };

  const loadApplicants = async (jobId: string) => {
    const apps = await jobService.getApplicationsByJobId(jobId);
    setCurrentApplicants(apps);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditJob = (job: JobPost) => {
    setEditingJobId(job.id);
    setCrop(job.crop);
    setTask(job.task);
    
    // Parse salary
    if (job.salaryType === '時薪' || job.payRate.includes('時薪')) {
        setSalaryType('hourly');
        setSalaryAmount(job.salaryAmount || 183);
    } else {
        setSalaryType('daily');
        setSalaryAmount(job.salaryAmount || 1500);
    }

    // Parse Location
    if (job.locationDistrict && REGION_DATA[job.locationDistrict]) {
      setDistrict(job.locationDistrict);
      const remaining = job.location.replace(job.locationDistrict, '');
      setLi(remaining); 
    } else {
      const matchedDistrict = Object.keys(REGION_DATA).find(d => d !== '其他' && job.location.startsWith(d));
      if (matchedDistrict) {
         setDistrict(matchedDistrict);
         setLi(job.location.replace(matchedDistrict, ''));
      } else {
         setDistrict('其他');
         setCustomLocation(job.location);
      }
    }

    setRequiredWorkers(job.requiredWorkers);
    setDescription(job.description);
    setJobDate(job.date);
    setJobTime(job.time || '');
    setTerrain(job.terrain || 'flat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    resetForm();
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (!crop || crop === '其他') {
      alert("請輸入作物名稱");
      return;
    }
    if (!task || task === '其他') {
      alert("請輸入工作項目");
      return;
    }
    if (!salaryAmount) {
      alert("請選擇薪資金額");
      return;
    }

    // Location Validation & Construction
    let finalLocation = '';
    let finalDistrict = '';

    if (district === '其他') {
      if (!customLocation.trim()) {
        alert("請輸入完整地址");
        return;
      }
      finalLocation = customLocation;
      finalDistrict = '其他';
    } else if (district) {
      if (li === '其他') {
         alert("請輸入村/里名稱");
         return;
      }
      finalDistrict = district;
      finalLocation = district + li; 
    } else {
      alert("請選擇工作地點");
      return;
    }

    const payString = `${salaryType === 'hourly' ? '時薪' : '日薪'} ${salaryAmount}`;
    const finalTime = time === '其他' ? '' : (time || '全天');

    const jobData: JobPost = {
      id: editingJobId || '', // ID handled by service/firestore for new jobs
      ownerId: userProfile?.uid,
      ownerCreditScore: userProfile?.creditScore || 4.8,
      status: 'active',
      title: `${crop} - ${task}`,
      crop,
      task,
      description: description || `徵求${crop}${task}人員，薪資${payString}。`,
      payRate: payString,
      salaryType: salaryType === 'hourly' ? '時薪' : '日薪',
      salaryAmount: salaryAmount,
      location: finalLocation,
      locationDistrict: finalDistrict,
      requiredWorkers: requiredWorkers,
      currentWorkers: editingJobId ? activePosts.find(j => j.id === editingJobId)?.currentWorkers || 0 : 0,
      date: jobDate,
      time: finalTime,
      terrain: terrain,
      isAiGenerated: false
    };

    setIsLoading(true);
    if (editingJobId) {
      await jobService.updateJob(jobData);
      showNotification('工作更新成功！');
      setEditingJobId(null);
    } else {
      await jobService.addJob(jobData);
      showNotification('工作發布成功！');
    }
    
    await refreshJobs();
    resetForm();
    setIsLoading(false);
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('確定要結束此工作嗎？相關的聊天群組將會被刪除。')) {
      setIsLoading(true);
      await jobService.deleteJob(id);
      await chatService.deleteChatRoom(id);
      await refreshJobs();
      showNotification('工作已結束並移除。');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCrop('');
    setTask('');
    setSalaryType('daily');
    setSalaryAmount(1500);
    setDistrict('');
    setLi('');
    setCustomLocation('');
    setDescription('');
    setJobDate(new Date().toISOString().split('T')[0]);
    setJobTime('');
    setTerrain('flat');
  };

  // Application Logic
  const toggleApplicants = async (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      await loadApplicants(jobId);
    }
  };

  const handleApplicationStatus = async (appId: string, status: ApplicationStatus, job: JobPost) => {
    if (status === ApplicationStatus.ACCEPTED && job.currentWorkers >= job.requiredWorkers) {
       alert('人數已滿，無法接受更多申請。');
       return;
    }
    
    const success = await jobService.updateApplicationStatus(appId, status, job);
    if (success) {
      showNotification(status === ApplicationStatus.ACCEPTED ? '已接受申請' : '已拒絕/列入備選');
      await refreshJobs(); // Workers count changed
      await loadApplicants(job.id);
    }
  };

  // --- Reusable Component for Select OR Input ---
  const renderSelectWithInput = (
    label: string, 
    value: string, 
    setValue: (val: string) => void, 
    options: string[], 
    placeholder: string
  ) => {
    const isCustom = value === '其他' || (value !== '' && !options.includes(value));
    const selectValue = isCustom ? '其他' : value;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="space-y-2">
          <div className="relative">
            <select
              value={selectValue}
              onChange={(e) => setValue(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white appearance-none cursor-pointer ${value === '' ? 'text-gray-400' : 'text-gray-900'}`}
            >
              <option value="" disabled>請選擇{label}</option>
              {options.map(opt => (
                <option key={opt} value={opt} className="text-gray-900">{opt}</option>
              ))}
              <option value="其他" className="font-bold text-orange-600">其他 (自行輸入)</option>
            </select>
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>

          {isCustom && (
            <input
              type="text"
              value={value === '其他' ? '' : value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white animate-fade-in"
              autoFocus
            />
          )}
        </div>
      </div>
    );
  };

  // Alias for Time
  const time = jobTime;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-8 animate-fade-in relative">
       {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
           <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold">
              <CheckCircle2 size={20} />
              {notification.message}
           </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">{editingJobId ? '編輯工作' : '發布工作'}</h2>
          <p className="opacity-90 text-lg">
            {editingJobId ? '修改您的工作內容' : '填寫下方表格來尋找好幫手'}
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
           <PenTool size={32} />
        </div>
      </div>

      {/* Form Area */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100 space-y-6 relative">
          <div className="space-y-6 animate-fade-in">
            {/* Row 1: Crop & Task */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderSelectWithInput(
                '作物種類',
                crop,
                setCrop,
                CROP_OPTIONS,
                '請輸入作物名稱'
              )}
              
              {renderSelectWithInput(
                '工作項目',
                task,
                setTask,
                TASK_OPTIONS,
                '請輸入工作項目'
              )}
            </div>

            {/* Row 2: Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={jobDate}
                    onChange={(e) => setJobDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white"
                  />
                </div>
              </div>
              
              {renderSelectWithInput(
                '時間',
                jobTime,
                setJobTime,
                TIME_OPTIONS,
                '請輸入工作時間 (如: 09:00-15:00)'
              )}
            </div>

            {/* Row 3: Location (Cascading Dropdowns) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">地點 (中部地區)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* District Dropdown */}
                 <div className="relative">
                    <select
                        value={district}
                        onChange={(e) => {
                            setDistrict(e.target.value);
                            setLi(''); // Reset Li when district changes
                            setCustomLocation('');
                        }}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white appearance-none cursor-pointer ${district === '' ? 'text-gray-400' : 'text-gray-900'}`}
                    >
                        <option value="" disabled>選擇地區</option>
                        {Object.keys(REGION_DATA).filter(k => k !== '其他').map(d => (
                            <option key={d} value={d} className="text-gray-900">{d}</option>
                        ))}
                        <option value="其他" className="font-bold text-orange-600">其他地區</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                 </div>

                 {/* Li Dropdown OR Custom Input based on District */}
                 {district && district !== '其他' && (
                     renderSelectWithInput(
                        '村 / 里',
                        li,
                        setLi,
                        REGION_DATA[district] || [],
                        '請輸入村/里名稱'
                     )
                 )}
              </div>

              {/* Custom District Input */}
              {district === '其他' && (
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="請輸入完整地址 (如: 彰化縣員林市...)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white animate-fade-in"
                    autoFocus
                  />
              )}
            </div>

            {/* Row 4: Workers & Terrain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">需求人數</label>
                <input
                  type="number"
                  min="1"
                  value={requiredWorkers}
                  onChange={(e) => setRequiredWorkers(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white"
                />
              </div>

              <div className="space-y-2">
               <label className="block text-sm font-medium text-gray-700">農園地形</label>
               <div className="flex gap-4">
                 <button
                   type="button"
                   onClick={() => setTerrain('flat')}
                   className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${terrain === 'flat' ? 'border-green-500 bg-green-50 text-green-700 font-bold bg-white' : 'border-gray-200 text-gray-500 bg-white'}`}
                 >
                   <MoveHorizontal size={20} />
                   平地
                 </button>
                 <button
                   type="button"
                   onClick={() => setTerrain('slope')}
                   className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${terrain === 'slope' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold bg-white' : 'border-gray-200 text-gray-500 bg-white'}`}
                 >
                   <Mountain size={20} />
                   山坡地
                 </button>
               </div>
              </div>
            </div>

            {/* Row 5: Salary */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">薪資待遇</label>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Toggle Buttons */}
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                    <button
                        type="button"
                        onClick={() => { 
                            setSalaryType('hourly'); 
                            setSalaryAmount(HOURLY_RATES[0]); 
                        }}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${salaryType === 'hourly' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                    >
                        時薪
                    </button>
                    <button
                        type="button"
                        onClick={() => { 
                            setSalaryType('daily'); 
                            setSalaryAmount(DAILY_RATES[0]); 
                        }}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${salaryType === 'daily' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                    >
                        日薪
                    </button>
                </div>

                {/* Amount Dropdown */}
                <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(Number(e.target.value))}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-lg focus:border-orange-500 outline-none bg-white appearance-none cursor-pointer"
                    >
                        {(salaryType === 'hourly' ? HOURLY_RATES : DAILY_RATES).map(rate => (
                            <option key={rate} value={rate}>{rate}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
              </div>
            </div>

            {/* Row 6: Notes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">詳細說明 / 備註</label>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：提供午餐、需自備雨鞋、集合地點..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 resize-none text-base bg-white"
              />
            </div>
            
            {/* Submit Buttons */}
            <div className="flex gap-3">
              {editingJobId && (
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-xl shadow-sm"
                >
                  取消編輯
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-[2] bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xl disabled:opacity-50"
              >
                <CheckCircle2 size={24} />
                {isLoading ? '處理中...' : (editingJobId ? '確認修改' : '確認發布')}
              </button>
            </div>
          </div>
      </div>

      {/* Active Posts List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800 ml-1 border-l-4 border-orange-500 pl-3">已發布的工作</h3>
        {isLoading && activePosts.length === 0 ? (
          <div className="text-center py-8">載入中...</div>
        ) : activePosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400">
            尚無發布工作
          </div>
        ) : (
          activePosts.map((post) => (
            <div key={post.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${editingJobId === post.id ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100'}`}>
              <div className="p-5 relative group">
                
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button 
                    onClick={() => handleEditJob(post)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    title="編輯工作"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteJob(post.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="結束工作"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="flex justify-between items-start pr-20">
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="text-xl font-bold text-gray-900">{post.title}</h4>
                       <span className={`text-xs px-2 py-1 rounded-full font-bold ${post.currentWorkers >= post.requiredWorkers ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                         {post.currentWorkers >= post.requiredWorkers ? '已滿額' : `缺 ${post.requiredWorkers - post.currentWorkers} 人`}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 text-base text-gray-500 mt-1">
                      <MapPin size={16} />
                      {post.location}
                      {post.terrain === 'slope' ? (
                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 rounded text-xs font-bold"><Mountain size={12}/> 山坡地</span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 rounded text-xs font-bold"><MoveHorizontal size={12}/> 平地</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-base text-gray-500 mt-1">
                       <span className="flex items-center gap-1"><Calendar size={14}/> {post.date}</span>
                       <span className="flex items-center gap-1"><Clock size={14}/> {post.time}</span>
                       <span className="text-green-700 font-bold">{post.payRate}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-base bg-gray-50 p-3 rounded-lg mt-3">
                  {post.description}
                </p>

                <div className="flex gap-3 mt-4">
                  {/* Group Chat Button */}
                  <button
                    onClick={() => onOpenChat(post)}
                    className="flex-1 py-2 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 text-green-700 font-bold transition-colors"
                  >
                    <MessageCircle size={20} />
                    群組聊天
                  </button>

                  {/* View Applicants Button */}
                  <button 
                    onClick={() => toggleApplicants(post.id)}
                    className="flex-[2] py-2 flex items-center justify-center gap-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-bold transition-colors"
                  >
                    <Users size={20} />
                    {expandedJobId === post.id ? '隱藏應徵名單' : '檢視應徵人員'}
                  </button>
                </div>
              </div>

              {/* Applicant List Section */}
              {expandedJobId === post.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 rounded-b-2xl animate-fade-in">
                  <h5 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">應徵人員列表</h5>
                  {currentApplicants.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">目前尚無人應徵</p>
                  ) : (
                    <div className="space-y-3">
                      {currentApplicants.map(app => (
                        <div key={app.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           {/* Worker Profile Snapshot */}
                           <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-full">
                                <User size={24} className="text-green-700" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800 text-lg">
                                    {formatPublicName(app.workerProfileSnapshot)}
                                  </span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    信用: {app.workerProfileSnapshot.creditScore}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {app.workerProfileSnapshot.skills?.map(skill => (
                                    <span key={skill} className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded border border-blue-100">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  應徵時間: {new Date(app.appliedAt).toLocaleString('zh-TW')}
                                </div>
                              </div>
                           </div>

                           {/* Actions */}
                           <div className="flex items-center gap-2 w-full md:w-auto">
                              {app.status === ApplicationStatus.PENDING && (
                                <>
                                  <button 
                                    onClick={() => handleApplicationStatus(app.id, ApplicationStatus.REJECTED, post)}
                                    className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 font-bold flex items-center justify-center gap-1"
                                  >
                                    <X size={18} /> 婉拒
                                  </button>
                                  <button 
                                    onClick={() => handleApplicationStatus(app.id, ApplicationStatus.ACCEPTED, post)}
                                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold flex items-center justify-center gap-1"
                                  >
                                    <Check size={18} /> 接受
                                  </button>
                                </>
                              )}
                              {app.status === ApplicationStatus.ACCEPTED && (
                                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold flex items-center gap-1">
                                  <CheckCircle2 size={18} /> 已接受
                                </span>
                              )}
                              {app.status === ApplicationStatus.REJECTED && (
                                <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-bold flex items-center gap-1">
                                  <X size={18} /> 已婉拒
                                </span>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};