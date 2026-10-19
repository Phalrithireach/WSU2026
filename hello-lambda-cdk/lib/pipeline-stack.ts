import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { WebHealthStage } from './web-health-stage';
import * as iam from 'aws-cdk-lib/aws-iam';

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

    // ------------------------------------------------------------
    // Week 10 - Unit + Functional Test Blocker
    // BetaGamma will NOT deploy if these tests fail.
    // ------------------------------------------------------------
    const betaGammaTestBlocker =
      new pipelines.ShellStep(
        'UnitFunctionalTestBlocker',
        {
          input: source,

          commands: [
            'cd hello-lambda-cdk',
            'python3 -m pip install -r requirements-dev.txt',
            'python3 -m pytest python-tests/test_unit.py -v',
            'python3 -m pytest python-tests/test_functional.py -v',
          ],
        }
      );

    pipeline.addStage(betaGammaStage, {
      pre: [
        betaGammaTestBlocker,
      ],
    });

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

    // ------------------------------------------------------------
    // Week 10 - Integration Test Blocker
    // Production will NOT continue if integration tests fail.
    // ------------------------------------------------------------
    const integrationTestBlocker =
      new pipelines.CodeBuildStep(
        'IntegrationTestBlocker',
        {
          input: source,
          envFromCfnOutputs: {
            API_TARGETS_URL: betaGammaStage.webHealthStack.crudApiUrlOutput,
          },

rolePolicyStatements: [
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['execute-api:Invoke'],
    resources: [
      `arn:${cdk.Aws.PARTITION}:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:or9n0whdv9/prod/POST/targets`,
      `arn:${cdk.Aws.PARTITION}:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:or9n0whdv9/prod/PUT/targets/*`,
      `arn:${cdk.Aws.PARTITION}:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:or9n0whdv9/prod/DELETE/targets/*`,
    ],
  }),
],

          commands: [
            'cd hello-lambda-cdk',
            'python3 -m pip install -r requirements-dev.txt',
            'python3 -m pytest python-tests/test_integration.py -v',
          ],
        }
      );

    // ------------------------------------------------------------
    // Manual Production Approval
    // This only becomes available after integration tests pass.
    // ------------------------------------------------------------
    const productionApproval =
      new pipelines.ManualApprovalStep(
        'ApproveProductionDeployment'
      );

    productionApproval.addStepDependency(
      integrationTestBlocker
    );

    pipeline.addStage(prodStage, {
      pre: [
        integrationTestBlocker,
        productionApproval,
      ],
    });
  }
}