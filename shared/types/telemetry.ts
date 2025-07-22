export interface TelemetryData {
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  cost_usd: number;
  tool_usage: Record<string, number>;
  active_time_ms: number;
  last_update?: string;
}

export interface PRPGenerationProgressWithTelemetry {
  stage: 'starting' | 'processing' | 'finalizing' | 'complete' | 'error';
  message: string;
  progress: number;
  telemetry?: TelemetryData;
  metadata?: any;
}

export interface TelemetryConfig {
  enableTelemetry?: boolean;
  telemetryEndpoint?: string;
  telemetryExporter?: 'console' | 'otlp';
}