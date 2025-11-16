'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientDetailsDialog } from '@/components/clients/ClientDetailsDialog';
import { DeleteConfirmationModal } from '@/components/clients/DeleteConfirmationModal';
import { type ClientBasic } from '@/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientBasic[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientBasic | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientBasic | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    description: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          setLoading(false);
          return;
        }
        try {
          await fetch('/api/user/sync', { method: 'POST', signal: controller.signal });
        } catch (e) {
          if ((e as any)?.name !== 'AbortError') {
            console.error('User sync failed:', e);
          }
        }
        await fetchClients();
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Submitting client form data:', formData);
      
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      console.log('Making request to:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        toast.success(editingClient ? 'Client updated successfully' : 'Client created successfully');
        setIsDialogOpen(false);
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', company: '', address: '', description: '', notes: '' });
        fetchClients();
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast.error(`Failed to save client: ${response.status}`);
      }
    } catch (error) {
      console.error('Client submission error:', error);
      toast.error('An error occurred');
    }
  };

  const handleEdit = (client: ClientBasic) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      description: client.description || '',
      notes: client.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (client: ClientBasic) => {
    setSelectedClient(client);
    setShowDetailsDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteClientId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteClientId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${deleteClientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Client deleted successfully');
        fetchClients();
      } else {
        toast.error('Failed to delete client');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteClientId(null);
    }
  };



  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', company: '', address: '', description: '', notes: '' });
    setEditingClient(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter client address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter client description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No clients found. Add your first client to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>{client.company || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(client)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        title="Edit Client"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(client.id)}
                        title="Delete Client"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        </CardContent>
      </Card>

      <ClientDetailsDialog
        client={selectedClient}
        isOpen={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
      />

      <DeleteConfirmationModal
        isOpen={deleteClientId !== null}
        onClose={() => setDeleteClientId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}