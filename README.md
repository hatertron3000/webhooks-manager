# Summary
This application is a utility intended for [BigCommerce developers](https://developer.bigcommerce.com/) to use to quickly subscribe to webhook messages, and view webhook events published by BigCommerce. This is not intended to be a production application, though it may serve as a starting point for developers looking to build serverless applications for BigCommerce.

This application manages the following AWS resources with Amplify CLI:
 - IAM Roles
 - CloudFormation Stack
 - Lambda Functions
 - Cognito User and Identity Pools
 - DynamoDB
 - S3 (optional for hosting)
 - Cloudfront (optional for hosting)

**A note about security**

If you intend to use this application as a starting point for a production serverless BigCommerce app, consider additional security measure, such as:

 - Always use [AWS IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html).
 - Adding additional encryption, or an alternate API key storage service, for the API tokens this app stores in DynamoDB. Consider using KMS, or another service to prevent exposure through the DynamoDB console.
 - Defining the webhook destination in a Lambda function, rather than the React application. The intent of defining the destination in React is to allow a developers using a private app to add a UI to supply their own webhook destination during webhook creation. But relying on user input to define a webhook destination should be avoided in a public app.
 - Adding Logout links, and faster token expiration (default is 1 day).

# Installation

This application utilizes [AWS Amplify CLI](https://github.com/aws-amplify/amplify-cli) and [AWS Amplify JS](https://github.com/aws-amplify/amplify-js) to deploy a serverless backend to AWS , with a React front end that you can run locally, or later build and publish to an S3 bucket behind Cloudfront.

This example uses [Requestbin](https://requestbin.com/) to receive, respond to, and record webhook events sent by BigCommerce. You could add any custom URIs you would like to act as the webhook listening endpoint and event monitoring UI, but that is outside the scope of this procedure.

Since this application stores the BigCommerce Client Secret in AWS Secrets Manager, and Amplify CLI does not yet support Secrets Manager, so these steps will be performed in the AWS Console, and environment variables will be manually added as parameters for Cloudformation templates.

## Prerequisites
### Environment

 - [NodeJS](https://nodejs.org/en/download/) (recommended v10.16.0)
 - [npm](https://www.npmjs.com/get-npm)

*For Windows users, [Amplify recommends](https://aws-amplify.github.io/docs/js/react#installation) the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10).*

### BigCommerce Store
If you do not already have one, you will need to create a BigCommerce store. If necessary navigate to [https://www.bigcommerce.com/essentials/](https://www.bigcommerce.com/essentials/) to sign up for a free trial store.

*Make sure your user account is the "store owner" account. Only the store owner can install draft apps like the one you're about to register. If you created the trial,  your account is automatically the store owner.*
### BigCommerce App
This example will walk you through registering a [personal app](https://developer.bigcommerce.com/api-docs/getting-started/building-apps-bigcommerce/types-of-apps#types-of-personal_apps). To register a personal BigCommerce app, you will need:

 - **App Name:** The name of your application.
 - **Auth Callback URL:** The React app hosts the auth callback URL at /install
 -- Example: https://localhost:3000/install
 - **Load Callback URL:** The React app hosts the load callback URL at /load
 -- Example: https://localhost:3000/load

1. Navigate to [https://devtools.bigcommerce.com](https://devtools.bigcommerce.com/)  and log into your BigCommerce account
2. If necessary, log in with your store owner account.
3. Click the Create an App button
4. Enter your App Name, then click Create
5. Navigate to the Technical tab then enter the Auth Callback URL and Load Callback URL
6. Take note of your Auth Callback and Load Callback URLs

For more information on BigCommerce apps, check out the [BigCommerce documentation](https://developer.bigcommerce.com/api-docs/getting-started).

### Requestbin

 1. Create a free private or public requestbin at [https://requestbin.com/](https://requestbin.com/)
 2. Copy the URL of the Requestbin monitoring UI from your browser's address bar.
*(example: https://requestbin.com/r/{{unique-id}})*
 4. Take note of the URL to later use as the REACT_APP_REQUESTBIN environment variable in the React app
 5. Copy the URL from the *Endpoint* text field on the Requestbin monitoring UI
*(example: https://{{unique-id}}.x.pipedream.net/)*
 7. Take note of the URL to use later as the REACT_APP_WEBHOOKSENDPOINT environment variable in the React app

### AWS 
#### Account
If you don't already have an AWS account, sign up for a free tier account here: [https://aws.amazon.com/free](https://aws.amazon.com/free)

*While this utility was developed and tested within the limits of an AWS Free Tier account, you are responsible for any charges incurred by using the services created by Amplify*

Always follow [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#create-iam-users), such as operating from an IAM user rather than your root account.
#### Amplify CLI
Install and configure [Amplify CLI](https://github.com/aws-amplify/amplify-cli)
```
$ npm install -g @aws-amplify/cli
$ amplify configure
```

#### Secrets Manager
Store your BigCommerce client secret in AWS Secrets Manager.

1. Log in to [AWS console](http://console.aws.amazon.com)
2. Click *Services*, and locate *Secrets Manager*
3. Click the *Store a new secret* button
4. Select *Other type of secrets (e.g. API key)*
5. Enter a *Secret key/value pair* where the key is an arbitrary key name like "client_secret", and the value is the BigCommerce Client Secret. [TODO: INSERT IMAGE]
    *You can retrieve your Client Secret from https://devtools.bigcommerce.com*
6. Take note of your key to use later as the SECRETKEY environment variable in CloudFormation
7. Choose an encryption key, or use the default key (https://drive.google.com/file/d/1WAlZ45bnaTqlhi7GsxpKxqMiSPjn3sRk/view?usp=sharing) 
9. Click *Next*
10. Enter a *Secret name*, and optionally provide a description and/or tags
11. Take note of the secret name to use later as the SECRETNAME environment variable in CloudFormation templates for Lamda functions
12. Click *Next*
13. Select *Disable automatic rotation*
14. Click *Next*
15. Review the configuration, then click *Store* 
16. In the Secrets Manager console, click the name of your secret to locate the Secret ARN
17. Take note of the Secret ARN to use later as the SECRETARN environment variable in CloudFormation templates for Lambda functions
(example format: *arn:aws:secretsmanager*:{region}:{account}:*secret*:{secret-name})

For more information, see [Secrets Manager documentation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html).

## Clone and configure Webhooks Manager

### Clone the repo
Clone this repo into your project directory. For this example, the directory name is assumed to be *webhooks-manager*

If you would like to run the React app on a specific port, create *webhooks-manager/.env.development.local* and add the following to it with your preferred port:

    PORT=5005

### Install dependencies

    npm install
    
### Configure environment variables

#### React app
Edit *webhooks-manager/.env* and add the following values:

|Key|Value|
|--|--|
|REACT_APP_WEBHOOKSENDPOINT  | Your Requestbin endpoint |
|REACT_APP_REQUESTBIN|Your Requestbin monitoring UI URL|

#### bcClient Lambda CloudFormation
Edit *webhooks-manager/amplify/backend/function/bcClient/parameters.json* 

|Key|Value|
|--|--|
|BCCLIENTID|Your BigCommerce Client ID|

#### usersCreateAuthChallenge Lambda CloudFormation
Edit *webhooks-manager/amplify/backend/function/usersCreateAuthChallenge* 

|Key|Value|
|--|--|
|SECRETNAME|Your Secret's name in Secrets Manager (example: *bcSecret)*|
|SECRETKEY|They key from the key value pair in Secrets Manager (example: *client_secret)* |
|SECRETARN|They Amazon Resource Name of your Secret in Secrets Manager (example format: *arn:aws:secretsmanager*:{region}:{account}:*secret*:{secret-name}) |

#### usersPreSignup Lambda Cloudformation
Edit *webhooks-manager/amplify/backend/function/usersPreSignup/parameters.json* 

|Key|Value|
|--|--|
|SECRETNAME|Your Secret's name in Secrets Manager (example: *bcSecret)*|
|SECRETKEY|They key from the key value pair in Secrets Manager (example: *client_secret)* |
|SECRETARN|They Amazon Resource Name of your Secret in Secrets Manager (example format: *arn:aws:secretsmanager*:{region}:{account}:*secret*:{secret-name}) |
|REDIRECTURI|Your app's Auth Callback URI (example: *https://localhost:3000/install*)|
|BCCLIENTID|Your BigCommerce Client ID|

## Initialize Amplify 
In *webhooks-manager*, run the following

    amplify init

Follow the prompts to create a new environment, or use an existing one. Amplify CLI will create the AWS resources needed to deploy the application like a CloudFormation stack, and several IAM roles.

## Deploy Backend to Cloud
In *webhooks-manager*, run the following

    amplify push

Answer Y when prompted to create resources in the cloud:

     Current Environment: dev
    
    | Category | Resource name                    | Operation | Provider plugin   |
    | -------- | -------------------------------- | --------- | ----------------- |
    | Storage  | stores                           | Create    | awscloudformation |
    | Function | usersCreateAuthChallenge         | Create    | awscloudformation |
    | Function | usersDefineAuthChallenge         | Create    | awscloudformation |
    | Function | usersPreSignup                   | Create    | awscloudformation |
    | Function | usersVerifyAuthChallengeResponse | Create    | awscloudformation |
    | Function | bcClient                         | Create    | awscloudformation |
    | Function | webhooksApi                      | Create    | awscloudformation |
    | Auth     | users                            | Create    | awscloudformation |
    | Api      | webhooksApi                      | Create    | awscloudformation |
    ? Are you sure you want to continue? (Y/n) y
    ⠋ Updating resources in the cloud. This may take a few minutes...

Get up, get a Topo Chico, and let Amplify CLI handle deploying your serverless resources. :smile:

# Usage
## Run React server locally
Once your resources are finished deploying, you can start your React app's development server with

    amplify serve

or 

    npm run start

By using `amplify serve` instead of `npm run start` to start your development server, Amplify CLI will compare your local resources to your cloud resources before starting the development server, and prompt you to push changes to the cloud, or start the server existing cloud resources.

## Install the app on the BigCommerce store

### Install
 1. Log into your BigCommerce control panel as the store owner
 2. Navigate to *Apps > My Apps > My Draft Apps*
 3. Click *Install* for your application
 4. Follow the prompts to complete installation
 5. After a successful installation, you will be prompted to agree to terms of service, and sign up.

### Signup Screen

This screen is intended to be a placeholder. In another application, it may serve to gather additional account information before confirming the Cognito user.

1. Check the TOS checkbox
2. Click the Signup button
3. After a successful signup, you will be prompted to relaunch the application. Navigate to My Apps, or somewhere else in the BigCommerce control panel before clicking the app's icon in the Apps menu to launch it again.

*If you receive an error, you can use CloudWatch logs to check for errors from the usersPreSignup Lambda function. If it is a configuration issue like a bad redirect URI in the Lambda environment variables, the logs may help you identify it.*

### Webhooks Dashboard
TODO

### Events Dashboard
TODO


# Known Issues
## Uninstall
### Problem
There is no process to disable the Cognito user when an admin uninstalls the app from the store. This means before reinstalling the app, the store must be manually removed from the table in DynamoDB. 

### Solution
An Uninstall Callback URI can be provided to BigCommerce. When an admin uninstalls the app from the store, the Uninstall Callback URI can invoke a Lambda function to validate the Uninstall request, and update the stores table in DynamoDB as needed.

## App must be relaunched after installation
### Problem
After a successful installation, the Cognito user has been created, but the React app does not yet have tokens. To grant identity and access tokens, the React app must trigger a request from BigCommerce to the Load Callback URI, so that the React app can begin the [custom auth flow in Cognito](https://aws.amazon.com/blogs/mobile/customizing-your-user-pool-authentication-flow/).
