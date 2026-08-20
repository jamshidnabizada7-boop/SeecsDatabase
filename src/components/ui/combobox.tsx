'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  onCreate?: (inputValue: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  createLabel?: string
  allowCustom?: boolean
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No matching option found.',
  createLabel = 'Create new',
  allowCustom = true,
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOption = options.find((opt) => opt.value === value || opt.label.toLowerCase() === value?.toLowerCase())

  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === search.trim().toLowerCase()
  )

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? '' : selectedValue)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = () => {
    const trimmed = search.trim()
    if (!trimmed) return
    if (onCreate) {
      onCreate(trimmed)
    } else {
      onChange(trimmed)
    }
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal text-left h-9 px-3',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-3 text-sm text-muted-foreground">
              <div>{emptyText}</div>
              {allowCustom && search.trim().length > 0 && !exactMatch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreate}
                  className="mt-2 w-full justify-start text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {createLabel} &ldquo;{search.trim()}&rdquo;
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      (value === option.value || value === option.label) ? 'opacity-100 text-emerald-600' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {allowCustom && search.trim().length > 0 && !exactMatch && (
              <div className="border-t p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreate}
                  className="w-full justify-start text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-medium"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {createLabel} &ldquo;{search.trim()}&rdquo;
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
