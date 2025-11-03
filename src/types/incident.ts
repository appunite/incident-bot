/**
 * Type definitions for Incident Bot
 */

export type IncidentSeverity = '🔥 Critical' | '🔥 High' | 'ASAP' | 'Normal' | 'Low' | 'High';

export type IncidentStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type IncidentArea = 'Client' | 'Internal' | 'Process' | 'People' | 'Client Communication';

export type CreatedFrom = 'Manual' | 'Automatic' | 'Email' | 'API' | 'Phone';

export interface IncidentFormData {
  title: string;
  description: string;
  severity: IncidentSeverity;
  area: IncidentArea;
  createdBy: string; // Slack user ID
  createdByName: string; // Slack user display name
  slackChannelId: string;
  slackChannelName: string;
}

export interface NotionIncidentProperties {
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  area: IncidentArea;
  createdBy: string;
  createdFrom: CreatedFrom;
  createdAt: string; // ISO date
  slackThreadUrl?: string;
  slackChannelId?: string;
  slackMessageTs?: string;
  owner?: string; // Notion person ID
  accountable?: string; // Notion person ID
}

export interface NotionIncident {
  id: string;
  url: string;
  properties: NotionIncidentProperties;
  lastEditedTime: string;
}

export interface IncidentChange {
  incidentId: string;
  incidentTitle: string;
  changes: {
    field: 'status' | 'owner' | 'accountable';
    oldValue: string | null;
    newValue: string | null;
  }[];
  slackChannelId?: string;
  slackMessageTs?: string;
}
