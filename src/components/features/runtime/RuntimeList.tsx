import { useEffect, useState } from 'react';
import type { Runtime } from '@/types/api';
import { runtimeService } from '@/services/runtimeService';
import { RuntimeCard } from './RuntimeCard';

export function RuntimeList() {
    const [runtimes, setRuntimes] = useState<Runtime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRuntimes = async () => {
            try {
                const data = await runtimeService.getRuntimes();
                setRuntimes(data);
            } catch (err) {
                setError('Failed to load runtimes');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadRuntimes();
    }, []);

    if (isLoading) {
        return <div className="animate-pulse h-40 bg-card rounded-3xl" />;
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-500/10 rounded-xl">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {runtimes.map((runtime) => (
                <RuntimeCard key={runtime.id} runtime={runtime} />
            ))}
        </div>
    );
}
