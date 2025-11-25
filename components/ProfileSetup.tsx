import React, { useState, useEffect } from 'react';
import { UserProfile, Nationality } from '../types';
import { authService } from '../services/authService';
import { User, Phone, CheckCircle2, Loader2, X } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const profile = await authService.saveProfile(formData);
    onComplete(profile);
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-8 relative">
        {onCancel && <button onClick={onCancel} className="absolute top-4 right-4"><X/></button>}
        <h2 className="text-2xl font-bold mb-6 text-center">{initialData ? '編輯檔案' : '建立檔案'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block font-bold">姓名</label><input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
          <div><label className="block font-bold">電話</label><input type="tel" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
          <button type="submit" disabled={isSaving} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle2/>} {initialData ? '儲存' : '完成'}
          </button>
        </form>
      </div>
    </div>
  );
};