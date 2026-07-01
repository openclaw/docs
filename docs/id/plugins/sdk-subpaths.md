---
read_when:
    - Memilih subjalur plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subjalur Plugin SDK: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-07-01T13:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin diekspos sebagai sekumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan
berdasarkan tujuan. Inventaris entrypoint kompilator yang dihasilkan berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket adalah subset publik
setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Pemelihara dapat mengaudit
jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath helper tercadangkan
yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor helper tercadangkan
yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik
sebagai utang kompatibilitas dorman.

Untuk panduan penulisan Plugin, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri Plugin

| Subpath                        | Ekspor utama                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Registrasi, deteksi, perbaikan, pemilihan, tingkat keparahan, dan tipe temuan health-check Doctor untuk konsumen health bawaan                                               |

### Kompatibilitas dan helper pengujian yang tidak digunakan lagi

Subpath yang tidak digunakan lagi tetap diekspor untuk Plugin lama, tetapi kode baru sebaiknya menggunakan
subpath SDK terfokus di bawah. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak impor produksi
bawaan darinya. Barrel luas seperti `compat`, `config-types`,
`infra-runtime`, `text-runtime`, dan `zod` hanya untuk kompatibilitas. Impor `zod`
langsung dari `zod`.

Subpath helper pengujian OpenClaw yang didukung Vitest hanya bersifat lokal repo dan tidak lagi menjadi
ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, dan `testing`.

### Subpath helper Plugin bawaan yang dicadangkan

Subpath ini adalah permukaan kompatibilitas milik Plugin untuk Plugin bawaan pemiliknya,
bukan API SDK umum: `plugin-sdk/codex-mcp-projection` dan
`plugin-sdk/codex-native-task-runtime`. Impor ekstensi lintas pemilik diblokir
oleh guardrail kontrak paket.

<AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi JSON Schema bercache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard setup bersama, penerjemah setup, prompt daftar izin, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang usang; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multi-akun/gerbang tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi id akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu sempit daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Pembantu penguraian daftar izin grup akses dan diagnostik grup yang disamarkan |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama plus pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi channel OpenClaw bawaan hanya untuk plugin bawaan yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id channel chat bawaan/resmi kanonis plus label/alias pemformat untuk plugin yang perlu mengenali teks berawalan amplop tanpa membuat tabel sendiri secara hardcode. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas usang untuk skema konfigurasi channel bawaan |
    | `plugin-sdk/telegram-command-config` | Pembantu normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Pembantu sempit gerbang otorisasi perintah |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fasad kompatibilitas ingress channel tingkat rendah yang usang. Jalur penerimaan baru sebaiknya menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress channel tingkat tinggi eksperimental dan pembuat fakta rute untuk jalur penerimaan channel yang dimigrasikan. Pilih ini daripada merakit daftar izin efektif, daftar izin perintah, dan proyeksi legacy di tiap plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan plus opsi pipeline balasan, tanda terima, pratinjau langsung/streaming, pembantu siklus hidup, identitas outbound, perencanaan payload, pengiriman durable, dan pembantu konteks kirim pesan. Lihat [API outbound channel](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas usang untuk `plugin-sdk/channel-outbound` plus fasad legacy dispatch balasan. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas usang untuk `plugin-sdk/channel-outbound` plus fasad legacy dispatch balasan. |
    | `plugin-sdk/inbound-envelope` | Pembantu bersama untuk rute inbound + pembuat amplop |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-inbound` untuk runner inbound dan predikat dispatch, serta `plugin-sdk/channel-outbound` untuk pembantu pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias penguraian target yang usang; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Pembantu bersama untuk pemuatan media outbound dan status media terhost |
    | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Pembantu sempit normalisasi polling |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu siklus hidup binding thread dan adaptor |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen legacy |
    | `plugin-sdk/conversation-runtime` | Pembantu percakapan/binding thread, pairing, dan binding terkonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu bersama snapshot/ringkasan status channel |
    | `plugin-sdk/channel-config-primitives` | Primitif sempit skema konfigurasi channel |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu edit/baca konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Pembantu bersama keputusan akses grup |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Pembantu sempit kebijakan guard direct-DM pra-kripto |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang usang untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner yang dilacak; plugin baru sebaiknya menggunakan subpath SDK channel generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang usang untuk kompatibilitas owner yang dilacak; plugin baru sebaiknya menggunakan pembantu runtime yang diinjeksi atau subpath SDK channel generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal yang usang untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan pembantu balasan interaktif legacy. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Pembantu inbound bersama untuk klasifikasi peristiwa, pembangunan konteks, pemformatan, root, debounce, pencocokan mention, kebijakan mention, dan logging inbound |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu sempit debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Pembantu sempit kebijakan mention, penanda mention, dan teks mention tanpa permukaan runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan channel, plus pembantu skema native yang usang yang dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Pembantu bersama untuk normalisasi rute, resolusi target berbasis parser, stringifikasi id thread, kunci rute dedupe/compact, tipe target terurai, dan perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu penguraian target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Pembantu sempit kontrak secret seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target secret |
  </Accordion>

Keluarga pembantu channel yang usang tetap tersedia hanya untuk kompatibilitas
plugin yang dipublikasikan. Rencana penghapusannya adalah: pertahankan selama
jendela migrasi plugin eksternal, pertahankan plugin repo/bawaan pada
`channel-inbound` dan `channel-outbound`, lalu hapus subpath kompatibilitas
dalam pembersihan SDK mayor berikutnya. Ini berlaku untuk keluarga lama
pesan/runtime channel, streaming channel, akses direct-DM, pecahan pembantu
inbound, opsi balasan, dan pairing-path.

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted yang dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk plugin penyedia |
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, rendering halaman callback, helper PKCE/state, penguraian input otorisasi, helper kedaluwarsa token, dan helper pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding kunci API/penulisan profil seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang sudah usang |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper katalog model penyedia langsung untuk penemuan bergaya `/models` yang terlindungi: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk uji kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint penyedia generik, error HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper pendaftaran/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan pengkabelan pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial terskop |
    | `plugin-sdk/provider-web-search` | Helper pendaftaran/cache/runtime penyedia web-search |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan helper baca, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` agar kepemilikan manifes ditegakkan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, helper pengambilan penggunaan bersama, dan fetcher penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, kompatibilitas panggilan tool teks polos, dan helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream penyedia bersama publik termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, dan utilitas stream kompatibel Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch terlindungi, ekstraksi teks hasil tool, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup sempit dan penguraian perintah |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase terpakai, dan waktu reset opsional. Penyedia yang mengekspos saldo atau
teks status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan membuat persentase buatan.
OpenClaw menampilkan teks ringkasan tersebut dalam output status; gunakan `error` hanya saat
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; utamakan seam adapter/Gateway yang lebih sempit saat sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native, pengikatan akun, gate rute, fallback penerusan, dan penekanan prompt exec native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi persetujuan hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk penekanan prompt exec native lokal |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset dedupe balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper uji kontrak channel yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk path channel panas |
    | `plugin-sdk/command-surface` | Normalisasi body perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak secret yang sempit untuk permukaan secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper pengetikan `coerceSecretRef` dan SecretRef yang sempit untuk penguraian kontrak/konfigurasi secret |
    | `plugin-sdk/secret-provider-integration` | Kontrak manifes integrasi penyedia SecretRef khusus tipe dan preset untuk plugin yang menerbitkan preset penyedia secret eksternal |
    | `plugin-sdk/security-runtime` | Helper kepercayaan bersama, gate DM, helper file/path berbatas root termasuk penulisan create-only, penggantian file atomik sync/async, penulisan temp sibling, fallback pemindahan lintas perangkat, helper store file privat, guard induk symlink, konten eksternal, redaksi teks sensitif, perbandingan secret constant-time, dan helper pengumpulan secret |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch terlindungi SSRF, error SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper penguraian input secret |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran body/timeout permintaan |
  </Accordion>

  <Accordion title="Subpath runtime dan penyimpanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/backup/plugin-install yang luas |
    | `plugin-sdk/runtime-env` | Helper runtime env, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Facade konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, parsing URL CDP, dan helper autentikasi kontrol browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper siklus hidup tugas generik dan pengiriman penyelesaian untuk agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex terbundel yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread Codex; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex terbundel privat untuk wiring mirror/runtime tugas native; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/channel-runtime-context` | Helper pendaftaran dan lookup runtime-context channel generik |
    | `plugin-sdk/matrix` | Facade kompatibilitas Matrix yang usang untuk paket channel pihak ketiga lama; plugin baru harus mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Facade kompatibilitas Mattermost yang usang untuk paket channel pihak ketiga lama; plugin baru harus mengimpor subpath SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper command/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline webhook/hook internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding lazy runtime seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, wait, versi, invocation argumen, dan lazy command-group |
    | `plugin-sdk/qa-live-transport-scenarios` | ID skenario QA live transport bersama, helper cakupan baseline, dan helper pemilihan skenario |
    | `plugin-sdk/gateway-method-runtime` | Helper dispatch metode Gateway yang dicadangkan untuk rute HTTP plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, helper start klien yang siap event-loop, RPC CLI gateway, error protokol gateway, resolusi host LAN yang diiklankan, dan helper patch status channel |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper lookup plugin-config runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman message-tool bersama |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot test |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram serta pemeriksaan duplikat/konflik, bahkan ketika permukaan kontrak Telegram terbundel tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel teks yang luas |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi persetujuan hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk supresi prompt exec native lokal |
    | `plugin-sdk/approval-runtime` | Helper persetujuan exec/plugin, builder approval-capability, helper auth/profile, helper routing/runtime native, dan pemformatan path tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/reply bersama, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalize balasan yang sempit dan label percakapan |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama. Kode message-turn baru harus menggunakan `createChannelHistoryWindow`; helper map level lebih rendah tetap hanya berupa ekspor kompatibilitas yang usang |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper workflow sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, helper path/session-key store sesi lama, pembacaan updated-at, dan helper kompatibilitas whole-store/file-path khusus transisi |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, helper target/read/write bercakupan, publikasi update, lock tulis, dan key hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Helper skema agen SQLite, path, dan transaksi yang terfokus untuk runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Helper path/load/save store Cron |
    | `plugin-sdk/state-paths` | Helper path direktori state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipe keyed-state SQLite sidecar Plugin plus pragma koneksi terpusat dan setup pemeliharaan WAL untuk database milik plugin |
    | `plugin-sdk/routing` | Helper binding rute/session-key/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner command berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-plugin` | Mendefinisikan plugin agent-tool bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifest |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan helper command SSH/OpenShell, termasuk preflight command exec fail-fast |
    | `plugin-sdk/temp-path` | Helper path temp-download bersama dan workspace temp aman privat |
    | `plugin-sdk/logging-core` | Logger subsistem dan helper redaksi |
    | `plugin-sdk/markdown-table-runtime` | Mode tabel Markdown dan helper konversi |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi provider talk |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/json-unsafe-integers` | Helper parsing JSON yang mempertahankan literal bilangan bulat tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Helper pendaftaran backend ACP ringan dan reply-dispatch untuk plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP read-only tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan dangerous-name |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper passive-channel, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper listing command Skill |
    | `plugin-sdk/native-command-registry` | Helper registry/build/serialize command native |
    | `plugin-sdk/agent-harness` | Permukaan trusted-plugin eksperimental untuk harness agen level rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi hasil terminal, helper pemformatan/detail progres tool, dan utilitas hasil attempt |
    | `plugin-sdk/provider-zai-endpoint` | Facade deteksi endpoint milik provider Z.AI yang usang; gunakan API publik plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lock async process-local untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi tugas async berbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe in-memory |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pending-delivery outbound |
    | `plugin-sdk/file-access-runtime` | Helper path file lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper wake, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper wait kesiapan transport |
    | `plugin-sdk/exec-approvals-runtime` | Helper file kebijakan persetujuan exec tanpa barrel infra-runtime yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang usang; gunakan subpath runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache berbatas kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Graph error, pemformatan, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan helper lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL data gambar inline dan helper sniffing signature tanpa permukaan runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Reader response-body berbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/sqlite-runtime` | Helper skema agen SQLite, path, dan transaksi yang terfokus tanpa kontrol siklus hidup database |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang usang |
    | `plugin-sdk/directory-runtime` | Query/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subjalur kemampuan dan pengujian">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper pengambilan/transformasi/penyimpanan media bersama termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang tidak digunakan lagi; utamakan helper penyimpanan sebelum pembacaan buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio/ekstraksi-terstruktur yang menghadap penyedia |
    | `plugin-sdk/text-chunking` | Helper pemotongan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia ucapan serta ekspor helper direktif, registry, validasi, pembangun TTS kompatibel OpenAI, dan ucapan yang menghadap penyedia |
    | `plugin-sdk/speech-core` | Tipe penyedia ucapan bersama, registry, direktif, normalisasi, dan ekspor helper ucapan |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil realtime untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang terbatas |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime, helper registry, dan helper perilaku suara realtime bersama, termasuk pelacakan aktivitas keluaran |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar serta helper URL aset/data gambar dan pembangun penyedia gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, failover, autentikasi, dan helper registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan parsing referensi model |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan parsing referensi model |
    | `plugin-sdk/transcripts` | Tipe penyedia sumber transkrip bersama, helper registry, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang tidak digunakan lagi; impor `zod` dari `zod` secara langsung |
    | `plugin-sdk/testing` | Barrel kompatibilitas repo-lokal yang tidak digunakan lagi untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subjalur pengujian lokal terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` sebagai gantinya |
    | `plugin-sdk/plugin-test-api` | Helper minimal repo-lokal `createTestPluginApi` untuk pengujian unit pendaftaran plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter agent-runtime native repo-lokal untuk pengujian autentikasi, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian repo-lokal berorientasi channel untuk kontrak aksi/setup/status generik, asersi direktori, siklus hidup startup akun, threading konfigurasi kirim, mock runtime, masalah status, pengiriman keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus kesalahan resolusi target bersama repo-lokal untuk pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor repo-lokal |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak runtime penyedia, autentikasi, penemuan, onboarding, katalog, wizard, kemampuan media, kebijakan replay, audio langsung STT realtime, pencarian/pengambilan web, dan stream repo-lokal |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest opt-in repo-lokal untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generik repo-lokal untuk penangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, muat ulang modul, jalur plugin bundel, teks terminal, pemotongan, token autentikasi, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus repo-lokal untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subjalur memori">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bundel untuk helper manajer/konfigurasi/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, penyedia lokal, dan helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini tidak digunakan lagi; gunakan API penyedia embedding generik untuk penyedia baru. |
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
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola bersama untuk plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime memori aktif untuk akses manajer pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subjalur helper bundel yang dicadangkan">
    Subjalur SDK helper bundel yang dicadangkan adalah permukaan khusus pemilik yang terbatas untuk
    kode plugin bundel. Subjalur ini dilacak dalam inventaris SDK agar build paket
    dan aliasing tetap deterministik, tetapi bukan API umum untuk
    penulisan plugin. Kontrak host baru yang dapat digunakan ulang sebaiknya memakai subjalur SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subjalur | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper plugin Codex bundel untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread server aplikasi Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper plugin Codex bundel untuk mencerminkan subagen native server aplikasi Codex ke status tugas OpenClaw |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
