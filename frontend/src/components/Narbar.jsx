import React from "react";
import { Menubar } from "primereact/menubar";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const items = [
    { label: "Home", icon: "pi pi-home", command: () => navigate("/") },
    { label: "Hot Deals", icon: "pi pi-bolt", command: () => navigate("/hot-deals") },
    { label: "Laptops", icon: "pi pi-desktop", command: () => navigate("/laptops") },
    { label: "Smartphones", icon: "pi pi-mobile", command: () => navigate("/smartphones") },
    { label: "Cameras", icon: "pi pi-camera", command: () => navigate("/cameras") },
    { label: "Accessories", icon: "pi pi-sliders-h", command: () => navigate("/accessories") },
  ];
  return <Menubar model={items} className="border-none" />;
}
export default Navbar;
