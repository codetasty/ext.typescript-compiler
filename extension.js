define(function(require, exports, module) {
	var ExtensionManager = require('core/extensionManager');
	
	var Socket = require('core/socket');
	var Workspace = require('core/workspace');
	var Notification = require('core/notification');
	var Fn = require('core/fn');
	var FileManager = require('core/fileManager');
	
	var EditorSession = require('modules/editor/ext/session');
	var EditorEditors = require('modules/editor/ext/editors');
	
	var Extension = ExtensionManager.register({
		name: 'typescript-compiler'
	}, {
		init: function() {
			EditorEditors.on('save', this.onSave);
		},
		destroy: function() {
			EditorEditors.off('save', this.onSave);
		},
		onSave: function(session, value) {
			if (Extension._exts.indexOf(session.storage.extension) !== -1) {
				Extension.compile(session.storage.workspaceId, session.storage.path, session.data.$worker, value);
			}
		},
		_exts: ['ts'],
		_underscores: false,
		importWorkspace: null,
		importPath: '',
		compile: function(workspaceId, path, $worker, doc) {
			if (!$worker) {
				return false;
			}
			
			var self = this;
			var options = FileManager.getFileOptions(doc);
			
			if (!options.out) {
				return false;
			}
			
			var destination = FileManager.parsePath(path, options.out, [this._exts.join('|'), 'js']);
			
			if (!destination) {
				return false;
			}
			
			if (destination.match(/\.ts/)) {
				FileManager.getCache(workspaceId, destination, function(data, err) {
					if (err) {
						return Notification.open({
							type: 'error',
							title: 'TypeScript compilation failed',
							description: err.message,
							autoClose: true
						});
					}
					
					Extension.compile(workspaceId, destination, data);
				});
				
				return false;
			}
			
			this.importWorkspace = workspaceId;
			this.importPath = path;
			
			var $notification = Notification.open({
				type: 'default',
				title: 'TypeScript compilation',
				description: 'Compiling <strong>' + path + '</strong>',
			});
			
			//get configuration
			FileManager.getCache(workspaceId, '/tsconfig.json', function(data, err) {
				var config = {};
				if (data) {
					try { 
						config = JSON.parse(data);
					} catch (e) {
						
					}
				}
				
				$worker.call('compile', [doc, config], function(data) {
					if (data.errors.length) {
						$notification.trigger('close');
						
						return Notification.open({
							type: 'error',
							title: 'TypeScript compilation failed',
							description: data.errors.map(function(error) {
								return error.text + ' <strong>(' + (error.row+1) + ':' + (error.column+1) + ')</strong>';
							}).join('<br>'),
							autoClose: true
						});
					}
					
					FileManager.save({
						id: workspaceId,
						path: destination,
						data: function() {
							$notification.trigger('close');
						},
						error: function() {
							$notification.trigger('close');
						}
					}, data.output);
				});
			});
		}
	});

	module.exports = Extension;
});