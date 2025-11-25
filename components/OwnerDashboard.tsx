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

const CROP_OPTIONS = ['葡萄', '水梨', '柿子', '草莓', '高接梨', '柑橘', '火龍果', '甜桃'];
const TASK_OPTIONS = ['套袋', '剪枝', '採收', '噴藥', '除草', '搬運', '包裝', '疏果'];
const TIME_OPTIONS = ['08:00 - 17:00 (全天)', '08:00 - 12:00 (上午)', '13:00 - 17:00 (下午)', '06:00 - 10:00 (清晨)'];

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

const HOURLY_RATES = Array.from({ length: 91 }, (_, i) => 100 + i * 10);
const DAILY_RATES = Array.from({ length: 41 }, (_, i) => 1000 + i * 100);

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ userProfile, onOpenChat }) => {
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePosts, setActivePosts] = useState<JobPost[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [currentApplicants, setCurrentApplicants] = useState<JobApplication[]>([]);
  
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [crop, setCrop] = useState('');
  const [task, setTask] = useState('');
  const [district, setDistrict] = useState('');
  const [li, setLi] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [salaryType, setSalaryType] = useState<'hourly' | 'daily'>('daily');
  const [salaryAmount, setSalaryAmount] = useState<number>(1500);
  const [requiredWorkers, setRequiredWorkers] = useState(1);
  const [description, setDescription] = useState('');
  const [terrain, setTerrain] = useState<'flat' | 'slope'>('flat');
  const [jobDate, setJobDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [jobTime, setJobTime] = useState('');

  useEffect(() => { refreshJobs(); }, [userProfile?.uid]);

  const refreshJobs = async () => {
    if (!userProfile?.uid) return;
    setIsLoading(true);
    const allJobs = await jobService.getJobs();
    setActivePosts(allJobs.filter(job => job.ownerId === userProfile.uid));
    setIsLoading(false);
  };

  const showNotification = (message: string) => {
    setNotification({ message, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditJob = (job: JobPost) => {
    setEditingJobId(job.id);
    setCrop(job.crop);
    setTask(job.task);
    
    if (job.salaryType === '時薪' || job.payRate.includes('時薪')) {
        setSalaryType('hourly');
        setSalaryAmount(job.salaryAmount || 183);
    } else {
        setSalaryType('daily');
        setSalaryAmount(job.salaryAmount || 1500);
    }

    if (job.locationDistrict && REGION_DATA[job.locationDistrict]) {
      setDistrict(job.locationDistrict);
      setLi(job.location.replace(job.locationDistrict, '')); 
    } else {
      setDistrict('其他');
      setCustomLocation(job.location);
    }

    setRequiredWorkers(job.requiredWorkers);
    setDescription(job.description);
    setJobDate(job.date);
    setJobTime(job.time || '');
    setTerrain(job.terrain || 'flat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!crop || !task || !salaryAmount) return alert("請填寫完整資訊");

    let finalLocation = '';
    let finalDistrict = '';

    if (district === '其他') {
      if (!customLocation) return alert("請輸入地址");
      finalLocation = customLocation;
      finalDistrict = '其他';
    } else if (district) {
      if (!li || li === '其他') return alert("請選擇村/里");
      finalDistrict = district;
      finalLocation = district + li; 
    } else {
      return alert("請選擇地點");
    }

    const payString = `${salaryType === 'hourly' ? '時薪' : '日薪'} ${salaryAmount}`;
    const jobData: JobPost = {
      id: editingJobId || '',
      ownerId: userProfile?.uid,
      ownerCreditScore: userProfile?.creditScore || 4.8,
      status: 'active',
      title: `${crop} - ${task}`,
      crop,
      task,
      description: description || `徵求${crop}${task}人員，薪資${payString}。`,
      payRate: payString,
      salaryType: salaryType === 'hourly' ? '時薪' : '日薪',
      salaryAmount,
      location: finalLocation,
      locationDistrict: finalDistrict,
      requiredWorkers,
      currentWorkers: editingJobId ? activePosts.find(j => j.id === editingJobId)?.currentWorkers || 0 : 0,
      date: jobDate,
      time: jobTime || '全天',
      terrain,
    };

    setIsLoading(true);
    if (editingJobId) {
      await jobService.updateJob(jobData);
      showNotification('工作更新成功');
      setEditingJobId(null);
    } else {
      await jobService.addJob(jobData);
      showNotification('工作發布成功');
    }
    await refreshJobs();
    setIsLoading(false);
  };

  const renderSelectWithInput = (label: string, value: string, setValue: (val: string) => void, options: string[], ph: string) => {
    const isCustom = value === '其他' || (value !== '' && !options.includes(value));
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="space-y-2">
          <div className="relative">
            <select value={isCustom ? '其他' : value} onChange={(e) => setValue(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white appearance-none">
              <option value="" disabled>請選擇</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
              <option value="其他">其他</option>
            </select>
            <ChevronDown className="absolute right-4 top-3 text-gray-400 pointer-events-none" size={20} />
          </div>
          {isCustom && <input type="text" value={value === '其他' ? '' : value} onChange={(e) => setValue(e.target.value)} placeholder={ph} className="w-full px-4 py-3 rounded-xl border border-gray-200" />}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-8 animate-fade-in relative">
      {notification && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full">{notification.message}</div>}

      <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div><h2 className="text-3xl font-bold">{editingJobId ? '編輯工作' : '發布工作'}</h2></div>
        <PenTool size={32} />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {renderSelectWithInput('作物種類', crop, setCrop, CROP_OPTIONS, '輸入作物')}
             {renderSelectWithInput('工作項目', task, setTask, TASK_OPTIONS, '輸入工作')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">日期</label>
                <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
              </div>
              {renderSelectWithInput('時間', jobTime, setJobTime, TIME_OPTIONS, '輸入時間')}
          </div>
          
          <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">地點</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative">
                    <select value={district} onChange={(e) => { setDistrict(e.target.value); setLi(''); setCustomLocation(''); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 appearance-none bg-white">
                        <option value="" disabled>選擇地區</option>
                        {Object.keys(REGION_DATA).filter(k => k !== '其他').map(d => <option key={d} value={d}>{d}</option>)}
                        <option value="其他">其他地區</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3 text-gray-400" size={20} />
                 </div>
                 {district && district !== '其他' && renderSelectWithInput('村/里', li, setLi, REGION_DATA[district] || [], '輸入村里')}
              </div>
              {district === '其他' && <input type="text" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} placeholder="輸入完整地址" className="w-full px-4 py-3 rounded-xl border border-gray-200" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">人數</label>
                <input type="number" min="1" value={requiredWorkers} onChange={(e) => setRequiredWorkers(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
             </div>
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">地形</label>
                <div className="flex gap-4">
                    <button onClick={() => setTerrain('flat')} className={`flex-1 py-3 rounded-xl border-2 ${terrain === 'flat' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>平地</button>
                    <button onClick={() => setTerrain('slope')} className={`flex-1 py-3 rounded-xl border-2 ${terrain === 'slope' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>山坡</button>
                </div>
             </div>
          </div>

          <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-700">薪資</label>
             <div className="flex gap-4">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                   <button onClick={() => { setSalaryType('hourly'); setSalaryAmount(HOURLY_RATES[0]); }} className={`px-4 py-2 rounded-lg ${salaryType === 'hourly' ? 'bg-white shadow' : ''}`}>時薪</button>
                   <button onClick={() => { setSalaryType('daily'); setSalaryAmount(DAILY_RATES[0]); }} className={`px-4 py-2 rounded-lg ${salaryType === 'daily' ? 'bg-white shadow' : ''}`}>日薪</button>
                </div>
                <div className="relative flex-1">
                   <select value={salaryAmount} onChange={(e) => setSalaryAmount(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 appearance-none bg-white">
                      {(salaryType === 'hourly' ? HOURLY_RATES : DAILY_RATES).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-3 text-gray-400" size={20} />
                </div>
             </div>
          </div>

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="備註..." className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200" />
          
          <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg">
             {editingJobId ? '確認修改' : '確認發布'}
          </button>
      </div>

      <div className="space-y-4">
         <h3 className="text-2xl font-bold border-l-4 border-orange-500 pl-3">已發布工作</h3>
         {activePosts.map(post => (
             <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative">
                 <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleEditJob(post)}><Edit2 size={20} className="text-blue-500" /></button>
                 </div>
                 <h4 className="text-xl font-bold">{post.title}</h4>
                 <p className="text-gray-500">{post.location} | {post.date}</p>
                 <div className="flex gap-3 mt-4">
                    <button onClick={() => onOpenChat(post)} className="flex-1 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200 flex justify-center items-center gap-2"><MessageCircle size={20}/> 群組</button>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
};