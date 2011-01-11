/*!
 *	Plugin - ContentShuffler
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
	
		/**
		 *	The default timeout for provider duration.
		 */
	var DEFAULT_PROVIDER_DURATION = 1000,
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	The contentdeck uses an extension of the contentprovider module to shuffle
		 *	a collection of content providers using a timeout as the primary transition
		 *	logic for swapping content panes.
		 */
		_ = KOI.plugin("contentshuffler"),
	
		//------------------------------
		//  Resources
		//------------------------------
		
		/**
		 *	A collection of all the shuffle decks created by this plugin.
		 *
		 *	Signature:
		 *	{
		 *		<deckName>: <Contentshuffler>,
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
		 *	Create a new content shuffle deck.
		 *
		 *	@param name			The name of this content deck.
		 *
		 *	@param display		A jQuery object representing the display of this content area.
		 *
		 *	@param transition	A transition object for processing effects.
		 */
		create: function (name, display, transition)
		{
			if (decks[name] !== undefined)
			{
				throw new PluginException("contentshuffler", "create", "name", name, "Namespace collision");
			}
			
			decks[name] = new KOI.module.contentshuffler(display, transition);
			
			return _.get(name);
		},
		
		/**
		 *	Get the given content shuffle deck.
		 *
		 *	@param name	The name of the contentdeck to get.
		 */
		get: function (name)
		{
			if (decks[name] === undefined)
			{
				throw new PluginException("contentshuffler", "get", "name", undefined, "Not defined");
			}
			
			return decks[name];
		}
	});
	
	//------------------------------
	//
	//  Class Definition
	//
	//------------------------------
	
	//------------------------------
	//  Contentshuffler
	//------------------------------
	
	/**
	 *	Create the contentshuffler class, which contains a Timer to dispatch
	 *	render events.
	 */
	KOI.module.contentshuffler = KOI.module.eventdispatcher.extend(
	{
		//------------------------------
		//  Internal Properties
		//------------------------------
	
		/**
		 *	An instance of a timer to track shuffle events.
		 */
		__timer: undefined,
		
		/**
		 *	The dataproviders bound to this content shuffle deck.
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
		 *	The display object for this content area.
		 */
		__display: undefined,
		
		/**
		 *	The order to display the items in.
		 */
		__order: undefined,
		
		/**
		 *	The current index of the order array.
		 */
		__currentIndex: undefined,
	
		/**
		 *	A transition function.
		 */
		__transition: undefined,
		
		//------------------------------
		//  Properties
		//------------------------------
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@param display		A jQuery object representing the display of this content area.
		 *
		 *	@param transition	The transition function to use when swapping content, if any.
		 */
		init: function (display, transition)
		{
			this._super();
		
			var self = this;
		
			this.__display = display;
			this.__providers = {};
			this.__order = [];
			this.__timer = new KOI.module.timer(function ()
			{
				self.__switchContent();
			}, 0, false);
			
			if (!$.isFunction(transition))
			{
				this.__transition = function (element, state, complete)
				{
					complete.call();
				}
			}
			else
			{
				this.__transition = transition;
			}
			
			this.ready(function ()
			{
				self.__switchContent();
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
		},
		
		/**
		 *	Add a shuffle provider.
		 *
		 *	@param provider	The data provider to add. Must be an instance of shuffleprovider.
		 */
		addProvider: function (provider)
		{
			if (!(provider instanceof KOI.module.shuffleprovider))
			{
				throw new ModuleException("contentshuffler", "addProvider", "provider", undefined, "Must be instanceof KOI.module.shuffleprovider");
			}
			
			if (this.__providers[provider.name] !== undefined)
			{
				throw new ModuleException("contentshuffler", "addProvider", "provider.name", provider.name, "Namespace collision");
			}
			
			this.__providers[provider.name] = provider;
			
			if (!provider.excludeFromShuffle)
			{
				this.__order.push(provider.name);
			}
			
			this.__shuffle();
			
			var self = this;
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
				throw new ModuleException("contentshuffler", "getProvider", "name", name, "Not defined");
			}
			
			return this.__providers[name];
		},
		
		/**
		 *	Wait for the ready event.
		 */
		waitForReady: function ()
		{
			var self = this;
			
			$.each(this.__providers, function (name, provider)
			{
				provider.ready(function ()
				{
					provider.__display.appendTo(self.__display);
					self.makeReady();
				});
			});
		},
		
		//------------------------------
		//  Internal Methods
		//------------------------------
		
		/**
		 *	Shuffle the order of the content providers.
		 */
		__shuffle: function ()
		{
			var length = this.__order.length,
			
				index = length - 1,
				
				swapkey,
				
				buffer;
				
			for (; index > 0; index--)
			{
				swapkey = Math.floor(Math.random() * (index + 1));
				buffer = this.__order[index];
				this.__order[index] = this.__order[swapkey];
				this.__order[swapkey] = buffer;
			}
		},
		
		/**
		 *	The content switcher for this deck.
		 *
		 *	@param content	The name of the content provider to switch to.
		 */
		__switchContent: function (content)
		{
			if (content === undefined)
			{
				if (this.__currentIndex === undefined)
				{
					this.__currentIndex = 0;
				}
				else
				{
					this.__currentIndex += 1;
				}
				
				if (this.__currentIndex >= this.__order.length)
				{
					this.__currentIndex = 0;
				}
				
				content = this.__order[this.__currentIndex];
			}
		
			var self = this;
		
			this.__setCurrentProvider(content, function ()
			{
				self.__transition(self.__getCurrentProvider().__display, "in", function ()
				{
					self.__getCurrentProvider().activate();
					self.__timer.stop();
					
					self.__timer.__duration = self.__getCurrentProvider().duration;
					
					self.__timer.start();
				});
			});
		},
		
		/**
		 *	Set a new current provider.
		 *
		 *	@param name		The name of the provider.
		 *
		 *	@param callback	The callback to trigger when the transition completes.
		 */
		__setCurrentProvider: function (name, callback)
		{
			if (this.__providers[name] === undefined)
			{
				throw new ModuleException("contentshuffler", "__setCurrentProvider", "name", undefined, "Not defined");
			}
			
			var self = this;
			
			if (!(this.__currentProvider === undefined || this.__currentProvider === null))
			{
				this.__transition(this.__getCurrentProvider().__display, "out", function ()
				{
					self.__getCurrentProvider().idle();
					self.__currentProvider = name;
					callback.call();
				});
			}
			else
			{
				this.__currentProvider = name;
				callback.call();
			}	
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
				throw new ModuleException("contentshuffler", "__getCurrentProvider", "__currentProvider", undefined, "Not defined");
			}
			
			return this.getProvider(this.__currentProvider);
		}
	});
	
	//------------------------------
	//  Shuffleprovider
	//------------------------------
	
	/**
	 *	Create the shuffleprovider class, which is designed to work with the
	 *	contentshuffler.
	 */
	KOI.module.shuffleprovider = KOI.module.eventdispatcher.extend(
	{
		//------------------------------
		//  Internal Properties
		//------------------------------
	
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
		
		/**
		 *	Should this provider be excluded from the shuffle?
		 */
		excludeFromShuffle: undefined,
		
		/**
		 *	The duration of time the provider must be visible.
		 */
		duration: undefined,
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@param name			The name of this content provider.
		 *
		 *	@param display		The display object.
		 *
		 *	@param duration		The duration of time this provider is present.
		 *
		 *	@param exclude		Should this be exluded from the shuffle? Default is false.
		 */
		init: function (name, display, duration, exclude)
		{
			duration = parseInt(duration, 10);
			
			if (isNaN(duration))
			{
				this.duration = DEFAULT_PROVIDER_DURATION;
			}
			else
			{
				this.duration = duration;
			}
		
			this.excludeFromShuffle = exclude || false;
			
			this.name = name;
			this.__display = display;
			
			this._super();
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Configure this provider.
		 *
		 *	@param configuration	The configuration for this object.
		 */
		configure: function (configuration)
		{
			throw new InterfaceException("shuffleprovider", "configure");
		},
		
		/**
		 *	Activate this provider.
		 */
		activate: function ()
		{
			this.__display.addClass("active-provider");
		},
		
		/**
		 *	Idle this provider.
		 */
		idle: function ()
		{
			this.__display.removeClass("active-provider");
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
