/**
 * KOI API
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint evil:true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function (KOI) {
    "use strict";

    /**
     * todo: create readme
     * note: non-json calls do not support error callbacks
     * todo: convert calls of content type application/json to stringify JSON
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
         * Matches query parameters in a URL.
         * @type {RegExp}
         */
    var RX_QUERY = /\?/,

        /**
         * Matches a jsonp token in the get parameters of the URL. (foo=?)
         * @type {RegExp}
         */
        RX_JSONP = /([^\=\?]+)=\?(&|$)/i,

        /**
         * Matches a location hash and its contents. (foo.com/#/bar)
         * @type {RegExp}
         */
        RX_HASH = /#.*$/,

        /**
         * Matches protocol slashes at the start of a URL (//foo.com).
         * IE7 has an issue with implicit protocols.
         * @type {RegExp}
         */
        RX_PROTOCOL = /^\/\//,

        /**
         * Matches colon-identified URL parameters. (/a/:b/c/:d/)
         * @type {RegExp}
         */
        RX_URL_PARAMETERS = /:([a-z0-9_\-]+)\b/gi,

    //------------------------------
    // Accept header
    //------------------------------

        /**
         * The default accept header, by data type.
         * @type {Object<string, string>}
         */
        DEFAULT_ACCEPT = {
            json: "application/json, text/javascript",
            jsonp: "application/json, text/javascript",
            html: "text/html",
            text: "text/plain"
        },

        /**
         * The accept all header. Syntax avoids lint and compression issues.
         * @type {string}
         */
        ACCEPT_ALL = ["*/"] + ["*"],

        /**
         * The default content type header.
         * @type {string}
         */
        DEFAULT_CONTENT_TYPE = "application/x-www-form-urlencoded",

        /**
         * Matches valid JSON.
         * @type {RegExp}
         */
        RX_JSON = /^[\],:{}\s]*$/,
        
        /**
         * Replacement for '@' symbols in JSON.
         * @type {RegExp}
         */
        RX_JSON_AT = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,

        /**
         * Replacement for ']' symbols in JSON.
         * @type {RegExp}
         */
        RX_JSON_BRACKET = 
            /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,

        /**
         * Replacement for invalid characters in JSON.
         * @type {RegExp}
         */
        RX_JSON_INVALID = /(?:^|:|,)(?:\s*\[)+/g,

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    // Requests
    //------------------------------

        /**
         * Unique identifier for requests.
         * @type {number}
         */
        uid = 0,

    //------------------------------
    // Calls
    //------------------------------

        /**
         * Defined API calls.
         * @type {Object<string, Object<string, string>>}
         */
        calls = {};

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    // Utilities
    //------------------------------

    /**
     * Returns the current unixtime in milliseconds.
     * @return {number} The current unixtime.
     */
    function now() {
        return (new Date()).valueOf();
    }

    /**
     * Returns a reference to the document head.
     * @return {HTMLElement} The document head.
     */
    function head() {
        return document.head || document.getElementsByTagName("head")[0] || 
            document.documentElement;
    }

    /**
     * Formats the URL.
     * @param {string} url The URL.
     * @param {boolean} cache Allow the request to be cached.
     * @return {string} The URL.
     */
    function formatURL(url, cache) {
        if (!cache) {
            url += (RX_QUERY.test(url) ? "&_=" : "?_=") + now();
        }
        return url;
    }

    /**
     * Parses JSON.
     * @param {string} data The JSON to parse.
     */
    function parseJSON(data) {
        if (KOI.isValid(window.JSON) && KOI.isValid(window.JSON.parse)) {
            return window.JSON.parse(data);
        }

        var test_data = data
                .replace(RX_JSON_AT, "@")
                .replace(RX_JSON_BRACKET, "]")
                .replace(RX_JSON_INVALID, "");

        if (RX_JSON.test(test_data)) {
            return (new Function("return " + data))();
        } else {
            throw "JSON parse error";
        }
    }

    //------------------------------
    // Response handling
    //------------------------------

    /**
     * Formats response bodies based on the content type of the call.
     * @param {string} name The name of the call.
     * @param {Object<string, string>} bodies Response bodies.
     * @return {*} The response body.
     */
    function formatResponseBodies(name, bodies) {
        if (!KOI.isValid(bodies)) {
            return "";
        }
        var c = calls[name];
        if (c.dataType === "jsonp" && KOI.isValid(bodies.json)) {
            return bodies.json; 
        }
        if (c.dataType === "json" && KOI.isValid(bodies.text)) {
            return parseJSON(bodies.text);
        }
        return bodies.text;
    }

    /**
     * Handles the response for a call.
     * Based off jQuery.
     * @param {string} name The name of the call.
     * @param {number} sCode The status code of the response.
     * @param {Object<string, string>} bodies Response bodies.
     * @param {string=} rid The request ID for proxies.
     */
    function callResponse(name, sCode, bodies, rid) {
        var isSuccess = false,
            data,
            eventType = ["api", name],
            result;
        if ((sCode >= 200 && sCode < 300) || sCode === 304) {
            try {
                data = formatResponseBodies(name, bodies);
                isSuccess = true;
            } catch (parseError) {
                data = parseError;
            }
        } else {
            try {
                data = formatResponseBodies(name, bodies);
            } catch (e) {
                data = bodies.text;
            }
        }
        result = isSuccess ? "success" : "failure";
        eventType.push(result);
        if (KOI.isValid(rid)) {
            KOI.trigger(["api", rid, result].join("-"), data, sCode);
        }
        KOI.trigger(eventType.join("-"), data, sCode);
    }

    //------------------------------
    // XMLHTTPRequest transport
    //------------------------------

    /**
     * Returns a closure which handles XHR responses.
     * Based off jQuery.
     * @param {XMLHTTPRequest} ro The request object.
     * @param {string} name The name of the request.
     * @param {string=} rid The request ID for proxies.
     */
    function xhrResponseHandler(ro, name, rid) {
        return function () {
            var sCode,
                responses,
                c = calls[name];
            // Insulate against NS_ERROR_NOT_AVAILABLE in firefox
            try {
                if (ro.readyState === 4) {
                    sCode = ro.status;
                    responses = {
                        text: ro.responseText
                    };
                    // Local requests with data should be successful.
                    if (!sCode && KOI.isLocal && !c.crossDomain) {
                        sCode = responses.text ? 200 : 404; 
                    } else if (sCode === 1223) {
                        // IE somtimes returns a 1223 instead of a 204
                        sCode = 204;
                    }
                }
            } catch (e) {
                callResponse(name, -1, undefined, rid);
            }
            if (responses) {
                callResponse(name, sCode, responses, rid);
            }
        };
    }

    /**
     * Executes an XMLHttpRequest..
     * @param {string} name The name of the call.
     * @param {string} url The resource to load.
     * @param {Object<string, *>} data The request data.
     * @param {Object<string, string>} header request headers.
     * @param {string=} rid The request ID for proxies.
     */
    function xhr(name, url, data, headers, rid) {
        if (KOI.isLocal(window.location.toString())) {
            throw "AJAX calls cannot be made locally";
        }

        var c = calls[name],
            ro,
            handler;
        // Create the request object
        try {
            ro = new XMLHttpRequest();
        } catch (e) {
            ro = new window.ActiveXObject("Microsoft.XMLHTTP");
        }
        // Create an empty headers block
        if (!KOI.isObject(headers)) {
            headers = {};
        }
        if (!KOI.isValid(headers["Content-Type"])) {
            headers["Content-Type"] = c.cType;
        }
        if (!KOI.isValid(headers.Accept)) {
            headers.Accept = c.accept;
        }
        // Handle the post body
        if (c.method === "POST") {
            data = KOI.toParameters(data);
        } else if (!KOI.isEmpty(data)) {
            url += (RX_QUERY.test(c.url) ? "&" : "?") + KOI.toParameters(data);
            data = null;
        }
        // Open the request
        ro.open(c.method, formatURL(url, Boolean(c.cache)), true);
        // Set request headers
        KOI.each(headers, function (k, v) {
            try {
                ro.setRequestHeader(k, v);
            } catch (ex) {
                // Noop
            }
        });
        // Execute
        ro.send(data || null);
        // Get the handler
        handler = xhrResponseHandler(ro, name, rid);
        // IE6/7 return from the cache directly, requiring manual triggering
        if (ro.readyState === 4) {
            handler();
        } else {
            ro.onreadystatechange = handler;
        }
    }

    //------------------------------
    // Script transport
    //------------------------------

    /**
     * Creates a JSONP token for the handler.
     * @param {string} name The name of the call.
     * @param {string=} rid The request ID for proxies.
     * @return {string} The JSONP token.
     */
    function jsonpToken(name, rid) {
        var callback = ["jsonp", now(), uid++].join("_");
        window[callback] = function (data) {
            callResponse(name, 200, {json: data}, rid);
        };
        return callback;
    }

    /**
     * Tests a URL for a JSONP token.
     * @param {string} url The URL.
     * @return {boolean} True if the URL has a JSONP token.
     */
    function usesJSONP(url) {
        return RX_JSONP.test(url);
    }

    /**
     * Loads a javascript file. Based on jQuery.getScript.
     * @param {string} name The name of the call.
     * @param {string} url The script to load.
     * @param {boolean=} cache Allow the resource to be cached. Default false.
     * @param {Object<string, *>=} data The request data.
     * @param {string=} rid The request ID for proxies.
     */
    function script(name, url, cache, data, rid) {
        var e = document.createElement("script"),
            h = head(),
            loaded = false,
            triggerHandler = false;
        url += (RX_QUERY.test(url) ? "&" : "?") + KOI.toParameters(data);
        data = null;
        // Handle JSONP support
        if (usesJSONP(url)) {
            url = url.replace(RX_JSONP, "$1=" + jsonpToken(name, rid)); 
        } else {
            triggerHandler = true; 
        }
        // Setup the script tag
        e.type = "text/javascript";
        e.async = "async";
        e.src = formatURL(url, Boolean(cache));
        e.onload = e.onreadystatechange = function () {
            var s = this.readyState;
            if (!loaded && (!s || s === "loaded" || s === "complete")) {
                loaded = true;
                e.onload = e.onreadystatechange = null;
                if (h && e.parentNode) {
                    h.removeChild(e); 
                }
                e = undefined;
                if (triggerHandler) {
                    callResponse(name, 200, undefined, rid);
                }
            }
        };
        // Load the script
        h.insertBefore(e, h.firstChild);
    }

    //------------------------------
    // API Calls
    //------------------------------

    /**
     * Creates an API call.
     * @param {name} name The name of the call.
     * @param {string} url The URL.
     * @param {string=} method The method. Default is "GET".
     * @param {string=} dType The dataType. Default is "json".
     * @param {boolean=} cache Cache the request. Default is false.
     * @param {string=} accept The accept type. Default depends on dType.
     * @param {string=} cType The contentType.
     */
    function create(name, url, method, dType, cache, accept, cType) {
        // Remove the hash and make implicit protocols explicit for IE7
        url = url
            .replace(RX_HASH, "")
            .replace(RX_PROTOCOL, window.location.protocol);
        // Set the data type
        dType = dType || "json";
        // Define the call
        calls[name] = {
            url: url,
            urlParameters: url.match(RX_URL_PARAMETERS),
            method: (method || "GET").toUpperCase(),
            dataType: dType,
            cache: Boolean(cache),
            accept: accept || DEFAULT_ACCEPT[dType] || ACCEPT_ALL,
            contentType: cType || DEFAULT_CONTENT_TYPE,
            crossDomain: KOI.isCrossDomain(url)
        };
    }

    /**
     * Binds success and failure listeners for each instance of the call.
     * Each handler object receives the payload and status code of the
     * request.
     * @param {string} name The name of the call.
     * @param {function(Object|Array|string, number)=} success The 
     *     handler to notify when the call completes successfully.
     * @param {function(Object|Array|string, number)=} failure The handler
     *     to notify when the call fails. 
     */
    function bind(name, success, failure) {
        if (KOI.isFunction(success)) {
            KOI.bind(["api", name, "success"].join("-"), success);
        }
        if (KOI.isFunction(failure)) {
            KOI.bind(["api", name, "failure"].join("-"), failure);
        }
    }

    /**
     * Invokes an API call.
     * @param {string} name The name of the call.
     * @param {Object<string, *>=} data The data for the call.
     *
     * @param {Object<string, string>=} headers The headers for the call.
     * @param {string=} rid The request ID for proxies.
     */
    function invoke(name, data, headers, rid) {
        var c = calls[name],
            url;
        if (!KOI.isValid(c)) {
            throw name + " is not a defined API call.";
        }

        url = c.url;

        if (KOI.isValid(c.urlParameters)) {
            KOI.each(c.urlParameters, function (index, parameter) {
                    // Remove the colon
                var name = parameter.substr(1);
                if (!KOI.isValid(data) || !KOI.isValid(data[name])) {
                    throw "URL parameter missing: " + name;
                }
                url = url.replace(parameter, data[name]);
                delete data[name];
            });
        }

        if (c.crossDomain || KOI.inArray(c.dataType, ["jsonp", "script"])) {
            script(name, url, c.cache, data, rid);
        } else {  
            xhr(name, url, data, headers, rid);
        }
    }

    //------------------------------
    // Request proxy
    //------------------------------

    /**
     * Creates a requrst function for the call.
     * Invoking the request function will trigger a call which dispatches
     * to the provided handlers.
     * Each handler object receives the payload and status code.
     * @param {string} name The name of the call.
     * @param {function(Object|Array|string, number)} success The 
     *     handler to notify when the call completes successfully.
     * @param {function(Object|Array|string, number)} failure The handler
     *     to notify when the call fails. 
     * @return {function(Object<string, *>, Object<string, string>)} The 
     *     request function. Invoke with a data object to trigger a call.
     */
    function requestProxy(name, success, failure) {
        var rid = [name, uid++].join("-");
        bind(rid, success, failure);
        return function (data, headers) {
            invoke(name, data, headers, rid);
        };
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
    // API Calls
    //------------------------------
    
        jsonpToken: jsonpToken,
        usesJSONP: usesJSONP,
        calls: calls,
        create: create,
        bind: bind,
        invoke: invoke,

    //------------------------------
    // Request proxy
    //------------------------------

        requestProxy: requestProxy

    }, "api");

}(window.KOI));

