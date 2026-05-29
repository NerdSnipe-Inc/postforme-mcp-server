/**
 * Social Account Feeds tools — every post made for a connected account,
 * including posts NOT made through the Post for Me API.
 *
 * Requires accounts connected with the "feeds" permission.
 *
 * Supported platforms: Instagram, Facebook, TikTok, TikTok Business,
 * YouTube, Threads, X (Twitter), Bluesky, Pinterest, LinkedIn.
 *
 * Note: LinkedIn metrics are only available for company pages.
 * Note: Instagram metrics may take up to 48 hours to appear.
 * Note: Facebook feeds with expand=metrics are capped server-side (default: 10).
 * Note: Bluesky does not expose views/impressions via their API.
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

export const socialAccountFeedTools = [
  {
    name: "pfm_get_account_feed",
    description:
      "Get the social media feed for a connected account — every post made under that account, " +
      "including posts not created through Post for Me. " +
      "Pass expand=['metrics'] to include analytics (views, likes, follows, etc.). " +
      "Requires the account to have been connected with 'feeds' permission. " +
      "Supported: Instagram, Facebook, TikTok, TikTok Business, YouTube, Threads, X, Bluesky, Pinterest, LinkedIn.",
    inputSchema: z.object({
      social_account_id: z
        .string()
        .describe("Social account ID (e.g. spc_xxxxxx)"),
      limit: z
        .number()
        .optional()
        .describe(
          "Max items to return (default: 50). Some platforms cap this lower and will return their max."
        ),
      cursor: z
        .string()
        .optional()
        .describe("Cursor from a previous response for pagination"),
      external_post_id: z
        .array(z.string())
        .optional()
        .describe("Filter by Post for Me external post IDs (OR logic)"),
      social_post_id: z
        .array(z.string())
        .optional()
        .describe("Filter by Post for Me social post IDs (OR logic), e.g. sp_xxxxxx"),
      platform_post_id: z
        .array(z.string())
        .optional()
        .describe("Filter by platform-native post IDs (OR logic)"),
      expand: z
        .array(z.enum(["metrics"]))
        .optional()
        .describe("Pass ['metrics'] to include post analytics data in the response"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { social_account_id, ...rest } = args as Record<string, unknown> & { social_account_id: string };
      try {
        const result = await pfmRequest(
          "GET",
          `/v1/social-account-feeds/${social_account_id}`,
          {
            apiKey: config.apiKey,
            params: {
              limit: rest.limit as number | undefined,
              cursor: rest.cursor as string | undefined,
              external_post_id: rest.external_post_id as string[] | undefined,
              social_post_id: rest.social_post_id as string[] | undefined,
              platform_post_id: rest.platform_post_id as string[] | undefined,
              expand: rest.expand as string[] | undefined,
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
