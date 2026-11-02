'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, ArrowUpRight, Blocks, Cloud, Database, Globe2,
  Info, Layers3, MapPin, MessageCircle, SearchCheck, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorPanel, LoadingPanel } from '@/components/shared/state-panels';
import { useActiveScan, useInventory, connectionId } from '@/lib/api/queries';
import { backend } from '@/lib/api/client';
import type { AwsResource, Chat } from '@/types/aws';
import {
  buildServiceEvidence, decodeEntityKey, encodeEntityKey,
  resourceIdentity, type ApiOperation, type ServiceEvidence,
  type ServiceRegion, type ServiceType,
} from './service-evidence';
import './service-explorer.css';

type View = 'overview' | 'regions' | 'resources' | 'types' | 'verification';
export type ExplorerRoute = { service: string; view: View; entityKey?: string };

const valueOrUnknown = (value?: number | null) => value === null || value === undefined ? 'Unknown' : value;
const base = (service: string) => `/inventory/services/${encodeURIComponent(service)}`;
const hrefFor = (service: string, view: View) => `${base(service)}${view === 'overview' ? '' : `/${view}`}`;
const regionHref = (service: string, region: string) => `${hrefFor(service, 'regions')}/${encodeURIComponent(region)}`;
const typeHref = (service: string, type: string) => `${hrefFor(service, 'types')}/${encodeEntityKey(type)}`;
const resourceHref = (service: string, resource: AwsResource) => `${hrefFor(service, 'resources')}/${encodeEntityKey(resourceIdentity(resource))}`;

function Header({title, description, extra}: {title:string; description?:string;extra?:React.ReactNode}) {
  return <div className="service-section-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{extra}</div>;
}
function Explanation({children, warn = false}: {children:React.ReactNode;warn?:boolean}) {
  return <div className={`service-explainer ${warn ? 'service-explainer-warn' : ''}`}><Info size={17} className="shrink-0 mt-[1px]"/><div>{children}</div></div>;
}
function EvidenceMetric({title, value, description}: {title:string;value:string|number;description:string}) {
  return <div className="service-metric"><div className="service-metric-label">{title}</div><strong>{value}</strong><div className="service-metric-note">{description}</div></div>;
}
function ResourceIdentifier({row,service}: {row:AwsResource;service:string}) {
  return <><Link href={resourceHref(service,row)} className="service-link service-id" title={row.arn || row.resource_id}>{row.resource_id || row.arn || 'Identifier not returned'}</Link><div className="service-cell-sub">{row.resource_type || 'Type not available'}</div></>;
}
function ResourceGrid({rows,service,limit}: {rows:AwsResource[];service:string;limit?:number}) {
  const cols:Column<AwsResource>[] = [
    { key:'id', header:'Resource ID / ARN', render:row=><ResourceIdentifier row={row} service={service}/> },
    { key:'type', header:'Discovered type', render:row=>row.resource_type ? <Link className="service-link" href={typeHref(service,row.resource_type)}>{row.resource_type}</Link> : 'Unknown' },
    { key:'region', header:'Region', render:row=>row.region ? <Link className="service-link" href={regionHref(service,row.region)}>{row.region}</Link> : 'Unknown' },
    { key:'verification', header:'Resource verification', render:row=><StatusBadge status={row.verification_status || 'UNVERIFIED'}/> },
    { key:'action', header:'Details', render:row=><Link href={resourceHref(service,row)} className="btn sm">Open <ArrowUpRight size={13}/></Link> },
  ];
  const items = limit ? rows.slice(0,limit) : rows;
  return <DataTable rows={items} columns={cols} pageSize={10}
    searchText={row=>[row.resource_id,row.arn,row.region,row.resource_type,row.verification_status].join(' ')}
    emptyMessage="No resource records of this service were returned for this scope. This does not establish that the AWS service is unused."/>;
}
function OperationsGrid({operations}: {operations:ApiOperation[]}) {
  const cols:Column<ApiOperation>[] = [
    {key:'region',header:'API Region',render:row=>row.region || 'Not specified'},
    {key:'kind',header:'Query kind',render:row=>row.kind || 'Not specified'},
    {key:'operation',header:'AWS API operation',render:row=><code>{row.operation || 'Not reported'}</code>},
    {key:'count',header:'API returned count',render:row=><strong>{valueOrUnknown(row.count)}</strong>},
    {key:'status',header:'Execution status',render:row=><StatusBadge status={row.status || 'UNKNOWN'}/>},
    {key:'warning',header:'Warnings',render:row=><span className="service-cell-sub">{row.warning || '—'}</span>},
  ];
  return <DataTable rows={operations} columns={cols} pageSize={12}
    searchText={row=>[row.operation,row.region,row.kind,row.status,row.warning].join(' ')}
    emptyMessage="No operation-level verification results were returned for this service."/>;
}
function Overview({e}: {e:ServiceEvidence}) {
  const sum = e.resources.length;
  return <div className="service-flow">
    <div className="service-metric-grid">
      <EvidenceMetric title="Indexed resource records" value={sum} description="Objects returned in effective inventory"/>
      <EvidenceMetric title="Discovered resource types" value={e.types.length} description="Distinct AWS resource_type values"/>
      <EvidenceMetric title="Regions with objects" value={e.regions.filter(r=>r.resourceCount>0&&r.name!=='global').length} description="Derived from actual resource rows"/>
      <EvidenceMetric title="Resource rows marked verified" value={e.explicitlyVerifiedResources} description="Explicit record-level verification state"/>
    </div>
    <Explanation><b>What does {e.service.toUpperCase()} mean here?</b> AWS groups several resource types under a single service namespace. For example, indexed EC2 objects can include VPCs, subnets, security groups and interfaces. An indexed object is not necessarily a running compute instance, a purchased product or a billable workload.</Explanation>
    <div className="service-two-cols">
      <Card><CardContent>
        <Header title="Service discovery evidence" description="Source metadata returned by your AWS backend"/>
        <div className="service-kv"><span>Service namespace</span><b>{e.service.toUpperCase()}</b></div>
        <div className="service-kv"><span>Source</span><b>{e.serviceRecord?.data_source || e.serviceRecord?.source || 'Not identified'}</b></div>
        <div className="service-kv"><span>Discovery summary count</span><b>{valueOrUnknown(e.serviceRecord?.resource_count)}</b></div>
        <div className="service-kv"><span>Current resource rows</span><b>{sum}</b></div>
        <div className="service-kv"><span>Verification pipeline</span><StatusBadge status={e.verification?.status || 'NOT_RECORDED'}/></div>
        <Link href={hrefFor(e.service,'verification')} className="service-cta">Inspect AWS API evidence <ArrowUpRight size={15}/></Link>
      </CardContent></Card>
      <Card><CardContent>
        <Header title="Evidence interpretation" description="How to interpret these different measurements"/>
        <div className="service-info-list"><div><ShieldCheck size={18}/><span><b>Discovery:</b> records AWS resource identifiers and their resource types.</span></div><div><SearchCheck size={18}/><span><b>API checks:</b> run scoped read-only operations and return execution status/counts.</span></div><div><Globe2 size={18}/><span><b>Region coverage:</b> a Region listed in the scan may contain zero indexed records of this service.</span></div></div>
      </CardContent></Card>
    </div>
    <Card><CardContent><Header title="Discovered resource types" description="These are exact types returned by AWS discovery, not a hardcoded catalog." extra={<Link href={hrefFor(e.service,'types')} className="service-link">View all types ↗</Link>}/><TypeGrid types={e.types} service={e.service} limit={8}/></CardContent></Card>
    <Card><CardContent><Header title="Regions containing indexed objects" description="A summary of recorded objects grouped by Region." extra={<Link href={hrefFor(e.service,'regions')} className="service-link">View all Regions ↗</Link>}/><RegionGrid regions={e.regions.filter(r=>r.resourceCount>0)} service={e.service}/></CardContent></Card>
  </div>;
}
function RegionGrid({regions, service}: {regions:ServiceRegion[];service:string}) {
  const columns:Column<ServiceRegion>[]=[
    {key:'region',header:'Region',render:r=><Link href={regionHref(service,r.name)} className="service-link service-id">{r.name}</Link>},
    {key:'count',header:'Indexed objects',render:r=><strong>{r.resourceCount}</strong>},
    {key:'types',header:'Discovered types',render:r=>r.resourceTypes},
    {key:'api',header:'API checks',render:r=>r.apiChecks},
    {key:'enabled',header:'AWS Region status',render:r=>r.enabled===true ? <Badge tone="success">Enabled</Badge> : r.enabled===false ? <Badge tone="neutral">Not enabled</Badge> : <Badge tone="neutral">Unknown</Badge>},
    {key:'action',header:'View',render:r=><Link href={regionHref(service,r.name)} className="btn sm">Region details</Link>},
  ];
  return <DataTable rows={regions} columns={columns} pageSize={12} searchText={r=>[r.name,r.optInStatus].join(' ')}
    emptyMessage="No Region records have been returned."/>;
}
function RegionList({e}:{e:ServiceEvidence}) {
  const [filter,setFilter]=useState('all');
  const shown=e.regions.filter(r=>filter==='all'||(filter==='objects'&&r.resourceCount>0)||(filter==='api'&&r.apiChecks>0)||(filter==='scope'&&r.inServiceScope));
  return <Card><CardContent><Header title={`All AWS Regions (${e.regions.length})`} description="Complete Region records from the scan, plus service scope and API-check Regions."/>
    <Explanation>A listed Region is not necessarily used by this service. <b>Indexed objects</b> is counted from discovered resource records only. A successful scoped zero-count API check is different from an incomplete or denied check.</Explanation>
    <div className="service-filter"><label htmlFor="region-filter">Display</label><Select id="region-filter" value={filter} onChange={event=>setFilter(event.target.value)} className="max-w-[270px]"><option value="all">All listed Regions</option><option value="objects">Regions with discovered objects</option><option value="api">Regions with API checks</option><option value="scope">Regions in service scan scope</option></Select></div>
    <RegionGrid regions={shown} service={e.service}/>
  </CardContent></Card>;
}
function RegionDetail({e,region}: {e:ServiceEvidence;region:string}) {
  const found=e.regions.find(item=>item.name===region);
  if(!found)return <EmptyState title="Region not found" description="This Region does not appear in the current scan or associated service evidence."/>;
  const resources=e.resources.filter(item=>item.region===region);
  const operations=e.operations.filter(item=>item.region===region);
  return <div className="service-flow">
    <div className="service-context-bar"><Link href={hrefFor(e.service,'regions')} className="service-link">← All Regions</Link><Badge tone="info">Region: {region}</Badge></div>
    <div className="service-metric-grid"><EvidenceMetric title="Resource records" value={resources.length} description="Indexed rows in this Region"/><EvidenceMetric title="Distinct resource types" value={found.resourceTypes} description="From individual resource rows"/><EvidenceMetric title="API checks recorded" value={operations.length} description="Operation results for this Region"/><EvidenceMetric title="Enabled in AWS" value={found.enabled===null?'Unknown':found.enabled?'Yes':'No'} description={found.optInStatus||'Opt-in status not reported'}/></div>
    <Explanation warn={resources.length===0}>This page describes recorded evidence for <b>{region}</b>. No discovered records does not establish that the Region is empty. Unsuccessful or missing AWS API verification does not establish a zero resource count.</Explanation>
    <Card><CardContent><Header title="Discovered resources in this Region" description="Resource identifiers, exact type, and individual verification metadata"/><ResourceGrid rows={resources} service={e.service}/></CardContent></Card>
    <Card><CardContent><Header title="AWS API checks for this Region" description="Independent API operation results; not proof that every object above was verified"/><OperationsGrid operations={operations}/></CardContent></Card>
  </div>;
}
function TypeGrid({types,service,limit}: {types:ServiceType[];service:string;limit?:number}) {
  const columns:Column<ServiceType>[]=[
    {key:'name',header:'Exact AWS resource type',render:r=><Link className="service-link service-id" href={typeHref(service,r.name)}>{r.name}</Link>},
    {key:'count',header:'Discovered records',render:r=><strong>{r.resourceCount}</strong>},
    {key:'regions',header:'Regions with objects',render:r=>r.regionCount},
    {key:'action',header:'View',render:r=><Link href={typeHref(service,r.name)} className="btn sm">Type details</Link>},
  ];
  return <DataTable rows={limit?types.slice(0,limit):types} columns={columns} pageSize={12} searchText={r=>r.name}
    emptyMessage="No discovered resource type values are available for this service."/>;
}
function TypeList({e}:{e:ServiceEvidence}) {
  return <Card><CardContent><Header title={`Discovered AWS resource types (${e.types.length})`} description="Exact type strings from AWS inventory (for example AWS::EC2::VPC)."/>
  <Explanation>Resource types represent different classes of AWS objects within the same service. Their counts should not be added to independent AWS API workload counts: operations can overlap or have different scopes.</Explanation>
  <TypeGrid types={e.types} service={e.service}/></CardContent></Card>;
}
function TypeDetail({e,name}:{e:ServiceEvidence;name:string}) {
  const record=e.types.find(item=>item.name===name);
  if(!record)return <EmptyState title="Resource type not found" description="The requested type was not returned by this service's current effective inventory."/>;
  const resources=e.resources.filter(r=>(r.resource_type?.trim()||'Unknown resource type')===name);
  const regions=[...new Set(resources.map(r=>r.region).filter((x):x is string=>Boolean(x)))];
  return <div className="service-flow"><div className="service-context-bar"><Link className="service-link" href={hrefFor(e.service,'types')}>← All types</Link></div>
    <Card><CardContent><Header title={name} description="Exact AWS discovered resource-type identifier"/><div className="service-metric-grid"><EvidenceMetric title="Discovered objects" value={record.resourceCount} description="Rows for this exact resource type"/><EvidenceMetric title="Regions" value={record.regionCount} description="Distinct resource row Regions"/></div>
    <div className="service-filter">{regions.map(region=><Link key={region} className="service-pill-link" href={regionHref(e.service,region)}><MapPin size={13}/>{region}</Link>)}</div>
    <Explanation>These items are grouped by their <b>resource_type</b> field. AWS API operation checks have their own Region, operation and count; an API check is not automatically evidence of a one-to-one verification of this specific type.</Explanation>
    <Header title="Resources of this type" description="Select any resource to inspect its complete recorded metadata"/><ResourceGrid rows={resources} service={e.service}/></CardContent></Card></div>;
}
function ResourceList({e}:{e:ServiceEvidence}) {
  const [region,setRegion]=useState('all');const[type,setType]=useState('all');
  const regions=[...new Set(e.resources.map(r=>r.region).filter((x):x is string=>Boolean(x)))].sort();
  const rows=e.resources.filter(r=>(region==='all'||r.region===region)&&(type==='all'||r.resource_type===type));
  return <Card><CardContent><Header title={`Discovered AWS Resources (${e.resources.length})`} description="Every resource row from the selected service's effective inventory, with read-only detail links"/>
    <Explanation><b>Verification state</b> refers to the value returned on that resource record. API-check operation success by itself does not verify every resource. Resources lacking a status remain unverified/unknown.</Explanation>
    <div className="service-filter"><label htmlFor="service-res-region">Region</label><Select id="service-res-region" className="max-w-[220px]" value={region} onChange={event=>setRegion(event.target.value)}><option value="all">All Regions</option>{regions.map(r=><option key={r} value={r}>{r}</option>)}</Select>
    <label htmlFor="service-res-type">Resource type</label><Select id="service-res-type" className="max-w-[320px]" value={type} onChange={event=>setType(event.target.value)}><option value="all">All types</option>{e.types.map(r=><option key={r.name} value={r.name}>{r.name}</option>)}</Select></div>
    <ResourceGrid rows={rows} service={e.service}/>
  </CardContent></Card>;
}
function ResourceDetail({e,keyValue}:{e:ServiceEvidence;keyValue:string}) {
  const name=decodeEntityKey(keyValue);
  const row=e.resources.find(r=>resourceIdentity(r)===name);
  if(!row)return <EmptyState title="Resource not found" description="This resource does not appear in the current effective inventory for this service."/>;
  return <div className="service-flow"><div className="service-context-bar"><Link className="service-link" href={hrefFor(e.service,'resources')}>← All resources</Link></div>
    <Card><CardContent><Header title={row.resource_id||row.arn||'AWS Resource'} description="Read-only details for one discovered resource" extra={<StatusBadge status={row.verification_status||'UNVERIFIED'}/>}/>
      <div className="service-kv"><span>Service</span><b>{e.service.toUpperCase()}</b></div>
      <div className="service-kv"><span>Resource type</span><div>{row.resource_type?<Link className="service-link" href={typeHref(e.service,row.resource_type)}>{row.resource_type}</Link>:'Not recorded'}</div></div>
      <div className="service-kv"><span>Region</span><div>{row.region?<Link className="service-link" href={regionHref(e.service,row.region)}>{row.region}</Link>:'Not recorded'}</div></div>
      <div className="service-kv"><span>ARN</span><code className="service-wrap">{row.arn||'Not returned'}</code></div>
      <div className="service-kv"><span>Evidence source</span><b>{row.data_source||'Not specified'}</b></div>
      <div className="service-kv"><span>Resource origin</span><b>{row.resource_origin||'UNKNOWN'}</b></div>
      <Explanation warn>When the record says VERIFIED, verify what your backend's record-level check actually covered. This does not assert resource security compliance, customer ownership, a running workload or incurred AWS cost.</Explanation>
      <Header title="Complete recorded resource JSON" description="Original resource metadata returned by the inventory API"/><pre className="service-json">{JSON.stringify(row,null,2)}</pre>
    </CardContent></Card>
  </div>;
}
function Verification({e}:{e:ServiceEvidence}) {
  const outcomes=e.operations.reduce<Record<string,number>>((acc,r)=>{const state=(r.status||'UNKNOWN').toUpperCase();acc[state]=(acc[state]||0)+1;return acc;},{});
  return <div className="service-flow"><div className="service-metric-grid">
    <EvidenceMetric title="API verification status" value={e.verification?.status||'Not recorded'} description="Backend's service-level status"/>
    <EvidenceMetric title="Recorded API checks" value={e.operations.length} description="Returned operation result rows"/>
    <EvidenceMetric title="Scoped workload count" value={valueOrUnknown(e.verification?.workload_count)} description="Only if explicitly returned by backend"/>
    <EvidenceMetric title="API Regions" value={new Set(e.operations.map(o=>o.region).filter(Boolean)).size} description="Unique reported operation Regions"/>
  </div>
    <Explanation warn><b>Do not confuse discovery with verification.</b> The resource inventory may contain VPCs, security groups, default objects or unrelated EC2 resource types. A successful <code>DescribeInstances</code> returning 0 means zero instances for that API scope, not zero EC2 resource records. An ACCESS_DENIED or missing result is unknown, not zero.</Explanation>
    <Card><CardContent><Header title="AWS API verification execution" description="Each operation shows its own Region, queried resource kind, result count and status." extra={<StatusBadge status={e.verification?.status||'NOT_RECORDED'}/>}/>
      {e.operations.length>0&&<div className="service-outcome-row">{Object.entries(outcomes).map(([name,count])=><Badge key={name} tone={name==='SUCCESS'||name==='VERIFIED'?'success':/DENIED|FAILED|ERROR/.test(name)?'danger':'warning'}>{name}: {count}</Badge>)}</div>}
      <OperationsGrid operations={e.operations}/>
      <p className="service-footnote">Counts belong to independent API operations. The backend controls the query scope and verification semantics. A resource's verification badge comes from its own stored verification_status, not from this table.</p>
    </CardContent></Card>
  </div>;
}

const navigation:{view:View;label:string;description:string;icon:LucideIcon}[] = [
  {view:'overview',label:'Overview',description:'How to understand the service',icon:Cloud},
  {view:'regions',label:'Regions',description:'Region-level discovery',icon:Globe2},
  {view:'resources',label:'Resources',description:'Indexed resource records',icon:Database},
  {view:'types',label:'Resource Types',description:'Exact discovered types',icon:Layers3},
  {view:'verification',label:'AWS API Verification',description:'Read-only API evidence',icon:SearchCheck},
];

export function ServiceExplorer({route}:{route:ExplorerRoute}) {
  const {data:raw,isPending,error:rawError}=useActiveScan();
  const id=connectionId(raw);
  const {data:effective,isPending:loadingEffective,error:inventoryError}=useInventory(id);
  const router=useRouter();
  const [chatBusy,setChatBusy]=useState(false);
  const [chatError,setChatError]=useState('');
  const evidence=useMemo(()=>raw ? buildServiceEvidence(raw,effective||undefined,route.service) : null,[raw,effective,route.service]);

  if(isPending)return <LoadingPanel label="Loading selected AWS discovery scan…"/>;
  if(rawError)return <ErrorPanel message={rawError.message}/>;
  if(!raw)return <EmptyState title="No active AWS scan" description="Run or restore an AWS discovery scan before opening service details." action={<Link href="/scan" className="btn primary">Open scan</Link>}/>;
  if(id && loadingEffective)return <LoadingPanel label="Loading effective AWS inventory and verification evidence…"/>;
  // Never quietly relabel raw snapshot as the effective inventory when an API failed.
  if(inventoryError)return <ErrorPanel message={`Unable to load current effective inventory: ${inventoryError.message}`}/>;
  if(!evidence?.matched)return <EmptyState title="Service not found" description="This service does not appear in the currently selected inventory snapshot. Check the active AWS workspace, scan and service namespace." action={<Link href="/inventory" className="btn">Back to Inventory</Link>}/>;

  const e=evidence;
  async function openChat() {
    if(!raw?.scan_id)return;
    setChatBusy(true);setChatError('');
    try {
      const chat=await backend<Chat>('/chats',{method:'POST',body:{
        scan_id:raw.scan_id,title:`${e.service.toUpperCase()} · Service Investigation`,
        context:{context_type:'SERVICE',label:e.service.toUpperCase(),service:e.service,scan_id:raw.scan_id,
          regions:e.serviceRecord?.regions||[],source:e.serviceRecord?.data_source||'AWS_DISCOVERY'},
      }});
      router.push(`/assistant?chat=${chat.id}`);
    } catch(err){setChatError(err instanceof Error?err.message:'Unable to create contextual chat');}
    finally {setChatBusy(false);}
  }

  let body:React.ReactNode;
  if(route.view==='overview')body=<Overview e={e}/>;
  else if(route.view==='regions')body=route.entityKey?<RegionDetail e={e} region={route.entityKey}/>:<RegionList e={e}/>;
  else if(route.view==='types')body=route.entityKey?<TypeDetail e={e} name={decodeEntityKey(route.entityKey)||''}/>:<TypeList e={e}/>;
  else if(route.view==='resources')body=route.entityKey?<ResourceDetail e={e} keyValue={route.entityKey}/>:<ResourceList e={e}/>;
  else body=<Verification e={e}/>;

  return <div className="service-explorer">
    <div className="service-breadcrumb"><Link href="/inventory"><ArrowLeft size={15}/>AWS Inventory</Link><span>›</span><Link href={base(e.service)}>{e.service.toUpperCase()}</Link><span>›</span>{navigation.find(item=>item.view===route.view)?.label}</div>
    <div className="service-page-header"><div><h1>{e.service.toUpperCase()} <span>Service Explorer</span></h1><p>Account {raw.account?.account_id||'Unknown'} · Snapshot {raw.scan_id||'Not specified'} · Read-only infrastructure evidence</p></div><Button onClick={()=>void openChat()} disabled={chatBusy||!raw.scan_id}><MessageCircle size={15}/>{chatBusy?'Opening…':'Ask AI about this service'}</Button></div>
    {chatError&&<div className="service-explainer service-explainer-warn">{chatError}</div>}
    {!id&&<Explanation warn>Connection ID is unavailable, so this page is using the saved raw snapshot. Effective-inventory edits may not be represented.</Explanation>}
    <div className="service-layout"><aside className="service-side" aria-label={`${e.service.toUpperCase()} service navigation`}>
      <div className="service-side-title"><Blocks size={18}/><span>Service Sections</span></div>
      {navigation.map(({view,label,description,icon:Icon})=><Link key={view} href={hrefFor(e.service,view)} aria-current={route.view===view?'page':undefined} className={`service-nav-link ${route.view===view?'is-active':''}`}><Icon size={17}/><div><strong>{label}</strong><small>{description}</small></div></Link>)}
      <div className="service-side-help"><ShieldCheck size={17}/><span><b>Evidence first.</b> Values are derived from the selected AWS snapshot and effective inventory. No default resource counts or API results are fabricated.</span></div>
      <Link className="service-side-back" href="/inventory"><ArrowLeft size={14}/> All AWS Services</Link>
    </aside><div className="service-main" aria-label={`${route.view} evidence`}>
      {body}
    </div></div>
  </div>;
}
