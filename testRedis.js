const { createClient } = require('redis');

(async () => {
  const client = createClient({ url: process.env.KV_URL });

  client.on('error', (err) => console.error('Redis Client Error:', err));

  await client.connect();
  console.log('Connected to Redis');

  const testKey = 'test';
  await client.set(testKey, 'Hello, Redis!');
  const value = await client.get(testKey);
  console.log('Redis Value:', value);

  await client.disconnect();
})();