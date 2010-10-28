/*!
 *	Module - TimeKeeper
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global InterfaceException, KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{
	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The timekeeper module extends from the base plugin module, to define
	 *	an interface for doing timing.
	 */
	KOI.module.timekeeper = KOI.module.plugin.extend(
	{
		//------------------------------
		//  Methods
		//------------------------------
		
		currentTime: function ()
		{
			throw new InterfaceException("timekeeper", "currentTime");
		}
	});
		
}(jQuery));