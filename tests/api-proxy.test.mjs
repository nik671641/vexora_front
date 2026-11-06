import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { onRequest } from '../functions/api/[[path]].js'

test('forwards JSON, session and CSRF headers, preserving errors and cookies', async () => {
  const cookies = [
    'sessionid=session; HttpOnly; Path=/; SameSite=Lax; Secure',
    'csrftoken=token; Path=/; SameSite=Lax; Secure',
  ]
  const fetchMock = mock.method(globalThis, 'fetch', async (request, init) => {
    assert.equal(request.url, 'https://vexora-backend-q4m1.onrender.com/api/auth/login?next=workspace')
    assert.equal(request.method, 'POST')
    assert.deepEqual(await request.json(), { email: 'check@example.invalid' })
    assert.equal(init.headers.get('Cookie'), 'csrftoken=token')
    assert.equal(init.headers.get('X-CSRFToken'), 'token')
    assert.equal(init.headers.get('Origin'), 'https://vexora-front.pages.dev')
    assert.equal(init.headers.get('Host'), 'vexora-backend-q4m1.onrender.com')
    assert.equal(init.headers.has('X-Forwarded-Host'), false)
    assert.equal(init.redirect, 'manual')
    assert.equal(init.cache, 'no-store')
    const headers = new Headers({ 'Content-Type': 'application/json' })
    for (const cookie of cookies) headers.append('Set-Cookie', cookie)
    return new Response('{"error":{"code":"invalid_credentials"}}', { status: 401, headers })
  })
  try {
    const response = await onRequest({ request: new Request('https://vexora-front.pages.dev/api/auth/login?next=workspace', {
      method: 'POST',
      headers: { Cookie: 'csrftoken=token', 'X-CSRFToken': 'token', Origin: 'https://vexora-front.pages.dev', 'X-Forwarded-Host': 'attacker.invalid' },
      body: JSON.stringify({ email: 'check@example.invalid' }),
    }) })
    assert.equal(response.status, 401)
    assert.equal((await response.json()).error.code, 'invalid_credentials')
    assert.deepEqual(response.headers.getSetCookie(), cookies)
    assert.match(response.headers.get('Cache-Control'), /no-store/)
  } finally {
    fetchMock.mock.restore()
  }
})

test('streams multipart uploads and leaves cross-origin CSRF evidence intact', async () => {
  const body = new FormData()
  body.set('file', new Blob(['reference bytes'], { type: 'image/png' }), 'reference.png')
  const fetchMock = mock.method(globalThis, 'fetch', async (request, init) => {
    assert.equal((await request.formData()).get('file').name, 'reference.png')
    assert.equal(init.headers.get('Origin'), 'https://untrusted.example')
    return new Response(null, { status: 204 })
  })
  try {
    const response = await onRequest({ request: new Request('https://vexora-front.pages.dev/api/media/references', {
      method: 'POST', body, headers: { Origin: 'https://untrusted.example' },
    }) })
    assert.equal(response.status, 204)
    assert.equal(await response.text(), '')
  } finally {
    fetchMock.mock.restore()
  }
})

test('rewrites backend redirects while preserving external OAuth redirects', async () => {
  for (const [location, expected] of [
    ['https://vexora-backend-q4m1.onrender.com/api/next?x=1', 'https://vexora-front.pages.dev/api/next?x=1'],
    ['https://accounts.google.com/authorize?state=test', 'https://accounts.google.com/authorize?state=test'],
  ]) {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(null, {
      status: 302, headers: { Location: location },
    }))
    try {
      const response = await onRequest({ request: new Request('https://vexora-front.pages.dev/api/auth/social/google/authorize') })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('Location'), expected)
    } finally {
      fetchMock.mock.restore()
    }
  }
})

test('returns a sanitized retryable response if Render is unreachable', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('private network detail') })
  try {
    const response = await onRequest({ request: new Request('https://vexora-front.pages.dev/api/health') })
    assert.equal(response.status, 502)
    assert.equal((await response.json()).error.code, 'temporary_service_error')
  } finally {
    fetchMock.mock.restore()
  }
})
