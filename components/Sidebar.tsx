import React from 'react';
import { ViewMode } from '../types';
import { FileUp, Bot, Settings, Menu, Sun, Moon, Lock, ScanEye, Sparkles, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    { id: ViewMode.ASSISTANT, label: 'Assistant', icon: Bot, desc: 'AI Chat & Voice' },
    { id: ViewMode.UPLOAD, label: 'Workspace', icon: LayoutDashboard, desc: 'Documents & Data' },
  ];

  return (
    <motion.div 
      className={`h-screen bg-surface/80 backdrop-blur-xl border-r border-border flex flex-col z-50 transition-all duration-500 ease-[0.23,1,0.32,1] ${isOpen ? 'w-72' : 'w-20'}`}
      initial={false}
    >
      {/* Brand Header */}
      <div className={`p-5 flex ${isOpen ? 'flex-row items-center justify-between' : 'flex-col items-center gap-6'} mb-6 transition-all duration-300`}>
        <button 
            onClick={onLogoClick}
            className={`flex items-center gap-3 group focus:outline-none ${!isOpen ? 'justify-center w-full mt-2' : ''}`}
            title="Back to Landing Page"
        >
            {/* Logo Icon */}
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-surfaceHighlight to-surface border border-white/10 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner overflow-hidden group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105">
                     <ScanEye className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" strokeWidth={2} />
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
            </div>

            {/* Logo Text */}
            <AnimatePresence>
            {isOpen && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="flex flex-col items-start overflow-hidden whitespace-nowrap"
               >
                 <div className="flex items-center gap-1">
                    <span className="font-bold text-lg tracking-tight text-text leading-none font-sans">Loan</span>
                    <span className="font-bold text-lg tracking-tight text-primary leading-none font-sans">Sight</span>
                 </div>
               </motion.div>
            )}
            </AnimatePresence>
        </button>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg text-textMuted hover:text-text hover:bg-white/5 transition-all duration-200 active:scale-95 ${!isOpen ? '' : ''}`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const isRestricted = !hasDocuments && item.id !== ViewMode.UPLOAD;
          
          return (
            <button
              key={item.id}
              onClick={() => !isRestricted && onViewChange(item.id)}
              disabled={isRestricted}
              className={`relative w-full flex items-center ${isOpen ? 'px-3 gap-3' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-300 outline-none group overflow-hidden ${
                isRestricted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveTab"
                  className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={`z-10 relative flex items-center justify-center transition-colors duration-300 ${isActive ? 'text-primary' : 'text-textMuted group-hover:text-text'}`}>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: isActive ? 0 : [0, -5, 5, 0] }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
              </div>
              
              <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-left z-10 flex-1 overflow-hidden whitespace-nowrap"
                >
                  <div className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-text' : 'text-textMuted group-hover:text-text'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-textMuted/60 font-mono">{item.desc}</div>
                </motion.div>
              )}
              </AnimatePresence>

              {isOpen && isActive && item.id === ViewMode.ASSISTANT && (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                       <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                   </motion.div>
              )}

              {isOpen && isRestricted && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-surfaceHighlight p-1 rounded border border-white/5">
                    <Lock className="w-3 h-3 text-textMuted" />
                  </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 space-y-2 border-t border-border/40 bg-gradient-to-t from-background/80 to-transparent">
         <button 
            onClick={toggleTheme}
            className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl hover:bg-white/5 text-textMuted hover:text-text transition-all duration-200 group`}
         >
             <div className="relative w-5 h-5">
                 <motion.div initial={false} animate={{ rotate: theme === 'dark' ? 0 : 90, scale: theme === 'dark' ? 1 : 0 }} className="absolute inset-0 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                 </motion.div>
                 <motion.div initial={false} animate={{ rotate: theme === 'light' ? 0 : -90, scale: theme === 'light' ? 1 : 0 }} className="absolute inset-0 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                 </motion.div>
             </div>
             {isOpen && <span className="text-sm font-medium">Theme</span>}
         </button>

         <button className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl hover:bg-white/5 text-textMuted hover:text-text transition-all duration-200 group`}>
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            {isOpen && <span className="text-sm font-medium">Settings</span>}
         </button>

         <AnimatePresence>
         {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 10 }}
             transition={{ delay: 0.1 }}
             className="mt-4 pt-4 border-t border-white/5"
           >
             <div className="flex items-center gap-3 px-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-textMuted tracking-wider uppercase">System Status</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Gemini 2.5 Active</span>
                </div>
             </div>
           </motion.div>
         )}
         </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;