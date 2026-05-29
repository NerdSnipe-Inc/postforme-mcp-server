import { describe, it, expect } from 'vitest';
import { mediaTools } from '../src/tools/media.js';
import { socialPostTools } from '../src/tools/social_posts.js';
import { socialPostResultTools } from '../src/tools/social_post_results.js';
import { socialAccountTools } from '../src/tools/social_accounts.js';
import { socialAccountFeedTools } from '../src/tools/social_account_feeds.js';
import { webhookTools } from '../src/tools/webhooks.js';
import { socialPostPreviewTools } from '../src/tools/social_post_previews.js';

const ALL_TOOLS = [
  ...mediaTools,
  ...socialPostTools,
  ...socialPostResultTools,
  ...socialAccountTools,
  ...socialAccountFeedTools,
  ...webhookTools,
  ...socialPostPreviewTools,
];

// ── Registry invariants ───────────────────────────────────────────────────────

describe('Tool registry', () => {
  it('registers exactly 21 tools', () => {
    expect(ALL_TOOLS).toHaveLength(21);
  });

  it('every tool name starts with pfm_', () => {
    const bad = ALL_TOOLS.filter((t) => !t.name.startsWith('pfm_'));
    expect(bad).toHaveLength(0);
  });

  it('every tool has a non-empty name', () => {
    ALL_TOOLS.forEach((t) => {
      expect(t.name.length).toBeGreaterThan(0);
    });
  });

  it('every tool has a description longer than 10 characters', () => {
    ALL_TOOLS.forEach((t) => {
      expect(t.description.length, `${t.name} has a short description`).toBeGreaterThan(10);
    });
  });

  it('every tool has an inputSchema', () => {
    ALL_TOOLS.forEach((t) => {
      expect(t.inputSchema, `${t.name} is missing inputSchema`).toBeDefined();
    });
  });

  it('every tool has a handler function', () => {
    ALL_TOOLS.forEach((t) => {
      expect(typeof t.handler, `${t.name} handler is not a function`).toBe('function');
    });
  });

  it('has no duplicate tool names', () => {
    const names = ALL_TOOLS.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// ── Per-module counts ─────────────────────────────────────────────────────────

describe('Tool counts per module', () => {
  it('media has 1 tool', () => expect(mediaTools).toHaveLength(1));
  it('socialPosts has 5 tools', () => expect(socialPostTools).toHaveLength(5));
  it('socialPostResults has 2 tools', () => expect(socialPostResultTools).toHaveLength(2));
  it('socialAccounts has 6 tools', () => expect(socialAccountTools).toHaveLength(6));
  it('socialAccountFeeds has 1 tool', () => expect(socialAccountFeedTools).toHaveLength(1));
  it('webhooks has 5 tools', () => expect(webhookTools).toHaveLength(5));
  it('socialPostPreviews has 1 tool', () => expect(socialPostPreviewTools).toHaveLength(1));
});

// ── All expected tool names are present ───────────────────────────────────────

describe('Expected tool names', () => {
  const toolNames = new Set(ALL_TOOLS.map((t) => t.name));

  const expectedTools = [
    // Media
    'pfm_create_media_upload_url',
    // Social Posts
    'pfm_get_posts',
    'pfm_create_post',
    'pfm_get_post',
    'pfm_update_post',
    'pfm_delete_post',
    // Social Post Results
    'pfm_get_post_results',
    'pfm_get_post_result',
    // Social Accounts
    'pfm_get_social_accounts',
    'pfm_create_social_account',
    'pfm_get_social_account',
    'pfm_update_social_account',
    'pfm_create_social_account_auth_url',
    'pfm_disconnect_social_account',
    // Social Account Feeds
    'pfm_get_account_feed',
    // Webhooks
    'pfm_get_webhooks',
    'pfm_create_webhook',
    'pfm_get_webhook',
    'pfm_update_webhook',
    'pfm_delete_webhook',
    // Social Post Previews
    'pfm_create_post_previews',
  ];

  it(`all ${expectedTools.length} expected tools are present`, () => {
    expectedTools.forEach((name) => {
      expect(toolNames.has(name), `Missing tool: ${name}`).toBe(true);
    });
    expect(expectedTools).toHaveLength(21);
  });
});
