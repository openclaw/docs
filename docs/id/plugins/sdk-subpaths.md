---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subjalur Plugin bawaan dan permukaan pembantu
summary: 'Katalog subjalur SDK Plugin: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin diekspos sebagai sekumpulan subpath sempit di bawah `openclaw/plugin-sdk/`.
  Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan menurut tujuan. Daftar
  lengkap hasil generasi berisi 200+ subpath berada di `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath helper bundled-plugin yang dicadangkan muncul di sana, tetapi merupakan detail
  implementasi kecuali halaman dokumentasi secara eksplisit mempromosikannya. Maintainer dapat mengaudit subpath
  helper dicadangkan yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor helper
  dicadangkan yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik
  sebagai utang kompatibilitas dorman.

  Untuk panduan penulisan Plugin, lihat [Ringkasan SDK Plugin](/id/plugins/sdk-overview).

  ## Entri Plugin

  | Subpath                                   | Ekspor utama                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel kompatibilitas luas untuk pengujian Plugin lama; gunakan subpath pengujian terfokus untuk pengujian ekstensi baru                                                     |
  | `plugin-sdk/plugin-test-api`              | Builder mock `OpenClawPluginApi` minimal untuk pengujian unit pendaftaran Plugin langsung                                                                                    |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter agent-runtime native untuk profil auth, supresi pengiriman, klasifikasi fallback, hook alat, overlay prompt, skema, dan perbaikan transkrip |
  | `plugin-sdk/channel-test-helpers`         | Helper pengujian kontrak channel generik serta lifecycle akun channel, direktori, send-config, mock runtime, hook, entri channel bawaan, timestamp envelope, dan balasan pairing   |
  | `plugin-sdk/channel-target-testing`       | Suite pengujian bersama untuk kasus kesalahan resolusi target channel                                                                                                         |
  | `plugin-sdk/plugin-test-contracts`        | Helper kontrak untuk pendaftaran Plugin, manifes paket, artefak publik, API runtime, efek samping impor, dan impor langsung                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixture runtime Plugin, registry, pendaftaran provider, wizard penyiapan, dan task-flow runtime untuk pengujian                                                              |
  | `plugin-sdk/provider-test-contracts`      | Helper kontrak untuk runtime provider, auth, discovery, onboard, katalog, kapabilitas media, kebijakan replay, audio langsung STT realtime, web-search/fetch, dan wizard     |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/auth Vitest opt-in untuk pengujian provider yang menguji `plugin-sdk/provider-http`                                                                                |
  | `plugin-sdk/test-env`                     | Fixture lingkungan pengujian, fetch/jaringan, server HTTP sekali pakai, permintaan masuk, live-test, filesystem sementara, dan kontrol waktu                                 |
  | `plugin-sdk/test-fixtures`                | Fixture pengujian generik untuk CLI, sandbox, skill, agent-message, system-event, muat ulang modul, path Plugin bawaan, terminal, chunking, auth-token, dan typed-case       |
  | `plugin-sdk/test-node-mocks`              | Helper mock bawaan Node yang terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")`                                                                             |
  | `plugin-sdk/migration`                    | Helper item provider migrasi seperti `createMigrationItem`, konstanta alasan, marker status item, helper redaksi, dan `summarizeMigrationItems`                              |
  | `plugin-sdk/migration-runtime`            | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                       |

  <AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, serta `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard penyiapan bersama, prompt allowlist, builder status penyiapan |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi multi-akun/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + default-fallback |
    | `plugin-sdk/account-helpers` | Helper sempit untuk daftar akun/aksi akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama serta builder Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi channel OpenClaw bawaan hanya untuk Plugin bawaan yang dikelola |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas usang untuk skema konfigurasi bundled-channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback bundled-contract |
    | `plugin-sdk/command-gating` | Helper gate otorisasi perintah sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helper lifecycle/finalisasi draft stream |
    | `plugin-sdk/inbound-envelope` | Helper bersama untuk rute inbound + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper bersama untuk pencatatan-dan-dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound bersama |
    | `plugin-sdk/outbound-send-deps` | Pencarian dependensi pengiriman outbound ringan untuk adapter channel |
    | `plugin-sdk/outbound-runtime` | Helper pengiriman outbound, identitas, delegasi pengiriman, sesi, pemformatan, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper normalisasi polling sempit |
    | `plugin-sdk/thread-bindings-runtime` | Helper lifecycle dan adapter thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder payload media agent lama |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif sempit skema konfigurasi channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper keputusan group-access bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard direct-DM bersama |
    | `plugin-sdk/discord` | Facade kompatibilitas Discord yang usang untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan subpath SDK channel generik |
    | `plugin-sdk/telegram-account` | Facade kompatibilitas resolusi akun Telegram yang usang untuk kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan helper runtime terinjeksi atau subpath SDK channel generik |
    | `plugin-sdk/zalouser` | Facade kompatibilitas Zalo Personal yang usang untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; Plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper presentasi pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce inbound, pencocokan mention, helper mention-policy, dan helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce inbound sempit |
    | `plugin-sdk/channel-mention-gating` | Helper sempit untuk mention-policy, marker mention, dan teks mention tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope` | Helper pemformatan envelope inbound sempit |
    | `plugin-sdk/channel-location` | Helper konteks lokasi channel dan pemformatan |
    | `plugin-sdk/channel-logging` | Helper logging channel untuk drop inbound dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper aksi pesan channel, serta helper skema native usang yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-route` | Helper bersama untuk normalisasi rute, resolusi target berbasis parser, stringifikasi thread-id, kunci rute dedupe/compact, tipe parsed-target, dan perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Helper parsing target; caller perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Pengkabelan feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper secret-contract sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasade penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasade runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk plugin penyedia |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint penyedia generik, galat HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search sempit untuk penyedia yang tidak memerlukan wiring pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial bercakupan |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime penyedia web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch yang dijaga, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup sempit dan penguraian perintah |
  </Accordion>

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint kanal panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit ketika sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan eksekusi/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan eksekusi/plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak kanal sempit tanpa barrel pengujian yang luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur kanal panas |
    | `plugin-sdk/command-surface` | Helper normalisasi isi perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia sempit untuk permukaan rahasia kanal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef sempit untuk penguraian kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Helper kepercayaan, gating DM, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan pengumpulan rahasia bersama |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan allowlist host dan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher tersemat sempit tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper dispatcher tersemat, fetch yang dijaga SSRF, galat SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/plugin-install yang luas |
    | `plugin-sdk/runtime-env` | Helper runtime env, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Facade konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, parsing URL CDP, dan helper auth kontrol browser |
    | `plugin-sdk/channel-runtime-context` | Helper pendaftaran dan pencarian runtime-context channel generik |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/pengikatan runtime malas seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper CLI untuk pemformatan, tunggu, versi, pemanggilan argumen, dan grup command malas |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, helper start klien siap event-loop, RPC CLI gateway, error protokol gateway, dan helper patch status-channel |
    | `plugin-sdk/config-types` | Permukaan konfigurasi khusus tipe untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper pencarian plugin-config runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot test |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder kapabilitas persetujuan, helper auth/profil, helper routing/runtime native, dan pemformatan path tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/reply bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan dan label percakapan yang sempit |
    | `plugin-sdk/reply-history` | Helper dan penanda riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path store sesi, kunci sesi, updated-at, dan mutasi store |
    | `plugin-sdk/cron-store-runtime` | Helper path/load/save store Cron |
    | `plugin-sdk/state-paths` | Helper path direktori State/OAuth |
    | `plugin-sdk/routing` | Helper pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak bidang target kirim kanonis dari arg tool |
    | `plugin-sdk/temp-path` | Helper path unduhan sementara bersama |
    | `plugin-sdk/logging-core` | Helper logger subsystem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi provider talk |
    | `plugin-sdk/json-store` | Helper kecil baca/tulis status JSON |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Helper ringan pendaftaran backend ACP dan reply-dispatch untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP read-only tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan dangerous-name |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper bersama untuk channel pasif, status, dan proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper balasan command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar command Skills |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize command native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agent tingkat rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper pemformatan/detail progres tool, dan utilitas hasil upaya |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lock async process-local untuk file status runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi task async terbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pengiriman tertunda outbound |
    | `plugin-sdk/file-access-runtime` | Helper path file lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper event dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper tunggu kesiapan transport |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subpath runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache kecil berbatas |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Helper graph error, pemformatan, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan helper pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Pembaca response-body terbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | Status binding percakapan saat ini tanpa routing binding yang dikonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agent |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk mengambil/mengubah/menyimpan media, pemeriksaan dimensi video berbasis ffprobe, dan pembangun payload media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Jenis penyedia pemahaman media plus ekspor helper gambar/audio yang ditujukan untuk penyedia |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/pencatatan bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/pemotongan/tabel markdown, helper redaksi, helper tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Jenis penyedia ucapan plus ekspor helper direktif, registri, validasi, pembangun TTS kompatibel OpenAI, dan ucapan yang ditujukan untuk penyedia |
    | `plugin-sdk/speech-core` | Ekspor jenis penyedia ucapan bersama, registri, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/realtime-transcription` | Jenis penyedia transkripsi waktu nyata, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Jenis penyedia suara waktu nyata dan helper registri |
    | `plugin-sdk/image-generation` | Jenis penyedia pembuatan gambar plus helper aset gambar/data URL dan pembangun penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Helper jenis pembuatan gambar bersama, failover, autentikasi, dan registri |
    | `plugin-sdk/music-generation` | Jenis penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Jenis pembuatan musik bersama, helper failover, pencarian penyedia, dan penguraian model-ref |
    | `plugin-sdk/video-generation` | Jenis penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Jenis pembuatan video bersama, helper failover, pencarian penyedia, dan penguraian model-ref |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi jalur Webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK plugin |
    | `plugin-sdk/testing` | Barrel kompatibilitas luas untuk pengujian plugin lama. Pengujian ekstensi baru sebaiknya mengimpor subpath SDK yang terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` minimal untuk pengujian unit registrasi plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native untuk pengujian autentikasi, pengiriman, fallback, tool-hook, prompt-overlay, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi kanal untuk kontrak tindakan/penyiapan/status generik, asersi direktori, siklus hidup startup akun, threading send-config, mock runtime, masalah status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus kesalahan resolusi target bersama untuk pengujian kanal |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, autentikasi, penemuan, onboarding, katalog, wizard, kapabilitas media, kebijakan replay, audio langsung STT waktu nyata, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest opsional untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik untuk penangkapan runtime CLI, konteks sandbox, penulis skill, agent-message, system-event, pemuatan ulang modul, jalur plugin bawaan, terminal-text, pemotongan, auth-token, dan typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node yang terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/konfigurasi/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasade runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registri, penyedia lokal, dan helper batch/jarak jauh generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
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
    | `plugin-sdk/memory-host-search` | Fasade runtime active memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral vendor untuk helper status host memori |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    Saat ini tidak ada subpath SDK helper bawaan yang dicadangkan. Helper khusus pemilik
    berada di dalam paket plugin pemiliknya, sementara kontrak host yang dapat digunakan kembali
    menggunakan subpath SDK generik seperti `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ringkasan SDK plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
