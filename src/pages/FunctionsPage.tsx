import { useState } from 'react';
import { Search, Play, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DeployModal } from '@/components/features/functions/DeployModal';

export function FunctionsPage() {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-foreground">Functions</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              type="text"
              placeholder="Search functions..."
              className="bg-card border border-border text-foreground pl-12 pr-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm w-64 transition-all focus:w-80"
            />
          </div>
          <button 
            onClick={() => setIsDeployModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
          >
            Deploy Function
          </button>
        </div>
      </div>

      <DeployModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} />

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5 font-bold">Name</th>
              <th className="px-8 py-5 font-bold">Runtime</th>
              <th className="px-8 py-5 font-bold">Last Executed</th>
              <th className="px-8 py-5 font-bold">Success Rate</th>
              <th className="px-8 py-5 font-bold">Status</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              {
                name: 'process-order',
                runtime: 'Node.js 18',
                last: '2 mins ago',
                rate: '99.2%',
                status: 'Active',
              },
              {
                name: 'generate-thumbnail',
                runtime: 'Python 3.9',
                last: '1 hour ago',
                rate: '95.0%',
                status: 'Active',
              },
              {
                name: 'send-email',
                runtime: 'Node.js 18',
                last: '5 mins ago',
                rate: '98.1%',
                status: 'Active',
              },
              {
                name: 'backup-db',
                runtime: 'Go 1.20',
                last: '1 day ago',
                rate: '100%',
                status: 'Inactive',
              },
            ].map((fn) => (
              <tr key={fn.name} className="hover:bg-muted/30 transition-colors group">
                <td className="px-8 py-5 font-bold text-foreground">
                  <Link
                    to={`/functions/${fn.name}`}
                    className="hover:text-primary transition-colors"
                  >
                    {fn.name}
                  </Link>
                </td>
                <td className="px-8 py-5 text-muted-foreground font-medium">{fn.runtime}</td>
                <td className="px-8 py-5 text-muted-foreground font-medium">{fn.last}</td>
                <td className="px-8 py-5 text-muted-foreground font-medium">{fn.rate}</td>
                <td className="px-8 py-5">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      fn.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {fn.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                      title="Run Test"
                    >
                      <Play size={18} />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
