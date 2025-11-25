import React, { useState, useEffect } from 'react';
import { Tractor, Hammer } from 'lucide-react';
import { UserRole, THEME_COLORS, UserProfile, JobPost } from './types';
import { authService, formatPublicName } from './services/authService';
import { Header } from './components/Header';
import { RoleCard } from './components/RoleCard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { ChatList } from './components/ChatList';
import { ChatRoom } from './components/ChatRoom';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.NONE);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSetupNeeded, setIsProfileSetupNeeded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [activeChatJob, setActiveChatJob] = useState<JobPost | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { user: storedUser, profile: storedProfile } = await authService.restoreSession();
      if (storedUser) {
        setUser(storedUser);
        if (storedProfile) { setUserProfile(storedProfile); setIsProfileSetupNeeded(false); }
        else { setIsProfileSetupNeeded(true); }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const handleLogin = async () => {
    const { user: authUser } = await authService.signInWithGoogle();
    setUser(authUser);
    const profile = await authService.getProfile();
    if (profile) { setUserProfile(profile); setIsProfileSetupNeeded(false); }
    else { setIsProfileSetupNeeded(true); }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null); setUserProfile(null); setCurrentRole(UserRole.NONE);
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile); setIsProfileSetupNeeded(false); setIsEditingProfile(false);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <LoginScreen onLogin={handleLogin} />;
  if (isProfileSetupNeeded || isEditingProfile) return <ProfileSetup initialData={isEditingProfile ? userProfile : null} onComplete={handleProfileComplete} onCancel={isEditingProfile ? () => setIsEditingProfile(false) : undefined} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Header role={currentRole} onBack={() => setCurrentRole(UserRole.NONE)} userProfile={userProfile} onLogout={handleLogout} onProfileClick={() => setIsEditingProfile(true)} onChatClick={() => setShowChatList(true)} />
      
      {showChatList && userProfile && <ChatList currentUser={userProfile} onClose={() => setShowChatList(false)} onSelectChat={(job) => { setActiveChatJob(job); setShowChatList(false); }} />}
      {activeChatJob && userProfile && <ChatRoom jobId={activeChatJob.id} jobTitle={activeChatJob.title} currentUser={userProfile} currentRole={currentRole === UserRole.NONE ? UserRole.WORKER : currentRole} onClose={() => setActiveChatJob(null)} />}
      
      <main className="flex-1 w-full mx-auto">
        {currentRole === UserRole.NONE ? (
          <div className="flex flex-col h-full pb-8 px-4 max-w-5xl mx-auto w-full pt-10 gap-6">
             <h2 className="text-3xl font-bold">早安，{formatPublicName(userProfile)}</h2>
             <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[300px]">
              <RoleCard title="我是園主" icon={Tractor} colorHex={THEME_COLORS.OWNER} onClick={() => setCurrentRole(UserRole.OWNER)} description="發布工作、管理農務" />
              <RoleCard title="我是工人" icon={Hammer} colorHex={THEME_COLORS.WORKER} onClick={() => setCurrentRole(UserRole.WORKER)} description="尋找工作、檢視薪資" />
             </div>
          </div>
        ) : currentRole === UserRole.OWNER ? <OwnerDashboard userProfile={userProfile} onOpenChat={(job) => { setActiveChatJob(job); }} /> : <WorkerDashboard userProfile={userProfile} onOpenChat={(job) => { setActiveChatJob(job); }} />}
      </main>
    </div>
  );
}