import { useEffect, useState } from 'react';
import type { Runtime } from '@/types/api';
import { runtimeService } from '@/services/runtimeService';

interface RuntimeSelectorProps {
    value?: string;
    onChange: (runtimeId: string) => void;
    disabled?: boolean;
}

export function RuntimeSelector({ value, onChange, disabled }: RuntimeSelectorProps) {
    const [runtimes, setRuntimes] = useState<Runtime[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRuntimes = async () => {
            try {
                const data = await runtimeService.getRuntimes();
                setRuntimes(data.filter(r => r.status === 'AVAILABLE'));
            } catch (err) {
                console.error('Failed to load runtimes', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadRuntimes();
    }, []);

    if (isLoading) {
        return (
            <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        );
    }

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <option value="" disabled>Select a runtime</option>
            {runtimes.map((runtime) => (
                <option key={runtime.id} value={runtime.id}>
                    {runtime.name} ({runtime.version})
                </option>
            ))}
        </select>
    );
}
