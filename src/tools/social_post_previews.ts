/**
 * Social Post Previews tools — preview what a post will look like per account
 * before publishing.
 *
 * Previews do not require accounts to be connected — you can specify placeholder IDs.
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

const MediaSchema = z.object({
  url: z.string().describe("Public URL of the media item"),
  thumbnail_url: z.string().optional(),
  thumbnail_timestamp_ms: z.number().optional(),
  skip_processing: z.boolean().optional(),
});

const SocialAccountPreviewSchema = z.object({
  id: z.string().describe("Social account ID (can be a placeholder for non-connected accounts)"),
  platform: z.string().describe("Platform: facebook, instagram, x, tiktok, youtube, etc."),
  username: z.string().optional().describe("Username of the social account"),
});

export const socialPostPreviewTools = [
  {
    name: "pfm_create_post_previews",
    description:
      "Generate a preview of what a post will look like for each specified account. " +
      "You can preview non-connected accounts by specifying a placeholder ID. " +
      "Returns per-account preview objects with resolved caption, media, platform, and configuration.",
    inputSchema: z.object({
      caption: z.string().describe("Caption text for the post"),
      preview_social_accounts: z
        .array(SocialAccountPreviewSchema)
        .describe("Social accounts to preview — can include non-connected accounts with placeholder IDs"),
      media: z
        .array(MediaSchema)
        .optional()
        .describe("Media items to include in the preview"),
      platform_configurations: z
        .record(z.unknown())
        .optional()
        .describe(
          "Platform-specific content overrides (same schema as CreateSocialPostDto platform_configurations)"
        ),
      account_configurations: z
        .array(
          z.object({
            social_account_id: z.string(),
            configuration: z.record(z.unknown()),
          })
        )
        .optional()
        .describe("Account-specific content overrides"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("POST", "/v1/social-post-previews", {
          apiKey: config.apiKey,
          body: args,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
