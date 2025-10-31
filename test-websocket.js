const WebSocket = require('ws');

const ws = new WebSocket('wss://ws1.keosapp.org/websocket');

const TOKEN = 'UNdZgL-67FRccTExF-zko_oZkvlzZJy5tdHj8v1fnlb';
const USER_ID = 'CMAP5jftT8ELWEnHt';

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

    // Step 3: Subscribe to livechat queue
    ws.send(JSON.stringify({
      msg: 'sub',
      id: 'livechat-queue',
      name: 'stream-livechat-room',
      params: ['queue', false]
    }));
  }

  if (response.msg === 'changed') {
    console.log('Queue update:', response);
  }
});

ws.on('error', function(error) {
  console.error('WebSocket error:', error);
});
