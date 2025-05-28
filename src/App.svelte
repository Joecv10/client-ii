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

<!-- page wrapper -->
<main class="min-h-screen bg-gray-950 flex flex-col items-center gap-12 py-12">
  <div
    class="banner bg-gray-900 text-white sticky top-0 p-4 flex justify-center items-center"
  >
    <h1 class="text-3xl md:text-4xl font-bold">
      <span class="text-yellow-400">Demo</span> de Invocación Implícita Grupo 1
    </h1>
  </div>

  <!-- ticker card goes here -->

  <!-- ticker -->
  <!-- ticker card -->
  <div
    class="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-xl p-6 text-white"
  >
    <div class="flex items-start gap-4">
      <!-- Price block -->
      <div class="text-4xl font-extrabold flex items-baseline gap-1">
        <span>AAPL</span>
        <span class="text-gray-500 text-xl">:</span>
        {#if $price !== null}
          <span>${$price.toFixed(2)}</span>
        {:else}
          <span class="text-gray-400 text-xl">Loading…</span>
        {/if}
      </div>
    </div>

    <!-- Thresholds -->
    <div class="mt-4 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="text-green-400 text-lg">↑</span>
        {#if $upThreshold !== null}
          <span class="text-lg">${$upThreshold.toFixed(2)}</span>
        {:else}
          <span class="text-gray-400">…</span>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <span class="text-red-400 text-lg">↓</span>
        {#if $downThreshold !== null}
          <span class="text-lg">${$downThreshold.toFixed(2)}</span>
        {:else}
          <span class="text-gray-400">…</span>
        {/if}
      </div>
    </div>

    <!-- Save button -->
    <button
      class="mt-6 w-full rounded-lg bg-yellow-500 hover:bg-yellow-400 py-2 text-gray-900 font-semibold transition"
      on:click={savePrice}
    >
      Save Price
    </button>
  </div>
  <!-- ticker -->

  <!-- data-table card goes here -->
  <!-- data-table card -->
  <aside
    class="w-full max-w-2xl rounded-xl bg-gray-900 shadow
         overflow-hidden"
  >
    <!-- header row -->
    <div
      class="grid grid-cols-12 gap-6 px-6 py-4
           text-sm font-semibold text-gray-200
           bg-gray-800"
    >
      <span class="col-span-4">PRICE</span>
      <span class="col-span-6">TIMESTAMP</span>
      <span class="col-span-2 text-center">ACTION</span>
    </div>

    <!-- scrollable body -->
    <div class="max-h-64 overflow-y-auto">
      {#each $savedPrices as item (item._id)}
        <div
          class="grid grid-cols-12 gap-6 px-6 py-4 text-sm
               odd:bg-gray-800 even:bg-gray-700
               text-gray-100"
        >
          <div class="col-span-4 font-medium">
            $ {item.price.toFixed(2)}
          </div>

          <div class="col-span-6 text-gray-300">
            {new Date(item.timestamp).toLocaleString()}
          </div>

          <div class="col-span-2 flex justify-center">
            <button
              class="rounded-md bg-red-600/40 px-3 py-1 text-red-200
                   hover:bg-red-600 hover:text-white transition"
              on:click={() => deleteSaved(item._id)}
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  </aside>
</main>

<style>
</style>
