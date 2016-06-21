Samurai Mobile App
==========================


ionic css - removed 'grid section' - line 5879, it interacts poorly with bootstrap

began with ionic-angular-cordova-seed  
The perfect starting point for an Ionic project.  
- [Ionic Tutorials](http://ionicframework.com/tutorials/)


line 2866 of ionic.css  
  @media (min--moz-device-pixel-ratio: 1.5), (-webkit-min-device-pixel-ratio: 1.5), (min-device-pixel-ratio: 1.5), (min-resolution: 144dpi), (min-resolution: 1.5dppx) {
    .tabs {
      padding-top: 2px;
      border-top: none !important;
      border-bottom: none !important;
      background-position: top;
      background-size: 100% 1px;
      background-repeat: no-repeat; } }
      
      TO
      
  @media (min--moz-device-pixel-ratio: 1.5), (-webkit-min-device-pixel-ratio: 1.5), (min-device-pixel-ratio: 1.5), (min-resolution: 144dpi), (min-resolution: 1.5dppx) {
    .tabs {
      padding-top: 2px;
      border-top: none !important;
      border-bottom: none !important;
      background-position: top;
      background-repeat: no-repeat; } }