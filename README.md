# Post for Me MCP Server

> Give any AI agent — Claude, Cursor, Windsurf, or any MCP-compatible client — full control over your social media through natural language.

[![npm version](https://img.shields.io/npm/v/@nerdsnipe-inc/postforme-mcp-server)](https://www.npmjs.com/package/@nerdsnipe-inc/postforme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@nerdsnipe-inc/postforme-mcp-server)](https://www.npmjs.com/package/@nerdsnipe-inc/postforme-mcp-server)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/protocol-MCP-purple)](https://modelcontextprotocol.io)
[![Post for Me](https://img.shields.io/badge/API-Post%20for%20Me-ff6b35)](https://www.postforme.dev/)

---

## What is this?

This is a **[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server** that connects your AI tools directly to the [Post for Me](https://www.postforme.dev/) API — a social media scheduling and publishing platform supporting 10 platforms out of the box.

Once installed, your AI can manage social media end-to-end:

> *"Schedule a post to go out on Instagram, Facebook, and X tomorrow at 9am"*
> *"Show me all posts that failed to publish in the last week and tell me why"*
> *"Create a YouTube video post with a custom title, tags, and set it to unlisted"*
> *"Get the engagement metrics for every post we made this month on TikTok"*
> *"Set up a webhook so I'm notified whenever a post goes live"*

**21 tools** covering the full Post for Me API:

| Category        | Tools                                                                               |
|-----------------|-------------------------------------------------------------------------------------|
| Media           | Upload signed URLs for images and videos                                            |
| Social Posts    | Create, schedule, update, delete posts across all platforms                         |
| Post Results    | Fetch publish outcomes, errors, and platform URLs                                   |
| Social Accounts | Connect, manage, and disconnect platform accounts                                   |
| Account Feeds   | Retrieve every post from a connected account (including non-API posts) with metrics |
| Webhooks        | Subscribe to post and account events                                                |
| Post Previews   | Preview exactly what a post will look like before publishing                        |

**Supported platforms:** Bluesky · Facebook · Instagram · LinkedIn · Pinterest · Threads · TikTok · TikTok Business · X (Twitter) · YouTube

---

## Prerequisites

- **Node.js 18 or later** — [download here](https://nodejs.org/en/download)
- **A Post for Me account** — [sign up free](https://app.postforme.dev/)
- **A Post for Me API key** — takes 30 seconds to get (see below)

### How to get your API key

1. Log in to your [Post for Me dashboard](https://app.postforme.dev/)
2. Navigate to **Settings → API**
3. Copy your API key

> ⚠️ Keep your API key secret. Set it in your MCP client config — never commit it to source control.

---

## Installation

No build step needed. Pass your API key in your AI client config and the server runs on demand via `npx`.

### Quick install via package manager

Use `npx`, `pnpm dlx`, or `bunx` to run the server without installing anything globally:

```bash
# npm / npx  (no install required)
npx @nerdsnipe-inc/postforme-mcp-server

# pnpm
pnpm dlx @nerdsnipe-inc/postforme-mcp-server

# bun
bunx @nerdsnipe-inc/postforme-mcp-server
```

Or install globally:

```bash
npm install -g @nerdsnipe-inc/postforme-mcp-server
# then run:
postforme-mcp-server
```

---

## Connecting to AI Clients

### Claude Desktop

Open (or create) your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "postforme": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/postforme-mcp-server"],
      "env": {
        "POSTFORME_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. You should see a hammer icon (🔨) in the chat input — that means MCP tools are active.

---

### Claude Code (CLI)

```bash
claude mcp add postforme npx -- -y @nerdsnipe-inc/postforme-mcp-server \
  -e POSTFORME_API_KEY=your_api_key_here
```

Or add it manually to `~/.claude/mcp_servers.json` (or your project's `.mcp.json`):

```json
{
  "mcpServers": {
    "postforme": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/postforme-mcp-server"],
      "env": {
        "POSTFORME_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

> **Project-scoped tip:** Add a `.mcp.json` in your project root so everyone on the team picks it up automatically. Add `.mcp.json` to `.gitignore` so your API key isn't committed.

---

### Cursor

1. Open Cursor Settings → **MCP** (or press `Cmd+Shift+P` → "Open MCP Settings")
2. Click **Add Server** and fill in:

```json
{
  "name": "postforme",
  "command": "npx",
  "args": ["-y", "@nerdsnipe-inc/postforme-mcp-server"],
  "env": {
    "POSTFORME_API_KEY": "your_api_key_here"
  }
}
```

3. Save and restart Cursor.

---

### Windsurf

Open `~/.codeium/windsurf/mcp_config.json` and add:

```json
{
  "mcpServers": {
    "postforme": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/postforme-mcp-server"],
      "env": {
        "POSTFORME_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

### Any other MCP-compatible client

This server uses **stdio transport** — the standard for local MCP servers. Your client needs:

- **Command**: `npx`
- **Args**: `["-y", "@nerdsnipe-inc/postforme-mcp-server"]`
- **Env**: `POSTFORME_API_KEY`

Refer to your client's MCP documentation for exact config syntax.

---

## All 21 Tools — Full Reference

### Media

Use media tools when you need to attach images or videos that aren't already on a public URL. The typical flow is: **create upload URL → PUT file to signed URL → use `media_url` in your post**.

| Tool | Description |
|---|---|
| `pfm_create_media_upload_url` | Request a signed upload URL for an image or video. Returns `upload_url` (PUT your file there) and `media_url` (use when creating a post). Media is deleted automatically after 24h if unused, or when the post is published. |

---

### Social Posts

Posts support three levels of content override — the most specific wins:
1. **Default** — top-level `caption` and `media` apply to all platforms
2. **Platform** — `platform_configurations.instagram`, `.x`, `.youtube`, etc. override defaults per platform
3. **Account** — `account_configurations[].configuration` overrides per specific account

| Tool | Description |
|---|---|
| `pfm_get_posts` | Get a paginated list of social posts. Filter by platform, status (`draft`, `scheduled`, `processing`, `processed`), external ID, or social account ID. All filters use OR logic. |
| `pfm_create_post` | Create and schedule (or publish immediately) a post across one or more accounts. Omit `scheduled_at` to post instantly. Supports full per-platform and per-account configuration. |
| `pfm_get_post` | Get a single post by ID. |
| `pfm_update_post` | Replace an existing post's full definition. |
| `pfm_delete_post` | Delete a post. |

---

### Social Post Results

Post results record the outcome of publishing — whether each platform publish succeeded or failed, plus the live URL.

| Tool | Description |
|---|---|
| `pfm_get_post_results` | Get a paginated list of post results. Filter by post ID, platform, or social account ID. |
| `pfm_get_post_result` | Get a single post result by ID. Includes `success`, error details, `platform_data.url`, and media. |

---

### Social Accounts

Social accounts are the platform-specific identities used for publishing. Each has a unique `id` (e.g. `spc_xxx`) that you reference when creating posts.

| Tool | Description |
|---|---|
| `pfm_get_social_accounts` | Get connected social accounts. Filter by platform, username, external ID, account ID, or status (`connected` / `disconnected`). |
| `pfm_create_social_account` | Create or upsert a social account using your own OAuth tokens (bring-your-own auth flow). Matches on platform + user_id. |
| `pfm_get_social_account` | Get a single social account by ID. |
| `pfm_update_social_account` | Update a social account's username or external ID. |
| `pfm_create_social_account_auth_url` | Generate an OAuth URL to connect a user's social platform account. Redirect the user to this URL. Include `permissions: ['feeds']` if you want to access analytics later. |
| `pfm_disconnect_social_account` | Disconnect an account — removes all auth tokens and marks it as disconnected. The account record is kept and can be reconnected. |

---

### Social Account Feeds

The account feed returns every post made under a connected account — including posts **not** made through Post for Me. Requires the account to have been connected with the **`feeds` permission**.

| Tool | Description |
|---|---|
| `pfm_get_account_feed` | Get all posts for a connected account, with optional `expand=['metrics']` to include engagement data (views, likes, follows, etc.). Supports cursor-based pagination. |

**Supported platforms and notes:**
- **Instagram** — metrics may take up to 48 hours to appear
- **Facebook** — feeds with `expand=metrics` are capped at 10 results by default
- **TikTok** — consumer API exposes limited analytics; use TikTok Business for full metrics
- **TikTok Business** — full analytics available
- **YouTube**, **Threads**, **X (Twitter)**, **Pinterest** — fully supported
- **Bluesky** — views/impressions not available via their API
- **LinkedIn** — metrics only available for company pages

---

### Webhooks

Webhooks let you subscribe to Post for Me events. When an event fires, Post for Me sends a POST to your URL with:

```json
{ "event_type": "social.post.result.created", "data": { ... } }
```

Verify requests using the `Post-For-Me-Webhook-Secret` header returned when you create a webhook. Failed deliveries are retried with exponential backoff ~8 times over ~1 day.

| Tool | Description |
|---|---|
| `pfm_get_webhooks` | Get a paginated list of webhooks. Filter by URL, event type, or ID. |
| `pfm_create_webhook` | Create a webhook. Available events: `social.post.created`, `social.post.updated`, `social.post.deleted`, `social.post.result.created`, `social.account.created`, `social.account.updated`. Returns a `secret` for request verification — store it securely. |
| `pfm_get_webhook` | Get a single webhook by ID. |
| `pfm_update_webhook` | Update a webhook's URL and/or subscribed event types. |
| `pfm_delete_webhook` | Delete a webhook. |

---

### Social Post Previews

Generate a visual preview of exactly what a post will look like for each account before publishing. No real accounts needed — you can use placeholder IDs for accounts that aren't connected yet.

| Tool | Description |
|---|---|
| `pfm_create_post_previews` | Preview a post per account. Returns resolved caption, media, platform, and configuration for each specified account. |

---

## Example Prompts

Here are things you can say to your AI once connected:

```
"Schedule a post to go out tomorrow at 9am on Instagram and Facebook with the caption 'Big announcement coming!' "

"Show me all posts that failed to publish in the last 7 days — include the error reason"

"Get the engagement metrics for every TikTok post we made this month"

"Create a YouTube video post, set the title to 'Q2 Product Demo', make it unlisted, and tag it as made for professionals"

"Post immediately to our X and Threads accounts: 'We just shipped something big. Stay tuned.' "

"What social accounts do we have connected? Show me the platform, username, and connection status"

"Disconnect the Instagram account with ID spc_abc and show me the confirmation"

"Set up a webhook at https://my-site.com/webhooks/postforme that fires whenever a post result comes in"

"Generate a preview of this caption across our Facebook and Instagram accounts before I schedule it"

"Upload this image URL as a media asset and give me the media_url to use in a post"

"Check the status of post sp_xyz — did it publish successfully on all platforms?"

"List all scheduled posts going out this week, sorted by platform"

"Get the full activity feed for our LinkedIn account and show me the top 5 posts by engagement"

"Create a Pinterest post with board ID brd_123 and a link back to our product page"

"Schedule a TikTok post as a draft so I can finish it in the app later"
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `POSTFORME_API_KEY` | ✅ Yes | Your Post for Me API key — get it from [app.postforme.dev](https://app.postforme.dev/) |

That's it — just one variable. Social account IDs, post IDs, and webhook IDs are passed as parameters when you call the relevant tools.

---

## Platform-Specific Configuration Reference

When creating posts, you can pass `platform_configurations` to override caption, media, or platform-specific settings for each platform:

### Instagram
`placement` (`reels` / `stories` / `timeline`), `collaborators`, `share_to_feed`, `location`, `trial_reel_type` (`manual` / `performance`), `audio_name`

### Facebook
`placement` (`reels` / `stories` / `timeline`), `location`, `collaborators`, `set_caption_for_each_image`

### X (Twitter)
`poll` (duration, options, reply_settings), `community_id`, `quote_tweet_id`, `reply_settings`

### YouTube
`title`, `description`, `tags`, `category_id`, `privacy_status` (`public` / `private` / `unlisted`), `embeddable`, `license`, `made_for_kids`, `contains_synthetic_media`, `publish_at`, `recording_date`, `localizations`

### TikTok / TikTok Business
`privacy_status`, `allow_comment`, `allow_duet`, `allow_stitch`, `disclose_your_brand`, `disclose_branded_content`, `is_ai_generated`, `is_draft`, `auto_add_music`

### Pinterest
`title`, `board_ids`, `link`

### Threads
`placement` (`reels` / `timeline`)

### LinkedIn, Bluesky
Caption and media overrides only.

---

## Running from source (contributors)

```bash
git clone https://github.com/Nerdsnipe-Inc/postforme-mcp-server.git
cd postforme-mcp-server
npm install
```

Point your MCP client at the source via `tsx`:

```json
{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/postforme-mcp-server/src/index.ts"]
}
```

Or build for production:

```bash
npm run build
node dist/index.js
```

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode (no build step needed)
npm run dev

# Type-check without building
npm run typecheck

# Build for production
npm run build

# Watch mode (rebuilds on file changes)
npm run build:watch

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
postforme-mcp-server/
├── src/
│   ├── index.ts                    # MCP server entry point — registers all tools
│   ├── client.ts                   # HTTP client (auth, URL builder, error handling)
│   └── tools/
│       ├── media.ts                #  1 media upload tool
│       ├── social_posts.ts         #  5 post CRUD tools
│       ├── social_post_results.ts  #  2 post result tools
│       ├── social_accounts.ts      #  6 social account tools
│       ├── social_account_feeds.ts #  1 account feed tool
│       ├── webhooks.ts             #  5 webhook tools
│       └── social_post_previews.ts #  1 post preview tool
├── tests/
│   ├── helpers.ts                  # Shared mocks and test utilities
│   ├── client.test.ts              # Client and URL builder tests
│   ├── server.test.ts              # Tool registry invariant tests
│   └── tools.test.ts               # Handler tests for all 21 tools
├── dist/                           # Compiled output (generated by npm run build)
├── .env.example                    # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

### Adding a new tool

1. Find the relevant module in `src/tools/` (or create a new one)
2. Add an entry following the existing pattern:

```typescript
{
  name: "pfm_your_tool_name",
  description: "What this tool does and when to use it",
  inputSchema: z.object({
    id: z.string().describe("The resource ID"),
  }),
  handler: async (args: Record<string, unknown>, config: PostForMeConfig) => {
    const { id } = args as { id: string };
    try {
      const result = await pfmRequest("GET", `/v1/your-endpoint/${id}`, {
        apiKey: config.apiKey,
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return formatError(e);
    }
  },
}
```

3. Import and spread it into `ALL_TOOLS` in `src/index.ts`
4. Add handler tests in `tests/tools.test.ts`
5. Run `npm test` to verify everything passes
6. Submit a PR!

---

## Troubleshooting

**The server isn't showing up in my AI client**
- Make sure Node.js 18+ is installed: `node --version`
- Try running `npx @nerdsnipe-inc/postforme-mcp-server` directly in a terminal to see any errors
- Restart your AI client after changing MCP config

**Getting "POSTFORME_API_KEY is not set" errors**
- Verify the `env` block in your MCP client config includes `POSTFORME_API_KEY`
- Or create a `.env` file in your working directory with `POSTFORME_API_KEY=your_key`

**Getting 401 Unauthorized**
- Double-check your API key in the [Post for Me dashboard](https://app.postforme.dev/)
- Make sure there are no extra spaces or line breaks in the key

**Post published on some platforms but not others**
- Use `pfm_get_post_results` filtered by the post ID to see per-platform outcomes
- Each result includes an `error` field explaining what went wrong on that platform

**Account feed returns no data / 404**
- The account must have been connected with the `feeds` permission
- Use `pfm_create_social_account_auth_url` with `permissions: ['posts', 'feeds']` to reconnect it

**Media upload fails**
- The signed `upload_url` from `pfm_create_media_upload_url` is short-lived — use it immediately
- PUT the file directly to the signed URL, then use the returned `media_url` in your post

---

## Contributing

Pull requests are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-new-tool`)
3. Add your changes and write tests (`npm test` must pass)
4. Commit and push, then open a PR

Keep tool names prefixed with `pfm_` and handler args typed as `Record<string, unknown>` with internal casts.

---

## License

MIT © [Small Business AI Specialist](https://nerdsnipe.cc)

---

## Related

- [Post for Me](https://www.postforme.dev/?ref=NerdSnipeInc) — the social media scheduling and publishing platform behind the API
- [Post for Me API Docs](https://docs.postforme.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [GoHighLevel MCP Server](https://www.npmjs.com/package/@nerdsnipe-inc/ghl-mcp-server) — our MCP server for GHL
