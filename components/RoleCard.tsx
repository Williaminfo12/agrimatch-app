import React from 'react';
import { LucideIcon } from 'lucide-react';

interface RoleCardProps {
  title: string;
  icon: LucideIcon;
  colorHex: string;
  onClick: () => void;
  description: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({ 
  title, 
  icon: Icon, 
  colorHex, 
  onClick,
  description
}) => {
  return (
    <button
      onClick={onClick}
      className="group relative w-full flex-1 flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-95 overflow-hidden"
      style={{ backgroundColor: colorHex }} // Using style for precise hex matching from prompt
    >
      {/* Decorative background circles */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl transition-all group-hover:opacity-20" />
      <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-black opacity-5 rounded-full blur-xl" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        <div className="p-6 bg-white/20 rounded-full backdrop-blur-sm shadow-inner border border-white/30">
          <Icon size={64} color="white" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h2 
            className="text-4xl font-bold text-white drop-shadow-md"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}
          >
            {title}
          </h2>
          <p className="text-white/90 text-lg font-medium">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};