/*!
 *  Framework - Bootstrap
 *
 *  Copyright (c) 2010 Knewton
 *  Dual licensed under:
 *      MIT: http://www.opensource.org/licenses/mit-license.php
 *      GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global window, ActiveXObject, document */

/*jslint evil: true, white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ()
{
	//------------------------------
	//
	//  Property Declaration
	//
	//------------------------------
	
		/**
		 *	An object for holding koi-bootstrap metadata.
		 */
	var metadata = {},
	
		/**
		 *	All the metadata tags currently on the page.
		 */
		metatags = document.getElementsByTagName('meta'),
		
		/**
		 *	Unique identifier for each resource.
		 */
		uid = 0,
		
		/**
		 *	Flag to determine if we're pending the loading of a script.
		 */
		pendingLoad = false,
		
		/**
		 *	A collection of scripts to embed.
		 *
		 *	Signature:
		 *	[
		 *		<fileName>,
		 *
		 *		...
		 *	]
		 */
		scripts = [],
		
		/**
		 *	A collection of the files which have been included.
		 *
		 *	Signature:
		 *	{
		 *		<fileName>: <true|false>,
		 *
		 *		...
		 *	}
		 */
		included = {},
		
		/**
		 *	A collection of manifest documents.
		 *
		 *	Signature:
		 *	{
		 *		<framework>:
		 *		{
		 *			<resourceType>:
		 *			{
		 *				<resourceName>: 
		 *				{
		 *					manifest: <manifestDocument>,
		 *
		 *					loadVersion: <versionForLoading>,
		 *
		 *					uid: <UID>,
		 *
		 *					included: <true|false>,
		 *
		 *					holding: 
		 *					[
		 *						<resourceUID>,
		 *
		 *						...
		 *					],
		 *
		 *					heldby:
		 *					[
		 *						<resourceUID>,
		 *
		 *						...
		 *					],
		 *				},
		 *
		 *				...
		 *			},
		 *		
		 *			...
		 *		},
		 *
		 *		...
		 *	}
		 */
		resources = {},
		
		/**
		 *	A cache of resource, by UID.
		 *
		 *	Signature:
		 *	{
		 *		<UID>: <resourceObject>,
		 *
		 *		...
		 *	}
		 */
		resourceCache = {},
		
		/**
		 *	Flag to determine if the application resources have been loaded.
		 */
		applicationResourcesLoaded = false,
		
		/**
		 *	The manifest for this application.
		 */
		applicationManifest,
		
		/**
		 *	The head of this document.
		 */
		head = document.getElementsByTagName('head')[0];
	
	//------------------------------
	//
	//  Internal Methods
	//
	//------------------------------
	
	/**
	 *	Return a cachebuster.
	 *
	 *	@param A cachebuster string.
	 */
	function cachebust()
	{
		return '?_=' + (new Date()).valueOf();
	}
	
	/**
	 *	Embed a stylesheet.
	 *
	 *	@param item	The URL of the css item to load.
	 */
	function embedStylesheet(item)
	{
		if (document.createStyleSheet !== undefined)
		{
			document.createStyleSheet(item);
			return;
		}
		
		var sheet = document.createElement("link");
		
		sheet.setAttribute("media", "screen");
		sheet.setAttribute("rel", "stylesheet");
		sheet.setAttribute("href", item + cachebust());

		head.appendChild(sheet);
	}
	
	/**
	 *	Embed a script. Based somewhat on jQuery.getScript
	 *
	 *	@param item	The URL of the js item to load.
	 */
	function embedScript(item)
	{
		if (pendingLoad)
		{
			scripts.push(item);
			return;
		}

		pendingLoad = true;
		
			/**
			 *	The script element for doing loading.
			 */
		var script = document.createElement("script"),
			
			/**
			 *	Flag to determine if this script has loaded.
			 */
			done = false;

		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function () 
		{
			if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete"))
			{
				done = true;
				
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				if (script.parentNode)
				{
					head.removeChild(script);
				}
				
				pendingLoad = false;
				
				if (scripts.length > 0)
				{
					embedScript(scripts.shift());
				}
			}
		};
		
		script.setAttribute("type", "text/javascript");
		script.setAttribute("src", item + cachebust());
		
		head.insertBefore(script, head.firstChild);
	}
	
	/**
	 *	Parse the provided text as JSON. 
	 *
	 *		Method borrowed from http://jquery.com/
	 *		Logic borrowed from http://json.org/json2.js
	 *
	 *	@param data	The data to parse.
	 */
	function parseJSON(data)
	{
		//	Confirm the data is JSON.
		if (/^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) 
		{
			//	Use the native JSON parser if it exists.
			if (window.JSON !== undefined && window.JSON.parse !== undefined)
			{
				return window.JSON.parse(data);
			}
			
			//	Use this evaluation method
			else
			{
				return (new Function("return " + data))();
			}
		}
		else
		{
			throw new SyntaxError("Bootstrap.parseJSON");
		}
	}
	
	/**
	 *	Handle the XHR response.
	 *
	 *	@param xhr		The request object.
	 *
	 *	@param listener	The listener to notify.
	 */
	function handleResponse(xhr, listener)
	{
		if (xhr.readyState === 4)
		{
			listener.call(xhr, parseJSON(xhr.responseText));
		}
	}
	
	/**
	 *	Generate a simple request object.
	 *
	 *	@param file		The script to include.
	 *
	 *	@param listener	The listener to notify.
	 */
	function simpleRequest(file, listener)
	{
		if (included[file] !== undefined)
		{
			return;
		}
		
		included[file] = true;
	
			/**
			 *	The request object.
			 */
		var xhr,
		
			/**
			 *	The processor for handling the request.
			 */
			processor = function ()
			{
				handleResponse(xhr, listener);
			};
		
		try
		{
			xhr = new XMLHttpRequest();
		}
		catch (e) 
		{
			xhr = new ActiveXObject("Microsoft.XMLHTTP");
		}
		
		xhr.open("GET", file, true);
		
		try
		{
			xhr.onreadystatechange = processor;
		}
		catch (ex)
		{
			xhr.onload = processor;
		}
		
		xhr.send(null);
	}
	
	/**
	 *	An each function, based on jQuery.each
	 *
	 *	@param source	The source to scan.
	 *
	 *	@param callback	The callback to trigger.
	 */
	function each(source, callback)
	{
		if (source === undefined)
		{
			return;
		}
	
			/**
			 *	The source key.
			 */
		var key,
		
			/**
			 *	The length of the source.
			 */
			length = source.length;

		//	For objects
		if (length === undefined)
		{
			for (key in source)
			{
				if (callback.call(source[key], key, source[key]) === false)
				{
					break;
				}
			}
		}
		
		//	For arrays
		else
		{
			key = 0;
			
			for (; key < length; key++)
			{
				if (callback.call(source[key], key, source[key]) === false)
				{
					break;
				}
			}	
		}
	}
	
	/**
	 *	Ensure the resource tree is created.
	 *
	 *	@param framework	The name of the framework.
	 *
	 *	@param type			The type of resource.
	 *
	 *	@param name			The name of the resource.
	 */
	function createResourceTree(framework, type, name)
	{
		if (resources[framework] === undefined)
		{
			resources[framework] = {};
		}
		
		if (resources[framework][type] === undefined)
		{
			resources[framework][type] = {};
		}
		
		if (resources[framework][type][name] === undefined)
		{
			resourceCache[uid] = resources[framework][type][name] = {included: false, uid: uid++, holding: {}, heldby: {}};
		}
		
		return resources[framework][type][name];
	}
	
	/**
	 *	Determine if the given resource is being held by a dependency.
	 *
	 *	@param resource	The resource to check.
	 */
	function isHeld(resource)
	{
		var held = false;
		
		each(resource.heldby, function (id, status)
		{
			if (status === true)
			{
				held = true;
				return false;
			}
		});
		
		return held;
	}
	
	/**
	 *	Once the bootstrapping process has finished, load any application resources.
	 */
	function loadApplicationResources()
	{
		if (applicationResourcesLoaded)
		{
			return;
		}
	
		var ready = true;
		
		each(resourceCache, function (key, resource)
		{
			if (!resource.included)
			{
				ready = false;
				return false;
			}
		});
		
		if (!ready)
		{
			return;
		}
		
		applicationResourcesLoaded = true;
		
		if (applicationManifest.application !== undefined)
		{
			each(applicationManifest.application.scripts, function (index, file)
			{
				embedScript(file + '.js');
			});
			
			each(applicationManifest.application.styles, function (index, file)
			{
				embedStylesheet(file + '.css');
			});
		}
	}
	
	/**
	 *	Attempt to load a resource.
	 *
	 *	@param resource	The resource item to load.
	 */
	function attemptResourceLoad(resource)
	{
		if (isHeld(resource) || resource.included)
		{
			return;
		}
		
			/**
			 *	The manifest for this resource.
			 */
		var manifest = resource.manifest,
		
			/**
			 *	The path for doing includes.
			 */
			path = [metadata.sdk, manifest.framework, manifest["class"], manifest.name, resource.loadVersion || manifest.version];
		
		each(resource.manifest.composition, function (index, type)
		{
			switch (type)
			{
			
			case 'js':
				embedScript(path.concat([manifest.name + '.js']).join('/'));
				break;
				
			case 'css':
				embedStylesheet(path.concat([manifest.name + '.css']).join('/'));
				break;
			
			}
		});
		
		resource.included = true;

		each(resource.holding, function (id, status)
		{
			var item = resourceCache[id];
			
			item.heldby[resource.uid] = false;
			resource.holding[id] = false;
			
			attemptResourceLoad(item);
		});
		
		loadApplicationResources();
	}
	
	//------------------------------
	//
	//  Processors
	//
	//------------------------------
	
	/**
	 *	Process a resource manifest.
	 *
	 *	@param manifest	The project manifest.
	 */
	function processResourceManifest(manifest)
	{
		var item = createResourceTree(manifest.framework, manifest["class"], manifest.name);
	
		item.manifest = manifest;
		
		if (manifest.dependencies !== undefined)
		{
			each(manifest.dependencies, function (framework, types)
			{
				each(types, function (type, resources)
				{
					each(resources, function (resource, version)
					{
						var dependency = createResourceTree(framework, type, resource);
						
						if (!dependency.included)
						{
							dependency.holding[item.uid] = true;
							item.heldby[dependency.uid] = true;
						}
						
						simpleRequest([metadata.sdk, framework, type, resource, version, "manifest.json"].join('/'), processResourceManifest);
					});
				});
			});
		}
		
		attemptResourceLoad(item);
	}
	
	/**
	 *	Process the project manifest.
	 *
	 *	@param manifest	The project manifest.
	 */
	function processProjectManifest(manifest)
	{		
		if (manifest.includes === undefined)
		{
			throw new SyntaxError("ProjectManifest.includes");
		}
		
		applicationManifest = manifest;
		
		//	Handle configurations
		if (manifest.configuration !== undefined)
		{
			each(manifest.configuration, function (index, file)
			{
				embedScript(file + '.js');
			});
		}
		
		//	Handle functional includes.
		each(manifest.includes, function (framework, types)
		{
			each(types, function (type, resources)
			{
				each(resources, function (resource, version)
				{
					var item = createResourceTree(framework, type, resource);
					
					item.loadVersion = version;
					
					simpleRequest([metadata.sdk, framework, type, resource, version, "manifest.json"].join('/'), processResourceManifest);					
				});
			});
		});
	}
	
	//------------------------------
	//
	//  Execution
	//
	//------------------------------
	
	/**
	 *	Load the metadata for this bootstrap.
	 */
	(function ()
	{
		each(metatags, function (index, tag)
		{
			if (tag.getAttribute("scheme") === "koi-bootstrap")
			{
				metadata[tag.getAttribute("name")] = tag.getAttribute("content");
			}
		});
		
		//	Cleanup
		metatags = undefined;
	}());
	
	/**
	 *	Ensure the metadata exists for the SDK root.
	 */
	if (metadata.sdk === undefined)
	{
		throw new Error("Bootstrap.sdk");
	}
	
	/**
	 *	Parse the project manifest document.
	 */
	if (metadata.manifest === undefined)
	{
		throw new Error("Bootstrap.manifest");
	}
	else
	{
		simpleRequest(metadata.manifest, processProjectManifest);
	}

}());