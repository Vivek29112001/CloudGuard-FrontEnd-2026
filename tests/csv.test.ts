import {describe,it,expect} from 'vitest';
import {serializeCsv} from '../src/lib/utils/csv';
describe('evidence export safety',()=>{
 it('escapes quotes',()=>expect(serializeCsv(['name'],[['A"B']])).toContain('"A""B"'));
 it('neutralizes spreadsheet formulas',()=>{
  for(const v of ['=HYPERLINK("x")','+SUM(1,2)','-2+3','@formula'])expect(serializeCsv(['name'],[[v]])).toContain('"\''+v.replaceAll('"','""')+'"');
 });
});
