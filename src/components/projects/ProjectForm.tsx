'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, subYears } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id?: string;
  name: string;
  description?: string;
  rate: number;
  rateType: 'HOURLY' | 'FIXED';
  startDate: string | Date;
  deadline?: string | Date;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  clientId: string;
}

interface ProjectFormProps {
  clients: Client[];
  project?: Project;
  isEditing?: boolean;
  onSubmitSuccess?: () => void;
}

// Define form schema with validation rules
const projectFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  clientId: z.string().min(1, 'Please select a client'),
  rate: z.number().positive('Rate must be a positive number').multipleOf(0.01, 'Rate can have at most 2 decimal places'),
  rateType: z.enum(['HOURLY', 'FIXED']),
  startDate: z.date().refine(
    (date) => date > subYears(new Date(), 1),
    { message: 'Start date cannot be more than 1 year in the past' }
  ),
  deadline: z.date().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']),
}).refine(data => {
  // If deadline is provided, it must be after start date
  if (data.deadline && data.startDate) {
    return data.deadline > data.startDate;
  }
  return true;
}, {
  message: 'Deadline must be after start date',
  path: ['deadline'],
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectForm({ clients, project, isEditing = false, onSubmitSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  
  // Initialize form with default values or existing project data
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description || '',
      clientId: project.clientId,
      rate: project.rate,
      rateType: project.rateType,
      startDate: new Date(project.startDate),
      deadline: project.deadline ? new Date(project.deadline) : undefined,
      status: project.status,
    } : {
      name: '',
      description: '',
      clientId: '',
      rate: 0,
      rateType: 'HOURLY',
      startDate: new Date(),
      status: 'ACTIVE',
    },
  });
  
  // Get recently used clients (in a real app, this would come from an API)
  useEffect(() => {
    // Simulate getting recent clients - in a real app this would be an API call
    setRecentClients(clients.slice(0, 3));
  }, [clients]);
  
  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format dates for API
      const formattedData = {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        deadline: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : undefined,
      };
      
      // API endpoint and method based on whether we're creating or editing
      const endpoint = isEditing ? `/api/projects/${project?.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save project');
      }
      
      toast.success(isEditing ? 'Project updated successfully' : 'Project created successfully');
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push('/projects');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project name" {...field} />
                </FormControl>
                <FormDescription>
                  A clear, descriptive name for your project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Client Selection */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {recentClients.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Recent Clients
                        </div>
                        {recentClients.map((client) => (
                          <SelectItem key={`recent-${client.id}`} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          All Clients
                        </div>
                      </>
                    )}
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start px-2 py-1.5 text-sm"
                      type="button"
                      onClick={() => {
                        // In a real app, this would open a modal to create a new client
                        toast.info('Add new client functionality would open here');
                      }}
                    >
                      + Add New Client
                    </Button>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the client this project is for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Project Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Current status of the project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Rate Type */}
          <FormField
            control={form.control}
            name="rateType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Rate Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="HOURLY" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Hourly Rate
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="FIXED" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Fixed Price
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Rate */}
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate {form.watch('rateType') === 'HOURLY' ? '(per hour)' : '(total)'}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">$</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      className="pl-7"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {form.watch('rateType') === 'HOURLY' 
                    ? 'How much you charge per hour for this project.' 
                    : 'The total fixed price for this project.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < subYears(new Date(), 1)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When did you start or plan to start this project?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Deadline */}
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Deadline (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < form.watch('startDate')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When is this project due to be completed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter project details, scope, and any other relevant information..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide details about the project scope, deliverables, and any other relevant information.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Form>
  );
}