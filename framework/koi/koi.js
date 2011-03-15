/**
 *	Framework - Koi
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

/*global Typekit, Exception, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: false, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) {

	"use strict";
	
	//------------------------------
	//
	//	Constants
	//
	//------------------------------
	
		/**
		 *	Regular Expression to parse flags out of a text set.
		 */
	var RX_TMPL_FLAGS = /([a-z0-9_]+)\b/gi,
		
		/**
		 *	Regular expression to match against templating text.
		 */
		RX_TMPL = /tpl\-/,
		
		/**
		 *	Regular expression to match against localization text.
		 */
		RX_LOCALIZATION = /loc\-/,
		
		/**
		 *	Regular expression to test a string for flags.
		 */
		RX_TMPL_HAS_FLAGS = /\-\-/,
		
		/**
		 *	Regular expression to detect replicant override declarations.
		 */
		RX_REPLICANT_DECLARATION = /replicant\-selector\-/,
		
		/**
		 *	Digit selector.
		 */
		RX_DIGIT = /\d+/,
		
		/**
		 *	Path for loading typekit.
		 */
		TYPEKIT_PATH = "https://use.typekit.com/",
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	Create the KOI framework.
		 */
		_ = {},
		
		/**
		 *	The event delegate.
		 */
		delegate = $(_),
		
		/**
		 *	An array of all the plugins added to koi.
		 */
		plugins = [],
		
		/**
		 *	The configurations for this application.
		 */
		configurations = $.extend(true, {}, window.__SDK, window.__CONFIG),
		
		/**
		 *	Application configuration.
		 */
		application,
		
		/**
		 *	Localization configuration.
		 */
		localization_config,
		
		/**
		 *	A collection of replicant elements.
		 *
		 *	Signature:
		 *	{
		 *		<replicantName>: <jQueryElement>,
		 *
		 *		...
		 *	}
		 */
		replicants = {};

	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------
	
	/**
	 *	Define a configuration object which we can instanciate to clear out properties from the original array,
	 *	provide them for the closure, and then provide a method to destroy the instanciation.
	 *
	 *	@param namespace	The namespace for the configurations to pull.
	 */
	function Configuration(namespace) {
		this.values = $.extend({}, configurations[namespace]);
			
		delete configurations[namespace];
		
		/**
		 *	Get a property.
		 *
		 *	@param property The property to retrieve.
		 *
		 *	@param value	The default value to use, should no setting be provided.
		 */
		this.get = function (property, value) {
			if (this.values[property] === undefined) {
				this.values[property] = value;
			}
	
			return this.values[property];
		};
	}
	
	/**
	 *	Get a configuration by it's namespace. This is a proxy function, which exists for scoping the internal lamda function.
	 *
	 *	@param namespace	The namespace to fetch configurations for.
	 */
	function getConfiguration(namespace) {
		var reference = new Configuration(namespace);

		/**
		 *	Returns a lamda function which can retrieve properties, set default values, and destroy itself
		 *	onces it's finished being used. To destroy a configuration object, simply call config().
		 */
		return function (property, value) {
			if (property !== undefined) {
				return reference.get(property, value);
			} else {
				reference = undefined;
			}
		};
	}

	/**
	 *	Extract the replicant reference from an element.
	 *
	 *	@param element	The element to fetch a replicant for.
	 *
	 *	@return	The replicant identifier, or null if not-applicable.
	 */
	function extractReplicant(element) {
		if (element.hasClass("replicant-container")) {
			var replicant = element.data("replicant-selector") || null;
			
			if (replicant === null) {
				$.each(element.attr("className").split(" "), function (index, className) {
					if (className.match(RX_REPLICANT_DECLARATION) !== null) {
						replicant = className.replace(RX_REPLICANT_DECLARATION, "");
						return false;
					}
				});
			}
			
			return replicant;
		}
		
		return null;
	}
	
	/**
	 *	Handle any exceptions in the system by passing them through the error handling
	 *	system in koi.
	 *
	 *	@param exception	The exception object thrown.
	 */
	function processException(exception) {
		var exit = false;
	
		$.each(_.errorHandlers, function (index, metrics) {
				/**
				 *	Flag to determine if this handler can consume the error.
				 */
			var canHandle = false,
			
				/**
				 *	Flag to determine if the handler consumed the error.
				 */
				consumed;
		
			if (metrics.instance !== undefined) {
				if (exception instanceof metrics.instance) {
					canHandle = true;
				}
			}
			
			if (!canHandle && metrics.properties !== undefined) {
				$.each(metrics.properties, function (key, value) {
					if (exception[key] === undefined && value === undefined) {
						canHandle = true;
						return false;
					} else if (exception[key] !== undefined) {
						if (_.typecheck(value, "RegExp")) {
							if (value.test(exception[key])) {
								canHandle = true;
								return false;
							}
						} else if (value === exception[key]) {
							canHandle = true;
							return false;
						}
					}
				});
			}
			
			if (canHandle) {
				consumed = metrics.handler(exception);
				
				if (consumed === true) {
					exit = true;
					return false;
				} else if (consumed === false) {
					return false;
				}
			}
		});
		
		/**
		 *	If we reach this point in processing, rethrow the excpetion, as the
		 *	framework did not handle it.
		 */
		if (!exit) {
			throw exception;
		}
	}
	
	/**
	 *	A generic function to consume exceptions.
	 */
	function exceptionConsumer() {
		try {
			this.original.apply(this.scope, arguments);
		} catch (e) {
			processException(e);
		}
	}
	
	//------------------------------
	//
	//	 Configuration
	//
	//------------------------------
		
	//	Fetch application configuration.
	application = getConfiguration('application');
	
	//	Store localization configuration
	localization_config = application("localization", null);

	//	Clear the config object out of the window namespace.
	window.__CONFIG = undefined;
	window.__SDK = undefined;
	
	//------------------------------
	//
	//	Framework Definition
	//
	//------------------------------
	
	$.extend(_, {
		//------------------------------
		//	Properties
		//------------------------------
		
		/**
		 *	Application settings.
		 */
		settings: application('configuration', {}),
		
		/**
		 *	Application pathing.
		 */
		pathing: application('pathing', {}),
		
		/**
		 *	Application metadata.
		 */
		metadata: application('metadata', {}),
		
		/**
		 *	System Modules
		 */
		module: {},
		
		/**
		 *	Check if we're in release mode.
		 */
		development: !configurations.__release__,
		
		/**
		 *	If the framework has dispatched its ready event.
		 */
		isReady: false,
		
		/**
		 *	If the platform has initialized.
		 */
		initialized: false,
		
		/**
		 *	Flag to test if the application has readied.
		 */
		applicationReady: false,
		
		/**
		 *	Localization document.
		 */
		localization: {},
		
		/**
		 *	Automatically ready the application on framework ready.
		 */
		autoReadyApplication: application('autoReadyApplication', true),
		
		/**
		 *	Because multiple plugins may wish to prevent the framework from readying and starting the application
		 *	until their operational dependencies are met, the ready queue allows for any plugin or extension to
		 *	prevent framework ready until it has readied.
		 *
		 *	Signature:
		 *	{
		 *		<nameOfQueueEntry>: [true|false],
		 *
		 *		...
		 *	}
		 */
		readyQueue: $.extend(application('readyQueue', {}), {
			/**
			 *	Require the document ready before we ready the framework.
			 */
			documentReady: false,
			
			/**
			 *	Require the framework be initialized.
			 */
			initialized: false
		}),
		
		/**
		 *	A collection of error handlers for catching uncaught events.
		 *
		 *	Signature:
		 *	[
		 *		{
		 *			instance: <ClassForInstanceofCheck>,
		 *
		 *			properties:
		 *			{
		 *				<propertyName>: <stringToMatch|RegexToMatch>,
		 *
		 *				...
		 *			},
		 *
		 *			handler: <handler>
		 *		},
		 *
		 *		...
		 *	]
		 */
		errorHandlers: [],
		
		//------------------------------
		//	Methods
		//------------------------------
		
		/**
		 *	Bind an error handler.
		 *
		 *	@param handler		A handler to process the error. Return:
		 *							* true to consume the error,
		 *							* false to redispatch the error
		 *							* nothing to ignore.
		 *
		 *	@param type			A type to match on. (ex. Exception)
		 *
		 *	@param properties	A collection of properties to match on.
		 *
		 *	handler Signature:
		 *		function(exception);
		 *
		 *	properties Signature:
		 *	{
		 *		<propertyName>: <string|regex>,
		 *
		 *		...
		 *	}
		 */
		handleError: function (handler, type, properties) {
			if (!_.typecheck(handler, "Function")) {
				throw new Exception("KOI", "handleError", "handler", typeof handler, "Must be a function");
			}
		
			_.errorHandlers.push({
				instance: type,
				
				properties: properties,
				
				handler: handler
			});
		},
		
		/**
		 *	Raise an exception into the handler for special error cases.
		 *
		 *	@param exception	The exception to raise.
		 */
		raise: function (exception) {
			processException(exception);
		},
		
		/**
		 *	Gets a configuration object for the requested namespace.
		 *
		 *	@param namespace	The namespace of configuration settings to fetch.
		 *
		 *	@return The plugin configuration for the provided namespace.
		 */
		configuration: function (namespace) {
			return getConfiguration(namespace);
		},
		
		/**
		 *	Create an element replicant; a simple template which can be created and injected
		 *	into a parent content area.
		 *
		 *	This is utilized to manufacture or update replicants using the KOI.template() method.
		 *	If a template instance is updated, it is displayed. If an instance is updated which doesn't
		 *	exist and a replicant parent exists as the "selector", a new instance will be replicated.
		 *
		 *	@param name		The name of the replicant, for disambiguation.
		 *
		 *	@param content	The HTML content which acts as the replicant element.
		 *
		 *	@param parent	The container for the content.
		 */
		createReplicant: function (name, content, parent) {
			parent = $(parent);
			
			if (parent.hasClass("replicant-container")) {
				return;
			}
			
			parent
				.addClass("replicant-container")
				.data("replicant-selector", name);
				
			_.storeReplicant(name, content);
		},
		
		/**
		 *	Store a replicant name for nested replication.
		 *
		 *	@param name		The name of the replicant.
		 *
		 *	@param content	The content to store.
		 */
		storeReplicant: function (name, content) {
			if (replicants[name] === undefined) {
				content = $(content);
				
				var replicant = content.filter(".replicant-target");

				if (replicant.length === 0) {
					replicant = content.addClass("replicant-target");
				}
				
				replicant.addClass("replicant-" + name);
				
				replicants[name] = content;
			}
		},
		
		/**
		 *	Conceal all the replicants. Optionally, scoped by a parent selector.
		 *
		 *	@param names	The name(s) of the replicants to conceal.
		 *
		 *	@param selector	The selector to filter the replicants.
		 */
		hideReplicants: function (names, selector) {
			if (!$.isArray(names)) {
				names = [names];
			}
		
			$.each(names, function (index, name) {
				$(".replicant-" + name, selector).hide();
			});
		},
		
		/**
		 *	Update elements based on classes in the HTML. The general syntax should
		 *	follow:
		 *		tpl-<key_name>[--<flags>]
		 *
		 *	This will call .html() on the element and inject the "value_content" from
		 *	the provided object for a matching key.
		 *
		 *	Classes can also provide conversion flags using:
		 *		--ut25
		 *	at the end of the general syntax
		 *
		 *	Possible flags:
		 *		a:			Attributes
		 *		y:			Styles
		 *		u:			Uppercase
		 *		l:			Lowercase
		 *		t<size>:	Truncate to size
		 *		d:			Toggle display
		 *		c:			Add class
		 *		s:			Storage
		 *		u_first:	Uppercase First
		 *
		 *	@param object	The object to set text against.
		 *
		 *	@param selector	An optional selector, to select template classes inside of a
		 *					given object container.
		 *
		 *	@param instance	An identifier to further filter the selector.
		 *
		 *	@param prefix	Switches the prefix used to target elements.
		 *
		 *	@param regexp	Regex to test prefix.
		 *
		 *	@return The context of the element which was updated.
		 *
		 *	object Signature:
		 *	{
		 *		key_name: value_content,
		 *
		 *		...
		 *	}
		 *
		 *	Example selector provider:
		 *		({my_target: "value"}, ".some-class")
		 *		- Will update all instances of <key_name> within the context of a ".some-class" element.
		 *
		 *	Example selector/instance provider:
		 *		({my_target: "value"}, ".some-class", 1)
		 *		- Will update all instances of <key_name> within the second matched "some-class" element.
		 */
		template: function (object, selector, instance, prefix, regexp) {
			prefix = prefix || "tpl";
			regexp = regexp || RX_TMPL;
		
				/**
				 *	The context for scoping the update.
				 */
			var context,
			
				/**
				 *	A replicant reference, if applicable to the update.
				 */
				replicant,
				
				/**
				 *	The replicant selector.
				 */
				replicantSelector,
				
				/**
				 *	Key for producing new replicants.
				 */
				index = 0,
				
				/**
				 *	The target for updating
				 */
				target;
			
			if (selector !== undefined) {
				context = $(selector);
			}
			
			if (instance !== undefined && context !== undefined) {
				if (context.hasClass("replicant-container")) {
					replicantSelector = extractReplicant(context);
					replicant = $(".replicant-" + replicantSelector, context);
					
					//	Increment the instance to simply the logic for checking replicant instances
					instance += 1;
					
					if (replicant.length < instance) {
						for (; index < instance - replicant.length; index++) {
							replicants[replicantSelector].clone().appendTo(context).hide().addClass("replicant-instance-" + (index + replicant.length));
						}
					}
					
					//	Decrement the instance to properly identify the target.
					instance -= 1;
					
					$(".replicant-instance-" + instance, context).show();
					context = $(".replicant-" + replicantSelector + ".replicant-instance-" + instance, context);
				} else {
					context = context.eq(instance);
				}
			}

			$.each(object, function (key, value) {
				var class_target = "[class*='" + prefix + "-" + key + "']";
				
				target = $(class_target, context);

				if (isValid(context)) {
					if (context.length == 1 && context.has(class_target)) {
						target = target.add(context);
					} else {
						target = target.add(context.find(class_target));
					}
				}

				target.each(function () {
						/**
						 *	This element.
						 */
					var element = $(this),
					
						/**
						 *	Flag to determine if the value should be set.
						 */
						setValue = true;
					
					$.each(element.attr("class").split(" "), function (index, className) {
						if (className.replace(prefix + "-", "").split("-")[0] !== key) {
							return;
						}
						
							/**
							 *	The set flags for the element.
							 */
						var flags;
					
						if (className.match(regexp) === null) {
							return;
						}
						
						if (className.match(RX_TMPL_HAS_FLAGS) !== null) {
							flags = className.split("--")[1].match(RX_TMPL_FLAGS);
						}
						
						if (flags !== undefined) {
							$.each(flags, function (index, rawFlag) {
									/**
									 *	Grab the flag.
									 */
								var flag = rawFlag.replace(RX_DIGIT, ""),
								
									/**
									 *	Compute a size argument.
									 */
									size = rawFlag.match(RX_DIGIT);
									
								if (size !== null) {
									size = parseInt(size[0], 10);
								}
									
								switch (flag) {
								
								case "a":
									element.attr(value);
									setValue = false;
									return false;
								
								case "y":
									element.css(value);
									setValue = false;
									return false;
									
								case "s":
									element.data(key, value);
									setValue = false;
									return false;
									
								case "u_first":
									value = value.toLowerCase();
									value = value.substr(0, 1).toUpperCase() + value.substr(1);
									break;
								
								case "u":
									value = value.toUpperCase();
									break;
									
								case "l":
									value = value.toLowerCase();
									break;
									
								case "c":
									if (element.data("tpl-added-class-" + key)) {
										element.removeClass(element.data("tpl-added-class-" + key));
										element.removeData("tpl-added-class-" + key);
									}
									
									if (value !== undefined && value !== null) {
										element.data("tpl-added-class-" + key, value);
										element.addClass(value);
									}
									setValue = false;
									return false;
									
								case "t":
									if (!isNaN(size) && value.length > size) {
										value = value.substr(0, size) + "&hellip;";
									}
									break;
									
								case "d":
									if (value === true) {
										element.show();
									} else {
										element.hide();
									}
									setValue = false;
									return false;
		
								}
							});
						}
						
						if (setValue) {
							element.html(value);
						}
					});
				});
			});
			
			return context === undefined ? window.document : context;
		},
		
		/**
		 *	Use the localization object to localize the application.
		 *
		 *	@param keys		A key (or array of keys) to traverse into the localization document.
		 *
		 *	@param context	The html scope to work from. Default is document.
		 */
		localize: function (keys, context) {
			if ($.isEmptyObject(_.localization)) {
				throw new Exception("KOI", "localize", "KOI.localization", "undefined", "No localization document loaded");
			}
		
				/**
				 *	The localization document fragment.
				 */
			var localization = {},
			
				/**
				 *	The scope into the localization document.
				 */
				scope = _.localization,
				
				/**
				 *	The chain of keys
				 */
				chain = ["KOI", "localization"];
		
			/**
			 *	Scope into the document if keys are provided.
			 */
			if (keys !== undefined) {
				if (!$.isArray(keys)) {
					keys = [keys];
				}
				
				$.each(keys, function (index, key) {
					chain.push(key);
					
					if (scope[key] === undefined) {
						throw new Exception("KOI", "localize", "scope", chain.join("."), "Scope not defined in localization document");
					}
					
					scope = scope[key];
				});
			}
			
			/**
			 *	Generate the localization fragment.
			 */
			$.each(scope, function (name, value) {
				localization[name] = value;
			});
			
			_.template(localization, context, undefined, "loc", RX_LOCALIZATION);
		},
		
		/**
		 *	Create a stylesheet.
		 *
		 *	@param styles	An array of strings, each representing a CSS class.
		 *
		 *	@param context	The context of the inject. Defaults to head.
		 *
		 *	@return	self
		 */
		createStylesheet: function (styles, context) {
			styles = _.typecheck(styles, "Array") ? styles : [styles];
			
			(context || $("head")).append('<style type="text/css">' + styles.join('') + '</style>');
			
			return _;
		},
		
		/**
		 *	Given the name of a meta tag directive, return its value.
		 *
		 *	@param name		The name of the meta tag.
		 *
		 *	@param value	If the provided meta tag does not exist, set it. Otherwise, has no function.
		 *
		 *	@return The value of the meta tag.
		 */
		meta: function (name, value) {
			if (value !== undefined) {
				_.metadata[name] = value;
				
				return value;
			}
		
			if (_.metadata[name] === undefined) {
				_.metadata[name] = $('meta[name="' + name + '"]').attr('content') || null;
			}
			
			return _.metadata[name];
		},
		
		/**
		 *	Hook a function with an intercepting method.
		 *
		 *	@param original The original method being hooked by an interceptor.
		 *
		 *	@param hook		The function which will intercept the method call.
		 *
		 *	@return The hook proxy.
		 */
		hook: function (original, hook) {
			return (function (original, hook) {
				return function () {
					return hook.apply({scope: this, original: original}, arguments);
				};
			}(original, hook));
		},
		
		/**
		 *	Invert an object, swapping it's keys with its values. This should only be used
		 *	with simple objects, the values of which do not overlap.
		 *
		 *	@param object	The object to swap.
		 */
		invertObject: function (object) {
			var buffer = {};
		
			if (object === undefined) {
				throw new Exception("KOI", "invertObject", "object", "undefined", "Must be an object");
			}
		
			$.each(object, function (key, value) {
				buffer[value] = key;
			});
			
			return buffer;
		},
		
		/**
		 *	Perform an extends from check on a non-instanciated class object.
		 *
		 *	@param classObj	The class to check.
		 *
		 *	@param compare	The class to compare against.
		 */
		extendsFrom: function (classObj, compare) {
			return classObj.prototype instanceof compare || classObj.prototype === compare.prototype;
		},
		
		/**
		 *	Creates a plugin within the KOI namespace.
		 *
		 *	@param namespace	The namespace of the plugin.
		 *
		 *	@param PluginClass	A class which extends from the base plugin class.
		 *
		 *	@return The created plugin instance.
		 */
		plugin: function (namespace, PluginClass) {
			if (_[namespace] !== undefined) {
				throw new Exception("KOI", "plugin", "namespace", namespace, "Namespace collision");
			}
			
			if (PluginClass === undefined) {
				PluginClass = _.module.plugin;
			}
			
			if (!_.extendsFrom(PluginClass, _.module.plugin)) {
				throw new Exception("KOI", "plugin", "PluginClass", undefined, "Must extend from KOI.module.plugin");
			}
			
			var plugin = this[namespace] = new PluginClass(namespace);
			
			plugins.push(plugin);
			
			return plugin;
		},
		
		/**
		 *	Performs enhanced type comparison on an object. This is more reliable method
		 *	of type checking a variable than a simple typeof comparison. The reason is that,
		 *	typeof will reduce to the lowest common type. 
		 *
		 *	"typeof []" returns Object, and not Array.
		 *	"typeof {}" returns Object as well.
		 *
		 *	KOI.typecheck([], 'Array');		// true
		 *	KOI.typecheck([], 'Object');	// false
		 *
		 *	@param type		The variable type to check.
		 *
		 *	@param compare	A string representing the literal type to check.
		 *
		 *	@return True if the variable "type" matches the compare literal.
		 */
		typecheck: function (type, compare) {
			return !type ? false : !type.constructor ? false : type.constructor.toString().match(new RegExp(compare + '\\(\\)', 'i')) !== null;	 
		},
		
		/**
		 *	Bind an event. Passes all arguments to jQuery.bind
		 */
		bind: function () {
			delegate.bind.apply(delegate, arguments);
		},
		
		/**
		 *	Bind an event. Passes all arguments to jQuery.triggerHandler
		 */
		trigger: function () {
			delegate.triggerHandler.apply(delegate, arguments);
		},
		
		/**
		 *	If the provided listener is a valid function, it will be triggered with the provided context
		 *	and parameters.
		 *
		 *	@param type			The type of the event.
		 *
		 *	@param listener		The listener being triggered.
		 *	
		 *	@param context		The context to provide to the listener.
		 *
		 *	@param parameters	The parameters to pass to the listener as arguments.
		 *
		 *	@return The response of the notified listener.
		 */
		notify: function (type, listener, context, parameters) {
			if (_.typecheck(listener, 'Function')) {
				var event = $.Event(type);
				event.preventDefault();
				event.stopPropagation();
				
				parameters = _.typecheck(parameters, 'Array') ? parameters : [parameters];
				parameters.unshift(event);
				
				listener.apply(context || _, parameters);
			}
		},
		
		/**
		 *	Returns the current time.
		 *
		 *	@return Milliseconds since the epoch
		 */
		now: function () {
			return new Date().valueOf();
		},
		
		/**
		 *	Given the name of the URL Query String param, return it's value, or null.
		 *
		 *	@param name The name of the param to get.
		 *
		 *	@return The value of the param, or null.
		 */
		urlParam: function (name) {
			var match = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href.toString());
		
			return _.typecheck(match, 'Array') ? match[1] : null;
		},
		
		/**
		 *	Session based storage. Returns a value only once before removing it.
		 *
		 *	@param name		The name of the session data.
		 *
		 *	@param value	Optionally set the value.
		 *
		 *	@return The value of the session data, or null. Returns only if no value is passed.
		 */
		flash: function (name, value) {
			name = 'koi-flash-' + name;
		
			if (value !== undefined) {
				_.cookie(name, value, {path: '/'});
			} else {
				var response = _.cookie(name);
				
				//	Purge session storage
				_.cookie(name, null, {path: '/'});
				
				return response;
			}
		},
		
		/**
		 *	Allows the framework to interact with the browser cookies.
		 *
		 *	As a side note to developers who might be pulling their hair out and checking this function:
		 *		As of this version, Mac Chrome does not out-of-the-box support cookies on the file:/// protocol.
		 *		Any development done which requires cookies should not be locally tested on Chrome. 
		 *		Consider Safari for local development which requires cookies, as they are both built on Webkit and render pretty similaraly.
		 *
		 *	Originally written as the jQuery Cookie Plugin.
		 *
		 *	Copyright (c) 2006 Klaus Hartl (stilbuero.de)
		 *	Dual licensed under:
		 *		MIT: http://www.opensource.org/licenses/mit-license.php
		 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
		 *
		 *	@param name		The name of the cookie to get or set.
		 *	
		 *	@param value	The value of the cookie to set. To REMOVE a cookie, you can pass in "null" as the value.
		 *					You must EXPLICITLY pass in the "null" type, and cannot simply ommit the parameter or pass
		 *					in undefined. An undefined value (which is ommission) will treat this function as a getter
		 *					and not destroy the cookie.
		 *
		 *	@param options	An Object of options to set along with the cookie value. The full valid signature of options:
		 *					{
		 *						expires: <Number|Date>, An integer specifying the expiration date, in days, or a date object.
		 *												If null or ommitted, the cookie will be session only, and will not 
		 *												be retainted when the browser exits.
		 *					
		 *						path: <String>,			The value of the path attribute of the cookie.
		 *												default: The path of the page that created this cookie.
		 *
		 *						domain: <String>,		The value of the domain attribute of the cookie.
		 *												default: The domain of the page that created this cookie.
		 *						
		 *	
		 *						secure: <Boolean>		If true, the secure attribute of the cookie will be set, and the cookie
		 *												will require a secure protocol, such as HTTPS.
		 *												default: false
		 *					}
		 *
		 *	@return The value of the cookie, or null. Returns only if no value is passed.
		 */
		cookie: function (name, value, options) {
			var date,
				expires = '',
				path,
				domain,
				secure,
				cookieValue = null,
				index = 0,
				cookies,
				cookie;
			
			if (value !== undefined) {
			
				options = options || {};
				
				if (value === null) {
					value = '';
					options.expires = -1;
				}
	
				if (options.expires && (_.typecheck(options.expires, 'Number') || options.expires.toUTCString)) {
					if (_.typecheck(options.expires, 'Number')) {
						date = new Date();
						date.setTime(date.getTime() + (options.expires * 864e5));
					} else {
						date = options.expires;
					}
					
					expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
				}
		
				path = options.path ? '; path=' + (options.path) : '';
				domain = options.domain ? '; domain=' + (options.domain) : '';
				secure = options.secure ? '; secure' : '';
				document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
			} else {
				if (document.cookie && document.cookie !== '') {
					cookies = document.cookie.split(';');
					
					for (; index < cookies.length; index += 1) {
						cookie = $.trim(cookies[index]);
						
						// Does this cookie string begin with the name we want?
						if (cookie.substring(0, name.length + 1) === (name + '=')) {
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
						}
					}
				}
				
				return cookieValue;
			}
		},
		
		/**
		 *	Embed a typekit font.
		 *
		 *	@param kit_id	The ID of the kit to embed.
		 */
		embedTypekit: function (kit_id) {
			$.getScript(TYPEKIT_PATH + kit_id + ".js", function () {
				try {
					Typekit.load();
				} catch (e) {
					//	Noop
				}
			});
		},
		
		/**
		 *	Similar to the jQuery $(document).ready() method, only plugins can override this
		 *	method to provide enhanced checks for platform readyness.
		 *
		 *	@param listener The listener to notify when the platform is ready.
		 *	
		 *	@return The KOI framework.
		 */
		ready: function (listener) {
			if (_.isReady) {
				_.notify("platform-ready", listener);
			} else {
				_.bind('platform-ready', listener);
			}
	
			return _;
		},
		
		/**
		 *	Initialize the framework.
		 */
		initialize: function () {
			if (_.isReady) {
				return;
			}

			_.initialized = true;
			_.trigger("platform-initialized");
			_.readyQueue.initialized = true;
			_.makeReady();
		},
		
		/**
		 *	Makes the koi platform ready.
		 */
		makeReady: function () {
			if (this.isReady) {
				return;
			}
		
			var canReady = true;
		
			$.each(_.readyQueue, function (type, status) {
				if (!status) {
					canReady = false;
					return false;
				}
			});
			
			if (!canReady) {
				return;
			}
		
			_.isReady = true;
			_.trigger('platform-ready');
			
			if (_.autoReadyApplication) {
				_.trigger('application-ready');
			}
			
			$.each(plugins, function (index, plugin) {
				if (!plugin.__disableAutoReady) {
					plugin.makeReady();
				}
			});
		},
		
		/**
		 *	Localize the application. Parameters can either be provided, or extracted from the application's localization configuration.
		 *
		 *	@param language	The language document to load.
		 *
		 *	@param path		The path to load documents from.
		 *
		 *	Localization configuration Signature:
		 *	{
		 *		defaultLanguage: <deocumentLanguage>,
		 *
		 *		path: <pathToDocuments>
		 *	}
		 */
		localizeApplication: function (language, path) {
			if (localization_config !== null) {
				language = language || localization_config.defaultLanguage;
				path = path || localization_config.path;
			}
			
			if (language === undefined) {
				throw new Exception("KOI", "localizeApplication", "language", "undefined", "Must declare a localization path.");
			}
			
			if (path === undefined) {
				throw new Exception("KOI", "localizeApplication", "path", "undefined", "Must declare a localization path.");
			}
			
			$.ajax({
				url: path + "/" + language + ".json",
				type: "GET",
				dataType: "json",
				success: function (data) {
					$.extend(_.localization, data);
					_.readyQueue.localization = true;
					_.trigger("localization-loaded");
					_.makeReady();
				},
				error: function () {
					throw new Exception("KOI", "localizeApplication", "document", "invalid", "The localization document could not be loaded");
				},
				cache: false
			});
		}
			
	});
		
	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	//------------------------------
	//  Event Dispatcher Module
	//------------------------------
	
	/**
	 *	The event dispatcher simply provides a bind/trigger interface.
	 */
	_.module.eventdispatcher = Class.extend({
	
		//------------------------------
		//  Internal Properties
		//------------------------------
		
		/**
		 *	The delegate for dispatching this plugin's events.
		 */
		__delegate: undefined,
		
		/**
		 *	Flag to determine if this plugin is ready.
		 */
		isReady: undefined,
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 */
		init: function () {
			this.__delegate = $({});
			this.isReady = false;
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Plugin specific alias of jQuery.bind
		 */
		bind: function () {
			this.__delegate.bind.apply(this.__delegate, arguments);
		},
		
		/**
		 *	Plugin specific alias of jQuery.triggerHandler
		 */
		trigger: function () {
			this.__delegate.triggerHandler.apply(this.__delegate, arguments);
		},
		
		/**
		 *	Plugin specific alias of jQuery.one
		 */
		one: function () {
			this.__delegate.one.apply(this.__delegate, arguments);
		},
		
		/**
		 *	Plugin specific alias of jQuery.unbind
		 */
		unbind: function () {
			this.__delegate.update.apply(this.__delegate, arguments);
		},
		
		/**
		 *	Bind a listener for this module's ready event.
		 *
		 *	@param listener The listener to notify when the module is ready.
		 */
		ready: function (listener) {
			if (this.isReady) {
				_.notify("ready", listener, this);
			} else {
				this.bind('ready', listener);
			}
		},
		
		/**
		 *	Mark this module as ready.
		 */
		makeReady: function () {
			if (this.isReady) {
				return;
			}
			
			this.isReady = true;
			
			this.trigger('ready', [this]);
		}
	});
	
	//------------------------------
	//  Plugin Module
	//------------------------------
	
	/**
	 *	The KOI plugin is the base for all extensible functionality within KOI. By calling to
	 *	KOI.plugin(), a new scoped chunk of functionality can be added to the KOI object.
	 *
	 *	The base plugin class only contains some very basic reference accessors to the KOI framework,
	 *	as well as some extensibility methods.
	 */
	_.module.plugin = _.module.eventdispatcher.extend({
	
		//------------------------------
		//  Internal Properties
		//------------------------------
		
		/**
		 *	Flag to determine if auto-ready (once build finishes) indicates readyness.
		 */
		__disableAutoReady: false,
	
		//------------------------------
		//	Properties
		//------------------------------
	
		/**
		 *	The namespace of the plugin. Used to provide internal typing to the plugin so it can
		 *	reference itself when reporting errors.
		 */
		name: undefined,
		
		//------------------------------
		//	Constructor
		//------------------------------
		
		/**
		 *	Initialize the plugin.
		 *
		 *	@param name The name of the plugin. This plugin will be accessible via KOI.<name>
		 */
		init: function (name) {
			this.name = name;
			this._super();
		},
		
		//------------------------------
		//	Methods
		//------------------------------
	
		/**
		 *	Build the provided properties and methods into this instance of the plugin class.
		 *
		 *	@param definition	An object containing the methods and properties to add to this 
		 *						plugin instance
		 */
		build: function (definition) {
			$.extend(this, definition);
			
			if (!this.__disableAutoReady && !this.isReady) {
				this.makeReady();
			}
		},
		
		/**
		 *	Make this plugin ready if it's internal requirements are met.
		 */
		makeReady: function () {
			if (!_.isReady) {
				return;
			}
			
			this._super();
			
			_.trigger('koi-plugin-created', [this.name]);
			_.trigger('koi-plugin-created-' + this.name);
		}
	});
	
	//------------------------------
	//  Utility Function
	//------------------------------

	/**
	 *	Check the data to ensure it's neither undefined or null.
	 *
	 *	@param data	The data to check.
	 *
	 *	@return	True if the item is valid, false otherwise.
	 */
	window.isValid = function (data) {
		return data !== undefined && data !== null;
	};
	
	//------------------------------
	//  Exception
	//------------------------------
	
	/**
	 *	Using the class object, create a global Exception class for specific
	 *	koi error handling.
	 *
	 *	We extend the Error class as the injected core class of the Class object.
	 *	This will prevent Exception instanceof Class from returning true, which is
	 *	fine for the intended use of this object.
	 *
	 *	By extending the Error class, the cross browser property "message" is defined
	 *	for this class.
	 */
	window.Exception = Class.extend.call(Error, {
	
		//------------------------------
		//  Properties
		//------------------------------
		
		/**
		 *	The closure item of an exception should provide some meningful information as
		 *	to the file or closure within a file that the error was raised inside of.
		 */
		closure: undefined,
		
		/**
		 *	The method of an exception should describe the functional wrapper which raised
		 *	the excpetion.
		 */
		method: undefined,
		
		/**
		 *	The property of an exception should describe the variable or parameter which was
		 *	improperly assigned.
		 */
		property: undefined,
		
		/**
		 *	The value of an exception should print a meaningful readback of the value of the property
		 *	which raised the issue.
		 */
		value: undefined,
		
		/**
		 *	A description of the problem.
		 */
		description: undefined,
		
		//------------------------------
		//  Constructor
		//------------------------------
		
		/**
		 *	Constructor.
		 *
		 *	@param closure		The closure which raised the error.
		 *
		 *	@param method		The method which raised the error.
		 *
		 *	@param property		The property which raised the error.
		 *
		 *	@param value		The value of the property.
		 *
		 *	@param description	The description of the error.
		 */
		init: function (closure, method, property, value, description) {
			this.closure = closure;
			this.method = method;
			this.property = property;
			this.value = value;
			this.description = description;
			
			this.message = this.toString();
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Override the toString method to return a properly formatted excpetion.
		 */
		toString: function () {
			var buffer = [];

			if (this.closure) {
				buffer.push(this.closure);
			}
			
			if (this.method) {
				buffer.push(this.method);
			}
			
			buffer = buffer.join(".");
			
			if (this.property) {
				if (buffer.length > 0) {
					buffer += ":";
				}
				
				buffer += this.property;
			}
			
			if (this.value) {
				buffer += '{' + this.value + '}';
			}
			
			if (this.description) {
				buffer += '[' + this.description + ']';
			}
		
			return buffer;
		}
	});
	
	//------------------------------
	//  ModuleException
	//------------------------------
	
	/**
	 *	Exceptions specific to modules.
	 */
	window.ModuleException = window.Exception.extend({
	
		//------------------------------
		//  Properties
		//------------------------------
	
		/**
		 *	The module which raised this error.
		 */
		module: undefined,
	
		//------------------------------
		//  Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param module		The module which raised the error.
		 *
		 *	@param method		The method which raised the error.
		 *
		 *	@param property		The property which raised the error.
		 *
		 *	@param value		The value of the property.
		 *
		 *	@param description	The description of the error.
		 */
		init: function (module, method, property, value, description) {
			this.module = module;
			
			this._super("KOI.module." + module, method, property, value, description);
		}
	});
	
	//------------------------------
	//  InterfaceException
	//------------------------------
	
	/**
	 *	Exceptions specific to interfaces.
	 */
	window.InterfaceException = window.ModuleException.extend({
		
		//------------------------------
		//  Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param module		The module which raised the error.
		 *
		 *	@param method		The method which raised the error.
		 */
		init: function (module, method) {
			this._super(module, method, undefined, undefined, "Interface improperly implemented");
		}
	});
	
	//------------------------------
	//  PluginException
	//------------------------------
	
	/**
	 *	Exceptions specific to plugins.
	 */
	window.PluginException = window.Exception.extend({
	
		//------------------------------
		//  Properties
		//------------------------------
	
		/**
		 *	The plugin which raised this error.
		 */
		plugin: undefined,
	
		//------------------------------
		//  Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param plugin		The plugin which raised the error.
		 *
		 *	@param method		The method which raised the error.
		 *
		 *	@param property		The property which raised the error.
		 *
		 *	@param value		The value of the property.
		 *
		 *	@param description	The description of the error.
		 */
		init: function (plugin, method, property, value, description) {
			this.plugin = plugin;
			
			this._super("KOI." + plugin, method, property, value, description);
		}
	});
	
	//------------------------------
	//
	//  Event Bindings
	//
	//------------------------------
	
	/**
	 *	Pathing Links set the URL using the value of a KOI.pathing key which matches the rel attribute.
	 *
	 *	@param event	The event object.
	 */
	$(".pathing-link").live("click", function (event) {
		event.preventDefault();
		
		if ($(this).hasClass("disabled-link")) {
			return;
		}
		
		var element = $(this),
		
			to = element.attr("rel"),
			
			target = element.attr("target");
		
		if (_.pathing[to] !== undefined) {
			if (target.length === 0) {
				window.location = _.pathing[to];
			} else {
				window.open(_.pathing[to], target);
			}
		}
	});
	
	/**
	 *	Event Links send events matching the rel attribute.
	 *
	 *	@param event	The event object.
	 */
	$(".event-link").live("click", function (event) {
		event.preventDefault();
		
		if ($(this).hasClass("disabled-link")) {
			return;
		}
		
		var send = $(this).attr("rel");
		
		_.trigger(send, [$(this)]);
	});
	
	/**
	 *	Disabled Links simply terminate.
	 *
	 *	@param event	The event object.
	 */
	$(".disabled-link").live("click", function (event) {
		event.preventDefault();
	});
	
	/**
	 *	Refresh Links simply reload the page.
	 *
	 *	@param event	The event object.
	 */
	$(".refresh-link").live("click", function (event) {
		event.preventDefault();
		
		if ($(this).hasClass("disabled-link")) {
			return;
		}
		
		window.location.reload();
	});
	
	//------------------------------
	//
	//	Startup Code
	//
	//------------------------------
	
	//------------------------------
	//  Localization Hook
	//------------------------------
	
	if (localization_config !== null) {
		_.readyQueue.localization = false;
	}
	
	//------------------------------
	//  Hook jQuery
	//------------------------------
	
	/**
	 *	For the given objects, create error encapsulation for all the 
	 *	standard and plausible sources of script execution. This setup
	 *	should support any standard code exceution which occurs within
	 *	an application, providing they follow the standard pattern for execution
	 *	wrapping, which is binding to either the jQuery ready or any 
	 *	system/koi events.
	 */
	if (!application("allowExceptions", true)) {
		jQuery.prototype.ready = _.hook(jQuery.prototype.ready, exceptionConsumer);
		jQuery.ready = _.hook(jQuery.ready, exceptionConsumer);
		jQuery.event.handle = _.hook(jQuery.event.handle, exceptionConsumer);
		jQuery.handleError = _.hook(jQuery.handleError, exceptionConsumer);
		jQuery.ajax = _.hook(jQuery.ajax, function (settings) {
			if (settings.success) {
				settings.success = _.hook(settings.success, exceptionConsumer);
			}
			
			this.original.call(this.scope, settings);
		});
	}	

	//------------------------------
	//  Application Ready Handler
	//------------------------------
	
	_.bind('application-ready', function () {
		_.applicationReady = true;
		$('#koi-application-loading').hide();
		$('#koi-application-wrapper').show().removeClass("not-loaded");
	});
	
	//------------------------------
	//	Ready State Handler
	//------------------------------
	
	/**
	 *	Unless a plugin overrides the platform's ready handler, we want to dispatch a platform ready on
	 *	document ready.
	 */
	$(function () {
		$('meta[scheme="koi"]').each(function () {
			var tag = $(this).remove();
		
			_.metadata[tag.attr('name')] = tag.attr('content');
		});
		
		if (_.metadata.typekit !== undefined) {
			$.each(_.metadata.typekit.split(","), function (index, kit) {
				_.embedTypekit(kit);
			});
		}

		_.readyQueue.documentReady = true;
		
		_.makeReady();
	});
	
	//------------------------------
	//	Expose to Window
	//------------------------------
	
	window.KOI = _;
	
	//------------------------------
	//	Destroy configuration
	//------------------------------
	
	application();
	
}(jQuery));
