import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BuildingInsightsResponse, SolarPanelConfig } from '../solar';
import { showMoney, showNumber } from '../utils';

export interface PDFReportData {
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  buildingInsights: BuildingInsightsResponse;
  configId: number;
  panelCapacityWatts: number;
  monthlyAverageEnergyBill: number;
  energyCostPerKwh: number;
  dcToAcDerate: number;
  solarIncentivesPercent: number;
  installationCostPerWatt: number;
  installationLifeSpan: number;
  efficiencyDepreciationFactor: number;
  costIncreaseFactor: number;
  discountRate: number;
  // Financial calculations
  installationSizeKw: number;
  installationCostTotal: number;
  yearlyKwhEnergyConsumption: number;
  yearlyProductionAcKwh: number;
  totalCostWithSolar: number;
  totalCostWithoutSolar: number;
  savings: number;
  breakEvenYear: number;
  energyCovered: number;
  // Generated date
  reportDate: Date;
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  async generateSolarReport(data: PDFReportData): Promise<jsPDF> {
    // Reset position
    this.currentY = 20;

    // Add header
    this.addHeader(data);
    this.addNewPage();

    // Add location information
    this.addLocationSection(data);
    this.addNewPage();

    // Add building insights
    this.addBuildingInsightsSection(data);
    this.addNewPage();

    // Add solar potential analysis
    this.addSolarPotentialSection(data);
    this.addNewPage();

    // Add financial analysis
    this.addFinancialAnalysisSection(data);
    this.addNewPage();

    // Add technical specifications
    this.addTechnicalSpecificationsSection(data);

    return this.doc;
  }

  private addHeader(data: PDFReportData) {
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Klaryo - Solar Potential Analysis Report', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;

    // Subtitle
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Generated on ${data.reportDate.toLocaleDateString('it-IT')}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;

    // Summary box
    this.addSummaryBox(data);
  }

  private addSummaryBox(data: PDFReportData) {
    const boxWidth = this.pageWidth - 2 * this.margin;
    const boxHeight = 60;
    
    // Draw box
    this.doc.setDrawColor(45, 77, 49);
    this.doc.setFillColor(245, 247, 250);
    this.doc.roundedRect(this.margin, this.currentY, boxWidth, boxHeight, 3, 3, 'FD');
    
    // Add content
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Quick Summary', this.margin + 10, this.currentY + 10);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const panelConfig = data.buildingInsights.solarPotential.solarPanelConfigs[data.configId];
    if (!panelConfig) {
      throw new Error('Solar panel configuration not found');
    }
    const panelCapacityRatio = data.panelCapacityWatts / data.buildingInsights.solarPotential.panelCapacityWatts;
    
    console.log('=== PDF Generator Panel Config ===');
    console.log('configId:', data.configId);
    console.log('panelConfig:', panelConfig);
    console.log('panelCapacityRatio:', panelCapacityRatio);
    console.log('panelCount:', panelConfig.panelsCount);
    console.log('data.panelCapacityWatts:', data.panelCapacityWatts);
    console.log('data.buildingInsights.solarPotential.panelCapacityWatts:', data.buildingInsights.solarPotential.panelCapacityWatts);
    console.log('yearlyEnergyDcKwh from config:', panelConfig.yearlyEnergyDcKwh);
    console.log('calculated yearly energy:', panelConfig.yearlyEnergyDcKwh * panelCapacityRatio);
    
    this.doc.text(`Location: ${data.location.name || 'Unknown'}`, this.margin + 10, this.currentY + 20);
    this.doc.text(`Solar Panels: ${panelConfig?.panelsCount || 0} panels`, this.margin + 10, this.currentY + 30);
    // Use the yearly energy value that was calculated in the PDFDownloadButton (same as UI)
    const yearlyEnergyKwh = (panelConfig?.yearlyEnergyDcKwh || 0) * panelCapacityRatio;
    console.log('PDF Generator: yearlyEnergyKwh calculated as:', yearlyEnergyKwh);
    this.doc.text(`Yearly Energy: ${showNumber(yearlyEnergyKwh)} kWh`, this.margin + 10, this.currentY + 40);
    this.doc.text(`Total Savings: ${showMoney(data.savings || 0)}`, this.margin + 10, this.currentY + 50);
    
    this.currentY += boxHeight + 20;
  }

  private addLocationSection(data: PDFReportData) {
    this.addSectionTitle('Location Information');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Property Details', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Address', data.location.address || 'N/A');
    this.addInfoRow('Coordinates', `${data.location.coordinates.lat.toFixed(6)}, ${data.location.coordinates.lng.toFixed(6)}`);
    this.addInfoRow('Postal Code', data.buildingInsights.postalCode || 'N/A');
    this.addInfoRow('Administrative Area', data.buildingInsights.administrativeArea || 'N/A');
    this.addInfoRow('Region Code', data.buildingInsights.regionCode || 'N/A');
    this.addInfoRow('Imagery Date', `${data.buildingInsights.imageryDate.month}/${data.buildingInsights.imageryDate.day}/${data.buildingInsights.imageryDate.year}`);
    this.addInfoRow('Imagery Quality', data.buildingInsights.imageryQuality || 'N/A');
  }

  private addBuildingInsightsSection(data: PDFReportData) {
    this.addSectionTitle('Building Solar Potential');
    
    const solarPotential = data.buildingInsights.solarPotential;
    const panelConfig = solarPotential.solarPanelConfigs[data.configId];
    if (!panelConfig) {
      throw new Error('Solar panel configuration not found');
    }
    const panelCapacityRatio = data.panelCapacityWatts / solarPotential.panelCapacityWatts;

    // Roof statistics
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Roof Analysis', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Total Roof Area', `${showNumber(solarPotential.wholeRoofStats.areaMeters2)} m²`);
    this.addInfoRow('Building Area', `${showNumber(solarPotential.buildingStats.areaMeters2)} m²`);
    this.addInfoRow('Max Sunshine Hours/Year', `${showNumber(solarPotential.maxSunshineHoursPerYear)} hours`);
    this.addInfoRow('Max Array Area', `${showNumber(solarPotential.maxArrayAreaMeters2)} m²`);
    this.addInfoRow('Max Panel Count', `${showNumber(solarPotential.maxArrayPanelsCount)} panels`);
    this.addInfoRow('CO₂ Offset Factor', `${showNumber(solarPotential.carbonOffsetFactorKgPerMwh)} kg/MWh`);
    
    this.currentY += 10;
    
    // Selected configuration
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Selected Configuration', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Panel Count', `${showNumber(panelConfig?.panelsCount || 0)} panels`);
    this.addInfoRow('Panel Capacity', `${showNumber(data.panelCapacityWatts || 0)} Watts`);
    this.addInfoRow('Yearly Energy Production', `${showNumber((panelConfig?.yearlyEnergyDcKwh || 0) * panelCapacityRatio)} kWh`);
    this.addInfoRow('Installation Size', `${showNumber(data.installationSizeKw || 0)} kW`);
    
    // Roof segments
    if (panelConfig.roofSegmentSummaries.length > 0) {
      this.currentY += 10;
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(45, 77, 49);
      this.doc.text('Roof Segments', this.margin, this.currentY);
      this.currentY += 10;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(60, 60, 60);
      
      (panelConfig?.roofSegmentSummaries || []).forEach((segment, index) => {
        this.doc.text(`Segment ${index + 1}:`, this.margin, this.currentY);
        this.doc.text(`  Pitch: ${(segment.pitchDegrees || 0).toFixed(1)}°, Azimuth: ${(segment.azimuthDegrees || 0).toFixed(1)}°`, this.margin + 10, this.currentY + 5);
        this.doc.text(`  Panels: ${segment.panelsCount || 0}, Energy: ${showNumber((segment.yearlyEnergyDcKwh || 0) * panelCapacityRatio)} kWh`, this.margin + 10, this.currentY + 10);
        this.currentY += 20;
      });
    }
  }

  private addSolarPotentialSection(data: PDFReportData) {
    this.addSectionTitle('Solar Potential Analysis');
    
    const panelConfig = data.buildingInsights.solarPotential.solarPanelConfigs[data.configId];
    const panelCapacityRatio = data.panelCapacityWatts / data.buildingInsights.solarPotential.panelCapacityWatts;

    // Energy analysis
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Energy Analysis', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Current Energy Consumption', `${showNumber(data.yearlyKwhEnergyConsumption)} kWh/year`);
    this.addInfoRow('Solar Energy Production', `${showNumber(data.yearlyProductionAcKwh)} kWh/year`);
    this.addInfoRow('Energy Coverage', `${Math.round(data.energyCovered * 100)}%`);
    this.addInfoRow('Monthly Energy Bill', showMoney(data.monthlyAverageEnergyBill));
    this.addInfoRow('Energy Cost per kWh', showMoney(data.energyCostPerKwh));
    
    this.currentY += 10;
    
    // Environmental impact
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Environmental Impact', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const co2Offset = (data.yearlyProductionAcKwh / 1000) * data.buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh;
    this.addInfoRow('CO₂ Offset per Year', `${showNumber(co2Offset)} kg`);
    this.addInfoRow('Equivalent Trees Planted', `${Math.round(co2Offset / 22)} trees/year`); // Average tree absorbs 22kg CO2/year
  }

  private addFinancialAnalysisSection(data: PDFReportData) {
    this.addSectionTitle('Financial Analysis');
    
    // Installation costs
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Installation Costs', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Installation Size', `${showNumber(data.installationSizeKw)} kW`);
    this.addInfoRow('Cost per Watt', showMoney(data.installationCostPerWatt));
    this.addInfoRow('Total Installation Cost', showMoney(data.installationCostTotal));
    this.addInfoRow('Solar Incentives', `${(data.solarIncentivesPercent * 100).toFixed(1)}%`);
    this.addInfoRow('Incentive Amount', showMoney(data.installationCostTotal * data.solarIncentivesPercent));
    this.addInfoRow('Net Installation Cost', showMoney(data.installationCostTotal * (1 - data.solarIncentivesPercent)));
    
    this.currentY += 10;
    
    // Cost comparison
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('20-Year Cost Comparison', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Cost without Solar', showMoney(data.totalCostWithoutSolar));
    this.addInfoRow('Cost with Solar', showMoney(data.totalCostWithSolar));
    this.addInfoRow('Total Savings', showMoney(data.savings));
    this.addInfoRow('Break-even Year', data.breakEvenYear >= 0 ? `${data.breakEvenYear + new Date().getFullYear() + 1} (${data.breakEvenYear + 1} years)` : 'Not reached');
    
    this.currentY += 10;
    
    // Assumptions
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Financial Assumptions', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Installation Lifespan', `${data.installationLifeSpan} years`);
    this.addInfoRow('DC to AC Derate', `${(data.dcToAcDerate * 100).toFixed(1)}%`);
    this.addInfoRow('Efficiency Decline', `${((1 - data.efficiencyDepreciationFactor) * 100).toFixed(2)}% per year`);
    this.addInfoRow('Energy Cost Increase', `${((data.costIncreaseFactor - 1) * 100).toFixed(1)}% per year`);
    this.addInfoRow('Discount Rate', `${((data.discountRate - 1) * 100).toFixed(1)}% per year`);
  }

  private addTechnicalSpecificationsSection(data: PDFReportData) {
    this.addSectionTitle('Technical Specifications');
    
    const solarPotential = data.buildingInsights.solarPotential;
    
    // Panel specifications
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('Panel Specifications', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    this.addInfoRow('Panel Capacity', `${showNumber(solarPotential.panelCapacityWatts)} Watts`);
    this.addInfoRow('Panel Dimensions', `${solarPotential.panelWidthMeters.toFixed(2)}m × ${solarPotential.panelHeightMeters.toFixed(2)}m`);
    this.addInfoRow('Panel Lifetime', `${solarPotential.panelLifetimeYears} years`);
    this.addInfoRow('DC to AC Conversion', `${(data.dcToAcDerate * 100).toFixed(1)}%`);
    
    this.currentY += 10;
    
    // System specifications
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text('System Specifications', this.margin, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const panelConfig = solarPotential.solarPanelConfigs[data.configId];
    this.addInfoRow('Total Panels', `${showNumber(panelConfig?.panelsCount || 0)}`);
    this.addInfoRow('System Capacity', `${showNumber(data.installationSizeKw || 0)} kW`);
    this.addInfoRow('Annual Energy Production', `${showNumber((panelConfig?.yearlyEnergyDcKwh || 0) * (data.panelCapacityWatts / solarPotential.panelCapacityWatts))} kWh`);
    this.addInfoRow('Peak Power Output', `${showNumber((panelConfig?.panelsCount || 0) * (data.panelCapacityWatts || 0) / 1000)} kW`);
  }

  private addSectionTitle(title: string) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(45, 77, 49);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addInfoRow(label: string, value: string) {
    // Ensure both label and value are valid strings
    const safeLabel = label || 'Unknown';
    const safeValue = value || 'N/A';
    
    this.doc.text(`${safeLabel}:`, this.margin, this.currentY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(safeValue, this.margin + 80, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.currentY += 7;
  }

  private addNewPage() {
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  async addMapScreenshot(mapElement: HTMLElement): Promise<void> {
    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      this.addNewPage();
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(45, 77, 49);
      this.doc.text('Location Map', this.margin, this.currentY);
      this.currentY += 10;
      
      this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 20;
    } catch (error) {
      console.error('Failed to capture map screenshot:', error);
    }
  }
}

export async function generateAndDownloadPDF(data: PDFReportData, mapElement?: HTMLElement): Promise<void> {
  try {
    // Validate required data
    if (!data.buildingInsights || !data.buildingInsights.solarPotential) {
      throw new Error('Building insights data is missing');
    }

    if (data.configId === undefined || data.configId < 0 || 
        data.configId >= data.buildingInsights.solarPotential.solarPanelConfigs.length) {
      throw new Error('Invalid solar panel configuration');
    }

    const generator = new PDFGenerator();
    const pdf = await generator.generateSolarReport(data);
    
    if (mapElement) {
      await generator.addMapScreenshot(mapElement);
    }
    
    // Generate filename with better formatting
    const locationName = data.location.name || 'Unknown_Location';
    console.log('=== PDF Filename Generation ===');
    console.log('Original location name:', locationName);
    console.log('Location data:', data.location);
    
    const safeLocationName = locationName
      .replace(/[^a-zA-Z0-9\s\-]/g, '') // Remove special characters but keep spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .substring(0, 50); // Limit length to avoid filename issues
    
    console.log('Safe location name:', safeLocationName);
    
    const date = data.reportDate.toISOString().split('T')[0];
    const panelCount = data.buildingInsights.solarPotential.solarPanelConfigs[data.configId]?.panelsCount || 0;
    const filename = `Klayro_Solar_Analysis_${safeLocationName}_${panelCount}panels_${date}.pdf`;
    
    console.log('Final filename:', filename);
    
    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
} 