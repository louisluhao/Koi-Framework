/*!
 *	Module - ContentProvider
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global ModuleException, KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{	

	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The contentprovider describes a low-level non-specific interface for handling a
	 *	collection of data. Applications should describe more specific instances of the
	 *	content provider, to handle different flavors of content.
	 */
	KOI.module.contentprovider = KOI.module.eventdispatcher.extend( 
	{
		//------------------------------
		//  Internal Properties
		//------------------------------
	
		/**
		 *	The raw data object.
		 *
		 *	Signature:
		 *	{
		 *		<dataKey>: <contentObject>,
		 *
		 *		...
		 *	}
		 */
		__data: undefined,
		
		/**
		 *	The key for the data currently being provided.
		 */
		__current: undefined,
	
		/**
		 *	A jQuery object which is used in rendering this content.
		 */
		__display: undefined,
	
		//------------------------------
		//  Properties
		//------------------------------
		
		/**
		 *	The name of this content provider. This should be unique throughout
		 *	an application, as the name value is used by resources which utilize this
		 *	module to store it in a lookup table.
		 */
		name: undefined,
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@param name		The name of this content provider.
		 *
		 *	@param display	The display object used for rendering.
		 */
		init: function (name, display)
		{			
			this.name = name;
			this.__display = display;
			
			KOI.trigger("contentprovider-create", [name, this]);
			
			this._super();
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Load the data for this provider.
		 *
		 *	@param data	The data to load for this instance.
		 */
		load: function (data)
		{
			this.__data = data;
			this.makeReady();
		},
		
		/**
		 *	Return a piece of data.
		 *
		 *	@param key	The key to fetch.
		 *
		 *	@return	The request data.
		 */
		get: function (key)
		{
			this.__setCurrent(key);
			
			return this.__getCurrent();
		},
		
		/**
		 *	Render a piece of data inside this object's display.
		 *
		 *	@param key	The data to render.
		 */
		render: function (key)
		{
			this.__setCurrent(key);
		},
		
		/**
		 *	Make this content provider idle, concealing it's data.
		 */
		idle: function ()
		{
			this.__current = null;
			
			this.trigger("content-change", [null]);
		},
		
		//------------------------------
		//  Internal Methods
		//------------------------------
		
		/**
		 *	Set the current data.
		 *
		 *	@param key	The key to make current.
		 */
		__setCurrent: function (key)
		{
			if (!this.isReady)
			{
				throw new ModuleException("contentprovider", "__setCurrent", "isReady", undefined, "Provider not ready");
			}
			
			if (this.__data[key] === undefined)
			{
				throw new ModuleException("contentprovider", "__setCurrent", "key", undefined, "Out of bounds");
			}
			
			this.__current = key;
			
			this.trigger("content-change", [this.__current, this.__getCurrent()]);
		},
		
		/**
		 *	Get the current data.
		 */
		__getCurrent: function ()
		{
			if (!this.isReady)
			{
				throw new ModuleException("contentprovider", "__getCurrent", "isReady", undefined, "Provider not ready");
			}

			if (this.__current === undefined || this.__current === null)
			{
				return null;
			}
			
			return this.__data[this.__current];
		}
	});
		
}(jQuery));
