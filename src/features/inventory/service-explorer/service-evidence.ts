import type { AwsResource, AwsRegion, Scan } from '@/types/aws';

// These projections contain only facts returned by AWS discovery and verification.
// There is no built-in list of AWS service namespaces or resource types.
export type ApiOperation = {
  region?: string;
  kind?: string;
  operation?: string;
  count?: number | null;
  status?: string;
  warning?: string;
};
export type ServiceVerification = {
  status?: string;
  workload_count?: number | null;
  operation_results?: ApiOperation[];
  service?: string;
};
export type ServiceRegion = {
  name: string;
  resourceCount: number;
  resourceTypes: number;
  apiChecks: number;
  enabled: boolean | null;
  optInStatus?: string;
  inServiceScope: boolean;
  inScanRegionList: boolean;
};
export type ServiceType = { name: string; resourceCount: number; regionCount: number };
export type ServiceEvidence = {
  service: string;
  rawScan: Scan;
  effectiveScan: Scan;
  inventoryLoaded: boolean;
  matched: boolean;
  serviceRecord?: { service?: string; resource_count?: number; regions?: string[]; data_source?: string; source?: string; status?: string };
  resources: AwsResource[];
  regions: ServiceRegion[];
  types: ServiceType[];
  verification?: ServiceVerification;
  operations: ApiOperation[];
  explicitlyVerifiedResources: number;
};

export const normalizeService = (value: string | undefined | null) => (value ?? '').trim().toLowerCase();

/** A path-safe and lossless Unicode key (ARNs can contain slashes and colons). */
export function encodeEntityKey(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeEntityKey(value: string): string | null {
  try {
    if (!/^[A-Za-z0-9_-]{1,12000}$/.test(value)) return null;
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(raw, char => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch { return null; }
}
export function resourceIdentity(resource: AwsResource): string {
  return JSON.stringify([
    resource.service || '', resource.region || '', resource.resource_type || '',
    resource.arn || '', resource.resource_id || '',
  ]);
}

function validRegionName(value: string): boolean {
  return value === 'global' || /^[a-z]{2}(?:-[a-z0-9]+){1,4}-\d+$/.test(value);
}

/**
 * Compose an effective service view without inferring any AWS truth.
 * Effective inventory wins for resource/service rows; raw snapshot provides Region
 * discovery when a curated inventory does not include full Region metadata.
 */
export function buildServiceEvidence(rawScan: Scan, effective: Scan | undefined, requestedService: string): ServiceEvidence {
  const service = normalizeService(requestedService);
  const effectiveScan = effective || rawScan;
  const inventoryServices = effectiveScan.resources?.detected_services ?? rawScan.resources?.detected_services ?? [];
  const serviceRecord = inventoryServices.find(item => normalizeService(item.service) === service);
  const inventoryResources = effectiveScan.resources?.resources ?? rawScan.resources?.resources ?? [];
  const resources = inventoryResources.filter(item => normalizeService(item.service) === service);
  const verificationRows = effectiveScan.resources?.verification?.services ?? rawScan.resources?.verification?.services ?? [];
  const verification = verificationRows.find(item => normalizeService(item.service) === service);
  const operations = (verification?.operation_results || []) as ApiOperation[];

  const typeAccumulator = new Map<string, { count: number; regions: Set<string> }>();
  for (const row of resources) {
    const name = row.resource_type?.trim() || 'Unknown resource type';
    const entry = typeAccumulator.get(name) || { count: 0, regions: new Set<string>() };
    entry.count++;
    if (row.region) entry.regions.add(row.region);
    typeAccumulator.set(name, entry);
  }
  const types: ServiceType[] = [...typeAccumulator].map(([name, entry]) => ({
    name, resourceCount: entry.count, regionCount: entry.regions.size,
  })).sort((a, b) => b.resourceCount - a.resourceCount || a.name.localeCompare(b.name));

  const rawRegions: AwsRegion[] = rawScan.regions?.regions || [];
  const discovered = new Map<string, ServiceRegion>();
  const ensure = (name: string) => {
    if (!validRegionName(name)) return undefined;
    let result = discovered.get(name);
    if (!result) {
      result = {name, resourceCount: 0, resourceTypes: 0, apiChecks: 0,
        enabled: null, inServiceScope: false, inScanRegionList: false};
      discovered.set(name, result);
    }
    return result;
  };
  for (const record of rawRegions) {
    const name = record.region_name || record.region || '';
    const result = ensure(name);
    if (!result) continue;
    result.inScanRegionList = true;
    result.enabled = typeof record.enabled === 'boolean' ? record.enabled : null;
    result.optInStatus = record.opt_in_status;
  }
  // Backend service-regions can mean scan coverage, not resource presence.
  for (const name of serviceRecord?.regions || []) {
    const region = ensure(name);
    if (region) region.inServiceScope = true;
  }
  const typeByRegion = new Map<string, Set<string>>();
  for (const resource of resources) {
    const name = resource.region || '';
    const region = ensure(name);
    if (!region) continue;
    region.resourceCount++;
    const set = typeByRegion.get(name) || new Set<string>();
    set.add(resource.resource_type || 'Unknown resource type');
    typeByRegion.set(name, set);
  }
  for (const [name, set] of typeByRegion) {
    const region = discovered.get(name);
    if (region) region.resourceTypes = set.size;
  }
  for (const result of operations) {
    if (!result.region) continue;
    const region = ensure(result.region);
    if (region) region.apiChecks++;
  }
  const regions = [...discovered.values()].sort((a, b) =>
    (b.resourceCount - a.resourceCount) || (b.apiChecks - a.apiChecks) || a.name.localeCompare(b.name));

  return {
    service, rawScan, effectiveScan, inventoryLoaded: Boolean(effective),
    matched: Boolean(serviceRecord || resources.length || verification),
    serviceRecord, resources, regions, types, verification, operations,
    explicitlyVerifiedResources: resources.filter(item =>
      String(item.verification_status || '').toUpperCase() === 'VERIFIED').length,
  };
}
