import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
      select: {
        companyName: true,
        businessEmail: true,
        phoneNumber: true,
        businessAddress: true,
        logoUrl: true,
        invoiceSettingsComplete: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        ifscCode: true,
        upiId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user business info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyName, 
      businessEmail, 
      phoneNumber, 
      businessAddress, 
      logoUrl, 
      bankName, 
      accountNumber, 
      accountHolderName, 
      ifscCode, 
      upiId, 
      saveForFuture 
    } = body;

    // Validate required fields
    if (!companyName || !businessEmail) {
      return NextResponse.json(
        { error: 'Company name and business email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone number validation (Indian format)
    if (phoneNumber && phoneNumber.trim()) {
      const phoneRegex = /^[+]?[91]?[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Please use Indian mobile number format.' },
          { status: 400 }
        );
      }
    }

    // IFSC code validation
    if (ifscCode && ifscCode.trim()) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode.toUpperCase())) {
        return NextResponse.json(
          { error: 'Invalid IFSC code format. Should be 4 letters + 0 + 6 alphanumeric characters.' },
          { status: 400 }
        );
      }
    }

    // UPI ID validation
    if (upiId && upiId.trim()) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiId)) {
        return NextResponse.json(
          { error: 'Invalid UPI ID format.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      companyName: companyName.trim(),
      businessEmail: businessEmail.trim(),
    };

    // Update optional business fields
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber?.trim() || null;
    }
    if (businessAddress !== undefined) {
      updateData.businessAddress = businessAddress?.trim() || null;
    }
    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl || null;
    }

    // Update banking fields
    if (bankName !== undefined) {
      updateData.bankName = bankName?.trim() || null;
    }
    if (accountNumber !== undefined) {
      updateData.accountNumber = accountNumber?.trim() || null;
    }
    if (accountHolderName !== undefined) {
      updateData.accountHolderName = accountHolderName?.trim() || null;
    }
    if (ifscCode !== undefined) {
      updateData.ifscCode = ifscCode?.trim().toUpperCase() || null;
    }
    if (upiId !== undefined) {
      updateData.upiId = upiId?.trim() || null;
    }

    // Set invoiceSettingsComplete to true if saveForFuture is true
    if (saveForFuture) {
      updateData.invoiceSettingsComplete = true;
    }

    const updatedUser = await prisma.user.update({
      where: { email: data.user.email },
      data: updateData,
      select: {
        companyName: true,
        businessEmail: true,
        phoneNumber: true,
        businessAddress: true,
        logoUrl: true,
        invoiceSettingsComplete: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        ifscCode: true,
        upiId: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user business info:', error);
    return NextResponse.json(
      { error: 'Failed to update business information' },
      { status: 500 }
    );
  }
}