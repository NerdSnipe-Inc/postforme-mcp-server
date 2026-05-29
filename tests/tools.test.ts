/**
 * Handler tests — verifies each tool makes the correct HTTP call:
 * right method, right URL, right params/body, and returns the API response.
 *
 * All tests use a mocked fetch; no real network calls are made.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mediaTools } from '../src/tools/media.js';
import { socialPostTools } from '../src/tools/social_posts.js';
import { socialPostResultTools } from '../src/tools/social_post_results.js';
import { socialAccountTools } from '../src/tools/social_accounts.js';
import { socialAccountFeedTools } from '../src/tools/social_account_feeds.js';
import { webhookTools } from '../src/tools/webhooks.js';
import { socialPostPreviewTools } from '../src/tools/social_post_previews.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectSuccess,
  expectApiError,
} from './helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Media ─────────────────────────────────────────────────────────────────────

describe('pfm_create_media_upload_url', () => {
  const tool = mediaTools.find((t) => t.name === 'pfm_create_media_upload_url')!;

  it('POSTs to /v1/media/create-upload-url', async () => {
    const fetch = mockFetchSuccess({ upload_url: 'https://signed.url', media_url: 'https://cdn.url' });
    await tool.handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/media/create-upload-url');
  });

  it('returns the upload URL response', async () => {
    const data = { upload_url: 'https://signed.url/file', media_url: 'https://cdn.postforme.dev/abc' };
    mockFetchSuccess(data);
    const result = await tool.handler({}, TEST_CONFIG);
    expect(JSON.parse(result)).toEqual(data);
  });

  it('returns error on API failure', async () => {
    mockFetchError(500);
    const result = await tool.handler({}, TEST_CONFIG);
    expectApiError(result, 500);
  });
});

// ── Social Posts ──────────────────────────────────────────────────────────────

describe('pfm_get_posts', () => {
  const tool = socialPostTools.find((t) => t.name === 'pfm_get_posts')!;

  it('GETs /v1/social-posts', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-posts');
  });

  it('passes offset and limit as query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ offset: 20, limit: 10 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.get('offset')).toBe('20');
    expect(call.params.get('limit')).toBe('10');
  });

  it('passes platform array as repeated query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ platform: ['facebook', 'instagram'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('platform')).toEqual(['facebook', 'instagram']);
  });

  it('passes status array as repeated query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ status: ['draft', 'scheduled'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('status')).toEqual(['draft', 'scheduled']);
  });

  it('passes social_account_id array as repeated query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ social_account_id: ['spc_aaa', 'spc_bbb'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('social_account_id')).toEqual(['spc_aaa', 'spc_bbb']);
  });

  it('returns error on API failure', async () => {
    mockFetchError(500);
    const result = await tool.handler({}, TEST_CONFIG);
    expectApiError(result, 500);
  });
});

describe('pfm_create_post', () => {
  const tool = socialPostTools.find((t) => t.name === 'pfm_create_post')!;

  it('POSTs to /v1/social-posts', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ caption: 'Hello!', social_accounts: ['spc_abc'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/social-posts');
  });

  it('sends caption and social_accounts in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ caption: 'Hello!', social_accounts: ['spc_abc', 'spc_def'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.caption).toBe('Hello!');
    expect(call.body?.social_accounts).toEqual(['spc_abc', 'spc_def']);
  });

  it('sends scheduled_at when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({
      caption: 'Scheduled!',
      social_accounts: ['spc_abc'],
      scheduled_at: '2026-06-01T12:00:00Z',
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.scheduled_at).toBe('2026-06-01T12:00:00Z');
  });

  it('sends media array when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const media = [{ url: 'https://example.com/image.jpg' }];
    await tool.handler({ caption: 'With media', social_accounts: ['spc_abc'], media }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.media).toEqual(media);
  });

  it('sends platform_configurations when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const platform_configurations = { instagram: { placement: 'reels' } };
    await tool.handler({
      caption: 'IG Reel',
      social_accounts: ['spc_abc'],
      platform_configurations,
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.platform_configurations).toEqual(platform_configurations);
  });

  it('returns error on API failure', async () => {
    mockFetchError(400, { error: ['social_accounts is required'] });
    const result = await tool.handler({ caption: 'test', social_accounts: [] }, TEST_CONFIG);
    expectApiError(result, 400);
  });
});

describe('pfm_get_post', () => {
  const tool = socialPostTools.find((t) => t.name === 'pfm_get_post')!;

  it('GETs /v1/social-posts/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'sp_123' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-posts/sp_123');
  });

  it('returns the post data', async () => {
    mockFetchSuccess(MOCK_DATA);
    const result = await tool.handler({ id: 'sp_123' }, TEST_CONFIG);
    expectSuccess(result);
  });

  it('returns 404 error when not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'sp_notfound' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

describe('pfm_update_post', () => {
  const tool = socialPostTools.find((t) => t.name === 'pfm_update_post')!;

  it('PUTs to /v1/social-posts/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'sp_123', caption: 'Updated', social_accounts: ['spc_abc'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/v1/social-posts/sp_123');
  });

  it('does NOT include id in the request body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'sp_123', caption: 'Updated', social_accounts: ['spc_abc'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.caption).toBe('Updated');
  });

  it('returns 404 error when post not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'sp_bad', caption: 'x', social_accounts: [] }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

describe('pfm_delete_post', () => {
  const tool = socialPostTools.find((t) => t.name === 'pfm_delete_post')!;

  it('DELETEs /v1/social-posts/:id', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await tool.handler({ id: 'sp_123' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/v1/social-posts/sp_123');
  });

  it('returns success response', async () => {
    mockFetchSuccess({ success: true });
    const result = await tool.handler({ id: 'sp_123' }, TEST_CONFIG);
    expect(JSON.parse(result).success).toBe(true);
  });

  it('returns 404 error when not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'sp_bad' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

// ── Social Post Results ───────────────────────────────────────────────────────

describe('pfm_get_post_results', () => {
  const tool = socialPostResultTools.find((t) => t.name === 'pfm_get_post_results')!;

  it('GETs /v1/social-post-results', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-post-results');
  });

  it('passes post_id array as repeated query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ post_id: ['sp_aaa', 'sp_bbb'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('post_id')).toEqual(['sp_aaa', 'sp_bbb']);
  });

  it('passes platform array as repeated query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ platform: ['x', 'facebook'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('platform')).toEqual(['x', 'facebook']);
  });
});

describe('pfm_get_post_result', () => {
  const tool = socialPostResultTools.find((t) => t.name === 'pfm_get_post_result')!;

  it('GETs /v1/social-post-results/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'spr_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-post-results/spr_abc');
  });

  it('returns 404 when not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'spr_bad' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

// ── Social Accounts ───────────────────────────────────────────────────────────

describe('pfm_get_social_accounts', () => {
  const tool = socialAccountTools.find((t) => t.name === 'pfm_get_social_accounts')!;

  it('GETs /v1/social-accounts', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-accounts');
  });

  it('passes platform and status filters as repeated params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ platform: ['facebook', 'instagram'], status: ['connected'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('platform')).toEqual(['facebook', 'instagram']);
    expect(call.params.getAll('status')).toEqual(['connected']);
  });
});

describe('pfm_create_social_account', () => {
  const tool = socialAccountTools.find((t) => t.name === 'pfm_create_social_account')!;

  it('POSTs to /v1/social-accounts', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({
      platform: 'instagram',
      user_id: 'ig_user_123',
      access_token: 'tok_abc',
      access_token_expires_at: '2027-01-01T00:00:00Z',
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/social-accounts');
  });

  it('sends required fields in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({
      platform: 'instagram',
      user_id: 'ig_user_123',
      access_token: 'tok_abc',
      access_token_expires_at: '2027-01-01T00:00:00Z',
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.platform).toBe('instagram');
    expect(call.body?.user_id).toBe('ig_user_123');
    expect(call.body?.access_token).toBe('tok_abc');
  });
});

describe('pfm_get_social_account', () => {
  const tool = socialAccountTools.find((t) => t.name === 'pfm_get_social_account')!;

  it('GETs /v1/social-accounts/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'spc_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-accounts/spc_abc');
  });

  it('returns 404 when not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'spc_bad' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

describe('pfm_update_social_account', () => {
  const tool = socialAccountTools.find((t) => t.name === 'pfm_update_social_account')!;

  it('PATCHes /v1/social-accounts/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'spc_abc', username: 'new_username' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/v1/social-accounts/spc_abc');
  });

  it('does NOT include id in request body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'spc_abc', username: 'new_name' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.username).toBe('new_name');
  });
});

describe('pfm_create_social_account_auth_url', () => {
  const tool = socialAccountTools.find((t) => t.name === 'pfm_create_social_account_auth_url')!;

  it('POSTs to /v1/social-accounts/auth-url', async () => {
    const fetch = mockFetchSuccess({ url: 'https://oauth.provider.com/auth', platform: 'facebook' });
    await tool.handler({ platform: 'facebook' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/social-accounts/auth-url');
  });

  it('sends platform in body', async () => {
    const fetch = mockFetchSuccess({ url: 'https://...', platform: 'instagram' });
    await tool.handler({ platform: 'instagram' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.platform).toBe('instagram');
  });

  it('sends permissions array when provided', async () => {
    const fetch = mockFetchSuccess({ url: 'https://...', platform: 'instagram' });
    await tool.handler({ platform: 'instagram', permissions: ['posts', 'feeds'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.permissions).toEqual(['posts', 'feeds']);
  });

  it('sends bluesky platform_data when provided', async () => {
    const fetch = mockFetchSuccess({ url: 'https://...', platform: 'bluesky' });
    await tool.handler({
      platform: 'bluesky',
      platform_data: { bluesky: { handle: 'user.bsky.social', app_password: 'pass-abc' } },
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect((call.body?.platform_data as Record<string, unknown>)?.bluesky).toEqual({
      handle: 'user.bsky.social',
      app_password: 'pass-abc',
    });
  });
});

describe('pfm_disconnect_social_account', () => {
  const tool = socialAccountTools.find((t) => t.name === 'pfm_disconnect_social_account')!;

  it('POSTs to /v1/social-accounts/:id/disconnect', async () => {
    const fetch = mockFetchSuccess({ id: 'spc_abc', status: 'disconnected' });
    await tool.handler({ id: 'spc_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/social-accounts/spc_abc/disconnect');
  });

  it('returns 404 when account not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'spc_bad' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

// ── Social Account Feeds ──────────────────────────────────────────────────────

describe('pfm_get_account_feed', () => {
  const tool = socialAccountFeedTools.find((t) => t.name === 'pfm_get_account_feed')!;

  it('GETs /v1/social-account-feeds/:social_account_id', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ social_account_id: 'spc_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/social-account-feeds/spc_abc');
  });

  it('passes limit and cursor as query params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ social_account_id: 'spc_abc', limit: 10, cursor: 'pgn_xyz' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.get('limit')).toBe('10');
    expect(call.params.get('cursor')).toBe('pgn_xyz');
  });

  it('passes expand=metrics when requested', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ social_account_id: 'spc_abc', expand: ['metrics'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('expand')).toEqual(['metrics']);
  });

  it('filters by social_post_id when provided', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ social_account_id: 'spc_abc', social_post_id: ['sp_aaa', 'sp_bbb'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('social_post_id')).toEqual(['sp_aaa', 'sp_bbb']);
  });

  it('returns 500 error on server failure', async () => {
    mockFetchError(500);
    const result = await tool.handler({ social_account_id: 'spc_abc' }, TEST_CONFIG);
    expectApiError(result, 500);
  });
});

// ── Webhooks ──────────────────────────────────────────────────────────────────

describe('pfm_get_webhooks', () => {
  const tool = webhookTools.find((t) => t.name === 'pfm_get_webhooks')!;

  it('GETs /v1/webhooks', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/webhooks');
  });

  it('passes event_type array as repeated params', async () => {
    const fetch = mockFetchSuccess({ data: [], meta: {} });
    await tool.handler({ event_type: ['social.post.created', 'social.post.deleted'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.getAll('event_type')).toEqual(['social.post.created', 'social.post.deleted']);
  });
});

describe('pfm_create_webhook', () => {
  const tool = webhookTools.find((t) => t.name === 'pfm_create_webhook')!;

  it('POSTs to /v1/webhooks', async () => {
    const fetch = mockFetchSuccess({ id: 'wbh_abc', url: 'https://example.com/hook', secret: 'sec', event_types: [] });
    await tool.handler({ url: 'https://example.com/hook', event_types: ['social.post.created'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/webhooks');
  });

  it('sends url and event_types in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({
      url: 'https://example.com/hook',
      event_types: ['social.post.created', 'social.account.updated'],
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.url).toBe('https://example.com/hook');
    expect(call.body?.event_types).toEqual(['social.post.created', 'social.account.updated']);
  });
});

describe('pfm_get_webhook', () => {
  const tool = webhookTools.find((t) => t.name === 'pfm_get_webhook')!;

  it('GETs /v1/webhooks/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'wbh_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/v1/webhooks/wbh_abc');
  });

  it('returns 404 when not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'wbh_bad' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

describe('pfm_update_webhook', () => {
  const tool = webhookTools.find((t) => t.name === 'pfm_update_webhook')!;

  it('PATCHes /v1/webhooks/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'wbh_abc', url: 'https://new.example.com/hook' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/v1/webhooks/wbh_abc');
  });

  it('does NOT include id in request body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await tool.handler({ id: 'wbh_abc', url: 'https://new.url' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.url).toBe('https://new.url');
  });
});

describe('pfm_delete_webhook', () => {
  const tool = webhookTools.find((t) => t.name === 'pfm_delete_webhook')!;

  it('DELETEs /v1/webhooks/:id', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await tool.handler({ id: 'wbh_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/v1/webhooks/wbh_abc');
  });

  it('returns success response', async () => {
    mockFetchSuccess({ success: true });
    const result = await tool.handler({ id: 'wbh_abc' }, TEST_CONFIG);
    expect(JSON.parse(result).success).toBe(true);
  });

  it('returns 404 when not found', async () => {
    mockFetchError(404);
    const result = await tool.handler({ id: 'wbh_bad' }, TEST_CONFIG);
    expectApiError(result, 404);
  });
});

// ── Social Post Previews ──────────────────────────────────────────────────────

describe('pfm_create_post_previews', () => {
  const tool = socialPostPreviewTools.find((t) => t.name === 'pfm_create_post_previews')!;

  it('POSTs to /v1/social-post-previews', async () => {
    const fetch = mockFetchSuccess([]);
    await tool.handler({
      caption: 'Preview this!',
      preview_social_accounts: [{ id: 'spc_abc', platform: 'facebook' }],
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/v1/social-post-previews');
  });

  it('sends caption and preview_social_accounts in body', async () => {
    const fetch = mockFetchSuccess([]);
    const accounts = [{ id: 'spc_abc', platform: 'instagram', username: 'myuser' }];
    await tool.handler({ caption: 'Test preview', preview_social_accounts: accounts }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.caption).toBe('Test preview');
    expect(call.body?.preview_social_accounts).toEqual(accounts);
  });

  it('sends media when provided', async () => {
    const fetch = mockFetchSuccess([]);
    const media = [{ url: 'https://example.com/img.jpg' }];
    await tool.handler({
      caption: 'With image',
      preview_social_accounts: [{ id: 'spc_abc', platform: 'facebook' }],
      media,
    }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.media).toEqual(media);
  });

  it('returns 400 on invalid request', async () => {
    mockFetchError(400);
    const result = await tool.handler({ caption: 'x', preview_social_accounts: [] }, TEST_CONFIG);
    expectApiError(result, 400);
  });
});
