import type { Core } from '@strapi/strapi';

const config: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/summaries/generate',
      handler: 'api::summary.summary.generate',
    },
  ],
};

export default config;
