import type { DemoCloudProfile, DemoProvider } from '@/types/cloud-connection';

/**
 * Entirely synthetic cloud profiles for UI demonstration.
 * Not returned by Azure/GCP APIs, not evidence, not valid secrets.
 * These are intentionally NOT merged into AWS inventory or persisted to backend.
 */
export const DEMO_CLOUDS: Record<DemoProvider, DemoCloudProfile> = {
  azure: {
    provider: 'azure',
    displayName: 'Microsoft Azure',
    shortName: 'Azure',
    accountLabel: 'Subscription ID',
    accountValue: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    authMethod: 'Federated application identity (future integration)',
    setupExplanation: 'A real Azure integration will verify a Microsoft Entra application and its permitted subscriptions on the backend. No access is requested in this preview.',
    fields: [
      { key: 'tenant', label: 'Tenant ID', example: '11111111-2222-4333-8444-555555555555', explanation: 'Microsoft Entra directory containing the application.' },
      { key: 'subscription', label: 'Subscription ID', example: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', explanation: 'The Azure subscription whose inventory would be discovered.' },
      { key: 'app', label: 'Application (Client) ID', example: '66666666-7777-4888-9999-aaaaaaaaaaaa', explanation: 'The application registration assigned read-only access.' },
    ],
    resources: [
      { id: 'az-vm-demo-001', name: 'demo-web-vm', type: 'Virtual Machine', region: 'East US', status: 'Running (sample)' },
      { id: 'az-storage-demo-002', name: 'dhanushsamplelogs', type: 'Storage Account', region: 'Central India', status: 'Available (sample)' },
      { id: 'az-vnet-demo-003', name: 'demo-prod-vnet', type: 'Virtual Network', region: 'East US', status: 'Configured (sample)' },
      { id: 'az-sql-demo-004', name: 'demo-sql-server', type: 'Azure SQL Server', region: 'West Europe', status: 'Available (sample)' },
    ],
    note: 'Azure authentication, subscriptions, resource discovery, verification and billing are not connected to a backend yet.',
  },
  gcp: {
    provider: 'gcp',
    displayName: 'Google Cloud Platform',
    shortName: 'GCP',
    accountLabel: 'Project ID',
    accountValue: 'dhanushguard-demo-project',
    authMethod: 'Workload Identity Federation (future integration)',
    setupExplanation: 'A real GCP integration will use an appropriately scoped service identity / Workload Identity Federation configured on the backend. No Google Cloud calls occur here.',
    fields: [
      { key: 'projectId', label: 'Project ID', example: 'dhanushguard-demo-project', explanation: 'The project to discover, within the authorized hierarchy.' },
      { key: 'projectNumber', label: 'Project Number', example: '123456789012', explanation: 'The numeric identifier of the project (synthetic example).' },
      { key: 'serviceAccount', label: 'Service Account Email', example: 'audit-reader@dhanushguard-demo-project.iam.gserviceaccount.com', explanation: 'A future read-only service identity; this address is a sample.' },
    ],
    resources: [
      { id: 'gcp-instance-demo-001', name: 'demo-api-instance', type: 'Compute Engine VM', region: 'asia-south1', status: 'Running (sample)' },
      { id: 'gcp-bucket-demo-002', name: 'demo-audit-archive', type: 'Cloud Storage Bucket', region: 'us-central1', status: 'Available (sample)' },
      { id: 'gcp-network-demo-003', name: 'demo-vpc', type: 'VPC Network', region: 'global', status: 'Configured (sample)' },
      { id: 'gcp-sql-demo-004', name: 'demo-db-primary', type: 'Cloud SQL', region: 'asia-south1', status: 'Available (sample)' },
    ],
    note: 'GCP authentication, projects, discovery, verification and billing are not connected to a backend yet.',
  },
};
