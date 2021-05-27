import * as cdk from '@aws-cdk/core';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as lambda from '@aws-cdk/aws-lambda';
import { LogGroup } from '@aws-cdk/aws-logs'
import * as path from 'path';
import { LogOptions } from '@aws-cdk/aws-stepfunctions';

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const submitProps = {
      functionName: 'Submit',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('cdk/stacks/lambdas/lambda'),
    }

    const checkProps = {
      functionName: 'Check',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('cdk/stacks/lambdas/lambda'),
    }

    const submitLambda = new lambda.Function(this, 'SubmitLambda', submitProps);
    const getStatusLambda = new lambda.Function(this, 'CheckLambda', checkProps);

    const submitJob = new tasks.LambdaInvoke(this, 'Submit Job', {
      lambdaFunction: submitLambda,
      outputPath: '$.Payload'
    });

    const waitX = new sfn.Wait(this, 'Wait X Seconds', {
      time: sfn.WaitTime.secondsPath('$.waitSeconds')
    });

    const getStatus = new tasks.LambdaInvoke(this, 'Get Job Status', {
      lambdaFunction: getStatusLambda,
      // Pass just the field named "guid" into the Lambda, put the
      // Lambda's result in a field called "status" in the response
      inputPath: '$.guid',
      outputPath: '$.Payload',
    });

    const jobFailed = new sfn.Fail(this, 'Job Failed', {
      cause: 'AWS Batch Job Failed',
      error: 'DescribeJob returned FAILED',
    });

    const finalStatus = new tasks.LambdaInvoke(this, 'Get Final Job Status', {
      lambdaFunction: getStatusLambda,
      inputPath: '$.guid',
      outputPath: '$.Payload',
    });

    const definition = submitJob
      .next(waitX)
      .next(getStatus)
      .next(new sfn.Choice(this, 'Job Complete?')
        // Look at the "status" field
        .when(sfn.Condition.stringEquals('$.status', 'FAILED'), jobFailed)
        .when(sfn.Condition.stringEquals('$.status', 'SUCCEEDED'), finalStatus)
        .otherwise(waitX));

    const logGroup = new LogGroup(this, 'MyLogGroup');

    const logs: LogOptions = {
      destination: logGroup,
      level: sfn.LogLevel.ALL,
    }

    new sfn.StateMachine(this, 'StateMachine', {
      definition,
      logs
    });
  }
}
