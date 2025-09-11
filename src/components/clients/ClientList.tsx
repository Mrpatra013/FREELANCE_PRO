'use client';

import { type ClientBasic } from '@/types';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ClientCard } from './ClientCard';

interface ClientListProps {
  initialClients: ClientBasic[];
}

export function ClientList({ initialClients }: ClientListProps) {
  const [clients, setClients] = useState<ClientBasic[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (deletedId: string) => {
    setClients((prevClients) =>
      prevClients.filter((client) => client.id !== deletedId)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery
            ? 'No clients found matching your search.'
            : 'No clients found. Add your first client to get started.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}