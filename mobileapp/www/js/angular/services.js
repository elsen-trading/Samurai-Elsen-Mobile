
angular.module('elsen.services', [])

//
// notification quantity factory
.factory('NotificationQuantityService', function( $q, $state, $http ){

	var pullQty = function( callback ){
	
		var deferred = $q.defer();

		// these are notifications that have NOT been acted on
		//	primarily used for the notification page

		_u = JSON.parse( window.localStorage.getItem('user') );

		// our $http call for interacting with the server to pull down data
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/notificationQty',
				params: {
					token:	window.localStorage.getItem("token"),
					accountid: _u.account.accountid
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available

				// console.log( status + ', ' + data )
				// console.log( data.activity )

				_qty = data;
				deferred.resolve( _qty );

			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.

				// console.log( status + ', ' + data )

				if ( status == 401 ){
					$state.go('walkthrough');
				}

			});

		return deferred.promise;
		
	};

	return {
		qty: function(){
		
			if ( Number( window.localStorage.getItem( 'badge' ) ) == 0 ){
				return undefined;
			} else {
				return Number( window.localStorage.getItem( 'badge' ) );
			}
			
		},
		pullQty: pullQty
	}
	
})


//
// auth & authz service
.factory('AuthService', function( $q, $state, $http ){
	
	return {
		login:	function( _user ){
		
			var _res		= {};
			var deferred	= $q.defer();
		
			$http({	method: 'GET',
					url: 	serverAddress + '/api/v1/getAccessToken',
					params: {
						deviceVersion:		window.localStorage.getItem( 'deviceVersion' ),
						devicePlatform:		window.localStorage.getItem( 'devicePlatform' ),
						deviceName:			window.localStorage.getItem( 'deviceName' ),
						deviceModel:		window.localStorage.getItem( 'deviceModel' ),
						deviceUUID:			window.localStorage.getItem( 'deviceUUID' ),
						username:			_user.username,
						password:			_user.password,
						type:				_user.client_type,
						id:					_user.client_id
					}
				}).
				success( function( data, status, headers, config ){
					// this callback will be called asynchronously
					//	when the response is available
					
					// console.log( 'success' )
					// console.log( data.token )
					
					_res.status		= status;
					_res.token		= data.token;
					_res.missing	= data.missing;
					
					deferred.resolve( _res );
								
				}).
				error( function( data, status, headers, config ){
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					// console.log( status + ', ' + data )
					
					_res.status		= status;
					_res.message	= data;
					
					deferred.resolve( _res );
					
				});
				
			return deferred.promise;
			
		},
		signup:	function( _user ){
		
			var deferred	= $q.defer();
			var _res		= {};
		
			if ( _user == undefined || _user.first == undefined || _user.last == undefined || _user.email == undefined || _user.password == undefined ){
				
				_res.status		= 500;
				_res.message	= 'Required fields missing';
				
				deferred.resolve( _res );
					
			} else {
			
				$http({	method: 'POST',
						url: 	serverAddress + '/m/signup',
						params: {
							deviceVersion:		window.localStorage.getItem( 'deviceVersion' ),
							devicePlatform:		window.localStorage.getItem( 'devicePlatform' ),
							deviceName:			window.localStorage.getItem( 'deviceName' ),
							deviceModel:		window.localStorage.getItem( 'deviceModel' ),
							deviceUUID:			window.localStorage.getItem( 'deviceUUID' ),
							firstname:			_user.first,
							lastname: 			_user.last,
							username:			_user.username,
							password:			_user.password
						}
					}).
					success( function( data, status, headers, config ){
						// this callback will be called asynchronously
						//	when the response is available
						
						// console.log( 'success' )
						// console.log( data.token )
						
						_res.status		= status;
						_res.message	= data;
						
						deferred.resolve( _res );
					
					}).
					error( function( data, status, headers, config ){
						// called asynchronously if an error occurs
						// or server returns response with an error status.
						
						// console.log( status + ', ' + data )
						
						_res.status		= status;
						_res.message	= data;
						
						deferred.resolve( _res );
						
					});
				
			}
			
			return deferred.promise;
		
		},
		forgot:	function( _user ){

			var _res		= {};
			var deferred	= $q.defer();

			$http({	method: 'POST',
					url: 	serverAddress + '/m/forgot',
					params: {
						email: user.email
					}
				}).
				success( function( data, status, headers, config ){
					// this callback will be called asynchronously
					//	when the response is available
					
					// console.log( data )
					
					_res.status		= status;
					_res.message	= data;
					
					deferred.resolve( _res );
									
				}).
				error( function( data, status, headers, config ){
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					// console.log( status + ', ' + data )
					
					_res.status		= status;
					_res.message	= data;
					
					deferred.resolve( _res );
					
				});
			
			return deferred.promise;
			
		}
	}
	
})


//
// fun little service for the random messages on the login page
.factory('MessageService', function( $q, $state, $http ){
	
	var getMessage = function( callback ){
	
		var deferred = $q.defer();
		
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/welcome-message'
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				//console.log( status + ', ' + data )
								
				deferred.resolve( data );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
			});
		
		return deferred.promise;
		
	}
	
	return {
		getMessage: getMessage
	}
	
})


//
// account factory
.factory('AccountService', function( $q, $rootScope, $state, $http ){
	
	// somewhere to grab info about the user
	
	//
	// most of this data just needs to get grabbed once, when the user first opens the app
	//	so we dont really do the pull everytime
	
	var user = {};
	
	var getUser = function( callback ){
	
		var deferred = $q.defer();
		
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/account',
				params: {
					token:	window.localStorage.getItem("token")
				}
			}).
			success(function(user, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				//console.log( status + ', ' + data )
				
				user.portfolioChange 			= user.portfolioValue - user.startingValue;
				user.portfolioChangePercent 	= ((user.portfolioValue - user.startingValue) / user.startingValue) * 100;
				
				user.portfolioDayChange 		= user.portfolioValue - user.startingDayValue;
				user.portfolioDayChangePercent 	= ((user.portfolioValue - user.startingDayValue) / user.startingDayValue) * 100;
				
				//return user[ _key ];				
				// console.log( user );
				
				deferred.resolve( user );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
				deferred.resolve();
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
		return deferred.promise;
		
	}
	
	var checkAvailable = function( callback ){
	
		var deferred = $q.defer();
		
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/live/available',
				params: {
					token:	window.localStorage.getItem("token")
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				//console.log( status + ', ' + data )
				
				if ( data.status == true ){
					$state.go('tab.portfolio');
					$rootScope.missing = false;
				} else {
					$state.go('tab.missing');
					console.log( data.error );
					$rootScope.missing = true;
				}
				
				deferred.resolve( data );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
		return deferred.promise;
		
	}
	
	return {
		getUser:				getUser,
		checkAvailable:			checkAvailable,
		toggleLiveStatus:		function( _gid, _liveStatus ){
			
			var deferred = $q.defer();
			
			$http({	method: 'POST',
					url: 	serverAddress + '/api/v1/gid/' + _gid + '/liveStatus',
					params: {
						live:	_liveStatus,
						token:	window.localStorage.getItem("token")
					}
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					//$scope.$apply();
					
					// console.log( status + ', ' + data )
					
					deferred.resolve( status );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
					deferred.resolve( status );
					
					if ( status == 401 ){
						$state.go('walkthrough');
					}
					
				});
			
			return deferred.promise;
			
		},
		updateAccountBalance:	function( _aid ){
			
			var deferred = $q.defer();
			
			$http({	method: 'POST',
					url: 	serverAddress + '/db/live/' + _aid + '/updateBalance'
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					//$scope.$apply();
					
					// console.log( status + ', ' + data )
					
					deferred.resolve( status );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
					deferred.resolve( status );
					
				});
			
			return deferred.promise;
			
		}

	}
	
})


//
// company factory
.factory('CompanyService', function( $q, $state, $http ){
	
	// somewhere to grab details about an individual company
	//	this differs from the notifications and holdings in that those can have repeats of companies
	//	so let's just store those company details once
	
	// 	the most important piece of information we grab from this is the time series of the individual company
	//		with the time series we can do the portfolio - holding chart OR grab the last time value and that is our current price
	//	
	//		note: next iteration will be a socket based update of this value, $http provides close enough data though -- so there shouldn't be any issues
	
	//
	// the id of each of the companies in our array is their 'id' == EXCHANGE:TICKER -- this should be unique though
	//
	
	var companies = {};
	
	/*
		var get = function( _id ){
			
			var deferred = $q.defer();
			
			// pull all relevant companies to this account
			//	essentially every company that the user is currently holding or has an active notification for
		
			$http({	method: 'GET',
					url: 	serverAddress + '/api/v1/m/companies',
					params: {
						token:	window.localStorage.getItem("token"),
						companies: [ _id ]
					}
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					// console.log( status + ', ' + data )
					
					company = data;
					deferred.resolve( company );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
					if ( status == 401 ){
						$state.go('walkthrough');
					}
					
				});
			
			return deferred.promise;
			
		}
	*/
	
	var getTimeSeries = function( _id ){
		
		var deferred = $q.defer();
		
		// pull all relevant companies to this account
		//	essentially every company that the user is currently holding or has an active notification for
	
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/companies',
				params: {
					token:	window.localStorage.getItem('token'),
					companies: [ _id ]
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				// console.log( status + ', ' + data )
				
				company = data;
				
				// we don't want to return everything
				//	just an obj with price (current price) and updated (when that price was observed and pull down on the server)
				var _timeSeries = [];
			
				for (var _name in company) {
					_timeSeries = company[ _name ].timeSeries
				}
				
				deferred.resolve( _timeSeries );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
		return deferred.promise;
		
	}

	var getAll = function(){
		
		var deferred = $q.defer();
		
		// pull all relevant companies to this account
		//	essentially every company that the user is currently holding or has an active notification for
		
		_u = JSON.parse( window.localStorage.getItem('user') );
		
		// console.log( _u.account.accountid );
		
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/companies',
				params: {
					token:	window.localStorage.getItem('token'),
					accountid: _u.account.accountid
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				// console.log( status + ', ' + data )
				
				companies = data;
				
				var _timeSeries	= {},
					_prices		= {};
					
				for (var _name in companies) {
				
					_timeSeries[ _name ] = companies[ _name ].timeSeries
					
					_prices[ _name ] = {
						price:		companies[ _name ].price,
						updated: 	companies[ _name ].updated
					}
				}
				
				var _temp = {};
				_temp.timeSeries	= _timeSeries;
				_temp.prices		= _prices;
				
				deferred.resolve( _temp );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
				deferred.resolve();
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
		return deferred.promise;
		
	}

	var getAllPrices = function(){
		
		var deferred = $q.defer();
		
		// pull all relevant companies to this account
		//	essentially every company that the user is currently holding or has an active notification for
		
		_u = JSON.parse( window.localStorage.getItem('user') );
	
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/companies',
				params: {
					token:	window.localStorage.getItem("token"),
					accountid: _u.account.accountid
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				// console.log( status + ', ' + data )
				
				companies = data;
				
				// we don't want to return everything
				//	just an obj with price (current price) and updated (when that price was observed and pull down on the server)
				var _prices = {};
			
				for (var _name in companies) {
					_prices[ _name ] = {
						price:		companies[ _name ].price,
						updated: 	companies[ _name ].updated
					}
				}
				
				deferred.resolve( _prices );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
								
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
		return deferred.promise;
		
	}

	var getAllTimeSeries = function(){
		
		var deferred = $q.defer();
		
		// pull all relevant companies to this account
		//	essentially every company that the user is currently holding or has an active notification for
	
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/companies',
				params: {
					token:	window.localStorage.getItem("token")
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				// console.log( status + ', ' + data )
				
				companies = data;
				
				// we don't want to return everything
				//	just an obj with price (current price) and updated (when that price was observed and pull down on the server)
				var _timeSeries = {};
			
				for (var _name in companies) {
					_timeSeries[ _name ] = companies[ _name ].timeSeries
				}
				
				deferred.resolve( _timeSeries );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
		
		return deferred.promise;
		
	}
	
			
	doesCompanyExist = function( _id ){
		return companies[ _id ] == undefined ? false : true;
	}
	
	return {
		get: 			function( _id ){
			
			var deferred = $q.defer();
			
			// pull all relevant companies to this account
			//	essentially every company that the user is currently holding or has an active notification for
		
			$http({	method: 'GET',
					url: 	serverAddress + '/api/v1/m/companies',
					params: {
						token:	window.localStorage.getItem("token"),
						companies: _id
					}
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					// console.log( status + ', ' + data )
					company = data[ _id ];
					
					deferred.resolve( company );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
					deferred.resolve();
					
					if ( status == 401 ){
						$state.go('walkthrough');
					}
					
				});
			
			return deferred.promise;
			
		},
		timeSeries: 	function( _id ){
			
			var deferred = $q.defer();
			
			// pull all relevant companies to this account
			//	essentially every company that the user is currently holding or has an active notification for
		
			$http({	method: 'GET',
					url: 	serverAddress + '/api/v1/m/companies',
					params: {
						token:	window.localStorage.getItem("token"),
						companies: [ _id ]
					}
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					// console.log( status + ', ' + data )
					
					company = data;
					
					// we don't want to return everything
					//	just an obj with price (current price) and updated (when that price was observed and pull down on the server)
					var _timeSeries = [];
				
					for (var _name in company) {
						_timeSeries = company[ _name ].timeSeries
					}
					
					deferred.resolve( _timeSeries );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
					deferred.resolve();
					
					if ( status == 401 ){
						$state.go('walkthrough');
					}
					
				});
			
			return deferred.promise;
			
		},
		allTimeSeries:	getAllTimeSeries,
		allPrices:		getAllPrices,
		all:			getAll
	}
	
})


//
// holdings factory
.factory('HoldingsService', function( $q, $state, $http ){
	
	// make the call for holdings
	//	placed this into a separate factory because the server call should directly return holding

	var holdings = [];

	var getHoldings = function(){
		var deferred = $q.defer();
		
		_u = JSON.parse( window.localStorage.getItem('user') );
		
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/holdings',
				params: {
					token:	window.localStorage.getItem("token"),
					accountid: _u.account.accountid
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available
				
				// console.log( status + ', ' + data )
				
				holdings = data;
				
				deferred.resolve( holdings );
				
			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				
				console.log( status + ', ' + data )
				
				deferred.resolve();
				
				if ( status == 401 ){
					$state.go('walkthrough');
				}
				
			});
			
		return deferred.promise;
		
	};
	
	return {
		all: getHoldings,
		get: function( _name ){
		
			// pull an individual holding information
		
			for ( var a = 0; a < holdings.length; a++ ){
				if ( holdings[a].name == _name ){
					break;
				}
			}
			
			return holdings[a];
			
		}
	}
	
})


//
// activity factory
//	- notifications
//	- executions
.factory('ActivityService', function( $q, $state, $http ){
	
	// quick declaration of our 'all' object which we will dump all the notifications in
	var all = [];

	var getNotifications 	= function( callback ){

		var deferred = $q.defer();

		// these are notifications that have NOT been acted on
		//	primarily used for the notification page

		_u = JSON.parse( window.localStorage.getItem('user') );

		// our $http call for interacting with the server to pull down data
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/notifications',
				params: {
					token:	window.localStorage.getItem("token"),
					accountid: _u.account.accountid
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available

				// console.log( status + ', ' + data )
				// console.log( data.activity )

				all_c = data.companies;
				all_n = data.notifications;
				
				for ( var _name in all_c ){
					window.localStorage.setItem( _name, JSON.stringify( all_c[ _name ] ) );
				}
				
				all = data.notifications;
				_notifications = [];
				
				//
				// double check to ensure 
				for ( var a = 0; a < all_n.length; a++ ){
					if ( all_n[a].executedtime == undefined ){
						all_n[a].clicked	= false;
						_notifications.push( all_n[a] )
					}
				}

				deferred.resolve( _notifications );

			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.

				console.log( status + ', ' + data )

				if ( status == 401 ){
					$state.go('walkthrough');
				}

			});

		return deferred.promise;

	};

	var getExecutions 		= function( callback ){

		var deferred = $q.defer();

		// these are notifications that HAVE been executed on
		//	primarily used for the activity page

		_u = JSON.parse( window.localStorage.getItem('user') );

		// our $http call for interacting with the server to pull down data
		$http({	method: 'GET',
				url: 	serverAddress + '/api/v1/m/executions',
				params: {
					token:	window.localStorage.getItem("token"),
					accountid: _u.account.accountid
				}
			}).
			success(function(data, status, headers, config) {
				// this callback will be called asynchronously
				//	when the response is available

				// console.log( status + ', ' + data )
				// console.log( data.activity )

				all = data;

				var _executions = [];

				for ( var a = 0; a < all.length; a++ ){
					if ( all[a].executedcost !== undefined ){
						_executions.push( all[a] )
					}
				}

				deferred.resolve( _executions );

			}).
			error(function(data, status, headers, config) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.

				console.log( status + ', ' + data )

				if ( status == 401 ){
					$state.go('walkthrough');
				}

			});

		return deferred.promise;

	};

	// the factory functions for pulling data
	return {
		get: function( tradeID ){

			var deferred = $q.defer();

			// pulling down a specific notification
			//	primarily used on the trade page
			
			for ( var a = 0; a < all.length; a++ ){
				if ( Number( all[a].id ) == tradeID ){
					deferred.resolve( all[ a ] );
					break;
				}
			}
			
			return deferred.promise;

		},
		notifications: getNotifications,
		executions: getExecutions
	}
	
})


//
// actions service
//	so we can track what users are doing on the app
// 
// legacy code - replaced by localytics tracking
//
.factory('ActionsService', function( $q, $state, $http ){
		
	return {
		postAction: function( _action ){
		
			var deferred = $q.defer();
			
			$http({	method: 'POST',
					url: 	serverAddress + '/action',
					params: {
						token:	window.localStorage.getItem("token"),
						action: _action
					}
				}).
				success(function(data, status, headers, config) {
					// this callback will be called asynchronously
					//	when the response is available
					
					//console.log( status + ', ' + data )
									
					deferred.resolve( data );
					
				}).
				error(function(data, status, headers, config) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					
					console.log( status + ', ' + data )
					
				});
			
			return deferred.promise;
			
		}
	}
	
})


//
// localytics helper service
.factory('LocalyticsService', function( $q, $http ){

	// make the calls for localytics
	
	return {
		tagEvent: function( _event, _age, _gender, _splash, _friends ){
			
			//
			// http://support.// Localytics.com/Javascript
			//
			// eg.
			//	localyticsSession.tagEvent("Login", {“Age”: 24, “Gender”: male, "Splash": 1, "Number of friends": "201-300"});
			//
			// we use buckets for attr cause it would be too granular otherwise
			//
			
			var ageBuckets		= [ 0, 18, 24, 34, 44, 54 ]
			var friendsBuckets	= [ 0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 ]
			var splashBuckets	= [ 0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 ]
			
			// new age, ... - what actually gets passed through
			var _nAge,
				_nGender,
				_nSplash,
				_nFriends;
			
			
			_nGender = _gender;
			
			//
			// age
			//
			if ( _age !== undefined ){
				
				_age = parseInt( _age );
				
				if ( _age > ageBuckets[ ageBuckets.length ] ){
					_nAge = ( ageBuckets[ ageBuckets.length ] + 1 ) + '+'
					
				} else {
					for ( var i = 0; i < ageBuckets.length; i++ ){
						if ( _age < ageBuckets[i] ){
							_nAge = ageBuckets[i-1] + '-' + ageBuckets[i];
							break;
						}
					}
				}
					
			} else {
				_nAge = undefined;
			}

			
			//
			// splash
			//
			if ( _splash !== undefined ){
				
				_splash = parseInt( _splash );
				
				if ( _splash > splashBuckets[ splashBuckets.length ] ){
					_nSplash = ( splashBuckets[ splashBuckets.length ] + 1 ) + '+'
					
				} else {
					for ( var i = 0; i < splashBuckets.length; i++ ){
						if ( _splash < splashBuckets[i] ){
							_nSplash = splashBuckets[i-1] + '-' + splashBuckets[i];
							break;
						}
					}
				}
					
			} else {
				_nSplash = undefined;
			}

			
			//
			// friends
			//
			if ( _friends !== undefined ){
				
				_friends = parseInt( _friends );
				
				if ( _friends > friendsBuckets[ friendsBuckets.length ] ){
					_nFriends = ( friendsBuckets[ friendsBuckets.length ] + 1 ) + '+'
					
				} else {
					for ( var i = 0; i < friendsBuckets.length; i++ ){
						if ( _friends < friendsBuckets[i] ){
							_nFriends = friendsBuckets[i-1] + '-' + friendsBuckets[i];
							break;
						}
					}
				}
					
			} else {
				_nFriends = undefined;
			}
			
			// Localytics.tagEvent( _event, {"Age": _nAge, "Gender": _nGender, "Splash": _nSplash, "Number of friends": _nFriends}, 0);
			
		},
		tagScreen: function( _screen ){
		
			//
			// http://support.// Localytics.com/Javascript
			//
			// eg. localyticsSession.tagScreen(“Article View”);
			//
		
			//Localytics.tagScreen( _screen );
		},
		upload: function(){

			//
			// http://support.// Localytics.com/Javascript		
			//
			// upload that shiz to localytics
			//
		
			localyticsSession.upload();
		}
	}
	
});