'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Cloud, Copy, KeyRound, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { useActiveScan, useAuthStatus, keys } from '@/lib/api/queries';
import { backend } from '@/lib/api/client';
import { useConnection, useWorkspace } from '@/components/layout/app-shell';
import type { AwsConnection } from '@/types/aws';

type RoleSource = { trust_principal_arn?: string; trust_policy_template?: unknown };

/**
 * Existing live AWS workflow retained: real FastAPI verification, real session
 * management, live scan query invalidation. No Azure/GCP demo logic here.
 */
export function AwsConnectionPanel() {
  const { demo } = useWorkspace();
  const { data: scan } = useActiveScan();
  const { connection, setConnection } = useConnection();
  const current = connection || scan?.account;
  const { data: auth } = useAuthStatus(current?.aws_connection_id || current?.id);
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'role' | 'keys'>('role');
  const [roleArn, setRoleArn] = useState('');
  const [externalId, setExternalId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [trust, setTrust] = useState<RoleSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function showTrustSource() {
    setError('');
    try {
      const value = await backend<RoleSource>('/aws/connections/assume-role/source-identity');
      setTrust(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load AWS role template');
    }
  }

  async function verifyConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      // Same real AWS endpoints/payload shapes as the current application.
      const payload = mode === 'role'
        ? { role_arn: roleArn.trim(), external_id: externalId.trim() || null, default_region: region }
        : { access_key_id: accessKey.trim(), secret_access_key: secretKey, session_token: sessionToken || null, default_region: region };
      const route = mode === 'role' ? '/aws/connections/assume-role/verify' : '/aws/verify';
      const result = await backend<AwsConnection>(route, { method: 'POST', body: payload });
      setConnection(result);
      setSuccess(`Verified AWS account ${result.account_id || ''}. Discovery is now available.`);
      setSecretKey('');
      setSessionToken('');
      setAccessKey('');
      setExternalId('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.scan }),
        queryClient.invalidateQueries({ queryKey: keys.auth }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AWS verification failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] gap-4">
      <Card><CardContent>
        <div className="mb-5"><h2 className="card-heading text-base">AWS connection configuration</h2><p className="card-description">Live connection through your existing FastAPI / AWS MCP integration</p></div>
        <div className="flex flex-wrap gap-2 mb-5">
          <Button type="button" variant={mode === 'role' ? 'primary' : 'secondary'} onClick={() => setMode('role')}><ShieldCheck size={15}/> Cross-account IAM Role</Button>
          <Button type="button" variant={mode === 'keys' ? 'primary' : 'secondary'} onClick={() => setMode('keys')}><KeyRound size={15}/> Access Keys (POC)</Button>
        </div>
        <div className="alert mb-5">
          {mode === 'role'
            ? 'Recommended: backend assumes the client audit role through AWS STS. Provide the client Role ARN and External ID.'
            : 'Proof-of-concept credential flow. Prefer AssumeRole or short-lived credentials in production. Never save or log client secrets.'}
        </div>
        {error && <div role="alert" className="alert danger mb-4">{error}</div>}
        {success && <div role="status" className="alert mb-4"><span>{success} <Link href="/scan" className="font-bold underline">Open scan</Link></span></div>}
        {mode === 'role' && <>
          <Button className="mb-4" size="sm" type="button" onClick={() => void showTrustSource()}><Copy size={14}/> Show trust principal / policy template</Button>
          {trust && <div className="mb-4"><div className="small-note mb-2">Trust principal</div><pre className="code-box">{trust.trust_principal_arn || 'Not returned'}</pre><div className="small-note mt-3 mb-2">Trust policy template</div><pre className="code-box">{JSON.stringify(trust.trust_policy_template ?? {}, null, 2)}</pre></div>}
        </>}
        <form onSubmit={(event) => void verifyConnection(event)}>
          {mode === 'role' ? <>
            <div className="form-row"><label htmlFor="aws-role-arn" className="form-label">AWS IAM Role ARN</label><Input id="aws-role-arn" value={roleArn} onChange={(e) => setRoleArn(e.target.value)} placeholder="arn:aws:iam::123456789012:role/ReadOnlyAuditRole" required/></div>
            <div className="form-row"><label htmlFor="aws-external-id" className="form-label">External ID</label><Input id="aws-external-id" value={externalId} onChange={(e) => setExternalId(e.target.value)} type="password" autoComplete="off"/></div>
          </> : <>
            <div className="form-row"><label htmlFor="aws-access-key" className="form-label">Access Key ID</label><Input id="aws-access-key" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} autoComplete="off" required/></div>
            <div className="form-row"><label htmlFor="aws-secret-key" className="form-label">Secret Access Key</label><Input id="aws-secret-key" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} type="password" autoComplete="off" required/></div>
            <div className="form-row"><label htmlFor="aws-session-token" className="form-label">Session Token (optional)</label><Input id="aws-session-token" value={sessionToken} onChange={(e) => setSessionToken(e.target.value)} type="password" autoComplete="off"/></div>
          </>}
          <div className="form-row"><label htmlFor="aws-default-region" className="form-label">Default AWS Region</label><Input id="aws-default-region" value={region} onChange={(e) => setRegion(e.target.value)} required placeholder="us-east-1"/></div>
          <Button variant="primary" className="w-full" type="submit" disabled={busy || demo}>{busy ? 'Verifying through AWS…' : mode === 'role' ? 'Verify IAM Role' : 'Verify AWS Connection'}</Button>
        </form>
      </CardContent></Card>
      <div className="flex flex-col gap-4">
        <Card><CardContent>
          <div className="flex items-center gap-3 mb-4"><span className="metric-icon blue"><Cloud size={22}/></span><div><h3 className="card-heading">AWS connection status</h3><p className="card-description">Actual backend state</p></div></div>
          <div className="text-sm font-bold break-all mb-4">{current?.account_id || 'No AWS account verified'}</div>
          <div className="flex justify-between text-xs py-3 border-t border-slate-100"><span>Status</span><StatusBadge status={auth?.connected ? 'CONNECTED' : scan ? 'SNAPSHOT ONLY' : 'NOT CONNECTED'}/></div>
          <div className="flex justify-between gap-2 text-xs py-3 border-t border-slate-100"><span>Authentication</span><b>{auth?.auth_type || current?.auth_type || '—'}</b></div>
          <div className="flex justify-between gap-2 text-xs py-3 border-t border-slate-100"><span>Auto reconnect</span><b>{auth?.auto_connect ? 'Configured' : 'Not configured'}</b></div>
          <div className="flex justify-between gap-2 text-xs py-3 border-t border-slate-100"><span>Existing snapshot</span><b>{scan?.status || 'Not available'}</b></div>
          <div className="mt-4"><Link href="/inventory" className="text-xs font-bold text-blue-600">Open AWS Inventory →</Link></div>
        </CardContent></Card>
        <div className="alert warning"><TriangleAlert size={17} className="shrink-0"/>FastAPI must enforce workspace authorization, AWS permissions, and secure credential handling. This UI does not add provider-side privileges.</div>
      </div>
    </div>
  );
}
