'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Removed currency formatting with symbol; use plain number formatting instead

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  status: 'DRAFT' | 'SENT' | 'PAID';
  createdAt: string;
  dueDate?: string;
  project: {
    name: string;
    client: {
      name: string;
    };
  };
}

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
}

const InvoiceList = ({ invoices, onEdit, onDelete }: InvoiceListProps) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500';
      case 'UNPAID':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const viewInvoice = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No invoices found. Create your first invoice!
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.project.name}</TableCell>
                <TableCell>{invoice.project.client.name}</TableCell>
                <TableCell>{formatAmount(parseFloat(invoice.amount))}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewInvoice(invoice.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(invoice)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(invoice.id)}
                    disabled={deletingId === invoice.id}
                  >
                    {deletingId === invoice.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceList;