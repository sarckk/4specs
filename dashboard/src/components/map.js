import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import * as MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import homelesspoints from "../data/homelesspoints.geojson";
import homelesscondensed from "../data/homelesspoints.geojson";

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

// const homeless = {
//   type: "FeatureCollection",
//   features: [
//     {
//       type: "Feature",
//       geometry: {
//         type: "Point",
//         coordinates: [-1.2632552, 51.7548614],
//       },
//       properties: {
//         title: "Temple",
//       },
//     },
//   ],
// };

const Map = (props) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  //   // coordinates for Oxford
  const [mapState, setMapState] = useState({
    longitude: -1.25975,
    latitude: 51.75015,
    zoom: 14,
  });

  const flyToStore = (coordinates) => {
    map.current.flyTo({
      center: coordinates,
      zoom: 15,
    });
  };

  // const addMarkers = () => {
  //   for (const marker of homeless.features) {
  //     const el = document.createElement("div");
  //     el.id = `marker-${marker.properties.id}`;
  //     el.className = "marker";

  //     new mapboxgl.Marker(el, { offset: [0, -23] })
  //       .setLngLat(marker.geometry.coordinates)
  //       .addTo(map.current);

  //     el.addEventListener("click", () => {
  //       flyToStore(marker.geometry.coordinates);
  //       props.onClickMarker(
  //         {
  //           geom: marker.geometry,
  //           properties: marker.properties,
  //         },
  //         true
  //       );
  //     });
  //   }
  // };

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [mapState.longitude, mapState.latitude],
      zoom: mapState.zoom,
    });

    map.current.on("load", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          console.log("position :>> ", position);
          setMapState((prevState) => ({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            ...prevState,
          }));

          // add a marker here
          const lnglat = [position.coords.longitude, position.coords.latitude];
          const marker1 = new mapboxgl.Marker()
            .setLngLat(lnglat)
            .addTo(map.current);

          flyToStore(lnglat);
        });
      }

      map.current.addSource("homeless", {
        type: "geojson",
        data: homelesspoints,
      });

      map.current.addLayer(
        {
          id: "homeless-heat",
          type: "heatmap",
          source: "homeless",
          // 'maxzoom': 15,
          paint: {
            "heatmap-intensity": {
              default: 1,
              stops: [
                [1, 0.1],
                [15, 2],
              ],
            },

            // use sequential color palette to use exponentially as the weight increases
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, // outer edge
              "rgba(88, 230, 252,0)",
              0.2,
              "rgba(255, 227, 66,0.6)", // yellow
              0.5,
              "rgba(255, 105, 18,0.6)", // orange
              0.8, // inner (center)
              "rgba(88, 178, 252,0.6)", // blue
            ],

            // increase radius as zoom increases
            "heatmap-radius": {
              // 'default': 5,
              stops: [
                [1, 15],
                [15, 15],
              ],
            },

            // // decrease opacity to transition into the circle layer
            // 'heatmap-opacity': {
            //     'default': 1,
            //     'stops': [
            //         [1, 0.6], // ALPHA OPACITY
            //         [15, 0.6]
            //     ]
            // }
          },
        },
        "waterway-label"
      );

      map.current.addLayer(
        {
          id: "homeless-point",
          type: "circle",
          source: "homeless",
          minzoom: 13,
          paint: {
            "circle-radius": {
              type: "exponential",
              stops: [
                [13, 7],
                [15, 3],
              ],
            },

            "circle-color": {
              type: "exponential",
              stops: [
                [13, "rgba(255, 227, 66,0)"], // orange
                [15, "rgba(255, 227, 66,1)"], // yellow
              ],
            },

            "circle-stroke-color": "rgba(128, 54, 18,1)",
            "circle-stroke-width": 1,
            "circle-stroke-opacity": {
              type: "exponential",
              stops: [
                [13, 0],
                [14, 0],
                [15, 0.6],
              ],
            },
          },
        },
        "waterway-label"
      );

      map.current.addSource("homelesscond", {
        type: "geojson",
        data: homelesscondensed,
      });

      map.current.addLayer(
        {
          id: "homeless-point2",
          type: "circle",
          source: "homelesscond",
          minzoom: 8,
          paint: {
            // // increase the radius of the circle as the zoom level and dbh value increases
            // 'circle-radius': {
            //     'type': 'linear',
            //     'stops': [
            //         [15, 5],
            //         [15, 10]
            //     ]
            // },

            "circle-radius": {
              type: "exponential",
              default: 8,
              stops: [
                [13, 5],
                [14, 30],
                [15, 80],
              ],
            },

            "circle-color": {
              type: "exponential",
              stops: [
                [13, "rgba(255, 135, 18, 0)"], // orange
                [14, "rgba(255, 165, 18, 0.05)"], // orange
                [15, "rgba(88, 178, 252,0.15)"], // yellow
              ],
            },

            // 'circle-stroke-color': 'white',
            // 'circle-stroke-width': 1,
            // 'circle-opacity': {
            //     'stops': [
            //         [13, 0],
            //         [15, 1]
            //     ]
            // }
          },
        },
        "waterway-label"
      );

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken, // Set the access token
        mapboxgl: mapboxgl, // Set the mapbox-gl instance
        marker: true, // Use the geocoder's default marker style
      });

      geocoder.on("result", ({ result }) => {
        console.log("result :>> ", result);
        // try to search the surrounding areas using TileQuery
        props.onClickMarker({}, true);
      });

      map.current.addControl(geocoder, "top-left");
    });

    map.current.on("click", (event) => {
      const features = map.current.queryRenderedFeatures(event.point, {
        layers: ["locations"],
      });
      if (!features.length) return;

      const clickedPoint = features[0];
      flyToStore(clickedPoint.geometry.coordinates);
      props.onClickMarker(
        {
          geom: clickedPoint._geometry,
          properties: clickedPoint.properties,
        },
        true
      );
    });
  });

  return (
    <div className="h-100 flex-grow-1">
      <div ref={mapContainer} className="h-100" />
    </div>
  );
};

export default Map;
