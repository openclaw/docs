---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subpath SDK Plugin: lokasi setiap impor, dikelompokkan berdasarkan area'
title: Subpath SDK Plugin
x-i18n:
    generated_at: "2026-07-20T03:57:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17f09b2095cbef8f330dbb500c11bd86ff79cb2d93b1f1d2feadb2b3e44127c2
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin berisi subjalur publik yang terbatas dan pembantu terbundel khusus repositori
di bawah `openclaw/plugin-sdk/`. Halaman ini mengatalogkan keduanya dan secara eksplisit memberi label
pada entri privat-lokal. Tiga berkas menentukan batas tersebut:

- `scripts/lib/plugin-sdk-entrypoints.json`: inventaris titik masuk terpelihara
  yang dikompilasi oleh build.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subjalur pengujian/internal
  lokal repositori. Ekspor paket adalah inventaris dikurangi daftar ini.
- `src/plugin-sdk/entrypoints.ts`: metadata klasifikasi untuk subjalur
  yang tidak digunakan lagi, pembantu terbundel yang dicadangkan, fasad terbundel yang didukung, dan
  permukaan publik milik plugin.

Pengelola mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan
subjalur pembantu aktif yang dicadangkan dengan `pnpm plugins:boundary-report:summary`;
ekspor pembantu cadangan yang tidak digunakan menggagalkan laporan CI alih-alih tetap berada dalam
SDK publik sebagai utang kompatibilitas yang tidak aktif.

Untuk panduan penulisan plugin, lihat [ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri plugin

| Subjalur                       | Ekspor utama                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Privat-lokal setelah Juli 2026; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Privat-lokal setelah Juli 2026; Pembantu item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, pembantu penyamaran, dan `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Privat-lokal setelah Juli 2026; Pembantu migrasi runtime seperti `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`              |
| `plugin-sdk/health`            | Pendaftaran pemeriksaan kesehatan Doctor, deteksi, perbaikan, pemilihan, tingkat keparahan, dan tipe temuan untuk konsumen kesehatan terbundel                                                           |

### Kompatibilitas dan pembantu privat-lokal

Hanya subjalur yang tidak digunakan lagi dari jendela waktu berikutnya yang tetap diekspor. Alias Juli 2026 dan
subjalur yang tidak digunakan telah dihapus, sedangkan pembantu khusus terbundel telah dihapus dari
paket publik dan diberi label privat-lokal di bawah ini. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak pembantu terbundel
`plugin-sdk/text-runtime` yang hanya untuk kompatibilitas, dan `plugin-sdk/zod` merupakan
ekspor ulang kompatibilitas: impor `zod` secara langsung dari `zod`. Barrel domain yang luas
`plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime`, dan
`plugin-sdk/security-runtime` juga tidak digunakan lagi dan digantikan oleh
subjalur yang lebih terfokus.

Subjalur pembantu pengujian berbasis Vitest milik OpenClaw hanya tersedia secara lokal di repositori dan tidak
lagi menjadi ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks`, dan `testing`. Permukaan pembantu terbundel privat
`ssrf-runtime-internal` dan `codex-native-task-runtime` juga hanya tersedia secara lokal
di repositori.

### Subjalur pembantu plugin terbundel

Modul pembantu khusus terbundel bersifat privat-lokal setelah penyisiran Juli 2026. Impor lintas pemilik diblokir oleh pagar pengaman kontrak paket. `src/plugin-sdk/entrypoints.ts` secara terpisah melacak fasad terbundel yang didukung dan tetap bersifat publik, yaitu titik masuk SDK
yang didukung oleh plugin terbundelnya hingga kontrak generik menggantikan
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
yang tidak digunakan lagi untuk kode baru; lihat catatan per baris di bawah ini.

<AccordionGroup>
  <Accordion title="Subjalur channel">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Privat-lokal setelah Juli 2026; Pembantu validasi JSON Schema yang disimpan dalam cache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, serta `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, penerjemah penyiapan, prompt daftar izin, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi/gerbang tindakan multiakun, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi ID akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu terbatas untuk daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Privat-lokal setelah Juli 2026; Pembantu penguraian daftar izin grup akses dan diagnostik grup yang disamarkan |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama beserta Zod dan pembuat JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Privat-lokal setelah Juli 2026; Skema konfigurasi channel OpenClaw terbundel hanya untuk plugin terbundel yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | Privat-lokal setelah Juli 2026; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID channel obrolan terbundel/resmi kanonis beserta label/alias pemformat untuk plugin yang perlu mengenali teks berprefiks amplop tanpa melakukan hardcode pada tabelnya sendiri. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress channel tingkat tinggi eksperimental, resolver kebijakan penyebutan implisit, dan pembuat fakta rute untuk jalur penerimaan channel yang telah dimigrasikan. Utamakan ini daripada menyusun daftar izin efektif, daftar izin perintah, dan proyeksi lama di setiap plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan beserta opsi pipeline balasan, tanda terima, pratinjau langsung/streaming, pembantu siklus hidup, identitas keluar, perencanaan payload, pengiriman tahan lama, dan pembantu konteks pengiriman pesan. Lihat [API keluar channel](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Pembantu bersama untuk rute masuk + pembuat amplop |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner masuk dan predikat pengiriman, serta `plugin-sdk/channel-outbound` untuk pembantu penyampaian pesan. |
    | `plugin-sdk/messaging-targets` | Alias penguraian target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Privat-lokal setelah Juli 2026; Pembantu bersama untuk pemuatan media keluar dan status media yang dihosting |
    | `plugin-sdk/poll-runtime` | Privat-lokal setelah Juli 2026; Pembantu terbatas untuk normalisasi jajak pendapat |
    | `plugin-sdk/thread-bindings-runtime` | Privat-lokal setelah Juli 2026; Pembantu siklus hidup dan adaptor pengikatan utas |
    | `plugin-sdk/agent-media-payload` | Fasad kompatibilitas yang tidak digunakan lagi untuk akar dan pemuat payload media agen. Plugin channel baru menggunakan perencanaan payload keluar bertipe dari `plugin-sdk/channel-outbound`; pemuatan media lokal yang disediakan operator masih menggunakan fasad yang dipertahankan hingga tersedia seam akar lokal publik yang terfokus. |
    | `plugin-sdk/conversation-runtime` | Barrel luas yang tidak digunakan lagi untuk pengikatan percakapan/utas, pemasangan, dan pembantu pengikatan terkonfigurasi; utamakan subjalur pengikatan terfokus seperti `plugin-sdk/thread-bindings-runtime` dan `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu bersama untuk snapshot/ringkasan status channel |
    | `plugin-sdk/channel-config-primitives` | Primitif terbatas untuk skema konfigurasi channel |
    | `plugin-sdk/channel-config-writes` | Privat-lokal setelah Juli 2026; Pembantu otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor pendahuluan plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu pengeditan/pembacaan konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Pembantu keputusan akses grup yang tidak digunakan lagi; gunakan `resolveChannelMessageIngress` dari `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Privat-lokal setelah Juli 2026; Pembantu kebijakan penjaga pra-kriptografi DM langsung yang terbatas |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; plugin baru harus menggunakan subjalur SDK channel generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas pemilik yang dilacak; plugin baru harus menggunakan pembantu runtime yang diinjeksi atau subjalur SDK channel generik |
    | `plugin-sdk/interactive-runtime` | Pembantu presentasi pesan semantik, penyampaian, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Selesaikan pilihan `ask_user` yang dibuat oleh runtime melalui Gateway dari penangan interaksi channel |
    | `plugin-sdk/channel-inbound` | Pembantu masuk bersama untuk klasifikasi peristiwa, pembuatan konteks, pemformatan, akar, debounce, pencocokan penyebutan, kebijakan penyebutan, dan pencatatan masuk |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce masuk yang terbatas |
    | `plugin-sdk/channel-mention-gating` | Privat-lokal setelah Juli 2026; Pembantu terbatas untuk kebijakan penyebutan, penanda penyebutan, dan teks penyebutan tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan channel, beserta pembantu skema native yang tidak digunakan lagi tetapi dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Privat-lokal setelah Juli 2026; Normalisasi rute bersama, resolusi target berbasis parser, konversi ID utas menjadi string, kunci rute deduplikasi/ringkas, tipe target terurai, dan pembantu perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Privat-lokal setelah Juli 2026; Pembantu penguraian target; pemanggil perbandingan rute harus menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Pengkabelan umpan balik/reaksi |
  </Accordion>

Subjalur kompatibilitas channel dari jendela waktu berikutnya tetap bersifat publik hanya hingga
tanggal registrinya. Alias Juli seperti akses DM langsung, opsi balasan, jalur
pemasangan, dan pecahan runtime channel telah dihapus; pembantu khusus terbundel
bersifat privat-lokal.

  <Accordion title="Subjalur penyedia">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Privat-lokal setelah Juli 2026; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Privat-lokal setelah Juli 2026; Pembantu penyiapan penyedia lokal/yang dihosting sendiri dan terkurasi |
    | `plugin-sdk/cli-backend` | Privat-lokal setelah Juli 2026; Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Privat-lokal setelah Juli 2026; Pembantu runtime autentikasi penyedia: alur loopback OAuth, pertukaran token, persistensi autentikasi, dan resolusi kunci API |
    | `plugin-sdk/provider-oauth-runtime` | Privat-lokal setelah Juli 2026; Tipe callback OAuth penyedia generik, perenderan halaman callback, pembantu PKCE/status, penguraian input otorisasi, pembantu kedaluwarsa token, dan pembantu pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Privat-lokal setelah Juli 2026; Pembantu onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Privat-lokal setelah Juli 2026; Pembuat hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Privat-lokal setelah Juli 2026; Pembantu pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pembantu impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | Privat-lokal setelah Juli 2026; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, pembuat kebijakan pemutaran ulang bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Privat-lokal setelah Juli 2026; Pembantu katalog model penyedia langsung untuk penemuan bergaya `/models` yang dilindungi: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri penyedia Plugin untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | Privat-lokal setelah Juli 2026; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Privat-lokal setelah Juli 2026; Pembantu kapabilitas HTTP/endpoint penyedia generik, galat HTTP penyedia, dan pembantu formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Privat-lokal setelah Juli 2026; Pembantu kontrak konfigurasi/pemilihan pengambilan web terbatas seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Privat-lokal setelah Juli 2026; Pembantu pendaftaran/cache penyedia pengambilan web |
    | `plugin-sdk/provider-web-search-config-contract` | Privat-lokal setelah Juli 2026; Pembantu konfigurasi/kredensial pencarian web terbatas untuk penyedia yang tidak memerlukan pengkabelan pengaktifan Plugin |
    | `plugin-sdk/provider-web-search-contract` | Privat-lokal setelah Juli 2026; Pembantu kontrak konfigurasi/kredensial pencarian web terbatas seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta penyetel/pengambil kredensial dengan cakupan |
    | `plugin-sdk/provider-web-search` | Privat-lokal setelah Juli 2026; Pembantu pendaftaran/cache/runtime penyedia pencarian web |
    | `plugin-sdk/embedding-providers` | Privat-lokal setelah Juli 2026; Tipe penyedia embedding umum dan pembantu pembacaan, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; Plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` agar kepemilikan manifes diberlakukan |
    | `plugin-sdk/provider-tools` | Privat-lokal setelah Juli 2026; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Privat-lokal setelah Juli 2026; Tipe snapshot penggunaan penyedia, pembantu pengambilan penggunaan bersama, dan pengambil penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Privat-lokal setelah Juli 2026; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus aliran, kompatibilitas pemanggilan alat teks biasa, dan pembantu pembungkus Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI bersama |
    | `plugin-sdk/provider-stream-shared` | Privat-lokal setelah Juli 2026; Pembantu pembungkus aliran penyedia bersama publik termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, serta utilitas aliran yang kompatibel dengan Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Privat-lokal setelah Juli 2026; Pembantu transportasi penyedia native seperti pengambilan yang dilindungi, ekstraksi teks hasil alat, transformasi pesan transportasi, dan aliran peristiwa transportasi yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Privat-lokal setelah Juli 2026; Pembantu patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Privat-lokal setelah Juli 2026; Pembantu singleton/peta/cache lokal-proses |
    | `plugin-sdk/group-activation` | Privat-lokal setelah Juli 2026; Pembantu penguraian perintah dan mode aktivasi grup terbatas |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu reset opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan membuat-buat persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam keluaran status; gunakan `error` hanya saat
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | Permukaan otorisasi perintah luas yang tidak digunakan lagi (`resolveControlCommandGate`, pembantu registri perintah termasuk pemformatan menu argumen dinamis, pembantu otorisasi pengirim); gunakan otorisasi ingress/runtime kanal atau pembantu status perintah |
    | `plugin-sdk/command-status` | Pembuat pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pembantu resolusi pemberi persetujuan dan autentikasi tindakan dalam percakapan yang sama |
    | `plugin-sdk/approval-client-runtime` | Pembantu profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptor kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Resolver Gateway persetujuan bersama |
    | `plugin-sdk/approval-reference-runtime` | Privat-lokal setelah Juli 2026; Pembantu pencari lokasi persisten deterministik untuk callback persetujuan yang dibatasi transportasi |
    | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu pemuatan adaptor persetujuan native ringan untuk titik masuk kanal berjalur panas |
    | `plugin-sdk/approval-handler-runtime` | Pembantu runtime penangan persetujuan yang lebih luas; utamakan seam adaptor/Gateway yang lebih terbatas jika sudah memadai |
    | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan native, pengikatan akun, gerbang rute, fallback penerusan, dan penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Privat-lokal setelah Juli 2026; Pengikatan reaksi persetujuan yang di-hardcode, payload prompt reaksi, penyimpanan target reaksi, pembantu teks petunjuk reaksi, dan ekspor kompatibilitas untuk penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reply-runtime` | Pembantu payload balasan persetujuan eksekusi/Plugin |
    | `plugin-sdk/approval-runtime` | Pembantu payload persetujuan eksekusi/Plugin, pembuat kapabilitas persetujuan, pembantu autentikasi/profil persetujuan, pembantu perutean/runtime persetujuan native, dan pembantu tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan pembantu target sesi native |
    | `plugin-sdk/command-detection` | Pembantu deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur kanal berjalur panas |
    | `plugin-sdk/command-surface` | Privat-lokal setelah Juli 2026; Pembantu normalisasi isi perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Privat-lokal setelah Juli 2026; Pembantu alur login autentikasi penyedia yang dimuat secara malas untuk pemasangan kode perangkat kanal privat dan UI Web |
    | `plugin-sdk/channel-secret-runtime` | Permukaan kontrak rahasia luas yang tidak digunakan lagi (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipe target rahasia); utamakan subjalur terfokus di bawah |
    | `plugin-sdk/channel-secret-basic-runtime` | Ekspor kontrak rahasia terbatas dan pembuat registri target untuk permukaan rahasia kanal/Plugin non-TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Privat-lokal setelah Juli 2026; Pembantu penetapan rahasia TTS kanal bertingkat yang terbatas |
    | `plugin-sdk/secret-ref-runtime` | Pengetikan, resolusi, dan pencarian jalur target rencana SecretRef terbatas untuk penguraian kontrak rahasia/konfigurasi |
    | `plugin-sdk/security-runtime` | Barrel luas yang tidak digunakan lagi untuk kepercayaan, pembatasan DM, pembantu file/jalur yang dibatasi root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan sementara berdampingan, fallback pemindahan lintas perangkat, pembantu penyimpanan file privat, pelindung induk symlink, konten eksternal, penyuntingan teks sensitif, perbandingan rahasia waktu konstan, dan pembantu pengumpulan rahasia; utamakan subjalur keamanan/SSRF/rahasia yang terfokus |
    | `plugin-sdk/ssrf-policy` | Daftar host yang diizinkan dan pembantu kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Privat-lokal setelah Juli 2026; Pembantu dispatcher tersemat yang terbatas tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Pembantu dispatcher tersemat, pengambilan yang dilindungi SSRF, galat SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Pembantu penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Pembantu permintaan/target Webhook dan koersi websocket/isi mentah |
    | `plugin-sdk/webhook-request-guards` | Pembantu ukuran/batas waktu isi permintaan dan `runDetachedWebhookWork` untuk pemrosesan pasca-pengakuan yang terlacak |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu runtime/pencatatan/pencadangan, peringatan jalur instalasi plugin, dan pembantu proses |
    | `plugin-sdk/runtime-env` | Pembantu lingkungan runtime terbatas, pencatat, batas waktu, percobaan ulang, dan jeda mundur |
    | `plugin-sdk/browser-config` | Lokal privat setelah Juli 2026; fasad konfigurasi peramban yang didukung untuk profil/nilai default yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol peramban |
    | `plugin-sdk/agent-harness-task-runtime` | Lokal privat setelah Juli 2026; pembantu siklus hidup tugas generik dan pengiriman penyelesaian untuk agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Lokal privat setelah Juli 2026; pembantu Codex terpaket yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi utas Codex; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Pembantu Codex terpaket lokal repositori untuk pencerminan tugas native dan pengawatan runtime; bukan ekspor paket |
    | `plugin-sdk/channel-runtime-context` | Pembantu registrasi dan pencarian konteks runtime kanal generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang tidak digunakan lagi untuk paket kanal pihak ketiga lama; plugin baru harus mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu perintah/hook/HTTP/interaktif plugin; utamakan subjalur runtime plugin yang terfokus |
    | `plugin-sdk/hook-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu pipeline webhook/hook internal; utamakan subjalur runtime hook/plugin yang terfokus |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime lambat seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Lokal privat setelah Juli 2026; pembantu eksekusi proses |
    | `plugin-sdk/node-host` | Lokal privat setelah Juli 2026; pembantu resolusi executable host Node dan pelanjutan PTY |
    | `plugin-sdk/cli-runtime` | Lokal privat setelah Juli 2026; barrel luas yang tidak digunakan lagi untuk pemformatan CLI, penantian, versi, pemanggilan argumen, dan pembantu grup perintah lambat; utamakan subjalur CLI/runtime yang terfokus |
    | `plugin-sdk/qa-runner-runtime` | Lokal privat setelah Juli 2026; fasad yang didukung untuk mengekspos skenario QA plugin melalui permukaan perintah CLI |
    | `plugin-sdk/tts-runtime` | Lokal privat setelah Juli 2026; fasad yang didukung untuk skema konfigurasi teks-ke-suara dan pembantu runtime |
    | `plugin-sdk/gateway-method-runtime` | Pembantu pengiriman metode Gateway yang dicadangkan untuk rute HTTP plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu mulai klien yang siap untuk loop peristiwa, RPC CLI gateway, galat protokol gateway, resolusi host LAN yang diumumkan, dan pembantu patch status kanal |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi kanal/penyedia |
    | `plugin-sdk/plugin-config-runtime` | Fasad kompatibilitas yang tidak digunakan lagi untuk pembantu konfigurasi plugin runtime; plugin baru menggunakan `api.pluginConfig` beserta kontrak konfigurasi, snapshot, dan pembantu mutasi yang terfokus |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Lokal privat setelah Juli 2026; string petunjuk metadata pengiriman alat pesan bersama |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan penyetel snapshot pengujian |
    | `plugin-sdk/text-autolink-runtime` | Lokal privat setelah Juli 2026; deteksi tautan otomatis referensi berkas tanpa barrel teks luas |
    | `plugin-sdk/reply-runtime` | Pembantu runtime pesan masuk/balasan bersama, pemotongan, pengiriman, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu pengiriman/finalisasi balasan dan label percakapan yang terbatas |
    | `plugin-sdk/reply-history` | Pembantu riwayat balasan jangka pendek bersama. Kode giliran pesan baru harus menggunakan `createChannelHistoryWindow`; pembantu peta tingkat rendah tetap hanya menjadi ekspor kompatibilitas yang tidak digunakan lagi |
    | `plugin-sdk/reply-reference` | Lokal privat setelah Juli 2026; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu pemotongan teks/markdown yang terbatas |
    | `plugin-sdk/session-store-runtime` | Pembantu alur kerja sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembantu perbaikan/siklus hidup (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), pembantu penanda untuk nilai transisional `sessionFile`, pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, pembantu jalur penyimpanan sesi/kunci sesi, serta pembacaan waktu pembaruan, tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/session-transcript-runtime` | Lokal privat setelah Juli 2026; identitas transkrip, kursor mentah dan terlihat yang dibatasi, pembantu target/baca/tulis bercakupan, proyeksi entri pesan terlihat, penerbitan pembaruan, kunci tulis, dan kunci hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Lokal privat setelah Juli 2026; pembantu skema agen SQLite, jalur, dan transaksi yang terfokus untuk runtime pihak pertama, tanpa kontrol siklus hidup basis data |
    | `plugin-sdk/cron-store-runtime` | Lokal privat setelah Juli 2026; pembantu jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Pembantu jalur direktori status/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Lokal privat setelah Juli 2026; kontrak status berkunci bercakupan plugin, BLOB, dan sewa SQLite kooperatif, beserta pragma koneksi, pemeliharaan WAL terverifikasi, serta pembantu migrasi skema STRICT atomik. Callback sewa menerima sinyal pembatalan dan galat bertipe membedakan batas waktu, pembatalan, kehilangan kepemilikan, masukan tidak valid, dan kegagalan penyimpanan |
    | `plugin-sdk/routing` | Pembantu pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status kanal/akun bersama, nilai default status runtime, dan pembantu metadata masalah |
    | `plugin-sdk/target-resolver-runtime` | Lokal privat setelah Juli 2026; pembantu resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Lokal privat setelah Juli 2026; pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Lokal privat setelah Juli 2026; mengekstrak URL string dari masukan mirip fetch/request |
    | `plugin-sdk/run-command` | Pelaksana perintah berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter alat/CLI umum |
    | `plugin-sdk/tool-plugin` | Mendefinisikan plugin alat agen bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifes |
    | `plugin-sdk/tool-payload` | Lokal privat setelah Juli 2026; mengekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Mengekstrak bidang target pengiriman kanonis dari argumen alat |
    | `plugin-sdk/sandbox` | Lokal privat setelah Juli 2026; tipe backend sandbox dan pembantu perintah SSH/OpenShell, termasuk prapemeriksaan perintah eksekusi yang segera gagal |
    | `plugin-sdk/temp-path` | Pembantu jalur unduhan sementara bersama dan ruang kerja sementara privat yang aman |
    | `plugin-sdk/logging-core` | Pembantu pencatat subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Lokal privat setelah Juli 2026; pembantu mode dan konversi tabel Markdown |
    | `plugin-sdk/model-session-runtime` | Pembantu penggantian model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Lokal privat setelah Juli 2026; pembantu resolusi konfigurasi penyedia bicara |
    | `plugin-sdk/json-store` | Pembantu baca/tulis status JSON kecil |
    | `plugin-sdk/json-unsafe-integers` | Lokal privat setelah Juli 2026; pembantu penguraian JSON yang mempertahankan literal bilangan bulat tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Lokal privat setelah Juli 2026; pembantu kunci berkas reentran serta pengambilalihan aman oleh Doctor atas sidecar kunci lama yang dipastikan kedaluwarsa dan tidak berubah |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache deduplikasi berbasis cakram |
    | `plugin-sdk/ingress-effect-once` | Pelindung klaim/commit tahan lama untuk efek samping masuk yang tidak idempoten |
    | `plugin-sdk/acp-runtime` | Lokal privat setelah Juli 2026; pembantu runtime/sesi ACP dan pengiriman balasan |
    | `plugin-sdk/acp-runtime-backend` | Lokal privat setelah Juli 2026; pembantu ringan untuk registrasi backend ACP dan pengiriman balasan bagi plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Lokal privat setelah Juli 2026; resolusi pengikatan ACP hanya-baca tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang tidak digunakan lagi; impor primitif skema dari permukaan milik plugin yang dipelihara |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Lokal privat setelah Juli 2026; pembantu resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pemasangan, termasuk `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitif pembantu kanal pasif, status, dan proksi sekitar bersama |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu daftar perintah Skill |
    | `plugin-sdk/native-command-registry` | Pembantu registri/pembuatan/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, pembantu pengarah/pembatal aktif, pembantu jembatan alat OpenClaw, pembantu kebijakan alat rencana runtime, klasifikasi hasil terminal, pembantu pemformatan/detail progres alat, dan utilitas hasil percobaan |
    | `plugin-sdk/async-lock-runtime` | Lokal privat setelah Juli 2026; pembantu kunci asinkron lokal proses untuk berkas status runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Lokal privat setelah Juli 2026; pembantu telemetri aktivitas kanal |
    | `plugin-sdk/concurrency-runtime` | Lokal privat setelah Juli 2026; pembantu konkurensi tugas asinkron terbatas |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache deduplikasi dalam memori dan berbasis penyimpanan persisten |
    | `plugin-sdk/delivery-queue-runtime` | Lokal privat setelah Juli 2026; pembantu penguras pengiriman keluar yang tertunda |
    | `plugin-sdk/file-access-runtime` | Lokal privat setelah Juli 2026; pembantu jalur berkas lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Lokal privat setelah Juli 2026; pembantu bangun, peristiwa, dan visibilitas Heartbeat |
    | `plugin-sdk/expect-runtime` | Lokal privat setelah Juli 2026; pembantu asersi nilai wajib untuk invarian runtime yang dapat dibuktikan |
    | `plugin-sdk/number-runtime` | Lokal privat setelah Juli 2026; pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Lokal privat setelah Juli 2026; pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Lokal privat setelah Juli 2026; pembantu antrean peristiwa sistem |
    | `plugin-sdk/transport-ready-runtime` | Lokal privat setelah Juli 2026; pembantu penantian kesiapan transportasi |
    | `plugin-sdk/exec-approvals-runtime` | Lokal privat setelah Juli 2026; pembantu berkas kebijakan persetujuan eksekusi tanpa barrel infra-runtime yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Pembantu tanda diagnostik, peristiwa, dan konteks pelacakan |
    | `plugin-sdk/error-runtime` | Graf galat, pemformatan, pembantu klasifikasi galat bersama, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Lokal privat setelah Juli 2026; pembantu fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan pencarian tersemat |
    | `plugin-sdk/runtime-fetch` | Lokal privat setelah Juli 2026; fetch runtime yang menyadari dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Lokal privat setelah Juli 2026; pembersih URL data gambar inline dan pembantu deteksi tanda tangan tanpa permukaan runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Lokal privat setelah Juli 2026; pembaca isi respons yang dibatasi berdasarkan byte, waktu menganggur, dan tenggat tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | Lokal privat setelah Juli 2026; status pengikatan percakapan saat ini tanpa perutean pengikatan terkonfigurasi atau penyimpanan pemasangan |
    | `plugin-sdk/context-visibility-runtime` | Lokal privat setelah Juli 2026; resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Pembantu koersi dan normalisasi record/string primitif yang terbatas tanpa impor markdown/pencatatan |
    | `plugin-sdk/html-entity-runtime` | Lokal privat setelah Juli 2026; dekode entitas HTML5 sekali lintas yang diakhiri titik koma tanpa utilitas teks yang luas |
    | `plugin-sdk/text-utility-runtime` | Lokal-privat setelah Juli 2026; pembantu teks dan jalur tingkat rendah, termasuk pengamanan HTML lima entitas |
    | `plugin-sdk/widget-html` | Deteksi dokumen lengkap, validasi ukuran, dan kesalahan input alat untuk widget HTML mandiri |
    | `plugin-sdk/host-runtime` | Lokal-privat setelah Juli 2026; pembantu normalisasi nama host dan host SCP |
    | `plugin-sdk/retry-runtime` | Lokal-privat setelah Juli 2026; pembantu konfigurasi percobaan ulang dan pelaksana percobaan ulang |
    | `plugin-sdk/agent-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu direktori/identitas/ruang kerja agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi; utamakan subjalur agen/runtime yang terfokus |
    | `plugin-sdk/directory-runtime` | Kueri/deduplikasi direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | Lokal-privat setelah Juli 2026; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel media luas yang tidak digunakan lagi, termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang tidak digunakan lagi; utamakan `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media`, dan subpath runtime kapabilitas, serta utamakan helper penyimpanan sebelum membaca buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Helper terbatas untuk normalisasi MIME, pemetaan ekstensi file, deteksi MIME, dan jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Privat-lokal setelah Juli 2026; Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang tidak tersedia |
    | `plugin-sdk/media-understanding` | Fasad kompatibilitas yang tidak digunakan lagi untuk tipe dan helper penyedia pemahaman media; penyedia baru mendaftar melalui API plugin yang diinjeksi dan mempertahankan kepemilikan helper permintaan di plugin |
    | `plugin-sdk/text-chunking` | Pemenggalan teks keluar dan rentang dengan mempertahankan offset, helper pemenggalan/perenderan markdown, tokenisasi tag HTML yang memperhitungkan kutipan, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/speech` | Privat-lokal setelah Juli 2026; Tipe penyedia ucapan beserta ekspor direktif yang ditujukan bagi penyedia, registri, validasi, pembuat TTS yang kompatibel dengan OpenAI, dan helper ucapan |
    | `plugin-sdk/speech-core` | Privat-lokal setelah Juli 2026; Ekspor tipe penyedia ucapan bersama, registri, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/speech-settings` | Primitif ringan untuk resolusi dan normalisasi konfigurasi TTS tanpa registri penyedia atau runtime sintesis |
    | `plugin-sdk/realtime-transcription` | Privat-lokal setelah Juli 2026; Tipe penyedia transkripsi waktu nyata, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Privat-lokal setelah Juli 2026; Helper bootstrap profil waktu nyata untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang terbatas |
    | `plugin-sdk/realtime-voice` | Privat-lokal setelah Juli 2026; Tipe penyedia suara waktu nyata, helper registri, gerbang energi audio/awal ucapan bersama, dan helper perilaku suara waktu nyata, termasuk harness sesi yang tidak bergantung pada transportasi dan pelacakan aktivitas keluaran |
    | `plugin-sdk/meeting-runtime` | Runtime sesi rapat browser, mesin/transportasi audio waktu nyata, `MeetingPlatformAdapter`, kontrol browser/node, konsultasi agen, delegasi panggilan suara, pemeriksaan penyiapan, dan helper perintah SoX |
    | `plugin-sdk/image-generation` | Privat-lokal setelah Juli 2026; Tipe penyedia pembuatan gambar beserta helper aset gambar/URL data dan pembuat penyedia gambar yang kompatibel dengan OpenAI |
    | `plugin-sdk/image-generation-core` | Privat-lokal setelah Juli 2026; Tipe pembuatan gambar bersama serta helper failover, autentikasi, dan registri |
    | `plugin-sdk/music-generation` | Privat-lokal setelah Juli 2026; Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/video-generation` | Privat-lokal setelah Juli 2026; Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Privat-lokal setelah Juli 2026; Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan penguraian referensi model |
    | `plugin-sdk/transcripts` | Privat-lokal setelah Juli 2026; Tipe penyedia sumber transkrip bersama, helper registri, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Privat-lokal setelah Juli 2026; Registri target Webhook dan helper pemasangan rute |
    | `plugin-sdk/web-media` | Helper bersama untuk memuat media jarak jauh/lokal |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang tidak digunakan lagi; impor `zod` langsung dari `zod` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` lokal-repo untuk pengujian unit pendaftaran plugin langsung tanpa mengimpor jembatan helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adaptor runtime agen native lokal-repo untuk pengujian autentikasi, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi kanal lokal-repo untuk kontrak tindakan/penyiapan/status generik, asersi direktori, siklus hidup startup akun, penerusan konfigurasi pengiriman, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Rangkaian kasus kesalahan resolusi target bersama lokal-repo untuk pengujian kanal |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak kanal terbatas lokal-repo tanpa barrel pengujian yang luas |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak lokal-repo untuk paket plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/plugin-state-test-runtime` | Helper pengujian lokal-repo untuk penyimpanan status plugin, antrean ingress, dan basis data status |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak lokal-repo untuk runtime penyedia, autentikasi, penemuan, onboarding, katalog, wizard, kapabilitas media, kebijakan pemutaran ulang, audio langsung STT waktu nyata, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Privat-lokal setelah Juli 2026; Mock HTTP/autentikasi Vitest opsional lokal-repo untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Helper lokal-repo untuk melampirkan metadata ke fixture payload balasan |
    | `plugin-sdk/sqlite-runtime-testing` | Helper siklus hidup SQLite lokal-repo untuk pengujian pihak pertama |
    | `plugin-sdk/test-fixtures` | Fixture lokal-repo untuk penangkapan runtime CLI generik, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur plugin terbundel, teks terminal, pemenggalan, token autentikasi, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node yang terfokus dan lokal-repo untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subpath memori">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Privat-lokal setelah Juli 2026; Helper registri penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Privat-lokal setelah Juli 2026; Kontrak embedding host memori, akses registri, penyedia lokal, serta helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini tidak digunakan lagi; gunakan API penyedia embedding generik untuk penyedia baru. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Privat-lokal setelah Juli 2026; Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Privat-lokal setelah Juli 2026; Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-secret` | Privat-lokal setelah Juli 2026; Helper rahasia host memori |
    | `plugin-sdk/memory-core-host-status` | Privat-lokal setelah Juli 2026; Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Privat-lokal setelah Juli 2026; Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Privat-lokal setelah Juli 2026; Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Privat-lokal setelah Juli 2026; Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Fasad kompatibilitas yang tidak digunakan lagi untuk helper host memori yang netral terhadap vendor. Plugin memori baru menggunakan kapabilitas memori yang diinjeksi dan prompt yang disiapkan host; plugin pendamping masih menggunakan fasad yang dipertahankan untuk penemuan artefak publik hingga tersedia jalur baca yang terfokus. |
    | `plugin-sdk/memory-host-events` | Privat-lokal setelah Juli 2026; Alias netral-vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-markdown` | Privat-lokal setelah Juli 2026; Helper markdown terkelola bersama untuk plugin yang terkait dengan memori |
    | `plugin-sdk/memory-host-search` | Privat-lokal setelah Juli 2026; Fasad runtime Active Memory untuk akses pengelola pencarian |
  </Accordion>

  <Accordion title="Subpath helper terbundel yang dicadangkan">
    Subpath SDK helper terbundel yang dicadangkan merupakan permukaan sempit khusus pemilik untuk
    kode plugin terbundel. Subpath tersebut dilacak dalam inventaris SDK agar build paket
    dan pembuatan alias tetap deterministik, tetapi bukan API umum untuk
    pembuatan plugin. Kontrak host baru yang dapat digunakan kembali harus menggunakan subpath SDK generik
    seperti `plugin-sdk/gateway-runtime` dan `plugin-sdk/ssrf-runtime`.

    | Subpath | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Privat-lokal setelah Juli 2026; Helper plugin Codex terbundel untuk memproyeksikan konfigurasi server MCP pengguna ke dalam konfigurasi thread app-server Codex (ekspor paket yang dicadangkan) |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex terbundel untuk mencerminkan subagen native app-server Codex ke status tugas OpenClaw (hanya lokal-repo, bukan ekspor paket) |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
