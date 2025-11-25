import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ChevronRight } from 'lucide-react';
import { JobPost, UserProfile } from '../types';
import { chatService } from '../services/chatService';

interface ChatListProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSelectChat: (job: JobPost) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ currentUser, onClose, onSelectChat }) => {
  const [chats, setChats] = useState<JobPost[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await chatService.getUserChats(currentUser.uid);
      setChats(userChats);
    };
    fetchChats();
  }, [currentUser]);

  return (
    <div className="fixed inset-0 bg-black/20 z-40 flex justify-end">
      <div className="bg-white w-full max-w-xs h-full shadow-2xl flex flex-col">
        <div className="bg-green-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold">我的聊天室</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chats.length === 0 ? <p className="text-center text-gray-400 mt-10">無聊天室</p> : chats.map(job => (
             <button key={job.id} onClick={() => onSelectChat(job)} className="w-full bg-white p-4 border-b flex justify-between hover:bg-green-50">
                <span className="font-bold">{job.title}</span>
                <ChevronRight size={18} className="text-gray-300" />
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};