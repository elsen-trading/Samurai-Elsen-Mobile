// Elsen Mobile App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'elsen' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'elsen.services' is found in services.js
// 'elsen.controllers' is found in controllers.js
angular.module('elsen', ['ionic', 'highcharts-ng', 'angularMoment', 'elsen.services', 'elsen.controllers', 'elsen.directives', 'elsen.filters'])

.config(function($stateProvider, $urlRouterProvider) {

// Ionic uses AngularUI Router which uses the concept of states
// Learn more here: https://github.com/angular-ui/ui-router
// Set up the various states which the app can be in.
// Each state's controller can be found in controllers.js
$stateProvider

	.state('walkthrough', {
		url: "/walkthrough",
		templateUrl: "views/walkthrough.html",
		controller: 'WalkthroughCtrl'
	})

	.state('forgot', {
		url: "/forgot",
		templateUrl: "views/forgot.html",
		controller: 'ForgotCtrl'
	})

	.state('signup', {
		url: "/signup",
		templateUrl: "views/signup.html",
		controller: 'SignupCtrl'
	})
	
	// setup an abstract state for the tabs directive
	.state('tab', {
		url: "/tab",
		abstract: true,
		templateUrl: "views/tabs.html",
		controller:	'TabCtrl'
	})
	
	.state('tab.missing', {
		url: "/missing",
		views: {
			'missing-tab': {
				templateUrl: 'views/missing.html',
				controller: 'MissingCtrl'
			}
		}
	})
	
	.state('tab.portfolio', {
		url: '/portfolio',
		views: {
			'portfolio-tab': {
				templateUrl: 'views/portfolio.html',
				controller: 'PortfolioCtrl'
			}
		}
	})
	
	// the notifications tab has its own child nav-view and history
	.state('tab.notifications', {
		url: '/notifications',
		views: {
			'notifications-tab': {
				templateUrl: 'views/notifications.html',
				controller: 'NotificationsCtrl'
			}
		}
	})
	
	.state('tab.trade', {
		url: '/trade/:tradeID',
		views: {
			'notifications-tab': {
				templateUrl: 'views/trade.html',
				controller: 'TradeCtrl'
			}
		},
		onExit: function(){
			
		}
	})
	
	.state('tab.activity', {
		url: '/activity',
		views: {
			'activity-tab': {
				templateUrl: 'views/activity.html',
				controller: 'ActivityCtrl'
			}
		}
	});
	
	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/walkthrough');

});

