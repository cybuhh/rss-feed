'use strict';

const Hapi = require('hapi');
const redis = require('redis');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    port: process.env.PORT || 8000
});

// Add the route
server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
        return reply('hello world');
    }
});

let redisClient;

redisClient = redis.createClient(process.env.REDIS_URL, { prefix: 'rss-feed:' });

server.register({ register: require('./app/dilbert')(redisClient) });

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.info('Server running at:', server.info.uri);
});
