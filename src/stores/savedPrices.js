import { writable } from "svelte/store";

export const savedPrices = writable([]);

// Function to fetch and update the store
export async function loadSavedPrices() {
  const response = await fetch("http://localhost:3002/saved");
  if (response.ok) {
    const data = await response.json();
    savedPrices.set(data);
  } else {
    console.error("Failed to load saved prices:", response.status);
  }
}
