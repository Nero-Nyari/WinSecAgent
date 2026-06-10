import { create } from 'zustand';
import type { Alert, Incident, AgentRun, EvidenceItem, ResponseAction, Report } from '../types';

interface AppState {
  alerts: Alert[];
  incidents: Incident[];
  selectedIncidentId: number | null;
  selectedIncident: Incident | null;
  agentRuns: AgentRun[];
  evidence: EvidenceItem[];
  actions: ResponseAction[];
  report: Report | null;
  loading: boolean;
  refreshAlerts: () => Promise<void>;
  refreshIncidents: () => Promise<void>;
  selectIncident: (id: number) => Promise<void>;
  runAnalysis: (incidentId: number) => Promise<void>;
  refreshIncidentDetail: () => Promise<void>;
}

import { api } from '../services/api';

export const useAppStore = create<AppState>((set, get) => ({
  alerts: [],
  incidents: [],
  selectedIncidentId: null,
  selectedIncident: null,
  agentRuns: [],
  evidence: [],
  actions: [],
  report: null,
  loading: false,

  refreshAlerts: async () => {
    const alerts = await api.alerts.list();
    set({ alerts });
  },

  refreshIncidents: async () => {
    const incidents = await api.incidents.list();
    set({ incidents });
  },

  selectIncident: async (id: number) => {
    set({ selectedIncidentId: id, loading: true });
    try {
      const incident = await api.incidents.get(id);
      set({
        selectedIncident: incident,
        agentRuns: incident.agent_runs || [],
        evidence: incident.evidence_items || [],
        actions: incident.response_actions || [],
        report: incident.reports?.[0] || null,
      });
    } finally {
      set({ loading: false });
    }
  },

  runAnalysis: async (incidentId: number) => {
    set({ loading: true });
    try {
      await api.incidents.analyze(incidentId);
      await get().selectIncident(incidentId);
      await get().refreshIncidents();
    } finally {
      set({ loading: false });
    }
  },

  refreshIncidentDetail: async () => {
    const id = get().selectedIncidentId;
    if (id) await get().selectIncident(id);
  },
}));
