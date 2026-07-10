export type SummaryGenerationErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'AI_REQUEST_FAILED'
  | 'INSUFFICIENT_CREDITS'
  | 'INVALID_VIDEO_ID'
  | 'TRANSCRIPT_NOT_CONFIGURED'
  | 'TRANSCRIPT_NOT_FOUND'
  | 'TRANSCRIPT_REQUEST_FAILED'
  | 'TRANSCRIPT_TOO_LARGE';

export class SummaryGenerationError extends Error {
  constructor(
    public readonly code: SummaryGenerationErrorCode,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SummaryGenerationError';
  }
}
