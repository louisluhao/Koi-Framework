/**
 * KOI format
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
     * todo: readme
     * todo: formatting spec
     */

    //------------------------------
    //
    // Constants
    //
    //------------------------------

    //------------------------------
    // Expressions
    //------------------------------

        /**
         * Match a left square bracket.
         * @type {RegExp}
         */
    var RX_LBRACKET = /\[/g,

        /**
         * Match a right square bracket.
         * @type {RegExp}
         */
        RX_RBRACKET = /\]/g,

        /**
         * Match a left curly brace.
         * @type {RegExp}
         */
        RX_LCURLY = /\{/g,

        /**
         * Match a left curly brace.
         * @type {RegExp}
         */
        RX_LCURLY_ESCAPED = /\\\{/g,

        /**
         * Match a right curly brace.
         * @type {RegExp}
         */
        RX_RCURLY = /\}/g,

        /**
         * Match a left curly brace.
         * @type {RegExp}
         */
        RX_RCURLY_ESCAPED = /\\\}/g,

        /**
         * Match the replacement field within a string for formatting.
         * @type {RegExp}
         */
        RX_FORMAT_SPLIT = /\{\{?([^\{\}]*)\}?\}/gi,

        /**
         * Match an escaped replacement field.
         * {{}}
         * @type {RegExp}
         */
        RX_FORMAT_ESCAPED = /\{\{([^}]*)\}\}/gi,

        /**
         * Match the dot-key syntax within a replacement field.
         * {0.name}
         * @type {RegExp}
         */
        RX_FORMAT_DOT_KEY = /\.[a-zA-Z0-9_\-]+/g,

        /**
         * Match the bracket-key syntax within a replacement field.
         * {0[name]}
         * @type {RegExp}
         */
        RX_FORMAT_BRACKET_KEY = /\[([^\]]+)\]/g,

        /**
         * Match the coersion syntax within a replacement field.
         * {0:fill^30}
         * @type {RegExp}
         */
        RX_FORMAT_SPEC = /:(.*)/g,

        /**
         * Match only a digit.
         * @type {RegExp}
         */
        RX_FORMAT_INDEX = /^\d+$/;

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
    // Format
    //------------------------------

    /**
     * Format a string.
     * @param {...*} var_args Arguments to the method.
     * @return {string} The formatted string.
     */
    function format(var_args) {
        var str,
            namedValues,
            positionValues,
            args = Array.prototype.slice.call(arguments),
            // The current position replacement value
            currentPosition,
            // Flag to determine if implicit position is used
            implicitPositioning = null,
            // The max position index defined
            positionMax,
            // The number of left curly braces defined
            leftBraceCount,
            // The number of right curly braces defined
            rightBraceCount;

        // Disambiguate the use of this function.
        if (args.length >= 3 && KOI.isBoolean(args[0])) {
            // collapsed; replacements provided as a single value
            str = args[1];
            if (KOI.isObject(args[2])) {
                // function(true, str, Object, ...);
                namedValues = args[2];
                if (args.length > 3) {
                    // mixed mode; named and argument replacements
                    if (args[0] === false && KOI.isArray(args[3])) {
                        // function(false, str, Object, Array)
                        positionValues = args[3];
                    } else {
                        positionValues = args.slice(3); 
                    }
                }
            } else if (KOI.isArray(args[2])) {
                // function(true, str, Array);
                positionValues = args[2];
            }
        } else {
            // expanded; position replacements provided as KOI.each argument
            str = args[0];
            positionValues = args.slice(1);
        }

        if (KOI.isString(str)) {
            str = str
                .replace(RX_LCURLY_ESCAPED, "\\")
                .replace(RX_RCURLY_ESCAPED, "\\");

            leftBraceCount = str.match(RX_LCURLY);
            rightBraceCount = str.match(RX_RCURLY);

            if (!KOI.isValid(leftBraceCount)) {
                leftBraceCount = [];
            }

            if (!KOI.isValid(rightBraceCount)) {
                rightBraceCount = [];
            }

            if (leftBraceCount.length !== rightBraceCount.length) {
                if (leftBraceCount.length > rightBraceCount.length) {
                    throw "single { detected";
                } else {
                    throw "single } detected";
                }
            }

            // Set the max index, used for throwing count errors
            if (KOI.isValid(positionValues)) {
                positionMax = positionValues.length - 1;
            }

            KOI.each(str.match(RX_FORMAT_SPLIT), function (index, field) {
                // A the index of a position replacement 
                var position,
                // The name of a named field replacement
                    name,
                // Used to replace the field in the string
                    fieldReplacement,
                // The replacement value
                    value,
                // A key on the replacement value to use
                    keys,
                // The content between the field's braces
                    contents,
                // The formatting spec
                    spec;

                // Escape curly braces for proper RegExp generation
                // todo: Make this an escape for regexp function
                fieldReplacement = new RegExp(field
                    .replace(RX_LBRACKET, "\\[")
                    .replace(RX_RBRACKET, "\\]")
                    .replace(RX_LCURLY, "\\{")
                    .replace(RX_RCURLY, "\\}"));
                // Remove curly braces to handle the contents of the field
                contents = field.substring(1,
                    field.length - 1);

                if (field === "{}") {
                    // Implicit positioning
                    if (!KOI.isValid(implicitPositioning)) {
                        implicitPositioning = true;
                        currentPosition = 0;
                    }

                    if (!implicitPositioning) {
                        throw "cannot mix explicit and implicit counting";
                    }

                    // Return then incrememnt the current position
                    position = currentPosition++;
                } else if (KOI.isValid(field.match(RX_FORMAT_ESCAPED))) {
                    // {{}} is an escaped string
                    value = contents
                        .replace(RX_LCURLY, "\\{")
                        .replace(RX_RCURLY, "\\}");
                } else { 
                    // Check for bracket replacement keys
                    KOI.each(contents.match(RX_FORMAT_BRACKET_KEY),
                        function (index, key) {
                            if (!KOI.isValid(keys)) {
                                keys = [];
                            }
                            contents = contents
                                .replace(key, "");
                            keys[index] = key
                                .substring(1, key.length - 1);
                        });

                    // Check for dot replacement keys
                    KOI.each(contents.match(RX_FORMAT_DOT_KEY),
                        function (index, key) {
                            if (!KOI.isValid(keys)) {
                                keys = [];
                            } else if (index === 0) {
                                throw "cannot mix dot and bracket syntax";
                            }
                            contents = contents
                                .replace(key, "");
                            keys[index] = key.substring(1);
                        });

                    spec = contents.match(RX_FORMAT_SPEC);
                    if (KOI.isValid(spec)) {
                        // Remove the spec from the contents
                        contents = contents.replace(spec, "");
                        // Remove the key from the contents
                        spec = spec[0].substring(1);
                        //todo: make the spec stuff work
                        //todo: make the spec stuff extensible
                        //todo: make the spec stuff handle one internal repl
                        //note: internal replacement is incompatible with 
                        //      unnamed parameters. That's probably important
                        console.log(spec);
                    }

                    if (contents.match(RX_FORMAT_INDEX)) {
                        if (!KOI.isValid(implicitPositioning)) {
                            implicitPositioning = false;
                        }

                        if (implicitPositioning) {
                            throw "cannot mix explicit and implicit counting";
                        }

                        // Position replacement with explicit index
                        position = parseInt(contents, 10);
                    } else {
                        // Named replacement
                        name = contents;
                    }
                }

                if (!KOI.isValid(value)) {
                    // value is already set for escaped strings only
                    if (KOI.isValid(position)) {
                        // Position replacement
                        if (position > positionMax) {
                            throw "fields and values do not match";
                        }

                        value = positionValues[position];
                    } else if (KOI.isValid(name)) {
                        // Named replacement
                        if (!KOI.isValid(namedValues[name])) {
                            throw "missing named value: " + name;
                        }

                        value = namedValues[name];
                    }
                }

                if (KOI.isFunction(value)) {
                    value = value.call(window);
                }

                if (KOI.isValid(keys)) {
                    KOI.each(keys, function (index, key) {
                        if (KOI.isValid(value[key])) {
                            value = value[key];
                        } else {
                            throw "key error: " + key;
                        }
                    });
                }

                str = str.replace(fieldReplacement, value);
            }); 

            return str
                .replace(RX_LCURLY_ESCAPED, "{")
                .replace(RX_RCURLY_ESCAPED, "}");
        } else {
            str = "";
        }
        
        return str;
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
    // Format
    //------------------------------

        format: format

    });

}(window.KOI));

