/**
 *	Framework - Class
 *
 *	Copyright (c) 2008 John Resig (http://ejohn.org/blog/simple-javascript-inheritance/)
 *	Inspired by base2 and Prototype
 */
 
/*global Class, window */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: false, strict: true, immed: true, maxerr: 50, indent: 4 */

(function () {

		/**
		 *	Test to see if we are initializaing to allow us to skip certain steps during setup.
		 */
	var initializing = false, 
	
		/**
		 *	Test the browser to see if it can properly decompile functions
		 */
		fnTest = /xyz/.test(function () {return 'xyz'; }) ? /\b_super\b/ : /.*/;
	
	// The base Class implementation (does nothing) 
	window.Class = function () {};
		
	// Create a new Class that inherits from this class
	window.Class.extend = function (prop) {
		var _super = this.prototype,
		
			prototype,
			
			name;
		
		// Instantiate a base class (but only create the instance, don't run the init constructor)
		initializing = true;
		
		prototype = new this();
		
		initializing = false;
		
		// Copy the properties over onto the new prototype
		for (name in prop) {
		
			// Check if we're overwriting an existing function
			prototype[name] = (typeof prop[name] === "function" && typeof _super[name] === "function" && fnTest.test(prop[name]) ?
			
				(function (name, fn) {
					return function () {
						var tmp = this._super,
						
							ret;
		
						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];
						
						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						ret = fn.apply(this, arguments);		
						this._super = tmp;
						
						return ret;
					};
				}(name, prop[name])) : prop[name]);
		}

		// The dummy class constructor
		function Class() {
			// All construction is actually done in the init method
			if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
		}
		
		// Populate our constructed prototype object
		Class.prototype = prototype;
		
		// Enforce the constructor to be what we expect
		Class.constructor = Class;
		
		// And make this class extendable
		Class.extend = arguments.callee;
		
		return Class;
	};
}());