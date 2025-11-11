'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-xl font-bold">
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
                onClick={() => signOut({ callbackUrl: '/' })}
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