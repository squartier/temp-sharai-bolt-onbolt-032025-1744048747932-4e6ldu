import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';

interface WorkflowLog {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

interface WorkflowLogsProps {
  workflowId: string;
}

export function WorkflowLogs({ workflowId }: WorkflowLogsProps) {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [workflowId]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getLogClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-red-500/20 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/10';
      default:
        return 'border-blue-500/20 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 animate-spin text-[#BB86FC]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[#E0E0E0]">Workflow Logs</h3>
        <button
          onClick={fetchLogs}
          className="text-[#BB86FC] hover:text-[#E0E0E0] transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center text-[#757575] py-8">
          No logs available
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border ${getLogClass(log.level)} animate-fade-in`}
            >
              <div className="flex items-start space-x-3">
                {getLogIcon(log.level)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#E0E0E0]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-xs uppercase text-[#757575]">
                      {log.level}
                    </span>
                  </div>
                  <p className="mt-1 text-[#E0E0E0]">{log.message}</p>
                  {log.details && (
                    <pre className="mt-2 p-2 rounded bg-black/20 text-sm text-[#BB86FC] overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}