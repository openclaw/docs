---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subjalur Plugin SDK: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-06-27T17:59:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin diekspos sebagai sekumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan,
dikelompokkan berdasarkan tujuan. Inventaris entrypoint compiler yang dihasilkan
berada di `scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket adalah subset
publik setelah mengurangi subpath pengujian/internal lokal-repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer dapat
mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath
helper cadangan aktif dengan `pnpm plugins:boundary-report:summary`; ekspor
helper cadangan yang tidak digunakan menggagalkan laporan CI, bukan tetap berada
di SDK publik sebagai utang kompatibilitas yang dorman.

Untuk panduan penulisan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri Plugin

| Subpath                        | Ekspor utama                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                |
| `plugin-sdk/health`            | Pendaftaran, deteksi, perbaikan, pemilihan, tingkat keparahan, dan tipe temuan pemeriksaan kesehatan Doctor untuk konsumen kesehatan bawaan                            |

### Kompatibilitas dan helper pengujian yang tidak digunakan lagi

Subpath yang tidak digunakan lagi tetap diekspor untuk Plugin lama, tetapi kode
baru sebaiknya menggunakan subpath SDK terfokus di bawah ini. Daftar yang
dipelihara adalah `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI
menolak impor produksi bawaan darinya. Barrel luas seperti `compat`,
`config-types`, `infra-runtime`, `text-runtime`, dan `zod` hanya untuk
kompatibilitas. Impor `zod` langsung dari `zod`.

Subpath helper pengujian berbasis Vitest milik OpenClaw hanya lokal-repo dan
tidak lagi menjadi ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, dan `testing`.

### Subpath helper Plugin bawaan yang dicadangkan

Subpath ini adalah permukaan kompatibilitas milik Plugin untuk Plugin bawaan
pemiliknya, bukan API SDK umum: `plugin-sdk/codex-mcp-projection` dan
`plugin-sdk/codex-native-task-runtime`. Impor ekstensi lintas-pemilik diblokir
oleh guardrail kontrak paket.

<AccordionGroup>
  <Accordion title="Subjalur kanal">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod `openclaw.json` root (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi JSON Schema yang di-cache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, penerjemah penyiapan, prompt daftar izin, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multi-akun/gerbang tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi id akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu daftar akun/tindakan akun yang sempit |
    | `plugin-sdk/access-groups` | Pembantu parsing daftar izin grup akses dan diagnostik grup yang disunting |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi kanal bersama ditambah pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi kanal OpenClaw terbundel hanya untuk plugin terbundel yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id kanal chat terbundel/resmi kanonis ditambah label/alias pemformat untuk plugin yang perlu mengenali teks berprefiks amplop tanpa melakukan hardcode tabelnya sendiri. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas yang tidak digunakan lagi untuk skema konfigurasi kanal terbundel |
    | `plugin-sdk/telegram-command-config` | Pembantu normalisasi/validasi perintah kustom Telegram dengan fallback kontrak terbundel |
    | `plugin-sdk/command-gating` | Pembantu gerbang otorisasi perintah yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fasad kompatibilitas ingress kanal tingkat rendah yang tidak digunakan lagi. Jalur penerimaan baru sebaiknya menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress kanal tingkat tinggi eksperimental dan pembuat fakta rute untuk jalur penerimaan kanal yang dimigrasikan. Pilih ini daripada merakit daftar izin efektif, daftar izin perintah, dan proyeksi lama di setiap plugin. Lihat [API ingress kanal](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan ditambah opsi pipeline balasan, tanda terima, pratinjau/streaming langsung, pembantu siklus hidup, identitas outbound, perencanaan payload, pengiriman tahan lama, dan pembantu konteks pengiriman pesan. Lihat [API outbound kanal](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound` ditambah fasad dispatch balasan lama. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound` ditambah fasad dispatch balasan lama. |
    | `plugin-sdk/inbound-envelope` | Pembantu bersama untuk rute inbound + pembuat amplop |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner inbound dan predikat dispatch, serta `plugin-sdk/channel-outbound` untuk pembantu pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias parsing target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Pembantu bersama untuk pemuatan media outbound dan status media terhosting |
    | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi polling yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu siklus hidup dan adaptor pengikatan thread |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Pembantu percakapan/pengikatan thread, pairing, dan pengikatan terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu bersama untuk snapshot/ringkasan status kanal |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi kanal yang sempit |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu edit/baca konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Pembantu keputusan akses grup bersama |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Pembantu kebijakan guard pra-crypto direct-DM yang sempit |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner yang dilacak; plugin baru sebaiknya menggunakan subjalur SDK kanal generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas owner yang dilacak; plugin baru sebaiknya menggunakan pembantu runtime yang diinjeksi atau subjalur SDK kanal generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal yang tidak digunakan lagi untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Pembantu presentasi pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Pembantu inbound bersama untuk klasifikasi peristiwa, pembuatan konteks, pemformatan, root, debounce, pencocokan mention, kebijakan mention, dan logging inbound |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce inbound yang sempit |
    | `plugin-sdk/channel-mention-gating` | Pembantu kebijakan mention, penanda mention, dan teks mention yang sempit tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Jenis hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan kanal, ditambah pembantu skema native yang tidak digunakan lagi yang dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Pembantu bersama untuk normalisasi rute, resolusi target berbasis parser, stringifikasi id thread, kunci rute dedupe/ringkas, jenis target terurai, dan perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu parsing target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Jenis kontrak kanal |
    | `plugin-sdk/channel-feedback` | Pengabelan umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Pembantu kontrak secret yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan jenis target secret |
  </Accordion>

Keluarga pembantu kanal yang tidak digunakan lagi tetap tersedia hanya untuk
kompatibilitas plugin yang dipublikasikan. Rencana penghapusannya adalah:
mempertahankannya selama jendela migrasi plugin eksternal, mempertahankan
plugin repo/terbundel pada `channel-inbound` dan `channel-outbound`, lalu
menghapus subjalur kompatibilitas dalam pembersihan SDK mayor berikutnya.
Ini berlaku untuk keluarga lama message/runtime kanal, streaming kanal,
akses direct-DM, pecahan pembantu inbound, reply-options,
dan pairing-path.

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted yang kompatibel dengan OpenAI dan terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk Plugin penyedia |
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, rendering halaman callback, helper PKCE/status, parsing input otorisasi, helper kedaluwarsa token, dan helper abort |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper katalog model penyedia live untuk penemuan bergaya `/models` yang terlindungi: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint penyedia generik, error HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta setter/getter kredensial terskop |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan helper baca, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` sehingga kepemilikan manifes ditegakkan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, helper fetch penggunaan bersama, dan fetcher penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, kompatibilitas tool-call teks polos, dan helper wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream penyedia bersama publik termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, dan utilitas stream yang kompatibel dengan Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch terlindungi, transformasi pesan transport, dan stream event transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup sempit dan parsing perintah |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu reset opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan merekayasa persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam output status; gunakan `error` hanya ketika
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat dipakai.

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi pemberi persetujuan dan helper autentikasi aksi chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/gateway yang lebih sempit saat sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native, pengikatan akun, gate rute, fallback penerusan, dan penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi persetujuan hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak channel yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Normalisasi body perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia yang sempit untuk permukaan rahasia channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/secret-provider-integration` | Manifes integrasi penyedia SecretRef hanya-tipe dan kontrak preset untuk plugin yang menerbitkan preset penyedia rahasia eksternal |
    | `plugin-sdk/security-runtime` | Helper kepercayaan bersama, gating DM, helper file/jalur yang dibatasi root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp sibling, fallback pemindahan lintas perangkat, helper store file privat, guard induk symlink, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan helper pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan allowlist host dan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa permukaan runtime infrastruktur luas |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch terlindungi SSRF, error SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu runtime/logging/backup/instalasi-Plugin yang luas |
    | `plugin-sdk/runtime-env` | Pembantu env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Fasad konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, parsing URL CDP, dan pembantu auth kontrol-browser |
    | `plugin-sdk/agent-harness-task-runtime` | Pembantu lifecycle tugas generik dan pengiriman penyelesaian untuk agent berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Pembantu Codex bundel yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread Codex; bukan untuk Plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Pembantu Codex bundel privat untuk pengabelan mirror/runtime tugas native; bukan untuk Plugin pihak ketiga |
    | `plugin-sdk/channel-runtime-context` | Pembantu registrasi dan lookup runtime-context channel generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang sudah tidak digunakan untuk paket channel pihak ketiga lama; Plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang sudah tidak digunakan untuk paket channel pihak ketiga lama; Plugin baru sebaiknya mengimpor subpath SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Pembantu command/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Pembantu pipeline hook Webhook/internal bersama |
    | `plugin-sdk/lazy-runtime` | Pembantu import/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pembantu exec proses |
    | `plugin-sdk/cli-runtime` | Pembantu pemformatan CLI, tunggu, versi, invocation argumen, dan command-group lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID skenario QA transport live bersama, pembantu cakupan baseline, dan pembantu pemilihan-skenario |
    | `plugin-sdk/gateway-method-runtime` | Pembantu dispatch metode Gateway yang dicadangkan untuk route HTTP Plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu start klien siap event-loop, RPC CLI Gateway, error protokol Gateway, dan pembantu patch status-channel |
    | `plugin-sdk/config-contracts` | Surface konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi Plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Pembantu lookup konfigurasi-Plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman message-tool bersama |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot test |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi command Telegram dan pemeriksaan duplikat/konflik, bahkan ketika surface kontrak Telegram bundel tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi-file tanpa barrel teks yang luas |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi approval hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk penekanan prompt exec native lokal |
    | `plugin-sdk/approval-runtime` | Pembantu approval exec/Plugin, builder capability approval, pembantu auth/profil, pembantu routing/runtime native, dan pemformatan path tampilan approval terstruktur |
    | `plugin-sdk/reply-runtime` | Pembantu runtime inbound/reply bersama, chunking, dispatch, Heartbeat, perencana reply |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu dispatch/finalize reply dan label percakapan yang sempit |
    | `plugin-sdk/reply-history` | Pembantu reply-history jendela pendek bersama. Kode message-turn baru sebaiknya menggunakan `createChannelHistoryWindow`; pembantu map tingkat lebih rendah tetap hanya sebagai ekspor kompatibilitas yang sudah tidak digunakan |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Pembantu workflow sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembacaan teks transkrip pengguna/assistant terbaru yang dibatasi berdasarkan identitas sesi, pembantu path/session-key store sesi legacy, pembacaan updated-at, dan pembantu kompatibilitas whole-store/file-path khusus transisi |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, pembantu target/read/write bercakupan, publikasi update, lock tulis, dan key hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Pembantu schema agent, path, dan transaksi SQLite yang terfokus untuk runtime pihak pertama |
    | `plugin-sdk/cron-store-runtime` | Pembantu path/load/save store Cron |
    | `plugin-sdk/state-paths` | Pembantu path dir State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipe keyed-state SQLite sidecar Plugin plus setup terpusat pragma koneksi dan pemeliharaan WAL untuk database milik Plugin |
    | `plugin-sdk/routing` | Pembantu route/session-key/binding akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status channel/akun bersama, default runtime-state, dan pembantu metadata isu |
    | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command berbatas waktu dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-plugin` | Mendefinisikan Plugin agent-tool bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifest |
    | `plugin-sdk/tool-payload` | Mengekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan pembantu command SSH/OpenShell, termasuk preflight command exec fail-fast |
    | `plugin-sdk/temp-path` | Pembantu path temp-download bersama dan workspace temp aman privat |
    | `plugin-sdk/logging-core` | Logger subsistem dan pembantu redaksi |
    | `plugin-sdk/markdown-table-runtime` | Pembantu mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Pembantu override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pembantu resolusi konfigurasi provider Talk |
    | `plugin-sdk/json-store` | Pembantu kecil baca/tulis state JSON |
    | `plugin-sdk/json-unsafe-integers` | Pembantu parsing JSON yang mempertahankan literal integer tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Pembantu file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Pembantu runtime/sesi ACP dan dispatch reply |
    | `plugin-sdk/acp-runtime-backend` | Pembantu registrasi backend ACP ringan dan dispatch reply untuk Plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP read-only tanpa import startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitif schema konfigurasi runtime agent yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Pembantu resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif pembantu passive-channel, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Pembantu reply command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu daftar command Skill |
    | `plugin-sdk/native-command-registry` | Pembantu registry/build/serialize command native |
    | `plugin-sdk/agent-harness` | Surface Plugin tepercaya eksperimental untuk harness agent tingkat rendah: tipe harness, pembantu steer/abort active-run, pembantu bridge tool OpenClaw, pembantu kebijakan tool runtime-plan, klasifikasi hasil terminal, pembantu pemformatan/detail progres tool, dan utilitas hasil attempt |
    | `plugin-sdk/provider-zai-endpoint` | Fasad deteksi endpoint milik provider Z.AI yang sudah tidak digunakan; gunakan API publik Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pembantu lock async lokal-proses untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Pembantu telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Pembantu konkurensi tugas async terbatas |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Pembantu drain pending-delivery outbound |
    | `plugin-sdk/file-access-runtime` | Pembantu path file lokal dan sumber-media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Pembantu wake, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Pembantu antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Pembantu tunggu kesiapan transport |
    | `plugin-sdk/exec-approvals-runtime` | Pembantu file kebijakan approval exec tanpa barrel infra-runtime yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang sudah tidak digunakan; gunakan subpath runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil terbatas |
    | `plugin-sdk/diagnostic-runtime` | Pembantu flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Graph error, pemformatan, pembantu klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan pembantu lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar-dispatcher tanpa import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL data gambar inline dan pembantu sniffing signature tanpa surface runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Reader response-body terbatas tanpa surface runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Pembantu session-store tanpa import penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/sqlite-runtime` | Pembantu schema agent, path, dan transaksi SQLite yang terfokus tanpa kontrol lifecycle database |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa import konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Pembantu koersi dan normalisasi record/string primitif yang sempit tanpa import markdown/logging |
    | `plugin-sdk/host-runtime` | Pembantu normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Pembantu konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Pembantu dir/identitas/workspace agent, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang sudah tidak digunakan |
    | `plugin-sdk/directory-runtime` | Query/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subjalur kapabilitas dan pengujian">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper pengambilan/transformasi/penyimpanan media bersama, termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang sudah tidak digunakan; prioritaskan helper penyimpanan sebelum pembacaan buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio/ekstraksi-terstruktur untuk penyedia |
    | `plugin-sdk/text-chunking` | Helper pemotongan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia ucapan serta ekspor helper direktif, registry, validasi, pembangun TTS kompatibel OpenAI, dan ucapan untuk penyedia |
    | `plugin-sdk/speech-core` | Ekspor tipe penyedia ucapan bersama, registry, direktif, normalisasi, dan helper ucapan |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil realtime untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang dibatasi |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime, helper registry, dan helper perilaku suara realtime bersama, termasuk pelacakan aktivitas output |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar serta helper aset gambar/data URL dan pembangun penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Helper tipe pembuatan gambar bersama, failover, auth, dan registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan parsing ref model |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan parsing ref model |
    | `plugin-sdk/transcripts` | Tipe penyedia sumber transkrip bersama, helper registry, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang sudah tidak digunakan; impor `zod` dari `zod` secara langsung |
    | `plugin-sdk/testing` | Barrel kompatibilitas yang sudah tidak digunakan khusus repo lokal untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subjalur pengujian lokal yang terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` khusus repo lokal untuk pengujian unit pendaftaran Plugin langsung tanpa mengimpor jembatan helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native khusus repo lokal untuk pengujian auth, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi kanal khusus repo lokal untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading konfigurasi kirim, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus galat resolusi target bersama khusus repo lokal untuk pengujian kanal |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket Plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor khusus repo lokal |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, auth, discovery, onboard, katalog, wizard, kapabilitas media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan stream khusus repo lokal |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in khusus repo lokal untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik khusus repo lokal untuk penangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, jalur Plugin bawaan, teks terminal, pemotongan, token auth, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node yang terfokus dan khusus repo lokal untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subjalur memori">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bawaan untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, penyedia lokal, dan helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini sudah tidak digunakan; gunakan API penyedia embedding generik untuk penyedia baru. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper rahasia host memori |
    | `plugin-sdk/memory-core-host-events` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Facade runtime active memory untuk akses manager pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subjalur helper bawaan yang dicadangkan">
    Subjalur SDK helper bawaan yang dicadangkan adalah permukaan sempit khusus pemilik untuk
    kode Plugin bawaan. Subjalur ini dilacak dalam inventaris SDK agar build
    paket dan alias tetap deterministik, tetapi bukan API penulisan Plugin
    umum. Kontrak host baru yang dapat digunakan ulang sebaiknya memakai subjalur SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subjalur | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper Plugin Codex bawaan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex bawaan untuk mencerminkan subagen native app-server Codex ke status tugas OpenClaw |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
