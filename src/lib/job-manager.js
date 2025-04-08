class JobManager {
  constructor(plugin) {
    this.plugin = plugin;
  }

  addJobsToResources(workflowName, workflow, resources) {
    if (!workflow.jobs || workflow.jobs.length === 0) return;

    this.plugin.serverless.cli.log(
      `Adding ${workflow.jobs.length} jobs for workflow: ${workflowName}`
    );

    workflow.jobs.forEach((job, index) => {
      const jobLogicalId = this.getJobLogicalId(workflowName, job.name);

      this.plugin.serverless.cli.log(
        `Creating job resource: ${job.name} (${jobLogicalId})`
      );

      resources[jobLogicalId] = {
        Type: "AWS::Glue::Job",
        Properties: {
          Name: job.name,
          Role: job.role,
          Command: {
            Name: job.type || "glueetl",
            ScriptLocation: job.scriptLocation,
            PythonVersion: job.pythonVersion || "3",
          },
          DefaultArguments: job.arguments || {},
          MaxRetries: job.maxRetries || 0,
          Timeout: job.timeout || 2880,
          NumberOfWorkers: job.workers || 2,
          WorkerType: job.workerType || "G.1X",
          GlueVersion: job.glueVersion || "3.0",
        },
      };

      if (index > 0) {
        this.addJobTrigger(
          workflowName,
          job,
          workflow.jobs[index - 1],
          resources
        );
      }
    });
  }

  addJobTrigger(workflowName, job, previousJob, resources) {
    const triggerLogicalId = this.getTriggerLogicalId(workflowName, job.name);
    const jobLogicalId = this.getJobLogicalId(workflowName, job.name);

    this.plugin.serverless.cli.log(
      `Creating job trigger: ${triggerLogicalId} for job: ${job.name}`
    );

    const triggerType = job.triggerType || "CONDITIONAL";

    const triggerResource = {
      Type: "AWS::Glue::Trigger",
      Properties: {
        Name: `${workflowName}-${job.name}-trigger`,
        Type: triggerType,
        WorkflowName: this.getWorkflowLogicalId(workflowName),
        Actions: [
          {
            JobName: jobLogicalId,
          },
        ],
      },
    };

    if (triggerType === "CONDITIONAL") {
      let conditions = [];

      if (job.conditions && job.conditions.length > 0) {
        this.plugin.serverless.cli.log(
          `Using custom conditions for job: ${job.name}`
        );
        conditions = job.conditions.map((condition) => {
          if (condition.JobName && !condition.JobName.Ref) {
            return {
              ...condition,
              JobName: {
                Ref: this.getJobLogicalId(workflowName, condition.JobName),
              },
            };
          }
          return condition;
        });
      } else {
        conditions = [
          {
            JobName: {
              Ref: this.getJobLogicalId(workflowName, previousJob.name),
            },
            State: "SUCCEEDED",
          },
        ];
      }

      const logicalOperator =
        job.logical && job.logical.trim() ? job.logical.trim() : "AND";

      triggerResource.Properties.Predicate = {
        Logical: logicalOperator,
        Conditions: conditions,
      };

      this.plugin.serverless.cli.log(
        `Job trigger created with predicate: ${JSON.stringify(
          triggerResource.Properties.Predicate
        )}`
      );
    } else {
      this.plugin.serverless.cli.log(
        `Created ON_DEMAND trigger for job: ${job.name}`
      );
    }

    resources[triggerLogicalId] = triggerResource;
  }

  getJobLogicalId(workflowName, jobName) {
    return `GlueJob${this.normalizeResourceId(
      workflowName
    )}${this.normalizeResourceId(jobName)}`;
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

module.exports = JobManager;
