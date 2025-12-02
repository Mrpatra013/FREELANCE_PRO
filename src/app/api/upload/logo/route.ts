import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const BUCKET = process.env.SUPABASE_LOGOS_BUCKET || 'logo';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

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
    const extFromName = file.name.includes('.') ? (file.name.split('.').pop() || 'png') : 'png';
    const ext = ['png', 'jpg', 'jpeg', 'svg'].includes(extFromName.toLowerCase())
      ? extFromName.toLowerCase()
      : (file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/svg+xml' ? 'svg' : 'png');
    const userId = userData.user.id || userData.user.email.split('@')[0];
    const filename = `${userId}-${timestamp}.${ext}`;
    const path = `${userId}/${filename}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadRes = await admin.storage.from(BUCKET).upload(path, buffer, { contentType: file.type });
    if (uploadRes.error) {
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 });
    }
    const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const logoUrl = publicUrlData.publicUrl;
    return NextResponse.json({ logoUrl }, { status: 200 });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}
      
     
    