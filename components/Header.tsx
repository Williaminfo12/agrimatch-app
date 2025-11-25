import React from 'react';
import { ArrowLeft, Sprout, LogOut, Edit2, MessageCircle } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { formatPublicName } from '../services/authService';

interface HeaderProps {
  role: UserRole;
  onBack: () => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onProfileClick: () => void;
  onChatClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ role, onBack, userProfile, onLogout, onProfileClick, onChatClick }) => {
  const isHome = role === UserRole.NONE;

  return (
    <header className="bg-[#F1F8E9] border-b border-green-100 p-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          {!isHome && (
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-green-100 transition-colors text-green-800 mr-1"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
            <div className="bg-green-600 p-1.5 rounded-lg text-white hidden md:block">
              <Sprout size={24} />
            </div>
            <h1 className="text-2xl font-bold text-green-900 tracking-tight">農務輕鬆配</h1>
          </div>
        </div>

        {userProfile && (
           <div className="flex items-center gap-2">
             <button
               onClick={onChatClick}
               className="p-2.5 rounded-full bg-white border border-green-200 text-green-700 hover:bg-green-50 relative shadow-sm"
             >
               <MessageCircle size={20} />
             </button>

             <div className="h-8 w-[1px] bg-green-200 mx-1"></div>

             <button 
               onClick={onProfileClick}
               className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-green-100 transition-all group"
             >
               <div className="flex flex-col items-end">
                 <span className="text-green-900 font-bold text-sm md:text-base leading-tight">
                   {formatPublicName(userProfile)}
                 </span>
                 <span className="text-green-600 text-[10px] font-bold bg-green-100 px-1.5 py-0.5 rounded-full mt-0.5">
                   信用: {userProfile.creditScore}
                 </span>
               </div>
               <img 
                 src={userProfile.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                 alt="Avatar" 
                 className="w-10 h-10 rounded-full border-2 border-green-200 bg-white"
               />
             </button>
             
             <div className="h-8 w-[1px] bg-green-200 mx-1"></div>

             <button 
               onClick={onLogout}
               className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
             >
               <LogOut size={20} />
             </button>
           </div>
        )}
      </div>
    </header>
  );
};