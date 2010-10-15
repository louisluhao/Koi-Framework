/*!
 *	Framework - Inherit
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{
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
	 */
	KOI.bind("framework-inherited", function (event, proxy, id, child)
	{
		KOI.inherited[id] = 
		{
			$: proxy,
			
			window: child,
			
			active: true
		};
	});

	/**
	 *	Mark the inherited child as inactive.
	 *
	 *	@param event	The event object.
	 *
	 *	@param id		The ID of the child window.
	 */
	KOI.bind("inherited-child-close", function (event, id)
	{
		if (KOI.inherited[id] !== undefined)
		{
			KOI.inherited[id].active = false;
		}
	});
	
	/**
	 *	Close all the inherited windows when the parent unloads.
	 */
	window.onunload = function ()
	{
		$.each(KOI.inherited, function (id, state)
		{
			if (state.active)
			{	
				if (state.window.__inheritUnload !== undefined)
				{
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
	window.inherit = function (child, id)
	{
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
		child.jQueryInherit.fn.ready = function (fn)
		{
			//	Attach the listeners
			child.jQueryInherit.hooks.bindReady();
			
			//	If the child's DOM is ready
			if (child.jQueryInherit.hooks.isReady)
			{
				fn.call(child.document, child.jQueryInherit);
			}
			
			//	Otherwise, remember it so we can trigger it later
			else
			{
				child.jQueryInherit.hooks.readyList.push(fn);
			}
			
			return this;
		};
		
		/**
		 *	Create a namespace for hooking some functionality into the iFrame, like document.ready
		 *	detection and handling.
		 */
		child.jQueryInherit.hooks = 
		{
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
			bindReady: function ()
			{
				if (child.jQueryInherit.hooks.readyBound)
				{
					return;
				}
				
				child.jQueryInherit.hooks.readyBound = true;
				
				/**
				 *	Mozilla, Opera, and webkit nightlies support
				 */
				if (child.document.addEventListener)
				{
					child.document.addEventListener("DOMContentLoaded", function ()
					{
						child.document.removeEventListener("DOMContentLoaded", arguments.callee, false);
						child.jQueryInherit.hooks.ready();
					}, false);
				}
				
				//	For IE
				else if (child.document.attachEvent)
				{
					/**
					 *	Ensure firing before onload. It may be late, but it's safe for iFrames
					 */
					child.document.attachEvent("onreadystatechange", function ()
					{
						if (child.document.readyState === "complete")
						{
							child.document.detachEvent("onreadystatechange", arguments.callee);
							child.jQueryInherit.hooks.ready();
						}
					});
					
					/**
					 *	If IE and not an iframe, continually check to see if the document is ready.
					 */
					if (child.document.documentElement.doScroll && child === child.top) 
					{
						(function ()
						{
							if (child.jQueryInherit.hooks.isReady)
							{
								return;
							}
							
							try {
								// If IE is used, use the trick by Diego Perini
								// http://javascript.nwbox.com/IEContentLoaded/
								child.document.documentElement.doScroll("left");
							} 
							catch (error)
							{
								setTimeout(arguments.callee, 0);
								return;
							}
	
							// and execute any waiting functions
							child.jQueryInherit.hooks.ready();
						}());
					}
				}
				
				// A fallback to window.onload, that will always work
				jQuery.event.add(child, "load", child.jQueryInherit.hooks.ready);
			},
			
			/**
			 *	Hook the ready trigger to fire off the hook bindings.
			 */
			ready: function ()
			{
				//	Make sure the DOM is not already loaded
				if (!child.jQueryInherit.hooks.isReady)
				{
					child.jQueryInherit.hooks.isReady = true;
					
					//	If there are functions bound...
					if (child.jQueryInherit.hooks.readyList)
					{
						//	Execute them all
						$.each(child.jQueryInherit.hooks.readyList, function ()
						{
							this.call(child.document, child.jQueryInherit);
						});
						
						//	Reset the list of functions
						child.jQueryInherit.hooks.readyList = null;
					}
				}
				
				jQuery(child.document).triggerHandler('ready');
			}
		};
		
			/**
			 *	Create the jQuery Proxy Object.
			 */
		var proxy = function (selector, context)
			{
				/**
				 *	 Test and see if we're handling a shortcut bind
				 *	 for the document.ready function. This occurs when
				 *	 the selector is a function. Because firefox throws
				 *	 xpconnect objects around in iFrames, the standard
				 *	 jQuery.isFunction test returns false negatives.
				 */
				if (selector.constructor.toString().match(/Function/) !== null)
				{
					return child.jQueryInherit.fn.ready(selector);
				}
				
				/**
				 *	Otherwise, just let the jQuery init function handle the rest. Be sure we pass in proper
				 *	context of the child document, or we'll never select anything useful.
				 */
				else
				{
					return child.jQueryInherit.fn.init(selector || child.document, context || child.document);
				}
			},
			
			/**
			 *	Create the unload proxy function.
			 */
			unloadProxy = function ()
			{
				KOI.trigger("inherited-child-close", [id]);
				KOI.trigger("inherited-child-close-" + id, [id]);
			};
		
		//	Map the proxy to the child
		child.jQuery = proxy;
		child.$ = proxy;
					
		//	Notify the framework an inheritance has occurred
		KOI.trigger("framework-inherited", [proxy, id, child]);
		KOI.trigger("framework-inherited-" + id, [proxy, child]);
		
		//	Return the proxy for easy binding of ready events.
		return {
			jQuery: proxy,
			
			unload: unloadProxy
		};
	};
		
}(jQuery));