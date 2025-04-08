const ResourceGenerator = require('../src/lib/resource-generator');

describe('ResourceGenerator', () => {
  let resourceGenerator;
  let mockPlugin;

  beforeEach(() => {
    
    mockPlugin = {
      serverless: {
        cli: {
          log: jest.fn(),
        },
      },
      service: {},
      crawlerManager: {
        addCrawlersToResources: jest.fn(),
      },
      jobManager: {
        addJobsToResources: jest.fn(),
      },
    };

    resourceGenerator = new ResourceGenerator(mockPlugin);
  });

  describe('prepareWorkflowResources', () => {
    it('should not modify resources when no workflows are defined', () => {
      
      const workflows = {};

      
      resourceGenerator.prepareWorkflowResources(workflows);

      
      expect(mockPlugin.service.resources).toBeUndefined();
    });

    it('should create workflow resources for each workflow', () => {
      
      const workflows = {
        workflow1: {
          description: 'Test workflow 1',
          jobs: [{ name: 'job1' }],
        },
        workflow2: {
          description: 'Test workflow 2',
          jobs: [{ name: 'job2' }],
          tags: { Environment: 'test' },
        },
      };

      
      resourceGenerator.normalizeResourceId = jest.fn(str => str);

      
      resourceGenerator.prepareWorkflowResources(workflows);

      
      expect(mockPlugin.service.resources).toBeDefined();
      expect(mockPlugin.service.resources.Resources).toBeDefined();
      
      
      const workflow1LogicalId = resourceGenerator.getWorkflowLogicalId('workflow1');
      expect(mockPlugin.service.resources.Resources[workflow1LogicalId]).toBeDefined();
      expect(mockPlugin.service.resources.Resources[workflow1LogicalId].Type).toBe('AWS::Glue::Workflow');
      expect(mockPlugin.service.resources.Resources[workflow1LogicalId].Properties.Name).toBe('workflow1');
      expect(mockPlugin.service.resources.Resources[workflow1LogicalId].Properties.Description).toBe('Test workflow 1');
      expect(mockPlugin.service.resources.Resources[workflow1LogicalId].Properties.Tags).toEqual({});
      
      
      const workflow2LogicalId = resourceGenerator.getWorkflowLogicalId('workflow2');
      expect(mockPlugin.service.resources.Resources[workflow2LogicalId].Properties.Tags).toEqual({ Environment: 'test' });
      
      
      expect(mockPlugin.jobManager.addJobsToResources).toHaveBeenCalledTimes(2);
      expect(mockPlugin.jobManager.addJobsToResources).toHaveBeenCalledWith(
        'workflow1',
        workflows.workflow1,
        mockPlugin.service.resources.Resources
      );
      expect(mockPlugin.jobManager.addJobsToResources).toHaveBeenCalledWith(
        'workflow2',
        workflows.workflow2,
        mockPlugin.service.resources.Resources
      );
    });

    it('should call crawlerManager when crawlers are defined', () => {
      
      const workflows = {
        workflow1: {
          description: 'Test workflow with crawlers',
          jobs: [{ name: 'job1' }],
          crawlers: [{ name: 'crawler1' }],
        },
      };

      
      resourceGenerator.prepareWorkflowResources(workflows);

      
      expect(mockPlugin.crawlerManager.addCrawlersToResources).toHaveBeenCalledWith(
        'workflow1',
        workflows.workflow1,
        mockPlugin.service.resources.Resources
      );
    });

    it('should not call crawlerManager when no crawlers are defined', () => {
      
      const workflows = {
        workflow1: {
          description: 'Test workflow without crawlers',
          jobs: [{ name: 'job1' }],
        },
      };

      
      resourceGenerator.prepareWorkflowResources(workflows);

      
      expect(mockPlugin.crawlerManager.addCrawlersToResources).not.toHaveBeenCalled();
    });
  });

  describe('getWorkflowLogicalId', () => {
    it('should generate the correct logical ID for a workflow', () => {
      
      resourceGenerator.normalizeResourceId = jest.fn(str => str.replace(/[^a-zA-Z0-9]/g, ''));

      
      expect(resourceGenerator.getWorkflowLogicalId('test-workflow')).toBe('GlueWorkflowtestworkflow');
    });
  });

  describe('normalizeResourceId', () => {
    it('should remove non-alphanumeric characters', () => {
      
      expect(resourceGenerator.normalizeResourceId('test-workflow')).toBe('testworkflow');
      expect(resourceGenerator.normalizeResourceId('test_workflow')).toBe('testworkflow');
      expect(resourceGenerator.normalizeResourceId('test.workflow')).toBe('testworkflow');
      expect(resourceGenerator.normalizeResourceId('test workflow')).toBe('testworkflow');
      expect(resourceGenerator.normalizeResourceId('test123')).toBe('test123');
      expect(resourceGenerator.normalizeResourceId('123test')).toBe('123test');
      expect(resourceGenerator.normalizeResourceId('test!@#$%^&*()')).toBe('test');
    });
  });
});