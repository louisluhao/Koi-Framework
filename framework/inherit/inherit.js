/**
 *	Framework - Inherit
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

/*global KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) {

	"use strict";

	//------------------------------
	//
	//  Constants
	//
	//------------------------------

		/**
		 *	Frequency to check inherited windows for being open.
		 */
	var WATCHER_FREQUENCY = 3e3;

	//------------------------------
	//
	//  KOI Extension
	//
	//------------------------------

	/**
	 *	Create an object for storing inherited proxies.
	 *
	 *	Signature:
	 *	{
	 *		<id>:
	 *		{
	 *			$: <jQueryProxy>,
	 *
	 *			window: <windowObject>,
	 *
	 *			active: <true|false>
	 *		},
	 *
	 *		...
	 *	}
	 */
	KOI.inherited = {};
	
	//------------------------------
	//
	//  Event Bindings
	//
	//------------------------------

	/**
	 *	Add the inherited framework proxy into a cache.
	 *
	 *	@param event	The event object.
	 *
	 *	@param proxy	The jQuery proxy for the child.
	 *
	 *	@param id		The ID of the child window.
	 *
	 *	@param child	The child window.
	 *
	 *	@param child	Unload proxy.
	 */
	KOI.bind("framework-inherited", function (event, proxy, id, child, unloadProxy) {
		KOI.inherited[id] = {
			$: proxy,
			
			unloadProxy: unloadProxy,
			
			window: child,
			
			active: true,
			
			watcher: undefined
		};
		
		if (KOI.inherited[id].watcher === undefined) {
			KOI.inherited[id].watcher = setInterval(function () {
				if (!!KOI.inherited[id].window && KOI.inherited[id].window.closed) {
					KOI.trigger("inherited-child-closed-by-watcher", [id]);
					KOI.trigger("inherited-child-closed-by-watcher-" + id, [id]);
					KOI.inherited[id].unloadProxy();
					clearInterval(KOI.inherited[id].watcher);
					KOI.inherited[id].watcher = undefined;
				}
			}, WATCHER_FREQUENCY);
		}
	});

	/**
	 *	Mark the inherited child as inactive.
	 *
	 *	@param event	The event object.
	 *
	 *	@param id		The ID of the child window.
	 */
	KOI.bind("inherited-child-close", function (event, id) {
		if (KOI.inherited[id] !== undefined) {
			KOI.inherited[id].active = false;
			
			if (KOI.inherited[id].watcher !== undefined) {
				clearInterval(KOI.inherited[id].watcher);
				KOI.inherited[id].watcher = undefined;
			}
		}
	});
	
	/**
	 *	Close all the inherited windows when the parent unloads.
	 */
	window.onunload = function () {
		$.each(KOI.inherited, function (id, state) {
			if (state.active) {	
				if (state.window.__inheritUnload !== undefined) {
					state.window.__inheritUnload();
				}
			}
		});
	};
	
	//------------------------------
	//
	//	Inheritance Provider
	//
	//------------------------------
	
	/**
	 *	Create a function in the global namespace so we can access it from the iFrame by
	 *	calling parent.inherit();
	 *
	 *	@param child	The window object of the child.
	 *
	 *	@param id		Some identifier to place the jQuery proxy into a Koi accessible item.
	 *
	 *	@return	An object containing an unloadProxy and a jQueryProxy object.
	 */
	window.inherit = function (child, id) {
			/**
			 *	A callback function for testing DomReady.
			 */
		var DOMContentLoaded,
		
			/**
			 *	A jQuery Proxy for the child.
			 */
			proxy,
			
			/**
			 *	A window.unload Proxy for the child.
			 */
			unloadProxy;
	
		/**
		 *	First, bind a copy of jQuery down into the DOM of the iFrame so we can hook in
		 *	funcitonality. This may seem a bit awkward here, as we're creating this function
		 *	in the parent, but setting it up internally to get called as if it were in the
		 *	child.
		 */
		child.jQueryInherit = this.parent.jQuery;
		
		/**
		 *	Bind a special ready callback function to handle the scope of responding to the
		 *	document.ready hook instead of the parent's document.ready event.
		 *
		 *	@param fn	The function to notify when the document is ready.
		 */
		child.jQueryInherit.fn.ready = function (fn) {
			//	Attach the listeners
			child.jQueryInherit.hooks.bindReady();
			
			if (child.jQueryInherit.hooks.isReady) {
				//	If the child's DOM is ready
				fn.call(child.document, child.jQueryInherit);
			} else {
				//	Otherwise, remember it so we can trigger it later
				child.jQueryInherit.hooks.readyList.push(fn);
			}
			
			return this;
		};
		
		/**
		 *	Due to an issue with IE and event binding on a foreign window, we need to force the
		 *	setInterval method into a proxy, and nil it out.
		 */
		child._setInterval = child.setInterval;
		child.setInterval = null;
		
		/**
		 *	Bind a DOMContentLoaded function for the child.
		 */
		if (child.document.addEventListener) {
			DOMContentLoaded = function () {
				child.document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
				child.jQueryInherit.hooks.ready();
			};
		} else if (child.document.attachEvent) {
			DOMContentLoaded = function () {
				if (child.document.readyState === "complete") {
					child.document.detachEvent("onreadystatechange", DOMContentLoaded);
					child.jQueryInherit.hooks.ready();
				}
			};
		}
		
		/**
		 *	Create a function for checking IE readyness.
		 */
		function doScrollCheck() {
			if (child.jQueryInherit.hooks.isReady) {
				return;
			}
		
			try {
				// If IE is used, use the trick by Diego Perini
				// http://javascript.nwbox.com/IEContentLoaded/
				child.document.documentElement.doScroll("left");
			} catch (error) {
				setTimeout(doScrollCheck, 1);
				return;
			}
		
			// and execute any waiting functions
			child.jQueryInherit.hooks.ready();
		}
		
		/**
		 *	Create a namespace for hooking some functionality into the iFrame, like document.ready
		 *	detection and handling.
		 */
		child.jQueryInherit.hooks = {
			//------------------------------
			//	Properties
			//------------------------------
			
			isReady: false,
			
			readyBound: false,
			
			readyList: [],
			
			//------------------------------
			//	Methods
			//------------------------------
			
			/**
			 *	Mimic the readyBind() function in the child, so it can properly set up the listeners
			 *	for its down document.ready event.
			 */
			bindReady: function () {
				if (child.jQueryInherit.hooks.readyBound) {
					return;
				}
				
				child.jQueryInherit.hooks.readyBound = true;
				
				// Catch cases where $(document).ready() is called after the
				// browser event has already occurred.
				if (child.document.readyState === "complete") {
					return child.jQueryInherit.hooks.ready();
				}
		
				if (child.document.addEventListener) {
					// Mozilla, Opera and webkit nightlies currently support this event
					
					// Use the handy event callback
					child.document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
					
					// A fallback to window.onload, that will always work
					child.addEventListener("load", child.jQueryInherit.hooks.ready, false);
				} else if (child.document.attachEvent) {
					// If IE event model is used
				
					// ensure firing before onload,
					// maybe late but safe also for iframes
					child.document.attachEvent("onreadystatechange", DOMContentLoaded);
					
					// A fallback to window.onload, that will always work
					child.attachEvent("onload", child.jQueryInherit.hooks.ready);
		
					// If IE and not a frame
					// continually check to see if the document is ready
					var toplevel = false;
		
					try {
						toplevel = child.frameElement === null;
					} catch (e) {
						// Noop
					}
		
					if (child.document.documentElement.doScroll && toplevel) {
						doScrollCheck();
					}
				}
			},
			
			/**
			 *	Hook the ready trigger to fire off the hook bindings.
			 */
			ready: function () {
				//	Make sure the DOM is not already loaded
				if (!child.jQueryInherit.hooks.isReady) {
					// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
					if (!child.document.body) {
						return setTimeout(child.jQueryInherit.hooks.ready, 13);
					}
				
					child.jQueryInherit.hooks.isReady = true;
					
					//	If there are functions bound...
					if (child.jQueryInherit.hooks.readyList) {
						//	Execute them all
						$.each(child.jQueryInherit.hooks.readyList, function () {
							this.call(child.document, child.jQueryInherit);
						});
						
						//	Reset the list of functions
						child.jQueryInherit.hooks.readyList = null;
					}
				}
				
				if (jQuery.fn.triggerHandler) {
					jQuery(child.document).triggerHandler('ready');
				}
			}
		};
		
		/**
		 *	Create the jQuery Proxy Object.
		 */
		proxy = function (selector, context) {
			if (selector.constructor.toString().match(/Function/) !== null) {
				/**
				 *	 Test and see if we're handling a shortcut bind
				 *	 for the document.ready function. This occurs when
				 *	 the selector is a function. Because firefox throws
				 *	 xpconnect objects around in iFrames, the standard
				 *	 jQuery.isFunction test returns false negatives.
				 */
				return child.jQueryInherit.fn.ready(selector);
			} else {
				/**
				 *	Otherwise, just let the jQuery init function handle the rest. Be sure we pass in proper
				 *	context of the child document, or we'll never select anything useful.
				 */
				return child.jQueryInherit.fn.init(selector || child.document, context || child.document);
			}
		};
		
		/**
		 *	Create the unload proxy function.
		 */
		unloadProxy = function () {
			if (!(id in KOI.inherited && KOI.inherited[id].active)) {
				return;
			}
			
			KOI.trigger("inherited-child-close", [id]);
			KOI.trigger("inherited-child-close-" + id, [id]);
		};
		
		//	Map the proxy to the child
		child.jQuery = proxy;
		child.$ = proxy;
					
		//	Notify the framework an inheritance has occurred
		KOI.trigger("framework-inherited", [proxy, id, child, unloadProxy]);
		KOI.trigger("framework-inherited-" + id, [proxy, child, unloadProxy]);
		
		//	Return the proxy for easy binding of ready events.
		return {
			jQuery: proxy,
			
			unload: unloadProxy
		};
	};
		
}(jQuery));