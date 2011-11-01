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

        /**
         * Matches URL encoded spaces.
         * @type {RegExp}
         */
    var RX_20 = /%20/g,

        /**
         * Matches "+" places spaces.
         * @type {RegExp}
         */
        RX_SPACE = /\+/g,

        /**
         * Matches nested keys in parameters.
         * @type {RegExp}
         */
        RX_KEY = /\[([a-z0-9_\-]*)\]/g;

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    // Parameters
    //------------------------------

    /**
     * Recursively encodes a key-value pair as parameters in some array.
     * @param {string} k The key for the parameter.
     * @param {string|Object<string, *>|Array<*>} v Value to encode.
     * @param {Array<string>} a The array of parameters.
     */
    function encodeAsParameter(k, v, a) {
        if (KOI.isArray(v)) {
            KOI.each(v, function (index, value) {
                var prefix = [k, "["];
                if (KOI.isArray(value) || KOI.isObject(value)) {
                    prefix.push(index);
                }
                prefix.push("]");
                encodeAsParameter(prefix.join(""), value, a);
            });
            return;
        } else if (KOI.isObject(v)) {
            KOI.each(v, function (name, value) {
                encodeAsParameter(k + "[" + name + "]", value, a);
            });
            return;
        }

        a.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }

    /**
     * Converts an object into a parameter string.
     * @param {Object<string, string|number>} obj The object.
     * @return {string} The parameter string.
     */
    function toParameters(params) {
        var s = [];
        KOI.each(params, function (key, value) {
            encodeAsParameter(key, value, s);
        });
        return s.join("&").replace(RX_20, "+");
    }

    /**
     * Converts a parameter string into an object.
     * @param {string} params The parameter string.
     * @return {Object<string, string>} The parameters.
     */
    function parseParameters(s) {
        var params = {};

        KOI.each(s.replace(RX_SPACE, " ").split("&"), function (i, p) {
            p = p.split("=");

            if (p.length !== 2) {
                // Invalid format; ignore.
                return;
            }

            var k = decodeURIComponent(p[0]),
                keys = [],
                matcher,
                current;

            while(KOI.isValid(matcher = RX_KEY.exec(k))) {
                keys.push(matcher[1]);
            }
            k = k.replace(RX_KEY, "");

            if (keys.length > 0) {
                current = params[k];
                KOI.each(keys, function (ki, key) {
                    if (key === "" || !isNaN(key)) {
                        if (!KOI.isValid(current)) {
                            current = [];
                        }

                        if (isNaN(key)) {
                            key = current.length;
                        } else {
                            key = parseInt(key, 10);
                        }
                    } else {
                        current = {};
                    }
                    current = current[key];
                });
            } else {
                params[k] = decodeURIComponent(p[1]);
            }
        });

        return params;
    }

    /*
     * Parses a deeplink path and returns an object mapping keys to values.
     * @param {string} path The path string.
     * @return {Object<string, string>} The named parameters in it.
     */
    function readPath(path, given) {
        var path_parts = path.split('/'),
            given_parts = given.split('/'),
            params = {};

        for (var i = 0; i < path_parts.length; i++) {
            if (path_parts[i][0] === ':') {
                params[path_parts[i].slice(1)] = given_parts[i];
            }
        }

        return params;
    }

    //------------------------------
    //
    // Event bindings
    //
    //------------------------------

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    KOI.expose({

    //------------------------------
    // Parameters
    //------------------------------

        getParameters: parseParameters(window.location.search.substr(1)),
        toParameters: toParameters,
        parseParameters: parseParameters,
        readPath: readPath

    });

}(window.KOI));


