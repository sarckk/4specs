import React, { useState, useRef, useEffect } from "react";
// import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
//mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

import ReactMapboxGl, { Layer, Source } from "react-mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const M = ReactMapboxGl({
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
});

const stores = {
  type: "geojson",
  data: {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-77.0323, 38.9131],
    },
    properties: {
      title: "Mapbox DC",
      "marker-symbol": "monument",
    },
  },
};

const Map = () => {
  //   const mapContainer = useRef(null);
  //   const map = useRef(null);
  //   // coordinates for Oxford
  //   const initialLng = -1.257677;
  //   const initialLat = 51.752022;
  const initialZoom = [14];
  const [x, y] = [-77.0323, 38.9131];

  //   useEffect(() => {
  //     if (map.current) return; // initialize map only once
  //     map.current = new mapboxgl.Map({
  //       container: mapContainer.current,
  //       style: "mapbox://styles/mapbox/streets-v11",
  //       center: [initialLng, initialLat],
  //       zoom: initialZoom,
  //     });

  //     map.current.on("load", () => {
  //       /* Add the data to your map as a layer */
  //       console.log("stores :>> ", stores);
  //       map.current.addLayer({
  //         id: "locations",
  //         type: "circle",
  //         source: {
  //           type: "geojson",
  //           data: stores,
  //         },
  //       });
  //     });
  //   });

  // <div ref={mapContainer} className="h-100" />
  return (
    <div className="h-100 flex-grow-1">
      <M
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
      ;
    </div>
  );
};

export default Map;
