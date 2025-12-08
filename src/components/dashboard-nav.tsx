'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useEffect, useState } from 'react'


interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
}

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const handleLogoUpdate = (event: CustomEvent) => {
      if (mounted) {
        setLogoUrl(event.detail.logoUrl)
      }
    }

    window.addEventListener('logo-updated', handleLogoUpdate as EventListener)

    ;(async () => {
      try {
        const res = await fetch('/api/user/business-info')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && data?.logoUrl) {
          setLogoUrl(data.logoUrl)
        }
      } catch (_) {
      }
    })()

    return () => {
      mounted = false
      window.removeEventListener('logo-updated', handleLogoUpdate as EventListener)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold">
            FreelancePro
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className={`text-sm transition-colors hover:text-primary ${
            pathname === '/dashboard' ? 'text-primary font-medium' : 'text-muted-foreground hover:underline'
          }`}>
            Dashboard
          </Link>
          <Link href="/dashboard/clients" className={`text-sm transition-colors hover:text-primary ${
            pathname.startsWith('/dashboard/clients') ? 'text-primary font-medium' : 'text-muted-foreground hover:underline'
          }`}>
            Clients
          </Link>
          <Link href="/projects" className={`text-sm transition-colors hover:text-primary ${
            pathname.startsWith('/projects') ? 'text-primary font-medium' : 'text-muted-foreground hover:underline'
          }`}>
            Projects
          </Link>
          <Link href="/invoices" className={`text-sm transition-colors hover:text-primary ${
            pathname.startsWith('/invoices') ? 'text-primary font-medium' : 'text-muted-foreground hover:underline'
          }`}>
            Invoices
          </Link>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {(logoUrl || user.profilePictureUrl) && (
                      <AvatarImage src={logoUrl || (user.profilePictureUrl as string)} alt={user.name || 'User'} />
                    )}
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/'
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}