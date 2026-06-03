import React from 'react';
import { LayoutDashboard, FileText, Users, Clapperboard, Film, Settings, ChevronLeft, Aperture } from 'lucide-react';

interface SidebarProps {
  currentStage: string;
  setStage: (stage: 'script' | 'assets' | 'director' | 'export') => void;
  onExit: () => void;
  projectName?: string;
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStage, setStage, onExit, projectName, onOpenSettings }) => {
  const navItems = [
    { id: 'script', label: '剧本与故事', icon: FileText, sub: 'Phase 01' },
    { id: 'assets', label: '角色与场景', icon: Users, sub: 'Phase 02' },
    { id: 'director', label: '导演工作台', icon: Clapperboard, sub: 'Phase 03' },
    { id: 'export', label: '成片与导出', icon: Film, sub: 'Phase 04' },
  ];

  return (
    <aside className="w-72 bg-secondary border-r border-main h-screen fixed left-0 top-0 flex flex-col z-50 select-none transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-main">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-brand text-white flex items-center justify-center flex-shrink-0 rounded">
            <Aperture className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-main tracking-wider uppercase">CineGen AI</h1>
            <p className="text-[10px] text-dim uppercase tracking-widest">Studio Pro</p>
          </div>
        </div>

        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-dim hover:text-main transition-colors text-xs font-mono uppercase tracking-wide group"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          返回项目列表
        </button>
      </div>

      {/* Project Status */}
      <div className="px-6 py-4 border-b border-main">
         <div className="text-[10px] text-muted uppercase tracking-widest mb-1">当前项目</div>
         <div className="text-sm font-medium text-main truncate font-mono">{projectName || '未命名项目'}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = currentStage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setStage(item.id as any)}
              className={`w-full flex items-center justify-between px-6 py-4 transition-all duration-200 group relative border-l-2 ${
                isActive 
                  ? 'border-brand bg-brand/10 text-brand' 
                  : 'border-transparent text-dim hover:text-main hover:bg-tertiary'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-dim/60 group-hover:text-main'}`} />
                <span className={`font-medium text-xs tracking-wider uppercase ${isActive ? 'text-brand' : ''}`}>{item.label}</span>
              </div>
              <span className={`text-[10px] font-mono ${isActive ? 'text-brand' : 'text-muted'}`}>{item.sub}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-main">
        <div 
          onClick={onOpenSettings}
          className="flex items-center justify-between text-dim hover:text-main cursor-pointer transition-colors group/settings"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest group-hover/settings:translate-x-1 transition-transform">系统设置</span>
          <Settings className="w-4 h-4" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;