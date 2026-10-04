import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { WebHealthStage } from './web-health-stage';

export class PipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // ------------------------------------------------------------
    // GitHub Source
    // ------------------------------------------------------------
    const source = pipelines.CodePipelineSource.gitHub(
      'Phalrithireach/WSU2026',
      'main',
      {
        authentication:
          cdk.SecretValue.secretsManager('github-token'),
      }
    );

    // ------------------------------------------------------------
    // CI/CD Pipeline
    // ------------------------------------------------------------
    const pipeline = new pipelines.CodePipeline(
      this,
      'WebHealthPipeline',
      {
        pipelineName: 'WSU2026-WebHealth-Pipeline',

        synth: new pipelines.ShellStep('BuildTestSynth', {
          input: source,

          commands: [
            'cd hello-lambda-cdk',
            'npm ci',
            'npm run build',
            'npm test',
            'npx cdk synth',
          ],

          primaryOutputDirectory:
            'hello-lambda-cdk/cdk.out',
        }),
      }
    );

    // ------------------------------------------------------------
    // Beta / Gamma Stage
    // ------------------------------------------------------------
    const betaGammaStage = new WebHealthStage(
      this,
      'BetaGamma',
      {
        environmentName: 'BetaGamma',

        env: {
          account: this.account,
          region: this.region,
        },
      }
    );

    pipeline.addStage(betaGammaStage);

    // ------------------------------------------------------------
    // Production Stage
    // ------------------------------------------------------------
    const prodStage = new WebHealthStage(
      this,
      'Prod',
      {
        environmentName: 'Prod',

        env: {
          account: this.account,
          region: this.region,
        },
      }
    );

    pipeline.addStage(prodStage, {
      pre: [
        new pipelines.ManualApprovalStep(
          'ApproveProductionDeployment'
        ),
      ],
    });
  }
}