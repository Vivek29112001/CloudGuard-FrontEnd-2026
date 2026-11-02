"use client";

import { useState } from "react";
import { CheckCircle2, Info, Layers, ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProviderSelector } from "./components/provider-selector";
import { AwsConnectionPanel } from "./components/aws-connection-panel";
import { DemoCloudPanel } from "./components/demo-cloud-panel";
import { DEMO_CLOUDS } from "./data/demo-clouds";
import type { CloudProvider } from "@/types/cloud-connection";

export function ConnectionPage() {
  const [provider, setProvider] = useState<CloudProvider>("aws");
  return (
    <>
      <PageHeader
        title="Cloud Connections"
        description="Select AWS, Microsoft Azure, or Google Cloud Platform for this workspace. AWS is live; Azure and GCP are UI-only previews."
        actions={
          <Badge tone="info">
            <Layers size={13} /> Multi-cloud UI
          </Badge>
        }
      />
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="card-heading">Choose cloud provider</h2>
          <span className="small-note">
            Switch provider to update the connection form
          </span>
        </div>
        <ProviderSelector value={provider} onChange={setProvider} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        {provider === "aws" ? (
          <>
            <Badge tone="success">
              <CheckCircle2 size={12} /> AWS integration available
            </Badge>
            <span className="text-slate-500">
              Your current FastAPI verification and AWS scan remain unchanged.
            </span>
          </>
        ) : (
          <>
            <Badge tone="warning">Not connected · Demonstration</Badge>
            <span className="text-slate-500">
              Everything shown for {DEMO_CLOUDS[provider].shortName} is
              simulated in the browser.
            </span>
          </>
        )}
      </div>

      {provider === "aws" ? (
        <AwsConnectionPanel />
      ) : (
        <DemoCloudPanel key={provider} profile={DEMO_CLOUDS[provider]} />
      )}

      <Card className="mt-5">
        <CardContent>
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="card-heading mb-1">
                How multi-cloud will work later
              </h3>
              <p className="page-description">
                Your workspace can eventually contain multiple cloud
                connections. The provider-specific frontend forms are already
                separated, so Azure and GCP backends can be added without
                changing AWS authentication or discovery. Azure/GCP sample
                resources never appear in live AWS totals, reports, or security
                checks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
