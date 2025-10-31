const https = require('https');
const config = require('./config');

/**
 * Fetches existing queued inquiries using REST API
 */
function getQueuedInquiries() {
  return new Promise((resolve, reject) => {
    const url = new URL(config.websocketUrl.replace('wss://', 'https://').replace('/websocket', ''));

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/api/v1/livechat/inquiries.list',
      method: 'GET',
      headers: {
        'X-Auth-Token': config.token,
        'X-User-Id': config.userId,
        'Content-Type': 'application/json'
      }
    };

    console.log(`\nFetching existing queue via REST API:`);
    console.log(`  GET https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200) {
            console.log('\n✓ Successfully fetched queue data');
            console.log(`  Status: ${res.statusCode}`);
            console.log(`  Total inquiries: ${response.inquiries?.length || 0}`);

            if (response.inquiries && response.inquiries.length > 0) {
              console.log('\n--- Queued Inquiries ---');
              response.inquiries.forEach((inquiry, index) => {
                console.log(`\n${index + 1}. Inquiry ID: ${inquiry._id}`);
                console.log(`   Status: ${inquiry.status}`);
                console.log(`   Department: ${inquiry.department || 'None'}`);
                console.log(`   Room ID: ${inquiry.rid}`);
                console.log(`   Created: ${inquiry.ts || inquiry._updatedAt}`);
              });
            } else {
              console.log('\n  Queue is empty - no pending inquiries');
            }

            resolve(response);
          } else {
            console.error(`\n✗ REST API Error: ${res.statusCode}`);
            console.error(`  Response:`, response);
            reject(new Error(`HTTP ${res.statusCode}: ${response.error || 'Unknown error'}`));
          }
        } catch (e) {
          console.error('\n✗ Failed to parse response:', e.message);
          console.error('  Raw data:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n✗ REST API request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

module.exports = { getQueuedInquiries };
