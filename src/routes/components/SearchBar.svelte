<!--
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 -->
<script lang="ts">
  /* global google */
  import { onMount } from 'svelte';

  export let map: google.maps.Map;          // existing map instance
  export let initialValue = '';             // pre-filled value (optional)
  export let zoom = 19;                     // zoom to apply after selection
  export let location: google.maps.LatLng | undefined;

  let container: HTMLDivElement;            // wrapper for the widget
  let pacEl: HTMLElement;                   // PlaceAutocompleteElement instance

  onMount(async () => {
    // 1. Load the Places library (new widgets live here too)
    await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

    // 2. Create the widget
    //    You can pass options such as includedRegionCodes, locationBias, etc.
    //    Here we just keep it simple:
    //    @ts-ignore is still needed until @types/google.maps fully catches up.
    // @ts-ignore
    pacEl = new google.maps.places.PlaceAutocompleteElement();

    // Optional: pre-set a value
    if (initialValue) (pacEl as any).value = initialValue;

    // 3. Append to the DOM (or push to map controls if you prefer)
    container.appendChild(pacEl);

    // 4. Handle the selection event
    pacEl.addEventListener('gmp-select', async ({ placePrediction }: any) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport']
      });

      // Center/zoom map similarly to your old code
      if (place.viewport) {
        map.fitBounds(place.viewport);
      } else if (place.location) {
        map.setCenter(place.location);
        map.setZoom(zoom);
      }

      // Expose the location back to the parent component
      location = place.location ?? undefined;
    });
  });
</script>

<!-- The widget renders itself; this div is only a placeholder -->
<div class="autocomplete-wrapper" bind:this={container}></div>

<style>
  .autocomplete-wrapper :global(gmp-place-autocomplete) {
    width: 100%;
    min-height: 44px;
    font-size: 1rem;
  }
  @media (max-width: 768px) {
    .autocomplete-wrapper {
      width: 100%;
      min-width: 0;
      padding: 0;
    }
    .autocomplete-wrapper :global(gmp-place-autocomplete) {
      width: 100%;
      min-height: 48px;
      font-size: 1.1rem;
    }
  }
</style>


