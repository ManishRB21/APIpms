const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const _ = require('lodash')
const app = express();
const request = require('./request')
const subscription = require('../subscription');


function getCallbackToken() {
  const options = {
    uri: "https://10.221.44.207:60080/api/v2/auth/tokens",
    method: 'post',
    body: {
      'grant_type': 'client_credentials',
      'client_id': "webOS22999",
      'client_secret': "6143b5a7110566489711696143b5a71105c8595224596143b5a71105e6389249156143b5a71105f4394786976143b5a71106"
    }
  };
  return request(options)
    .then(res => {
      console.log("inside access token", res.body)
      return res.body.access_token;
    })
    .catch(err => {
      console.log(err);
      return Promise.reject({
        message: 'Get CallbackToken Error'
      });
    })
}
let tokenValue = "";
function sendEvent( data) {
 /*  const token = subscription.map(data => {
    console.log(data)
    const  bearerToken = data.callbackToken
    return tokenValue = bearerToken
  })
  console.log(typeof(tokenValue)) */
  const pcnUri = 'https://10.221.44.207:60080/api/v2/events/pms';
  //http://10.221.44.207
  return getCallbackToken()
    .then(callbackToken => {
      return request({
        method: 'post',
        uri: 'https://10.221.44.207:60080/api/v2/events/pms',
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
          data.pcnUri = 'https://10.221.44.207:60080/api/v2/events/pms';
          return Promise.resolve({
            subscriptionId: '1',
            request: data,
            response: {
              statusCode: result.statusCode,
              statusMessage: result.body.status
            }
          });
        })
        .catch(err => {
          return Promise.resolve({
            subscriptionId: '1',
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
  console.log('Call API: /commands/events', req.body);
  sendEvent( req.body)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(e => next(e));
});

module.exports = router;
