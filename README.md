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
      crawlers:
        - name: source-data-crawler
          role: arn:aws:iam::123456789012:role/GlueCrawlerRole
          databaseName: my_catalog_database
          targets:
            S3Targets:
              - Path: s3://my-bucket/source-data/
          schedule: cron(0 1 * * ? *)
          schemaChangePolicy:
            UpdateBehavior: UPDATE_IN_DATABASE
            DeleteBehavior: DEPRECATE_IN_DATABASE

      jobs:
        - name: transform-data
          role: arn:aws:iam::123456789012:role/GlueETLRole
          type: glueetl
          scriptLocation: s3://my-bucket/scripts/transform.py
          workers: 2
          workerType: G.1X
          timeout: 60
          maxRetries: 1
          arguments:
            --source: s3://source-bucket
            --target: s3://target-bucket
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

## License

ISC
