export class ApiError extends Error {constructor(public status:number,message:string){super(message);this.name='ApiError';}}
export async function api<T>(path:string,options:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;signal?:AbortSignal}={}):Promise<T>{
 if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid path');
 const response=await fetch(path,{method:options.method??'GET',credentials:'same-origin',headers:options.body===undefined?{}:{'Content-Type':'application/json'},body:options.body===undefined?undefined:JSON.stringify(options.body),cache:'no-store',signal:options.signal});
 if (!response.ok) {let message=`Request failed (${response.status})`;try {const d=await response.json() as {detail?:string};message=d.detail||message;}catch{}if(response.status===401&&path.startsWith('/api/backend/'))window.location.assign(new URL('/login',window.location.origin).toString());throw new ApiError(response.status,message);}
 return response.json() as Promise<T>;
}
export const backend=<T,>(path:string, options?:Parameters<typeof api>[1])=>api<T>(`/api/backend${path}`,options);
