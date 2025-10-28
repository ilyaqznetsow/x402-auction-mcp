# MCP Server Compatibility Guide

This document lists all environments where x402 Auction MCP Server can be used.

## ✅ Tested & Supported

### 1. **Claude Desktop** (Official MCP Client)
- **Platform**: macOS, Windows
- **Status**: ✅ Fully Supported
- **Config**: `claude_desktop_config.json`
- **Documentation**: [Official MCP Docs](https://modelcontextprotocol.io/)

### 2. **Cursor IDE** 
- **Platform**: macOS, Windows, Linux
- **Status**: ✅ Supported (Built-in MCP support)
- **Config**: `mcp_config.json` or Settings UI
- **How to use**: Settings → MCP Servers

### 3. **Cline (VS Code Extension)**
- **Platform**: Any OS with VS Code
- **Status**: ✅ Supported
- **Config**: VS Code settings or `.vscode/settings.json`
- **Extension**: [Cline on VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)

### 4. **Continue.dev**
- **Platform**: VS Code, JetBrains IDEs
- **Status**: ✅ Supported (via MCP integration)
- **Config**: Continue config file
- **Website**: [continue.dev](https://continue.dev/)

### 5. **Zed Editor**
- **Platform**: macOS, Linux
- **Status**: ✅ Supported (Native MCP support)
- **Config**: Zed settings
- **Website**: [zed.dev](https://zed.dev/)

## 🔄 Programmatic Usage

### Node.js Applications
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'x402-auction-mcp'
});

const client = new Client({ name: 'my-app', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
```

### Python Applications
```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="x402-auction-mcp",
    args=[]
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        tools = await session.list_tools()
```

### Shell/CLI Usage
```bash
# Direct stdio communication
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | x402-auction-mcp
```

## 📋 Configuration Formats

### Standard MCP Configuration
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    }
  }
}
```

### With Environment Variables
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp",
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### Local Installation
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"]
    }
  }
}
```

### Using npx (No Installation)
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "npx",
      "args": ["x402-auction-mcp"]
    }
  }
}
```

## 🌐 Future Compatibility

The MCP protocol is standardized, so this server should work with:
- Any future MCP-compatible AI client
- Any IDE that adds MCP support
- Any custom application using MCP SDK

## 🔧 Integration Examples

### Example 1: Multi-Agent System
Use multiple MCP servers together:
```json
{
  "mcpServers": {
    "x402-auction": {
      "command": "x402-auction-mcp"
    },
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/path/to/workspace"]
    },
    "github": {
      "command": "mcp-server-github"
    }
  }
}
```

### Example 2: Custom AI Agent
Build your own agent using MCP:
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

class AuctionAgent {
  constructor() {
    this.mcpClient = new Client(/* ... */);
  }
  
  async checkAndBid() {
    // Use MCP tools to interact with auction
    const info = await this.mcpClient.callTool({
      name: 'get_auction_info',
      arguments: {}
    });
    
    if (info.current_price < 0.6) {
      await this.mcpClient.callTool({
        name: 'create_auction_bid',
        arguments: {
          ton_amount: 10,
          wallet: this.wallet
        }
      });
    }
  }
}
```

## 📖 Resources

- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **MCP SDK**: [GitHub](https://github.com/modelcontextprotocol/sdk)
- **Example Servers**: [MCP Servers Repo](https://github.com/modelcontextprotocol/servers)

## 🆘 Troubleshooting

### Server Not Showing Up
1. Check the config file path is correct
2. Verify the command is in PATH (for global installs)
3. Try using absolute path to `build/index.js`
4. Restart the application completely

### Permission Errors
```bash
chmod +x build/index.js
```

### Module Not Found
```bash
npm install -g x402-auction-mcp
# or
cd /path/to/x402-auction-mcp && npm install
```

---

**Bottom line**: This MCP server works anywhere that supports the Model Context Protocol!

