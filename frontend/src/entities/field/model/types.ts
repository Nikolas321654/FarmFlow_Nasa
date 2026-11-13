export type CropType = 'Wheat' | 'Corn' | 'Sunflower' | 'Soy';
export type WorkabilityStatus = 'Optimal' | 'Marginal' | 'Blocked';
export type AlertSeverity = 'Critical' | 'Warning' | 'Info';

export type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: [longitude: number, latitude: number][][];
};

export type FieldSummary = {
  id: string;
  name: string;
  cropType: CropType;
  plantedAt: string;
  areaHectares: number;
  centroidLat: number;
  centroidLon: number;
  workabilityStatus: WorkabilityStatus;
  hasActiveStressAlert: boolean;
  hasBiomassAnomaly: boolean;
  boundary: GeoJsonPolygon;
  isDemo: boolean;
};

export type CreateFieldRequest = {
  name: string;
  cropType: CropType;
  plantedAt: string;
  boundary: GeoJsonPolygon;
};

export type CurrentMetrics = {
  precipitationMm24h: number;
  accumulatedPrecipitationMm30d: number;
  surfaceSoilMoisture: number;
  rootzoneSoilMoisture: number;
  solarRadiation: number;
  ndvi: number;
  evaporativeStressIndex: number;
};

export type DashboardWorkability = {
  status: WorkabilityStatus;
  sprayingSafe: boolean;
  rainLast12hMm: number;
  rainLast24hMm: number;
  rainForecast24hMm: number;
  surfaceMoisture: number;
  recommendation: string;
};

export type DashboardStressAndIrrigation = {
  waterDeficitIndex: number;
  isHiddenStressDetected: boolean;
  severity: AlertSeverity;
  irrigationRecommended: boolean;
  recommendedIrrigationMm: number;
  recommendedWindowHours: number;
  recommendation: string;
};

export type DashboardBiomass = {
  currentNdvi: number;
  ndvi14DayAvg: number;
  deltaNdvi: number;
  deltaPercent: number;
  isAnomalyDetected: boolean;
  recommendation: string;
};

export type ImpactMetrics = {
  estimatedWaterSavedM3PerHa: number;
  preventedRunoffRisk: boolean;
  earlyWarningLeadTimeDays: number;
};

export type NasaDailyMetric = {
  date: string;
  precipitationMm: number;
  surfaceMoisture: number;
  rootzoneMoisture: number;
  solarRadiation: number;
  ndvi: number;
  esi: number;
};

export type FieldDashboard = {
  fieldId: string;
  fieldName: string;
  cropType: CropType;
  areaHectares: number;
  dataSource: 'NASA_POWER_LIVE' | 'MOCK_FIXTURE';
  lastUpdatedUtc: string;
  currentMetrics: CurrentMetrics;
  workability: DashboardWorkability;
  stressAndIrrigation: DashboardStressAndIrrigation;
  biomass: DashboardBiomass;
  impactMetrics: ImpactMetrics;
  timeSeries: NasaDailyMetric[];
};

export type WorkabilityWindowPeriod = {
  period: string;
  status: WorkabilityStatus;
  reason: string;
};

export type WorkabilityWindow = Omit<DashboardWorkability, 'recommendation'> & {
  fieldId: string;
  forecast48h: WorkabilityWindowPeriod[];
  recommendation: string;
};

export type EarlyStressAlert = {
  fieldId: string;
  waterDeficitIndex: number;
  threshold: number;
  rootzoneMoisture: number;
  cropTargetMoisture: number;
  evaporativeStressIndex: number;
  ndviCurrent: number;
  isHiddenStressDetected: boolean;
  irrigationRecommended: boolean;
  recommendedIrrigationMm: number;
  recommendedWindowHours: number;
  recommendation: string;
};

export type BiomassTrend = {
  fieldId: string;
  currentNdvi: number;
  ndvi14DayAvg: number;
  deltaNdvi: number;
  deltaPercent: number;
  rootzoneMoisture: number;
  isDroughtPresent: boolean;
  isAnomalyDetected: boolean;
  recommendation: string;
};
