/*
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
 */

// [START solar_api_data_types]
export interface DataLayersResponse {
  imageryDate: Date;
  imageryProcessedDate: Date;
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  hourlyShadeUrls: string[];
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// https://developers.google.com/maps/documentation/solar/reference/rest/v1/buildingInsights/findClosest
export interface BuildingInsightsResponse {
  name: string;
  center: LatLng;
  boundingBox: LatLngBox;
  imageryDate: Date;
  imageryProcessedDate: Date;
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: SolarPotential;
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  panelLifetimeYears: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats: SizeAndSunshineStats;
  buildingStats: SizeAndSunshineStats;
  roofSegmentStats: RoofSegmentSizeAndSunshineStats[];
  solarPanels: SolarPanel[];
  solarPanelConfigs: SolarPanelConfig[];
  financialAnalyses: object;
}

export interface SizeAndSunshineStats {
  areaMeters2: number;
  sunshineQuantiles: number[];
  groundAreaMeters2: number;
}

export interface RoofSegmentSizeAndSunshineStats {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: SizeAndSunshineStats;
  center: LatLng;
  boundingBox: LatLngBox;
  planeHeightAtCenterMeters: number;
}

export interface SolarPanel {
  center: LatLng;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  segmentIndex: number;
  yearlyEnergyDcKwh: number;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: RoofSegmentSummary[];
}

export interface RoofSegmentSummary {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface LatLngBox {
  sw: LatLng;
  ne: LatLng;
}

export interface Date {
  year: number;
  month: number;
  day: number;
}

export interface RequestError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}
// [END solar_api_data_types]

// https://developers.google.com/maps/documentation/solar/reference/rest/v1/dataLayers
export type LayerId = 'mask' | 'dsm' | 'rgb' | 'annualFlux' | 'monthlyFlux' | 'hourlyShade';

// [START solar_api_building_insights]
/**
 * Fetches the building insights information from the Solar API.
 *   https://developers.google.com/maps/documentation/solar/building-insights
 *
 * @param  {LatLng} location      Point of interest as latitude longitude.
 * @param  {string} apiKey        Google Cloud API key.
 * @return {Promise<DataLayersResponse>}  Building Insights response.
 */
export async function findClosestBuilding(
  location: google.maps.LatLng,
  apiKey: string,
): Promise<BuildingInsightsResponse> {
  const args = {
    'location.latitude': location.lat().toFixed(5),
    'location.longitude': location.lng().toFixed(5),
    requiredQuality: "MEDIUM",
    // experiments: "EXPANDED_COVERAGE"
  };
  const params = new URLSearchParams({ ...args, key: apiKey });
  
  return rateLimiter.execute(() => 
    withRetry(async () => {
      // https://developers.google.com/maps/documentation/solar/reference/rest/v1/buildingInsights/findClosest
      const response = await fetch(`https://solar.googleapis.com/v1/buildingInsights:findClosest?${params}`);
      const content = await response.json();
      
      if (response.status !== 200) {
        console.error('findClosestBuilding\n', content);
        throw content;
      }
      
      return content;
    })
  );
}
// [END solar_api_building_insights]

// [START solar_api_data_layers]
/**
 * Fetches the data layers information from the Solar API.
 *   https://developers.google.com/maps/documentation/solar/data-layers
 *
 * @param  {LatLng} location      Point of interest as latitude longitude.
 * @param  {number} radiusMeters  Radius of the data layer size in meters.
 * @param  {string} apiKey        Google Cloud API key.
 * @return {Promise<DataLayersResponse>}  Data Layers response.
 */
export async function getDataLayerUrls(
  location: LatLng,
  radiusMeters: number,
  apiKey: string,
): Promise<DataLayersResponse> {
  const args = {
    'location.latitude': location.latitude.toFixed(5),
    'location.longitude': location.longitude.toFixed(5),
    radius_meters: radiusMeters.toString(),
    // The Solar API always returns the highest quality imagery available.
    // By default the API asks for HIGH quality, which means that HIGH quality isn't available,
    // but there is an existing MEDIUM or LOW quality, it won't return anything.
    // Here we ask for *at least* LOW quality, but if there's a higher quality available,
    // the Solar API will return us the highest quality available.
    required_quality: 'LOW',
  };
  const params = new URLSearchParams({ ...args, key: apiKey });
  
  return rateLimiter.execute(() =>
    withRetry(async () => {
      // https://developers.google.com/maps/documentation/solar/reference/rest/v1/dataLayers/get
      const response = await fetch(`https://solar.googleapis.com/v1/dataLayers:get?${params}`);
      const content = await response.json();
      
      if (response.status !== 200) {
        console.error('getDataLayerUrls\n', content);
        throw content;
      }
      
      return content;
    })
  );
}
// [END solar_api_data_layers]

// [START solar_api_data_layer_custom_type]
export interface GeoTiff {
  width: number;
  height: number;
  rasters: Array<number>[];
  bounds: Bounds;
}
// [END solar_api_data_layer_custom_type]

// [START solar_api_download_geotiff]
// npm install geotiff geotiff-geokeys-to-proj4 proj4

import * as geotiff from 'geotiff';
import * as geokeysToProj4 from 'geotiff-geokeys-to-proj4';
import proj4 from 'proj4';

/**
 * Downloads the pixel values for a Data Layer URL from the Solar API.
 *
 * @param  {string} url        URL from the Data Layers response.
 * @param  {string} apiKey     Google Cloud API key.
 * @return {Promise<GeoTiff>}  Pixel values with shape and lat/lon bounds.
 */
export async function downloadGeoTIFF(url: string, apiKey: string): Promise<GeoTiff> {

  return rateLimiter.execute(() =>
    withRetry(async () => {
      // Include your Google Cloud API key in the Data Layers URL.
      const solarUrl = url.includes('solar.googleapis.com') ? url + `&key=${apiKey}` : url;
      const response = await fetch(solarUrl);
      
      if (response.status !== 200) {
        const error = await response.json();
        console.error(`downloadGeoTIFF failed: ${url}\n`, error);
        throw error;
      }

      // Get the GeoTIFF rasters, which are the pixel values for each band.
      const arrayBuffer = await response.arrayBuffer();
      const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();

      // Reproject the bounding box into lat/lon coordinates.
      const geoKeys = image.getGeoKeys();
      const projObj = geokeysToProj4.toProj4(geoKeys);
      const projection = proj4(projObj.proj4, 'WGS84');
      const box = image.getBoundingBox();
      const sw = projection.forward({
        x: box[0] * projObj.coordinatesConversionParameters.x,
        y: box[1] * projObj.coordinatesConversionParameters.y,
      });
      const ne = projection.forward({
        x: box[2] * projObj.coordinatesConversionParameters.x,
        y: box[3] * projObj.coordinatesConversionParameters.y,
      });

      return {
        width: image.getWidth(),
        height: image.getHeight(),
        rasters: [...Array(rasters.length).keys()].map((i) => Array.from(rasters[i] as any)),
        bounds: {
          north: ne.y,
          south: sw.y,
          east: ne.x,
          west: sw.x,
        },
      };
    })
  );
}
// [END solar_api_download_geotiff]

export function showLatLng(point: LatLng) {
  return `(${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)})`;
}

export function showDate(date: Date) {
  return `${date.month}/${date.day}/${date.year}`;
}

// Utility function for exponential backoff retry
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // If this is the last attempt or it's not a retryable error, throw
      if (attempt === maxRetries || (error.error?.code !== 429 && error.error?.code !== 503)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Rate limiting utility
class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 100; // Minimum 100ms between requests

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.minInterval) {
            await new Promise(res => setTimeout(res, this.minInterval - timeSinceLastRequest));
          }
          
          this.lastRequestTime = Date.now();
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      await operation();
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();
