/*!
 *	Plugin - Omniwidget
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global PluginException, KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{	

	//------------------------------
	//
	//	Constants
	//
	//------------------------------
	
		/**
		 *	The template for a new omniwidget.
		 */
	var WIDGET_TEMPLATE = '<div class="omniwidget"><div class="omniwidget-header ui-helper-clearfix"><span class="omniwidget-title"></span></div><div class="omniwidget-content ui-helper-clearfix scroll-manager"></div><div class="omniwidget-footer ui-helper-clearfix"></div></div>',
	
		/**
		 *	The inheritable template for an omniwidget.
		 */
		INHERIT_TEMPLATE = '<div class="omniwidget-content">%CONTENT%</div>',
	
		/**
		 *	The template for the resize indicator.
		 */
		WIDGET_RESIZE_TEMPLATE = '<div class="omniwidget-resize "></div>',
	
		/**
		 *	The template for the close button on an omniwidget.
		 */
		WIDGET_CLOSE_TEMPLATE = '<a href="#" class="omniwidget-close"></a>',
		
		/**
		 *	The template for the inherit button on an omniwidget.
		 */
		WIDGET_INHERIT_TEMPLATE = '<a href="#" class="omniwidget-inherit trigger-new-window"></a>',
		
		/**
		 *	The delay between initial content injection and the inherit-ready event, to allow for time to setup
		 *	the external dom.
		 */
		INHERIT_READY_DELAY = 150,
	
		/**
		 *	Grab our config object.
		 */
		config = KOI.configuration("omniwidget"),
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	The omniwidget is a multipurpose display object, which can be made any combination
		 *	of draggable, resizable, and inheritable.
		 */
		_ = KOI.plugin("omniwidget", "development"),
	
		//------------------------------
		//  Resources
		//------------------------------
		
		/**
		 *	A collection of all the widgets created by the plugin.
		 *
		 *	Signature:
		 *	{
		 *		<widgetName>: <Omniwidget>,
		 *
		 *		...
		 *	}
		 */
		widgets = {},
		
		//------------------------------
		//  Inheritable Options
		//------------------------------
		
		/**
		 *	The URL to the inheritable container.
		 */
		inheritableTarget = config("inheritableTarget", "omniwidget.html"),
		
		/**
		 *	The options for the inheritable window trigger.
		 */
		inheritableWindowOptions = config("inheritableWindowOptions", "height=500,width=500");
	
	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------
	
	/**
	 *	Setup an omniwidget, based on it's flags.
	 *
	 *	@param widget			The omniwidget to setup.
	 */
	function setup(widget)
	{
		//	Grab our configuration.
		var configuration = widget.__configuration;
	
		//------------------------------
		//  Classes
		//------------------------------
	
		if (configuration.className)
		{
			widget.__element.addClass(configuration.className);
		}
		
		//------------------------------
		//  Embedding
		//------------------------------
		
		if (widget.__parent !== undefined)
		{
			widget.__parent.append(widget.__element);
		}
		
		//------------------------------
		//  Resizable
		//------------------------------
		
		if (widget.__resizable)
		{
			widget.__footer.append(WIDGET_RESIZE_TEMPLATE);
			widget.__element.addClass("omniwidget-resizable").resizable($.extend(true, {}, 
			{
				handles: "se"
			}, configuration.resizableOptions));
		}
		
		//------------------------------
		//  Draggable
		//------------------------------
		
		if (widget.__draggable)
		{
			widget.__element.addClass("omniwidget-draggable").draggable($.extend(true, {}, 
			{
				handle: ".omniwidget-header"
			}, configuration.draggableOptions));
		}
	
		//------------------------------
		//  Closeable
		//------------------------------
		
		if (widget.__closeable)
		{
			widget.__element.addClass("omniwidget-closeable");
			widget.__header.append($(WIDGET_CLOSE_TEMPLATE).html(configuration.closeText || '').click(function (event)
			{
				event.preventDefault();
				
				widget.hide();
			}));
		}

		//------------------------------
		//  Inheritable
		//------------------------------
		
		if (widget.__inheritable)
		{
			widget.__element.addClass("omniwidget-inheritable");
			widget.__header.append($(WIDGET_INHERIT_TEMPLATE).attr(
			{
				href: (configuration.inheritableTarget || inheritableTarget) + '#' + widget.name,
				rel: configuration.inheritableWindowOptions || inheritableWindowOptions,
				target: ("omniwidget_" + widget.name).replace("-", "_")
			}).html(configuration.inheritableText || ''));
			widget.__content = new KOI.module.jset(widget.__content);
			
			KOI.bind("framework-inherited-" + widget.name, function (event, proxy, child)
			{
				child.document.title = widget.inheritableTitle || widget.title || "";
				
				child.__inheritUnload = function ()
				{
					widget.trigger("inheritUnload", [proxy]);
				};
				
				proxy(function ()
				{
					if (widget.inheritStyles.length > 0)
					{
						KOI.createStylesheet(widget.inheritStyles, proxy("head"));
					}
					
					proxy("body").html(INHERIT_TEMPLATE.replace('%CONTENT%', widget.content().html()));
					
					widget.__content._set_add(proxy("body").find(".omniwidget-content"));
					
					setTimeout(function ()
					{
						widget.trigger("inherit-ready", [proxy, widget]);
					}, INHERIT_READY_DELAY);
				});
				
				widget.__header.find(".omniwidget-inherit").hide();
				
				if (widget.closeOnInherit)
				{
					widget.hide();
					widget.inheritClosed = true;
				}
				
				$.each(widget.__liveEvents, function (type, events)
				{
					$.each(events, function (index, event)
					{
						proxy(event.selector).live(type, event.listener);
					});
				});
			});
			
			KOI.bind("inherited-child-close-" + widget.name, function (event)
			{
				widget.__content._set_empty();
				widget.__content._set_add(widget.__element.find(".omniwidget-content"));
				
				widget.trigger("inherit-close", [widget]);
				
				widget.__header.find(".omniwidget-inherit").show();

				if (widget.closeOnInherit)
				{
					widget.inheritClosed = false;
				}
				
				if (widget.openOnInheritClose)
				{	
					if (widget.skipNextInheritCloseShow)
					{
						widget.skipNextInheritCloseShow = false;
					}
					else
					{
						widget.show();
					}
				}
			});
		}
		
		//------------------------------
		//  Title
		//------------------------------
		
		if (widget.title)
		{
			widget.__element.find(".omniwidget-title").html(widget.title);
		}
		
		//------------------------------
		//  Content
		//------------------------------
		
		//	Inject content if we have a selector.
		if (configuration.inject !== undefined)
		{
			widget.injectContent(configuration.inject);
		}
		
		//	Set content if we're given the raw HTML.
		else if (configuration.content !== undefined)
		{
			widget.setContent(configuration.content);
		}
		
		//------------------------------
		//  Recovery
		//------------------------------
		
		widget.__element.data("omniwidget", widget);
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
		 *	Create a new omniwidget
		 *
		 *	@param name				The name of this widget.
		 *
		 *	@param configuration	A configuration object for the widget.
		 *
		 *	configuration Signature:
		 *	{
		 *		title: <windowTitle>,
		 *
		 *		className: <classNameToAdd>,
		 *
		 *		embed: <jQueryParentToEmbedIn>,
		 *
		 *		closeOnInherit: <closeWhenInherits(false)>,
		 *
		 *		openOnInheritClose: <openWhenInheritCloses(true)>,
		 *
		 *		inheritable: <true|false>,
		 *
		 *		inheritableTitle: <titleOfInheritableWindow>,
		 *
		 *		inheritableTarget: <urlOfInheritableWindowURL>,
		 *
		 *		inheritableWindowOptions: <popupOptionsForWindow>,
		 *
		 *		inheritableText: <linkTextForInheritableTrigger>,
		 *
		 *		closeable: <closeableWindow(false)>,
		 *
		 *		closeText: <linkTextForCloseTrigger>,
		 *
		 *		draggable: <makeDraggable(false)>,
		 *
		 *		liveEvents: <eventsObjects>,
		 *
		 *		draggableOptions: <optionsForDraggable>,
		 *
		 *		resizable: <makeResizable(false)>,
		 *
		 *		resizableOptions: <optionsForResizable>,
		 *
		 *		showOnReady: <showWhenReady(false)>,
		 *
		 *		inject: <selectorForContent>,
		 *
		 *		content: <htmlForContent>,
		 *
		 *		inheritStyles: <arrayOfStyles>
		 *	}
		 */
		create: function (name, configuration)
		{
			if (widgets[name] !== undefined)
			{
				throw new PluginException("omniwidget", "create", "name", name, "Namespace collision");
			}
			
			widgets[name] = new KOI.module.omniwidget(name, configuration);
			
			return _.get(name);
		},
		
		/**
		 *	Get the given omniwidget.
		 *
		 *	@param name	The name of the widget to get.
		 */
		get: function (name)
		{
			if (widgets[name] === undefined)
			{
				throw new PluginException("omniwidget", "get", "name", name, "Not defined");
			}
			
			return widgets[name];
		}
	});
	
	//------------------------------
	//
	//  Class Definition
	//
	//------------------------------
	
	/**
	 *	Create the omniwidget module.
	 */
	KOI.module.omniwidget = KOI.module.eventdispatcher.extend(
	{
		//------------------------------
		//  Internal Properties
		//------------------------------
		
		/**
		 *	The configuration object used to build this widget.
		 */
		__configuration: undefined,
		
		/**
		 *	Flag to determine if this omniwidget is draggable.
		 */
		__draggable: undefined,
		
		/**
		 *	Flag to determine if this omniwidget is resizable.
		 */
		__resizable: undefined,
		
		/**
		 *	Flag to determine if this omniwidget is inheritable.
		 */
		__inheritable: undefined,
		
		/**
		 *	Flag to determine if this omniwidget is closeable.
		 */
		__closeable: undefined,
		
		/**
		 *	The element representing this widget.
		 */
		__element: undefined,
		
		/**
		 *	The header of the widget.
		 */
		__header: undefined,
		
		/**
		 *	The content of the widget.
		 */
		__content: undefined,
		
		/**
		 *	The footer of the widget.
		 */
		__footer: undefined,
		
		/**
		 *	This is the containing element.
		 */
		__parent: undefined,
		
		/**
		 *	Flag to determine if we should show when ready.
		 */
		__showOnReady: undefined,
		
		/**
		 *	A collection of live events to bind to the inheriter.
		 */
		__liveEvents: undefined,
	
		//------------------------------
		//  Properties
		//------------------------------
		
		/**
		 *	Flag to keep the state of being open or closed.
		 */
		open: undefined,
		
		/**
		 *	Flag to determine if closed becaues of inheritance.
		 */
		inheritClosed: undefined,
		
		/**
		 *	Flag to detemrmine if open should follow an inheritance close.
		 */
		openOnInheritClose: undefined,
		
		/**
		 *	The name of this omniwidget. Should be unique.
		 */
		name: undefined,
		
		/**
		 *	The title of this widget.
		 */
		title: undefined,
		
		/**
		 *	The title of the inheritable window, if applicable.
		 */
		inheritableTitle: undefined,
		
		/**
		 *	Flag to determine if the widget should be closed on inheritance.
		 */
		closeOnInherit: undefined,
		
		/**
		 *	An array of the styles to dump into the inheritable window.
		 */
		inheritStyles: undefined,
		
		/**
		 *	Flag to determine if the next inherit close show should be skipped.
		 */
		skipNextInheritCloseShow: undefined,
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@param name				The name of this widget. Will become an ID.
		 *	
		 *	@param configuration	A configuration object for this widget. See the plugin definition for signature.
		 */
		init: function (name, configuration)
		{
			this._super();
			
			configuration = configuration || {};
			
			this.name = name;
			this.title = configuration.title;
			this.inheritableTitle = configuration.inheritableTitle;
			this.closeOnInherit = configuration.closeOnInherit || false;
			this.openOnInheritClose = configuration.openOnInheritClose === undefined ? true : configuration.openOnInheritClose;
			this.inheritStyles = configuration.inheritStyles || [];
			this.skipNextInheritCloseShow = false;
			
			this.__liveEvents = {};
			this.__inheritable = configuration.inheritable || false;
			this.__draggable = configuration.draggable || false;
			this.__resizable = configuration.resizable || false;
			this.__closeable = configuration.closeable || false;
			this.__showOnReady = configuration.showOnReady || false;
			this.__parent = configuration.embed || $("body");
			
			this.__element = $(WIDGET_TEMPLATE).attr('id', name);
			this.__header = this.__element.find(".omniwidget-header");
			this.__footer = this.__element.find(".omniwidget-footer");
			this.__content = this.__element.find(".omniwidget-content");
			
			this.__configuration = configuration;
			
			setup(this);
			
			var self = this;
			
			if (configuration.liveEvents !== undefined)
			{
				$.each(configuration.liveEvents, function (type, events)
				{
					$.each(events, function (index, event)
					{
						self.liveBind(type, event.selector, event.listener);
					});
				});
			}
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Bind a live event to the omniwidget handler for inheritable event pipes.
		 *
		 *	@param eventType	The live event type to listen for.
		 *
		 *	@param selector		The selector string.
		 *
		 *	@param listener		The listener to bind.
		 */
		liveBind: function (eventType, selector, listener)
		{
			if (this.__liveEvents[eventType] === undefined)
			{
				this.__liveEvents[eventType] = [];
			}
			
			this.__liveEvents[eventType].push(
			{
				selector: selector,
				
				listener: listener
			});
			
			$(selector).live(eventType, listener);
		},
		
		/**
		 *	Make the widget ready.
		 */
		makeReady: function ()
		{
			if (this.__showOnReady)
			{
				this.show();
			}
			
			this._super();
		},
		
		/**
		 *	Return the widget header.
		 *
		 *	@return	The header area for the widget.
		 */
		header: function ()
		{
			return this.__header;
		},
		
		/**
		 *	Return the widget content.
		 *
		 *	@return	The content area for the widget.
		 */
		content: function ()
		{
			return this.__content;
		},
		
		/**
		 *	Return the widget footer.
		 *
		 *	@return	The footer area for the widget.
		 */
		footer: function ()
		{
			return this.__footer;
		},
		
		/**
		 *	Show the widget.
		 */
		show: function ()
		{
			if (this.inheritClosed)
			{
				return;
			}
			
			this.open = true;
			this.__element.show();
			this.trigger("show");
		},
		
		/**
		 *	Hide the widget.
		 */
		hide: function ()
		{
			if (this.inheritClosed)
			{
				return;
			}
			
			this.open = false;
			this.__element.hide();
			this.trigger("hide");
		},
		
		/**
		 *	Toggle the state of the gallery.
		 */
		toggle: function ()
		{
			if (this.open)
			{
				this.hide();
			}
			else
			{
				this.show();
			}
		},
		
		/**
		 *	Inject content into the widget from some external element.
		 *
		 *	@param selector	The jQuery selector for the structure to inject.
		 */
		injectContent: function (selector)
		{
			this.setContent($(selector).remove().children().remove());
		},
		
		/**
		 *	Load content into the widget, readying it.
		 *
		 *	@param content	The content to set in the widget.
		 */
		setContent: function (content)
		{
			if (this.isReady)
			{
				return;
			}
			
			this.__content.append(content);
			
			this.makeReady();
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
	//  Destroy Configuration
	//------------------------------
	
	config();
		
}(jQuery));
