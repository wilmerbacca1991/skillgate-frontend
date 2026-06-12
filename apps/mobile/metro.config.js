const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
	mobileNodeModules,
	path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
	react: path.resolve(mobileNodeModules, 'react'),
	'react-dom': path.resolve(mobileNodeModules, 'react-dom'),
};

module.exports = config;