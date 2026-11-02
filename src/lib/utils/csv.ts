// Shared spreadsheet-safe CSV exporter. Quotes are escaped and formula-like values
// are prefixed before being opened in Excel or Google Sheets.
export function csvQuote(v:unknown):string {
 const text=String(v??'');
 const safe=/^\s*[=+\-@\t\r]/.test(text)?`'${text}`:text;
 return `"${safe.replaceAll('"','""')}"`;
}
export function serializeCsv(fields:string[],rows:unknown[][]):string {
 return '\uFEFF'+[fields,...rows].map(row=>row.map(csvQuote).join(',')).join('\r\n');
}
export function downloadCsv(filename:string,fields:string[],rows:unknown[][]) {
 const blob=new Blob([serializeCsv(fields,rows)],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
