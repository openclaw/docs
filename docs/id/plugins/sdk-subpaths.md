---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subjalur plugin bawaan dan antarmuka fungsi pembantu
summary: 'Katalog subpath Plugin SDK: import mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin diekspos sebagai sekumpulan subpath sempit di bawah `openclaw/plugin-sdk/`.
Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan berdasarkan tujuan. Daftar lengkap
200+ subpath yang dihasilkan berada di `scripts/lib/plugin-sdk-entrypoints.json`;
subpath pembantu Plugin bawaan yang dicadangkan muncul di sana tetapi merupakan detail
implementasi kecuali halaman dokumentasi secara eksplisit mengangkatnya. Maintainer dapat mengaudit subpath pembantu
cadangan yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor pembantu
cadangan yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik
sebagai utang kompatibilitas dorman.

Untuk panduan penulisan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri Plugin

| Subpath                                   | Ekspor utama                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Barrel kompatibilitas luas untuk pengujian Plugin lama; lebih pilih subpath pengujian terfokus untuk pengujian ekstensi baru                                                                     |
| `plugin-sdk/plugin-test-api`              | Pembuat mock `OpenClawPluginApi` minimal untuk pengujian unit pendaftaran Plugin langsung                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adaptor runtime agen native untuk profil autentikasi, penekanan pengiriman, klasifikasi fallback, hook alat, overlay prompt, skema, dan perbaikan transkrip |
| `plugin-sdk/channel-test-helpers`         | Pembantu pengujian kontrak kanal generik, balasan pemasangan, timestamp envelope, entri kanal bawaan, hook, mock runtime, konfigurasi pengiriman, direktori, dan siklus hidup akun kanal   |
| `plugin-sdk/channel-target-testing`       | Rangkaian pengujian bersama untuk kasus kesalahan resolusi target kanal                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | Pembantu kontrak untuk pendaftaran Plugin, manifes paket, artefak publik, API runtime, efek samping impor, dan impor langsung                                                  |
| `plugin-sdk/plugin-test-runtime`          | Fixture runtime Plugin, registry, pendaftaran penyedia, wizard penyiapan, dan alur tugas runtime untuk pengujian                                                                      |
| `plugin-sdk/provider-test-contracts`      | Pembantu kontrak untuk runtime penyedia, autentikasi, discovery, onboarding, katalog, kemampuan media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan wizard                 |
| `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/autentikasi Vitest opt-in untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http`                                                                                    |
| `plugin-sdk/test-env`                     | Fixture lingkungan pengujian, fetch/jaringan, server HTTP sekali pakai, permintaan masuk, pengujian langsung, sistem berkas sementara, dan kontrol waktu                                        |
| `plugin-sdk/test-fixtures`                | Fixture pengujian generik untuk CLI, sandbox, skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur Plugin bawaan, terminal, pemotongan chunk, token autentikasi, dan kasus bertipe                   |
| `plugin-sdk/test-node-mocks`              | Pembantu mock bawaan Node terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")`                                                                                        |
| `plugin-sdk/migration`                    | Pembantu item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, pembantu redaksi, dan `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | Pembantu migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod `openclaw.json` akar (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard penyiapan bersama, prompt daftar izin, builder status penyiapan |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi multi-akun/gerbang tindakan, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi ID akun |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper daftar akun/tindakan akun terbatas |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helper pipeline balasan lama. Kode pipeline balasan kanal baru sebaiknya menggunakan `createChannelMessageReplyPipeline` dan `resolveChannelMessageSourceReplyDeliveryMode` dari `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi kanal bersama plus builder Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi kanal OpenClaw bundel hanya untuk Plugin bundel yang dipelihara |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas usang untuk skema konfigurasi kanal bundel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah khusus Telegram dengan fallback kontrak bundel |
    | `plugin-sdk/command-gating` | Helper gerbang otorisasi perintah terbatas |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, dan helper siklus hidup stream draf lama. Kode finalisasi pratinjau baru sebaiknya menggunakan `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helper kontrak siklus hidup pesan murah seperti `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, facade kompatibilitas, derivasi kapabilitas final tahan lama, helper bukti kapabilitas untuk kapabilitas pengiriman/tanda terima/efek samping, `MessageReceiveContext`, bukti kebijakan ack penerimaan, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, bukti kapabilitas pratinjau langsung dan finalizer langsung, status pemulihan tahan lama, `RenderedMessageBatch`, tipe tanda terima pesan, dan helper ID tanda terima. Lihat [API pesan kanal](/id/plugins/sdk-channel-message). `createChannelTurnReplyPipeline` lama tetap hanya untuk dispatcher kompatibilitas. |
    | `plugin-sdk/channel-message-runtime` | Helper pengiriman runtime yang dapat memuat pengiriman keluar, termasuk `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase`, dan `recordChannelMessageReplyDispatch`. Gunakan dari modul runtime monitor/kirim, bukan file bootstrap Plugin panas. |
    | `plugin-sdk/inbound-envelope` | Helper rute masuk bersama + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper lama bersama untuk merekam dan mengirim masuk, predikat dispatch terlihat/final, dan kompatibilitas `deliverDurableInboundReplyPayload` usang untuk dispatcher kanal yang disiapkan. Kode penerimaan/dispatch kanal baru sebaiknya mengimpor helper siklus hidup runtime dari `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helper parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Helper pemuatan media keluar bersama |
    | `plugin-sdk/outbound-send-deps` | Pencarian dependensi kirim keluar ringan untuk adapter kanal |
    | `plugin-sdk/outbound-runtime` | Helper pengiriman keluar, identitas, delegasi kirim, sesi, pemformatan, dan perencanaan payload |
    | `plugin-sdk/poll-runtime` | Helper normalisasi polling terbatas |
    | `plugin-sdk/thread-bindings-runtime` | Helper siklus hidup dan adapter pengikatan thread |
    | `plugin-sdk/agent-media-payload` | Builder payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper percakapan/pengikatan thread, pairing, dan pengikatan terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status kanal bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi kanal terbatas |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Helper keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Helper auth/guard DM langsung bersama |
    | `plugin-sdk/discord` | Facade kompatibilitas Discord yang usang untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; Plugin baru sebaiknya menggunakan subjalur SDK kanal generik |
    | `plugin-sdk/telegram-account` | Facade kompatibilitas resolusi akun Telegram yang usang untuk kompatibilitas pemilik yang dilacak; Plugin baru sebaiknya menggunakan helper runtime yang diinjeksi atau subjalur SDK kanal generik |
    | `plugin-sdk/zalouser` | Facade kompatibilitas Zalo Personal yang usang untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; Plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper presentasi pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce masuk, pencocokan mention, helper kebijakan mention, dan helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce masuk terbatas |
    | `plugin-sdk/channel-mention-gating` | Helper kebijakan mention, penanda mention, dan teks mention terbatas tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-envelope` | Helper pemformatan envelope masuk terbatas |
    | `plugin-sdk/channel-location` | Helper konteks lokasi kanal dan pemformatan |
    | `plugin-sdk/channel-logging` | Helper logging kanal untuk drop masuk dan kegagalan typing/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper tindakan pesan kanal, plus helper skema native usang yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-route` | Helper normalisasi rute bersama, resolusi target berbasis parser, stringifikasi ID thread, kunci rute dedupe/compact, tipe target terurai, dan perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Helper parsing target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak kanal |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper kontrak rahasia terbatas seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/hosting sendiri yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia hosting sendiri yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk Plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Helper orientasi/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil auth OAuth standar |
    | `plugin-sdk/provider-auth-login` | Helper login interaktif bersama untuk Plugin penyedia |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan auth penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ekspor kompatibilitas `resolveOpenClawAgentDir` yang sudah usang |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model seperti `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint penyedia generik, galat HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan pengabelan pengaktifan Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial bercakupan |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan yang serupa |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch terjaga, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi orientasi |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup dan parsing perintah yang sempit |
  </Accordion>

  <Accordion title="Subjalur auth dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan auth tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptor kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adaptor persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; gunakan seam adaptor/Gateway yang lebih sempit jika sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan eksekusi/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan eksekusi/Plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak channel yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Auth perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Helper normalisasi body perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak secret yang sempit untuk permukaan secret channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk parsing kontrak/konfigurasi secret |
    | `plugin-sdk/security-runtime` | Helper bersama untuk trust, gating DM, file/jalur berbatas root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp saudara, fallback pemindahan lintas-perangkat, helper penyimpanan file privat, penjaga induk symlink, konten eksternal, redaksi teks sensitif, perbandingan secret waktu-konstan, dan helper pengumpulan secret |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF untuk allowlist host dan jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa permukaan runtime infrastruktur luas |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch terjaga SSRF, galat SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu luas untuk runtime/pencatatan log/cadangan/instalasi-plugin |
    | `plugin-sdk/runtime-env` | Pembantu sempit untuk env runtime, logger, batas waktu, percobaan ulang, dan backoff |
    | `plugin-sdk/browser-config` | Fasad konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol-browser |
    | `plugin-sdk/channel-runtime-context` | Pembantu pendaftaran dan pencarian konteks-runtime channel generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang tidak digunakan lagi untuk paket channel pihak ketiga lama; Plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang tidak digunakan lagi untuk paket channel pihak ketiga lama; Plugin baru sebaiknya mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Pembantu bersama untuk perintah/plugin/hook/http/interaktif Plugin |
    | `plugin-sdk/hook-runtime` | Pembantu bersama untuk alur internal Webhook/hook |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime lambat seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pembantu eksekusi proses |
    | `plugin-sdk/cli-runtime` | Pembantu CLI untuk pemformatan, tunggu, versi, pemanggilan-argumen, dan grup-perintah lambat |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu mulai klien siap-event-loop, RPC CLI Gateway, galat protokol Gateway, dan pembantu patch status-channel |
    | `plugin-sdk/config-types` | Permukaan konfigurasi khusus-tipe untuk bentuk konfigurasi Plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Pembantu pencarian konfigurasi-plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan penyetel snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan ketika permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi-file tanpa barrel text-runtime yang luas |
    | `plugin-sdk/approval-runtime` | Pembantu persetujuan exec/Plugin, pembangun kapabilitas-persetujuan, pembantu auth/profil, pembantu routing/runtime native, dan pemformatan jalur tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Pembantu runtime bersama untuk masuk/balasan, pemotongan, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu sempit untuk dispatch/finalisasi balasan dan label percakapan |
    | `plugin-sdk/reply-history` | Pembantu dan penanda riwayat-balasan jendela-pendek bersama seperti `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu sempit untuk pemotongan teks/markdown |
    | `plugin-sdk/session-store-runtime` | Pembantu jalur penyimpanan sesi, kunci-sesi, diperbarui-pada, dan mutasi penyimpanan |
    | `plugin-sdk/cron-store-runtime` | Pembantu jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Pembantu jalur direktori State/OAuth |
    | `plugin-sdk/routing` | Pembantu routing/kunci-sesi/pengikatan akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu bersama untuk ringkasan status channel/akun, default status-runtime, dan metadata masalah |
    | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param alat/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Ekstrak kolom target kirim kanonis dari arg alat |
    | `plugin-sdk/temp-path` | Pembantu jalur unduhan-sementara bersama dan ruang kerja sementara aman privat |
    | `plugin-sdk/logging-core` | Pembantu logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Pembantu mode dan konversi tabel Markdown |
    | `plugin-sdk/model-session-runtime` | Pembantu override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pembantu resolusi konfigurasi provider talk |
    | `plugin-sdk/json-store` | Pembantu kecil untuk baca/tulis status JSON |
    | `plugin-sdk/file-lock` | Pembantu kunci-file re-entrant |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Pembantu runtime/sesi ACP dan dispatch-balasan |
    | `plugin-sdk/acp-runtime-backend` | Pembantu ringan untuk pendaftaran backend ACP dan dispatch-balasan bagi Plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi pengikatan ACP baca-saja tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema-konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Pembantu resolusi pencocokan nama-berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pemasangan |
    | `plugin-sdk/extension-shared` | Primitif pembantu bersama untuk channel pasif, status, dan proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu pencantuman perintah Skill |
    | `plugin-sdk/native-command-registry` | Pembantu registry/bangun/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan Plugin tepercaya eksperimental untuk harness agen tingkat-rendah: tipe harness, pembantu kemudi/batal run-aktif, pembantu bridge alat OpenClaw, pembantu kebijakan alat rencana-runtime, klasifikasi hasil terminal, pembantu pemformatan/detail progres alat, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Pembantu deteksi endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pembantu kunci async lokal-proses untuk file status runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Pembantu telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Pembantu konkurensi tugas async berbatas |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache dedupe dalam-memori |
    | `plugin-sdk/delivery-queue-runtime` | Pembantu drain pengiriman-tertunda keluar |
    | `plugin-sdk/file-access-runtime` | Pembantu jalur file-lokal dan sumber-media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Pembantu peristiwa dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Pembantu antrean peristiwa sistem |
    | `plugin-sdk/transport-ready-runtime` | Pembantu tunggu kesiapan transport |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil berbatas |
    | `plugin-sdk/diagnostic-runtime` | Pembantu flag diagnostik, peristiwa, dan konteks-jejak |
    | `plugin-sdk/error-runtime` | Pembantu grafik galat, pemformatan, klasifikasi galat bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pembantu fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan lookup berpinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar-dispatcher tanpa impor proxy/fetch-terjaga |
    | `plugin-sdk/response-limit-runtime` | Pembaca isi-respons berbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | Status pengikatan percakapan saat ini tanpa routing pengikatan terkonfigurasi atau penyimpanan pemasangan |
    | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan-sesi tanpa impor luas untuk penulisan/pemeliharaan konfigurasi |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor luas konfigurasi/keamanan |
    | `plugin-sdk/string-coerce-runtime` | Pembantu sempit untuk koersi dan normalisasi record/string primitif tanpa impor markdown/pencatatan log |
    | `plugin-sdk/host-runtime` | Pembantu normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Pembantu konfigurasi percobaan ulang dan runner percobaan ulang |
    | `plugin-sdk/agent-runtime` | Pembantu direktori/identitas/ruang kerja agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subjalur kapabilitas dan pengujian">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk mengambil/mentransformasi/menyimpan media, pemeriksaan dimensi video berbasis ffprobe, dan pembuat payload media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio untuk penyedia |
    | `plugin-sdk/text-runtime` | Helper teks/markdown/logging bersama seperti penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper chunking teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia ucapan serta ekspor direktif, registry, validasi, pembuat TTS kompatibel OpenAI, dan helper ucapan untuk penyedia |
    | `plugin-sdk/speech-core` | Ekspor tipe penyedia ucapan bersama, registry, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime dan helper registry |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar serta helper URL aset/data gambar dan pembuat penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, failover, autentikasi, dan helper registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Helper normalisasi jalur Webhook |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | `zod` yang diekspor ulang untuk konsumen SDK Plugin |
    | `plugin-sdk/testing` | Barrel kompatibilitas luas untuk pengujian Plugin lama. Pengujian ekstensi baru sebaiknya mengimpor subjalur SDK terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` untuk pengujian unit registrasi Plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adaptor agent-runtime native untuk pengujian autentikasi, pengiriman, fallback, tool-hook, prompt-overlay, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi channel untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading send-config, mock runtime, masalah status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus kesalahan target-resolution bersama untuk pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket Plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, autentikasi, discovery, onboard, katalog, wizard, kapabilitas media, kebijakan replay, audio live STT realtime, web-search/fetch, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest opt-in untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik untuk tangkapan runtime CLI, konteks sandbox, penulis skill, agent-message, system-event, pemuatan ulang modul, jalur Plugin bawaan, terminal-text, chunking, auth-token, dan typed-case |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subjalur memori">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, penyedia lokal, dan helper batch/remote generik |
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
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias netral-vendor untuk helper file/runtime host memori |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias netral-vendor untuk helper status host memori |
  </Accordion>

  <Accordion title="Subjalur helper bawaan yang dicadangkan">
    Saat ini tidak ada subjalur SDK helper bawaan yang dicadangkan. Helper spesifik pemilik
    berada di dalam paket Plugin pemiliknya, sementara kontrak host yang dapat digunakan ulang
    memakai subjalur SDK generik seperti `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
