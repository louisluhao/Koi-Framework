/**
 * Koi
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint regexp: true, browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function ($) {
    "use strict";

    //------------------------------
    //
    // Constants
    //
    //------------------------------

    //------------------------------
    //
    // Variables
    //
    //------------------------------

    //------------------------------
    // Exposure proxy
    //------------------------------

        /**
         * A local copy of the koi object.
         * @type {Object}
         */
    var koi,

    //------------------------------
    // Event handling
    //------------------------------

        /**
         * The koi event system use this delegate for binding events.
         * @type {jQuery}
         */
        eventDelegate = $({}),

    //------------------------------
    // Startup: initialization
    //------------------------------
    
        /**
         * A jQuery Deferred object for initialization.
         * @type {jQuery.Deferred}
         */
        initializationList = new $.Deferred(),

     //------------------------------
     // Startup: localization
     //------------------------------

        /**
         * A jQuery Deferred object for localization.
         * @type {jQuery.Deferred}
         */
        localizationList = new $.Deferred(),

    //------------------------------
    //  Startup: ready
    //------------------------------

        /**
         * Contains events which should be triggered when the system is ready..
         * @type {jQuery.Deferred}
         */
        readyList = new $.Deferred();

    //------------------------------
    //
    // Functions
    //
    //------------------------------

    //------------------------------
    // Event handling
    //------------------------------

    /**
     * Invoke the jQuery.bind method against the internal delegate.
     * @param {...*} var_args
     */
    function bind(var_args) {
        eventDelegate.bind.apply(eventDelegate, arguments);
    }

    /**
     * Invoke the jQuery.unbind method against the internal delegate.
     * @param {...*} var_args
     */
    function unbind(var_args) {
        eventDelegate.unbind.apply(eventDelegate, arguments);
    }

    /**
     * Invoke the jQuery.trigger method against the internal delegate.
     * @param {...*} var_args
     */
    function trigger(var_args) {
        eventDelegate.trigger.apply(eventDelegate, arguments);
    }

    /**
     * Invoke the jQuery.one method against the internal delegate.
     * @param {...*} var_args
     */
    function one(var_args) {
        eventDelegate.one.apply(eventDelegate, arguments);
    }

    //------------------------------
    // Startup: Utilites
    //------------------------------
   
    /**
     * Koi uses the Deferred class from jQuery to handle listener notification
     * for the startup sequence.
     * @param {jQuery.Deferred} deferred The deferred list to bind listeners to
     *     for this event.
     * @return {function(function)}
     */
    function createAutoDispatcher(deferred) {
        return function (listener) {
            deferred.done(listener);
        }
    }

    //------------------------------
    // Startup: initialization
    //------------------------------

    /**
     * Initialize the application.
     * @param {String=} opt_language The language document to load. Will use
     *     the system default if none is provided.
     */
    function initialize(opt_language) {
        if (opt_language === undefined) {
            opt_language = config.language; 
        }

        koi.language = opt_language;
    }

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    koi = window.koi = window.KOI = {
    
    //------------------------------
    // Event handling
    //------------------------------

        eventDelegate: eventDelegate,
        bind: bind,
        unbind: unbind,
        trigger: trigger,
        one: one,

    //------------------------------
    // Startup: initialization
    //------------------------------

        isInitialized: false,
        initialized: createAutoDispatcher(initializationList),
        initialize: initialize,
        language: undefined

    };

    //------------------------------
    //
    // Events
    //
    //------------------------------

}(window.jQuery));

