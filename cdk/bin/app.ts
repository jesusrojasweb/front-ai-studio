#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { FrontAiStudioStack } from '../lib/front-ai-studio-stack'

const app = new cdk.App()
new FrontAiStudioStack(app, 'FrontAiStudioStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
})
