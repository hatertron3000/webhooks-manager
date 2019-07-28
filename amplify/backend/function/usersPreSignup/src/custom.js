const AWS = require('aws-sdk')
const https = require('https')

exports.handler = async (event, context, callback) => {
  const secretsManagerClient = new AWS.SecretsManager()
  let config = {
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI
  }
  try {
    secretsManagerClient.getSecretValue({ SecretId: process.env.SECRETNAME }, (err, data) => {
      if (err) console.log(err)
      else {
        const secret = data.SecretString
        const secretJson = JSON.parse(secret)
        const client_secret = secretJson[process.env.SECRETKEY]

        // send the POST request 
        const body = JSON.stringify({
          client_id: config.client_id,
          client_secret,
          code: event.request.validationData.code,
          scope: event.request.validationData.scope,
          grant_type: 'authorization_code',
          redirect_uri: config.redirect_uri,
          context: event.request.validationData.context,
        })

        console.log(body)

        const options = {
          hostname: 'login.bigcommerce.com',
          port: 443,
          path: '/oauth2/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        }

        const req = https.request(options, res => {
          let data = false
          res.on('data', chunk => {
            data = !data ? chunk : data + chunk
          })
          res.on('end', () => {
            if (res.statusCode == 200) {
              // Add store to table
              data = data.toString()
              const jsonData = JSON.parse(data),
                dynamoDbClient = new AWS.DynamoDB.DocumentClient(),
                table = process.env.STORAGE_STORES_NAME,
                item = {
                  hash: jsonData.context.substring(7),
                  access_token: jsonData.access_token,
                  scope: jsonData.scope,
                  users: [
                    {
                      id: jsonData.user.id,
                      email: jsonData.user.email,
                      username: jsonData.user.username,
                      is_store_owner: true,
                    }
                  ],
                  created_at: Math.round((new Date()).getTime() / 1000),
                  is_active: true
                }
              const params = {
                TableName: table,
                Item: item
              }

              console.log(`Adding user: ${event.request.userAttributes.name}`)
              dynamoDbClient.put(params, (err, data) => {
                if (err) {
                  console.error(`Error adding store. Error: ${JSON.stringify(err, null, 2)}`)
                  callback(new Error('Error during installation'), null)
                }
                else {
                  console.log(`SUCCESS: Added user ${event.request.userAttributes.name}`)
                  // TODO: create random password before returning the event
                  event.response.autoConfirmUser = true
                  callback(null, event)
                }
              })

            }
            else {
              console.error(`Error adding user: BC responded with ${res.statusCode}
              Response body:
              ${data} `)
              callback(err, null)
            }
          })
        })

        req.on('error', err => {
          console.error(err)
        })

        req.write(body)
        req.end()
      }
    })
  }
  catch (err) {
    console.log('Error adding user: ', err)
    callback(err, null)
  }
}
