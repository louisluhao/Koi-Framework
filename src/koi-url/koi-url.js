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
        RX_KEY = /\[([a-z0-9_\-]*)\]/g,

        /**
         * Splits the url into chunks.
         * @type {RegExp}
         */
        RX_URL = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    // URL parsing
    //------------------------------

        /**
         * The basepath for the application.
         * @type {String}
         */
        basepath,

        /**
         * The chunks of the basepath.
         * @type {Array<string>}
         */
        basepathChunks,

        /**
         * If this application is running locally.
         * @type {boolean}
         */
        isLocal = false;

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
        if (KOI.isString(params)) {
            return params;
        }

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
        if (!KOI.isString(s)) {
            return {};
        }

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

            while (KOI.isValid(matcher = RX_KEY.exec(k))) {
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

    //------------------------------
    // URL parsing
    //------------------------------

    /**
     * Split the URL into chunks.
     * @param {string} url The URL.
     * @return {?Array} The chunked URL.
     */
    function chunkURL(url) {
        return RX_URL.exec(url);
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

    //------------------------------
    // URL parsing
    //------------------------------

    // Copied from jQuery
    // IE can throw an exeception if document.domain has been set when reading
    // properties off the location object.
    try {
        basepath = window.location.href;
    } catch (e) {
        // If IE fails here, the location will be appened to an A tag.
        basepath = document.createElement("a");
        basepath.href = "";
        basepath = basepath.href;
    }
    // Chunk the basepath
    basepathChunks = chunkURL(basepath);
    // Determine if we are running locally
    isLocal = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/
        .test(basepathChunks[1]); 

    //------------------------------
    // Methods
    //------------------------------

    KOI.expose({

    //------------------------------
    // Parameters
    //------------------------------

        getParameters: parseParameters(window.location.search.substr(1)),
        toParameters: toParameters,
        parseParameters: parseParameters,

    //------------------------------
    // URL parsing
    //------------------------------
        
        basepath: basepath,
        basepathChunks: basepathChunks,
        isLocal: isLocal,
        chunkURL: chunkURL,

    });

}(window.KOI));

