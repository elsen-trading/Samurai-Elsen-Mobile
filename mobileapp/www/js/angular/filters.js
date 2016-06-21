
angular.module('elsen.filters', [])

//
// extension of the normal number filter
//	if the number is large then it appends the letter next to the number
//	that way you can fit big numbers into small spaces - also makes it easier for people to read
//

.filter('largeNumber', function() {
	return function( n, fixedToDecimal ){
	
		var numberFormatRanges = [
			{ divider: Number(1e18) , suffix: 'P' },
			{ divider: Number(1e15) , suffix: 'E' },
			{ divider: Number(1e12) , suffix: 'T' },
			{ divider: Number(1e9) , suffix: 'G' },
			{ divider: Number(1e6) , suffix: 'M' },
			{ divider: Number(1e3) , suffix: 'k' }
		];
		
		if ( n == undefined ){
			
			return 0;
			
		} else {
			
			for ( var i = 0; i < numberFormatRanges.length; i++ ){
				if ( n >= numberFormatRanges[i].divider ){
					return ( n / numberFormatRanges[i].divider).toFixed(fixedToDecimal ) + numberFormatRanges[i].suffix;
				}
			}
			
			return n.toFixed( fixedToDecimal );
			
		}
		
	};
});