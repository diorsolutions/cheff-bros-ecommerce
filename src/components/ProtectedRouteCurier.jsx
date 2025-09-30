import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRouteCurier = ({ children }) => {
  const navigate = useNavigate();
  const isCurierLoggedIn = localStorage.getItem("curierLoggedIn") === "true";

  useEffect(() => {
    if (!isCurierLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isCurierLoggedIn, navigate]);

  if (isCurierLoggedIn) {
    return children;
  }

  return null;
};

export default ProtectedRouteCurier;