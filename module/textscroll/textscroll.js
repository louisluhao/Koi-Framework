/*!
 *	Module - TextScroll
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
	//	 Constants
	//
	//------------------------------

		/**
		 *	The template for scroll content.
		 */
	var CONTENT_TPL = $('<div class="koi-textscroll-content"></div>');

	//------------------------------
	//
	//	Class Definition
	//
	//------------------------------
	
	/**
	 *	The textscroll module uses a content viewport to scroll some text within the viewport,
	 *	providing a number of stages at which the scroll can be aborted.
	 *
	 *	Phase 1: Primary Scroll	(ensures all text is somewhat visible)
	 *	Phase 2: Full Scroll (moves the remainder of the text out of the viewport)
	 *	Phase 3: Marquee Scroll	(begins scrolling the text from the other side of the viewport, back to repeat.)
	 */
	KOI.module.textscroll = KOI.module.eventdispatcher.extend(
	{
		//------------------------------
		//	 Internal Properties
		//------------------------------
	
		/**
		 *	Flag to determine if we should interrupt the scroll at the end of the next phase.
		 */
		__interrupt: undefined,
		
		/**
		 *	The current phase which this textscroll is in.
		 */
		__currentPhase: undefined,
		
		/**
		 *	The direction of the scroll. Possible values are left and right. Default is left.
		 */
		__direction: undefined,
		
		/**
		 *	The target container for this textscroll.
		 */
		__container: undefined,
		
		/**
		 *	The element containing the content for this textscroll.
		 */
		__element: undefined,
		
		/**
		 *	Flag to determine if we're currently running the scroll.
		 */
		__running: undefined,
		
		/**
		 *	The dimensions object, containing the sizes of the element and container.
		 *
		 *	Signature:
		 *	{
		 *		container: <widthOfContainer>,
		 *
		 *		element: <widthOfElement>
		 *	}
		 */
		__dimensions: undefined,
		
		//------------------------------
		//	 Properties
		//------------------------------

		/**
		 *	Flag to determine if the area should scroll.
		 */
		mustScroll: undefined,
		
		/**
		 *	The coefficient for speed calculation in milliseconds per pixel. Default is 50.
		 */
		speedCoefficient: undefined,
		
		/**
		 *	The margin to add to the text's orientation side, for padding. Default is 15.
		 */
		margin: undefined,
		
		//------------------------------
		//	 Constructor
		//------------------------------
	
		/**
		 *	Constructor.
		 *
		 *	@param container	The container for holding this item.
		 *
		 *	@param text			Optional. The text to scroll.
		 *
		 *	@param speed		Optional. The milliseconds per pixel for speed calculation.
		 *
		 *	@param margin		Optional. The offset margin.
		 *
		 *	@param direction	Optional. The direction for scrolling.
		 */
		init: function (container, text, speed, margin, direction)
		{
			if (direction === undefined)
			{
				direction = "left";
			}
		
			switch (direction.toLowerCase())
			{
			
			case "left":
				this.__direction = "Left";
				break;
				
			case "right":
				this.__direction = "Right";
				break;
				
			default:
				throw new TypeError("textscroll.init:direction");
				
			}
			
			this.speedCoefficient = speed || 50;
			this.margin = margin || 15;
			
			this.__container = container.addClass("koi-textscroll-container");
			this.__element = CONTENT_TPL.clone().appendTo(this.__container);
			
			this.__setDefaultMargin();
			
			if (text !== undefined)
			{
				this.text(text);
			}
			
			this._super();
		},
		
		//------------------------------
		//  Methods
		//------------------------------
		
		/**
		 *	Set the text of this textscroll.
		 *
		 *	@param text	The text to use.
		 *
		 *	@return	Self
		 */
		text: function (text)
		{
			this.__element.html(text);
			this.__dimensions = 
			{
				container: this.__container.width(),
				element: this.__element.width()
			};
			
			this.mustScroll = this.__dimensions.container < this.__dimensions.element;
			
			this.trigger("scroll-ready");
			
			return this;
		},
		
		/**
		 *	Start the text scroll.
		 *
		 *	@return Self
		 */
		start: function ()
		{
			if (this.mustScroll === undefined)
			{
				throw new Error("textscroll.start:mustScroll");
			}

			if (this.__running)
			{
				return;
			}

			this.trigger("start");
			this.__running = true;
			
			this.__interrupt = undefined;
			
			if (this.mustScroll)
			{
				this.__currentPhase = "primary";
				this.__handlePhase();
			}
			
			return this;
		},
		
		/**
		 *	Stops the scroll after the given phase ends.
		 *
		 *	@param interrupt	Optional. The step to interrupt after. Default is next.
		 *
		 *	@return Self
		 */
		stop: function (interrupt)
		{
			if (this.mustScroll)
			{
				this.__interrupt = interrupt || this.__currentPhase;
			}
			else
			{
				this.__complete();
			}
			
			return this;
		},
		
		//------------------------------
		//	 Internal Methods
		//------------------------------
		
		/**
		 *	Set the default margin.
		 */
		__setDefaultMargin: function ()
		{
			this.__element.css("margin" + this.__direction, this.margin);
		},
		
		/**
		 *	Complete the textscroll.
		 */
		__complete: function ()
		{
			this.__running = false;
			this.trigger("end");
			this.__setDefaultMargin();
		},
		
		/**
		 *	Handle the current phase.
		 */
		__handlePhase: function ()
		{
				/**
				 *	The distance to move the text.
				 */
			var distance,
				
				/**
				 *	The animation to do.
				 */
				animation = {},
				
				/**
				 *	This object.
				 */
				self = this,
				
				/**
				 *	The margin to use in computations.
				 */
				margin = "margin" + this.__direction,
				
				/**
				 *	The element offset.
				 */
				offset = Math.abs(parseInt(this.__element.css(margin), 10));
		
			switch (this.__currentPhase)
			{
			
			case "primary":
				distance = this.__dimensions.element + (offset * 2) - this.__dimensions.container;
				break;
				
			case "full":
				distance = this.__dimensions.container;
				break;
				
			case "marquee":
				distance = this.__dimensions.container - this.margin;
				break;
			
			default:
				throw new Error("textscroll.__handlePhase:__currentPhase");
			
			}
			
			animation[margin] = "-=" + distance;
			
			this.__element.animate(animation, this.speedCoefficient * distance, "linear", function ()
			{
				self.__phaseCleanup();
			});
		},
		
		/**
		 *	Cleanup after a phase completes.
		 */
		__phaseCleanup: function ()
		{
			if (this.__interrupt === this.__currentPhase)
			{
				this.__complete();
				return;
			}
			
			switch (this.__currentPhase)
			{
			
			case "primary":
				this.__currentPhase = "full";
				break;
				
			case "full":
				this.__element.css("margin" + this.__direction, this.__dimensions.container);
				this.__currentPhase = "marquee";
				break;
				
			case "marquee":
				this.__currentPhase = "primary";
				break;
			
			default:
				throw new Error("textscroll.__phaseCleanup:__currentPhase");
			
			}
			
			this.__handlePhase();
		}
	});
	
	//------------------------------
	//
	//	 Styles Declaration
	//
	//------------------------------
	
	KOI.createStylesheet(
	[
		".koi-textscroll-container { overflow: hidden; }",
		
		".koi-textscroll-content { white-space: nowrap; float: left; }"
	]);
			
}(jQuery));