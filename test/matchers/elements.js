/**
 * Determine if the given element is of the expected type.
 */
Screw.Matchers["be_element_type"] = {
	match: function (expected, actual) {
		if (actual instanceof jQuery) {
			actual = actual[0];
		}

		return expected.toUpperCase() === actual.nodeName.toUpperCase();
	},
	
	failure_message: function (expected, actual, not) {
		return 'expected ' + $.print(actual) + (not ? ' to not be of type ' : ' to be of type ') + $.print(expected);
	}
};
/**
 * Determine if the given element has the expected id.
 */
Screw.Matchers["have_id"] = {
	match: function (expected, actual) {
		return expected === actual.attr("id");
	},
	
	failure_message: function (expected, actual, not) {
		return 'expected ' + $.print(actual) + (not ? ' to not have id ' : ' to have id ') + $.print(expected);
	}
};
/**
 * Determine if the given element has the expected classes.
 */
Screw.Matchers["have_classes"] = {
	match: function (expected, actual) {
		if (!$.isArray(expected)) {
			expected = [expected];
		}
	
		var hasAllClasses = true;
		
		$.each(expected, function (index, className) {
			if (!actual.hasClass(className)) {
				hasAllClasses = false;
				return false;
			}
		});
	
		return hasAllClasses;
	},
	
	failure_message: function (expected, actual, not) {
		return 'expected ' + $.print(actual) + (not ? ' to not have classes ' : ' to have classes ') + $.print(expected);
	}
};
/**
 * Determine if the given element contains the expected text.
 */
Screw.Matchers["contain_text"] = {
	match: function (expected, actual) {
		return actual.is(":contains(" + expected + ")");
	},
	
	failure_message: function (expected, actual, not) {
		return 'expected ' + $.print(actual) + (not ? ' to not contain text ' : ' to contain text ') + $.print(expected);
	}
};
