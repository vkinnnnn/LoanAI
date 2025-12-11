
import React from 'react';
import { ViewMode } from '../types';
import { FileUp, Bot, Settings, Menu, Sun, Moon, Lock, ScanEye } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  hasDocuments: boolean;
  onLogoClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, toggleSidebar, theme, toggleTheme, hasDocuments, onLogoClick }) => {
  const menuItems = [
    { id: ViewMode.ASSISTANT, label: 'Loan Assistant', icon: Bot, desc: 'Voice & Text Intelligence' },
    { id: ViewMode.UPLOAD, label: 'Upload Documents', icon: FileUp, desc: 'Ingest Loan Data' },
  ];

  return (
    <motion.div 
      className={`h-screen bg-surface/95 backdrop-blur-xl border-r border-border flex flex-col z-20 transition-all duration-500 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}
      initial={false}
    >
      {/* Brand Header */}
      <div className={`p-4 flex ${isOpen ? 'flex-row items-center justify-between' : 'flex-col items-center gap-6'} mb-2 transition-all duration-300`}>
        <button 
            onClick={onLogoClick}
            className={`flex items-center gap-3 group focus:outline-none ${!isOpen ? 'justify-center w-full mt-2' : ''}`}
            title="Back to Landing Page"
        >
            {/* Logo Icon */}
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
                <div className="relative bg-surfaceHighlight/50 border border-white/10 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner overflow-hidden group-hover:border-primary/50 transition-colors">
                     <ScanEye className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
            </div>

            {/* Logo Text */}
            {isOpen && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }}
                 className="flex flex-col items-start"
               >
                 <div className="flex items-center">
                    <span className="font-bold text-xl tracking-tight text-text leading-none font-sans">Loan</span>
                    <span className="font-bold text-xl tracking-tight text-primary leading-none font-sans">Sight</span>
                 </div>
                 <span className="text-[9px] text-textMuted font-mono tracking-[0.25em] uppercase leading-none mt-1 group-hover:text-primary/70 transition-colors">
                    Intelligence
                 </span>
               </motion.div>
            )}
        </button>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg text-textMuted hover:text-text hover:bg-surfaceHighlight transition-all duration-200 active:scale-95 ${!isOpen ? '' : ''}`}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-2 px-3 space-y-1 mt-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const isRestricted = !hasDocuments && item.id !== ViewMode.UPLOAD;
          
          return (
            <button
              key={item.id}
              onClick={() => !isRestricted && onViewChange(item.id)}
              disabled={isRestricted}
              className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-300 group relative overflow-hidden outline-none ${
                isActive 
                  ? 'text-primary' 
                  : isRestricted 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'text-textMuted hover:text-text'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-surfaceHighlight border border-border/50 rounded-xl shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={`z-10 relative flex items-center justify-center transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover:text-text'}`}>
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-left z-10 flex-1 ml-3"
                >
                  <div className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-primary' : ''}`}>{item.label}</div>
                  <div className="text-[10px] opacity-60 font-mono tracking-tight">{item.desc}</div>
                </motion.div>
              )}

              {isOpen && isRestricted && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface p-1 rounded-md border border-border/50">
                    <Lock className="w-3 h-3 text-textMuted" />
                  </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-2 border-t border-border/50 bg-gradient-to-t from-background/50 to-transparent">
         {/* Theme Toggle */}
         <button 
            onClick={toggleTheme}
            className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-text transition-all duration-200 group`}
         >
             <div className="relative w-5 h-5">
                 <motion.div initial={false} animate={{ rotate: theme === 'dark' ? 0 : 180, scale: theme === 'dark' ? 1 : 0 }} className="absolute inset-0 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                 </motion.div>
                 <motion.div initial={false} animate={{ rotate: theme === 'light' ? 0 : -180, scale: theme === 'light' ? 1 : 0 }} className="absolute inset-0 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                 </motion.div>
             </div>
             {isOpen && <span className="text-sm font-medium">Switch Theme</span>}
         </button>

         {/* Settings */}
         <button className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-text transition-all duration-200`}>
            <Settings className="w-5 h-5" />
            {isOpen && <span className="text-sm font-medium">Settings</span>}
         </button>

         {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="mt-4 pt-4 border-t border-border/50"
           >
             <div className="text-[10px] text-textMuted/50 font-mono flex flex-col gap-1">
               <div className="flex justify-between">
                   <span>STATUS</span>
                   <span className="text-green-500">ONLINE</span>
               </div>
               <div className="flex justify-between">
                   <span>MODEL</span>
                   <span>GEMINI 2.5</span>
               </div>
             </div>
           </motion.div>
         )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
