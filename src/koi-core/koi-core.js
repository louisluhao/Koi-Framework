/**
 * KOI core 
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint regexp: true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function () {
    "use strict";

    //------------------------------
    //
    // Constants
    //
    //------------------------------

    //------------------------------
    // Expressions
    //------------------------------

        /**
         * Match the print out for variable.constructor.toString().
         * @type {RegExp}
         */
    var RX_TYPE_SPLIT = /\s([A-Za-z0-9]+)\(/,

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    // Events
    //------------------------------

        /**
         * Events and listeners. 
         * @type {Object.<string, Array.<function(...*)>>}
         */
        events = {};

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    // Variable checking
    //------------------------------

    /**
     * Determine if a variable is null.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is null.
     */
    function isNull(v) {
        return v === null;
    }

    /**
     * Determine if a variable is undefined.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is undefined.
     */
    function isUndefined(v) {
        return v === undefined;
    }

    /**
     * Determine if a variable is not null or undefined.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is valid.
     */
    function isValid(v) {
        return !(isNull(v) || isUndefined(v));
    }

    /**
     * Return the type of a variable, based on its constructor.
     * @param {?*} v The variable.
     * @return {?string} The type of variable, or null.
     */
    function getType(v) {
        if (isValid(v)) {
            // ["function Function() { [native code] }", "Function"]
            var type = v.constructor.toString().match(RX_TYPE_SPLIT);
            if (isValid(type) && isValid(type[1])) {
                return type[1].toLowerCase();
            }
        }
       
        return null;
    }

    /**
     * Determine if a variable is of some type.
     * @param {?*} v v The variable.
     * @param {string} type The type to check against.
     * @return {boolean} Whether the variable is of the type.
     */
    function isOfType(v, type) {
        if (isValid(type)) {
            return getType(v) === type.toLowerCase();
        }

        return false;
    }

    /**
     * Determine if a variable is an array.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is an array.
     */
    function isArray(v) {
        return isOfType(v, "array");
    }

    /**
     * Determine if a variable is an object.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is an object.
     */
    function isObject(v) {
        return isOfType(v, "object");
    }

    /**
     * Determine if a variable is a function.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is a function.
     */
    function isFunction(v) {
        return isOfType(v, "function");
    }

    /**
     * Determine if a variable is a number.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is a number.
     */
    function isNumber(v) {
        return isOfType(v, "number");
    }

    /**
     * Determine if a variable is a string.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is a string.
     */
    function isString(v) {
        return isOfType(v, "string");
    }

    /**
     * Determine if a variable is a regexp.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is a regexp.
     */
    function isRegExp(v) {
        return isOfType(v, "regexp");
    }

    /**
     * Determine if a variable is a date.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is a date.
     */
    function isDate(v) {
        return isOfType(v, "date");
    }

    /**
     * Determine if a variable is a boolean.
     * @param {?*} v The variable.
     * @return {boolean} Whether the variable is a boolean.
     */
    function isBoolean(v) {
        return isOfType(v, "boolean");
    }

    /**
     * Determine if the object or array is empty.
     * @param {?Array|Object} v The variable.
     * @return {boolean} Whether the variable is empty.
     */
    function isEmpty(v) {
        if (isValid(v)) {
            if (isArray(v) || isString(v)) {
                return v.length === 0;
            } else if (isObject(v)) {
                var key;
                for (key in v) {
                    if (v.hasOwnProperty(key)) {
                        return false;
                    }
                }

                return true;
            }
        }

        return true;
    }

    //------------------------------
    // Utilities
    //------------------------------

    /**
     * Call an iterator function for each element within the source.
     * Have the iterator return false to break. 
     * @param {?Array|Object|number} src The source for iteration.
     * @param {function(this:Array|Object|number, string|number, *)} iterator 
     *     An iterator callback.
     */
    function each(src, iterator) {
        var key,
            index,
            length;
        
        if (isFunction(iterator) && isValid(src)) {
            if (isObject(src) && !isEmpty(src)) {
                for (key in src) {
                    if (src.hasOwnProperty(key)) {
                        if (iterator.call(src, key, src[key]) === false) {
                            return;
                        }
                    }
                }
            } else if (isArray(src) && !isEmpty(src)) {
                index = 0;
                length = src.length;
                for (; index < length; index++) {
                    if (iterator.call(src, index, src[index]) === false) {
                        return;
                    }
                }
            } else if (isNumber(src) && src > 0) {
                index = 0;
                for (; index < src; index++) {
                    if (iterator.call(src, index, index) === false) {
                        return;
                    }
                }
            }
        }
    }

    /**
     * Expose methods on koi.
     * @param {Object.<string, function(...[*]>} methods The methods to expose.
     */
    function expose(methods) {
        if (window.KOI === undefined) {
            window.KOI = {};
        }

        each(methods, function (name, method) {
            if (window.KOI[name] === undefined) {
                window.KOI[name] = method;
            } else {
                throw name + "is already exposed";
            }
        });
    }

    //------------------------------
    // Events
    //------------------------------

    /**
     * Bind a listener to some event.
     * The eventType parameter accepts a number of formats.
     * "event-name": Listens for "event-name".
     * "event-name other-event": Listens for "event-name" and "other-event".
     * "event-name.namespace": Listens for "event-name" within "namespace".
     * ".namespace": Listens for all events within "namespace".*
     * @param {string} eventType The type of event to bind to.
     * @param {function(...*)} listener The event listener.
     */
    function bind(eventType, listener) {
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

    expose({

    //------------------------------
    // Variable checking
    //------------------------------
    
        isNull: isNull,
        isUndefined: isUndefined,
        isValid: isValid,
        isOfType: isOfType,
        isArray: isArray,
        isObject: isObject,
        isFunction: isFunction,
        isNumber: isNumber,
        isString: isString,
        isRegExp: isRegExp,
        isDate: isDate,
        isBoolean: isBoolean,
        isEmpty: isEmpty,

    //------------------------------
    // Utility methods
    //------------------------------
   
        each: each,
        expose: expose

    });

}());

