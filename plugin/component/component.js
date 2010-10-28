/*!
 *	Plugin - Component
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
		 *	Load our configuration settings.
		 */
	var config = KOI.configuration("component"),
	
	//------------------------------
	//
	//	Property Declaration
	//
	//------------------------------
	
		/**
		 *	The component plugin allows stub placeholders in the document to be defined
		 *	replaced by "components" containing html and javascript and/or styles.
		 */
		_ = KOI.plugin("component", "development"),
		
		//------------------------------
		//  Components
		//------------------------------
		
		/**
		 *	Contains the registrations for a given component, to determine when the component
		 *	can be considered "ready". If javascript/stylsheet is null, it indicates that
		 *	resource is not defined for the component.
		 *
		 *	Signature:
		 *	{
		 *		<componentId>:
		 *		{
		 *			instance: <instanceName>,
		 *
		 *			version: <version>,
		 *
		 *			content: <contentToInject>,
		 *
		 *			html: <true|false>,
		 *
		 *			javascript: <true|false|null>,
		 *
		 *			stylesheet: <true|false|null>,
		 *
		 *			target: <jQueryObject>,
		 *
		 *			processor: <null|processorMethod>
		 *		},
		 *
		 *		...
		 *	}
		 */
		components = {},
		
		/**
		 *	For components with javascript, this maps the name of the instance (which the JS will know)
		 *	to the componentId (which it should not).
		 *
		 *	Signature:
		 *	{
		 *		<instanceName>: <componentId>,
		 *
		 *		...
		 *	}
		 */
		processors = {},
		
		/**
		 *	If the configuration is providing instances of components, read them in here.
		 *
		 *	Signature:
		 *	{
		 *		<componentId>: 
		 *		{
		 *			instance: <instanceName>,
		 *
		 *			version: <instanceVersion>
		 *		},
		 *
		 *		...
		 *	}
		 */
		instances = config("instances", {});
	
	//------------------------------
	//
	//	Internal Methods
	//
	//------------------------------
	
	//------------------------------
	//	 Utilities
	//------------------------------

	/**
	 *	Get the base path for a component instance.
	 *
	 *	@param instance	The instance of the component to use.
	 *
	 *	@param version	The version of the component to use.
	 *
	 *	@param path		A path override to use.
	 *
	 *	@return	The path to the component.
	 */
	function getPath(instance, version, path)
	{
		return [path || _.path, instance, version, instance].join('/');
	}
	
	/**
	 *	Check the given element to see if it's disabled.
	 *
	 *	@param element	The element to check.
	 *
	 *	@return	True if the component is disabled, false otherwise.
	 */
	function disabled(element)
	{
		var isDisabled = false;
	
		$.each(element.attr('class').split(' '), function (index, className)
		{
			if ($.inArray(className, _.disabledClasses) !== -1)
			{
				isDisabled = true;
				return false;
			}
		});
		
		return isDisabled;
	}
	
	//------------------------------
	//	 Processors
	//------------------------------
	
	/**
	 *	Process a given component, marking it as completed if all includes have finished.
	 *
	 *	@param id	The component to process.
	 */
	function process(id)
	{
		var definition = components[id];
		
		if (!definition.html || 
			(definition.javascript !== null && !definition.javascript) ||
			(definition.stylesheet !== null && !definition.stylesheet))
		{
			return;
		}
		
		if (KOI.typecheck(definition.processor, "Function"))
		{
			definition.processor(definition.target);	
		}
		
		KOI.trigger("component-loaded", [id]);
		KOI.trigger("component-loaded-" + id);
	}
	
	//------------------------------
	//	 Handlers
	//------------------------------
	
	/**
	 *	Handles the successful loading of the HTML.
	 *
	 *	@context	Contains the ID of the component.
	 *	
	 *	@param data	The HTML for a component.
	 */
	function documentHandler(data)
	{
			/**
			 *	The component definition.
			 *	JSLint complains about strict violation here. It's not.
			 */
		var definition = components[this.id],
		
			/**
			 *	Construct the response data.
			 */
			element = $(data);
		
		//	Replace the placeholder target
		definition.target.replaceWith(element);
		
		//	Track the new element in the definition
		definition.target = element;
		
		//	Inject content.
		if (definition.content !== undefined)
		{
			$(".koi-component-content-receiver:first", element).replaceWith(definition.content);
		}
		
		//	Mark the HTML as included.
		definition.html = true;
		
		//	Load new components which may have been included.
		_.load();
		
		//	Process the component
		//	JSLint complains about strict violation here. It's not.
		process(this.id);
	}
	
	//------------------------------
	//	 Requests
	//------------------------------

	/**
	 *	Embed a stylesheet. This should be disabled in production.
	 *
	 *	@param item	The URL of the css item to load.
	 *
	 *	@param id	The id of the component.
	 */
	function loadStylesheet(item, id)
	{
		KOI.styleloader.load("component-" + id, item + ".css", function (event, sheet)
		{
			components[id].stylesheet = true;
			KOI.createStylesheet(sheet);
			process(id);
		});
	}
	
	/**
	 *	Load a component script. The script will handle notification.
	 *
	 *	@param path	The path to load the component from.
	 */
	function loadScript(path)
	{	
		$.ajax(
		{
			url: path + ".js",
			cache: false,
			type: "GET",
			dataType: "script"
		});
	}
	
	/**
	 *	Load component HTML.
	 *
	 *	@param path	The path to load the component from.
	 */
	function loadHTML(path, id)
	{
		$.ajax(
		{
			url: path + ".html",
			success: documentHandler,
			cache: false,
			type: "GET",
			dataType: "html",
			context:
			{
				id: id
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
		//  Properties
		//------------------------------
		
		/**
		 *	The path from the current document to the components directory.
		 */
		path: config("path", ""),
		
		/**
		 *	A list of the classes which disable a given component.
		 */
		disabledClasses: config("disabledClasses", ["component-disabled", "component-loading"]),
		
		//------------------------------
		//  Methods
		//------------------------------
	
		/**
		 *	Load components which are active in the document.
		 */
		load: function ()
		{
			$('.koi-component').trigger('load-component');
		},
	
		/**
		 *	Register a component instance.
		 *
		 *	@param id			The ID of the component.
		 *
		 *	@param instance		The instance name for the component ID.
		 *
		 *	@param version		The version of the component instance to load.
		 *
		 *	@param composition	The composition of the component. 
		 *						['stylesheet', 'javascript'] are acceptable values.
		 *
		 *	@param target		The target element to replace for component injection.
		 *
		 *	@param content		Optional content to inject into the component, if supported.
		 *
		 *	@param path			A path override to use, instead of the default.
		 */
		register: function (id, instance, version, composition, target, content, path)
		{
			if (components[id] !== undefined)
			{
				throw new PluginException("component", "register", "id", id, "Namespace collision");
			}
			
				/**
				 *	The definition for this component.
				 */
			var definition = 
				{
					instance: instance,
					
					html: false,
					
					javascript: null,
					
					stylesheet: null,
					
					version: version,
					
					target: target
				},
				
				/**
				 *	The base path for includes.
				 */
				basePath = getPath(instance, version, path);
			
			if (content !== undefined)
			{
				definition.content = content;
			}

			components[id] = definition;
			
			$.each(composition, function (index, type)
			{
				switch ($.trim(type))
				{
				
				case "stylesheet":
					definition.stylesheet = false;
					loadStylesheet(basePath, id);
					break;
				
				case "javascript":
					processors[instance] = id;
					definition.javascript = false;
					definition.processor = null;
					loadScript(basePath);
					break;
				
				}
			});
			
			loadHTML(basePath, id);
		},
		
		/**
		 *	Declare a processor function for a component. This should be done by loaded javascript.
		 *
		 *	@param name	The name of the component included.
		 *
		 *	@param fn	The processor function to trigger when the component is ready.
		 */
		process: function (name, fn)
		{
			//	Only allow processors which have been stubbed in.
			if (processors[name] === undefined)
			{
				throw new PluginException("component", "process", "name", name, "Not registered");
			}
			
			var component = processors[name];
			
			components[component].processor = fn;
			components[component].javascript = true;
			
			process(component);
		}
	});
	
	//------------------------------
	//  ComponentException
	//------------------------------
	
	/**
	 *	Exceptions specific to components.
	 */
	window.ComponentException = window.Exception.extend(
	{
		//------------------------------
		//  Properties
		//------------------------------
	
		/**
		 *	The component which raised this error.
		 */
		component: undefined,
	
		//------------------------------
		//  Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param component	The component which raised the error.
		 *
		 *	@param method		The method which raised the error.
		 *
		 *	@param property		The property which raised the error.
		 *
		 *	@param value		The value of the property.
		 *
		 *	@param description	The description of the error.
		 */
		init: function (component, method, property, value, description)
		{
			this.component = component;
			
			this._super("KOI.component<" + component + ">", method, property, value, description);
		}
	});
	
	//------------------------------
	//
	//	Event Bindings
	//
	//------------------------------
	
	/**
	 *	Loads components from the following HTML structure.
	 *
	 *	<code id="component-id" class="koi-component" lang="stylesheet,javascript" title="instance-name:version">
	 *		<div></div>
	 *	</code>
	 *
	 *	id:			The ID of the component
	 *	class:		Must contain "koi-component"
	 *	lang:		Additional resources to include (valid: stylesheet, javascript)
	 *	title:		The instance name of the component (optional, as it can be provided by the configs).
	 *	innerHTML:	If the component defines an injection area for content, the content within the code block
	 *				will be injected into the content receiver.
	 */
	$('.koi-component').live('load-component', function ()
	{
			/**
			 *	The element representing a component.
			 */
		var element = $(this),
		
			/**
			 *	The ID of the component.
			 */
			id = element.attr("id"),
		
			/**
			 *	The instance name.
			 */
			instance,
			
			/**
			 *	The version of the component to load.
			 */
			version,
			
			/**
			 *	Content for injection, if applicable.
			 */
			content,
			
			/**
			 *	The composition for this component.
			 */
			composition = [];
		
		if (disabled(element))
		{
			return;
		}
		
		//	Mark the component as loading, to prevent double loading.
		element.addClass("component-loading");
		
		/**
		 *	If the configuration declared an instance definition for
		 *	this component, use that over the default configs.
		 */
		if (instances[id] !== undefined)
		{
			instance = instances[id];
			
			version = instance.version;
			instance = instance.instance;
		}
		
		/**
		 *	Parse the instance string to grab the name/version.
		 *
		 *	title should be in the "instance-name:version" format.
		 */
		else if (element.attr("title") !== undefined)
		{
			instance = element.attr("title").split(":");
			
			version = instance[1];
			instance = instance[0];
		}
		
		/**
		 *	Otherwise, this is misconfigured, and we need to error.
		 */
		else
		{
			throw new Error("KOI.component[load-component]:title");
		}
		
		/**
		 *	If we have composition, set it here.
		 */
		if (element.attr("lang") !== undefined)
		{
			composition = element.attr("lang").split(",");
		}
		
		/**
		 *	If the element contains children, they are for content injection.
		 */
		if (element.children().length > 0)
		{
			content = element.children().remove();
		}
		
		_.register(id, instance, version, composition, element, content);
	});
	
	//------------------------------
	//
	//	Startup Code
	//
	//------------------------------
	
	//------------------------------
	//	 On Ready
	//------------------------------
		
	_.ready(function ()
	{
		//	Load the components on ready.
		_.load();
	});
		
	//------------------------------
	//	 Destroy Configuration
	//------------------------------
		
	config();
		
}(jQuery));
