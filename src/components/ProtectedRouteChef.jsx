import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRouteChef = ({ children }) => {
  const navigate = useNavigate();
  const isChefLoggedIn = localStorage.getItem("chefLoggedIn") === "true";

  useEffect(() => {
    if (!isChefLoggedIn) {
      navigate("/chef-login", { replace: true }); // Redirect to chef login page
    }
  }, [isChefLoggedIn, navigate]);

  if (isChefLoggedIn) {
    return children;
  }

  return null;
};

export default ProtectedRouteChef;