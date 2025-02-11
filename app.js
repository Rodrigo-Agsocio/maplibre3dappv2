document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        baseMap: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 512,
          attribution: "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        },
        terrainSource: {
          type: "raster-dem",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          tileSize: 128,
          attribution: "Elevation data: © Open-Elevation (Terrarium)"
        }
      },
      layers: [
        {
          id: "base-map-layer",
          type: "raster",
          source: "baseMap",
          minzoom: 8,
          maxzoom: 17
        },
        {
          id: "terrain-layer",
          type: "hillshade",
          source: "terrainSource",
          minzoom: 8,
          maxzoom: 17,
          // Instead of an unsupported opacity property, set initial colors if desired:
          "hillshade-shadow-color": "rgba(0, 0, 0, 0.1)",
          "hillshade-highlight-color": "rgba(255, 255, 255, 0.1)",
          "hillshade-accent-color": "rgba(0, 0, 0, 0.1)"
        }
      ]
    },
    center: [-121.645145, 36.681664], //Longitude and Latitude
    zoom: 7,
    minZoom: 10,
    maxZoom: 16,
    maxBounds: [
      [-125.0, 32.0],
      [-113.0, 42.0]
    ],
    pitch: 35,
    bearing: 18,
    attributionControl: true
  });

  // Enable 3D terrain with subtle exaggeration (if needed)
  map.on("load", () => {
    map.setTerrain({ source: "terrainSource", exaggeration: 0.0 });

    // Dynamically update the hillshade colors to be even more transparent
    map.setPaintProperty("terrain-layer", "hillshade-shadow-color", "rgba(0, 0, 0, 0.3)");
    map.setPaintProperty("terrain-layer", "hillshade-highlight-color", "rgba(150, 150, 150, 0.3)");
    map.setPaintProperty("terrain-layer", "hillshade-accent-color", "rgba(0, 0, 0, 0.5)");
  });

  map.addControl(new maplibregl.AttributionControl({
    customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community | Elevation data: © Open-Elevation (Terrarium)"
  }));
});
