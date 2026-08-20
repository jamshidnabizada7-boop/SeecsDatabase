'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Building2,
  Layers,
  MapPin,
  MapPinned,
  Users,
  GraduationCap,
  DollarSign,
  Columns3,
  Bot,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import DashboardPage from './pages/DashboardPage'
import CompaniesPage from './pages/CompaniesPage'
import SectorsPage from './pages/SectorsPage'
import CitiesPage from './pages/CitiesPage'
import LocationsPage from './pages/LocationsPage'
import FoundersPage from './pages/FoundersPage'
import DegreesPage from './pages/DegreesPage'
import AnnualDataPage from './pages/AnnualDataPage'
import ChatbotPage from './pages/ChatbotPage'
import SettingsPage from './pages/SettingsPage'
import CustomColumnsPage from './pages/CustomColumnsPage'

type Tab =
  | 'dashboard'
  | 'companies'
  | 'sectors'
  | 'cities'
  | 'locations'
  | 'founders'
  | 'degrees'
  | 'annual'
  | 'custom-columns'
  | 'chatbot'
  | 'settings'

const NAV: { id: Tab; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, group: 'Overview' },
  { id: 'companies', label: 'Companies', icon: <Building2 className="h-4 w-4" />, group: 'Master Data' },
  { id: 'founders', label: 'Founders', icon: <Users className="h-4 w-4" />, group: 'Master Data' },
  { id: 'sectors', label: 'Sectors', icon: <Layers className="h-4 w-4" />, group: 'Master Data' },
  { id: 'cities', label: 'Cities', icon: <MapPin className="h-4 w-4" />, group: 'Master Data' },
  { id: 'locations', label: 'Locations', icon: <MapPinned className="h-4 w-4" />, group: 'Master Data' },
  { id: 'degrees', label: 'Degrees', icon: <GraduationCap className="h-4 w-4" />, group: 'Master Data' },
  { id: 'annual', label: 'Annual Data', icon: <DollarSign className="h-4 w-4" />, group: 'Master Data' },
  { id: 'custom-columns', label: 'Custom Columns', icon: <Columns3 className="h-4 w-4" />, group: 'Master Data' },
  { id: 'chatbot', label: 'AI Assistant', icon: <Bot className="h-4 w-4" />, group: 'Tools' },
  { id: 'settings', label: 'LLM Settings', icon: <Settings className="h-4 w-4" />, group: 'Tools' },
]

export default function AdminShell({ admin, onLogout }: { admin: any; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  const groups = Array.from(new Set(NAV.map((n) => n.group)))
  const currentLabel = NAV.find((n) => n.id === tab)?.label || 'Dashboard'
  const currentIcon = NAV.find((n) => n.id === tab)?.icon || <LayoutDashboard className="h-4 w-4" />

  const Sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center font-bold shadow-md">S</div>
          <div className="leading-tight">
            <div className="font-semibold text-sm text-stone-100">SEECS Database</div>
            <div className="text-xs text-stone-400">Admin Console</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g, gi) => (
          <div key={g}>
            {gi > 0 && <Separator className="mb-5 bg-stone-800" />}
            <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">{g}</div>
            <div className="space-y-1">
              {NAV.filter((n) => n.group === g).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setTab(n.id); setMobileOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all text-left relative',
                    tab === n.id
                      ? 'bg-stone-800 text-white border-l-[3px] border-l-emerald-400 pl-[9px]'
                      : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                  )}
                >
                  {n.icon}
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-stone-800 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white grid place-items-center text-xs font-bold shadow-sm">
            {admin.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="leading-tight overflow-hidden">
            <div className="text-sm font-medium text-stone-200 truncate">{admin.name}</div>
            <div className="text-xs text-stone-500 truncate">{admin.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Mobile top bar */}
      <div className="md:hidden border-b bg-background sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-stone-900 to-stone-950 border-stone-800 data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left duration-300">
            {Sidebar}
          </SheetContent>
        </Sheet>
        <div className="font-semibold text-sm">SEECS · {currentLabel}</div>
        <div className="w-9" />
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 bg-gradient-to-b from-stone-900 to-stone-950 border-r border-stone-800">
          {Sidebar}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumbs-style page title */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
            <div className="px-6 py-3 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {currentIcon}
                {currentLabel}
              </span>
            </div>
          </div>
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'companies' && <CompaniesPage />}
          {tab === 'founders' && <FoundersPage />}
          {tab === 'sectors' && <SectorsPage />}
          {tab === 'cities' && <CitiesPage />}
          {tab === 'locations' && <LocationsPage />}
          {tab === 'degrees' && <DegreesPage />}
          {tab === 'annual' && <AnnualDataPage />}
          {tab === 'custom-columns' && <CustomColumnsPage />}
          {tab === 'chatbot' && <ChatbotPage />}
          {tab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}
