import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, Tractor, Hammer } from 'lucide-react';
import { ChatMessage, UserProfile, UserRole } from '../types';
import { chatService } from '../services/chatService';
import { formatPublicName } from '../services/authService';

interface ChatRoomProps {
  jobId: string;
  jobTitle: string;
  currentUser: UserProfile;
  currentRole: UserRole;
  onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ jobId, jobTitle, currentUser, currentRole, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(jobId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [jobId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const text = inputText;
    setInputText(''); // Clear UI immediately
    
    await chatService.sendMessage(jobId, currentUser, currentRole, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-green-600 p-4 flex justify-between items-center text-white shadow-md">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {jobTitle}
            </h3>
            <span className="text-xs text-green-100 bg-green-700 px-2 py-0.5 rounded-full">
              工作群組
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-green-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
               <p>群組已建立</p>
               <p className="text-sm">開始討論工作細節吧！</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.uid;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.senderRole === UserRole.OWNER ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {msg.senderRole === UserRole.OWNER ? <Tractor size={16} /> : <Hammer size={16} />}
                  </div>
                  
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                      {msg.senderName === currentUser.fullName ? '我' : formatPublicName({ ...currentUser, fullName: msg.senderName, gender: 'male' } as any)}
                    </span>
                    <div 
                      className={`px-4 py-2 rounded-2xl text-base leading-relaxed shadow-sm
                        ${isMe 
                          ? 'bg-green-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                      {new Date(msg.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-end gap-2 bg-gray-100 p-2 rounded-2xl">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入訊息..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 p-2 text-gray-800"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm mb-0.5"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};