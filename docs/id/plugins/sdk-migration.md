---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur lama ke plugin SDK modern
title: Migrasi Plugin SDK
x-i18n:
    generated_at: "2026-04-05T14:02:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c420b8d7de17aee16c5aa67e3a88da5750f0d84b07dd541f061081080e081196
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrasi Plugin SDK

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin
modern dengan import yang terfokus dan terdokumentasi. Jika plugin Anda dibangun sebelum
arsitektur baru ini, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor
apa pun yang mereka butuhkan dari satu entry point:

- **`openclaw/plugin-sdk/compat`** — satu import yang me-re-export puluhan
  helper. Ini diperkenalkan untuk menjaga plugin berbasis hook yang lebih lama tetap berfungsi saat
  arsitektur plugin baru sedang dibangun.
- **`openclaw/extension-api`** — bridge yang memberi plugin akses langsung ke
  helper sisi host seperti embedded agent runner.

Kedua permukaan ini sekarang **deprecated**. Keduanya masih berfungsi saat runtime, tetapi plugin
baru tidak boleh menggunakannya, dan plugin yang sudah ada harus bermigrasi sebelum rilis mayor berikutnya menghapusnya.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus pada rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Circular dependency** — re-export yang luas memudahkan terbentuknya siklus import
- **Permukaan API tidak jelas** — tidak ada cara untuk membedakan ekspor yang stabil vs internal

Plugin SDK modern memperbaiki ini: setiap jalur import (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil yang berdiri sendiri dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam kemudahan provider lama untuk channel bawaan juga sudah dihapus. Import
seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper bermerek channel, dan
`openclaw/plugin-sdk/telegram-core` adalah pintasan mono-repo privat, bukan
kontrak plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam
workspace plugin bawaan, simpan helper milik provider di `api.ts` atau
`runtime-api.ts` milik plugin itu sendiri.

Contoh provider bawaan saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper default-model, dan builder provider
  realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di
  `api.ts` miliknya sendiri

## Cara bermigrasi

<Steps>
  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak dapat di-resolve sekarang gagal tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Sebelum
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sesudah
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Setel ini hanya untuk pemanggil kompatibilitas tepercaya yang memang
      // menerima fallback yang dimediasi shell.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak benar-benar bergantung pada shell fallback, jangan setel
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan import yang deprecated">
    Cari dalam plugin Anda import dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan import yang terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke jalur import modern tertentu:

    ```typescript
    // Sebelum (lapisan kompatibilitas mundur deprecated)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sesudah (import modern yang terfokus)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Sebelum (bridge extension-api deprecated)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sesudah (runtime yang diinjeksi)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper bridge lama lainnya:

    | Import lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur import

<Accordion title="Tabel jalur import umum">
  | Jalur import | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Re-export payung lama untuk definisi/builder entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri channel yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime saat setup | Adapter patch setup yang aman diimpor, helper lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup yang didelegasikan |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar akun/config/action-gate |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper lookup akun | Helper lookup akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun yang sempit | Helper daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefix balasan + wiring typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder skema config | Tipe skema config channel |
  | `plugin-sdk/telegram-command-config` | Helper config perintah Telegram | Normalisasi nama perintah, trimming deskripsi, validasi duplikasi/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Pelacakan status akun | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper envelope inbound | Helper route + builder envelope bersama |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan inbound | Helper record-and-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Pemuatan media outbound bersama |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper delegasi identitas/pengiriman outbound |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Siklus hidup thread-binding dan helper adapter |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Builder payload media agen untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime yang luas | Helper runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Helper env runtime yang sempit | Logger/runtime env, timeout, retry, dan helper backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime plugin bersama | Helper plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline webhook/internal hook bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formatting perintah, waits, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper gateway | Klien gateway dan helper patch channel-status |
  | `plugin-sdk/config-runtime` | Helper config | Helper load/write config |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil dalam fallback saat permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Payload approval exec/plugin, helper capability/profile approval, helper routing/runtime approval native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Resolusi approver, auth tindakan same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper klien approval | Helper profil/filter approval exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman approval | Adapter capability/pengiriman approval native |
  | `plugin-sdk/approval-native-runtime` | Helper target approval | Helper target approval native/binding akun |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan approval | Helper payload balasan approval exec/plugin |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, gating DM, konten eksternal, dan pengumpulan rahasia bersama |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Host allowlist dan helper kebijakan private-network |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper pinned-dispatcher, guarded fetch, kebijakan SSRF |
  | `plugin-sdk/collection-runtime` | Helper cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper formatting error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper wrapped fetch/proxy | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Formatting allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Helper input rahasia |
  | `plugin-sdk/webhook-ingress` | Helper permintaan webhook | Utilitas target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Inbound dispatch, heartbeat, planner balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan yang sempit | Helper finalisasi + dispatch provider |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper session store | Helper jalur store + updated-at |
  | `plugin-sdk/state-paths` | Helper jalur state | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status channel | Builder ringkasan status channel/akun, default state runtime, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper target resolver | Helper target resolver bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Mengekstrak URL string dari input mirip request |
  | `plugin-sdk/run-command` | Helper perintah bertimer | Runner perintah bertimer dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca parameter | Pembaca parameter tool/CLI umum |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Mengekstrak field target pengiriman kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper jalur sementara | Helper jalur temp-download bersama |
  | `plugin-sdk/logging-core` | Helper logging | Logger subsistem dan helper redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel markdown | Helper mode tabel markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang dikurasi | Helper discovery/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus | Helper discovery/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API-key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API-key provider | Helper onboarding/penulisan profil API-key |
  | `plugin-sdk/provider-auth-result` | Helper auth-result provider | Builder auth-result OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-env-vars` | Helper env-var provider | Helper lookup env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper config onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP provider | Helper kemampuan HTTP/endpoint provider generik |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper registrasi/cache provider web-fetch |
  | `plugin-sdk/provider-web-search` | Helper web-search provider | Helper registrasi/cache/config provider web-search |
  | `plugin-sdk/provider-tools` | Helper kompat tool/skema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompat xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
  | `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Antrean async terurut | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media ditambah builder payload media |
  | `plugin-sdk/media-understanding` | Helper media-understanding | Tipe provider media understanding ditambah ekspor helper image/audio untuk sisi provider |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat oleh asisten, helper render/chunking/table markdown, helper redaksi, helper tag directive, utilitas safe-text, dan helper teks/logging terkait |
  | `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks outbound |
  | `plugin-sdk/speech` | Helper speech | Tipe provider speech ditambah helper directive, registry, dan validasi untuk sisi provider |
  | `plugin-sdk/speech-core` | Inti speech bersama | Tipe provider speech, registry, directives, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper transcription realtime | Tipe provider dan helper registry |
  | `plugin-sdk/realtime-voice` | Helper voice realtime | Tipe provider dan helper registry |
  | `plugin-sdk/image-generation-core` | Inti image-generation bersama | Helper tipe, failover, auth, dan registry image-generation |
  | `plugin-sdk/video-generation` | Helper video-generation | Tipe provider/permintaan/hasil video-generation |
  | `plugin-sdk/video-generation-core` | Inti video-generation bersama | Tipe video-generation, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitive config channel | Primitive channel config-schema yang sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan config channel | Helper otorisasi penulisan config channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude plugin channel bersama |
  | `plugin-sdk/channel-status` | Helper status channel | Helper snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper config allowlist | Helper edit/baca config allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Helper DM langsung | Helper auth/guard DM langsung bersama |
  | `plugin-sdk/extension-shared` | Helper extension bersama | Primitive helper passive-channel/status |
  | `plugin-sdk/webhook-targets` | Helper target webhook | Registry target webhook dan helper route-install |
  | `plugin-sdk/webhook-path` | Helper jalur webhook | Helper normalisasi jalur webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Re-export Zod | `zod` yang di-re-export untuk konsumen plugin SDK |
  | `plugin-sdk/memory-core` | Helper memory-core bawaan | Permukaan helper memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime engine memori | Fasad runtime index/search memori |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine foundation host memori | Ekspor engine foundation host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host memori | Ekspor engine embedding host memori |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host memori | Ekspor engine QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine storage host memori | Ekspor engine storage host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori | Helper multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Helper kueri host memori | Helper kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori | Helper rahasia host memori |
  | `plugin-sdk/memory-core-host-status` | Helper status host memori | Helper status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Helper runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Helper runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori | Helper file/runtime host memori |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb bawaan | Permukaan helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitas pengujian | Helper dan mock pengujian |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan SDK.
Daftar lengkap 200+ entrypoint ada di
`scripts/lib/plugin-sdk-entrypoints.json`.

Daftar itu masih mencakup beberapa seam helper bundled-plugin seperti
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Semua itu tetap diekspor untuk
pemeliharaan bundled-plugin dan kompatibilitas, tetapi sengaja
dihilangkan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk
kode plugin baru.

Aturan yang sama berlaku untuk keluarga helper bawaan lainnya seperti:

- helper dukungan browser: `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- permukaan helper/plugin bawaan seperti `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini mengekspos permukaan helper token yang sempit
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan import tersempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan suatu ekspor,
periksa source di `src/plugin-sdk/` atau tanyakan di Discord.

## Jadwal penghapusan

| Kapan                  | Yang terjadi                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**           | Permukaan deprecated mengeluarkan peringatan runtime                    |
| **Rilis mayor berikutnya** | Permukaan deprecated akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin inti sudah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya.

## Menyembunyikan peringatan untuk sementara

Setel variabel lingkungan ini saat Anda sedang mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Getting Started](/plugins/building-plugins) — bangun plugin pertama Anda
- [SDK Overview](/plugins/sdk-overview) — referensi import subpath lengkap
- [Channel Plugins](/plugins/sdk-channel-plugins) — membangun plugin channel
- [Provider Plugins](/plugins/sdk-provider-plugins) — membangun plugin provider
- [Plugin Internals](/plugins/architecture) — pendalaman arsitektur
- [Plugin Manifest](/plugins/manifest) — referensi skema manifest
