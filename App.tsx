import React, { useState, useEffect } from 'react';
import { Tractor, Hammer, CloudSun, Droplets, Wind } from 'lucide-react';
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
  const [user, setUser] = useState<any>(null); // Raw auth user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSetupNeeded, setIsProfileSetupNeeded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Chat State (Global)
  const [showChatList, setShowChatList] = useState(false);
  const [activeChatJob, setActiveChatJob] = useState<JobPost | null>(null);

  // Check auth status on load
  useEffect(() => {
    const initAuth = async () => {
      const { user: storedUser, profile: storedProfile } = await authService.restoreSession();
      
      if (storedUser) {
        setUser(storedUser);
        if (storedProfile) {
          setUserProfile(storedProfile);
          setIsProfileSetupNeeded(false);
        } else {
          setIsProfileSetupNeeded(true);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = async () => {
    const { user: authUser } = await authService.signInWithGoogle();
    setUser(authUser);
    
    const profile = await authService.getProfile();
    if (profile) {
      setUserProfile(profile);
      setIsProfileSetupNeeded(false);
    } else {
      setIsProfileSetupNeeded(true);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setUserProfile(null);
    setCurrentRole(UserRole.NONE);
    setIsProfileSetupNeeded(false);
    setIsEditingProfile(false);
    setShowChatList(false);
    setActiveChatJob(null);
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsProfileSetupNeeded(false);
    setIsEditingProfile(false);
  };

  // Chat Handlers
  const handleOpenChat = (job: JobPost) => {
    setActiveChatJob(job);
    setShowChatList(false); // Close list if open
  };

  // Render Logic
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;

  // 1. Not Logged In -> Login Screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // 2. Logged In but No Profile -> Setup Screen
  if (isProfileSetupNeeded) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  // 3. Editing Profile -> Setup Screen (with initial data)
  if (isEditingProfile) {
    return (
      <ProfileSetup 
        initialData={userProfile}
        onComplete={handleProfileComplete}
        onCancel={() => setIsEditingProfile(false)}
      />
    );
  }

  // 4. Logged In & Profile Ready -> Main App
  const renderContent = () => {
    if (!userProfile) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
           <p className="text-gray-500">載入個人資料中...</p>
        </div>
      );
    }

    switch (currentRole) {
      case UserRole.OWNER:
        return <OwnerDashboard userProfile={userProfile} onOpenChat={handleOpenChat} />;
      case UserRole.WORKER:
        return <WorkerDashboard userProfile={userProfile} onOpenChat={handleOpenChat} />;
      default:
        return (
          <div className="flex flex-col h-full pb-8 px-4 md:px-8 max-w-5xl mx-auto w-full">
            
            {/* Welcome & Weather Widget Section */}
            <div className="py-6 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  早安，{formatPublicName(userProfile)}
                </h2>
                <p className="text-gray-500 mt-1">今天想處理什麼農務呢？</p>
              </div>

              {/* Mock Weather Widget */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-400 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 text-blue-100 font-medium text-sm mb-1">
                       <MapPinIcon className="w-4 h-4"/> 台中市, 東勢區
                    </div>
                    <div className="text-5xl font-bold mb-2">28°C</div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                       <span className="flex items-center gap-1"><CloudSun size={18}/> 多雲時晴</span>
                       <span className="flex items-center gap-1"><Droplets size={18}/> 濕度 65%</span>
                       <span className="flex items-center gap-1"><Wind size={18}/> 微風</span>
                    </div>
                 </div>
                 <div className="relative z-10">
                    <CloudSun size={80} className="text-yellow-300 opacity-90" />
                 </div>
                 <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Role Selection Cards */}
            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[300px]">
              <RoleCard
                title="我是園主 🍇"
                icon={Tractor}
                colorHex={THEME_COLORS.OWNER}
                onClick={() => setCurrentRole(UserRole.OWNER)}
                description="發布工作、管理農務、AI 協助撰寫徵才文案"
              />
              <RoleCard
                title="我是工人 👷"
                icon={Hammer}
                colorHex={THEME_COLORS.WORKER}
                onClick={() => setCurrentRole(UserRole.WORKER)}
                description="尋找工作、檢視薪資、AI 安全作業提醒"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-slate-50 flex flex-col font-sans relative">
      <Header 
        role={currentRole} 
        onBack={() => setCurrentRole(UserRole.NONE)} 
        userProfile={userProfile}
        onLogout={handleLogout}
        onProfileClick={() => setIsEditingProfile(true)}
        onChatClick={() => setShowChatList(true)}
      />
      
      {/* Global Chat List Modal */}
      {showChatList && userProfile && (
        <ChatList 
          currentUser={userProfile} 
          onClose={() => setShowChatList(false)}
          onSelectChat={handleOpenChat}
        />
      )}

      {/* Global Chat Room Modal */}
      {activeChatJob && userProfile && (
        <ChatRoom 
          jobId={activeChatJob.id}
          jobTitle={activeChatJob.title}
          currentUser={userProfile}
          currentRole={currentRole === UserRole.NONE ? UserRole.WORKER : currentRole} 
          onClose={() => setActiveChatJob(null)}
        />
      )}
      
      <main className="flex-1 w-full mx-auto transition-all duration-500 ease-in-out">
        {currentRole === UserRole.NONE ? (
           renderContent()
        ) : (
           <div className="py-6">
             {renderContent()}
           </div>
        )}
      </main>
    </div>
  );
}

function MapPinIcon({className}: {className?: string}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  )
}