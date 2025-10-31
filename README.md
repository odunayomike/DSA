# DSA
Data Structure and Algorithm Examples

## Rocket.Chat WebSocket Test

A simple Node.js script to test Rocket.Chat WebSocket connections using the DDP (Distributed Data Protocol) protocol.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your credentials in `test-websocket.js`:
   - `TOKEN`: Your Rocket.Chat authentication token
   - `USER_ID`: Your Rocket.Chat user ID
   - WebSocket URL: Update if using a different server

### Usage

Run the test script:
```bash
npm start
```

Or directly:
```bash
node test-websocket.js
```

### How it Works

1. **Connect**: Establishes WebSocket connection to Rocket.Chat server
2. **DDP Handshake**: Sends DDP connect message with version support
3. **Login**: Authenticates using the resume token
4. **Subscribe**: Subscribes to the livechat queue stream
5. **Listen**: Monitors and logs queue updates

### Features

- Connects to Rocket.Chat WebSocket server
- Authenticates using resume token
- Subscribes to livechat queue updates
- Logs all incoming messages and queue changes
