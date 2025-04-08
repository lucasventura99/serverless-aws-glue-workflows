const JobManager = require('../src/lib/job-manager');

describe('JobManager', () => {
  let jobManager;
  let mockPlugin;
  let mockResources;

  beforeEach(() => {
    
    mockPlugin = {
      serverless: {
        cli: {
          log: jest.fn(),
        },
      },
    };

    jobManager = new JobManager(mockPlugin);
    mockResources = {};
  });

  describe('addJobsToResources', () => {
    it('should not add any resources when no jobs are defined', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [],
      };

      
      jobManager.addJobsToResources(workflowName, workflow, mockResources);

      
      expect(Object.keys(mockResources).length).toBe(0);
    });

    it('should add job resources for each job in the workflow', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [
          {
            name: 'job1',
            role: 'arn:aws:iam::123456789012:role/GlueJobRole',
            scriptLocation: 's3://bucket/scripts/job1.py',
          },
          {
            name: 'job2',
            role: 'arn:aws:iam::123456789012:role/GlueJobRole',
            scriptLocation: 's3://bucket/scripts/job2.py',
            type: 'pythonshell',
            pythonVersion: '3.9',
            arguments: { '--key': 'value' },
            maxRetries: 2,
            timeout: 60,
            workers: 5,
            workerType: 'G.2X',
            glueVersion: '4.0',
          },
        ],
      };

      
      const addJobTriggerSpy = jest.spyOn(jobManager, 'addJobTrigger');

      
      jobManager.addJobsToResources(workflowName, workflow, mockResources);

      
      
      const job1LogicalId = jobManager.getJobLogicalId(workflowName, 'job1');
      const job2LogicalId = jobManager.getJobLogicalId(workflowName, 'job2');
      
      expect(mockResources[job1LogicalId]).toBeDefined();
      expect(mockResources[job2LogicalId]).toBeDefined();
      
      
      expect(mockResources[job1LogicalId].Type).toBe('AWS::Glue::Job');
      expect(mockResources[job1LogicalId].Properties.Name).toBe('job1');
      expect(mockResources[job1LogicalId].Properties.Command.Name).toBe('glueetl');
      expect(mockResources[job1LogicalId].Properties.Command.PythonVersion).toBe('3');
      
      
      expect(mockResources[job2LogicalId].Properties.Command.Name).toBe('pythonshell');
      expect(mockResources[job2LogicalId].Properties.Command.PythonVersion).toBe('3.9');
      expect(mockResources[job2LogicalId].Properties.DefaultArguments).toEqual({ '--key': 'value' });
      expect(mockResources[job2LogicalId].Properties.MaxRetries).toBe(2);
      expect(mockResources[job2LogicalId].Properties.Timeout).toBe(60);
      expect(mockResources[job2LogicalId].Properties.NumberOfWorkers).toBe(5);
      expect(mockResources[job2LogicalId].Properties.WorkerType).toBe('G.2X');
      expect(mockResources[job2LogicalId].Properties.GlueVersion).toBe('4.0');
      
      
      expect(addJobTriggerSpy).toHaveBeenCalledWith(
        workflowName,
        workflow.jobs[1],
        workflow.jobs[0],
        mockResources
      );
    });
  });

  describe('addJobTrigger', () => {
    it('should create a conditional trigger with default settings', () => {
      
      const workflowName = 'testWorkflow';
      const job = {
        name: 'job2',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job2.py',
      };
      const previousJob = {
        name: 'job1',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job1.py',
      };

      
      jobManager.addJobTrigger(workflowName, job, previousJob, mockResources);

      
      const triggerLogicalId = jobManager.getTriggerLogicalId(workflowName, job.name);
      expect(mockResources[triggerLogicalId]).toBeDefined();
      expect(mockResources[triggerLogicalId].Type).toBe('AWS::Glue::Trigger');
      expect(mockResources[triggerLogicalId].Properties.Type).toBe('CONDITIONAL');
      
      
      expect(mockResources[triggerLogicalId].Properties.Predicate.Logical).toBe('AND');
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions).toHaveLength(1);
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[0].State).toBe('SUCCEEDED');
      
      
      const previousJobLogicalId = jobManager.getJobLogicalId(workflowName, previousJob.name);
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[0].JobName.Ref).toBe(previousJobLogicalId);
    });

    it('should create a trigger with custom conditions', () => {
      
      const workflowName = 'testWorkflow';
      const job = {
        name: 'job2',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job2.py',
        conditions: [
          { JobName: 'job1', State: 'SUCCEEDED' },
          { JobName: 'job3', State: 'FAILED' },
        ],
        logical: 'OR',
      };
      const previousJob = {
        name: 'job1',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job1.py',
      };

      
      jobManager.addJobTrigger(workflowName, job, previousJob, mockResources);

      
      const triggerLogicalId = jobManager.getTriggerLogicalId(workflowName, job.name);
      expect(mockResources[triggerLogicalId].Properties.Predicate.Logical).toBe('OR');
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions).toHaveLength(2);
      
      
      const job1LogicalId = jobManager.getJobLogicalId(workflowName, 'job1');
      const job3LogicalId = jobManager.getJobLogicalId(workflowName, 'job3');
      
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[0].JobName.Ref).toBe(job1LogicalId);
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[0].State).toBe('SUCCEEDED');
      
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[1].JobName.Ref).toBe(job3LogicalId);
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[1].State).toBe('FAILED');
    });

    it('should create an ON_DEMAND trigger when triggerType is specified', () => {
      
      const workflowName = 'testWorkflow';
      const job = {
        name: 'job2',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job2.py',
        triggerType: 'ON_DEMAND',
      };
      const previousJob = {
        name: 'job1',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job1.py',
      };

      
      jobManager.addJobTrigger(workflowName, job, previousJob, mockResources);

      
      const triggerLogicalId = jobManager.getTriggerLogicalId(workflowName, job.name);
      expect(mockResources[triggerLogicalId].Properties.Type).toBe('ON_DEMAND');
      expect(mockResources[triggerLogicalId].Properties.Predicate).toBeUndefined();
    });
  });

  describe('normalizeResourceId', () => {
    it('should remove non-alphanumeric characters', () => {
      
      expect(jobManager.normalizeResourceId('test-workflow')).toBe('testworkflow');
      expect(jobManager.normalizeResourceId('test_workflow')).toBe('testworkflow');
      expect(jobManager.normalizeResourceId('test.workflow')).toBe('testworkflow');
      expect(jobManager.normalizeResourceId('test workflow')).toBe('testworkflow');
      expect(jobManager.normalizeResourceId('test123')).toBe('test123');
      expect(jobManager.normalizeResourceId('123test')).toBe('123test');
      expect(jobManager.normalizeResourceId('test!@#$%^&*()')).toBe('test');
    });
  });

  describe('getJobLogicalId', () => {
    it('should generate the correct logical ID for a job', () => {
      
      expect(jobManager.getJobLogicalId('test-workflow', 'job-1')).toBe('GlueJobtestworkflowjob1');
    });
  });

  describe('getTriggerLogicalId', () => {
    it('should generate the correct logical ID for a trigger', () => {
      
      expect(jobManager.getTriggerLogicalId('test-workflow', 'job-1')).toBe('GlueTriggertestworkflowjob1');
    });
  });

  describe('getWorkflowLogicalId', () => {
    it('should generate the correct logical ID for a workflow', () => {
      
      expect(jobManager.getWorkflowLogicalId('test-workflow')).toBe('GlueWorkflowtestworkflow');
    });
  });
});