const good = require('good');

/**
 *
 * @param {Object} log
 * @returns {Object} {{register: register}}
 */
const logPlugin = (log) => {
  const register = (server, options, next) => {
    /* eslint-disable camelcase */
    const goodOptions = {
      ops: {
        interval: 100,
      },
      reporters: {
        winston: [{
          module: 'good-winston',
          args: [log, {
            error_level: 'error',
            ops_level: 'debug',
            request_level: 'debug',
            response_level: 'info',
            other_level: 'info',
            color: false,
          }],
        }],
      },
    };

    server.register({ register: good, options: goodOptions });
    next();
  };

  register.attributes = {
    name: 'logPlugin',
  };

  return {
    register,
  };
};

module.exports = logPlugin;
