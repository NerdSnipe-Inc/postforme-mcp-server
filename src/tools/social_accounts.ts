/**
 * Social Accounts tools — manage connected platform accounts.
 *
 * Social accounts are the platform-specific identities (Twitter, LinkedIn, etc.)
 * used for publishing. Each has a unique `id` (e.g. spc_xxx) referenced in posts.
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

// ── Provider data schemas ──────────────────────────────────────────────────────

const BlueskyAuthUrlProviderDataSchema = z.object({
  handle: z.string().describe("Bluesky account handle"),
  app_password: z.string().describe("Bluesky app password"),
});

const LinkedInUrlProviderDataSchema = z.object({
  connection_type: z
    .enum(["personal", "organization"])
    .describe(
      "Connection type. Use 'organization' with Post for Me system credentials, or if using Community API."
    ),
  permission_overrides: z
    .array(z.string())
    .optional()
    .describe("Override default LinkedIn OAuth scopes"),
});

const InstagramProviderDataSchema = z.object({
  connection_type: z
    .enum(["instagram", "facebook"])
    .describe("'instagram' for Login with Instagram, 'facebook' for Login with Facebook"),
  permission_overrides: z.array(z.string()).optional().describe("Override default Instagram scopes"),
});

const FacebookProviderDataSchema = z.object({
  permission_overrides: z.array(z.string()).optional().describe("Override default Facebook scopes"),
});

const TikTokProviderDataSchema = z.object({
  permission_overrides: z.array(z.string()).optional().describe("Override default TikTok scopes"),
});

const TikTokBusinessProviderDataSchema = z.object({
  permission_overrides: z
    .array(z.string())
    .optional()
    .describe("Override default TikTok Business scopes"),
});

const YouTubeProviderDataSchema = z.object({
  permission_overrides: z.array(z.string()).optional().describe("Override default YouTube scopes"),
});

const PinterestProviderDataSchema = z.object({
  permission_overrides: z.array(z.string()).optional().describe("Override default Pinterest scopes"),
});

const ThreadsProviderDataSchema = z.object({
  permission_overrides: z.array(z.string()).optional().describe("Override default Threads scopes"),
});

const AuthUrlProviderDataSchema = z.object({
  bluesky: BlueskyAuthUrlProviderDataSchema.optional().describe(
    "Required for Bluesky — handle + app password"
  ),
  linkedin: LinkedInUrlProviderDataSchema.optional(),
  instagram: InstagramProviderDataSchema.optional(),
  facebook: FacebookProviderDataSchema.optional(),
  tiktok: TikTokProviderDataSchema.optional(),
  tiktok_business: TikTokBusinessProviderDataSchema.optional(),
  youtube: YouTubeProviderDataSchema.optional(),
  pinterest: PinterestProviderDataSchema.optional(),
  threads: ThreadsProviderDataSchema.optional(),
});

// ── Tools ──────────────────────────────────────────────────────────────────────

export const socialAccountTools = [
  {
    name: "pfm_get_social_accounts",
    description:
      "Get a paginated list of connected social accounts. " +
      "Filter by platform, username, external ID, account ID, or connection status. All filters use OR logic.",
    inputSchema: z.object({
      offset: z.number().optional().describe("Number of items to skip (default: 0)"),
      limit: z.number().optional().describe("Number of items to return (default: 50)"),
      platform: z
        .array(z.string())
        .optional()
        .describe("Filter by platform(s) (OR logic): x, facebook, instagram, linkedin, etc."),
      username: z
        .array(z.string())
        .optional()
        .describe("Filter by username(s) (OR logic)"),
      external_id: z
        .array(z.string())
        .optional()
        .describe("Filter by your external IDs (OR logic)"),
      id: z
        .array(z.string())
        .optional()
        .describe("Filter by account IDs (OR logic), e.g. spc_xxxxxx"),
      status: z
        .array(z.enum(["connected", "disconnected"]))
        .optional()
        .describe("Filter by status (OR logic): connected, disconnected"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("GET", "/v1/social-accounts", {
          apiKey: config.apiKey,
          params: {
            offset: args.offset as number | undefined,
            limit: args.limit as number | undefined,
            platform: args.platform as string[] | undefined,
            username: args.username as string[] | undefined,
            external_id: args.external_id as string[] | undefined,
            id: args.id as string[] | undefined,
            status: args.status as string[] | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_create_social_account",
    description:
      "Create a social account directly (upsert by platform + user_id). " +
      "If an account with the same platform and user_id already exists, it is updated. " +
      "Use this when you have OAuth tokens from your own auth flow.",
    inputSchema: z.object({
      platform: z
        .enum([
          "facebook",
          "instagram",
          "x",
          "tiktok",
          "youtube",
          "pinterest",
          "linkedin",
          "bluesky",
          "threads",
          "tiktok_business",
        ])
        .describe("Social media platform"),
      user_id: z.string().describe("The platform's user ID for this account"),
      access_token: z.string().describe("OAuth access token"),
      access_token_expires_at: z
        .string()
        .describe("ISO 8601 datetime when access token expires"),
      username: z.string().optional().describe("Platform username"),
      external_id: z.string().optional().describe("Your unique identifier for this account"),
      refresh_token: z.string().optional().describe("OAuth refresh token"),
      refresh_token_expires_at: z
        .string()
        .optional()
        .describe("ISO 8601 datetime when refresh token expires"),
      metadata: z
        .record(z.unknown())
        .optional()
        .describe("Custom metadata for the account"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("POST", "/v1/social-accounts", {
          apiKey: config.apiKey,
          body: args,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_get_social_account",
    description: "Get a single social account by its ID.",
    inputSchema: z.object({
      id: z.string().describe("Social account ID (e.g. spc_xxxxxx)"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id } = args as { id: string };
      try {
        const result = await pfmRequest("GET", `/v1/social-accounts/${id}`, {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_update_social_account",
    description:
      "Update a social account's username or external_id.",
    inputSchema: z.object({
      id: z.string().describe("Social account ID to update"),
      username: z.string().optional().describe("New platform username"),
      external_id: z.string().optional().describe("New external ID"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id, ...body } = args as Record<string, unknown> & { id: string };
      try {
        const result = await pfmRequest("PATCH", `/v1/social-accounts/${id as string}`, {
          apiKey: config.apiKey,
          body,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_create_social_account_auth_url",
    description:
      "Generate an OAuth URL to connect a user's social media account. " +
      "Redirect the user to this URL; they'll be redirected back after auth. " +
      "For Quickstart projects using Post for Me system credentials, redirect_url_override is not accepted — configure it in the dashboard instead. " +
      "Include 'feeds' in permissions to later fetch the account feed and metrics.",
    inputSchema: z.object({
      platform: z
        .string()
        .describe(
          "The social platform: facebook, instagram, x, tiktok, tiktok_business, youtube, pinterest, linkedin, bluesky, threads"
        ),
      platform_data: AuthUrlProviderDataSchema.optional().describe(
        "Extra provider-specific data (required for bluesky; optional for others)"
      ),
      external_id: z
        .string()
        .optional()
        .describe("Your unique identifier for this social account"),
      redirect_url_override: z
        .string()
        .optional()
        .describe(
          "Custom redirect URL after OAuth. Must be in your app's authorized redirect URLs. Not available with system credentials."
        ),
      permissions: z
        .array(z.enum(["posts", "feeds"]))
        .optional()
        .describe(
          "Permissions to request. Default: ['posts']. Include 'feeds' to enable account feed and metrics."
        ),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("POST", "/v1/social-accounts/auth-url", {
          apiKey: config.apiKey,
          body: args,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_disconnect_social_account",
    description:
      "Disconnect a social account — removes all auth tokens and marks it as disconnected. " +
      "The account record is kept and can be retrieved and reconnected by the owner.",
    inputSchema: z.object({
      id: z.string().describe("Social account ID to disconnect"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id } = args as { id: string };
      try {
        const result = await pfmRequest(
          "POST",
          `/v1/social-accounts/${id}/disconnect`,
          { apiKey: config.apiKey }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
