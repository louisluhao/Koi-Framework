/*!
 *	Module - Timeline
 *
 *	Copyright (c) 2010 Knewton
 *	Dual licensed under:
 *		MIT: http://www.opensource.org/licenses/mit-license.php
 *		GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */

"use strict";

/*global ModuleException, KOI, Class, window, jQuery */

/*jslint white: true, browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxerr: 50, indent: 4 */

(function ($) 
{
	//------------------------------
	//
	//  Properties
	//
	//------------------------------

		/**
		 *	Sort numbers.
		 */
	var SORT_NUMBER = function (a, b)
		{
			return a - b;
		};

	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The timeline module provides and interface for registering specific timing events
	 *	to get dispatched at certain points during a timed presentation.
	 *
	 *	The timeline module itself provides no timing, and must infact register for a
	 *	timekeeper which notifies the timeline whenever the time changes.
	 */
	KOI.module.timeline = Class.extend(
	{
		//------------------------------
		//	 Internal Properties
		//------------------------------
		
		/**
		 *	A collection of functions to act as event dispatchers. A function may be
		 *	registered as an event dispatcher using the "registerDispatcher" method.
		 *
		 *	Signature:
		 *	[
		 *		<dispatcherFunction>,
		 *
		 *		...
		 *	]
		 */
		__dispatchers: undefined,
	
		/**
		 *	A collection of times and events which should occur at those times.
		 *
		 *	Signature:
		 *	{
		 *		<time>: 
		 *		[
		 *			{
		 *				dispatcher: <dispatcherFunction>,
		 *
		 *				params: [...],
		 *			},
		 *
		 *			...
		 *		],
		 *
		 *		...
		 *	}			 
		 */
		__events: undefined,
		
		/**
		 *	The precision factor to use when computing precise time.
		 *
		 *	Defined by the equation: 
		 *		Math.pow(10, this.precision)
		 */
		__precisionFactor: undefined,
		
		//------------------------------
		//	 Properties
		//------------------------------
	
		/**
		 *	The precision at which this timeline operates. This should be an integer 
		 *	representing the number of decimal places which times should be rounded
		 *	to. For example, assume the following time:
		 *
		 *		5.25 seconds
		 *
		 *	+-----------+--------+
		 *	| Precision |  Time	 |
		 *	+-----------+--------+
		 *	|	  0		|	 5	 |
		 *	|	  1		|	5.3	 |
		 *	|	  2		|  5.25	 |
		 *	+-----------+--------+
		 *
		 *	@default	0
		 */
		precision: undefined,
	
		/**
		 *	The last time event dispatched by this timeline. This is used to track
		 *	the notifications which should be sent by this timeline. Whenever the
		 *	rounded value of the current time is changed and differs from this
		 *	value, a new timing event is dispatched against the handler.
		 */
		currentTime: undefined,
		
		//------------------------------
		//	 Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param timekeeper	The timekeepr to register a time event on.
		 *
		 *	@param precision	The precision to use for this timeline.
		 */
		init: function (timekeeper, precision)
		{
			if (!(timekeeper instanceof KOI.module.timekeeper))
			{
				throw new ModuleException("timeline", "init", "timekeeper", timekeeper, "Must be instanceof KOI.module.timekeeper");
			}
		
			this.__dispatchers = [];
			this.__events = {};
			this.precision = precision || 0;
			this.__precisionFactor = Math.pow(10, this.precision);
			this.currentTime = timekeeper.currentTime();
			
			var self = this;
			
			timekeeper.bind("time-change", function (event, time)
			{
				self.__timeChange(parseInt(time, 10));
			});
			
			timekeeper.bind("seek", function (event, time)
			{
				self.__dispatchEvents(self.closestPreviousEventTime(time));
			});
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Register an event dispatcher, and return it's identifier.
		 *
		 *	@param dispatcher	A function to handle some type of event.
		 *
		 *	@return	The dispatcher's UID.
		 */
		registerDispatcher: function (dispatcher)
		{
			if (!KOI.typecheck(dispatcher, 'Function'))
			{
				throw new ModuleException("timeline", "registerDispatcher", "dispatcher", typeof dispatcher, "Must be typeof Function");
			}
		
			var uid = this.__dispatchers.length;
			
			this.__dispatchers.push(dispatcher);
			
			return uid;
		},
		
		/**
		 *	Register an event for a dispatcher.
		 *
		 *	@param dispatcher	The UID of the dispatcher which will handle this event.
		 *
		 *	@param time			The time this event should occur at.
		 *
		 *	@param params		The parameters to pass to the dispatcher.
		 *
		 *	@param suppressSort	Internal use. Allows the suppression of the event sort.
		 */
		registerEvent: function (dispatcher, time, params, suppressSort)
		{
			if (this.__dispatchers[dispatcher] === undefined)
			{
				throw new ModuleException("timeline", "registerEvent", "dispatcher", dispatcher, "Must be index of dispatcher; use return from `registerDispatcher`");
			}
			
			if (params !== undefined && !KOI.typecheck(params, "Array"))
			{
				params = [params];
			}
			
			time = this.__toTime(time);
		
			if (this.__events[time] === undefined)
			{
				this.__events[time] = [];
			}
			
			this.__events[time].push({dispatcher: this.__dispatchers[dispatcher], params: params});
			
			if (!suppressSort)
			{
				this.__sortEvents();
			}
		},
		
		/**
		 *	Register a number of events for a dispatcher.
		 *
		 *	@param dispatcher	The UID of the dispatcher which will handle this event.
		 *
		 *	@param timing		A hash of timing codes to params for binding.
		 *
		 *	Signature "timing":
		 *	{
		 *		<time>: <params>,
		 *	
		 *		...
		 *	}
		 */
		registerEvents: function (dispatcher, timing)
		{
			if (this.__dispatchers[dispatcher] === undefined)
			{
				throw new ModuleException("timeline", "registerEvents", "dispatcher", dispatcher, "Must be index of dispatcher; use return from `registerDispatcher`");
			}
		
			var self = this;
		
			$.each(timing, function (time, params)
			{
				self.registerEvent(dispatcher, time, params, true);
			});
			
			this.__sortEvents();
		},
		
		/**
		 *	Returns the time closest to but occurring before the given time
		 *	at which an event would occur.
		 *
		 *	@param time	The time to search before. Default is current time.
		 *
		 *	@return	The time corresponding with the matching event.
		 */
		previousEventTime: function (time)
		{
			return this.__eventSearch(time, false, false);
		},
		
		/**
		 *	Similar to the previousEventTime() method, except it will reutrn
		 *	the current time if an event occurs at it.
		 *
		 *	@param time	The time to search at or before. Default is current time.
		 *
		 *	@return	The time corresponding with the matching event.
		 */
		closestPreviousEventTime: function (time)
		{
			return this.__eventSearch(time, false, true);
		},
		
		/**
		 *	Returns the time closest to but occurring after the given time
		 *	at which an event will occur.
		 *
		 *	@param time	The time to search after. Default is current time.
		 *
		 *	@return	The time corresponding with the matching event.
		 */
		nextEventTime: function (time)
		{
			return this.__eventSearch(time, true, false);
		},
		
		/**
		 *	Similar to the nextEventTime() method, except it will reutrn the
		 *	current time if an event occurs at it.
		 *
		 *	@param time	The time to search at or after. Default is current time.
		 *
		 *	@return	The time corresponding with the matching event.
		 */
		closestNextEventTime: function (time)
		{
			return this.__eventSearch(time, true, true);
		},
		
		//------------------------------
		//	 Internal Methods
		//------------------------------
		
		/**
		 *	Sort the events for this timeline, and order them properly.
		 */
		__sortEvents: function ()
		{	
				/**
				 *	Buffer for sorting the time codes
				 */
			var sortBuffer = [],
			
				/**
				 *	The actual buffer object.
				 */
				buffer = {},
				
				/**
				 *	This timeline.
				 */
				self = this;
			
			$.each(this.__events, function (time, event)
			{
				sortBuffer.push(parseInt(time, 10));
			});
			
			sortBuffer.sort(SORT_NUMBER);
			
			$.each(sortBuffer, function (index, time)
			{
				buffer[time] = self.__events[time];
			});
			
			this.__events = buffer;
		},
		
		/**
		 *	Search for an event. Designed to be called by public methods
		 *	within this class.
		 *
		 *	@param time		The time to use as the search start point.
		 *
		 *	@param forward	Search forward instead of the default backward search.
		 *
		 *	@param atTime	Allow return an event which occurs at the time.
		 *
		 *	@return	The time corresponding with the matching event.
		 */
		__eventSearch: function (time, forward, atTime)
		{
			if (time === undefined)
			{
				time = this.currentTime;
			}
			else
			{
				time = this.__toTime(time);
			}
			
			var eventTime;
			
			$.each(this.__events, function (timecode, event)
			{
				//	Events occurring after the given time.
				if (forward)
				{
					if ((atTime && timecode >= time) || (!atTime && timecode > time))
					{
						eventTime = timecode;
						return false;
					}
				}
				
				//	Events occuring before the given time.
				else
				{
					if ((atTime && timecode <= time) || (!atTime && timecode < time))
					{
						eventTime = timecode;
					}
					
					if (timecode >= time)
					{
						return false;
					}
				}
			});
			
			return eventTime;
		},
		
		/**
		 *	Dispatch events for the given time.
		 *
		 *	@param time	The time to use instead of currrent time.
		 */
		__dispatchEvents: function (time)
		{
			if (time === undefined)
			{
				time = this.currentTime;
			}
			else
			{
				time = this.__toTime(time);
			}
					
			var self = this;
		
			if (this.__events[time] !== undefined)
			{
				$.each(this.__events[time], function (index, event)
				{
					event.dispatcher.apply(self, event.params);
				});
			}
		},
	
		/**
		 *	An internal method, triggered by the timekeeper.
		 *
		 *	@param time	The current raw time from the timekeeper.
		 */
		__timeChange: function (time)
		{
			time = this.__toTime(time);
			
			if (this.currentTime === time)
			{
				return;
			}
			
			this.currentTime = time;
			
			this.__dispatchEvents();
		},
		
		/**
		 *	Perform our precision transform on the raw time.
		 *
		 *	@param rawTime	The time to perform the transform on.
		 *
		 *	@return	A timecode prepared for this timeline.
		 */
		__toTime: function (time)
		{
			return Math.floor(parseInt(time, 10) * this.__precisionFactor) / this.__precisionFactor;
		}
	});
		
}(jQuery));