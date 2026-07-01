---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subpath Plugin SDK: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-07-01T20:35:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK diekspos sebagai sekumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan berdasarkan
tujuan. Inventaris entrypoint compiler yang dihasilkan berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor package adalah subset publik
setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer dapat mengaudit
jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath helper cadangan
aktif dengan `pnpm plugins:boundary-report:summary`; ekspor helper cadangan yang tidak digunakan
akan menggagalkan laporan CI alih-alih tetap berada di SDK publik sebagai
utang kompatibilitas dorman.

Untuk panduan penulisan Plugin, lihat [Ikhtisar Plugin SDK](/id/plugins/sdk-overview).

## Entri Plugin

| Subpath                        | Ekspor utama                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper item migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                                |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                                 |
| `plugin-sdk/health`            | Pendaftaran health-check doctor, deteksi, perbaikan, pemilihan, tingkat keparahan, dan tipe temuan untuk konsumen health bawaan                                       |

### Kompatibilitas dan helper pengujian yang tidak digunakan lagi

Subpath yang tidak digunakan lagi tetap diekspor untuk Plugin lama, tetapi kode baru sebaiknya menggunakan
subpath SDK terfokus di bawah. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak impor produksi
bawaan darinya. Barrel luas seperti `compat`, `config-types`,
`infra-runtime`, `text-runtime`, dan `zod` hanya untuk kompatibilitas. Impor `zod`
langsung dari `zod`.

Subpath helper pengujian OpenClaw yang didukung Vitest hanya lokal repo dan tidak
lagi menjadi ekspor package: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks`, dan `testing`.

### Subpath helper Plugin bawaan yang dicadangkan

Subpath ini adalah permukaan kompatibilitas milik Plugin untuk Plugin bawaan pemiliknya,
bukan API SDK umum: `plugin-sdk/codex-mcp-projection` dan
`plugin-sdk/codex-native-task-runtime`. Impor ekstensi lintas pemilik diblokir
oleh guardrail kontrak package.

<AccordionGroup>
  <Accordion title="Subpath channel">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper validasi JSON Schema bercache untuk skema milik Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper wizard setup bersama, penerjemah setup, prompt allowlist, pembuat status setup |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper config/action-gate multi-akun, helper fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper normalisasi account-id |
    | `plugin-sdk/account-resolution` | Helper pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Helper account-list/account-action yang sempit |
    | `plugin-sdk/access-groups` | Helper parsing allowlist access-group dan diagnostik grup yang disamarkan |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema config channel bersama ditambah pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema config channel OpenClaw terbundel hanya untuk Plugin terbundel yang dikelola |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id channel chat terbundel/resmi kanonis ditambah label/alias pemformat untuk Plugin yang perlu mengenali teks berprefiks envelope tanpa melakukan hardcode tabel sendiri. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas yang tidak digunakan lagi untuk skema config channel terbundel |
    | `plugin-sdk/telegram-command-config` | Helper normalisasi/validasi custom-command Telegram dengan fallback kontrak terbundel |
    | `plugin-sdk/command-gating` | Helper gate otorisasi command yang sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facade kompatibilitas ingress channel level rendah yang tidak digunakan lagi. Path penerimaan baru sebaiknya menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress channel level tinggi eksperimental dan pembuat fakta rute untuk path penerimaan channel yang dimigrasikan. Lebih disarankan daripada merakit allowlist efektif, allowlist command, dan proyeksi lama di tiap Plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan ditambah opsi pipeline balasan, receipt, pratinjau/streaming langsung, helper siklus hidup, identitas outbound, perencanaan payload, pengiriman durable, dan helper konteks message-send. Lihat [API outbound channel](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound` ditambah facade reply-dispatch lama. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound` ditambah facade reply-dispatch lama. |
    | `plugin-sdk/inbound-envelope` | Helper pembuat rute inbound + envelope bersama |
    | `plugin-sdk/inbound-reply-dispatch` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner inbound dan predikat dispatch, serta `plugin-sdk/channel-outbound` untuk helper pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias parsing target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper pemuatan media outbound dan state hosted-media bersama |
    | `plugin-sdk/outbound-send-deps` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper normalisasi poll yang sempit |
    | `plugin-sdk/thread-bindings-runtime` | Helper siklus hidup thread-binding dan adapter |
    | `plugin-sdk/agent-media-payload` | Pembuat payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Helper binding percakapan/thread, pairing, dan configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper resolusi group-policy runtime |
    | `plugin-sdk/channel-status` | Helper snapshot/ringkasan status channel bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif channel config-schema yang sempit |
    | `plugin-sdk/channel-config-writes` | Helper otorisasi penulisan config channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude Plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Helper edit/baca config allowlist |
    | `plugin-sdk/group-access` | Helper keputusan group-access bersama |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper kebijakan guard direct-DM pra-crypto yang sempit |
    | `plugin-sdk/discord` | Facade kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan subpath SDK channel generik |
    | `plugin-sdk/telegram-account` | Facade kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas owner yang dilacak; Plugin baru sebaiknya menggunakan helper runtime yang diinjeksi atau subpath SDK channel generik |
    | `plugin-sdk/zalouser` | Facade kompatibilitas Zalo Personal yang tidak digunakan lagi untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi command pengirim; Plugin baru sebaiknya menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan helper balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper inbound bersama untuk klasifikasi event, pembuatan konteks, pemformatan, root, debounce, pencocokan mention, mention-policy, dan logging inbound |
    | `plugin-sdk/channel-inbound-debounce` | Helper debounce inbound yang sempit |
    | `plugin-sdk/channel-mention-gating` | Helper mention-policy, marker mention, dan teks mention yang sempit tanpa surface runtime inbound yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facade kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Helper message-action channel, ditambah helper skema native yang tidak digunakan lagi dan dipertahankan untuk kompatibilitas Plugin |
    | `plugin-sdk/channel-route` | Helper normalisasi rute bersama, resolusi target berbasis parser, stringifikasi thread-id, kunci rute dedupe/compact, tipe parsed-target, dan pembanding rute/target |
    | `plugin-sdk/channel-targets` | Helper parsing target; pemanggil pembanding rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Helper secret-contract yang sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

Keluarga helper channel yang tidak digunakan lagi tetap tersedia hanya untuk
kompatibilitas Plugin yang dipublikasikan. Rencana penghapusannya adalah:
pertahankan selama jendela migrasi Plugin eksternal, pertahankan Plugin repo/terbundel
di `channel-inbound` dan `channel-outbound`, lalu hapus subpath kompatibilitas
pada pembersihan SDK mayor berikutnya. Ini berlaku untuk keluarga channel message/runtime
lama, channel streaming, akses direct-DM, pecahan helper inbound, reply-options,
dan pairing-path.

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan helper model yang dimuat |
    | `plugin-sdk/provider-setup` | Helper penyiapan penyedia lokal/self-hosted terkurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Helper penyiapan penyedia self-hosted kompatibel OpenAI yang terfokus |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper resolusi kunci API runtime untuk plugin penyedia |
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, rendering halaman callback, helper PKCE/status, parsing input otorisasi, helper kedaluwarsa token, dan helper pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi id model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper katalog model penyedia live untuk penemuan bergaya `/models` yang dijaga: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran id model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk uji kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kapabilitas HTTP/endpoint penyedia generik, galat HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial bercakupan |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan helper baca, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` agar kepemilikan manifes ditegakkan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, helper pengambilan penggunaan bersama, dan fetcher penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, kompatibilitas tool-call teks polos, dan helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream penyedia bersama publik termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, dan utilitas stream kompatibel Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch terjaga, ekstraksi teks hasil alat, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup yang sempit dan parsing perintah |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persen terpakai, dan waktu reset opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan mengarang persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam output status; gunakan `error` hanya ketika
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper resolusi pemberi persetujuan dan autentikasi tindakan dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kapabilitas/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint kanal panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; pilih seam adapter/Gateway yang lebih sempit ketika sudah memadai |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native, pengikatan akun, gate rute, fallback penerusan, dan supresi prompt exec native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi persetujuan hardcoded, payload prompt reaksi, penyimpanan target reaksi, dan ekspor kompatibilitas untuk supresi prompt exec native lokal |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset dedupe balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper uji kontrak kanal yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk path kanal panas |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper flow login autentikasi penyedia lazy untuk kanal privat dan pemasangan kode perangkat UI Web |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia yang sempit untuk permukaan rahasia kanal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` yang sempit dan pengetikan SecretRef untuk parsing kontrak rahasia/konfigurasi |
    | `plugin-sdk/secret-provider-integration` | Kontrak manifes integrasi penyedia SecretRef khusus tipe dan preset untuk plugin yang memublikasikan preset penyedia rahasia eksternal |
    | `plugin-sdk/security-runtime` | Helper kepercayaan bersama, gating DM, helper file/path berbatas root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp sibling, fallback pemindahan lintas perangkat, helper penyimpanan file privat, guard induk symlink, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan helper pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper kebijakan allowlist host dan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher yang sempit tanpa permukaan runtime infrastruktur luas |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch terjaga SSRF, galat SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper parsing input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout isi permintaan |
  </Accordion>

  <Accordion title="Subjalur runtime dan penyimpanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper runtime/logging/cadangan/pemasangan Plugin yang luas |
    | `plugin-sdk/runtime-env` | Helper env runtime, logger, timeout, retry, dan backoff yang sempit |
    | `plugin-sdk/browser-config` | Facade konfigurasi browser yang didukung untuk profil/default ternormalisasi, parsing URL CDP, dan helper auth kontrol browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper lifecycle tugas generik dan pengiriman penyelesaian untuk agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex bawaan yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread Codex; bukan untuk Plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex bawaan privat untuk pengawatan mirror/runtime tugas native; bukan untuk Plugin pihak ketiga |
    | `plugin-sdk/channel-runtime-context` | Helper registrasi dan lookup konteks-runtime channel generik |
    | `plugin-sdk/matrix` | Facade kompatibilitas Matrix yang tidak digunakan lagi untuk paket channel pihak ketiga yang lebih lama; Plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Facade kompatibilitas Mattermost yang tidak digunakan lagi untuk paket channel pihak ketiga yang lebih lama; Plugin baru sebaiknya mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper perintah/hook/http/interaktif Plugin bersama |
    | `plugin-sdk/hook-runtime` | Helper pipeline hook Webhook/internal bersama |
    | `plugin-sdk/lazy-runtime` | Helper impor/binding runtime lazy seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec proses |
    | `plugin-sdk/cli-runtime` | Helper pemformatan CLI, tunggu, versi, pemanggilan argumen, dan grup perintah lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID skenario QA transport langsung bersama, helper cakupan baseline, dan helper pemilihan skenario |
    | `plugin-sdk/gateway-method-runtime` | Helper dispatch metode Gateway yang dicadangkan untuk rute HTTP Plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, helper mulai klien siap event-loop, RPC CLI Gateway, error protokol Gateway, resolusi host LAN yang diiklankan, dan helper patch status channel |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi type-only terfokus untuk bentuk konfigurasi Plugin seperti `OpenClawConfig` dan tipe konfigurasi channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper lookup konfigurasi Plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman message-tool bersama |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram serta pemeriksaan duplikat/konflik, bahkan ketika permukaan kontrak Telegram bawaan tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi file tanpa barrel teks yang luas |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi approval hardcoded, payload prompt reaksi, store target reaksi, dan ekspor kompatibilitas untuk supresi prompt exec native lokal |
    | `plugin-sdk/approval-runtime` | Helper approval exec/Plugin, builder capability approval, helper auth/profil, helper routing/runtime native, dan pemformatan jalur tampilan approval terstruktur |
    | `plugin-sdk/reply-runtime` | Helper runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch/finalisasi balasan dan label percakapan yang sempit |
    | `plugin-sdk/reply-history` | Helper riwayat balasan jendela pendek bersama. Kode message-turn baru sebaiknya menggunakan `createChannelHistoryWindow`; helper map tingkat rendah tetap hanya sebagai ekspor kompatibilitas yang tidak digunakan lagi |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper chunking teks/markdown yang sempit |
    | `plugin-sdk/session-store-runtime` | Helper workflow sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, helper jalur store sesi legacy/kunci-sesi, pembacaan updated-at, dan helper kompatibilitas whole-store/jalur-file khusus transisi |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, helper target/baca/tulis bercakupan, publikasi pembaruan, write lock, dan kunci hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Helper skema agen SQLite, jalur, dan transaksi terfokus untuk runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Helper jalur/muat/simpan store Cron |
    | `plugin-sdk/state-paths` | Helper jalur direktori state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipe keyed-state SQLite sidecar Plugin plus penyiapan pragma koneksi terpusat dan pemeliharaan WAL untuk database milik Plugin |
    | `plugin-sdk/routing` | Helper binding rute/kunci-sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper ringkasan status channel/akun bersama, default runtime-state, dan helper metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Helper resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Helper normalisasi slug/string |
    | `plugin-sdk/request-url` | Ekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah berwaktu dengan hasil stdout/stderr ternormalisasi |
    | `plugin-sdk/param-readers` | Reader param tool/CLI umum |
    | `plugin-sdk/tool-plugin` | Definisikan Plugin agent-tool bertipe sederhana dan ekspos metadata statis untuk pembuatan manifest |
    | `plugin-sdk/tool-payload` | Ekstrak payload ternormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Ekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan helper perintah SSH/OpenShell, termasuk preflight perintah exec fail-fast |
    | `plugin-sdk/temp-path` | Helper jalur temp-download bersama dan workspace temp aman privat |
    | `plugin-sdk/logging-core` | Logger subsistem dan helper redaksi |
    | `plugin-sdk/markdown-table-runtime` | Helper mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Helper override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper resolusi konfigurasi provider Talk |
    | `plugin-sdk/json-store` | Helper baca/tulis state JSON kecil |
    | `plugin-sdk/json-unsafe-integers` | Helper parsing JSON yang mempertahankan literal integer tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Helper file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Helper runtime/sesi ACP dan dispatch balasan |
    | `plugin-sdk/acp-runtime-backend` | Helper registrasi backend ACP ringan dan dispatch balasan untuk Plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP read-only tanpa impor startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Reader param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Helper resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Helper bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif helper channel pasif, status, dan proxy ambient bersama |
    | `plugin-sdk/models-provider-runtime` | Helper balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper daftar perintah Skill |
    | `plugin-sdk/native-command-registry` | Helper registri/build/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan Plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, helper steer/abort active-run, helper bridge tool OpenClaw, helper kebijakan tool runtime-plan, klasifikasi outcome terminal, helper pemformatan/detail progres tool, dan utilitas hasil attempt |
    | `plugin-sdk/provider-zai-endpoint` | Facade deteksi endpoint milik provider Z.AI yang tidak digunakan lagi; gunakan API publik Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper async lock process-local untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetri aktivitas channel |
    | `plugin-sdk/concurrency-runtime` | Helper konkurensi tugas async terbatas |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe dalam memori |
    | `plugin-sdk/delivery-queue-runtime` | Helper drain pending-delivery outbound |
    | `plugin-sdk/file-access-runtime` | Helper jalur file lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Helper bangun, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Helper antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Helper tunggu kesiapan transport |
    | `plugin-sdk/exec-approvals-runtime` | Helper file kebijakan approval exec tanpa barrel infra-runtime yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Helper cache terbatas kecil |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostik, event, dan trace-context |
    | `plugin-sdk/error-runtime` | Graf error, pemformatan, helper klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proxy, opsi EnvHttpProxyAgent, dan helper lookup yang dipin |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang sadar dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Helper sanitizer URL data gambar inline dan sniffing signature tanpa permukaan runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Reader response-body terbatas tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/sqlite-runtime` | Helper skema agen SQLite, jalur, dan transaksi terfokus tanpa kontrol lifecycle database |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Helper koersi dan normalisasi record/string primitif yang sempit tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Helper normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Helper konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Helper direktori/identitas/workspace agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper pengambilan/transformasi/penyimpanan media bersama, termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang sudah tidak digunakan; utamakan helper penyimpanan sebelum pembacaan buffer saat URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media serta ekspor helper gambar/audio/ekstraksi terstruktur untuk penyedia |
    | `plugin-sdk/text-chunking` | Helper pemecahan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemecahan teks keluar |
    | `plugin-sdk/speech` | Tipe penyedia suara serta ekspor direktif, registry, validasi, pembuat TTS yang kompatibel dengan OpenAI, dan helper suara untuk penyedia |
    | `plugin-sdk/speech-core` | Tipe penyedia suara bersama, registry, direktif, normalisasi, dan ekspor helper suara |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi realtime, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil realtime untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` terbatas |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara realtime, helper registry, dan helper perilaku suara realtime bersama, termasuk pelacakan aktivitas output |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar serta helper aset gambar/data URL dan pembuat penyedia gambar yang kompatibel dengan OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama, failover, auth, dan helper registry |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan parsing referensi model |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan parsing referensi model |
    | `plugin-sdk/transcripts` | Tipe penyedia sumber transkrip bersama, helper registry, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper pemuatan media jarak jauh/lokal bersama |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang sudah tidak digunakan; impor `zod` langsung dari `zod` |
    | `plugin-sdk/testing` | Barrel kompatibilitas repo-lokal yang sudah tidak digunakan untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subpath pengujian lokal terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` repo-lokal untuk pengujian unit pendaftaran Plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native repo-lokal untuk pengujian auth, delivery, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian repo-lokal berorientasi channel untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading send-config, mock runtime, masalah status, delivery keluar, dan pendaftaran hook |
    | `plugin-sdk/channel-target-testing` | Suite kasus kesalahan resolusi target bersama repo-lokal untuk pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak repo-lokal untuk paket Plugin, pendaftaran, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak repo-lokal untuk runtime penyedia, auth, discovery, onboard, katalog, wizard, kapabilitas media, kebijakan replay, realtime STT audio langsung, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opsional repo-lokal untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture repo-lokal generik untuk tangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, event sistem, muat ulang modul, path Plugin bundel, teks terminal, chunking, token auth, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus repo-lokal untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory subpaths">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bundel untuk helper manajer/konfigurasi/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry penyedia embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor mesin foundation host memori |
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
    | `plugin-sdk/memory-host-core` | Alias netral-vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral-vendor untuk helper jurnal event host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime memori aktif untuk akses manajer pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang sudah tidak digunakan; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reserved bundled-helper subpaths">
    Subpath SDK helper bundel yang dicadangkan adalah permukaan sempit khusus pemilik untuk
    kode Plugin bundel. Subpath ini dilacak dalam inventaris SDK agar build
    paket dan aliasing tetap deterministik, tetapi bukan API pembuatan Plugin
    umum. Kontrak host baru yang dapat digunakan ulang sebaiknya menggunakan subpath SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subpath | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper Plugin Codex bundel untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex bundel untuk mencerminkan subagen native app-server Codex ke status tugas OpenClaw |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
