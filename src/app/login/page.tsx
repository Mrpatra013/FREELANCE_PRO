'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonLoading } from '@/components/ui/loading';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Starting login process...');
      console.log('📧 Email:', formData.email);
      console.log('🔑 Password length:', formData.password.length);
      
      // Test CSRF token first
      const csrfResponse = await fetch('/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      console.log('🛡️ CSRF Token obtained:', csrfData.csrfToken ? 'Yes' : 'No');
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      console.log('📊 Full login result:', JSON.stringify(result, null, 2));

      if (result?.error) {
        console.error('❌ Login failed with error:', result.error);
        toast.error(`Login failed: ${result.error}`);
        return;
      }

      if (result?.ok) {
        console.log('✅ Login successful!');
        
        // Check session immediately after login
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        console.log('🔍 Session check after login:', sessionData);
        
        toast.success('Login successful!');
        
        // Small delay to ensure session is set
        setTimeout(() => {
          console.log('🔄 Redirecting to dashboard...');
          router.push('/dashboard');
          router.refresh();
        }, 500);
      } else {
        console.warn('⚠️ Login result unclear:', result);
        toast.error('Login result unclear. Please try again.');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <ButtonLoading text="Logging in..." /> : 'Login'}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}