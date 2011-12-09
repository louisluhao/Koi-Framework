/**
 * KOI event
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
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    // Events
    //------------------------------

        /**
         * Event queues.
         * @type {Object<string, Array<number>>}
         */
    var events = {},

        /**
         * Bound event listeners.
         * @type {Array<function(...*)>}
         */
        listeners = [],

        /**
         * Listener UIDs to disable after they next trigger.
         * @type {Object<string, Array<number>>}
         */
        disableAfterTriggering = {},

        /**
         * Events which should be triggered once, and if they have been.
         * @type {Object<string, boolean>}
         */
        toggleEvents = {};

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    // Listener
    //------------------------------

    /**
     * Assigns a unique id to a listener.
     * @param {function(...*)} A listener.
     * @return {number} The unique id for the listener.
     */
    function assignListener(listener) {
        if (KOI.isNumber(listener)) {
            return listener;
        }

        if (!KOI.isFunction(listener)) {
            throw "listener must be function(...*)";
        }

        if (!KOI.isValid(listener.koiListenerUID)) {
            listener.koiListenerUID = listeners.length;
            listeners.push(listener);
        }

        return listener.koiListenerUID;
    }

    //------------------------------
    // Events
    //------------------------------

    /**
     * Creates a queue for the event.
     * @param {string} event The event.
     * @return {Array<number>} The event.
     */
    function eventListeners(event) {
        if (!KOI.isValid(events[event])) {
            events[event] = [];
        }

        return events[event];
    }

    /**
     * Mark an event listener to either be disabled or not disabled following
     * some event.
     * @param {string} event The event.
     * @param {function(...*)} listener The listener.
     * @param {boolean} disable Disable the listener after the next execution.
     */
    function disableListenerAfterExecution(event, listener, disable) {
        var uid = assignListener(listener),
            index;

        if (!KOI.isValid(disableAfterTriggering[event])) {
            disableAfterTriggering[event] = [];
        }

        index = KOI.indexOf(uid, disableAfterTriggering[event]);

        if (disable && index === -1) {
            disableAfterTriggering[event].push(uid);
        } else if (!disable && index !== -1) {
            disableAfterTriggering[event].splice(index, 1);
        }
    }

    /**
     * Determines if the listener is in the queue.
     * @param {string} event The event.
     * @param {function(...*)|number} listener The listener.
     * @return {boolean} True if the listener is in the queue.
     */
    function eventHasListener(event, listener) {
        return KOI.inArray(assignListener(listener), eventListeners(event));
    }

    /**
     * Add an event listener.
     * @param {string} event The event.
     * @param {function(...*)|number} The listener function.
     * @param {boolean=} once Execute the listener only once.
     * @return {number} The unique id for the listener.
     */
    function addListener(event, listener, once) {
        if (KOI.isValid(toggleEvents[event]) && toggleEvents[event]) {
            listener.apply(listener); 
            return;
        }

        var uid = assignListener(listener);
        disableListenerAfterExecution(event, uid, Boolean(once));
        if (!eventHasListener(event, uid)) {
            eventListeners(event).push(uid);
        }
    }

    /**
     * Remove an event listener.
     * @param {string} event The event.
     * @param {function(...*)|number} The listener or unique id.
     */
    function removeListener(event, listener) {
        var uid = assignListener(listener),
            listenerList;
        disableListenerAfterExecution(event, uid, false);
        if (eventHasListener(event, uid)) {
            listenerList = eventListeners(event);
            listenerList.splice(KOI.indexOf(uid, listenerList), 1);
        }
    }

    /**
     * Remove all listeners.
     * @param {string} event the event.
     */
    function purgeQueue(event) {
        // Clone the array before purging
        KOI.each([].concat(eventListeners(event)), function (index, uid) {
            removeListener(event, uid);
        });
        disableAfterTriggering[event] = [];
    }

    /**
     * Trigger all listeners.
     * @param {string} event the event.
     * @param {Array<*>} args The args to send to the listeners.
     */
    function triggerQueue(event, args) {
        var disable = disableAfterTriggering[event];
        KOI.each(eventListeners(event), function (index, uid) {
            listeners[uid].apply(listeners[uid], args);
        });
        if (KOI.isValid(toggleEvents[event])) {
            toggleEvents[event] = true;
            purgeQueue(event);
            return;
        }
        if (KOI.isValid(disable)) {
            KOI.each(disable, function (index, uid) {
                removeListener(event, uid); 
            });
            disableAfterTriggering[event] = [];
        }
    }

    /**
     * Binds event listeners.
     * @param {string} e The event(s).
     * @param {?function(...*): boolean=} listener The listener to bind. 
     * @param {boolean=} once Bind the listeners once?
     */
    function bind(e, listener, once) {
        KOI.each(e.split(" "), function (index, event) {
            addListener(event, listener, once);
        });
    }

    /**
     * Binds event listeners which unbind after being triggered.
     * @param {string} e The event(s).
     * @param {function(...*): boolean=} listener The listener to bind.
     */
    function one(e, listener) {
        bind(e, listener, true);
    }

    /**
     * Triggers an event.
     * @param {string} event The event.
     * @param {...*} var_args Parameters to send the listeners.
     */
    function trigger(event, var_args) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();

        triggerQueue(event, args);
    }

    /**
     * Unbinds event listeners.
     * @param {string} e The event(s).
     * @param {function(...*): boolean=} listener The listener to unbind.
     */
    function unbind(e, listener) {
        KOI.each(e.split(" "), function (index, event) {
            removeListener(event, listener);
        });
    }

    /**
     * Unbind every event listener.
     * @param {string} e The event(s).
     */
    function purge(e) {
        KOI.each(e.split(" "), function (index, event) {
            purgeQueue(event);
        });
    }

    //------------------------------
    // Browser events 
    //------------------------------

    /**
     * Creates an event listener for some event on an element.
     * @param {Element} element An HTML element.
     * @param {string} event The event type.
     * @param {function(Event)} The event listener.
     */
    function listen(element, event, listener) {
        if (KOI.isValid(element) && KOI.isFunction(element.addEventListener)) {
            element.addEventListener(event, listener, false);
        } else {
            element.attachEvent('on' + event, listener);
        }
    }

     /**
      * Fires an event for some element.
      * @param {Element} element An HTML element.
      * @param {string} event The event type.
      */
    function fire(element, event) {
        var evt;
        if (KOI.isFunction(document.createEvent)) {
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, true, true);
            element.dispatchEvent(evt);
        } else {
            evt = document.createEventObject();
            evt.eventType = event;
            element.fireEvent('on' + event, evt);
        }
    }

    /**
     * Prevent an event's default action.
     * @param {Event} event The event.
     */
    function preventEventDefault(event) {
        if (KOI.isValid(event.preventDefault)) {
            event.preventDefault();
        }
        event.returnValue = false;
    }

    /**
     * Stop an event from bubbling.
     * @param {Event} event The event.
     */
    function stopEvent(event) {
        preventEventDefault(event);
        if (KOI.isValid(event.stopPropagation)) {
            event.stopPropagation();
        }
        event.cancelBubble = true;
    }

    //------------------------------
    // Listeners: DOMReady
    //------------------------------

    /**
     * DOMReady
     *
     * Cross browser object to attach functions that will be called
     * immediatly when the DOM is ready.
     *
     * @version   1.0
     * @author    Victor Villaverde Laan
     * @license   MIT license
     */
    function ieDOMReady() {
        if (!document.uniqueID && document.expando) {
            return;
        }
        try {
            document.createElement("document:ready").doScroll("left");
            trigger("DOMReady");
        } catch (e) {
            setTimeout(ieDOMReady, 0);
        }
    }

    /**
     * Mark the DOM as ready.
     */
    function domReady() {
        KOI.isDOMReady = true;
    }

    //------------------------------
    // Listeners: window events
    //------------------------------

    /**
     * Dispatches click events.
     * @param {Event} event The event object.
     */
    function windowClick(event) {
        var target = event.target || event.srcElement || event.originalTarget;

        if (KOI.inArray("koi-event", target.className.split(" ")) !== -1) {
            trigger(target.getAttribute("rel"), target);
        }
    }

    /**
     * Dispatches keyboard events.
     * @param {Event} event The event object.
     */
    function windowType(event) {
        var char = String.fromCharCode(event.keyCode);
        trigger("keyboard", char, event.keyCode);
        trigger("keyboard-" + char, event.keyCode);
    }

    //------------------------------
    //
    // Event bindings
    //
    //------------------------------

    //------------------------------
    // Window click
    //------------------------------

    listen(window, "click", windowClick);
    listen(window, "keydown", windowType);

    //------------------------------
    // DOMReady
    //------------------------------

    toggleEvents.DOMReady = false;
    bind("DOMReady", domReady);
    if (KOI.isFunction(window.addEventListener)) {
        listen(document, "DOMContentLoaded", function () {
            trigger("DOMReady");
        });
    } else {
        ieDOMReady();
    }

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    KOI.expose({

    //------------------------------
    // DOMReady
    //------------------------------

        isDOMReady: false,

    //------------------------------
    // Events
    //------------------------------

        events: events,
        listeners: listeners,
        toggleEvents: toggleEvents,
        bind: bind,
        trigger: trigger,
        one: one,
        unbind: unbind,
        purge: purge,

    //------------------------------
    // Browser events
    //------------------------------

        listen: listen,
        fire: fire,
        preventEventDefault: preventEventDefault,
        stopEvent: stopEvent

    });

}(window.KOI));

