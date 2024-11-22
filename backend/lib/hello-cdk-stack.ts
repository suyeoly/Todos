import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    const bucket = new s3.Bucket(this, 'MyNuxtBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'MyDistribution', {
      defaultBehavior: {
        origin: new origins.S3StaticWebsiteOrigin(bucket),
        // viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // Deploy the Nuxt.js app to the S3 bucket
    const websiteDeploy = new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('../frontend/.nuxt/dist')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Create DynamoDB table
    const todoTable = new dynamodb.Table(this, 'TodoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'todos',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add CORS settings to Lambda URL
    const corsConfig = {
      allowedOrigins: ['*'], // Allow all origins. Replace with specific domain if needed
      allowedMethods: [ // Specify allowed HTTP methods
        lambda.HttpMethod.GET,
        lambda.HttpMethod.POST,
        lambda.HttpMethod.DELETE,
      ],
      allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    };

    // addTodo function
    // Define the Lambda function resource
    const addTodoFunction = new lambda.Function(this, "AddTodoFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "addTodo.handler",
      code: lambda.Code.fromAsset("lambda/addTodo"),
    });

    // Define the Lambda function URL resource
    const addTodoFunctionUrl = addTodoFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: corsConfig,
    });

    todoTable.grantReadWriteData(addTodoFunction);
    addTodoFunction.addEnvironment('TABLE_NAME', todoTable.tableName);

    // Define a CloudFormation output for your URL
    new cdk.CfnOutput(this, "addTodoFunctionUrlOutput", {
      value: addTodoFunctionUrl.url,
      description: "The URL of the addTodo function",
    });

    // deleteTodo function
    const deleteTodoFunction = new lambda.Function(this, "DeleteTodoFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "deleteTodo.handler",
      code: lambda.Code.fromAsset("lambda/deleteTodo"),
    });

    const deleteTodoFunctionUrl = deleteTodoFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: corsConfig,
    });

    todoTable.grantReadWriteData(deleteTodoFunction);
    deleteTodoFunction.addEnvironment('TABLE_NAME', todoTable.tableName);

    new cdk.CfnOutput(this, "deleteTodoFunctionUrlOutput", {
      value: deleteTodoFunctionUrl.url,
      description: "The URL of the deleteTodo function",
    });

    // getTodo function
    const getTodoFunction = new lambda.Function(this, "GetTodoFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getTodo.handler",
      code: lambda.Code.fromAsset("lambda/getTodo"),
    });

    const getTodoFunctionUrl = getTodoFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: corsConfig,
    });

    todoTable.grantReadWriteData(getTodoFunction);
    getTodoFunction.addEnvironment('TABLE_NAME', todoTable.tableName);

    new cdk.CfnOutput(this, "getTodoFunctionUrlOutput", {
      value: getTodoFunctionUrl.url,
      description: "The URL of the getTodo function",
    });

    // Output the CloudFront distribution URL
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.domainName,
    });
  }
}