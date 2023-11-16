<?php

namespace MobileFrontend\Transforms;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;
use Exception;
use Html;
use MediaWiki\ResourceLoader\ResourceLoader;
use Wikimedia\Parsoid\Utils\DOMCompat;

/**
 * Implements IMobileTransform, that splits the body of the document into
 * sections demarcated by the $headings elements. Also moves the first paragraph
 * in the lead section above the infobox.
 *
 * All member elements of the sections are added to a <code><div></code> so
 * that the section bodies are clearly defined (to be "expandable" for
 * example).
 *
 * @see IMobileTransform
 */
class MakeSectionsTransform implements IMobileTransform {

	/**
	 * Class name for collapsible section wrappers
	 */
	public const STYLE_COLLAPSIBLE_SECTION_CLASS = 'collapsible-block';

	/**
	 * Whether scripts can be added in the output.
	 * @var bool
	 */
	private $scriptsEnabled;

	/**
	 * List of tags that could be considered as section headers.
	 * @var array
	 */
	private $topHeadingTags;

	/**
	 *
	 * @param array $topHeadingTags list of tags could ne cosidered as sections
	 * @param bool $scriptsEnabled wheather scripts are enabled
	 */
	public function __construct(
		array $topHeadingTags,
		bool $scriptsEnabled
	) {
		$this->topHeadingTags = $topHeadingTags;
		$this->scriptsEnabled = $scriptsEnabled;
	}

	/**
	 * @param DOMNode|null $node
	 * @return string|false Heading tag name if the node is a heading
	 */
	private function getHeadingName( $node ) {
		if ( !( $node instanceof DOMElement ) ) {
			return false;
		}
		// We accept both kinds of nodes that can be returned by getTopHeadings():
		// a `<h1>` to `<h6>` node, or a `<div class="mw-heading">` node wrapping it.
		// In the future `<div class="mw-heading">` will be required (T13555).
		if ( DOMCompat::getClassList( $node )->contains( 'mw-heading' ) ) {
			$node = DOMCompat::querySelector( $node, implode( ',', $this->topHeadingTags ) );
			if ( !( $node instanceof DOMElement ) ) {
				return false;
			}
		}
		return $node->tagName;
	}

	/**
	 * Actually splits the body of the document into sections
	 *
	 * @param DOMElement $body representing the HTML of the current article. In the HTML the sections
	 *  should not be wrapped.
	 * @param DOMElement[] $headingWrappers The headings (or wrappers) returned by getTopHeadings():
	 *  `<h1>` to `<h6>` nodes, or `<div class="mw-heading">` nodes wrapping them.
	 *  In the future `<div class="mw-heading">` will be required (T13555).
	 */
	private function makeSections( DOMElement $body, array $headingWrappers ) {
		$ownerDocument = $body->ownerDocument;
		if ( $ownerDocument === null ) {
			return;
		}
		// Find the parser output wrapper div
		$xpath = new DOMXPath( $ownerDocument );
		$containers = $xpath->query(
			// Equivalent of CSS attribute `~=` to support multiple classes
			'body/div[contains(concat(" ",normalize-space(@class)," ")," mw-parser-output ")][1]'
		);
		if ( !$containers->length ) {
			// No wrapper? This could be an old parser cache entry, or perhaps the
			// OutputPage contained something that was not generated by the parser.
			// Try using the <body> as the container.
			$containers = $xpath->query( 'body' );
			if ( !$containers->length ) {
				throw new Exception( "HTML lacked body element even though we put it there ourselves" );
			}
		}

		$container = $containers->item( 0 );
		$containerChild = $container->firstChild;
		$firstHeading = reset( $headingWrappers );
		$firstHeadingName = $this->getHeadingName( $firstHeading );
		$sectionNumber = 0;
		$sectionBody = $this->createSectionBodyElement( $ownerDocument, $sectionNumber, false );

		while ( $containerChild ) {
			$node = $containerChild;
			$containerChild = $containerChild->nextSibling;

			// If we've found a top level heading, insert the previous section if
			// necessary and clear the container div.
			if ( $firstHeadingName && $this->getHeadingName( $node ) === $firstHeadingName ) {
				// The heading we are transforming is always 1 section ahead of the
				// section we are currently processing
				/** @phan-suppress-next-line PhanTypeMismatchArgumentSuperType DOMNode vs. DOMElement */
				$this->prepareHeading( $ownerDocument, $node, $sectionNumber + 1, $this->scriptsEnabled );
				// Insert the previous section body and reset it for the new section
				$container->insertBefore( $sectionBody, $node );

				$sectionNumber += 1;
				$sectionBody = $this->createSectionBodyElement(
					$ownerDocument,
					$sectionNumber,
					$this->scriptsEnabled
				);
				continue;
			}

			// If it is not a top level heading, keep appending the nodes to the
			// section body container.
			$sectionBody->appendChild( $node );
		}

		// Append the last section body.
		$container->appendChild( $sectionBody );
	}

	/**
	 * Prepare section headings, add required classes and onclick actions
	 *
	 * @param DOMDocument $doc
	 * @param DOMElement $heading
	 * @param int $sectionNumber
	 * @param bool $isCollapsible
	 */
	private function prepareHeading(
		DOMDocument $doc, DOMElement $heading, $sectionNumber, $isCollapsible
	) {
		$className = $heading->hasAttribute( 'class' ) ? $heading->getAttribute( 'class' ) . ' ' : '';
		$heading->setAttribute( 'class', $className . 'section-heading' );
		if ( $isCollapsible ) {
			$heading->setAttribute( 'onclick', 'mfTempOpenSection(' . $sectionNumber . ')' );
		}

		// prepend indicator - this avoids a reflow by creating a placeholder for a toggling indicator
		$indicator = $doc->createElement( 'span' );
		$indicator->setAttribute( 'class', 'indicator mf-icon mf-icon-expand mf-icon--small' );
		$heading->insertBefore( $indicator, $heading->firstChild ?? $heading );
	}

	/**
	 * Creates a Section body element
	 *
	 * @param DOMDocument $doc
	 * @param int $sectionNumber
	 * @param bool $isCollapsible
	 *
	 * @return DOMElement
	 */
	private function createSectionBodyElement( DOMDocument $doc, $sectionNumber, $isCollapsible ) {
		$sectionClass = 'mf-section-' . $sectionNumber;
		if ( $isCollapsible ) {
			// TODO: Probably good to rename this to the more generic 'section'.
			// We have no idea how the skin will use this.
			$sectionClass .= ' ' . self::STYLE_COLLAPSIBLE_SECTION_CLASS;
		}

		// FIXME: The class `/mf\-section\-[0-9]+/` is kept for caching reasons
		// but given class is unique usage is discouraged. [T126825]
		$sectionBody = $doc->createElement( 'section' );
		$sectionBody->setAttribute( 'class', $sectionClass );
		$sectionBody->setAttribute( 'id', 'mf-section-' . $sectionNumber );
		return $sectionBody;
	}

	/**
	 * Gets top headings in the document.
	 *
	 * Note well that the rank order is defined by the
	 * <code>MobileFormatter#topHeadingTags</code> property.
	 *
	 * @param DOMElement $doc
	 * @return array An array first is the highest rank headings
	 */
	private function getTopHeadings( DOMElement $doc ): array {
		$headings = [];

		foreach ( $this->topHeadingTags as $tagName ) {
			$allTags = DOMCompat::querySelectorAll( $doc, $tagName );

			foreach ( $allTags as $el ) {
				$parent = $el->parentNode;
				if ( !( $parent instanceof DOMElement ) ) {
					continue;
				}
				// Use the `<div class="mw-heading">` wrapper if it is present. When they are required
				// (T13555), the querySelectorAll() above can use the class and this can be removed.
				if ( DOMCompat::getClassList( $parent )->contains( 'mw-heading' ) ) {
					$el = $parent;
				}
				// This check can be removed too when we require the wrappers.
				if ( $parent->getAttribute( 'class' ) !== 'toctitle' ) {
					$headings[] = $el;
				}
			}
			if ( $headings ) {
				return $headings;
			}

		}

		return $headings;
	}

	/**
	 * Make it possible to open sections while JavaScript is still loading.
	 *
	 * @return string The JavaScript code to add event handlers to the skin
	 */
	public static function interimTogglingSupport() {
		$js = <<<JAVASCRIPT
function mfTempOpenSection( id ) {
	var block = document.getElementById( "mf-section-" + id );
	block.className += " open-block";
	// The previous sibling to the content block is guaranteed to be the
	// associated heading due to mobileformatter. We need to add the same
	// class to flip the collapse arrow icon.
	// <h[1-6]>heading</h[1-6]><div id="mf-section-[1-9]+"></div>
	block.previousSibling.className += " open-block";
}
JAVASCRIPT;
		return Html::inlineScript(
			ResourceLoader::filter( 'minify-js', $js )
		);
	}

	/**
	 * Performs html transformation that splits the body of the document into
	 * sections demarcated by the $headings elements. Also moves the first paragraph
	 * in the lead section above the infobox.
	 * @param DOMElement $doc html document
	 */
	public function apply( DOMElement $doc ) {
		$this->makeSections( $doc, $this->getTopHeadings( $doc ) );
	}
}
