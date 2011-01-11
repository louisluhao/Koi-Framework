/*!
 *	Plugin - ContentDeck
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global PluginException, ModuleException, KOI, Class, window, jQuery */

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
		 *	The contentdeck uses the timeline and contentprovider interfaces defined as
		 *	modules to display a content area with a number of data sources that changes
		 *	based on a timekeeper.
		 */
	var _ = KOI.plugin("contentdeck"),
	
		//------------------------------
		//  Resources
		//------------------------------
		
		/**
		 *	A collection of all the decks created by this plugin.
		 *
		 *	Signature:
		 *	{
		 *		<deckName>: <Contentdeck>,
		 *
		 *		...
		 *	}
		 */
		decks = {};
	
	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------

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
		 *	Create a new content deck.
		 *
		 *	@param name			The name of this content deck.
		 *
		 *	@param timekeeper	An instance of the timekeeper module.
		 *
		 *	@param display		A jQuery object representing the display of this content area.
		 *
		 *	@param autostart	If the timeline manager should show the first event when ready. Default false.
		 *
		 *	@param precision	The precision for the timeline.
		 */
		create: function (name, timekeeper, display, autostart, precision)
		{
			if (decks[name] !== undefined)
			{
				throw new PluginException("contentdeck", "create", "name", name, "Namespace collision");
			}
			
			decks[name] = new KOI.module.contentdeck(timekeeper, display, autostart, precision);
			
			return _.get(name);
		},
		
		/**
		 *	Get the given content deck.
		 *
		 *	@param name	The name of the contentdeck to get.
		 */
		get: function (name)
		{
			if (decks[name] === undefined)
			{
				throw new PluginException("contentdeck", "get", "name", undefined, "Not defined");
			}
			
			return decks[name];
		}
	});
	
	//------------------------------
	//
	//  Class Definition
	//
	//------------------------------
	
	/**
	 *	Create the contentdeck class, which contains a Timeline module to
	 *	dispatch rendering events.
	 */
	KOI.module.contentdeck = KOI.module.eventdispatcher.extend(
	{
		//------------------------------
		//  Internal Properties
		//------------------------------
	
		/**
		 *	An instance of a timeline module.
		 */
		__timeline: undefined,
		
		/**
		 *	The UID of the timeline dispatcher.
		 */
		__dispatcher: undefined,
		
		/**
		 *	The dataproviders bound to this content deck.
		 *
		 *	Signature:
		 *	{
		 *		<providerName>: <contentprovider>,
		 *
		 *		...
		 *	}
		 */
		__providers: undefined,
		
		/**
		 *	The name of the current data provider being used.
		 */
		__currentProvider: undefined,
		
		/**
		 *	Flag to determine if this content provider should display the first
		 *	timeline event when starting.
		 */
		__autostart: undefined,
		
		/**
		 *	The display object for this content area.
		 */
		__display: undefined,
	
		//------------------------------
		//  Properties
		//------------------------------
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@param timekeeper	An instance of the timekeeper module.
		 *
		 *	@param display		A jQuery object representing the display of this content area.
		 *
		 *	@param autostart	If the timeline manager should show the first event when ready. Default false.
		 *
		 *	@param precision	The precision for the timeline.
		 */
		init: function (timekeeper, display, autostart, precision)
		{
			this._super();
		
			var self = this;
		
			this.__display = display;
			this.__autostart = autostart || false;
			this.__providers = {};
			this.__timeline = new KOI.module.timeline(timekeeper, precision);
			this.__dispatcher = this.__timeline.registerDispatcher(function (name, key)
			{
				self.__timelineDispatcher(name, key);
			});
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Sets the readyness of this contentdeck.
		 */
		makeReady: function ()
		{
			if ($.isEmptyObject(this.__providers))
			{
				return;
			}
		
			var readyable = true;
		
			$.each(this.__providers, function (index, provider)
			{
				if (!provider.isReady)
				{
					readyable = false;
					return false;
				}
			});
		
			if (!readyable)
			{
				return;
			}
		
			this._super();
			
			if (this.__autostart)
			{
				this.__timeline.__dispatchEvents(this.__timeline.closestPreviousEventTime());
			}
		},
		
		/**
		 *	Add a content provider.
		 *
		 *	@param provider	The data provider to add. Must be an instance of contentprovider.
		 *
		 *	@param events	An optional collection of events to bind.
		 *
		 *	events Signature:
		 *	{
		 *		<time>: <dataKey>,
		 *
		 *		...
		 *	}
		 */
		addProvider: function (provider, events)
		{
			if (!(provider instanceof KOI.module.contentprovider))
			{
				throw new ModuleException("contentdeck", "addProvider", "provider", undefined, "Must be instanceof KOI.module.contentprovider");
			}
			
			if (this.__providers[provider.name] !== undefined)
			{
				throw new ModuleException("contentdeck", "addProvider", "provider.name", provider.name, "Namespace collision");
			}
			
			this.__providers[provider.name] = provider;
			
			if (events !== undefined)
			{
				this.bindEvents(provider.name, events);
			}
			
			var self = this;
			
			provider.ready(function ()
			{
				provider.__display.appendTo(self.__display);
				self.makeReady();
			});
		},
		
		/**
		 *	Get a provider.
		 *
		 *	@param name	The name of the provider.
		 *
		 *	@return	The provider.
		 */
		getProvider: function (name)
		{
			if (this.__providers[name] === undefined)
			{
				throw new ModuleException("contentdeck", "getProvider", "name", name, "Not defined");
			}
			
			return this.__providers[name];
		},
		
		/**
		 *	Bind a collection of events for a provider.
		 *
		 *	@param providerName	The name of the provider binding events for.
		 *
		 *	@param events		The events to bind.
		 *
		 *	events Signature:
		 *	{
		 *		<time>: <dataKey>,
		 *
		 *		...
		 *	}
		 */
		bindEvents: function (providerName, events)
		{
				/**
				 *	The bindings to pass to the timeline manager.
				 */
			var bindings = {};
			
			$.each(events, function (time, key)
			{
				bindings[time] = [providerName, key];
			});
			
			this.__timeline.registerEvents(this.__dispatcher, bindings);
		},
		
		//------------------------------
		//  Internal Methods
		//------------------------------
		
		/**
		 *	The timeline dispatcher for the ContentDeck. 
		 *
		 *	@param providerName	The name of the provider handling this rendering.
		 *
		 *	@param dataKey		The key for the data to display.
		 */
		__timelineDispatcher: function (providerName, dataKey)
		{
			this.__setCurrentProvider(providerName);
			this.__getCurrentProvider().render(dataKey);
		},
		
		/**
		 *	Set a new current provider.
		 *
		 *	@param name	The name of the provider.
		 */
		__setCurrentProvider: function (name)
		{
			if (this.__providers[name] === undefined)
			{
				throw new ModuleException("contentdeck", "__setCurrentProvider", "name", undefined, "Not defined");
			}
			
			try
			{
				this.__getCurrentProvider().idle();
			}
			catch (err)
			{
				//	An error will be dispatch if no currnet provider exists. That's fine here,
				//	as there will not always be a provider defined (such as during startup).
			}
			
			this.__currentProvider = name;
		},
		
		/**
		 *	Return the current provider.
		 *
		 *	@return	The current active provider.
		 */
		__getCurrentProvider: function ()
		{
			if (this.__currentProvider === undefined || this.__currentProvider === null)
			{
				throw new ModuleException("contentdeck", "__getCurrentProvider", "__currentProvider", undefined, "Not defined");
			}
			
			return this.getProvider(this.__currentProvider);
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
		
}(jQuery));
