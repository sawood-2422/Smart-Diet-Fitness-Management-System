const http = require('http');

const data = JSON.stringify({
  email: 'test_post@example.com',
  exercises: [{ name: 'Test Exercise', sets: 1, reps: 5, weight: 0, duration: 15 }],
  totalDuration: 15,
  caloriesBurned: 75
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/workouts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('RESPONSE BODY:', body);
    process.exit(0);
  });
});

req.on('error', err => {
  console.error('Request error:', err.message);
  process.exit(1);
});

req.write(data);
req.end();
