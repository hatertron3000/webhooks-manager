# Summary
This application is a utility intended for [BigCommerce developers](https://developer.bigcommerce.com/) to use to quickly subscribe to webhook messages, and view webhook events published by BigCommerce. This is not intended to be a production application, though it may serve as a starting point for developers looking to build serverless applications for BigCommerce.

This application manages the following AWS resources with Amplify CLI:
 - IAM Roles
 - CloudFormation Stack
 - Lambda Functions
 - Cognito User and Identity Pools
 - DynamoDB
 - S3
 - CloudFront (optional for hosting)

**A note about security**

If you intend to use this application as a starting point for a production serverless BigCommerce app, consider additional security measure, such as:

 - Always use [AWS IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html).
 - Adding additional encryption, or an alternate API key storage service, for the API tokens this app stores in DynamoDB. Consider using KMS, or another service to prevent exposure through the DynamoDB console.
 - Defining the webhook destination in a Lambda function, rather than the React application. The intent of defining the destination in React is to allow a developers using a private app to add a UI to supply their own webhook destination during webhook creation. But relying on user input to define a webhook destination should be avoided in a public app.
 - Adding Logout links, and faster token expiration (default is 1 day).

# Installation

This application utilizes [AWS Amplify CLI](https://github.com/aws-amplify/amplify-cli) and [AWS Amplify JS](https://github.com/aws-amplify/amplify-js) to deploy a serverless backend to AWS, with a React front end that you can run locally, or later build and publish to an S3 bucket behind CloudFront.

This example uses [Requestbin](https://requestbin.com/) to receive, respond to, and record webhook events sent by BigCommerce. You could add any custom URLs you would like to act as the webhook listening endpoint and event monitoring UI, but that is outside the scope of this procedure.

Since this application stores the BigCommerce Client Secret in AWS Secrets Manager, and Amplify CLI does not yet support Secrets Manager, some of these steps will be performed in the AWS Console, and environment variables will be manually added as parameters for CloudFormation templates.

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
6. Take note of your Auth Callback URL to be used as the REDIRECTURI environment variable in a CloudFormation template.
7. Save the app
8. Click the View Client ID link to view your Client ID and Client Secret. Take note of those values for use in Lambda environment variables and storage in Secrets Manager respectively.

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

*While this utility was developed and tested within the limits of an AWS Free Tier account, you are responsible for any charges incurred by using the resources created by Amplify*

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
11. Take note of the secret name to use later as the SECRETNAME environment variable in CloudFormation templates for Lambda functions
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

#### uninstallCallback Lambda CloudFormation
Edit *webhooks-manager/amplify/backend/function/uninstallCallback/parameters.json* 

|Key|Value|
|--|--|
|SECRETNAME|Your Secret's name in Secrets Manager (example: *bcSecret)*|
|SECRETKEY|They key from the key value pair in Secrets Manager (example: *client_secret)* |
|SECRETARN|They Amazon Resource Name of your Secret in Secrets Manager (example format: *arn:aws:secretsmanager*:{region}:{account}:*secret*:{secret-name}) |

#### usersCreateAuthChallenge Lambda CloudFormation
Edit *webhooks-manager/amplify/backend/function/usersCreateAuthChallenge/parameters.json* 

|Key|Value|
|--|--|
|SECRETNAME|Your Secret's name in Secrets Manager (example: *bcSecret)*|
|SECRETKEY|They key from the key value pair in Secrets Manager (example: *client_secret)* |
|SECRETARN|They Amazon Resource Name of your Secret in Secrets Manager (example format: *arn:aws:secretsmanager*:{region}:{account}:*secret*:{secret-name}) |

#### usersPreSignup Lambda CloudFormation
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

*TODO: Update example with latest resources*
Get up, get a Topo Chico, and let Amplify CLI handle deploying your serverless resources. :smile:

## Configure Uninstall Callback URL
Now that the uninstall API Gateway has deployed, you can retrieve the Invoke URL and provide it to BigCommerce as the Uninstall Callback URL. The invoke URL is found in the Stage Editor section of the API Gateway console in AWS Console.

### Retrieve the Invoke URL for the uninstall API
1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Click *Services* and navigate to the API Gateway console
3. Navigate to *APIs > Uninstall > Stages*
4. Expand your environment tree and click the /uninstall resource
5. Click the *Get* method
6. Copy the Invoke URL at the top 

*Example Format*
`
https://{unique-value}.execute-api.{region}.amazonaws.com/{environment}/uninstall
`

For more information on retrieving your Invoke URL, see [Amazon API Gateway documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-call-api.html#apigateway-how-to-call-rest-api)

## Update the BigCommerce app with the Uninstall Callback URL
1. Log in to https://devtools.bigcommerce.com
2. Click the *Edit App* button
3. Navigate to the *Technical* tab
4. Paste the Invoke URL into the Uninstall Callback URL field
5. Click *Update and Close*

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
 
 *If after clicking* Install *your browser fails to connect to the React app, try to navigate directly to your Auth Callback URL. You may need to create an exception for SSL certificate in your browser*

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

# Deployment

## Add S3 hosting with CloudFront
Amplify provides two types of hosting:
- development, which provides an S3 bucket accessible with HTTP
- production, which provides an S3 bucket behind a CloudFront CDN accessible with HTTPS

Since the Auth Callback and Load Callback URLs must be served over HTTPS, building and hosting the React app in the cloud requires production hosting. To add production hosting run

`amplify hosting add`

Complete the prompts to select production hosting.
```
amplify hosting add
? Select the environment setup: PROD (S3 with CloudFront using HTTPS)
? hosting bucket name webhooks-manager-hosting
? index doc for the website index.html
? error doc for the website index.html

You can now publish your app using the following command:
Command: amplify publish
```

When you are ready to build and deploy the app, run

`amplify publish`

Answer Y when prompted to create resources in the cloud:
```
Current Environment: prod

| Category | Resource name                    | Operation | Provider plugin   |
| -------- | -------------------------------- | --------- | ----------------- |
| Hosting  | S3AndCloudFront                  | Create    | awscloudformation |
| Storage  | stores                           | No Change | awscloudformation |
| Function | usersCreateAuthChallenge         | No Change | awscloudformation |
| Function | usersDefineAuthChallenge         | No Change | awscloudformation |
| Function | usersPreSignup                   | No Change | awscloudformation |
| Function | usersVerifyAuthChallengeResponse | No Change | awscloudformation |
| Function | bcClient                         | No Change | awscloudformation |
| Function | webhooksApi                      | No Change | awscloudformation |
| Auth     | users                            | No Change | awscloudformation |
| Api      | webhooksApi                      | No Change | awscloudformation |
? Are you sure you want to continue? Yes
⠋ Updating resources in the cloud. This may take a few minutes...
```
*TODO: Update example with latest resources*

Once the deployment completes, the CLI will provide your CloudFront URL. Example:
```
✔ Uploaded files successfully.
Your app is published successfully.
https://<unique-string>.cloudfront.net
```

## Update Auth Callback, Load Callback, and Redirect URLs

### Update the app registration
1. Navigate to https://devtools.bigcommerce.com
2. Click the *Edit App* button
3. Click the *Technical* tab
4. Update the domain for your Auth Callback and Load Callback URLs to use your CloudFront URL
5. Click the *Update & Close* button

### Update the preSignUp Lambda function
Edit *webhooks-manager/amplify/backend/function/usersPreSignup/parameters.json*

Replace the value for REDIRECTURI with your app's new Auth Callback URI.

### Push your updated backend
From *webhooks-manager*, run

`amplify push`

Answer Y when prompted to update resources in the cloud.

# What's next?

- Try using [Amplify Console](https://aws.amazon.com/amplify/console/) to manage your environments and deployments.
- [Set up a Custom Domain](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html) using Amplify and Route 53
- Consider adding a form to gather additional information on the Sign Up page, or trigger an email confirmation to the user.
- Enable multi-user support in BigCommerce, and update the Verify Auth Challenge Lambda function to update the store's `users` list in the `stores` table in DynamoDB
- Build your own webhooks listening endpoint, and event storage to replace Requestbin
- Trigger additional Lambda functions to perform tasks in repsonse to webhook events

# Troubleshooting
**I get an error about a CloudFormation template after I try to `amplify push`**

Check the environment variables in the `parameters.json` files, and ensure the files are valid JSON.

**I can't get past the terms of service page. I keep getting an error saying installation failed, and there is an error from Cognito in my browser's JS console saying the PreSignup Lambda didn't give a valid response.**

Check the logs for the PreSignup Lambda in Cloudwatch. Logging may indicate a problem with an environment variable for the PreSignup Lambda like the Redirect URI, or Client Secret.

**When I click the Events link in the navigation, the app loads another iframe of itself**

Check that your Requestbin URL is a valid URL in *webhooks-manager/.env* file.

# Known Issues
## App must be relaunched after installation
After a successful installation, the Cognito user has been created, but the React app does not yet have tokens. To grant identity and access tokens, the React app must trigger a request from BigCommerce to the Load Callback URI, so that the React app can begin the [custom auth flow in Cognito](https://aws.amazon.com/blogs/mobile/customizing-your-user-pool-authentication-flow/).
