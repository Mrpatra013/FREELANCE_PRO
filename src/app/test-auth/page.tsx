'use client';

import { DebugAuth } from '@/components/debug-auth';

export default function TestAuthPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>
      <DebugAuth />
    </div>
  );
}