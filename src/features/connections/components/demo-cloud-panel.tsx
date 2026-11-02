'use client';

import { useState } from 'react';
import { CircleAlert, CircleCheck, Info, RotateCcw, Shield, LockKeyhole } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table';
import type { DemoCloudProfile, DemoResource } from '@/types/cloud-connection';

const RESOURCE_COLUMNS: Column<DemoResource>[] = [
  { key: 'name', header: 'Example resource', render: (row) => <div><div className="font-semibold text-slate-800">{row.name}</div><div className="text-[11px] text-slate-500 mt-1">{row.id}</div></div> },
  { key: 'type', header: 'Resource type', render: (row) => row.type },
  { key: 'region', header: 'Region', render: (row) => row.region },
  { key: 'status', header: 'Example status', render: (row) => <Badge tone="info">{row.status}</Badge> },
];

/**
 * No external API, no secrets, no storage. This is a UI-only demonstration.
 * Simulated state exists only during this component's lifetime and resets on reload.
 */
export function DemoCloudPanel({ profile }: { profile: DemoCloudProfile }) {
  const [simulated, setSimulated] = useState(false);
  const [showResources, setShowResources] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(285px,1fr)] gap-4">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="card-heading text-base">{profile.displayName} — Connection preview</h2>
              <p className="card-description">Example configuration for a future provider integration</p>
            </div>
            <Badge tone="warning">SAMPLE DATA · NO API</Badge>
          </div>

          <div className="alert warning mb-5" role="status">
            <CircleAlert size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Frontend demonstration only.</strong> The information shown is synthetic. No {profile.shortName} account is authenticated, and the application will not contact {profile.shortName} or store credentials.</span>
          </div>

          <div className="flex items-center gap-2 mb-5 text-xs text-slate-700">
            <LockKeyhole size={16} className="text-blue-600" />
            <strong>Suggested authentication:</strong> {profile.authMethod}
          </div>

          <div className="space-y-4">
            {profile.fields.map((field) => (
              <div className="form-row !mb-0" key={field.key}>
                <label className="form-label" htmlFor={`${profile.provider}-${field.key}`}>{field.label}</label>
                <input
                  id={`${profile.provider}-${field.key}`}
                  type="text"
                  readOnly
                  value={field.example}
                  className="field bg-slate-50 text-slate-600 cursor-default"
                  aria-describedby={`${profile.provider}-${field.key}-help`}
                />
                <div id={`${profile.provider}-${field.key}-help`} className="help-text">{field.explanation} · Example only</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={() => setSimulated(true)} disabled={simulated}>
              <CircleCheck size={15} />{simulated ? 'Demo connection simulated' : 'Simulate demo connection'}
            </Button>
            {simulated && <Button type="button" onClick={() => { setSimulated(false); setShowResources(false); }}><RotateCcw size={14}/> Reset preview</Button>}
          </div>
          <p className="small-note mt-3">Simulation lasts for this page session only. Refreshing or switching providers clears the demo state.</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card><CardContent>
          <div className="flex items-center justify-between gap-2 mb-4"><h3 className="card-heading">Connection status</h3><Badge tone="warning">DEMO</Badge></div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="rounded-full h-9 w-9 bg-blue-50 text-blue-600 flex justify-center items-center"><Shield size={18}/></span>
            <div><div className="text-sm font-bold text-slate-900">{simulated ? 'Simulated connection' : 'Not connected'}</div><div className="small-note mt-1">{simulated ? 'UI preview only — not authenticated' : 'No live cloud access'}</div></div>
          </div>
          <div className="mt-4 flex justify-between gap-2 text-xs py-2 border-b border-slate-100"><span className="text-slate-500">Platform</span><strong>{profile.shortName}</strong></div>
          <div className="flex justify-between gap-2 text-xs py-2 border-b border-slate-100"><span className="text-slate-500">{profile.accountLabel}</span><strong className="break-all text-right text-[11px]">{profile.accountValue}</strong></div>
          <div className="flex justify-between gap-2 text-xs py-2"><span className="text-slate-500">Backend verification</span><strong className="text-amber-700">Not implemented</strong></div>
        </CardContent></Card>

        <Card><CardContent>
          <h3 className="card-heading mb-2">Sample inventory preview</h3>
          <p className="card-description mb-4">The resources below are illustrative examples, never discovered inventory.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-slate-50 p-3"><div className="metric-label">Sample resources</div><div className="text-2xl font-extrabold">{profile.resources.length}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="metric-label">Example Regions</div><div className="text-2xl font-extrabold">{new Set(profile.resources.map((r) => r.region)).size}</div></div>
          </div>
          <Button type="button" disabled={!simulated} onClick={() => setShowResources((v) => !v)}>{showResources ? 'Hide sample resources' : 'View sample resources'}</Button>
          {!simulated && <p className="help-text mt-3">Simulate a demo connection to preview resource inventory.</p>}
        </CardContent></Card>
        <div className="alert"><Info size={17} className="shrink-0"/>{profile.setupExplanation}</div>
      </div>

      {showResources && simulated && <Card className="xl:col-span-2"><CardContent>
        <div className="flex items-center justify-between mb-4 gap-3"><h3 className="card-heading">{profile.shortName} example resources</h3><Badge tone="warning">FAKE INVENTORY</Badge></div>
        <DataTable rows={[...profile.resources]} columns={RESOURCE_COLUMNS} searchText={(r) => `${r.id} ${r.name} ${r.type} ${r.region}`}/>
        <p className="small-note mt-3">{profile.note}</p>
      </CardContent></Card>}
    </div>
  );
}
