/* global define, $ */
"use strict";

define(function(require, exports, module) {
	const ExtensionManager = require('core/extensionManager');
	
	const Utils = require('core/utils');
	const FileManager = require('core/fileManager');
	
	const EditorSession = require('modules/editor/ext/session');
	const EditorEditors = require('modules/editor/ext/editors');
	const EditorCompiler = require('modules/editor/ext/compiler');
	
	class Extension extends ExtensionManager.Extension {
		constructor() {
			super({
				name: 'typescript-compiler',
			});
			
			this.watcher = null;
			
			this.compilerName = 'TypeScript';
		}
		
		init() {
			super.init();
			
			this.watcher = EditorCompiler.addWatcher(this.name, {
				property: 'source',
				extensions: ['ts'],
				outputExtension: 'js',
				comments: true,
				watch: this.onWatch.bind(this),
			});
		}
		
		destroy() {
			super.destroy();
			
			this.watcher = null;
			EditorCompiler.removeWatcher(this.name);
		}
		
		onWatch(workspaceId, obj, session, value) {
			FileManager.getCache(workspaceId, '/tsconfig.json').catch(e => {
				return null;
			}).then(data => {
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
			});
		}
		
		onFile(compiler, path, file) {
			compiler.worker.call('compile', [file, compiler.config], function(data) {
				if (data.errors.length) {
					compiler.destroy(new Error(
						'%s on <strong>%s:%s</strong> in file <strong>%s</strong>.'.sprintfEscape(data.errors[0].text, data.errors[0].row+1, data.errors[0].column+1, path)
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
		}
	}

	module.exports = new Extension();
});