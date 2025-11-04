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
import { updateNotionPageWithSlackInfo } from '../../notion/updateSlackInfo';

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

    await ack();

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

    const userInfo = await client.users.info({ user: body.user.id });
    const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
    const userEmail = userInfo.user?.profile?.email;

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
      logger.warn('Failed to parse private_metadata', { error });
    }

    const isFromMessageAction = !!messageActionContext.sourceChannelId;
    const sourceIsChannel = messageActionContext.sourceChannelId?.startsWith('C') || false;

    const channelId: string = sourceIsChannel && messageActionContext.sourceChannelId
      ? messageActionContext.sourceChannelId
      : body.user.id;

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
          30
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
        logger.warn('Failed to fetch thread messages', { error });
      }
    }

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

    logger.info('Creating incident in Notion');
    const notionResult = await createIncident(incidentData, threadMessages);

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

    if (isFromMessageAction && sourceIsChannel) {
      slackMessage = await slackApp.client.chat.postMessage({
        channel: channelId,
        thread_ts: messageActionContext.sourceThreadTs,
        ...confirmationMsg,
      });

      logger.info('Posted public thread reply in channel', {
        channel: channelId,
        threadTs: messageActionContext.sourceThreadTs,
        messageTs: slackMessage.ts,
      });

      await slackApp.client.chat.postEphemeral({
        channel: channelId,
        user: body.user.id,
        text: `✅ Incident reported successfully! View in Notion: ${notionResult.url}`,
      });

      logger.info('Posted ephemeral confirmation to user', {
        userId: body.user.id,
      });
    } else {
      slackMessage = await slackApp.client.chat.postMessage({
        channel: channelId,
        ...confirmationMsg,
      });

      logger.info('Posted confirmation to user DM', {
        userId: body.user.id,
        messageTs: slackMessage.ts,
      });
    }

    await updateNotionPageWithSlackInfo(notionResult.id, {
      channelId,
      messageTs: slackMessage.ts!,
    });

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
