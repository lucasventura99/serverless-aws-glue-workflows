class WorkflowManager {
  constructor(plugin) {
    this.plugin = plugin;
  }

  validateWorkflowConfigurations(workflows) {
    if (!workflows || Object.keys(workflows).length === 0) {
      this.plugin.serverless.cli.log('No Glue Workflows configurations found.');
      return;
    }

    for (const [workflowName, workflow] of Object.entries(workflows)) {
      this.validateWorkflow(workflowName, workflow);
    }
  }

  validateWorkflow(workflowName, workflow) {
    if (!workflow.description) {
      throw new Error(`Workflow ${workflowName} is missing description`);
    }

    if (!workflow.jobs || workflow.jobs.length === 0) {
      throw new Error(`Workflow ${workflowName} must have at least one job defined`);
    }

    if (workflow.crawlers) {
      this.validateCrawlers(workflowName, workflow.crawlers);
    }
  }

  validateCrawlers(workflowName, crawlers) {
    crawlers.forEach((crawler, index) => {
      if (!crawler.name) {
        throw new Error(`Crawler at index ${index} in workflow ${workflowName} is missing name`);
      }
      if (!crawler.role) {
        throw new Error(`Crawler ${crawler.name} in workflow ${workflowName} is missing role`);
      }
      if (!crawler.targets) {
        throw new Error(`Crawler ${crawler.name} in workflow ${workflowName} is missing targets`);
      }
      if (!crawler.databaseName) {
        throw new Error(`Crawler ${crawler.name} in workflow ${workflowName} is missing databaseName`);
      }
    });
  }
}

module.exports = WorkflowManager;