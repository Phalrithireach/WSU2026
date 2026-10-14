import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HelloLambdaCdkStack } from './hello-lambda-cdk-stack';

export interface WebHealthStageProps extends cdk.StageProps {
  environmentName: string;
}

export class WebHealthStage extends cdk.Stage {
  public readonly webHealthStack: HelloLambdaCdkStack;

  constructor(
    scope: Construct,
    id: string,
    props: WebHealthStageProps
  ) {
    super(scope, id, props);

    this.webHealthStack = new HelloLambdaCdkStack(
      this,
      'WebHealthStack',
      {
        environmentName: props.environmentName,
      }
    );
  }
}