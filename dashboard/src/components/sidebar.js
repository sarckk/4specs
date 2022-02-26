import React from "react";

const Sidebar = (props) => (
  <div className="sidebar">
    <h2>Available stores</h2>
    <button onClick={props.onClose}>Close</button>
  </div>
);

export default Sidebar;
