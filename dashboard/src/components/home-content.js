import React, { useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";

const HomeContent = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const setSidebar = (clickedPoint, show) => {
    setShowSidebar(show);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  return (
    <div className="h-100 d-flex flex-row position-relative">
      {showSidebar ? <Sidebar onClose={closeSidebar} /> : null}
      <Map onClickMarker={setSidebar} />
    </div>
  );
};

export default HomeContent;
