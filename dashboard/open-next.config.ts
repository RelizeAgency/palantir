import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override for MVP — the app is fully dynamic
// (session/DB-driven), so there's nothing worth caching yet. Add the R2
// incremental cache later if `use cache` / ISR gets introduced.
export default defineCloudflareConfig();
