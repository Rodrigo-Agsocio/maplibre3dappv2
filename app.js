document.addEventListener("DOMContentLoaded", function () {
  // Retrieve the data from Domo.
  domo.get('/data/v2/auh_gps_view?')
    .then(function (auh_gps_view) {
      console.log("Original Domo Data:", auh_gps_view);

      // Filter out null, undefined, or empty "GPS Coordinate" values
      const validData = auh_gps_view.filter(row =>
        row["GPS Coordinate"] && typeof row["GPS Coordinate"] === "string" && row["GPS Coordinate"].trim() !== ""
      );

      console.log("Filtered Data (Only Valid GPS Coordinates):", validData);

      // Convert the filtered dataset into a GeoJSON FeatureCollection
      const domoGeoJSON = {
        type: "FeatureCollection",
        features: validData.map(row => {
          const coordsStr = row["GPS Coordinate"].replace(/[()]/g, "");
          const parts = coordsStr.split(",").map(s => parseFloat(s.trim()));
          const coordinates = [parts[1], parts[0]];
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: coordinates },
            properties: row
          };
        })
      };

      console.log("Generated GeoJSON:", domoGeoJSON);

      // Initialize the map with the Domo GeoJSON as one of the sources.
      const map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
            },
            terrainDEM: {
              type: "raster-dem",
              tiles: [
                "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
              ],
              tileSize: 128,
              attribution: "Elevation data: © Open-Elevation (Terrarium)"
            },
            counties: {
              type: "geojson",
              data: "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"
            },
            cities: {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    properties: { "CITY_NAME": "Los Angeles" },
                    geometry: { type: "Point", coordinates: [-118.2437, 34.0522] }
                  },
                  {
                    type: "Feature",
                    properties: { "CITY_NAME": "San Francisco" },
                    geometry: { type: "Point", coordinates: [-122.4194, 37.7749] }
                  },
                  {
                    type: "Feature",
                    properties: { "CITY_NAME": "San Diego" },
                    geometry: { type: "Point", coordinates: [-117.1611, 32.7157] }
                  }
                ]
              }
            },
            domoPoints: {
              type: "geojson",
              data: domoGeoJSON
            }
          },
          layers: [
            {
              id: "base-map-layer",
              type: "raster",
              source: "baseMap",
              minzoom: 1,
              maxzoom: 20
            },
            {
              id: "terrain-layer",
              type: "hillshade",
              source: "terrainSource",
              minzoom: 1,
              maxzoom: 20,
              "hillshade-shadow-color": "rgba(0, 0, 0, 0.1)",
              "hillshade-highlight-color": "rgba(255, 255, 255, 0.1)",
              "hillshade-accent-color": "rgba(0, 0, 0, 0.1)"
            },
            {
              id: "county-boundaries",
              type: "line",
              source: "counties",
              layout: {},
              paint: {
                "line-color": "#65764C",
                "line-width": 3
              }
            },
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
            },
            {
              id: "domo-points",
              type: "circle",
              source: "domoPoints",
              paint: {
                "circle-radius": 4.1,
                "circle-color": "#FF0000"
              }
            }
          ]
        },
        center: [-121.645145, 36.681664],
        zoom: 7,
        minZoom: 1,
        maxZoom: 17,
        pitch: 35,
        bearing: 18,
        attributionControl: true
      });

      map.on("load", () => {
        map.setTerrain({ source: "terrainDEM", exaggeration: 0.0 });
        map.setPaintProperty("terrain-layer", "hillshade-shadow-color", "rgba(0, 0, 0, 0.3)");
        map.setPaintProperty("terrain-layer", "hillshade-highlight-color", "rgba(150, 150, 150, 0.3)");
        map.setPaintProperty("terrain-layer", "hillshade-accent-color", "rgba(0, 0, 0, 0.5)");

        // ADD THIS: Click event to show a popup with "Name" property
        map.on("click", "domo-points", (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const name = e.features[0].properties.Crew || "Unknown Location";

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${name}</strong>`)
            .addTo(map);
        });

        // Change cursor to pointer when hovering over points
        map.on("mouseenter", "domo-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "domo-points", () => {
          map.getCanvas().style.cursor = "";
        });
      });

      map.addControl(new maplibregl.AttributionControl({
        customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community | Elevation data: © Open-Elevation (Terrarium)"
      }));
    })
    .catch(function (error) {
      console.error("Error retrieving Domo data:", error);
    });
});
