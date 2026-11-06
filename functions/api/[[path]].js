const BACKEND_ORIGIN = 'https://vexora-backend-q4m1.onrender.com'

/** Keep browser sessions on the Pages origin while Django handles the API. */
export async function onRequest({ request }) {
  const publicUrl = new URL(request.url)
  const upstreamUrl = new URL(BACKEND_ORIGIN)
  upstreamUrl.pathname = publicUrl.pathname
  upstreamUrl.search = publicUrl.search

  const headers = new Headers(request.headers)
  headers.set('Host', upstreamUrl.host)
  headers.set('X-Forwarded-Proto', 'https')
  headers.delete('X-Forwarded-Host')
  headers.delete('Forwarded')

  try {
    const upstream = await fetch(new Request(upstreamUrl, request), {
      headers,
      redirect: 'manual',
      cache: 'no-store',
    })
    // Preserve separate Set-Cookie headers, streaming uploads/downloads and
    // Django's status codes. Never cache responses carrying a user's session.
    const response = new Response(upstream.body, upstream)
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('X-Content-Type-Options', 'nosniff')

    const location = response.headers.get('Location')
    if (location) {
      const redirect = new URL(location, upstreamUrl)
      if (redirect.origin === BACKEND_ORIGIN) {
        redirect.host = publicUrl.host
        redirect.protocol = publicUrl.protocol
        response.headers.set('Location', redirect.href)
      }
    }
    return response
  } catch {
    return Response.json({
      error: {
        code: 'temporary_service_error',
        message: 'The server is temporarily unavailable. Please try again.',
      },
    }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
