document.addEventListener("DOMContentLoaded", function () {
  // Sample inline GeoJSON for cities (you can replace or extend this as needed)
  const citiesGeoJSON = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "CITY_NAME": "Los Angeles" },
        "geometry": { "type": "Point", "coordinates": [-118.2437, 34.0522] }
      },
      {
        "type": "Feature",
        "properties": { "CITY_NAME": "San Francisco" },
        "geometry": { "type": "Point", "coordinates": [-122.4194, 37.7749] }
      },
      {
        "type": "Feature",
        "properties": { "CITY_NAME": "San Diego" },
        "geometry": { "type": "Point", "coordinates": [-117.1611, 32.7157] }
      }
    ]
  };

  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      // Correct glyphs URL to avoid the 404 error
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        // Base map from Esri World Imagery
        baseMap: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 512,
          attribution: "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        },
        // Source for hillshade layer (DEM data)
        terrainSource: {
          type: "raster-dem",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          tileSize: 128,
          attribution: "Elevation data: © Open-Elevation (Terrarium)"
        },
        // Separate source for 3D terrain (using the same DEM tiles)
        terrainDEM: {
          type: "raster-dem",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          tileSize: 128,
          attribution: "Elevation data: © Open-Elevation (Terrarium)"
        },
        // Counties boundaries from a free GeoJSON source
        counties: {
          type: "geojson",
          data: "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"
        },
        // Cities data (inline GeoJSON sample)
        cities: {
          type: "geojson",
          data: citiesGeoJSON
        }
      },
      layers: [
        // Base map layer
        {
          id: "base-map-layer",
          type: "raster",
          source: "baseMap",
          minzoom: 8,
          maxzoom: 17
        },
        // Hillshade terrain layer using the DEM source
        {
          id: "terrain-layer",
          type: "hillshade",
          source: "terrainSource",
          minzoom: 8,
          maxzoom: 17,
          "hillshade-shadow-color": "rgba(0, 0, 0, 0.1)",
          "hillshade-highlight-color": "rgba(255, 255, 255, 0.1)",
          "hillshade-accent-color": "rgba(0, 0, 0, 0.1)"
        },
        // County boundaries drawn as red lines
        {
          id: "county-boundaries",
          type: "line",
          source: "counties",
          layout: {},
          paint: {
            "line-color": "#65764C",
            "line-width": 6
          }
        },
        // County labels using the 'name' property from each feature
        {
          id: "county-labels",
          type: "symbol",
          source: "counties",
          layout: {
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-transform": "uppercase",
            "text-field": ["get", "name"],
            "text-size": 9,
            "text-offset": [0, 0]
          },
          paint: {
            "text-color": "#FFFFFF"
          }
        },
        // City labels using the 'CITY_NAME' property
        {
          id: "city-labels",
          type: "symbol",
          source: "cities",
          layout: {
            "text-field": ["get", "CITY_NAME"],
            "text-size": 12,
            "text-offset": [0, 0]
          },
          paint: {
            "text-color": "#000000"
          }
        }
      ]
    },
    center: [-121.645145, 36.681664], // Longitude, Latitude
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

  // Once the map loads, set up 3D terrain (using the separate DEM source)
  map.on("load", () => {
    map.setTerrain({ source: "terrainDEM", exaggeration: 0.0 });
    map.setPaintProperty("terrain-layer", "hillshade-shadow-color", "rgba(0, 0, 0, 0.3)");
    map.setPaintProperty("terrain-layer", "hillshade-highlight-color", "rgba(150, 150, 150, 0.3)");
    map.setPaintProperty("terrain-layer", "hillshade-accent-color", "rgba(0, 0, 0, 0.5)");
  });

  // Add the attribution control
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community | Elevation data: © Open-Elevation (Terrarium)"
  }));
});
