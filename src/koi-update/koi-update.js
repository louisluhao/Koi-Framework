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

    /**
     * todo: create readme
     */

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
    // Templates
    //------------------------------

        /**
         * Matches strings which start with "template-".
         * @type {RegExp}
         */
        RX_TEMPLATE = /^template\-/,

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
        cache = [],

    //------------------------------
    // Templates
    //------------------------------

        /**
         * A collection of named templates.
         * @type {Object<string, HTMLElement>}
         */
        templates = {};

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    // Selection
    //------------------------------

    /**
     * Determines what template, if any, the element uses.
     * @param {HTMLElement} The element to check.
     * @return {?string} The template used by the element.
     */
    function usesTemplate(element) {
        var template = null; 
        if (KOI.isValid(element) && KOI.isValid(element.className)) {
            KOI.each(element.className.split(" "), function (i, c) {
                if (RX_TEMPLATE.test(c)) {
                    template = c.replace(RX_TEMPLATE, "");
                    return false;
                }
            });
        }
        return template;
    }

    /**
     * Determines if the element has a class.
     * @param {HTMLElement} element The element.
     * @param {string} className The class.
     * @return {boolean} True if the element has the class.
     */
    function hasClass(element, className) {
        if (KOI.isValid(element) && KOI.isValid(element.className)) {
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
     * @param {boolean=} forceArray Should an array always be returned?
     * @return {?Array<HTMLElement>|HTMLElement} Matched elements.
     */
    function getElements(selector, context, instance, forceArray) {
        if (RX_ID.test(selector)) {
            if (Boolean(forceArray)) {
                return [document.getElementById(selector.replace(RX_ID, ""))];
            } else {
                return document.getElementById(selector.replace(RX_ID, ""));
            }
        }
        var elements,
            classTest = new RegExp("(^|\\s)" + selector + "(\\s|$)"),
            selected = [],
            index = 0,
            template,
            instances,
            fragment;
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
            if (selected.length <= instance) {
                template = usesTemplate(context);
                if (KOI.isValid(template)) {
                    instances = 1 + instance - selected.length;
                    template = templates[template];
                    fragment = document.createDocumentFragment();
                    KOI.each(instances, function () {
                        var clone = template.cloneNode(true);
                        selected.push(clone);
                        fragment.appendChild(clone);
                    });
                    context.appendChild(fragment);
                } else {
                    return null;
                }
            }
            if (Boolean(forceArray)) {
                return [selected[instance]];
            } else {
                return selected[instance];
            }
        }
        if (selected.length === 0) {
            return Boolean(forceArray) ? [] : null;
        }
        if (selected.length === 1 && !Boolean(forceArray)) {
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
        var v = cache[element[EXPANDO]];
        if (KOI.isValid(namespace)) {
            if (!KOI.isValid(v[namespace])) {
                v[namespace] = {};
            }
            return v[namespace];
        }
        return v;
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
     * Sets element classes. Unsets previously modified classes.
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
     * Adds element classes.
     * @param {HTMLElement} e The element.
     * @param {?string|Array<string>} v The value.
     */
    function addClasses(e, v) {
        var classNames = e.className.split(" ");
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
     * Removes element classes.
     * @param {HTMLElement} e The element.
     * @param {?string|Array<string>} v The value.
     */
    function removeClasses(e, v) {
        var classNames = e.className.split(" "),
            newClasses = [];
        if (KOI.isString(v)) {
            v = v.split(" ");
        }
        KOI.each(classNames, function (i, className) {
            if (!KOI.inArray(className, v)) {
                newClasses.push(className);
            }
        });
        e.className = newClasses.join(" "); 
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

    /**
     * Sets and removes attributes.
     * @param {HTMLElement} e The element.
     * @param {?Object<string, string>} v The values.
     */
    function attr(e, v) {
        if (KOI.isObject(v)) {
            KOI.each(v, function (k, val) {
                if (KOI.isValid(val)) {
                    e.setAttribute(k, val);
                } else {
                    e.deleteAttribute(k);
                }
            });
        }
    }

    //------------------------------
    // Update
    //------------------------------

    /**
     * Update an element.
     * @param {string} selector The selector. Either a class name or an #id.
     * @param {Object<string, *>} o The update object. The key must correspond
     *     to a function in the {@code KOI.processor} object.
     * @param {string|HTMLElement=} context Context to work from. Can either be
     *     an HTMLElement or an element id string.
     * @param {number=} instance Instance selection.
     * @return {?Array<HTMLElement>|HTMLElement} Updated elements.
     */
    function updateElements(selector, o, context, instance) {
        var elements = KOI.getElements(selector, context, instance, true);
        KOI.each(o, function (key, v) {
            var processor = KOI.processors[key];
            if (!KOI.isFunction(processor)) {
                throw processor + " is not a processor";
            }
            KOI.each(elements, function (i, e) {
                processor(e, v);
            });
        });
        if (elements.length === 1) {
            return elements[0];
        } else {
            return elements;
        }
    }

    /**
     * Updates the dom.
     * @param {Object<string, Object<string, *>>} elements The elements object.
     *     Each key must be the element selector; the value being the update 
     *     object fed into the {@code KOI.updateElements} call.
     * @param {string|HTMLElement=} context Context to work from. Can either be
     *     an HTMLElement or an element id string.
     * @return {?Array<HTMLElement>|HTMLElement} Updated elements.
     */
    function update(elements, context) {
        var r = [];
        KOI.each(elements, function (selector, o) {
            var result = updateElements(selector, o, context);
            if (KOI.isValid(result)) {
                r.push(result);
            }
        });
        if (r.length === 1) {
            return r[0]; 
        } else {
            return r;
        }
    }

    //------------------------------
    // Templates
    //------------------------------

    /**
     * Declares what template an element should use.
     * @param {string} selector The selector. Either a class name or an #id.
     * @param {string} template The name of the template to use.
     * @param {string|HTMLElement=} context Context to work from. Can either be
     *     an HTMLElement or an element id string.
     * @param {number=} instance Instance selection.
     * @return {?Array<HTMLElement>|HTMLElement} Matched elements.
     */
    function useTemplate(selector, template, context, instance) {
        var elements = KOI.getElements(selector, context, instance, true); 
        if (!KOI.isValid(templates[template])) {
            throw template + " is not a defined template"; 
        }
        KOI.each(elements, function (i, e) {
            var tpl = usesTemplate(e);
            if (KOI.isValid(tpl)) {
                throw "Element already uses template " + tpl;
            }
            e.className += " template-" + template;
        });
    }

    /**
     * Creates a template. If a selector is provided, that element will be made
     * to use this template.
     * @param {string} name The name of the template.
     * @param {HTMLElement} element The element to use as a template.
     * @param {string=} selector The selector. Either a class name or an #id.
     * @param {string|HTMLElement=} context Context to work from. Can either be
     *     an HTMLElement or an element id string.
     * @param {number=} instance Instance selection.
     */
    function createTemplate(name, element, selector, context, instance) {
        if (KOI.isValid(templates[name])) {
            throw name + " is already a template";
        }
        if (!KOI.isValid(element) || !KOI.isFunction(element.cloneNode)) {
            throw "Provided element not a valid template";
        }
        if (!hasClass(element, "template")) {
            element.className += " template";
        }
        templates[name] = element;
        if (KOI.isValid(selector)) {
            useTemplate(selector, name, context, instance);
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
        addClasses: addClasses,
        removeClasses: removeClasses,
        data: data,
        attr: attr

    }, "processors");

    KOI.expose({

    //------------------------------
    // Selection
    //------------------------------

        usesTemplate: usesTemplate,
        hasClass: hasClass,
        getElements: getElements,
    
    //------------------------------
    // Data
    //------------------------------
    
        elementData: elementData,

    //------------------------------
    // Update
    //------------------------------

        updateElements: updateElements,
        update: update,

    //------------------------------
    // Templates
    //------------------------------
   
        templates: templates,
        useTemplate: useTemplate,
        createTemplate: createTemplate

    });

}(window.KOI));

