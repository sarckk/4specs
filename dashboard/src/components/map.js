import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import * as MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import homelesspoints from "../data/homelesspoints.geojson";
import homelesscondensed from "../data/homelesspoints.geojson";
import * as turf from "@turf/turf";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const Map = (props) => {
  // Create an empty GeoJSON feature collection for drop off locations
  const dropoffs = turf.featureCollection([]);
  // Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
  const nothing = turf.featureCollection([]);
  let keepTrack = [];
  const pointHopper = {};

  const mapContainer = useRef(null);
  const map = useRef(null);
  //   // coordinates for Oxford
  const [mapState, setMapState] = useState({
    longitude: -1.25975,
    latitude: 51.75015,
    zoom: 14,
  });

  const initialMarker = useRef(null);

  const flyToStore = (coordinates) => {
    map.current.flyTo({
      center: coordinates,
      zoom: 15,
    });
  };

  async function addWaypoints(event) {
    // When the map is clicked, add a new drop off point
    // and update the `dropoffs-symbol` layer
    await newDropoff(map.current.unproject(event.point));
    updateDropoffs(dropoffs);
  }

  async function newDropoff(coordinates) {
    // Store the clicked point as a new GeoJSON feature with
    // two properties: `orderTime` and `key`
    const pt = turf.point([coordinates.lng, coordinates.lat], {
      orderTime: Date.now(),
      key: Math.random(),
    });
    dropoffs.features.push(pt);
    pointHopper[pt.properties.key] = pt;

    // Make a request to the Optimization API
    const query = await fetch(assembleQueryURL(), { method: "GET" });
    const response = await query.json();

    // Create an alert for any requests that return an error
    if (response.code !== "Ok") {
      const handleMessage =
        response.code === "InvalidInput"
          ? "Refresh to start a new route. For more information: https://docs.mapbox.com/api/navigation/optimization/#optimization-api-errors"
          : "Try a different point.";
      alert(`${response.code} - ${response.message}\n\n${handleMessage}`);
      // Remove invalid point
      dropoffs.features.pop();
      delete pointHopper[pt.properties.key];
      return;
    }

    // Create a GeoJSON feature collection
    const routeGeoJSON = turf.featureCollection([
      turf.feature(response.trips[0].geometry),
    ]);

    // Update the `route` source by getting the route source
    // and setting the data equal to routeGeoJSON
    map.current.getSource("route").setData(routeGeoJSON);
  }

  function updateDropoffs(geojson) {
    map.current.getSource("dropoffs-symbol").setData(geojson);
  }

  // Here you'll specify all the parameters necessary for requesting a response from the Optimization API
  function assembleQueryURL() {
    const initialCoords = [
      initialMarker.current._lngLat.lng,
      initialMarker.current._lngLat.lat,
    ];
    const coordinates = [initialCoords];
    const distributions = [];
    keepTrack = [initialCoords];

    // Create an array of GeoJSON feature collections for each point
    const restJobs = Object.keys(pointHopper).map((key) => pointHopper[key]);

    // If there are actually orders from this restaurant
    if (restJobs.length > 0) {
      const needToPickUp = 0;

      console.log(restJobs);

      for (const job of restJobs) {
        // Add dropoff to list
        keepTrack.push(job);
        coordinates.push(job.geometry.coordinates);
      }
    }

    // Set the profile to `driving` (I actually set it to cycling)
    // Coordinates will include the current location of the truck,
    return `https://api.mapbox.com/optimized-trips/v1/mapbox/cycling/${coordinates.join(
      ";"
    )}?distributions=${distributions.join(
      ";"
    )}&overview=full&steps=true&geometries=geojson&source=first&access_token=${
      mapboxgl.accessToken
    }`;
  }

  useEffect(() => {
    console.log("initialMarker set :>> ", initialMarker);
  }, [initialMarker]);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [mapState.longitude, mapState.latitude],
      zoom: mapState.zoom,
    });

    map.current.on("load", async () => {
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
          const marker = new mapboxgl.Marker({
            color: "orange",
          })
            .setLngLat(lnglat)
            .addTo(map.current);

          flyToStore(lnglat);
          initialMarker.current = marker;
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
        marker: {
          color: "orange",
        }, // Use the geocoder's default marker style
      });

      geocoder.on("result", ({ result }) => {
        // remove initial marker if necessary
        console.log("initialMarker :>> ", initialMarker.current);
        if (initialMarker.current != null) {
          initialMarker.current.remove();
          initialMarker.current = null;
        }

        // try to search the surrounding areas using TileQuery
        props.onClickMarker({}, true);
      });

      map.current.addControl(geocoder, "top-left");

      new mapboxgl.Marker({ color: "red", scale: 0.7 })
        .setLngLat([-1.2517, 51.736899])
        .addTo(map.current)
        .setPopup(
          new mapboxgl.Popup().setHTML("<h2>Atlantic Fish Bar </h2>10am - 11pm")
        );

      new mapboxgl.Marker({ color: "red", scale: 0.7 })
        .setLngLat([-1.268007, 51.752734])
        .addTo(map.current)
        .setPopup(
          new mapboxgl.Popup().setHTML("<h2>Dosa Park </h2>10am - 11pm")
        );

      new mapboxgl.Marker({ color: "red", scale: 0.7 })
        .setLngLat([-1.266372, 51.760461])
        .addTo(map.current)
        .setPopup(new mapboxgl.Popup().setHTML("<h2>Jamal's </h2>10am - 11pm"));

      new mapboxgl.Marker({ color: "red", scale: 0.7 })
        .setLngLat([-1.239031, 51.750985])
        .addTo(map.current)
        .setPopup(
          new mapboxgl.Popup().setHTML("<h2>Philly's Burger </h2>10am - 11pm")
        );

      new mapboxgl.Marker({ color: "red", scale: 0.7 })
        .setLngLat([-1.236512, 51.741402])
        .addTo(map.current)
        .setPopup(
          new mapboxgl.Popup().setHTML("<h2>Bannisters </h2>10am - 11pm")
        );

      new mapboxgl.Marker({ color: "red", scale: 0.7 })
        .setLngLat([-1.231573, 51.768232])
        .addTo(map.current)
        .setPopup(new mapboxgl.Popup().setHTML("<h2>Taylors </h2>10am - 11pm"));

      const nav = new mapboxgl.NavigationControl({
        visualizePitch: true,
      });
      map.current.addControl(nav, "bottom-right");

      map.current.addLayer({
        id: "dropoffs-symbol",
        type: "symbol",
        source: {
          data: dropoffs,
          type: "geojson",
        },
        layout: {
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-image": "marker-15",
        },
      });

      const scale = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
      });
      map.current.addControl(scale);

      scale.setUnit("metric");

      map.current.addSource("route", {
        type: "geojson",
        data: nothing,
      });

      map.current.addLayer(
        {
          id: "routeline-active",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3887be",
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3, 22, 12],
          },
        },
        "waterway-label"
      );

      map.current.addLayer(
        {
          id: "routearrows",
          type: "symbol",
          source: "route",
          layout: {
            "symbol-placement": "line",
            "text-field": "▶",
            "text-size": ["interpolate", ["linear"], ["zoom"], 12, 24, 22, 60],
            "symbol-spacing": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              30,
              22,
              160,
            ],
            "text-keep-upright": false,
          },
          paint: {
            "text-color": "#3887be",
            "text-halo-color": "hsl(55, 11%, 96%)",
            "text-halo-width": 3,
          },
        },
        "waterway-label"
      );

      // Listen for a click on the map
      await map.current.on("click", addWaypoints);
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
