import { LayoutDashboard, Box, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Box, label: 'Functions', to: '/functions' },
  { icon: Activity, label: 'Runners', to: '/runners' },
  /*{ icon: Settings, label: 'Settings', to: '/settings' },*/
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-card text-foreground border-r border-border flex flex-col h-screen shadow-sm">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-sm transform -rotate-3">
            I
          </span>
          Ivory
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <item.icon size={22} strokeWidth={2.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
{/*
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-secondary border-2 border-white shadow-sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">User</p>
            <p className="text-xs text-muted-foreground truncate">user@example.com</p>
          </div>
        </div>
      </div>
      */}
    </aside>
  );
}
