/**
 * KOI bootstrap
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, maxerr: 50, indent: 4, maxlen: 79, regexp: true */
(function () {
	"use strict";

	//------------------------------
	//
	// Constants
	//
	//------------------------------

	//------------------------------
	// Regular expressions
	//------------------------------

		/**
		 * Matches local protocols.
		 * @type {RegExp}
		 */
	var RX_LOCAL = /^(about|app|app\-storage|.+\-extension|file|res|widget):$/,

		/**
		 * Image path replacement.
		 * @type {RegExp}
		 */
		RX_IMAGE = /url\(images\/(.*)+\)/g,

	//------------------------------
	//
	// Properties
	//
	//------------------------------

	//------------------------------
	// System
	//------------------------------

		/**
		 *	The head of this document.
		 */
		head = document.getElementsByTagName('head')[0],

		/**
		 * The script tag which included the bootstrap.
		 * @type {HTMLElement}
		 */
		root = document.getElementById("koi-bootstrap"),

		/**
		 * If a script is pending load.
		 * @type {boolean}
		 */
		pendingLoad = false,

		/**
		 * Scripts pending load.
		 * @type {Array<Object<string, string|function()>}
		 */
		scripts = [],

	//------------------------------
	// Application
	//------------------------------

		/**
		 * The nubmer of application resources pending loading.
		 * @type {nubmer}
		 */
		appPending = 0,

	//------------------------------
	// Library
	//------------------------------

		/**
		 * The number of resources pending loading in the system.
		 * @type {nubmer}
		 */
		pendingResources = 0,

		/**
		 * A list of all the stylesheets included.
		 * @type {Array<string>}
		 */
		css = [],

		/**
		 * A cached list of library paths.
		 * @type {Object<string, string>}
		 */
		libraryPaths = {},

		/**
		 * A list of resources held by other resources for includes.
		 * @type {Object<string, Object<string, *>}
		 */
		heldResources = {},

		/**
		 * A list of defined libraries.
		 * @type {Object<string, Object<string, Array<string>>>}
		 */
		libraryDefinitions = {},

		/**
		 * A list of included library resources.
		 * @type {Object<string, Array<string>>}
		 */
		includedResources = {},

		/**
		 * The path the library which contains resources to load.
		 * @type {string}
		 */
		libPath,

	//------------------------------
	// Application
	//------------------------------

		/**
		 * The manifest for the current applciation.
		 * @type {Object<string, *>}
		 */
		applicationManifest;

	//------------------------------
	//
	// Methods
	//
	//------------------------------

	//------------------------------
	// Utilities
	//------------------------------

	/**
	 * Returns the current unix timestamp.
	 * @return {number} The curren time.
	 */
	function now() {
		return (new Date()).valueOf();
	}

	/**
	 * Embeds a script.
	 * @param {string} path The path to the file to load.
	 * @param {function()} listener A listener.
	 */
	function embedScript(path, callback) {
		if (pendingLoad) {
			scripts.push([
				path,
				callback
			]);
			return;
		}
		pendingLoad = true;
		var script = document.createElement("script"),
			done = false;

		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function () {
			var rs = this.readyState;
			if (!done && (!rs || rs === "loaded" || rs === "complete")) {
				done = true;

				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				if (script.parentNode) {
					head.removeChild(script);
				}

				pendingLoad = false;

				if (callback !== undefined) {
					callback.call(callback, null, "js");
				}

				if (scripts.length > 0) {
					embedScript.apply(embedScript, scripts.shift());
				}
			}
		};

		script.setAttribute("type", "text/javascript");
		script.setAttribute("src", path + "?_=" + now());

		head.insertBefore(script, head.firstChild);
	}

	/**
	 * Performs a get request using AJAX.
	 * @param {string} path The path to the file to load.
	 * @param {function({string|Object|Array})} listener A listener.
	 * @param {string} format File type: json, css, js
	 */
	function get(path, listener, format) {
		var xhr,
			processor;
		if (format.toLowerCase() === "js") {
			embedScript(path, listener);
		} else {
			processor = function () {
				if (xhr.readyState === 4) {
					var sCode, response, pathing = path.split("/");
					pathing.pop();
					pathing = pathing.join("/");

					try {
						sCode = xhr.status;
					} catch (e) {
						sCode = -1;
					}

					try {
						response = xhr.responseText;
					} catch (e) {
						response = "";
					}

					switch (format.toLowerCase()) {

					case "json":
						try {
							response = JSON.parse(response);
						} catch (e) {
							// Pass
						}
						break;

					case "css":
						response = response.replace(RX_IMAGE,
							"url(" + pathing + "/images/$1)");
						break;

					}

					if (sCode >= 200 && sCode < 300 || sCode === 304) {
						listener.call(listener, response, format.toLowerCase());
					} else {
						throw [sCode.toString(), "Error:", path].join(" ");
					}
				}
			}

			try {
				xhr = new XMLHttpRequest();
			} catch (e) {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}

			path += ["?_", now()].join("=");
			xhr.open("GET", path, true);

			try {
				xhr.onreadystatechange = processor;
			} catch (ex) {
				xhr.onload = processor;
			}

			xhr.send(null);
		}
	}

	//------------------------------
	// Pathing
	//------------------------------

	/**
	 * Creates a path from the provided arguments.
	 * @param {...*} var_args Path parts to combine.
	 */
	function mkpath() {
		return Array.prototype.slice.apply(arguments).join("/");
	}

	/**
	 * Returns a path to a library.
	 * @param {string} library The library to fetch a path for.
	 * @return {string} The library path.
	 */
	function libraryPath(library) {
		if (libraryPaths[library] === undefined) {
			var path = [],
				o = applicationManifest.libraryPathOverrides[library];
			if (o !== undefined) {
				if (o !== null) {
					if (o.substr(0, 1) !== "/" &&
						o.substr(0, 2) !== "./") {
						// Append lib path for non-absolute overrides
						path.push(libPath);
					}

					path.push(o);
				} else {
					path.push(libPath);
				}
			} else {
				path.push(libPath, library);
			}

			libraryPaths[library] = mkpath(path);
		}

		return libraryPaths[library];
	}

	/**
	 * Completes the bootstrapping process.
	 */
	function complete() {
		if (css.length > 0) {
			var s = document.createElement("style");
			s.setAttribute("type", "text/css");
			s.setAttribute("media", "screen, print");
			s.innerHTML = css.join("");
			head.insertBefore(s, head.lastChild);
		}
		window.__bootstrapped__ = true;
		if (window.bootstrapping_complete !== undefined) {
			window.bootstrapping_complete();
		}
	}

	//------------------------------
	// Application
	//------------------------------

	/**
	 * Mark an application resource as included.
	 */
	function appIncluded() {
		appPending -= 1;
		if (appPending <= 0) {
			complete();
		}
	}

	/**
	 * Includes application resources.
	 */
	function loadApplicationResources() {
		var app,
			sIndex;
		if (applicationManifest.application !== undefined) {
			app = applicationManifest.application;
			if (app.scripts !== undefined && app.scripts.length > 0) {
				appPending += app.scripts.length;
				for (sIndex in app.scripts) {
					get(app.scripts[sIndex] + ".js", appIncluded, "js");
				}
			}

			if (app.styles !== undefined && app.styles.length > 0) {
				appPending += app.styles.length;
				for (sIndex in app.styles) {
					get(app.styles[sIndex] + ".css", function (d) {
						css.push(d);
						appIncluded();
					}, "css");
				}
			}
		}

		if (appPending === 0) {
			complete();
		}
	}

	//------------------------------
	// Library
	//------------------------------

	/**
	 * Returns whether or not a resource has been includeed from a library.
	 * @param {string} library The library to load the resource from.
	 * @param {string} resource The resource to load.
	 * @return {boolean} If the resource has been included.
	 */
	function hasIncludedLibraryResource(library, resource) {
		var resource = includedResources[library][resource];
		return resource !== undefined && resource.included;
	}

	/**
	 * Returns a list of missing requirements.
	 * @param {Object<string, Object<string, Array<string>>>} requirements
	 * @param {string} pendingLib The library of the resource pending loading.
	 * @param {string} pendingResource The resource pending loading.
	 * @return {Object<string, *>} The missing requirements object.
	 */
	function missingRequirements(requirements, pendingLib, pendingResource) {
		var missing = {
				length: 0,
				resources: {}
			},
			lib,
			requiredResources,
			rIndex,
			resource;

		for (lib in requirements) {
			if (requirements.hasOwnProperty(lib)) {
				if (heldResources[lib] === undefined) {
					heldResources[lib] = {};
				}
				requiredResources = requirements[lib];
				for (rIndex in requiredResources) {
					if (requiredResources.hasOwnProperty(rIndex)) {
						resource = requiredResources[rIndex];
						if (!hasIncludedLibraryResource(lib, resource)) {
							if (missing.resources[lib] === undefined) {
								missing.resources[lib] = [];
							}

							if (heldResources[lib][resource] === undefined) {
								heldResources[lib][resource] = {};
							}

							if (heldResources[lib][resource][pendingLib] ===
								undefined) {
								heldResources[lib][resource][pendingLib] = [];
							}

							heldResources[lib][resource][pendingLib]
								.push(pendingResource);

							missing.resources[lib].push(resource);
							missing.length += 1;
						}
					}
				}
			}
		}

		return missing;
	}

	/**
	 * Removes an included library from the holding array of other resources.
	 * @param {Object<string, Array<string>} from The held resources.
	 * @param {string} library The library to load the resource from.
	 * @param {string} resource The resource to load.
	 */
	function removeResourceHold(from, library, resource) {
		if (from === undefined) {
			return;
		}

		var lib,
			rIndex,
			rsc,
			pendingLib,
			pendingResources,
			heldLib,
			hIndex;

		for (lib in from) {
			if (from.hasOwnProperty(lib)) {
				for (rIndex in from[lib]) {
					rsc = from[lib][rIndex];
					pendingLib = includedResources[lib][rsc];
					pendingResources = pendingLib.requires.resources;
					for (heldLib in pendingResources) {
						if (pendingResources.hasOwnProperty(heldLib) &&
							heldLib === library) {
							for (hIndex in pendingResources[heldLib]) {
								if (pendingResources[heldLib][hIndex] ===
									resource) {
									pendingLib.requires.length -= 1;
									delete pendingResources[heldLib][hIndex];
									break;
								}
							}
						}
					}
				}
			}
		}
	}

	/**
	 * Finishes the include of a library.
	 * @param {string} library The library to load the resource from.
	 * @param {string} resource The resource to load.
	 */
	function resourceIncluded(library, resource) {
		var libraryResource = includedResources[library][resource];
		libraryResource.loading = false;
		libraryResource.included = true;
		if (heldResources[library] !== undefined) {
			removeResourceHold(heldResources[library][resource], library,
							resource);
			loadResources(heldResources[library][resource]);
		}
		pendingResources -= 1;
		if (pendingResources === 0) {
			loadApplicationResources();
		}
	}

	/**
	 * Include a resource, based on its composition.
	 * @param {string} library The library to load the resource from.
	 * @param {string} resource The resource to load.
	 * @param {Array<string>} composition The composition of the resource.
	 */
	function include(library, resource, composition) {
		var	path = mkpath(libraryPath(library), resource, resource),
			cIndex,
			fileType,
			filePath,
			resource,
			pending = 0;
		for (cIndex in composition) {
			fileType = composition[cIndex];
			if (fileType === "images") {
				continue;
			}
			pending += 1;
			get(path + "." + fileType, function (d, ft) {
				pending -= 1;
				switch (ft) {

				case "js":
					// noop
					break;

				case "css":
					css.push(d);
					break;

				case "html":
					if (window.__KOI_HTML__[library] === undefined) {
						window.__KOI_HTML__[library] = {};
					}
					window.__KOI_HTML__[library][resource] = d;
					break;

				}

				if (pending <= 0) {
					resourceIncluded(library, resource);
				}
			}, fileType);
		}
	}

	/**
	 * Includes a resource from a library.
	 * @param {string} library The library to load the resource from.
	 * @param {string} resource The resource to load.
	 */
	function includeLibraryResource(library, resource) {
		var definition = libraryDefinitions[library][resource],
			libraryResource;
		if (definition === undefined) {
			throw [library, "does not contain resource:", resource].join(" ");
		}

		if (includedResources[library][resource] === undefined) {
			includedResources[library][resource] = {
				included: false,
				loading: false,
				requires: missingRequirements(definition.reqs, library,
												resource)
			};
			pendingResources += 1;
		}

		libraryResource = includedResources[library][resource];

		if (!libraryResource.included) {
			if (libraryResource.requires.length > 0) {
				loadResources(libraryResource.requires.resources);
			} else {
				if (!libraryResource.loading) {
					libraryResource.loading = true;
					include(library, resource, definition.comp);
				}
			}
		}
	}

	/**
	 * Includes resources from a library.
	 * @param {string} library The library to load the resources from.
	 * @param {Array<string>} resources A list of resources to load.
	 */
	function includeLibraryResources(library, resources) {
		if (libraryDefinitions[library] === undefined) {
			includedResources[library] = {};
			get(mkpath(libraryPath(library), "manifest.json"), function (d) {
				libraryDefinitions[library] = d;
				includeLibraryResources(library, resources);
			}, "json");
		} else {
			var resource;
			for (resource in resources) {
				if (resources.hasOwnProperty(resource)) {
					includeLibraryResource(library, resources[resource]);
				}
			}
		}
	}

	/**
	 * Wraps {@code includeLibraryResources()}.
	 * @param {Object<string, Array<string>} libraries Resources to include,
	 * @param {boolean} proceedIfEmpty Continue bootstrapping if empty.
	 */
	function loadResources(libraries, proceedIfEmpty) {
		var lib,
			hasAnyResources = false;
		for (lib in libraries) {
			if (libraries.hasOwnProperty(lib)) {
				hasAnyResources = true;
				includeLibraryResources(lib, libraries[lib]);
			}
		}

		if (!hasAnyResources && Boolean(proceedIfEmpty)) {
			loadApplicationResources();
		}
	}

	//------------------------------
	// Application
	//------------------------------

	/**
	 * Loads the application manifest.
	 * @param {Object<string, *>} manifest The application manifest.
	 */
	function loadApplication(manifest) {
		applicationManifest = manifest;
		loadResources(manifest.includes, true);
	}

	//------------------------------
	//
	// Event bindings
	//
	//------------------------------

	//------------------------------
	//
	// Activation
	//
	//------------------------------

	// Create HTML storage object
	window.__KOI_HTML__ = {};

	// Attempt to activiate the boostrap
	if (RX_LOCAL.test(window.location.protocol)) {
		alert("The bootstrap cannot function over local protocols.");
	} else if (root === null) {
		alert('The tag including the bootstrap must have id="koi-bootstrap"');
	} else {
		// Set the library path
		libPath = mkpath(root.getAttribute("src").split("/lib")[0], "lib");
		get("manifest.json", loadApplication, "json");
	}

}());

