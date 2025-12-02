interface PayloadEditorProps {
  payload: string;
  setPayload: (payload: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function PayloadEditor({ payload, setPayload, error, setError }: PayloadEditorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Test Event JSON</label>
      <textarea
        value={payload}
        onChange={(e) => {
          setPayload(e.target.value);
          setError(null);
        }}
        placeholder='{"key": "value"}'
        className={`w-full h-32 bg-muted/30 border text-foreground px-6 py-4 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 transition-all resize-none placeholder:text-muted-foreground/50 ${
          error ? 'border-red-500 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'
        }`}
      />
      {error && (
        <p className="text-xs font-bold text-red-500 ml-2">{error}</p>
      )}
    </div>
  );
}
