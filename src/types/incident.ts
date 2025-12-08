/**
 * Type definitions for Incident Bot
 */

export type IncidentSeverity = 'ASAP' | 'High' | 'Normal' | 'Low';

export type IncidentStatus = 'Open' | 'In Progress' | 'Ready for Review' | 'Resolved' | 'Invalid';

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
  reporterNotionId?: string; // Notion user ID for Reporter field
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  happenedDate?: string; // ISO date string (YYYY-MM-DD)
  discoverDate?: string; // ISO date string (YYYY-MM-DD)
  whyItMatters?: string; // Why this incident matters (stored in page body)
  teamIds?: string[]; // Array of Notion page IDs for Team relation
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

export interface ThreadMessage {
  user: string;           // Slack user ID (e.g., "U1234567890")
  userName: string;       // Display name (e.g., "John Doe")
  text: string;          // Message text content
  timestamp: string;     // Raw Slack timestamp (e.g., "1234567890.123456")
  formattedTime: string; // Human-readable time (e.g., "2:30 PM")
}

export interface UnassignedIncident {
  id: string;
  url: string;
  title: string;
  severity: IncidentSeverity;
  status: 'Open' | 'In Progress';
  area: IncidentArea;
  detectedDate: string;
  daysSinceCreation: number;
  teamIds?: string[];
}
