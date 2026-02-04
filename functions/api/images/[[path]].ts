interface Env {
  IMAGES: R2Bucket;
}

// GET /api/images/* - Serve images from R2
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const path = (context.params.path as string[]).join('/');

  if (!path) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    const object = await context.env.IMAGES.get(path);

    if (!object) {
      return Response.json({ message: 'Image not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    headers.set('ETag', object.etag);

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Image fetch error:', error);
    return Response.json({ message: 'Failed to fetch image' }, { status: 500 });
  }
};

// DELETE /api/images/* - Delete image from R2 (admin/manager only)
export const onRequestDelete: PagesFunction<Env & { JWT_SECRET: string }> = async (context) => {
  const { verifyAuth } = await import('../../_middleware');

  const auth = await verifyAuth(context.request, context.env.JWT_SECRET);
  if (!auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const path = (context.params.path as string[]).join('/');

  if (!path) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    await context.env.IMAGES.delete(path);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return Response.json({ message: 'Failed to delete image' }, { status: 500 });
  }
};
