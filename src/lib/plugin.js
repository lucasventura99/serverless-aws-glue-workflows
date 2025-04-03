import WorkflowManager from './workflow-manager.js';
import CrawlerManager from './crawler-manager.js';
import JobManager from './job-manager.js';
import ResourceGenerator from './resource-generator.js';

class ServerlessAWSGlueWorkflows {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');
    this.service = this.serverless.service;
    
    this.workflowManager = new WorkflowManager(this);
    this.crawlerManager = new CrawlerManager(this);
    this.jobManager = new JobManager(this);
    this.resourceGenerator = new ResourceGenerator(this);

    this.hooks = {
      'initialize': this.initialize.bind(this),
      'before:package:initialize': this.beforePackage.bind(this),
      'after:package:initialize': this.afterPackage.bind(this),
      'before:deploy:deploy': this.beforeDeploy.bind(this),
    };
  }

  initialize() {
    this.serverless.cli.log('Initializing AWS Glue Workflows plugin...');
    this.workflows = this.service.custom?.glueWorkflows || {};
  }

  beforePackage() {
    this.serverless.cli.log('Preparing AWS Glue Workflows...');
    this.workflowManager.validateWorkflowConfigurations(this.workflows);
  }

  afterPackage() {
    this.serverless.cli.log('Processing AWS Glue Workflows configurations...');
    this.resourceGenerator.prepareWorkflowResources(this.workflows);
  }

  beforeDeploy() {
    this.serverless.cli.log('Deploying AWS Glue Workflows...');
  }
}

export default ServerlessAWSGlueWorkflows;