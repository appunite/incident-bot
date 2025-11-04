/**
 * Slack modal view for incident creation
 * Uses Block Kit for UI components
 */

import { View } from '@slack/bolt';
import { Team } from '../../notion/getTeams';

interface IncidentModalOptions {
  initialTitle?: string;
  initialDescription?: string;
  privateMetadata?: string;
  teams?: Team[];
}

/**
 * Creates the incident creation modal view
 * @param options - Optional configuration for the modal
 * @param options.initialTitle - Optional initial value for the title field
 * @param options.initialDescription - Optional initial value for the description field
 * @param options.privateMetadata - Optional metadata to pass through the modal
 * @param options.teams - Optional teams list for team selector
 */
export function createIncidentModal(options?: IncidentModalOptions): View {
  const titleElement: any = {
    type: 'plain_text_input',
    action_id: 'title_input',
    placeholder: {
      type: 'plain_text',
      text: 'Brief description of the incident',
    },
    max_length: 200,
  };

  // Add initial_value if provided
  if (options?.initialTitle) {
    titleElement.initial_value = options.initialTitle;
  }

  const descriptionElement: any = {
    type: 'plain_text_input',
    action_id: 'description_input',
    multiline: true,
    placeholder: {
      type: 'plain_text',
      text: 'Detailed description of what happened, impact, and any relevant context',
    },
    max_length: 3000,
  };

  // Add initial_value if provided
  if (options?.initialDescription) {
    descriptionElement.initial_value = options.initialDescription;
  }

  return {
    type: 'modal',
    callback_id: 'incident_modal',
    private_metadata: options?.privateMetadata || '',
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
        element: titleElement,
      },
      {
        type: 'input',
        block_id: 'description_block',
        label: {
          type: 'plain_text',
          text: 'Description',
        },
        element: descriptionElement,
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 _You can edit or complete this description in Notion after submission_',
          },
        ],
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
                text: 'ASAP - Urgent but limited scope',
              },
              value: 'ASAP',
            },
            {
              text: {
                type: 'plain_text',
                text: 'High - Important but not blocking',
              },
              value: 'High',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Normal - Regular priority issue',
              },
              value: 'Normal',
            },
            {
              text: {
                type: 'plain_text',
                text: 'Low - Minor issue, low urgency',
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
      {
        type: 'input',
        block_id: 'happened_date_block',
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Happened Date',
        },
        element: {
          type: 'datepicker',
          action_id: 'happened_date_input',
          placeholder: {
            type: 'plain_text',
            text: 'When did this incident occur?',
          },
        },
      },
      {
        type: 'input',
        block_id: 'discover_date_block',
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Discover Date',
        },
        element: {
          type: 'datepicker',
          action_id: 'discover_date_input',
          initial_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
          placeholder: {
            type: 'plain_text',
            text: 'When was this incident discovered?',
          },
        },
      },
      {
        type: 'input',
        block_id: 'due_date_block',
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Due Date',
        },
        element: {
          type: 'datepicker',
          action_id: 'due_date_input',
          placeholder: {
            type: 'plain_text',
            text: 'When should this be resolved by?',
          },
        },
      },
      {
        type: 'input',
        block_id: 'why_it_matters_block',
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Why It Matters',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'why_it_matters_input',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Explain why this incident is important and what impact it has',
          },
          max_length: 1000,
        },
      },
    ].concat(
      // Add team selector if teams are available
      (options?.teams && options.teams.length > 0
        ? [
            {
              type: 'input' as const,
              block_id: 'team_block',
              optional: true,
              label: {
                type: 'plain_text' as const,
                text: 'Team',
              },
              element: {
                type: 'multi_static_select' as const,
                action_id: 'team_input',
                placeholder: {
                  type: 'plain_text' as const,
                  text: 'Select teams',
                },
                options: options.teams.map((team) => ({
                  text: {
                    type: 'plain_text' as const,
                    text: team.name,
                  },
                  value: team.id,
                })),
              },
            },
          ]
        : []) as any
    ),
  };
}
