import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getConfig,
  buildHeaders,
  buildUrl,
  pfmRequest,
  formatError,
  PostForMeApiError,
  POSTFORME_BASE_URL,
} from '../src/client.js';
import { mockFetchSuccess, mockFetchError } from './helpers.js';

// ── getConfig ─────────────────────────────────────────────────────────────────

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when POSTFORME_API_KEY is missing', () => {
    delete process.env.POSTFORME_API_KEY;
    expect(() => getConfig()).toThrow('POSTFORME_API_KEY');
  });

  it('returns config when API key is set', () => {
    process.env.POSTFORME_API_KEY = 'my-key-123';
    const config = getConfig();
    expect(config.apiKey).toBe('my-key-123');
  });
});

// ── buildHeaders ──────────────────────────────────────────────────────────────

describe('buildHeaders', () => {
  it('includes Authorization Bearer token', () => {
    const headers = buildHeaders('my-api-key');
    expect(headers['Authorization']).toBe('Bearer my-api-key');
  });

  it('includes Content-Type application/json', () => {
    const headers = buildHeaders('key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('includes Accept application/json', () => {
    const headers = buildHeaders('key');
    expect(headers['Accept']).toBe('application/json');
  });
});

// ── buildUrl ─────────────────────────────────────────────────────────────────

describe('buildUrl', () => {
  it('builds a plain URL with no params', () => {
    const url = buildUrl('/v1/social-posts');
    expect(url).toBe(`${POSTFORME_BASE_URL}/v1/social-posts`);
  });

  it('appends scalar query params', () => {
    const url = buildUrl('/v1/social-posts', { offset: 10, limit: 25 });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('10');
    expect(parsed.searchParams.get('limit')).toBe('25');
  });

  it('appends array params as multiple values (OR filter logic)', () => {
    const url = buildUrl('/v1/social-posts', {
      platform: ['facebook', 'instagram'],
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.getAll('platform')).toEqual(['facebook', 'instagram']);
  });

  it('omits undefined params', () => {
    const url = buildUrl('/v1/social-posts', { offset: undefined, limit: 10 });
    const parsed = new URL(url);
    expect(parsed.searchParams.has('offset')).toBe(false);
    expect(parsed.searchParams.get('limit')).toBe('10');
  });

  it('handles mixed scalar and array params together', () => {
    const url = buildUrl('/v1/social-posts', {
      limit: 20,
      status: ['draft', 'scheduled'],
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('limit')).toBe('20');
    expect(parsed.searchParams.getAll('status')).toEqual(['draft', 'scheduled']);
  });
});

// ── pfmRequest ───────────────────────────────────────────────────────────────

describe('pfmRequest', () => {
  it('calls the correct base URL and path', async () => {
    const fetch = mockFetchSuccess({ data: [] });
    await pfmRequest('GET', '/v1/social-posts', { apiKey: 'key' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${POSTFORME_BASE_URL}/v1/social-posts`),
      expect.any(Object)
    );
  });

  it('sends Authorization header with Bearer token', async () => {
    const fetch = mockFetchSuccess({});
    await pfmRequest('GET', '/v1/social-posts', { apiKey: 'my-secret-key' });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-secret-key');
  });

  it('serializes body as JSON for POST', async () => {
    const fetch = mockFetchSuccess({ id: 'sp_123' });
    await pfmRequest('POST', '/v1/social-posts', {
      apiKey: 'key',
      body: { caption: 'Hello world', social_accounts: ['spc_abc'] },
    });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body.caption).toBe('Hello world');
    expect(body.social_accounts).toEqual(['spc_abc']);
  });

  it('sends no body for GET requests', async () => {
    const fetch = mockFetchSuccess({});
    await pfmRequest('GET', '/v1/social-posts/sp_abc', { apiKey: 'key' });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeUndefined();
  });

  it('appends array query params correctly', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await pfmRequest('GET', '/v1/social-posts', {
      apiKey: 'key',
      params: { platform: ['facebook', 'instagram'] },
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.getAll('platform')).toEqual(['facebook', 'instagram']);
  });

  it('returns empty object for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.reject(new Error('no body')),
    }));
    const result = await pfmRequest('DELETE', '/v1/social-posts/sp_abc', { apiKey: 'key' });
    expect(result).toEqual({});
  });

  it('throws PostForMeApiError on non-ok response', async () => {
    mockFetchError(404, { message: 'Post not found' });
    await expect(
      pfmRequest('GET', '/v1/social-posts/bad-id', { apiKey: 'key' })
    ).rejects.toThrow(PostForMeApiError);
  });

  it('throws PostForMeApiError with correct status and endpoint', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    try {
      await pfmRequest('GET', '/v1/social-posts', { apiKey: 'bad-key' });
    } catch (e) {
      expect(e).toBeInstanceOf(PostForMeApiError);
      expect((e as PostForMeApiError).status).toBe(401);
      expect((e as PostForMeApiError).endpoint).toBe('/v1/social-posts');
    }
  });

  it('parses error body as JSON when possible', async () => {
    mockFetchError(422, { field: 'caption', message: 'required' });
    try {
      await pfmRequest('POST', '/v1/social-posts', { apiKey: 'key', body: {} });
    } catch (e) {
      expect((e as PostForMeApiError).body).toEqual({ field: 'caption', message: 'required' });
    }
  });

  it('handles non-JSON error bodies as raw text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('plain text error'),
    }));
    try {
      await pfmRequest('GET', '/v1/social-posts', { apiKey: 'key' });
    } catch (e) {
      expect((e as PostForMeApiError).body).toBe('plain text error');
    }
  });
});

// ── formatError ───────────────────────────────────────────────────────────────

describe('formatError', () => {
  it('formats PostForMeApiError with status, endpoint, and details', () => {
    const err = new PostForMeApiError(404, 'Not Found', { message: 'Post not found' }, '/v1/social-posts/xyz');
    const result = JSON.parse(formatError(err));
    expect(result.error).toBe(true);
    expect(result.status).toBe(404);
    expect(result.endpoint).toBe('/v1/social-posts/xyz');
    expect(result.details).toEqual({ message: 'Post not found' });
  });

  it('formats generic Error with message', () => {
    const result = JSON.parse(formatError(new Error('Something went wrong')));
    expect(result.error).toBe(true);
    expect(result.message).toBe('Something went wrong');
  });

  it('formats unknown thrown values as string', () => {
    const result = JSON.parse(formatError('plain string error'));
    expect(result.error).toBe(true);
    expect(result.message).toBe('plain string error');
  });

  it('includes message field for PostForMeApiError', () => {
    const err = new PostForMeApiError(500, 'Server Error', {}, '/v1/social-posts');
    const result = JSON.parse(formatError(err));
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });
});
