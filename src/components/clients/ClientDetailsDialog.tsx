'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  StickyNote,
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

import { type ClientBasic } from '@/types';

interface ClientDetailsDialogProps {
  client: ClientBasic | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailsDialog({
  client,
  isOpen,
  onClose,
}: ClientDetailsDialogProps) {
  if (!client) return null;

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client Name */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{client.name}</h2>
            {client.company && (
              <p className="text-muted-foreground mt-1">{client.company}</p>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>

              {client.phone ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-muted-foreground">Not provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Company & Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Information
            </h3>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className={client.company ? '' : 'text-muted-foreground'}>
                    {client.company || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Address</p>
                  <p className={`whitespace-pre-wrap ${client.address ? '' : 'text-muted-foreground'}`}>
                    {client.address || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description & Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Description</p>
                  <p className={`whitespace-pre-wrap ${client.description ? '' : 'text-muted-foreground'}`}>
                    {client.description || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Notes</p>
                  <p className={`whitespace-pre-wrap ${client.notes ? '' : 'text-muted-foreground'}`}>
                    {client.notes || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Creation Date */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Client Since</p>
              <p className="text-muted-foreground">{formatDate(client.createdAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}