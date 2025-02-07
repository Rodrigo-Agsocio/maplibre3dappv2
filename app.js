document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map', // container ID
    style: {
      "version": 8,
      "sources": {
        "esriWorldImagery": {
          "type": "raster",
          "tiles": ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          "tileSize": 256,
          "attribution": "Sources: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community"
        }
      },
      "layers": [
        {
          "id": "esri-world-imagery",
          "type": "raster",
          "source": "esriWorldImagery",
          "minzoom": 0,
          "maxzoom": 22
        }
      ]
    }, // Use ESRI World Imagery
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
