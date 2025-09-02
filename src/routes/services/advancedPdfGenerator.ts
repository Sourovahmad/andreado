import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BuildingInsightsResponse, SolarPanelConfig } from '../solar';
import { showMoney, showNumber } from '../utils';

// Enhanced color palette matching the reference PDF
const Colors = {
  primary: [45, 77, 49] as [number, number, number],      // Klaryo green
  secondary: [249, 200, 70] as [number, number, number],   // Yellow accent
  tertiary: [241, 90, 41] as [number, number, number],    // Orange accent
  success: [76, 175, 80] as [number, number, number],     // Success green
  warning: [255, 87, 34] as [number, number, number],     // Warning red
  textDark: [33, 33, 33] as [number, number, number],     // Dark text
  textMedium: [85, 85, 85] as [number, number, number],   // Medium gray
  textLight: [136, 136, 136] as [number, number, number], // Light gray
  background: [248, 250, 252] as [number, number, number], // Light background
  white: [255, 255, 255] as [number, number, number],     // Pure white
  border: [224, 224, 224] as [number, number, number],    // Light border
  lightGreen: [200, 230, 201] as [number, number, number], // Light green
  lightBlue: [187, 222, 251] as [number, number, number],  // Light blue
};

export interface AdvancedPDFReportData {
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
  // Calculated values
  installationSizeKw: number;
  installationCostTotal: number;
  yearlyKwhEnergyConsumption: number;
  yearlyProductionAcKwh: number;
  totalCostWithSolar: number;
  totalCostWithoutSolar: number;
  savings: number;
  breakEvenYear: number;
  energyCovered: number;
  reportDate: Date;
  // Customer data
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export class AdvancedPDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private contentWidth: number;
  private pageNumber: number = 1;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.doc.setFont('helvetica');
  }

  async generateAdvancedSolarReport(data: AdvancedPDFReportData): Promise<jsPDF> {
    // Page 1: Cover page
    this.addCoverPage(data);
    
    // Page 2: 10-year projection
    this.addNewPage();
    this.add10YearProjectionPage(data);
    
    // Page 3: Future scenario
    this.addNewPage();
    this.addFutureScenarioPage(data);
    
    // Page 4: Starting data
    this.addNewPage();
    this.addStartingDataPage(data);
    
    // Page 5: Current situation (blank in reference)
    this.addNewPage();
    
    // Page 6: Current situation analysis
    this.addNewPage();
    this.addCurrentSituationPage(data);
    
    // Page 7: Economic savings estimate
    this.addNewPage();
    this.addEconomicSavingsPage(data);
    
    // Page 8: Conclusions
    this.addNewPage();
    this.addConclusionsPage(data);
    
    // Page 9: What is energy photography
    this.addNewPage();
    this.addEnergyPhotographyPage(data);
    
    // Page 10: Energy usage analysis
    this.addNewPage();
    this.addEnergyUsagePage(data);
    
    // Additional pages for detailed analysis...
    this.addTechnicalPages(data);

    return this.doc;
  }

  private addCoverPage(data: AdvancedPDFReportData) {
    // Header text
    this.doc.setTextColor(...Colors.textDark);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Richiedi una nuova analisi su Klaryo.it', this.pageWidth / 2, 20, { align: 'center' });

    // Klaryo logo and text (simplified representation)
    this.currentY = 50;
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.primary);
    
    // Logo placeholder (star-like symbol)
    this.doc.setFillColor(...Colors.secondary);
    const logoX = this.pageWidth / 2 - 15;
    const logoY = this.currentY;
    
    // Draw a simple star-like logo
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = logoX + Math.cos(angle) * 8;
      const y1 = logoY + Math.sin(angle) * 8;
      const x2 = logoX + Math.cos(angle) * 12;
      const y2 = logoY + Math.sin(angle) * 12;
      this.doc.setLineWidth(2);
      this.doc.setDrawColor(...Colors.secondary);
      this.doc.line(logoX, logoY, x2, y2);
    }
    
    // Klaryo text
    this.doc.text('Klaryo', this.pageWidth / 2 + 20, this.currentY + 5, { align: 'left' });
    
    this.currentY += 40;

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textMedium);
    const subtitle = 'Klaryo non offre soluzioni nell\'ambito del\nfotovoltaico, Klaryo è il tuo migliore\nalleato per aiutarti a comprendere qual è la\nmiglior scelta da fare per rendere più\nefficiente la tua abitazione.';
    const lines = subtitle.split('\n');
    lines.forEach((line, index) => {
      this.doc.text(line, this.pageWidth / 2, this.currentY + (index * 6), { align: 'center' });
    });
    
    this.currentY += 60;

    // Main title
    this.doc.setFontSize(48);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Fotografia', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.text('energetica', this.pageWidth / 2, this.currentY + 20, { align: 'center' });
    
    this.currentY += 50;

    // Date
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.reportDate.toLocaleDateString('it-IT').replace(/\//g, '-'), this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 30;

    // Customer information
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Nome e Cognome: ${data.customerName || 'SIMONE CAIAZZO'}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.text(`Indirizzo di installazione: ${data.location.address || 'PIAZZA ROMA 30, 41121 MODENA MO'}`, this.pageWidth / 2, this.currentY + 10, { align: 'center' });
    this.doc.text(`Email: ${data.customerEmail || 'hello@digitaloriented.it'}`, this.pageWidth / 2, this.currentY + 20, { align: 'center' });
    this.doc.text(`Telefono: ${data.customerPhone || '3913633776'}`, this.pageWidth / 2, this.currentY + 30, { align: 'center' });

    // 3D House illustration (simplified)
    this.currentY += 60;
    this.add3DHouseIllustration();

    // Footer
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.text('Analisi a cura di Klaryo', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
  }

  private add3DHouseIllustration() {
    // Simplified 3D house illustration
    const centerX = this.pageWidth / 2;
    const centerY = this.currentY;

    // Base platform (green)
    this.doc.setFillColor(...Colors.success);
    this.doc.ellipse(centerX, centerY + 20, 60, 15, 'F');

    // House base
    this.doc.setFillColor(240, 240, 240);
    this.doc.setDrawColor(...Colors.border);
    this.doc.rect(centerX - 25, centerY - 15, 50, 30, 'FD');

    // Solar panels on roof
    this.doc.setFillColor(...Colors.tertiary);
    this.doc.rect(centerX - 20, centerY - 25, 15, 8, 'F');
    this.doc.rect(centerX + 5, centerY - 25, 15, 8, 'F');

    // Windows
    this.doc.setFillColor(...Colors.lightBlue);
    this.doc.rect(centerX - 20, centerY - 5, 8, 8, 'F');
    this.doc.rect(centerX + 12, centerY - 5, 8, 8, 'F');

    // Door
    this.doc.setFillColor(139, 69, 19);
    this.doc.rect(centerX - 3, centerY + 5, 6, 10, 'F');

    // Trees
    this.doc.setFillColor(...Colors.success);
    this.doc.circle(centerX - 40, centerY, 8, 'F');
    this.doc.circle(centerX + 40, centerY, 6, 'F');

    // Sun
    this.doc.setFillColor(...Colors.secondary);
    this.doc.circle(centerX + 50, centerY - 30, 8, 'F');

    // Charging station
    this.doc.setFillColor(...Colors.textMedium);
    this.doc.rect(centerX + 30, centerY + 5, 15, 10, 'F');
    this.doc.setFillColor(...Colors.secondary);
    this.doc.rect(centerX + 32, centerY + 7, 3, 6, 'F');
  }

  private add10YearProjectionPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 80;
    
    // Title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Proiezione in 10 anni', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 40;

    // Line separator
    this.doc.setDrawColor(...Colors.border);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 20;

    // Cost breakdown
    const installationCost = data.installationCostTotal;
    const remainingBills = data.totalCostWithSolar - installationCost;
    const totalWithSolar = data.totalCostWithSolar;
    
    // Energy sale and deductions
    const energySale = (data.yearlyProductionAcKwh * 0.1 * 10); // Simplified
    const deductions = 1400; // From reference
    const energyTotal = energySale + deductions;
    
    // Final calculations
    const totalWithoutSolar = data.totalCostWithoutSolar;
    const totalSavings = data.savings;

    this.addProjectionRow('Costo impianto', `${installationCost.toFixed(0)}€`);
    this.addProjectionRow('Bollette residue', `${remainingBills.toFixed(2)} €`);
    this.addProjectionRow('TOT', `${totalWithSolar.toFixed(2)} €`, true);
    
    this.currentY += 15;
    
    this.addProjectionRow('Vendita energia', `${energySale.toFixed(2)} €`);
    this.addProjectionRow('Detrazioni', `${deductions} €`);
    this.addProjectionRow('TOT', `${energyTotal.toFixed(2)} €`, true);
    
    this.currentY += 15;
    
    this.addProjectionRow('Costi totali senza impianto', `${totalWithoutSolar.toFixed(1)} €`);
    this.addProjectionRow('Costi totali con impianto', `${totalWithSolar.toFixed(2)} €`);
    
    this.currentY += 20;
    
    // Final savings
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('RISPARMIO TOTALE IN 10 ANNI', this.margin, this.currentY);
    this.currentY += 15;
    
    this.doc.setFontSize(24);
    this.doc.setTextColor(...Colors.success);
    this.doc.text(`${totalSavings.toFixed(2)}€`, this.margin, this.currentY);

    // Footer
    this.addPageFooter();
  }

  private addFutureScenarioPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 80;
    
    // Title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Scenario futuro', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 20;

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textMedium);
    const subtitle = 'Qual è la tua situazione attuale? Sulla base dei dati\nche ci hai fornito, questa è la fotografia attuale dei tuoi\ncosti. [testo da rivedere]';
    const lines = subtitle.split('\n');
    lines.forEach((line, index) => {
      this.doc.text(line, this.pageWidth / 2, this.currentY + (index * 8), { align: 'center' });
    });
    
    this.currentY += 60;

    // Visual comparison with house illustration
    this.addScenarioComparison(data);

    // Footer
    this.addPageFooter();
  }

  private addScenarioComparison(data: AdvancedPDFReportData) {
    const centerX = this.pageWidth / 2;
    
    // Installation cost in center
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.warning);
    this.doc.text('Costo dell\'impianto', centerX, this.currentY, { align: 'center' });
    
    this.doc.setFontSize(24);
    this.doc.text(`- ${data.installationCostTotal.toFixed(0)}€`, centerX, this.currentY + 15, { align: 'center' });
    
    // Left side - Expenses
    const leftX = this.margin + 30;
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.warning);
    this.doc.text('€ USCITE', leftX, this.currentY + 40);
    
    this.doc.setFontSize(16);
    this.doc.text(`-${data.monthlyAverageEnergyBill.toFixed(2)} €`, leftX, this.currentY + 60);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Totale bollette\nannuali con\nimpianto\nfotovoltaico', leftX, this.currentY + 80);

    // Right side - Income
    const rightX = this.pageWidth - this.margin - 30;
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.success);
    this.doc.text('ENTRATE', rightX, this.currentY + 40, { align: 'right' });
    
    const energySale = (data.yearlyProductionAcKwh * 0.1).toFixed(2);
    this.doc.setFontSize(16);
    this.doc.text(`+ ${energySale} €`, rightX, this.currentY + 60, { align: 'right' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Vendita energia', rightX, this.currentY + 80, { align: 'right' });
    
    this.doc.text('+140 €', rightX, this.currentY + 110, { align: 'right' });
    this.doc.text('Detrazioni', rightX, this.currentY + 125, { align: 'right' });
    
    // Total savings
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.success);
    this.doc.text(`${data.savings.toFixed(1)} €`, rightX, this.currentY + 160, { align: 'right' });
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Risparmio\nbolletta', rightX, this.currentY + 175, { align: 'right' });

    // House illustration in center
    this.currentY += 90;
    this.addSimpleHouseIllustration(centerX, this.currentY);
  }

  private addSimpleHouseIllustration(x: number, y: number) {
    // House base
    this.doc.setFillColor(220, 220, 220);
    this.doc.setDrawColor(...Colors.border);
    this.doc.rect(x - 20, y - 10, 40, 25, 'FD');

    // Solar panels
    this.doc.setFillColor(...Colors.tertiary);
    this.doc.rect(x - 15, y - 20, 12, 6, 'F');
    this.doc.rect(x + 3, y - 20, 12, 6, 'F');

    // Windows
    this.doc.setFillColor(...Colors.lightBlue);
    this.doc.rect(x - 15, y - 5, 6, 6, 'F');
    this.doc.rect(x + 9, y - 5, 6, 6, 'F');
  }

  private addStartingDataPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 80;
    
    // Title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Dati di partenza', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 40;

    // Line separator
    this.doc.setDrawColor(...Colors.border);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 30;

    // Data rows
    this.addDataRow('Spesa annua per l\'energia', `${(data.monthlyAverageEnergyBill * 12).toFixed(2)} €`);
    this.addDataRow('Consumo annuo', `${data.yearlyKwhEnergyConsumption.toFixed(0)} kWh`);
    this.addDataRow('Prezzo effettivo dell\'energia', `${data.energyCostPerKwh.toFixed(2)} €/kWh`);
    
    this.currentY += 40;

    // Line separator
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 40;

    // Current cost highlight
    this.doc.setFillColor(...Colors.warning);
    this.doc.setDrawColor(...Colors.warning);
    this.doc.roundedRect(this.margin, this.currentY, 15, 15, 2, 2, 'FD');
    
    this.doc.setTextColor(...Colors.white);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('✕', this.margin + 7.5, this.currentY + 10, { align: 'center' });
    
    this.doc.setTextColor(...Colors.warning);
    this.doc.setFontSize(16);
    this.doc.text('QUANTO PAGHI:', this.margin + 25, this.currentY + 10);
    
    this.currentY += 20;
    this.doc.setFontSize(24);
    this.doc.text(`${data.energyCostPerKwh.toFixed(2)}€/kWh`, this.margin + 25, this.currentY);
    
    this.currentY += 40;

    // Recommended cost
    this.doc.setFillColor(...Colors.success);
    this.doc.setDrawColor(...Colors.success);
    this.doc.roundedRect(this.margin, this.currentY, 15, 15, 2, 2, 'FD');
    
    this.doc.setTextColor(...Colors.white);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('⚠', this.margin + 7.5, this.currentY + 10, { align: 'center' });
    
    this.doc.setTextColor(...Colors.success);
    this.doc.setFontSize(16);
    this.doc.text('QUANTO DOVRESTI PAGARE:', this.margin + 25, this.currentY + 10);
    
    this.currentY += 20;
    this.doc.setFontSize(24);
    this.doc.text('0.33 €/kWh', this.margin + 25, this.currentY);

    // Footer
    this.addPageFooter();
  }

  private addCurrentSituationPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 80;
    
    // Title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Situazione attuale', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 20;

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textMedium);
    const subtitle = 'Qual è la tua situazione attuale? Sulla base dei dati\nche ci hai fornito, questa è la fotografia attuale dei tuoi\ncosti.';
    const lines = subtitle.split('\n');
    lines.forEach((line, index) => {
      this.doc.text(line, this.pageWidth / 2, this.currentY + (index * 8), { align: 'center' });
    });
    
    this.currentY += 80;

    // Current situation visualization
    this.addCurrentSituationVisualization(data);

    // Footer
    this.addPageFooter();
  }

  private addCurrentSituationVisualization(data: AdvancedPDFReportData) {
    const centerX = this.pageWidth / 2;
    
    // Left side - Current annual cost
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.warning);
    this.doc.text('€', this.margin, this.currentY);
    
    this.doc.setFontSize(24);
    this.doc.text(`-${(data.monthlyAverageEnergyBill * 12).toFixed(2)} €`, this.margin, this.currentY + 20);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Totale bollette\nannuali senza\nimpianto\nfotovoltaico', this.margin, this.currentY + 40);

    // Right side - Cost calculation
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('- €', this.pageWidth - this.margin - 30, this.currentY, { align: 'right' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Calcolo della spesa\nenergetica su 10 anni con\naggiunta di un ipotetico\naumento del 5% ogni\nanno', this.pageWidth - this.margin - 30, this.currentY + 40, { align: 'right' });

    // House with sad face in center
    this.currentY += 60;
    this.addSadHouseIllustration(centerX, this.currentY);
  }

  private addSadHouseIllustration(x: number, y: number) {
    // House base
    this.doc.setFillColor(...Colors.success);
    this.doc.rect(x - 20, y - 10, 40, 25, 'F');

    // Sad face
    this.doc.setFillColor(...Colors.secondary);
    this.doc.circle(x, y + 5, 10, 'F');
    
    // Eyes
    this.doc.setFillColor(...Colors.textDark);
    this.doc.circle(x - 3, y + 2, 1, 'F');
    this.doc.circle(x + 3, y + 2, 1, 'F');
    
    // Sad mouth (simple line)
    this.doc.setDrawColor(...Colors.textDark);
    this.doc.setLineWidth(1);
    this.doc.line(x - 3, y + 8, x + 3, y + 8);
  }

  private addEconomicSavingsPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Stima del risparmio economico:', this.margin, this.currentY);
    this.doc.text('Immagina il tuo risparmio, oggi e domani', this.margin, this.currentY + 15);
    
    this.currentY += 25;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Ogni euro risparmiato è un passo verso una vita più serena.', this.margin, this.currentY);
    
    this.currentY += 30;

    // Today section
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('OGGI', this.margin, this.currentY);
    
    this.currentY += 20;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Totale consumo annuo: ${data.yearlyKwhEnergyConsumption.toFixed(0)} kWh`, this.margin, this.currentY);
    this.doc.text(`Totale spesa annua: ${(data.monthlyAverageEnergyBill * 12).toFixed(2)} €`, this.margin, this.currentY + 15);

    // Footer
    this.addPageFooter();
  }

  private addConclusionsPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 80;
    
    // Title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Conclusioni', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 50;

    // Solar panel icon
    this.addSolarPanelIcon(this.pageWidth / 2, this.currentY);
    this.currentY += 30;

    // Conclusion 1
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textDark);
    const text1 = `L'impianto proposto consente di coprire i consumi con un investimento che si ripaga in circa ${data.breakEvenYear + 1} anni.`;
    this.doc.text(text1, this.pageWidth / 2, this.currentY, { align: 'center', maxWidth: this.contentWidth - 40 });
    
    this.currentY += 40;

    // Growth icon
    this.addGrowthIcon(this.pageWidth / 2, this.currentY);
    this.currentY += 30;

    // Conclusion 2
    const text2 = `Dopo il periodo di rientro, i benefici economici continueranno per almeno ${data.installationLifeSpan} anni, garantendo un ottimo ritorno sull'investimento.`;
    this.doc.text(text2, this.pageWidth / 2, this.currentY, { align: 'center', maxWidth: this.contentWidth - 40 });
    
    this.currentY += 40;

    // Hand icon
    this.addHandIcon(this.pageWidth / 2, this.currentY);
    this.currentY += 30;

    // Conclusion 3
    const text3 = 'Oltre al risparmio diretto, si ottiene un guadagno passivo dalla vendita dell\'energia.';
    this.doc.text(text3, this.pageWidth / 2, this.currentY, { align: 'center', maxWidth: this.contentWidth - 40 });
    
    this.currentY += 50;

    // Final note
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.text('Se vuoi procedere con l\'installazione o avere una consulenza più dettagliata,', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.text('contattaci!', this.pageWidth / 2, this.currentY + 12, { align: 'center' });

    // Footer
    this.addPageFooter();
  }

  private addEnergyPhotographyPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Cos\'è la fotografia energetica?', this.margin, this.currentY);
    
    this.currentY += 40;

    // Description paragraphs
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textDark);
    
    const paragraph1 = 'La fotografia energetica è il primo passo per trasformare la tua casa in un esempio di efficienza e sostenibilità.';
    this.doc.text(paragraph1, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 20;
    
    const paragraph2 = 'Grazie a questo documento, potrai scoprire come migliorare il tuo sistema energetico e ridurre gli sprechi, scegliendo le soluzioni più innovative come pannelli solari, pompe di calore e tecnologie sostenibili.';
    this.doc.text(paragraph2, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 30;
    
    const paragraph3 = 'Non si tratta solo di numeri: è il tuo percorso verso un futuro più luminoso, pulito e vantaggioso.';
    this.doc.text(paragraph3, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 50;

    // Add energy efficiency illustration
    this.addEnergyEfficiencyIllustration();

    // Footer
    this.addPageFooter();
  }

  private addEnergyUsagePage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Sveliamo come utilizzi la tua energia', this.margin, this.currentY);
    
    this.currentY += 30;

    // Description
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const description = 'Ogni kWh consumato racconta qualcosa di te. Analizzando i tuoi consumi energetici, tracciamo il quadro di come e quando utilizzi l\'energia, identificando le aree in cui puoi ottenere il massimo risparmio.';
    this.doc.text(description, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 60;

    // Energy consumption section
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CONSUMO ENERGIA', this.margin, this.currentY);
    
    this.currentY += 30;

    // Customer details
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Nome e Cognome: ${data.customerName || 'SIMONE CAIAZZO'}`, this.margin, this.currentY);
    this.doc.text(`Indirizzo di installazione: ${data.location.address || 'PIAZZA ROMA 30, 41121 MODENA MO'}`, this.margin, this.currentY + 15);
    this.doc.text('Tipo di tariffa: P Netto Natura Luce 24 - V51', this.margin, this.currentY + 30);
    
    this.currentY += 50;
    
    this.doc.text(`Tipo di contratto: 3,00 kW kWh`, this.margin, this.currentY);
    this.doc.text(`Consumo annuale: ${data.yearlyKwhEnergyConsumption.toFixed(0)} kWh`, this.margin, this.currentY + 15);
    this.doc.text(`Costo al kWh: ${data.energyCostPerKwh.toFixed(2)} €/kWh`, this.margin, this.currentY + 30);

    // Footer
    this.addPageFooter();
  }

  private addTechnicalPages(data: AdvancedPDFReportData) {
    // Page: System sizing recommendations
    this.addNewPage();
    this.addSystemSizingPage(data);
    
    // Page: Energy cost analysis
    this.addNewPage();
    this.addEnergyCostAnalysisPage(data);
    
    // Page: Investment objectives
    this.addNewPage();
    this.addInvestmentObjectivesPage(data);
    
    // Page: Tax incentives
    this.addNewPage();
    this.addTaxIncentivesPage(data);
    
    // Page: Production estimates table
    this.addNewPage();
    this.addProductionEstimatesTable(data);
    
    // Page: Building location and maps
    this.addNewPage();
    this.addBuildingLocationPage(data);
    
    // Page: Detailed investment analysis
    this.addNewPage();
    this.addDetailedInvestmentPage(data);
    
    // Page: System recommendations
    this.addNewPage();
    this.addSystemRecommendationsPage(data);
    
    // Page: Final comprehensive tables
    this.addNewPage();
    this.addComprehensiveProjectionTables(data);
    
    // Page: Roof segments table
    this.addNewPage();
    this.addRoofSegmentsPage(data);
    
    // Page: System benefits
    this.addNewPage();
    this.addSystemBenefitsPage(data);
  }

  private addRoofSegmentsPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Porzioni di tetto e orientamento', this.margin, this.currentY);
    
    this.currentY += 40;

    // Table headers
    const headers = ['Porzione', 'Inclinazione', 'Area'];
    const colWidth = this.contentWidth / 3;
    
    this.doc.setFillColor(...Colors.primary);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 10, 'F');
    
    this.doc.setTextColor(...Colors.white);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, i) => {
      this.doc.text(header, this.margin + (i * colWidth) + 5, this.currentY + 7);
    });
    
    this.currentY += 10;

    // Table rows (sample data)
    const panelConfig = data.buildingInsights.solarPotential.solarPanelConfigs[data.configId];
    if (panelConfig && panelConfig.roofSegmentSummaries.length > 0) {
      panelConfig.roofSegmentSummaries.forEach((segment, index) => {
        if (index % 2 === 0) {
          this.doc.setFillColor(240, 240, 240);
          this.doc.rect(this.margin, this.currentY, this.contentWidth, 8, 'F');
        }
        
        this.doc.setTextColor(...Colors.textDark);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        
        this.doc.text(`${index + 1}`, this.margin + 5, this.currentY + 6);
        this.doc.text(`${(segment.pitchDegrees || 0).toFixed(2)}`, this.margin + colWidth + 5, this.currentY + 6);
        this.doc.text(`${((segment.yearlyEnergyDcKwh || 0) / 100).toFixed(2)}`, this.margin + (2 * colWidth) + 5, this.currentY + 6);
        
        this.currentY += 8;
      });
    }

    // Footer
    this.addPageFooter();
  }

  private addSystemBenefitsPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 60;
    
    // Benefits list
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Flessibilità del sistema:', this.margin, this.currentY);
    
    this.currentY += 15;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Adattabilità a case nuove o in ristrutturazione con costi inferiori per integrazioni parziali.', this.margin, this.currentY);
    
    this.currentY += 30;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Futuro senza debito energetico:', this.margin, this.currentY);
    
    this.currentY += 15;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Riduzione dei costi dell\'80% rispetto a un impianto tradizionale.', this.margin, this.currentY);
    
    this.currentY += 30;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Indipendenza dai combustibili fossili:', this.margin, this.currentY);
    
    this.currentY += 15;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Utilizzo esclusivo di energia rinnovabile.', this.margin, this.currentY);
    
    this.currentY += 30;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Aumento del valore immobiliare:', this.margin, this.currentY);
    
    this.currentY += 15;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Un sistema energetico efficiente migliora la sostenibilità e il valore della casa.', this.margin, this.currentY);
    
    this.currentY += 50;
    
    // Contact section
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.primary);
    this.doc.text('Contatti', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 20;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Telefono: 059 788 0211', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.text('Email: info@klaryo.it', this.pageWidth / 2, this.currentY + 15, { align: 'center' });

    // Footer
    this.addPageFooter();
  }

  private addInvestmentDetailsPage(data: AdvancedPDFReportData) {
    // Header
    this.addPageHeader();
    
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Rientro dell\'investimento: Come funziona?', this.margin, this.currentY);
    
    this.currentY += 30;

    // Subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.text('Costi e incentivi', this.margin, this.currentY);
    
    this.currentY += 30;

    // Cost breakdown
    this.addDataRow('Costo impianto', `${data.installationCostTotal.toFixed(0)} €`);
    this.addDataRow('Detrazione fiscale 50% (10 anni)', '140 €/anno');
    
    this.currentY += 20;
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('Risparmio annuo e guadagni', this.margin, this.currentY);
    
    this.currentY += 20;
    
    const annualSavings = (data.monthlyAverageEnergyBill * 12 * 0.4).toFixed(2); // 40% self-consumption
    const energySale = (data.yearlyProductionAcKwh * 0.6 * 0.1).toFixed(2); // 60% sold at 0.1€/kWh
    
    this.addDataRow('Risparmio da autoconsumo (40% dei consumi)', `${annualSavings} €`);
    this.addDataRow('Guadagno dalla vendita dell\'energia (60% dell\'energia prodotta)', `${energySale} €`);
    
    const totalAnnualSaving = (parseFloat(annualSavings) + parseFloat(energySale) + 140).toFixed(2);
    this.addDataRow('Totale risparmio annuo (inclusa la detrazione fiscale)', `${totalAnnualSaving} €`, true);
    
    this.currentY += 20;
    
    // Payback calculation
    const paybackYears = (data.installationCostTotal / parseFloat(totalAnnualSaving)).toFixed(2);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Tempo di rientro dell\'investimento:', this.margin, this.currentY);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${data.installationCostTotal.toFixed(0)} € ÷ ${totalAnnualSaving} € = ${paybackYears} anni`, this.margin, this.currentY + 15);
    
    this.currentY += 40;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Dopo questo periodo, il sistema inizierà a generare risparmio puro, riducendo', this.margin, this.currentY);
    this.doc.text('il costo della bolletta e generando un guadagno dalla vendita dell\'energia in', this.margin, this.currentY + 12);
    this.doc.text('rete.', this.margin, this.currentY + 24);

    // Footer
    this.addPageFooter();
  }

  // New comprehensive page methods
  
  private addSystemSizingPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Quanto deve essere grande l\'impianto?', this.margin, this.currentY);
    
    this.currentY += 40;
    
    // Description
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const description = 'L\'obiettivo è coprire i tuoi consumi annui considerando un autoconsumo del 40% e vendendo il restante 60% in rete.';
    this.doc.text(description, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 40;
    
    // System sizing data
    const requiredProduction = data.yearlyKwhEnergyConsumption * 1.2; // 20% margin
    const recommendedPower = requiredProduction / 1100; // Assuming 1100 kWh/kWp
    const recommendedPanels = Math.ceil(recommendedPower * 1000 / data.panelCapacityWatts);
    
    this.addDataRow('Produzione annua necessaria', `${requiredProduction.toFixed(0)} kWh`);
    this.addDataRow('Potenza dell\'impianto richiesta', `${recommendedPower.toFixed(0)} kWp`);
    this.addDataRow(`Numero di pannelli necessari (da ${data.panelCapacityWatts}W)`, `${recommendedPanels} pannelli`);
    
    this.currentY += 30;
    
    this.doc.setFontSize(10);
    this.doc.text(`Abbiamo arrotondato per eccesso a ${recommendedPanels} pannelli perché è sempre meglio avere un surplus di energia. L'energia in più prodotta nei mesi più soleggiati permetterà di compensare i minori rendimenti invernali, garantendo maggiore autonomia e stabilità nei consumi domestici.`, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.addPageFooter();
  }
  
  private addEnergyCostAnalysisPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Quanto stai pagando davvero l\'energia?', this.margin, this.currentY);
    
    this.currentY += 40;
    
    // Current cost analysis
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.warning);
    this.doc.text(`Il tuo costo effettivo dell'energia è di ${data.energyCostPerKwh.toFixed(2)} €/kWh, ben più alto rispetto alla media nazionale`, this.margin, this.currentY);
    
    this.currentY += 30;
    
    // Market comparison
    this.addDataRow('Prezzo medio del mercato tutelato', '0.34 €/kWh');
    this.addDataRow('Prezzo medio del mercato libero', '0.32 €/kWh');
    
    this.currentY += 30;
    
    // Warning box
    this.doc.setFillColor(255, 248, 225);
    this.doc.setDrawColor(...Colors.warning);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 40, 5, 5, 'FD');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.warning);
    this.doc.text('⚠', this.margin + 10, this.currentY + 15);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Stai pagando più del doppio rispetto alla media! Questo significa che ogni kWh che puoi autoprodurre con il fotovoltaico ti farà risparmiare enormemente rispetto a quanto paghi oggi.', this.margin + 25, this.currentY + 15, { maxWidth: this.contentWidth - 35 });
    
    this.currentY += 60;
    
    // Call to action
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.success);
    this.doc.text('SCOPRI COME RISPARMIARE E PAGARE UN PREZZO ONESTO L\'ENERGIA', this.margin, this.currentY);
    
    this.addPageFooter();
  }

  private addInvestmentObjectivesPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('I tuoi obiettivi, il nostro impegno', this.margin, this.currentY);
    
    this.currentY += 40;
    
    // Description
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const description = 'Che tu voglia risparmiare, ridurre il tuo impatto ambientale o investire in soluzioni a lungo termine, il nostro obiettivo è allineato al tuo.';
    this.doc.text(description, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 30;
    
    this.doc.text('Ogni scelta è personalizzata per rispondere alle tue esigenze e costruire un futuro energetico su misura per te.', this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.currentY += 50;
    
    // Objectives
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Obiettivo: Indipendenza energetica', this.margin, this.currentY);
    this.doc.text(`Disponibilità di investimento: ${data.installationCostTotal.toFixed(0)}`, this.margin, this.currentY + 20);
    
    this.currentY += 60;
    
    // Solution
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.success);
    this.doc.text('SOLUZIONE PROPOSTA:', this.margin, this.currentY);
    
    this.currentY += 15;
    this.doc.setFontSize(16);
    this.doc.text('Installazione di pannelli fotovoltaici', this.margin, this.currentY);
    
    this.addPageFooter();
  }

  private addTaxIncentivesPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Incentivi e detrazioni fiscali:', this.margin, this.currentY);
    this.doc.text('Sfrutta ogni opportunità a tuo vantaggio', this.margin, this.currentY + 15);
    
    this.currentY += 50;
    
    // Bonus Casa section
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.success);
    this.doc.text('Detrazione Fiscale del 50% (Bonus Casa)', this.margin, this.currentY);
    
    this.currentY += 20;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textDark);
    const bonusText = 'Questo incentivo consente una detrazione del 50% sulle spese sostenute per l\'acquisto e l\'installazione di impianti fotovoltaici, fino a un massimo di 96.000 euro.';
    this.doc.text(bonusText, this.margin, this.currentY, { maxWidth: this.contentWidth });
    
    this.addPageFooter();
  }

  private addProductionEstimatesTable(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Stima di produzione in varie configurazioni', this.margin, this.currentY);
    
    this.currentY += 40;
    
    // Create production estimates table
    const tableHeaders = ['Potenza impianto', 'Energia prodotta (annuale)', 'Porzioni di tetto'];
    const colWidths = [this.contentWidth * 0.25, this.contentWidth * 0.35, this.contentWidth * 0.4];
    
    // Table header
    this.doc.setFillColor(...Colors.primary);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 12, 'F');
    
    this.doc.setTextColor(...Colors.white);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    
    let currentX = this.margin;
    tableHeaders.forEach((header, i) => {
      this.doc.text(header, currentX + 5, this.currentY + 8);
      currentX += colWidths[i];
    });
    
    this.currentY += 12;
    
    // Generate table data for different system sizes
    const systemSizes = [8, 10, 13, 15, 18, 20, 23, 25, 28, 30];
    
    systemSizes.forEach((kw, index) => {
      const annualProduction = kw * 1100; // Assuming 1100 kWh/kWp
      const panelsNeeded = Math.ceil(kw * 1000 / data.panelCapacityWatts);
      
      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(248, 248, 248);
        this.doc.rect(this.margin, this.currentY, this.contentWidth, 10, 'F');
      }
      
      this.doc.setTextColor(...Colors.textDark);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      
      currentX = this.margin;
      this.doc.text(`${kw} kW`, currentX + 5, this.currentY + 7);
      currentX += colWidths[0];
      
      this.doc.text(`${annualProduction.toFixed(2)}`, currentX + 5, this.currentY + 7);
      currentX += colWidths[1];
      
      this.doc.text(`Porzione 2 : ${panelsNeeded} pannelli`, currentX + 5, this.currentY + 7);
      
      this.currentY += 15;
    });
    
    this.addPageFooter();
  }

  private addBuildingLocationPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text(data.location.address || 'PIAZZA ROMA 30, 41121 MODENA MO', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 40;
    
    // Map placeholder
    this.doc.setFillColor(240, 240, 240);
    this.doc.setDrawColor(...Colors.border);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 100, 'FD');
    
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.setFontSize(12);
    this.doc.text('[Map View Placeholder]', this.pageWidth / 2, this.currentY + 50, { align: 'center' });
    
    this.currentY += 120;
    
    // Building data
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text(`Latitudine: ${data.location.coordinates.lat.toFixed(7)}`, this.margin, this.currentY);
    this.doc.text(`Longitudine: ${data.location.coordinates.lng.toFixed(6)}`, this.margin, this.currentY + 15);
    this.doc.text(`Superficie del tetto: ${data.buildingInsights.solarPotential.wholeRoofStats.areaMeters2.toFixed(2)} m²`, this.margin, this.currentY + 30);
    
    this.addPageFooter();
  }

  private addDetailedInvestmentPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('Rientro dell\'investimento: Come funziona?', this.margin, this.currentY);
    
    this.currentY += 30;
    
    // Investment breakdown
    this.addDataRow('Costo impianto', `${data.installationCostTotal.toFixed(0)} €`);
    this.addDataRow('Detrazione fiscale 50% (10 anni)', '140 €/anno');
    
    this.currentY += 20;
    
    const annualSelfConsumption = data.monthlyAverageEnergyBill * 12 * 0.4;
    const annualEnergySale = data.yearlyProductionAcKwh * 0.6 * 0.1;
    const totalAnnualBenefit = annualSelfConsumption + annualEnergySale + 140;
    
    this.addDataRow('Risparmio da autoconsumo (40%)', `${annualSelfConsumption.toFixed(2)} €`);
    this.addDataRow('Guadagno vendita energia (60%)', `${annualEnergySale.toFixed(2)} €`);
    this.addDataRow('Totale risparmio annuo', `${totalAnnualBenefit.toFixed(2)} €`, true);
    
    const paybackPeriod = data.installationCostTotal / totalAnnualBenefit;
    this.currentY += 20;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Tempo di rientro: ${paybackPeriod.toFixed(2)} anni`, this.margin, this.currentY);
    
    this.addPageFooter();
  }

  private addSystemRecommendationsPage(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.success);
    this.doc.text('POTENZA IMPIANTO CONSIGLIATA: 4 KWh', this.margin, this.currentY);
    
    this.currentY += 50;
    
    // System summary
    this.addDataRow('Costo impianto totale', `${data.installationCostTotal.toFixed(0)} €`);
    this.addDataRow('Energia venduta in un anno', `${(data.yearlyProductionAcKwh * 0.6 * 0.1).toFixed(2)} €`);
    this.addDataRow('Energia risparmiata in un anno', `${(data.monthlyAverageEnergyBill * 12 * 0.4).toFixed(2)} €`);
    this.addDataRow('Detrazione fiscale annuale', '140 €');
    
    this.addPageFooter();
  }

  private addComprehensiveProjectionTables(data: AdvancedPDFReportData) {
    this.addPageHeader();
    this.currentY = 60;
    
    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...Colors.textDark);
    this.doc.text('DOMANI (senza sistema di accumulo)', this.margin, this.currentY);
    
    this.currentY += 20;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Totale consumo annuo: ${data.yearlyKwhEnergyConsumption.toFixed(0)} kWh`, this.margin, this.currentY);
    
    // Add comprehensive table here
    this.addPageFooter();
  }

  // Helper methods for visual elements
  private addSolarPanelIcon(x: number, y: number) {
    this.doc.setFillColor(...Colors.tertiary);
    this.doc.rect(x - 10, y - 5, 20, 10, 'F');
    
    // Grid lines
    this.doc.setDrawColor(...Colors.white);
    this.doc.setLineWidth(1);
    for (let i = 1; i < 4; i++) {
      this.doc.line(x - 10 + (i * 5), y - 5, x - 10 + (i * 5), y + 5);
    }
    this.doc.line(x - 10, y, x + 10, y);
  }

  private addGrowthIcon(x: number, y: number) {
    this.doc.setFillColor(...Colors.success);
    this.doc.setDrawColor(...Colors.success);
    
    // Simple bar chart
    const bars = [3, 5, 7, 9, 6];
    bars.forEach((height, i) => {
      this.doc.rect(x - 10 + (i * 4), y - height, 3, height, 'F');
    });
    
    // Arrow
    this.doc.setLineWidth(2);
    this.doc.line(x + 12, y - 2, x + 18, y - 8);
    this.doc.line(x + 15, y - 8, x + 18, y - 8);
    this.doc.line(x + 18, y - 5, x + 18, y - 8);
  }

  private addHandIcon(x: number, y: number) {
    this.doc.setFillColor(...Colors.secondary);
    this.doc.circle(x, y, 8, 'F');
    
    // Euro symbol
    this.doc.setTextColor(...Colors.textDark);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('€', x, y + 3, { align: 'center' });
  }

  private addEnergyEfficiencyIllustration() {
    // Placeholder for energy efficiency chart/image
    const centerX = this.pageWidth / 2;
    
    this.doc.setFillColor(240, 240, 240);
    this.doc.setDrawColor(...Colors.border);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 80, 'FD');
    
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('[Energy Efficiency Chart Placeholder]', centerX, this.currentY + 40, { align: 'center' });
  }

  // Helper methods
  private addProjectionRow(label: string, value: string, isBold: boolean = false) {
    this.doc.setFontSize(isBold ? 14 : 12);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    this.doc.setTextColor(...Colors.textDark);
    
    this.doc.text(label, this.margin, this.currentY);
    this.doc.text(value, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    
    this.currentY += isBold ? 12 : 10;
  }

  private addDataRow(label: string, value: string, isBold: boolean = false) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    this.doc.setTextColor(...Colors.textDark);
    
    this.doc.text(label, this.margin, this.currentY);
    this.doc.text(value, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    
    this.currentY += 15;
  }

  private addPageHeader() {
    // Header text
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Richiedi una nuova analisi su Klaryo.it', this.pageWidth / 2, 15, { align: 'center' });
    
    // Klaryo logo (simplified)
    this.doc.setTextColor(...Colors.primary);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('⭐ Klaryo', this.margin, 35);
    
    // Subtitle
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...Colors.textMedium);
    const subtitle = 'Klaryo non offre soluzioni nell\'ambito del\nfotovoltaico, Klaryo è il tuo migliore\nalleato per aiutarti a comprendere qual è la\nmiglior scelta da fare per rendere più\nefficiente la tua abitazione.';
    const lines = subtitle.split('\n');
    lines.forEach((line, index) => {
      this.doc.text(line, this.margin, 45 + (index * 4));
    });
  }

  private addPageFooter() {
    this.doc.setTextColor(...Colors.textMedium);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Analisi a cura di Klaryo', this.pageWidth / 2, this.pageHeight - 15, { align: 'center' });
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = 20;
    this.pageNumber++;
  }
}

export async function generateAdvancedPDF(data: AdvancedPDFReportData, mapElement?: HTMLElement): Promise<void> {
  try {
    // Validate required data
    if (!data.buildingInsights || !data.buildingInsights.solarPotential) {
      throw new Error('Building insights data is missing');
    }

    if (data.configId === undefined || data.configId < 0 || 
        data.configId >= data.buildingInsights.solarPotential.solarPanelConfigs.length) {
      throw new Error('Invalid solar panel configuration');
    }

    const generator = new AdvancedPDFGenerator();
    const pdf = await generator.generateAdvancedSolarReport(data);
    
    // Generate filename
    const locationName = data.location.name || 'Unknown_Location';
    const safeLocationName = locationName
      .replace(/[^a-zA-Z0-9\s\-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
    
    const date = data.reportDate.toISOString().split('T')[0];
    const panelCount = data.buildingInsights.solarPotential.solarPanelConfigs[data.configId]?.panelsCount || 0;
    const filename = `Klaryo_Fotografia_Energetica_${safeLocationName}_${panelCount}pannelli_${date}.pdf`;
    
    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Advanced PDF generation failed:', error);
    throw error;
  }
}
