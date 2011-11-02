/**
 * KOI url
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, maxerr: 50, indent: 4, maxlen: 79 */
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

    var routes = {};

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    function addRoutes(new_routes) {
        KOI.each(new_routes, function (route_path, callback) {
            routes[route_path] = callback;
        });
    }

    /**
     * Returns the route for the given path.
     * @param {string} path The path to check.
     * @return {Function} The route. 
     */
    function selectRoute(path) {
        var path_parts = path.split('/'),
            matches = {},
            max_matches = [null, 0];

        KOI.each(routes, function (route_path) {
            var route_parts = route_path.split('/');

            KOI.each(route_parts, function (i, route_part) {
                if (route_part === path_parts[i]
                        || route_part[0] === ':') {
                    if (matches[route_path] === undefined) {
                        matches[route_path] = 1;
                    } else {
                        matches[route_path]++;
                    }
                } else {
                    // it failed to match, disqualify it
                    delete matches[route_path];
                    return false;
                }
            });
        });

        KOI.each(matches, function (route, count) {
            if (count > max_matches[1]) {
                max_matches = [route, count];
            }
        });

        return max_matches[0];
    }

    function executeRoute(path) {
        var route = selectRoute(path),
            params = route ? KOI.readPath(route, path) : null;

        if (route !== null) {
            routes[route].call(params);
        }
    }

    //------------------------------
    //
    // Event bindings
    //
    //------------------------------

    KOI.bind("DOMReady", function () {
        KOI.listen(window, 'hashchange', function () {
            executeRoute(window.location.hash.slice(1));
        });
    });

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    KOI.expose({
        routes: addRoutes,
        executeRoute: executeRoute
    });

}(window.KOI));


