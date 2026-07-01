---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subpath Plugin bundel dan permukaan helper
summary: 'Katalog subpath SDK Plugin: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-07-01T08:32:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK diekspos sebagai sekumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan,
dikelompokkan berdasarkan tujuan. Inventaris entrypoint compiler yang dihasilkan
berada di `scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket adalah subset
publik setelah mengurangi subpath pengujian/internal khusus repo yang tercantum
di `scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer dapat
mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath
helper cadangan yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor
helper cadangan yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap
berada di SDK publik sebagai utang kompatibilitas yang dorman.

Untuk panduan penulisan Plugin, lihat [Ikhtisar Plugin SDK](/id/plugins/sdk-overview).

## Entri Plugin

| Subpath                        | Ekspor kunci                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                 |
| `plugin-sdk/health`            | Pendaftaran health-check Doctor, deteksi, perbaikan, pemilihan, tingkat keparahan, dan tipe temuan untuk konsumen health bawaan                                       |

### Kompatibilitas usang dan helper pengujian

Subpath usang tetap diekspor untuk Plugin lama, tetapi kode baru sebaiknya
menggunakan subpath SDK terfokus di bawah ini. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak impor
produksi bawaan darinya. Barrel luas seperti `compat`, `config-types`,
`infra-runtime`, `text-runtime`, dan `zod` hanya untuk kompatibilitas. Impor `zod`
langsung dari `zod`.

Subpath helper pengujian berbasis Vitest milik OpenClaw hanya bersifat lokal repo
dan tidak lagi menjadi ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, dan `testing`.

### Subpath helper Plugin bawaan yang dicadangkan

Subpath ini adalah permukaan kompatibilitas milik Plugin untuk Plugin bawaan
pemiliknya, bukan API SDK umum: `plugin-sdk/codex-mcp-projection` dan
`plugin-sdk/codex-native-task-runtime`. Impor ekstensi lintas pemilik diblokir
oleh guardrail kontrak paket.

  <AccordionGroup>
  <Accordion title="Subjalur channel">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper validasi JSON Schema yang di-cache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard penyiapan bersama, penerjemah penyiapan, prompt allowlist, pembangun status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper konfigurasi multi-akun/gerbang tindakan, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi id akun |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper sempit daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Helper penguraian allowlist grup akses dan diagnostik grup yang disunting |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama plus pembangun Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi channel OpenClaw bawaan hanya untuk plugin bawaan yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id channel chat bawaan/resmi kanonis plus label/alias pemformat untuk plugin yang perlu mengenali teks berprefiks envelope tanpa melakukan hardcode tabel sendiri. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas yang tidak digunakan lagi untuk skema konfigurasi bundled-channel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Helper sempit gerbang otorisasi perintah |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade kompatibilitas ingress channel tingkat rendah yang tidak digunakan lagi. Jalur penerimaan baru harus menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress channel tingkat tinggi eksperimental dan pembangun fakta rute untuk jalur penerimaan channel yang dimigrasikan. Utamakan ini daripada menyusun allowlist efektif, allowlist perintah, dan proyeksi lama di setiap plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan plus opsi pipeline balasan, resi, pratinjau/streaming langsung, helper siklus hidup, identitas outbound, perencanaan payload, pengiriman tahan lama, dan helper konteks pengiriman pesan. Lihat [API outbound channel](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound` plus facade lama pengiriman balasan. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound` plus facade lama pengiriman balasan. |
    | `plugin-sdk/inbound-envelope` | Helper bersama pembangun rute inbound + envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner inbound dan predikat dispatch, serta `plugin-sdk/channel-outbound` untuk helper pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias penguraian target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper bersama pemuatan media outbound dan status media yang dihosting |
    | `plugin-sdk/outbound-send-deps` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper sempit normalisasi polling |
    | `plugin-sdk/thread-bindings-runtime` | Helper siklus hidup binding thread dan adapter |
    | `plugin-sdk/agent-media-payload` | Pembangun payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper percakapan/binding thread, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Helper bersama snapshot/ringkasan status channel |
    | `plugin-sdk/channel-config-primitives` | Primitif sempit skema konfigurasi channel |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca konfigurasi allowlist |
    | `plugin-sdk/group-access` | Helper bersama keputusan akses grup |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper sempit kebijakan guard DM langsung pra-crypto |
    | `plugin-sdk/discord` | Facade kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; plugin baru harus menggunakan subjalur SDK channel generik |
    | `plugin-sdk/telegram-account` | Facade kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas pemilik yang dilacak; plugin baru harus menggunakan helper runtime yang diinjeksi atau subjalur SDK channel generik |
    | `plugin-sdk/zalouser` | Facade kompatibilitas Zalo Personal yang tidak digunakan lagi untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; plugin baru harus menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan helper balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper inbound bersama untuk klasifikasi event, pembuatan konteks, pemformatan, root, debounce, pencocokan mention, kebijakan mention, dan logging inbound |
    | `plugin-sdk/channel-inbound-debounce` | Helper sempit debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper sempit kebijakan mention, penanda mention, dan teks mention tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper tindakan pesan channel, plus helper skema native yang tidak digunakan lagi dan dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Normalisasi rute bersama, resolusi target berbasis parser, stringifikasi id thread, kunci rute dedupe/ringkas, tipe target yang diurai, dan helper perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Helper penguraian target; pemanggil perbandingan rute harus menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Pengkabelan umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper sempit kontrak rahasia seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

Keluarga pembantu channel yang tidak digunakan lagi tetap tersedia hanya untuk kompatibilitas published-plugin. Rencana penghapusannya adalah: mempertahankannya selama jendela migrasi plugin eksternal, mempertahankan plugin repo/bundled pada `channel-inbound` dan `channel-outbound`, lalu menghapus subjalur kompatibilitas pada pembersihan SDK mayor berikutnya. Ini berlaku untuk keluarga lama channel message/runtime, channel streaming, akses direct-DM, pecahan pembantu inbound, reply-options, dan pairing-path.

  <Accordion title="Provider subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/di-host sendiri yang terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia yang di-host sendiri dan kompatibel dengan OpenAI secara terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk Plugin penyedia |
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, rendering halaman callback, helper PKCE/state, parsing input otorisasi, helper kedaluwarsa token, dan helper pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi id model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper katalog model penyedia live untuk penemuan bergaya `/models` yang dijaga: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran id model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri Plugin penyedia untuk uji kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint penyedia generik, error HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak membutuhkan wiring pengaktifan Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskup |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan helper pembacaan, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; Plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` sehingga kepemilikan manifes diberlakukan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, helper pengambilan penggunaan bersama, dan fetcher penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, kompatibilitas panggilan tool teks polos, dan helper wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream penyedia bersama publik termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, dan utilitas stream yang kompatibel dengan Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch yang dijaga, ekstraksi teks hasil tool, transformasi pesan transport, dan stream event transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup sempit dan parsing perintah |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu reset opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan merekayasa persentase.
OpenClaw menampilkan teks ringkasan itu dalam output status; gunakan `error` hanya ketika
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat dipakai.

  <Accordion title="Auth and security subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper ringan pemuatan adapter persetujuan native untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; pilih seam adapter/Gateway yang lebih sempit saat sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native, pengikatan akun, gate rute, fallback penerusan, dan supresi prompt eksekusi native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi persetujuan hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk supresi prompt eksekusi native lokal |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan eksekusi/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan eksekusi/Plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset deduplikasi balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper uji kontrak channel yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Helper normalisasi isi perintah dan permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia yang sempit untuk permukaan rahasia channel/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/secret-provider-integration` | Manifes integrasi penyedia SecretRef hanya tipe dan kontrak preset untuk Plugin yang menerbitkan preset penyedia rahasia eksternal |
    | `plugin-sdk/security-runtime` | Helper bersama untuk kepercayaan, gating DM, file/path berbatas root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp sibling, fallback pemindahan lintas perangkat, helper store file privat, guard induk symlink, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan helper pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper dispatcher terpinning yang sempit tanpa permukaan runtime infrastruktur luas |
    | `plugin-sdk/ssrf-runtime` | Dispatcher terpinning, fetch yang dijaga SSRF, error SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Subjalur runtime dan penyimpanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/pemasangan-plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Fasad konfigurasi browser yang didukung untuk profil/default ternormalisasi, penguraian URL CDP, dan helper autentikasi kontrol-browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper siklus hidup tugas generik dan pengiriman penyelesaian untuk agen berbasis harness yang memakai cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex bundel yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread Codex; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex bundel privat untuk pencerminan tugas native/pengkabelan runtime; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/channel-runtime-context` | Helper pendaftaran dan pencarian konteks-runtime kanal generik |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang usang untuk paket kanal pihak ketiga lama; plugin baru harus mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang usang untuk paket kanal pihak ketiga lama; plugin baru harus mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper perintah/hook/http/interaktif plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/pengikatan runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper eksekusi proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, tunggu, versi, pemanggilan argumen, dan grup-perintah lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID skenario QA transport live bersama, helper cakupan baseline, dan helper pemilihan skenario |
    | `plugin-sdk/gateway-method-runtime` | Helper dispatch metode Gateway yang dicadangkan untuk rute HTTP plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, helper mulai klien yang siap event-loop, RPC CLI gateway, error protokol gateway, dan helper patch status-kanal |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi kanal/penyedia |
    | `plugin-sdk/plugin-config-runtime` | Helper pencarian konfigurasi-plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman message-tool bersama |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan penyetel snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram serta pemeriksaan duplikat/konflik, bahkan ketika permukaan kontrak Telegram bundel tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi-file tanpa barrel teks yang luas |
    | `plugin-sdk/approval-reaction-runtime` | Pengikatan reaksi persetujuan hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk penekanan prompt exec native lokal |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, pembuat kapabilitas-persetujuan, helper auth/profil, helper routing/runtime native, dan pemformatan jalur tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan yang sempit dan helper label-percakapan |
    | `plugin-sdk/reply-history` | Helper riwayat-balasan jendela-pendek bersama. Kode giliran-pesan baru harus memakai `createChannelHistoryWindow`; helper map tingkat rendah tetap hanya sebagai ekspor kompatibilitas usang |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper alur kerja sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, helper jalur store sesi lama/kunci-sesi, pembacaan updated-at, dan helper kompatibilitas whole-store/jalur-file khusus transisi |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, helper target/baca/tulis bercakupan, publikasi pembaruan, kunci tulis, dan kunci hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Helper skema-agen, jalur, dan transaksi SQLite terfokus untuk runtime pihak pertama |
    | `plugin-sdk/cron-store-runtime` | Helper jalur/muat/simpan store Cron |
    | `plugin-sdk/state-paths` | Helper jalur direktori state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipe keyed-state SQLite sidecar plugin plus pragma koneksi terpusat dan penyiapan pemeliharaan WAL untuk database milik plugin |
    | `plugin-sdk/routing` | Helper pengikatan rute/kunci-sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status kanal/akun bersama, default state-runtime, dan helper metadata isu |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah berbatas waktu dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Reader parameter tool/CLI umum |
    | `plugin-sdk/tool-plugin` | Definisikan plugin agent-tool bertipe sederhana dan tampilkan metadata statis untuk pembuatan manifes |
    | `plugin-sdk/tool-payload` | Ekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan helper perintah SSH/OpenShell, termasuk preflight perintah exec fail-fast |
    | `plugin-sdk/temp-path` | Helper jalur unduhan-temporer bersama dan workspace temporer aman privat |
    | `plugin-sdk/logging-core` | Helper logger subsistem dan redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi penyedia Talk |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/json-unsafe-integers` | Helper penguraian JSON yang mempertahankan literal integer tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan dispatch-balasan |
    | `plugin-sdk/acp-runtime-backend` | Helper pendaftaran backend ACP ringan dan dispatch-balasan untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi pengikatan ACP baca-saja tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema-konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Reader parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama-berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper kanal-pasif, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skill |
    | `plugin-sdk/native-command-registry` | Helper registri/bangun/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan trusted-plugin eksperimental untuk harness agen tingkat rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper pemformatan/detail progres tool, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Fasad deteksi endpoint milik penyedia Z.AI yang usang; gunakan API publik plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper async lock process-local untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas kanal |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi tugas async berbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pengiriman tertunda outbound |
    | `plugin-sdk/file-access-runtime` | Helper jalur file-lokal dan sumber-media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper bangun, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper tunggu kesiapan transport |
    | `plugin-sdk/exec-approvals-runtime` | Helper file kebijakan persetujuan exec tanpa barrel infra-runtime yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas usang; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache berbatas kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Helper grafik error, pemformatan, klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan helper lookup tersemat |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Helper sanitizer URL data gambar inline dan sniffing signature tanpa permukaan runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Reader body respons berbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State pengikatan percakapan saat ini tanpa routing pengikatan terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/sqlite-runtime` | Helper skema-agen, jalur, dan transaksi SQLite terfokus tanpa kontrol siklus hidup database |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang usang |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subjalur kapabilitas dan pengujian">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper pengambilan/transformasi/penyimpanan media bersama termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang sudah usang; utamakan helper penyimpanan sebelum membaca buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME sempit, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media sempit seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper failover generasi media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio/ekstraksi-terstruktur untuk penyedia |
    | `plugin-sdk/text-chunking` | Helper pemotongan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia speech serta ekspor direktif, registry, validasi, pembangun TTS kompatibel OpenAI, dan helper speech untuk penyedia |
    | `plugin-sdk/speech-core` | Ekspor tipe penyedia speech bersama, registry, direktif, normalisasi, dan helper speech |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil realtime untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang terbatas |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime, helper registry, dan helper perilaku suara realtime bersama, termasuk pelacakan aktivitas output |
    | `plugin-sdk/image-generation` | Tipe penyedia generasi gambar serta helper aset gambar/data URL dan pembangun penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe generasi gambar bersama, failover, auth, dan helper registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil generasi musik |
    | `plugin-sdk/music-generation-core` | Tipe generasi musik bersama, helper failover, pencarian penyedia, dan parsing model-ref |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil generasi video |
    | `plugin-sdk/video-generation-core` | Tipe generasi video bersama, helper failover, pencarian penyedia, dan parsing model-ref |
    | `plugin-sdk/transcripts` | Tipe penyedia sumber transkrip bersama, helper registry, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang sudah usang; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Re-ekspor kompatibilitas yang sudah usang; impor `zod` dari `zod` secara langsung |
    | `plugin-sdk/testing` | Barrel kompatibilitas usang repo-lokal untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subjalur pengujian lokal terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` repo-lokal untuk pengujian unit registrasi plugin langsung tanpa mengimpor jembatan helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native repo-lokal untuk pengujian auth, pengiriman, fallback, tool-hook, prompt-overlay, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi kanal repo-lokal untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading konfigurasi kirim, mock runtime, masalah status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus kesalahan resolusi target bersama repo-lokal untuk pengujian kanal |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor repo-lokal |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, auth, discovery, onboard, katalog, wizard, kapabilitas media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan stream repo-lokal |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in repo-lokal untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik repo-lokal untuk capture runtime CLI, konteks sandbox, penulis skill, pesan agen, event sistem, reload modul, jalur plugin bundel, teks terminal, pemotongan, token auth, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus repo-lokal untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subjalur memori">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bundel untuk helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, penyedia lokal, dan helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini sudah usang; gunakan API penyedia embedding generik untuk penyedia baru. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor mesin QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor mesin penyimpanan host memori |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memori |
    | `plugin-sdk/memory-core-host-query` | Helper kueri host memori |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memori |
    | `plugin-sdk/memory-core-host-events` | Alias kompatibilitas yang sudah usang; gunakan `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper status host memori |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memori |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime inti host memori |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memori |
    | `plugin-sdk/memory-host-core` | Alias netral vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang sudah usang; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses search-manager |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang sudah usang; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subjalur helper bundel yang dicadangkan">
    Subjalur SDK helper bundel yang dicadangkan adalah permukaan sempit khusus pemilik untuk
    kode plugin bundel. Subjalur ini dilacak dalam inventaris SDK agar build
    paket dan alias tetap deterministik, tetapi bukan API umum untuk
    pembuatan plugin. Kontrak host baru yang dapat digunakan ulang sebaiknya menggunakan subjalur SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subjalur | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper plugin Codex bundel untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex bundel untuk mencerminkan subagen native app-server Codex ke dalam status tugas OpenClaw |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ringkasan SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
