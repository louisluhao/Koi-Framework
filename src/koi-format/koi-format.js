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
    //todo: make the spec stuff handle one internal repl
    //todo: make the spec stuff work
    //note: internal replacement is incompatible with 
    //      unnamed parameters. That's probably important
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
         * Escape a string's special character for creating a regex.
         * new RegExp(text.replace(RX_ESCAPE_FOR_REGEX, "\\$&"))
         * @type {RegExp}
         */
    var RX_ESCAPE_FOR_REGEX = /[\-\[\]{}()*+?.,\\\^$|#\s]/g,

        /**
         * Match a left square bracket.
         * @type {RegExp}
         */
        RX_LBRACKET = /\[/g,

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
         * Match a double format spec.
         * {0:{1:{2}}}
         * @type {RegExp}
         */
        RX_DOUBLE_FORMAT_SPEC_FIELD = /\{[^\{\}]*:\{[^\{\}]*:\{/,

        /**
         * Match the replacement field within a string for formatting.
         * @type {RegExp}
         */
        RX_FORMAT_SPLIT = /\{\{?([^\{\}]*(:{[^\{\}]})?)\}?\}/gi,

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
        RX_FORMAT_INDEX = /^\d+$/,

        /**
         * Match the [[fill]align] spec declaration.
         * @type {RegExp}
         */
        RX_SPEC_FILL_ALIGN = /([^\^<>])?(\^|>|<)/,

        /**
         * Match the [sign] spec declaration.
         * @param {RegExp}
         */
        RX_SPEC_SIGN = /(\+|\-|\s)/,

        /**
         * Match the [#] spec declaration.
         * @param {RegExp}
         */
        RX_SPEC_ALTERNATE = /#/,

        /**
         * Match the [0] spec declaration.
         * @param {RegExp}
         */
        RX_SPEC_ZERO = /0/,

        /**
         * Match the [width] spec declaration.
         * @param {RegExp}
         */
        RX_SPEC_WIDTH = /\d+/,

        /**
         * Match the [.precision] spec declaration.
         * @param {RegExp}
         */
        RX_SPEC_PRECISION = /\.(\d+)/,

        /**
         * Match the [type] declaration.
         * @param {RegExp}
         */
        RX_SPEC_TYPE = /([bcdoxXneEfFgGn%])/;

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
     * Apply the formatting spec to the given string.
     * [[fill]align][sign][#][0][minimumwidth][.precision][type]
     * @param {string} str The string to format.
     * @param {string} spec The formatting spec.
     * @return {string} The formatted string.
     */
    function formatSpec(str, spec) {
        if (KOI.isValid(spec)) {
                // The fill|align pair.
            var fillAlign = spec.match(RX_SPEC_FILL_ALIGN),
                // The fill character
                fill,
                // The alignment character
                align,
                // The formatting sign
                sign,
                // If numeric alternate form should be used
                alternateForm = false,
                // If the zero pad character should be applied
                zeroPad = false,
                // The width to apply
                width,
                // Number precision or max string length
                precision,
                // The number formatting type
                type;

            if (KOI.isValid(fillAlign)) {
                fill = fillAlign[1];
                align = fillAlign[2];
                spec = spec.replace(RX_SPEC_FILL_ALIGN, "");
            }

            sign = spec.match(RX_SPEC_SIGN);
            if (KOI.isValid(sign)) {
                sign = sign[0];
                spec = spec.replace(RX_SPEC_SIGN, "");
            }

            alternateForm = KOI.isValid(spec.match(RX_SPEC_ALTERNATE));
            if (alternateForm) {
                spec = spec.replace(RX_SPEC_ALTERNATE, "");
            }

            zeroPad = KOI.isValid(spec.match(RX_SPEC_ZERO));
            if (zeroPad) {
                spec = spec.replace(RX_SPEC_ZERO, "");
                fill = "0";
            }

            width = spec.match(RX_SPEC_WIDTH);
            if (KOI.isValid(width)) {
                width = parseInt(width[1], 10);
                spec = spec.replace(RX_SPEC_WIDTH, "");
            }

            precision = spec.match(RX_SPEC_PRECISION);
            if (KOI.isValid(precision)) {
                precision = parseInt(precision[1], 10);
                spec = spec.replace(RX_SPEC_PRECISION, "");
            }

            type = spec.match(RX_SPEC_TYPE);
            if (KOI.isValid(type)) {
                type = type[1];
                spec = spec.replace(RX_SPEC_TYPE, "");
            }

            if (spec.length > 0) {
                throw "invalid format spec";
            }

            //todo: modify the string based on the defined spec options
        }

        return str;
    }
    
    /**
     * Perform the replacement of string fields with proper values.
     * @param {string} str The string with fields to replace.
     * @param {?Object.<string, *>} names A dict of named replacement values.
     * @param {?Array.<*>} positions A list of position replacement values.
     * @return {string} The formatted string.
     */
    function stringReplacement(str, names, positions) {
            // Flag to determine if implicit position is used
        var implicitPositioning = null,
            // The current position replacement value
            currentPosition,
            // The max position index defined
            positionMax;

        // Set the max index, used for throwing count errors
        if (KOI.isValid(positions)) {
            positionMax = positions.length - 1;
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
            fieldReplacement = new RegExp(field
                .replace(RX_ESCAPE_FOR_REGEX, "\\$&"));
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
                        contents = contents.replace(key, "");
                        keys[index] = key.substring(1, key.length - 1);
                    });

                // Check for dot replacement keys
                KOI.each(contents.match(RX_FORMAT_DOT_KEY),
                    function (index, key) {
                        if (!KOI.isValid(keys)) {
                            keys = [];
                        } else if (index === 0) {
                            throw "cannot mix dot and bracket syntax";
                        }
                        contents = contents.replace(key, "");
                        keys[index] = key.substring(1);
                    });

                spec = contents.match(RX_FORMAT_SPEC);
                if (KOI.isValid(spec)) {
                    // Remove the spec from the contents
                    contents = contents.replace(spec, "");
                    // Remove the key from the contents
                    spec = spec[0].substring(1);
                    if (KOI.isValid(spec.match(RX_FORMAT_SPLIT))) {
                        spec = stringReplacement(spec, names, positions);
                    }
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

                    value = positions[position];
                } else if (KOI.isValid(name)) {
                    // Named replacement
                    if (!KOI.isValid(names[name])) {
                        throw "missing named value: " + name;
                    }

                    value = names[name];
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

            str = str.replace(fieldReplacement, formatSpec(value, spec));
        }); 

        return str
            .replace(RX_LCURLY_ESCAPED, "{")
            .replace(RX_RCURLY_ESCAPED, "}");
    }

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

            if (KOI.isValid(str.match(/\{[^\{\}]*:\{[^\{\}]*:\{/))) {
                throw "cannot nest format spec fields";
            }

            return stringReplacement(str, namedValues, positionValues);
        } else {
            return "";
        }
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
    // Koi
    //------------------------------

    KOI.expose({
    
    //------------------------------
    // Format
    //------------------------------

        format: format,
        formatSpec: formatSpec

    });

}(window.KOI));

