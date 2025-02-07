document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map', // container ID
    style: {
      "version": 8,
      "sources": {
        "terrainSource": {
          "type": "raster-dem", // Use DEM (Digital Elevation Model) for 3D terrain
          "tiles": [
            "https://dem.tilehosting.com/{z}/{x}/{y}.png?key=free" // Free DEM tiles
          ],
          "tileSize": 256,
          "attribution": "Map data: © OpenStreetMap contributors, SRTM | Elevation data: © MapTiler (Free Tier)"
        }
      },
      "layers": [
        {
          "id": "terrain-layer",
          "type": "hillshade", // Hillshade for terrain visualization
          "source": "terrainSource",
          "minzoom": 0,
          "maxzoom": 17
        }
      ]
    },
    center: [-119.4179, 36.7783], // Starting position [lng, lat]
    zoom: 5.5, // Starting zoom level
    pitch: 45, // Tilt the map for 3D perspective
    bearing: 0, // Rotate for better perspective
    attributionControl: true // Enable attribution control
  });

  // Add terrain to enable real 3D rendering
  map.on("load", () => {
    map.setTerrain({ source: "terrainSource", exaggeration: 1.5 }); // Add 3D terrain with optional exaggeration
  });

  // Add additional attribution to the map control
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: "Map data: © OpenStreetMap contributors, SRTM | Elevation data: © MapTiler (Free Tier)"
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
