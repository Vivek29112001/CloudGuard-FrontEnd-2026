'use client';

import Image from 'next/image';
import { CheckCircle2, Eye } from 'lucide-react';
import awsLogo from '../../../../assets/AWS_logo.png';
import azureLogo from '../../../../assets/Azure_logo.png';
import googleCloudLogo from '../../../../assets/Google_cloud.png';
import type { CloudProvider } from '@/types/cloud-connection';

const OPTIONS = [
  { id: 'aws', title: 'Amazon Web Services', short: 'AWS', logo: awsLogo, subtitle: 'Live backend connection' },
  { id: 'azure', title: 'Microsoft Azure', short: 'Azure', logo: azureLogo, subtitle: 'Frontend demo only' },
  { id: 'gcp', title: 'Google Cloud Platform', short: 'GCP', logo: googleCloudLogo, subtitle: 'Frontend demo only' },
] as const;

export function ProviderSelector({ value, onChange }: { value: CloudProvider; onChange: (provider: CloudProvider) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Choose cloud provider">
      {OPTIONS.map(({ id, title, short, logo, subtitle }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(id)}
            className={`text-left bg-white rounded-xl border-2 p-4 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${selected ? 'border-blue-500 shadow-sm' : 'border-slate-200 hover:border-blue-200'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="h-12 w-12 rounded-xl flex items-center justify-center bg-white">
                <Image
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
              </span>
              {selected ? <CheckCircle2 size={18} className="text-blue-600" aria-hidden="true" /> : id !== 'aws' ? <Eye size={18} className="text-slate-400" aria-hidden="true" /> : null}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-3">{title}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{short}</div>
            <div className="text-[11px] text-slate-500 mt-2">{subtitle}</div>
          </button>
        );
      })}
    </div>
  );
}
