import React from 'react';
import { TelemetryData } from '../../../../shared/types/telemetry';

interface TelemetryViewProps {
  telemetry?: TelemetryData;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ telemetry }) => {
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
      {/* Token usage */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center">
          Token Usage
        </h5>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400 text-xs block text-center">Input</span>
            <div className="font-mono font-medium text-gray-900 dark:text-gray-100 text-center h-6 flex items-center justify-center">
              {telemetry ? formatNumber(telemetry.tokens_input) : '—'}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400 text-xs block text-center">Output</span>
            <div className="font-mono font-medium text-gray-900 dark:text-gray-100 text-center h-6 flex items-center justify-center">
              {telemetry ? formatNumber(telemetry.tokens_output) : '—'}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400 text-xs block text-center">Total</span>
            <div className="font-mono font-medium text-gray-900 dark:text-gray-100 text-center h-6 flex items-center justify-center">
              {telemetry ? formatNumber(telemetry.tokens_total) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Cache tokens */}
      {telemetry && (telemetry.cache_read_tokens || telemetry.cache_creation_tokens) && (
          <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 text-xs block text-center">Cache Read</span>
              <div className="font-mono font-medium text-gray-900 dark:text-gray-100 text-center h-6 flex items-center justify-center">
                {telemetry.cache_read_tokens ? formatNumber(telemetry.cache_read_tokens) : '—'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 dark:text-gray-400 text-xs block text-center">Cache Creation</span>
              <div className="font-mono font-medium text-gray-900 dark:text-gray-100 text-center h-6 flex items-center justify-center">
                {telemetry.cache_creation_tokens ? formatNumber(telemetry.cache_creation_tokens) : '—'}
              </div>
            </div>
          </div>
        )}

      {/* Cost */}
      {telemetry && telemetry.cost_usd > 0 && (
        <div className="text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Estimated Cost: </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ${telemetry.cost_usd.toFixed(3)}
          </span>
        </div>
      )}

      {/* Tool usage */}
      {telemetry && Object.keys(telemetry.tool_usage).length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Tool Usage
          </h5>
          <div className="flex flex-wrap gap-2">
            {Object.entries(telemetry.tool_usage).map(([tool, count]) => (
              <div
                key={tool}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tool}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};