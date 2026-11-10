// Orbit News: the family's one service worker (Orbit-Core/kit/sw.js), with
// this app's settings. It keeps the page's own files so the app opens
// without a connection and can be installed. The outlets' pictures are
// theirs, shown from their sites and never kept here (so not the kit's
// shared picture cache, sw-images.js).
self.ORBIT_SW = { cache: 'orbit-news-v1', title: 'Orbit News' };
importScripts('../Orbit-Core/kit/sw.js');
