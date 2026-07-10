/**
 * summary controller
 */

import { factories } from '@strapi/strapi';
import { SummaryGenerationError } from '../services/generation-errors';

interface SummaryGenerationService {
  generateAndCreate(videoId: unknown, user: unknown): Promise<{
    documentId: string;
    summary: string;
    title: string;
    videoId: string;
  }>;
}

export default factories.createCoreController('api::summary.summary', ({ strapi }) => ({
  async generate(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You are not authenticated.');

    try {
      const service = strapi.service(
        'api::summary.summary',
      ) as unknown as SummaryGenerationService;
      const result = await service.generateAndCreate(ctx.request.body?.videoId, user);

      ctx.status = 201;
      ctx.body = {
        data: {
          documentId: result.documentId,
          summary: result.summary,
          title: result.title,
          videoId: result.videoId,
        },
        error: null,
      };
    } catch (error) {
      if (error instanceof SummaryGenerationError) {
        ctx.status = error.status;
        ctx.body = {
          data: null,
          error: { code: error.code, message: error.message },
        };
        return;
      }

      strapi.log.error('Unexpected summary generation error.', error);
      ctx.status = 500;
      ctx.body = {
        data: null,
        error: { code: 'SUMMARY_GENERATION_FAILED', message: 'Failed to generate summary.' },
      };
    }
  },
}));
