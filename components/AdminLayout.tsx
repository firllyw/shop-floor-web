'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  FolderTree, 
  CalendarDays, 
  CheckSquare,
  ChevronDown,
  Wrench,
  KanbanSquare
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isCurrent = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-white text-lg font-bold tracking-wide">ShopFloor OS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          
          {/* Group 1: Overview */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Overview</div>
            <Link href="/" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${pathname === '/' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
          </div>

          {/* Group 2: Configuration */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Configuration</div>
            <div className="space-y-1">
              <Link href="/configuration/users" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isCurrent('/configuration/users') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <Users className="w-5 h-5 mr-3" />
                User Management
              </Link>
              <Link href="/supervisor/area" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isCurrent('/supervisor/area') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <Map className="w-5 h-5 mr-3" />
                Area Management
              </Link>
              <Link href="/supervisor/tool" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isCurrent('/supervisor/tool') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <Wrench className="w-5 h-5 mr-3" />
                Tool Management
              </Link>
              <Link href="/configuration/asset-tree" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isCurrent('/configuration/asset-tree') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <FolderTree className="w-5 h-5 mr-3" />
                Asset Tree
              </Link>
            </div>
          </div>

          {/* Group 3: Operations */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Operations</div>
            <div className="space-y-1">
              <Link href="/supervisor/tasks" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isCurrent('/supervisor/tasks') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <KanbanSquare className="w-5 h-5 mr-3" />
                Task Execution Board
              </Link>
              <Link href="/leader/planning" className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isCurrent('/leader/planning') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <CalendarDays className="w-5 h-5 mr-3" />
                Monthly Planning
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white mr-3">SP</div>
            <div>
              <div className="text-sm font-medium text-white">Super Visor</div>
              <div className="text-xs text-slate-500">supervisor@shop</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {pathname === '/' ? 'Dashboard' : pathname.split('/').pop()?.replace('-', ' ')}
          </h2>
          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="sr-only">Notifications</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
