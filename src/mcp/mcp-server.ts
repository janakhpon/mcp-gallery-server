import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

/**
 * MCP Server for Gallery API
 * Allows AI clients (like Claude Desktop) to upload and manage images
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
    },
  },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'upload_image',
        description: 'Upload an image to the gallery with optional title and description',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Absolute path to the image file to upload',
            },
            title: {
              type: 'string',
              description: 'Optional title for the image',
            },
            description: {
              type: 'string',
              description: 'Optional description for the image',
            },
          },
          required: ['file_path'],
        },
      },
      {
        name: 'list_images',
        description: 'List all images in the gallery',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_image',
        description: 'Get details of a specific image by ID',
        inputSchema: {
          type: 'object',
          properties: {
            image_id: {
              type: 'string',
              description: 'The ID of the image to retrieve',
            },
          },
          required: ['image_id'],
        },
      },
      {
        name: 'get_download_url',
        description: 'Get a presigned download URL for an image',
        inputSchema: {
          type: 'object',
          properties: {
            image_id: {
              type: 'string',
              description: 'The ID of the image',
            },
          },
          required: ['image_id'],
        },
      },
      {
        name: 'delete_image',
        description: 'Delete an image from the gallery',
        inputSchema: {
          type: 'object',
          properties: {
            image_id: {
              type: 'string',
              description: 'The ID of the image to delete',
            },
          },
          required: ['image_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'upload_image': {
        const { file_path, title, description } = args as {
          file_path: string;
          title?: string;
          description?: string;
        };

        if (!fs.existsSync(file_path)) {
          throw new Error(`File not found: ${file_path}`);
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(file_path));
        if (title) formData.append('title', title);
        if (description) formData.append('description', description);

        const response = await axios.post(`${API_BASE_URL}/images`, formData, {
          headers: formData.getHeaders(),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_images': {
        const response = await axios.get(`${API_BASE_URL}/images`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_image': {
        const { image_id } = args as { image_id: string };
        const response = await axios.get(`${API_BASE_URL}/images/${image_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_download_url': {
        const { image_id } = args as { image_id: string };
        const response = await axios.get(`${API_BASE_URL}/images/${image_id}/download`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'delete_image': {
        const { image_id } = args as { image_id: string };
        const response = await axios.delete(`${API_BASE_URL}/images/${image_id}`);
        return {
          content: [
            {
              type: 'text',
              text: `Image ${image_id} deleted successfully`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gallery API MCP Server running on stdio');
}

main().catch(console.error);

