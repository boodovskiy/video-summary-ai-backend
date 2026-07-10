import { SummaryGenerationError } from './generation-errors';

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_CHARS = 160_000;

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function validateVideoId(videoId: unknown): string {
  if (typeof videoId !== 'string' || !YOUTUBE_VIDEO_ID.test(videoId)) {
    throw new SummaryGenerationError(
      'INVALID_VIDEO_ID',
      400,
      'A valid YouTube video ID is required.',
    );
  }

  return videoId;
}

export function buildTranscriptUrl(baseUrl: string, videoId: string): URL {
  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new SummaryGenerationError(
      'TRANSCRIPT_NOT_CONFIGURED',
      503,
      'The transcript service is not configured.',
    );
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new SummaryGenerationError(
      'TRANSCRIPT_NOT_CONFIGURED',
      503,
      'The transcript service is not configured.',
    );
  }

  url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(videoId)}`;
  return url;
}

export async function fetchTranscript(videoId: string): Promise<string> {
  const transcriptApiUrl = process.env.TRANSCRIPT_API_URL;
  if (!transcriptApiUrl) {
    throw new SummaryGenerationError(
      'TRANSCRIPT_NOT_CONFIGURED',
      503,
      'The transcript service is not configured.',
    );
  }

  const timeoutMs = readPositiveInteger(
    process.env.TRANSCRIPT_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const maxChars = readPositiveInteger(
    process.env.TRANSCRIPT_MAX_CHARS,
    DEFAULT_MAX_CHARS,
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildTranscriptUrl(transcriptApiUrl, videoId), {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new SummaryGenerationError(
        response.status === 404 ? 'TRANSCRIPT_NOT_FOUND' : 'TRANSCRIPT_REQUEST_FAILED',
        response.status === 404 ? 422 : 502,
        response.status === 404
          ? 'No transcript is available for this video.'
          : 'The transcript service is unavailable.',
      );
    }

    const transcript = (await response.text()).trim();
    if (!transcript) {
      throw new SummaryGenerationError(
        'TRANSCRIPT_NOT_FOUND',
        422,
        'No transcript is available for this video.',
      );
    }

    if (transcript.length > maxChars) {
      throw new SummaryGenerationError(
        'TRANSCRIPT_TOO_LARGE',
        422,
        'The video transcript is too long to summarize.',
      );
    }

    return transcript;
  } catch (error) {
    if (error instanceof SummaryGenerationError) throw error;

    throw new SummaryGenerationError(
      'TRANSCRIPT_REQUEST_FAILED',
      502,
      'The transcript service is unavailable.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
