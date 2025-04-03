class ResourceGenerator {
  constructor(plugin) {
    this.plugin = plugin;
  }

  prepareWorkflowResources(workflows) {
    if (!workflows || Object.keys(workflows).length === 0) return;

    // Add debugging
    this.plugin.serverless.cli.log(`Adding resources for workflows: ${Object.keys(workflows).join(', ')}`);

    const resources = this.plugin.service.resources = this.plugin.service.resources || {};
    resources.Resources = resources.Resources || {};

    for (const [workflowName, workflow] of Object.entries(workflows)) {
      const workflowLogicalId = this.getWorkflowLogicalId(workflowName);
      
      resources.Resources[workflowLogicalId] = {
        Type: 'AWS::Glue::Workflow',
        Properties: {
          Name: workflowName,
          Description: workflow.description,
          Tags: workflow.tags || {}
        }
      };

      // Add crawlers resources if defined
      if (workflow.crawlers) {
        this.plugin.crawlerManager.addCrawlersToResources(workflowName, workflow, resources.Resources);
      }

      // Add jobs and triggers resources
      this.plugin.jobManager.addJobsToResources(workflowName, workflow, resources.Resources);
    }

    // Add more debugging
    this.plugin.serverless.cli.log(`Total resources added: ${Object.keys(resources.Resources).length}`);
  }

  getWorkflowLogicalId(workflowName) {
    return `GlueWorkflow${this.normalizeResourceId(workflowName)}`;
  }

  normalizeResourceId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }
}

module.exports = ResourceGenerator;