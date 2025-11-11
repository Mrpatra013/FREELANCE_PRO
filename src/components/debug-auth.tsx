'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function DebugAuth() {
  const { data: session, status, update } = useSession();
  const [credentials, setCredentials] = useState({
    email: 'test@example.com',
    password: 'password123'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[DEBUG AUTH] ${message}`);
  };

  useEffect(() => {
    addLog(`Session status: ${status}`);
    if (session) {
      addLog(`Session user: ${session.user?.email} (ID: ${session.user?.id})`);
    }
  }, [session, status]);

  const handleLogin = async () => {
    setIsLoading(true);
    addLog('Starting login attempt...');
    
    try {
      addLog(`Attempting login with: ${credentials.email}`);
      
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      });

      addLog(`Login result: ${JSON.stringify(result)}`);

      if (result?.error) {
        addLog(`Login error: ${result.error}`);
        toast.error(`Login failed: ${result.error}`);
      } else if (result?.ok) {
        addLog('Login successful!');
        toast.success('Login successful!');
        // Force session update
        await update();
      } else {
        addLog('Login result unclear');
        toast.error('Login result unclear');
      }
    } catch (error) {
      addLog(`Login exception: ${error}`);
      console.error('Login error:', error);
      toast.error('Login exception occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    addLog('Starting logout...');
    try {
      await signOut({ redirect: false });
      addLog('Logout successful');
      toast.success('Logged out successfully');
    } catch (error) {
      addLog(`Logout error: ${error}`);
      toast.error('Logout failed');
    }
  };

  const testClientAPI = async () => {
    addLog('Testing clients API...');
    try {
      const response = await fetch('/api/clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      addLog(`Clients API response: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      
      if (response.ok) {
        addLog(`Found ${data.length} clients`);
        toast.success(`Found ${data.length} clients`);
      } else {
        addLog(`API Error: ${data.error || response.statusText}`);
        toast.error(`API Error: ${data.error || response.statusText}`);
      }
    } catch (error) {
      addLog(`Fetch error: ${error}`);
      console.error('Fetch error:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const createTestClient = async () => {
    addLog('Creating test client...');
    try {
      const clientData = {
        name: 'Frontend Debug Client',
        email: `debug-${Date.now()}@example.com`,
        company: 'Debug Company',
        phone: '555-DEBUG',
        notes: 'Created from debug component'
      };
      
      addLog(`Client data: ${JSON.stringify(clientData)}`);
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });
      
      addLog(`Create client response: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      
      if (response.ok) {
        addLog(`Client created: ${data.id}`);
        toast.success('Client created successfully!');
      } else {
        addLog(`Create Error: ${data.error || response.statusText}`);
        toast.error(`Create Error: ${data.error || response.statusText}`);
      }
    } catch (error) {
      addLog(`Create error: ${error}`);
      console.error('Create error:', error);
      toast.error('Failed to create client');
    }
  };

  const checkSession = async () => {
    addLog('Checking session manually...');
    try {
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      addLog(`Manual session check: ${JSON.stringify(sessionData)}`);
    } catch (error) {
      addLog(`Session check error: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Session:</h3>
            <p>Status: <span className="font-mono">{status}</span></p>
            {session ? (
              <div className="space-y-1">
                <p>Email: <span className="font-mono">{session.user?.email}</span></p>
                <p>ID: <span className="font-mono">{session.user?.id}</span></p>
                <p>Expires: <span className="font-mono">{session.expires}</span></p>
              </div>
            ) : (
              <p className="text-muted-foreground">No active session</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Test Credentials:</h3>
            <Input
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleLogin} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Test Login'}
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Test Logout
            </Button>
            <Button onClick={checkSession} variant="secondary">
              Check Session
            </Button>
            <Button onClick={testClientAPI} variant="secondary">
              Test Clients API
            </Button>
            <Button onClick={createTestClient} variant="secondary">
              Create Test Client
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="text-sm font-mono bg-muted p-2 rounded">
                  {log}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}