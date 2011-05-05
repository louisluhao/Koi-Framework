/**
 *	Deeplink
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
		
		/**
		 *	The configuration object.
		 */
		config = KOI.configuration("deeplink"),
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	Create the plugin namespace.
		 */
		_ = KOI.plugin('deeplink'),
		
		/**
		 *	A loading screen, if set.
		 */
		loading_screen,
		
		/**
		 *	Is the current request being forwarded along?
		 */
		is_forwarding = false,
		
		/**
		 *	Should first child automation be enabled?
		 */
		enableFirstChildAutomation = config("enableFirstChildAutomation", true),
		
		/**
		 *	Should history be used (back/forward buttons).
		 */
		use_history = config("use_history", true),
		
		/**
		 *	A collection of routes to be considered variable declarations instead of deeplink routes.
		 *
		 *	These variables will consume the next path argument when detected.
		 *
		 *	In the URL:
		 *		/foo/1234/bar/12345/baz/
		 *
		 *	With route variables:
		 *		foo, bar
		 *
		 *	The resultant URL which is routed to will be:
		 *		/baz/
		 *
		 *	Providing as parameters:
		 *		foo: 1234,
		 *		bar: 12345
		 *
		 *	Signature:
		 *	{
		 *		<routeVariable>: <variableName>,
		 *
		 *		...
		 *	}
		 */
		route_variables = config("route_variables", {}),
		
		/**
		 *	A collection of routes to be considered variable declarations instead of deeplink routes.
		 *
		 *	These variables will respond with true|false, depending on their presence.
		 *
		 *	In the URL:
		 *		/foo/bar/
		 *
		 *	With route boolean variables:
		 *		bar, baz
		 *
		 *	The resultant URL which is routed to will be:
		 *		/foo/
		 *
		 *	Providing as parameters:
		 *		bar: true,
		 *		baz: false
		 *
		 *	Signature:
		 *	{
		 *		<routeVariable>: <variableName>,
		 *
		 *		...
		 *	}
		 */
		route_boolean_variables = config("route_boolean_variables", {}),
	
		/**
		 *	A route map will reappend extracted route variables to the path.
		 *
		 *	In the URL:
		 *		/foo/1234/bar/12345/baz/
		 *
		 *	With route variables:
		 *		foo, bar
		 *
		 *	And route maps:
		 *		bar
		 *
		 *	The resultant URL which is routed to will be:
		 *		/bar/baz/
		 *
		 *	Providing as parameters:
		 *		foo: 1234,
		 *		bar: 12345
		 *
		 *	Signature:
		 *	[
		 *		<routeVariable>,
		 *
		 *		...
		 *	]
		 */
		route_map = config("route_map", []),
		
		/**
		 *	An explicit route to all proxying, which prevents 404 dispatches when the explict route matches.
		 *
		 *	Signature:
		 *	{
		 *		<routeProxy>: <pageTitle>,
		 *
		 *		...
		 *	}
		 */
		route_proxies = config("route_proxies", {}),
	
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
		 *	The route corrected path being handled.
		 */
		routedPath = [],
		
		/**
		 *	A string representation of what the current path should be after processing. Will always contain trailing
		 *	and leading slashes.
		 */
		explicitPath,
		
		/**
		 *	A string representation of the routed path. Will always contain trailing and leading slashes.
		 */
		explicitRoute,
		
		/**
		 *	Flag to determine if processing through deeplinking should be disabled.
		 */
		ignoreProcessing = false,
	
		/**
		 *	The current request parameters
		 */
		currentParameters = {},
		
		/**
		 *	The current route parmaeters.
		 */
		routeParameters = {},
		
		/**
		 *	The currently visible child element.
		 */
		currentChild,
		
		/**
		 *	Flag to determine if a routing error is the last action taken.
		 */
		routingError = false;
	
	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------
	
	/**
	 *	Make sure the provided path has trailing and leading slashes.
	 *
	 *	@param path The path to correct.
	 *
	 *	@return A path with leading and trailing slashes.
	 */
	function correctPath(path) {
		path = path.split('?')[0];
		
		if (path.substr(path.length - 1) !== '/') {
			path += '/';
		}
		
		if (path.substr(0, 1) !== '/') {
			path = '/' + path;
		}
			
		return path;
	}
	
	/**
	 *	Correct a route.
	 *
	 *	@param path	The path to correct as a route.
	 *
	 *	@return	The path corrected for routing.
	 */
	function correctRoute(path) {
			/**
			 *	A rerouted URL.
			 */
		var routed = [],
	
			/**
			 *	Collection of path arguments.
			 */
			pathArgs = path.split("/"),
			
			/**
			 *	Flag to determine if the next path argument should be consumed.
			 */
			extractNextArgument = false,
			
			/**
			 *	The argument key for the next extracted argument.
			 */
			argumentKey;
			
		//	Remove slash pieces.
		pathArgs.pop();
		pathArgs.shift();
		
		$.each(route_boolean_variables, function (route, key) {
			var position = $.inArray(key, pathArgs),
			
				exists = position !== -1;
			
			routeParameters[route] = exists; 
			
			if (exists &&
					$.inArray(route, route_map) === -1) {
				pathArgs[position] = null;
			}
		});
		
		$.each(pathArgs, function (index, route) {
			if (route === null) {
				return;
			}
		
			if (extractNextArgument) {
				routeParameters[argumentKey] = route;
				extractNextArgument = false;
				argumentKey = undefined;
				return;
			} else if (route_variables[route] !== undefined) {
				argumentKey = route_variables[route];
				extractNextArgument = true;
				
				if ($.inArray(route, route_map) === -1) {
					return;
				}
			}
			
			routed.push(route);
		});
		
		routedPath = routed;
		explicitRoute = correctPath(routed.join("/"));
		
		return explicitRoute;
	}
	
	/**
	 *	Whenever the map is generated and firstChildAutomation is enabled, show the first
	 *	valid identifiers until no more stacks remain.
	 *
	 *	@return	False if automation closed non-standardly (consumed 404).
	 */
	function processAutomation() {
		if (mapGenerated && firstChildAutomation) {
			firstChildAutomation = false;
			
			$('#koi-deeplink-root').showDeeplinkChild();
			
			ignoreProcessing = true;

			_.set('/' + currentPath.join('/') + '/', undefined, true);
			_.recover(currentPath.join('/'), {});
			
			ignoreProcessing = false;
		} else if (mapGenerated && currentPath) {
			var path = correctRoute(correctPath([].concat(currentPath).join("/"))).split("/");
			
			//	Handle the trailing and leading slashes
			path.shift();
			path.pop();
			
			if ($('#koi-deeplink-root').showDeeplinkChild(path) === false) {
				return false;
			}
		}
	}
	
	/**
	 *	Activate components in the current child.
	 */
	function activateCurrentComponents() {
		currentChild.children('.koi-component')
			.removeClass('deeplink-component-disabled')
			.trigger('load-component');
	}
	
	/**
	 *	Notify external plugins that the path has been set.
	 */
	function triggerPathSet() {
		if (is_forwarding) {
			is_forwarding = false;
			
			if (use_history) {
				$.address.history(true);
			}
		}
			
		if (routingError) {
			return false;
		}
		
		_.trigger("path-set", [routedPath, _.parameters(), _.routeParameters()]);

		_.trigger("path-set-" + explicitRoute, [_.parameters(), _.routeParameters()]);
		
		$.each(routedPath, function (index, route) {
			_.trigger("route-set-" + route, [_.parameters(), _.routeParameters()]);
		});
	}
	
	/**
	 *	Generates a deeplinking map from the HTML snippets in the deeplinking container.
	 */
	function generateMap() {
		$('#koi-deeplink-root').extractDeeplinkIdentifiers();

		var initializing = true;

		mapGenerated = true;
		
		$.address.history(use_history);

		$.address.init(function (event) {
			$.address.change(function (event) {
				if (!initializing) {
					_.recover(event.value, event.parameters);
				}
			});
	
			if ($.address.value() === '/') {
				if (enableFirstChildAutomation) {
					firstChildAutomation = true;
					processAutomation();
				}
				
				triggerPathSet();
			} else {
				_.recover(event.value, event.parameters);
			}
			
			initializing = false;
		});
	}
	
	/**
	 *	Set the current title.
	 *
	 *	@param titleOverride	The title to set. If undefined, will use current children.
	 */
	function setCurrentTitle(titleOverride) {
		var title = [_.baseTitle];
		
		if (titleOverride !== undefined) {
			if (!$.isArray(titleOverride)) {
				titleOverride = [titleOverride];
			}
		
			title = title.concat(titleOverride).reverse();
		} else {
			currentChild.parentsUntil('#koi-deeplink-root').each(function () {
				if ($(this).children('.koi-deeplink-title').length) {
					title.unshift($(this).children('.koi-deeplink-title').text());
				}
			});
			
			if (currentChild.children('.koi-deeplink-title').length) {
				title.unshift(currentChild.children('.koi-deeplink-title').text());
			}		
		}
		
		//	Filter the title
		title = $.map(title, function (item) {
			if (item === undefined ||
					item === null ||
					$.trim(item).length === 0) {
				return null;
			}
			
			return item;
		});
				
		document.title = title.join(_.titleSeparator);
	}
	
	/**
	 *	Sets the current child.
	 *
	 *	@param child			The child to set as the current visible.
	 *
	 *	@param change_loading	Flag to determine if loading should be activated. Default true.
	 */
	function setCurrentChild(child, change_loading) {	 
		child.show();

		if (child.attr('id') !== 'koi-deeplink-root') {
			currentChild = child.addClass('koi-deeplink-active-child');
			activateCurrentComponents();
			
			if (change_loading ||
					change_loading === undefined) {
				_.loading(true);
			}

			if ($('.koi-deeplink-title', currentChild).length) {
				setCurrentTitle();
			}
		}
	}

	//------------------------------
	//
	//	Plugin Definition
	//
	//------------------------------
	
	_.build({
	
		//------------------------------
		//  Internal Properties
		//------------------------------
	
		/**
		 *	Disable autoready from configuration.
		 */
		__disableAutoReady: !config("autoready", true),
	
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
		path: function () {
			return currentPath;
		},
		
		/**
		 *	The explicit path.
		 *
		 *	@return	The explicit path.
		 */
		explicitPath: function () {
			return explicitPath;
		},
		
		/**
		 *	Returns the current route.
		 *
		 *	@param Array containing route elements.
		 */
		route: function () {
			return routedPath;
		},
		
		/**
		 *	The explicit route.
		 *
		 *	@return	The explicit route.
		 */
		explicitRoute: function () {
			return explicitRoute;
		},

		/**
		 *	Returns the current parameters of the path.
		 *
		 *	@return Object containing the parameters.
		 */
		parameters: function () {
			return currentParameters;
		},
		
		/**
		 *	Returns the route parameters.
		 *
		 *	@return Object containing named route parameters.
		 */
		routeParameters: function () {
			return routeParameters;
		},

		/**
		 *	Extend the current parameters.
		 *
		 *	@param params	The parameters to add to the current parameters.
		 *
		 *	@return The new parameters.
		 */
		extendParameters: function (params) {
			return $.extend({}, currentParameters, params);
		},
	
		/**
		 *	Set the current deeplinking path.
		 *
		 *	@param path			The base deeplinking path being set.
		 *
		 *	@param parameters	Optional parameters to set along with the path.
		 *
		 *	@param forward		Forward the change (make no history entry).
		 */
		set: function (path, parameters, forward) {
			if (!$.isEmptyObject(parameters) || !$.isEmptyObject(currentParameters)) {
				path += '?' + $.param(parameters || currentParameters);
			}
			
			if (Boolean(forward)) {
				is_forwarding = true;
				
				if (use_history) {
					$.address.history(false);
				}
			}

			if (path === explicitPath) {
				_.recover($.address.path(), $.param($.address.queryString()));
			} else {
				$.address.value(path);
			}
		},
		
		/**
		 *	Recover the provided path and parameters.
		 *
		 *	@param path			The base deeplinking path being recovered.
		 *
		 *	@param parameters	Optional parameters to read along with the path.
		 */
		recover: function (path, parameters) {
			routingError = false;
			routeParameters = {};
			path = correctPath(path);
			
			var process = true;
			
			if (!ignoreProcessing) {
				$(SELECTOR_ALL).hide();
				$('.koi-deeplink-active-child').removeClass('koi-deeplink-active-child');
				
				explicitPath = path;
				currentParameters = parameters;
 
				//	In the case we simply get a path element, load the first element in the container.
				if (path === '/') {
					currentPath = [];
					if (enableFirstChildAutomation) {
						firstChildAutomation = true;
						if (processAutomation() === false) {
							process = false;
						}
					}
				} else {
					//	Split the path fragments into an array.
					path = path.split('/');
					
					//	Removing the forward and ending slashes
					path.shift();
					path.pop();
					
					//	Set the current path
					currentPath = path;

					//	Process the deeplinking automation
					if (processAutomation() === false) {
						process = false;
					}
				}
				
				if (process) {
					triggerPathSet();
				}
			}
			
			correctRoute(correctPath([].concat(currentPath).join("/"))).split("/");
			
			if (correctPath(currentPath.join('/')) !== explicitPath) {
				ignoreProcessing = true;

				if (currentPath.length === 0) {
					explicitPath = "/";
				} else {
					explicitPath = correctPath(currentPath.join('/'));
				}

				triggerPathSet();
				
				_.set(explicitPath, currentParameters, true);
				
				ignoreProcessing = false;
			} else if (ignoreProcessing) {
				triggerPathSet();
			}
		},
		
		/**
		 *	Add a route proxy.
		 *
		 *	@param route	The explicit route.
		 *
		 *	@param title	The title of the route.
		 */
		addRouteProxy: function (route, title) {
			route_proxies[correctPath(route)] = title;
		},
		
		/**
		 *	Add a route map.
		 *
		 *	@param map	An array of items to add. Can be a single item as a string.
		 */
		addRouteMap: function (map) {
			if (!$.isArray(map)) {
				map = [map];
			}
			
			route_map = route_map.concat(map);
		},
		
		/**
		 *	Add a route variable.
		 *
		 *	@param variable	The route variable to add.
		 *
		 *	@param key		The key to identify this variable.
		 */
		addRouteVariable: function (variable, key) {
			route_variables[variable] = key;
		},
		
		/**
		 *	Add a route boolean variable.
		 *
		 *	@param variable	The route boolean variable to add.
		 *
		 *	@param key		The key to identify this variable.
		 */
		addRouteBoolean: function (variable, key) {
			route_boolean_variables[variable] = key;
		},
		
		/**
		 *	Register a listener to be notified when the provided explicit path is routed to.
		 *
		 *	@param path		The explicit path.
		 *
		 *	@param listener The listener to notify.
		 */
		registerPathHandler: function (path, listener) {
			path = correctPath(path);
			
				/**
				 *	Create a namespace incase we need to auto trigger the event.
				 */
			var namespace = (new Date()).valueOf(),
			
				/**
				 *	The event to bind against.
				 */
				event = "path-set-" + path + "." + namespace;
			
			_.bind(event, listener);
			
			if (_.isReady && explicitRoute === path) {
				_.trigger(event, [_.parameters(), _.routeParameters()]);
			}
		},
		
		/**
		 *	Register a listener to be notified when a piece of the URL matches the route.
		 *
		 *	@param route	The route.
		 *
		 *	@param listener The listener to notify.
		 */
		registerRouteHandler: function (route, listener) {
				/**
				 *	Create a namespace incase we need to auto trigger the event.
				 */
			var namespace = (new Date()).valueOf(),
			
				/**
				 *	The event to bind against.
				 */
				event = "route-set-" + route + "." + namespace;
			
			_.bind(event, listener);
			
			if (_.isReady && $.inArray(route, routedPath) !== -1) {
				_.trigger(event, [_.parameters(), _.routeParameters()]);
			}
		},
		
		/**
		 *	Register a handler for all path changes.
		 *
		 *	@param listener	The listener function.
		 */
		registerHandler: function (listener) {
				/**
				 *	Namespace the event for dispatching.
				 */
			var event = "path-set." + (new Date()).valueOf();

			_.bind(event, listener);
			
			if (_.isReady) {
				_.trigger(event, [routedPath, _.parameters(), _.routeParameters()]);
			}
		},
		
		/**
		 *	Register a handler for routing errors.
		 *
		 *	@param listener	The listener function.
		 */
		routingError: function (listener) {
			/**
				 *	Namespace the event for dispatching.
				 */
			var event = "routing-error." + (new Date()).valueOf();
			
			_.bind(event, listener);
			
			if (_.isReady && routingError) {
				_.trigger(event);
			}
		},
		
		/**
		 *	Raise a 404 page exception.
		 *
		 *	@param proxyOverride	Flag to determine if the proxy can override this 404 page request.
		 *
		 *	@param systemError		Flag to determine if the system is generating this error.
		 *
		 *	@return False if the 404 was consumed by a proxy.
		 */
		raise404: function (proxyOverride, systemError) {
			if (proxyOverride) {
				var proxyRoute = route_proxies[explicitRoute];
			
				if (proxyRoute !== undefined) {
					triggerPathSet();
					setCurrentTitle(proxyRoute);
					return false;
				}
			}
			
			routingError = false;
			
			if (_.isReady && systemError) {
				routingError = true;
				_.trigger("routing-error");
			}
			
			$(SELECTOR_ALL).hide();
			$('.koi-deeplink-active-child').removeClass('koi-deeplink-active-child');
			setCurrentChild($('.koi-deeplink-error'), false);
			_.loaded();
		},
		
		/**
		 *	Set the current page title.
		 *
		 *	@param title	A string or array of strings representing a page title.
		 */
		title: function (title) {
			setCurrentTitle(title);
		},
		
		/**
		 *	Set the loading state of the container.
		 *
		 *	@param isLoading	True if loading has started, false if it has ended. Default true.
		 */
		loading: function (isLoading) {
			if (isLoading ||
					isLoading === undefined) {
				window.scrollTo(0, 0);
				loading_screen.show();
				$(".koi-deeplink-state-element, .koi-deeplink-active-child").hide();
				_.trigger("loading");
			} else {
				loading_screen.hide();
				$(".koi-deeplink-active-child").show();
				_.trigger("loaded");
			}
		},
		
		/**
		 *	Alias for simple load handling from components.
		 */
		loaded: function () {
			_.loading(false);
		},
		
		/**
		 *	Update the current path.
		 *
		 *	@param	path_parameters		An object containing updated path parameters.
		 *
		 *	@param	route_parameters	An object containing updated route parameters.
		 *
		 *	@param	appendations		An array of path arguments to append to the updated route.
		 */
		update: function (path_parameters, route_parameters, appendations) {
			var new_parameters = $.extend({}, routeParameters, route_parameters),
			
				new_path_parameters = $.extend({}, currentParameters, path_parameters),
			
				new_path = [],
				
				next_path_value;
			
			$.each(currentPath, function (index, key) {
				if (next_path_value !== undefined) {
					if (isValid(next_path_value)) {
						new_path.push(next_path_value);
					}
					
					next_path_value = undefined;
				} else if (key in route_variables) {
					if (isValid(new_parameters[route_variables[key]])) {
						new_path.push(key);
						next_path_value = new_parameters[route_variables[key]];
					} else {
						next_path_value = null;
					}
				} else if (key in route_boolean_variables) {
					if (new_parameters[route_variables[key]]) {
						new_path.push(key);
					}
				} else {
					new_path.push(key);
				}
			});
			
			if ($.isArray(appendations)) {
				new_path = new_path.concat(appendations);
			}
		
			KOI.deeplink.set("/" + new_path.join("/") + "/", new_path_parameters, true);
		}
	});
	
	//------------------------------
	//
	//	 jQuery Extension
	//
	//------------------------------
	
	/**
	 *	Generate a deeplinking map from the given root.
	 */
	$.extend($.fn, {
	
		//------------------------------
		//	Methods
		//------------------------------
		
		/**
		 *	Extract the deeplinking identifier for the first element in the jQuery result.
		 *
		 *	@return For the root, an object indexed by the non-prefixed deeplinking identifier, which contains the relevant element.
		 */
		extractDeeplinkIdentifiers: function () {	
			var response = {};
			
			if (this.attr('id') === 'koi-deeplink-root') {
				this.data('koi-deeplink-map', this.children(SELECTOR_ALL).extractDeeplinkIdentifiers());
				return this.data('koi-deeplink-map');
			} else {
				this.each(function () {
					var element = $(this),
						classes = element.attr('class').split(RX_SPLIT),
						identifier;
						
					$.each(classes, function () {
						if (this.match(RX_IDENTIFIER) === null) {
							return;
						} else {
							identifier = this.replace(RX_IDENTIFIER, '');
						
							if (!element.hasClass('koi-deeplink-error')) {
								response[identifier] = element;
							} 
							
							element.data('koi-deeplink-identifier', identifier);
						
							if (element.hasClass('koi-deeplink-item-stack') || element.hasClass('koi-deeplink-stack')) {
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
		showDeeplinkChild: function (identifier) {
			if (ignoreProcessing) {
				return this;
			}
			
			if (this.data('koi-deeplink-map') !== undefined) {
				if (identifier === false) {
					return this;
				} else if (identifier === undefined && 
						!this.hasClass('koi-deeplink-stop-automation')) {
					$.each(this.data('koi-deeplink-map'), function (path) {
						currentPath.push(path);
					
						setCurrentChild(this);
						
						currentChild.showDeeplinkChild();
						
						return false;
					});
					
					return this;
				} else if (KOI.typecheck(identifier, 'Array') && 
						identifier.length > 0) {
					var fragment = identifier.shift(),
						target = this.data('koi-deeplink-map')[fragment];

					if (target) {
						setCurrentChild(target);
						
						target.showDeeplinkChild(identifier.length ? identifier : (firstChildAutomation ? undefined : false));
						
						return this;
					}
				}
			}
			
			//	If we make it to this point with an identifier, and we have an error handler, utilize it.
			if ($('.koi-deeplink-error').length > 0 && 
					identifier !== undefined &&
					identifier !== false) {
				if (!_.raise404(true, true)) {
					return false;
				}
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
	//	 Destory config
	//------------------------------
	
	config();
	
	//------------------------------
	//	 Setup
	//------------------------------
	
	$(function () {
		_.baseTitle = document.title;
		
		loading_screen = $("#koi-deeplink-loading");

		$(".koi-deeplink-item-stack, .koi-deeplink-item")
			.children(".koi-component").addClass("deeplink-component-disabled");
	});
	
	_.ready(function () {
		generateMap();
	});
	
	//------------------------------
	//	 Extend component
	//------------------------------
	
	if (KOI.component === undefined) {
		KOI.bind("platform-initialized", function () {
			if (KOI.component !== undefined) {
				KOI.component.disabledClasses.push("deeplink-component-disabled");
			}
		});
	} else {
		KOI.component.disabledClasses.push("deeplink-component-disabled");
	}
	
}(jQuery));
