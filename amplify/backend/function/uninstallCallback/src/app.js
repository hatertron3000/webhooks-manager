/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var storageStoresName = process.env.STORAGE_STORES_NAME
var storageStoresArn = process.env.STORAGE_STORES_ARN
var authUsersUserPoolId = process.env.AUTH_USERS_USERPOOLID

Amplify Params - DO NOT EDIT */

const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION })

let tableName = "stores"
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV
}
const path = "/uninstall"

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

/********************************
 * Uninstall Request Handler *
 ********************************/

app.get(path, function (req, res) {
  const crypto = require('crypto')
  const secretsManagerClient = new AWS.SecretsManager()
  const dynamoDbClient = new AWS.DynamoDB()
  const cognitoClient = new AWS.CognitoIdentityServiceProvider()

  secretsManagerClient.getSecretValue({ SecretId: process.env.SECRETNAME }, (err, data) => {
    try {
      if (err) {
        console.log(err)
        res.json({ status: 500, message: 'Internal server error' })
      }
      else {
        const secret = data.SecretString
        const secretJson = JSON.parse(secret)
        const client_secret = secretJson[process.env.SECRETKEY]

        const encodedStrings = req.query.signed_payload.split('.')
        // verify signed payload is the correct format
        if (encodedStrings.length !== 2) {
          res.statusCode = 403
          res.json({ status: 403, message: 'Signed payload is not the correct format' })
        }
        else {
          // Verify Signature
          const signature = new Buffer.from(encodedStrings[1], 'base64').toString('utf8')
          const data = new Buffer.from(encodedStrings[0], 'base64').toString('utf8')
          const expectedSignature = crypto.createHmac('sha256', client_secret).update(data).digest('hex')
          if (expectedSignature === signature) {
            const jsonData = JSON.parse(data)
            // Delete user in Cognito
            const userParams = {
              UserPoolId: process.env.AUTH_USERS_USERPOOLID,
              Username: jsonData.store_hash,
            }
            cognitoClient.adminDeleteUser(userParams, (err, data) => {
              if (err) {
                console.log(({ status: 500, message: "Error removing user from user pool", error: err }))
                res.statusCode = 500
                res.json({ status: 500, message: "Error removing user from user pool" })
              }
              else {
                console.log({ message: `Finished removing user ${jsonData.store_hash}. Cleaning up table.` })
                // Remove from DynamoDB
                const keyParams = {
                  "hash": {
                    "S": jsonData.store_hash
                  }
                }

                let removeItemParams = {
                  TableName: tableName,
                  Key: keyParams
                }
                dynamoDbClient.deleteItem(removeItemParams, (err, data) => {
                  if (err) {
                    console.log(err)
                    res.statusCode = 500
                    res.json({ status: 500, message: `Error during uninstall`, store: jsonData.store_hash })
                  } else {
                    console.log({ message: `Successfully uninstalled`, store: jsonData.store_hash })
                    res.json({ status: 200, message: `Successfully uninstalled`, store: jsonData.store_hash })
                  }
                })
              }
            })
          }
          else {
            console.log({ status: 403, message: 'Signed payload is invalid' })
            res.statusCode = 403
            res.json({ status: 403, message: 'Signed payload is invalid' })
          }
        }
      }
    }
    catch (err) {
      console.log(err)
      res.statusCode = 500
      res.json({ status: 500, message: 'Internal server error' })
    }


  })
})

app.listen(3000, function () {
  console.log("App started")
})

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
