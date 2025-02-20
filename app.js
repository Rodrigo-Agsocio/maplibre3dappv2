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
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [parts[1], parts[0]] },
            properties: row
          };
        })
      };

      console.log("Generated GeoJSON:", domoGeoJSON);

      // Add a known location for verification (Empire State Building)
      const validationGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-73.985428, 40.748817] },
            properties: { name: "Validation Point: Empire State" }
          }
        ]
      };

      // Initialize the map
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
              attribution: "Map data: © Esri, Maxar, Earthstar Geographics"
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
                  { type: "Feature", properties: { "CITY_NAME": "Los Angeles" }, geometry: { type: "Point", coordinates: [-118.2437, 34.0522] } },
                  { type: "Feature", properties: { "CITY_NAME": "San Francisco" }, geometry: { type: "Point", coordinates: [-122.4194, 37.7749] } },
                  { type: "Feature", properties: { "CITY_NAME": "San Diego" }, geometry: { type: "Point", coordinates: [-117.1611, 32.7157] } }
                ]
              }
            },
            domoPoints: { type: "geojson", data: domoGeoJSON },
            validationPoint: { type: "geojson", data: validationGeoJSON }
          },
          layers: [
            { id: "base-map-layer", type: "raster", source: "baseMap", minzoom: 1, maxzoom: 20 },
            {
              id: "county-boundaries",
              type: "line",
              source: "counties",
              layout: {},
              paint: { "line-color": "#65764C", "line-width": 3 }
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
              paint: { "text-color": "#FFFFFF" }
            },
            {
              id: "city-labels",
              type: "symbol",
              source: "cities",
              layout: { "text-field": ["get", "CITY_NAME"], "text-size": 12, "text-offset": [0, 0] },
              paint: { "text-color": "#000000" }
            },
            // "Shadow" layer for markers
            {
              id: "domo-markers-shadow",
              type: "circle",
              source: "domoPoints",
              paint: { "circle-radius": 9, "circle-color": "rgba(0, 0, 0, 0.5)", "circle-blur": 2.5, "circle-translate": [-3, 6] }
            },
            // ✅ Main markers with white center & thick blue border
            {
              id: "domo-markers",
              type: "circle",
              source: "domoPoints",
              paint: { "circle-radius": 3, "circle-color": "#FFFFFF", "circle-stroke-width": 5, "circle-stroke-color": "#65764C" }
            },
            // ✅ Bright purple validation marker
            {
              id: "validation-marker",
              type: "circle",
              source: "validationPoint",
              paint: { "circle-radius": 6, "circle-color": "#FF00FF", "circle-stroke-width": 3, "circle-stroke-color": "#FFFFFF" }
            }
          ]
        },
        center: [-119.645145, 30.681664],
        zoom: 5,
        minZoom: 1,
        maxZoom: 17,
        pitch: 9,
        bearing: 0,
        attributionControl: true
      });

      map.on("load", () => {
        // Event for showing popups when clicking on markers
        map.on("click", "domo-markers", (e) => {
          const properties = e.features[0].properties;
          const popupContent = `
            <div style="font-size: 10px; padding: 5px;">
              <strong>Name:</strong> ${properties.Name || "No Name"} <br>
              <strong>Crew:</strong> ${properties.Crew || "No Crew"} <br>
              <strong>Job:</strong> ${properties.Job || "No Job Assigned"} <br>
              <strong>Date:</strong> ${properties["Date Time"] || "No Date Available"}
            </div>
          `;

          new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setHTML(popupContent).addTo(map);
        });

        // Change cursor to pointer when hovering over points
        map.on("mouseenter", "domo-markers", () => map.getCanvas().style.cursor = "pointer");
        map.on("mouseleave", "domo-markers", () => map.getCanvas().style.cursor = "");

        // Add a draggable pin to drop anywhere on the map
        const dropPin = new maplibregl.Marker({ draggable: true, color: "red" })
          .setLngLat([-119.645145, 30.681664])
          .addTo(map);

        function onDragEnd() {
          const lngLat = dropPin.getLngLat();
          new maplibregl.Popup()
            .setLngLat(lngLat)
            .setHTML(`<strong>Dropped Pin</strong><br>Longitude: ${lngLat.lng}<br>Latitude: ${lngLat.lat}`)
            .addTo(map);
        }

        dropPin.on('dragend', onDragEnd);
      });

      map.addControl(new maplibregl.AttributionControl({
        customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics"
      }));
    })
    .catch(function (error) {
      console.error("Error retrieving Domo data:", error);
    });
});
