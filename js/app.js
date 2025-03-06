document.addEventListener("DOMContentLoaded", function () {
  // Ensures the script runs only after the DOM is fully loaded.

  // Overrides Domo iframe to change the display size of the map on the card/domo dev HTML local 3000 site
  let domoIframe = window.frameElement; // Get the iframe
  const fullscreenButton = document.getElementById("fullscreen-button");
  let mapContainer = document.getElementById("map");

  if (domoIframe) {
    domoIframe.style.width = "100%";  // Make iframe responsive
    domoIframe.style.height = "100%"; // Make iframe responsive
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      // Enter fullscreen mode
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
      } else if (mapContainer.mozRequestFullScreen) { // Firefox
        mapContainer.mozRequestFullScreen();
      } else if (mapContainer.webkitRequestFullscreen) { // Chrome, Safari, and Opera
        mapContainer.webkitRequestFullscreen();
      } else if (mapContainer.msRequestFullscreen) { // IE/Edge
        mapContainer.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen mode
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari, and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }
  }

  // Add click event listener to the fullscreen button
  fullscreenButton.addEventListener("click", toggleFullscreen);

  // Handle fullscreen change events to update button text
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      fullscreenButton.textContent = "⛶"; // Change button text when in fullscreen
    } else {
      fullscreenButton.textContent = "⛶"; // Change button text when exiting fullscreen
    }
  });


  // Function to detect if the user is on a mobile device
  function isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  // Prevent touch events from propagating to the parent (Domo dashboard) only on mobile devices
  if (mapContainer && isMobileDevice()) {
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];

    touchEvents.forEach((event) => {
      mapContainer.addEventListener(event, (e) => {
        e.stopPropagation();
      }, { passive: false });
    });
  }

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
            center: [-114.5819091796875, 33.642062504753696], // Initial center of the map
            zoom: 6, // Initial zoom level
            minZoom: 5.9, // Minimum zoom level (how far out you can zoom)
            maxZoom: 17, // Maximum zoom level (how far in you can zoom)
            pitch: 25,
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
              // City name labels
              {
                id: "city-labels",
                type: "symbol",
                source: "cities",
                layout: { "text-field": ["get", "CITY_NAME"], "text-size": 12, "text-offset": [0, 0] },
                paint: { "text-color": "#000000" }
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
        // Set terrain elevation with a slight exaggeration
        map.setTerrain({ source: "terrainSource", exaggeration: 0.089 });

        // Change cursor to pointer when hovering over points.
        map.on("mouseenter", "domo-markers", () => map.getCanvas().style.cursor = "pointer");
        map.on("mouseleave", "domo-markers", () => map.getCanvas().style.cursor = "");
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

        // Load counties and add layers
        loadCounties(map)
          .then(() => {
            // ✅ Add county boundaries with a dotted white line
            map.addLayer({
              id: "county-boundaries",
              type: "line",
              source: "counties",
              paint: {
                "line-color": "#FFFFFF", // White color
                "line-width": 1.3,
                "line-dasharray": [2, 2] // Dotted line
              }
            });

            // ✅ Add county name labels
            map.addLayer({
              id: "county-labels",
              type: "symbol",
              source: "counties",
              layout: {
                "text-field": ["get", "NAME"],
                "text-size": 9
              },
              paint: { "text-color": "#FFFFFF" }
            });
          })
          .catch(error => console.error("❌ Error loading counties:", error));
      });

      // Load US states GeoJSON data from Natural Earth
      fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces.geojson')
        .then(response => response.json())
        .then(usStatesGeoJSON => {
          console.log("✅ Loaded US states GeoJSON:", usStatesGeoJSON);

          // Add US states as a source
          map.addSource("us-states", {
            type: "geojson",
            data: usStatesGeoJSON
          });

          // Add US states layer with a solid line
          map.addLayer({
            id: "us-states-boundaries",
            type: "line",
            source: "us-states",
            paint: {
              "line-color": "#65764C", // Solid line color
              "line-width": 2
            }
          });

          // Add US state name labels
          map.addLayer({
            id: "us-state-labels",
            type: "symbol",
            source: "us-states",
            layout: {
              "text-field": ["get", "name"], // Use the "name" property from the GeoJSON
              "text-size": 10,
              "text-offset": [0, 0.5],
              "text-anchor": "center"
            },
            paint: {
              "text-color": "#FFFFFF", // White text color
              "text-halo-color": "#000000", // Black halo for better readability
              "text-halo-width": 1
            }
          });

          // Add a fill layer for states to enable click interaction
          map.addLayer({
            id: "us-states-fill",
            type: "fill",
            source: "us-states",
            paint: {
              "fill-color": "#FFFFFF", // Transparent fill
              "fill-opacity": 0
            }
          });

          // Add click interaction for states
          map.on("click", "us-states-fill", (e) => {
            const stateName = e.features[0].properties.name;
            const stateGeometry = e.features[0].geometry;

            // Calculate the centroid of the state using Turf.js
            const centroid = turf.center(stateGeometry);

            // Center the map on the state's centroid
            map.flyTo({
              center: centroid.geometry.coordinates,
              zoom: 6 // Adjust the zoom level as needed
            });

            // Show a popup with the state name
            new maplibregl.Popup()
              .setLngLat(centroid.geometry.coordinates)
              .setHTML(`<strong>${stateName}</strong>`)
              .addTo(map);
          });

          // Change cursor to pointer when hovering over states
          map.on("mouseenter", "us-states-fill", () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", "us-states-fill", () => {
            map.getCanvas().style.cursor = "";
          }

          );
        }
        ).catch(error => console.error("❌ Error loading US states:", error));

      mapContainer.appendChild(cornerImage);

      map.addControl(new maplibregl.AttributionControl({
        customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics | Elevation data: © Open-Elevation (Terrarium)"
      }));
    })
    .catch(error => console.error("Error retrieving Domo data:", error));
});