( function( M ) {

	var View = M.require( 'View' ), LeadPhoto;

	/**
	 * @class LeadPhoto
	 * @extends View
	 */
	LeadPhoto = View.extend( {
		template: M.template.get( 'modules/uploads/LeadPhoto.hogan' ),

		animate: function() {
			this.$el.hide().slideDown();
		}
	} );

	M.define( 'modules/uploads/LeadPhoto', LeadPhoto );

}( mw.mobileFrontend ) );
