const ServerlessAWSGlueWorkflows = require('../index');
const WorkflowManager = require('../src/lib/workflow-manager');
const CrawlerManager = require('../src/lib/crawler-manager');
const JobManager = require('../src/lib/job-manager');
const ResourceGenerator = require('../src/lib/resource-generator');


jest.mock('../src/lib/workflow-manager');
jest.mock('../src/lib/crawler-manager');
jest.mock('../src/lib/job-manager');
jest.mock('../src/lib/resource-generator');

describe('ServerlessAWSGlueWorkflows', () => {
  let serverless;
  let options;
  let plugin;

  beforeEach(() => {
    
    jest.clearAllMocks();
    
    serverless = {
      getProvider: jest.fn().mockReturnValue({}),
      service: {
        custom: {
          glueWorkflows: {
            workflow1: {
              description: 'Test workflow',
              jobs: [{ name: 'job1' }],
            },
          },
        },
      },
      cli: {
        log: jest.fn(),
      },
    };

    options = {};
    plugin = new ServerlessAWSGlueWorkflows(serverless, options);
  });

  describe('constructor', () => {
    it('should initialize the plugin correctly', () => {
      
      expect(plugin.serverless).toBe(serverless);
      expect(plugin.options).toBe(options);
      expect(plugin.provider).toBeDefined();
      expect(plugin.service).toBe(serverless.service);
      
      
      expect(WorkflowManager).toHaveBeenCalledWith(plugin);
      expect(CrawlerManager).toHaveBeenCalledWith(plugin);
      expect(JobManager).toHaveBeenCalledWith(plugin);
      expect(ResourceGenerator).toHaveBeenCalledWith(plugin);
      
      
      expect(plugin.hooks).toMatchObject({
        'initialize': expect.any(Function),
        'before:package:initialize': expect.any(Function),
        'after:package:initialize': expect.any(Function),
        'before:deploy:deploy': expect.any(Function),
      });
    });
  });

  describe('initialize', () => {
    it('should set workflows from custom config', () => {
      plugin.initialize();
      expect(serverless.cli.log).toHaveBeenCalledWith('Initializing AWS Glue Workflows plugin...');
      expect(plugin.workflows).toEqual(serverless.service.custom.glueWorkflows);
    });

    it('should set workflows to empty object when config is missing', () => {
      serverless.service.custom = {};
      plugin = new ServerlessAWSGlueWorkflows(serverless, options);
      plugin.initialize();
      expect(plugin.workflows).toEqual({});
    });
  });

  describe('lifecycle hooks', () => {
    beforeEach(() => {
      plugin.initialize();
    });
    
    it('should validate workflow configurations before packaging', () => {
      plugin.beforePackage();
      expect(serverless.cli.log).toHaveBeenCalledWith('Preparing AWS Glue Workflows...');
      expect(plugin.workflowManager.validateWorkflowConfigurations).toHaveBeenCalledWith(plugin.workflows);
    });

    it('should prepare workflow resources after packaging', () => {
      plugin.afterPackage();
      expect(serverless.cli.log).toHaveBeenCalledWith('Processing AWS Glue Workflows configurations...');
      expect(plugin.resourceGenerator.prepareWorkflowResources).toHaveBeenCalledWith(plugin.workflows);
    });

    it('should log deployment message before deploy', () => {
      plugin.beforeDeploy();
      expect(serverless.cli.log).toHaveBeenCalledWith('Deploying AWS Glue Workflows...');
    });
  });
});