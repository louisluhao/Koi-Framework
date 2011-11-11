/**
 * KOI API
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function (KOI) {
    "use strict";

    if (KOI.isLocal(window.location.toString())) {
        alert("Functional testing does not work locally.");
        return false;
    }

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    /**
     * Sets the result class on an element.
     * @param {string} id The id.
     * @param {string} result The result class.
     */
    function mark(id, result) {
        document.getElementById(id).className = "test " + result;
    }

    //------------------------------
    //
    // Create API calls
    //
    //------------------------------

    KOI.api.create("json", ":name.json");
    KOI.api.create("jsonp", ":name.js", "GET", "jsonp");
    KOI.api.create("js", ":name.js", "GET", "script");

    //------------------------------
    //
    // Create API call handlers
    //
    //------------------------------

    //------------------------------
    // Successful json call
    //------------------------------

    function jsonSuccessPass() {
        mark("json-load-success", "pass");
    }

    function jsonSuccessFail() {
        mark("json-load-success", "fail");
    }

    //------------------------------
    // Error json call
    //------------------------------

    function jsonErrorPass() {
        mark("json-load-error", "pass");
    }

    function jsonErrorFail() {
        mark("json-load-error", "fail");
    }

    //------------------------------
    // Successful jsonp call
    //------------------------------

    function jsonpPass() {
        mark("jsonp-load-success", "pass");
    }

    //------------------------------
    // Successful script call
    //------------------------------

    function scriptPass() {
        mark("script-load-success", "pass");
    }

    //------------------------------
    // Successful jsonp data
    //------------------------------

    window.jsonpTestCallback = function (d) {
        mark("jsonp-data-success", "pass"); 
    };

    //------------------------------
    //
    // Create API call proxies
    //
    //------------------------------

    var json = KOI.api.requestProxy("json", jsonSuccessPass, jsonSuccessFail),
        jsonErr = KOI.api.requestProxy("json", jsonErrorFail, jsonErrorPass),
        jsonp = KOI.api.requestProxy("jsonp", jsonpPass),
        script = KOI.api.requestProxy("js", scriptPass);

    //------------------------------
    //
    // Execute
    //
    //------------------------------

    KOI.bind("DOMReady", function () {

    //------------------------------
    // Success
    //------------------------------

        json({name: "sample"});
        jsonp({name: "jsonp"});
        script({name: "sample"});

    //------------------------------
    // Error
    //------------------------------

        jsonErr({name: "404"});

    });


}(window.KOI));

