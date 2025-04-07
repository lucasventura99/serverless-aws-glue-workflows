class CrawlerManager {
  constructor(plugin) {
    this.plugin = plugin;
  }

  addCrawlersToResources(workflowName, workflow, resources) {
    if (!workflow.crawlers) return;

    this.plugin.serverless.cli.log(
      `Adding ${workflow.crawlers.length} crawlers for workflow: ${workflowName}`
    );

    workflow.crawlers.forEach((crawler, index) => {
      const crawlerLogicalId = this.getCrawlerLogicalId(
        workflowName,
        crawler.name
      );

      this.plugin.serverless.cli.log(
        `Creating crawler resource: ${crawler.name} (${crawlerLogicalId})`
      );

      resources[crawlerLogicalId] = {
        Type: "AWS::Glue::Crawler",
        Properties: {
          Name: crawler.name,
          Role: crawler.role,
          DatabaseName: crawler.databaseName,
          Targets: crawler.targets,
          Schedule: crawler.schedule,
          SchemaChangePolicy: crawler.schemaChangePolicy || {
            UpdateBehavior: "UPDATE_IN_DATABASE",
            DeleteBehavior: "DEPRECATE_IN_DATABASE",
          },
          Configuration: crawler.configuration || {},
          CrawlerSecurityConfiguration: crawler.securityConfiguration,
          Tags: crawler.tags || {},
        },
      };

      if (index === 0 && workflow.jobs && workflow.jobs.length > 0) {
        if (workflow.skipCrawlerTriggers !== true) {
          this.addCrawlerTrigger(workflowName, crawler, resources);
        } else {
          this.plugin.serverless.cli.log(
            `Skipping auto-trigger for crawler: ${crawler.name} (skipCrawlerTriggers is true)`
          );
        }
      }
    });
  }

  addCrawlerTrigger(workflowName, crawler, resources) {
    const triggerLogicalId = this.getTriggerLogicalId(
      workflowName,
      crawler.name
    );
    const crawlerLogicalId = this.getCrawlerLogicalId(
      workflowName,
      crawler.name
    );

    this.plugin.serverless.cli.log(
      `Creating crawler trigger: ${triggerLogicalId} for crawler: ${crawler.name}`
    );

    resources[triggerLogicalId] = {
      Type: "AWS::Glue::Trigger",
      Properties: {
        Name: `${workflowName}-${crawler.name}-trigger`,
        Type: "ON_DEMAND",
        WorkflowName: { Ref: this.getWorkflowLogicalId(workflowName) },
        Actions: [
          {
            CrawlerName: { Ref: crawlerLogicalId },
          },
        ],
      },
    };

    this.plugin.serverless.cli.log(
      `Crawler trigger created as ON_DEMAND trigger for crawler: ${crawler.name}`
    );
  }

  getCrawlerLogicalId(workflowName, crawlerName) {
    return `GlueCrawler${this.normalizeResourceId(
      workflowName
    )}${this.normalizeResourceId(crawlerName)}`;
  }

  getTriggerLogicalId(workflowName, resourceName) {
    return `GlueTrigger${this.normalizeResourceId(
      workflowName
    )}${this.normalizeResourceId(resourceName)}`;
  }

  getWorkflowLogicalId(workflowName) {
    return `GlueWorkflow${this.normalizeResourceId(workflowName)}`;
  }

  normalizeResourceId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "");
  }
}

module.exports = CrawlerManager;
