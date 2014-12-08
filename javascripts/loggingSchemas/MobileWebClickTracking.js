/**
 * Utility library for tracking clicks on certain elements
 * @class MobileWebClickTracking
 */
( function ( M, $ ) {
	var s = M.require( 'settings' );

	/**
	 * Check whether 'schema' is one of the predefined schemas.
	 * @param {string} [schema] name. Possible values are:
	 *   * Watchlist
	 *   * Diff
	 *   * MainMenu
	 *   * UI
	 */
	function assertSchema( schema ) {
		var schemas = [ 'Watchlist', 'Diff', 'MainMenu', 'UI' ];

		if ( $.inArray( schema, schemas ) === -1 ) {
			throw new Error(
				'Invalid schema "' + schema + '". ' +
				'Possible values are: "' + schemas.join( '", "' ) + '".'
			);
		}
	}

	/**
	 * Track an event and record it. Throw an error if schema is not
	 * one of the predefined values.
	 *
	 * @method
	 * @param {string} [schema] name. Possible values are:
	 *   * Watchlist
	 *   * Diff
	 *   * MainMenu
	 *   * UI
	 * @param {string} name of click tracking event to log
	 * @param {string} [destination] of the link that has been clicked if applicable.
	 */
	function log( schema, name, destination ) {
		assertSchema( schema );
		var user = M.require( 'user' ),
			username = user.getName(),
			data = {
				name: name,
				destination: destination,
				mobileMode: M.getMode()
			};

		if ( username ) {
			data.username = username;
			data.userEditCount = mw.config.get( 'wgUserEditCount' );
		}
		return M.log( 'MobileWeb' + schema + 'ClickTracking', data );
	}

	/*
	 * Using localStorage track an event but delay recording it on the
	 * server until the next page load. Throw an error if schema is not
	 * one of the predefined values.
	 *
	 * @method
	 * @param {string} [schema] name. Possible values are:
	 *   * Watchlist
	 *   * Diff
	 *   * MainMenu
	 *   * UI
	 * @param {string} name of click tracking event to log
	 * @param {string} href the link that has been clicked.
	 */
	function futureLog( schema, name, href ) {
		assertSchema( schema );
		s.save( 'MobileWebClickTracking-schema', schema );
		s.save( 'MobileWebClickTracking-name', name );
		s.save( 'MobileWebClickTracking-href', href );
	}

	/**
	 * Record a click to a link in the schema. Throw an error if schema is not
	 * one of the predefined values.
	 *
	 * @method
	 * @param {string} [schema] name. Possible values are:
	 *   * Watchlist
	 *   * Diff
	 *   * MainMenu
	 *   * UI
	 * @param {string} selector of element
	 * @param {string} name unique to this click tracking event that will allow
	 * you to distinguish it from others.
	 */
	function hijackLink( schema, selector, name ) {
		assertSchema( schema );
		$( selector ).on( 'click', function () {
			futureLog( schema, name, $( this ).attr( 'href' ) );
		} );
	}

	/**
	 * Log a past click tracking event to the server.
	 *
	 * @method
	 */
	function logPastEvent() {
		var schema = s.get( 'MobileWebClickTracking-schema' ),
			name = s.get( 'MobileWebClickTracking-name' ),
			href = s.get( 'MobileWebClickTracking-href' );

		// Make sure they do not log a second time...
		if ( schema && name && href ) {
			s.remove( 'MobileWebClickTracking-schema' );
			s.remove( 'MobileWebClickTracking-name' );
			s.remove( 'MobileWebClickTracking-href' );
			// Since MobileWebEditing schema declares the dependencies to
			// EventLogging and the schema we can be confident this will always log.
			log( schema, name, href );
		}
	}

	M.define( 'loggingSchemas/MobileWebClickTracking', {
		log: log,
		logPastEvent: logPastEvent,
		hijackLink: hijackLink
	} );
} )( mw.mobileFrontend, jQuery );
