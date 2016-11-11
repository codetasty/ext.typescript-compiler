define(function(require, exports, module) {
	var ExtensionManager = require('core/extensionManager');
	
	var Socket = require('core/socket');
	var Workspace = require('core/workspace');
	var Notification = require('core/notification');
	var Fn = require('core/fn');
	var FileManager = require('core/fileManager');
	
	var EditorSession = require('modules/editor/ext/session');
	
	var Extension = ExtensionManager.register({
		name: 'typescript-compiler'
	}, {
		init: function() {
			EditorSession.on('save', this.onSave);
		},
		destroy: function() {
			EditorSession.off('save', this.onSave);
		},
		onSave: function(e) {
			if (Extension._exts.indexOf(e.storage.extension) !== -1) {
				Extension.compile(e.storage.workspaceId, e.storage.path, e.session.data.$worker, e.session.data.getValue());
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
						return Notification.open({
							type: 'error',
							title: 'TypeScript compilation failed',
							description: data.errors.map(function(error) {
								return error.text + ' <strong>(' + (error.row+1) + ':' + (error.column+1) + ')</strong>';
							}).join('<br>'),
							autoClose: true
						});
					}
					
					FileManager.saveFile(workspaceId, destination, data.output, null);
				});
			});
		}
	});

	module.exports = Extension;
});