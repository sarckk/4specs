import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // coordinates for Oxford
  const initialLng = -1.257677;
  const initialLat = 51.752022;
  const initialZoom = 14;

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [initialLng, initialLat],
      zoom: initialZoom,
    });
  });

  return (
    <div className="h-100">
      <div ref={mapContainer} className="h-100" />
    </div>
  );
};

export default Map;
