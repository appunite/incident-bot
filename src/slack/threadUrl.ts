/**
 * Slack thread URL builder
 */

/**
 * Constructs a Slack thread URL from a channel ID and message timestamp.
 * Falls back to the `app.slack.com` host, which resolves for any workspace,
 * so no `team:read` scope is needed to look up the workspace domain.
 * @param channelId Slack channel ID
 * @param messageTs Slack message timestamp
 * @param workspaceDomain Optional workspace domain, when already known
 */
export function buildSlackThreadUrl(
  channelId: string,
  messageTs: string,
  workspaceDomain?: string
): string {
  const tsWithoutDot = messageTs.replace('.', '');
  const domain = workspaceDomain || 'app';
  return `https://${domain}.slack.com/archives/${channelId}/p${tsWithoutDot}`;
}
