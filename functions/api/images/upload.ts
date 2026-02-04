import { verifyAuth } from '../../_middleware';

interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
}

// POST /api/images/upload - Upload an image to R2
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admin and manager can upload images
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ message: 'File too large. Max 5MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `catalog/${timestamp}-${random}.${ext}`;

    // Upload to R2
    await context.env.IMAGES.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return the URL path (will be served via /api/images/[...path])
    const url = `/api/images/${filename}`;

    return Response.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ message: 'Upload failed' }, { status: 500 });
  }
};
