const WorkflowManager = require('../src/lib/workflow-manager');

describe('WorkflowManager', () => {
  let workflowManager;
  let mockPlugin;

  beforeEach(() => {
    
    mockPlugin = {
      serverless: {
        cli: {
          log: jest.fn(),
        },
      },
    };

    workflowManager = new WorkflowManager(mockPlugin);
  });

  describe('validateWorkflowConfigurations', () => {
    it('should log a message when no workflows are found', () => {
      
      workflowManager.validateWorkflowConfigurations({});

      
      expect(mockPlugin.serverless.cli.log).toHaveBeenCalledWith(
        'No Glue Workflows configurations found.'
      );
    });

    it('should validate each workflow when workflows are provided', () => {
      
      const workflows = {
        workflow1: {
          description: 'Test workflow',
          jobs: [{ name: 'job1' }],
        },
        workflow2: {
          description: 'Another test workflow',
          jobs: [{ name: 'job2' }],
        },
      };

      
      const validateWorkflowSpy = jest.spyOn(workflowManager, 'validateWorkflow');

      
      workflowManager.validateWorkflowConfigurations(workflows);

      
      expect(validateWorkflowSpy).toHaveBeenCalledTimes(2);
      expect(validateWorkflowSpy).toHaveBeenCalledWith('workflow1', workflows.workflow1);
      expect(validateWorkflowSpy).toHaveBeenCalledWith('workflow2', workflows.workflow2);
    });
  });

  describe('validateWorkflow', () => {
    it('should throw an error when description is missing', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        jobs: [{ name: 'job1' }],
      };

      
      expect(() => {
        workflowManager.validateWorkflow(workflowName, workflow);
      }).toThrow(`Workflow ${workflowName} is missing description`);
    });

    it('should throw an error when jobs are missing', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
      };

      
      expect(() => {
        workflowManager.validateWorkflow(workflowName, workflow);
      }).toThrow(`Workflow ${workflowName} must have at least one job defined`);
    });

    it('should throw an error when jobs array is empty', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [],
      };

      
      expect(() => {
        workflowManager.validateWorkflow(workflowName, workflow);
      }).toThrow(`Workflow ${workflowName} must have at least one job defined`);
    });

    it('should validate crawlers when they are defined', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [{ name: 'job1' }],
        crawlers: [{ name: 'crawler1' }],
      };

      
      const validateCrawlersSpy = jest.spyOn(workflowManager, 'validateCrawlers');

      
      try {
        workflowManager.validateWorkflow(workflowName, workflow);
      } catch (error) {
        
        
      }

      
      expect(validateCrawlersSpy).toHaveBeenCalledWith(workflowName, workflow.crawlers);
    });
  });

  describe('validateCrawlers', () => {
    it('should throw an error when crawler name is missing', () => {
      
      const workflowName = 'testWorkflow';
      const crawlers = [{}];

      
      expect(() => {
        workflowManager.validateCrawlers(workflowName, crawlers);
      }).toThrow(`Crawler at index 0 in workflow ${workflowName} is missing name`);
    });

    it('should throw an error when crawler role is missing', () => {
      
      const workflowName = 'testWorkflow';
      const crawlers = [{ name: 'crawler1' }];

      
      expect(() => {
        workflowManager.validateCrawlers(workflowName, crawlers);
      }).toThrow(`Crawler crawler1 in workflow ${workflowName} is missing role`);
    });

    it('should throw an error when crawler targets are missing', () => {
      
      const workflowName = 'testWorkflow';
      const crawlers = [{ name: 'crawler1', role: 'role1' }];

      
      expect(() => {
        workflowManager.validateCrawlers(workflowName, crawlers);
      }).toThrow(`Crawler crawler1 in workflow ${workflowName} is missing targets`);
    });

    it('should throw an error when crawler databaseName is missing', () => {
      
      const workflowName = 'testWorkflow';
      const crawlers = [{ name: 'crawler1', role: 'role1', targets: {} }];

      
      expect(() => {
        workflowManager.validateCrawlers(workflowName, crawlers);
      }).toThrow(`Crawler crawler1 in workflow ${workflowName} is missing databaseName`);
    });

    it('should not throw an error when all required crawler fields are present', () => {
      
      const workflowName = 'testWorkflow';
      const crawlers = [{
        name: 'crawler1',
        role: 'role1',
        targets: {},
        databaseName: 'database1',
      }];

      
      expect(() => {
        workflowManager.validateCrawlers(workflowName, crawlers);
      }).not.toThrow();
    });
  });
});