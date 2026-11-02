import { notFound } from 'next/navigation';
import { ServiceExplorer, type ExplorerRoute } from '@/features/inventory/service-explorer/service-explorer';

// A single reusable renderer backs multiple real, shareable URLs:
//  /inventory/services/ec2
//  /inventory/services/ec2/regions/ap-south-1
//  /inventory/services/ec2/resources/<encoded-identity>
//  /inventory/services/ec2/types/<encoded-resource-type>
//  /inventory/services/ec2/verification
export const dynamic = 'force-dynamic';

type Params = { service: string; section?: string[] };
export default async function Page({params}: {params: Promise<Params>}) {
  const {service,section=[]} = await params;
  if (!/^[a-z0-9-]{2,100}$/.test(service)) notFound();
  let view: ExplorerRoute['view'] = 'overview';
  let entityKey: string | undefined;
  if (section.length) {
    const first = section[0];
    if (!['regions','resources','types','verification'].includes(first)) notFound();
    if (first === 'verification' && section.length !== 1) notFound();
    if (section.length > 2) notFound();
    if (section[1] && (!/^[A-Za-z0-9_%-]{1,12000}$/.test(section[1]))) notFound();
    view = first as ExplorerRoute['view'];
    entityKey = section[1];
  }
  return <ServiceExplorer route={{service,view,entityKey}}/>;
}
