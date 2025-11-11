'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Building2, Image as ImageIcon, Phone, MapPin, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { BankingDetailsToggle, BankingFieldToggle } from './BankingDetailsToggle';
import { Textarea } from '@/components/ui/textarea';

interface BusinessInfo {
  companyName: string;
  businessEmail: string;
  phoneNumber?: string;
  businessAddress?: string;
  logoUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  upiId?: string;
}

export function BusinessInfoSection() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    companyName: '',
    businessEmail: '',
    phoneNumber: '',
    businessAddress: '',
    logoUrl: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    upiId: ''
  });
  const [showBankingDetails, setShowBankingDetails] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch existing business info
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/business-info');
        if (response.ok) {
          const data = await response.json();
          setBusinessInfo({
            companyName: data.companyName || '',
            businessEmail: data.businessEmail || '',
            phoneNumber: data.phoneNumber || '',
            businessAddress: data.businessAddress || '',
            logoUrl: data.logoUrl || '',
            bankName: data.bankName || '',
            accountNumber: data.accountNumber || '',
            accountHolderName: data.accountHolderName || '',
            ifscCode: data.ifscCode || '',
            upiId: data.upiId || ''
          });
          setLogoPreview(data.logoUrl || '');
        }
      } catch (error) {
        console.error('Error fetching business info:', error);
        toast.error('Failed to load business information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return businessInfo.logoUrl || null;

    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const data = await response.json();
      return data.logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!businessInfo.companyName || !businessInfo.businessEmail) {
      toast.error('Company name and business email are required');
      return;
    }

    // Validate optional fields if they are provided
    if (businessInfo.phoneNumber && !validatePhoneNumber(businessInfo.phoneNumber)) {
      toast.error('Please enter a valid Indian phone number (e.g., +91-9876543210)');
      return;
    }

    if (businessInfo.ifscCode && !validateIFSC(businessInfo.ifscCode)) {
      toast.error('Please enter a valid IFSC code (e.g., HDFC0001234)');
      return;
    }

    if (businessInfo.upiId && !validateUPI(businessInfo.upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., john@paytm)');
      return;
    }

    setIsSaving(true);

    try {
      // Upload logo if a new one was selected
      let logoUrl = businessInfo.logoUrl;
      if (logoFile) {
        const uploadedLogoUrl = await uploadLogo();
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        } else {
          setIsSaving(false);
          return;
        }
      }

      // Save business info
      const response = await fetch('/api/user/business-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: businessInfo.companyName,
          businessEmail: businessInfo.businessEmail,
          phoneNumber: businessInfo.phoneNumber,
          businessAddress: businessInfo.businessAddress,
          logoUrl,
          bankName: businessInfo.bankName,
          accountNumber: businessInfo.accountNumber,
          accountHolderName: businessInfo.accountHolderName,
          ifscCode: businessInfo.ifscCode,
          upiId: businessInfo.upiId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save business information');
      }

      // Update local state
      setBusinessInfo(prev => ({ ...prev, logoUrl }));
      setLogoFile(null);
      
      toast.success('Business information saved successfully');
    } catch (error) {
      console.error('Error saving business info:', error);
      toast.error('Failed to save business information');
    } finally {
      setIsSaving(false);
    }
  };

  // Validation functions
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''))
  }

  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    return ifscRegex.test(ifsc)
  }

  const validateUPI = (upi: string): boolean => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/
    return upiRegex.test(upi)
  }

  const handleInputChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation feedback
    if (field === 'phoneNumber' && value && !validatePhoneNumber(value)) {
      // Could add validation state here if needed
    }
    if (field === 'ifscCode' && value && !validateIFSC(value)) {
      // Could add validation state here if needed
    }
    if (field === 'upiId' && value && !validateUPI(value)) {
      // Could add validation state here if needed
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            {logoPreview ? (
              <AvatarImage src={logoPreview} alt="Company logo" />
            ) : (
              <AvatarFallback>
                <ImageIcon className="h-8 w-8" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-2">
            <Label htmlFor="logo-upload" className="text-sm font-medium">
              Company Logo
            </Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={isSaving}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Company Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Company Information
          </CardTitle>
          <CardDescription>
            Basic business details that will appear on your invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name *
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="e.g., John Smith Design Studio"
                value={businessInfo.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">
                Business Email *
              </Label>
              <Input
                id="businessEmail"
                type="email"
                placeholder="your.business@example.com"
                value={businessInfo.businessEmail}
                onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                <Phone className="h-4 w-4 inline mr-2" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+91-9876543210"
                value={businessInfo.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessAddress">
                <MapPin className="h-4 w-4 inline mr-2" />
                Business Address
              </Label>
              <Textarea
                id="businessAddress"
                placeholder="Complete business address"
                value={businessInfo.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Banking Information
              </CardTitle>
              <CardDescription>
                Banking details for invoice payments (optional)
              </CardDescription>
            </div>
            <BankingDetailsToggle
              isVisible={showBankingDetails}
              onToggle={setShowBankingDetails}
            />
          </div>
        </CardHeader>
        {showBankingDetails && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  type="text"
                  placeholder="e.g., HDFC Bank"
                  value={businessInfo.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolderName">
                  Account Holder Name
                </Label>
                <Input
                  id="accountHolderName"
                  type="text"
                  placeholder="e.g., John Smith"
                  value={businessInfo.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="flex items-center justify-between">
                  Account Number
                  <BankingFieldToggle
                    isVisible={showAccountNumber}
                    onToggle={setShowAccountNumber}
                  />
                </Label>
                <Input
                  id="accountNumber"
                  type={showAccountNumber ? "text" : "password"}
                  placeholder="Account number"
                  value={businessInfo.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">
                  IFSC Code
                </Label>
                <Input
                  id="ifscCode"
                  type="text"
                  placeholder="e.g., HDFC0001234"
                  value={businessInfo.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="upiId">
                  UPI ID
                </Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="e.g., john@paytm"
                  value={businessInfo.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Invoice Preview */}
      {(businessInfo.companyName || businessInfo.businessEmail || logoPreview) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Preview</CardTitle>
            <CardDescription>
              This is how your business information will appear on invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {businessInfo.companyName || 'Your Company Name'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {businessInfo.businessEmail || 'your.business@example.com'}
                  </p>
                </div>
                {logoPreview && (
                  <div className="h-12 w-12 rounded border">
                    <Image
                      src={logoPreview}
                      alt="Company logo"
                      width={48}
                      height={48}
                      className="h-full w-full object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Business Information'}
        </Button>
      </div>
    </form>
  );
}