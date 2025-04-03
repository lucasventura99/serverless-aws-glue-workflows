class CrawlerManager {
  constructor(plugin) {
    this.plugin = plugin;
  }

  addCrawlersToResources(workflowName, workflow, resources) {
    if (!workflow.crawlers) return;

    workflow.crawlers.forEach((crawler, index) => {
      const crawlerLogicalId = this.getCrawlerLogicalId(workflowName, crawler.name);
      
      resources[crawlerLogicalId] = {
        Type: 'AWS::Glue::Crawler',
        Properties: {
          Name: crawler.name,
          Role: crawler.role,
          DatabaseName: crawler.databaseName,
          Targets: crawler.targets,
          Schedule: crawler.schedule,
          SchemaChangePolicy: crawler.schemaChangePolicy || {
            UpdateBehavior: 'UPDATE_IN_DATABASE',
            DeleteBehavior: 'DEPRECATE_IN_DATABASE'
          },
          Configuration: crawler.configuration || {},
          CrawlerSecurityConfiguration: crawler.securityConfiguration,
          Tags: crawler.tags || {}
        }
      };

      // Add trigger for crawler if it's the first crawler and there are jobs
      if (index === 0 && workflow.jobs && workflow.jobs.length > 0) {
        this.addCrawlerTrigger(workflowName, crawler, resources);
      }
    });
  }

  addCrawlerTrigger(workflowName, crawler, resources) {
    const triggerLogicalId = this.getTriggerLogicalId(workflowName, crawler.name);
    const crawlerLogicalId = this.getCrawlerLogicalId(workflowName, crawler.name);

    resources[triggerLogicalId] = {
      Type: 'AWS::Glue::Trigger',
      Properties: {
        Name: `${workflowName}-${crawler.name}-trigger`,
        Type: 'CONDITIONAL',
        WorkflowName: { Ref: this.getWorkflowLogicalId(workflowName) },
        Actions: [{
          CrawlerName: { Ref: crawlerLogicalId }
        }],
        Predicate: {
          Conditions: [{
            CrawlerName: { Ref: crawlerLogicalId },
            CrawlState: 'SUCCEEDED'
          }]
        }
      }
    };
  }

  getCrawlerLogicalId(workflowName, crawlerName) {
    return `GlueCrawler${this.normalizeResourceId(workflowName)}${this.normalizeResourceId(crawlerName)}`;
  }

  getTriggerLogicalId(workflowName, resourceName) {
    return `GlueTrigger${this.normalizeResourceId(workflowName)}${this.normalizeResourceId(resourceName)}`;
  }

  getWorkflowLogicalId(workflowName) {
    return `GlueWorkflow${this.normalizeResourceId(workflowName)}`;
  }

  normalizeResourceId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }
}

export default CrawlerManager;