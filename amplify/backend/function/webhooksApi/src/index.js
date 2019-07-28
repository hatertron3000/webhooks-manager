const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  console.log(JSON.stringify({
    message: "Event Received",
    event: {
      resource: event.resource,
      method: event.httpMethod
    }
  }))
  awsServerlessExpress.proxy(server, event, context);
};
