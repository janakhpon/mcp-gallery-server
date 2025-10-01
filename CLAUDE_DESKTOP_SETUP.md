# Claude Desktop MCP Setup Guide

## ✅ **Already Configured!**

Your MCP configuration has been automatically installed to:
**`~/.config/claude/claude_desktop_config.json`**

## 🚀 **How to Use with Claude Desktop**

### 1. **Restart Claude Desktop**
- Close Claude Desktop completely
- Reopen Claude Desktop
- The MCP server will auto-start when Claude launches

### 2. **Ask Claude to Use Your Gallery**

Once Claude Desktop is running, you can ask it to:

#### **Upload Images**
```
"Upload /home/janakh/Pictures/Screenshots/sea_of_cloud_maesot_2.png with title 'More Sea of Clouds' and description 'Another beautiful view of the misty mountains'"
```

#### **List All Images**
```
"Show me all images in my gallery"
```

#### **Get Image Details**
```
"Get details for the image with ID cmg80937m00005yrh6ntf0rlp"
```

#### **Get Download URLs**
```
"Get a download link for the friendship bridge image"
```

#### **Delete Images**
```
"Delete the image with ID cmg80937m00005yrh6ntf0rlp"
```

### 3. **Example Conversation**

**You**: "Show me all my gallery images"

**Claude**: *Uses the list_images tool*
```
You have 11 images in your gallery:

1. **Road to Bangkok - Tak Viewpoint** (READY)
   - Description: Scenic viewpoint along the road from Tak to Bangkok
   - File: roadto_bangkok_tak_viewpoint.png
   - Size: 2.97 MB

2. **Sea of Clouds - Mae Sot Viewpoint** (READY)
   - Description: Breathtaking sea of clouds phenomenon
   - File: sea_of_cloud_maesot_1.png
   - Size: 933 KB

3. **Aerial View of Mae Ku Farmlands** (READY)
   - Description: Stunning bird's eye view of agricultural landscapes
   - File: maesot_ariealview_Maeku_farmlands.png
   - Size: 2.91 MB

... and 8 more images
```

**You**: "Upload another screenshot from my Screenshots folder"

**Claude**: *Uses the upload_image tool*
```
I can see you have many screenshots available. Which one would you like me to upload? I can see files like:
- sea_of_cloud_maesot_2.png
- sea_of_cloud_maesot_3.png
- maesot_viewpoint_1.png
- Screenshot From 2025-09-26 20-15-10.png

Just tell me the filename and I'll upload it with a descriptive title and description!
```

## 🔧 **Troubleshooting**

### MCP Server Not Appearing
1. **Check API is running**: `curl http://localhost:3000/health`
2. **Verify config file**: `cat ~/.config/claude/claude_desktop_config.json`
3. **Restart Claude Desktop completely**
4. **Check Claude Desktop logs** for MCP errors

### Upload Fails
1. **Ensure API is running**: `npm run start:dev`
2. **Check file path exists**: `ls /home/janakh/Pictures/Screenshots/`
3. **Verify permissions**: File should be readable

### Connection Issues
```bash
# Test MCP server manually
node /home/janakh/Documents/NEST/nestjs-gallery-api/dist/mcp/mcp-server.js

# Test API
curl http://localhost:3000/api/v1/images
```

## 📋 **Available MCP Tools**

Claude can use these 5 tools with your gallery:

1. **`upload_image`** - Upload images with title/description
2. **`list_images`** - Show all gallery images
3. **`get_image`** - Get specific image details
4. **`get_download_url`** - Generate secure download links
5. **`delete_image`** - Remove images from gallery

## 🎯 **Ready to Use!**

Your gallery is now fully integrated with Claude Desktop. Just restart Claude and start asking it to manage your images!

**Example first command**: *"Show me all my gallery images"*
