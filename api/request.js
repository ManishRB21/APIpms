const rp = require('request-promise');
const isJson = require('is-json');
// const config = require('./config');
// const { INTERNAL_SERVER_ERROR } = require('./constant');

module.exports = options => {
  if (typeof options === 'string') {
    options = {
      uri: options,
    };
  }

  options.method = options.method || 'get';
  options.resolveWithFullResponse = true;
  options.json = options.json || true;
  options.body = isJson(options.body) ? JSON.parse(options.body) : options.body;
  options.timeout =  150000;

  return rp(options)
    .then(res => {
       // console.log(res)
      if (res.body && res.body.status) {
        res.body = isJson(res.body) ? JSON.parse(res.body) : res.body;
      }
      return Promise.resolve(res);
    })
    .catch(err => {
       // console.log(err , "===ERROR===")
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      if (err.error && err.error.status) {
        err.error = isJson(err.error) ? JSON.parse(err.error) : err.error;
      } else {
        err.error = {
          status: 'error',
          error: {
            statusCode: err.statusCode,
            message: err.message,
          },
        };
      }
      return Promise.reject(err);
    });
};
