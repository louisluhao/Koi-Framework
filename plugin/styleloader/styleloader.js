/*!
 *	Plugin - StyleLoader
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{	
	//------------------------------
	//
	//	Constants
	//
	//------------------------------
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	Plugin stub.
		 */
	var _ = KOI.plugin("styleloader", "development"),
	
		/**
		 *	Grab our configuration object
		 */
		config = KOI.configuration("styleloader"),
		
		/**
		 *	The files to include on startup.
		 */
		include = config("include", {}),
	
		/**
		 *	A cache of loaded styles.
		 *
		 *	Signature:
		 *	{
		 *		<styleName>:
		 *		{
		 *			source: <urlToSource>,
		 *
		 *			style: <CSSText>
		 *		},
		 *
		 *		...
		 *	}
		 */
		styles = {};
	
	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------
	
	/**
	 *	Set data in the cache.
	 *
	 *	@param name		The name of the style.
	 *
	 *	@param source	The source of the style.
	 *
	 *	@param style	The style to set.
	 */
	function setData(name, source, style)
	{
		styles[name] = 
		{
			source: source,
			
			style: style
		};
		
		_.trigger("style-loaded-" + name, [style]);
		_.trigger("style-loaded", [name, style]);
	}
	
	/**
	 *	Handle a stylesheet load.
	 *
	 *	@param data	The sheet data.
	 */
	function handleLoad(data)
	{
		setData(this.name, this.source, data);
	}
	
	//------------------------------
	//  Request Dispatcher
	//------------------------------
	
	/**
	 *	Load a stylesheet.
	 *
	 *	@param name		The name of the styles.
	 *
	 *	@param source	The source of the file to load.
	 */
	function loadSheet(name, source)
	{
		$.ajax(
		{
			type: "GET",
			dataType: "text",
			url: source,
			success: handleLoad,
			cache: false,
			context: 
			{
				name: name,
				source: source
			}
		});
	}

	//------------------------------
	//
	//	Plugin Definition
	//
	//------------------------------
	
	_.build(
	{
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Add a stylesheet to the loader.
		 *
		 *	@param name		The name of the file to load.
		 *
		 *	@param source	The source file to load.
		 *
		 *	@param listener	The listener to notify when the file finishes.
		 */
		load: function (name, source, listener)
		{
			_.get(name, listener);
		
			if (styles[name] === undefined)
			{
				loadSheet(name, source);
			}
		},
		
		/**
		 *	Return the contents of a sheet.
		 *
		 *	@param name	The name of the sheet.
		 */
		get: function (name, listener)
		{
			if (listener === undefined)
			{
				return;
			}
			
			if (styles[name] === undefined)
			{
				_.__delegate.bind("style-loaded-" + name, listener);
			}
			else
			{
				KOI.notify("style-loaded-" + name, listener, _.__delegate, [styles[name].style]);
			}
		},
		
		/**
		 *	Set a style in the loader.
		 *
		 *	@param name		The name of the style.
		 *
		 *	@param style	The style to set.
		 */
		set: function (name, style)
		{
			if (styles[name] !== undefined)
			{
				throw new Error("KOI.styleloader.set:name");
			}
			
			setData(name, "manual", style);
		}
	});
	
	//------------------------------
	//
	//	Event Bindings
	//
	//------------------------------
	
	//------------------------------
	//
	//	Startup Code
	//
	//------------------------------
	
	//------------------------------
	//  Load includes
	//------------------------------
	
	_.ready(function ()
	{
		$.each(include, function (name, sheet)
		{
			_.load(name, sheet);
		});
	});
	
	//------------------------------
	//  Destroy Configuration
	//------------------------------
		
	config();
		
}(jQuery));
