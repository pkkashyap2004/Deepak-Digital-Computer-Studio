import { API } from "../models/storeModel.js";

/** Centralized frontend controller for HTTP communication with the existing /api contract. */
export async function apiRequest(pathOrUrl, options = {}) {
  const url = String(pathOrUrl || "");
  const response = await fetch(url.startsWith("/") ? url : API + url, options);
  return response;
}
