//Raster type for whatever reason
document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map', // Container ID
    style: {
      "version": 8,
      "sources": {
        // Add a base map source (Esri World Imagery)
        "baseMap": {
          "type": "raster",
          "tiles": [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          "tileSize": 512,
          "attribution": "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        },
        // Add a terrain source (Tangram Elevation Tiles)
        "terrainSource": {
          "type": "raster-dem",
          "tiles": [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          "tileSize": 128,
          "attribution": "Elevation data: © Open-Elevation (Terrarium)"
        }
      },
      "layers": [
        // Add the base map as the first layer
        {
          "id": "base-map-layer",
          "type": "raster",
          "source": "baseMap",
          "minzoom": 8, // Set minimum zoom out level
          "maxzoom": 17 // Set maximum zoom in level
        },
        // Add a hillshade layer for terrain visualization
        {
          "id": "terrain-layer",
          "type": "hillshade",
          "source": "terrainSource",
          "minzoom": 8, // Set minimum zoom out level
          "maxzoom": 17, // Set maximum zoom in level
          "hillshade-opacity": 0.1
        }
      ]
    },
    center: [-119.4179, 36.7783], // Starting position [lng, lat]
    zoom: 7, // Starting zoom level
    minZoom: 10, // Set minimum zoom out level
    maxZoom: 15, // Set maximum zoom in level
    maxBounds: [
      [-125.0, 32.0], // Southwest corner of California (lon, lat)
      [-113.0, 42.0]  // Northeast corner of California (lon, lat)
    ], // Restrict map view to California
    pitch: 39, // Tilt the map for a 3D perspective
    bearing: 10, // Rotate for better perspective
    attributionControl: true // Enable attribution control
  });

  // Enable 3D terrain with reduced exaggeration
  map.on("load", () => {
    map.setTerrain({ source: "terrainSource", exaggeration: 0.0 }); // Subtle 3D terrain
  });

  // Add custom attribution to the map
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community | Elevation data: © Open-Elevation (Terrarium)"
  }));
});
