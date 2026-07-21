---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor plugin
    - Mengaudit subpath plugin bawaan dan antarmuka helper
summary: 'Katalog subpath SDK Plugin: lokasi setiap impor, dikelompokkan berdasarkan area'
title: Subpath SDK Plugin
x-i18n:
    generated_at: "2026-07-21T12:21:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b39919e7e12be394ed8f384dcd99bec5ce801e32d9de2ed1e9add7c2d644932
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin berisi subjalur publik yang terbatas dan helper terbundel khusus repositori
di bawah `openclaw/plugin-sdk/`. Halaman ini mengatalogkan keduanya dan memberi label
secara eksplisit pada entri privat-lokal. Tiga file mendefinisikan batas tersebut:

- `scripts/lib/plugin-sdk-entrypoints.json`: inventaris titik masuk yang dipelihara
  dan dikompilasi oleh build.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subjalur internal
  yang dikecualikan dari SDK bertipe dan terdokumentasi. Entri produksi tetap tersedia
  sebagai ekspor runtime host khusus JavaScript untuk plugin resmi yang diterbitkan
  secara terpisah; entri khusus pengujian tetap tidak diekspor.
- `src/plugin-sdk/entrypoints.ts`: metadata klasifikasi untuk subjalur
  yang tidak digunakan lagi, helper terbundel yang dicadangkan, fasad terbundel yang didukung, dan
  permukaan publik milik plugin.

Pemelihara mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan
subjalur helper cadangan yang aktif dengan `pnpm plugins:boundary-report:summary`;
ekspor helper cadangan yang tidak digunakan menyebabkan laporan CI gagal alih-alih tetap berada dalam
SDK publik sebagai utang kompatibilitas yang tidak aktif.

Untuk panduan penulisan plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri plugin

| Subjalur                       | Ekspor utama                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Privat-lokal setelah Juli 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Privat-lokal setelah Juli 2026; Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper penyuntingan, dan `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Privat-lokal setelah Juli 2026; Helper migrasi runtime seperti `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`              |
| `plugin-sdk/health`            | Jenis pendaftaran pemeriksaan kesehatan Doctor, deteksi, perbaikan, pemilihan, tingkat keparahan, dan temuan untuk konsumen kesehatan terbundel                                                                                |

### Kompatibilitas dan helper privat-lokal

Hanya subjalur yang tidak digunakan lagi dari rentang waktu yang lebih akhir yang tetap diekspor. Alias Juli 2026 dan
subjalur yang tidak digunakan telah dihapus, sedangkan helper khusus terbundel telah dihapus dari
paket publik dan diberi label privat-lokal di bawah. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak subjalur terbundel.
`plugin-sdk/text-runtime` hanya untuk kompatibilitas, dan `plugin-sdk/zod` adalah
ekspor ulang kompatibilitas: impor `zod` secara langsung dari `zod`. Barrel domain
luas `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime`, dan
`plugin-sdk/security-runtime` juga tidak digunakan lagi dan digantikan oleh
subjalur yang terfokus.

Subjalur helper pengujian OpenClaw yang didukung Vitest hanya bersifat lokal repositori dan tidak
lagi menjadi ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks`, dan `testing`. Permukaan helper terbundel privat
`ssrf-runtime-internal` dan `codex-native-task-runtime` juga hanya bersifat lokal
repositori.

### Subjalur helper plugin terbundel

Modul helper khusus terbundel bersifat privat-lokal setelah penyisiran Juli 2026. Impor lintas pemilik diblokir oleh pagar pengaman kontrak paket. `src/plugin-sdk/entrypoints.ts` secara terpisah melacak fasad terbundel yang didukung dan tetap publik, yaitu titik masuk SDK
yang didukung oleh plugin terbundelnya hingga kontrak generik menggantikan
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
yang tidak digunakan lagi untuk kode baru; lihat catatan per baris di bawah.

<AccordionGroup>
  <Accordion title="Subjalur saluran">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Privat-lokal setelah Juli 2026; Helper validasi JSON Schema yang di-cache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard penyiapan bersama, penerjemah penyiapan, prompt daftar yang diizinkan, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi/gerbang tindakan multiakun, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi ID akun |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper terbatas untuk daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Privat-lokal setelah Juli 2026; Helper penguraian daftar grup akses yang diizinkan dan diagnostik grup yang disunting |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi saluran bersama serta pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Privat-lokal setelah Juli 2026; Skema konfigurasi saluran OpenClaw terbundel hanya untuk plugin terbundel yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | Privat-lokal setelah Juli 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID saluran obrolan terbundel/resmi kanonis serta label/alias pemformat untuk plugin yang perlu mengenali teks berawalan amplop tanpa melakukan hardcode pada tabelnya sendiri. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress saluran tingkat tinggi eksperimental, resolver kebijakan penyebutan implisit, dan pembuat fakta rute untuk jalur penerimaan saluran yang dimigrasikan. Pilih ini alih-alih menyusun daftar efektif yang diizinkan, daftar perintah yang diizinkan, dan proyeksi lama di setiap plugin. Lihat [API ingress saluran](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan serta opsi pipeline balasan, tanda terima, pratinjau langsung/streaming, helper siklus hidup, identitas keluar, perencanaan payload, pengiriman persisten, dan helper konteks pengiriman pesan. Lihat [API keluar saluran](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Helper pembuat rute masuk + amplop bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner masuk dan predikat pengiriman, serta `plugin-sdk/channel-outbound` untuk helper pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias penguraian target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Privat-lokal setelah Juli 2026; Helper pemuatan media keluar bersama dan status media yang di-host |
    | `plugin-sdk/poll-runtime` | Privat-lokal setelah Juli 2026; Helper normalisasi jajak pendapat terbatas |
    | `plugin-sdk/thread-bindings-runtime` | Privat-lokal setelah Juli 2026; Helper siklus hidup dan adaptor pengikatan utas |
    | `plugin-sdk/agent-media-payload` | Fasad kompatibilitas yang tidak digunakan lagi untuk root dan pemuat payload media agen. Plugin saluran baru menggunakan perencanaan payload keluar bertipe dari `plugin-sdk/channel-outbound`; pemuatan media lokal yang disediakan operator masih menggunakan fasad yang dipertahankan hingga tersedia seam root lokal publik yang terfokus. |
    | `plugin-sdk/conversation-runtime` | Barrel luas yang tidak digunakan lagi untuk pengikatan percakapan/utas, pemasangan, dan helper pengikatan terkonfigurasi; pilih subjalur pengikatan terfokus seperti `plugin-sdk/thread-bindings-runtime` dan `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status saluran bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi saluran terbatas |
    | `plugin-sdk/channel-config-writes` | Privat-lokal setelah Juli 2026; Helper otorisasi penulisan konfigurasi saluran |
    | `plugin-sdk/channel-plugin-common` | Ekspor pendahuluan plugin saluran bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper penyuntingan/pembacaan konfigurasi daftar yang diizinkan |
    | `plugin-sdk/group-access` | Helper keputusan akses grup yang tidak digunakan lagi; gunakan `resolveChannelMessageIngress` dari `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Privat-lokal setelah Juli 2026; Helper kebijakan pengaman pra-kripto DM langsung yang terbatas |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang diterbitkan dan kompatibilitas pemilik yang dilacak; plugin baru sebaiknya menggunakan subjalur SDK saluran generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas pemilik yang dilacak; plugin baru sebaiknya menggunakan helper runtime yang diinjeksi atau subjalur SDK saluran generik |
    | `plugin-sdk/interactive-runtime` | Presentasi dan pengiriman pesan semantik, serta helper balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Selesaikan pilihan `ask_user` yang dibuat runtime melalui Gateway dari handler interaksi saluran |
    | `plugin-sdk/channel-inbound` | Helper masuk bersama untuk klasifikasi peristiwa, pembuatan konteks, pemformatan, root, debounce, pencocokan penyebutan, kebijakan penyebutan, dan pencatatan masuk |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce masuk terbatas |
    | `plugin-sdk/channel-mention-gating` | Privat-lokal setelah Juli 2026; Helper terbatas untuk kebijakan penyebutan, penanda penyebutan, dan teks penyebutan tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Jenis hasil balasan |
    | `plugin-sdk/channel-actions` | Helper tindakan pesan saluran, serta helper skema native yang tidak digunakan lagi dan dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Privat-lokal setelah Juli 2026; Normalisasi rute bersama, resolusi target berbasis parser, pengubahan ID utas menjadi string, kunci rute deduplikasi/ringkas, jenis target terurai, dan helper perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Privat-lokal setelah Juli 2026; Helper penguraian target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Jenis kontrak saluran |
    | `plugin-sdk/channel-feedback` | Pengkabelan umpan balik/reaksi |
  </Accordion>

Subjalur kompatibilitas saluran dari rentang waktu yang lebih akhir tetap publik hanya hingga
tanggal registrinya. Alias Juli seperti akses DM langsung, opsi balasan, jalur
pemasangan, dan pecahan runtime saluran telah dihapus; helper khusus terbundel
bersifat privat-lokal.

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Lokal privat setelah Juli 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Lokal privat setelah Juli 2026; Pembantu penyiapan penyedia lokal/yang dihosting sendiri dan telah dikurasi |
    | `plugin-sdk/cli-backend` | Lokal privat setelah Juli 2026; Nilai default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Lokal privat setelah Juli 2026; Pembantu runtime autentikasi penyedia: alur loopback OAuth, pertukaran token, persistensi autentikasi, dan resolusi kunci API |
    | `plugin-sdk/provider-oauth-runtime` | Lokal privat setelah Juli 2026; Tipe panggilan balik OAuth penyedia generik, perenderan halaman panggilan balik, pembantu PKCE/status, penguraian input otorisasi, pembantu kedaluwarsa token, dan pembantu pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Lokal privat setelah Juli 2026; Pembantu orientasi/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Lokal privat setelah Juli 2026; Pembuat hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Lokal privat setelah Juli 2026; Pembantu pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pembantu impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | Lokal privat setelah Juli 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, pembuat kebijakan pemutaran ulang bersama, pembantu titik akhir penyedia, dan pembantu normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Lokal privat setelah Juli 2026; Pembantu katalog model penyedia langsung untuk penemuan bergaya `/models` yang dilindungi: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime penambahan katalog penyedia dan seam registri penyedia Plugin untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | Lokal privat setelah Juli 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Lokal privat setelah Juli 2026; Pembantu kemampuan HTTP/titik akhir penyedia generik, galat HTTP penyedia, dan pembantu formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Lokal privat setelah Juli 2026; Pembantu kontrak konfigurasi/pemilihan pengambilan web yang terfokus seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Lokal privat setelah Juli 2026; Pembantu pendaftaran/cache penyedia pengambilan web |
    | `plugin-sdk/provider-web-search-config-contract` | Lokal privat setelah Juli 2026; Pembantu konfigurasi/kredensial pencarian web yang terfokus untuk penyedia yang tidak memerlukan pengawatan pengaktifan Plugin |
    | `plugin-sdk/provider-web-search-contract` | Lokal privat setelah Juli 2026; Pembantu kontrak konfigurasi/kredensial pencarian web yang terfokus seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta penyetel/pengambil kredensial dengan cakupan tertentu |
    | `plugin-sdk/provider-web-search` | Lokal privat setelah Juli 2026; Pembantu pendaftaran/cache/runtime penyedia pencarian web |
    | `plugin-sdk/embedding-providers` | Lokal privat setelah Juli 2026; Tipe penyedia embedding umum dan pembantu pembacaan, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; Plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` agar kepemilikan manifes diberlakukan |
    | `plugin-sdk/provider-tools` | Lokal privat setelah Juli 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Lokal privat setelah Juli 2026; Tipe snapshot penggunaan penyedia, pembantu pengambilan penggunaan bersama, dan pengambil penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Lokal privat setelah Juli 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus aliran, kompatibilitas pemanggilan alat teks biasa, dan pembantu pembungkus bersama Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Lokal privat setelah Juli 2026; Pembantu pembungkus aliran penyedia bersama publik, termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, serta utilitas aliran yang kompatibel dengan Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Lokal privat setelah Juli 2026; Pembantu transportasi penyedia native seperti pengambilan yang dilindungi, ekstraksi teks hasil alat, transformasi pesan transportasi, dan aliran peristiwa transportasi yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Lokal privat setelah Juli 2026; Pembantu patch konfigurasi orientasi |
    | `plugin-sdk/global-singleton` | Lokal privat setelah Juli 2026; Pembantu singleton/peta/cache lokal proses |
    | `plugin-sdk/group-activation` | Lokal privat setelah Juli 2026; Pembantu mode aktivasi grup dan penguraian perintah yang terfokus |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu pengaturan ulang opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat diatur ulang harus mengembalikan
`summary` dengan larik `windows` kosong, bukan membuat-buat persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam keluaran status; gunakan `error` hanya saat
titik akhir penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | Permukaan otorisasi perintah luas yang tidak digunakan lagi (`resolveControlCommandGate`, pembantu registri perintah termasuk pemformatan menu argumen dinamis, pembantu otorisasi pengirim); gunakan otorisasi ingress/runtime saluran atau pembantu status perintah |
    | `plugin-sdk/command-status` | Pembuat pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pembantu resolusi pemberi persetujuan dan autentikasi tindakan dalam obrolan yang sama |
    | `plugin-sdk/approval-client-runtime` | Pembantu profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptor kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Resolver Gateway persetujuan bersama |
    | `plugin-sdk/approval-reference-runtime` | Lokal privat setelah Juli 2026; Pembantu pencari tahan lama deterministik untuk panggilan balik persetujuan yang dibatasi transportasi |
    | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu pemuatan adaptor persetujuan native ringan untuk titik masuk saluran berkinerja kritis |
    | `plugin-sdk/approval-handler-runtime` | Pembantu runtime penangan persetujuan yang lebih luas; prioritaskan seam adaptor/Gateway yang lebih terfokus jika sudah memadai |
    | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan native, pengikatan akun, gerbang rute, fallback penerusan, dan penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Lokal privat setelah Juli 2026; Pengikatan reaksi persetujuan yang dikodekan secara tetap, muatan prompt reaksi, penyimpanan target reaksi, pembantu teks petunjuk reaksi, dan ekspor kompatibilitas untuk penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reply-runtime` | Pembantu muatan balasan persetujuan eksekusi/Plugin |
    | `plugin-sdk/approval-runtime` | Pembantu muatan persetujuan eksekusi/Plugin, pembuat kemampuan persetujuan, pembantu autentikasi/profil persetujuan, pembantu perutean/runtime persetujuan native, dan pembantu tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan pembantu target sesi native |
    | `plugin-sdk/command-detection` | Pembantu deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur saluran berkinerja kritis |
    | `plugin-sdk/command-surface` | Lokal privat setelah Juli 2026; Normalisasi isi perintah dan pembantu permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lokal privat setelah Juli 2026; Pembantu alur masuk autentikasi penyedia secara malas untuk pemasangan perangkat melalui kode pada saluran privat dan Web UI |
    | `plugin-sdk/channel-secret-runtime` | Permukaan kontrak rahasia luas yang tidak digunakan lagi (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipe target rahasia); prioritaskan subjalur terfokus di bawah |
    | `plugin-sdk/channel-secret-basic-runtime` | Ekspor kontrak rahasia yang terfokus dan pembuat registri target untuk permukaan rahasia saluran/Plugin non-TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Lokal privat setelah Juli 2026; Pembantu penetapan rahasia TTS saluran bersarang yang terfokus |
    | `plugin-sdk/secret-ref-runtime` | Pengetikan, resolusi, dan pencarian jalur target rencana SecretRef yang terfokus untuk penguraian kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Barrel luas yang tidak digunakan lagi untuk kepercayaan, gerbang DM, pembantu berkas/jalur berbatas root termasuk penulisan khusus pembuatan, penggantian berkas atomik sinkron/asinkron, penulisan sementara sejawat, fallback pemindahan lintas perangkat, pembantu penyimpanan berkas privat, perlindungan induk symlink, konten eksternal, penyamaran teks sensitif, perbandingan rahasia waktu konstan, dan pembantu pengumpulan rahasia; prioritaskan subjalur keamanan/SSRF/rahasia yang terfokus |
    | `plugin-sdk/ssrf-policy` | Daftar izin host dan pembantu kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Lokal privat setelah Juli 2026; Pembantu dispatcher tersemat yang terfokus tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Pembantu dispatcher tersemat, pengambilan yang dilindungi SSRF, galat SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Pembantu penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Pembantu permintaan/target Webhook dan koersi websocket/isi mentah |
    | `plugin-sdk/webhook-request-guards` | Pembantu ukuran/batas waktu isi permintaan dan `runDetachedWebhookWork` untuk pemrosesan pascapengakuan yang dilacak |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu runtime/pencatatan/pencadangan, peringatan jalur instalasi plugin, dan pembantu proses |
    | `plugin-sdk/runtime-env` | Pembantu env runtime terbatas, pencatat, batas waktu, percobaan ulang, dan penundaan bertahap |
    | `plugin-sdk/browser-config` | Lokal-privat setelah Juli 2026; fasad konfigurasi peramban yang didukung untuk profil/nilai default yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol peramban |
    | `plugin-sdk/agent-harness-task-runtime` | Lokal-privat setelah Juli 2026; pembantu siklus hidup tugas generik dan pengiriman penyelesaian untuk agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Lokal-privat setelah Juli 2026; pembantu Codex terpaket yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread Codex; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Pembantu Codex terpaket lokal-repo untuk pengkabelan runtime/cermin tugas native; bukan ekspor paket |
    | `plugin-sdk/channel-runtime-context` | Pembantu pendaftaran dan pencarian konteks runtime kanal generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang tidak digunakan lagi untuk paket kanal pihak ketiga lama; plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu perintah/hook/http/interaktif plugin; utamakan subjalur runtime plugin yang terfokus |
    | `plugin-sdk/hook-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu pipeline webhook/hook internal; utamakan subjalur runtime hook/plugin yang terfokus |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime lambat seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Lokal-privat setelah Juli 2026; pembantu eksekusi proses |
    | `plugin-sdk/node-host` | Lokal-privat setelah Juli 2026; pembantu resolusi executable host Node dan pelanjutan PTY |
    | `plugin-sdk/cli-runtime` | Lokal-privat setelah Juli 2026; barrel luas yang tidak digunakan lagi untuk pemformatan CLI, penantian, versi, pemanggilan argumen, dan pembantu grup perintah lambat; utamakan subjalur CLI/runtime yang terfokus |
    | `plugin-sdk/qa-runner-runtime` | Lokal-privat setelah Juli 2026; fasad yang didukung untuk mengekspos skenario QA plugin melalui permukaan perintah CLI |
    | `plugin-sdk/tts-runtime` | Lokal-privat setelah Juli 2026; fasad yang didukung untuk skema konfigurasi text-to-speech dan pembantu runtime |
    | `plugin-sdk/gateway-method-runtime` | Pembantu dispatch metode Gateway yang dicadangkan untuk rute HTTP plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu memulai klien yang siap untuk perulangan peristiwa, RPC CLI gateway, galat protokol gateway, resolusi host LAN yang diumumkan, dan pembantu patch status kanal |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi kanal/penyedia |
    | `plugin-sdk/plugin-config-runtime` | Fasad kompatibilitas yang tidak digunakan lagi untuk pembantu konfigurasi plugin runtime; plugin baru menggunakan `api.pluginConfig` serta kontrak konfigurasi, snapshot, dan pembantu mutasi yang terfokus |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Lokal-privat setelah Juli 2026; string petunjuk metadata pengiriman alat pesan bersama |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan penyetel snapshot pengujian |
    | `plugin-sdk/text-autolink-runtime` | Lokal-privat setelah Juli 2026; deteksi tautan otomatis referensi berkas tanpa barrel teks luas |
    | `plugin-sdk/reply-runtime` | Pembantu runtime masuk/balasan bersama, pemotongan, dispatch, heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu dispatch/finalisasi balasan dan label percakapan yang terbatas |
    | `plugin-sdk/reply-history` | Pembantu riwayat balasan jangka pendek bersama. Kode giliran pesan baru sebaiknya menggunakan `createChannelHistoryWindow`; pembantu map tingkat rendah tetap hanya sebagai ekspor kompatibilitas yang tidak digunakan lagi |
    | `plugin-sdk/reply-reference` | Lokal-privat setelah Juli 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu pemotongan teks/markdown yang terbatas |
    | `plugin-sdk/session-store-runtime` | Pembantu alur kerja sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembantu perbaikan/siklus hidup (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), pembantu penanda untuk nilai `sessionFile` transisional, pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, pembantu jalur penyimpanan sesi/kunci sesi, dan pembacaan waktu pembaruan, tanpa impor penulisan/pemeliharaan konfigurasi luas |
    | `plugin-sdk/session-transcript-runtime` | Lokal-privat setelah Juli 2026; identitas transkrip, kursor mentah dan terlihat yang dibatasi, pembantu target/baca/tulis bercakupan, proyeksi entri pesan yang terlihat, penerbitan pembaruan, penguncian tulis, dan kunci hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Lokal-privat setelah Juli 2026; pembantu skema agen SQLite, jalur, dan transaksi yang terfokus untuk runtime pihak pertama, tanpa kontrol siklus hidup basis data |
    | `plugin-sdk/cron-store-runtime` | Lokal-privat setelah Juli 2026; pembantu jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Pembantu jalur direktori status/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Lokal-privat setelah Juli 2026; kontrak status berkunci, BLOB, dan sewa SQLite kooperatif bercakupan plugin, beserta pragma koneksi, pemeliharaan WAL terverifikasi, dan pembantu migrasi skema STRICT atomik. Callback sewa menerima sinyal pembatalan dan galat bertipe membedakan batas waktu, pembatalan, hilangnya kepemilikan, masukan tidak valid, dan kegagalan penyimpanan |
    | `plugin-sdk/routing` | Pembantu pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status kanal/akun bersama, nilai default status runtime, dan pembantu metadata masalah |
    | `plugin-sdk/target-resolver-runtime` | Lokal-privat setelah Juli 2026; pembantu resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Lokal-privat setelah Juli 2026; pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Lokal-privat setelah Juli 2026; mengekstrak URL string dari masukan menyerupai fetch/request |
    | `plugin-sdk/run-command` | Pelaksana perintah berwaktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter alat/CLI umum |
    | `plugin-sdk/tool-plugin` | Mendefinisikan plugin alat agen bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifes |
    | `plugin-sdk/tool-payload` | Lokal-privat setelah Juli 2026; mengekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Mengekstrak bidang target pengiriman kanonis dari argumen alat |
    | `plugin-sdk/sandbox` | Lokal-privat setelah Juli 2026; tipe backend sandbox dan pembantu perintah SSH/OpenShell, termasuk pemeriksaan awal perintah eksekusi yang langsung gagal |
    | `plugin-sdk/temp-path` | Pembantu jalur unduhan sementara bersama dan ruang kerja sementara privat yang aman |
    | `plugin-sdk/logging-core` | Pembantu pencatat subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Lokal-privat setelah Juli 2026; pembantu mode dan konversi tabel Markdown |
    | `plugin-sdk/model-session-runtime` | Pembantu penggantian model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Lokal-privat setelah Juli 2026; pembantu resolusi konfigurasi penyedia Talk |
    | `plugin-sdk/json-store` | Pembantu kecil untuk membaca/menulis status JSON |
    | `plugin-sdk/json-unsafe-integers` | Lokal-privat setelah Juli 2026; pembantu penguraian JSON yang mempertahankan literal bilangan bulat tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Lokal-privat setelah Juli 2026; pembantu penguncian berkas re-entrant serta pengambilalihan kembali yang aman bagi Doctor untuk sidecar kunci lama yang dipastikan usang dan tidak berubah |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache deduplikasi berbasis disk |
    | `plugin-sdk/ingress-effect-once` | Pelindung klaim/commit tahan lama untuk efek samping ingress non-idempoten |
    | `plugin-sdk/acp-runtime` | Lokal-privat setelah Juli 2026; pembantu runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-runtime-backend` | Lokal-privat setelah Juli 2026; pembantu pendaftaran backend ACP ringan dan dispatch balasan untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Lokal-privat setelah Juli 2026; resolusi pengikatan ACP hanya-baca tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang tidak digunakan lagi; impor primitif skema dari permukaan milik plugin yang dipelihara |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Lokal-privat setelah Juli 2026; pembantu resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pemasangan, termasuk `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitif pembantu kanal pasif, status, dan proksi ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu pencantuman perintah Skills |
    | `plugin-sdk/native-command-registry` | Pembantu registri/pembuatan/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, pembantu pengarahan/pembatalan proses aktif, pembantu jembatan alat OpenClaw, pembantu kebijakan alat rencana runtime, klasifikasi hasil terminal, pembantu pemformatan/detail progres alat, dan utilitas hasil percobaan |
    | `plugin-sdk/async-lock-runtime` | Lokal-privat setelah Juli 2026; pembantu penguncian asinkron lokal-proses untuk berkas status runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Lokal-privat setelah Juli 2026; pembantu telemetri aktivitas kanal |
    | `plugin-sdk/concurrency-runtime` | Lokal-privat setelah Juli 2026; pembantu konkurensi tugas asinkron yang dibatasi |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache deduplikasi dalam memori dan berbasis penyimpanan persisten |
    | `plugin-sdk/delivery-queue-runtime` | Lokal-privat setelah Juli 2026; pembantu pengurasan pengiriman keluar yang tertunda |
    | `plugin-sdk/file-access-runtime` | Lokal-privat setelah Juli 2026; pembantu jalur berkas lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Lokal-privat setelah Juli 2026; pembantu pembangkitan, peristiwa, dan visibilitas Heartbeat |
    | `plugin-sdk/expect-runtime` | Lokal-privat setelah Juli 2026; pembantu penegasan nilai wajib untuk invarian runtime yang dapat dibuktikan |
    | `plugin-sdk/number-runtime` | Lokal-privat setelah Juli 2026; pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Lokal-privat setelah Juli 2026; pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Lokal-privat setelah Juli 2026; pembantu antrean peristiwa sistem |
    | `plugin-sdk/transport-ready-runtime` | Lokal-privat setelah Juli 2026; pembantu penantian kesiapan transport |
    | `plugin-sdk/exec-approvals-runtime` | Lokal-privat setelah Juli 2026; pembantu berkas kebijakan persetujuan eksekusi tanpa barrel infra-runtime luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Pembantu flag diagnostik, peristiwa, dan konteks pelacakan |
    | `plugin-sdk/error-runtime` | Pembantu grafik galat, pemformatan, klasifikasi galat bersama, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Lokal-privat setelah Juli 2026; pembantu fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan pencarian tersemat |
    | `plugin-sdk/runtime-fetch` | Lokal-privat setelah Juli 2026; fetch runtime yang mengetahui dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Lokal-privat setelah Juli 2026; pembersih URL data gambar inline dan pembantu pendeteksian tanda tangan tanpa permukaan runtime media luas |
    | `plugin-sdk/response-limit-runtime` | Lokal-privat setelah Juli 2026; pembaca isi respons yang dibatasi byte, waktu diam, dan tenggat tanpa permukaan runtime media luas |
    | `plugin-sdk/session-binding-runtime` | Lokal-privat setelah Juli 2026; status pengikatan percakapan saat ini tanpa perutean pengikatan terkonfigurasi atau penyimpanan pemasangan |
    | `plugin-sdk/context-visibility-runtime` | Lokal-privat setelah Juli 2026; resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan luas |
    | `plugin-sdk/string-coerce-runtime` | Pembantu koersi dan normalisasi record/string primitif yang terbatas tanpa impor markdown/pencatatan |
    | `plugin-sdk/html-entity-runtime` | Lokal-privat setelah Juli 2026; pendekodean entitas HTML5 sekali lintas yang diakhiri titik koma tanpa utilitas teks luas |
    | `plugin-sdk/text-utility-runtime` | Privat-lokal setelah Juli 2026; Helper teks dan jalur tingkat rendah, termasuk escaping HTML lima entitas |
    | `plugin-sdk/widget-html` | Deteksi dokumen lengkap, validasi ukuran, dan kesalahan input alat untuk widget HTML mandiri |
    | `plugin-sdk/host-runtime` | Privat-lokal setelah Juli 2026; Helper normalisasi nama host dan host SCP |
    | `plugin-sdk/retry-runtime` | Privat-lokal setelah Juli 2026; Helper konfigurasi percobaan ulang dan eksekutor percobaan ulang |
    | `plugin-sdk/agent-runtime` | Barrel luas yang tidak digunakan lagi untuk helper direktori/identitas/ruang kerja agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi; utamakan subjalur agen/runtime yang terfokus |
    | `plugin-sdk/directory-runtime` | Kueri/deduplikasi direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | Privat-lokal setelah Juli 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel media luas yang tidak digunakan lagi, termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang tidak digunakan lagi; utamakan `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media`, dan subpath runtime kapabilitas, serta utamakan helper penyimpanan sebelum pembacaan buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Bersifat privat-lokal setelah Juli 2026; Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang tidak tersedia |
    | `plugin-sdk/media-understanding` | Fasad kompatibilitas yang tidak digunakan lagi untuk tipe dan helper penyedia pemahaman media; penyedia baru mendaftar melalui API plugin yang diinjeksi dan mempertahankan kepemilikan helper permintaan pada plugin |
    | `plugin-sdk/text-chunking` | Pemotongan teks keluar dan rentang dengan mempertahankan offset, pemotongan markdown/helper perenderan, tokenisasi tag HTML yang memperhitungkan kutipan, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/speech` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia ucapan beserta ekspor direktif yang menghadap penyedia, registri, validasi, pembuat TTS kompatibel OpenAI, dan helper ucapan |
    | `plugin-sdk/speech-core` | Bersifat privat-lokal setelah Juli 2026; Ekspor tipe penyedia ucapan bersama, registri, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/speech-settings` | Primitif ringan untuk resolusi dan normalisasi konfigurasi TTS tanpa registri penyedia atau runtime sintesis |
    | `plugin-sdk/realtime-transcription` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia transkripsi waktu nyata, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Bersifat privat-lokal setelah Juli 2026; Helper bootstrap profil waktu nyata untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang dibatasi |
    | `plugin-sdk/realtime-voice` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia suara waktu nyata, helper registri, gerbang energi audio/awal ucapan bersama, dan helper perilaku suara waktu nyata, termasuk harness sesi yang tidak bergantung pada transportasi dan pelacakan aktivitas keluaran |
    | `plugin-sdk/meeting-runtime` | Runtime sesi rapat browser, mesin/transportasi audio waktu nyata, `MeetingPlatformAdapter`, kontrol browser/node, konsultasi agen, delegasi panggilan suara, pemeriksaan penyiapan, dan helper perintah SoX |
    | `plugin-sdk/image-generation` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia pembuatan gambar beserta helper aset gambar/URL data dan pembuat penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Bersifat privat-lokal setelah Juli 2026; Tipe pembuatan gambar bersama, failover, autentikasi, dan helper registri |
    | `plugin-sdk/music-generation` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/video-generation` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Bersifat privat-lokal setelah Juli 2026; Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan penguraian referensi model |
    | `plugin-sdk/transcripts` | Bersifat privat-lokal setelah Juli 2026; Tipe penyedia sumber transkrip bersama, helper registri, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Bersifat privat-lokal setelah Juli 2026; Registri target Webhook dan helper pemasangan rute |
    | `plugin-sdk/web-media` | Helper bersama untuk pemuatan media jarak jauh/lokal |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang tidak digunakan lagi; impor `zod` langsung dari `zod` |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` minimal yang bersifat lokal-repo untuk pengujian unit pendaftaran plugin langsung tanpa mengimpor jembatan helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adaptor runtime agen native yang bersifat lokal-repo untuk pengujian autentikasi, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi kanal yang bersifat lokal-repo untuk kontrak tindakan/penyiapan/status generik, pernyataan direktori, siklus hidup permulaan akun, penerusan konfigurasi pengiriman, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus galat resolusi target bersama yang bersifat lokal-repo untuk pengujian kanal |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak kanal terbatas yang bersifat lokal-repo tanpa barrel pengujian luas |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor yang bersifat lokal-repo |
    | `plugin-sdk/plugin-state-test-runtime` | Helper pengujian penyimpanan status plugin, antrean masuk, dan DB status yang bersifat lokal-repo |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, autentikasi, penemuan, orientasi awal, katalog, wizard, kapabilitas media, kebijakan pemutaran ulang, audio langsung STT waktu nyata, pencarian/pengambilan web, dan aliran yang bersifat lokal-repo |
    | `plugin-sdk/provider-http-test-mocks` | Bersifat privat-lokal setelah Juli 2026; Mock HTTP/autentikasi Vitest opsional yang bersifat lokal-repo untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Helper lokal-repo untuk melampirkan metadata ke fixture payload balasan |
    | `plugin-sdk/sqlite-runtime-testing` | Helper siklus hidup SQLite yang bersifat lokal-repo untuk pengujian pihak pertama |
    | `plugin-sdk/test-fixtures` | Fixture lokal-repo untuk penangkapan runtime CLI generik, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur plugin bawaan, teks terminal, pemotongan, token autentikasi, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus yang bersifat lokal-repo untuk digunakan di dalam factory `vi.mock("node:*")` Vitest |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Bersifat privat-lokal setelah Juli 2026; Helper registri penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Bersifat privat-lokal setelah Juli 2026; Kontrak embedding host memori, akses registri, penyedia lokal, dan helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini tidak digunakan lagi; gunakan API penyedia embedding generik untuk penyedia baru. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Bersifat privat-lokal setelah Juli 2026; Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Bersifat privat-lokal setelah Juli 2026; Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-secret` | Bersifat privat-lokal setelah Juli 2026; Helper rahasia host memori |
    | `plugin-sdk/memory-core-host-status` | Bersifat privat-lokal setelah Juli 2026; Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Bersifat privat-lokal setelah Juli 2026; Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Bersifat privat-lokal setelah Juli 2026; Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Bersifat privat-lokal setelah Juli 2026; Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Fasad kompatibilitas yang tidak digunakan lagi untuk helper host memori yang netral terhadap vendor. Plugin memori baru menggunakan kapabilitas memori yang diinjeksi dan prompt yang disiapkan host; plugin pendamping tetap menggunakan fasad yang dipertahankan untuk penemuan artefak publik hingga tersedia antarmuka baca yang terfokus. |
    | `plugin-sdk/memory-host-events` | Bersifat privat-lokal setelah Juli 2026; Alias netral vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-markdown` | Bersifat privat-lokal setelah Juli 2026; Helper markdown terkelola bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Bersifat privat-lokal setelah Juli 2026; Fasad runtime Active Memory untuk akses pengelola pencarian |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    Subpath SDK helper bawaan yang dicadangkan merupakan permukaan sempit khusus pemilik untuk
    kode plugin bawaan. Subpath tersebut dilacak dalam inventaris SDK agar pembangunan
    paket dan pemberian alias tetap deterministik, tetapi bukan API umum untuk
    pembuatan plugin. Kontrak host baru yang dapat digunakan kembali harus menggunakan subpath SDK generik
    seperti `plugin-sdk/gateway-runtime` dan `plugin-sdk/ssrf-runtime`.

    | Subpath | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Bersifat privat-lokal setelah Juli 2026; Helper plugin Codex bawaan untuk memproyeksikan konfigurasi server MCP pengguna ke dalam konfigurasi utas server aplikasi Codex (ekspor paket yang dicadangkan) |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex bawaan untuk mencerminkan subagen native server aplikasi Codex ke dalam status tugas OpenClaw (hanya lokal-repo, bukan ekspor paket) |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
