<script>
  let ws;
  import { onMount, onDestroy } from "svelte";
  import { writable } from "svelte/store";

  // Reactive stores for price and thresholds
  const price = writable(null);
  const upThreshold = writable(null);
  const downThreshold = writable(null);

  onMount(() => {
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

  // onMount(() => {
  //   const ws = new WebSocket("ws://localhost:3002");

  //   ws.addEventListener("message", ({ data }) => {
  //     console.log("WS tick:", data);
  //     const {
  //       symbol,
  //       price: latest,
  //       upThreshold: up,
  //       downThreshold: down,
  //     } = JSON.parse(data);
  //     if (symbol === "AAPL") {
  //       if (!baseSet) {
  //         baseSet = true;
  //         upThreshold.set(up);
  //         downThreshold.set(down);
  //       }
  //       price.set(latest);
  //     }
  //   });

  //   return () => ws.close();
  // });
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
</div>

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
