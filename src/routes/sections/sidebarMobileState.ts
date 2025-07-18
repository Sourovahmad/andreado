import { writable } from 'svelte/store';

export interface SidebarMobileState {
  showPanels: boolean;
  monthlyAverageEnergyBillInput: number;
  panelCapacityWattsInput: number;
  energyCostPerKwhInput: number;
  dcToAcDerateInput: number;
  expandedSection: string;
  configId?: number;
}

export const sidebarMobileState = writable<SidebarMobileState>({
  showPanels: true,
  monthlyAverageEnergyBillInput: 120, // Average monthly energy bill in Italy (EUR)
  panelCapacityWattsInput: 400,
  energyCostPerKwhInput: 0.3, // Average energy cost per kWh in Italy (EUR)
  dcToAcDerateInput: 0.85,
  expandedSection: '',
  configId: undefined,
}); 