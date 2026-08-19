/**
 * Slack mention helpers
 */

/**
 * Formats a Slack user group (subteam) mention that notifies its members.
 * @param groupId Slack user group ID, e.g. S0123ABCDEF
 * @returns Mention string, or undefined when no group is configured
 */
export function formatUserGroupMention(groupId?: string): string | undefined {
  if (!groupId) {
    return undefined;
  }

  return `<!subteam^${groupId}>`;
}
