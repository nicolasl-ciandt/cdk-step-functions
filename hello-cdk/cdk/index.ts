#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HelloCdkStack } from '../cdk/stacks/hello-cdk-stack';

const app = new cdk.App();

new HelloCdkStack(app, 'HelloCdkStack', {});
