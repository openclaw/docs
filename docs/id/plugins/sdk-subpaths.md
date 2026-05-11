---
read_when:
    - Memilih subjalur plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subjalur Plugin terbundel dan antarmuka pembantu
summary: 'Katalog subpath SDK Plugin: import mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-05-11T20:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin diekspos sebagai kumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan,
dikelompokkan menurut tujuan. Inventaris entrypoint compiler yang dihasilkan berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket adalah subset publik
setelah mengurangi subpath pengujian/internal lokal-repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer dapat mengaudit
jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath helper cadangan
aktif dengan `pnpm plugins:boundary-report:summary`; ekspor helper cadangan yang tidak
digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik sebagai
utang kompatibilitas dorman.

Untuk panduan penulisan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri Plugin

| Subpath                        | Ekspor utama                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                 |

### Kompatibilitas dan helper pengujian yang tidak digunakan lagi

Subpath ini tetap menjadi ekspor paket untuk Plugin lama dan suite pengujian OpenClaw,
tetapi kode baru sebaiknya tidak menambahkan impor dari sana: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime`, dan `zod`. Impor `zod` langsung dari `zod` di kode Plugin baru.
`plugin-test-runtime` masih merupakan subpath helper pengujian terfokus yang aktif.

### Subpath publik tak terpakai yang tidak digunakan lagi

Subpath publik ini sudah ada setidaknya selama satu bulan dan saat ini tidak memiliki
impor produksi extension bawaan. Subpath ini tetap dapat diimpor untuk kompatibilitas,
tetapi kode Plugin baru sebaiknya menggunakan subpath SDK yang terfokus dan aktif
dikonsumsi sebagai gantinya:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config`, dan `zalouser`.

### Subpath publik jarang digunakan yang tidak digunakan lagi

Subpath publik yang saat ini hanya digunakan oleh satu atau dua pemilik Plugin bawaan juga
tidak digunakan lagi untuk kode Plugin baru. Subpath ini tetap menjadi ekspor paket untuk
kompatibilitas, tetapi kode baru sebaiknya memilih seam SDK yang dibagikan secara aktif atau
API paket milik Plugin. Maintainer melacak set persisnya di
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` dan anggaran saat ini
dengan `pnpm plugin-sdk:surface`.

### Barrel luas yang tidak digunakan lagi

Barrel re-ekspor luas ini tetap dapat dibangun untuk sumber OpenClaw dan
pemeriksaan kompatibilitas, tetapi kode baru sebaiknya memilih subpath SDK yang terfokus:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime`, dan
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
dan `text-runtime` tetap menjadi ekspor paket hanya untuk kompatibilitas mundur; gunakan
subpath channel/runtime yang terfokus, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime`, dan `logging-core` sebagai gantinya.

  <AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod `openclaw.json` root (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi JSON Schema bercache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, prompt allowlist, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multi-akun/gate tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi ID akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu sempit untuk daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Pembantu parsing allowlist grup akses dan diagnostik grup yang disunting |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Pembantu pipeline balasan lama. Kode pipeline balasan channel baru harus menggunakan `createChannelMessageReplyPipeline` dan `resolveChannelMessageSourceReplyDeliveryMode` dari `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama plus pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi channel OpenClaw bawaan hanya untuk plugin bawaan yang dipelihara |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas yang tidak digunakan lagi untuk skema konfigurasi channel bawaan |
    | `plugin-sdk/telegram-command-config` | Pembantu normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Pembantu gate otorisasi perintah sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fasad kompatibilitas ingress channel tingkat rendah yang tidak digunakan lagi. Jalur penerimaan baru harus menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress channel tingkat tinggi eksperimental dan pembuat fakta route untuk jalur penerimaan channel yang dimigrasikan. Utamakan ini daripada merakit allowlist efektif, allowlist perintah, dan proyeksi lama di setiap plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, dan pembantu siklus hidup stream draf lama. Kode finalisasi pratinjau baru harus menggunakan `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Pembantu kontrak siklus hidup pesan murah seperti `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivasi kapabilitas final tahan lama, pembantu bukti kapabilitas untuk kapabilitas kirim/tanda terima/efek samping, `MessageReceiveContext`, bukti kebijakan ack penerimaan, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, bukti kapabilitas pratinjau langsung dan finalizer langsung, status pemulihan tahan lama, `RenderedMessageBatch`, tipe tanda terima pesan, dan pembantu ID tanda terima. Lihat [API pesan channel](/id/plugins/sdk-channel-message). Fasad dispatch balasan lama hanya kompatibilitas yang tidak digunakan lagi. |
    | `plugin-sdk/channel-message-runtime` | Pembantu pengiriman runtime yang dapat memuat pengiriman keluar, termasuk `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, dan `withDurableMessageSendContext`. Bridge dispatch balasan yang tidak digunakan lagi tetap dapat diimpor hanya untuk dispatcher kompatibilitas. Gunakan dari modul runtime monitor/kirim, bukan file bootstrap plugin yang panas. |
    | `plugin-sdk/inbound-envelope` | Pembantu pembuat route masuk + envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Pembantu lama bersama untuk merekam-dan-dispatch inbound, predikat dispatch terlihat/final, dan kompatibilitas `deliverDurableInboundReplyPayload` yang tidak digunakan lagi untuk dispatcher channel yang disiapkan. Kode penerimaan/dispatch channel baru harus mengimpor pembantu siklus hidup runtime dari `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Pembantu parsing/pencocokan target |
    | `plugin-sdk/outbound-media` | Pembantu pemuatan media keluar bersama |
    | `plugin-sdk/outbound-send-deps` | Pencarian dependensi kirim keluar ringan untuk adaptor channel |
    | `plugin-sdk/outbound-runtime` | Pembantu identitas keluar, delegasi kirim, sesi, pemformatan, dan perencanaan payload. Pembantu pengiriman langsung seperti `deliverOutboundPayloads` adalah substrat kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/channel-message-runtime` untuk jalur kirim baru. |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi polling sempit |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu siklus hidup binding thread dan adaptor |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Pembantu binding percakapan/thread, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi channel sempit |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Pembantu keputusan akses grup bersama |
    | `plugin-sdk/direct-dm` | Pembantu autentikasi/guard DM langsung bersama |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; plugin baru harus menggunakan subpath SDK channel generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas pemilik yang dilacak; plugin baru harus menggunakan pembantu runtime yang diinjeksi atau subpath SDK channel generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal yang tidak digunakan lagi untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; plugin baru harus menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan pembantu balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatibilitas untuk debounce inbound, pencocokan mention, pembantu kebijakan mention, dan pembantu envelope |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce inbound sempit |
    | `plugin-sdk/channel-mention-gating` | Pembantu kebijakan mention, penanda mention, dan teks mention sempit tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope` | Pembantu pemformatan envelope inbound sempit |
    | `plugin-sdk/channel-location` | Konteks lokasi channel dan pembantu pemformatan |
    | `plugin-sdk/channel-logging` | Pembantu logging channel untuk drop inbound dan kegagalan mengetik/ack |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan channel, plus pembantu skema native yang tidak digunakan lagi yang dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Pembantu normalisasi route bersama, resolusi target berbasis parser, stringifikasi ID thread, kunci route dedupe/ringkas, tipe target terurai, dan pembantu perbandingan route/target |
    | `plugin-sdk/channel-targets` | Pembantu parsing target; pemanggil perbandingan route harus menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Pembantu kontrak secret sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk Plugin penyedia |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registry Plugin-penyedia untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint penyedia generik, error HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search sempit untuk penyedia yang tidak memerlukan pengabelan aktivasi Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terskopa |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema Gemini + diagnostik |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` dan sejenisnya |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch yang dijaga, transformasi pesan transport, dan stream event transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup sempit dan parsing perintah |
  </Accordion>

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registry perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; pilih seam adapter/Gateway yang lebih sempit saat sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native + pengikatan akun |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/Plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset dedupe balasan masuk sempit |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak channel sempit tanpa barrel pengujian yang luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia sempit untuk permukaan rahasia channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef sempit untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Helper kepercayaan bersama, gating DM, helper file/jalur berbatas root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp saudara, fallback pemindahan lintas perangkat, helper penyimpanan file privat, penjaga induk symlink, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu konstan, dan helper pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher tersemat sempit tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Dispatcher tersemat, fetch yang dijaga SSRF, error SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/plugin-install yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Facade konfigurasi browser yang didukung untuk profil/default ternormalisasi, penguraian URL CDP, dan helper autentikasi kontrol browser |
    | `plugin-sdk/channel-runtime-context` | Helper registrasi dan pencarian konteks runtime channel generik |
    | `plugin-sdk/matrix` | Facade kompatibilitas Matrix yang tidak digunakan lagi untuk paket channel pihak ketiga lama; plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Facade kompatibilitas Mattermost yang tidak digunakan lagi untuk paket channel pihak ketiga lama; plugin baru sebaiknya mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline Webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime malas seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper eksekusi proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, tunggu, versi, pemanggilan argumen, dan grup command malas |
    | `plugin-sdk/gateway-runtime` | Helper klien Gateway, start klien siap event-loop, RPC CLI gateway, error protokol gateway, dan patch status channel |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper pencarian konfigurasi plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel teks yang luas |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder kapabilitas persetujuan, helper autentikasi/profil, helper routing/runtime native, dan pemformatan jalur tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan dan label percakapan yang sempit |
    | `plugin-sdk/reply-history` | Helper dan marker riwayat balasan jendela pendek bersama seperti `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/Markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper jalur penyimpanan sesi, session-key, updated-at, dan mutasi store |
    | `plugin-sdk/cron-store-runtime` | Helper jalur/muat/simpan store Cron |
    | `plugin-sdk/state-paths` | Helper jalur direktori state/OAuth |
    | `plugin-sdk/routing` | Helper routing/session-key/binding akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default state runtime, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command berbatas waktu dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-payload` | Ekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/temp-path` | Helper jalur unduhan sementara bersama dan workspace sementara aman pribadi |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi provider Talk |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-runtime-backend` | Helper ringan registrasi backend ACP dan dispatch balasan untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP baca-saja tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper passive-channel, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar command Skill |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialisasi command native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agent level rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper pemformatan/detail progres tool, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Facade deteksi endpoint milik provider Z.AI yang tidak digunakan lagi; gunakan API publik plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lock async lokal proses untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi tugas async berbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pengiriman tertunda outbound |
    | `plugin-sdk/file-access-runtime` | Helper jalur file lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper wake, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper tunggu kesiapan transport |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache kecil berbatas |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Helper graph error, pemformatan, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan lookup tersemat |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader body respons berbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agent, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk mengambil/mentransformasi/menyimpan media, pemeriksaan dimensi video berbasis ffprobe, dan pembuat payload media |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Jenis penyedia pemahaman media plus ekspor helper gambar/audio/ekstraksi-terstruktur untuk penyedia |
    | `plugin-sdk/text-chunking` | Helper pemotongan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Jenis penyedia ucapan plus ekspor direktif, registri, validasi, pembuat TTS kompatibel OpenAI, dan helper ucapan untuk penyedia |
    | `plugin-sdk/speech-core` | Ekspor bersama untuk jenis penyedia ucapan, registri, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/realtime-transcription` | Jenis penyedia transkripsi realtime, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-voice` | Jenis penyedia suara realtime dan helper registri |
    | `plugin-sdk/image-generation` | Jenis penyedia pembuatan gambar plus helper URL aset/data gambar dan pembuat penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Helper bersama untuk jenis pembuatan gambar, failover, autentikasi, dan registri |
    | `plugin-sdk/music-generation` | Jenis penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Jenis pembuatan musik bersama, helper failover, pencarian penyedia, dan penguraian model-ref |
    | `plugin-sdk/video-generation` | Jenis penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Jenis pembuatan video bersama, helper failover, pencarian penyedia, dan penguraian model-ref |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Re-ekspor kompatibilitas yang sudah tidak digunakan; impor `zod` dari `zod` secara langsung |
    | `plugin-sdk/testing` | Barrel kompatibilitas repo-lokal yang sudah tidak digunakan untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subpath pengujian lokal yang terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal repo-lokal `createTestPluginApi` untuk pengujian unit pendaftaran Plugin langsung tanpa mengimpor jembatan helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter agent-runtime native repo-lokal untuk pengujian autentikasi, pengiriman, fallback, tool-hook, prompt-overlay, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi channel repo-lokal untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading send-config, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus error resolusi target bersama repo-lokal untuk pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket Plugin repo-lokal, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak repo-lokal untuk runtime penyedia, autentikasi, penemuan, onboard, katalog, wizard, kapabilitas media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest opt-in repo-lokal untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik repo-lokal untuk penangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, event sistem, muat ulang modul, path Plugin bawaan, teks terminal, pemotongan, token autentikasi, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node yang terfokus dan repo-lokal untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin foundation host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registri, penyedia lokal, dan helper batch/jarak jauh generik |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    Saat ini tidak ada subpath SDK helper bawaan yang dicadangkan. Helper khusus pemilik
    berada di dalam paket Plugin pemilik, sementara kontrak host yang dapat digunakan ulang
    menggunakan subpath SDK generik seperti `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ringkasan Plugin SDK](/id/plugins/sdk-overview)
- [Penyiapan Plugin SDK](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
