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
  import { generateAndDownloadPDF, type PDFReportData } from '../services/pdfGenerator';
  import type { BuildingInsightsResponse } from '../solar';
  import { locationStore, getLocationName } from '../stores/locationStore';
  import { panelConfigStore, getCurrentPanelConfig, getPanelCount, getYearlyEnergy } from '../stores/panelConfigStore';

  export let location: google.maps.LatLng;
  export let buildingInsights: BuildingInsightsResponse | undefined = undefined;
  export let configId: number | undefined = undefined;
  export let panelCapacityWatts: number = 400;
  export let monthlyAverageEnergyBill: number = 120;
  export let energyCostPerKwh: number = 0.3;
  export let dcToAcDerate: number = 0.85;
  export let mapElement: HTMLElement | undefined = undefined;

  // Financial parameters (these should match the ones used in SolarPotentialSection)
  const solarIncentivesPercent = 0.5; // 50% - Italian solar incentives
  const installationCostPerWatt = 2.5; // EUR per Watt
  const installationLifeSpan = 20;
  const efficiencyDepreciationFactor = 0.995;
  const costIncreaseFactor = 1.025; // Italy energy cost increase ~2.5% annually
  const discountRate = 1.03; // European interest rates

  let isGenerating = false;
  let errorMessage = '';

  async function handleDownload() {




    if (!buildingInsights || configId === undefined) {
      errorMessage = 'Please complete the solar analysis first';
      return;
    }


    // Validate required data
    if (!buildingInsights.solarPotential || !buildingInsights.solarPotential.solarPanelConfigs[configId]) {
      errorMessage = 'Solar panel configuration data is missing';
      return;
    }

    isGenerating = true;
    errorMessage = '';



    try {
      // Calculate financial data (EXACTLY matching SolarPotentialSection calculations)
      if (!buildingInsights || configId === undefined) {
        errorMessage = 'Building insights or config data is missing';
        return;
      }
      
      // Get panel config from centralized store
      const panelState = $panelConfigStore;
      const panelConfig = getCurrentPanelConfig(panelState);
      const panelCapacityRatio = panelState.panelCapacityWatts / panelState.defaultPanelCapacityWatts;
      
      if (!panelConfig) {
        errorMessage = 'Panel configuration not found';
        return;
      }
      
 
      // Get current panel capacity from store (not from props)
      const currentPanelCapacityWatts = panelState.panelCapacityWatts;
      
      // Installation calculations (matching SolarPotentialSection)
      const installationSizeKw = (panelConfig.panelsCount * currentPanelCapacityWatts) / 1000;
      const installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
      
      // Energy consumption calculations (matching SolarPotentialSection)
      const monthlyKwhEnergyConsumption = monthlyAverageEnergyBill / energyCostPerKwh;
      const yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
      
      // Energy production calculations (matching SolarPotentialSection)
      const initialAcKwhPerYear = panelConfig.yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerate;
      const yearlyProductionAcKwh = initialAcKwhPerYear * efficiencyDepreciationFactor;
      
      // Energy coverage calculation
      const energyCovered = yearlyProductionAcKwh / yearlyKwhEnergyConsumption;
      
      // 20-year calculations (matching SolarPotentialSection exactly)
      const yearlyProductionAcKwhArray = [...Array(installationLifeSpan).keys()].map(
        (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
      );
      
      const yearlyUtilityBillEstimates = yearlyProductionAcKwhArray.map((yearlyKwhEnergyProduced, year) => {
        const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
        const billEstimate =
          (billEnergyKwh * energyCostPerKwh * costIncreaseFactor ** year) / discountRate ** year;
        return Math.max(billEstimate, 0); // bill cannot be negative
      });
      
      const remainingLifetimeUtilityBill = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
      const totalCostWithSolar = installationCostTotal + remainingLifetimeUtilityBill - (installationCostTotal * solarIncentivesPercent);
      
      // Cost without solar for 20 years (matching SolarPotentialSection)
      const yearlyCostWithoutSolar = [...Array(installationLifeSpan).keys()].map(
        (year) => (monthlyAverageEnergyBill * 12 * costIncreaseFactor ** year) / discountRate ** year,
      );
      const totalCostWithoutSolar = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
      
      // Savings calculation
      const savings = totalCostWithoutSolar - totalCostWithSolar;
      
      // Break-even calculation (matching SolarPotentialSection logic)
      let costWithSolar = 0;
      const cumulativeCostsWithSolar = yearlyUtilityBillEstimates.map((billEstimate) => {
        return (costWithSolar += billEstimate + installationCostTotal - (installationCostTotal * solarIncentivesPercent));
      });
      let costWithoutSolar = 0;
      const cumulativeCostsWithoutSolar = yearlyCostWithoutSolar.map((cost) => (costWithoutSolar += cost));
      const breakEvenYear = cumulativeCostsWithSolar.findIndex((costWithSolar, i) => costWithSolar <= cumulativeCostsWithoutSolar[i]);

      // Get the current location name from the store
      const currentLocationName = getLocationName($locationStore);

  
      
      // Use the same yearly energy calculation as the UI
      const yearlyEnergyFromStore = getYearlyEnergy(panelState);
      console.log('PDFDownloadButton: yearlyEnergyFromStore should be:', yearlyEnergyFromStore);
      
      const pdfData: PDFReportData = {
        location: {
          name: currentLocationName,
          address: currentLocationName || buildingInsights!.name || 'Unknown Address',
          coordinates: { lat: location.lat(), lng: location.lng() }
        },
        buildingInsights: buildingInsights!,
        configId: configId!,
        panelCapacityWatts: currentPanelCapacityWatts, // Use current panel capacity from store
        monthlyAverageEnergyBill,
        energyCostPerKwh,
        dcToAcDerate,
        solarIncentivesPercent,
        installationCostPerWatt,
        installationLifeSpan,
        efficiencyDepreciationFactor,
        costIncreaseFactor,
        discountRate,
        installationSizeKw,
        installationCostTotal,
        yearlyKwhEnergyConsumption,
        yearlyProductionAcKwh,
        totalCostWithSolar,
        totalCostWithoutSolar,
        savings,
        breakEvenYear,
        energyCovered,
        reportDate: new Date()
      };

      await generateAndDownloadPDF(pdfData, mapElement);
    } catch (error: unknown) {
      console.error('Error generating PDF:', String(error));
      if (error instanceof Error) {
        errorMessage = `PDF generation failed: ${error.message}`;
      } else {
        errorMessage = 'Failed to generate PDF. Please try again.';
      }
    } finally {
      isGenerating = false;
    }
  }
</script>

<div class="pdf-download-container">
  <md-filled-button 
    role={undefined} 
    on:click={handleDownload}
    disabled={isGenerating || !buildingInsights || configId === undefined}
    class="pdf-download-button"
  >
    {#if isGenerating}
      <md-circular-progress-four-color slot="icon" indeterminate />
      Generating PDF...
    {:else}
      <md-icon slot="icon">download</md-icon>
      Download PDF Report
    {/if}
  </md-filled-button>
  
  {#if errorMessage}
    <div class="error-message">
      <md-icon>error</md-icon>
      <span>{errorMessage}</span>
    </div>
  {/if}
</div>

<style>
  .pdf-download-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .pdf-download-button {
    width: 100%;
    background-color: rgb(45, 77, 49) !important;
    color: white !important;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .pdf-download-button:hover:not(:disabled) {
    background-color: rgb(35, 57, 39) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(45, 77, 49, 0.3);
  }

  .pdf-download-button:disabled {
    background-color: rgb(200, 200, 200) !important;
    color: rgb(100, 100, 100) !important;
    cursor: not-allowed;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #d32f2f;
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: #ffebee;
    border-radius: 0.25rem;
    border: 1px solid #ffcdd2;
  }

  .error-message md-icon {
    color: #d32f2f;
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    .pdf-download-button {
      padding: 1rem;
      font-size: 1rem;
    }
  }
</style> 