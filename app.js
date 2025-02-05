document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map', // container ID
    style: 'https://demotiles.maplibre.org/style.json', // Hosted style or your style URL
    center: [-119.4179, 36.7783], // Starting position [lng, lat]
    zoom: 5.5 // Starting zoom level
  });

  domo.get('/data/v2/auh_gps_view?limit=100')
    .then(function (auh_gps_view) {
      console.log("auh_gps_view", auh_gps_view);
      // Add markers or other features based on auh_gps_view data here
    })
    .catch(function (error) {
      console.error("Error fetching data:", error);
    });
});
