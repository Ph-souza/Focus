
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileDown,
  CheckCircle2,
  ArrowRight,
  Settings2,
  Table as TableIcon,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Tipagem das transações finais esperadas pelo backend
interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  account: string;
  [key: string]: any;
}

interface ColumnMapping {
  original: string;
  mappedTo: string;
}

interface BatchRule {
  id: string;
  keyword: string;
  category: string;
}

const REQUIRED_FIELDS = [
  { id: 'date', label: 'Data', type: 'date' },
  { id: 'description', label: 'Descrição', type: 'text' },
  { id: 'amount', label: 'Valor', type: 'number' },
  { id: 'type', label: 'Tipo (Receita/Despesa)', type: 'text' },
  { id: 'category', label: 'Categoria', type: 'text' },
  { id: 'account', label: 'Conta', type: 'text' }
];

// Heurística de auto-mapeamento
const guessMapping = (originalHeader: string): string => {
  const h = originalHeader.toLowerCase();
  if (h.includes('data') || h.includes('vencimento') || h.includes('date')) return 'date';
  if (h.includes('descrição') || h.includes('historico') || h.includes('nome') || h.includes('description')) return 'description';
  if (h.includes('valor') || h.includes('quantia') || h.includes('amount') || h.includes('R$')) return 'amount';
  if (h.includes('tipo') || h.includes('entrada/saída')) return 'type';
  if (h.includes('categoria') || h.includes('grupo')) return 'category';
  if (h.includes('conta') || h.includes('banco') || h.includes('origem')) return 'account';
  return '';
};

export function ImportModule() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);

  // Dados brutos extraídos do arquivo
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  // Estado do mapeamento De/Para
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Regras em Lote
  const [rules, setRules] = useState<BatchRule[]>([]);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leitura do arquivo
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploaded = acceptedFiles[0];
    if (!uploaded) return;

    setFile(uploaded);

    if (uploaded.name.endsWith('.csv')) {
      Papa.parse(uploaded, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          handleDataExtracted(results.meta.fields || [], results.data);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (json.length > 0) {
          const headers = json[0].map(String);
          const rows = json.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = row[i]; });
            return obj;
          });
          handleDataExtracted(headers, rows);
        }
      };
      reader.readAsArrayBuffer(uploaded);
    }
  }, []);

  const handleDataExtracted = (headers: string[], data: any[]) => {
    setRawHeaders(headers);
    setRawData(data);

    // Auto-mapeamento
    const initialMapping: Record<string, string> = {};
    headers.forEach(h => {
      const guessed = guessMapping(h);
      if (guessed) initialMapping[h] = guessed;
    });
    setMapping(initialMapping);
    setStep(2);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const csvContent = "Data,Descrição,Valor,Tipo,Categoria,Conta\n01/10/2026,Salário,5000,receita,Salário,Banco A\n02/10/2026,Supermercado,450.50,despesa,Alimentação,Banco A";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'template_nexus_focus.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddRule = () => {
    if (!newRuleKeyword || !newRuleCategory) return;
    setRules([...rules, { id: Math.random().toString(), keyword: newRuleKeyword, category: newRuleCategory }]);
    setNewRuleKeyword('');
    setNewRuleCategory('');
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // Prepara o array final processando mapeamento e regras
  const getPreviewData = (): ParsedTransaction[] => {
    return rawData.map(row => {
      const parsed: any = {};

      // Aplicar mapeamento
      Object.entries(mapping).forEach(([originalCol, mappedField]) => {
        if (mappedField) {
          parsed[mappedField] = row[originalCol];
        }
      });

      // Se categoria não foi preenchida, usar "Pendente" para não quebrar gráficos
      if (!parsed.category || String(parsed.category).trim() === '') {
        parsed.category = 'Pendente';
      }

      // Aplicar regras em lote (sobrescreve categoria se bater com a palavra-chave na descrição)
      if (parsed.description) {
        const descLower = String(parsed.description).toLowerCase();
        for (const rule of rules) {
          if (descLower.includes(rule.keyword.toLowerCase())) {
            parsed.category = rule.category;
            break;
          }
        }
      }

      return parsed as ParsedTransaction;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const finalPayload = getPreviewData();

    try {
      /*
        Comentários de Integração com Backend:
        Nesta etapa o frontend deve enviar `finalPayload` para o backend:
        await axios.post('/api/transactions/batch', { transactions: finalPayload });
        
        O backend, conectado ao SQLite ou PostgreSQL, deve processar e salvar esses dados 
        associados ao ID do usuário atual.
        
        NÃO É NECESSÁRIO enviar o arquivo físico (CSV/XLSX) ao servidor. O frontend 
        já realizou a extração e conversão em JSON (finalPayload).
        Isso economiza banda, armazenamento no servidor (não guarda arquivos temporários)
        e diminui a carga de processamento na API.
      */

      // Simulação de chamada de rede
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert('Importação concluída com sucesso!');
      navigate('/dashboard'); // Ou outra rota principal

    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Ocorreu um erro ao processar a importação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 flex justify-center items-start overflow-y-auto">
      <div className="w-full max-w-4xl mt-12 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl p-8">

        <div className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <TableIcon className="text-blue-500" />
              Migração Inteligente
            </h1>
            <p className="text-zinc-400 mt-1">Importe seu histórico de planilhas de forma fácil.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-zinc-500 hover:text-white"
          >
            Voltar
          </button>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                }`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={48} className={`mb-4 ${isDragActive ? 'text-blue-500' : 'text-zinc-500'}`} />
              <h3 className="text-lg font-bold mb-2">Arraste sua planilha ou clique para buscar</h3>
              <p className="text-zinc-400 text-sm">Suporta arquivos .csv, .xls e .xlsx</p>
            </div>

            <div className="mt-8 text-center flex flex-col items-center">
              <p className="text-zinc-500 text-sm mb-4">Precisa de um formato padrão para preencher?</p>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
              >
                <FileDown size={18} />
                Baixar Planilha Modelo
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MAPEAMENTO & PREVIEW */}
        {(step === 2 || step === 3) && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

              {/* Coluna Esquerda: Mapeamento */}
              <div className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Settings2 size={20} className="text-blue-400" />
                  Mapear Colunas
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Relacione as colunas da sua planilha com os campos do sistema.
                </p>

                <div className="space-y-4">
                  {rawHeaders.map((header) => (
                    <div key={header} className="flex items-center justify-between gap-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700/50">
                      <span className="font-medium text-sm truncate max-w-[120px]" title={header}>
                        {header}
                      </span>
                      <ArrowRight size={16} className="text-zinc-600 flex-shrink-0" />
                      <select
                        value={mapping[header] || ''}
                        onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                        className="bg-zinc-800 border border-zinc-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 flex-1"
                      >
                        <option value="">Ignorar Coluna</option>
                        {REQUIRED_FIELDS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna Direita: Regras em Lote */}
              <div className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 flex flex-col">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-400" />
                  Regras e Categorização
                </h3>

                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs p-3 rounded-lg mb-6 flex items-start gap-2">
                  <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p>
                    Transações sem categoria receberão automaticamente a tag <strong>"Pendente"</strong>.
                    Crie regras abaixo para categorizar em lote com base em palavras-chave.
                  </p>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Palavra-chave (ex: Uber)"
                    value={newRuleKeyword}
                    onChange={e => setNewRuleKeyword(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Categoria (ex: Transporte)"
                    value={newRuleCategory}
                    onChange={e => setNewRuleCategory(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 flex-1"
                  />
                  <button
                    onClick={handleAddRule}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Adicionar
                  </button>
                </div>

                <ul className="space-y-2 overflow-y-auto flex-1 max-h-[200px]">
                  {rules.length === 0 && (
                    <li className="text-zinc-500 text-sm text-center py-4">Nenhuma regra criada.</li>
                  )}
                  {rules.map(rule => (
                    <li key={rule.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-700/50 p-2.5 rounded-lg text-sm">
                      <span>Se conter <strong>"{rule.keyword}"</strong> ➔ <strong>{rule.category}</strong></span>
                      <button onClick={() => removeRule(rule.id)} className="text-red-400 hover:text-red-300">Remover</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Preview Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
              <div className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-800">
                <h4 className="text-sm font-bold text-zinc-300">Preview dos Dados (5 primeiras linhas)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
                    <tr>
                      {REQUIRED_FIELDS.map(f => (
                        <th key={f.id} className="px-4 py-3 font-medium">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getPreviewData().slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        {REQUIRED_FIELDS.map(f => (
                          <td key={f.id} className="px-4 py-3 truncate max-w-[150px]">
                            {row[f.id] ? (
                              <span className={f.id === 'category' && row[f.id] === 'Pendente' ? 'text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded' : 'text-zinc-200'}>
                                {String(row[f.id])}
                              </span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => { setStep(1); setFile(null); }}
                className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Importando...' : 'Finalizar Importação'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
