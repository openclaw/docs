---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-05T14:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ikhtisar Plugin SDK

Plugin SDK adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  **Mencari panduan cara melakukannya?**
  - Plugin pertama? Mulailah dengan [Getting Started](/plugins/building-plugins)
  - Plugin channel? Lihat [Channel Plugins](/plugins/sdk-channel-plugins)
  - Plugin provider? Lihat [Provider Plugins](/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entri/build yang spesifik channel,
utamakan `openclaw/plugin-sdk/channel-core`; simpan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan tambahkan atau bergantung pada seam praktis bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Plugin bawaan harus menyusun subpath SDK
generik di dalam barrel `api.ts` atau `runtime-api.ts` milik mereka sendiri, dan core
harus menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik
yang sempit ketika kebutuhannya benar-benar lintas channel.

Peta ekspor yang dihasilkan masih berisi sekumpulan kecil seam helper
plugin bawaan seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath tersebut
hanya ada untuk pemeliharaan dan kompatibilitas plugin bawaan; subpath itu
sengaja dihilangkan dari tabel umum di bawah ini dan bukan jalur impor
yang direkomendasikan untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
200+ subpath yang dihasilkan ada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper plugin bawaan yang dicadangkan masih muncul dalam daftar yang dihasilkan itu.
Perlakukan itu sebagai detail implementasi/permukaan kompatibilitas kecuali halaman dokumen
secara eksplisit mempromosikannya sebagai publik.

### Entri plugin

| Subpath                     | Ekspor utama                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper config/action-gate multi-akun, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar-aksi akun/akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema konfigurasi channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom command Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper rute masuk + pembuat envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper record-and-dispatch masuk bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media keluar bersama |
    | `plugin-sdk/outbound-runtime` | Helper identitas/delegasi kirim keluar |
    | `plugin-sdk/thread-bindings-runtime` | Lifecycle thread-binding dan helper adapter |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Binding percakapan/thread, pairing, dan helper binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitive sempit skema konfigurasi channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper keputusan group-access bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard DM langsung bersama |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/reduksi payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Debounce, pencocokan mention, helper envelope |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Pengkabelan feedback/reaksi |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API-key runtime untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API-key |
    | `plugin-sdk/provider-auth-result` | Pembuat hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper lookup env-var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan endpoint/HTTP provider generik |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache provider web-fetch |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/konfigurasi provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah, helper otorisasi pengirim |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi approver dan same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/command-auth-native` | Auth perintah native + helper session-target native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Helper trust, DM gating, external-content, dan pengumpulan secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper host allowlist dan kebijakan SSRF jaringan private |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch yang dijaga SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/install-plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper perintah/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper formatting, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien gateway dan patch channel-status |
    | `plugin-sdk/config-runtime` | Helper muat/tulis konfigurasi |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder kemampuan persetujuan, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime masuk/balasan bersama, chunking, dispatch, heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan yang sempit |
    | `plugin-sdk/reply-history` | Helper reply-history jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path session store + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper rute/kunci sesi/account binding seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper target resolver bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-send` | Ekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsystem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP |
    | `plugin-sdk/agent-config-primitives` | Primitive sempit skema konfigurasi runtime agen |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper channel pasif dan status bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah skill |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialize perintah native |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper event/heartbeat sistem |
    | `plugin-sdk/collection-runtime` | Helper cache berbatas kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Helper grafik error, formatting, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan pinned lookup |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan retry runner |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Query/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper fetch/transform/store media bersama plus builder payload media |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media plus ekspor helper gambar/audio yang menghadap provider |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan assistant-visible-text, helper render/chunking/table markdown, helper redaksi, helper directive-tag, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks keluar |
    | `plugin-sdk/speech` | Tipe provider speech plus helper directive, registri, dan validasi yang menghadap provider |
    | `plugin-sdk/speech-core` | Tipe provider speech bersama, registri, directive, dan helper normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi realtime dan helper registri |
    | `plugin-sdk/realtime-voice` | Tipe provider suara realtime dan helper registri |
    | `plugin-sdk/image-generation` | Tipe provider pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, failover, auth, dan helper registri |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registri target webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media remote/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime index/search memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine foundation host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Ekspor engine embedding host memori |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper query host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksud |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Helper auth/plugin-spesifik | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                 |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)             |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal      |
| `api.registerChannel(...)`                       | Channel perpesanan               |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks      |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video      |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                 |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                  |
| `api.registerWebFetchProvider(...)`              | Penyedia web fetch / scrape      |
| `api.registerWebSearchProvider(...)`             | Pencarian web                    |

### Tool dan perintah

| Metode                          | Yang didaftarkan                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agen (wajib atau `{ optional: true }`)   |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                |

### Infrastruktur

| Metode                                         | Yang didaftarkan      |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway    |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI       |
| `api.registerService(service)`                 | Layanan latar belakang |
| `api.registerInteractiveHandler(registration)` | Handler interaktif    |

Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, bahkan jika plugin mencoba menetapkan
cakupan metode gateway yang lebih sempit. Utamakan prefix khusus plugin untuk
metode milik plugin.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki registrar
- `descriptors`: deskriptor perintah pada waktu parse yang digunakan untuk bantuan CLI root,
  routing, dan pendaftaran CLI plugin lazy

Jika Anda ingin perintah plugin tetap dimuat secara lazy pada jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos oleh
registrar tersebut.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Kelola akun Matrix, verifikasi, perangkat, dan state profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya saat Anda tidak membutuhkan pendaftaran CLI root yang lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk lazy loading pada waktu parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `claude-cli` atau `codex-cli`.

- `id` backend menjadi prefix provider dalam ref model seperti `claude-cli/opus`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas default
  plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                      |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (satu aktif sekaligus) |
| `api.registerMemoryPromptSection(builder)` | Pembuat bagian prompt memori          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                |

### Adapter embedding memori

| Metode                                         | Yang didaftarkan                               |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif    |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` bersifat eksklusif untuk plugin memori.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memori aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id
  kustom yang didefinisikan plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` di-resolve terhadap id adapter
  yang terdaftar tersebut.

### Event dan lifecycle

| Metode                                       | Fungsinya                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook lifecycle bertipe       |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan  |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                              |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                |
| `api.source`             | `string`                  | Path sumber plugin                                                                         |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                           |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori yang aktif bila tersedia)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger berscope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path relatif terhadap root plugin                                                  |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime internal saja
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri ringan khusus setup (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui fasad (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) sekarang mengutamakan
snapshot konfigurasi runtime aktif saat OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, mereka fallback ke file konfigurasi di disk yang telah di-resolve.

Plugin provider juga dapat mengekspos barrel kontrak lokal plugin yang sempit saat sebuah
helper memang spesifik provider dan belum cocok ditempatkan dalam subpath SDK generik.
Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude-nya di seam publik
`api.ts` / `contract-api.ts` miliknya sendiri alih-alih mempromosikan logika header beta
Anthropic dan `service_tier` ke kontrak `plugin-sdk/*` generik.

Contoh bawaan lain saat ini:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider plus
  helper onboarding/konfigurasi

<Warning>
  Kode produksi extension juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar dibagikan, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lainnya alih-alih mengikat dua plugin bersama.
</Warning>

## Terkait

- [Entry Points](/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Runtime Helpers](/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup and Config](/plugins/sdk-setup) — packaging, manifest, skema konfigurasi
- [Testing](/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [SDK Migration](/plugins/sdk-migration) — migrasi dari permukaan yang sudah usang
- [Plugin Internals](/plugins/architecture) — arsitektur mendalam dan model kapabilitas
