/*!
 *	Plugin - Deeplink
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
	
		/**
		 *	Regex to split the classes of an element.
		 */
	var RX_SPLIT = /\s+/g,
	
		/**
		 *	Regex to fetch the deeplink identifier off an element.
		 */
		RX_IDENTIFIER = /^deeplink\-/,
		
		/**
		 *	Selector to grab all deeplink items and stacks.
		 */
		SELECTOR_ALL = '.koi-deeplink-item-stack, .koi-deeplink-item, .koi-deeplink-stack',
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	Create the plugin namespace.
		 */
		_ = KOI.plugin('deeplink', 'development'),
	
		/**
		 *	A collection of paths with listeners.
		 *
		 *	Signature:
		 *	[
		 *		<path>,
		 *
		 *		...
		 *	]
		 */
		listeners = [],
	
		/**
		 *	Flag to determine if the initial deeplinking mapping has finished.
		 */
		mapGenerated = false,
		
		/**
		 *	Flag to determine if first child automation should occur. The process of first child automation will
		 *	select the first of every available item in the current deeplinking scope, and show them all the way down.
		 */
		firstChildAutomation = false,
		
		/**
		 *	The current path being handled by deeplinking.
		 */
		currentPath = [],
		
		/**
		 *	A string representation of what the current path should be after processing. Will always contain trailing
		 *	and leading slashes.
		 */
		explicitPath,
		
		/**
		 *	Flag to determine if processing through deeplinking should be disabled.
		 */
		ignoreProcessing = false,
	
		/**
		 *	The current request parameters
		 */
		currentParameters = {},
		
		/**
		 *	The currently visible child element.
		 */
		currentChild;
	
	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------
	
	/**
	 *	Whenever the map is generated and firstChildAutomation is enabled, show the first
	 *	valid identifiers until no more stacks remain.
	 */
	function processAutomation()
	{
		if (mapGenerated && firstChildAutomation)
		{
			$('#koi-deeplink-root').showDeeplinkChild();
			
			ignoreProcessing = true;

			_.set('/' + currentPath.join('/') + '/');
			
			ignoreProcessing = false;
		}
		else if (mapGenerated && currentPath)
		{
			var path = [].concat(currentPath);
			
			$('#koi-deeplink-root').showDeeplinkChild(path);
		}
	}
	
	/**
	 *	Activate components in the current child.
	 */
	function activateCurrentComponents()
	{
		$('.koi-component', currentChild).removeClass('koi-deeplink-component-disabled').trigger('load-component');
	}
	
	/**
	 *	Notify current path listeners.
	 *
	 *	@param notifyPath	The path to notify.
	 */
	function notifyListeners(notifyPath)
	{
		notifyPath = notifyPath || explicitPath;

		var paramProxy = $.extend({}, currentParameters);
		
		if ($.inArray(notifyPath, listeners) !== -1)
		{
			_.trigger("path-set-" + notifyPath, [paramProxy]);
		}
	}
	
	/**
	 *	Notify external plugins that the path has been set.
	 *
	 *	@param path The path to force.
	 */
	function triggerPathSet(path)
	{
		var paramProxy = $.extend({}, currentParameters);
		
		_.trigger("path-set", [currentPath, paramProxy]);

		notifyListeners(path);
	}
	
	/**
	 *	Generates a deeplinking map from the HTML snippets in the deeplinking container.
	 */
	function generateMap()
	{
		$('#koi-deeplink-root').extractDeeplinkIdentifiers();

		mapGenerated = true;
		
		$.address.init(function (event)
		{
			$.address.change(function (event)
			{
				_.recover(event.value, event.parameters);
			});
	
			if ($.address.value() === '/')
			{
				firstChildAutomation = true;
				processAutomation();
				firstChildAutomation = false;
				
				activateCurrentComponents();
				
				triggerPathSet();
			}
			else
			{
				_.recover(event.value, event.parameters);
			}
		});
	}
	
	/**
	 *	Make sure the provided path has trailing and leading slashes.
	 *
	 *	@param path The path to correct.
	 *
	 *	@return A path with leading and trailing slashes.
	 */
	function correctPath(path)
	{
		path = path.split('?')[0];
		
		if (path.substr(path.length - 1) !== '/')
		{
			path += '/';
		}
		
		if (path.substr(0, 1) !== '/')
		{
			path = '/' + path;
		}
			
		return path;
	}
	
	/**
	 *	Set the current title.
	 */
	function setCurrentTitle()
	{
		var title = [_.baseTitle];
		
		currentChild.parentsUntil('#koi-deeplink-root').each(function ()
		{
			if ($(this).children('.koi-deeplink-title').length)
			{
				title.unshift($(this).children('.koi-deeplink-title').text());
			}
		});
		
		if (currentChild.children('.koi-deeplink-title').length)
		{
			title.unshift(currentChild.children('.koi-deeplink-title').text());
		}
		
		document.title = title.join(_.titleSeparator);
	}
	
	/**
	 *	Sets the current child.
	 *
	 *	@param child	The child to set as the current visible.
	 */
	function setCurrentChild(child)
	{	 
		child.show();

		if (child.attr('id') !== 'koi-deeplink-root')
		{
			currentChild = child.addClass('koi-deeplink-active-child').show();

			if ($('.koi-deeplink-title', currentChild).length)
			{
				setCurrentTitle();
			}
		}
	}

	//------------------------------
	//
	//	Plugin Definition
	//
	//------------------------------
	
	_.build(
	{
		//------------------------------
		//	Properties
		//------------------------------
	
		/**
		 *	The base title for appendations.
		 */
		baseTitle: '',
		
		/**
		 *	The title separator.
		 */
		titleSeparator: ' | ',
	
		//------------------------------
		//	Methods
		//------------------------------
	
		/**
		 *	Returns the current path.
		 *
		 *	@return Array containing path elements.
		 */
		path: function ()
		{
			return currentPath;
		},

		/**
		 *	Returns the current parameters of the path.
		 *
		 *	@return Object containing the parameters.
		 */
		parameters: function ()
		{
			return $.extend({}, currentParameters);
		},

		/**
		 *	Extend the current parameters.
		 *
		 *	@param params	The parameters to add to the current parameters.
		 *
		 *	@return The new parameters.
		 */
		extendParameters: function (params)
		{
			return $.extend({}, currentParameters, params);
		},
	
		/**
		 *	Set the current deeplinking path.
		 *
		 *	@param path			The base deeplinking path being set.
		 *
		 *	@param parameters	Optional parameters to set along with the path.
		 */
		set: function (path, parameters)
		{
			path += '?' + $.param(parameters || currentParameters);

			$.address.value(path);
		},
		
		/**
		 *	Recover the provided path and parameters.
		 *
		 *	@param path			The base deeplinking path being recovered.
		 *
		 *	@param parameters	Optional parameters to read along with the path.
		 */
		recover: function (path, parameters)
		{
			path = correctPath(path);
			
			if (path === explicitPath)
			{
				if ($.param(currentParameters) !== $.param(parameters))
				{
					currentParameters = parameters;
					triggerPathSet();
				}				 
				
				return;
			}
			
			if (!ignoreProcessing)
			{
				$(SELECTOR_ALL).hide();
				$('.koi-deeplink-active-child').removeClass('koi-deeplink-active-child');
				
				explicitPath = path;
				currentParameters = parameters;
 
				//	In the case we simply get a path element, load the first element in the container.
				if (path === '/')
				{
					currentPath = [];
					firstChildAutomation = true;
					processAutomation();
					firstChildAutomation = false;
				}
				else
				{
					//	Split the path fragments into an array.
					path = path.split('/');
					
					//	Removing the forward and ending slashes
					path.shift();
					path.pop();
					
					//	Set the current path
					currentPath = path;
					
					//	Process the deeplinking automation
					processAutomation();
				}

				activateCurrentComponents();
				
				triggerPathSet();
			}

			if ('/' + currentPath.join('/') + '/' !== explicitPath)
			{
				ignoreProcessing = true;
 
				explicitPath = '/' + currentPath.join('/') + '/';
				triggerPathSet();
				
				_.set('/' + currentPath.join('/') + '/', currentParameters);
				
				ignoreProcessing = false;
			}
			else if (ignoreProcessing)
			{
				triggerPathSet();
			}
		},
		
		/**
		 *	Register a listener to be notified when the provided explicit path is routed to.
		 *
		 *	@param path		The explicit path.
		 *
		 *	@param listener The listener to notify.
		 */
		registerPathHandler: function (path, listener)
		{
			path = correctPath(path);
			
			if ($.inArray(path, listeners) === -1)
			{
				listeners.push(path);
			}
			
				/**
				 *	Create a namespace incase we need to auto trigger the event.
				 */
			var namespace = (new Date()).valueOf(),
			
				/**
				 *	The event to bind against.
				 */
				event = "path-set-" + path + "." + namespace;
			
			_.bind(event, listener);
			
			if (explicitPath === path)
			{
				_.trigger(event);
			}
		}
		
	});
	
	//------------------------------
	//
	//  jQuery Extension
	//
	//------------------------------
	
	/**
	 *	Generate a deeplinking map from the given root.
	 */
	$.extend($.fn, 
	{
		//------------------------------
		//	Methods
		//------------------------------
		
		/**
		 *	Extract the deeplinking identifier for the first element in the jQuery result.
		 *
		 *	@return For the root, an object indexed by the non-prefixed deeplinking identifier, which contains the relevant element.
		 */
		extractDeeplinkIdentifiers: function ()
		{	
			var response = {};
			
			if (this.attr('id') === 'koi-deeplink-root')
			{
				this.data('koi-deeplink-map', this.children(SELECTOR_ALL).extractDeeplinkIdentifiers());
				return this.data('koi-deeplink-map');
			}
			else
			{
				this.each(function ()
				{
					var element = $(this),
						classes = element.attr('class').split(RX_SPLIT),
						identifier;
						
					$.each(classes, function ()
					{
						if (this.match(RX_IDENTIFIER) === null)
						{
							return;
						}
						else
						{
							identifier = this.replace(RX_IDENTIFIER, '');
						
							if (!element.hasClass('koi-deeplink-error'))
							{
								response[identifier] = element;
							} 
							
							element.data('koi-deeplink-identifier', identifier);
						
							if (element.hasClass('koi-deeplink-item-stack') || element.hasClass('koi-deeplink-stack'))
							{
								element.data('koi-deeplink-map', element.children(SELECTOR_ALL).extractDeeplinkIdentifiers());
							}
							
							return;
						}
					});
				});
			}
			
			return response;
		},
		
		/**
		 *	Shows a deeplinking child of the current stack.
		 *
		 *	@param identifier	An array containing the remaining path which must be shown.
		 *
		 *	@return jQuery
		 */
		showDeeplinkChild: function (identifier)
		{
			if (ignoreProcessing)
			{
				return this;
			}
			
			if (this.data('koi-deeplink-map') !== undefined)
			{
				if (identifier === undefined && !this.hasClass('koi-deeplink-stop-automation'))
				{
					$.each(this.data('koi-deeplink-map'), function (path)
					{
						currentPath.push(path);
					
						setCurrentChild(this);
						
						currentChild.showDeeplinkChild();
						
						return false;
					});
					
					return this;
				}
				else if (KOI.typecheck(identifier, 'Array') && identifier.length > 0)
				{
					var fragment = identifier.shift(),
						target = this.data('koi-deeplink-map')[fragment];
	
					if (target)
					{
						setCurrentChild(target);
						
						target.show().showDeeplinkChild(identifier.length ? identifier : undefined);
						
						return this;
					}
				}
			}
		
			//	If we make it to this point with an identifier, and we have an error handler, utilize it.
			if ($('.koi-deeplink-error').length > 0 && identifier !== undefined)
			{
				$(SELECTOR_ALL).hide();
				$('.koi-deeplink-active-child').removeClass('koi-deeplink-active-child');
				setCurrentChild($('.koi-deeplink-error'));
			}

			return this;
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
	//  Setup
	//------------------------------
	
	_.ready(function ()
	{
		_.baseTitle = document.title;
	
		generateMap();
	});
	
	//------------------------------
	//  Component Integration
	//------------------------------
	
	KOI.bind("platform-initialized", function ()
	{	
		/**
		 *	Add a custom disabled class for components.
		 */
		if (KOI.component !== undefined)
		{
			KOI.component.disabledClasses.push('koi-deeplink-component-disabled');
		}
	});

}(jQuery));
