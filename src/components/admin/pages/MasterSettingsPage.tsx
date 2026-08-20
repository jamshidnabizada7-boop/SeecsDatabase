'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Columns3,
  Layers,
  MapPin,
  MapPinned,
  GraduationCap,
  DollarSign,
  Settings,
} from 'lucide-react'
import CustomColumnsPage from './CustomColumnsPage'
import SectorsPage from './SectorsPage'
import CitiesPage from './CitiesPage'
import DegreesPage from './DegreesPage'
import LocationsPage from './LocationsPage'
import AnnualDataPage from './AnnualDataPage'
import SettingsPage from './SettingsPage'

export default function MasterSettingsPage({ defaultTab = 'custom-columns' }: { defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Database Settings & Master Lookups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system-wide configuration, dynamic custom fields, academic degrees, cities, sectors, and AI assistant settings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted/60 border gap-1">
          <TabsTrigger value="custom-columns" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <Columns3 className="h-4 w-4" />
            Custom Fields
          </TabsTrigger>
          <TabsTrigger value="sectors" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <Layers className="h-4 w-4" />
            Sectors
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <MapPin className="h-4 w-4" />
            Cities
          </TabsTrigger>
          <TabsTrigger value="degrees" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <GraduationCap className="h-4 w-4" />
            Degrees
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <MapPinned className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="annual" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" />
            Financial Records
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            AI / LLM Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom-columns" className="m-0 focus-visible:outline-none">
          <CustomColumnsPage />
        </TabsContent>

        <TabsContent value="sectors" className="m-0 focus-visible:outline-none">
          <SectorsPage />
        </TabsContent>

        <TabsContent value="cities" className="m-0 focus-visible:outline-none">
          <CitiesPage />
        </TabsContent>

        <TabsContent value="degrees" className="m-0 focus-visible:outline-none">
          <DegreesPage />
        </TabsContent>

        <TabsContent value="locations" className="m-0 focus-visible:outline-none">
          <LocationsPage />
        </TabsContent>

        <TabsContent value="annual" className="m-0 focus-visible:outline-none">
          <AnnualDataPage />
        </TabsContent>

        <TabsContent value="llm" className="m-0 focus-visible:outline-none">
          <SettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
