import type { Core } from '@strapi/strapi';

const SUMMARY_GENERATE_ACTION = 'api::summary.summary.generate';

export async function ensureAuthenticatedSummaryPermission(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
    populate: ['permissions'],
  });

  if (!role) {
    strapi.log.warn('Authenticated role not found; summary.generate was not granted.');
    return;
  }

  const hasPermission = role.permissions?.some(
    (permission) => permission.action === SUMMARY_GENERATE_ACTION,
  );

  if (!hasPermission) {
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: {
        action: SUMMARY_GENERATE_ACTION,
        role: role.id,
      },
    });
    strapi.log.info('Granted summary.generate to the Authenticated role.');
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    const userRoutes = strapi.plugins["users-permissions"].routes["content-api"].routes;

    const isUserOwnerMiddleware = "global::user-find-many";

    const findUser = userRoutes.findIndex(
      (route) => route.handler === "user.find" && route.method === "GET"
    );

    function initializeRoute(routes, index){
      routes[index].config.middlewares = routes[index].config.middlewares || [];
      routes[index].config.policies = routes[index].config.policies || [];
    }

    if (findUser){
      initializeRoute(userRoutes, findUser);
      userRoutes[findUser].config.middlewares.push(isUserOwnerMiddleware);
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureAuthenticatedSummaryPermission(strapi);
  },
};
