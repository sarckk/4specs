import React from "react";
import Map from "./map";
import Sidebar from "./sidebar";

const HomeContent = () => (
  <div className="h-100 d-flex flex-row">
    <Sidebar />
    <Map />
  </div>
);

export default HomeContent;
