# MCP (Model Context Protocol) Integration

## What is MCP?

MCP allows AI assistants (like Claude Desktop) to interact with your API programmatically. Users can ask AI to upload, list, and manage images directly!

## Setup

### 1. Build the MCP Server

```bash
npm run build
```

### 2. Configure Claude Desktop

**✅ Already configured!** The config file has been automatically installed to:
- **Linux**: `~/.config/claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

The configuration includes:
```json
{
  "mcpServers": {
    "gallery-api": {
      "command": "node",
      "args": [
        "/home/janakh/Documents/NEST/nestjs-gallery-api/dist/mcp/mcp-server.js"
      ],
      "env": {
        "GALLERY_API_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

### 3. Start Your API

```bash
# Make sure API is running
npm run start:dev
```

### 4. Restart Claude Desktop

The MCP server will auto-start when Claude Desktop launches.

## Available Tools

AI clients can now use these tools:

### 1. **upload_image**
```
Upload an image to the gallery

Parameters:
- file_path (required): Absolute path to image file
- title (optional): Image title
- description (optional): Image description

Example:
"Upload the image at /Users/me/Desktop/photo.jpg with title 'Sunset'"
```

### 2. **list_images**
```
List all images in the gallery

Example:
"Show me all images in the gallery"
```

### 3. **get_image**
```
Get details of a specific image

Parameters:
- image_id (required): The image ID

Example:
"Get details for image abc123"
```

### 4. **get_download_url**
```
Get a presigned download URL for an image

Parameters:
- image_id (required): The image ID

Example:
"Get download URL for image abc123"
```

### 5. **delete_image**
```
Delete an image from the gallery

Parameters:
- image_id (required): The image ID

Example:
"Delete image abc123"
```

## Example Usage in Claude Desktop

### Upload Image
```
User: "Upload /Users/me/photos/vacation.jpg with title 'Beach Vacation' and description 'Summer 2025'"

Claude: *Uses upload_image tool*
Result: Image uploaded successfully with ID cmg7abc123...
```

### List & Manage
```
User: "Show me all my images"

Claude: *Uses list_images tool*
Result: You have 5 images:
1. Beach Vacation (READY)
2. Sunset (PROCESSING)
...

User: "Get a download link for the beach photo"

Claude: *Uses get_download_url tool*
Result: Here's your download link (valid for 1 hour):
http://localhost:3000/...?X-Amz-Signature=...
```

## Testing MCP Server

```bash
# Run standalone (for testing)
npm run build
npm run mcp

# It will wait for MCP client connections via stdio
```

## Troubleshooting

### MCP Server not appearing in Claude Desktop

1. Check config file path is correct
2. Use absolute paths (not ~/ or relative)
3. Restart Claude Desktop completely
4. Check Claude Desktop logs

### Upload fails

1. Ensure API is running: `npm run start:dev`
2. Verify `GALLERY_API_URL` in config
3. Check file path is absolute and exists

### Connection issues

```bash
# Test API manually
curl http://localhost:3000/health

# Check MCP server builds
npm run build
ls dist/mcp/mcp-server.js
```

## Security Note

MCP server runs with **your user permissions** and can access any files on your system that you can access. Only configure it in trusted AI clients like Claude Desktop.

## Advanced: Custom MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/mcp/mcp-server.js'],
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0',
}, {
  capabilities: {},
});

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools);

// Call tool
const result = await client.callTool({
  name: 'list_images',
  arguments: {},
});
console.log(result);
```


