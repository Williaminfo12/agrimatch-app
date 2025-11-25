import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Tractor, Hammer } from 'lucide-react';
import { ChatMessage, UserProfile, UserRole } from '../types';
import { chatService } from '../services/chatService';

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

  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(jobId, setMessages);
    return () => unsubscribe();
  }, [jobId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await chatService.sendMessage(jobId, currentUser, currentRole, inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-green-600 p-4 flex justify-between text-white">
          <h3 className="font-bold">{jobTitle}</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map(msg => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.senderRole === UserRole.OWNER ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {msg.senderRole === UserRole.OWNER ? <Tractor size={14}/> : <Hammer size={14}/>}
                 </div>
                 <div className={`px-3 py-2 rounded-xl max-w-[70%] text-sm ${isMe ? 'bg-green-600 text-white' : 'bg-white border'}`}>
                    {msg.content}
                 </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 bg-white border-t flex gap-2">
           <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="輸入訊息..." className="flex-1 bg-gray-100 rounded-full px-4 py-2" />
           <button onClick={handleSend} className="p-2 bg-green-600 text-white rounded-full"><Send size={20}/></button>
        </div>
      </div>
    </div>
  );
};