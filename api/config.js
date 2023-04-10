const path = require('path');

const options = {
  configId: 'pms',
  defaults: {},
  globalConfigPath: path.resolve(process.cwd(), 'resource'),
};

if (process.env.NODE_ENV === 'test') {
  options.configId = 'test';
}

// Set config root path before creating ConfigStore
process.env['XDG_CONFIG_HOME'] = options.globalConfigPath;

const ConfigStore = require('configstore');
const config = new ConfigStore(options.configId, options.defaults, options);

module.exports = config;