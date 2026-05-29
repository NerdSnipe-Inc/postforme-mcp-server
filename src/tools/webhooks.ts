/**
 * Webhooks tools — subscribe to Post for Me events.
 *
 * When a subscribed event fires, Post for Me POSTs to your URL with:
 *   { "event_type": "social.post.created", "data": { ... } }
 *
 * Security: each request includes a "Post-For-Me-Webhook-Secret" header.
 * The secret is returned when you create a webhook.
 *
 * Retries: on non-2XX responses, Post for Me retries with exponential backoff
 * approximately 8 times over ~1 day.
 */

import { z } from "zod";
import { pfmRequest, formatError, PostForMeConfig } from "../client.js";

const EVENT_TYPES = z.enum([
  "social.post.created",
  "social.post.updated",
  "social.post.deleted",
  "social.post.result.created",
  "social.account.created",
  "social.account.updated",
]);

export const webhookTools = [
  {
    name: "pfm_get_webhooks",
    description:
      "Get a paginated list of webhooks. Filter by URL, event type, or webhook ID.",
    inputSchema: z.object({
      offset: z.number().optional().describe("Number of items to skip (default: 0)"),
      limit: z.number().optional().describe("Number of items to return (default: 50)"),
      url: z
        .array(z.string())
        .optional()
        .describe("Filter by webhook URLs (OR logic)"),
      event_type: z
        .array(z.string())
        .optional()
        .describe(
          "Filter by event types (OR logic): social.post.created, social.post.updated, social.post.deleted, social.post.result.created, social.account.created, social.account.updated"
        ),
      id: z
        .array(z.string())
        .optional()
        .describe("Filter by webhook IDs (OR logic), e.g. wbh_xxxxxx"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("GET", "/v1/webhooks", {
          apiKey: config.apiKey,
          params: {
            offset: args.offset as number | undefined,
            limit: args.limit as number | undefined,
            url: args.url as string[] | undefined,
            event_type: args.event_type as string[] | undefined,
            id: args.id as string[] | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_create_webhook",
    description:
      "Create a webhook to receive event notifications. " +
      "Returns a `secret` in the response — store it to verify incoming requests via the 'Post-For-Me-Webhook-Secret' header. " +
      "Available events: social.post.created, social.post.updated, social.post.deleted, " +
      "social.post.result.created, social.account.created, social.account.updated.",
    inputSchema: z.object({
      url: z.string().describe("Publicly accessible URL to receive POST event payloads"),
      event_types: z
        .array(EVENT_TYPES)
        .describe(
          "Events to subscribe to: social.post.created, social.post.updated, social.post.deleted, social.post.result.created, social.account.created, social.account.updated"
        ),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("POST", "/v1/webhooks", {
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
    name: "pfm_get_webhook",
    description: "Get a single webhook by its ID.",
    inputSchema: z.object({
      id: z.string().describe("Webhook ID (e.g. wbh_xxxxxx)"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id } = args as { id: string };
      try {
        const result = await pfmRequest("GET", `/v1/webhooks/${id}`, {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "pfm_update_webhook",
    description: "Update a webhook's URL and/or subscribed event types.",
    inputSchema: z.object({
      id: z.string().describe("Webhook ID to update"),
      url: z.string().optional().describe("New public URL for the webhook"),
      event_types: z
        .array(EVENT_TYPES)
        .optional()
        .describe("New list of event types to subscribe to"),
    }),
    handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
      const { id, ...body } = args as Record<string, unknown> & { id: string };
      try {
        const result = await pfmRequest("PATCH", `/v1/webhooks/${id as string}`, {
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
    name: "pfm_delete_webhook",
    description: "Delete a webhook by its ID.",
    inputSchema: z.object({
      id: z.string().describe("Webhook ID to delete"),
    }),
    handler: async (args: { id: string }, config: PostForMeConfig) => {
      try {
        const result = await pfmRequest("DELETE", `/v1/webhooks/${args.id}`, {
          apiKey: config.apiKey,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
