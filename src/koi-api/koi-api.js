/**
 * KOI API
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint regexp: true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function (KOI) {
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

    //------------------------------
    // Accept header
    //------------------------------

        /**
         * The default accept header, by data type.
         * @type {Object<string, string>}
         */
        DEFAULT_ACCEPT_HEADERS = {
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

        /**
         * Defined requesters identifiers for handling on-use calls.
         * @type {Object<string, boolean>}
         */
        requesters = {},

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
        return document.head || document.getElementsByTagName( "head" )[0] || 
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
            url = (RX_QUERY.test(url) ? "&_=" : "?_=") + now();
        }
        return url;
    }

    /**
     * Parses JSON.
     * @param {string} data The JSON to parse.
     */
    function parseJSON(data) {
        data = data.replace(RX_JSON_AT, "@").replace(RX_JSON_BRACKET, "]")
            .replace(RX_JSON_INVALID, "");
        if (RX_JSON.text(data)) {
            if (window.JSON !== undefined && window.JSON.parse !== undefined) {
                return window.JSON.parse(data);
            } else {
                return (new Function("return " + data))();
            }
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
     */
    function formatResponseBodies(name, bodies) {
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
     */
    function callResponse(name, sCode, bodies) {
        var isSuccess = false,
            data,
            eventType = ["api", name];
        if (sCode > 200 && sCode < 300 || sCode === 304) {
            try {
                data = formatResponseBody(name, bodies);
                isSuccess = true;
            } catch (e) {
                data = e;
            }
        } else {
            try {
                data = formatResponseBody(name, bodies);
            } catch (e) {
                data = bodies.text;
            }
        }
        if (isSuccess) {
            eventType.push("success");
        } else {
            eventType.push("failure");
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
     */
    function xhrResponseHandler(ro, name) {
        return function () {
            var sCode,
                responses,
                c = calls[name];
            // Insulate against NS_ERROR_NOT_AVAILABLE in firefox
            try {
                if (xhr.readyState === 4) {
                    sCode = ro.status;
                    responses = {
                        text: ro.responseText
                    };
                    // Local requests with data should be successful.
                    if (!sCode && isLocal && !c.crossDomain) {
                        sCode = responses.text ? 200 : 404; 
                    } else if (sCode === 1223) {
                        // IE somtimes returns a 1223 instead of a 204
                        sCode = 204;
                    }
                }
            } catch (e) {
                callResponse(name, -1);
            }
            if (resposnes) {
                callResponse(name, sCode, responses);
            }
        };
    }

    /**
     * Executes an XMLHttpRequest..
     * @param {string} name The name of the call.
     * @param {string} url The resource requested.
     * @param {boolean=} cache Allow the resource to be cached. Default false.
     * @param {Object<string, *>=} data The request data.
     * @param {string=} action The HTTP action. Default is GET.
     * @param {Object<string, string>=} header request headers.
     */
    function xhr(name, url, cache, data, action, headers) {
        // Set the action
        if (!KOI.isValid(action)) {
            action = "GET";
        } else {
            action = action.toUpperCase();
        }
        // Create the request object
        var ro;
        try {
            ro = new XMLHttpRequest();
        } catch (e) {
            ro = new ActiveXObject("Microsoft.XMLHTTP");
        }
        // Create an empty headers block
        if (!KOI.isObject(headers)) {
            headers = {};
        }
        // Set the default header type
        if (!KOI.isValid(headers["Content-Type"])) {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        // Handle the post body
        if (action === "POST") {
            data = KOI.toParameters(data);
        } else {
            url += (RX_QUERY.test(url) ? "&" : "?") + KOI.toParameters(data);
            data = null;
        }
        // Open the request
        ro.open(action, formatURL(url, Boolean(cache)), true);
        // Execute
        ro.send(data);
        // Get the handler
        var handler = xhrResponseHandler(ro, name);
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
     * @return {string} The JSONP token.
     */
    function jsonp(name) {
        var name = ["jsonp", now(), uid++].join("_");
        window[name] = function (data) {
            callResponse(name, 200, "application/json", {json: data});
        };
        return name;
    }

    /**
     * Loads a javascript file. Based on jQuery.getScript.
     * @param {string} name The name of the call.
     * @param {string} url The script to load.
     * @param {boolean=} cache Allow the resource to be cached. Default false.
     * @param {Object<string, *>=} data The request data.
     */
    function script(name, url, cache, data) {
        var e = document.createElement("script"),
            h = head(),
            loaded = false,
            triggerHandler = false;
        // Handle JSONP support
        if (RX_JSONP.test(url)) {
            url = url.replace(RX_JSONP, "$1=" + jsonp(name)); 
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
                    callResponse(name, 200, "text/javascript");
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
     * @param {string=} dType The dataType. Default is "json".
     * @param {boolean=} cache Cache the request. Default is false.
     * @param {string=} accept The accept type. Default depends on dType.
     * @param {string=} cType The contentType.
     */
    function create(name, url, dType, cache, accept, cType) {
        var basepath = KOI.basepathChunks,
            chunks;
        // Remove the hash and make implicit protocols explicit for IE7
        url = url.replace(RX_HASH, "").replace(RX_PROTOCOL, basepath[1]);
        // Chunk the URL for testing
        chunks = KOI.chunkURL(url);
        // Set the data type
        dType = dType || "json";
        // Define the call
        calls[name] = {
            url: url,
            dataType: dType,
            cache: Boolean(cache),
            accept: accept || DEFAULT_ACCEPT[accept] || ACCEPT_ALL,
            contentType: cType,
            crossDomain: (parts && 
                (chunks[1] !== basepath[1] || chunks[2] !== basepath[2] ||
                (chunks[3] || (chunks[1] === "http:" ? 80 : 443)) !==
                    (basepath[3] || basepath[3] === "http:" ? 80 : 443)))
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
     * @param {Object<string, *>} data The data for the call.
     */
    function call(name, data) {
        var c = calls[name];
        if (!KOI.isValid(c)) {
            throw name + " is not a defined API call.";
        }
    }

    //------------------------------
    // Request proxy
    //------------------------------

    /**
     * Wraps the given handler in a proxy to only dispatch it when a
     * specific call has completed.
     * @param {string} rid The id of the requester key.
     * @param {function(Object|Array|string, number)} handler The handler.
     * @return {function(Object|Array|string, number)} The proxy listener.
     */
    function onceProxy(rid, handler) {
        return function () {
            if (requesters[rid]) {
                requesters[rid] = false;
                handler.apply(handler, arguments);
            }
        }
    }

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
     * @return {function(Object<string, *)} The request function. Invoke
     *     with a data object to trigger a call.
     */
    function request(name, success, failure) {
        var rid = [name, uid++].join("-");
        requesters[rid] = false;
        bind(onceProxy(rid, success), onceProxy(rid, failure));
        return function (data) {
            requesters[rid] = true;
            call(name, data);
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

}(window.KOI));

