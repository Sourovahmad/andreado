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

  import * as GMAPILoader from '@googlemaps/js-api-loader';
  const { Loader } = GMAPILoader;

  import { onMount } from 'svelte';
  import SearchBar from './components/SearchBar.svelte';
  import Sections from './sections/Sections.svelte';
  import { onDestroy } from 'svelte';
  let isMobile = false;
  let showDrawer = false;
  function handleResize() {
    isMobile = window.innerWidth <= 768;
  }
  onMount(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const defaultPlace = {
    name: 'Via Mascagni 144, Modena',
    address: 'Via Mascagni 144, Modena',
  };
  let location: google.maps.LatLng | undefined;
  const zoom = 19;

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;
  onMount(async () => {
    // Load the Google Maps libraries.
    const loader = new Loader({ apiKey: googleMapsApiKey });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
      places: loader.importLibrary('places'),
    };
    geometryLibrary = await libraries.geometry;
    mapsLibrary = await libraries.maps;
    placesLibrary = await libraries.places;

    // Get the address information for the default location.
    const geocoder = new google.maps.Geocoder();
    const geocoderResponse = await geocoder.geocode({
      address: defaultPlace.address,
    });
    const geocoderResult = geocoderResponse.results[0];

    // Initialize the map at the desired location.
    location = geocoderResult.geometry.location;
    map = new mapsLibrary.Map(mapElement, {
      center: location,
      zoom: zoom,
      tilt: 0,
      mapTypeId: 'satellite',
      mapTypeControl: false,
      fullscreenControl: false,
      rotateControl: false,
      streetViewControl: false,
      zoomControl: false,
    });
  });

  // Month changer state for Data Layers endpoint
  let expandedSection = '';
  let month = 0;
  let day = 14;
  let hour = 0;
  let layerId = 'monthlyFlux';
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  $: hourLabel = (() => {
    if (layerId === 'hourlyShade') {
      if (hour == 0) return '12am';
      if (hour < 10) return `${hour}am`;
      if (hour < 12) return `${hour}am`;
      if (hour == 12) return '12pm';
      if (hour < 22) return `${hour - 12}pm`;
      return `${hour - 12}pm`;
    }
    return '';
  })();
</script>

{#if isMobile}
  <div class="relative w-full h-full bg-[#dde6ea]">
    <div class="absolute top-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-xl z-20">
      {#if placesLibrary && map}
        <div class="rounded-full bg-[#e5e5e5] px-4 py-2 shadow-md">
          <SearchBar bind:location {map} initialValue={defaultPlace.name} />
        </div>
      {/if}
    </div>
    {#if showDrawer && expandedSection === 'Data Layers endpoint'}
      <div class="fixed top-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-xl z-[60]">
        <div class="surface on-surface-text pr-4 text-center label-large rounded-full shadow-md w-full flex items-center justify-between">
          {#if layerId === 'monthlyFlux'}
            <md-slider
              range
              min={0}
              max={11}
              value-start={month}
              value-end={month}
              on:input={e => month = e.target.valueStart}
              class="flex-1"
            />
            <span class="w-8">{monthNames[month]}</span>
          {:else if layerId === 'hourlyShade'}
            <md-slider
              range
              min={0}
              max={23}
              value-start={hour}
              value-end={hour}
              on:input={e => hour = e.target.valueStart}
              class="flex-1"
            />
            <span class="w-24 whitespace-nowrap">{monthNames[month]} {day} {hourLabel}</span>
          {/if}
        </div>
      </div>
    {/if}
    <div bind:this={mapElement} class="absolute inset-0 w-full h-full z-10" />
    <button class="fixed bottom-24 right-4 z-30 bg-white rounded-xl shadow-lg p-4 flex items-center justify-center" on:click={() => showDrawer = true} aria-label="Open menu">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect y="5" width="24" height="2" rx="1" fill="#222"/><rect y="11" width="24" height="2" rx="1" fill="#222"/><rect y="17" width="24" height="2" rx="1" fill="#222"/></svg>
    </button>
    {#if showDrawer}
      <div class="fixed inset-0 z-40 bg-black/30" on:click={() => showDrawer = false}></div>
      <div class="fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto animate-slideup">
        {#if location}
          <Sections {location} {map} {geometryLibrary} {googleMapsApiKey}
            bind:expandedSection
            bind:month
            bind:day
            bind:hour
            bind:layerId
          />
        {/if}
        <span class="block pt-4 text-center outline-text label-small">© 2025 Klaryo. All rights reserved.</span>
      </div>
    {/if}
  </div>
{:else}
  <div class="flex flex-row h-full">
    <div bind:this={mapElement} class="w-full" />
    <aside class="flex-none md:w-96 w-80 p-2 pt-3 overflow-auto">
      <div class="flex flex-col space-y-2 h-full">
        {#if placesLibrary && map}
          <SearchBar bind:location {map} initialValue={defaultPlace.name} />
        {/if}

        <!-- <div class="p-4 surface-variant outline-text rounded-lg space-y-3">
        <p>
          <a
            class="primary-text"
            href="https://developers.google.com/maps/documentation/solar/overview?hl=en"
            target="_blank"
          >
            Two distinct endpoints of the <b>Solar API</b>
            <md-icon class="text-sm">open_in_new</md-icon>
          </a>
          offer many benefits to solar marketplace websites, solar installers, and solar SaaS designers.
        </p>

        <p>
          <b>Click on an area below</b>
          to see what type of information the Solar API can provide.
        </p>
      </div> -->

        {#if location}
          <Sections {location} {map} {geometryLibrary} {googleMapsApiKey} />
        {/if}

        <div class="grow" />

        <!-- <div class="flex flex-col items-center w-full">
        <md-text-button
          href="https://github.com/googlemaps-samples/js-solar-potential"
          target="_blank"
        >
          View code on GitHub
          <img slot="icon" src="github-mark.svg" alt="GitHub" width="16" height="16" />
        </md-text-button>
      </div> -->

        <span class="pb-4 text-center outline-text label-small">
          © 2025 Klaryo. All rights reserved.
        </span>
      </div>
    </aside>
  </div>
{/if}

<style>
  @keyframes slideup {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .animate-slideup {
    animation: slideup 0.25s cubic-bezier(0.4,0,0.2,1);
  }
</style>
