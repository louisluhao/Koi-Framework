/*!
 *	Module - jSet
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global ModuleException, Exception, KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{
	//------------------------------
	//
	//  Property Declaration
	//
	//------------------------------
	
		/**
		 *	A list of methods to add to the jSet wrappers.
		 */
	var methods = {},
	
		/**
		 *	The object containing non-proxy method methods for jSet.	
		 */
		_;
	
	//------------------------------
	//
	//  Internal Methods
	//
	//------------------------------
	
	/**
	 *	A proxy call function for a jQuery method.
	 *
	 *	@param method	The method to call.
	 *
	 *	@param objects	The objects to call the method on.
	 *
	 *	@param args		The arguments to pass to the method.
	 *
	 *	@return	Null to indicate a return of the proxy, or the actual response value.
	 */
	function callProxy(method, objects, args)
	{
		var response;
	
		$.each(objects, function (index, object)
		{
			var fnReturn = object[method].apply(object, args);

			if (response === undefined)
			{
				if (fnReturn instanceof jQuery)
				{
					response = null;
				}
				else
				{
					response = fnReturn;
				}
			}
		});
		
		return response;
	}
	
	/**
	 *	Create a call proxy for a given method.
	 *
	 *	@param method	The method to create a call proxy for.
	 */
	function createCallProxy(method)
	{
		methods[method] = function ()
		{
			var response = callProxy(method, this.__setObjects, Array.prototype.slice.call(arguments));
			
			/**
			 *	If the response is null, then the response from the call was a jQuery object, which means
			 *	that the intention is chainability. In that case, we want to return the "this" object which
			 *	will reference the jSet proxy, allowing for chainability to occur.
			 */
			return response === null ? this : response;
		};
	}
	
	//------------------------------
	//
	//  jQuery Extensions
	//
	//------------------------------
	
	/**
	 *	Compare the current jQuery object to the provided object and test for exact equality.
	 *
	 *	@param object	The jQuery object to test.
	 */
	$.fn.equalTo = function (object)
	{
		if (!(object instanceof jQuery))
		{
			throw new Exception("jQuery", "fn.equalTo", "object", undefined, "Must be instanceof jQuery");
		}
		
		//	If the objects do not have the same length, they can't be equal.
		if (this.length !== object.length)
		{
			return false;
		}
		
		//	Set a variable, as we need to do a deep inspection to confirm equality.
		var same = true;
		
		//	Deep inspection of elements
		this.each(function (index, element)
		{
			if (element !== object[index])
			{
				same = false;
				return false;
			}
		});
		
		return same;
	};
	
	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The jSet module is a functional jQuery wrapper which allows multiple instances of
	 *	jQuery object to be wrapped by an execution object which provides the same functionality
	 *	of a standard jQuery object. This is utilized with the inheritance framework to
	 *	provide an interface to manage multiple DOM's version of the same item.
	 */
	_ =
	{
		//------------------------------
		//  Internal Properties
		//------------------------------
		
		/**
		 *	The objects which will compose this jSet object.
		 *
		 *	Signature:
		 *	[
		 *		<jQueryObject>,
		 *
		 *		...
		 *	]
		 */
		__setObjects: undefined,
		
		/**
		 *	A cache of children objects, to prevent duplicate generation of child instances.
		 *
		 *	Signature:
		 *	{
		 *		<selector>: <jQueryObject>,
		 *
		 *		...
		 *	}
		 */
		__childrenCache: undefined,
		
		//------------------------------
		//  Properties
		//------------------------------
		
		/**
		 *	The length of the object.
		 */
		length: undefined,
		
		//------------------------------
		//	 Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@args	The arguments of this function should be the items to wrap, unless "asArray" is true.
		 *
		 *	@param asArray	If true, instead of using argparsing to generate the children, use the second param.
		 *
		 *	@param children	If asArray is true, this is an array of children.
		 */
		init: function (asArray, children)
		{
			this.__setObjects = [];
			this.__childrenCache = {};
			
			this._set_add.apply(this, arguments);
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Override the find method, allowing us to select some children, wrap them
		 *	in a new jSet proxy, and return them.
		 *
		 *	@param selector	The selector to use to grab new children.
		 *
		 *	@param refresh	If true, will regenerate the children even if already defined.
		 *
		 *	@return	jSet containing the selected children.
		 */
		find: function (selector, refresh)
		{
			return this.__traversal("find", selector, "__find_" + selector, refresh);
		},
		
		/**
		 *	Override the eq method, allowing us to select subsets of children.
		 *
		 *	@param index	The index of the element to grab.
		 *
		 *	@param refresh	If true, will regenerate the children even if already defined.
		 *
		 *	@return	jSet containing the selected children.
		 */
		eq: function (index, refresh)
		{
			return this.__traversal("eq", index, "__eq_" + index, refresh);
		},
		
		/**
		 *	Override the parents method, allowing us to select some parents, wrap them
		 *	in a new jSet proxy, and return them.
		 *
		 *	@param selector	The selector to use to grab new children.
		 *
		 *	@param refresh	If true, will regenerate the children even if already defined.
		 *
		 *	@return	jSet containing the selected children.
		 */
		parents: function (selector, refresh)
		{
			return this.__traversal("parents", selector, "__parents_" + selector, refresh);
		},
		
		//------------------------------
		//  Set Methods
		//------------------------------
		
		/**
		 *	Add items into the set.
		 *
		 *	@args	The arguments of this function should be the items to wrap, unless "asArray" is true.
		 *
		 *	@param asArray	If true, instead of using argparsing to generate the children, use the second param.
		 *
		 *	@param children	If asArray is true, this is an array of children.
		 */
		_set_add: function (asArray, children)
		{
				/**
				 *	The objects to add.
				 */
			var objects = (asArray === true) ? children : Array.prototype.slice.call(arguments),
			
				self = this;
			
			/**
			 *	Ensure that we're only adding jQuery objects to the set.
			 */
			$.each(objects, function (index, object)
			{
				if (object instanceof jQuery)
				{
					self.__setObjects.push(object);
				}
				else
				{
					throw new ModuleException("jset", "_set_add", "objectAtIndex", index, "Must be instanceof jQuery");
				}
			});
			
			this.__purge_childrenCache();
			this.__generate_length();
		},
		
		/**
		 *	Remove an object from the set.
		 *
		 *	@args	The arguments of this function should be the items to remove, unless "asArray" is true.
		 *
		 *	@param asArray	If true, instead of using argparsing to generate the children, use the second param.
		 *
		 *	@param children	If asArray is true, this is an array of children.
		 */
		_set_remove: function (asArray, children)
		{
				/**
				 *	The objects to remove.
				 */
			var objects = (asArray === true) ? children : Array.prototype.slice.call(arguments),
			
				self = this;
			
			/**
			 *	Ensure that we're only adding jQuery objects to the set.
			 */
			$.each(objects, function (index, object)
			{
				if (object instanceof jQuery)
				{
					$.each(self.__setObjects, function (setIndex, setObject)
					{
						if (setObject.equalTo(object))
						{
							self.__setObjects.splice(setIndex, 1);
							return false;
						}
					});
				}
				else
				{
					throw new ModuleException("jset", "_set_remove", "objectAtIndex", index, "Must be instanceof jQuery");
				}
			});
			
			this.__purge_childrenCache();
			this.__generate_length();
		},
		
		/**
		 *	Empty the set.
		 *
		 *	@return	The set before removal.
		 */
		_set_empty: function ()
		{
			var buffer = this.__setObjects;
			
			this.__purge_childrenCache();
			this.__setObjects = [];
			this.length = 0;
			
			return buffer;
		},
		
		//------------------------------
		//  Internal Methods
		//------------------------------
		
		/**
		 *	Purge the cache of children selections.
		 */
		__purge_childrenCache: function ()
		{
			this.__childrenCache = {};
		},
		
		/**
		 *	Perform a traversal operation.
		 *
		 *	@param method		The method of selection to use.
		 *
		 *	@param selector		The selector to pass to the non-proxy function.
		 *
		 *	@param cacheName	The name of the cache item to fetch.
		 *
		 *	@param refresh		Flag to determine if we should refresh, regardless of cache status.
		 */
		__traversal: function (method, selector, cacheName, refresh)
		{
			if (this.__childrenCache[cacheName] === undefined || refresh === true)
			{
				var children = [];
			
				$.each(this.__setObjects, function (index, object)
				{
					children.push(object[method](selector));
				});
				
				this.__childrenCache[cacheName] = new KOI.module.jset(true, children);
			}
			
			return this.__childrenCache[cacheName];
		},
		
		__generate_length: function ()
		{
			var length = 0;
			
			$.each(this.__setObjects, function (index, item)
			{
				length += item.length;
			});
			
			this.length = length;
		}
	};
	
	/**
	 *	Define the module.
	 */
	KOI.module.jset = Class.extend(_);
	
	//------------------------------
	//
	//  Startup Code
	//
	//------------------------------
		
	KOI.bind("platform-initialized", function ()
	{	
		var fnMethod;
	
		//	Loop through the jQuery.fn object and set all available methods.
		for (fnMethod in jQuery.prototype)
		{
			if (jQuery.prototype.hasOwnProperty(fnMethod) && !(fnMethod in _))
			{
				createCallProxy(fnMethod);
			}
		}
		
		//	Extend the jQuery objects into the jset.
		$.extend(KOI.module.jset.prototype, methods);
	});
		
}(jQuery));
