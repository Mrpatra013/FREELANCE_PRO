import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
    await fs.mkdir(uploadsDir, { recursive: true })

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : 'jpg'
    const filename = `${crypto.randomUUID()}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    const image = sharp(buffer)
    await image.resize(400, 400, { fit: 'cover' }).toFile(filepath)

    const url = `/uploads/profiles/${filename}`
    return NextResponse.json({ url })
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}