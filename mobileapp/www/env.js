
//
// big 'ol environmental variables
//

var env = 'LOCAL_D';	// 'LOCAL' || 'DEV' || 'PROD'
var deviceOverride = 'iPhone5';	// iPhone5

var servers = {
	'LOCAL'		: 'http://localhost:3000',
	'LOCAL_D'	: 'zacs-macbook-pro.local:3000',
	'DEV'		: 'http://54.191.77.98',
	'PROD'		: 'http://elsen.co'
}

var serverAddress = servers[ env ];

//
// https://github.com/apache/cordova-plugin-device/blob/master/doc/index.md
//

if ( env == 'LOCAL' ){
	window.localStorage.setItem( 'deviceVersion', '7' );
	window.localStorage.setItem( 'devicePlatform', '7' );
	window.localStorage.setItem( 'deviceName', '7' );
	window.localStorage.setItem( 'deviceModel', '7' );
	window.localStorage.setItem( 'deviceUUID', '7' );
}

// ======================================
// == START - DO NOT CHANGE
//

var LOCALYTICS_APP_ID		= 'XXX';

var GOOGLE_CLIENT_ID		= 'XXX.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET	= 'XXX';
var GOOGLE_REDIRECT_URI		= 'http://localhost';
var GOOGLE_SCOPE		= 'https://www.googleapis.com/auth/userinfo.profile';

var FACEBOOK_APP_ID		= "XXX";
var FACEBOOK_APP_SECRET		= "XXX";

var LINKEDIN_API_KEY		= 'XXX';
var LINKEDIN_SECRET_KEY		= 'XXX';
var LINKEDIN_USER_TOKEN		= 'XXX';
var LINKEDIN_USER_SECRET	= 'XXX';
var LINKEDIN_STATE		= 'XXX';
var LINKEDIN_REDIRECT_URI	= 'http://localhost';
var LINKEDIN_SCOPE		= 'r_basicprofile';

//	
// == END - DO NOT CHANGE
// ======================================
