import { Upload, CheckCircle } from 'lucide-react';

interface FileUploadZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

export function FileUploadZone({ selectedFile, onFileSelect }: FileUploadZoneProps) {
  return (
    <div className="border-3 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer group">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Upload size={40} className="text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Upload Source Code</h3>
      <p className="text-muted-foreground font-medium mb-6">Select a single source file (e.g., .py, .js, .go)</p>
      <input 
        type="file" 
        className="hidden" 
        id="file-upload"
        accept=".py,.js,.ts,.go,.java,.rb,.php"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
      />
      <label 
        htmlFor="file-upload"
        className="bg-card border-2 border-primary text-primary px-8 py-3 rounded-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
      >
        Select File
      </label>
      {selectedFile && (
        <div className="mt-4 flex items-center gap-2 text-green-600 font-bold bg-green-100 px-4 py-2 rounded-xl">
          <CheckCircle size={18} />
          {selectedFile.name}
        </div>
      )}
    </div>
  );
}
