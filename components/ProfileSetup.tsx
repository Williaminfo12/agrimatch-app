import React, { useState, useEffect } from 'react';
import { UserProfile, Nationality } from '../types';
import { authService } from '../services/authService';
import { User, Phone, Globe, Trees, Hammer, CheckCircle2, Loader2, X } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  initialData?: UserProfile | null;
  onCancel?: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, initialData, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male' as 'male' | 'female',
    phoneNumber: '',
    nationality: Nationality.TAIWAN,
    ownedOrchards: '',
    skills: [] as string[],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        gender: initialData.gender,
        phoneNumber: initialData.phoneNumber,
        nationality: initialData.nationality,
        ownedOrchards: initialData.ownedOrchards || '',
        skills: initialData.skills || [],
      });
    }
  }, [initialData]);

  // Popular agricultural skills
  const AVAILABLE_SKILLS = ['套袋', '剪枝', '嫁接', '採收', '噴藥', '除草', '搬運', '包裝'];

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phoneNumber) return;

    setIsSaving(true);
    try {
      const profile = await authService.saveProfile(formData);
      onComplete(profile);
    } catch (error) {
      console.error("Save failed", error);
      alert("儲存失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden relative animate-fade-in">
        
        {onCancel && (
           <button 
             onClick={onCancel}
             className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full z-10 transition-colors"
           >
             <X size={20} />
           </button>
        )}

        {/* Header */}
        <div className="bg-green-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            {isEditMode ? '編輯個人檔案' : '建立個人檔案'}
          </h2>
          <p className="text-green-100 opacity-90">
            {isEditMode ? '隨時更新您的最新資訊' : '請完善您的資料以開始媒合'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Private Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <span className="bg-red-50 text-red-500 px-2 py-1 rounded">私密資訊</span>
              <span>僅用於系統驗證與必要聯絡</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">真實姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none bg-white"
                    placeholder="例如：王小明"
                  />
                </div>
                <p className="text-xs text-gray-400">公開時僅顯示姓氏 (例如: 王先生)</p>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">性別</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'male'})}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.gender === 'male' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    先生
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, gender: 'female'})}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${formData.gender === 'female' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500'}`}
                  >
                    小姐
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">聯絡電話</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none bg-white"
                    placeholder="09xx-xxx-xxx"
                  />
                </div>
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">國籍</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={formData.nationality}
                    onChange={e => setFormData({...formData, nationality: e.target.value as Nationality})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none bg-white appearance-none"
                  >
                    {Object.values(Nationality).map(nat => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Public Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <span className="bg-green-50 text-green-600 px-2 py-1 rounded">公開資訊</span>
              <span>顯示於媒合列表</span>
            </div>

            {/* Owned Orchards (Optional) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">擁有果園 (園主選填)</label>
              <div className="relative">
                <Trees className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.ownedOrchards}
                  onChange={e => setFormData({...formData, ownedOrchards: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none bg-white"
                  placeholder="例如：葡萄園, 高接梨園"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Hammer size={16} /> 
                擅長工作 (可複選)
              </label>
              <div className="flex flex-wrap gap-3 mt-2">
                {AVAILABLE_SKILLS.map(skill => {
                  const isSelected = formData.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all
                        ${isSelected 
                          ? 'border-green-500 bg-green-50 text-green-700 bg-white' 
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xl transition-all mt-8"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {isEditMode ? '儲存變更' : '完成設定'}
          </button>

        </form>
      </div>
    </div>
  );
};