const AWS = require('aws-sdk')

exports.handler = (event, context, callback) => {
  if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
    const secretsManager = new AWS.SecretsManager(process.env.SECRET)
    secretsManager.getSecretValue({ SecretId: process.env.SECRET }, (err, data) => {
      if (err) {
        context.done(new Error('Error creating challenge', null))
      }
      else {
        const secret = data.SecretString
        const secretJson = JSON.parse(secret)
        const bc_client_secret = secretJson.client_secret

        event.response.privateChallengeParameters = {}
        event.response.privateChallengeParameters.answer = bc_client_secret
        context.done(null, event);
      }
    })
  }
}