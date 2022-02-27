import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import * as MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

// import ReactMapboxGl, { Layer, Source } from "react-mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// const M = ReactMapboxGl({
//   accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
// });

const stores = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.26012, 51.75577],
      },
      properties: {
        title: "Museum",
      },
    },
  ],
};

const homeless = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-1.2632552, 51.7548614],
      },
      properties: {
        title: "Temple",
      },
    },
  ],
};

const Map = (props) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  //   // coordinates for Oxford
  const initialZoom = [14];
  const [x, y] = [-1.26012, 51.75577];

  const flyToStore = (currentFeature) => {
    map.current.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15,
    });
  };

  const addMarkers = () => {
    for (const marker of homeless.features) {
      const el = document.createElement("div");
      el.id = `marker-${marker.properties.id}`;
      el.className = "marker";

      new mapboxgl.Marker(el, { offset: [0, -23] })
        .setLngLat(marker.geometry.coordinates)
        .addTo(map.current);

      el.addEventListener("click", () => {
        flyToStore(marker);
        props.onClickMarker({
          geom: marker.geometry,
          properties: marker.properties,
        });
      });
    }
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [x, y],
      zoom: initialZoom[0],
    });

    map.current.on("load", () => {
      map.current.addLayer({
        id: "locations",
        type: "circle",
        source: {
          type: "geojson",
          data: stores,
        },
      });

      map.current.addSource("homeless", {
        type: "geojson",
        data: homeless,
      });

      addMarkers();

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken, // Set the access token
        mapboxgl: mapboxgl, // Set the mapbox-gl instance
        marker: true, // Use the geocoder's default marker style
        bbox: [-77.210763, 38.803367, -76.853675, 39.052643], // Set the bounding box coordinates
      });

      map.current.addControl(geocoder, "top-left");
    });

    map.current.on("click", (event) => {
      const features = map.current.queryRenderedFeatures(event.point, {
        layers: ["locations"],
      });
      if (!features.length) return;

      const clickedPoint = features[0];
      flyToStore(clickedPoint);
      props.onClickMarker({
        geom: clickedPoint._geometry,
        properties: clickedPoint.properties,
      });
    });
  });

  return (
    <div className="h-100 flex-grow-1">
      <div ref={mapContainer} className="h-100" />
    </div>
  );
};

export default Map;
