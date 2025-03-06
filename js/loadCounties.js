function loadCounties(map) {
    return new Promise((resolve, reject) => {
        fetch('data/us-counties-fips.json') // ✅ Load from local file
            .then(response => response.json())
            .then(geojsonData => {
                console.log("✅ Loaded local county GeoJSON:", geojsonData);

                // ✅ Add counties as a source before layers are added
                map.addSource("counties", {
                    type: "geojson",
                    data: geojsonData
                });

                resolve(); // ✅ Resolves when the counties are fully loaded
            })
            .catch(error => {
                console.error("❌ Error loading counties:", error);
                reject(error);
            });
    });
}
