import React, { useState, useEffect, useRef } from 'react';
import { 
  Role, NewsField, NewsRegion, User, NewsItem, ViewStep 
} from './types';
import { fetchAggregatedNews, verifyIdProof } from './services/geminiService';
import { INDIAN_STATES, COUNTRIES, FONT_STYLES } from './constants';

// --- News Detail View ---
const NewsDetail: React.FC<{ item: NewsItem; onClose: () => void }> = ({ item, onClose }) => (
  <div className="fixed inset-0 z-[150] bg-[#050505] flex flex-col animate-in slide-in-from-bottom-6 duration-300 overflow-y-auto pb-32">
    <div className="sticky top-0 z-10 p-4 flex justify-between items-center bg-black/95 backdrop-blur-md border-b border-white/10">
      <button onClick={onClose} className="mono flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-widest text-[13px] group">
        <i className="fas fa-chevron-left group-hover:-translate-x-1 transition-transform"></i>
        <span>Back to News</span>
      </button>
      <div className="mono text-[13px] font-bold text-white/30 uppercase tracking-[0.3em]">
        STORY_ID: {item.id.split('-')[1]}
      </div>
    </div>
    
    <div className="max-w-4xl mx-auto w-full p-6 md:p-16">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
        <div className="mono text-red-500 text-[13px] font-black uppercase tracking-[0.4em]">Verified News Report</div>
      </div>
      
      <h1 className={`text-5xl md:text-7xl font-black text-white mb-10 leading-[0.9] tracking-tighter uppercase ${item.fontStyle || ''}`}>
        {item.title}
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 border-y border-white/5 py-10 mono text-[13px]">
        <div>
          <div className="text-white/30 uppercase mb-1">Reporter</div>
          <div className="text-cyan-400 uppercase font-bold">{item.reporterId}</div>
        </div>
        <div>
          <div className="text-white/30 uppercase mb-1">Posted At</div>
          <div className="text-white uppercase font-bold">{new Date(item.postedDate).toLocaleTimeString()}</div>
        </div>
        <div>
          <div className="text-white/30 uppercase mb-1">Location</div>
          <div className="text-white uppercase font-bold">{item.region}</div>
        </div>
        <div>
          <div className="text-white/30 uppercase mb-1">Verification</div>
          <div className="text-green-500 uppercase font-bold">Checked</div>
        </div>
      </div>

      <div className="relative mb-12 border border-white/10 p-1 bg-zinc-900 overflow-hidden rounded-sm group shadow-2xl">
        <img src={item.imageUrl} className="w-full h-80 md:h-[30rem] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={item.title} onError={(e) => (e.currentTarget.src = 'https://picsum.photos/800/600')} />
      </div>

      <div className={`text-2xl text-zinc-300 leading-relaxed font-medium mb-12 ${item.fontStyle || ''}`}>
        {item.description}
      </div>

      {item.sources && item.sources.length > 0 && (
        <div className="mt-12 mb-20 bg-zinc-900/30 p-8 border border-white/5">
          <div className="mono text-white text-[14px] font-black uppercase tracking-widest mb-6 border-l-2 border-cyan-500 pl-4">Verified Sources</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.sources.map((src, idx) => (
              <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-black/40 border border-white/5 hover:border-cyan-500 transition-all group">
                <span className="mono text-[12px] text-zinc-400 font-bold uppercase truncate max-w-[80%]">{src.title}</span>
                <i className="fas fa-link text-white/10 group-hover:text-cyan-400 text-xs"></i>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState<ViewStep>('LOGIN');
  const [selectedField, setSelectedField] = useState<NewsField | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<NewsRegion | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRegionName, setActiveRegionName] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Verification States
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showIdError, setShowIdError] = useState(false);
  const [showIdSuccess, setShowIdSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("ID Proof is required for reporter registration.");
  const [successMessage, setSuccessMessage] = useState("Identity Verification Successful.");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value.toLowerCase();
    setUser({ email, role: Role.CITIZEN });
    setCurrentStep('ROLE_SELECT');
  };

  const selectRole = (role: Role) => {
    setUser(prev => prev ? { ...prev, role } : null);
    if (role === Role.REPORTER) {
      setCurrentStep('VERIFICATION');
    } else {
      setCurrentStep('FIELD_SELECT');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleVerifyReporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProofFile) {
      setErrorMessage("Please upload an ID proof to continue.");
      setShowIdError(true);
      return;
    }
    
    setIsVerifying(true);
    try {
      const base64 = await fileToBase64(idProofFile);
      const result = await verifyIdProof(base64, idProofFile.type);
      setIsVerifying(false);
      if (result.isValid) {
        setSuccessMessage(`Access Granted: ${result.reason}`);
        setShowIdSuccess(true);
      } else {
        setErrorMessage(`Verification Failed: ${result.reason}`);
        setShowIdError(true);
      }
    } catch (err) {
      setIsVerifying(false);
      setErrorMessage("System error: Could not process the document.");
      setShowIdError(true);
    }
  };

  const proceedAfterSuccess = () => {
    setShowIdSuccess(false);
    setCurrentStep('FIELD_SELECT');
  };

  const fetchNewsForArea = async (name: string, regionType: NewsRegion) => {
    setActiveRegionName(name);
    setSelectedRegion(regionType);
    if (regionType === NewsRegion.STATE) setSelectedState(name);
    if (regionType === NewsRegion.NATIONAL) setSelectedCountry(name);
    
    setLoading(true);
    try {
      const news = await fetchAggregatedNews(selectedField!, regionType, name);
      setNewsFeed(news);
      setCurrentStep('DASHBOARD');
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'ROLE_SELECT') setCurrentStep('LOGIN');
    else if (currentStep === 'VERIFICATION') setCurrentStep('ROLE_SELECT');
    else if (currentStep === 'FIELD_SELECT') setCurrentStep('ROLE_SELECT');
    else if (currentStep === 'REGION_SELECT') {
      setSelectedRegion(null);
      setCurrentStep('FIELD_SELECT');
    }
    else if (currentStep === 'DASHBOARD') setCurrentStep('REGION_SELECT');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative selection:bg-cyan-500 selection:text-black overflow-x-hidden pb-32">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      {/* PERSISTENT GLOBAL WATERMARK */}
      <div className="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-[999] select-none">
        <div className="mono text-[15px] uppercase font-bold text-white/20 tracking-[1.5em] animate-pulse [animation-duration:6s] glow-text">
          InfoSphere
        </div>
      </div>

      {/* Aesthetic Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/98 backdrop-blur-md">
          <div className="relative flex flex-col items-center">
            <div className="w-32 h-[2px] bg-cyan-500/30 mb-10 overflow-hidden">
                <div className="h-full bg-cyan-400 w-1/3 animate-[loading-bar_1.5s_infinite_linear]"></div>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-white tracking-[0.2em] uppercase mono glow-text text-center px-6">
              {activeRegionName}
            </h2>
            <div className="mt-10 mono text-[14px] text-cyan-500 uppercase tracking-[0.5em] opacity-50">
                Finding Verified Stories
            </div>
          </div>
          <style>{`
            @keyframes loading-bar {
                from { transform: translateX(-100%); }
                to { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}

      {/* Error Modal */}
      {showIdError && (
        <div className="fixed inset-0 z-[510] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-xs w-full bg-zinc-900 border border-red-500/50 p-10 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
            <div className="text-center mb-8">
              <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-6"></i>
              <h3 className="mono text-2xl font-black uppercase text-white mb-3 tracking-tight">Error</h3>
              <p className="mono text-[14px] text-zinc-400 uppercase tracking-widest leading-relaxed">{errorMessage}</p>
            </div>
            <button onClick={() => setShowIdError(false)} className="w-full py-5 bg-red-600 text-white mono font-black uppercase text-[13px] tracking-widest hover:bg-red-500 transition-colors shadow-lg">OK</button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showIdSuccess && (
        <div className="fixed inset-0 z-[510] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-xs w-full bg-zinc-900 border border-green-500/50 p-10 shadow-[0_0_50px_rgba(34,197,94,0.2)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50"></div>
            <div className="text-center mb-8">
              <i className="fas fa-check-circle text-green-500 text-4xl mb-6"></i>
              <h3 className="mono text-2xl font-black uppercase text-white mb-3 tracking-tight">Success</h3>
              <p className="mono text-[14px] text-zinc-400 uppercase tracking-widest leading-relaxed">{successMessage}</p>
            </div>
            <button onClick={proceedAfterSuccess} className="w-full py-5 bg-green-600 text-white mono font-black uppercase text-[13px] tracking-widest hover:bg-green-500 transition-colors shadow-lg">CONTINUE</button>
          </div>
        </div>
      )}

      {selectedArticle && <NewsDetail item={selectedArticle} onClose={() => setSelectedArticle(null)} />}

      {currentStep !== 'LOGIN' && (
        <button onClick={handleBack} className="fixed top-10 left-10 z-[100] mono text-[13px] uppercase font-black text-white/40 hover:text-cyan-400 transition-colors flex items-center space-x-2">
          <i className="fas fa-arrow-left"></i> <span>Go Back</span>
        </button>
      )}

      {currentStep === 'LOGIN' && (
        <div className="w-full max-w-[320px] z-10 animate-in fade-in duration-500">
          <h1 className="text-5xl font-black mb-14 text-center tracking-[0.2em] uppercase mono glow-text">
            Info<span className="text-cyan-500">Sphere</span>
          </h1>
          <div className="bg-zinc-900/30 border border-white/5 p-10 backdrop-blur-xl rounded-sm shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="mono text-[13px] text-white/50 uppercase font-black tracking-widest">Your Email</label>
                <input 
                  required 
                  type="email" 
                  name="email" 
                  placeholder="name@email.com" 
                  className="w-full px-5 py-4 bg-black border border-white/10 focus:border-cyan-500 outline-none mono text-[16px] text-cyan-400 lowercase placeholder:text-zinc-800 transition-colors" 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-cyan-600 text-black font-black uppercase text-[14px] tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-lg active:scale-95">Log In</button>
            </form>
          </div>
          <div className="mt-10 flex items-center justify-center space-x-3 opacity-20">
            <div className="w-2 h-2 bg-cyan-500 animate-pulse"></div>
            <span className="mono text-[11px] uppercase tracking-widest">Secure Connection Active</span>
          </div>
        </div>
      )}

      {currentStep === 'ROLE_SELECT' && (
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 z-10 animate-in slide-in-from-bottom-6 duration-300">
          <button onClick={() => selectRole(Role.CITIZEN)} className="p-16 border border-white/5 bg-zinc-900/40 hover:border-cyan-500/50 transition-all group relative text-left overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="mono text-[13px] text-cyan-500 font-bold mb-5 uppercase tracking-[0.5em]">Mode: Reader</div>
            <h3 className="text-5xl font-black mb-3 tracking-tighter uppercase">Citizen</h3>
            <p className="text-zinc-500 text-[16px] mono">Read verified news from around the world.</p>
            <i className="fas fa-user absolute bottom-10 right-10 text-white/5 text-8xl"></i>
          </button>
          <button onClick={() => selectRole(Role.REPORTER)} className="p-16 border border-white/5 bg-zinc-900/40 hover:border-red-500/50 transition-all group relative text-left overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="mono text-[13px] text-red-500 font-bold mb-5 uppercase tracking-[0.5em]">Mode: Reporter</div>
            <h3 className="text-5xl font-black mb-3 tracking-tighter uppercase">Reporter</h3>
            <p className="text-zinc-500 text-[16px] mono">Contribute verified stories from your region.</p>
            <i className="fas fa-broadcast-tower absolute bottom-10 right-10 text-white/5 text-8xl"></i>
          </button>
        </div>
      )}

      {currentStep === 'VERIFICATION' && (
        <div className="w-full max-w-md bg-zinc-900 border border-white/5 p-12 z-10 animate-in fade-in duration-300 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/30"></div>
          <div className="mono text-[13px] text-cyan-400 mb-10 uppercase text-center font-bold tracking-[0.4em]">Reporter Verification</div>
          <form onSubmit={handleVerifyReporter} className="space-y-8">
            <div className="space-y-4">
              <label className="mono text-[13px] text-white/40 uppercase font-black tracking-widest block text-center">Identity Document (Indian IDs Only)</label>
              <div 
                onClick={() => !isVerifying && fileInputRef.current?.click()}
                className={`h-56 border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer rounded-sm ${
                  idProofFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-cyan-500 bg-black/50'
                } ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setIdProofFile(e.target.files?.[0] || null)} accept="image/*" disabled={isVerifying} />
                {idProofFile ? (
                  <div className="text-center animate-in zoom-in-75 duration-300 px-6">
                    <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
                    <p className="mono text-[14px] uppercase font-bold text-green-400 truncate w-full">{idProofFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <i className="fas fa-id-card text-4xl mb-6 text-zinc-600"></i>
                    <span className="mono text-[13px] uppercase font-bold text-zinc-500 block">Click to Upload Identity Proof</span>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" disabled={isVerifying} className="w-full py-5 bg-cyan-600 text-black font-black uppercase text-[14px] tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center disabled:opacity-50 group">
              {isVerifying ? <><i className="fas fa-spinner animate-spin mr-3"></i> Verifying...</> : <>Verify Identity</>}
            </button>
          </form>
        </div>
      )}

      {currentStep === 'FIELD_SELECT' && (
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 z-10 animate-in zoom-in duration-300">
          {Object.values(NewsField).map((field) => (
            <button key={field} onClick={() => { setSelectedField(field); setCurrentStep('REGION_SELECT'); }} className="p-14 bg-zinc-900/40 border border-white/5 hover:border-cyan-500 transition-all text-left group overflow-hidden relative">
              <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 group-hover:text-cyan-400 transition-colors">{field}</h3>
              <p className="mono text-[14px] text-zinc-500 uppercase tracking-widest">Click to see updates</p>
            </button>
          ))}
        </div>
      )}

      {currentStep === 'REGION_SELECT' && (
        <div className="w-full max-w-xl space-y-6 z-10 animate-in slide-in-from-right-4">
          <div className="mono text-[14px] text-cyan-500 mb-10 uppercase text-center font-bold tracking-[0.5em]">Select Location</div>
          {Object.values(NewsRegion).map((region) => (
            <div key={region} className="space-y-4">
              <button onClick={() => region === NewsRegion.INTERNATIONAL ? fetchNewsForArea(region, region) : setSelectedRegion(region)} className={`w-full p-8 border transition-all text-left flex justify-between items-center group ${selectedRegion === region ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-zinc-900/40 border-white/5 hover:border-cyan-500'}`}>
                <span className="font-black uppercase text-2xl tracking-widest">{region}</span>
                <i className={`fas fa-arrow-right text-base group-hover:translate-x-1 transition-transform ${selectedRegion === region ? 'text-black' : 'text-zinc-600'}`}></i>
              </button>
              
              {region === NewsRegion.STATE && selectedRegion === NewsRegion.STATE && (
                <div className="p-8 bg-black/40 border border-white/5 animate-in slide-in-from-top-4">
                  <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full p-5 bg-zinc-900 border border-white/10 text-white font-bold text-base outline-none focus:border-cyan-500 transition-colors">
                    <option value="" disabled>Choose a State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {selectedState && <button onClick={() => fetchNewsForArea(selectedState, NewsRegion.STATE)} className="w-full mt-6 py-5 bg-cyan-500 text-black font-black uppercase text-[14px] tracking-widest hover:bg-cyan-400 transition-all">Select State</button>}
                </div>
              )}

              {region === NewsRegion.NATIONAL && selectedRegion === NewsRegion.NATIONAL && (
                <div className="p-8 bg-black/40 border border-white/5 animate-in slide-in-from-top-4">
                  <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="w-full p-5 bg-zinc-900 border border-white/10 text-white font-bold text-base outline-none focus:border-cyan-500 transition-colors">
                    <option value="" disabled>Choose a Country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {selectedCountry && <button onClick={() => fetchNewsForArea(selectedCountry, NewsRegion.NATIONAL)} className="w-full mt-6 py-5 bg-cyan-600 text-black font-black uppercase text-[14px] tracking-widest hover:bg-cyan-400 transition-all">Select Country</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {currentStep === 'DASHBOARD' && (
        <div className="w-full max-w-[1400px] mx-auto py-14 px-6 min-h-screen z-10 animate-in fade-in duration-500">
          <nav className="flex items-center justify-between mb-24 border-b border-white/5 pb-10">
            <div className="flex items-center space-x-5 group cursor-pointer" onClick={() => setCurrentStep('FIELD_SELECT')}>
              <div className="w-12 h-12 bg-white text-black flex items-center justify-center font-black text-2xl group-hover:bg-cyan-500 transition-colors">S</div>
              <span className="text-2xl font-black tracking-widest uppercase mono">Dashboard</span>
            </div>
            <button onClick={() => window.location.reload()} className="mono text-[13px] text-white/40 uppercase hover:text-red-500 transition-colors border border-white/5 px-6 py-3 hover:border-red-500/50 tracking-widest">Log Out</button>
          </nav>

          <header className="mb-24">
            <div className="mono text-cyan-500 text-[14px] uppercase font-bold tracking-[0.8em] mb-5">Connection: Secure</div>
            <h1 className="text-7xl md:text-9xl font-black text-white mb-8 tracking-tighter uppercase leading-none">
              {selectedRegion === NewsRegion.STATE ? selectedState : (selectedRegion === NewsRegion.NATIONAL ? selectedCountry : selectedRegion)}
            </h1>
            <div className="flex items-center space-x-6">
              <span className="mono text-zinc-500 text-[14px] uppercase font-bold border border-white/10 px-5 py-2 bg-white/5 tracking-widest">{selectedField} Updates</span>
              <div className="flex items-center space-x-3 px-5 py-2 border border-white/10 bg-green-500/5">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="mono text-[12px] text-green-500 uppercase font-black tracking-widest">Live</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
            {newsFeed.length > 0 ? (
              newsFeed.map((item) => (
                <article key={item.id} className="group bg-zinc-900/20 p-10 border border-white/5 hover:border-cyan-500 transition-all cursor-pointer relative overflow-hidden" onClick={() => setSelectedArticle(item)}>
                  <div className="absolute top-0 left-0 w-2 h-0 bg-cyan-500 group-hover:h-full transition-all duration-500"></div>
                  <div className="relative mb-8 h-72 overflow-hidden border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-700 bg-black shadow-2xl">
                    <img src={item.imageUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" alt={item.title} onError={(e) => (e.currentTarget.src = 'https://picsum.photos/600/400?grayscale&blur=2')} />
                    <div className="absolute top-0 right-0 p-4">
                      <span className="mono text-[11px] bg-cyan-500 text-black px-4 py-2 font-black shadow-xl tracking-widest uppercase">{(item as any).tag || 'NEWS'}</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black mb-5 tracking-tighter uppercase group-hover:text-cyan-400 transition-colors leading-tight">{item.title}</h3>
                  <p className="text-zinc-500 text-[16px] leading-relaxed uppercase mono line-clamp-3">{item.description}</p>
                  <div className="mt-10 flex justify-between items-center pt-8 border-t border-white/5">
                     <span className="mono text-[12px] text-white/20 uppercase tracking-widest">ID: {item.id.split('-')[1]} • {new Date(item.postedDate).toLocaleDateString()}</span>
                     <span className="mono text-[13px] text-cyan-400 font-bold uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">Read Story <i className="fas fa-arrow-right ml-2"></i></span>
                  </div>
                </article>
              ))
            ) : (
                <div className="col-span-full py-40 text-center border border-dashed border-white/10">
                    <div className="mono text-zinc-600 text-[16px] uppercase tracking-widest mb-4">No news found for this area</div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;