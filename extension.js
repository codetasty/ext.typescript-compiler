define(function(require, exports, module) {
	var ExtensionManager = require('core/extensionManager');
	
	var Utils = require('core/utils');
	var FileManager = require('core/fileManager');
	
	var EditorSession = require('modules/editor/ext/session');
	var EditorEditors = require('modules/editor/ext/editors');
	var EditorCompiler = require('modules/editor/ext/compiler');
	
	var Extension = ExtensionManager.register({
		name: 'typescript-compiler'
	}, {
		watcher: null,
		compilerName: 'TypeScript',
		init: function() {
			this.watcher = EditorCompiler.addWatcher(this.name, {
				property: 'source',
				extensions: ['ts'],
				outputExtension: 'js',
				comments: true,
				watch: this.onWatch.bind(this),
			});
		},
		destroy: function() {
			this.watcher = null;
			EditorCompiler.removeWatcher(this.name);
		},
		onWatch: function(workspaceId, obj, session, value) {
			FileManager.getCache(workspaceId, '/tsconfig.json', function(data, err) {
				var config = {};
				try { 
					config = data ? JSON.parse(data) : config;
				} catch (e) {}
			
				EditorCompiler.addCompiler(this.watcher, this.compilerName, workspaceId, obj, function(compiler) {
					if (!session.data.$worker) {
						compiler.destroy(new Error('Worker not loaded'));
						return EditorCompiler.removeCompiler(compiler);
					}
					
					compiler.files = compiler.source.map(function(path) {
						return {
							path: path,
							file: null
						};
					});
					
					compiler.worker = session.data.$worker;
					compiler.config = config;
					compiler.compiled = 0;
					
					compiler.file = this.onFile.bind(this);
				}.bind(this));
			}.bind(this));
		},
		onFile: function(compiler, path, file) {
			compiler.worker.call('compile', [file, compiler.config], function(data) {
				if (data.errors.length) {
					compiler.destroy(new Error(
						__('%s on <strong>%s:%s</strong> in file <strong>%s</strong>.', data.errors[0].text, data.errors[0].row+1, data.errors[0].column+1, Utils.path.humanize(path))
					));
					
					return EditorCompiler.removeCompiler(compiler);
				}
				
				for (var i = 0; i < compiler.files.length; i++) {
					if (compiler.files[i].path === path) {
						compiler.files[i].file = data.output;
						compiler.compiled++;
						break;
					}
				}
				
				if (compiler.compiled === compiler.files.length) {
					EditorCompiler.saveOutput(compiler, compiler.files.map(function(file) {
						return file.file;
					}).join("\n"));
				}
			});
		},
	});

	module.exports = Extension;
});