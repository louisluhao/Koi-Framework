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
         */
    var RX_20 = /%20/g;

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
     * Recursively encode a key-value pair as parameters in some array.
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
        return s.join("&");
    }

    /**
     * Converts a parameter string into an object.
     * @param {string} params The parameter string.
     * @return {Object<string, string>} The parameters.
     */
    function parseParameters(s) {
        var params = {};

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
        parseParameters: parseParameters

    });

}(window.KOI));


