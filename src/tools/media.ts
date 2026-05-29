/**
 * Media tools — upload URLs for attaching media to posts.
 *
 * Flow: create-upload-url → PUT file to `upload_url` → use `media_url` in post.
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

export const mediaTools = [
  {
    name: "pfm_create_media_upload_url",
    description:
      "Request a signed upload URL for a media file (image/video). " +
      "Returns `upload_url` (PUT your file there) and `media_url` (use in post). " +
      "Media assets are temporary: deleted when the post is published, after 24h if unused, or when the post is deleted.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("POST", "/v1/media/create-upload-url", {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
