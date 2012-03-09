/**
 * KOI url
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, maxerr: 50, indent: 4, maxlen: 79, plusplus: true */
(function (KOI) {
	"use strict";

	/**
	 * todo: create readme
	 */

	//------------------------------
	//
	// Constants
	//
	//------------------------------

	//------------------------------
	// Regular expressions
	//------------------------------

	//------------------------------
	//
	// Properties
	//
	//------------------------------

		/**
		 * A route is a URI with an attached listener.
		 * Contains routes as keys and split paths as values.
		 * @type {Object<string, Array<string>>}
		 */
	var routes = {};

	//------------------------------
	//
	// Methods
	//
	//------------------------------

	//------------------------------
	// Utilities
	//------------------------------

	/**
	 * Trims leading and trailing slashes from a path.
	 * @param {string} path The path to trim.
	 * @return {string} The trimmed path.
	 */
	function trimPath(path) {
		if (path.substr(0, 1) === "/") {
			path = path.substr(1);
		}
		if (path.substr(-1, 1) === "/") {
			path = path.substr(0, path.length - 1);
		}

		return path;
	}

	/**
	 * Extracts a given path as a route.
	 * @param {string} path The path to check.
	 * @return {?Object<string, Object<string, string>>} Matched routes and
	 *		their parameters, or null.
	 */
	function matchRoutes(path) {
		path = trimPath(path);
		var path_parts = path.split("/"),
			matches = {},
			max_matches = [null, 0];

		KOI.each(routes, function (route_path, route_parts) {
			// Paths of different lengths cannot match
			if (route_parts.length !== path_parts.length) {
				return;
			}

			KOI.each(route_parts, function (i, route_part) {
				var path_part = path_parts[i],
					param,
					rm = false;

				if (route_part[0] === ":") {
					param = route_part.substr(1);
				} else if (route_part !== path_part) {
					rm = true;
				}

				if (matches[route_path] === undefined) {
					if (rm) {
						return false;
					} else {
						matches[route_path] = {};
					}
	 			} else if (rm) {
					delete matches[route_path];
					return false;
				}

				if (param !== undefined) {
					matches[route_path][param] = path_part;
				}
			});
		});

		return KOI.isEmpty(matches) ? null : matches;
	}

	//------------------------------
	// Routes
	//------------------------------

	/**
	 * Binds listener for route change.
	 * @param {string} new_route Route to add.
	 * @param {function(Object<string, string>)} listener Listener to add.
	 */
	function addRoute(new_route, listener) {
		new_route = trimPath(new_route);

		if (routes[new_route] === undefined) {
			routes[new_route] = new_route.split("/");
		}

		KOI.bind("deeplink-" + new_route, listener);
	}

	/**
	 * Binds listeners for route changes.
	 * @param {Object<string, listener>} new_routes Route listeners to add.
	 */
	function addRoutes(new_routes) {
		KOI.each(new_routes, function (route_path, listener) {
			addRoute(route_path, listener);
		});
	}

	/**
	 * Attempts to execute a provided path as a route.
	 * @param {string} path The path to execute.
	 */
	function executeRoute(path) {
		var matches = matchRoutes(path);

		if (matches !== null) {
			KOI.each(matches, function (route, params) {
				KOI.trigger("deeplink-" + route, params);
			});
		} else {
			KOI.trigger("deeplink-error", "not_found", path);
		}
	}

	//------------------------------
	//
	// Event bindings
	//
	//------------------------------

	KOI.bind("DOMReady", function () {
		KOI.listen(window, "hashchange", function () {
			executeRoute(window.location.hash.slice(1));
		});
	});

	//------------------------------
	//
	// Exposure
	//
	//------------------------------

	KOI.expose({

	//------------------------------
	// Utilities
	//------------------------------

		trimPath: trimPath,

	//------------------------------
	// Routes
	//------------------------------

		route: addRoute,
		routes: addRoutes,
		executeRoute: executeRoute
	});

}(window.KOI));


