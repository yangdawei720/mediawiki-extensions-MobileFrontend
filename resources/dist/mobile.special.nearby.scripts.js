this.mfModules=this.mfModules||{},this.mfModules["mobile.special.nearby.scripts"]=(window.webpackJsonp=window.webpackJsonp||[]).push([[15],{"./src/mobile.special.nearby.scripts/LocationProvider.js":function(e,t,i){var r,n=i("./src/mobile.startup/Browser.js").getSingleton(),s=i("./src/mobile.startup/util.js");r={isAvailable:function(){return n.supportsGeoLocation()},getCurrentPosition:function(){var e=s.Deferred();return r.isAvailable()?navigator.geolocation.getCurrentPosition(function(t){e.resolve({latitude:t.coords.latitude,longitude:t.coords.longitude})},function(t){var i;switch(t.code){case t.PERMISSION_DENIED:i="permission";break;case t.TIMEOUT:i="timeout";break;case t.POSITION_UNAVAILABLE:i="location";break;default:i="unknown"}e.reject(i)},{timeout:1e4,enableHighAccuracy:!0}):e.reject("incompatible"),e}},e.exports=r},"./src/mobile.special.nearby.scripts/Nearby.js":function(e,t,i){var r=i("./src/mobile.startup/MessageBox.js"),n=i("./src/mobile.special.nearby.scripts/NearbyGateway.js"),s=i("./src/mobile.startup/util.js"),o=i("./src/mobile.startup/watchstar/WatchstarPageList.js");function a(e){var t=o;this.range=e.range||mw.config.get("wgMFNearbyRange")||1e3,this.source=e.source||"nearby",this.nearbyApi=new n({api:e.api}),this.eventBus=e.eventBus,e.errorType&&(e.errorOptions=this._errorOptions(e.errorType)),this.onItemClick=e.onItemClick,t.apply(this,arguments)}i("./src/mobile.startup/mfExtend.js")(a,o,{errorMessages:{empty:{heading:mw.msg("mobile-frontend-nearby-noresults"),hasHeading:!0,msg:mw.msg("mobile-frontend-nearby-noresults-guidance")},http:{heading:mw.msg("mobile-frontend-nearby-error"),hasHeading:!0,msg:mw.msg("mobile-frontend-nearby-error-guidance")},incompatible:{heading:mw.msg("mobile-frontend-nearby-requirements"),hasHeading:!0,msg:mw.msg("mobile-frontend-nearby-requirements-guidance")}},templatePartials:s.extend({},o.prototype.templatePartials,{pageList:o.prototype.template}),template:s.template("\n{{{spinner}}}\n{{>pageList}}\n\t"),defaults:s.extend({},o.prototype.defaults,{errorOptions:void 0}),_find:function(e){var t=s.Deferred(),i=this;function r(r){e.pages=r,r&&0===r.length&&(e.errorOptions=i._errorOptions("empty")),i._isLoading=!1,t.resolve(e)}function n(r){i._isLoading=!1,e.errorOptions=i._errorOptions(r),t.resolve(e)}return e.latitude&&e.longitude?this.nearbyApi.getPages({latitude:e.latitude,longitude:e.longitude},this.range,e.exclude).then(r,n):e.pageTitle?this.nearbyApi.getPagesAroundPage(e.pageTitle,this.range).then(r,n):(e.errorType&&(e.errorOptions=this._errorOptions(e.errorType)),t.resolve(e)),t},_errorOptions:function(e){var t=this.errorMessages[e]||this.errorMessages.http;return s.extend({className:"errorbox"},t)},postRender:function(){var e=this;this._isLoading||this.$el.find(".page-list").removeClass("hidden"),o.prototype.postRender.apply(this),this._postRenderLinks(),this.options.errorOptions&&new r(this.options.errorOptions).appendTo(this.$el),this.$el.find(function(){e.eventBus.emit("Nearby-postRender")})},_postRenderLinks:function(){var e=this;this.$el.find("a").each(function(t){e.$el.find(this).attr("id","nearby-page-list-item-"+t)}).on("click",this.onItemClick)},refresh:function(e){var t=this,i=o;if(this.$el.find(".page-list").addClass("hidden"),this._isLoading=!0,e.latitude&&e.longitude||e.pageTitle)return e.pages=[],this._find(e).then(function(e){i.call(t,e)},function(r){e.errorOptions=t._errorOptions(r),t._isLoading=!1,i.call(t,e)});throw new Error("No title or longitude, latitude options have been passed")}}),e.exports=a},"./src/mobile.special.nearby.scripts/NearbyGateway.js":function(e,t,i){var r=i("./src/mobile.startup/page/pageJSONParser.js"),n=mw.config.get("wgContentNamespaces"),s=i("./src/mobile.startup/util.js"),o=i("./src/mobile.startup/extendSearchParams.js");function a(e){this.api=e.api}a.prototype={_distanceMessage:function(e){if(e<1){if(e*=100,1e3!==(e=10*Math.ceil(e)))return mw.msg("mobile-frontend-nearby-distance-meters",mw.language.convertNumber(e));e=1}else e>2?(e*=10,e=(e=Math.ceil(e)/10).toFixed(1)):(e*=100,e=(e=Math.ceil(e)/100).toFixed(2));return mw.msg("mobile-frontend-nearby-distance",mw.language.convertNumber(e))},getPages:function(e,t,i){return this._search({ggscoord:[e.latitude,e.longitude]},t,i)},getPagesAroundPage:function(e,t){return this._search({ggspage:e},t,e)},_search:function(e,t,i){var a,c=s.Deferred(),l=this;return a=o("nearby",{colimit:"max",prop:["coordinates"],generator:"geosearch",ggsradius:t,ggsnamespace:n,ggslimit:50},e),e.ggscoord?a.codistancefrompoint=e.ggscoord:e.ggspage&&(a.codistancefrompage=e.ggspage),this.api.ajax(a).then(function(e){var t;(t=(t=e.query&&e.query.pages||[]).map(function(e,t){var n,s;return(s=r.parse(e)).anchor="item_"+t,e.coordinates?(n=e.coordinates[0],s.dist=n.dist/1e3,s.latitude=n.lat,s.longitude=n.lon,s.proximity=l._distanceMessage(s.dist)):s.dist=0,i!==e.title?s:null}).filter(function(e){return!!e})).sort(function(e,t){return e.dist>t.dist?1:-1}),c.resolve(t)},function(e){c.reject(e)}),c}},e.exports=a},"./src/mobile.special.nearby.scripts/mobile.special.nearby.scripts.js":function(e,t,i){var r,n=new mw.Api,s="Nearby-postRender",o=i("./src/mobile.special.nearby.scripts/LocationProvider.js"),a=i("./src/mobile.startup/loadingOverlay.js"),c=mw.loader.require("mediawiki.router"),l=i("./src/mobile.special.nearby.scripts/Nearby.js"),p=i("./src/mobile.startup/util.js"),d=$("#mf-nearby-info-holder"),u=new OO.EventEmitter,g={eventBus:u,el:$("#mw-mf-nearby"),funnel:"nearby",onItemClick:function(e){p.isModifiedEvent(e)||function(e){return e.match(/^(\/page|\/coord)/)}(c.getPath())||c.navigate($(this).attr("id"))}},m=a();function h(){d.remove(),$("body").removeClass("nearby-accept-pending")}function b(e){e=p.extend({},e,g),r||(r=new l(e),u.on(s,function(){var e,t=c.getPath();(function(e){return e&&-1===e.indexOf("/")})(t)&&(e=r.$el.find("#"+t))[0]&&e[0].nodeType&&$(window).scrollTop(e.offset().top),m.hide()})),r.refresh(e)}c.route(/^\/coord\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,function(e,t){g.latitude=e,g.longitude=t,h(),b(p.extend(g,{api:n}))}),c.route(/^\/page\/(.+)$/,function(e){h(),m.hide(),b(p.extend({},g,{api:n,pageTitle:mw.Uri.decode(e)}))}),c.checkRoute(),$("#showArticles").on("click",function(){m.show(),o.getCurrentPosition().then(function(e){c.navigate("#/coord/"+e.latitude+","+e.longitude)}).catch(function(e){switch(m.hide(),e){case"permission":alert(mw.msg("mobile-frontend-nearby-permission-denied"));break;case"location":alert(mw.msg("mobile-frontend-nearby-location-unavailable"))}})})}},[["./src/mobile.special.nearby.scripts/mobile.special.nearby.scripts.js",0,1]]]);
//# sourceMappingURL=mobile.special.nearby.scripts.js.map.json