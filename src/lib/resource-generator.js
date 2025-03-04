class ResourceGenerator {
  constructor(plugin) {
    this.plugin = plugin;
  }

  prepareWorkflowResources(workflows) {
    if (!workflows || Object.keys(workflows).length === 0) return;

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
  }

  getWorkflowLogicalId(workflowName) {
    return `GlueWorkflow${this.normalizeResourceId(workflowName)}`;
  }

  normalizeResourceId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }
}

module.exports = ResourceGenerator;