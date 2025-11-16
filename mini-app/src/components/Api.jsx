import axios from "axios";
const BackEndUrl = import.meta.env.VITE_BACKEND_URL;

const publicApi = axios.create({
  baseURL: BackEndUrl,
  withCredentials: true,
});

const protectedApi = axios.create({
  baseURL: BackEndUrl,
  withCredentials: true,
});

export { publicApi, protectedApi };