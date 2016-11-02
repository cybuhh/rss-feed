/* eslint-disable strict */

'use strict';

module.exports = {
  method: 'GET',
  path: '/public/{param*}',
  handler: {
    directory: {
      path: './',
      listing: true,
    },
  },
};
