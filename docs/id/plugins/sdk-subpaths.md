---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor plugin
    - Mengaudit subjalur Plugin bawaan dan antarmuka pembantu
summary: 'Katalog subjalur SDK Plugin: lokasi setiap impor, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:48:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin diekspos sebagai sekumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan,
dikelompokkan berdasarkan tujuan. Inventaris entrypoint compiler yang dihasilkan
berada di `scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket adalah subset
publik setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer dapat
mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath
helper cadangan aktif dengan `pnpm plugins:boundary-report:summary`; ekspor
helper cadangan yang tidak digunakan akan menggagalkan laporan CI alih-alih
tetap berada di SDK publik sebagai utang kompatibilitas dorman.

Untuk panduan penulisan plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri plugin

| Subpath                        | Ekspor utama                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                 |

### Kompatibilitas dan helper pengujian yang tidak digunakan lagi

Subpath ini tetap menjadi ekspor paket untuk plugin lama dan suite pengujian
OpenClaw, tetapi kode baru tidak boleh menambahkan impor dari subpath ini:
`agent-runtime-test-contracts`, `channel-contract-testing`,
`channel-target-testing`, `channel-test-helpers`, `plugin-test-api`,
`plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, dan `zod`. Impor `zod` langsung dari `zod` dalam kode plugin baru.
`plugin-test-runtime` masih merupakan subpath helper pengujian terfokus yang aktif.

### Subpath publik tidak digunakan yang tidak digunakan lagi

Subpath publik ini sudah ada setidaknya selama satu bulan dan saat ini tidak
memiliki impor produksi ekstensi bawaan. Subpath ini tetap dapat diimpor untuk
kompatibilitas, tetapi kode plugin baru sebaiknya menggunakan subpath SDK
terfokus yang aktif dikonsumsi sebagai gantinya: `agent-config-primitives`,
`channel-config-schema-legacy`, `channel-reply-pipeline`, `channel-runtime`,
`channel-secret-runtime`, `command-auth`, `compat`, `config-runtime`,
`config-schema`, `discord`, `group-access`, `infra-runtime`, `matrix`,
`mattermost`, `media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, dan `zalouser`.

### Subpath publik jarang digunakan yang tidak digunakan lagi

Subpath publik yang saat ini hanya digunakan oleh satu atau dua pemilik plugin
bawaan juga tidak digunakan lagi untuk kode plugin baru. Subpath ini tetap
menjadi ekspor paket untuk kompatibilitas, tetapi kode baru sebaiknya memilih
seam SDK yang aktif dibagikan atau API paket milik plugin. Maintainer melacak
set persisnya di `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` dan
anggaran saat ini dengan `pnpm plugin-sdk:surface`.

### Barrel luas yang tidak digunakan lagi

Barrel re-ekspor luas ini tetap dapat dibangun untuk sumber OpenClaw dan
pemeriksaan kompatibilitas, tetapi kode baru sebaiknya memilih subpath SDK
terfokus: `agent-runtime`, `channel-lifecycle`, `channel-runtime`,
`cli-runtime`, `compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, dan
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
dan `text-runtime` tetap menjadi ekspor paket hanya untuk kompatibilitas mundur;
gunakan subpath channel/runtime terfokus, `config-contracts`,
`string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan
`logging-core` sebagai gantinya.

  <AccordionGroup>
  <Accordion title="Subjalur kanal">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi JSON Schema bercache untuk skema milik Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, prompt daftar izin, pembangun status penyiapan |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang usang; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multi-akun/gerbang tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi id akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu daftar akun/tindakan akun yang sempit |
    | `plugin-sdk/access-groups` | Pembantu penguraian daftar izin grup akses dan diagnostik grup yang disunting |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Pembantu pipeline balasan lama. Kode pipeline balasan kanal baru harus menggunakan `createChannelMessageReplyPipeline` dan `resolveChannelMessageSourceReplyDeliveryMode` dari `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi kanal bersama plus pembangun Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi kanal OpenClaw bawaan hanya untuk Plugin bawaan yang dipelihara |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas usang untuk skema konfigurasi kanal bawaan |
    | `plugin-sdk/telegram-command-config` | Pembantu normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Pembantu gerbang otorisasi perintah yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fasad kompatibilitas ingress kanal level rendah yang usang. Jalur penerimaan baru harus menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress kanal level tinggi eksperimental dan pembangun fakta rute untuk jalur penerimaan kanal yang dimigrasikan. Lebih disarankan daripada menyusun daftar izin efektif, daftar izin perintah, dan proyeksi lama di setiap Plugin. Lihat [API ingress kanal](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, dan pembantu siklus hidup stream draf lama. Kode finalisasi pratinjau baru harus menggunakan `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Pembantu kontrak siklus hidup pesan murah seperti `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivasi kapabilitas final tahan lama, pembantu bukti kapabilitas untuk kapabilitas pengiriman/tanda terima/efek samping, `MessageReceiveContext`, bukti kebijakan ack penerimaan, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, bukti kapabilitas pratinjau langsung dan finalizer langsung, status pemulihan tahan lama, `RenderedMessageBatch`, tipe tanda terima pesan, dan pembantu id tanda terima. Lihat [API pesan kanal](/id/plugins/sdk-channel-message). Fasad dispatch balasan lama hanya kompatibilitas yang usang. |
    | `plugin-sdk/channel-message-runtime` | Pembantu pengiriman runtime yang dapat memuat pengiriman outbound, termasuk `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, dan `withDurableMessageSendContext`. Bridge dispatch balasan yang usang tetap dapat diimpor hanya untuk dispatcher kompatibilitas. Gunakan dari modul runtime pemantauan/pengiriman, bukan file bootstrap Plugin panas. |
    | `plugin-sdk/inbound-envelope` | Pembantu rute inbound + pembangun envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Pembantu lama bersama untuk merekam dan men-dispatch inbound, predikat dispatch terlihat/final, dan kompatibilitas `deliverDurableInboundReplyPayload` yang usang untuk dispatcher kanal yang disiapkan. Kode penerimaan/dispatch kanal baru harus mengimpor pembantu siklus hidup runtime dari `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Pembantu penguraian/pencocokan target |
    | `plugin-sdk/outbound-media` | Pembantu pemuatan media outbound bersama |
    | `plugin-sdk/outbound-send-deps` | Pencarian dependensi pengiriman outbound ringan untuk adapter kanal |
    | `plugin-sdk/outbound-runtime` | Pembantu identitas outbound, delegasi pengiriman, sesi, pemformatan, dan perencanaan payload. Pembantu pengiriman langsung seperti `deliverOutboundPayloads` adalah substrat kompatibilitas yang usang; gunakan `plugin-sdk/channel-message-runtime` untuk jalur pengiriman baru. |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi polling yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu siklus hidup binding utas dan adapter |
    | `plugin-sdk/agent-media-payload` | Pembangun payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Pembantu percakapan/binding utas, pemasangan, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu snapshot/ringkasan status kanal bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi kanal yang sempit |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu edit/baca konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Pembantu keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Pembantu auth/guard DM langsung bersama |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang usang untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; Plugin baru harus menggunakan subjalur SDK kanal generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang usang untuk kompatibilitas pemilik yang dilacak; Plugin baru harus menggunakan pembantu runtime yang diinjeksi atau subjalur SDK kanal generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal yang usang untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; Plugin baru harus menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan pembantu balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce inbound, pencocokan mention, pembantu kebijakan mention, dan pembantu envelope |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce inbound yang sempit |
    | `plugin-sdk/channel-mention-gating` | Pembantu kebijakan mention, marker mention, dan teks mention yang sempit tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope` | Pembantu pemformatan envelope inbound yang sempit |
    | `plugin-sdk/channel-location` | Konteks lokasi kanal dan pembantu pemformatan |
    | `plugin-sdk/channel-logging` | Pembantu logging kanal untuk drop inbound dan kegagalan mengetik/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan kanal, plus pembantu skema native yang usang yang dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-route` | Normalisasi rute bersama, resolusi target berbasis parser, stringifikasi id utas, kunci rute dedupe/compact, tipe target terurai, dan pembantu perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu penguraian target; pemanggil perbandingan rute harus menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak kanal |
    | `plugin-sdk/channel-feedback` | Pengabelan umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Pembantu kontrak rahasia yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ekspor kompatibilitas `resolveOpenClawAgentDir` yang sudah tidak digunakan |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint penyedia generik, error HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan pengabelan aktivasi plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskala |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema Gemini + diagnostik |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch berpelindung, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup dan parsing perintah yang sempit |
  </Accordion>

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; pilih seam adapter/Gateway yang lebih sempit saat sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak channel yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Helper normalisasi isi perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia yang sempit untuk permukaan rahasia channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk parsing kontrak/konfigurasi rahasia |
    | `plugin-sdk/security-runtime` | Helper kepercayaan, gating DM, file/path berbatas root bersama termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp sibling, fallback pemindahan lintas perangkat, helper penyimpanan file privat, guard induk symlink, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan helper pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher terpin sempit tanpa permukaan runtime infrastruktur luas |
    | `plugin-sdk/ssrf-runtime` | Dispatcher terpin, fetch berpelindung SSRF, error SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Subjalur runtime dan penyimpanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/cadangan/pemasangan-plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Fasad konfigurasi browser yang didukung untuk profil/default ternormalisasi, penguraian URL CDP, dan helper autentikasi kontrol-browser |
    | `plugin-sdk/channel-runtime-context` | Helper registrasi dan pencarian konteks runtime channel generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang tidak digunakan lagi untuk paket channel pihak ketiga lama; plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang tidak digunakan lagi untuk paket channel pihak ketiga lama; plugin baru sebaiknya mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime malas seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper eksekusi proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, tunggu, versi, pemanggilan argumen, dan grup command malas |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, helper memulai klien yang siap event loop, RPC CLI gateway, galat protokol gateway, dan helper patch status channel |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper pencarian konfigurasi plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel teks yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder kapabilitas persetujuan, helper auth/profil, helper routing/runtime native, dan pemformatan jalur tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/reply bersama, chunking, dispatch, heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan dan label percakapan yang sempit |
    | `plugin-sdk/reply-history` | Helper dan marker riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper jalur penyimpanan sesi, kunci sesi, diperbarui-pada, dan mutasi penyimpanan |
    | `plugin-sdk/cron-store-runtime` | Helper jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Helper jalur direktori state/OAuth |
    | `plugin-sdk/routing` | Helper binding rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default state runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command berwaktu dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Mengekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper jalur unduhan sementara bersama dan workspace sementara aman privat |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode dan konversi tabel Markdown |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi provider Talk |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-runtime-backend` | Helper registrasi backend ACP ringan dan dispatch balasan untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP hanya-baca tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive skema konfigurasi runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitive helper passive-channel, status, dan proksi ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar command Skill |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize command native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agent tingkat rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper pemformatan/detail progres tool, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Fasad deteksi endpoint milik provider Z.AI yang tidak digunakan lagi; gunakan API publik plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lock async lokal proses untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi tugas async berbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Helper pengurasan pengiriman tertunda outbound |
    | `plugin-sdk/file-access-runtime` | Helper jalur file lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper bangun, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper tunggu kesiapan transport |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache kecil berbatas |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Helper grafik galat, pemformatan, klasifikasi galat bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan helper lookup yang dipin |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader body respons berbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau penyimpanan pairing |
    | `plugin-sdk/session-store-runtime` | Helper penyimpanan sesi tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitive yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agent, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper pengambilan/transformasi/penyimpanan media bersama, pemeriksaan dimensi video berbasis ffprobe, dan pembangun payload media |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio untuk penyedia |
    | `plugin-sdk/text-chunking` | Helper pemotongan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia ucapan serta ekspor direktif, registry, validasi, pembangun TTS yang kompatibel dengan OpenAI, dan helper ucapan untuk penyedia |
    | `plugin-sdk/speech-core` | Tipe penyedia ucapan bersama, registry, direktif, normalisasi, dan ekspor helper ucapan |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime dan helper registry |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar serta helper URL aset/data gambar dan pembangun penyedia gambar yang kompatibel dengan OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, failover, autentikasi, dan helper registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan penguraian referensi model |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan penguraian referensi model |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang tidak digunakan lagi; impor `zod` dari `zod` secara langsung |
    | `plugin-sdk/testing` | Barrel kompatibilitas repo-lokal yang tidak digunakan lagi untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subpath pengujian lokal terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` minimal repo-lokal untuk pengujian unit pendaftaran plugin langsung tanpa mengimpor jembatan helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native repo-lokal untuk pengujian autentikasi, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi kanal repo-lokal untuk kontrak tindakan/penyiapan/status generik, asersi direktori, siklus hidup startup akun, threading konfigurasi pengiriman, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus galat resolusi target bersama repo-lokal untuk pengujian kanal |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor repo-lokal |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, autentikasi, discovery, onboard, katalog, wizard, kapabilitas media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan stream repo-lokal |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest opt-in repo-lokal untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik repo-lokal untuk penangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur plugin bawaan, teks terminal, pemotongan, token autentikasi, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus repo-lokal untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manajer/konfigurasi/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, penyedia lokal, dan helper batch/jarak jauh generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori |
    | `plugin-sdk/memory-core-host-events` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses manajer pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    Saat ini tidak ada subpath SDK helper bawaan yang dicadangkan. Helper khusus pemilik
    berada di dalam paket plugin pemilik, sementara kontrak host yang dapat digunakan kembali
    menggunakan subpath SDK generik seperti `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Penyiapan Plugin SDK](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
