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

		/**
		 * Matches local protocols.
		 * @type {RegExp}
		 */
	var RX_LOCAL = /^(about|app|app\-storage|.+\-extension|file|res|widget):$/,

	//------------------------------
	//
	// Properties
	//
	//------------------------------

	//------------------------------
	// System
	//------------------------------

		/**
		 * The script tag which included the bootstrap.
		 * @type {HTMLElement}
		 */
		root = document.getElementById("koi-bootstrap"),

	//------------------------------
	// Library
	//------------------------------

		/**
		 * A cached list of library paths.
		 * @type {Object<string, string>}
		 */
		libraryPaths = {},

		/**
		 * A list of resources held by other resources for includes.
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
	 * Performs a get request using AJAX.
	 * @param {string} path The path to the file to load.
	 * @param {function({string|Object|Array})} listener A listener.
	 * @param {string} format File type: json, css, js
	 */
	function get(path, listener, format) {
		var xhr,
			processor = function () {
				if (xhr.readyState === 4) {
					var sCode, response;

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

					if (format.toLowerCase() === "json") {
						try {
							response = JSON.parse(response);
						} catch (e) {
							// Pass
						}
					}

					if (sCode >= 200 && sCode < 300 || sCode === 304) {
						listener.call(listener, response);
					} else {
						console.log(sCode.toString(), "Error:", path);
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
			var path = [libPath],
				o = applicationManifest.libraryPathOverrides[library];
			if (o !== undefined) {
				if (o !== null) {
					path.push(o);
				}
			} else {
				path.push(library);
			}

			libraryPaths[library] = mkpath(path);
		}

		return libraryPaths[library];
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

	}

	/**
	 * Returns a list of missing requirements.
	 * @param {Object<string, Object<string, Array<string>>>} requirements
	 * @param {string} pendingResource The resource pending loading.
	 * @return {Object<string, *>} The missing requirements object.
	 */
	function missingRequirements(requirements, pendingResource) {
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
				requiredResources = requirements[lib];
				for (rIndex in requiredResources) {
					if (requiredResources.hasOwnProperty(rIndex)) {
						resource = requiredResources[rIndex];
						if (!hasIncludedLibraryResource(lib, resource)) {
							if (missing.resources[lib] === undefined) {
								missing.resources[lib] = [];
							}

							if (heldResources[resource] === undefined) {
								heldResources[resource] = [];
							}

							heldResources[resource].push(pendingResource);

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
				requires: missingRequirements(definition.reqs, resource)
			};
		}

		libraryResource = includedResources[library][resource];

		if (!libraryResource.included) {
			if (libraryResource.requires.length > 0) {
				loadResources(libraryResource.requires.resources);
			} else {
				if (!libraryResource.loading) {
					libraryResource.loading = true;
					console.log("include", library, resource);
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
	 */
	function loadResources(libraries) {
		var lib;
		for (lib in libraries) {
			if (libraries.hasOwnProperty(lib)) {
				includeLibraryResources(lib, libraries[lib]);
			}
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
		loadResources(manifest.includes);
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

