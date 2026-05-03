---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subjalur Plugin bawaan dan antarmuka pembantu
summary: 'Katalog subjalur Plugin SDK: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-05-03T09:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin diekspos sebagai sekumpulan subpath sempit di bawah `openclaw/plugin-sdk/`.
  Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
  200+ subpath yang dihasilkan berada di `scripts/lib/plugin-sdk-entrypoints.json`;
  subpath helper Plugin bawaan yang dicadangkan muncul di sana tetapi merupakan detail
  implementasi kecuali halaman dokumentasi secara eksplisit mempromosikannya. Maintainer dapat mengaudit subpath helper
  cadangan yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor helper cadangan
  yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik
  sebagai utang kompatibilitas dorman.

  Untuk panduan penulisan Plugin, lihat [ikhtisar SDK Plugin](/id/plugins/sdk-overview).

  ## Entri Plugin

  | Subpath                                   | Ekspor utama                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel kompatibilitas luas untuk pengujian Plugin lama; pilih subpath pengujian yang terfokus untuk pengujian ekstensi baru                                                                     |
  | `plugin-sdk/plugin-test-api`              | Pembuat mock `OpenClawPluginApi` minimal untuk pengujian unit registrasi Plugin langsung                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter agent-runtime native untuk profil auth, penekanan pengiriman, klasifikasi fallback, hook alat, overlay prompt, skema, dan perbaikan transkrip |
  | `plugin-sdk/channel-test-helpers`         | Helper pengujian siklus hidup akun kanal, direktori, konfigurasi pengiriman, mock runtime, hook, entri kanal bawaan, timestamp envelope, balasan pairing, dan kontrak kanal generik   |
  | `plugin-sdk/channel-target-testing`       | Suite pengujian bersama untuk kasus error resolusi target kanal                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Helper kontrak registrasi Plugin, manifes paket, artefak publik, API runtime, efek samping impor, dan impor langsung                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixture runtime Plugin, registry, registrasi provider, wizard setup, dan alur tugas runtime untuk pengujian                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Helper kontrak runtime provider, auth, discovery, onboard, katalog, kapabilitas media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/auth Vitest opt-in untuk pengujian provider yang menjalankan `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixture lingkungan pengujian, fetch/jaringan, server HTTP disposable, permintaan masuk, pengujian langsung, filesystem sementara, dan kontrol waktu                                        |
  | `plugin-sdk/test-fixtures`                | Fixture pengujian generik untuk CLI, sandbox, skill, pesan agen, peristiwa sistem, reload modul, path Plugin bawaan, terminal, chunking, token auth, dan kasus bertipe                   |
  | `plugin-sdk/test-node-mocks`              | Helper mock builtin Node yang terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Helper item provider migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Subpath kanal">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, prompt allowlist, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi multi-akun/action-gate, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + default-fallback |
    | `plugin-sdk/account-helpers` | Helper sempit daftar akun/tindakan akun |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi kanal bersama plus pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi kanal OpenClaw bawaan hanya untuk Plugin bawaan yang dikelola |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas deprecated untuk skema konfigurasi bundled-channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper gate otorisasi perintah sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helper siklus hidup/finalisasi draft stream |
    | `plugin-sdk/inbound-envelope` | Helper bersama untuk rute masuk + pembuat envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper bersama untuk perekaman dan dispatch masuk |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper bersama untuk pemuatan media keluar |
    | `plugin-sdk/outbound-send-deps` | Lookup dependensi pengiriman keluar yang ringan untuk adapter kanal |
    | `plugin-sdk/outbound-runtime` | Helper pengiriman keluar, identitas, delegasi pengiriman, sesi, pemformatan, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper normalisasi polling sempit |
    | `plugin-sdk/thread-bindings-runtime` | Helper adapter dan siklus hidup thread-binding |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper percakapan/thread binding, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper bersama untuk snapshot/ringkasan status kanal |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi kanal sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper bersama untuk keputusan akses grup |
    | `plugin-sdk/direct-dm` | Helper auth/guard direct-DM bersama |
    | `plugin-sdk/discord` | Facade kompatibilitas Discord deprecated untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan subpath SDK kanal generik |
    | `plugin-sdk/telegram-account` | Facade kompatibilitas resolusi akun Telegram deprecated untuk kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan helper runtime yang diinjeksi atau subpath SDK kanal generik |
    | `plugin-sdk/zalouser` | Facade kompatibilitas Zalo Personal deprecated untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; Plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper presentasi pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce masuk, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce masuk sempit |
    | `plugin-sdk/channel-mention-gating` | Helper kebijakan mention, penanda mention, dan teks mention yang sempit tanpa surface runtime masuk yang lebih luas |
    | `plugin-sdk/channel-envelope` | Helper pemformatan envelope masuk yang sempit |
    | `plugin-sdk/channel-location` | Helper konteks lokasi kanal dan pemformatan |
    | `plugin-sdk/channel-logging` | Helper logging kanal untuk drop masuk dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper tindakan pesan kanal, plus helper skema native deprecated yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-route` | Helper bersama untuk normalisasi rute, resolusi target berbasis parser, stringifikasi thread-id, kunci rute dedupe/compact, tipe parsed-target, dan perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Helper parsing target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak kanal |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak secret sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model saat runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk bawaan server lokal, penemuan model, header permintaan, dan pembantu model yang dimuat |
    | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/di-host sendiri yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia di-host sendiri yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Bawaan backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pembantu resolusi kunci API runtime untuk plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Pembantu onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Pembangun hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-auth-login` | Pembantu login interaktif bersama untuk plugin penyedia |
    | `plugin-sdk/provider-env-vars` | Pembantu pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembangun kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registry penyedia plugin untuk uji kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Pembantu kemampuan HTTP/endpoint penyedia generik, kesalahan HTTP penyedia, dan pembantu formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Pembantu kontrak konfigurasi/pemilihan pengambilan web yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pembantu registrasi/cache penyedia pengambilan web |
    | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi/kredensial pencarian web yang sempit untuk penyedia yang tidak memerlukan pengkabelan pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak konfigurasi/kredensial pencarian web yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskop |
    | `plugin-sdk/provider-web-search` | Pembantu registrasi/cache/runtime penyedia pencarian web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan pembantu kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan pembantu wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia native seperti fetch terlindungi, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Pembantu patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Pembantu singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Pembantu mode aktivasi grup sempit dan penguraian perintah |
  </Accordion>

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pembantu registry perintah termasuk pemformatan menu argumen dinamis, pembantu otorisasi pengirim |
    | `plugin-sdk/command-status` | Pembangun pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pembantu resolusi penyetuju dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Pembantu profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Pembantu resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu pemuatan adapter persetujuan native ringan untuk entrypoint kanal panas |
    | `plugin-sdk/approval-handler-runtime` | Pembantu runtime penangan persetujuan yang lebih luas; pilih seam adapter/gateway yang lebih sempit ketika sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Pembantu payload balasan persetujuan eksekusi/plugin |
    | `plugin-sdk/approval-runtime` | Pembantu payload persetujuan eksekusi/plugin, pembantu perutean/runtime persetujuan native, dan pembantu tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Pembantu reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Pembantu uji kontrak kanal yang sempit tanpa barrel pengujian yang luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan pembantu target sesi native |
    | `plugin-sdk/command-detection` | Pembantu deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur kanal panas |
    | `plugin-sdk/command-surface` | Pembantu normalisasi isi perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Pembantu koleksi kontrak rahasia yang sempit untuk permukaan rahasia kanal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Pembantu pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk penguraian kontrak/konfigurasi rahasia |
    | `plugin-sdk/security-runtime` | Pembantu kepercayaan bersama, pembatasan DM, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Pembantu allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Pembantu dispatcher terpin yang sempit tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Pembantu dispatcher terpin, fetch yang dilindungi SSRF, kesalahan SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Pembantu penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Pembantu permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Pembantu ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/plugin-install yang luas |
    | `plugin-sdk/runtime-env` | Helper runtime env, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Fasad konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, parsing URL CDP, dan helper autentikasi kontrol browser |
    | `plugin-sdk/channel-runtime-context` | Helper pendaftaran dan pencarian runtime-context channel generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang sudah tidak digunakan untuk paket channel pihak ketiga lama; plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang sudah tidak digunakan untuk paket channel pihak ketiga lama; plugin baru sebaiknya mengimpor subpath SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, wait, version, argument-invocation, dan command-group lazy |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, helper start klien event-loop-ready, RPC CLI gateway, error protokol gateway, dan helper patch status channel |
    | `plugin-sdk/config-types` | Permukaan konfigurasi khusus tipe untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper pencarian plugin-config runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Helper approval exec/plugin, pembuat kapabilitas approval, helper auth/profil, helper routing/runtime native, dan pemformatan path tampilan approval terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/reply bersama, chunking, dispatch, heartbeat, perencana reply |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalize reply yang sempit dan helper label percakapan |
    | `plugin-sdk/reply-history` | Helper reply-history jendela pendek bersama dan marker seperti `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper path penyimpanan sesi, session-key, updated-at, dan mutasi store |
    | `plugin-sdk/cron-store-runtime` | Helper path/load/save store Cron |
    | `plugin-sdk/state-paths` | Helper path dir State/OAuth |
    | `plugin-sdk/routing` | Helper binding route/session-key/account seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/account bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper target resolver bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input seperti fetch/request |
    | `plugin-sdk/run-command` | Runner command berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak kolom target kirim kanonis dari arg tool |
    | `plugin-sdk/temp-path` | Helper path temp-download bersama |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi provider Talk |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Helper pendaftaran backend ACP ringan dan reply-dispatch untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP baca-saja tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitif config-schema runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper passive-channel, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar command Skill |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize command native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agent tingkat rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper pemformatan/detail progres tool, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Helper deteksi endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lock async lokal-proses untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi task async berbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pending-delivery keluar |
    | `plugin-sdk/file-access-runtime` | Helper path file lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper event Heartbeat dan visibilitas |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper tunggu kesiapan transport |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang sudah tidak digunakan; gunakan subpath runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache kecil berbatas |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Graph error, pemformatan, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan helper lookup yang dipin |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar-dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader response-body berbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store tanpa impor penulisan/pemeliharaan konfigurasi luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper dir/identitas/workspace agent |
    | `plugin-sdk/directory-runtime` | Query/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subjalur kemampuan dan pengujian">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk mengambil/mentransformasi/menyimpan media, pemeriksaan dimensi video berbasis ffprobe, dan pembuat payload media |
    | `plugin-sdk/media-store` | Helper penyimpanan media yang sempit seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover generasi media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio untuk penyedia |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/pemotongan/tabel markdown, helper redaksi, helper tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia ucapan serta ekspor direktif, registry, validasi, pembuat TTS kompatibel OpenAI, dan helper ucapan untuk penyedia |
    | `plugin-sdk/speech-core` | Ekspor tipe penyedia ucapan bersama, registry, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi waktu nyata, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara waktu nyata dan helper registry |
    | `plugin-sdk/image-generation` | Tipe penyedia generasi gambar serta helper aset gambar/data URL dan pembuat penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Helper tipe generasi gambar bersama, failover, auth, dan registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil generasi musik |
    | `plugin-sdk/music-generation-core` | Tipe generasi musik bersama, helper failover, pencarian penyedia, dan parsing ref model |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil generasi video |
    | `plugin-sdk/video-generation-core` | Tipe generasi video bersama, helper failover, pencarian penyedia, dan parsing ref model |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi path Webhook |
    | `plugin-sdk/web-media` | Helper bersama untuk memuat media jarak jauh/lokal |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK plugin |
    | `plugin-sdk/testing` | Barrel kompatibilitas luas untuk pengujian Plugin lama. Pengujian ekstensi baru sebaiknya mengimpor subjalur SDK yang terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` untuk pengujian unit registrasi Plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native untuk pengujian auth, pengiriman, fallback, tool-hook, prompt-overlay, schema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi channel untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading send-config, mock runtime, isu status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus galat resolusi target bersama untuk pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket Plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, auth, discovery, onboard, katalog, wizard, kemampuan media, kebijakan replay, audio live STT waktu nyata, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik untuk tangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, event sistem, reload modul, path Plugin bawaan, teks terminal, pemotongan, token auth, dan typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node yang terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subjalur memori">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, penyedia lokal, dan helper batch/jarak jauh generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memori |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias netral vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral vendor untuk helper status host memori |
  </Accordion>

  <Accordion title="Subjalur helper bawaan yang dicadangkan">
    Saat ini tidak ada subjalur SDK helper bawaan yang dicadangkan. Helper khusus pemilik
    berada di dalam paket Plugin pemiliknya, sementara kontrak host yang dapat digunakan ulang
    menggunakan subjalur SDK generik seperti `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
