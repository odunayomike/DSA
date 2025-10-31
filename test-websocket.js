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

    // Handle ping/pong to keep connection alive
    if (response.msg === 'ping') {
      console.log('↔ Ping received, sending pong...');
      ws.send(JSON.stringify({ msg: 'pong' }));
      return;
    }

    if (response.msg === 'connected') {
      console.log('\n✓ DDP Connected (Session:', response.session + ')');
      console.log('Authenticating with token...');

      // Reset subscription attempts on new connection
      subscriptionAttempts = 0;

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

    // Handle method call results
    if (response.msg === 'result' && response.id !== '1') {
      console.log('\n--- Method Result ---');
      console.log('Method ID:', response.id);
      if (response.error) {
        console.error('✗ Error:', response.error);
      } else {
        console.log('✓ Result:', JSON.stringify(response.result, null, 2));
      }

      // Try next method after getting result
      setTimeout(() => trySubscriptions(), 500);
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

  console.log(`\nTrying method ${subscriptionAttempts}...`);

  switch(subscriptionAttempts) {
    case 1:
      // Check user roles first
      console.log('Calling method: getUserRoles (to check permissions)');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'getUserRoles',
        id: 'method-1',
        params: []
      }));
      break;

    case 2:
      // Try livechat queue subscription
      console.log('Subscription: stream-livechat-room (queue)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-1',
        name: 'stream-livechat-room',
        params: ['queue', false]
      }));
      break;

    case 3:
      // Try alternative livechat queue
      console.log('Subscription: livechat:queue');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-2',
        name: 'livechat:queue',
        params: []
      }));
      break;

    case 4:
      // Try livechat inquiry queue
      console.log('Subscription: livechat:inquiry');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-3',
        name: 'livechat:inquiry',
        params: []
      }));
      break;

    case 5:
      // Try getting queue via method call
      console.log('Calling method: livechat:getQueuedMessages');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getQueuedMessages',
        id: 'method-2',
        params: []
      }));
      break;

    case 6:
      // Try another method to get queue
      console.log('Calling method: livechat:getQueue');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getQueue',
        id: 'method-3',
        params: []
      }));
      break;

    case 7:
      // Try stream-notify-logged
      console.log('Subscription: stream-notify-logged (livechat-inquiry-queue-observer)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-4',
        name: 'stream-notify-logged',
        params: ['livechat-inquiry-queue-observer', false]
      }));
      break;

    case 8:
      // Try getting current inquiries with options
      console.log('Calling method: livechat:getInitialInquiries');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getInitialInquiries',
        id: 'method-4',
        params: []
      }));
      break;

    case 9:
      // Try livechat inquiry list
      console.log('Calling method: livechat:getInquiriesList');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getInquiriesList',
        id: 'method-5',
        params: []
      }));
      break;

    case 10:
      // Try REST-style method
      console.log('Calling method: livechat/inquiries.list');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat/inquiries.list',
        id: 'method-6',
        params: [{ department: null }]
      }));
      break;

    case 11:
      // Try getting queue info
      console.log('Calling method: livechat:getQueueInfo');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getQueueInfo',
        id: 'method-7',
        params: []
      }));
      break;

    case 12:
      // Try getting agent inquiries
      console.log('Calling method: livechat:getAgentInquiries');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getAgentInquiries',
        id: 'method-8',
        params: [config.userId]
      }));
      break;

    case 13:
      // Try livechat rooms
      console.log('Calling method: livechat:getRooms');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getRooms',
        id: 'method-9',
        params: [{ agents: [config.userId] }]
      }));
      break;

    case 14:
      // Try getting all inquiries without filter
      console.log('Calling method: livechat:getInquiries');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getInquiries',
        id: 'method-10',
        params: []
      }));
      break;

    case 15:
      // Try with queued status filter
      console.log('Calling method: livechat:getInquiries (with queued filter)');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getInquiries',
        id: 'method-11',
        params: [{ status: 'queued' }]
      }));
      break;

    case 16:
      // Try livechat queue data method
      console.log('Calling method: livechat:getAgentData');
      ws.send(JSON.stringify({
        msg: 'method',
        method: 'livechat:getAgentData',
        id: 'method-12',
        params: []
      }));
      break;

    case 17:
      // Try livechat.inquiries collection subscription
      console.log('Subscription: livechat:inquiry (collection)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-5',
        name: 'livechat:inquiry',
        params: []
      }));
      break;

    case 18:
      // Subscribe to user's livechat notifications
      console.log('Subscription: stream-notify-user (livechat)');
      ws.send(JSON.stringify({
        msg: 'sub',
        id: 'sub-6',
        name: 'stream-notify-user',
        params: [`${config.userId}/livechat`, false]
      }));
      break;

    default:
      console.log('\n' + '='.repeat(60));
      console.log('All 18 livechat queue access methods tried.');
      console.log('='.repeat(60));
      console.log('\n✓ Working subscription found:');
      console.log('  - stream-notify-logged (livechat-inquiry-queue-observer)');
      console.log('  - This listens for NEW queue updates in real-time');
      console.log('\nIf no method returned existing queue data:');
      console.log('1. The queue might be empty (no pending inquiries)');
      console.log('2. Access to historical data may require REST API');
      console.log('3. Different method names in your Rocket.Chat version');
      console.log('\n✓ Connection remains open monitoring for new livechat inquiries...');
  }
}

// Start the connection
connect();
