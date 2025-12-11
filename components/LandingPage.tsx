
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
    ArrowRight, FileText, Mic, MessageSquare, ShieldCheck, 
    ScanLine, Activity, MousePointerClick, Database, 
    Layers, Zap, Server, ChevronDown, CheckCircle2,
    Lock, BrainCircuit, Search, Upload
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-brand-dim selection:text-brand scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={onEnterApp}>
                <div className="relative">
                    <ScanLine className="w-5 h-5 text-brand transition-transform group-hover:rotate-90 duration-500" />
                    <div className="absolute inset-0 bg-brand/50 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="font-bold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">LoanSight AI</span>
            </div>
            <div className="flex items-center gap-8">
                 <div className="hidden md:flex gap-8">
                    <a href="#how-it-works" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors tracking-wide">HOW IT WORKS</a>
                    <a href="#features" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors tracking-wide">CAPABILITIES</a>
                    <a href="#faq" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors tracking-wide">FAQ</a>
                 </div>
                 <button 
                    onClick={onEnterApp}
                    className="text-xs font-mono uppercase tracking-widest text-brand hover:text-brand/80 transition-colors border border-brand/20 px-5 py-2 rounded-full hover:bg-brand/10 hover:border-brand/50"
                >
                    Launch Studio
                </button>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center pt-20 border-b border-white/5 overflow-hidden">
         <motion.div style={{ y, opacity }} className="absolute inset-0 z-0 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px]"></div>
             <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent"></div>
         </motion.div>
         
         {/* Grid Background */}
         <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

         <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-10">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm hover:border-brand/30 transition-colors cursor-default"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
                <span className="text-[10px] md:text-xs font-mono text-zinc-300 tracking-wider uppercase">
                    AI-Powered Document Intelligence
                </span>
            </motion.div>
            
            <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-8xl font-medium tracking-tighter leading-[0.95] text-white"
            >
                Decode Your Loan <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand via-brand/80 to-white/50">Documents in Seconds.</span>
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
            >
                Don't sign what you don't understand. LoanSight transforms complex contracts into clear, actionable insights using enterprise-grade AI.
            </motion.p>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
            >
                <button 
                    onClick={onEnterApp}
                    className="group relative px-8 py-4 bg-brand text-[#050505] font-bold text-sm tracking-widest uppercase overflow-hidden hover:bg-white transition-all rounded-sm shadow-[0_0_40px_-10px_rgba(50,184,198,0.3)]"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative z-10 flex items-center gap-2">
                        Analyze Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
                <a 
                    href="#how-it-works"
                    className="px-8 py-4 border border-white/10 text-zinc-300 font-medium text-sm tracking-widest uppercase hover:bg-white/5 transition-all hover:text-white hover:border-white/20"
                >
                    How it Works
                </a>
            </motion.div>
         </div>
      </section>

      {/* Trust Stats Section */}
      <section className="border-b border-white/5 bg-[#080808] py-12 relative z-20">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
              {[
                { label: "Retrieval Accuracy", value: "98.5%", icon: Activity },
                { label: "Processing Latency", value: "< 200ms", icon: Zap },
                { label: "Data Privacy", value: "Isolated", icon: ShieldCheck },
              ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 group cursor-default w-full md:w-auto border-b md:border-b-0 border-white/5 pb-4 md:pb-0"
                  >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors border border-white/5 group-hover:border-brand/20">
                          <stat.icon className="w-5 h-5 text-zinc-400 group-hover:text-brand transition-colors" />
                      </div>
                      <div>
                          <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                          <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider group-hover:text-brand/70 transition-colors">{stat.label}</div>
                      </div>
                  </motion.div>
              ))}
          </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 bg-[#050505] border-b border-white/5 relative z-20">
          <div className="max-w-[1400px] mx-auto px-6">
             <div className="mb-16 text-center">
                  <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-white">Simplifying the Complex</h2>
                  <p className="text-zinc-400">Three steps to financial clarity.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { step: "01", title: "Upload", desc: "Drag and drop your PDF loan agreement. Secure ingestion processes your file instantly in browser memory.", icon: Upload },
                    { step: "02", title: "Analyze", desc: "Our RAG engine breaks down every clause, creating a searchable semantic map of your debt.", icon: BrainCircuit },
                    { step: "03", title: "Understand", desc: "Ask questions, listen to summaries, and translate risks into plain language.", icon: MessageSquare },
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2 }}
                        viewport={{ once: true }}
                        className="relative p-8 border border-white/10 bg-white/[0.02] rounded-2xl group hover:border-brand/30 hover:bg-brand/[0.02] transition-all"
                    >
                        <div className="text-6xl font-thin text-white/5 absolute top-4 right-4 font-mono group-hover:text-brand/10 transition-colors">{item.step}</div>
                        <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-6 text-brand">
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-3">{item.title}</h3>
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            {item.desc}
                        </p>
                    </motion.div>
                ))}
             </div>
          </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-[#050505] relative z-20 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="max-w-[1400px] mx-auto px-6">
              <motion.div {...fadeInUp} className="mb-20">
                  <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-white">Full-Spectrum Analysis.</h2>
                  <p className="text-xl text-zinc-400 max-w-2xl font-light">
                    Built on Gemini 2.5 and advanced RAG architecture to ensure every answer is grounded in your actual document.
                  </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
                  {[
                      { 
                        title: "Instant Clarity", 
                        desc: "Click any clause to get a jargon-free explanation. We translate legalese into human language instantly.",
                        icon: MousePointerClick 
                      },
                      { 
                        title: "Interrogate Your Contract", 
                        desc: "Chat conversationally with your document. Ask 'What are the penalties?' or 'Is this rate fixed?'",
                        icon: MessageSquare 
                      },
                      { 
                        title: "Listen, Don't Read", 
                        desc: "Turn dense pages into clear audio. Perfect for reviewing terms while on the go.",
                        icon: Mic 
                      },
                      { 
                        title: "Global Understanding", 
                        desc: "Instantly translate loan terms into your native language while preserving financial accuracy.",
                        icon: Layers 
                      },
                      { 
                        title: "Smart Highlights", 
                        desc: "Automatic detection of high-risk terms, hidden fees, and unusual repayment conditions.",
                        icon: Search 
                      },
                      { 
                        title: "Privacy First", 
                        desc: "Your financial data is processed in an isolated environment and never used for model training.",
                        icon: Lock 
                      },
                  ].map((feature, i) => (
                      <motion.div 
                          key={i}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          viewport={{ once: true }}
                          className="group relative bg-[#080808] p-12 hover:bg-[#0a0a0a] transition-colors"
                      >
                          <div className="mb-6 w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center border border-brand/10 group-hover:border-brand/30 transition-colors">
                              <feature.icon className="w-5 h-5 text-brand" />
                          </div>
                          <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                          <p className="text-zinc-500 leading-relaxed text-sm group-hover:text-zinc-400 transition-colors">
                              {feature.desc}
                          </p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#050505] border-t border-white/5 relative z-20">
          <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-12 text-center text-white">Common Questions</h2>
              <div className="space-y-4">
                  {[
                      { q: "Is my document data private?", a: "Yes. LoanSight uses ephemeral processing. Your documents are analyzed in a secure session and are not stored permanently or used to train our AI models." },
                      { q: "What types of files can I upload?", a: "We currently support PDF documents, scanned images (JPG/PNG), and text files. Our OCR engine extracts text even from scanned physical papers." },
                      { q: "Can I trust the AI's explanation?", a: "LoanSight uses Retrieval-Augmented Generation (RAG) to ground every answer in your specific document's text. However, always consult a human financial advisor for final legal decisions." },
                      { q: "Does it work for mortgages?", a: "Absolutely. LoanSight is optimized for mortgages, personal loans, auto financing agreements, and credit card terms." },
                  ].map((item, i) => (
                      <FAQItem key={i} question={item.q} answer={item.a} />
                  ))}
              </div>
          </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="py-16 border-t border-white/5 bg-[#030303] overflow-hidden z-20">
         <div className="max-w-[1400px] mx-auto px-6 text-center mb-8">
             <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-[0.3em]">Powering Financial Intelligence</h4>
         </div>
         <div className="relative flex overflow-x-hidden group">
             <div className="animate-marquee whitespace-nowrap flex gap-16 items-center opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                 {['Gemini 2.5', 'React', 'TypeScript', 'Tailwind', 'Python', 'FastAPI', 'Docker', 'Kubernetes', 'Google Cloud', 'MLflow'].map((tech, i) => (
                     <span key={`${tech}-${i}`} className="text-xl font-bold text-zinc-300 mx-4 cursor-default hover:text-brand transition-colors">{tech}</span>
                 ))}
                 {['Gemini 2.5', 'React', 'TypeScript', 'Tailwind', 'Python', 'FastAPI', 'Docker', 'Kubernetes', 'Google Cloud', 'MLflow'].map((tech, i) => (
                     <span key={`${tech}-dup-${i}`} className="text-xl font-bold text-zinc-300 mx-4 cursor-default hover:text-brand transition-colors">{tech}</span>
                 ))}
             </div>
             <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-10"></div>
             <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-10"></div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group border-t border-white/5 bg-[#050505] z-20">
          <div className="absolute inset-0 bg-gradient-to-t from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
              <h2 className="text-5xl md:text-7xl font-medium tracking-tighter mb-8 text-white">
                  Ready for <span className="text-brand">Clarity?</span>
              </h2>
              <p className="text-zinc-400 mb-10 max-w-xl mx-auto text-lg">
                  Join the borrowers who refuse to sign what they don't understand.
              </p>
              <button 
                    onClick={onEnterApp}
                    className="px-12 py-5 bg-white text-black text-sm tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] rounded-sm"
                >
                    Enter Studio
              </button>
              <p className="mt-8 text-xs font-mono text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3" /> 100% Private & Secure
              </p>
          </motion.div>
      </section>

      <footer className="py-8 border-t border-white/10 bg-[#030303] z-20 relative">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-600 font-mono gap-4 md:gap-0">
              <div>© 2024 LoanSight AI. Built for the LoanQA-MLOps Project.</div>
              <div className="flex gap-6">
                  <a href="#" className="hover:text-brand transition-colors">GITHUB</a>
                  <a href="#" className="hover:text-brand transition-colors">PRIVACY</a>
                  <a href="#" className="hover:text-brand transition-colors">TERMS</a>
              </div>
          </div>
      </footer>
    </div>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="border border-white/10 bg-white/[0.02] rounded-lg overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
            >
                <span className="font-medium text-white">{question}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-white/5">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
