# Cursor MCP Setup - Simple! 🚀

## ✅ **Already Configured!**

Your MCP configuration is ready at:
**`.cursor/mcp.json`**

## 🎯 **How to Use in Cursor**

### 1. **Open Cursor in This Project**
```bash
cd /home/janakh/Documents/NEST/nestjs-gallery-api
cursor .
```

### 2. **Start Your API** (if not running)
```bash
npm run start:dev
```

### 3. **Ask Cursor to Use Your Gallery**

In Cursor's chat, try these commands:

#### **List All Images**
```
"Show me all images in my gallery using the MCP tools"
```

#### **Upload Images**
```
"Upload /home/janakh/Pictures/Screenshots/sea_of_cloud_maesot_2.png with title 'More Sea of Clouds' using the gallery MCP"
```

#### **Get Download URLs**
```
"Get a download link for the friendship bridge image using MCP"
```

#### **Delete Images**
```
"Delete the test images from my gallery using MCP"
```

## 🛠️ **Available MCP Tools in Cursor**

Cursor can now use these 5 tools:

1. **`upload_image`** - Upload images with title/description
2. **`list_images`** - Show all gallery images  
3. **`get_image`** - Get specific image details
4. **`get_download_url`** - Generate secure download links
5. **`delete_image`** - Remove images from gallery

## 🎉 **Ready to Use!**

1. **Open Cursor**: `cursor .`
2. **Start API**: `npm run start:dev` 
3. **Ask Cursor**: *"Show me all my gallery images using MCP"*

That's it! Much simpler than Claude Desktop setup. 🚀

## 📁 **File Structure**
```
nestjs-gallery-api/
├── .cursor/
│   └── mcp.json          ← MCP config (✅ Ready)
├── dist/mcp/
│   └── mcp-server.js     ← MCP server (✅ Built)
└── ...
```

## 🔧 **Troubleshooting**

### MCP Not Working?
1. **Check API is running**: `curl http://localhost:3000/api/v1/images`
2. **Restart Cursor** completely
3. **Verify config**: `cat .cursor/mcp.json`

### Upload Fails?
1. **Check file path exists**: `ls /home/janakh/Pictures/Screenshots/`
2. **Ensure API is running**: `npm run start:dev`

## 🎯 **Example Usage**

**You**: "Show me all my gallery images using MCP"

**Cursor**: *Uses the list_images MCP tool*
```
You have 11 images in your gallery:

1. Road to Bangkok - Tak Viewpoint (READY)
2. Sea of Clouds - Mae Sot Viewpoint (READY)  
3. Aerial View of Mae Ku Farmlands (READY)
4. Aerial View of Thailand-Myanmar Friendship Bridge (READY)
... and 7 more
```

**You**: "Upload another screenshot from my Screenshots folder"

**Cursor**: *Uses the upload_image MCP tool*
```
I'll upload sea_of_cloud_maesot_2.png with a descriptive title...
✅ Uploaded successfully! Image ID: cmg8...
```

**Simple and powerful!** 🚀
