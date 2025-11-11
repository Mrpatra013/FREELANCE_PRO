'use client';

import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { AlertCircle } from 'lucide-react';

type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: ProjectStatus;
  projectId: string;
  projectName: string;
  onStatusChange: (projectId: string, newStatus: ProjectStatus, notes?: string) => void;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  currentStatus,
  projectId,
  projectName,
  onStatusChange
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(currentStatus);
  const [notes, setNotes] = useState('');
  
  // Define status transition rules
  const getAvailableStatuses = (current: ProjectStatus): ProjectStatus[] => {
    switch (current) {
      case 'ACTIVE':
        return ['PAUSED', 'COMPLETED'];
      case 'PAUSED':
        return ['ACTIVE', 'COMPLETED'];
      case 'COMPLETED':
        return ['ACTIVE', 'PAUSED'];
      default:
        return ['ACTIVE', 'PAUSED', 'COMPLETED'];
    }
  };
  
  const availableStatuses = getAvailableStatuses(currentStatus);
  
  // Check if transition requires confirmation
  const requiresConfirmation = (
    (currentStatus === 'ACTIVE' && selectedStatus === 'COMPLETED') ||
    (currentStatus === 'PAUSED' && selectedStatus === 'COMPLETED')
  );
  
  // Check if transition requires warning
  const requiresWarning = (
    currentStatus === 'COMPLETED' && 
    (selectedStatus === 'ACTIVE' || selectedStatus === 'PAUSED')
  );
  
  const handleSubmit = () => {
    onStatusChange(projectId, selectedStatus, notes);
    onClose();
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Project Status</AlertDialogTitle>
          <AlertDialogDescription>
            Update the status for project <span className="font-medium">{projectName}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Current Status</Label>
              <div>
                <ProjectStatusBadge status={currentStatus} showTooltip={false} />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="status">New Status</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as ProjectStatus)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center">
                        <ProjectStatusBadge status={status} showTooltip={false} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {requiresWarning && (
            <div className="flex p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                Warning: Reopening a completed project may affect reporting and metrics.
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Status Change Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>
            {requiresConfirmation ? 'Confirm Change' : 'Update Status'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}