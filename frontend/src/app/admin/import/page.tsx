"use client";
import { useState, useRef } from 'react';
import { bulkImport } from '@/lib/api';

const CSV_HEADERS = [
  'title', 'description', 'city', 'state', 'locality',
  'price', 'maxPrice', 'projectType', 'projectStage',
  'builderName', 'builderContact', 'reraId',
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
    });
    return obj;
  });
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',');
  const sample = [
    'Sunrise Heights',
    'A premium residential project',
    'Mumbai',
    'Maharashtra',
    'Andheri West',
    '5000000',
    '8000000',
    'APARTMENT',
    'UNDER_CONSTRUCTION',
    'ABC Builders',
    '+919876543210',
    'MH/2024/001',
  ].join(',');
  const content = `${header}\n${sample}\n`;
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gxcrealty-properties-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors?: { row: number; message: string }[];
}

export default function BulkImportPage() {
  const [rows, setRows]                 = useState<Record<string, string>[]>([]);
  const [fileName, setFileName]         = useState('');
  const [parseError, setParseError]     = useState('');
  const [importing, setImporting]       = useState(false);
  const [result, setResult]             = useState<ImportResult | null>(null);
  const [importError, setImportError]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setParseError('');
    setResult(null);
    setImportError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const data = Array.isArray(parsed) ? parsed : parsed.properties || parsed.rows || [];
          setRows(data);
        } else {
          const parsed = parseCSV(text);
          if (parsed.length === 0) throw new Error('No data rows found in CSV.');
          setRows(parsed);
        }
      } catch (err: any) {
        setParseError(err.message || 'Failed to parse file.');
        setRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);
    setImportError('');
    try {
      const res = await bulkImport.properties(rows);
      setResult(res);
    } catch (err: any) {
      setImportError(err.message || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const resetFile = () => {
    setRows([]);
    setFileName('');
    setParseError('');
    setResult(null);
    setImportError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const previewRows = rows.slice(0, 5);
  const detectedCols = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-5xl mx-auto text-[var(--text-primary)]">
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-10 -translate-y-1/4 translate-x-1/3"
        style={{ background: 'radial-gradient(circle, rgba(148,163,184,0.8) 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Bulk <span className="text-gradient">Import</span>
          </h1>
          <p className="text-[var(--text-secondary)]">Upload a CSV or JSON file to bulk-import properties.</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all text-sm font-semibold border border-[var(--border-subtle)] self-start sm:self-auto">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV Template
        </button>
      </header>

      {/* Upload Zone */}
      {rows.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="glass-panel rounded-3xl border-2 border-dashed border-[var(--border-medium)] hover:border-indigo-500/40 transition-all p-12 text-center cursor-pointer mb-6"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-700/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Drop your file here</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Supports <strong>.csv</strong> and <strong>.json</strong> files</p>
          <p className="text-xs text-[var(--text-muted)]">Or click to browse</p>
        </div>
      )}

      {/* Parse Error */}
      {parseError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mb-6">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {parseError}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <>
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 mb-6">
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">{fileName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{rows.length} rows · {detectedCols.length} columns detected</p>
                </div>
              </div>
              <button onClick={resetFile}
                className="p-2 rounded-xl hover:bg-rose-500/10 transition-all text-[var(--text-muted)] hover:text-rose-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Column info */}
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex flex-wrap gap-2">
              {detectedCols.map(col => (
                <span key={col} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  CSV_HEADERS.includes(col)
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {col}
                  {!CSV_HEADERS.includes(col) && ' *'}
                </span>
              ))}
            </div>
            {detectedCols.some(c => !CSV_HEADERS.includes(c)) && (
              <p className="px-5 py-2 text-xs text-amber-400 border-b border-[var(--border-subtle)]">
                * Columns marked with * are not standard and may be ignored.
              </p>
            )}

            {/* Preview table */}
            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
                Preview (first {previewRows.length} of {rows.length} rows)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      {['#', 'Title', 'City', 'Type', 'Stage', 'Price'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-black uppercase tracking-wide text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                        <td className="px-3 py-2 text-[var(--text-muted)]">{i + 1}</td>
                        <td className="px-3 py-2 font-medium max-w-[150px] truncate">{row.title || '—'}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{row.city || '—'}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{row.projectType || '—'}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{row.projectStage || '—'}</td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{row.price || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <p className="mt-3 text-xs text-[var(--text-muted)] text-center">
                  + {rows.length - 5} more rows not shown
                </p>
              )}
            </div>
          </div>

          {/* Import Button */}
          {!result && (
            <div className="flex gap-3">
              <button onClick={handleImport} disabled={importing}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold text-sm hover:from-slate-500 hover:to-slate-700 transition-all disabled:opacity-60 shadow-xl shadow-slate-700/20">
                {importing ? (
                  <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg><span>Importing {rows.length} rows...</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg><span>Import {rows.length} Properties</span></>
                )}
              </button>
              <button onClick={resetFile}
                className="px-6 py-4 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all text-sm font-semibold border border-[var(--border-subtle)]">
                Reset
              </button>
            </div>
          )}
        </>
      )}

      {/* Import Error */}
      {importError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mt-4">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {importError}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="glass-panel rounded-3xl p-6 border border-white/5 mt-4">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Import Results
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--glass-bg)] rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-[var(--text-primary)]">{result.total}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">Total</p>
            </div>
            <div className="bg-emerald-500/10 rounded-2xl p-5 text-center border border-emerald-500/20">
              <p className="text-3xl font-black text-emerald-400">{result.succeeded}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/60 mt-1">Succeeded</p>
            </div>
            <div className={`rounded-2xl p-5 text-center border ${result.failed > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-[var(--glass-bg)] border-[var(--border-subtle)]'}`}>
              <p className={`text-3xl font-black ${result.failed > 0 ? 'text-rose-400' : 'text-[var(--text-muted)]'}`}>{result.failed}</p>
              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${result.failed > 0 ? 'text-rose-400/60' : 'text-[var(--text-muted)]'}`}>Failed</p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div>
              <p className="text-sm font-bold text-rose-400 mb-3">Row Errors:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-sm">
                    <span className="font-black text-rose-400 flex-shrink-0">Row {err.row}</span>
                    <span className="text-[var(--text-secondary)]">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button onClick={resetFile}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
