import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Settings, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ParcelCard } from '../components/features/dashboard/ParcelCard';
import { functionService } from '@/services/functionService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function FunctionDetailPage() {
  const { functionId } = useParams();
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const loadDetails = async () => {
      if (functionId) {
        const data = await functionService.getFunctionDetails(functionId);
        setDetails(data);
      }
    };
    loadDetails();
  }, [functionId]);

  if (!details) return <LoadingScreen />;


  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/functions"
            className="p-3 hover:bg-muted rounded-2xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              {functionId}
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                Active
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">
              Node.js 18 • 128MB • 30s timeout
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-card border border-border hover:bg-muted text-foreground px-5 py-2.5 rounded-2xl font-bold transition-colors shadow-sm">
            <Settings size={20} />
            Settings
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:scale-[1.02]">
            <Play size={20} />
            Test Run
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Clock size={24} />
            </div>
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
              Avg. Latency
            </h3>
          </div>
          <p className="text-4xl font-black text-foreground">{details.stats.latency}ms</p>
          <p className="text-xs text-green-600 font-bold mt-1">↓ 12% from last hour</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-xl text-green-600">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
              Success Rate
            </h3>
          </div>
          <p className="text-4xl font-black text-foreground">{details.stats.successRate}%</p>
          <p className="text-xs text-muted-foreground font-bold mt-1">Last 24 hours</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
              Errors
            </h3>
          </div>
          <p className="text-4xl font-black text-foreground">{details.stats.errors}</p>
          <p className="text-xs text-muted-foreground font-bold mt-1">Last 24 hours</p>
        </div>
      </div>

      {/* Latency Chart */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
        <h3 className="text-xl font-bold text-foreground mb-6">Latency History</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={details.latencyHistory}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9E80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF9E80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFCCBC" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#8D6E63"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#8D6E63" fontSize={12} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#FFCCBC',
                  color: '#4E342E',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ color: '#FF9E80' }}
              />
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#FF9E80"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorLatency)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Executions */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">Recent Executions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {details.recentExecutions.map((exec: any) => (
            <ParcelCard key={exec.id} {...exec} />
          ))}
        </div>
      </div>
    </div>
  );
}
