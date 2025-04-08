const CrawlerManager = require('../src/lib/crawler-manager');

describe('CrawlerManager', () => {
  let crawlerManager;
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

    crawlerManager = new CrawlerManager(mockPlugin);
    mockResources = {};
  });

  describe('addCrawlersToResources', () => {
    it('should not add any resources when no crawlers are defined', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [{ name: 'job1' }],
      };

      
      crawlerManager.addCrawlersToResources(workflowName, workflow, mockResources);

      
      expect(Object.keys(mockResources).length).toBe(0);
    });

    it('should add crawler resources for each crawler in the workflow', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [{ name: 'job1', role: 'role1', scriptLocation: 's3://bucket/script.py' }],
        crawlers: [
          {
            name: 'crawler1',
            role: 'arn:aws:iam::123456789012:role/GlueCrawlerRole',
            databaseName: 'testDatabase',
            targets: { S3Targets: [{ Path: 's3://bucket/path' }] },
          },
          {
            name: 'crawler2',
            role: 'arn:aws:iam::123456789012:role/GlueCrawlerRole',
            databaseName: 'testDatabase',
            targets: { JdbcTargets: [{ ConnectionName: 'jdbc-connection', Path: 'database/table' }] },
            schedule: 'cron(0 0 * * ? *)',
            schemaChangePolicy: {
              UpdateBehavior: 'LOG',
              DeleteBehavior: 'LOG',
            },
            configuration: { Version: 1 },
            securityConfiguration: 'securityConfig',
            tags: { Environment: 'test' },
          },
        ],
      };

      
      const addCrawlerTriggerSpy = jest.spyOn(crawlerManager, 'addCrawlerTrigger');
      const addCrawlerToJobTriggerSpy = jest.spyOn(crawlerManager, 'addCrawlerToJobTrigger');

      
      crawlerManager.addCrawlersToResources(workflowName, workflow, mockResources);

      
      
      const crawler1LogicalId = crawlerManager.getCrawlerLogicalId(workflowName, 'crawler1');
      const crawler2LogicalId = crawlerManager.getCrawlerLogicalId(workflowName, 'crawler2');
      
      expect(mockResources[crawler1LogicalId]).toBeDefined();
      expect(mockResources[crawler2LogicalId]).toBeDefined();
      
      
      expect(mockResources[crawler1LogicalId].Type).toBe('AWS::Glue::Crawler');
      expect(mockResources[crawler1LogicalId].Properties.Name).toBe('crawler1');
      expect(mockResources[crawler1LogicalId].Properties.Role).toBe('arn:aws:iam::123456789012:role/GlueCrawlerRole');
      expect(mockResources[crawler1LogicalId].Properties.DatabaseName).toBe('testDatabase');
      expect(mockResources[crawler1LogicalId].Properties.Targets).toEqual({ S3Targets: [{ Path: 's3://bucket/path' }] });
      expect(mockResources[crawler1LogicalId].Properties.SchemaChangePolicy).toEqual({
        UpdateBehavior: 'UPDATE_IN_DATABASE',
        DeleteBehavior: 'DEPRECATE_IN_DATABASE',
      });
      
      
      expect(mockResources[crawler2LogicalId].Properties.Schedule).toBe('cron(0 0 * * ? *)');
      expect(mockResources[crawler2LogicalId].Properties.SchemaChangePolicy).toEqual({
        UpdateBehavior: 'LOG',
        DeleteBehavior: 'LOG',
      });
      expect(mockResources[crawler2LogicalId].Properties.Configuration).toEqual({ Version: 1 });
      expect(mockResources[crawler2LogicalId].Properties.CrawlerSecurityConfiguration).toBe('securityConfig');
      expect(mockResources[crawler2LogicalId].Properties.Tags).toEqual({ Environment: 'test' });
      
      
      expect(addCrawlerTriggerSpy).toHaveBeenCalledWith(workflowName, workflow.crawlers[0], mockResources);
      expect(addCrawlerToJobTriggerSpy).toHaveBeenCalledWith(
        workflowName,
        workflow.crawlers[0],
        workflow.jobs[0],
        mockResources
      );
    });

    it('should not create triggers when skipCrawlerTriggers is true', () => {
      
      const workflowName = 'testWorkflow';
      const workflow = {
        description: 'Test workflow',
        jobs: [{ name: 'job1', role: 'role1', scriptLocation: 's3://bucket/script.py' }],
        crawlers: [
          {
            name: 'crawler1',
            role: 'arn:aws:iam::123456789012:role/GlueCrawlerRole',
            databaseName: 'testDatabase',
            targets: { S3Targets: [{ Path: 's3://bucket/path' }] },
          },
        ],
        skipCrawlerTriggers: true,
      };

      
      const addCrawlerTriggerSpy = jest.spyOn(crawlerManager, 'addCrawlerTrigger');
      const addCrawlerToJobTriggerSpy = jest.spyOn(crawlerManager, 'addCrawlerToJobTrigger');

      
      crawlerManager.addCrawlersToResources(workflowName, workflow, mockResources);

      
      expect(addCrawlerTriggerSpy).not.toHaveBeenCalled();
      expect(addCrawlerToJobTriggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('addCrawlerTrigger', () => {
    it('should create an ON_DEMAND trigger for a crawler', () => {
      
      const workflowName = 'testWorkflow';
      const crawler = {
        name: 'crawler1',
        role: 'arn:aws:iam::123456789012:role/GlueCrawlerRole',
        databaseName: 'testDatabase',
        targets: { S3Targets: [{ Path: 's3://bucket/path' }] },
      };

      
      crawlerManager.getWorkflowLogicalId = jest.fn().mockReturnValue('GlueWorkflowtestWorkflow');

      
      crawlerManager.addCrawlerTrigger(workflowName, crawler, mockResources);

      
      const triggerLogicalId = crawlerManager.getTriggerLogicalId(workflowName, crawler.name);
      expect(mockResources[triggerLogicalId]).toBeDefined();
      expect(mockResources[triggerLogicalId].Type).toBe('AWS::Glue::Trigger');
      expect(mockResources[triggerLogicalId].Properties.Type).toBe('ON_DEMAND');
      expect(mockResources[triggerLogicalId].Properties.WorkflowName.Ref).toBe('GlueWorkflowtestWorkflow');
      
      
      expect(mockResources[triggerLogicalId].Properties.Actions).toHaveLength(1);
      expect(mockResources[triggerLogicalId].Properties.Actions[0].CrawlerName).toBeDefined();
    });
  });

  describe('addCrawlerToJobTrigger', () => {
    it('should create a trigger connecting a crawler to a job', () => {
      
      const workflowName = 'testWorkflow';
      const crawler = {
        name: 'crawler1',
        role: 'arn:aws:iam::123456789012:role/GlueCrawlerRole',
        databaseName: 'testDatabase',
        targets: { S3Targets: [{ Path: 's3://bucket/path' }] },
      };
      const job = {
        name: 'job1',
        role: 'arn:aws:iam::123456789012:role/GlueJobRole',
        scriptLocation: 's3://bucket/scripts/job1.py',
      };

      
      crawlerManager.getWorkflowLogicalId = jest.fn().mockReturnValue('GlueWorkflowtestWorkflow');

      
      crawlerManager.addCrawlerToJobTrigger(workflowName, crawler, job, mockResources);

      
      const triggerLogicalId = `GlueTrigger${crawlerManager.normalizeResourceId(workflowName)}${crawlerManager.normalizeResourceId(crawler.name)}ToJob${crawlerManager.normalizeResourceId(job.name)}`;
      expect(mockResources[triggerLogicalId]).toBeDefined();
      expect(mockResources[triggerLogicalId].Type).toBe('AWS::Glue::Trigger');
      expect(mockResources[triggerLogicalId].Properties.Type).toBe('CONDITIONAL');
      expect(mockResources[triggerLogicalId].Properties.WorkflowName.Ref).toBe('GlueWorkflowtestWorkflow');
      
      
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions).toHaveLength(1);
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[0].CrawlerName).toBeDefined();
      expect(mockResources[triggerLogicalId].Properties.Predicate.Conditions[0].CrawlState).toBe('SUCCEEDED');
      
      
      expect(mockResources[triggerLogicalId].Properties.Actions).toHaveLength(1);
      expect(mockResources[triggerLogicalId].Properties.Actions[0].JobName).toBeDefined();
    });
  });

  describe('normalizeResourceId', () => {
    it('should remove non-alphanumeric characters', () => {
      
      expect(crawlerManager.normalizeResourceId('test-crawler')).toBe('testcrawler');
      expect(crawlerManager.normalizeResourceId('test_crawler')).toBe('testcrawler');
      expect(crawlerManager.normalizeResourceId('test.crawler')).toBe('testcrawler');
      expect(crawlerManager.normalizeResourceId('test crawler')).toBe('testcrawler');
      expect(crawlerManager.normalizeResourceId('test123')).toBe('test123');
      expect(crawlerManager.normalizeResourceId('123test')).toBe('123test');
      expect(crawlerManager.normalizeResourceId('test!@#$%^&*()')).toBe('test');
    });
  });

  describe('getCrawlerLogicalId', () => {
    it('should generate the correct logical ID for a crawler', () => {
      
      expect(crawlerManager.getCrawlerLogicalId('test-workflow', 'crawler-1')).toBe('GlueCrawlertestworkflowcrawler1');
    });
  });

  describe('getTriggerLogicalId', () => {
    it('should generate the correct logical ID for a trigger', () => {
      
      expect(crawlerManager.getTriggerLogicalId('test-workflow', 'crawler-1')).toBe('GlueTriggertestworkflowcrawler1');
    });
  });
});