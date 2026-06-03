import React from 'react';
import { X, Check, Sun, Moon, Cpu, Globe, Palette, Info } from 'lucide-react';
import { AiModelConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeColor: string;
  onThemeColorChange: (color: string) => void;
  currentThemeMode: 'light' | 'dark';
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  aiConfig: AiModelConfig;
  onAiConfigChange: (config: AiModelConfig) => void;
}

const THEME_COLORS = [
  { name: 'Indigo', value: '#6366f1', rgb: '99, 102, 241' },
  { name: 'Emerald', value: '#10b981', rgb: '16, 185, 129' },
  { name: 'Rose', value: '#f43f5e', rgb: '244, 63, 94' },
  { name: 'Amber', value: '#f59e0b', rgb: '245, 158, 11' },
  { name: 'Sky', value: '#0ea5e9', rgb: '14, 165, 233' },
  { name: 'Violet', value: '#8b5cf6', rgb: '139, 92, 246' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentThemeColor, 
  onThemeColorChange,
  currentThemeMode,
  onThemeModeChange,
  aiConfig,
  onAiConfigChange
}) => {
  const [activeTab, setActiveTab] = React.useState<'appearance' | 'models' | 'about'>('appearance');

  if (!isOpen) return null;

  const handleProviderChange = (provider: AiModelConfig['provider']) => {
    let textModel = aiConfig.textModel;
    let imageModel = aiConfig.imageModel;
    let videoModel = aiConfig.videoModel;

    if (provider === 'google') {
      textModel = 'gemini-2.5-flash';
      imageModel = 'gemini-2.5-flash-image';
      videoModel = 'veo-3.1-fast-generate-preview';
    } else if (provider === 'siliconflow') {
      textModel = 'deepseek-ai/DeepSeek-V3';
      imageModel = 'black-forest-labs/FLUX.1-schnell';
      videoModel = 'Wan-AI/Wan2.2-I2V-A14B';
    }

    onAiConfigChange({
      ...aiConfig,
      provider,
      baseUrl: provider === 'google' ? '' : (provider === 'siliconflow' ? 'https://api.siliconflow.cn/v1' : aiConfig.baseUrl),
      textModel,
      imageModel,
      videoModel,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-secondary border border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-main shrink-0">
          <h2 className="text-lg font-bold text-main tracking-wide uppercase">系统设置</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-tertiary text-dim hover:text-main transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-40 border-r border-main bg-tertiary/30 p-4 space-y-2 shrink-0">
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'appearance' ? 'bg-brand text-white shadow-lg' : 'text-dim hover:bg-tertiary hover:text-main'}`}
            >
              <Palette className="w-4 h-4" /> 界面外观
            </button>
            <button 
              onClick={() => setActiveTab('models')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'models' ? 'bg-brand text-white shadow-lg' : 'text-dim hover:bg-tertiary hover:text-main'}`}
            >
              <Cpu className="w-4 h-4" /> 模型配置
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'about' ? 'bg-brand text-white shadow-lg' : 'text-dim hover:bg-tertiary hover:text-main'}`}
            >
              <Info className="w-4 h-4" /> 关于系统
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-secondary">
            {activeTab === 'appearance' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
                <section>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-4">界面风格</label>
                  <div className="flex p-1 bg-tertiary rounded-lg border border-main">
                    <button
                      onClick={() => onThemeModeChange('light')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${currentThemeMode === 'light' ? 'bg-primary text-main shadow-sm' : 'text-dim hover:text-main'}`}
                    >
                      <Sun className="w-4 h-4" /> 浅色模式
                    </button>
                    <button
                      onClick={() => onThemeModeChange('dark')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${currentThemeMode === 'dark' ? 'bg-primary text-main shadow-sm' : 'text-dim hover:text-main'}`}
                    >
                      <Moon className="w-4 h-4" /> 深色模式
                    </button>
                  </div>
                </section>

                <section>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-4">主题配色</label>
                  <div className="grid grid-cols-3 gap-4">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => onThemeColorChange(color.value)}
                        className={`relative h-12 rounded-lg border-2 mb-4 transition-all flex items-center justify-center group ${currentThemeColor === color.value ? 'border-brand bg-primary shadow-[0_0_15px_rgba(var(--brand-color-rgb),0.2)]' : 'border-main bg-primary/50 hover:border-brand/50'}`}
                      >
                        <div className="w-4 h-4 rounded-full shadow-inner transition-transform group-hover:scale-110" style={{ backgroundColor: color.value }} />
                        {currentThemeColor === color.value && <div className="absolute top-1 right-1"><Check className="w-3 h-3 text-brand" /></div>}
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <section>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-4">API 服务商</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['google', 'siliconflow', 'custom'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleProviderChange(p as any)}
                        className={`py-2.5 px-4 text-xs font-bold rounded-lg border transition-all ${aiConfig.provider === p ? 'bg-brand/10 border-brand text-brand shadow-sm' : 'bg-tertiary border-main text-dim hover:border-brand/50'}`}
                      >
                        {p === 'google' ? 'Google AI' : p === 'siliconflow' ? '硅基流动' : '自定义 API'}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest">API Key</label>
                      <input 
                        type="password"
                        value={aiConfig.apiKey}
                        onChange={(e) => onAiConfigChange({ ...aiConfig, apiKey: e.target.value })}
                        className="w-full bg-tertiary border border-main text-main px-3 py-2 text-sm rounded-lg focus:border-brand focus:outline-none transition-all font-mono"
                        placeholder="输入您的 API Key..."
                      />
                    </div>

                    {aiConfig.provider !== 'google' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Base URL</label>
                        <input 
                          type="text"
                          value={aiConfig.baseUrl}
                          onChange={(e) => onAiConfigChange({ ...aiConfig, baseUrl: e.target.value })}
                          className="w-full bg-tertiary border border-main text-main px-3 py-2 text-sm rounded-lg focus:border-brand focus:outline-none transition-all font-mono"
                          placeholder="https://api.openai.com/v1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-main/50">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                        文本模型 (Text) <span className="text-[9px] font-normal text-muted lowercase">(剧本、分镜)</span>
                      </label>
                      <input 
                        type="text"
                        value={aiConfig.textModel}
                        onChange={(e) => onAiConfigChange({ ...aiConfig, textModel: e.target.value })}
                        className="w-full bg-tertiary border border-main text-main px-3 py-2 text-sm rounded-lg focus:border-brand focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                        图像模型 (Image) <span className="text-[9px] font-normal text-muted lowercase">(概念图、首帧)</span>
                      </label>
                      <input 
                        type="text"
                        value={aiConfig.imageModel}
                        onChange={(e) => onAiConfigChange({ ...aiConfig, imageModel: e.target.value })}
                        className="w-full bg-tertiary border border-main text-main px-3 py-2 text-sm rounded-lg focus:border-brand focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                        视频模型 (Video) <span className="text-[9px] font-normal text-muted lowercase">(Veo / Sora)</span>
                      </label>
                      <input 
                        type="text"
                        value={aiConfig.videoModel}
                        onChange={(e) => onAiConfigChange({ ...aiConfig, videoModel: e.target.value })}
                        className="w-full bg-tertiary border border-main text-main px-3 py-2 text-sm rounded-lg focus:border-brand focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-tertiary/50 border border-main p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-brand text-white flex items-center justify-center rounded-xl shadow-lg shadow-brand/20">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-main font-bold">CineGen AI Director</h3>
                      <p className="text-[10px] text-muted font-mono uppercase tracking-widest">Version 0.0.1 Stable</p>
                    </div>
                  </div>
                  <p className="text-xs text-dim leading-relaxed font-medium">
                    CineGen 是一款面向未来的 AI 漫剧创作工具。通过整合全球最先进的生成式模型（Gemini, Veo, SiliconFlow 等），
                    我们将复杂的影视创作流程简化为直观的导演工作流。
                  </p>
                  <div className="pt-4 flex items-center gap-3">
                    <span className="px-2 py-1 bg-tertiary border border-main text-[9px] text-muted font-mono rounded">REACT 18</span>
                    <span className="px-2 py-1 bg-tertiary border border-main text-[9px] text-muted font-mono rounded">TAILWIND 3</span>
                    <span className="px-2 py-1 bg-tertiary border border-main text-[9px] text-muted font-mono rounded">TYPESCRIPT 5</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-secondary border-t border-main flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-brand text-white font-bold uppercase tracking-widest text-[10px] rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-brand/20"
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
