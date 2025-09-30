import axios from "axios";

const API_URL = "http://localhost:3001/api/portal/organization"; // Change if deployed

// Login user
const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials, {
    withCredentials: true, // If cookies/session needed
  });
  return response.data;
};

export default { login };
