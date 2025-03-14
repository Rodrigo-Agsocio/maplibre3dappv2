function displayZoomLevel(zoomLevelDisplay) {
    const zoomLevelDisplay = document.createElement("div");
    zoomLevelDisplay.id = "zoom-level-display";
    zoomLevelDisplay.style.position = "absolute";
    zoomLevelDisplay.style.top = "10px";
    zoomLevelDisplay.style.left = "50%";
    zoomLevelDisplay.style.transform = "translateX(-50%)";
    zoomLevelDisplay.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    zoomLevelDisplay.style.padding = "5px 10px";
    zoomLevelDisplay.style.borderRadius = "5px";
    zoomLevelDisplay.style.fontFamily = "Arial, sans-serif";
    zoomLevelDisplay.style.fontSize = "14px";
    zoomLevelDisplay.style.zIndex = "1000";
    zoomLevelDisplay.textContent = "Zoom: 0";
}

