import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
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
        title: "Mapbox DC",
        "marker-symbol": "monument",
      },
    },
  ],
};

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  //   // coordinates for Oxford
  const initialZoom = [14];
  const [x, y] = [-1.26012, 51.75577];

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [x, y],
      zoom: initialZoom[0],
    });

    map.current.on("load", () => {
      /* Add the data to your map as a layer */
      console.log("stores :>> ", stores);
      map.current.addLayer({
        id: "locations",
        type: "circle",
        source: {
          type: "geojson",
          data: stores,
        },
      });
    });
  });

  // <div ref={mapContainer} className="h-100" />
  return (
    <div className="h-100 flex-grow-1">
      <div ref={mapContainer} className="h-100" />
      {/* <M
        style="mapbox://styles/mapbox/streets-v9"
        center={[x, y]}
        zoom={initialZoom}
        containerStyle={{
          height: "100vh",
          width: "100vw",
        }}
      >
        <Source id="source_id" geoJsonSource={stores} />
        <Layer type="circle" id="layer_id" sourceId="source_id" />
      </M>
      ; */}
    </div>
  );
};

export default Map;
