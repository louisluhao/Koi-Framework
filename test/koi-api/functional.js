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

    /**
     * todo: finish functional testing
     */

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

    function jsonSuccess() {
        console.log("json Success"); 
    }

    function jsonFailure() {
        console.log("json Failure"); 
    }

    function jsonpSuccess() {
        console.log("jsonp Success");
    }

    function jsonpFailure() {
        console.log("jsonp Failure");
    }

    function jsSuccess() {
        console.log("js Success");
    }

    function jsFailure() {
        console.log("js Failure");
    }

    window.jsonpTestCallback = function (d) {
        console.log("jsonp handler");
    }

    //------------------------------
    //
    // Create API call proxies
    //
    //------------------------------

    var json = KOI.api.requestProxy("json", jsonSuccess, jsonFailure),
        jsonp = KOI.api.requestProxy("jsonp", jsonpSuccess, jsonpFailure),
        js = KOI.api.requestProxy("js", jsSuccess, jsFailure);

    json({
        name: "sample"
    });
    jsonp({
        name: "jsonp"
    });
    js({
       name: "sample" 
    });

}(window.KOI));

