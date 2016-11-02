const Hapi = require('hapi');
const redis = require('redis');
const dilbertRoute = require('./app/route/dilbert');
const logPlugin = require('./app/plugin/log');
const log = require('winston');
const getEnvVar = require('get-env-var');
const bluebird = require('bluebird');

log.level = getEnvVar('LOG_LEVEL', 'error');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const server = new Hapi.Server({ debug: { request: ['error', 'log'] } });
server.connection({
  port: process.env.PORT || 8000,
});

// Add the route
server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => reply('hello world'),
});

const redisClient = redis.createClient(process.env.REDIS_URL, { prefix: 'rss-feed:' });
redisClient.on('error', log.error);

server.register(logPlugin(log))
  .catch(log.error);
server.route(dilbertRoute(redisClient));

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  log.info('Server running at:', server.info.uri);
});
