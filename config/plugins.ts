export default ({ env }) => ({
    'users-permissions': {
      config: {
        jwtSecret: env('JWT_SECRET', 'hNJ8bI8h/4k07rHEzTUPUQ=='),
      },
    },
  });
  