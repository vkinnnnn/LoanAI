import React from 'react';
import { ViewMode } from '../types';
import { Mic, FileUp, Layout, Bot, Settings, Menu, Sun, Moon, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  hasDocuments: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, toggleSidebar, theme, toggleTheme, hasDocuments }) => {
  const menuItems = [
    { id: ViewMode.TALK_TO_DOCS, label: 'Talk to Docs', icon: Mic, desc: 'Voice Agent Analysis' },
    { id: ViewMode.UPLOAD, label: 'Upload', icon: FileUp, desc: 'Ingest Loan Data' },
    { id: ViewMode.INTEGRATOR, label: 'Integrator', icon: Layout, desc: 'Deep Analysis' },
  ];

  return (
    <motion.div 
      className={`h-screen bg-surface border-r border-border flex flex-col z-20 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}
      initial={false}
    >
      <div className={`p-4 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} border-b border-border h-16`}>
        {isOpen && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }}
             className="flex items-center gap-2"
           >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="text-white w-5 h-5" />
             </div>
             <span className="font-bold text-lg tracking-tight text-text">LoanAI</span>
           </motion.div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-surfaceHighlight rounded-md text-textMuted hover:text-text transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const isRestricted = !hasDocuments && item.id !== ViewMode.UPLOAD;
          
          return (
            <button
              key={item.id}
              onClick={() => !isRestricted && onViewChange(item.id)}
              disabled={isRestricted}
              className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : isRestricted 
                    ? 'opacity-40 cursor-not-allowed grayscale' 
                    : 'hover:bg-surfaceHighlight text-textMuted hover:text-text'
              }`}
              title={isRestricted ? "Upload documents first" : (!isOpen ? item.label : undefined)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <item.icon className={`w-5 h-5 z-10 ${isActive ? 'text-primary' : ''}`} />
              
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-left z-10 flex-1"
                >
                  <div className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</div>
                  <div className="text-[10px] opacity-60">{item.desc}</div>
                </motion.div>
              )}

              {isOpen && isRestricted && (
                  <Lock className="w-3.5 h-3.5 text-textMuted absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
         {/* Theme Toggle */}
         <button 
            onClick={toggleTheme}
            className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-text transition-colors`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
         >
             {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
             {isOpen && <span className="text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>}
         </button>

         {/* Settings */}
         <button className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-text transition-colors`}>
            <Settings className="w-5 h-5" />
            {isOpen && <span className="text-sm">Settings</span>}
         </button>

         {isOpen && (
           <div className="mt-4 px-2">
             <div className="text-xs text-textMuted/70 border border-border p-2 rounded bg-background/50">
               Backend: <span className="text-green-500">Connected (v1.0.4)</span>
               <br/>
               Model: <span className="text-accent">Gemini 3 Pro</span>
             </div>
           </div>
         )}
      </div>
    </motion.div>
  );
};

export default Sidebar;