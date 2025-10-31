const WebSocket = require('ws');
const config = require('./config');
const { getQueuedInquiries } = require('./rest-api');

let ws = null;
let connectionAttempts = 0;

console.log('='.repeat(60));
console.log('Rocket.Chat Livechat Queue Monitor');
console.log('='.repeat(60));

// Step 1: First, get existing queued messages via REST API
getQueuedInquiries()
  .then((data) => {
    console.log('\n' + '='.repeat(60));
    console.log('Starting WebSocket for real-time updates...');
    console.log('='.repeat(60));

    // Step 2: Then connect WebSocket for real-time updates
    connectWebSocket();
  })
  .catch((error) => {
    console.error('\n⚠ Warning: Could not fetch existing queue data');
    console.error('  Reason:', error.message);
    console.log('\nContinuing with WebSocket for real-time updates...');

    // Still try WebSocket even if REST fails
    connectWebSocket();
  });

function connectWebSocket() {
  connectionAttempts++;

  console.log(`\nConnection attempt ${connectionAttempts}/${config.retryAttempts}`);
  console.log(`Connecting to: ${config.websocketUrl}\n`);

  ws = new WebSocket(config.websocketUrl);

  ws.on('open', function() {
    console.log('✓ WebSocket connected');
    connectionAttempts = 0;

    // Connect to DDP
    ws.send(JSON.stringify({
      msg: 'connect',
      version: '1',
      support: ['1']
    }));
  });

  ws.on('message', function(data) {
    const response = JSON.parse(data);

    // Handle ping/pong
    if (response.msg === 'ping') {
      ws.send(JSON.stringify({ msg: 'pong' }));
      return;
    }

    // Don't log routine messages
    if (response.msg === 'updated') {
      return;
    }

    console.log('Received:', response);

    if (response.msg === 'connected') {
      console.log('✓ DDP Connected (Session:', response.session + ')');
      console.log('Authenticating...');

      // Login
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
        console.log('✓ Logged in as:', response.result.id);

        // Subscribe to livechat queue updates
        console.log('\nSubscribing to livechat queue updates...');
        ws.send(JSON.stringify({
          msg: 'sub',
          id: 'livechat-queue-sub',
          name: 'stream-notify-logged',
          params: ['livechat-inquiry-queue-observer', false]
        }));
      } else {
        console.error('✗ Login failed:', response.error || 'Unknown error');
      }
    }

    // Handle subscription success
    if (response.msg === 'ready') {
      console.log('✓ Subscribed successfully:', response.subs);
      console.log('\n' + '='.repeat(60));
      console.log('Monitoring livechat queue for updates...');
      console.log('Press Ctrl+C to exit');
      console.log('='.repeat(60) + '\n');
    }

    // Handle subscription errors
    if (response.msg === 'nosub') {
      console.error('✗ Subscription failed:', response.id);
      console.error('  Error:', response.error);
    }

    // Handle queue updates - THIS IS THE IMPORTANT PART
    if (response.msg === 'changed') {
      console.log('\n🔔 QUEUE UPDATE RECEIVED!');
      console.log('='.repeat(60));
      console.log('Collection:', response.collection);
      console.log('Event ID:', response.id);

      if (response.fields) {
        console.log('Fields:', JSON.stringify(response.fields, null, 2));
      }

      if (response.fields && response.fields.args) {
        console.log('\nUpdate Details:');
        console.log(JSON.stringify(response.fields.args, null, 2));
      }

      console.log('='.repeat(60) + '\n');
    }
  });

  ws.on('error', function(error) {
    console.error('\n✗ WebSocket error:', error.message);
  });

  ws.on('close', function() {
    console.log('\n✗ WebSocket connection closed');

    // Retry if we haven't exceeded max attempts
    if (connectionAttempts < config.retryAttempts) {
      console.log(`Retrying in ${config.retryDelay / 1000} seconds...`);
      setTimeout(connectWebSocket, config.retryDelay);
    } else {
      console.log('Maximum connection attempts reached.');
    }
  });
}

// Handle clean shutdown
process.on('SIGINT', function() {
  console.log('\n\nShutting down...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});
