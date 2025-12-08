import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const BUCKET = process.env.SUPABASE_LOGOS_BUCKET || 'logo';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service role key' },
        { status: 500 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      console.error('No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Processing logo upload:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: userData.user.id,
    });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, JPEG, and SVG files are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }
    const admin = getSupabaseAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    const exists = buckets?.some((b: any) => (b.id ?? b.name) === BUCKET || b.name === BUCKET);
    if (!exists) {
      await admin.storage.createBucket(BUCKET, { public: true });
    }

    const timestamp = Date.now();
    const extFromName = file.name.includes('.') ? file.name.split('.').pop() || 'png' : 'png';
    const ext = ['png', 'jpg', 'jpeg', 'svg'].includes(extFromName.toLowerCase())
      ? extFromName.toLowerCase()
      : file.type === 'image/png'
      ? 'png'
      : file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/svg+xml'
      ? 'svg'
      : 'png';
    const userId = userData.user.id || userData.user.email.split('@')[0];
    const filename = `${userId}-${timestamp}.${ext}`;
    const path = `${userId}/${filename}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadRes = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type });
    if (uploadRes.error) {
      console.error('Upload error:', uploadRes.error);
      return NextResponse.json(
        { error: `Failed to upload to storage: ${uploadRes.error.message}` },
        { status: 500 }
      );
    }
    const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const logoUrl = publicUrlData.publicUrl;
    return NextResponse.json({ logoUrl }, { status: 200 });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service role key' },
        { status: 500 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user?.email) {
      console.error('DELETE Logo: Auth error', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's current logo URL from the database
    const user = await prisma.user.findUnique({
      where: { email: userData.user.email },
      select: { logoUrl: true },
    });

    if (!user?.logoUrl) {
      return NextResponse.json({ message: 'No logo to delete' }, { status: 200 });
    }

    // Extract file path from URL
    // URL format: .../storage/v1/object/public/logo/userId/filename
    const logoUrl = user.logoUrl;
    const bucketUrl = `/storage/v1/object/public/${BUCKET}/`;

    console.log('Attempting to delete logo. URL:', logoUrl, 'Bucket URL fragment:', bucketUrl);

    if (!logoUrl.includes(bucketUrl)) {
      console.warn('Logo URL does not match expected bucket path format. Just clearing DB.');
      // If URL format doesn't match expected Supabase format, just clear DB
      await prisma.user.update({
        where: { email: userData.user.email },
        data: { logoUrl: null },
      });
      return NextResponse.json({ message: 'Logo removed' }, { status: 200 });
    }

    const path = logoUrl.split(bucketUrl)[1];
    console.log('Extracted storage path:', path);

    if (path) {
      const admin = getSupabaseAdminClient();
      const { error: deleteError } = await admin.storage.from(BUCKET).remove([path]);

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        // Proceed to clear DB anyway? Yes, to keep state consistent for user.
      } else {
        console.log('File successfully deleted from storage');
      }
    }

    // Update database
    await prisma.user.update({
      where: { email: userData.user.email },
      data: { logoUrl: null },
      select: { logoUrl: true },
    });

    return NextResponse.json({ message: 'Logo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Logo delete error:', error);
    // Return the actual error message for debugging
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
