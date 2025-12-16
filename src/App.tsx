import React, { useState, useEffect } from 'react';
import { AppMode, type InterviewFlow } from './types';
import AdminPanel from './components/AdminPanel';
import InterviewSession from './components/InterviewSession';
import { Mic, Shield, Users, ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [currentFlow, setCurrentFlow] = useState<InterviewFlow | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Persistence
  const saveFlow = (flow: InterviewFlow) => {
    localStorage.setItem('vocalflow_active_flow', JSON.stringify(flow));
    setCurrentFlow(flow);
    setMode(AppMode.HOME);
  };

  const loadFlow = () => {
    const stored = localStorage.getItem('vocalflow_active_flow');
    if (stored) {
      setCurrentFlow(JSON.parse(stored));
      return true;
    }
    return false;
  };

  const startInterview = () => {
    if (loadFlow()) {
      setMode(AppMode.INTERVIEW);
    } else {
      alert("No interview flow has been set up yet. Please enter Admin mode to create one.");
    }
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.ADMIN:
        return (
          <AdminPanel 
            onBack={() => setMode(AppMode.HOME)} 
            onSaveFlow={saveFlow}
            existingFlow={currentFlow || (localStorage.getItem('vocalflow_active_flow') ? JSON.parse(localStorage.getItem('vocalflow_active_flow')!) : null)}
          />
        );
      
      case AppMode.INTERVIEW:
        if (!currentFlow) {
           if(loadFlow() && currentFlow) return <InterviewSession flow={currentFlow} onComplete={() => setMode(AppMode.HOME)} onExit={() => setMode(AppMode.HOME)} />;
           return <div className="text-center p-10 font-display text-xl">Loading configuration...</div>;
        }
        return (
          <InterviewSession 
            flow={currentFlow} 
            onComplete={() => {
              alert("Interview Completed! Results have been sent to the webhook.");
              setMode(AppMode.HOME);
            }} 
            onExit={() => setMode(AppMode.HOME)}
          />
        );

      case AppMode.HOME:
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-yellow/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Sparkles size={16} />
                <span className="text-sm font-medium tracking-wide">AI-Powered Interview Platform</span>
              </div>

              <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter mb-6 dark:text-white text-black animate-in fade-in slide-in-from-bottom-6 duration-700">
                Vocal<span className="text-brand-yellow">Flow</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-900">
                Streamline your hiring process with automated video interviews. 
                Record questions, collect responses, and get instant AI analysis.
              </p>

              <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <button 
                  onClick={() => setMode(AppMode.ADMIN)}
                  className="group relative overflow-hidden p-1 rounded-2xl transition-all hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700 transition-colors group-hover:border-brand-yellow/50"></div>
                  <div className="relative h-full bg-white dark:bg-gray-950 p-8 rounded-xl flex flex-col items-start text-left">
                     <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg group-hover:bg-brand-yellow group-hover:text-black transition-colors dark:text-white text-black">
                      <Shield size={28} />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2 dark:text-white text-black">Admin Access</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Configure flows, record prompts & set webhooks.</p>
                  </div>
                </button>

                <button 
                  onClick={startInterview}
                  className="group relative overflow-hidden p-1 rounded-2xl transition-all hover:scale-[1.01] hover:shadow-[0_0_40px_-10px_rgba(250,204,21,0.3)]"
                >
                  <div className="absolute inset-0 bg-brand-yellow rounded-2xl"></div>
                  <div className="relative h-full bg-brand-yellow p-8 rounded-xl flex flex-col items-start text-left">
                     <div className="mb-4 p-3 bg-black/10 rounded-lg text-black">
                      <Users size={28} />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2 text-black">Start Interview</h3>
                    <p className="text-black/70 text-sm font-medium">Enter as a candidate and record your video answers.</p>
                    <div className="mt-auto pt-6 flex items-center gap-2 font-bold text-black">
                      Begin Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300 font-sans selection:bg-brand-yellow selection:text-black">
      {/* Background Texture */}
      <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

      {/* Header */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setMode(AppMode.HOME)}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center text-black shadow-[0_0_15px_-3px_rgba(250,204,21,0.4)] transition-transform group-hover:rotate-6">
              <Mic size={22} className="stroke-[2.5px]" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight dark:text-white text-black">
              Vocal<span className="text-brand-yellow">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">

             
             <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle Theme"
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;