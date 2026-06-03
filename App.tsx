import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StageScript from './components/StageScript';
import StageAssets from './components/StageAssets';
import StageDirector from './components/StageDirector';
import StageExport from './components/StageExport';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import { ProjectState } from './types';
import { Key, Save, CheckCircle, ArrowRight, ShieldCheck, Settings } from 'lucide-react';
import { saveProjectToDB } from './services/storageService';
import { setGlobalApiKey } from './services/geminiService';

const HomeLinks = () => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-zinc-800 bg-black/70 px-4 py-2 text-[11px] font-mono text-zinc-400 backdrop-blur-sm">
    <a
      href="https://github.com/Will-Water/CineGen-AI"
      target="_blank"
      rel="noreferrer"
      className="hover:text-white transition-colors"
    >
      GitHub
    </a>
    <span className="text-zinc-700">|</span>
    <a
      href="https://anikuku.com/?from=open-source"
      target="_blank"
      rel="noreferrer"
      className="hover:text-white transition-colors"
    >
      anikuku.com
    </a>
  </div>
);

function App() {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [inputKey, setInputKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [themeColor, setThemeColor] = useState<string>('#6366f1');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Ref to hold debounce timer
  const saveTimeoutRef = useRef<any>(null);

  // Load API Key and Theme from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('cinegen_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setGlobalApiKey(storedKey);
    }

    const storedColor = localStorage.getItem('cinegen_theme_color');
    if (storedColor) {
      setThemeColor(storedColor);
      applyThemeColor(storedColor);
    }

    const storedMode = localStorage.getItem('cinegen_theme_mode') as 'light' | 'dark';
    if (storedMode) {
      setThemeMode(storedMode);
      applyThemeMode(storedMode);
    } else {
      applyThemeMode('dark');
    }
  }, []);

  const applyThemeColor = (color: string) => {
    document.documentElement.style.setProperty('--brand-color', color);
    // Convert hex to rgb for rgba usage
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--brand-color-rgb', `${r}, ${g}, ${b}`);
  };

  const applyThemeMode = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeColorChange = (color: string) => {
    setThemeColor(color);
    applyThemeColor(color);
    localStorage.setItem('cinegen_theme_color', color);
  };

  const handleThemeModeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    applyThemeMode(mode);
    localStorage.setItem('cinegen_theme_mode', mode);
  };

  // Auto-save logic
  useEffect(() => {
    if (!project) return;

    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveProjectToDB(project);
        setSaveStatus('saved');
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 1000); // Debounce 1s

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [project]);

  const handleSaveKey = () => {
    if (!inputKey.trim()) return;
    setApiKey(inputKey);
    setGlobalApiKey(inputKey);
    localStorage.setItem('cinegen_api_key', inputKey);
  };

  const handleClearKey = () => {
    localStorage.removeItem('cinegen_api_key');
    setApiKey('');
    setGlobalApiKey('');
    setProject(null);
  };

  const updateProject = (updates: Partial<ProjectState>) => {
    if (!project) return;
    setProject(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const setStage = (stage: 'script' | 'assets' | 'director' | 'export') => {
    updateProject({ stage });
  };

  const handleOpenProject = (proj: ProjectState) => {
    setProject(proj);
  };

  const handleExitProject = async () => {
    // Force save before exiting
    if (project) {
      await saveProjectToDB(project);
    }
    setProject(null);
  };

  const renderStage = () => {
    if (!project) return null;
    switch (project.stage) {
      case 'script':
        return <StageScript project={project} updateProject={updateProject} />;
      case 'assets':
        return <StageAssets project={project} updateProject={updateProject} />;
      case 'director':
        return <StageDirector project={project} updateProject={updateProject} />;
      case 'export':
        return <StageExport project={project} />;
      default:
        return <div className="text-white">未知阶段</div>;
    }
  };

  // API Key Entry Screen (Industrial Design)
  if (!apiKey) {
    return (
      <>
        <div className="h-screen bg-primary flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-300">
          {/* Background Accents */}
          <div className="absolute top-0 right-0 p-64 bg-brand-muted blur-[150px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 p-48 bg-tertiary/20 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="w-full max-w-md bg-secondary border border-main p-8 rounded-xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">

            <div className="flex items-center gap-3 mb-8 border-b border-main pb-6">
              <div className="w-10 h-10 bg-brand text-white flex items-center justify-center rounded">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-main tracking-wide">CineGen AI Director</h1>
                <p className="text-[10px] text-dim uppercase tracking-widest font-mono">Authentication Required</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-dim uppercase tracking-widest mb-2">Google Gemini API Key</label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter your API Key..."
                  className="w-full bg-tertiary border border-main text-main px-4 py-3 text-sm rounded-lg focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand-muted transition-all font-mono placeholder:text-muted"
                />
                <p className="mt-3 text-[10px] text-dim leading-relaxed">
                  本应用需要 Gemini 2.5 Flash 及 Veo 视频生成权限。请确保您的 API Key 关联了已开通结算功能的 Google Cloud 项目。
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-brand hover:underline ml-1">查看文档</a>
                </p>
              </div>

              <button
                onClick={handleSaveKey}
                disabled={!inputKey}
                className="w-full py-3 bg-brand text-white font-bold uppercase tracking-widest text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Access <ArrowRight className="w-3 h-3" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted font-mono">
                <ShieldCheck className="w-3 h-3" />
                Key is stored locally in your browser
              </div>
            </div>
          </div>
        </div>
        <HomeLinks />
      </>
    );
  }

  // Dashboard View
  if (!project) {
    return (
      <div className="bg-primary min-h-screen transition-colors duration-300">
        <button onClick={handleClearKey} className="fixed top-4 right-4 z-50 text-[10px] text-dim hover:text-red-500 transition-colors uppercase font-mono tracking-widest">
          Sign Out
        </button>
        <Dashboard onOpenProject={handleOpenProject} />
        <HomeLinks />
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-secondary border border-main text-dim hover:text-main rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <Settings className="w-4 h-4" />
        </button>
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          currentThemeColor={themeColor} 
          onThemeColorChange={handleThemeColorChange} 
          currentThemeMode={themeMode}
          onThemeModeChange={handleThemeModeChange}
        />
      </div>
    );
  }

  // Workspace View
  return (
    <div className="flex h-screen bg-primary font-sans text-main selection:bg-brand-muted transition-colors duration-300">
      <Sidebar
        currentStage={project.stage}
        setStage={setStage}
        onExit={handleExitProject}
        projectName={project.title}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="ml-72 flex-1 h-screen overflow-hidden relative border-l border-main">
        {renderStage()}

        {/* Save Status Indicator */}
        <div className="absolute top-4 right-6 pointer-events-none opacity-50 flex items-center gap-2 text-xs font-mono text-dim bg-secondary border border-main px-2 py-1 rounded-full backdrop-blur-sm z-50">
          {saveStatus === 'saving' ? (
            <>
              <Save className="w-3 h-3 animate-pulse" />
              保存中...
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              已保存
            </>
          )}
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentThemeColor={themeColor} 
        onThemeColorChange={handleThemeColorChange} 
        currentThemeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
      />

      <div className="lg:hidden fixed inset-0 bg-black z-[100] flex items-center justify-center p-8 text-center">
        <p className="text-zinc-500">为了获得最佳体验，请使用桌面浏览器访问。</p>
      </div>
    </div>
  );
}

export default App;
