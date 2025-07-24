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

  import type { MdDialog } from '@material/web/dialog/dialog';
  import Expandable from '../components/Expandable.svelte';
  import {
    type BuildingInsightsResponse,
    type RequestError,
    findClosestBuilding,
    type SolarPanelConfig,
  } from '../solar';
  import Show from '../components/Show.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import { createPalette, normalize, rgbToColor } from '../visualize';
  import { panelsPalette } from '../colors';
  import InputBool from '../components/InputBool.svelte';
  import InputPanelsCount from '../components/InputPanelsCount.svelte';
  import { showNumber } from '../utils';
  import NumberInput from '../components/InputNumber.svelte';
  import Gauge from '../components/Gauge.svelte';
  import { onDestroy } from 'svelte';

  export let expandedSection: string;
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let configId: number | undefined;
  export let panelCapacityWatts: number;
  export let showPanels: boolean;
  export let manualConfigOverride: boolean;
  export let resetToAutoConfig: () => void;

  export let googleMapsApiKey: string;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let location: google.maps.LatLng;
  export let map: google.maps.Map;

  const icon = 'home';
  const title = 'Building Insights endpoint';

  let requestSent = false;
  let requestError: RequestError | undefined;
  let apiResponseDialog: MdDialog;
  
  // Keep track of the last requested location to prevent duplicate requests
  let lastRequestedLocation: google.maps.LatLng | undefined;
  let locationChangeTimeout: number | undefined;

  let panelConfig: SolarPanelConfig | undefined;
  $: if (buildingInsights && configId !== undefined) {
    panelConfig = buildingInsights.solarPotential.solarPanelConfigs[configId];
  }

  let solarPanels: google.maps.Polygon[] = [];
  $: solarPanels.map((panel, i) =>
    panel.setMap(showPanels && panelConfig && i < panelConfig.panelsCount ? map : null),
  );

  let panelCapacityRatio = 1.0;
  $: if (buildingInsights) {
    const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
    panelCapacityRatio = panelCapacityWatts / defaultPanelCapacity;
  }

  // Helper function to compare locations with tolerance for floating point precision
  function locationsEqual(loc1: google.maps.LatLng, loc2: google.maps.LatLng, tolerance = 0.00001): boolean {
    return Math.abs(loc1.lat() - loc2.lat()) < tolerance && 
           Math.abs(loc1.lng() - loc2.lng()) < tolerance;
  }

  export async function showSolarPotential(location: google.maps.LatLng, forceRetry = false) {
    // If we already have building insights for this location and no error, don't refetch unless forced
    if (requestSent || (!forceRetry && lastRequestedLocation && 
        locationsEqual(lastRequestedLocation, location) && 
        buildingInsights && !requestError)) {
      console.log('Using existing building insights, skipping API call');
      
      // Still create solar panels if they don't exist but we have building insights
      if (buildingInsights && solarPanels.length === 0) {
        createSolarPanels();
      }
      return;
    }

    console.log('showSolarPotential', { forceRetry, lat: location.lat(), lng: location.lng() });
    
    // Only reset buildingInsights if we're making a new request
    if (!buildingInsights || forceRetry) {
      buildingInsights = undefined;
    }
    requestError = undefined;
    lastRequestedLocation = location;

    // Clear existing panels
    solarPanels.forEach((panel) => panel.setMap(null));
    solarPanels = [];

    requestSent = true;
    try {
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
      console.log('Successfully fetched building insights');
    } catch (e) {
      console.error('Error fetching building insights:', e);
      requestError = e as RequestError;
      // Don't return early - let finally block execute
    } finally {
      requestSent = false;
    }

    // Only proceed if we have building insights and no error
    if (!buildingInsights || requestError) {
      return;
    }

    createSolarPanels();
  }

  // Separate function to create solar panels from building insights
  function createSolarPanels() {
    if (!buildingInsights) return;

    // Create the solar panels on the map.
    const solarPotential = buildingInsights.solarPotential;
    const palette = createPalette(panelsPalette).map(rgbToColor);
    const minEnergy = solarPotential.solarPanels.slice(-1)[0].yearlyEnergyDcKwh;
    const maxEnergy = solarPotential.solarPanels[0].yearlyEnergyDcKwh;
    solarPanels = solarPotential.solarPanels.map((panel) => {
      const [w, h] = [solarPotential.panelWidthMeters / 2, solarPotential.panelHeightMeters / 2];
      const points = [
        { x: +w, y: +h }, // top right
        { x: +w, y: -h }, // bottom right
        { x: -w, y: -h }, // bottom left
        { x: -w, y: +h }, // top left
        { x: +w, y: +h }, //  top right
      ];
      const orientation = panel.orientation == 'PORTRAIT' ? 90 : 0;
      const azimuth = solarPotential.roofSegmentStats[panel.segmentIndex].azimuthDegrees;
      const colorIndex = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255);
      return new google.maps.Polygon({
        paths: points.map(({ x, y }) =>
          geometryLibrary.spherical.computeOffset(
            { lat: panel.center.latitude, lng: panel.center.longitude },
            Math.sqrt(x * x + y * y),
            Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth,
          ),
        ),
        strokeColor: '#B0BEC5',
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: palette[colorIndex],
        fillOpacity: 0.9,
      });
    });
  }

  // Watch for buildingInsights changes and create panels if needed
  $: if (buildingInsights && solarPanels.length === 0) {
    createSolarPanels();
  }

  // Function to handle retry with proper flag
  function handleRetry() {
    console.log('Retry button clicked');
    if (lastRequestedLocation) {
      showSolarPotential(lastRequestedLocation, true);
    }
  }

  // Debounced reactive statement for location changes to prevent excessive API calls
  $: if (location) {
    if (locationChangeTimeout) {
      clearTimeout(locationChangeTimeout);
    }
    locationChangeTimeout = setTimeout(() => {
      showSolarPotential(location);
    }, 300) as any; // 300ms debounce
  }

  // Cleanup timeout on component destroy
  onDestroy(() => {
    if (locationChangeTimeout) {
      clearTimeout(locationChangeTimeout);
    }
  });
</script>

<style>
  @media (max-width: 768px) {
    .absolute.top-0.left-0.w-72 {
      position: static !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .m-2 {
      margin: 0.5rem !important;
    }
    .p-4 {
      padding: 1rem !important;
    }
    .flex, .flex-col {
      flex-direction: column !important;
      gap: 0.75rem !important;
      align-items: stretch !important;
    }
    .w-full {
      width: 100% !important;
      max-width: 100% !important;
    }
    .justify-around {
      justify-content: stretch !important;
    }
    .rounded-lg, .shadow-md {
      border-radius: 1rem !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
    }
  }
</style>

{#if requestError}
  <div class="error-container on-error-container-text">
    <Expandable section={title} icon="error" {title} subtitle={requestError.error.status}>
      <div class="grid place-items-center py-2 space-y-4">
        <div class="grid place-items-center">
          <p class="body-medium">
            Error on <code>buildingInsights</code> request
          </p>
          <p class="title-large">ERROR {requestError.error.code}</p>
          <p class="body-medium"><code>{requestError.error.status}</code></p>
          <p class="label-medium">{requestError.error.message}</p>
        </div>
        <md-filled-button role={undefined} on:click={handleRetry}>
          Retry
          <md-icon slot="icon">refresh</md-icon>
        </md-filled-button>
      </div>
    </Expandable>
  </div>
{:else if !buildingInsights}
  <div class="grid py-8 place-items-center">
    <md-circular-progress four-color indeterminate />
  </div>
{:else if configId !== undefined && panelConfig}
  <Expandable
    bind:section={expandedSection}
    {icon}
    {title}
    subtitle={`Yearly energy: ${(
      (panelConfig.yearlyEnergyDcKwh * panelCapacityRatio) /
      1000
    ).toFixed(2)} MWh`}
    secondary={false}
  >
    <div class="flex flex-col space-y-2 px-2" style="color: rgb(14, 14, 14);">
      <span class="outline-text label-medium" style="color: rgb(14, 14, 14);">
        <b>{title}</b> provides data on the location, dimensions & solar potential of a building.
      </span>
      
      <!-- Show data freshness indicator -->
      {#if buildingInsights}
        <div class="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-md">
          <md-icon class="text-green-600 text-sm">check_circle</md-icon>
          <span class="text-green-700 label-small">Data loaded successfully</span>
        </div>
      {/if}

      <InputPanelsCount
        bind:configId
        solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
      />
      
      {#if manualConfigOverride}
        <div class="flex items-center space-x-2 px-2 py-1 bg-blue-50 rounded-md">
          <md-icon class="text-blue-600">settings</md-icon>
          <span class="text-blue-700 label-small flex-grow">Manual panel count selected</span>
          <md-text-button role={undefined} on:click={resetToAutoConfig}>
            Auto
            <md-icon slot="icon">refresh</md-icon>
          </md-text-button>
        </div>
      {/if}
      <NumberInput
        bind:value={panelCapacityWatts}
        icon="bolt"
        label="Panel capacity"
        suffix="Watts"
      />
      <InputBool bind:value={showPanels} label="Solar panels" />

      <!-- <div class="grid justify-items-end">
        <md-filled-tonal-button role={undefined} on:click={() => apiResponseDialog.show()}>
          API response
        </md-filled-tonal-button> -->
      <!-- </div> -->

      <md-dialog bind:this={apiResponseDialog}>
        <div slot="headline">
          <div class="flex items-center primary-text">
            <md-icon>{icon}</md-icon>
            <b>&nbsp;{title}</b>
          </div>
        </div>
        <div slot="content">
          <Show value={buildingInsights} label="buildingInsightsResponse" />
        </div>
        <div slot="actions">
          <md-text-button role={undefined} on:click={() => apiResponseDialog.close()}>
            Close
          </md-text-button>
        </div>
      </md-dialog>
    </div>
  </Expandable>

  {#if expandedSection == title}
  <div class="md:absolute md:top-16 md:left-0 md:w-72 w-full">
    <div class="flex flex-col space-y-2 m-2">
      <SummaryCard
        {icon}
        {title}
        rows={[
          {
            icon: 'wb_sunny',
            name: 'Annual sunshine',
            value: showNumber(buildingInsights.solarPotential.maxSunshineHoursPerYear),
            units: 'hr',
          },
          {
            icon: 'square_foot',
            name: 'Roof area',
            value: showNumber(buildingInsights.solarPotential.wholeRoofStats.areaMeters2),
            units: 'm²',
          },
          {
            icon: 'solar_power',
            name: 'Max panel count',
            value: showNumber(buildingInsights.solarPotential.solarPanels.length),
            units: 'panels',
          },
          {
            icon: 'co2',
            name: 'CO₂ savings',
            value: showNumber(buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh),
            units: 'Kg/MWh',
          },
        ]}
      />
  
      <div class="p-4 w-full surface on-surface-text rounded-lg shadow-md">
        <div class="flex flex-col md:flex-row md:justify-around space-y-4 md:space-y-0">
          <Gauge
            icon="solar_power"
            title="Panels count"
            label={showNumber(panelConfig.panelsCount)}
            labelSuffix={`/ ${showNumber(solarPanels.length)}`}
            max={solarPanels.length}
            value={panelConfig.panelsCount}
          />
  
          <Gauge
            icon="energy_savings_leaf"
            title="Yearly energy"
            label={showNumber((panelConfig?.yearlyEnergyDcKwh ?? 0) * panelCapacityRatio)}
            labelSuffix="KWh"
            max={buildingInsights.solarPotential.solarPanelConfigs.slice(-1)[0]
              .yearlyEnergyDcKwh * panelCapacityRatio}
            value={panelConfig.yearlyEnergyDcKwh * panelCapacityRatio}
          />
        </div>
      </div>
    </div>
  </div>
  
  {/if}
{/if}
