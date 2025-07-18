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

  import type { BuildingInsightsResponse } from '../solar';
  import { findSolarConfig } from '../utils';
  import BuildingInsightsSection from './BuildingInsightsSection.svelte';
  import DataLayersSection from './DataLayersSection.svelte';
  import SolarPotentialSection from './SolarPotentialSection.svelte';
  import { onMount } from 'svelte';
  import { sidebarMobileState } from './sidebarMobileState';
  import { get } from 'svelte/store';

  export let location: google.maps.LatLng;
  export let map: google.maps.Map;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let googleMapsApiKey: string;
  export let expandedSection: string;

  let buildingInsights: BuildingInsightsResponse | undefined;

  // State (local, for desktop)
  let showPanels = true;
  let monthlyAverageEnergyBillInput = 120;
  let panelCapacityWattsInput = 400;
  let energyCostPerKwhInput = 0.3;
  let dcToAcDerateInput = 0.85;
  let configId: number | undefined;

  // For expandedSection, prefer prop, but fallback to store/local
  let expandedSectionValue: string;
  $: expandedSectionValue = isMobile ? $sidebarMobileState.expandedSection : expandedSection;

  // Sync state with store on mobile
  $: if (isMobile) {
    // Read from store
    ({
      showPanels,
      monthlyAverageEnergyBillInput,
      panelCapacityWattsInput,
      energyCostPerKwhInput,
      dcToAcDerateInput,
      configId
    } = $sidebarMobileState);
  } else {
    // Write to store if switching to mobile
    sidebarMobileState.set({
      showPanels,
      monthlyAverageEnergyBillInput,
      panelCapacityWattsInput,
      energyCostPerKwhInput,
      dcToAcDerateInput,
      expandedSection,
      configId
    });
  }

  // When user changes a value, update store if mobile
  function updateSidebarState(partial: Partial<typeof $sidebarMobileState>) {
    if (isMobile) {
      sidebarMobileState.update(state => ({ ...state, ...partial }));
    }
  }

  // Find the config that covers the yearly energy consumption.
  let yearlyKwhEnergyConsumption: number;
  $: yearlyKwhEnergyConsumption = (monthlyAverageEnergyBillInput / energyCostPerKwhInput) * 12;

  $: if (configId === undefined && buildingInsights) {
    const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
    const panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacity;
    configId = findSolarConfig(
      buildingInsights.solarPotential.solarPanelConfigs,
      yearlyKwhEnergyConsumption,
      panelCapacityRatio,
      dcToAcDerateInput,
    );
  }

  let isMobile = false;
  onMount(() => {
    isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 768;
    });
  });
</script>

<div class="flex flex-col rounded-md shadow-md">
  {#if geometryLibrary && map}
    <BuildingInsightsSection
      bind:expandedSection
      bind:buildingInsights
      bind:configId
      bind:showPanels
      bind:panelCapacityWatts={panelCapacityWattsInput}
      {googleMapsApiKey}
      {geometryLibrary}
      {location}
      {map}
      on:showPanelsChange={e => updateSidebarState({ showPanels: e.detail })}
      on:panelCapacityWattsInputChange={e => updateSidebarState({ panelCapacityWattsInput: e.detail })}
      on:configIdChange={e => updateSidebarState({ configId: e.detail })}
    />
  {/if}

  {#if buildingInsights && configId !== undefined}
    <md-divider inset />
    <DataLayersSection
      bind:expandedSection
      bind:showPanels
      {googleMapsApiKey}
      {buildingInsights}
      {geometryLibrary}
      {map}
      on:showPanelsChange={e => updateSidebarState({ showPanels: e.detail })}
    />

    <md-divider inset />
    <SolarPotentialSection
      bind:expandedSection
      bind:configId
      bind:monthlyAverageEnergyBillInput
      bind:energyCostPerKwhInput
      bind:panelCapacityWattsInput
      bind:dcToAcDerateInput
      solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
      defaultPanelCapacityWatts={buildingInsights.solarPotential.panelCapacityWatts}
      on:monthlyAverageEnergyBillInputChange={e => updateSidebarState({ monthlyAverageEnergyBillInput: e.detail })}
      on:energyCostPerKwhInputChange={e => updateSidebarState({ energyCostPerKwhInput: e.detail })}
      on:panelCapacityWattsInputChange={e => updateSidebarState({ panelCapacityWattsInput: e.detail })}
      on:dcToAcDerateInputChange={e => updateSidebarState({ dcToAcDerateInput: e.detail })}
      on:configIdChange={e => updateSidebarState({ configId: e.detail })}
    />
  {/if}
</div>
