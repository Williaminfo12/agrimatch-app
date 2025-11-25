import React, { useState } from 'react';
import { Sprout, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
        await onLogin();
    } catch (e) {
        console.error(e);
        alert("登入失敗，請檢查網路連線");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F8E9] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center space-y-8 animate-fade-in">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-green-600 p-4 rounded-2xl shadow-lg text-white transform rotate-3 hover:rotate-0 transition-all duration-500">
            <Sprout size={64} />
          </div>
          <h1 className="text-3xl font-bold text-green-900 tracking-tight">
            農務輕鬆配
          </h1>
          <p className="text-gray-500 font-medium">
            智慧媒合，農務更輕鬆
          </p>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin text-green-600" />
            ) : (
              <img 
                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                alt="Google" 
                className="w-6 h-6" 
              />
            )}
            <span className="text-lg">使用 Google 帳號登入</span>
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
            登入即代表您同意我們的服務條款與隱私權政策
          </p>
        </div>
      </div>
    </div>
  );
};