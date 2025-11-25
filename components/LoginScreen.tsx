import React, { useState } from 'react';
import { Sprout, Loader2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'config' | 'domain' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);
    
    try {
        await onLogin();
    } catch (e: any) {
        console.error("Login Error:", e);
        if (e.code === 'auth/configuration-not-found') {
          setErrorMessage("Google 登入功能尚未啟用");
          setErrorType('config');
        } else if (e.code === 'auth/popup-closed-by-user') {
          setErrorMessage("登入已取消");
        } else if (e.code === 'auth/unauthorized-domain') {
          setErrorMessage("網域未授權：Firebase 拒絕了來自此網址的登入請求");
          setErrorType('domain');
        } else if (e.code === 'auth/operation-not-allowed') {
           setErrorMessage("登入方式未啟用 (請檢查 Email/Password 或 Google 設定)");
           setErrorType('config');
        } else {
          setErrorMessage("登入失敗：" + (e.message || "請檢查網路連線"));
        }
    } finally {
        setIsLoading(false);
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(window.location.hostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Error Message & Action */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-left border border-red-100">
             <div className="flex gap-3 items-start mb-2">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div className="font-bold">{errorMessage}</div>
             </div>
             
             {errorType === 'domain' && (
               <div className="mt-3 ml-1 bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                 <p className="text-xs text-gray-600 mb-2 font-medium">請依照以下步驟解決：</p>
                 <ol className="list-decimal ml-4 text-xs text-gray-500 space-y-1 mb-3">
                    <li>複製下方的目前網域</li>
                    <li>點擊按鈕前往 Firebase Console</li>
                    <li>至 <b>Authentication</b> &gt; <b>Settings</b> &gt; <b>Authorized domains</b></li>
                    <li>點擊 <b>Add domain</b> 並貼上網域</li>
                 </ol>
                 
                 <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-gray-100 px-2 py-1.5 rounded text-xs font-mono border border-gray-200 truncate">
                        {window.location.hostname}
                    </div>
                    <button 
                        onClick={copyDomain}
                        className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded text-xs font-bold transition-colors"
                        title="複製網域"
                    >
                        {copied ? <Check size={14}/> : <Copy size={14}/>}
                        {copied ? '已複製' : '複製'}
                    </button>
                 </div>

                 <a 
                   href="https://console.firebase.google.com/project/agrimatch-6abd5/authentication/settings"
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 w-full bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                 >
                   前往 Firebase 設定頁面 <ExternalLink size={12} />
                 </a>
               </div>
             )}

             {errorType === 'config' && (
               <div className="mt-3 ml-8">
                 <p className="text-xs text-gray-500 mb-2">
                   請前往 Firebase Console -> Authentication -> Sign-in method 並啟用 <b>Google</b>。
                 </p>
                 <a 
                   href="https://console.firebase.google.com/project/agrimatch-6abd5/authentication/providers" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs font-bold bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                 >
                   前往設定頁面 <ExternalLink size={12} />
                 </a>
               </div>
             )}
          </div>
        )}

        {/* Login Button */}
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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