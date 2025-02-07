export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  settings: {
    cors: {
      origin: ['http://localhost:3000', 'https://backend-wispy-fire-4184.fly.dev', 'https://video-summary-ai-nine.vercel.app'], // Replace with your Next.js app's URL
      credentials: true,
    },
  },
});
