module.exports = {
  // WebSocket URL for Rocket.Chat server
  // Examples:
  // - wss://demo.rocket.chat/websocket
  // - wss://your-server.com/websocket
  // - ws://localhost:3000/websocket (for local development)
  websocketUrl: 'wss://your-server.com/websocket',

  // Your Rocket.Chat authentication token
  // Get this from your Rocket.Chat account settings or login response
  token: 'YOUR_TOKEN_HERE',

  // Your Rocket.Chat user ID
  userId: 'YOUR_USER_ID_HERE',

  // Connection settings
  retryAttempts: 3,
  retryDelay: 2000, // milliseconds
  connectionTimeout: 10000 // milliseconds
};
