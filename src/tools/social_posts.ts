/**
 * Social Posts tools — create, read, update, delete posts across platforms.
 *
 * Posts support three levels of content override:
 *   1. Default (top-level caption/media)
 *   2. Platform-specific (platform_configurations)
 *   3. Account-specific (account_configurations)
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

// ── Shared schemas ─────────────────────────────────────────────────────────────

const MediaSchema = z.object({
  url: z.string().describe("Public URL of the media item"),
  thumbnail_url: z.string().optional().describe("Public URL of the thumbnail for video media"),
  thumbnail_timestamp_ms: z.number().optional().describe("Frame timestamp in ms to use as thumbnail"),
  skip_processing: z
    .boolean()
    .optional()
    .describe("If true, skip media processing — use for large files to avoid timeouts"),
});

const UserTagSchema = z.object({
  id: z.string().describe("Facebook User ID, Instagram username, or Instagram product ID"),
  type: z.enum(["user", "product"]).describe("Tag type — 'product' is Instagram-only"),
  platform: z.enum(["facebook", "instagram"]),
  x: z.number().optional().describe("% from left edge of image (not needed for videos/stories)"),
  y: z.number().optional().describe("% from top edge of image (not needed for videos/stories)"),
});

const PinterestConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for Pinterest"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for Pinterest"),
  title: z.string().optional().describe("Pinterest pin title"),
  board_ids: z.array(z.string()).optional().describe("Pinterest board IDs"),
  link: z.string().optional().describe("Pinterest pin link URL"),
});

const InstagramConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for Instagram"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for Instagram"),
  placement: z
    .enum(["reels", "stories", "timeline"])
    .optional()
    .describe("Instagram post placement"),
  collaborators: z.array(z.string()).optional().describe("Instagram usernames to tag as collaborators"),
  share_to_feed: z.boolean().optional().describe("If false, Reels-only visibility"),
  location: z.string().optional().describe("Page ID with location to tag"),
  trial_reel_type: z
    .enum(["manual", "performance"])
    .optional()
    .describe("Trial reel type — manual or performance-based graduation"),
  audio_name: z.string().optional().describe("Display name for audio on Instagram Reels"),
});

const TiktokConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for TikTok"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for TikTok"),
  title: z.string().optional().describe("Overrides post title for TikTok"),
  privacy_status: z.string().optional().describe("Privacy status: public or private"),
  allow_comment: z.boolean().optional().describe("Allow comments on TikTok post"),
  allow_duet: z.boolean().optional().describe("Allow duets on TikTok post"),
  allow_stitch: z.boolean().optional().describe("Allow stitch on TikTok post"),
  disclose_your_brand: z.boolean().optional().describe("Disclose your brand on TikTok"),
  disclose_branded_content: z.boolean().optional().describe("Disclose branded content on TikTok"),
  is_ai_generated: z.boolean().optional().describe("Flag content as AI generated on TikTok"),
  is_draft: z.boolean().optional().describe("Create as TikTok draft — must be completed in-app"),
  auto_add_music: z.boolean().optional().describe("Automatically add music to TikTok photo posts"),
});

const TwitterPollSchema = z.object({
  duration_minutes: z.number().describe("Poll duration in minutes"),
  options: z.array(z.string()).describe("Poll choices (2–4 options)"),
  reply_settings: z
    .enum(["following", "mentionedUsers", "subscribers", "verified"])
    .optional()
    .describe("Who can reply to the tweet"),
});

const TwitterConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for X/Twitter"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for X/Twitter"),
  poll: TwitterPollSchema.optional().describe("Twitter poll options"),
  community_id: z.string().optional().describe("Twitter community ID to post to"),
  quote_tweet_id: z.string().optional().describe("Tweet ID to quote"),
  reply_settings: z
    .enum(["following", "mentionedUsers", "subscribers", "verified"])
    .optional()
    .describe("Who can reply to the tweet"),
});

const YoutubeLocalizationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const YoutubeConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption (maps to snippet.description)"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for YouTube"),
  title: z.string().optional().describe("YouTube video title (snippet.title)"),
  description: z.string().optional().describe("YouTube video description; falls back to caption"),
  tags: z.array(z.string()).optional().describe("YouTube video tags"),
  category_id: z.string().optional().describe("YouTube category ID (see videoCategories.list)"),
  default_language: z.string().optional().describe("BCP-47 language tag, e.g. 'en'"),
  localizations: z
    .record(YoutubeLocalizationSchema)
    .optional()
    .describe("Per-language localizations keyed by BCP-47 tag"),
  privacy_status: z
    .enum(["public", "private", "unlisted"])
    .optional()
    .describe("YouTube privacy status"),
  embeddable: z.boolean().optional().describe("Allow embedding on external sites"),
  license: z.enum(["youtube", "creativeCommon"]).optional().describe("Video license type"),
  public_stats_viewable: z.boolean().optional().describe("Show extended statistics publicly"),
  publish_at: z
    .string()
    .optional()
    .describe("ISO 8601 datetime to publish — only honoured when privacy_status is 'private'"),
  made_for_kids: z.boolean().optional().describe("Mark as made for kids"),
  contains_synthetic_media: z
    .boolean()
    .optional()
    .describe("Mark as containing altered/synthetic content per YouTube policy"),
  recording_date: z.string().optional().describe("ISO 8601 date/datetime when video was recorded"),
});

const FacebookConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for Facebook"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for Facebook"),
  placement: z
    .enum(["reels", "stories", "timeline"])
    .optional()
    .describe("Facebook post placement"),
  location: z.string().optional().describe("Page ID with location to tag"),
  collaborators: z.array(z.string()).optional().describe("Page IDs to invite as Reel collaborators"),
  set_caption_for_each_image: z
    .boolean()
    .optional()
    .describe("Include caption on each carousel image vs. only the final post"),
});

const LinkedinConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for LinkedIn"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for LinkedIn"),
});

const BlueskyConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for Bluesky"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for Bluesky"),
});

const ThreadsConfigSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for Threads"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for Threads"),
  placement: z.enum(["reels", "timeline"]).optional().describe("Threads post placement"),
});

const PlatformConfigurationsSchema = z.object({
  pinterest: PinterestConfigSchema.optional(),
  instagram: InstagramConfigSchema.optional(),
  tiktok: TiktokConfigSchema.optional(),
  tiktok_business: TiktokConfigSchema.optional().describe("TikTok Business configuration"),
  x: TwitterConfigSchema.optional().describe("X/Twitter configuration"),
  youtube: YoutubeConfigSchema.optional(),
  facebook: FacebookConfigSchema.optional(),
  linkedin: LinkedinConfigSchema.optional(),
  bluesky: BlueskyConfigSchema.optional(),
  threads: ThreadsConfigSchema.optional(),
});

const AccountConfigurationDetailsSchema = z.object({
  caption: z.string().optional().describe("Overrides post caption for this account"),
  media: z.array(MediaSchema).optional().describe("Overrides post media for this account"),
  board_ids: z.array(z.string()).optional().describe("Pinterest board IDs"),
  link: z.string().optional().describe("Pinterest pin link"),
  placement: z
    .enum(["reels", "timeline", "stories"])
    .optional()
    .describe("Placement for Facebook/Instagram/Threads"),
  title: z.string().optional().describe("Title override (Pinterest, TikTok, YouTube)"),
  privacy_status: z
    .enum(["public", "private", "unlisted"])
    .optional()
    .describe("Privacy status for TikTok or YouTube"),
  made_for_kids: z.boolean().optional(),
  contains_synthetic_media: z.boolean().optional(),
  tags: z.array(z.string()).optional().describe("YouTube video tags"),
  category_id: z.string().optional().describe("YouTube category ID"),
  default_language: z.string().optional().describe("BCP-47 language tag"),
  localizations: z.record(YoutubeLocalizationSchema).optional(),
  embeddable: z.boolean().optional(),
  license: z.enum(["youtube", "creativeCommon"]).optional(),
  public_stats_viewable: z.boolean().optional(),
  publish_at: z.string().optional(),
  recording_date: z.string().optional(),
  allow_comment: z.boolean().optional(),
  allow_duet: z.boolean().optional(),
  allow_stitch: z.boolean().optional(),
  disclose_your_brand: z.boolean().optional(),
  disclose_branded_content: z.boolean().optional(),
  is_draft: z.boolean().optional(),
  is_ai_generated: z.boolean().optional(),
  auto_add_music: z.boolean().optional(),
  poll: TwitterPollSchema.optional(),
  community_id: z.string().optional(),
  quote_tweet_id: z.string().optional(),
  reply_settings: z
    .enum(["following", "mentionedUsers", "subscribers", "verified"])
    .optional(),
  location: z.string().optional(),
  collaborators: z.array(z.string()).optional(),
  share_to_feed: z.boolean().optional(),
  trial_reel_type: z.enum(["manual", "performance"]).optional(),
  audio_name: z.string().optional(),
  set_caption_for_each_image: z.boolean().optional(),
});

const AccountConfigurationSchema = z.object({
  social_account_id: z.string().describe("Social account ID to apply this configuration to"),
  configuration: AccountConfigurationDetailsSchema,
});

// ── Tools ──────────────────────────────────────────────────────────────────────

const PLATFORM_ENUM = z.enum([
  "bluesky",
  "facebook",
  "instagram",
  "linkedin",
  "pinterest",
  "threads",
  "tiktok",
  "x",
  "youtube",
]);

const POST_STATUS_ENUM = z.enum(["draft", "scheduled", "processing", "processed"]);

export const socialPostTools = [
  {
    name: "pfm_get_posts",
    description:
      "Get a paginated list of social posts. Filter by platform, status, external ID, or social account ID. Multiple filter values use OR logic.",
    inputSchema: z.object({
      offset: z.number().optional().describe("Number of items to skip (default: 0)"),
      limit: z.number().optional().describe("Number of items to return (default: 50)"),
      platform: z
        .array(PLATFORM_ENUM)
        .optional()
        .describe("Filter by platforms (OR logic): bluesky, facebook, instagram, linkedin, pinterest, threads, tiktok, x, youtube"),
      status: z
        .array(POST_STATUS_ENUM)
        .optional()
        .describe("Filter by post status (OR logic): draft, scheduled, processing, processed"),
      external_id: z
        .array(z.string())
        .optional()
        .describe("Filter by your external IDs (OR logic)"),
      social_account_id: z
        .array(z.string())
        .optional()
        .describe("Filter by social account IDs (OR logic)"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("GET", "/v1/social-posts", {
          apiKey: config.apiKey,
          params: {
            offset: args.offset as number | undefined,
            limit: args.limit as number | undefined,
            platform: args.platform as string[] | undefined,
            status: args.status as string[] | undefined,
            external_id: args.external_id as string[] | undefined,
            social_account_id: args.social_account_id as string[] | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_create_post",
    description:
      "Create and schedule (or publish immediately) a social media post across one or more accounts. " +
      "Omit `scheduled_at` to post instantly. Use `platform_configurations` for per-platform overrides " +
      "and `account_configurations` for per-account overrides. The most specific override wins.",
    inputSchema: z.object({
      caption: z.string().describe("Caption/body text for the post"),
      social_accounts: z
        .array(z.string())
        .describe("Array of social account IDs to post to"),
      scheduled_at: z
        .string()
        .optional()
        .describe("ISO 8601 datetime to schedule the post; omit to post immediately"),
      media: z
        .array(MediaSchema)
        .optional()
        .describe(
          "Media items to attach. For 'stories' placement, multiple items create individual posts."
        ),
      platform_configurations: PlatformConfigurationsSchema.optional().describe(
        "Platform-specific content overrides (pinterest, instagram, tiktok, tiktok_business, x, youtube, facebook, linkedin, bluesky, threads)"
      ),
      account_configurations: z
        .array(AccountConfigurationSchema)
        .optional()
        .describe("Account-specific content overrides"),
      external_id: z
        .string()
        .optional()
        .describe("Your own unique identifier for this post"),
      isDraft: z
        .boolean()
        .optional()
        .describe("If true, save as draft — post will not be processed"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("POST", "/v1/social-posts", {
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
    name: "pfm_get_post",
    description: "Get a single social post by its ID.",
    inputSchema: z.object({
      id: z.string().describe("Post ID"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id } = args as { id: string };
      try {
        const result = await pfmRequest("GET", `/v1/social-posts/${id}`, {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_update_post",
    description:
      "Update an existing social post (replaces the entire post definition). " +
      "Use the same schema as create — all fields are re-set.",
    inputSchema: z.object({
      id: z.string().describe("Post ID to update"),
      caption: z.string().describe("Caption/body text for the post"),
      social_accounts: z.array(z.string()).describe("Array of social account IDs to post to"),
      scheduled_at: z
        .string()
        .optional()
        .describe("ISO 8601 datetime to schedule the post; omit to post immediately"),
      media: z.array(MediaSchema).optional().describe("Media items to attach"),
      platform_configurations: PlatformConfigurationsSchema.optional(),
      account_configurations: z.array(AccountConfigurationSchema).optional(),
      external_id: z.string().optional().describe("Your own unique identifier for this post"),
      isDraft: z.boolean().optional().describe("If true, save as draft — post will not be processed"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id, ...body } = args as Record<string, unknown> & { id: string };
      try {
        const result = await pfmRequest("PUT", `/v1/social-posts/${id as string}`, {
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
    name: "pfm_delete_post",
    description: "Delete a social post by its ID.",
    inputSchema: z.object({
      id: z.string().describe("Post ID to delete"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id } = args as { id: string };
      try {
        const result = await pfmRequest("DELETE", `/v1/social-posts/${id}`, {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
