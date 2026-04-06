---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari
    - Anda menginginkan referensi untuk semua metode registrasi pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Peta impor, referensi API registrasi, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-06T09:14:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: acd2887ef52c66b2f234858d812bb04197ecd0bfb3e4f7bf3622f8fdc765acad
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Ikhtisar Plugin SDK

Plugin SDK adalah kontrak bertipe antara plugin dan core. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  **Mencari panduan cara melakukannya?**
  - Plugin pertama? Mulai dengan [Getting Started](/id/plugins/building-plugins)
  - Plugin channel? Lihat [Channel Plugins](/id/plugins/sdk-channel-plugins)
  - Plugin provider? Lihat [Provider Plugins](/id/plugins/sdk-provider-plugins)
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah circular dependency. Untuk helper entri/build khusus channel,
gunakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan menambahkan atau bergantung pada seam kemudahan bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Plugin bawaan sebaiknya menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` mereka sendiri, dan core
sebaiknya menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik yang sempit
ketika kebutuhannya benar-benar lintas channel.

Peta ekspor yang dihasilkan masih berisi sekumpulan kecil seam helper
plugin bawaan seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath
tersebut ada hanya untuk pemeliharaan dan kompatibilitas plugin bawaan; sengaja
tidak disertakan dari tabel umum di bawah dan bukan jalur impor yang direkomendasikan untuk plugin pihak ketiga baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
200+ subpath yang dihasilkan berada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper plugin bawaan yang dicadangkan masih muncul dalam daftar yang dihasilkan itu.
Perlakukan itu sebagai detail implementasi/permukaan kompatibilitas kecuali sebuah halaman dokumen
secara eksplisit mempromosikannya sebagai publik.

### Entri plugin

| Subpath                     | Ekspor kunci                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, builder status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper config/gate tindakan multi-akun, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar akun/tindakan akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema config channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom command Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper rute inbound bersama + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper pencatatan-dan-dispatch inbound bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-runtime` | Helper identitas outbound/delegasi send |
    | `plugin-sdk/thread-bindings-runtime` | Siklus hidup thread-binding dan helper adapter |
    | `plugin-sdk/agent-media-payload` | Builder payload media agent lama |
    | `plugin-sdk/conversation-runtime` | Binding percakapan/thread, pairing, dan helper binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitive sempit skema config channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan config channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca config allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard direct-DM bersama |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/reduksi payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Debounce, pencocokan mention, helper envelope |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang fokus pada kompatibilitas OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding API key/penulisan profil |
    | `plugin-sdk/provider-auth-result` | Builder auth-result OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper lookup env var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint provider generik |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache provider web-fetch |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/config provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper patch config onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry command, helper otorisasi pengirim |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper action-auth chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter approval native exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman approval native |
    | `plugin-sdk/approval-native-runtime` | Helper target approval native + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Auth command native + helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi command bersama |
    | `plugin-sdk/command-surface` | Helper normalisasi isi command dan permukaan command |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Helper trust, DM gating, konten eksternal, dan pengumpulan secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch yang dijaga SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper request/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout request |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper sempit env runtime, logger, timeout, retry, dan backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline hook webhook/internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper format CLI, wait, dan versi |
    | `plugin-sdk/gateway-runtime` | Helper klien gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper muat/tulis config |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/approval-runtime` | Helper approval exec/plugin, builder kemampuan approval, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper sempit dispatch/finalisasi balasan |
    | `plugin-sdk/reply-history` | Helper reply-history jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper sempit chunking teks/markdown |
    | `plugin-sdk/session-store-runtime` | Helper jalur session store + updated-at |
    | `plugin-sdk/state-paths` | Helper jalur direktori state/OAuth |
    | `plugin-sdk/routing` | Helper binding rute/session-key/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default state runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command bertimer dengan hasil stdout/stderr yang ternormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-send` | Ekstrak field target send kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper jalur unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Primitive sempit skema config runtime agent |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper channel pasif dan status bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar skill command |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize command native |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper event sistem/heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache terikat kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Grafik error, pemformatan, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan pinned lookup |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agent |
    | `plugin-sdk/directory-runtime` | Query/dedup direktori berbasis config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kemampuan dan pengujian">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper fetch/transform/store media bersama ditambah builder payload media |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media ditambah ekspor helper gambar/audio yang menghadap provider |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper directive-tag, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe provider speech ditambah helper directive, registry, dan validasi yang menghadap provider |
    | `plugin-sdk/speech-core` | Tipe provider speech bersama, helper registry, directive, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi realtime dan helper registry |
    | `plugin-sdk/realtime-voice` | Tipe provider suara realtime dan helper registry |
    | `plugin-sdk/image-generation` | Tipe provider pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, helper failover, auth, dan registry |
    | `plugin-sdk/music-generation` | Tipe provider/request/result pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/request/result pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Helper registry target webhook dan instalasi rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi jalur webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media remote/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memory">
    | Subpath | Ekspor kunci |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine foundation host memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Ekspor engine embedding host memory |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memory |
    | `plugin-sdk/memory-core-host-query` | Helper query host memory |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memory |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memory |
    | `plugin-sdk/memory-core-host-status` | Helper status host memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memory |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime core host memory |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host memory |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host memory |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memory |
    | `plugin-sdk/memory-host-search` | Fasad runtime memory aktif untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host memory |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksudkan |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Helper khusus auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API registrasi

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode berikut:

### Registrasi kemampuan

| Method                                           | Yang didaftarkan                |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)             |
| `api.registerChannel(...)`                       | Channel pesan                    |
| `api.registerSpeechProvider(...)`                | Text-to-speech / sintesis STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming   |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks      |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video      |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                 |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                  |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                  |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web      |
| `api.registerWebSearchProvider(...)`             | Pencarian web                    |

### Tool dan command

| Method                          | Yang didaftarkan                                |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agent (wajib atau `{ optional: true }`)    |
| `api.registerCommand(def)`      | Custom command (melewati LLM)                   |

### Infrastruktur

| Method                                         | Yang didaftarkan                        |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook event                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC gateway                      |
| `api.registerCli(registrar, opts?)`            | Subcommand CLI                          |
| `api.registerService(service)`                 | Layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                      |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt aditif yang berdekatan dengan memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus pencarian/baca memory aditif     |

Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, bahkan jika plugin mencoba menetapkan
cakupan metode gateway yang lebih sempit. Gunakan prefiks khusus plugin untuk
metode yang dimiliki plugin.

### Metadata registrasi CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root command eksplisit yang dimiliki registrar
- `descriptors`: descriptor command saat parse yang digunakan untuk bantuan CLI root,
  routing, dan registrasi CLI plugin lazy

Jika Anda ingin command plugin tetap dimuat secara lazy di jalur CLI root normal,
sediakan `descriptors` yang mencakup setiap root command tingkat atas yang diekspos oleh
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
        description: "Kelola akun Matrix, verifikasi, perangkat, dan status profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan registrasi CLI root yang lazy.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder yang didukung descriptor untuk lazy loading saat parse-time.

### Slot eksklusif

| Method                                     | Yang didaftarkan                      |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (satu aktif pada satu waktu) |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memory          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memory         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memory                |

### Adapter embedding memory

| Method                                         | Yang didaftarkan                               |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memory untuk plugin aktif    |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` bersifat eksklusif untuk plugin memory.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memory aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom
  yang ditentukan plugin).
- Config pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter
  terdaftar tersebut.

### Event dan siklus hidup

| Method                                       | Fungsinya                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe    |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan  |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah ada handler yang mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Type                      | Deskripsi                                                                                   |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                      |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                  |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                             |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime in-memory aktif bila tersedia)                    |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus plugin dari `plugins.entries.<id>.config`                                      |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Logger berlingkup (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode muat saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Selesaikan jalur relatif terhadap root plugin                                                |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entri setup ringan saja (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) sekarang lebih mengutamakan
snapshot config runtime aktif saat OpenClaw sudah berjalan. Jika belum ada runtime
snapshot, mereka akan fallback ke file config yang diselesaikan di disk.

Plugin provider juga dapat mengekspos barrel kontrak lokal plugin yang sempit saat sebuah
helper memang khusus provider dan belum pantas berada dalam subpath SDK generik.
Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude
di seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
mempromosikan logic beta-header Anthropic dan `service_tier` ke kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider ditambah
  helper onboarding/config

<Warning>
  Kode produksi extension juga sebaiknya menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kemampuan lainnya alih-alih mengikat dua plugin bersama.
</Warning>

## Terkait

- [Entry Points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Runtime Helpers](/id/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup and Config](/id/plugins/sdk-setup) — packaging, manifest, skema config
- [Testing](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [SDK Migration](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah usang
- [Plugin Internals](/id/plugins/architecture) — arsitektur mendalam dan model kemampuan
