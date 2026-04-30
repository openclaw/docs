---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subjalur Plugin bawaan dan permukaan helper
summary: 'Katalog subjalur SDK Plugin: import berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-04-30T10:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin diekspos sebagai sekumpulan subjalur sempit di bawah `openclaw/plugin-sdk/`.
  Halaman ini mengatalogkan subjalur yang umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
  tergenerasi berisi 200+ subjalur berada di `scripts/lib/plugin-sdk-entrypoints.json`;
  subjalur pembantu Plugin bawaan yang dicadangkan muncul di sana tetapi merupakan detail
  implementasi kecuali sebuah halaman dokumentasi secara eksplisit mempromosikannya. Pemelihara dapat mengaudit subjalur
  pembantu dicadangkan yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor
  pembantu dicadangkan yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik
  sebagai utang kompatibilitas dorman.

  Untuk panduan pembuatan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

  ## Entri Plugin

  | Subpath                                   | Ekspor utama                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel kompatibilitas luas untuk pengujian Plugin lama; pilih subjalur pengujian yang terfokus untuk pengujian ekstensi baru                                                |
  | `plugin-sdk/plugin-test-api`              | Pembuat mock `OpenClawPluginApi` minimal untuk pengujian unit pendaftaran Plugin langsung                                                                                    |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter agent-runtime native untuk profil auth, penekanan pengiriman, klasifikasi fallback, hook alat, overlay prompt, skema, dan perbaikan transkrip        |
  | `plugin-sdk/channel-test-helpers`         | Pembantu pengujian kontrak kanal generik, pairing reply, timestamp envelope, entri kanal bawaan, hook, mock runtime, send-config, direktori, dan siklus hidup akun kanal     |
  | `plugin-sdk/channel-target-testing`       | Suite pengujian kasus error resolusi target kanal bersama                                                                                                                     |
  | `plugin-sdk/plugin-test-contracts`        | Pembantu kontrak pendaftaran Plugin, package manifest, artefak publik, API runtime, efek samping impor, dan impor langsung                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixture runtime Plugin, registry, pendaftaran provider, setup-wizard, dan runtime task-flow untuk pengujian                                                                 |
  | `plugin-sdk/provider-test-contracts`      | Pembantu kontrak runtime provider, auth, discovery, onboard, katalog, kapabilitas media, kebijakan replay, audio langsung STT realtime, web-search/fetch, dan wizard        |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/auth Vitest opsional untuk pengujian provider yang menjalankan `plugin-sdk/provider-http`                                                                          |
  | `plugin-sdk/test-env`                     | Fixture lingkungan pengujian, fetch/jaringan, server HTTP sekali pakai, permintaan masuk, live-test, sistem berkas sementara, dan kontrol waktu                             |
  | `plugin-sdk/test-fixtures`                | Fixture pengujian generik untuk CLI, sandbox, skill, agent-message, system-event, reload modul, jalur Plugin bawaan, terminal, chunking, auth-token, dan typed-case         |
  | `plugin-sdk/test-node-mocks`              | Pembantu mock bawaan Node yang terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")`                                                                          |
  | `plugin-sdk/migration`                    | Pembantu item provider migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, pembantu redaksi, dan `summarizeMigrationItems`                        |
  | `plugin-sdk/migration-runtime`            | Pembantu migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                     |

  <AccordionGroup>
  <Accordion title="Subjalur kanal">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard setup bersama, prompt allowlist, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu config multi-akun/action-gate, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi account-id |
    | `plugin-sdk/account-resolution` | Pembantu lookup akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu account-list/account-action yang sempit |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema config kanal bersama dan pembuat generik |
    | `plugin-sdk/bundled-channel-config-schema` | Skema config kanal OpenClaw bawaan hanya untuk Plugin bawaan yang dipelihara |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas usang untuk skema config kanal bawaan |
    | `plugin-sdk/telegram-command-config` | Pembantu normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Pembantu gate otorisasi perintah yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, pembantu siklus hidup/finalisasi draf stream |
    | `plugin-sdk/inbound-envelope` | Pembantu rute masuk bersama + pembuat envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Pembantu record-and-dispatch masuk bersama |
    | `plugin-sdk/messaging-targets` | Pembantu parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Pembantu pemuatan media keluar bersama |
    | `plugin-sdk/outbound-send-deps` | Lookup dependensi pengiriman keluar ringan untuk adapter kanal |
    | `plugin-sdk/outbound-runtime` | Pembantu pengiriman keluar, identitas, delegasi pengiriman, sesi, pemformatan, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi poll yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu adapter dan siklus hidup thread-binding |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Pembantu conversation/thread binding, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Pembantu snapshot/ringkasan status kanal bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif config-schema kanal yang sempit |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan config kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu edit/baca config allowlist |
    | `plugin-sdk/group-access` | Pembantu keputusan group-access bersama |
    | `plugin-sdk/direct-dm` | Pembantu auth/guard direct-DM bersama |
    | `plugin-sdk/discord` | Facade kompatibilitas Discord usang untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan subjalur SDK kanal generik |
    | `plugin-sdk/telegram-account` | Facade kompatibilitas resolusi akun Telegram usang untuk kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan pembantu runtime yang diinjeksi atau subjalur SDK kanal generik |
    | `plugin-sdk/zalouser` | Facade kompatibilitas Zalo Personal usang untuk paket Lark/Zalo terpublikasi yang masih mengimpor otorisasi perintah pengirim; Plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Pembantu penyajian pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Penyajian Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce masuk, pencocokan mention, pembantu mention-policy, dan pembantu envelope |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce masuk yang sempit |
    | `plugin-sdk/channel-mention-gating` | Pembantu mention-policy, penanda mention, dan teks mention yang sempit tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-envelope` | Pembantu pemformatan envelope masuk yang sempit |
    | `plugin-sdk/channel-location` | Pembantu konteks lokasi kanal dan pemformatan |
    | `plugin-sdk/channel-logging` | Pembantu logging kanal untuk inbound drop dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu aksi pesan kanal, plus pembantu skema native usang yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-route` | Pembantu normalisasi rute bersama, resolusi target berbasis parser, stringifikasi thread-id, kunci rute dedupe/compact, tipe parsed-target, dan pembantu perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu parsing target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak kanal |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Pembantu secret-contract yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan pembantu model yang dimuat |
    | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/di-hosting sendiri yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia yang di-hosting sendiri kompatibel OpenAI secara terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pembantu resolusi kunci API runtime untuk Plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Pembantu onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-auth-login` | Pembantu login interaktif bersama untuk Plugin penyedia |
    | `plugin-sdk/provider-env-vars` | Pembantu pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk uji kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Pembantu kapabilitas HTTP/endpoint penyedia generik, kesalahan HTTP penyedia, dan pembantu formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Pembantu kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pembantu pendaftaran/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring pengaktifan Plugin |
    | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terbatas cakupan |
    | `plugin-sdk/provider-web-search` | Pembantu pendaftaran/cache/runtime penyedia web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan pembantu kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, jenis wrapper stream, dan pembantu wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia native seperti guarded fetch, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Pembantu patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Pembantu singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Pembantu mode aktivasi grup sempit dan parsing perintah |
  </Accordion>

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pembantu registri perintah termasuk pemformatan menu argumen dinamis, pembantu otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pembantu resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Pembantu profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Pembantu resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Pembantu runtime handler persetujuan yang lebih luas; gunakan seam adapter/Gateway yang lebih sempit jika itu sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Pembantu payload balasan persetujuan eksekusi/Plugin |
    | `plugin-sdk/approval-runtime` | Pembantu payload persetujuan eksekusi/Plugin, pembantu perutean/runtime persetujuan native, dan pembantu tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Pembantu reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Pembantu uji kontrak channel yang sempit tanpa barrel pengujian yang luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan pembantu target sesi native |
    | `plugin-sdk/command-detection` | Pembantu deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Pembantu normalisasi isi perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Pembantu pengumpulan kontrak rahasia sempit untuk permukaan rahasia channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Pembantu pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Pembantu bersama untuk kepercayaan, gating DM, konten eksternal, penyuntingan teks sensitif, perbandingan rahasia waktu konstan, dan pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Pembantu allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Pembantu pinned-dispatcher yang sempit tanpa permukaan runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Pembantu pinned-dispatcher, fetch yang dijaga SSRF, kesalahan SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Pembantu parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Pembantu permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Pembantu ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu runtime/pencatatan/cadangan/pemasangan Plugin yang luas |
    | `plugin-sdk/runtime-env` | Pembantu env runtime, pencatat, batas waktu, coba ulang, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Fasad konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol browser |
    | `plugin-sdk/channel-runtime-context` | Pembantu pendaftaran dan pencarian konteks runtime kanal generik |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Pembantu perintah/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Pembantu alur webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime lambat seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pembantu eksekusi proses |
    | `plugin-sdk/cli-runtime` | Pembantu pemformatan, tunggu, versi, pemanggilan argumen, dan grup perintah lambat CLI |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu memulai klien siap event-loop, RPC CLI gateway, kesalahan protokol gateway, dan pembantu patch status kanal |
    | `plugin-sdk/config-types` | Permukaan konfigurasi khusus tipe untuk bentuk konfigurasi Plugin seperti `OpenClawConfig` dan tipe konfigurasi kanal/penyedia |
    | `plugin-sdk/plugin-config-runtime` | Pembantu pencarian konfigurasi Plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi tautan otomatis referensi berkas tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Pembantu persetujuan eksekusi/Plugin, pembangun kapabilitas persetujuan, pembantu autentikasi/profil, pembantu perutean/runtime native, dan pemformatan jalur tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Pembantu runtime masuk/balasan bersama, pemotongan, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu dispatch/finalisasi balasan sempit dan label percakapan |
    | `plugin-sdk/reply-history` | Pembantu dan penanda riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu pemotongan teks/markdown sempit |
    | `plugin-sdk/session-store-runtime` | Pembantu jalur penyimpanan sesi, kunci sesi, diperbarui pada, dan mutasi penyimpanan |
    | `plugin-sdk/cron-store-runtime` | Pembantu jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Pembantu jalur direktori status/OAuth |
    | `plugin-sdk/routing` | Pembantu pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status kanal/akun bersama, default status runtime, dan pembantu metadata masalah |
    | `plugin-sdk/target-resolver-runtime` | Pembantu penyelesai target bersama |
    | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Pelari perintah berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter alat/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Ekstrak bidang target pengiriman kanonis dari argumen alat |
    | `plugin-sdk/temp-path` | Pembantu jalur unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Pembantu pencatat subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Pembantu mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Pembantu penimpaan model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pembantu resolusi konfigurasi penyedia bicara |
    | `plugin-sdk/json-store` | Pembantu baca/tulis status JSON kecil |
    | `plugin-sdk/file-lock` | Pembantu kunci berkas re-entrant |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache deduplikasi berbasis disk |
    | `plugin-sdk/acp-runtime` | Pembantu runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-runtime-backend` | Pembantu pendaftaran backend ACP ringan dan dispatch balasan untuk Plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi pengikatan ACP hanya-baca tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Pembantu resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pemasangan |
    | `plugin-sdk/extension-shared` | Primitif pembantu kanal pasif, status, dan proksi ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu pencantuman perintah Skill |
    | `plugin-sdk/native-command-registry` | Pembantu registri/bangun/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan Plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, pembantu arahkan/batalkan active-run, pembantu bridge alat OpenClaw, pembantu kebijakan alat rencana runtime, klasifikasi hasil terminal, pembantu pemformatan/detail progres alat, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Pembantu deteksi endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pembantu kunci asinkron lokal-proses untuk berkas status runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Pembantu telemetri aktivitas kanal |
    | `plugin-sdk/concurrency-runtime` | Pembantu konkurensi tugas asinkron terbatas |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache deduplikasi dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Pembantu pengurasan pengiriman tertunda keluar |
    | `plugin-sdk/file-access-runtime` | Pembantu jalur berkas lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Pembantu peristiwa dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Pembantu antrean peristiwa sistem |
    | `plugin-sdk/transport-ready-runtime` | Pembantu tunggu kesiapan transport |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache terbatas kecil |
    | `plugin-sdk/diagnostic-runtime` | Pembantu flag diagnostik, peristiwa, dan konteks jejak |
    | `plugin-sdk/error-runtime` | Pembantu grafik kesalahan, pemformatan, klasifikasi kesalahan bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan pembantu pencarian terpancang |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar dispatcher tanpa impor proksi/fetch-terjaga |
    | `plugin-sdk/response-limit-runtime` | Pembaca isi respons terbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | Status pengikatan percakapan saat ini tanpa perutean pengikatan terkonfigurasi atau penyimpanan pemasangan |
    | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan sesi tanpa impor penulisan/pemeliharaan konfigurasi luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan luas |
    | `plugin-sdk/string-coerce-runtime` | Pembantu koersi dan normalisasi record/string primitif sempit tanpa impor markdown/pencatatan |
    | `plugin-sdk/host-runtime` | Pembantu normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Pembantu konfigurasi coba ulang dan pelari coba ulang |
    | `plugin-sdk/agent-runtime` | Pembantu direktori/identitas/workspace agen |
    | `plugin-sdk/directory-runtime` | Kueri/deduplikasi direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kemampuan dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk mengambil/mentransformasi/menyimpan media, pemeriksaan dimensi video berbasis ffprobe, dan pembuat payload media |
    | `plugin-sdk/media-store` | Helper media store terbatas seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Jenis provider pemahaman media serta ekspor helper gambar/audio untuk provider |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper chunking teks keluar |
    | `plugin-sdk/speech` | Jenis provider speech serta ekspor direktif, registry, validasi, pembuat TTS kompatibel OpenAI, dan helper speech untuk provider |
    | `plugin-sdk/speech-core` | Ekspor bersama untuk jenis provider speech, registry, direktif, normalisasi, dan helper speech |
    | `plugin-sdk/realtime-transcription` | Jenis provider transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Jenis provider suara realtime dan helper registry |
    | `plugin-sdk/image-generation` | Jenis provider pembuatan gambar serta helper aset gambar/data URL dan pembuat provider gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Helper bersama untuk jenis pembuatan gambar, failover, auth, dan registry |
    | `plugin-sdk/music-generation` | Jenis provider/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Jenis pembuatan musik bersama, helper failover, pencarian provider, dan parsing referensi model |
    | `plugin-sdk/video-generation` | Jenis provider/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Jenis pembuatan video bersama, helper failover, pencarian provider, dan parsing referensi model |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi jalur Webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK plugin |
    | `plugin-sdk/testing` | Barrel kompatibilitas luas untuk pengujian plugin lama. Pengujian ekstensi baru sebaiknya mengimpor subpath SDK yang terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` untuk pengujian unit pendaftaran plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter agent-runtime native untuk pengujian auth, pengiriman, fallback, tool-hook, prompt-overlay, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi channel untuk kontrak tindakan/setup/status generik, assertion direktori, siklus hidup startup akun, threading send-config, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus galat resolusi target bersama untuk pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime provider, auth, discovery, onboard, katalog, wizard, kemampuan media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in untuk pengujian provider yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik untuk penangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur plugin bundel, teks terminal, chunking, token auth, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock builtin Node terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper memory-core bundel untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine foundation host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, provider lokal, dan helper batch/jarak jauh generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper query host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias netral vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Facade runtime active memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral vendor untuk helper status host memori |
  </Accordion>

  <Accordion title="Subpath helper bundel cadangan">
    Saat ini tidak ada subpath SDK helper bundel cadangan. Helper khusus pemilik
    berada di dalam paket plugin pemiliknya, sementara kontrak host yang dapat digunakan ulang
    memakai subpath SDK generik seperti `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
