import { defineConfig } from 'astro/config';

// Static output — lab convention since lab/002 (stack decision 2026-07-10, Astro pivot 2026-07-15).
// No `site`: private pitch demo, never published under the client's domain.
export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
});
