/* Boot. */
(function (GH) {
  'use strict';
  GH.store.init();
  GH.router.render(false);
  if (GH.tour) GH.tour.init();
})(window.GH);
