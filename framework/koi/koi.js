/*!
 *	Framework - Koi
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global Exception, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{	
	//------------------------------
	//
	//	Constants
	//
	//------------------------------
	
		/**
		 *	The current version of the KOI core.
		 */
	var VERSION_NUMBER = '0.2.0',
	
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
		application;

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
	function Configuration(namespace)
	{
		this.values = $.extend({}, configurations[namespace]);
			
		delete configurations[namespace];
		
		/**
		 *	Get a property.
		 *
		 *	@param property The property to retrieve.
		 *
		 *	@param value	The default value to use, should no setting be provided.
		 */
		this.get = function (property, value)
		{
			if (this.values[property] === undefined)
			{
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
	function getConfiguration(namespace)
	{
		var reference = new Configuration(namespace);

		/**
		 *	Returns a lamda function which can retrieve properties, set default values, and destroy itself
		 *	onces it's finished being used. To destroy a configuration object, simply call config().
		 */
		return function (property, value)
		{
			if (property !== undefined)
			{
				return reference.get(property, value);
			}
			else
			{
				reference = undefined;
			}
		};
	}
	
	/**
	 *	Handle any exceptions in the system by passing them through the error handling
	 *	system in koi.
	 *
	 *	@param exception	The exception object thrown.
	 */
	function processException(exception)
	{
		var exit = false;
	
		$.each(_.errorHandlers, function (index, metrics)
		{
				/**
				 *	Flag to determine if this handler can consume the error.
				 */
			var canHandle = false,
			
				/**
				 *	Flag to determine if the handler consumed the error.
				 */
				consumed;
		
			if (metrics.instance !== undefined)
			{
				if (exception instanceof metrics.instance)
				{
					canHandle = true;
				}
			}
			
			if (!canHandle && metrics.properties !== undefined)
			{
				$.each(metrics.properties, function (key, value)
				{
					if (exception[key] === undefined && value === undefined)
					{
						canHandle = true;
						return false;
					}
					else if (exception[key] !== undefined)
					{
						if (_.typecheck(value, "RegExp"))
						{
							if (value.test(exception[key]))
							{
								canHandle = true;
								return false;
							}
						}
						else if (value === exception[key])
						{
							canHandle = true;
							return false;
						}
					}
				});
			}
			
			if (canHandle)
			{
				consumed = metrics.handler(exception);
				
				if (consumed === true)
				{
					exit = true;
					return false;
				}
				else if (consumed === false)
				{
					return false;
				}
			}
		});
		
		/**
		 *	If we reach this point in processing, rethrow the excpetion, as the
		 *	framework did not handle it.
		 */
		if (!exit)
		{
			throw exception;
		}
	}
	
	/**
	 *	A generic function to consume exceptions.
	 */
	function exceptionConsumer()
	{
		try
		{
			this.original.apply(this.scope, arguments);
		}
		catch (e)
		{
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
	
	//	Clear the config object out of the window namespace.
	window.__CONFIG = undefined;
	window.__SDK = undefined;
	
	//------------------------------
	//
	//	Framework Definition
	//
	//------------------------------
	
	$.extend(_, 
	{
		//------------------------------
		//	Properties
		//------------------------------
		
		/**
		 *	The framework version.
		 */
		version: VERSION_NUMBER,
		
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
		readyQueue: 
		{
			/**
			 *	Require the document ready before we ready the framework.
			 */
			documentReady: false,
			
			/**
			 *	Require the framework be initialized.
			 */
			initialized: false
		},
		
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
		handleError: function (handler, type, properties)
		{
			if (!_.typecheck(handler, "Function"))
			{
				throw new Exception("KOI", "handleError", "handler", typeof handler, "Must be a function");
			}
		
			_.errorHandlers.push(
			{
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
		raise: function (exception)
		{
			processException(exception);
		},
		
		/**
		 *	Gets a configuration object for the requested namespace.
		 *
		 *	@param namespace	The namespace of configuration settings to fetch.
		 *
		 *	@return The plugin configuration for the provided namespace.
		 */
		configuration: function (namespace)
		{
			return getConfiguration(namespace);
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
		createStylesheet: function (styles, context)
		{
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
		meta: function (name, value)
		{
			if (value !== undefined)
			{
				_.metadata[name] = value;
				
				return value;
			}
		
			if (_.metadata[name] === undefined)
			{
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
		hook: function (original, hook)
		{
			return (function (original, hook)
			{
				return function ()
				{
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
		invertObject: function (object)
		{
			var buffer = {};
		
			if (object === undefined)
			{
				throw new Exception("KOI", "invertObject", "object", "undefined", "Must be an object");
			}
		
			$.each(object, function (key, value)
			{
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
		extendsFrom: function (classObj, compare)
		{
			return classObj.prototype instanceof compare || classObj.prototype === compare.prototype;
		},
		
		/**
		 *	Creates a plugin within the KOI namespace.
		 *
		 *	@param namespace	The namespace of the plugin.
		 *
		 *	@param version		The version of the plugin.
		 *
		 *	@param PluginClass	A class which extends from the base plugin class.
		 *
		 *	@return The created plugin instance.
		 */
		plugin: function (namespace, version, PluginClass)
		{
			if (_[namespace] !== undefined)
			{
				throw new Exception("KOI", "plugin", "namespace", namespace, "Namespace collision");
			}
			
			if (PluginClass === undefined)
			{
				PluginClass = _.module.plugin;
			}
			
			if (!_.extendsFrom(PluginClass, _.module.plugin))
			{
				throw new Exception("KOI", "plugin", "PluginClass", undefined, "Must extend from KOI.module.plugin");
			}
			
			var plugin = this[namespace] = new PluginClass(namespace, version);
			
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
		typecheck: function (type, compare)
		{
			return !type ? false : !type.constructor ? false : type.constructor.toString().match(new RegExp(compare + '\\(\\)', 'i')) !== null;	 
		},
		
		/**
		 *	Bind an event. Passes all arguments to jQuery.bind
		 */
		bind: function ()
		{
			delegate.bind.apply(delegate, arguments);
		},
		
		/**
		 *	Bind an event. Passes all arguments to jQuery.triggerHandler
		 */
		trigger: function ()
		{
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
		notify: function (type, listener, context, parameters)
		{
			if (_.typecheck(listener, 'Function'))
			{
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
		now: function ()
		{
			return new Date().valueOf();
		},
		
		/**
		 *	Given the name of the URL Query String param, return it's value, or null.
		 *
		 *	@param name The name of the param to get.
		 *
		 *	@return The value of the param, or null.
		 */
		urlParam: function (name)
		{
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
		flash: function (name, value)
		{
			name = 'koi-flash-' + name;
		
			if (value !== undefined)
			{
				_.cookie(name, value, {path: '/'});
			}
			else
			{
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
		cookie: function (name, value, options)
		{
			var date,
				expires = '',
				path,
				domain,
				secure,
				cookieValue = null,
				index = 0,
				cookies,
				cookie;
			
			if (value !== undefined)
			{
			
				options = options || {};
				
				if (value === null) {
					value = '';
					options.expires = -1;
				}
	
				if (options.expires && (_.typecheck(options.expires, 'Number') || options.expires.toUTCString))
				{
					if (_.typecheck(options.expires, 'Number'))
					{
						date = new Date();
						date.setTime(date.getTime() + (options.expires * 864e5));
					} 
					else
					{
						date = options.expires;
					}
					
					expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
				}
		
				path = options.path ? '; path=' + (options.path) : '';
				domain = options.domain ? '; domain=' + (options.domain) : '';
				secure = options.secure ? '; secure' : '';
				document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
			} 
			else 
			{
				if (document.cookie && document.cookie !== '')
				{
					cookies = document.cookie.split(';');
					
					for (; index < cookies.length; index += 1)
					{
						cookie = $.trim(cookies[index]);
						
						// Does this cookie string begin with the name we want?
						if (cookie.substring(0, name.length + 1) === (name + '='))
						{
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
						}
					}
				}
				
				return cookieValue;
			}
		},
		
		/**
		 *	Similar to the jQuery $(document).ready() method, only plugins can override this
		 *	method to provide enhanced checks for platform readyness.
		 *
		 *	@param listener The listener to notify when the platform is ready.
		 *	
		 *	@return The KOI framework.
		 */
		ready: function (listener)
		{
			if (_.isReady)
			{
				_.notify("platform-ready", listener);
			}
			else
			{
				_.bind('platform-ready', listener);
			}
	
			return _;
		},
		
		/**
		 *	Initialize the framework.
		 */
		initialize: function ()
		{
			if (_.isReady)
			{
				return;
			}

			_.trigger("platform-initialized");
			_.readyQueue.initialized = true;
			_.makeReady();
		},
		
		/**
		 *	Makes the koi platform ready.
		 */
		makeReady: function ()
		{
			var canReady = true;
		
			$.each(_.readyQueue, function (type, status)
			{
				if (!status)
				{
					canReady = false;
					return false;
				}
			});
			
			if (!canReady)
			{
				return;
			}
		
			_.isReady = true;
			_.trigger('platform-ready');
			
			if (_.autoReadyApplication)
			{
				_.trigger('application-ready');
			}
			
			$.each(plugins, function (index, plugin)
			{
				if (!plugin.__disableAutoReady)
				{
					plugin.makeReady();
				}
			});
			
			delete this.makeReady;
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
		init: function ()
		{
			this.__delegate = $({});
			this.isReady = false;
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Plugin specific alias of jQuery.bind
		 */
		bind: function ()
		{
			this.__delegate.bind.apply(this.__delegate, arguments);
		},
		
		/**
		 *	Plugin specific alias of jQuery.triggerHandler
		 */
		trigger: function ()
		{
			this.__delegate.triggerHandler.apply(this.__delegate, arguments);
		},
		
		/**
		 *	Bind a listener for this module's ready event.
		 *
		 *	@param listener The listener to notify when the module is ready.
		 */
		ready: function (listener)
		{
			if (this.isReady)
			{
				_.notify("ready", listener, this);
			}
			else
			{
				this.bind('ready', listener);
			}
		},
		
		/**
		 *	Mark this module as ready.
		 */
		makeReady: function ()
		{
			this.isReady = true;
			
			this.trigger('ready', [this]);
			
			delete this.makeReady;
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
	_.module.plugin = _.module.eventdispatcher.extend(
	{
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
		 *	The version of the plugin.
		 */
		version: undefined,
	
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
		 *
		 *	@param version The version of the plugin.
		 */
		init: function (name, version)
		{
			this.name = name;
			this.version = version;
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
		build: function (definition)
		{
			$.extend(this, definition);
			
			delete this.build;
			
			if (!this.__disableAutoReady)
			{
				this.makeReady();
			}
		},
		
		/**
		 *	Make this plugin ready if it's internal requirements are met.
		 */
		makeReady: function ()
		{
			if (!_.isReady)
			{
				return;
			}
			
			this._super();
			
			_.trigger('koi-plugin-created', [this.name, this.version]);
			_.trigger('koi-plugin-created-' + this.name);
		}
	});
	
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
	window.Exception = Class.extend.call(Error,
	{
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
		init: function (closure, method, property, value, description)
		{
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
		toString: function ()
		{
			var buffer = [];

			if (this.closure)
			{
				buffer.push(this.closure);
			}
			
			if (this.method)
			{
				buffer.push(this.method);
			}
			
			buffer = buffer.join(".");
			
			if (this.property)
			{
				if (buffer.length > 0)
				{
					buffer += ":";
				}
				
				buffer += this.property;
			}
			
			if (this.value)
			{
				buffer += '{' + this.value + '}';
			}
			
			if (this.description)
			{
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
	window.ModuleException = window.Exception.extend(
	{
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
		init: function (module, method, property, value, description)
		{
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
	window.InterfaceException = window.ModuleException.extend(
	{	
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
		init: function (module, method)
		{
			this._super(module, method, undefined, undefined, "Interface improperly implemented");
		}
	});
	
	//------------------------------
	//  PluginException
	//------------------------------
	
	/**
	 *	Exceptions specific to plugins.
	 */
	window.PluginException = window.Exception.extend(
	{
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
		init: function (plugin, method, property, value, description)
		{
			this.plugin = plugin;
			
			this._super("KOI." + plugin, method, property, value, description);
		}
	});
	
	//------------------------------
	//
	//	Startup Code
	//
	//------------------------------
	
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
	jQuery.prototype.ready = _.hook(jQuery.prototype.ready, exceptionConsumer);
	jQuery.ready = _.hook(jQuery.ready, exceptionConsumer);
	jQuery.event.handle = _.hook(jQuery.event.handle, exceptionConsumer);
	jQuery.handleError = _.hook(jQuery.handleError, exceptionConsumer);
	jQuery.ajax = _.hook(jQuery.ajax, function (settings)
	{
		if (settings.success)
		{
			settings.success = _.hook(settings.success, exceptionConsumer);
		}
		
		this.original.call(this.scope, settings);
	});
	
	//------------------------------
	//  Application Ready Handler
	//------------------------------
	
	_.bind('application-ready', function ()
	{
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
	$(function ()
	{
		$('meta[scheme="koi"]').each(function ()
		{
			var tag = $(this).remove();
		
			_.metadata[tag.attr('name')] = tag.attr('content');
		});

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
