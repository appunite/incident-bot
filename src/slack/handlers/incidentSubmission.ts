/**
 * Modal submission handler for incident creation
 */

import { SlackViewMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { createModuleLogger } from '../../utils/logger';
import { createIncident } from '../../notion/createIncident';
import { IncidentFormData, ThreadMessage } from '../../types/incident';
import { slackApp } from '../client';
import { createConfirmationMessage } from '../messages/confirmationMessage';
import { fetchThreadMessages } from '../fetchThreadMessages';
import { findNotionUserByEmail, findNotionUserByName } from '../../notion/findUser';

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
    const happenedDate = values.happened_date_block?.happened_date_input?.selected_date || undefined;
    const discoverDate = values.discover_date_block?.discover_date_input?.selected_date || undefined;
    const dueDate = values.due_date_block?.due_date_input?.selected_date || undefined;
    const whyItMatters = values.why_it_matters_block?.why_it_matters_input?.value || undefined;
    const teamIds = values.team_block?.team_input?.selected_options?.map((opt: any) => opt.value) || undefined;

    // Get user info
    const userInfo = await client.users.info({ user: body.user.id });
    const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
    const userEmail = userInfo.user?.profile?.email;

    // Find reporter in Notion (Railway has no timeout limits)
    let reporterNotionId: string | undefined;

    if (userEmail) {
      logger.info('Looking up Notion user by email', { userEmail });
      reporterNotionId = await findNotionUserByEmail(userEmail);
    }

    if (!reporterNotionId && userName) {
      logger.info('Email lookup failed, trying by name', { userName });
      reporterNotionId = await findNotionUserByName(userName);
    }

    if (reporterNotionId) {
      logger.info('Found reporter in Notion', {
        reporterNotionId,
        userId: body.user.id,
        userName,
      });
    } else {
      logger.warn('Could not find reporter in Notion', {
        userId: body.user.id,
        userName,
        userEmail,
      });
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

    // Fetch thread messages if available
    let threadMessages: ThreadMessage[] | undefined;

    if (messageActionContext.sourceChannelId && messageActionContext.sourceThreadTs) {
      logger.info('Attempting to fetch thread messages', {
        sourceChannelId: messageActionContext.sourceChannelId,
        sourceThreadTs: messageActionContext.sourceThreadTs,
      });

      try {
        const threadResult = await fetchThreadMessages(
          client,
          messageActionContext.sourceChannelId,
          messageActionContext.sourceThreadTs,
          30  // Railway has no timeout limits, can fetch full thread context
        );

        if (threadResult && threadResult.messages.length > 0) {
          threadMessages = threadResult.messages;
          logger.info('Thread messages fetched successfully', {
            messageCount: threadResult.messages.length,
            hasMore: threadResult.hasMore,
          });
        } else {
          logger.info('No thread messages to fetch (only parent message)');
        }
      } catch (error) {
        logger.warn('Failed to fetch thread messages, proceeding without thread context', {
          error,
        });
        // Continue with incident creation even if thread fetch fails
      }
    }

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
      happenedDate,
      discoverDate,
      dueDate,
      whyItMatters,
      teamIds,
    };

    // Create incident in Notion (includes thread messages to reduce API calls)
    logger.info('Creating incident in Notion');
    const notionResult = await createIncident(incidentData, threadMessages);

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

    // Skip Slack URL update to reduce Notion API calls (Slack link not critical)
    // Thread messages are already included in page creation
    // This reduces from 4 → 2 Notion API requests per incident

    logger.info('Incident created successfully', {
      notionPageId: notionResult.id,
      slackMessageTs: slackMessage.ts,
      isFromMessageAction,
      hasThreadMessages: !!threadMessages && threadMessages.length > 0,
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
