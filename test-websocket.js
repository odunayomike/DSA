const WebSocket = require('ws');

const ws = new WebSocket('wss://ws1.keosapp.org/websocket');

const TOKEN = 'UNdZgL-67FRccTExF-zko_oZkvlzZJy5tdHj8v1fnlb';
const USER_ID = 'CMAP5jftT8ELWEnHt';

let subscriptionAttempts = 0;

ws.on('open', function() {
  console.log('Connected to Rocket.Chat');

  // Step 1: Connect to DDP
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
    console.log('DDP Connected, logging in...');

    // Step 2: Login with token
    ws.send(JSON.stringify({
      msg: 'method',
      method: 'login',
      id: '1',
      params: [{
        resume: TOKEN
      }]
    }));
  }

  if (response.msg === 'result' && response.id === '1') {
    console.log('Logged in successfully');
    console.log('User ID:', response.result.id);

    // Try different subscription approaches
    trySubscriptions();
  }

  // Handle subscription errors
  if (response.msg === 'nosub') {
    console.error('\nSubscription failed:', response.id);
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
        params: [`${USER_ID}/notification`, false]
      }));
      break;

    case 3:
      // Try user's rooms
      console.log('Attempting: stream-notify-user (rooms-changed)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-3',
        name: 'stream-notify-user',
        params: [`${USER_ID}/rooms-changed`, false]
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

ws.on('error', function(error) {
  console.error('WebSocket error:', error);
});

ws.on('close', function() {
  console.log('\nWebSocket connection closed');
});
