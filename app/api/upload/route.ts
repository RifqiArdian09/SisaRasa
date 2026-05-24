import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Upload an image to Supabase Storage.
 *
 * Expects multipart/form-data with:
 *   - file: File
 *   - bucket: 'avatars' | 'stores' | 'products' | 'reviews' | 'chats' (default: 'products')
 *   - folder: string (optional subfolder, default: '')
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'products'
    const folder = (formData.get('folder') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const uniqueName = `${folder ? folder + '/' : ''}${user.id}_${timestamp}.${ext}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('[Upload] Supabase storage error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    })
  } catch (err) {
    console.error('[Upload] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
