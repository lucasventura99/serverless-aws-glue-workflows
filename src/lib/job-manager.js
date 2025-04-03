class JobManager {
  constructor(plugin) {
    this.plugin = plugin;
  }

  addJobsToResources(workflowName, workflow, resources) {
    if (!workflow.jobs || workflow.jobs.length === 0) return;

    workflow.jobs.forEach((job, index) => {
      const jobLogicalId = this.getJobLogicalId(workflowName, job.name);
      
      resources[jobLogicalId] = {
        Type: 'AWS::Glue::Job',
        Properties: {
          Name: job.name,
          Role: job.role,
          Command: {
            Name: job.type || 'glueetl',
            ScriptLocation: job.scriptLocation,
            PythonVersion: job.pythonVersion || '3'
          },
          DefaultArguments: job.arguments || {},
          MaxRetries: job.maxRetries || 0,
          Timeout: job.timeout || 2880,
          NumberOfWorkers: job.workers || 2,
          WorkerType: job.workerType || 'G.1X',
          GlueVersion: job.glueVersion || '3.0'
        }
      };

      if (index > 0) {
        this.addJobTrigger(workflowName, job, workflow.jobs[index - 1], resources);
      }
    });
  }

  addJobTrigger(workflowName, job, previousJob, resources) {
    const triggerLogicalId = this.getTriggerLogicalId(workflowName, job.name);
    const jobLogicalId = this.getJobLogicalId(workflowName, job.name);

    resources[triggerLogicalId] = {
      Type: 'AWS::Glue::Trigger',
      Properties: {
        Name: `${workflowName}-${job.name}-trigger`,
        Type: 'CONDITIONAL',
        WorkflowName: { Ref: this.getWorkflowLogicalId(workflowName) },
        Actions: [{
          JobName: { Ref: jobLogicalId }
        }],
        Predicate: {
          Conditions: [{
            JobName: { Ref: this.getJobLogicalId(workflowName, previousJob.name) },
            State: 'SUCCEEDED'
          }]
        }
      }
    };
  }

  getJobLogicalId(workflowName, jobName) {
    return `GlueJob${this.normalizeResourceId(workflowName)}${this.normalizeResourceId(jobName)}`;
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

export default JobManager;