import { useState } from 'react';
import { Outlet, NavLink } from 'react-router';
import {
  Network,
  ShieldCheck,
  Settings,
  HelpCircle,
  Terminal,
  Bell,
  History,
  CloudOff,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '@heroui/react';

export default function Layout() {
  const { logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    // { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Nodes', icon: Network, path: '/nodes' },
    // { name: 'Mesh Traffic', icon: Activity, path: '/monitoring' },
    { name: 'Security', icon: ShieldCheck, path: '/security' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const secondaryNavItems = [
    { name: 'Support', icon: HelpCircle, path: '/support' },
    { name: 'Logs', icon: Terminal, path: '/logs' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center space-x-3 px-3 py-2 rounded font-sans text-sm tracking-tight group transition-colors',
      isActive
        ? 'bg-surface-container-high text-primary font-bold border-r-2 border-primary'
        : 'text-on-surface-variant hover:bg-surface-container-high'
    );

  const iconClass = (isActive: boolean) =>
    clsx(
      'w-5 h-5 transition-colors',
      isActive ? 'text-primary' : 'text-secondary group-hover:text-on-surface'
    );

  const SidebarContent = (
    <>
      <div className="px-6 mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded flex items-center justify-center">
            <img alt="biway-logo" src="/assets/images/logo.svg" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-xl tracking-tighter text-on-surface leading-none">Biway</h1>
            <p className="font-sans text-xs tracking-tight text-secondary mt-1">Network Mesh</p>
          </div>
        </div>
        <button
          className="md:hidden text-secondary hover:text-on-surface p-1"
          onClick={() => setIsMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsMobileNavOpen(false)}
            className={navLinkClass}
          >
            {({ isActive }) => (
              <>
                <item.icon className={iconClass(isActive)} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-auto space-y-1 border-t border-outline-variant pt-4">
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsMobileNavOpen(false)}
            className={navLinkClass}
          >
            {({ isActive }) => (
              <>
                <item.icon className={iconClass(isActive)} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="flex items-center space-x-3 px-3 py-3 mt-4 border border-outline-variant rounded bg-surface-container-low">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwGKhkmSuzWyP97uBgiNB_LhY9zPASrgF0jC66TWYJB9P4JwV1LGBeBCJCHqrWj_mk_ZuhxCvQ5zAGYKNguXRkoPNof5s5wDnRat_TsialiBdr0WymZJQMgJQ3ePhJTfEExSdgn1DoEMAJB7pdbArGG62Udu3J_zEXl4367rLLtzDD5ZO4QZnvqh1j7UmmZt7E25GEA4q8kWCJ8A0i1hQH0jJEAO26oiJF-4TWPMVXS9pH-2nUjCI4gWtRdzXq2RUOJ4PXkBqOYVg"
            alt="Admin"
            className="h-8 w-8 rounded-full object-cover border border-outline"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">Admin</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-secondary hover:text-error hover:bg-error/10 rounded transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 border-r border-outline-variant py-6 bg-surface shrink-0 z-20">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar (drawer) */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative flex flex-col h-screen w-64 py-6 bg-surface z-40 animate-in slide-in-from-left duration-200">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top bar */}
        <header className="flex justify-between items-center px-6 py-3 w-full border-b border-outline-variant bg-surface-dim z-10 shrink-0">
          <div className="flex items-center space-x-4 flex-1">
            <button
              className="md:hidden text-secondary hover:text-on-surface"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search network..." 
                className="w-full bg-surface-container border border-outline-variant rounded py-1.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div> */}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 border-r border-outline-variant pr-4">
              <button className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-150 p-1.5 rounded hover:bg-surface-container relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-150 p-1.5 rounded hover:bg-surface-container">
                <History className="w-5 h-5" />
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-150 p-1.5 rounded hover:bg-surface-container">
                <CloudOff className="w-5 h-5 text-tertiary" />
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-on-surface">System Okay</p>
                <p className="text-xs text-secondary">Latency Stable</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
      <Toast.Provider />
    </div>
  );
}