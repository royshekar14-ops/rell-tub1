import { Home, Film, Clapperboard, LogIn, User, LogOut, Search, Menu, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type Page = 'home' | 'shorts' | 'full' | 'login' | 'upload';

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ current, onNavigate, open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'home' as Page, label: 'Home', icon: Home },
    { id: 'shorts' as Page, label: 'Shorts', icon: Clapperboard },
    { id: 'full' as Page, label: 'Full Videos', icon: Film },
    { id: 'upload' as Page, label: 'Upload', icon: UploadCloud },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-neutral-200 transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b border-neutral-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-600">
            <Clapperboard className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">ReelTube</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  active
                    ? 'bg-red-50 text-red-600'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{user.email}</p>
                  <p className="text-xs text-neutral-500">Signed in</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onNavigate('login');
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                current === 'login'
                  ? 'bg-red-50 text-red-600'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <LogIn className="w-5 h-5" />
              Login
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

interface TopbarProps {
  onMenuClick: () => void;
  onNavigate: (page: Page) => void;
}

export function Topbar({ onMenuClick, onNavigate }: TopbarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-lg border-b border-neutral-200 flex items-center px-4 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
      >
        <Menu className="w-5 h-5 text-neutral-700" />
      </button>

      <div className="lg:hidden flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600">
          <Clapperboard className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold tracking-tight text-neutral-900">ReelTube</span>
      </div>

      <div className="flex-1 max-w-2xl mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search videos, shorts, channels..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-neutral-100 border border-transparent focus:border-red-500 focus:bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                {user.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-xs font-medium text-neutral-700 max-w-[120px] truncate">{user.email}</span>
            </div>
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-neutral-700" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onNavigate('login')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <User className="w-4 h-4" />
            Login
          </button>
        )}
      </div>
    </header>
  );
}
