const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const _ = require('lodash')
const app = express();
const request = require('./request')
const config = require('./config');


function getCallbackToken(id, secret) {
  const options = {
    uri: 'https://10.221.44.207:60080/api/v2/auth/tokens',
    method: 'post',
    body: {
      'grant_type': 'client_credentials',
      'client_id': id,
      'client_secret': secret
    }
  };
  return request(options)
    .then(res => {
      return res.body.access_token;
    })
    .catch(err => {
      logger.error(err);
      return Promise.reject({
        message: 'Get CallbackToken Error'
      });
    })
}

function sendEvent(subscription, data) {
//   const host = subscription.host;
//   const prefix = subscription.prefix;
  const pcnUri = 'https://10.221.44.207:60080/api/v2/auth/tokens';

  return getCallbackToken(subscription.client_id, subscription.client_secret)
    .then(callbackToken => {
      return request({
        method: 'post',
        uri: 'https://10.221.44.207:60080/api/v2/auth/tokens',
        headers: {
          Authorization: `Bearer ${callbackToken}`,
        },
        body: {
          data: {
            events: [_.omit(data, 'room')],
          },
        },
      })
        .then(result => {
          data.pcnUri = host;
          return Promise.resolve({
            subscriptionId: subscription.id,
            request: data,
            response: {
              statusCode: result.statusCode,
              statusMessage: result.body.status
            }
          });
        })
        .catch(err => {
          return Promise.resolve({
            subscriptionId: subscription.id,
            request: data,
            response: {
              statusCode: err.statusCode,
              statusMessage: err.error
            }
          });
        });
    })
}

router.post('/events', (req, res, next) => {
  logger.debug('Call API: /commands/events');
  const subscriptions = [];
  _.forEach(config.get('app.pcn'), (subscription, subscriptionId) => {
    subscriptions.push(subscription);
  });

  const P = require('bluebird');
  return P.mapSeries(subscriptions, subscription => sendEvent(subscription, req.body))
    .then(result => {
      res.status(200).json(result);
    })
    .catch(e => next(e));
});

module.exports = router;
