import type { AwsResource, Scan, Workspace, Chat } from '@/types/aws';

export const demoWorkspace: Workspace = { id: 1, name: 'Acme Cloud Operations', role: 'OWNER' };
const resources: AwsResource[] = [
  {service:'ec2',resource_id:'i-08f3c7b4d59a2f691',resource_type:'AWS::EC2::Instance',region:'us-east-1',verification_status:'VERIFIED',data_source:'AWS_DISCOVERY',resource_origin:'WORKLOAD'},
  {service:'ec2',resource_id:'vpc-0c221a4bb92e91ad5',resource_type:'AWS::EC2::VPC',region:'us-east-1',verification_status:'UNVERIFIED',data_source:'AWS_DISCOVERY',resource_origin:'DEFAULT_CONFIGURATION'},
  {service:'s3',resource_id:'acme-audit-logs',resource_type:'AWS::S3::Bucket',region:'us-east-1',verification_status:'UNVERIFIED',data_source:'AWS_DISCOVERY'},
  {service:'rds',resource_id:'acme-prod-database',resource_type:'AWS::RDS::DBInstance',region:'us-west-2',verification_status:'VERIFIED',data_source:'AWS_DISCOVERY'},
  {service:'lambda',resource_id:'audit-event-processor',resource_type:'AWS::Lambda::Function',region:'eu-west-1',verification_status:'UNVERIFIED',data_source:'AWS_DISCOVERY'},
  {service:'iam',resource_id:'arn:aws:iam::123456789012:role/audit-readonly',resource_type:'AWS::IAM::Role',region:'global',verification_status:'UNVERIFIED',data_source:'AWS_DISCOVERY'},
  {service:'ec2',resource_id:'subnet-01cd5e4f61c70d098',resource_type:'AWS::EC2::Subnet',region:'us-east-1',verification_status:'UNVERIFIED',data_source:'AWS_DISCOVERY'},
  {service:'s3',resource_id:'acme-backup-data',resource_type:'AWS::S3::Bucket',region:'us-east-1',verification_status:'VERIFIED',data_source:'AWS_DISCOVERY'},
  {service:'ec2',resource_id:'sg-0a72d4501cddd3f02',resource_type:'AWS::EC2::SecurityGroup',region:'us-east-1',verification_status:'UNVERIFIED',data_source:'AWS_DISCOVERY'},
];
export const demoScan: Scan = {
  scan_id: 'demo-snapshot-20261026', aws_connection_id:1, status:'COMPLETED', started_at:'2026-10-26T09:00:00Z',completed_at:'2026-10-26T09:08:00Z', inventory_revision:4,
  account:{account_id:'123456789012',aws_connection_id:1,auth_type:'ASSUME_ROLE',arn:'arn:aws:sts::123456789012:assumed-role/AuditReadOnly/sample'},
  summary:{enabled_regions:17,availability_zones:51,detected_services:6,discovered_resources:9},
  regions:{total_regions:34,enabled_regions:17,disabled_regions:17,regions:[
    {region_name:'us-east-1',enabled:true,opt_in_status:'opt-in-not-required'},
    {region_name:'us-west-2',enabled:true,opt_in_status:'opt-in-not-required'},
    {region_name:'eu-west-1',enabled:true,opt_in_status:'opt-in-not-required'},
    {region_name:'ap-south-1',enabled:true,opt_in_status:'opt-in-not-required'},
    {region_name:'ap-south-2',enabled:false,opt_in_status:'not-opted-in'}]},
  resources:{resources,detected_services:[
    {service:'ec2',resource_count:4,regions:['us-east-1'],data_source:'AWS_DISCOVERY'},
    {service:'s3',resource_count:2,regions:['us-east-1'],data_source:'AWS_DISCOVERY'},
    {service:'rds',resource_count:1,regions:['us-west-2'],data_source:'AWS_DISCOVERY'},
    {service:'lambda',resource_count:1,regions:['eu-west-1'],data_source:'AWS_DISCOVERY'},
    {service:'iam',resource_count:1,regions:['global'],data_source:'AWS_DISCOVERY'},
    {service:'athena',resource_count:0,regions:[],data_source:'USER_ADDED'}],
    used_regions:['us-east-1','us-west-2','eu-west-1'], total_resources:9,
    verification:{verified_at:'2026-10-26T09:08:00Z',services:[
      {service:'ec2',status:'PARTIAL',workload_count:1,operation_results:[{region:'us-east-1',kind:'Instance',operation:'DescribeInstances',count:1,status:'SUCCESS'},{region:'us-east-1',kind:'VPC',operation:'DescribeVpcs',count:1,status:'SUCCESS'}]},
      {service:'s3',status:'PARTIAL',workload_count:2,operation_results:[{region:'us-east-1',kind:'Bucket',operation:'ListBuckets',count:2,status:'SUCCESS'}]}]}
  },
  billing:{available:true,currency:'USD',total_cost:46.32,service_costs:[{service:'Amazon Elastic Compute Cloud',cost:26.14},{service:'Amazon Relational Database Service',cost:17.21},{service:'Amazon Simple Storage Service',cost:2.97}],region_costs:[],warnings:[]}
};
export const demoChat: Chat = {id: 1,scan_id:demoScan.scan_id,title:'Infrastructure overview',context:{},messages:[
  {role:'user',content:'Which AWS services were discovered?'},
  {role:'assistant',content:'The demonstration inventory contains EC2, S3, RDS, Lambda, IAM, and a user-added Athena entry. This is SAMPLE DATA, not a real AWS query.',evidence:{source:'DEMO_SAMPLE'}}
]};
export function demoResponse(path: string, method:string): unknown {
  if (method!=='GET') return {detail:'Demo mode is read-only. Connect FastAPI to perform actions.'};
  if (path==='/workspaces') return [demoWorkspace];
  if (path==='/aws/session/status') return {connected:true,auto_connect:true,auth_type:'ASSUME_ROLE'};
  if (path==='/aws/scans' ) return [demoScan];
  if (path==='/aws/scans/active' || path==='/aws/scans/demo-snapshot-20261026') return demoScan;
  if (path==='/aws/connections/1/inventory') return demoScan;
  if (path==='/aws/connections/1/inventory/revisions') return [{revision:4,changed_at:'2026-10-26T09:08:00Z',change_type:'AUTO_SCAN',change:{action:'SCAN_REFRESH',scan_id:demoScan.scan_id}},{revision:3,changed_at:'2026-10-25T10:00:00Z',change_type:'MANUAL',change:{action:'ADD_SERVICE',target:'athena'},changed_by_user_id:1}];
  if (path==='/chats') return [demoChat];
  if (path==='/chats/1') return demoChat;
  return {detail:'No sample record for this endpoint.'};
}
