# DSA
Data Structure and Algorithm Examples

## Rocket.Chat WebSocket Test

A Node.js script to test Rocket.Chat WebSocket connections and access livechat queue messages using the DDP (Distributed Data Protocol) protocol.

**Primary Goal:** Access and monitor livechat queue messages in real-time.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create configuration file:
```bash
cp config.example.js config.js
```

3. Edit `config.js` with your credentials:
   - `websocketUrl`: Your Rocket.Chat WebSocket URL (e.g., `wss://your-server.com/websocket`)
   - `token`: Your Rocket.Chat authentication token
   - `userId`: Your Rocket.Chat user ID
   - `retryAttempts`: Number of connection retry attempts (default: 3)
   - `retryDelay`: Delay between retries in milliseconds (default: 2000)

### Usage

**Option 1: Monitor livechat queue (Recommended)**
```bash
npm run monitor
```
This will:
1. Fetch existing queued messages via REST API
2. Connect WebSocket for real-time queue updates
3. Display both historical and new livechat inquiries

**Option 2: Test all methods**
```bash
npm start
```
This runs the comprehensive test that tries 18 different methods to access the queue.

**Direct execution:**
```bash
node livechat-monitor.js  # Production monitoring
node test-websocket.js     # Testing all methods
```

### How it Works

1. **Connect**: Establishes WebSocket connection to Rocket.Chat server
2. **DDP Handshake**: Sends DDP connect message with version support
3. **Login**: Authenticates using the resume token
4. **Subscribe**: Subscribes to the livechat queue stream
5. **Listen**: Monitors and logs queue updates

### Features

- Connects to Rocket.Chat WebSocket server with automatic retry logic
- Authenticates using resume token
- Tries multiple subscription methods automatically
- Detailed error messages with troubleshooting tips
- Connection retry with configurable attempts and delays
- Separates sensitive credentials in config file
- Logs all incoming messages and queue changes

### Troubleshooting

If you get `ENOTFOUND` or connection errors:
1. Verify the WebSocket URL in `config.js` is correct
2. Check if the server is accessible from your network
3. Try connecting to the Rocket.Chat web interface first
4. Test with a public demo server: `wss://demo.rocket.chat/websocket`

If subscriptions fail with `not-allowed`:
- Your user account may lack permissions for certain subscriptions
- The script automatically tries multiple subscription types
- Check your Rocket.Chat user roles and permissions
