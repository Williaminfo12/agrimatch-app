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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (currentUser) {
        setIsLoading(true);
        const userChats = await chatService.getUserChats(currentUser.uid);
        setChats(userChats);
        setIsLoading(false);
      }
    };
    fetchChats();
  }, [currentUser]);

  return (
    <div className="fixed inset-0 bg-black/20 z-40 flex justify-end animate-fade-in">
      <div className="bg-white w-full max-w-xs h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-green-600 p-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <h3 className="font-bold text-lg">我的聊天室</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-green-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center p-4 text-gray-400">載入中...</div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <MessageCircle size={48} className="opacity-20" />
              <p>目前沒有活躍的群組</p>
            </div>
          ) : (
            chats.map(job => (
              <button
                key={job.id}
                onClick={() => onSelectChat(job)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:bg-green-50 hover:border-green-200 transition-all group"
              >
                <div className="text-left">
                  <h4 className="font-bold text-gray-800 group-hover:text-green-800 line-clamp-1">
                    {job.title}
                  </h4>
                  <span className="text-xs text-gray-500 group-hover:text-green-600">
                    點擊進入群組
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-green-500" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};