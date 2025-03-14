// function loadCounties(map) {
//     return new Promise((resolve, reject) => {
//         fetch('data/us-counties-fips.json') // Load from local file
//             .then(response => response.json())
//             .then(geojsonData => {
//                 console.log("Loaded local county GeoJSON:", geojsonData);

//                 // Filter only AZ, CA, and CO counties
//                 const filteredCounties = {
//                     type: "FeatureCollection",
//                     features: geojsonData.features.filter(feature => {
//                         const state = feature.properties.STATE; // Replace with the correct property name
//                         return state === 'CA' || state === 'AZ' || state === 'CO'; // Filter by state codes
//                     })
//                 };

//                 console.log("Filtered counties GeoJSON:", filteredCounties);

//                 //Add filtered counties as a source
//                 map.addSource("counties", {
//                     type: "geojson",
//                     data: filteredCounties // Use the filtered data
//                 });

//                 resolve(); //Resolves when the counties are fully loaded
//             })
//             .catch(error => {
//                 console.error("Error loading counties:", error);
//                 reject(error);
//             });
//     });
// }

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