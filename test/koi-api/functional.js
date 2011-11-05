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

    //------------------------------
    //
    // Create API calls
    //
    //------------------------------

    KOI.api.create("json-sample", "sample.json");
    KOI.api.create("jsonp-sample", "jsonp.js", "GET", "jsonp");
    KOI.api.create("js-sample", "sample.js", "GET", "script");
    KOI.api.create("json-fail", "s.json");
    KOI.api.create("jsonp-fail", "p.js", "GET", "jsonp");
    KOI.api.create("js-fail", "j.js", "GET", "script");

    //------------------------------
    //
    // Create API call handlers
    //
    //------------------------------

    function jsonSuccess() {
        alert("Holy shit");
    }

    function jsonFailure() {
    }

    function jsonpSuccess() {
    }

    function jsonpFailure() {
    }

    function jsSuccess() {
    }

    function jsFailure() {
    }

    window.jsonpTestCallback = function (d) {
    }

    //------------------------------
    //
    // Create API call proxies
    //
    //------------------------------

    var json = KOI.api.requestProxy("json-sample", jsonSuccess),
        jsonf = KOI.api.requestProxy("json-fail", null, jsonFailure);

    json();

}(window.KOI));

