import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

/**
 * MCP Server for Gallery API
 * Allows AI clients (like Claude Desktop) to manage images, browse resources, and use prompts.
 */

const API_BASE_URL = process.env.GALLERY_API_URL || 'http://localhost:3000/api/v1';

const server = new Server(
  {
    name: 'gallery-api-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'upload_image',
        description: 'Upload an image to the gallery',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Absolute path to image file' },
            title: { type: 'string', description: 'Optional title' },
            description: { type: 'string', description: 'Optional description' },
          },
          required: ['file_path'],
        },
      },
      {
        name: 'list_images',
        description: 'List all images in the gallery',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'search_images',
        description: 'Search images by title or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term' },
            limit: { type: 'number', description: 'Max results (default: 20)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'delete_image',
        description: 'Delete an image from the gallery',
        inputSchema: {
          type: 'object',
          properties: {
            image_id: { type: 'string', description: 'The ID of the image' },
          },
          required: ['image_id'],
        },
      },
    ],
  };
});

// Handle Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'images://catalog',
        name: 'Gallery Catalog',
        description: 'JSON list of all images and their metadata',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (uri === 'images://catalog') {
    const response = await axios.get(`${API_BASE_URL}/images`);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }
  throw new Error(`Resource not found: ${uri}`);
});

// Handle Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'curate_gallery',
        description: 'Guidance for curating your image collection',
      },
      {
        name: 'organize_by_theme',
        description: 'Suggestions for organizing images by visual theme',
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'curate_gallery') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'I want to curate my gallery. Please list all images, analyze their titles and descriptions, and suggest which duplicates or low-quality entries I should consider deleting.',
          },
        },
      ],
    };
  }

  if (name === 'organize_by_theme') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Analyze my gallery content and suggest a few thematic categories (e.g., Nature, Urban, Family) that I could use to better organize my descriptions.',
          },
        },
      ],
    };
  }

  throw new Error(`Prompt not found: ${name}`);
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'upload_image': {
        const { file_path, title, description } = args as any;
        if (!fs.existsSync(file_path)) throw new Error(`File not found: ${file_path}`);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(file_path));
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);

        const response = await axios.post(`${API_BASE_URL}/images`, formData, {
          headers: formData.getHeaders(),
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
        };
      }

      case 'list_images': {
        const response = await axios.get(`${API_BASE_URL}/images`);
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
        };
      }

      case 'search_images': {
        const { query, limit = 20 } = args as any;
        const response = await axios.get(`${API_BASE_URL}/images`, {
          params: { search: query, limit }
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
        };
      }

      case 'delete_image': {
        const { image_id } = args as any;
        await axios.delete(`${API_BASE_URL}/images/${image_id}`);
        return {
          content: [{ type: 'text', text: `Image ${image_id} deleted` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Gallery API MCP Server running on stdio\n');
}

main().catch(console.error);
