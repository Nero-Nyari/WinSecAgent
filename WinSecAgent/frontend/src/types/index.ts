export interface Alert {
  id: number;
  title: string;
  raw_content?: string;
  source_type: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: number;
  alert_id: number;
  event_type?: string;
  risk_level?: string;
  confidence?: number;
  summary?: string;
  attack_stage?: string;
  status: string;
  created_at: string;
  updated_at: string;
  alert?: Alert;
  agent_runs?: AgentRun[];
  evidence_items?: EvidenceItem[];
  response_actions?: ResponseAction[];
  reports?: Report[];
}

export interface AgentRun {
  id: number;
  incident_id: number;
  agent_name: string;
  status: string;
  input_data?: any;
  output_data?: any;
  error_message?: string;
  started_at: string;
  finished_at?: string;
}

export interface EvidenceItem {
  id: number;
  incident_id: number;
  type: string;
  title: string;
  content?: string;
  source?: string;
  confidence?: number;
  created_at: string;
}

export interface ResponseAction {
  id: number;
  incident_id: number;
  action_type: string;
  description: string;
  risk: string;
  approval_required: boolean;
  status: string;
  approved_by?: string;
  result?: any;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  incident_id: number;
  content: string;
  format: string;
  created_at: string;
}

export interface DemoCase {
  id: string;
  title: string;
  severity: string;
  raw_content: string;
}

// WinSecAgent new types
export interface LogEvent {
  TimeCreated: string;
  EventID: number;
  Level: number;
  Channel: string;
  ProviderName?: string;
  RecordId?: number;
  Message: string;
}

export interface LogReadResult {
  events: LogEvent[];
  total_raw: number;
  total_filtered: number;
  event_id_stats: Record<number, number>;
  channel_stats: Record<string, number>;
  timestamp: string;
  is_mock: boolean;
  platform: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  score?: number;
}

export interface MemoryEntry {
  id: number;
  event_data: Record<string, any>;
  analysis_result: Record<string, any>;
  keywords?: string[];
  created_at: string;
}

export interface SchedulerStatus {
  running: boolean;
  paused: boolean;
  scan_interval: number;
  scan_count: number;
  last_scan: string | null;
  auto_threshold: number;
}

export interface SystemInfo {
  processes: any[];
  network_connections: any[];
  services: any[];
  scheduled_tasks: any[];
  registry: any[];
  is_mock: boolean;
  platform: string;
}
