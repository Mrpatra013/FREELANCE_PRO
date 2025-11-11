'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FreelancerDetails {
  companyName: string;
  businessEmail: string;
  logoUrl?: string;
  saveForFuture: boolean;
}

interface FreelancerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: FreelancerDetails) => void;
  initialData?: Partial<FreelancerDetails>;
  isLoading?: boolean;
}

export default function FreelancerDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false
}: FreelancerDetailsModalProps) {
  const [formData, setFormData] = useState<FreelancerDetails>({
    companyName: initialData?.companyName || '',
    businessEmail: initialData?.businessEmail || '',
    logoUrl: initialData?.logoUrl || '',
    saveForFuture: initialData?.saveForFuture ?? true
  });
  

  // We don't need to track logoFile state as it's not used elsewhere
  const [logoPreview, setLogoPreview] = useState<string>(initialData?.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof FreelancerDetails, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, JPEG, or SVG)');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const { logoUrl } = await response.json();
      setFormData(prev => ({ ...prev, logoUrl }));
      setLogoPreview(logoUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      handleLogoUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    if (!formData.businessEmail.trim()) {
      toast.error('Business email is required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.businessEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Business Information</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete your business details to generate professional invoices
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company/Business Name *</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="e.g., John Smith Design Studio"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Business Email */}
          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email *</Label>
            <Input
              id="businessEmail"
              type="email"
              placeholder="your.business@example.com"
              value={formData.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo (Optional)</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {logoPreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={128}
                      height={128}
                      className="max-w-32 max-h-32 object-contain mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      disabled={isLoading || isUploadingLogo}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click to change or drag a new image
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {isUploadingLogo ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload your company logo</p>
                    <p className="text-xs text-muted-foreground">
                      Drag and drop or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, JPEG, SVG up to 2MB
                    </p>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading || isUploadingLogo}
              />
            </div>
          </div>

          {/* Save for Future */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveForFuture"
              checked={formData.saveForFuture}
              onCheckedChange={(checked: boolean) => handleInputChange('saveForFuture', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="saveForFuture" className="text-sm">
              Save these details for future invoices
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploadingLogo}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Invoice'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}