"use client"
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AllContext = createContext();

const AllProvider = ({ children }) => {
  const [logstate, setLogstate] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get("/api/checkloginvalidation"); 
        if (res.status === 200) {
          setLogstate(true);
          setUser(res.data.user); 
        } else {
          setLogstate(false);
          setUser(null);
        }
      } catch (err) {
        setLogstate(false);
        setUser(null);
      }
    };
    checkLogin();
  }, []);

  return (
    <AllContext.Provider value={{ logstate, setLogstate, user, setUser }}>
      {children}
    </AllContext.Provider>
  );
};

export default AllProvider;
export const useAll = () => useContext(AllContext);
