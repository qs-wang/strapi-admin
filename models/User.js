'use strict';

const AWS = require('aws-sdk');
const { env } = require('strapi-utils');

// TO DO hardcoded config
const areaCode = '+61';

const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  logger: console,
  region: env('AWS_REGION'),
});

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async afterCreate(result) {
      try {
        if (result.subscribed) {
          strapi.log.info('subscribe the user to outstanding topic while new model has subscribe as true');
          await subscribe(result);
        } else {
          strapi.log.info('un-subscribe the user to outstanding topic while new model has subscribe as false');
          await subscribe(result);
        } 
      } catch (error) {
        log.error(error)
      }

    },
    async afterDelete(result) {
      try {
        strapi.log.info('un-subscribe the user to outstanding topic after deleting');
        await unsubscribe(result);
      } catch (error) {
        strapi.log.error(error);
      }
    },
  },
  async afterUpdate(result) {
    try {
      if (result.subscribed) {
        log.info('subscribe the user to outstanding topic while model changed to have subscibe as true');
        await subscribe(result);
      } else {
        log.info('un-subscribe the user to outstanding topic while model changed  subscribe as false');
        await subscribe(result);
      }
    } catch (error) {
      log.error(error)
    }
  }
};


async function unsubscribe(result) {
  const mobile = result.bestContactNumber? result.bestContactNumber:result.username;
  const lambdaParams = {
    FunctionName: 'SNSMessageLambda',
    InvocationType: 'Event',
    Payload: JSON.stringify({
      mobile: `${areaCode}${mobile}`,
      type: 'outstanding',
      eventId: 1,
      action: 'unsubscribe',
    }),
  };

  try {
    await lambda.invoke(lambdaParams).promise();
  } catch (error) {
    // ingore the error because the lambda is a separate system
    // the error should not prevent, or affect the cms model lifecycle
    // only print the error message to console
    log.error(error);
  }
}

async function subscribe(result) {
  const mobile = result.bestContactNumber? result.bestContactNumber:result.username;
  const lambdaParams = {
    FunctionName: 'SNSMessageLambda',
    InvocationType: 'Event',
    Payload: JSON.stringify({
      mobile: `${areaCode}${mobile}`,
      type: 'outstanding',
      eventId: 1,
      action: 'subscribe',
    }),
  };
  try {
    await lambda.invoke(lambdaParams).promise();
  } catch (error) {
    // ingore the error because the lambda is a separate system
    // the error should not prevent, or affect the cms model lifecycle
    // only print the error message to console
    log.error(error);
  }
}

