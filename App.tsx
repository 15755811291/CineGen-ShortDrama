import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StageScript from './components/StageScript';
import StageAssets from './components/StageAssets';
import StageDirector from './components/StageDirector';
import StageExport from './components/StageExport';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import { ProjectState, AiModelConfig } from './types';
import { Key, Save, CheckCircle, ArrowRight, ShieldCheck, Settings } from 'lucide-react';
import { saveProjectToDB } from './services/storageService';
import { updateAiConfig } from './services/aiService';

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('unsaved');
  const [themeColor, setThemeColor] = useState<string>('#6366f1');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [aiConfig, setAiConfig] = useState<AiModelConfig>(() => {
    const stored = localStorage.getItem('cinegen_ai_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse AI config", e);
      }
    }
    return {
      provider: 'google',
      apiKey: '',
      textModel: 'gemini-2.5-flash',
      imageModel: 'gemini-2.5-flash-image',
      videoModel: 'veo-3.1-fast-generate-preview'
    };
  });

  // Ref to hold debounce timer
  const saveTimeoutRef = useRef<any>(null);
  const statusHideTimeoutRef = useRef<any>(null);

  // Load API Key and Theme from localStorage on mount
  useEffect(() => {
    const storedConfig = localStorage.getItem('cinegen_ai_config');
    const storedKey = localStorage.getItem('cinegen_api_key');
    
    let finalConfig = aiConfig;
    if (storedConfig) {
      try {
        finalConfig = JSON.parse(storedConfig);
      } catch (e) {
        console.error("Failed to parse stored config", e);
      }
    }

    if (storedKey) {
      setApiKey(storedKey);
      finalConfig = { ...finalConfig, apiKey: finalConfig.apiKey || storedKey };
    }
    
    setAiConfig(finalConfig);
    updateAiConfig(finalConfig);

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

  const handleAiConfigChange = (config: AiModelConfig) => {
    setAiConfig(config);
    updateAiConfig(config);
    localStorage.setItem('cinegen_ai_config', JSON.stringify(config));
    // 同步更新 apiKey，防止退出登录逻辑失效
    if (config.apiKey) {
      setApiKey(config.apiKey);
      localStorage.setItem('cinegen_api_key', config.apiKey);
    }
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
        
        // 3秒后隐藏“已保存”状态
        if (statusHideTimeoutRef.current) clearTimeout(statusHideTimeoutRef.current);
        statusHideTimeoutRef.current = setTimeout(() => {
          setSaveStatus('unsaved');
        }, 3000);
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
    const newConfig = { ...aiConfig, apiKey: inputKey };
    setAiConfig(newConfig);
    updateAiConfig(newConfig);
    localStorage.setItem('cinegen_api_key', inputKey);
    localStorage.setItem('cinegen_ai_config', JSON.stringify(newConfig));
  };

  const handleClearKey = () => {
    localStorage.removeItem('cinegen_api_key');
    localStorage.removeItem('cinegen_ai_config');
    setApiKey('');
    const resetConfig = { ...aiConfig, apiKey: '' };
    setAiConfig(resetConfig);
    updateAiConfig(resetConfig);
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

  // Dashboard View
  if (!project) {
    return (
      <div className="bg-primary min-h-screen transition-colors duration-300">
        {apiKey && (
          <button onClick={handleClearKey} className="fixed top-4 right-4 z-50 text-[10px] text-dim hover:text-red-500 transition-colors uppercase font-mono tracking-widest">
            Sign Out
          </button>
        )}
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
          aiConfig={aiConfig}
          onAiConfigChange={handleAiConfigChange}
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
        {(saveStatus === 'saving' || saveStatus === 'saved') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 text-xs font-mono text-dim bg-secondary/80 border border-main px-4 py-1.5 rounded-full backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl border-brand/20">
            {saveStatus === 'saving' ? (
              <>
                <Save className="w-3 h-3 animate-pulse text-brand" />
                <span className="opacity-70">保存中...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-500/80">已保存</span>
              </>
            )}
          </div>
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentThemeColor={themeColor} 
        onThemeColorChange={handleThemeColorChange} 
        currentThemeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
        aiConfig={aiConfig}
        onAiConfigChange={handleAiConfigChange}
      />

      <div className="lg:hidden fixed inset-0 bg-black z-[100] flex items-center justify-center p-8 text-center">
        <p className="text-zinc-500">为了获得最佳体验，请使用桌面浏览器访问。</p>
      </div>
    </div>
  );
}

export default App;
