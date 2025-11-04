/**
 * Vercel Cron function to keep serverless functions warm
 * Prevents cold starts by pinging every 5 minutes
 */

export default async function handler(
  _req: any,
  res: any
) {
  try {
    // Simple health check to keep function warm
    // This prevents cold starts by ensuring function stays loaded in memory

    const timestamp = new Date().toISOString();

    console.log('[Cron] Warming function', { timestamp });

    res.status(200).json({
      success: true,
      message: 'Function warmed',
      timestamp,
    });
  } catch (error) {
    console.error('[Cron] Error warming function', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
