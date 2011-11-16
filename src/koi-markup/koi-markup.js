/**
 * KOI markup 
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, maxerr: 50, indent: 4, maxlen: 79 */
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
         * Matches classes in an element string. 'div.class'
         * @type {RegExp}
         */
    var RX_CLASS = /\.([a-zA-Z0-9_\-]+)/g,

        /**
         * Matches attributes in an element string. 'div[attr=value]'
         * @type {RegExp}
         */
        RX_ATTRIBUTE = /\[([a-z0-9_\-]+)=([^\]]+)\]/g,

        /**
         * Matches IDs in an element string. 'div#id'
         * @type {RegExp}
         */
        RX_ID = /#([a-zA-Z0-9_\-]+)/g;

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
    // Markup
    //------------------------------

    /**
     * Parse HTML shorthand into an Element. 
     * @param {string} shorthand The shorthand.
     * @return {Element} The created element.
     */
    function parseShorthand(shorthand) {
            // The element's attributes
        var attributes = {},
            // The element's classes
            classes = [],
            // The tag name
            tagName,
            // The HTML element
            element,
            // The matcher
            matcher;

        // Extract attributes
        while (KOI.isValid(matcher = RX_ATTRIBUTE.exec(shorthand))) {
            attributes[matcher[1]] = matcher[2];
        }
        shorthand = shorthand.replace(RX_ATTRIBUTE, "");
        // Extract classes
        while (KOI.isValid(matcher = RX_CLASS.exec(shorthand))) {
            if (!KOI.inArray(matcher[1], classes)) {
                classes.push(matcher[1]);
            }
        }
        shorthand = shorthand.replace(RX_CLASS, "");
        // Extract ID attribute
        while (KOI.isValid(matcher = RX_ID.exec(shorthand))) {
            attributes.id = matcher[1];
        }
        shorthand = shorthand.replace(RX_ID, "");

        // Create the element
        element = document.createElement(shorthand);
        element.className = classes.join(" ");
        KOI.each(attributes, function (key, value) {
            element.setAttribute(key, value);
        });

        return element;
    }

    /**
     * Creates Elements from shorthand.
     * @param {...string|Array<string>} var_args The elements to parse.
     * @return {DocumentFragment|Element} Returns a single element or a 
     *     DocumentFragment of multiple elements.
     */
    function markup(var_args) {
            // The document fragment
        var fragment = document.createDocumentFragment();
        KOI.each(Array.prototype.slice.apply(arguments), function (index, e) {
            if (KOI.isArray(e)) {
                if (KOI.isValid(fragment.lastChild)) {
                    fragment.lastChild.appendChild(markup.apply(markup, e));
                } else {
                    throw "nothing to append children to";
                }
            } else if (KOI.isString(e)) {
                fragment.appendChild(parseShorthand(e));
            } else {
                throw "invalid argument: " + e;
            }
        });

        if (fragment.childNodes.length === 1) {
            return fragment.childNodes[0];
        } else {
            return fragment;
        }
    }

    //------------------------------
    // Classes
    //------------------------------
    
    /**
     * Returns an array of class names for a variety of sources.
     * @param {string|Array<string>|HTMLElement} classNames
     * @return {Array<string>} An array of class names.
     */
    function normalizeClasses(classNames) {
        if (KOI.isValid(classNames.className)) {
            // HTMLElements
            classNames = classNames.className;
        }
        if (KOI.isArray(classNames)) {
            return classNames;
        }
        if (KOI.isString(classNames)) {
            return classNames.split(" ");
        }
    }

    /**
     * Determines if the element has a class.
     * @param {HTMLElement} element The element.
     * @param {string} className The class.
     * @return {boolean} True if the class is present.
     */
    function hasClass(element, className) {
        return KOI.inArray(className, normalizeClasses(element));
    }

    /**
     * Adds classes to the element.
     * @param {HTMLElement} element The element.
     * @param {string|Array<string>} classNames The classes to add.
     */
    function addClass(element, classNames) {
        KOI.each(normalizeClasses(classNames), function (index, className) {
            if (!hasClass(element, classNames)) {
                element.className += " " + className;        
            }
        }); 
    }

    /**
     * Removes classes from the element.
     * @param {HTMLElement} element The element.
     * @param {string|Array<string>} classNames The classes to add.
     */
    function removeClass(element, classNames) {
        classNames = normalizeClasses(classNames);
        var keep = [];
        KOI.each(normalizeClasses(element), function (index, className) {
            if (!KOI.inArray(className, classNames)) {
                keep.push(className); 
            }
        });
        element.classNames = keep.join(" ");
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
    // Markup
    //------------------------------

        markup: markup,

    //------------------------------
    // Classes
    //------------------------------

        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass

    });

}(window.KOI));

