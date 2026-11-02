import type {Scan,Revision} from '@/types/aws';
export type ServiceRow={service:string;count:number;regions:string[];source:string;status:string;restoreAction:'RESTORE_SERVICE'|'ADD_SERVICE'};
export function servicesFrom(context:Scan,revisions:Revision[]):ServiceRow[]{
 const map=new Map<string,ServiceRow>();
 for(const item of context.resources?.detected_services||[]) {
  const name=(item.service||'').toLowerCase();if(!name)continue;
  const qty=item.resource_count??0;const source=item.data_source||item.source||'AWS_DISCOVERY';
  map.set(name,{service:name,count:qty,regions:item.regions||[],source,status:source==='USER_ADDED'&&qty===0?'Added by user':qty>0?'Resources detected':'No resources detected',restoreAction:'RESTORE_SERVICE'});
 }
 const ordered=[...revisions].sort((a,b)=>(b.revision||0)-(a.revision||0));const last=new Set<string>();
 for(const rev of ordered) {const c=rev.change||{};const action=c.action;const service=(c.target||c.service||'').toLowerCase();if(!service||last.has(service)||!['ADD_SERVICE','RESTORE_SERVICE','EXCLUDE_SERVICE'].includes(action||''))continue;last.add(service);if(action==='EXCLUDE_SERVICE'&&!map.has(service))map.set(service,{service,count:0,regions:[],source:'USER_EXCLUDED',status:'Removed by user',restoreAction:c.before==='ADD'?'ADD_SERVICE':'RESTORE_SERVICE'});}
 return [...map.values()].sort((a,b)=>a.service.localeCompare(b.service));
}
