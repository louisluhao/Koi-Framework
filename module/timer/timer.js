/*!
 *	Module - Timer
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

/*global ModuleException, KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) {

	"use strict";
	
	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The timer module provides a standard and simple interface for encapsulating
	 *	timeouts.
	 */
	KOI.module.timer = Class.extend({
	
		//------------------------------
		//	 Internal Properties
		//------------------------------
		
		/**
		 *	The ID of the timer to clear.
		 */
		__id: undefined,
	
		/**
		 *	The duration of the timer.
		 */
		__duration: undefined,
		
		/**
		 *	The listener to notify whenever the timer finishes.
		 */
		__listener: undefined,
		
		/**
		 *	The params to set.
		 */
		__params: undefined,
		
		//------------------------------
		//	 Properties
		//------------------------------
	
		/**
		 *	Flag to determine if the timer is engaged.
		 */
		engaged: undefined,
		
		/**
		 *	Flag to determine if the timer is finished.
		 */
		finished: undefined,
		
		//------------------------------
		//	 Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param listener		The listener to notify.
		 *
		 *	@param duration		The duration of the timer.
		 *
		 *	@param autostart	Optional. If true, the timer will be autostarted.
		 *
		 *	@param params		Optional. An array of params to give to the listener on expiry.
		 *
		 *	@param context		Optional. The context to provide to the listener on expiry.
		 */
		init: function (listener, duration, autostart, params, context) {
			if (!KOI.typecheck(listener, "Function")) {
				throw new ModuleException("timer", "init", "listener", typeof listener, "Must be typeof Function");
			}
			
			if (params !== undefined) {
				this.__params = KOI.typecheck(params, "Array") ? params : [params];
			}
			
			this.__listener = listener;
			this.__duration = duration;
			this.__context = context || this;
			
			if (autostart) {
				this.start();
			}
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Start the timer.
		 *
		 *	@param params		Optional. An array of params to give to the listener on expiry.
		 *
		 *	@param context		Optional. The context to provide to the listener on expiry.
		 */
		start: function (params, context) {
			if (params !== undefined) {
				this.__params = KOI.typecheck(params, "Array") ? params : [params];
			}
		
			this.__context = context || this;
			
			this.__create();
		},
		
		/**
		 *	Stop the timer.
		 */
		stop: function () {
			this.__destroy();
		},
		
		//------------------------------
		//	 Internal Methods
		//------------------------------
		
		/**
		 *	Create the timer.
		 */
		__create: function () {
			if (this.__id !== undefined) {
				return;
			}
			
			var self = this;
			
			this.engaged = true;
			this.finished = false;
			this.__id = setTimeout(function () {
				self.finished = true;
				self.__destroy();
				self.__listener.apply(self.__context, self.__params || []);
			}, this.__duration);
		},
		
		/**
		 *	Destroy the timer.
		 */
		__destroy: function () {
			if (this.__id === undefined) {
				return;
			}
			
			clearTimeout(this.__id);
			this.__id = undefined;
			this.engaged = false;
		}
	});
	
	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The timer module provides a standard and simple interface for encapsulating
	 *	intervals.
	 */
	KOI.module.interval = KOI.module.timer.extend({
	
		//------------------------------
		//	 Internal Properties
		//------------------------------
		
		/**
		 *	The number of iterations of the interval before expiry.
		 */
		__iterations: undefined,
		
		/**
		 *	The number of remaining iterations for this interval.
		 */
		__remainder: undefined,
	
		//------------------------------
		//	 Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param listener		The listener to notify.
		 *
		 *	@param duration		The duration of the timer.
		 *
		 *	@param iterations	Optional. The number of loops before expiry.
		 *
		 *	@param autostart	Optional. If true, the timer will be autostarted.
		 *
		 *	@param params		Optional. An array of params to give to the listener on expiry.
		 *
		 *	@param context		Optional. The context to provide to the listener on expiry.
		 */
		init: function (listener, duration, iterations, params, autostart, context) {
			this.__iterations = iterations === undefined ? iterations : parseInt(iterations, 10);
			
			this._super(listener, duration, autostart, params, context);
		},
		
		//------------------------------
		//  Methods
		//------------------------------
	
		/**
		 *	Start the timer.
		 *
		 *	@param iterations	Optional. The number of loops before expiry.
		 *
		 *	@param params		Optional. An array of params to give to the listener on expiry.
		 *
		 *	@param context		Optional. The context to provide to the listener on expiry.
		 */
		start: function (iterations, params, context) {
			this.__iterations = iterations === undefined ? iterations : parseInt(iterations, 10);
			
			this._super(params, context);
		},
	
		//------------------------------
		//	 Internal Methods
		//------------------------------
		
		/**
		 *	Create the timer.
		 */
		__create: function () {
			if (this.__id !== undefined) {
				return;
			}
			
			var self = this;
			
			if (this.__iterations !== undefined) {
				this.finished = false;
				this.__remainder = this.__iterations;
			} else {
				this.__remainder = undefined;
				this.finished = null;
			}
			
			this.engaged = true;
			this.__id = setInterval(function () {
				if (self.__remainder !== undefined) {
					self.__remainder -= 1;
					
					if (self.__remainder <= 0) {
						self.__remainder = 0;
						self.finished = true;
						self.__destroy();
					}
				}
			
				if (self.__listener.apply(self.__context, self.__params) === false) {
					self.finished = true;
					self.__destroy();
				}
			}, this.__duration);
		},
		
		/**
		 *	Destroy the timer.
		 */
		__destroy: function () {
			if (this.__id === undefined) {
				return;
			}
			
			clearInterval(this.__id);
			this.__id = undefined;
			this.engaged = false;
		}
	});
		
}(jQuery));