/**
 * `is-owner` middleware
 */

import type { Core } from '@strapi/strapi';

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    strapi.log.info('In is-owner middleware.');

    const entryId = ctx.params.id;
    const user = ctx.state.user;
    const userId = user?.documentId;

    if (!userId) return ctx.unauthorized("You can't access this entry");

    const apiName = ctx.state.route.info.apiName;

    function genereateUID(apiName){
      const apiUID = `api::${apiName}.${apiName}`;
      return apiUID;
    }

    const appUid = genereateUID(apiName);

    if (entryId) {
      const entry = await strapi.documents(appUid as any).findOne({
        documentId: entryId,
        populate: '*'
      })

      if (entry && entry.authorId !== userId)
        return ctx.unauthorized("You can't access this entry.");
    }

    if (!entryId) {
      ctx.query = {
        ...ctx.query,
        filters: { ...ctx.query.filters, authorId: userId }, 
      }
    }

    await next();
  };
};
