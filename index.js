module.exports = async function(serverless, options) {
  const { default: ServerlessAWSGlueWorkflows } = await import('./src/index.js');
  return new ServerlessAWSGlueWorkflows(serverless, options);
}; 