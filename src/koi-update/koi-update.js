/**
 * KOI update
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
    // Selection
    //------------------------------

        /**
         * Matches strings which start with a pound.
         * @type {RegExp}
         */
    var RX_ID = /^#/,

    //------------------------------
    // Data
    //------------------------------

        /**
         * The element expando name.
         * @type {RegExp}
         */
        EXPANDO = "koi_" + (new Date()).valueOf(),

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    // Data
    //------------------------------
        
        /**
         * A cache of element data.
         * @type {Array<Object<string, *>>}
         */
        cache = [];

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    // Selection
    //------------------------------

    /**
     * Determines if the element has a class.
     * @param {HTMLElement} element The element.
     * @param {string} className The class.
     * @return {boolean} True if the element has the class.
     */
    function hasClass(element, className) {
        if (KOI.isValid(element.className)) {
            return KOI.inArray(className, element.className.split(" "));
        } else {
            return false;
        }
    }

    /**
     * Finds a set of elements using a class.
     * @param {string} selector The selector. Either a class name or an #id.
     * @param {string|HTMLElement=} context Context to work from. Can either be
     *     an HTMLElement or an element id string.
     * @param {number=} instance Instance selection.
     * @return {?Array<HTMLElement>|HTMLElement} Matched elements.
     */
    function getElements(selector, context, instance) {
        if (RX_ID.test(selector)) {
            return document.getElementById(selector.replace(RX_ID, ""));
        }
        var elements,
            classTest = new RegExp("(^|\\s)" + selector + "(\\s|$)"),
            selected = [],
            index = 0;
        if (!KOI.isValid(context)) {
            context = document;
        } else {
            if (KOI.isString(context)) {
                context = document.getElementById(context); 
            }
            if (hasClass(context, selector)) {
                selected.push(context);
            }
        }
        elements = context.getElementsByTagName("*");
        for (; index < elements.length; index++) {
            if (classTest.test(elements[index].className)) {
                selected.push(elements[index]); 
            }
        }
        if (KOI.isValid(instance) && KOI.isNumber(instance)) {
            return selected.length < instance ? null : selected[instance];
        }
        if (selected.length === 0) {
            return null;
        }
        if (selected.length === 1) {
            return selected[0];
        }
        return selected;
    }

    //------------------------------
    // Element data
    //------------------------------

    /**
     * Returns the data object for an element.
     * @param {HTMLElement} element The element.
     * @param {string=} namespace The namespace to return. If the requested
     *     namespace doesn't exist, and object with that name will be returned.
     * @return {Object<string, *>} The data store for the object.
     */
    function elementData(element, namespace) {
        if (!KOI.isValid(element[EXPANDO])) {
            element[EXPANDO] = cache.length;
            cache.push({});
        }

        var value = cache[element[EXPANDO]];

        if (KOI.isValid(namespace)) {
            if (!KOI.isValid(value[namespace])) {
                value[namespace] = {};
            }

            return value[namespace];
        }

        return value;
    }

    //------------------------------
    // Processors
    //------------------------------

    /**
     * Sets element text.
     * @param {HTMLElement} e The element.
     * @param {?string} v The value.
     */
    function text(e, v) {
        if (KOI.isValid(v)) {
            e.innerHTML = v;
        }
    }

    /**
     * Adds element classes.
     * @param {HTMLElement} e The element.
     * @param {?string|Array<string>} v The value.
     */
    function classes(e, v) {
        var d = elementData(e, "koi_update"),
            classNames;
        if (!KOI.isValid(d.originalClassNames)) {
            d.originalClassNames = e.className.split(" ");
        }
        classNames = [].concat(d.originalClassNames);
        if (KOI.isString(v)) {
            v = v.split(" ");
        }
        KOI.each(v, function (i, className) {
            if (!KOI.inArray(className, classNames)) {
                classNames.push(className);
            }
        });
        e.className = classNames.join(" "); 
    }

    /**
     * Adds element data.
     * @param {HTMLElement} e The element.
     * @param {?Object<string, *>} v The value.
     */
    function data(e, v) {
        if (KOI.isObject(v)) {
            KOI.expose(v, elementData(e));
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

    KOI.expose({

    //------------------------------
    // Processors
    //------------------------------

        text: text,
        classes: classes,
        data: data

    }, "processors");

    KOI.expose({
    
    //------------------------------
    // Selection
    //------------------------------

        hasClass: hasClass,
        getElements: getElements,
    
    //------------------------------
    // Data
    //------------------------------
    
        elementData: elementData

    });

}(window.KOI));

