---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode pendaftaran pada `OpenClawPluginApi`
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK Overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-04-17T09:14:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
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
gunakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Jangan menambahkan atau bergantung pada seam kemudahan bernama provider seperti
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, atau
seam helper bermerek channel. Bundled plugin sebaiknya menyusun
subpath SDK generik di dalam barrel `api.ts` atau `runtime-api.ts` mereka sendiri, dan core
sebaiknya menggunakan barrel lokal plugin tersebut atau menambahkan kontrak SDK generik yang sempit
saat kebutuhannya benar-benar lintas channel.

Peta ekspor yang dihasilkan masih berisi sekumpulan kecil
seam helper bundled-plugin seperti `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Subpath
tersebut hanya ada untuk pemeliharaan bundled-plugin dan kompatibilitas; subpath itu
sengaja tidak disertakan dari tabel umum di bawah dan bukan jalur impor yang
direkomendasikan untuk plugin pihak ketiga yang baru.

## Referensi subpath

Subpath yang paling umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
200+ subpath yang dihasilkan ada di `scripts/lib/plugin-sdk-entrypoints.json`.

Subpath helper bundled-plugin yang dicadangkan masih muncul dalam daftar yang dihasilkan itu.
Perlakukan itu sebagai detail implementasi/permukaan kompatibilitas kecuali suatu halaman dokumentasi
secara eksplisit mempromosikannya sebagai publik.

### Entry plugin

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
    | `plugin-sdk/account-core` | Helper multi-account config/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Pencarian akun + helper fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipe skema config channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom-command Telegram dengan fallback kontrak bundled |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper rute inbound + pembuat envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Helper pencatatan-dan-dispatch inbound bersama |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-runtime` | Helper delegasi identitas/kirim outbound |
    | `plugin-sdk/thread-bindings-runtime` | Siklus hidup thread-binding dan helper adapter |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agent lama |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan binding yang dikonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitive sempit skema config channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan config channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca config allowlist |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard direct-DM bersama |
    | `plugin-sdk/interactive-runtime` | Helper normalisasi/pengurangan payload balasan interaktif |
    | `plugin-sdk/channel-inbound` | Debounce inbound, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath provider">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi API key runtime untuk plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil API key seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Pembuat hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper pencarian env var auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint provider generik |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak config/pemilihan web-fetch sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper config/kredensial web-search sempit untuk provider yang tidak memerlukan wiring enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak config/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berscope |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan + diagnostik skema Gemini, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper patch config onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal-proses |
  </Accordion>

  <Accordion title="Subpath auth dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Pembuat pesan perintah/help seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi approver dan helper action-auth dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan native exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime penangan persetujuan yang lebih luas; gunakan seam adapter/gateway yang lebih sempit saat itu sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + binding akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/command-auth-native` | Auth perintah native + helper session-target native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak secret sempit untuk permukaan secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` sempit dan pengetikan SecretRef untuk parsing kontrak secret/config |
    | `plugin-sdk/security-runtime` | Helper trust, gating DM, konten eksternal, dan pengumpulan secret bersama |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF allowlist host dan jaringan privat |
    | `plugin-sdk/ssrf-runtime` | Helper pinned-dispatcher, fetch yang dijaga SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/instalasi plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper runtime env, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/channel-runtime-context` | Helper pendaftaran dan lookup runtime-context channel generik |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper perintah/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper formatting, wait, dan versi CLI |
    | `plugin-sdk/gateway-runtime` | Helper klien Gateway dan patch status channel |
    | `plugin-sdk/config-runtime` | Helper muat/tulis config |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, pembuat kapabilitas persetujuan, helper auth/profil, helper routing/runtime native |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan yang sempit |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path penyimpanan sesi + updated-at |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/routing` | Helper rute/session-key/binding akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah bertimer dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target pengiriman kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis state JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper ACP runtime/sesi dan reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Primitive skema config runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper proxy ambient, status, dan channel pasif bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan provider/perintah `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skills |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agent level rendah: tipe harness, helper steer/abort active-run, helper jembatan tool OpenClaw, dan utilitas hasil attempt |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper event sistem/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helper cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Helper flag dan event diagnostik |
    | `plugin-sdk/error-runtime` | Helper graf error, formatting, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, dan helper lookup yang dipin |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper config retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agent |
    | `plugin-sdk/directory-runtime` | Query/dedupe direktori berbasis config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper fetch/transform/store media bersama plus pembuat payload media |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media plus ekspor helper gambar/audio yang menghadap provider |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel Markdown, helper redaksi, helper tag direktif, dan utilitas safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking teks outbound |
    | `plugin-sdk/speech` | Tipe provider speech plus helper direktif, registri, dan validasi yang menghadap provider |
    | `plugin-sdk/speech-core` | Tipe provider speech, registri, direktif, dan helper normalisasi bersama |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi realtime dan helper registri |
    | `plugin-sdk/realtime-voice` | Tipe provider suara realtime dan helper registri |
    | `plugin-sdk/image-generation` | Tipe provider pembuatan gambar |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar, failover, auth, dan helper registri bersama |
    | `plugin-sdk/music-generation` | Tipe provider/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik, helper failover, lookup provider, dan parsing model-ref bersama |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video, helper failover, lookup provider, dan parsing model-ref bersama |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper instalasi rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media remote/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registri, provider lokal, dan helper batch/remote generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper query host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime core host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias netral vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral vendor untuk helper status host memori |
    | `plugin-sdk/memory-lancedb` | Permukaan helper memory-lancedb bawaan |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    | Family | Subpath saat ini | Penggunaan yang dimaksud |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper dukungan plugin browser bawaan (`browser-support` tetap menjadi barrel kompatibilitas) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Permukaan helper/runtime Matrix bawaan |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Permukaan helper/runtime LINE bawaan |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Permukaan helper IRC bawaan |
    | Helper khusus channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam kompatibilitas/helper channel bawaan |
    | Helper khusus auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper fitur/plugin bawaan; `plugin-sdk/github-copilot-token` saat ini mengekspor `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Method                                           | Yang didaftarkan                      |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                  |
| `api.registerAgentHarness(...)`                  | Eksekutor agent level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal           |
| `api.registerChannel(...)`                       | Channel perpesanan                    |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming        |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks           |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video           |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                      |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                       |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                       |
| `api.registerWebFetchProvider(...)`              | Provider fetch / scrape web           |
| `api.registerWebSearchProvider(...)`             | Pencarian web                         |

### Tool dan perintah

| Method                          | Yang didaftarkan                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agent (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                |

### Infrastruktur

| Method                                         | Yang didaftarkan                       |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook event                             |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                     |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                        |
| `api.registerService(service)`                 | Layanan latar belakang                 |
| `api.registerInteractiveHandler(registration)` | Penangan interaktif                    |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan  |

Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) selalu tetap `operator.admin`, meskipun plugin mencoba menetapkan
cakupan metode Gateway yang lebih sempit. Gunakan prefiks khusus plugin untuk
metode yang dimiliki plugin.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki registrar
- `descriptors`: deskriptor perintah saat parse yang digunakan untuk help CLI root,
  routing, dan pendaftaran CLI plugin lazy

Jika Anda ingin perintah plugin tetap dimuat secara lazy di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos
oleh registrar tersebut.

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

Gunakan `commands` saja hanya saat Anda tidak memerlukan pendaftaran CLI root lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan lazy saat parse-time.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki config default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks provider dalam model ref seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Config pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` saat backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).

### Slot eksklusif

| Method                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (hanya satu yang aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` sehingga engine dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Pembuat bagian prompt memori                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                   |

### Adapter embedding memori

| Method                                         | Yang didaftarkan                               |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang disukai.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat menggunakan artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau layout privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan versi lama.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memori aktif mendaftarkan satu
  atau lebih ID adapter embedding (misalnya `openai`, `gemini`, atau ID yang ditentukan plugin kustom).
- Config pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diresolusikan terhadap ID adapter yang terdaftar tersebut.

### Event dan siklus hidup

| Method                                       | Fungsinya                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe    |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan  |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti tidak menyertakan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti tidak menyertakan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah ada handler yang mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah ada handler yang menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti tidak menyertakan `cancel`), bukan sebagai override.

### Field objek API

| Field                    | Type                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                              |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                |
| `api.source`             | `string`                  | Path sumber plugin                                                                         |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                           |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime in-memory aktif jika tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus plugin dari `plugins.entries.<id>.config`                                    |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger berscope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum full-entry |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path relatif terhadap root plugin                                                  |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime khusus internal
  index.ts          # Titik masuk plugin
  setup-entry.ts    # Entry khusus setup ringan (opsional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanya merupakan kontrak eksternal.
</Warning>

Permukaan publik bundled plugin yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entry publik serupa) kini lebih memilih
snapshot config runtime aktif saat OpenClaw sudah berjalan. Jika snapshot runtime
belum ada, permukaan itu akan menggunakan fallback ke file config yang sudah di-resolve di disk.

Plugin provider juga dapat mengekspos barrel kontrak lokal-plugin yang sempit saat suatu
helper memang khusus provider dan belum termasuk ke dalam subpath SDK generik.
Contoh bawaan saat ini: provider Anthropic menyimpan helper stream Claude-nya
dalam seam publik `api.ts` / `contract-api.ts` miliknya sendiri alih-alih
menaikkan logika header beta Anthropic dan `service_tier` ke dalam kontrak
`plugin-sdk/*` generik.

Contoh bawaan saat ini lainnya:

- `@openclaw/openai-provider`: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime
- `@openclaw/openrouter-provider`: `api.ts` mengekspor builder provider plus
  helper onboarding/config

<Warning>
  Kode produksi extension juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper memang benar-benar dibagikan, promosikan helper tersebut ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan lain
  yang berorientasi kapabilitas alih-alih menggabungkan dua plugin secara erat.
</Warning>

## Terkait

- [Titik Masuk](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry` dan `defineChannelPluginEntry`
- [Helper Runtime](/id/plugins/sdk-runtime) — referensi namespace `api.runtime` lengkap
- [Setup dan Config](/id/plugins/sdk-setup) — packaging, manifes, skema config
- [Pengujian](/id/plugins/sdk-testing) — utilitas pengujian dan aturan lint
- [Migrasi SDK](/id/plugins/sdk-migration) — migrasi dari permukaan yang sudah tidak digunakan
- [Internal Plugin](/id/plugins/architecture) — arsitektur mendalam dan model kapabilitas
