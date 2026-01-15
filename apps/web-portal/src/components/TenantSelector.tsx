import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface TenantSelectorProps {
  currentTenant: string;
  onTenantChange: (tenantId: string) => void;
}

export function TenantSelector({ currentTenant, onTenantChange }: TenantSelectorProps) {
  const tenants = [
    { id: 'tenant-a', name: 'Acme Corp' },
    { id: 'tenant-b', name: 'Globex Inc' },
    { id: 'tenant-c', name: 'Soylent Corp' },
  ];

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
        <Users size={20} />
      </div>
      <div>
        <label className="block text-xs text-slate-400 font-medium">Active Tenant</label>
        <select
          value={currentTenant}
          onChange={(e) => onTenantChange(e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
        >
          {tenants.map(t => (
            <option key={t.id} value={t.id} className="bg-slate-800">
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
