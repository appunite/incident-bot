/**
 * Modal submission handler for incident creation
 */

import { SlackViewMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { createModuleLogger } from '../../utils/logger';
import { createIncident } from '../../notion/createIncident';
import { IncidentFormData } from '../../types/incident';
import { slackApp } from '../client';
import { createConfirmationMessage } from '../messages/confirmationMessage';
import { updateIncidentWithSlackThread } from '../../notion/updateIncident';
import { findNotionUserByEmail } from '../../notion/findUser';

const logger = createModuleLogger('incident-submission');

/**
 * Handles incident modal submission
 */
export async function handleIncidentSubmission({
  ack,
  view,
  body,
  client,
}: SlackViewMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  try {
    logger.info('Incident submission received', {
      userId: body.user.id,
      viewId: view.id,
    });

    // Acknowledge immediately
    await ack();

    // Extract form data from modal submission
    const values = view.state.values;
    const title = values.title_block?.title_input?.value || '';
    const description = values.description_block?.description_input?.value || '';
    const severity = values.severity_block?.severity_input?.selected_option?.value as IncidentFormData['severity'];
    const area = values.area_block?.area_input?.selected_option?.value as IncidentFormData['area'];

    // Get user info
    const userInfo = await client.users.info({ user: body.user.id });
    const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
    const userEmail = userInfo.user?.profile?.email;

    // Find Notion user by email for Reporter field
    let reporterNotionId: string | undefined;
    if (userEmail) {
      reporterNotionId = await findNotionUserByEmail(userEmail);
    }

    // Parse private_metadata to check if this is from a message action
    let messageActionContext: {
      sourceChannelId?: string;
      sourceMessageTs?: string;
      sourceThreadTs?: string;
    } = {};

    try {
      if (view.private_metadata) {
        messageActionContext = JSON.parse(view.private_metadata);
      }
    } catch (error) {
      // If parsing fails, treat it as a regular command (not from message action)
      logger.warn('Failed to parse private_metadata', { error });
    }

    // Determine channel ID - use source channel from message action if available
    const channelId = messageActionContext.sourceChannelId || view.private_metadata || body.user.id;
    const isFromMessageAction = !!messageActionContext.sourceChannelId;

    logger.info('Form data extracted', {
      title,
      severity,
      area,
      userName,
      userEmail,
      reporterNotionId,
      isFromMessageAction,
      sourceChannel: messageActionContext.sourceChannelId,
    });

    // Prepare incident data
    const incidentData: IncidentFormData = {
      title,
      description,
      severity,
      area,
      createdBy: body.user.id,
      createdByName: userName,
      slackChannelId: channelId,
      slackChannelName: 'DM',
      reporterNotionId,
    };

    // Create incident in Notion
    logger.info('Creating incident in Notion');
    const notionResult = await createIncident(incidentData);

    // Post confirmation message to Slack
    logger.info('Posting confirmation to Slack', {
      channelId,
      isFromMessageAction,
    });

    const confirmationMsg = createConfirmationMessage({
      incidentData,
      notionPageUrl: notionResult.url,
      notionPageId: notionResult.id,
    });

    let slackMessage;

    if (isFromMessageAction) {
      // Option B: Post public reply in thread + ephemeral DM to user

      // Post public reply in the original message's thread
      slackMessage = await slackApp.client.chat.postMessage({
        channel: channelId,
        thread_ts: messageActionContext.sourceThreadTs, // Reply in thread
        ...confirmationMsg,
      });

      logger.info('Posted public thread reply', {
        channel: channelId,
        threadTs: messageActionContext.sourceThreadTs,
        messageTs: slackMessage.ts,
      });

      // Also send ephemeral message to the user
      await slackApp.client.chat.postEphemeral({
        channel: channelId,
        user: body.user.id,
        text: `✅ Incident reported successfully! View in Notion: ${notionResult.url}`,
      });

      logger.info('Posted ephemeral confirmation to user', {
        userId: body.user.id,
      });
    } else {
      // Regular behavior: post to channel/DM
      slackMessage = await slackApp.client.chat.postMessage({
        channel: channelId,
        ...confirmationMsg,
      });
    }

    // Update Notion with Slack thread URL
    if (slackMessage.ts && slackMessage.channel) {
      // Build Slack thread URL - use generic format since team:read scope may not be available
      // Users can click the link and Slack will redirect to the correct workspace
      const slackThreadUrl = `https://slack.com/app_redirect?channel=${slackMessage.channel}&message_ts=${slackMessage.ts}`;

      await updateIncidentWithSlackThread({
        notionPageId: notionResult.id,
        slackThreadUrl,
        slackMessageTs: slackMessage.ts,
        slackChannelId: slackMessage.channel,
      });
    }

    logger.info('Incident created successfully', {
      notionPageId: notionResult.id,
      slackMessageTs: slackMessage.ts,
      isFromMessageAction,
    });

  } catch (error) {
    logger.error('Failed to create incident', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Try to notify user about the error
    try {
      await client.chat.postMessage({
        channel: body.user.id,
        text: `Sorry, there was an error creating the incident: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } catch (notifyError) {
      logger.error('Failed to notify user about error', notifyError);
    }
  }
}
