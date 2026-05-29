/**
 * Social Post Results tools — outcome of publishing to each platform.
 *
 * Post results record success/failure, any errors, platform URL, and media.
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

export const socialPostResultTools = [
  {
    name: "pfm_get_post_results",
    description:
      "Get a paginated list of social post results. " +
      "Filter by post IDs, platform(s), or social account IDs (all use OR logic). " +
      "Results show success/failure, errors, platform URL, and per-platform data.",
    inputSchema: z.object({
      offset: z.number().optional().describe("Number of items to skip (default: 0)"),
      limit: z.number().optional().describe("Number of items to return (default: 50)"),
      post_id: z
        .array(z.string())
        .optional()
        .describe("Filter by post IDs (OR logic)"),
      platform: z
        .array(z.string())
        .optional()
        .describe("Filter by platform(s) (OR logic): x, facebook, instagram, etc."),
      social_account_id: z
        .array(z.string())
        .optional()
        .describe("Filter by social account IDs (OR logic)"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("GET", "/v1/social-post-results", {
          apiKey: config.apiKey,
          params: {
            offset: args.offset as number | undefined,
            limit: args.limit as number | undefined,
            post_id: args.post_id as string[] | undefined,
            platform: args.platform as string[] | undefined,
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
    name: "pfm_get_post_result",
    description:
      "Get a single social post result by its ID. " +
      "Includes success/failure, errors, platform_data (ID + URL), and media.",
    inputSchema: z.object({
      id: z.string().describe("Post result ID"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id } = args as { id: string };
      try {
        const result = await pfmRequest("GET", `/v1/social-post-results/${id}`, {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
