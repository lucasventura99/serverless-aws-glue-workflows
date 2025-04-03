let ServerlessAWSGlueWorkflows;
import('./src/index.js').then(module => {
  ServerlessAWSGlueWorkflows = module.default;
}).catch(err => {
  console.error('Failed to load plugin:', err);
});

module.exports = function(serverless, options) {
  if (!ServerlessAWSGlueWorkflows) {
    throw new Error('Plugin failed to initialize. Please check the error logs.');
  }
  return new ServerlessAWSGlueWorkflows(serverless, options);
}; 