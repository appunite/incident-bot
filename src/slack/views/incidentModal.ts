/**
 * Slack modal view for incident creation
 * Uses Block Kit for UI components
 */

import { View } from '@slack/bolt';

/**
 * Creates the incident creation modal view
 */
export function createIncidentModal(): View {
  return {
    type: 'modal',
    callback_id: 'incident_modal',
    title: {
      type: 'plain_text',
      text: 'Report Incident',
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'input',
        block_id: 'title_block',
        label: {
          type: 'plain_text',
          text: 'Incident Title',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'title_input',
          placeholder: {
            type: 'plain_text',
            text: 'Brief description of the incident',
          },
          max_length: 200,
        },
      },
      {
        type: 'input',
        block_id: 'description_block',
        label: {
          type: 'plain_text',
          text: 'Description',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'description_input',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Detailed description of what happened, impact, and any relevant context',
          },
          max_length: 3000,
        },
      },
      {
        type: 'input',
        block_id: 'severity_block',
        label: {
          type: 'plain_text',
          text: 'Severity',
        },
        element: {
          type: 'static_select',
          action_id: 'severity_input',
          placeholder: {
            type: 'plain_text',
            text: 'Select severity level',
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: '🔥 Critical - Immediate, widespread impact',
              },
              value: '🔥 Critical',
            },
            {
              text: {
                type: 'plain_text',
                text: '🔥 High - Significant impact',
              },
              value: '🔥 High',
            },
            {
              text: {
                type: 'plain_text',
                text: 'ASAP - Urgent but limited scope',
              },
              value: 'ASAP',
            },
            {
              text: {
                type: 'plain_text',
                text: 'High - Important',
              },
              value: 'High',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Normal - Regular priority',
              },
              value: 'Normal',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Low - Minor issue',
              },
              value: 'Low',
            },
          ],
        },
      },
      {
        type: 'input',
        block_id: 'area_block',
        label: {
          type: 'plain_text',
          text: 'Area',
        },
        element: {
          type: 'static_select',
          action_id: 'area_input',
          placeholder: {
            type: 'plain_text',
            text: 'Select affected area',
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Client',
              },
              value: 'Client',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Internal',
              },
              value: 'Internal',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Process',
              },
              value: 'Process',
            },
            {
              text: {
                type: 'plain_text',
                text: 'People',
              },
              value: 'People',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Client Communication',
              },
              value: 'Client Communication',
            },
          ],
        },
      },
    ],
  };
}
