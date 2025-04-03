# Serverless AWS Glue Workflows Plugin

A Serverless Framework plugin to add support for managing AWS Glue Workflows, simplifying the integration and deployment of ETL workflows in AWS.

## Features
- Define and deploy AWS Glue Workflows directly in your Serverless configuration
- Automate the creation of Glue jobs and triggers
- Support for AWS Glue Crawlers with automatic trigger configuration
- Simplified workflow management through serverless.yml

## Installation

```bash
npm install --save-dev serverless-aws-glue-workflows
```

### Add the plugin to your serverless.yml:
```yaml
plugins:
  - serverless-aws-glue-workflows
```

## Usage

Configure your Glue workflows in the `custom` section of your `serverless.yml` file:

```yaml
custom:
  glueWorkflows:
    myWorkflow:
      description: My ETL Workflow
      tags:
        environment: production
        project: data-analytics
      # Optional: Skip auto-creation of crawler triggers
      skipCrawlerTriggers: false
      triggers:
        - name: daily-trigger
          type: SCHEDULED
          schedule: cron(0 1 * * ? *)
          enabled: true
          description: "Triggers the workflow daily at 1 AM"
          actions:
            - jobName: my-job
              arguments:
                --source: s3://my-bucket/raw-data/
      crawlers:
        - name: my-crawler
          role: ${self:provider.iam.role.name}
          databaseName: my_database
          targets:
            S3Targets:
              - Path: s3://my-bucket/raw-data/
          schedule: cron(0 1 * * ? *)
      jobs:
        - name: my-job
          role: ${self:provider.iam.role.name}
          type: glueetl
          scriptLocation: s3://my-bucket/scripts/my-script.py
          workers: 2
          workerType: G.1X
          timeout: 60
          maxRetries: 1
          arguments:
            --source: s3://my-bucket/raw-data/
            --target: s3://my-bucket/processed-data/
        - name: my-second-job
          role: ${self:provider.iam.role.name}
          type: glueetl
          scriptLocation: s3://my-bucket/scripts/second-script.py
          workers: 2
          workerType: G.1X
          timeout: 60
          maxRetries: 1
          arguments:
            --source: s3://my-bucket/processed-data/
            --target: s3://my-bucket/final-data/
```

### Configuration Options

#### Workflow Configuration
- `description` (required): Description of the workflow
- `tags` (optional): Key-value pairs for tagging the workflow
- `crawlers` (optional): Array of Glue crawlers in the workflow
- `jobs` (required): Array of Glue jobs in the workflow

#### Crawler Configuration
- `name` (required): Name of the Glue crawler
- `role` (required): IAM role ARN for the crawler
- `databaseName` (required): Name of the Glue catalog database
- `targets` (required): Crawler targets (S3Targets, JdbcTargets, etc.)
- `schedule` (optional): Cron expression for crawler schedule
- `schemaChangePolicy` (optional): Policy for handling schema changes
- `configuration` (optional): Additional crawler configuration
- `securityConfiguration` (optional): Security configuration name
- `tags` (optional): Key-value pairs for tagging the crawler

#### Job Configuration
- `name` (required): Name of the Glue job
- `role` (required): IAM role ARN for the job
- `type` (optional): Job type (default: 'glueetl')
- `scriptLocation` (required): S3 location of the job script
- `pythonVersion` (optional): Python version (default: '3')
- `arguments` (optional): Job arguments
- `maxRetries` (optional): Maximum number of retries (default: 0)
- `timeout` (optional): Timeout in minutes (default: 2880)
- `workers` (optional): Number of workers (default: 2)
- `workerType` (optional): Worker type (default: 'G.1X')
- `glueVersion` (optional): Glue version (default: '3.0')

## How It Works

The plugin automatically:
1. Validates your workflow configurations
2. Creates AWS CloudFormation resources for workflows, crawlers, jobs, and triggers
3. Sets up job dependencies based on the order in the jobs array
4. Configures crawler triggers to run before the first job in the workflow

## Debugging
The plugin includes detailed logging to help troubleshoot issues during deployment. You'll see logs for:

- Workflow validation
- Resource creation for jobs, crawlers, and triggers
- Predicate configuration for triggers

### Advanced Configuration Options Skip Crawler Triggers
If you want to skip the automatic creation of crawler triggers, you can add the skipCrawlerTriggers option to your workflow:

```yaml
custom:
  glueWorkflows:
    myWorkflow:
      description: My ETL Workflow
      skipCrawlerTriggers: true
      # rest of your configuration...
 ```

## IAM Role Configuration
Make sure to configure the IAM role with the necessary permissions:

```yaml
provider:
  name: aws
  iam:
    role:
      name: ${self:service}-GlueServiceRole
      managedPolicies:
        - 'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole'
      statements:
        - Effect: Allow
          Action:
            - glue:*
            - s3:*
            - iam:PassRole
          Resource: "*"
 ```
## Troubleshooting
If you encounter issues with trigger creation, check that:

1. The Predicate configuration includes a Logical operator (AND/OR)
2. Job and crawler references are correct
3. The IAM role has sufficient permissions
For more detailed logs during deployment, use the --verbose flag:

```bash
serverless deploy --verbose
 ```

## License

ISC
