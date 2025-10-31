const WebSocket = require('ws');
const config = require('./config');

let ws = null;
let subscriptionAttempts = 0;
let connectionAttempts = 0;

function connect() {
  connectionAttempts++;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Connection attempt ${connectionAttempts}/${config.retryAttempts}`);
  console.log(`Connecting to: ${config.websocketUrl}`);
  console.log(`${'='.repeat(60)}\n`);

  ws = new WebSocket(config.websocketUrl);

  ws.on('open', function() {
    console.log('✓ WebSocket connected successfully');
    connectionAttempts = 0; // Reset on successful connection

    // Step 1: Connect to DDP
    console.log('Sending DDP connect message...');
    ws.send(JSON.stringify({
      msg: 'connect',
      version: '1',
      support: ['1']
    }));
  });

  ws.on('message', function(data) {
    const response = JSON.parse(data);
    console.log('Received:', response);

    if (response.msg === 'connected') {
      console.log('\n✓ DDP Connected (Session:', response.session + ')');
      console.log('Authenticating with token...');

      // Step 2: Login with token
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'login',
        id: '1',
        params: [{
          resume: config.token
        }]
      }));
    }

    if (response.msg === 'result' && response.id === '1') {
      if (response.result && response.result.id) {
        console.log('\n✓ Logged in successfully');
        console.log('User ID:', response.result.id);
        console.log('Token type:', response.result.type);

        // Try different subscription approaches
        trySubscriptions();
      } else {
        console.error('\n✗ Login failed:', response.error || 'Unknown error');
      }
    }

    // Handle subscription errors
    if (response.msg === 'nosub') {
      console.error('\n✗ Subscription failed:', response.id);
      console.error('Error:', response.error.message);
      console.error('Reason:', response.error.error);

      // Try next subscription method
      trySubscriptions();
    }

    // Handle subscription success
    if (response.msg === 'ready') {
      console.log('\n✓ Subscription successful:', response.subs);
    }

    // Handle updates
    if (response.msg === 'changed') {
      console.log('\n--- Update received ---');
      console.log('Collection:', response.collection);
      console.log('Data:', response);
    }
  });

  ws.on('error', function(error) {
    console.error('\n✗ WebSocket error:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.error('\nPossible causes:');
      console.error('1. The hostname "' + error.hostname + '" cannot be resolved');
      console.error('2. Check if the server is online');
      console.error('3. Verify the URL in config.js is correct');
      console.error('4. Check your internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nThe server refused the connection.');
      console.error('The server may be down or blocking connections.');
    }
  });

  ws.on('close', function() {
    console.log('\n✗ WebSocket connection closed');

    // Retry if we haven't exceeded max attempts
    if (connectionAttempts < config.retryAttempts) {
      console.log(`Retrying in ${config.retryDelay / 1000} seconds...`);
      setTimeout(connect, config.retryDelay);
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('Maximum connection attempts reached. Giving up.');
      console.log('='.repeat(60));
      console.log('\nTroubleshooting steps:');
      console.log('1. Verify the WebSocket URL in config.js');
      console.log('2. Try connecting to the Rocket.Chat web interface');
      console.log('3. Check if the server is accessible from your network');
      console.log('4. Try a public Rocket.Chat demo server:');
      console.log('   websocketUrl: "wss://demo.rocket.chat/websocket"');
    }
  });
}

function trySubscriptions() {
  subscriptionAttempts++;

  console.log(`\nTrying subscription method ${subscriptionAttempts}...`);

  switch(subscriptionAttempts) {
    case 1:
      // Original: Try livechat queue
      console.log('Attempting: stream-livechat-room (queue)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-1',
        name: 'stream-livechat-room',
        params: ['queue', false]
      }));
      break;

    case 2:
      // Try user's notifications
      console.log('Attempting: stream-notify-user (notifications)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-2',
        name: 'stream-notify-user',
        params: [`${config.userId}/notification`, false]
      }));
      break;

    case 3:
      // Try user's rooms
      console.log('Attempting: stream-notify-user (rooms-changed)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-3',
        name: 'stream-notify-user',
        params: [`${config.userId}/rooms-changed`, false]
      }));
      break;

    case 4:
      // Try room messages subscription
      console.log('Attempting: stream-room-messages');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-4',
        name: 'stream-room-messages',
        params: ['__my_messages__', false]
      }));
      break;

    case 5:
      // Try livechat inquiry
      console.log('Attempting: livechat:inquiry');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-5',
        name: 'livechat:inquiry',
        params: []
      }));
      break;

    default:
      console.log('\nAll subscription methods tried.');
      console.log('\nTo find available subscriptions, you may need to:');
      console.log('1. Check your user permissions/roles in Rocket.Chat');
      console.log('2. Review Rocket.Chat API documentation for your version');
      console.log('3. Check server logs for available subscription names');
      console.log('\nConnection will remain open to receive any updates...');
  }
}

// Start the connection
connect();
