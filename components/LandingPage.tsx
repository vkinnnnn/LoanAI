
import React, { useRef, useState } from 'react';
import { 
  ArrowRight, Activity, GitBranch, Database, Cpu, Search, 
  ShieldCheck, Lock, BarChart3, Zap, Layers, FileText, 
  Terminal, Network, CheckCircle2, Server, Layout, ChevronRight, Play, Menu, X, ChevronDown
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px] opacity-20"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onEnterApp}>
            <div className="w-8 h-8 bg-surfaceHighlight rounded border border-white/10 flex items-center justify-center shrink-0">
               <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight text-white truncate">LoanSight <span className="text-zinc-500 font-normal">| AI</span></span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              <a href="#pipeline" className="hover:text-white transition-colors">Features</a>
              <a href="#evaluation" className="hover:text-white transition-colors">Accuracy</a>
              <a href="#security" className="hover:text-white transition-colors">Security</a>
            </div>
            <button 
              onClick={onEnterApp}
              className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Launch App
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
             <button 
                onClick={onEnterApp} 
                className="text-xs font-bold bg-white text-black px-4 py-2 rounded"
             >
                Launch
             </button>
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-300">
                <Menu className="w-6 h-6" />
             </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-[#050505] flex flex-col p-6 md:hidden"
          >
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-primary" />
                    <span className="font-bold text-xl">LoanSight</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-full">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex flex-col gap-6 text-lg font-medium text-zinc-300">
                <a href="#pipeline" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/5 pb-4">Features</a>
                <a href="#evaluation" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/5 pb-4">Accuracy</a>
                <a href="#security" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/5 pb-4">Security</a>
            </div>
            <div className="mt-auto">
                <button 
                  onClick={() => { onEnterApp(); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 bg-primary text-black font-bold text-center rounded-xl"
                >
                  Launch Platform
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-6 min-h-[85vh] flex items-center justify-center z-10 border-b border-white/5">
        <motion.div 
          style={{ y: heroY, opacity }}
          className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Hero Content */}
          <div className="text-left space-y-6 md:space-y-8 relative">
            
            {/* Status Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 cursor-default backdrop-blur-sm max-w-full"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] md:text-xs font-mono font-medium text-primary tracking-tight truncate">GEMINI 2.5 FLASH INFERENCE ACTIVE</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] md:leading-[1.05]"
            >
              LoanSight <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-zinc-400">Your Loan Document Companion</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed font-light"
            >
              Make sense of complex loan documents in seconds. Ask questions, get clear answers, and understand every detail without the confusion.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
            >
              <button 
                onClick={onEnterApp}
                className="group h-14 px-8 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(50,184,198,0.2)]"
              >
                Start Analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex h-14 items-center justify-center gap-4 px-6 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border border-[#050505] flex items-center justify-center text-[10px] font-mono text-zinc-400">
                        {i === 1 ? 'L' : i === 2 ? 'T' : 'M'}
                     </div>
                   ))}
                </div>
                <div className="text-xs text-zinc-500">
                   <span className="text-zinc-300 font-bold">MLFlow</span> Integration Ready
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual - Pipeline Visualization (Hidden on Mobile) */}
          <div className="relative hidden lg:block h-[500px] w-full">
            <PipelineVisual />
          </div>
        </motion.div>
      </section>

      {/* Tech Stack - Adaptive: Grid on Mobile, Marquee on Desktop */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-8 md:w-32 bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-8 md:w-32 bg-gradient-to-l from-[#050505] to-transparent z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Production MLOps Stack</p>
        </div>
        
        {/* Mobile Grid */}
        <div className="md:hidden grid grid-cols-2 gap-y-6 gap-x-4 px-6">
             {[
               { icon: Cpu, label: "Gemini 2.5" },
               { icon: Database, label: "Pinecone" },
               { icon: GitBranch, label: "LangChain" },
               { icon: ShieldCheck, label: "TruLens" },
               { icon: Activity, label: "MLflow" },
               { icon: Network, label: "FastAPI" },
             ].map((tech, i) => (
                <div key={i} className="flex items-center gap-3 justify-center">
                   <tech.icon className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                   <span className="text-sm font-bold text-zinc-300 whitespace-nowrap">{tech.label}</span>
                </div>
             ))}
        </div>

        {/* Desktop Marquee */}
        <div className="hidden md:flex overflow-hidden">
          <div className="animate-marquee flex gap-16 items-center min-w-full">
             {[
               { icon: Cpu, label: "Gemini 2.5" },
               { icon: Database, label: "Pinecone" },
               { icon: GitBranch, label: "LangChain" },
               { icon: ShieldCheck, label: "TruLens" },
               { icon: Activity, label: "MLflow" },
               { icon: Server, label: "Docker" },
               { icon: Network, label: "FastAPI" },
               { icon: Layout, label: "React 19" },
               { icon: Cpu, label: "Gemini 2.5" },
               { icon: Database, label: "Pinecone" },
               { icon: GitBranch, label: "LangChain" },
               { icon: ShieldCheck, label: "TruLens" },
             ].map((tech, i) => (
                <div key={i} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default">
                   <tech.icon className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                   <span className="text-lg font-bold text-zinc-300 whitespace-nowrap">{tech.label}</span>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="pipeline" className="py-20 md:py-32 relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 md:mb-20">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="inline-flex items-center gap-2 mb-4 text-primary text-xs font-bold uppercase tracking-widest"
             >
                <Layers className="w-4 h-4" /> System Capabilities
             </motion.div>
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="text-3xl md:text-5xl font-bold text-zinc-100 max-w-2xl leading-tight"
             >
               More than just Chat. <br/>
               <span className="text-zinc-500">A complete cognitive engine.</span>
             </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[300px]">
            
            {/* Feature 1: RAG */}
            <BentoCard 
              colSpan="md:col-span-2"
              title="Hybrid RAG Pipeline"
              subtitle="Semantic + Keyword Search"
              description="Our architecture splits documents into semantic chunks, embedding them with high-dimensional vectors while retaining keyword indexing."
              icon={Search}
              graphic={<RagVisual />}
            />

            {/* Feature 2: Evaluation */}
            <BentoCard 
              colSpan="md:col-span-1"
              title="TruLens Evaluation"
              subtitle="Quality Assurance"
              description="Every generated response is scored for Groundedness, Relevance, and Faithfulness in real-time."
              icon={ShieldCheck}
              graphic={
                <div className="absolute inset-0 flex items-center justify-center pt-10">
                   <div className="w-24 h-24 md:w-32 md:h-32 relative">
                      <svg className="w-full h-full -rotate-90">
                         <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#27272a" strokeWidth="8" />
                         <motion.circle 
                            cx="50%" cy="50%" r="40%" fill="none" stroke="#32b8c6" strokeWidth="8" 
                            strokeDasharray="251" strokeDashoffset="251"
                            whileInView={{ strokeDashoffset: 25 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-2xl md:text-3xl font-bold text-white">98%</span>
                         <span className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider">Accuracy</span>
                      </div>
                   </div>
                </div>
              }
            />

            {/* Feature 3: Risk Analysis */}
            <BentoCard 
              colSpan="md:col-span-1"
              title="Predictive Risk"
              subtitle="Automated Due Diligence"
              description="The system autonomously scans for default clauses, variable rates, and balloon payments."
              icon={BarChart3}
              graphic={
                 <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400"><span>Default Risk</span><span className="text-emerald-400">Low</span></div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><div className="h-full w-[20%] bg-emerald-500"></div></div>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-2"><span>Rate Volatility</span><span className="text-amber-400">Med</span></div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><div className="h-full w-[55%] bg-amber-500"></div></div>
                 </div>
              }
            />

            {/* Feature 4: Privacy */}
            <BentoCard 
              colSpan="md:col-span-2"
              title="Ephemeral Processing"
              subtitle="Zero-Retention Architecture"
              description="Documents are processed in volatile memory containers. No data persists on disk after the session concludes."
              icon={Lock}
              graphic={<SecurityVisual />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#050505] relative overflow-hidden">
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to accelerate your workflow?</h2>
            <p className="text-zinc-400 mb-10 text-base md:text-lg">Deploy the LoanSight agent to analyze complex agreements in seconds.</p>
            
            <button 
              onClick={onEnterApp}
              className="group relative w-full md:w-auto inline-flex items-center justify-center px-12 py-4 text-base font-bold text-black transition-all duration-200 bg-gradient-to-t from-zinc-200 to-white rounded-full hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Launch Platform
            </button>
         </div>
      </section>

      {/* Responsive Footer - Accordion on Mobile, Grid on Desktop */}
      <section className="pb-20 pt-10 px-0 md:px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto border-t md:border border-blue-400/50 rounded-none p-0 md:p-14 relative bg-[#080808]/50 shadow-none md:shadow-[0_0_50px_-20px_rgba(59,130,246,0.2)]">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-0 md:gap-10">
                
                <FooterSection 
                    title="Organization" 
                    items={['About LoanSight', 'Careers', 'Trust Center', 'Security & Compliance', 'Partners', 'Investor Relations', 'Contact Us']} 
                />
                <FooterSection 
                    title="Platform Resources" 
                    items={['Documentation', 'API Reference', 'System Status', 'Community Forum', 'Developer Blog', 'Integrations']} 
                />
                <FooterSection 
                    title="Use Cases" 
                    items={['Loan Origination', 'Risk Analysis', 'Compliance Audit', 'Portfolio Monitoring', 'Legal Review']} 
                />
                <FooterSection 
                    title="Support & Services" 
                    items={['Help Center', 'Professional Services', 'Training Academy', 'Enterprise Support', 'Whitepapers']} 
                />

                {/* Column 5 - "What is..." (Always visible or special styling) */}
                <div className="p-6 md:p-0 space-y-6 col-span-1 border-t border-white/5 md:border-none">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        What is... <ChevronRight className="w-3 h-3 text-blue-400" />
                    </h4>
                    <ul className="space-y-4 md:space-y-3 text-sm text-zinc-400 font-medium">
                        {[
                            'Retrieval Augmented Gen (RAG)', 
                            'Vector Search', 
                            'MLOps Evaluation', 
                            'Responsible AI', 
                            'LLM Hallucinations', 
                            'Semantic Analysis',
                        ].map((item, i) => (
                            <li key={i}><a href="#" className="hover:text-primary transition-colors block py-1 md:py-0.5 border-l-2 border-transparent hover:border-primary pl-0 hover:pl-2 transition-all">{item}</a></li>
                        ))}
                    </ul>
                </div>
            </div>
            
            {/* Corner Accents for Tech Feel (Desktop Only) */}
            <div className="hidden md:block absolute top-0 left-0 w-4 h-4 border-t border-l border-blue-400"></div>
            <div className="hidden md:block absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-400"></div>
            <div className="hidden md:block absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-400"></div>
            <div className="hidden md:block absolute bottom-0 right-0 w-4 h-4 border-b border-r border-blue-400"></div>
          </div>
      </section>

      {/* Footer Bottom */}
      <footer className="py-8 bg-[#020202] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600 font-mono">
            <div className="text-center md:text-left">© 2025 LoanSight MLOps. Open Source License.</div>
            <div className="flex gap-6">
                <a href="#" className="hover:text-zinc-400 p-2 md:p-0">Privacy</a>
                <a href="#" className="hover:text-zinc-400 p-2 md:p-0">Terms</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

// --- Subcomponents ---

const FooterSection = ({ title, items }: { title: string, items: string[] }) => (
    <div className="border-b border-white/5 md:border-none last:border-none">
        {/* Mobile Accordion */}
        <details className="group md:hidden">
            <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none text-sm font-bold text-white bg-[#0a0a0a] active:bg-white/5">
                {title}
                <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="px-6 pb-6 space-y-4 text-sm text-zinc-500 bg-[#080808]">
                {items.map((item, i) => (
                    <li key={i}><a href="#" className="block py-1 hover:text-primary transition-colors">{item}</a></li>
                ))}
            </ul>
        </details>

        {/* Desktop List */}
        <div className="hidden md:block space-y-6">
             <h4 className="text-sm font-bold text-white">{title}</h4>
             <ul className="space-y-3 text-sm text-zinc-500">
                {items.map((item, i) => (
                    <li key={i}><a href="#" className="hover:text-primary transition-colors block py-0.5">{item}</a></li>
                ))}
            </ul>
        </div>
    </div>
);

const BentoCard = ({ title, subtitle, description, icon: Icon, graphic, colSpan }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
    className={`${colSpan} relative min-h-[280px] bg-surface/30 rounded-3xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    {/* Content */}
    <div className="absolute inset-0 p-6 md:p-8 flex flex-col z-20 pointer-events-none">
       <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
             <Icon className="w-5 h-5" />
          </div>
          {subtitle && <span className="text-[10px] font-mono text-zinc-500 border border-white/5 px-2 py-1 rounded bg-[#050505]/50 hidden sm:inline-block">{subtitle}</span>}
       </div>
       <h3 className="text-lg md:text-xl font-bold text-zinc-100 mb-2 group-hover:text-white transition-colors">{title}</h3>
       <p className="text-sm text-zinc-400 leading-relaxed max-w-[90%] md:max-w-[80%]">{description}</p>
    </div>

    {/* Graphic Background Area */}
    <div className="absolute inset-0 z-10 opacity-40 group-hover:opacity-60 transition-opacity">
       {graphic}
    </div>
  </motion.div>
);

const PipelineVisual = () => {
   return (
      <div className="w-full h-full relative flex items-center justify-center">
         {/* Abstract Representation of RAG Pipeline */}
         <div className="relative w-[300px] h-[300px]">
            {/* Core */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-zinc-800"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full border border-dashed border-zinc-800 opacity-50"
            />
            
            {/* Center Node */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-24 h-24 bg-[#0a0a0a] rounded-2xl border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(50,184,198,0.1)] relative z-20">
                  <Database className="w-8 h-8 text-primary" />
                  <div className="absolute -bottom-6 text-[10px] font-mono text-primary">VECTOR_STORE</div>
               </div>
            </div>

            {/* Orbiting Nodes */}
            <FloatingNode delay={0} icon={FileText} label="INGEST" x={-120} y={-80} color="text-blue-400" />
            <FloatingNode delay={1} icon={Cpu} label="EMBED" x={120} y={-80} color="text-purple-400" />
            <FloatingNode delay={2} icon={Zap} label="RERANK" x={0} y={130} color="text-amber-400" />
            
            {/* Connection Beams */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
               <ConnectionLine x1="50%" y1="50%" x2="20%" y2="25%" />
               <ConnectionLine x1="50%" y1="50%" x2="80%" y2="25%" />
               <ConnectionLine x1="50%" y1="50%" x2="50%" y2="85%" />
            </svg>
         </div>
      </div>
   );
};

const FloatingNode = ({ icon: Icon, label, x, y, color, delay }: any) => (
   <motion.div 
     initial={{ opacity: 0, scale: 0 }}
     animate={{ opacity: 1, scale: 1, x, y }}
     transition={{ duration: 0.8, delay, type: "spring" }}
     className="absolute inset-0 flex items-center justify-center pointer-events-none"
   >
      <motion.div 
         animate={{ y: [0, -10, 0] }}
         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay * 1.5 }}
         className="w-16 h-16 bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 shadow-xl z-20"
      >
         <Icon className={`w-5 h-5 ${color}`} />
         <span className="text-[8px] font-bold text-zinc-500 tracking-wider">{label}</span>
      </motion.div>
   </motion.div>
);

const ConnectionLine = ({ x1, y1, x2, y2 }: any) => (
  <>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="1" />
    <motion.circle r="2" fill="#32b8c6">
       <animateMotion dur="3s" repeatCount="indefinite" path={`M${x1 === '50%' ? 150 : x1 === '20%' ? 60 : x1 === '80%' ? 240 : 150},${y1 === '50%' ? 150 : 255} L${x2 === '20%' ? 60 : x2 === '80%' ? 240 : x2 === '50%' ? 150 : 150},${y2 === '25%' ? 75 : y2 === '85%' ? 255 : 150}`} />
    </motion.circle>
  </>
);

const RagVisual = () => (
   <div className="absolute right-0 top-0 bottom-0 w-1/2 p-6 flex flex-col gap-3 opacity-30">
      {[1,2,3,4].map(i => (
         <motion.div 
           key={i}
           initial={{ x: 50, opacity: 0 }}
           whileInView={{ x: 0, opacity: 1 }}
           transition={{ delay: i * 0.1 }}
           className="h-2 bg-zinc-700 rounded-full w-full" 
           style={{ width: `${Math.random() * 40 + 60}%` }}
         />
      ))}
      <div className="mt-4 p-3 border border-dashed border-zinc-700 rounded-lg">
         <div className="text-[8px] font-mono text-zinc-500 mb-1">SIMILARITY_SCORE</div>
         <div className="h-1.5 w-full bg-zinc-800 rounded-full"><div className="h-full w-[85%] bg-blue-500 rounded-full"></div></div>
      </div>
   </div>
);

const SecurityVisual = () => (
   <div className="absolute right-10 bottom-10 flex gap-2">
      <div className="w-12 h-16 border border-zinc-700 rounded flex items-center justify-center bg-[#050505]">
         <Lock className="w-4 h-4 text-zinc-600" />
      </div>
      <div className="w-12 h-16 border border-zinc-700 rounded flex items-center justify-center bg-[#050505]">
         <div className="text-[8px] font-mono text-zinc-600">AES<br/>256</div>
      </div>
   </div>
);

export default LandingPage;
