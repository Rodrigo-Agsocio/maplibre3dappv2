document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map', // container ID
    style: {
      "version": 8,
      "sources": {
        "terrainSource": {
          "type": "raster",
          "tiles": [
            "https://tile.opentopomap.org/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "attribution": "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)"
        }
      },
      "layers": [
        {
          "id": "terrain-layer",
          "type": "raster",
          "source": "terrainSource",
          "minzoom": 0,
          "maxzoom": 17
        }
      ]
    }, // Use OpenTopoMap for elevation/terrain
    center: [-119.4179, 36.7783], // Starting position [lng, lat]
    zoom: 5.5, // Starting zoom level
    attributionControl: true // Enable attribution control
  });

  // Add additional attribution to the map control
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)"
  }));

  domo.get('/data/v2/auh_gps_view?limit=100')
    .then(function (auh_gps_view) {
      console.log("auh_gps_view", auh_gps_view);
      // Add markers or other features based on auh_gps_view data here
    })
    .catch(function (error) {
      console.error("Error fetching data:", error);
    });
});
