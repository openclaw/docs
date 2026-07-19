---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subpath Plugin bawaan dan antarmuka helper
summary: 'Katalog subpath SDK Plugin: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subpath SDK Plugin
x-i18n:
    generated_at: "2026-07-19T05:04:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3fa26ace32ca7e555508ec3869e67bd6ae2e5b3b2bfd0edb050e6d1ebfb61824
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin diekspos sebagai sekumpulan subjalur publik terbatas di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subjalur yang umum digunakan dan dikelompokkan berdasarkan
tujuan. Tiga berkas mendefinisikan permukaan tersebut:

- `scripts/lib/plugin-sdk-entrypoints.json`: inventaris titik masuk yang dipelihara
  dan dikompilasi oleh build.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subjalur
  pengujian/internal lokal repositori. Ekspor paket adalah inventaris dikurangi daftar ini.
- `src/plugin-sdk/entrypoints.ts`: metadata klasifikasi untuk subjalur
  yang tidak digunakan lagi, helper terbundel yang dicadangkan, facade terbundel yang didukung, dan
  permukaan publik milik plugin.

Pengelola mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan
subjalur helper tercadangkan yang aktif dengan `pnpm plugins:boundary-report:summary`;
ekspor helper tercadangkan yang tidak digunakan menggagalkan laporan Pipeline CI alih-alih tetap berada di
SDK publik sebagai utang kompatibilitas yang tidak aktif.

Untuk panduan pembuatan plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri plugin

| Subjalur                       | Ekspor utama                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper penyamaran, dan `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Pendaftaran pemeriksaan kondisi Doctor, deteksi, perbaikan, pemilihan, tingkat keparahan, dan jenis temuan untuk konsumen kondisi terbundel                                                                                |
| `plugin-sdk/config-schema`     | Tidak digunakan lagi. Skema Zod `openclaw.json` root (`OpenClawSchema`); sebagai gantinya, tentukan skema lokal plugin dan validasi dengan `plugin-sdk/json-schema-runtime`                                                  |

### Helper kompatibilitas dan pengujian yang tidak digunakan lagi

Subjalur yang tidak digunakan lagi tetap diekspor untuk plugin lama, tetapi kode baru sebaiknya menggunakan
subjalur SDK terfokus di bawah ini. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; Pipeline CI menolak
impor produksi terbundel darinya. Barrel luas seperti `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime`, dan
`plugin-sdk/text-runtime` hanya untuk kompatibilitas, dan `plugin-sdk/zod` adalah
ekspor ulang kompatibilitas: impor `zod` secara langsung dari `zod`. Barrel domain
luas `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime`, dan
`plugin-sdk/security-runtime` juga tidak digunakan lagi dan digantikan oleh subjalur
terfokus.

Subjalur helper pengujian berbasis Vitest milik OpenClaw hanya bersifat lokal repositori dan
bukan lagi ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks`, dan `testing`. Permukaan helper terbundel privat
`ssrf-runtime-internal` dan `codex-native-task-runtime` juga hanya bersifat lokal
repositori.

### Subjalur helper plugin terbundel yang dicadangkan

`plugin-sdk/codex-mcp-projection` adalah satu-satunya subjalur yang dicadangkan: permukaan
kompatibilitas milik plugin untuk plugin Codex terbundel, bukan API SDK umum.
Impor plugin lintas pemilik diblokir oleh pagar pengaman kontrak paket, dan
Pipeline CI gagal ketika suatu subjalur yang dicadangkan berhenti diimpor.
`plugin-sdk/codex-native-task-runtime` hanya bersifat lokal repositori dan bukan merupakan
ekspor paket.

`src/plugin-sdk/entrypoints.ts` juga melacak facade terbundel yang didukung, yaitu titik masuk SDK
yang didukung oleh plugin terbundelnya hingga kontrak generik
menggantikannya: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime`, dan `plugin-sdk/zalouser`. Beberapa di antaranya juga
tidak digunakan lagi untuk kode baru; lihat catatan per baris di bawah ini.

<AccordionGroup>
  <Accordion title="Subjalur channel">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi JSON Schema yang di-cache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, serta `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, penerjemah penyiapan, prompt daftar yang diizinkan, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multiakun/gerbang tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi ID akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu terbatas untuk daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Penguraian daftar grup akses yang diizinkan dan pembantu diagnostik grup yang disamarkan |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama beserta Zod dan pembuat JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi channel OpenClaw bawaan khusus untuk plugin bawaan yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID channel obrolan bawaan/resmi kanonis beserta label/alias pemformat bagi plugin yang perlu mengenali teks berawalan amplop tanpa mengodekan tabelnya sendiri secara permanen. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas yang tidak digunakan lagi untuk skema konfigurasi channel bawaan |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram serta pemeriksaan duplikat/konflik yang tidak digunakan lagi; gunakan penanganan konfigurasi perintah lokal plugin dalam kode plugin baru |
    | `plugin-sdk/command-gating` | Pembantu gerbang otorisasi perintah terbatas |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Penyelesai runtime ingress channel tingkat tinggi eksperimental, penyelesai kebijakan penyebutan implisit, dan pembuat fakta rute untuk jalur penerimaan channel yang telah dimigrasikan. Utamakan ini daripada menyusun daftar efektif yang diizinkan, daftar perintah yang diizinkan, dan proyeksi lama di setiap plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan beserta opsi pipeline balasan, tanda terima, pratinjau langsung/streaming, pembantu siklus hidup, identitas keluar, perencanaan payload, pengiriman persisten, dan pembantu konteks pengiriman pesan. Lihat [API outbound channel](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Pembantu pembuat rute masuk + amplop bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner masuk dan predikat pengiriman, serta `plugin-sdk/channel-outbound` untuk pembantu pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias penguraian target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Pembantu pemuatan media keluar dan status media yang di-host bersama |
    | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi jajak pendapat terbatas |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu siklus hidup dan adaptor pengikatan utas |
    | `plugin-sdk/agent-media-payload` | Root dan pemuat payload media agen |
    | `plugin-sdk/conversation-runtime` | Barrel luas yang tidak digunakan lagi untuk pengikatan percakapan/utas, pemasangan, dan pembantu pengikatan yang dikonfigurasi; utamakan subjalur pengikatan terfokus seperti `plugin-sdk/thread-bindings-runtime` dan `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Pembantu penyelesaian kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi channel terbatas |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu pengeditan/pembacaan konfigurasi daftar yang diizinkan |
    | `plugin-sdk/group-access` | Pembantu keputusan akses grup yang tidak digunakan lagi; gunakan `resolveChannelMessageIngress` dari `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Pembantu kebijakan pengamanan pra-kripto untuk DM langsung yang terbatas |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; plugin baru sebaiknya menggunakan subjalur SDK channel generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas penyelesaian akun Telegram yang tidak digunakan lagi untuk kompatibilitas pemilik yang dilacak; plugin baru sebaiknya menggunakan pembantu runtime yang diinjeksi atau subjalur SDK channel generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal yang tidak digunakan lagi untuk paket Lark/Zalo terpublikasi yang masih mengimpor otorisasi perintah pengirim; plugin baru sebaiknya menggunakan subjalur SDK channel generik |
    | `plugin-sdk/interactive-runtime` | Pembantu presentasi pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Selesaikan pilihan `ask_user` yang dibuat oleh runtime melalui Gateway dari penangan interaksi channel |
    | `plugin-sdk/channel-inbound` | Pembantu masuk bersama untuk klasifikasi peristiwa, pembuatan konteks, pemformatan, root, debounce, pencocokan penyebutan, kebijakan penyebutan, dan pencatatan masuk |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce masuk terbatas |
    | `plugin-sdk/channel-mention-gating` | Pembantu kebijakan penyebutan, penanda penyebutan, dan teks penyebutan terbatas tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Jenis hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan channel, serta pembantu skema native yang tidak digunakan lagi tetapi dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Normalisasi rute bersama, penyelesaian target berbasis parser, konversi ID utas menjadi string, kunci rute deduplikasi/ringkas, jenis target terurai, serta pembantu perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu penguraian target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Jenis kontrak channel |
    | `plugin-sdk/channel-feedback` | Pengkabelan umpan balik/reaksi |
  </Accordion>

Keluarga pembantu channel yang tidak digunakan lagi tetap tersedia hanya untuk
kompatibilitas plugin yang dipublikasikan. Rencana penghapusannya adalah: pertahankan selama jendela
migrasi plugin eksternal, pertahankan plugin repo/bawaan pada `channel-inbound` dan
`channel-outbound`, lalu hapus subjalur kompatibilitas dalam pembersihan besar SDK
berikutnya. Ini berlaku untuk keluarga lama pesan/runtime channel, streaming
channel, akses DM langsung, pecahan pembantu masuk, opsi balasan,
dan jalur pemasangan.

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/yang dihosting sendiri pilihan |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan yang dihosting sendiri dan kompatibel dengan OpenAI yang tidak digunakan lagi; gunakan `plugin-sdk/provider-setup` atau helper penyiapan milik plugin |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime autentikasi penyedia: alur loopback OAuth, pertukaran token, persistensi autentikasi, dan resolusi kunci API |
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, rendering halaman callback, helper PKCE/status, penguraian input otorisasi, helper kedaluwarsa token, dan helper pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, builder kebijakan pemutaran ulang bersama, helper endpoint penyedia, dan helper normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper katalog model penyedia langsung untuk penemuan bergaya `/models` yang dilindungi: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri penyedia plugin untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint penyedia generik, kesalahan HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan pengambilan web yang terbatas seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache penyedia pengambilan web |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial pencarian web yang terbatas untuk penyedia yang tidak memerlukan pengkabelan pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial pencarian web yang terbatas seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta setter/getter kredensial tercakup |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime penyedia pencarian web |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan helper pembacaan, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` agar kepemilikan manifes diberlakukan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, helper pengambilan penggunaan bersama, dan pengambil penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, kompatibilitas pemanggilan alat teks biasa, dan helper pembungkus bersama Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Helper pembungkus stream penyedia bersama yang bersifat publik, termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, serta utilitas stream yang kompatibel dengan Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transportasi penyedia native seperti pengambilan yang dilindungi, ekstraksi teks hasil alat, transformasi pesan transportasi, dan stream peristiwa transportasi yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/peta/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup dan penguraian perintah yang terbatas |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu reset opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan merekayasa persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam keluaran status; gunakan `error` hanya ketika
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | Permukaan otorisasi perintah luas yang tidak digunakan lagi (`resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim); gunakan otorisasi ingress/runtime saluran atau helper status perintah |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi pemberi persetujuan dan helper autentikasi tindakan dalam percakapan yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptor kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Resolver Gateway persetujuan bersama |
    | `plugin-sdk/approval-reference-runtime` | Helper pencari lokasi tahan lama yang deterministik untuk callback persetujuan dengan keterbatasan transportasi |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adaptor persetujuan native ringan untuk titik masuk saluran yang sering digunakan |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime penangan persetujuan yang lebih luas; utamakan seam adaptor/Gateway yang lebih terbatas jika sudah memadai |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native, pengikatan akun, gerbang rute, fallback penerusan, dan penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Pengikatan reaksi persetujuan yang di-hardcode, payload prompt reaksi, penyimpanan target reaksi, helper teks petunjuk reaksi, dan ekspor kompatibilitas untuk penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan eksekusi/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan eksekusi/plugin, builder kemampuan persetujuan, helper autentikasi/profil persetujuan, helper perutean/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset deduplikasi balasan masuk yang terbatas dan tidak digunakan lagi |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur saluran yang sering digunakan |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper alur login autentikasi penyedia yang dimuat secara lazy untuk pemasangan saluran privat dan kode perangkat UI Web |
    | `plugin-sdk/channel-secret-runtime` | Permukaan kontrak rahasia luas yang tidak digunakan lagi (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipe target rahasia); utamakan subpath terfokus di bawah |
    | `plugin-sdk/channel-secret-basic-runtime` | Ekspor kontrak rahasia yang terbatas dan builder registri target untuk permukaan rahasia saluran/plugin non-TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Helper penetapan rahasia TTS saluran bertingkat yang terbatas |
    | `plugin-sdk/secret-ref-runtime` | Pengetikan dan resolusi SecretRef yang terbatas, serta pencarian jalur target rencana untuk penguraian kontrak rahasia/konfigurasi |
    | `plugin-sdk/secret-provider-integration` | Kontrak manifes dan preset integrasi penyedia SecretRef khusus tipe untuk plugin yang memublikasikan preset penyedia rahasia eksternal |
    | `plugin-sdk/security-runtime` | Barrel luas yang tidak digunakan lagi untuk kepercayaan, gating DM, helper file/jalur yang dibatasi root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan sementara sibling, fallback pemindahan lintas perangkat, helper penyimpanan file privat, pelindung induk symlink, konten eksternal, penyuntingan teks sensitif, perbandingan rahasia waktu konstan, dan helper pengumpulan rahasia; utamakan subpath keamanan/SSRF/rahasia yang terfokus |
    | `plugin-sdk/ssrf-policy` | Helper daftar izin host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher tersemat yang terbatas tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Helper dispatcher tersemat, pengambilan yang dilindungi SSRF, kesalahan SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/isi mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/batas waktu isi permintaan dan `runDetachedWebhookWork` untuk pemrosesan pasca-pengakuan yang dilacak |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu runtime/pencatatan/pencadangan, peringatan jalur instalasi plugin, dan pembantu proses |
    | `plugin-sdk/runtime-env` | Pembantu terbatas untuk lingkungan runtime, pencatat, batas waktu, percobaan ulang, dan backoff |
    | `plugin-sdk/browser-config` | Fasad konfigurasi peramban yang didukung untuk profil/nilai bawaan yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol peramban |
    | `plugin-sdk/agent-harness-task-runtime` | Pembantu generik untuk siklus hidup tugas dan pengiriman penyelesaian bagi agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Pembantu Codex terbundel yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi utas Codex; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Pembantu Codex terbundel lokal repositori untuk pengawatan runtime/cermin tugas native; bukan ekspor paket |
    | `plugin-sdk/channel-runtime-context` | Pembantu generik untuk pendaftaran dan pencarian konteks runtime kanal |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang tidak digunakan lagi untuk paket kanal pihak ketiga lama; plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang tidak digunakan lagi untuk paket kanal pihak ketiga lama; plugin baru sebaiknya mengimpor subpath SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu perintah/hook/http/interaktif plugin; utamakan subpath runtime plugin yang terfokus |
    | `plugin-sdk/hook-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu pipeline webhook/hook internal; utamakan subpath runtime hook/plugin yang terfokus |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime secara malas seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pembantu eksekusi proses |
    | `plugin-sdk/node-host` | Pembantu resolusi executable host Node dan pelanjutan PTY |
    | `plugin-sdk/cli-runtime` | Barrel luas yang tidak digunakan lagi untuk pemformatan CLI, penantian, versi, pemanggilan argumen, dan pembantu kelompok perintah secara malas; utamakan subpath CLI/runtime yang terfokus |
    | `plugin-sdk/qa-runner-runtime` | Fasad yang didukung untuk mengekspos skenario QA plugin melalui permukaan perintah CLI |
    | `plugin-sdk/tts-runtime` | Fasad yang didukung untuk skema konfigurasi text-to-speech dan pembantu runtime |
    | `plugin-sdk/gateway-method-runtime` | Pembantu dispatch metode Gateway yang dicadangkan untuk rute HTTP plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu memulai klien saat event loop siap, RPC CLI gateway, galat protokol gateway, resolusi host LAN yang diiklankan, dan pembantu patch status kanal |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` serta tipe konfigurasi kanal/penyedia |
    | `plugin-sdk/plugin-config-runtime` | Pembantu konfigurasi plugin runtime seperti `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman alat pesan bersama |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan penyetel snapshot pengujian |
    | `plugin-sdk/text-autolink-runtime` | Deteksi tautan otomatis referensi berkas tanpa barrel teks yang luas |
    | `plugin-sdk/reply-runtime` | Pembantu runtime bersama untuk pesan masuk/balasan, pemotongan, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu terbatas untuk dispatch/finalisasi balasan dan label percakapan |
    | `plugin-sdk/reply-history` | Pembantu riwayat balasan bersama dengan jendela waktu singkat. Kode giliran pesan baru sebaiknya menggunakan `createChannelHistoryWindow`; pembantu peta tingkat rendah tetap hanya berupa ekspor kompatibilitas yang tidak digunakan lagi |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu terbatas untuk pemotongan teks/markdown |
    | `plugin-sdk/session-store-runtime` | Pembantu alur kerja sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembantu perbaikan/siklus hidup (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), pembantu penanda untuk nilai `sessionFile` transisional, pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, pembantu jalur penyimpanan sesi/kunci sesi, dan pembacaan waktu pembaruan, tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, kursor mentah dan terlihat yang dibatasi, pembantu target/baca/tulis bercakupan, proyeksi entri pesan terlihat, penerbitan pembaruan, kunci tulis, dan kunci hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Pembantu terfokus untuk skema agen SQLite, jalur, dan transaksi bagi runtime pihak pertama, tanpa kontrol siklus hidup basis data |
    | `plugin-sdk/cron-store-runtime` | Pembantu jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Pembantu jalur direktori state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Kontrak state berkunci bercakupan plugin, BLOB, dan sewa SQLite kooperatif, beserta pragma koneksi, pemeliharaan WAL terverifikasi, dan pembantu migrasi skema STRICT atomik. Callback sewa menerima sinyal pembatalan dan galat bertipe membedakan batas waktu, pembatalan, kehilangan kepemilikan, input tidak valid, dan kegagalan penyimpanan |
    | `plugin-sdk/routing` | Pembantu pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status kanal/akun bersama, nilai bawaan state runtime, dan pembantu metadata masalah |
    | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah berwaktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter alat/CLI umum |
    | `plugin-sdk/tool-plugin` | Menentukan plugin alat agen bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifes |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Mengekstrak bidang target pengiriman kanonis dari argumen alat |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan pembantu perintah SSH/OpenShell, termasuk preflight perintah eksekusi yang segera gagal |
    | `plugin-sdk/temp-path` | Pembantu jalur unduhan sementara bersama dan ruang kerja sementara privat yang aman |
    | `plugin-sdk/logging-core` | Pembantu pencatat subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Mode tabel Markdown dan pembantu konversi |
    | `plugin-sdk/model-session-runtime` | Pembantu penggantian model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pembantu resolusi konfigurasi penyedia Talk |
    | `plugin-sdk/json-store` | Pembantu kecil untuk membaca/menulis state JSON |
    | `plugin-sdk/json-unsafe-integers` | Pembantu penguraian JSON yang mempertahankan literal bilangan bulat tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Pembantu kunci berkas re-entrant beserta pengambilalihan aman untuk Doctor atas sidecar kunci lama yang sudah pasti kedaluwarsa dan tidak berubah |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache deduplikasi berbasis disk |
    | `plugin-sdk/ingress-effect-once` | Pelindung klaim/commit yang tahan lama untuk efek samping ingress non-idempoten |
    | `plugin-sdk/acp-runtime` | Pembantu runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-runtime-backend` | Pembantu ringan untuk pendaftaran backend ACP dan dispatch balasan bagi plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi pengikatan ACP hanya-baca tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang tidak digunakan lagi; impor primitif skema dari permukaan milik plugin yang dipelihara |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Pembantu resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pemasangan, termasuk `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitif pembantu bersama untuk kanal pasif, status, dan proksi ambien |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu daftar perintah skill |
    | `plugin-sdk/native-command-registry` | Pembantu registri/pembuatan/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, pembantu mengarahkan/membatalkan proses aktif, pembantu jembatan alat OpenClaw, pembantu kebijakan alat rencana runtime, klasifikasi hasil akhir terminal, pembantu pemformatan/detail kemajuan alat, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Fasad deteksi endpoint milik penyedia Z.AI yang tidak digunakan lagi; gunakan API publik plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pembantu kunci asinkron lokal proses untuk berkas state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Pembantu telemetri aktivitas kanal |
    | `plugin-sdk/concurrency-runtime` | Pembantu konkurensi tugas asinkron yang dibatasi |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache deduplikasi dalam memori dan berbasis penyimpanan persisten |
    | `plugin-sdk/delivery-queue-runtime` | Pembantu pengurasan pengiriman tertunda keluar |
    | `plugin-sdk/file-access-runtime` | Pembantu jalur berkas lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Pembantu bangun, peristiwa, dan visibilitas Heartbeat |
    | `plugin-sdk/expect-runtime` | Pembantu penegasan nilai wajib untuk invarian runtime yang dapat dibuktikan |
    | `plugin-sdk/number-runtime` | Pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Pembantu antrean peristiwa sistem |
    | `plugin-sdk/transport-ready-runtime` | Pembantu menunggu kesiapan transportasi |
    | `plugin-sdk/exec-approvals-runtime` | Pembantu berkas kebijakan persetujuan eksekusi tanpa barrel infra-runtime yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subpath runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Pembantu tanda diagnostik, peristiwa, dan konteks pelacakan |
    | `plugin-sdk/error-runtime` | Graf galat, pemformatan, pembantu klasifikasi galat bersama, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pembantu fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan lookup yang disematkan |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang menyadari dispatcher tanpa impor proksi/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Pembantu sanitasi URL data gambar inline dan pengenalan signature tanpa permukaan runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Pembaca isi respons yang dibatasi berdasarkan byte, waktu idle, dan tenggat tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State pengikatan percakapan saat ini tanpa perutean pengikatan terkonfigurasi atau penyimpanan pemasangan |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Primitif terbatas untuk koersi dan normalisasi record/string tanpa impor markdown/pencatatan |
    | `plugin-sdk/html-entity-runtime` | Pendekodean entitas HTML5 berakhiran titik koma dalam sekali lintasan tanpa utilitas teks yang luas |
    | `plugin-sdk/text-utility-runtime` | Pembantu teks dan jalur tingkat rendah, termasuk escaping HTML lima entitas |
    | `plugin-sdk/widget-html` | Deteksi dokumen lengkap, validasi ukuran, dan galat input alat untuk widget HTML mandiri |
    | `plugin-sdk/host-runtime` | Pembantu normalisasi nama host dan host SCP |
    | `plugin-sdk/retry-runtime` | Pembantu konfigurasi percobaan ulang dan runner percobaan ulang |
    | `plugin-sdk/agent-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu direktori/identitas/ruang kerja agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi; utamakan subpath agen/runtime yang terfokus |
    | `plugin-sdk/directory-runtime` | Kueri/deduplikasi direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel media luas yang tidak digunakan lagi, mencakup `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang tidak digunakan lagi; utamakan `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media`, dan subpath runtime kapabilitas, serta utamakan helper penyimpanan sebelum pembacaan buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang tidak tersedia |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media beserta ekspor helper gambar/audio/ekstraksi terstruktur yang ditujukan bagi penyedia |
    | `plugin-sdk/text-chunking` | Pemecahan teks keluar dan rentang dengan mempertahankan offset, helper pemecahan/render markdown, tokenisasi tag HTML yang mempertimbangkan kutipan, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/speech` | Tipe penyedia ucapan beserta ekspor pembuat TTS yang kompatibel dengan OpenAI, serta helper direktif, registri, validasi, dan ucapan yang ditujukan bagi penyedia |
    | `plugin-sdk/speech-core` | Tipe penyedia ucapan, registri, direktif, normalisasi, dan ekspor helper ucapan bersama |
    | `plugin-sdk/speech-settings` | Primitif resolusi dan normalisasi konfigurasi TTS ringan tanpa registri penyedia atau runtime sintesis |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi waktu nyata, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil waktu nyata untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang dibatasi |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara waktu nyata, helper registri, gerbang energi audio/awal ucapan bersama, dan helper perilaku suara waktu nyata, termasuk harness sesi yang tidak bergantung pada transportasi dan pelacakan aktivitas keluaran |
    | `plugin-sdk/meeting-runtime` | Runtime sesi rapat browser, mesin/transportasi audio waktu nyata, `MeetingPlatformAdapter`, kontrol browser/node, konsultasi agen, delegasi panggilan suara, pemeriksaan penyiapan, dan helper perintah SoX |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar beserta helper aset gambar/URL data dan pembuat penyedia gambar yang kompatibel dengan OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar, failover, autentikasi, dan helper registri bersama |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan penguraian referensi model yang tidak digunakan lagi; utamakan permukaan penyedia musik milik plugin |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video, helper failover, pencarian penyedia, dan penguraian referensi model bersama |
    | `plugin-sdk/transcripts` | Tipe penyedia sumber transkrip, helper registri, deskriptor sesi, dan metadata tuturan bersama |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang tidak digunakan lagi; impor `zod` langsung dari `zod` |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` minimal lokal repositori untuk pengujian unit registrasi plugin langsung tanpa mengimpor jembatan helper pengujian repositori |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adaptor runtime agen native lokal repositori untuk pengujian autentikasi, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi saluran lokal repositori untuk kontrak tindakan/penyiapan/status generik, pernyataan direktori, siklus hidup permulaan akun, penerusan konfigurasi pengiriman, mock runtime, masalah status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Rangkaian kasus kesalahan resolusi target bersama lokal repositori untuk pengujian saluran |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak saluran terbatas lokal repositori tanpa barrel pengujian luas |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor lokal repositori |
    | `plugin-sdk/plugin-state-test-runtime` | Helper pengujian penyimpanan status plugin, antrean masuk, dan DB status lokal repositori |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, autentikasi, penemuan, onboarding, katalog, wizard, kapabilitas media, kebijakan pemutaran ulang, audio langsung STT waktu nyata, pencarian/pengambilan web, dan stream lokal repositori |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest opsional lokal repositori untuk pengujian penyedia yang menggunakan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Helper lokal repositori untuk melampirkan metadata ke fixture payload balasan |
    | `plugin-sdk/sqlite-runtime-testing` | Helper siklus hidup SQLite lokal repositori untuk pengujian pihak pertama |
    | `plugin-sdk/test-fixtures` | Fixture penangkapan runtime CLI generik, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur plugin bawaan, teks terminal, pemecahan, token autentikasi, dan kasus bertipe lokal repositori |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus lokal repositori untuk digunakan di dalam factory `vi.mock("node:*")` Vitest |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori yang tidak digunakan lagi; utamakan subpath host memori yang netral terhadap vendor |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registri penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registri, penyedia lokal, serta helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini tidak digunakan lagi; gunakan API penyedia embedding generik untuk penyedia baru. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori yang tidak digunakan lagi; utamakan subpath host memori yang netral terhadap vendor |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori yang tidak digunakan lagi; utamakan subpath host memori yang netral terhadap vendor |
    | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori |
    | `plugin-sdk/memory-core-host-events` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola bersama untuk plugin yang berkaitan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime memori aktif untuk akses pengelola pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subpath helper bawaan yang dicadangkan">
    Subpath SDK helper bawaan yang dicadangkan adalah permukaan terbatas khusus pemilik untuk
    kode plugin bawaan. Subpath tersebut dilacak dalam inventaris SDK agar pembangunan
    paket dan pembuatan alias tetap deterministik, tetapi bukan merupakan API umum untuk
    pembuatan plugin. Kontrak host baru yang dapat digunakan kembali harus memakai subpath SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subpath | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper plugin Codex bawaan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread server aplikasi Codex (ekspor paket yang dicadangkan) |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex bawaan untuk mencerminkan subagen native server aplikasi Codex ke status tugas OpenClaw (khusus lokal repositori, bukan ekspor paket) |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
