const debug = require('debug');

const debugLog = {
  main: debug('serverless-aws-glue:main'),
  workflow: debug('serverless-aws-glue:workflow'),
  job: debug('serverless-aws-glue:job'),
  crawler: debug('serverless-aws-glue:crawler'),
  resource: debug('serverless-aws-glue:resource')
};

module.exports = debugLog;