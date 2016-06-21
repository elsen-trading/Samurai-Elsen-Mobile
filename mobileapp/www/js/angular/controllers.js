
angular.module('elsen.controllers', ['ui.bootstrap'])

//
// sample for tagEvent
//  LocalyticsService.tagEvent( 'action-complete',  _user.age, _user.gender, _user.score, 0 );
//

//
// walkthrough-login controller
.controller('WalkthroughCtrl', function( $scope, $rootScope, $timeout, $state, $http, $ionicSlideBoxDelegate, AuthService, MessageService, LocalyticsService ){
	
	// track screen
	//LocalyticsService.tagScreen( 'walkthrough' );
	
	//
	// NOTES:
	//
	//

	window.localStorage.setItem( 'token',			JSON.stringify( 0 ) );	
	window.localStorage.setItem( 'badge',			JSON.stringify( 0 ) );
	window.localStorage.setItem( 'holdings',		JSON.stringify( [] ) );
	window.localStorage.setItem( 'notifications',	JSON.stringify( [] ) );
	window.localStorage.setItem( 'executions',		JSON.stringify( [] ) );
	
	
	// Called to navigate to the main app
	$scope.startApp = function() {
		$state.go('main');
	};
	
	//
	// in case we want buttons to drive the slidebox movement -- use these functions
	$scope.next = function() {
		$ionicSlideBoxDelegate.next();
	};
	$scope.previous = function() {
		$ionicSlideBoxDelegate.previous();
	};
	
	//
	// we have two footers depending on where in the slidebox the user is at
	//	this helps us to keep track of them and adjust the visibility accordingly
	$scope.activeFooter = 'f1';
	
	// Called each time the slide changes
	$scope.slideChanged = function(index) {
		$scope.slideIndex = index;
		
		if ( index == 4 ){
			$scope.activeFooter = 'f2';
		} else {
			$scope.activeFooter = 'f1'
		}
		
		// track screen
		LocalyticsService.tagScreen( 'walkthrough_' + index );
		
	};
	
	//
	// buttons to help the user navigate on the slide box
	$scope.toLogin = function(){
		$scope.$broadcast('slideBox.setSlide', 4 );
	}

	$scope.toSignup = function(){
		$state.go('signup');
	}
	
	//
	// if coming from another page auto jump to login
	//	- so only during first load does user start at beginning of walkthrough
	$scope.$on('$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams ){
		if ( toState.name == 'walkthrough' && fromState.name !== '' ){
			$timeout( function() {
				$scope.$broadcast('slideBox.setSlide', 4 );
			}, 5);
		}
	});
	
	//
	// randomly select a cute message from the server for the user to see on the landing page
	$scope.welcome = 'Elsen is ready.';
	MessageService.getMessage().then( function( _msg ){
		$scope.welcome = _msg;
	});

	// 
	// elsen server API logic
	//
	var serverAuth	= function( options ){
	
		// send the user to the accessToken page
		//	on the page we will check their credentials
		//	give them a token if they already have one
		//	or create them a new token
		//
		
		AuthService.login( options ).then( function( _res ){
		
			if ( _res.status == 200 ){
				
				window.localStorage.setItem( 'token', _res.token );
				
				if ( _res.missing == true ){
				
					// credentials are fine but account not ready for mobile
					$state.go( 'tab.missing' );
					
				} else {
					
					// user is good
					//	 let's give'm a little portfolio action
					$state.go( 'tab.portfolio' );
					
				}
				
			} else {
				
				// record user action
				LocalyticsService.tagScreen( 'login_error' );
				
				// error -- tell the user
				$scope.successText	= undefined;
				$scope.errorText	= _res.message;
				
			}
		
		});
		
	};
	

	//
	// manual login
	//	equivalent to our local-login on the website
	//
	$scope.login = function( user ){

		if ( user == undefined || user.email == undefined || user.password == undefined ){
			$scope.successText	= undefined;
			$scope.errorText	= 'Missing some fields...'
			
		} else {
			// Check the user with elsen to ensure they are allowed access
			serverAuth({
				username:		user.email,
				password:		user.password,
				client_type:	'null',
				client_id:		'null'
			})
			
		}			
	};
	
	
	//
	// handle the social (3rd party) methods for authentication
	//	- auth user with 3rd party
	//	- get user's 3rd party id
	//	- check 3rd party id against our system
	//		- respond access or error
	//
	// NOTE:
	//	this is potentially very insecure - need to move steps 1 to server to prevent hacking
	// 
	
	//
	// Starting point for google oauth2, used as base for other conns:
	//	https://github.com/mdellanoce/google-api-oauth-phonegap/blob/master/www/js/index.js
	//	http://phonegap-tips.com/articles/installing-plugins-with-phonegaps-command-line-interface.HTMLElement
	//
	//
	// google
	//	https://developers.google.com/+/api/oauth
	//	https://developers.google.com/+/web/api/javascript
	//
	// facebook
	//	https://developers.facebook.com/docs/facebook-login/access-tokens
	//
	// linkedin
	//	https://developer.linkedin.com/documents/authentication
	//	
	//	NOTE: linkedin creates a unique user id based on each app key - secret key combination
	//
	// twitter
	//	twitter uses oauth so it is completely different
	//
		
	var googleAPI	= {
	
		setToken:	function( data ){
			
			// Cache the token
			localStorage.google_access_token = data.access_token;
			
			// Cache the refresh token, if there is one
			localStorage.google_refresh_token = data.refresh_token || localStorage.google_refresh_token;
			
			// Figure out when the token will expire by using the current
			//	time, plus the valid time (in seconds), minus a 1 minute buffer
			var expiresAt = new Date().getTime() + parseInt(data.expires_in, 10) * 1000 - 60000;
			localStorage.google_expires_at = expiresAt;
			
		},
		authorize:	function( options ){
			var deferred = $.Deferred();
			
			//Build the OAuth consent page URL
			var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
				client_id:		options.client_id,
				redirect_uri:	options.redirect_uri,
				response_type:	'code',
				scope:			options.scope
			});
			
			// Open the OAuth consent page in the InAppBrowser
			var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');
			
			//
			// The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
			//	which sets the authorization code in the browser's title. However, we can't
			//	access the title of the InAppBrowser.
			//
			// Instead, we pass a bogus redirect_uri of "http://localhost", which means the
			//	authorization code will get set in the url. We can access the url in the
			//	loadstart and loadstop events. So if we bind the loadstart event, we can
			//	find the authorization code and close the InAppBrowser after the user
			//	has granted us access to their data.
			//
			
			$(authWindow).on('loadstart', function(e) {
				var url = e.originalEvent.url;
				var code = /\?code=(.+)$/.exec(url);
				var error = /\?error=(.+)$/.exec(url);
				
				if ( code || error ){
					
					//Always close the browser when match is found
					authWindow.close();
					
				}
				
				if ( code ){
				
					// Exchange the authorization code for an access token
					$.post('https://accounts.google.com/o/oauth2/token', {
						
						code:			code[1],
						client_id:		options.client_id,
						client_secret:	options.client_secret,
						redirect_uri:	options.redirect_uri,
						grant_type:		'authorization_code'
						
					}).done(function( data ){
						
						googleAPI.setToken( data );
						deferred.resolve( data );
						
					}).fail(function( response ){
						
						deferred.reject( response.responseJSON );
						
					});
					
				} else if ( error ){
				
					//The user denied access to the app
					deferred.reject({
						error: error[1]
					});
					
				}
			});
			
			return deferred.promise();
		},
		getToken:	function( options ){
			var deferred = $.Deferred();
			
			if (new Date().getTime() < localStorage.google_expires_at) {
				
				deferred.resolve({
					access_token: localStorage.google_access_token
				});
				
			} else if ( localStorage.google_refresh_token ){
				$.post('https://accounts.google.com/o/oauth2/token', {
					
					refresh_token:	localStorage.google_refresh_token,
					client_id:		options.client_id,
					client_secret:	options.client_secret,
					grant_type:		'refresh_token'
					
				}).done(function( data ){
				
					googleAPI.setToken( data );
					deferred.resolve( data );
					
				}).fail(function( response ){
					
					deferred.reject(response.responseJSON);
					
				});
			} else {
				deferred.reject();
			}
			
			return deferred.promise();
		},
		userInfo:	function( options ){
			return $.getJSON('https://www.googleapis.com/oauth2/v1/userinfo', options);
		}
		
	};
		
	var facebookAPI	= {
	
		setToken:	function( data ){
			
			// Cache the token
			localStorage.facebook_access_token = data.access_token;
			
			// Cache the refresh token, if there is one
			// localStorage.facebook_refresh_token = data.refresh_token || localStorage.facebook_refresh_token;
			
			// Set the expiration time
			localStorage.facebook_expires_at = data.expires_at;
			
		},
	    authorize:	function( options ){
	    
	        var deferred = $.Deferred();
	
	        //Build the OAuth consent page URL
	        var authUrl	= 'https://www.facebook.com/dialog/oauth?' + $.param({
	            client_id:		options.client_id,
	            redirect_uri:	options.redirect_uri,
	            response_type:	'code'
	        });
	
	        //Open the OAuth consent page in the InAppBrowser
	        var authWindow = window.open(authUrl, '_blank', 'location=yes,toolbar=yes');
	
			//
	        // The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
	        //	which sets the authorization code in the browser's title. However, we can't
	        //	access the title of the InAppBrowser.
	        //
	        // Instead, we pass a bogus redirect_uri of "http://localhost", which means the
	        //	authorization code will get set in the url. We can access the url in the
	        //	loadstart and loadstop events. So if we bind the loadstart event, we can
	        //	find the authorization code and close the InAppBrowser after the user
	        //	has granted us access to their data.
	        //
	        
	        $(authWindow).on('loadstart', function( e ){
	            var url		= e.originalEvent.url;
	            var code	= /\?code=(.+)$/.exec(url);
	            var error	= /\?error=(.+)$/.exec(url);
	            
	            if ( code || error ){
	                //Always close the browser when match is found
	                authWindow.close();
	            }
	
	            if ( code ){
	            
	            	//alert( code );
	            	//$scope.facebookStatus = code;
	            	//$scope.$apply();
	            	
	                // Exchange the authorization code for an access token
	                $.post('https://graph.facebook.com/oauth/access_token', {
	                    
	                    code:			code[1],
	                    client_id:		options.client_id,
	                    client_secret:	options.client_secret,
	                    redirect_uri:	options.redirect_uri
	                    
	                }).done(function( data ){
	                
	                    deferred.resolve( data );
	                    
	                }).fail(function( response ){
	                
	                    deferred.reject( response.responseJSON );
	                    
	                });
	                
	            } else if ( error ){
	                //The user denied access to the app
	                deferred.reject({
	                    error: error[1]
	                });
	            }
	        });
	        
	        return deferred.promise();
	        
	    },
	    getToken:	function( options ){
		    
	    },
	    userInfo:	function( options ){
	    	
	        var deferred = $.Deferred();
	        
            // Exchange the authorization code for an access token
            $.get('https://graph.facebook.com/debug_token', {
                
                input_token:	options.input_token,
                access_token:	options.access_token
                
            }).done(function( data ){
            
                deferred.resolve( data );
                
            }).fail(function( response ){
            
                deferred.reject( response.responseJSON );
                
            });
	        
	        return deferred.promise();
	    	
	    },
	    splash:		function( options ){
		   
	        var deferred = $.Deferred();
	        
            // Exchange the authorization code for an access token
            $.get('http://appdev.splashscore.com:8080/auth/fb', {
            
                access_token:	options.access_token
                
            }).done(function( res, status, xhr ){
            
/*
            	alert( res );
            	alert( status );
            	alert( xhr );
*/
				
				//$scope.errorStatus = xhr.getAllResponseHeaders().toLowerCase();
					
				// returns user
            	// $scope.errorStatus = xhr.getResponseHeader('Set-Cookie');
            	
            	
            	
            	$scope.errorStatus = xhr.getAllResponseHeaders().toLowerCase();
            	
                deferred.resolve( res );
                
            }).fail(function( response ){
            
                deferred.reject( response.responseJSON );
                
            });
	        
	        return deferred.promise();
		    
	    }
	    
	};
	
	var linkedinAPI = {
		
		setToken:	function( data ){
			
			// Cache the token
			localStorage.linkedin_access_token = data.access_token;
			
			// Cache the refresh token, if there is one
			// localStorage.linkedin_refresh_token = data.refresh_token || localStorage.linkedin_refresh_token;
			
			// Set the expiration time
			localStorage.linkedin_expires_at = data.expires_at;
			
		},
		authorize:	function( options ){
		
			var deferred = $.Deferred();
	
			//Build the OAuth consent page URL
			var authUrl	= 'https://www.linkedin.com/uas/oauth2/authorization?' + $.param({
				response_type:	'code',
				client_id:		options.api_key,
				scope:			options.scope,
				state:			options.state,
				redirect_uri:	options.redirect_uri
			});
			
			//Open the OAuth consent page in the InAppBrowser
			var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');
	
			//
			// The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
			//	which sets the authorization code in the browser's title. However, we can't
			//	access the title of the InAppBrowser.
			//
			// Instead, we pass a bogus redirect_uri of "http://localhost", which means the
			//	authorization code will get set in the url. We can access the url in the
			//	loadstart and loadstop events. So if we bind the loadstart event, we can
			//	find the authorization code and close the InAppBrowser after the user
			//	has granted us access to their data.
			//
			
			$(authWindow).on('loadstart', function( e ){
				var url		= e.originalEvent.url;
				var code	= /\?code=(.+)$/.exec(url);
				var error	= /\?error=(.+)$/.exec(url);
				
				if ( code || error ){
					//Always close the browser when match is found
					authWindow.close();
				}
				
				if ( code ){
				
					// Exchange the authorization code for an access token
					$.post('https://www.linkedin.com/uas/oauth2/accessToken', {
					
						grant_type:		'authorization_code',
						code:			code[1].split('&')[0],
						client_id:		options.api_key,
						client_secret:	options.secret_key,
						redirect_uri:	options.redirect_uri
						
					}).done(function( data ){
					
				$scope.errorStatus = data.access_token;
				$scope.$apply();
					
						deferred.resolve( data );
						
					}).fail(function( response ){
					
						deferred.reject( response.responseJSON );
						
					});
				} else if ( error ){
					//The user denied access to the app
					deferred.reject({
						error: error[1]
					});
				}
			});
			
			return deferred.promise();
			
		},
		getToken:	function( options ){
		    
	    },
		userInfo:	function( options ){
		
			var deferred = $.Deferred();
			
			// Exchange the authorization code for an access token
			$.get('https://api.linkedin.com/v1/people/~:(id)', {
			
				oauth2_access_token:	options.access_token,
				format:					'json'
				
			}).done(function( data ){
							
				deferred.resolve( data );
				
			}).fail(function( error ){
			
				deferred.reject( error[1] );
				
			});
			
			return deferred.promise();
			
		}
		
	};
	
	$scope.googleLogin		= function(){
		
		// record user action
		LocalyticsService.tagScreen( 'login_attempt_google' );
		
        //Show the consent page
        googleAPI.authorize({
            
            client_id:		GOOGLE_CLIENT_ID,
            client_secret:	GOOGLE_CLIENT_SECRET,
            redirect_uri:	GOOGLE_REDIRECT_URI,
            scope:			GOOGLE_SCOPE
            
        }).done(function(){
        
			// Get the token, either from the cache
			//	or by using the refresh token.
			googleAPI.getToken({
								
				client_id:		GOOGLE_CLIENT_ID,
				client_secret:	GOOGLE_CLIENT_SECRET
				
			}).then(function( data ){
				
				// Pass the token to the API call and return a new promise object
				return googleAPI.userInfo({ access_token: data.access_token });
				
			}).done(function( user ){
				
				// Check the user with elsen to ensure they are allowed access
				serverAuth({
					username:		'null',
					password:		'null',
					client_type:	'google',
					client_id:		user.id
				});
				
			}).fail(function(){
				
				// If getting the token fails, or the token has been
				// revoked, show the login view.
				$scope.errorText = 'Something is wrong.';
				$scope.$apply();
				
			});

        }).fail(function( data ){
			
			$scope.googleStatus = data.error;
			$scope.$apply();
			
        });
        			
	};
	
	$scope.facebookLogin	= function(){
		
		// record user action
		LocalyticsService.tagScreen( 'login_attempt_facebook' );
		
		facebookAPI.authorize({
		
			client_id:		FACEBOOK_APP_ID,
			client_secret:	FACEBOOK_APP_SECRET,
            redirect_uri:	'http://localhost/'
			
		}).done(function( data ){
		
			// Get the token, either from the cache
			//	or by using the refresh token.
			
			localStorage.facebook_access_token = data.split('&')[0].split('=')[1];
						
			facebookAPI.userInfo({
			
				input_token:	data.split('&')[0].split('=')[1],
				access_token:	data.split('&')[0].split('=')[1]
				
			}).done(function( user ){
			
				// Check the user with elsen to ensure they are allowed access
				serverAuth({
					username:		'null',
					password:		'null',
					client_type:	'facebook',
					client_id:		user.data.user_id
				});

				
			}).fail(function( data ){
			
				// If getting the token fails, or the token has been
				// revoked, show the login view.
				$scope.facebookStatus = 'Error (2): ' + data.error.message;
				$scope.$apply();
				
			});
			
		}).fail(function( data ){

			$scope.facebookStatus = 'Error (1): ' + data.error;
			$scope.$apply();
			
		});
		
	};
	
	$scope.linkedinLogin	= function(){

		// record user action
		LocalyticsService.tagScreen( 'login_attempt_linkedin' );
		
		linkedinAPI.authorize({
		
			api_key:		LINKEDIN_API_KEY,
			secret_key:		LINKEDIN_SECRET_KEY,
			redirect_uri:	LINKEDIN_REDIRECT_URI,
			scope:			LINKEDIN_SCOPE,
			state:			LINKEDIN_STATE
			
		}).done(function( data ){
		
			// Get the token, either from the cache
			//	or by using the refresh token.
						
			localStorage.linkedin_access_token = data.access_token;
			
			linkedinAPI.userInfo({
			
				access_token:	data.access_token
				
			}).done(function( user ){
			
				// Check the user with elsen to ensure they are allowed access
				serverAuth({
					username:		'null',
					password:		'null',
					client_type:	'linkedin',
					client_id:		user.id
				});
				
			}).fail(function( data ){
						
				// If getting the token fails, or the token has been
				// revoked, show the login view.
				$scope.errorStatus = 'Error (2): ' + data.error_description;
				$scope.$apply();
				
			});
			
		}).fail(function( data ){

			$scope.errorStatus = 'Error (1): ' + data.error_description;
			$scope.$apply();
			
		});
		
	};
	
})


//
// forgot password controller
.controller('ForgotCtrl', function( $scope, $state, AuthService, LocalyticsService ){

	// record user action
	LocalyticsService.tagScreen( 'forgot' );

	//
	//
	//
	
	$scope.forgot = function( user ){
	
		AuthService.forgot( user ).then( function( _res ){
			
			if ( _res.status == 200 ){
			
				// record user action
				LocalyticsService.tagScreen( 'forgot_sucess' );
			
				$scope.errorText	= undefined;
				$scope.successText	= _res.message;
				
			} else {
			
				// record user action
				LocalyticsService.tagScreen( 'forgot_error' );
			
				$scope.successText	= undefined;
				$scope.errorText	= _res.message;
			}
			
		})
		
	};

})


//
// signup controller
.controller('SignupCtrl', function( $scope, $state, AuthService, LocalyticsService ){

	// record user action
	LocalyticsService.tagScreen( 'signup' );

	//
	//
	//

	$scope.signup = function( user ){
	
		AuthService.signup( user ).then( function( _res ){
			
			if ( _res.status == 200 ){
				
				// record user action
				LocalyticsService.tagScreen( 'signup_success' );
				
				$scope.errorText	= undefined;
				$scope.successText	= _res.message;
				
				// need to now request an access token based on the user's new registered credentials
				AuthService.login( user ).then( function( _res ){
				
					window.localStorage.setItem( 'token', _res.token );
					
					if ( _res.missing == true ){
		
						// credentials are fine but account not ready for mobile
						$state.go( 'missing' );
						
					} else {
						
						// user is good
						//	 let's give'm a little portfolio action
						$state.go( 'tab.portfolio' );
						
					}
				});
						
			} else {
			
				// record user action
				LocalyticsService.tagScreen( 'signup_error' );
				
				$scope.successText	= undefined;
				$scope.errorText	= _res.message;
			}
			
		})

	};

})


//
// missing stuff controller
//	when the user's account has not been set up properly we send them here
.controller('MissingCtrl', function( $scope, AccountService, LocalyticsService ){
	
	// record user action
	LocalyticsService.tagScreen( 'missing' );
	
})


//
// tab controller
//	this controls the tabs and sidebar
.controller('TabCtrl', function( $scope, $state, $rootScope, $ionicSideMenuDelegate, $http, AccountService ){

	//
	// ensure we have the most up to date info about the user
	//
	AccountService.checkAvailable().then( function(){
		
		if ( $rootScope.missing == false ){
			AccountService.getUser().then( function( _user ){
				$scope.hasLive	= _user.strategy.live;
				$scope.user		= _user;
			});
		}
		
	});
	
	//
	// toggle the sidebar
	//
	
	$scope.toggleRightSideMenu = function() {
		$ionicSideMenuDelegate.toggleRight();
	};

	
	//
	// the user is trying to update their notifications settings
	//	pull the gid and toggle their live status
	// 
	
	$scope.adjustNotificationSettings = function( _liveStatus ){
	
		//
		// toggle live status
		// update user balance
		//
		
		//
		// other vars we need
		_aid = $scope.user.account.accountid;
		_gid = $scope.user.strategy.gid;
		
		//
		// toggle live status
		AccountService.toggleLiveStatus( _gid, _liveStatus ).then( function( _res ){
			
			if ( _res == 200 ){
				// if success, switch hasLive
				$scope.hasLive	= !$scope.hasLive
			} else {
				// alert the user
			}
			
		});
		
		//
		// update user balance
		AccountService.updateAccountBalance( _aid ).then( function(){});
			
	};
	
	$scope.logout = function(){
	
		window.localStorage.removeItem( 'user' );
		window.localStorage.removeItem( 'token' );
		window.localStorage.removeItem( 'activity' );
		window.localStorage.removeItem( 'badge' );
		window.localStorage.removeItem( 'companies' );
		window.localStorage.removeItem( 'executions' );
		window.localStorage.removeItem( 'holdings' );
		window.localStorage.removeItem( 'notifications' );
		
		$state.go('walkthrough');
	};
	
})


//
// NotificationQuantityCtrl controller
//	this is a supplementary controller to do notification count
//	so we use it for the tabs and also on the notitication page
.controller('NotificationQuantityCtrl', function( $scope, NotificationQuantityService ){
	
	// this controller is simple.
	
	// Process 'updateNotificationQuantity' event
	//	we need an emit event because the timer directive is a child controller
	$scope.$on('updateNotificationQuantity', function(){
	
		NotificationQuantityService.pullQty().then( function( _qty ){
		
			window.localStorage.setItem( 'badge', JSON.stringify( _qty ) );
			
			if ( Number( _qty ) == 0 ){
				$scope.notificationQuantity = undefined;
			} else {
				$scope.notificationQuantity = Number( _qty );
			}
			
		});
		
/*
		// apply the updates
		//$scope.$apply();
		
		// the timer may be off by a few ms
		//	if we only have the scope apply right away it may not actually refresh the template
		//	so added a few second delay, which solved* the problem
		setTimeout( function(){
			$scope.$apply();
		}, 250 );
*/
	});
		
	$scope.notificationQuantity = NotificationQuantityService.qty();
	
	$scope.notificationQuantityHeader = function(){
		
		var _string = '';
		
		if ( $scope.notificationQuantity == undefined || Number( $scope.notificationQuantity ) == 0 || Number( $scope.notificationQuantity ) < 0 ){
			$scope.notificationQuantity = undefined;
			_string = 'NO NEW NOTIFICATIONS';
		} else if ( Number( $scope.notificationQuantity ) == 1 ){
			_string = '1 NEW NOTIFICATION';
		} else {
			_string = $scope.notificationQuantity + ' NEW NOTIFICATIONS';
		}
		
		return _string;
		
	};
		
})


//
// portfolio allocation (it's a bootstrap progress bar)
.controller('ProgressCtrl', function( $q, $rootScope, $scope, AccountService, HoldingsService, CompanyService, LocalyticsService ){

	$scope.progressBar = function() {

		AccountService.getUser().then( function( _user ){
			
			// console.log( _user );
			
			// persist the user
			window.localStorage.setItem( 'user', JSON.stringify( _user ) );
	
			$q.all([
				
				CompanyService.allPrices(),
				HoldingsService.all()
				
			]).then(function( results ){
				
				_prices		= results[0];
				_holdings	= results[1];
				
				$scope.progressBars = [];
				
				_portfolioValue = _user.portfolioValue;
				
	/*
				if ( $scope.trade != undefined && Number( $scope.trade.action ) == -1 ){				
					var _match = $scope.company.name;
				};
				
				if ( $scope.trade != undefined && Number( $scope.trade.action ) == -1 ){				
					var _match = $scope.company.name;
				};
	*/
				
				for ( var i = 0, n = _holdings.length; i < n; i++ ){
				
					_val = ( _holdings[i].executedcost / _portfolioValue ) * 100;
					
					var _start	= 0,
						_end	= 0;
					
					_start		= _holdings[i].executedcost;
					_end		= _holdings[i].executedquantity * _prices[ _holdings[i].name ].price;
					_change	= (( _end - _start ) / _end ) * 100;
					
					_type = [];
					if ( Math.abs( _change ) > 5 ){
						_type.push( 'high' )		// high change
					} else {
						_type.push( 'low' )			// low change
					}
					
					if ( _change > 0 ){
						_type.push( 'positive' )	// positive change
					} else {
						_type.push( 'negative' )	// negative change
					}
					
					$scope.progressBars.push({
						name: _holdings[i].name.split(':')[1],
						value: _val,
						type: _type.join('-')
					});
					
					// console.log( _holdings[i].name + ' - ' + _val + ' : ' + _type.join('-') );
				}
				
			});
		});
		
	};
	
	$scope.progressBar();
	
})


//
// place trade controller
//	this is just the button on the trade view
.controller('PlaceTradeCtrl', function( $scope, $http ){

	var _confirmTime	= 5000,	// ms
		_cancelTime		= 2000,	// ms
		_intervalTime	= 40;	// ms
		
	var _confirmStep	= ( _intervalTime / _confirmTime );
	var _cancelStep		= ( _intervalTime / _cancelTime );
	
	var _s = _confirmStep;
	var progress = 0;
	
	$scope.placeTrade = function(){
	
		var _this = angular.element( document.querySelector( '#placeTrade' ) );
		
		if ( _this.hasClass( 'state-trade_loading' ) == true ){
		
			// if clicked with 'state-loading' -> 'state-cancelling'
			_this.removeClass( 'state-trade_loading' );
			_this.addClass( 'state-trade_cancelling' );
			
		} else if ( _this.hasClass( 'state-trade_cancelling' ) == true ) {
		
			// clicked on cancelling -> trying to re-place the order
			_this.removeClass( 'state-trade_cancelling' );
			_this.addClass( 'state-trade_loading' );
			
		} else {
			
			// nothing yet... let's load it up
			_this.addClass( 'state-trade_loading' );
			prepInterval( _this )
			
		}
		
	}
	
	function prepInterval( _this ){
	
		interval = setInterval( function() {
		
			_this.hasClass( 'state-trade_loading' ) == true ? _s = _confirmStep : null;
			_this.hasClass( 'state-trade_cancelling' ) == true ?  _s = -1 * _cancelStep : null
			
			progress += _s;
			progress > 1 ? progress = 1 : null ;
			progress < 0 ? progress = 0 : null ;
			
			setProgress( progress );
			
			if( progress == 0 ) {
				stopProgress( _this, 0 );
				clearInterval( interval );
			}

			if( progress == 1 ) {
				stopProgress( _this, 1 );
				clearInterval( interval );
			}
		}, _intervalTime );
		
	}
	
	function setProgress( val ){
		
		//console.log( val )
		angular.element( document.querySelector( '#progress-inner' ) ).css( 'width', 100 * val + '%' );
		
	}

	function stopProgress( _this, status ){
		
		if ( status == 0 ){
			
			setProgress( status );
			_this.removeClass( 'state-trade_cancelling' );
			
		} else if ( status == 1 ){
		
			_this.removeClass( 'state-trade_loading' );
			_this.addClass( 'state-trade_sent' );
			_this.attr( 'disabled', 'disabled' );
			setProgress( status );
			
			//
			// now we need to call the server and acutally place the trade
			//
			//	on success failure we change the class
			//
			
			_action = ( $scope.action == true ? 1 : -1 );
			
			// our $http call for interacting with the server to pull down data
			$http({	method: 'POST',
					url: 	'http://localhost:3000/api/v1/m/trade/place',
					params: {
						token:		window.localStorage.getItem("token"),
						action:		_action,
						ticker:		$scope.trade.name,
						quantity:	$scope.quantity
					}
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					// console.log( status + ', ' + data )
					
					$scope.$emit( 'tradeHasBeenPlaced' );
					
					_this.removeClass( 'state-trade_sent' );
					_this.addClass( 'state-trade_success' );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
					_this.removeClass( 'state-trade_sent' );
					_this.addClass( 'state-trade_error' );
					
					//
					// going to need to extend this error section
					//	imagining a modal with the extended details
					//	
					//	need a way for them to call customer support, tradier and elsen, when error
					// 
					
					if ( status == 401 ){
						$state.go('walkthrough');
					}
					
				});
			
		}
		
	}

})


//
// trade controller
.controller('TradeCtrl', function( $q, $rootScope, $scope, $state, $stateParams, $http, AccountService, HoldingsService, CompanyService, ActivityService, LocalyticsService ){
	
	// record user action
	LocalyticsService.tagScreen( 'trade' );
	
	if ( window.localStorage.getItem( 'user' ) !== null && window.localStorage.getItem( 'user' ) !== undefined && window.localStorage.getItem( 'user' ) !== '' ){
		$rootScope.$broadcast( 'updateNotificationQuantity' );
	};
	
	$scope.tradeHasBeenPlaced	= false;
	
	$scope.$on( 'tradeHasBeenPlaced', function(){
		$scope.tradeHasBeenPlaced	= true;
	});

	$rootScope.$on('$stateChangeStart', function( event, toState, toParams, fromState, fromParams ){
	
		if ( fromState.name == 'tab.trade' && $scope.tradeHasBeenPlaced == true ){
			$scope.tradeHasBeenPlaced = false;
			event.preventDefault();
			_temp = toState.name;
			
			$state.go( 'tab.notifications' );
			
			if ( _temp !== 'tab.notifications' || _temp !== 'login' ){
				setTimeout( function(){
					$state.go( _temp );
				}, 200 );
			}
						
		}
		
		//
		// transitionTo() promise will be rejected with 
		// a 'transition prevented' error
	});
	
	//
	// init the chart object - we'll add the series and data in a second
    $scope.highchartTradeChart = {
        options: {
	        chart: {
	            backgroundColor: '#EEEEED',
	    		pinchType: 'none',
	    		zoomType: 'none',
	    		borderRadius: 0,
				spacingRight:0,
	            spacingLeft:0
	        },
	    	tooltip: {
	    		followPointer: false,
	        	followTouchMove: true,
	            shared: true,
	            useHTML: true,
	            headerFormat: '<small style="font-size:10px;">{point.key}</small><table style="margin-bottom: -3px;">',
	            pointFormat: '<tr><td style="color: {series.color};font-size:12px;">{series.name}: </td>' +
	            '<td style="text-align: right;font-size:10px;"><b>{point.y}</b></td></tr>',
	            footerFormat: '</table>',
	            valueDecimals: 2
	        },
	        scrollbar: {
	            enabled: false
	        },
	        rangeSelector: {
	            enabled: false
	        },
	        credits: {
	            enabled: false
	        },
	        navigator: {
	            enabled: false
	        },
	        yAxis: {
	            labels: {
	                style: {
	                    fontSize: '8px',
	                    fontWeight: 'bold'
	                }
	            }
	        },
	        xAxis: {
	            labels: {
	                style: {
	                    fontSize: '8px',
	                    fontWeight: 'bold'
	                }
	            }
	        }
	    },
        series: [],
        loading: true,
        useHighStocks: true
    };
        
    //
    // simple function to handle the buy || sell button based on our internal buy || sell naming ( 1 || -1 )
	$scope.actionTypeChecked = function( _action ){
	
		switch ( Number( _action ) ) {
			case 1:
				return true;
			case -1:
				return false;
		}
		
	};	
	
	//
	// using html partials to handle the paper || real at the bottom of the view
	$scope.getBrokerageAccountTemplate = function( _type ){
		
		if ( _type == 'real' ){
			return 'partials/tradeReal.html';
		} else {
			return 'partials/tradePaper.html';
		}
		
	};
	
	
	//
	// using html partials to handle the buy || sell in the trade bottom right
	$scope.getTransactionTemplate = function( _action ){
		
		switch ( Number( _action ) ) {
			case 1:
				return 'partials/transactionBuy.html';
			case -1:
				return 'partials/transactionSell.html';
		}
		
	};
	
		
	//
	// grab the trade id passed through from the url state		
	ActivityService.get( $stateParams.tradeID ).then( function( _trade ){
	
		$scope.trade = _trade;
		
		//
		// user persistant
		//
		
		//
		// check our persistant data store to see what's going on there...
		//	if we have something then load that to scope
		//	we are going to pull down fresh data from the server but it may take a few seconds
		//	so we may as well show the user what it looked like before
		if ( window.localStorage.getItem( 'user' ) !== null && window.localStorage.getItem( 'user' ) !== undefined && window.localStorage.getItem( 'user' ) !== ''  ){
			_user = JSON.parse( window.localStorage.getItem( 'user' ) );
			
			$scope.portfolioSize	= _user.portfolioValue;
			$scope.quantity			= parseFloat($scope.trade.detectedquantity, 10);	
			$scope.action			= $scope.trade.action;			
		}
	
		if ( window.localStorage.getItem( $scope.trade.name ) !== null && window.localStorage.getItem( $scope.trade.name ) !== undefined && window.localStorage.getItem( $scope.trade.name ) !== '' ){
			_company	= JSON.parse( window.localStorage.getItem( $scope.trade.name ) );
			
			$scope.company = _company;
			
			
			// now that we have the time series data we can load it to our chart
			//	the chart is defined at the beginning
			//	we also want to tell the chart to not be in 'loading' stage - removes the transparency and Loading... text
			
	        var _series = {
		        name: 'Stock Price',
		        type: 'area',
		        data: $scope.company.timeSeries,
		        threshold: null,
		        tooltip: {
		            valueDecimals: 2
		        },
		        color: '#4387bf',
		        lineWidth: 4,
		        states: {
		            hover: {
		                lineWidth: 4
		            }
		        },
		        marker: {
		            fillColor: '#FFFFFF',
		            lineWidth: 3,
		            radius: 2,
		            lineColor: null
		        }
		    };
	
			$scope.highchartTradeChart.series.push( _series );
			$scope.highchartTradeChart.loading		= false;
			
		}
		
		if ( window.localStorage.getItem( 'holdings' ) !== null && window.localStorage.getItem( 'holdings' ) !== undefined && window.localStorage.getItem( 'holdings' ) !== '' ){
			$scope.holdings = JSON.parse( window.localStorage.getItem( 'holdings' ) );
			
			for ( var i = 0; i < $scope.holdings.length; i++ ){
				
				if ( $scope.holdings[i].name == $scope.trade.name ){
					$scope.matchingBuy = $scope.holdings[i];
				}
			}
					
			var startingAccountSize;
			$scope.percentChange = function( _qty ){
				
				var _start	= 0,
					_end	= 0;
				
				if ( $scope.matchingBuy !== undefined ){
					_start		= $scope.matchingBuy.executedprice * _qty;
					_end		= $scope.company.price * _qty;
					return Math.abs( (( _end - _start ) / _end ) * 100 );
				} else {
					return '';
				}
				
			}
		}
		
		
		//
		// make our deferred calls to the server
		//	wait for deferred
		//
		
/*
		$q.all([
		
			AccountService.getUser(),
			CompanyService.get( _trade.name ),
			HoldingsService.all()
			
		]).then(function( results ){
			
			_user			= results[0];	// 0 in $q.all array
			$scope.company	= results[1];	// 1 ""
			$scope.holdings = results[2];	// 2 ""
			
			$scope.portfolioSize	= _user.portfolioValue;
			$scope.quantity			= parseFloat($scope.trade.detectedquantity, 10);	
			$scope.action			= $scope.trade.action;
			
			for ( var i = 0; i < $scope.holdings.length; i++ ){
				
				if ( $scope.holdings[i].name == $scope.trade.name ){
					$scope.matchingBuy = $scope.holdings[i];
				}
			}
					
			var startingAccountSize;
			$scope.percentChange = function( _qty ){
				
				var _start	= 0,
					_end	= 0;
				
				if ( $scope.matchingBuy !== undefined ){
					_start		= $scope.matchingBuy.executedprice * _qty;
					_end		= $scope.company.price * _qty;
					return Math.abs( (( _end - _start ) / _end ) * 100 );
				} else {
					return '';
				}
				
			}
			
			
			// now that we have the time series data we can load it to our chart
			//	the chart is defined at the beginning
			//	we also want to tell the chart to not be in 'loading' stage - removes the transparency and Loading... text
			
	        var _series = {
		        name: 'Stock Price',
		        type: 'area',
		        data: $scope.company.timeSeries,
		        threshold: null,
		        tooltip: {
		            valueDecimals: 2
		        },
		        color: '#4387bf',
		        lineWidth: 4,
		        states: {
		            hover: {
		                lineWidth: 4
		            }
		        },
		        marker: {
		            fillColor: '#FFFFFF',
		            lineWidth: 3,
		            radius: 2,
		            lineColor: null
		        }
		    };
	
			$scope.highchartTradeChart.series.push( _series );
			$scope.highchartTradeChart.loading		= false;
	    
		});
*/
    
	});
    
})


//
// portfolio controller
.controller('PortfolioCtrl', function( $q, $rootScope, $scope, $state, $http, HoldingsService, AccountService, CompanyService, ActivityService, LocalyticsService ){
	
	// record user action
	LocalyticsService.tagScreen( 'portfolio' );
	
	$scope.executionsCount = 0;
		
	//
	// init the portfolio chart - we'll populate the series and data in a second
	//
	
	$scope.highchartPortfolioChart = {
        options: {
            chart: {
                backgroundColor: '#EEEEED',
        		pinchType: 'none',
        		zoomType: 'none',
        		borderRadius: 0,
				spacingRight:0,
	            spacingLeft:0
            },
        	tooltip: {
        		followPointer: false,
	        	followTouchMove: true,
	            shared: true,
	            useHTML: true,
	            headerFormat: '<small style="font-size:10px;">{point.key}</small><table style="margin-bottom: -3px;">',
	            pointFormat: '<tr><td style="color: {series.color};font-size:12px;">{series.name}: </td>' +
	            '<td style="text-align: right;font-size:10px;"><b>{point.y}</b></td></tr>',
	            footerFormat: '</table>',
	            valueDecimals: 2
	        },
            scrollbar: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            yAxis: {
                labels: {
                    style: {
                        fontSize: '8px',
                        fontWeight: 'bold'
                    }
                }
            },
            xAxis: {
                labels: {
                    style: {
                        fontSize: '8px',
                        fontWeight: 'bold'
                    }
                }
            }
        },
        series: [],
        loading: true,
        useHighStocks: true
    };
	
	//
	// check our persistant data store to see what's going on there...
	//	if we have something then load that to scope
	//	we are going to pull down fresh data from the server but it may take a few seconds
	//	so we may as well show the user what it looked like before
	if ( window.localStorage.getItem( 'user' ) !== null && window.localStorage.getItem( 'user' ) !== undefined && window.localStorage.getItem( 'user' ) !== '' ){
	
		_user = JSON.parse( window.localStorage.getItem( 'user' ) );
		
		$scope.user = _user;
		
		$scope.strategyName					= _user.strategy.name;				// name of the strategy the user is employing
		$scope.portfolioValue				= _user.portfolioValue;				// current value of our portfolio, just the current value
	
		$scope.portfolioChange				= _user.portfolioChange;						// current value of our portfolio, just the current value
		$scope.portfolioChangePercent		= Math.abs( _user.portfolioChangePercent );		// current value of our portfolio, just the current value
	
		$scope.portfolioDayChange			= _user.portfolioDayChange;						// current value of our portfolio, just the current value
		$scope.portfolioDayChangePercent	= Math.abs( _user.portfolioDayChangePercent );	// current value of our portfolio, just the current value
		
		var _series = {
			name: 'Portfolio Value',
			data: _user.portfolioTimeSeries,
			type: 'area',
			threshold: null,
			tooltip: {
				valueDecimals: 2
			},
			color: '#4387bf',
			lineWidth: 4,
			states: {
				hover: {
					lineWidth: 4
				}
			},
			marker: {
				fillColor: '#FFFFFF',
				lineWidth: 3,
				radius: 2,
				lineColor: null
			}
		};
		
		$scope.highchartPortfolioChart.series.push( _series );
		$scope.highchartPortfolioChart.loading		= false;
		
		$rootScope.portfolioTimeSeriesCount = _user.portfolioTimeSeries.length;
		
	}

	if ( window.localStorage.getItem( 'companies' ) !== null && window.localStorage.getItem( 'companies' ) !== undefined && window.localStorage.getItem( 'companies' ) !== '' ){
		_companies			= JSON.parse( window.localStorage.getItem( 'companies' ) );
		$scope.prices		= _companies.prices;
		$scope.timeSeries	= _companies.timeSeries;
	}
	
	if ( window.localStorage.getItem( 'holdings' ) !== null && window.localStorage.getItem( 'holdings' ) !== undefined && window.localStorage.getItem( 'holdings' ) !== '' ){
		$scope.holdings = JSON.parse( window.localStorage.getItem( 'holdings' ) );
	}
	
	//
	// make our deferred calls
	//
	
	AccountService.getUser().then( function( _user ){
		
		// console.log( _user );
		
		// persist the user
		window.localStorage.setItem( 'user', JSON.stringify( _user ) );
		$rootScope.$broadcast( 'updateNotificationQuantity' );
		
		//
		// used for part of the zero-state
		ActivityService.executions().then( function( _raw ){
			$scope.executionsCount = _raw.length;
		});
		
		$q.all([
		
			CompanyService.all(),
			HoldingsService.all()
			
		]).then(function( results ){
			 
			_companies	= results[0];	// 0 in $q.all array
			_holdings 	= results[1];	// 1 ""
			
			// console.log( _user );
					
			$scope.user		= _user;
			$scope.holdings	= _holdings;
			$rootScope.portfolioTimeSeriesCount = _user.portfolioTimeSeries.length;
			
			$scope.strategyName					= _user.strategy.name;				// name of the strategy the user is employing
			$scope.portfolioValue				= _user.portfolioValue;				// current value of our portfolio, just the current value
		
			$scope.portfolioChange				= _user.portfolioChange;						// current value of our portfolio, just the current value
			$scope.portfolioChangePercent		= Math.abs( _user.portfolioChangePercent );		// current value of our portfolio, just the current value
		
			$scope.portfolioDayChange			= _user.portfolioDayChange;						// current value of our portfolio, just the current value
			$scope.portfolioDayChangePercent	= Math.abs( _user.portfolioDayChangePercent );	// current value of our portfolio, just the current value
			
			// time series of our portfolio -- $scope.user.portfolioTimeSeries
			//	portfolio time series returns the following for our plot (numbers for both):
			//	data = [
			//		[ utc timestape, val ], ... , [ utc timestape, val ]
			//	]
			//
			
			//
			// now that we have the time series data we can load it to our chart
			//	the chart is defined at the beginning
			//	we also want to tell the chart to not be in 'loading' stage - removes the transparency and Loading... text
			//
			//	if the series isn't seperated out like this then the chart initializes with a line and then half a second later goes to area
			//	looks cluegy - breaking it up like this seems to do the trick
			//
			
			if ( window.localStorage.getItem( 'companies' ) !== null && window.localStorage.getItem( 'companies' ) !== undefined && window.localStorage.getItem( 'companies' ) !== '' ){
			
				//
				// if we had some persistant data then series has already been loaded
				//	just need to replace the series.data
				//
				
				$scope.highchartPortfolioChart.series[0].data =  _user.portfolioTimeSeries;
				
			} else {
				
				//
				// if NO persistant data then we need to load the entire series
				//
				
				var _series = {
					name: 'Portfolio Value',
					data: _user.portfolioTimeSeries,
					type: 'area',
					threshold: null,
					tooltip: {
						valueDecimals: 2
					},
					color: '#4387bf',
					lineWidth: 4,
					states: {
						hover: {
							lineWidth: 4
						}
					},
					marker: {
						fillColor: '#FFFFFF',
						lineWidth: 3,
						radius: 2,
						lineColor: null
					}
				};
				
				$scope.highchartPortfolioChart.series.push( _series );
				$scope.highchartPortfolioChart.loading		= false;
							
			}
					
			$scope.prices		= _companies.prices;
			$scope.timeSeries	= _companies.timeSeries;
			
			//
			// go through the individual holdings and get the deltas
			//
			
			for ( var a = 0; a < _holdings.length; a++ ){
				
				var _start	= 0,
					_end	= 0;
				
				_start		= _holdings[a].executedcost;
				_end		= _holdings[a].executedquantity * _companies.prices[ _holdings[a].name ].price;
				
				$scope.holdings[a].currentvalue				= _end;
				$scope.holdings[a].executedchange			= _end - _start;;
				$scope.holdings[a].executedpercentchange	= Math.abs( (( _end - _start ) / _end ) * 100 );
				
				$scope.holdings[a].updatedtime				= _companies.prices[ _holdings[a].name ].updated;
			};
					
			// persist the holdings
			window.localStorage.setItem( 'holdings', JSON.stringify( _holdings ) );
			
			// persist the companies
			window.localStorage.setItem( 'companies', JSON.stringify( _companies ) );
			
		});
			
	});
	
		
	
	//
	// the base config for our holding(s) charts
	//	- see function below for more details
	// 
	
	$scope.baseConfig = {
	
		options: {
			chart: {
				backgroundColor: '#EEEEED',
				pinchType: 'none',
				zoomType: 'none',
				borderRadius: 0,
				spacingRight: 0,
				spacingLeft: 0
			},
			tooltip: {
				enabled: false,
				crosshairs: [true, true]
			},
			scrollbar: {
				enabled: false
			},
			rangeSelector: {
				enabled: false
			},
			credits: {
				enabled: false
			},
			navigator: {
				enabled: false
			},
			yAxis: {
				labels: {
					enabled: false,
				},
				gridLineWidth: 0,
				minorGridLineWidth: 0,
				plotLines: [{
					value: 400,
					color: '#605d5e',
					dashStyle: 'Dot',
					width: 2
				}]
			},
			xAxis: {
				lineWidth: 0,
				minorGridLineWidth: 0,
				lineColor: 'transparent',
				labels: {
					enabled: false
				},
				minorTickLength: 0,
				tickLength: 0
			}
		},
		series: [{
			name: 'Stock Price',
			color: '#96BF48',
			negativeColor: '#d04a81',
			threshold: 0,
			type: 'line',
			lineWidth: 3,
			states: {
				hover: {
					enabled: false
				}
			}
		}],
		loading: false,
		useHighStocks: true
	};
	
	//
	// 1. deep copy base config
	// 2. set new config data to company timeseries
	// 3. set threshold and plotline to executed price
	//	- this is where the dotted line is and tells the chart to make below negative and above positive
	//
	
	$scope.initConfig = function ( _config, _key ){
	
		var _thresh = 0;
		for ( var a = 0; a < $scope.holdings.length; a++ ){
			if ( $scope.holdings[a].name == _key ){
				_thresh = parseFloat( $scope.holdings[a].executedprice );
			}
		};
		
/*
		console.log( '------------------------------------' );
		console.log( _thresh );
		console.log( $scope.timeSeries[ _key ] );
*/
		
		_time = $scope.timeSeries[ _key ];
		
		config									= angular.copy( _config );
		config.series[0].data					= _time;
		config.series[0].threshold				= _thresh;
		config.options.yAxis.plotLines[0].value	= _thresh;
		
		return config;
	}

})


//
// notifications controller
.controller('NotificationsCtrl', function( $q, $rootScope, $scope, $http, $state, ActivityService, LocalyticsService ){
	
	// record user action
	LocalyticsService.tagScreen( 'notifications' );
	
	if ( window.localStorage.getItem( 'user' ) !== null && window.localStorage.getItem( 'user' ) !== undefined && window.localStorage.getItem( 'user' ) !== '' ){
		$rootScope.$broadcast( 'updateNotificationQuantity' );
	};
	
	//
	// check our persistant data store to see what's going on there...
	//	if we have something then load that to scope
	//	we are going to pull down fresh data from the server but it may take a few seconds
	//	so we may as well show the user what it looked like before
/*
	if ( window.localStorage.getItem( 'notifications' ) !== null && window.localStorage.getItem( 'notifications' ) !== undefined ){
		setTimeout( function(){
			$scope.notifications = [];
			$scope.notifications = JSON.parse( window.localStorage.getItem( 'notifications' ) );
		}, 50 );
	}
*/
	
	// 
	// get fresh data from the server and persist a copy
	ActivityService.notifications().then( function( _notifications ){
	
		$scope.notificationsCount = _notifications.length;
	
		$scope.notifications = _notifications;
		window.localStorage.setItem( 'notifications', JSON.stringify( _notifications ) );
	});
	
	
	//
	// the user wants to manually hide a notification
	$scope.hideNotification = function( _id ){

		// our $http call for interacting with the server to pull down data
		$http({	method: 'POST',
				url: 	'http://localhost:3000/api/v1/m/notification/hide',
				params: {
					token:	window.localStorage.getItem( 'token' ),
					id:		_id
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				// console.log( status + ', ' + data )
				
				//
				// loop through notifications and find where id matches, set show = false
				// apply changes for angular
				//
				// next iteration will have a pretty animation to hid ethe notification at this point
				//
				
				for ( var a = 0; a < $scope.notifications.length; a++ ){
					if ( $scope.notifications[a].id == _id ){
						$scope.notifications[a].clicked = true;
						break;
					}
				};
				
				setTimeout( function(){
				
					for ( var a = 0; a < $scope.notifications.length; a++ ){
						if ( $scope.notifications[a].id == _id ){
							$scope.notifications[a].show = false;
							break;
						}
					};
					
					$scope.notificationsCount -= 1;
					$scope.$apply();
					
					window.localStorage.setItem( 'notifications', JSON.stringify( $scope.notifications ) );
					
				}, 200 );
				
								
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
								
				//
				// going to need to extend this error section
				//	imagining a modal with the extended details
				//	
				//	need a way for them to call customer support, tradier and elsen, when error
				// 
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
	}

	
	//
	// during init - set the initial time remaining
	$scope.secondsRemaining = function( _time ){
		_t = Math.floor(( _time - Date.now()) / 1000 );
		return _t;
	}
	
	
	//
	// using html partials to handle an available or expired notification row
	$scope.getNotificationTemplate = function( _time ){
	
		if ( _time > Date.now() ){
			// detected time + 15m > right now...
			//	the notification HAS NOT EXPIRED

			return 'partials/notificationAvailable.html';
			
		} else {
			// detected time + 15m < right now...
			//	the notification HAS EXPIRED
			
			return 'partials/notificationExpired.html';
		}
	};
	
	
	//
	// during init - is the notification expired?
	$scope.isExpired = function( _time ){
	
		if ( _time > Date.now() ){
			// detected time + 15m > right now...
			//	the notification HAS NOT EXPIRED

			return false;
			
		} else {
			// detected time + 15m < right now...
			//	the notification HAS EXPIRED
			
			return true;
		}
		
	};
	
	
	//
	// during init - tell the UI if the time value should be 'soon' == red
	$scope.isExpiredSoon = function( _time ){
	
		if ( _time < ( Date.now() + ( 60 * 1000 * 5 ) ) ){
			// expire time - 5m > right now...

			return 'soon';
			
		} else {
		
			return '';
		}
		
	};
	
	
	//
	// Process 'timer-tick' event
	//	we need an emit event because the timer directive is a child controller
	//
	//	this allows us to make changes or do something at certain intervals of the timer ( other than 0sec, which is handled in timer directive )
	$scope.$on('timer-tick', function( timeoutId, millis ){
	
		//
		// we want to update the time to be red when 5mins away
		//
		
		if ( millis.millis == ( 60 * 1000 * 5 ) || millis.millis == 0 ){
		
			// the timer may be off by a few ms
			//	if we only have the scope apply right away it may not actually refresh the template
			//	so added a few second delay, which solved* the problem
		
			setTimeout( function(){
				$scope.$apply();
			}, 2000 );
			
		}
		
	});
	
	
	//
	// simple function to tell the ui BUY || SELL
	$scope.actionType = function( _action ){
	
		switch ( Number( _action ) ) {
			case 1:
				return 'BUY';
			case -1:
				return 'SELL';
		}
		
	};
	
})


//
// activity controller
.controller('ActivityCtrl', function( $q, $rootScope, $scope, $state, ActivityService, LocalyticsService ){
	
	// record user action
	LocalyticsService.tagScreen( 'activity' );

	if ( window.localStorage.getItem( 'user' ) !== null && window.localStorage.getItem( 'user' ) !== undefined && window.localStorage.getItem( 'user' ) !== '' ){
		$rootScope.$broadcast( 'updateNotificationQuantity' );
	};
	
	//
	// check our persistant data store to see what's going on there...
	//	if we have something then load that to scope
	//	we are going to pull down fresh data from the server but it may take a few seconds
	//	so we may as well show the user what it looked like before
	//
	
	if ( window.localStorage.getItem( 'activity' ) !== null && window.localStorage.getItem( 'activity' ) !== undefined && window.localStorage.getItem( 'activity' ) !== '' ){
		$scope.activity = JSON.parse( window.localStorage.getItem( 'activity' ) );
	}
	
	
	//
	// i have no idea why this fixes the bug
	//	but without this the activity does not get updated properly... 
	$scope.$watch('activity', function() {
		$scope.dummy = 'i FUCKING hate you';
	});
	
	
	//
	// super sort function that handles the multi-variable sorting
	var sort_by;
	(function() {
		// utility functions
		var default_cmp = function( a, b ){
			if (a == b) return 0;
			return a < b ? -1 : 1;
		},
		getCmpFunc = function( primer, reverse ){
			var cmp = default_cmp;
			if ( primer ){
				cmp = function( a, b ){
					return default_cmp(primer(a), primer(b));
				};
			}
			if ( reverse ){
				return function( a, b ){
					return -1 * cmp(a, b);
				};
			}
			return cmp;
		};
	
		// actual implementation
		sort_by = function() {
			var fields = [],
			n_fields = arguments.length,
			field, name, reverse, cmp;
			
			// preprocess sorting options
			for ( var i = 0; i < n_fields; i++ ){
				field = arguments[i];
				if ( typeof field === 'string' ){
					name = field;
					cmp = default_cmp;
				}
				else {
					name = field.name;
					cmp = getCmpFunc(field.primer, field.reverse);
				}
				fields.push({
					name: name,
					cmp: cmp
				});
			}
			
			return function(A, B) {
				var a, b, name, cmp, result;
				for ( var i = 0, l = n_fields; i < l; i++ ){
					result = 0;
					field = fields[i];
					name = field.name;
					cmp = field.cmp;
					
					result = cmp(A[name], B[name]);
					if (result !== 0) break;
				}
				return result;
			}
		}
	}());
	
	
	//
	// we need to some additional manipulation on our activity data
	//	on sells we want to show the profit/loss for the trade, which means we also need the buy
	//	
	// basic steps are:
	//	0 - get 'raw' executions from notification factory
	//	1 - ensure sorted by executed timestamp
	//	2 - sort by name (exchange:ticker)
	//	3 - for sells, append the profit/loss & percent profit/loss
	//	4 - bind to our $scope for display
	//
	//	so in the display (ie. activitySold template) can easily display those values
	//
	// note: the ng-repeat is sorted by executed time desc so all of this is just to prevent work later on
	//
	// note: may run into an issue if the user executes trade not through the elsen platform
	//	cause we wouldn't have a record of the trade and the append step would be doing the math on wrong data objects
	//	... meh - let's worry about that when someone complains
	// 

	ActivityService.executions().then( function( _raw ){
	
		// 0 - get raw
		var _activity = _raw;
		
		// 1 - sort by execute timestamp
		// 2 - sort by name
		//	the super sort function above handles both at the same time
		_activity.sort( sort_by( 'name', {
				name: 'executedtime',
				primer: parseInt,
				reverse: false
			}
		));
		
		// 3 - where sell, do math then append change
		for ( var a = 0; a < _activity.length; a++ ){
			if ( Number( _activity[a].action ) == -1 ){
			
				//
				// a - 1 == the corresponding buy*
				//
				// note:
				//	there is a chance that this could create issues because there is a possibility that N buys have occured before our sell
				//	we should iterate over activity[a - 1] -> activity[a - N] and do a weighted profit/loss on each buy
				//	
				//	it should be notes that N is not known beforehand, just have to iterate over executions till action !== 1 -- and in +99% of situations N = 1
				//
				
				var _start	= 0,
					_end	= 0;
				
				_start		= _activity[a - 1].executedcost;
				_end		= _activity[a].executedcost;
						
				_activity[a].executedchange			= _end - _start;
				_activity[a].executedpercentchange	= Math.abs( (( _end - _start ) / _end ) * 100 );
			
			}
		}

		// 4 - bind to scope
		$scope.activity = _activity;
		
		// 4.1 - persist the activity
		window.localStorage.removeItem( 'activity' );
		window.localStorage.setItem( 'activity', JSON.stringify( _activity ) );
	});
	
	
	//
	// we use an html partial for both the bought and sold rows on the activity view
	//	I feel like this approach gives us more control when handling the content on the activity view
	//	because we we can adjust one without affecting the other
	$scope.getActivityTemplate = function( _tradeAction ){
	
		switch ( Number( _tradeAction ) ) {
			case 1:
				return 'partials/activityBought.html';
			case -1:
				return 'partials/activitySold.html';
		}
	};
		
});
