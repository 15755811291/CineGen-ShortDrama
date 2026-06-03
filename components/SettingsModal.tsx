import React from 'react';
import { X, Check, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeColor: string;
  onThemeColorChange: (color: string) => void;
  currentThemeMode: 'light' | 'dark';
  onThemeModeChange: (mode: 'light' | 'dark') => void;
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
  onThemeModeChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-secondary border border-main rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-main">
          <h2 className="text-lg font-bold text-main tracking-wide uppercase">系统设置</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-tertiary text-dim hover:text-main transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-dim uppercase tracking-widest mb-4">界面风格</label>
            <div className="flex p-1 bg-tertiary rounded-lg border border-main">
              <button
                onClick={() => onThemeModeChange('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                  currentThemeMode === 'light' 
                    ? 'bg-primary text-main shadow-sm' 
                    : 'text-dim hover:text-main'
                }`}
              >
                <Sun className="w-4 h-4" />
                浅色模式
              </button>
              <button
                onClick={() => onThemeModeChange('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
                  currentThemeMode === 'dark' 
                    ? 'bg-primary text-main shadow-sm' 
                    : 'text-dim hover:text-main'
                }`}
              >
                <Moon className="w-4 h-4" />
                深色模式
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-dim uppercase tracking-widest mb-4">主题配色</label>
            <div className="grid grid-cols-3 gap-4">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onThemeColorChange(color.value)}
                  className={`relative h-12 rounded-lg border-2 mb-4 transition-all flex items-center justify-center group ${
                    currentThemeColor === color.value 
                      ? 'border-brand bg-primary shadow-[0_0_15px_rgba(var(--brand-color-rgb),0.2)]' 
                      : 'border-main bg-primary/50 hover:border-brand/50'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full shadow-inner transition-transform group-hover:scale-110" 
                    style={{ backgroundColor: color.value }}
                  />
                  {currentThemeColor === color.value && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-3 h-3 text-brand" />
                    </div>
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-dim font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <div className="bg-tertiary border border-main p-4 rounded-lg">
              <h3 className="text-xs font-bold text-dim mb-2 uppercase tracking-wider">关于 CineGen</h3>
              <p className="text-[10px] text-muted leading-relaxed font-mono">
                CineGen AI Director v0.0.1<br />
                旨在通过生成式 AI 简化漫剧创作流程。
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-secondary border-t border-main flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-brand text-white font-bold uppercase tracking-widest text-[10px] rounded hover:opacity-90 transition-opacity"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
