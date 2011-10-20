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
        disableAfterTriggering = {};

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

        index = disableAfterTriggering[event].indexOf(uid);

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
        return eventListeners(event).indexOf(assignListener(listener)) !== -1;
    }

    /**
     * Add an event listener.
     * @param {string} event The event.
     * @param {function(...*)|number} The listener function.
     * @param {boolean=} once Execute the listener only once.
     * @return {number} The unique id for the listener.
     */
    function addListener(event, listener, once) {
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
            listenerList.splice(listenerList.indexOf(uid), 1);
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
    // KOI
    //------------------------------

    KOI.expose({

    //------------------------------
    // Events
    //------------------------------

        events: events,
        listeners: listeners,
        bind: bind,
        trigger: trigger,
        one: one,
        unbind: unbind,
        purge: purge

    });

}(window.KOI));

