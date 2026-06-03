import React, { useState, useEffect } from 'react';
import { BrainCircuit, Wand2, ChevronRight, AlertCircle, Users, MapPin, List, TextQuote, Clock, BookOpen, PenTool, ArrowLeft, Languages, Aperture, AlignLeft } from 'lucide-react';
import { ProjectState } from '../types';
import { parseScriptToData, generateShotList } from '../services/geminiService';

interface Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
}

type TabMode = 'story' | 'script';

const DURATION_OPTIONS = [
  { label: '30秒 (广告)', value: '30s' },
  { label: '60秒 (预告)', value: '60s' },
  { label: '2分钟 (片花)', value: '120s' },
  { label: '5分钟 (短片)', value: '300s' },
  { label: '自定义', value: 'custom' }
];

const LANGUAGE_OPTIONS = [
  { label: '中文 (Chinese)', value: '中文' },
  { label: 'English (US)', value: 'English' },
  { label: '日本語 (Japanese)', value: 'Japanese' },
  { label: 'Français (French)', value: 'French' },
  { label: 'Español (Spanish)', value: 'Spanish' }
];

const StageScript: React.FC<Props> = ({ project, updateProject }) => {
  const [activeTab, setActiveTab] = useState<TabMode>(project.scriptData ? 'script' : 'story');
  
  const [localScript, setLocalScript] = useState(project.rawScript);
  const [localTitle, setLocalTitle] = useState(project.title);
  const [localDuration, setLocalDuration] = useState(project.targetDuration || '60s');
  const [localLanguage, setLocalLanguage] = useState(project.language || '中文');
  const [customDurationInput, setCustomDurationInput] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalScript(project.rawScript);
    setLocalTitle(project.title);
    setLocalDuration(project.targetDuration || '60s');
    setLocalLanguage(project.language || '中文');
  }, [project.id]);

  const handleDurationSelect = (val: string) => {
    setLocalDuration(val);
    if (val === 'custom') {
      setCustomDurationInput('');
    }
  };

  const getFinalDuration = () => {
    return localDuration === 'custom' ? customDurationInput : localDuration;
  };

  const handleAnalyze = async () => {
    if (!localScript.trim()) {
      setError("请输入剧本内容。");
      return;
    }

    const finalDuration = getFinalDuration();
    if (!finalDuration) {
      setError("请选择目标时长。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      updateProject({
        title: localTitle,
        rawScript: localScript,
        targetDuration: finalDuration,
        language: localLanguage,
        isParsingScript: true
      });

      const scriptData = await parseScriptToData(localScript, localLanguage);
      
      scriptData.targetDuration = finalDuration;
      scriptData.language = localLanguage;

      if (localTitle && localTitle !== "未命名项目") {
        scriptData.title = localTitle;
      }

      const shots = await generateShotList(scriptData);

      updateProject({ 
        scriptData, 
        shots, 
        isParsingScript: false,
        title: scriptData.title 
      });
      
      setActiveTab('script');

    } catch (err: any) {
      console.error(err);
      setError(`错误: ${err.message || "AI 连接失败"}`);
      updateProject({ isParsingScript: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStoryInput = () => (
    <div className="flex h-full bg-primary text-dim transition-colors duration-300">
      
      {/* Middle Column: Config Panel - Adjusted Width to w-96 */}
      <div className="w-96 border-r border-main flex flex-col bg-secondary">
        {/* Header - Fixed Height 56px */}
        <div className="h-14 px-5 border-b border-main flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-main tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-dim" />
              项目配置
            </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">项目标题</label>
              <input 
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full bg-tertiary border border-main text-main px-3 py-2.5 text-sm rounded-md focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand-muted transition-all placeholder:text-muted"
                placeholder="输入项目名称..."
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                输出语言
              </label>
              <div className="relative">
                <select
                  value={localLanguage}
                  onChange={(e) => setLocalLanguage(e.target.value)}
                  className="w-full bg-tertiary border border-main text-main px-3 py-2.5 text-sm rounded-md appearance-none focus:border-brand focus:outline-none transition-all cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                   <ChevronRight className="w-4 h-4 text-muted rotate-90" />
                </div>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                目标时长
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleDurationSelect(opt.value)}
                    className={`px-2 py-2.5 text-[11px] font-medium rounded-md transition-all text-center border ${
                      localDuration === opt.value
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-transparent border-main text-dim hover:border-brand/50 hover:text-main'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {localDuration === 'custom' && (
                <div className="pt-1">
                  <input 
                    type="text"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    className="w-full bg-tertiary border border-main text-main px-3 py-2.5 text-sm rounded-md focus:border-brand focus:outline-none font-mono placeholder:text-muted"
                    placeholder="输入时长 (如: 90s, 3m)"
                  />
                </div>
              )}
            </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-main bg-secondary">
           <button
              onClick={handleAnalyze}
              disabled={isProcessing}
              className={`w-full py-3.5 font-bold text-xs tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                isProcessing 
                  ? 'bg-tertiary text-muted cursor-not-allowed'
                  : 'bg-brand text-white hover:opacity-90 shadow-brand/10'
              }`}
            >
              {isProcessing ? (
                <>
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                  智能分析中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  生成分镜脚本
                </>
              )}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-900/10 border border-red-900/50 text-red-500 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {error}
              </div>
            )}
        </div>
      </div>

      {/* Right: Text Editor - Optimized */}
      <div className="flex-1 flex flex-col bg-primary relative transition-colors duration-300">
        <div className="h-14 border-b border-main flex items-center justify-between px-8 bg-primary shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
              <span className="text-xs font-bold text-dim">剧本编辑器</span>
           </div>
           <span className="text-[10px] font-mono text-muted uppercase tracking-widest">MARKDOWN SUPPORTED</span>
        </div>
        
        <div className="flex-1 overflow-y-auto">
           <div className="max-w-3xl mx-auto h-full flex flex-col py-12 px-8">
              <textarea
                  value={localScript}
                  onChange={(e) => setLocalScript(e.target.value)}
                  className="flex-1 bg-transparent text-main font-serif text-lg leading-loose focus:outline-none resize-none placeholder:text-muted/30 selection:bg-brand-muted"
                  placeholder="在此输入故事大纲或直接粘贴剧本..."
                  spellCheck={false}
              />
           </div>
        </div>

        {/* Editor Status Footer */}
        <div className="h-8 border-t border-main bg-primary px-4 flex items-center justify-end gap-4 text-[10px] text-muted font-mono select-none">
           <span>{localScript.length} 字符</span>
           <span>{localScript.split('\n').length} 行</span>
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
             {project.lastModified ? '已自动保存' : '准备就绪'}
           </div>
        </div>
      </div>
    </div>
  );

  const renderScriptBreakdown = () => {
    // Deduplication Logic
    const seenLocations = new Set();
    const uniqueScenesList = (project.scriptData?.scenes || []).filter(scene => {
      const normalizedLoc = scene.location.trim().toLowerCase();
      if (seenLocations.has(normalizedLoc)) {
        return false;
      }
      seenLocations.add(normalizedLoc);
      return true;
    });

    return (
      <div className="flex flex-col h-full bg-primary animate-in fade-in duration-500 transition-colors duration-300">
        {/* Header */}
        <div className="h-16 px-6 border-b border-main bg-secondary flex items-center justify-between shrink-0 z-20">
           <div className="flex items-center gap-6">
              <h2 className="text-lg font-light text-main tracking-tight flex items-center gap-3">
                 <List className="w-5 h-5 text-dim" />
                 拍摄清单
                 <span className="text-xs text-muted font-mono uppercase tracking-wider ml-1">Script Manifest</span>
              </h2>
              <div className="h-6 w-px bg-main"></div>
              
              <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-muted uppercase tracking-widest">项目</span>
                      <span className="text-sm text-dim font-medium">{project.scriptData?.title}</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-muted uppercase tracking-widest">时长</span>
                      <span className="text-sm font-mono text-dim">{project.targetDuration}</span>
                  </div>
              </div>
           </div>
           
           <button 
             onClick={() => setActiveTab('story')}
             className="text-xs font-bold text-dim hover:text-main flex items-center gap-2 px-4 py-2 hover:bg-tertiary rounded-lg transition-all"
           >
             <ArrowLeft className="w-3 h-3" />
             返回编辑
           </button>
        </div>
  
        {/* Content Split View */}
        <div className="flex-1 overflow-hidden flex">
           
           {/* Sidebar: Index */}
           <div className="w-72 border-r border-main bg-secondary flex flex-col hidden lg:flex">
              <div className="p-6 border-b border-main">
                 <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                   <TextQuote className="w-3 h-3" /> 故事梗概
                 </h3>
                 <p className="text-xs text-dim italic leading-relaxed font-serif">"{project.scriptData?.logline}"</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Characters */}
                  <section>
                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Users className="w-3 h-3" /> 演员表
                    </h3>
                    <div className="space-y-2">
                       {project.scriptData?.characters.map(c => (
                         <div key={c.id} className="flex justify-between items-center group cursor-default p-2 rounded hover:bg-tertiary transition-colors">
                            <span className="text-sm text-dim font-medium group-hover:text-main">{c.name}</span>
                            <span className="text-[10px] text-muted font-mono">{c.gender}</span>
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* Scenes */}
                  <section>
                    <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                       <MapPin className="w-3 h-3" /> 场景列表
                    </h3>
                    <div className="space-y-1">
                       {uniqueScenesList.map((s) => (
                         <div key={s!.id} className="flex items-center gap-3 text-xs text-dim group cursor-default p-2 rounded hover:bg-tertiary transition-colors">
                            <div className="w-1.5 h-1.5 bg-muted rounded-full group-hover:bg-brand transition-colors"></div>
                            <span className="truncate group-hover:text-main">{s!.location}</span>
                         </div>
                       ))}
                    </div>
                  </section>
              </div>
           </div>
  
           {/* Main: Script & Shots */}
           <div className="flex-1 overflow-y-auto bg-primary p-0">
              <div className="max-w-5xl mx-auto pb-20">
                 {project.scriptData?.scenes.map((scene, index) => {
                   const sceneShots = project.shots.filter(s => s.sceneId === scene.id);
                   if (sceneShots.length === 0) return null;

                   return (
                     <div key={scene.id} className="border-b border-main">
                        {/* Scene Header strip */}
                        <div className="sticky top-0 z-10 bg-secondary/95 backdrop-blur border-y border-main px-8 py-5 flex items-center justify-between shadow-lg shadow-black/5">
                           <div className="flex items-baseline gap-4">
                              <span className="text-3xl font-bold text-brand/20 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                              <h3 className="text-lg font-bold text-main uppercase tracking-wider">
                                 {scene.location}
                              </h3>
                           </div>
                           <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest text-muted">
                              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3"/> {scene.time}</span>
                              <span className="text-main/10">|</span>
                              <span>{scene.atmosphere}</span>
                           </div>
                        </div>
  
                        {/* Shot Rows */}
                        <div className="divide-y divide-main">
                           {sceneShots.map((shot, sIdx) => (
                             <div key={shot.id} className="group bg-primary hover:bg-secondary transition-colors p-8 flex gap-8">
                                
                                {/* Shot ID & Tech Data */}
                                <div className="w-32 flex-shrink-0 flex flex-col gap-4">
                                   <div className="text-xs font-mono text-muted group-hover:text-brand transition-colors">
                                     SHOT {(project.shots.indexOf(shot) + 1).toString().padStart(3, '0')}
                                   </div>
                                   
                                   <div className="flex flex-col gap-2">
                                     <div className="px-2 py-1 bg-tertiary border border-main text-[10px] font-mono text-muted uppercase text-center rounded">
                                       {shot.shotSize || 'MED'}
                                     </div>
                                     <div className="px-2 py-1 bg-tertiary border border-main text-[10px] font-mono text-muted uppercase text-center rounded">
                                       {shot.cameraMovement}
                                     </div>
                                   </div>
                                </div>

                                {/* Main Action */}
                                <div className="flex-1 space-y-4">
                                   <p className="text-main text-sm leading-7 font-medium max-w-2xl">
                                     {shot.actionSummary}
                                   </p>
                                   
                                   {shot.dialogue && (
                                      <div className="pl-6 border-l-2 border-main group-hover:border-brand transition-colors py-1">
                                         <p className="text-dim font-serif italic text-sm">"{shot.dialogue}"</p>
                                      </div>
                                   )}
                                   
                                   {/* Tags/Characters */}
                                   <div className="flex flex-wrap gap-2 pt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                      {shot.characters.map(cid => {
                                         const char = project.scriptData?.characters.find(c => c.id === cid);
                                         return char ? (
                                           <span key={cid} className="text-[10px] uppercase font-bold tracking-wider text-muted border border-main px-2 py-0.5 rounded-full bg-tertiary">
                                              {char.name}
                                           </span>
                                         ) : null;
                                      })}
                                   </div>
                                </div>

                                {/* Prompt Preview */}
                                <div className="w-64 hidden xl:block pl-6 border-l border-main">
                                   <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <Aperture className="w-3 h-3" /> 画面提示词 (AI Prompt)
                                   </div>
                                   <p className="text-[10px] text-muted font-mono leading-relaxed line-clamp-4 hover:line-clamp-none hover:text-dim transition-all cursor-text bg-tertiary/30 p-2 rounded">
                                     {shot.keyframes[0]?.visualPrompt}
                                   </p>
                                </div>

                             </div>
                           ))}
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-primary transition-colors duration-300">
      {activeTab === 'story' ? renderStoryInput() : renderScriptBreakdown()}
    </div>
  );
};

export default StageScript;