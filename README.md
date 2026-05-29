# @nerdsnipe-inc/postforme-mcp-server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the [Post for Me API](https://www.postforme.dev/) — giving any AI agent full access to schedule, publish, and manage social media posts across every supported platform.

## Features

- **21 tools** covering every Post for Me API endpoint
- Supports all 10 platforms: Bluesky, Facebook, Instagram, LinkedIn, Pinterest, Threads, TikTok, TikTok Business, X (Twitter), YouTube
- Full platform-specific and account-specific post configuration
- Media upload flow (signed URL → PUT → use in post)
- Social account OAuth auth URL generation
- Account feeds and analytics
- Webhook management
- Post previews

## Installation

```bash
npm install -g @nerdsnipe-inc/postforme-mcp-server
```

Or use directly with npx (no install needed):

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

## Configuration

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

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

### Cursor (`.cursor/mcp.json` in your project)

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

### Environment Variable

Get your API key from [https://app.postforme.dev/](https://app.postforme.dev/).

| Variable | Description |
|---|---|
| `POSTFORME_API_KEY` | Your Post for Me API key |

## Available Tools

### Media
| Tool | Description |
|---|---|
| `pfm_create_media_upload_url` | Request a signed upload URL for media (image/video) |

### Social Posts
| Tool | Description |
|---|---|
| `pfm_get_posts` | Get paginated posts with platform/status/account filters |
| `pfm_create_post` | Create and schedule a post across one or more accounts |
| `pfm_get_post` | Get a single post by ID |
| `pfm_update_post` | Update an existing post |
| `pfm_delete_post` | Delete a post |

### Social Post Results
| Tool | Description |
|---|---|
| `pfm_get_post_results` | Get paginated post results (success/failure, platform URLs) |
| `pfm_get_post_result` | Get a single post result by ID |

### Social Accounts
| Tool | Description |
|---|---|
| `pfm_get_social_accounts` | Get connected social accounts |
| `pfm_create_social_account` | Create/upsert a social account (bring-your-own tokens) |
| `pfm_get_social_account` | Get a single social account by ID |
| `pfm_update_social_account` | Update username or external_id |
| `pfm_create_social_account_auth_url` | Generate OAuth URL to connect a user's account |
| `pfm_disconnect_social_account` | Disconnect an account (removes tokens, keeps record) |

### Social Account Feeds
| Tool | Description |
|---|---|
| `pfm_get_account_feed` | Get all posts for an account (including non-API posts), optionally with metrics |

### Webhooks
| Tool | Description |
|---|---|
| `pfm_get_webhooks` | Get paginated webhooks |
| `pfm_create_webhook` | Create a webhook for event notifications |
| `pfm_get_webhook` | Get a single webhook by ID |
| `pfm_update_webhook` | Update a webhook's URL or event types |
| `pfm_delete_webhook` | Delete a webhook |

### Social Post Previews
| Tool | Description |
|---|---|
| `pfm_create_post_previews` | Preview what a post will look like per account (no publishing) |

## Quick Start Example

Here's the typical flow for creating a scheduled post:

1. **Get your social accounts** — `pfm_get_social_accounts`
2. **Upload media** (optional) — `pfm_create_media_upload_url`, then PUT file to the signed URL
3. **Create the post** — `pfm_create_post` with `social_accounts`, `caption`, `media`, and `scheduled_at`
4. **Check results** — `pfm_get_post_results` after the scheduled time

## Platform-Specific Configuration

Posts support three levels of content override (most specific wins):

1. **Default** — top-level `caption` and `media`
2. **Platform** — `platform_configurations.instagram`, `.facebook`, `.x`, etc.
3. **Account** — `account_configurations[].configuration` per `social_account_id`

## Links

- [Post for Me](https://www.postforme.dev/)
- [Post for Me API Docs](https://docs.postforme.dev/)
- [Post for Me Dashboard](https://app.postforme.dev/)
- [npm package](https://www.npmjs.com/package/@nerdsnipe-inc/postforme-mcp-server)

## License

MIT © [NerdSnipe Inc](https://nerdsnipe.cc)
