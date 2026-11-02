import {describe,it,expect} from 'vitest';
import {servicesFrom} from '../src/lib/domain/inventory';
import type {Scan,Revision} from '../src/types/aws';
describe('effective inventory service rows',()=>{
 it('never invents services that discovery or revisions did not return',()=>{
  expect(servicesFrom({resources:{detected_services:[]}},[])).toEqual([]);
 });
 it('distinguishes discovered from user-added services',()=>{
  const scan:Scan={resources:{detected_services:[{service:'ec2',resource_count:3},{service:'athena',resource_count:0,data_source:'USER_ADDED'}]}};
  const rows=servicesFrom(scan,[]);
  expect(rows.find(r=>r.service==='ec2')?.status).toBe('Resources detected');
  expect(rows.find(r=>r.service==='athena')?.status).toBe('Added by user');
 });
 it('shows excluded services from latest revision, not restored ones',()=>{
  const revisions:Revision[]=[{revision:3,change:{action:'RESTORE_SERVICE',target:'s3'}},{revision:2,change:{action:'EXCLUDE_SERVICE',target:'s3'}},{revision:1,change:{action:'EXCLUDE_SERVICE',target:'rds'}}];
  const rows=servicesFrom({resources:{detected_services:[]}},revisions);
  expect(rows.map(r=>r.service)).toEqual(['rds']);
 });
});
