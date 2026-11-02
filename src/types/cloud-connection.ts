/** Connection presentation types. Azure/GCP records are sample-only and never persisted. */
export type CloudProvider = "aws" | "azure" | "gcp";
export type DemoProvider = Exclude<CloudProvider, "aws">;

export interface DemoField {
  key: string;
  label: string;
  example: string;
  explanation: string;
}

export interface DemoResource {
  id: string;
  name: string;
  type: string;
  region: string;
  status: string;
}

export interface DemoCloudProfile {
  provider: DemoProvider;
  displayName: string;
  shortName: string;
  accountLabel: string;
  accountValue: string;
  authMethod: string;
  setupExplanation: string;
  fields: readonly DemoField[];
  resources: readonly DemoResource[];
  note: string;
}
