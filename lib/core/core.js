/**
 * KOI core
 *
 * Copyright (c) 2010 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, maxerr: 50, indent: 4, maxlen: 79 */
(function () {
	"use strict";

	/**
	 * todo: readme
	 */

	//------------------------------
	//
	// Constants
	//
	//------------------------------

	//------------------------------
	// Expressions
	//------------------------------

		/**
		 * Match the print out for variable.constructor.toString().
		 * @type {RegExp}
		 * @const
		 */
	var RX_TYPE_SPLIT = /\s([A-Za-z0-9]+)\(/;

	//------------------------------
	//
	// Properties
	//
	//------------------------------

	//------------------------------
	//
	// Methods
	//
	//------------------------------

	//------------------------------
	// Variable checking
	//------------------------------

	/**
	 * Determine if a variable is null.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is null.
	 */
	function isNull(v) {
		return v === null;
	}

	/**
	 * Determine if a variable is undefined.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is undefined.
	 */
	function isUndefined(v) {
		return v === undefined;
	}

	/**
	 * Determine if a variable is not null or undefined.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is valid.
	 */
	function isValid(v) {
		return !(isNull(v) || isUndefined(v));
	}

	/**
	 * Return the type of a variable, based on its constructor.
	 * @param {?*} v The variable.
	 * @return {?string} The type of variable, or null.
	 */
	function getType(v) {
		if (isValid(v)) {
			// ["function Function() { [native code] }", "Function"]
			var type = v.constructor.toString().match(RX_TYPE_SPLIT);
			if (isValid(type) && isValid(type[1])) {
				return type[1].toLowerCase();
			}
		}

		return null;
	}

	/**
	 * Determine if a variable is of some type.
	 * @param {?*} v v The variable.
	 * @param {string} type The type to check against.
	 * @return {boolean} Whether the variable is of the type.
	 */
	function isOfType(v, type) {
		if (isValid(type)) {
			return getType(v) === type.toLowerCase();
		}

		return false;
	}

	/**
	 * Determine if a variable is an array.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is an array.
	 */
	function isArray(v) {
		return isOfType(v, "array");
	}

	/**
	 * Determine if a variable is an object.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is an object.
	 */
	function isObject(v) {
		return isOfType(v, "object");
	}

	/**
	 * Determine if a variable is a function.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a function.
	 */
	function isFunction(v) {
		return isOfType(v, "function");
	}

	/**
	 * Determine if a variable is a number.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a number.
	 */
	function isNumber(v) {
		return isOfType(v, "number");
	}

	/**
	 * Determine if a variable is an interger.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is an interger.
	 */
	function isInterger(v) {
		return isNumber(v) && v % 1 === 0;
	}

	/**
	 * Determine if a variable is a float.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a float.
	 */
	function isFloat(v) {
		return isNumber(v) && !isInterger(v);
	}

	/**
	 * Determine if a variable is a string.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a string.
	 */
	function isString(v) {
		return isOfType(v, "string");
	}

	/**
	 * Determine if a variable is a regexp.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a regexp.
	 */
	function isRegExp(v) {
		return isOfType(v, "regexp");
	}

	/**
	 * Determine if a variable is a date.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a date.
	 */
	function isDate(v) {
		return isOfType(v, "date");
	}

	/**
	 * Determine if a variable is a boolean.
	 * @param {?*} v The variable.
	 * @return {boolean} Whether the variable is a boolean.
	 */
	function isBoolean(v) {
		return isOfType(v, "boolean");
	}

	/**
	 * Determine if the object or array is empty.
	 * @param {?Array|Object} v The variable.
	 * @return {boolean} Whether the variable is empty.
	 */
	function isEmpty(v) {
		if (isValid(v)) {
			if (isArray(v) || isString(v)) {
				return v.length === 0;
			} else if (isObject(v)) {
				var key;
				for (key in v) {
					if (v.hasOwnProperty(key)) {
						return false;
					}
				}

				return true;
			}
		}

		return true;
	}

	//------------------------------
	// Utilities
	//------------------------------

	/**
	 * Call an iterator function for each element within the source.
	 * Have the iterator return false to break.
	 * If a function is provided, it will be run until it returns false.
	 * @param {Array|Object|number|string|function()} src The source.
	 * @param {?function(this:Array|Object|number, string|number, *)} iterator
	 *	 An iterator callback.
	 */
	function each(src, iterator) {
		var key,
			index = 0,
			length;

		if (isValid(src) && (isFunction(iterator) || isFunction(src))) {
			if (isObject(src) && !isEmpty(src)) {
				for (key in src) {
					if (src.hasOwnProperty(key)) {
						if (iterator.call(src, key, src[key]) === false) {
							return;
						}
					}
				}
			} else if (isArray(src) && !isEmpty(src)) {
				length = src.length;
				for (; index < length; index++) {
					if (iterator.call(src, index, src[index]) === false) {
						return;
					}
				}
			} else if (isNumber(src) && src > 0) {
				for (; index < src; index++) {
					if (iterator.call(src, index, index) === false) {
						return;
					}
				}
			} else if (isString(src) && src.length > 0) {
				length = src.length;
				for (; index < length; index++) {
					if (iterator.call(src, index, src[index]) === false) {
						return;
					}
				}
			} else if (isFunction(src)) {
				while (true) {
					if (src.call(src) === false) {
						return;
					}
				}
			}
		}
	}

	/**
	 * Expose methods on koi.
	 * @param {Object.<string, function(...[*]>} methods The methods to expose.
	 * @param {string|*=} namespace A namespace for the exposure.
	 * @param {boolean=} force Force overwriting of defined.
	 */
	function expose(methods, namespace, force) {
		if (window.KOI === undefined) {
			window.KOI = {};
		}

		var exposer = window.KOI;

		if (isValid(namespace)) {
			if (isString(namespace)) {
				if (!isValid(exposer[namespace])) {
					exposer[namespace] = {};
				}

				if (!isObject(exposer[namespace])) {
					throw namespace + " is not a namespace";
				}

				exposer = exposer[namespace];
			} else {
				// Allow the namespace to be any object
				exposer = namespace;
			}
		}

		each(methods, function (name, method) {
			if (exposer[name] === undefined || Boolean(force) ||
					!isFunction(exposer[name])) {
				exposer[name] = method;
			} else {
				throw name + " is already exposed";
			}
		});
	}

	/**
	 * Returns the first index of the value in the array.
	 * @param {*} v The value to search for.
	 * @param {Array} a The array to search.
	 * @return {number} The first index of the value in the array.
	 */
	function indexOf(v, a) {
		var i = 0;

		if (Array.prototype.indexOf) {
			return a.indexOf(v);
		} else {
			for (; i < a.length; i++) {
				if (a[i] === v) {
					return i;
				}
			}
		}

		return -1;
	}

	/**
	 * Determines if the value is in the array.
	 * @param {*} v The value to search for.
	 * @param {Array} a The array to search.
	 * @return {boolean} True if the value is in the array.
	 */
	function inArray(v, a) {
		return indexOf(v, a) !== -1;
	}

	//------------------------------
	//
	// Event bindings
	//
	//------------------------------

	//------------------------------
	//
	// Exposure
	//
	//------------------------------

	expose({

	//------------------------------
	// Variable checking
	//------------------------------

		isNull: isNull,
		isUndefined: isUndefined,
		isValid: isValid,
		getType: getType,
		isOfType: isOfType,
		isArray: isArray,
		isObject: isObject,
		isFunction: isFunction,
		isNumber: isNumber,
		isInterger: isInterger,
		isFloat: isFloat,
		isString: isString,
		isRegExp: isRegExp,
		isDate: isDate,
		isBoolean: isBoolean,
		isEmpty: isEmpty,

	//------------------------------
	// Utility methods
	//------------------------------

		each: each,
		indexOf: indexOf,
		inArray: inArray,
		expose: expose

	});

}());
