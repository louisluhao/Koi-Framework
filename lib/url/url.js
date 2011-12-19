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
         * Matches the protocol, hostName, and hostPort of a URL.
         * {@code [:href, :protocol, :host, :port, :path, :search, :hash]}
         * @type {RegExp}
         */
        RX_URL = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?([^\?\#]*)?(\?[^\#]*)?(\#.*)?/,

        /**
         * Matches local protocols.
         * @type {RegExp}
         */
        RX_LOCAL = /^(about|app|app\-storage|.+\-extension|file|res|widget):$/;

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
    // URL
    //------------------------------


    /**
     * Returns an object equivilent to the window.location object.
     * @param {string} url The URL.
     * @param {boolean=} resolvePort Should the port be resolved if it is not
     *     provided? Default is false.
     * @return {?Object<string, value>} The URL.
     */
    function locationEquivalent(url, resolvePort) {
        if (!KOI.isValid(url)) {
            url = window.location.toString();
        }

        var chunks = RX_URL.exec(url);

        if (KOI.isArray(chunks)) {
            if (!KOI.isValid(chunks[3]) && Boolean(resolvePort)) {
                chunks[3] = chunks[1] === "https:" ? "443" : "80";
            }

            return {
                href: chunks[0],
                protocol: chunks[1],
                hostname: chunks[2],
                port: chunks[3] || "",
                host: chunks[2] + 
                    (KOI.isValid(chunks[3]) ? ":" + chunks[3] : ""),
                pathname: chunks[4] || "",
                search: chunks[5] || "", 
                hash: chunks[6] || ""
            };
        }

        return null;
    }

    /**
     * Determines if the given URL is local or not.
     * @param {?string} url The URL. Default is {@code window.location}.
     * @return {boolean} True if the URL is local.
     */
    function isLocal(url) {
        return RX_LOCAL.test(locationEquivalent(url).protocol);
    }

    /**
     * Determines if a URL would be a cross domain request.
     * @param {string} url The URL.
     * @param {string=} compare Comparison URL. Default is
     *     {@code window.location}.
     */
    function isCrossDomain(url, compare) {
        var l = locationEquivalent(url, true),
            w = locationEquivalent(compare, true),
            crossDomain = false;

        if (KOI.isValid(l) && KOI.isValid(w)) {
            KOI.each(["protocol", "hostname", "port"], function (i, v) {
                if (l[v] !== w[v]) {
                    crossDomain = true;
                    return false;
                }
            });
        }

        return crossDomain;
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
    // KOI
    //------------------------------

    KOI.expose({
        
    //------------------------------
    // Properties
    //------------------------------
        
        urlParameters: parseParameters(window.location.search.substr(1)),

    //------------------------------
    // Parameters
    //------------------------------

        toParameters: toParameters,
        parseParameters: parseParameters,

    //------------------------------
    // URL
    //------------------------------
        
        locationEquivalent: locationEquivalent,
        isLocal: isLocal,
        isCrossDomain: isCrossDomain

    });


}(window.KOI));

