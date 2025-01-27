/**
 * `user-find-many` middleware
 */

import type { Core } from '@strapi/strapi';

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    strapi.log.info('In user-find-many middleware.');

    const currentUserId = ctx.state.user?.id;

    if(!currentUserId) {
      strapi.log.error("Your are not authenticated.");
      return ctx.badRequest("You are not authenticated.");
    }

    ctx.query = {
      ...ctx.query,
      filters: { ...ctx.query.filters, id: currentUserId },
    }

    await next();
  };
};
