'use client';
import {useQuery} from '@tanstack/react-query';
import {backend,ApiError} from '@/lib/api/client';
import type {AuthStatus,Chat,Revision,Scan,Workspace} from '@/types/aws';
export const keys={scan:['active-scan'] as const,history:['scan-history'] as const,auth:['auth-status'] as const,chats:['chats'] as const};
function logActiveScanResponse(data: Scan) {
 if(process.env.NODE_ENV!=='development')return;
 const redact=(value:unknown):unknown=>{
  if(Array.isArray(value))return value.map(redact);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,/token|secret|password|credential|authorization|private.?key/i.test(key)?'[REDACTED]':redact(item)]));
  return value;
 };
 console.groupCollapsed('[AWS Auditor] Full active scan response (sensitive fields redacted)');
 console.log(redact(data));
 console.groupEnd();
}
export function useActiveScan(){return useQuery({queryKey:keys.scan,queryFn:async()=>{try{const data=await backend<Scan>('/aws/scans/active');logActiveScanResponse(data);return data;}catch(e){if(e instanceof ApiError&&e.status===404)return null;throw e;}},retry:false,staleTime:15_000});}
export function useScanHistory(){return useQuery({queryKey:keys.history,queryFn:()=>backend<Scan[]>('/aws/scans'),retry:false});}
export function useAuthStatus(connectionId?:number){return useQuery({queryKey:[...keys.auth,connectionId],queryFn:()=>backend<AuthStatus>(`/aws/session/status${connectionId?`?connection_id=${connectionId}`:''}`),retry:false});}
export function useInventory(id?:number){return useQuery({queryKey:['inventory',id],enabled:!!id,queryFn:()=>backend<Scan>(`/aws/connections/${id}/inventory`),retry:false});}
export function useRevisions(id?:number){return useQuery({queryKey:['revisions',id],enabled:!!id,queryFn:()=>backend<Revision[]>(`/aws/connections/${id}/inventory/revisions`),retry:false});}
export function useChats(){return useQuery({queryKey:keys.chats,queryFn:()=>backend<Chat[]>('/chats'),retry:false});}
export function useWorkspaces(){return useQuery({queryKey:['workspaces'],queryFn:()=>backend<Workspace[]>('/workspaces'),retry:false});}
export function connectionId(scan?:Scan|null) {return scan?.aws_connection_id||scan?.account?.aws_connection_id||scan?.account?.id;}
