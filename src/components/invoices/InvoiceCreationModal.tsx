'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  client: {
    name: string;
  };
  rate?: number;
}

interface InvoiceCreationModalProps {
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextInvoiceNumber?: string;
}

interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

const InvoiceCreationModal = ({
  projects,
  open,
  onOpenChange,
  nextInvoiceNumber,
}: InvoiceCreationModalProps) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Project Selection
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Step 2: Number of Services
  const [numServicesInput, setNumServicesInput] = useState('1');

  // Step 3: Service Line Items
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);

  // Step 4: Tax Calculation
  const [taxRate, setTaxRate] = useState<string>('0');
  
  // Step 5: Finalization
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<'PAID' | 'UNPAID'>('UNPAID');
  const [notes, setNotes] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setNumServicesInput('1');
      setServiceItems([]);
      setTaxRate('0');
      setDueDate(new Date());
      setStatus('UNPAID');
      setNotes('');
      // Don't reset selectedProjectId to allow persistence or pre-selection if needed
    }
  }, [open]);

  // Calculations
  const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * (parseFloat(taxRate) || 0)) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleNext = () => {
    if (step === 1) {
      if (!selectedProjectId) {
        toast.error('Please select a project');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const num = parseInt(numServicesInput);
      if (isNaN(num) || num < 1 || num > 20) {
        toast.error('Please enter a number between 1 and 20');
        return;
      }
      
      // Initialize service items if not already done or if count changed significantly
      // We'll preserve existing items if possible
      const newItems: ServiceItem[] = [];
      for (let i = 0; i < num; i++) {
        if (serviceItems[i]) {
          newItems.push(serviceItems[i]);
        } else {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            quantity: 1,
            price: 0,
            total: 0,
          });
        }
      }
      setServiceItems(newItems);
      setStep(3);
    } else if (step === 3) {
      // Validate items
      const isValid = serviceItems.every(
        (item) => item.description.trim() !== '' && item.quantity > 0 && item.price >= 0
      );
      if (!isValid) {
        toast.error('Please fill in all service details correctly');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateServiceItem = (index: number, field: keyof ServiceItem, value: any) => {
    const newItems = [...serviceItems];
    const item = { ...newItems[index] };

    if (field === 'quantity' || field === 'price') {
      const numValue = parseFloat(value) || 0;
      // @ts-ignore
      item[field] = numValue;
      item.total = item.quantity * item.price;
    } else {
      // @ts-ignore
      item[field] = value;
    }

    newItems[index] = item;
    setServiceItems(newItems);
  };

  const createInvoice = async () => {
    if (!selectedProjectId || !dueDate) {
      toast.error('Missing required fields');
      return;
    }

    setIsCreating(true);
    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      
      // Prepare detailed data to store in description (JSON hack)
      const descriptionData = {
        summary: notes || `Invoice for ${selectedProject?.name}`,
        items: serviceItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        taxRate: parseFloat(taxRate) || 0,
        taxAmount: taxAmount,
        subtotal: subtotal,
        notes: notes
      };

      const invoicePayload = {
        projectId: selectedProjectId,
        amount: totalAmount,
        description: JSON.stringify(descriptionData),
        dueDate: dueDate.toISOString(),
        status: status,
        // We're omitting freelancerInfo for brevity, backend can handle it or we fetch user
      };

      const createResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload),
      });

      if (createResponse.ok) {
        const invoice = await createResponse.json();
        toast.success('Invoice created successfully');
        onOpenChange(false);
        setTimeout(() => {
          router.push(`/invoices/${invoice.id}`);
        }, 100);
      } else {
        const errorData = await createResponse.json();
        toast.error(errorData.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice creation failed:', error);
      toast.error('An error occurred while creating the invoice');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice - Step {step} of 5</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Step 1: Project Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md mb-4">
                <div className="text-sm font-medium">Invoice Number (auto-generated)</div>
                <div className="text-lg font-bold">{nextInvoiceNumber || 'INV-....'}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project">Select Project</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Number of Services */}
          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="numServices">How many services/items do you want to add?</Label>
              <Input
                id="numServices"
                type="number"
                min="1"
                max="20"
                value={numServicesInput}
                onChange={(e) => setNumServicesInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Enter a number between 1 and 20.</p>
            </div>
          )}

          {/* Step 3: Dynamic Service Line Items */}
          {step === 3 && (
            <div className="space-y-6">
              {serviceItems.map((item, index) => (
                <div key={item.id} className="border p-4 rounded-md space-y-3 bg-muted/30">
                  <h4 className="font-semibold text-sm">Service #{index + 1}</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Service Name/Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                      placeholder="e.g. Website Design"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateServiceItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Price per Unit</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateServiceItem(index, 'price', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Line Total</Label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Tax Calculation */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Order Summary</Label>
                <div className="border rounded-md divide-y">
                  {serviceItems.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between text-sm">
                      <span className="truncate max-w-[200px]">{item.description} (x{item.quantity})</span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="taxRate" className="whitespace-nowrap">Tax (%):</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-24 text-right"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tax Amount:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                  <span>TOTAL AMOUNT:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Finalization */}
          {step === 5 && (
            <div className="space-y-4">
               <div className="bg-muted/50 p-4 rounded-md text-center mb-4">
                <div className="text-sm text-muted-foreground">Total Invoice Amount</div>
                <div className="text-3xl font-bold text-primary">${totalAmount.toFixed(2)}</div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Invoice Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: 'PAID' | 'UNPAID') => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Unpaid (Draft)</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Terms (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Payment due within 15 days."
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={step === 1 ? () => onOpenChange(false) : handleBack}
            disabled={isCreating}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 5 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={createInvoice} disabled={isCreating || !dueDate}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Invoice'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceCreationModal;