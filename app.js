document.addEventListener("DOMContentLoaded", function () {
  // Ensures the script runs only after the DOM is fully loaded.

  //Overrides Domo iframe to change the display size of the map on the card/domo dev HTML local 3000 site
  let domoIframe = window.frameElement; // Get the iframe

  if (domoIframe) {
    domoIframe.style.width = "460px";  // Force new width
    domoIframe.style.height = "460px"; // Force new height
  }

  let mapContainer = document.getElementById("map");
  if (mapContainer) {
    mapContainer.style.width = "460px";
    mapContainer.style.height = "460px";
  }
  //Overrides Domo iframe to change the display size of the map on the card/domo dev HTML local 3000 site

  // Retrieve the data from Domo.
  domo.get('/data/v2/auh_gps_view?')
    .then(function (auh_gps_view) {
      console.log("Original Domo Data:", auh_gps_view);

      // Filter out null, undefined, or empty "GPS Coordinate" values.
      const validData = auh_gps_view.filter(row =>
        row["GPS Coordinate"] && typeof row["GPS Coordinate"] === "string" && row["GPS Coordinate"].trim() !== ""
      );

      console.log("Filtered Data (Only Valid GPS Coordinates):", validData);

      // Convert the filtered dataset into a GeoJSON FeatureCollection.
      const domoGeoJSON = {
        type: "FeatureCollection",
        features: validData.map(row => {
          const coordsStr = row["GPS Coordinate"].replace(/[()]/g, ""); // Remove parentheses
          const parts = coordsStr.split(",").map(s => parseFloat(s.trim())); // Convert to float values
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [parts[1], parts[0]] }, // Longitude first, Latitude second
            properties: row
          };
        })
      };

      console.log("Generated GeoJSON:", domoGeoJSON);

      // Add a known location for verification (Empire State Building).
      const validationGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-73.985428, 40.748817] }, // Empire State Building coordinates
            properties: { name: "Validation Point: Empire State" }
          }
        ]
      };

      // Initialize the map with MapLibre GL.
      const map = new maplibregl.Map(
        {
          container: 'map', // The HTML element where the map is displayed.
          style: {
            center: [-119.645145, 30.681664], // Initial center of the map
            zoom: 5,
            minZoom: 1,
            maxZoom: 17,
            pitch: 45,
            bearing: 1,
            attributionControl: true,
            version: 8,
            glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
            sources: {
              // Base map source (satellite imagery from Esri)
              baseMap: {
                type: "raster",
                tiles: [
                  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                ],
                tileSize: 256,
                attribution: "Map data: © Esri, Maxar, Earthstar Geographics"
              },
              // Elevation data source
              terrainSource: {
                type: "raster-dem",
                tiles: [
                  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
                ],
                tileSize: 256,
                attribution: "Elevation data: © Open-Elevation (Terrarium)"
              },
              // County boundaries
              counties: {
                type: "geojson",
                data: "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson"
              },
              // City labels
              cities: {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [
                    { type: "Feature", properties: { "CITY_NAME": "Los Angeles" }, geometry: { type: "Point", coordinates: [-118.2437, 34.0522] } },
                    { type: "Feature", properties: { "CITY_NAME": "San Francisco" }, geometry: { type: "Point", coordinates: [-122.4194, 37.7749] } },
                    { type: "Feature", properties: { "CITY_NAME": "San Diego" }, geometry: { type: "Point", coordinates: [-117.1611, 32.7157] } }
                  ]
                }
              },

              // GPS markers from Domo data
              domoPoints: { type: "geojson", data: domoGeoJSON },
              // Validation marker for reference
              validationPoint: { type: "geojson", data: validationGeoJSON }
            },

            layers: [
              // Base raster layer
              {
                id: "base-map-layer",
                type: "raster",
                source: "baseMap",
                minzoom: 1,
                maxzoom: 20
              },
              // County boundaries as lines
              {
                id: "county-boundaries",
                type: "line",
                source: "counties",
                paint: { "line-color": "#65764C", "line-width": 2 }
              },
              // City name labels
              {
                id: "city-labels",
                type: "symbol",
                source: "cities",
                layout: { "text-field": ["get", "CITY_NAME"], "text-size": 12, "text-offset": [0, 0] },
                paint: { "text-color": "#000000" }
              },
              //County names
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
                paint: { "text-color": "#FFFFFF" }
              },
              // Shadow effect for markers
              {
                id: "domo-markers-shadow",
                type: "circle",
                source: "domoPoints",
                paint: { "circle-radius": 20, "circle-color": "rgba(0, 0, 0, 0.5)", "circle-blur": 2.5, "circle-translate": [3, -2] }
              },
              // Main GPS markers
              {
                id: "domo-markers",
                type: "circle",
                source: "domoPoints",
                paint: { "circle-radius": 5, "circle-color": "#FFFFFF", "circle-stroke-width": 5, "circle-stroke-color": "#65764C" }
              },
              // Validation marker (purple)
              {
                id: "validation-marker",
                type: "circle",
                source: "validationPoint",
                paint: { "circle-radius": 6, "circle-color": "#FF00FF", "circle-stroke-width": 2, "circle-stroke-color": "#FFFFFF" }
              }
            ]
          }
        }
      );

      let dropPinPopup = null; // Store popup reference

      // Create and append an image in the top-left corner of the map.
      const cornerImage = document.createElement("img");
      cornerImage.src = "images/agsocio_logo_bottom_corner_icon.jpg";
      cornerImage.id = "corner-image";
      cornerImage.alt = "AgSocio Logo";

      const mapContainer = document.getElementById("map");

      map.on("load", () => {
        // Set terrain with a slight exaggeration
        map.setTerrain({ source: "terrainSource", exaggeration: 0.089 });

        // Show popups when clicking on markers
        map.on("click", "domo-markers", (e) => {
          const properties = e.features[0].properties;
          const popupContent = `
            <div style="font-size: 10px; padding: 5px;">
              <strong>Date:</strong> ${properties["Date Time"] || "No Date Available"} <br>
              <strong>GPS Coordinate:</strong> ${properties["GPS Coordinate"] || "No GPS Coordinate"} <br>
              <strong>Name:</strong> ${properties.Name || "No Name"} <br>
              <strong>Crew:</strong> ${properties.Crew || "No Crew"} <br>
              <strong>Job:</strong> ${properties.Job || "No Job Assigned"}
            </div>
          `;
          new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setHTML(popupContent).addTo(map);
        });

        // Change cursor to pointer when hovering over points.
        map.on("mouseenter", "domo-markers", () => map.getCanvas().style.cursor = "pointer");
        map.on("mouseleave", "domo-markers", () => map.getCanvas().style.cursor = "");

        // Add a draggable pin
        const dropPin = new maplibregl.Marker({ draggable: true, color: "red" })
          .setLngLat([-115.74310396002714, 33.197989681057905])
          .addTo(map);

        function onDragEnd() {
          const lngLat = dropPin.getLngLat();
          if (dropPinPopup) dropPinPopup.remove();
          dropPinPopup = new maplibregl.Popup()
            .setLngLat(lngLat)
            .setHTML(`<strong>Dropped Pin</strong><br>Longitude: ${lngLat.lng}<br>Latitude: ${lngLat.lat}`)
            .addTo(map);
        }
        dropPin.on('dragend', onDragEnd);
      });

      mapContainer.appendChild(cornerImage);

      map.addControl(new maplibregl.AttributionControl({
        customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics | Elevation data: © Open-Elevation (Terrarium)"
      }));
    })
    .catch(error => console.error("Error retrieving Domo data:", error));
});
