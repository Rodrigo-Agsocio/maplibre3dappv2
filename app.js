document.addEventListener("DOMContentLoaded", function () {
  const map = new maplibregl.Map({
    container: 'map', // Container ID
    style: {
      "version": 8,
      "sources": {
        // Satellite imagery source
        "baseMap": {
          "type": "raster",
          "tiles": [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          "tileSize": 512,
          "attribution": "Map data: © Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        },
        // Elevation data (DEM) source (Only for hillshade, not fill-extrusion)
        "terrainSource": {
          "type": "raster-dem",
          "tiles": [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "attribution": "Elevation data: © Open-Elevation (Terrarium)"
        }
      },
      "layers": [
        // Satellite imagery layer
        {
          "id": "base-map-layer",
          "type": "raster",
          "source": "baseMap",
          "minzoom": 1,
          "maxzoom": 20
        },
        // Hillshade layer (Correct usage of raster-dem)
        {
          "id": "terrain-hillshade",
          "type": "hillshade",
          "source": "terrainSource",
          "minzoom": 1,
          "maxzoom": 20,
          "paint": {
            "hillshade-shadow-color": "rgba(0, 0, 0, 0.3)",
            "hillshade-highlight-color": "rgba(255, 255, 255, 0.3)",
            "hillshade-accent-color": "rgba(0, 0, 0, 0.5)"
          }
        }
      ]
    },
    center: [-121.645145, 36.681664], // California
    zoom: 7,
    minZoom: 1,
    maxZoom: 17,
    pitch: 35,
    bearing: 18,
    attributionControl: true
  });

  // Enable 3D Terrain
  map.on("load", () => {
    map.setTerrain({ source: "terrainSource", exaggeration: 1.2 });
  });

  // Add custom attribution
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: "Map data: © Esri, Maxar, Earthstar Geographics | Elevation data: © Open-Elevation (Terrarium)"
  }));

  /**
   * Fetches GPS data from `/data/v2/auh_gps_view?` and adds markers to the map.
   */
  function fetchAuhGpsData() {
    domo.get('/data/v2/auh_gps_view?')
      .then(function (auh_gps_view) {
        console.log("Original Domo Data:", auh_gps_view);

        const validData = auh_gps_view.filter(row =>
          row["GPS Coordinate"] && typeof row["GPS Coordinate"] === "string" && row["GPS Coordinate"].trim() !== ""
        );

        validData.forEach(row => {
          const coordsStr = row["GPS Coordinate"].replace(/[()]/g, "");
          const parts = coordsStr.split(",").map(s => parseFloat(s.trim()));
          const coordinates = [parts[1], parts[0]];

          // Add a marker to the map
          new maplibregl.Marker({ color: "red" })
            .setLngLat(coordinates)
            .setPopup(new maplibregl.Popup().setText(row["Name"] || "Unknown Location"))
            .addTo(map);
        });
      })
      .catch(function (error) {
        console.error("Error retrieving Auh GPS data:", error);
      });
  }

  /**
   * Fetches Daily Report data and adds markers to the map.
   */
  function fetchDataAndDisplayMarkers() {
    domo.get('/data/v1/dailyReportAcresAndPieces?')
      .then(function (data) {
        console.log("Daily Report Data:", data);

        data.forEach(function (item) {
          if (item.Lat && item.Lon && String(item.Lat).trim() !== '' && String(item.Lon).trim() !== '') {
            const coordinates = [item.Lon, item.Lat];

            new maplibregl.Marker({ color: "blue" })
              .setLngLat(coordinates)
              .setPopup(new maplibregl.Popup().setHTML(`
                <strong>${item['Name'] || 'Unknown'}</strong><br>
                Crew: ${item.Crew || 'N/A'}<br>
                Date: ${item['Date Time'] || 'No Date'}<br>
                Job: ${item.Job || 'No description'}
              `))
              .addTo(map);
          }
        });
      })
      .catch(function (error) {
        console.error("Error fetching data from Domo:", error);
      });
  }

  // Fetch data for both datasets
  fetchAuhGpsData();
  fetchDataAndDisplayMarkers();
});
