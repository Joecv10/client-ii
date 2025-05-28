<script>
  let ws;
  import { onMount, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { savedPrices, loadSavedPrices } from "./stores/savedPrices.js";

  // Reactive stores for price and thresholds
  const price = writable(null);
  const upThreshold = writable(null);
  const downThreshold = writable(null);

  onMount(() => {
    loadSavedPrices();

    ws = new WebSocket("ws://localhost:3002");

    ws.onopen = () => console.log("🟢 WS connection opened");
    ws.onmessage = (event) => {
      console.log("🕒 WS tick:", event.data);
      try {
        const {
          symbol,
          price: latest,
          upThreshold: up,
          downThreshold: down,
        } = JSON.parse(event.data);
        // only process AAPL messages
        if (symbol !== "AAPL") return;

        // update thresholds on every tick
        upThreshold.set(up);
        downThreshold.set(down);

        // always update price
        price.set(latest);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };
    ws.onerror = (err) => console.error("WS error", err);
    ws.onclose = () => console.log("⚪ WS closed");
  });

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });

  // Functionality
  async function savePrice() {
    if ($price === null) return;
    await fetch("http://localhost:3002/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: $price,
        timestamp: new Date().toISOString(),
      }),
    });
    // You could reload saved list here if implemented
    await loadSavedPrices();
  }

  async function deleteSaved(id) {
    const res = await fetch(`http://localhost:3002/saved/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadSavedPrices(); // refresh the list
    }
  }
</script>

<div class="banner">
  <h1>Demo de Invocación Implícita Grupo 1</h1>
</div>

<div class="ticker">
  <div class="price">
    AAPL:
    {#if $price !== null}
      ${$price.toFixed(2)}
    {:else}
      Loading...
    {/if}
  </div>

  <div class="threshold">
    {#if $upThreshold !== null}
      ↑ ${$upThreshold.toFixed(2)}
    {:else}
      ↑ …
    {/if}
  </div>

  <div class="threshold">
    {#if $downThreshold !== null}
      ↓ ${$downThreshold.toFixed(2)}
    {:else}
      ↓ …
    {/if}
  </div>
  <button on:click={savePrice}>Save Price</button>
</div>

<aside class="sidebar">
  <h2>Saved Prices</h2>
  <ul>
    {#each $savedPrices as item}
      <li>
        ${item.price} &mdash; {new Date(item.timestamp).toLocaleString()}
        <button on:click={() => deleteSaved(item._id)}>×</button>
      </li>
    {/each}
  </ul>
</aside>

<style>
  .banner {
    position: sticky;
    top: 0;
    background-color: white;
    color: black;
    z-index: 1000;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ticker {
    font-family: system-ui, sans-serif;
    display: flex;
    gap: 1rem;
    align-items: center;
    margin: 2rem;
  }
  .price {
    font-size: 2rem;
    font-weight: bold;
  }
  .threshold {
    opacity: 0.7;
  }
</style>
