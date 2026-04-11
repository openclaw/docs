---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Peta import, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-11T02:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bfeb5896f68e3e4ee8cf434d43a019e0d1fe5af57f5bf7a5172847c476def0c
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

Setiap subpath adalah modul kecil yang berdiri sendiri. Ini menjaga startup tetap cepat dan
mencegah masalah circular dependency. Untuk helper entry/build khusus channel,
gunakan `openclaw/plugin-sdk/channel-core`; simpan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan tambahkan atau bergantung pada seam kemudahan bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Plugin bawaan harus menyusun subpath
SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` mereka sendiri, dan core
harus menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik yang sempit
ketika kebutuhan itu benar-benar lintas channel.

Peta ekspor yang dihasilkan masih berisi sekumpulan kecil seam helper
plugin bawaan seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath
tersebut hanya ada untuk pemeliharaan dan kompatibilitas plugin bawaan; subpath itu
sengaja dihilangkan dari tabel umum di bawah ini dan bukan jalur impor yang direkomendasikan untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap yang dihasilkan
berisi lebih dari 200 subpath dan berada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper plugin bawaan yang dicadangkan masih muncul dalam daftar yang dihasilkan itu.
Perlakukan itu sebagai detail implementasi/permukaan kompatibilitas kecuali sebuah halaman docs
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
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper config multi-akun/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar-aksi akun/aksi akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema config channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom-command Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper bersama route masuk + pembuat envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper bersama rekam-dan-dispatch masuk |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper bersama pemuatan media keluar |
    | `plugin-sdk/outbound-runtime` | Helper identitas keluar/delegasi kirim |
    | `plugin-sdk/thread-bindings-runtime` | Siklus hidup thread-binding dan helper adapter |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Thread binding/percakapan, pairing, dan helper configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Helper bersama snapshot/ringkasan status channel |
    | `plugin-sdk/channel-config-primitives` | Primitive sempit skema config channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan config channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca config allowlist |
    | `plugin-sdk/group-access` | Helper bersama keputusan akses grup |
    | `plugin-sdk/direct-dm` | Helper bersama auth/guard DM langsung |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/reduksi payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Debounce masuk, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Pembuat hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper lookup env var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint provider generik |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak config/seleksi web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper config/kredensial web-search yang sempit untuk provider yang tidak memerlukan wiring plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak config/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial yang dibatasi scope |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan + diagnostik skema Gemini, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, dan helper pembungkus bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper patch config onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Pembuat pesan perintah/help seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper action-auth chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper bersama resolusi gateway persetujuan |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper ringan pemuatan adapter persetujuan native untuk entrypoint channel yang hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime approval yang lebih luas; gunakan seam adapter/gateway yang lebih sempit bila itu sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/command-auth-native` | Auth perintah native + helper target sesi native |
    | `plugin-sdk/command-detection` | Helper bersama deteksi perintah |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak secret yang sempit untuk permukaan secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` yang sempit dan helper pengetikan SecretRef untuk parsing kontrak secret/config |
    | `plugin-sdk/security-runtime` | Helper bersama trust, gating DM, konten eksternal, dan pengumpulan secret |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF allowlist host dan jaringan privat |
    | `plugin-sdk/ssrf-runtime` | Dispatcher yang dipin, fetch yang dijaga SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran isi permintaan/timeout |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper sempit env runtime, logger, timeout, retry, dan backoff |
    | `plugin-sdk/channel-runtime-context` | Helper registrasi dan lookup generic channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper bersama perintah/hook/http/interaktif plugin |
    | `plugin-sdk/hook-runtime` | Helper bersama pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper formatting, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Klien gateway dan helper patch status channel |
    | `plugin-sdk/config-runtime` | Helper pemuatan/penulisan config |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, pembuat kapabilitas persetujuan, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper bersama runtime inbound/balasan, chunking, dispatch, heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper sempit dispatch/finalisasi balasan |
    | `plugin-sdk/reply-history` | Helper bersama riwayat balasan jendela pendek seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper sempit chunking teks/markdown |
    | `plugin-sdk/session-store-runtime` | Helper jalur session store + updated-at |
    | `plugin-sdk/state-paths` | Helper jalur direktori status/OAuth |
    | `plugin-sdk/routing` | Helper route/session-key/account binding seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper bersama ringkasan status channel/akun, default status runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper bersama target resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Mengekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak field target pengiriman kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper bersama jalur unduhan sementara |
    | `plugin-sdk/logging-core` | Logger subsystem dan helper redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis status JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper ACP runtime/sesi dan reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Primitive sempit skema config runtime agen |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper token bootstrap perangkat dan pairing |
    | `plugin-sdk/extension-shared` | Primitive helper bersama passive-channel, status, dan ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helper balasan provider/perintah `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skills |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk agent harness tingkat rendah: tipe harness, helper steer/abort eksekusi aktif, helper jembatan tool OpenClaw, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper event sistem/heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Grafik error, formatting, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, dan lookup yang dipin |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper config retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Query/deduplikasi direktori berbasis config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama fetch/transform/store media ditambah pembuat payload media |
    | `plugin-sdk/media-generation-runtime` | Helper bersama failover media-generation, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider media understanding ditambah ekspor helper gambar/audio yang menghadap provider |
    | `plugin-sdk/text-runtime` | Helper bersama teks/markdown/logging seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper directive-tag, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks keluar |
    | `plugin-sdk/speech` | Tipe provider speech ditambah helper directive, registry, dan validasi yang menghadap provider |
    | `plugin-sdk/speech-core` | Helper bersama tipe provider speech, registry, directive, dan normalisasi |
    | `plugin-sdk/realtime-transcription` | Tipe provider realtime transcription dan helper registry |
    | `plugin-sdk/realtime-voice` | Tipe provider realtime voice dan helper registry |
    | `plugin-sdk/image-generation` | Tipe provider image generation |
    | `plugin-sdk/image-generation-core` | Helper bersama tipe image-generation, failover, auth, dan registry |
    | `plugin-sdk/music-generation` | Tipe provider/request/result music generation |
    | `plugin-sdk/music-generation-core` | Helper bersama tipe music-generation, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe provider/request/result video generation |
    | `plugin-sdk/video-generation-core` | Helper bersama tipe video-generation, helper failover, lookup provider, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registry target webhook dan helper instalasi route |
    | `plugin-sdk/webhook-path` | Helper normalisasi jalur webhook |
    | `plugin-sdk/web-media` | Helper bersama pemuatan media remote/lokal |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine foundation host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Ekspor engine embedding host memori |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine storage host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper query host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime core host memori |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime memori aktif untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host memori |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksudkan |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper spesifik channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Helper spesifik auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Metode                                          | Yang didaftarkan                       |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerProvider(...)`                     | Inferensi teks (LLM)                   |
| `api.registerAgentHarness(...)`                 | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                   | Backend inferensi CLI lokal            |
| `api.registerChannel(...)`                      | Channel pesan                          |
| `api.registerSpeechProvider(...)`               | Text-to-speech / sintesis STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming         |
| `api.registerRealtimeVoiceProvider(...)`        | Sesi suara realtime dupleks            |
| `api.registerMediaUnderstandingProvider(...)`   | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`      | Pembuatan gambar                       |
| `api.registerMusicGenerationProvider(...)`      | Pembuatan musik                        |
| `api.registerVideoGenerationProvider(...)`      | Pembuatan video                        |
| `api.registerWebFetchProvider(...)`             | Provider web fetch / scrape            |
| `api.registerWebSearchProvider(...)`            | Pencarian web                          |

### Tools dan perintah

| Metode                        | Yang didaftarkan                               |
| ----------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agen (wajib atau `{ optional: true }`)   |
| `api.registerCommand(def)`    | Perintah kustom (melewati LLM)                 |

### Infrastruktur

| Metode                                        | Yang didaftarkan                      |
| --------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`    | Hook event                            |
| `api.registerHttpRoute(params)`               | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`    | Metode RPC Gateway                    |
| `api.registerCli(registrar, opts?)`           | Subperintah CLI                       |
| `api.registerService(service)`                | Layanan latar belakang                |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                   |
| `api.registerMemoryPromptSupplement(builder)` | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)` | Korpus pencarian/baca memori tambahan |

Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, meskipun plugin mencoba menetapkan
scope metode gateway yang lebih sempit. Gunakan prefix spesifik plugin untuk
metode yang dimiliki plugin.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: descriptor perintah saat parse yang digunakan untuk bantuan root CLI,
  routing, dan pendaftaran CLI plugin secara lazy

Jika Anda ingin perintah plugin tetap dimuat secara lazy pada jalur root CLI normal,
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
        description: "Kelola akun Matrix, verifikasi, perangkat, dan status profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan pendaftaran root CLI secara lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis descriptor untuk pemuatan lazy saat parse-time.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki config default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefix provider dalam ref model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Config pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Metode                                    | Yang didaftarkan                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`  | Engine konteks (satu aktif dalam satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar engine dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Pembuat bagian prompt memori                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`   | Resolver rencana flush memori                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`      | Adapter runtime memori                                                                                                                                       |

### Adapter embedding memori

| Metode                                        | Yang didaftarkan                              |
| --------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang lebih disukai.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau layout privat plugin
  memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan
  versi lama.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memori aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom yang
  ditentukan plugin).
- Config pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter yang
  terdaftar tersebut.

### Event dan siklus hidup

| Metode                                      | Fungsinya                    |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`          | Hook siklus hidup bertipe    |
| `api.onConversationBindingResolved(handler)` | Callback conversation binding |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default akan dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                              |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                        |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                           |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime dalam memori yang aktif jika tersedia)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus plugin dari `plugins.entries.<id>.config`                                    |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger yang dibatasi scope (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Menyelesaikan jalur relatif terhadap root plugin                                           |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Entrypoint plugin
  setup-entry.ts    # Entri ringan khusus setup (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) sekarang lebih memilih
snapshot config runtime aktif saat OpenClaw sudah berjalan. Jika belum ada snapshot runtime,
permukaan itu akan fallback ke file config yang terselesaikan di disk.

Plugin provider juga dapat mengekspos contract barrel lokal-plugin yang sempit ketika sebuah
helper memang spesifik provider dan belum layak dimasukkan ke subpath SDK generik.
Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude-nya
di seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
menaikkan logika beta-header Anthropic dan `service_tier` ke kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
  helper default-model, dan builder provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider ditambah
  helper onboarding/config

<Warning>
  Kode produksi extension juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar dipakai bersama, promosikan helper itu ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lainnya alih-alih menggandengkan dua plugin bersama.
</Warning>

## Terkait

- [Entry Points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Runtime Helpers](/id/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup and Config](/id/plugins/sdk-setup) — packaging, manifest, skema config
- [Testing](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [SDK Migration](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah usang
- [Plugin Internals](/id/plugins/architecture) — arsitektur mendalam dan model kapabilitas
