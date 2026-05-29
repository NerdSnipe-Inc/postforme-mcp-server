#!/usr/bin/env node
/**
 * Post for Me MCP Server
 *
 * Exposes the Post for Me API as Model Context Protocol (MCP) tools,
 * so any AI agent (Claude, Cursor, Windsurf, etc.) can schedule, publish,
 * and manage social media posts across every supported platform.
 *
 * GitHub : https://github.com/Nerdsnipe-Inc/postforme-mcp-server
 * API    : https://www.postforme.dev/
 *
 * Required env var (set in .env or your MCP client config):
 *   POSTFORME_API_KEY  — your Post for Me API key
 */

import "dotenv/config";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getConfig, formatError } from "./client.js";

// ── Tool modules ───────────────────────────────────────────────────────────────

import { mediaTools } from "./tools/media.js";
import { socialPostTools } from "./tools/social_posts.js";
import { socialPostResultTools } from "./tools/social_post_results.js";
import { socialAccountTools } from "./tools/social_accounts.js";
import { socialAccountFeedTools } from "./tools/social_account_feeds.js";
import { webhookTools } from "./tools/webhooks.js";
import { socialPostPreviewTools } from "./tools/social_post_previews.js";

// ── Types ──────────────────────────────────────────────────────────────────────

type PostForMeConfig = {
  apiKey: string;
};

type ToolDef = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (args: Record<string, unknown>, config: PostForMeConfig) => Promise<string>;
};

// ── Tool registry ──────────────────────────────────────────────────────────────

const ALL_TOOLS: ToolDef[] = [
  // Media uploads
  ...mediaTools,

  // Social posts (CRUD)
  ...socialPostTools,

  // Post results (read-only)
  ...socialPostResultTools,

  // Social accounts management
  ...socialAccountTools,

  // Account feed & analytics
  ...socialAccountFeedTools,

  // Webhooks
  ...webhookTools,

  // Post previews
  ...socialPostPreviewTools,
] as ToolDef[];

const toolMap = new Map<string, ToolDef>(ALL_TOOLS.map((t) => [t.name, t]));

// ── Zod → JSON Schema ──────────────────────────────────────────────────────────

function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  function convert(s: z.ZodTypeAny): Record<string, unknown> {
    if (s instanceof z.ZodObject) {
      const shape = s.shape as Record<string, z.ZodTypeAny>;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, field] of Object.entries(shape)) {
        const converted = convert(field as z.ZodTypeAny);
        if ((field as z.ZodTypeAny).description) {
          converted.description = (field as z.ZodTypeAny).description;
        }
        properties[key] = converted;
        if (
          !(field instanceof z.ZodOptional) &&
          !(field instanceof z.ZodDefault)
        ) {
          required.push(key);
        }
      }
      return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
      };
    }
    if (s instanceof z.ZodOptional) return convert(s.unwrap());
    if (s instanceof z.ZodDefault) return convert(s._def.innerType as z.ZodTypeAny);
    if (s instanceof z.ZodString) return { type: "string" };
    if (s instanceof z.ZodNumber) return { type: "number" };
    if (s instanceof z.ZodBoolean) return { type: "boolean" };
    if (s instanceof z.ZodArray) return { type: "array", items: convert(s.element) };
    if (s instanceof z.ZodEnum) return { type: "string", enum: s.options };
    if (s instanceof z.ZodRecord) return { type: "object" };
    if (s instanceof z.ZodUnion) {
      return { oneOf: (s.options as z.ZodTypeAny[]).map(convert) };
    }
    if (s instanceof z.ZodNever) return { not: {} };
    return { type: "string" };
  }
  const result = convert(schema);
  if (schema.description) result.description = schema.description;
  return result;
}

// ── MCP Server ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "postforme-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  const tool = toolMap.get(name);
  if (!tool) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: true, message: `Unknown tool: ${name}` }),
        },
      ],
    };
  }

  let config: PostForMeConfig;
  try {
    config = getConfig();
  } catch (e) {
    return { content: [{ type: "text", text: formatError(e) }] };
  }

  let parsedArgs: Record<string, unknown>;
  try {
    parsedArgs = tool.inputSchema.parse(rawArgs ?? {}) as Record<string, unknown>;
  } catch (e) {
    const detail = e instanceof z.ZodError ? e.flatten() : String(e);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: "Invalid arguments",
            details: detail,
          }),
        },
      ],
    };
  }

  const result = await tool.handler(parsedArgs, config);
  return { content: [{ type: "text", text: result }] };
});

// ── Start ──────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `Post for Me MCP Server v1.0.0 running — ${ALL_TOOLS.length} tools available`
  );
}

main().catch((err) => {
  console.error("Fatal error starting Post for Me MCP Server:", err);
  process.exit(1);
});
