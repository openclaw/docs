---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subpath Plugin SDK: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-07-04T11:04:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin diekspos sebagai sekumpulan subpath publik yang sempit di bawah
`openclaw/plugin-sdk/`. Halaman ini mengatalogkan subpath yang umum digunakan, dikelompokkan
berdasarkan tujuan. Inventaris entrypoint compiler yang dihasilkan berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket adalah subset publik
setelah mengurangi subpath pengujian/internal lokal repo yang tercantum di
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainer dapat mengaudit
jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan subpath helper cadangan
yang aktif dengan `pnpm plugins:boundary-report:summary`; ekspor helper cadangan
yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada di SDK publik sebagai
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
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`               |
| `plugin-sdk/health`            | Pendaftaran, deteksi, perbaikan, pemilihan, tingkat keparahan, dan tipe temuan pemeriksaan kesehatan Doctor untuk konsumen kesehatan bawaan                            |

### Kompatibilitas dan helper pengujian yang tidak digunakan lagi

Subpath yang tidak digunakan lagi tetap diekspor untuk Plugin lama, tetapi kode baru sebaiknya menggunakan
subpath SDK terfokus di bawah ini. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak impor produksi
bawaan darinya. Barrel luas seperti `compat`, `config-types`,
`infra-runtime`, `text-runtime`, dan `zod` hanya untuk kompatibilitas. Impor `zod`
langsung dari `zod`.

Subpath helper pengujian berbasis Vitest milik OpenClaw hanya lokal repo dan tidak lagi
menjadi ekspor paket: `agent-runtime-test-contracts`,
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
  <Accordion title="Channel subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Ekspor skema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi JSON Schema bercache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, penerjemah penyiapan, prompt daftar izin, pembangun status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas usang; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multi-akun/gerbang tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi id akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu sempit daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Pembantu parsing daftar izin grup akses dan diagnostik grup yang disunting |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi channel bersama plus pembangun Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi channel OpenClaw bawaan hanya untuk plugin bawaan yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id channel chat bawaan/resmi kanonis plus label/alias pemformat untuk plugin yang perlu mengenali teks berprefiks amplop tanpa menghardcode tabel sendiri. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas usang untuk skema konfigurasi channel bawaan |
    | `plugin-sdk/telegram-command-config` | Pembantu normalisasi/validasi perintah kustom Telegram dengan fallback kontrak bawaan |
    | `plugin-sdk/command-gating` | Pembantu gerbang otorisasi perintah sempit |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Fasad kompatibilitas ingress channel tingkat rendah yang usang. Jalur penerimaan baru harus menggunakan `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress channel tingkat tinggi eksperimental dan pembangun fakta rute untuk jalur penerimaan channel yang dimigrasikan. Lebih pilih ini daripada merakit daftar izin efektif, daftar izin perintah, dan proyeksi lama di tiap plugin. Lihat [API ingress channel](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan plus opsi pipeline balasan, tanda terima, pratinjau/streaming langsung, pembantu siklus hidup, identitas keluar, perencanaan payload, pengiriman tahan lama, dan pembantu konteks pengiriman pesan. Lihat [API outbound channel](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas usang untuk `plugin-sdk/channel-outbound` plus fasad dispatch balasan lama. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas usang untuk `plugin-sdk/channel-outbound` plus fasad dispatch balasan lama. |
    | `plugin-sdk/inbound-envelope` | Pembantu bersama pembangun rute masuk + amplop |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-inbound` untuk runner masuk dan predikat dispatch, serta `plugin-sdk/channel-outbound` untuk pembantu pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias parsing target usang; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Pembantu bersama pemuatan media keluar dan status media yang dihosting |
    | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi polling sempit |
    | `plugin-sdk/thread-bindings-runtime` | Siklus hidup pengikatan thread dan pembantu adapter |
    | `plugin-sdk/agent-media-payload` | Pembangun payload media agen lama |
    | `plugin-sdk/conversation-runtime` | Pembantu pengikatan percakapan/thread, pemasangan, dan pengikatan yang dikonfigurasi |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi runtime |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu bersama snapshot/ringkasan status channel |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi channel sempit |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi channel |
    | `plugin-sdk/channel-plugin-common` | Ekspor prelude plugin channel bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu edit/baca konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Pembantu bersama keputusan akses grup |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Pembantu kebijakan penjaga direct-DM pra-crypto sempit |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord usang untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas owner terlacak; plugin baru harus menggunakan subjalur SDK channel generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram usang untuk kompatibilitas owner terlacak; plugin baru harus menggunakan pembantu runtime yang diinjeksi atau subjalur SDK channel generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal usang untuk paket Lark/Zalo yang dipublikasikan yang masih mengimpor otorisasi perintah pengirim; plugin baru harus menggunakan `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentasi pesan semantik, pengiriman, dan pembantu balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Pembantu masuk bersama untuk klasifikasi peristiwa, pembangunan konteks, pemformatan, root, debounce, pencocokan mention, kebijakan mention, dan logging masuk |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce masuk sempit |
    | `plugin-sdk/channel-mention-gating` | Pembantu sempit kebijakan mention, penanda mention, dan teks mention tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas usang. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipe hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan channel, plus pembantu skema native usang yang dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Normalisasi rute bersama, resolusi target berbasis parser, stringifikasi id thread, kunci rute dedupe/compact, tipe target terurai, dan pembantu perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu parsing target; pemanggil perbandingan rute harus menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipe kontrak channel |
    | `plugin-sdk/channel-feedback` | Pengkabelan umpan balik/reaksi |
    | `plugin-sdk/channel-secret-runtime` | Pembantu kontrak rahasia sempit seperti `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, dan tipe target rahasia |
  </Accordion>

Keluarga pembantu channel yang usang tetap tersedia hanya untuk kompatibilitas
plugin yang dipublikasikan. Rencana penghapusannya adalah: mempertahankannya
selama jendela migrasi plugin eksternal, menjaga plugin repo/bawaan tetap pada
`channel-inbound` dan `channel-outbound`, lalu menghapus subjalur kompatibilitas
dalam pembersihan besar SDK berikutnya. Ini berlaku untuk keluarga lama pesan/runtime
channel, streaming channel, akses direct-DM, pecahan pembantu masuk, opsi balasan,
dan pairing-path.

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
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, perenderan halaman callback, helper PKCE/state, penguraian input otorisasi, helper kedaluwarsa token, dan helper pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Helper onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Helper pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint penyedia, dan helper normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper katalog model penyedia live untuk penemuan bergaya `/models` yang dijaga: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri plugin-penyedia untuk uji kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper kemampuan HTTP/endpoint penyedia generik, error HTTP penyedia, dan helper formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper kontrak konfigurasi/pemilihan web-fetch yang sempit seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper registrasi/cache penyedia web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berlingkup |
    | `plugin-sdk/provider-web-search` | Helper registrasi/cache/runtime penyedia web-search |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan helper baca, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` sehingga kepemilikan manifes ditegakkan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, dan pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, helper pengambilan penggunaan bersama, dan pengambil penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, kompatibilitas pemanggilan tool teks biasa, dan helper wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper stream penyedia bersama publik termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, dan utilitas stream Anthropic/DeepSeek/kompatibel dengan OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper transport penyedia native seperti fetch yang dijaga, ekstraksi teks hasil tool, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Helper patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache lokal proses |
    | `plugin-sdk/group-activation` | Helper mode aktivasi grup dan penguraian perintah yang sempit |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu reset opsional. Penyedia yang mengekspos teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan array `windows` kosong, bukan membuat-buat persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam output status; gunakan `error` hanya ketika
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subjalur autentikasi dan keamanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper registri perintah termasuk pemformatan menu argumen dinamis, helper otorisasi pengirim |
    | `plugin-sdk/command-status` | Builder pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolusi pemberi persetujuan dan helper autentikasi aksi dalam chat yang sama |
    | `plugin-sdk/approval-client-runtime` | Helper profil/filter persetujuan exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Helper resolusi Gateway persetujuan bersama |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper pemuatan adapter persetujuan native ringan untuk entrypoint channel panas |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime handler persetujuan yang lebih luas; pilih seam adapter/gateway yang lebih sempit saat sudah cukup |
    | `plugin-sdk/approval-native-runtime` | Helper target persetujuan native, pengikatan akun, gate rute, fallback penerusan, dan supresi prompt exec native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Binding reaksi persetujuan hardcode, payload prompt reaksi, store target reaksi, helper teks petunjuk reaksi, dan ekspor kompatibilitas untuk supresi prompt exec native lokal |
    | `plugin-sdk/approval-reply-runtime` | Helper payload balasan persetujuan exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper payload persetujuan exec/plugin, helper routing/runtime persetujuan native, dan helper tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper reset dedupe balasan masuk yang sempit |
    | `plugin-sdk/channel-contract-testing` | Helper uji kontrak channel yang sempit tanpa barrel pengujian luas |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan helper target sesi native |
    | `plugin-sdk/command-detection` | Helper deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur channel panas |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan helper permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper alur login autentikasi penyedia lazy untuk channel privat dan pemasangan kode perangkat Antarmuka Web |
    | `plugin-sdk/channel-secret-runtime` | Helper pengumpulan kontrak rahasia yang sempit untuk permukaan rahasia channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper `coerceSecretRef` yang sempit dan pengetikan SecretRef untuk penguraian kontrak rahasia/konfigurasi |
    | `plugin-sdk/secret-provider-integration` | Kontrak manifes dan preset integrasi penyedia SecretRef khusus tipe untuk plugin yang menerbitkan preset penyedia rahasia eksternal |
    | `plugin-sdk/security-runtime` | Helper bersama untuk kepercayaan, gating DM, file/jalur berbatas root termasuk penulisan hanya-buat, penggantian file atomik sinkron/asinkron, penulisan temp saudara, fallback pemindahan lintas perangkat, helper penyimpanan file privat, penjaga induk symlink, konten eksternal, redaksi teks sensitif, perbandingan rahasia waktu-konstan, dan helper pengumpulan rahasia |
    | `plugin-sdk/ssrf-policy` | Helper allowlist host dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Helper pinned-dispatcher sempit tanpa permukaan runtime infra yang luas |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch yang dijaga SSRF, error SSRF, dan helper kebijakan SSRF |
    | `plugin-sdk/secret-input` | Helper penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Helper permintaan/target Webhook dan koersi websocket/body mentah |
    | `plugin-sdk/webhook-request-guards` | Helper ukuran/timeout body permintaan |
  </Accordion>

  <Accordion title="Subjalur runtime dan penyimpanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu luas untuk runtime/logging/cadangan/instalasi-Plugin |
    | `plugin-sdk/runtime-env` | Pembantu sempit untuk env runtime, logger, timeout, retry, dan backoff |
    | `plugin-sdk/browser-config` | Facade konfigurasi browser yang didukung untuk profil/default yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol-browser |
    | `plugin-sdk/agent-harness-task-runtime` | Pembantu generik untuk siklus hidup tugas dan pengiriman penyelesaian bagi agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Pembantu Codex bundel yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread Codex; bukan untuk Plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Pembantu Codex bundel privat untuk pengawatan mirror/runtime tugas native; bukan untuk Plugin pihak ketiga |
    | `plugin-sdk/channel-runtime-context` | Pembantu generik untuk pendaftaran dan lookup konteks-runtime kanal |
    | `plugin-sdk/matrix` | Facade kompatibilitas Matrix yang tidak digunakan lagi untuk paket kanal pihak ketiga lama; Plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Facade kompatibilitas Mattermost yang tidak digunakan lagi untuk paket kanal pihak ketiga lama; Plugin baru sebaiknya mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Pembantu bersama untuk perintah/hook/http/interaktif Plugin |
    | `plugin-sdk/hook-runtime` | Pembantu pipeline bersama untuk hook Webhook/internal |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime malas seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pembantu eksekusi proses |
    | `plugin-sdk/cli-runtime` | Pembantu pemformatan CLI, tunggu, versi, pemanggilan-argumen, dan grup-perintah malas |
    | `plugin-sdk/qa-live-transport-scenarios` | ID skenario QA transport live bersama, pembantu cakupan baseline, dan pembantu pemilihan-skenario |
    | `plugin-sdk/gateway-method-runtime` | Pembantu dispatch metode Gateway yang dicadangkan untuk route HTTP Plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu start klien siap event-loop, RPC CLI gateway, error protokol gateway, resolusi host LAN yang diiklankan, dan pembantu patch status-kanal |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi type-only terfokus untuk bentuk konfigurasi Plugin seperti `OpenClawConfig` dan tipe konfigurasi kanal/provider |
    | `plugin-sdk/plugin-config-runtime` | Pembantu lookup konfigurasi-Plugin runtime seperti `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman message-tool bersama |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan setter snapshot pengujian |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikat/konflik, bahkan saat permukaan kontrak Telegram bundel tidak tersedia |
    | `plugin-sdk/text-autolink-runtime` | Deteksi autolink referensi-file tanpa barrel teks luas |
    | `plugin-sdk/approval-reaction-runtime` | Pengikatan reaksi persetujuan hardcoded, payload prompt reaksi, store target reaksi, pembantu teks petunjuk reaksi, dan ekspor kompatibilitas untuk supresi prompt eksekusi native lokal |
    | `plugin-sdk/approval-runtime` | Pembantu persetujuan exec/Plugin, builder kapabilitas-persetujuan, pembantu auth/profil, pembantu routing/runtime native, dan pemformatan path tampilan persetujuan terstruktur |
    | `plugin-sdk/reply-runtime` | Pembantu runtime inbound/balasan bersama, chunking, dispatch, Heartbeat, perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu sempit untuk dispatch/finalisasi balasan dan label percakapan |
    | `plugin-sdk/reply-history` | Pembantu riwayat-balasan jendela-pendek bersama. Kode giliran-pesan baru sebaiknya menggunakan `createChannelHistoryWindow`; pembantu map tingkat lebih rendah tetap hanya sebagai ekspor kompatibilitas yang tidak digunakan lagi |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu chunking teks/markdown sempit |
    | `plugin-sdk/session-store-runtime` | Pembantu alur kerja sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi menurut identitas sesi, pembantu path store sesi lama/kunci-sesi, pembacaan updated-at, dan pembantu kompatibilitas seluruh-store/path-file hanya untuk transisi |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, pembantu target/baca/tulis bercakupan, publikasi pembaruan, write lock, dan kunci hit memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Pembantu skema-agen, path, dan transaksi SQLite terfokus untuk runtime pihak pertama |
    | `plugin-sdk/cron-store-runtime` | Pembantu path/load/save store Cron |
    | `plugin-sdk/state-paths` | Pembantu path dir State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipe keyed-state SQLite sidecar Plugin ditambah setup pragma koneksi terpusat dan pemeliharaan WAL untuk database milik Plugin |
    | `plugin-sdk/routing` | Pembantu pengikatan route/kunci-sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status kanal/akun bersama, default state-runtime, dan pembantu metadata issue |
    | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target bersama |
    | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari input mirip fetch/request |
    | `plugin-sdk/run-command` | Runner perintah berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca param tool/CLI umum |
    | `plugin-sdk/tool-plugin` | Mendefinisikan Plugin agent-tool bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifest |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil tool |
    | `plugin-sdk/tool-send` | Mengekstrak field target kirim kanonis dari argumen tool |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan pembantu perintah SSH/OpenShell, termasuk preflight perintah exec fail-fast |
    | `plugin-sdk/temp-path` | Pembantu path temp-download bersama dan workspace temp aman privat |
    | `plugin-sdk/logging-core` | Logger subsistem dan pembantu redaksi |
    | `plugin-sdk/markdown-table-runtime` | Mode tabel Markdown dan pembantu konversi |
    | `plugin-sdk/model-session-runtime` | Pembantu override model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pembantu resolusi konfigurasi provider Talk |
    | `plugin-sdk/json-store` | Pembantu kecil baca/tulis state JSON |
    | `plugin-sdk/json-unsafe-integers` | Pembantu penguraian JSON yang mempertahankan literal integer tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Pembantu file-lock re-entrant |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache dedupe berbasis disk |
    | `plugin-sdk/acp-runtime` | Pembantu runtime/sesi ACP dan dispatch-balasan |
    | `plugin-sdk/acp-runtime-backend` | Pembantu ringan pendaftaran backend ACP dan dispatch-balasan untuk Plugin yang dimuat saat startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi binding ACP baca-saja tanpa impor startup siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema-konfigurasi runtime agen yang sempit |
    | `plugin-sdk/boolean-param` | Pembaca param boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Pembantu resolusi pencocokan nama-berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pairing |
    | `plugin-sdk/extension-shared` | Primitif pembantu bersama untuk kanal pasif, status, dan proksi ambient |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu listing perintah Skill |
    | `plugin-sdk/native-command-registry` | Pembantu registry/build/serialize perintah native |
    | `plugin-sdk/agent-harness` | Permukaan Plugin tepercaya eksperimental untuk harness agen tingkat rendah: tipe harness, pembantu steer/abort active-run, pembantu bridge tool OpenClaw, pembantu kebijakan tool runtime-plan, klasifikasi hasil terminal, pembantu pemformatan/detail progres tool, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Facade deteksi endpoint milik provider Z.AI yang tidak digunakan lagi; gunakan API publik Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pembantu lock async process-local untuk file state runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Pembantu telemetri aktivitas kanal |
    | `plugin-sdk/concurrency-runtime` | Pembantu konkurensi tugas async berbatas |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache dedupe dalam-memori dan berbasis persisten |
    | `plugin-sdk/delivery-queue-runtime` | Pembantu drain pending-delivery outbound |
    | `plugin-sdk/file-access-runtime` | Pembantu path file-lokal dan sumber-media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Pembantu wake, event, dan visibilitas Heartbeat |
    | `plugin-sdk/number-runtime` | Pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Pembantu antrean event sistem |
    | `plugin-sdk/transport-ready-runtime` | Pembantu tunggu kesiapan transport |
    | `plugin-sdk/exec-approvals-runtime` | Pembantu file kebijakan persetujuan exec tanpa barrel infra-runtime luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil berbatas |
    | `plugin-sdk/diagnostic-runtime` | Pembantu flag diagnostik, event, dan konteks-trace |
    | `plugin-sdk/error-runtime` | Grafik error, pemformatan, pembantu klasifikasi error bersama, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan pembantu lookup yang dipin |
    | `plugin-sdk/runtime-fetch` | Fetch runtime sadar-dispatcher tanpa impor proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL data gambar inline dan pembantu sniffing signature tanpa permukaan runtime media luas |
    | `plugin-sdk/response-limit-runtime` | Pembaca body respons berbatas tanpa permukaan runtime media luas |
    | `plugin-sdk/session-binding-runtime` | State binding percakapan saat ini tanpa routing binding terkonfigurasi atau store pairing |
    | `plugin-sdk/session-store-runtime` | Pembantu store-sesi tanpa impor penulisan/pemeliharaan konfigurasi luas |
    | `plugin-sdk/sqlite-runtime` | Pembantu skema-agen, path, dan transaksi SQLite terfokus tanpa kontrol siklus hidup database |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan luas |
    | `plugin-sdk/string-coerce-runtime` | Pembantu sempit untuk koersi dan normalisasi record/string primitif tanpa impor markdown/logging |
    | `plugin-sdk/host-runtime` | Pembantu normalisasi hostname dan host SCP |
    | `plugin-sdk/retry-runtime` | Pembantu konfigurasi retry dan runner retry |
    | `plugin-sdk/agent-runtime` | Pembantu dir/identitas/workspace agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi |
    | `plugin-sdk/directory-runtime` | Kueri/dedup direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subjalur kemampuan dan pengujian">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper bersama untuk mengambil/mentransformasi/menyimpan media, termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang sudah usang; utamakan helper penyimpanan sebelum pembacaan buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper bersama untuk failover pembuatan media, pemilihan kandidat, dan pesan model yang hilang |
    | `plugin-sdk/media-understanding` | Tipe provider pemahaman media serta ekspor helper gambar/audio/ekstraksi-terstruktur untuk provider |
    | `plugin-sdk/text-chunking` | Helper pemotongan/perenderan teks dan markdown, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/text-chunking` | Helper pemotongan teks keluar |
    | `plugin-sdk/speech` | Tipe provider ucapan serta ekspor direktif, registry, validasi, pembangun TTS kompatibel OpenAI, dan helper ucapan untuk provider |
    | `plugin-sdk/speech-core` | Ekspor tipe provider ucapan, registry, direktif, normalisasi, dan helper ucapan bersama |
    | `plugin-sdk/realtime-transcription` | Tipe provider transkripsi waktu nyata, helper registry, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil waktu nyata untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang terbatas |
    | `plugin-sdk/realtime-voice` | Tipe provider suara waktu nyata, helper registry, dan helper perilaku suara waktu nyata bersama, termasuk pelacakan aktivitas output |
    | `plugin-sdk/image-generation` | Tipe provider pembuatan gambar serta helper aset gambar/data URL dan pembangun provider gambar kompatibel OpenAI |
    | `plugin-sdk/image-generation-core` | Helper bersama untuk tipe, failover, auth, dan registry pembuatan gambar |
    | `plugin-sdk/music-generation` | Tipe provider/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian provider, dan parsing referensi model |
    | `plugin-sdk/video-generation` | Tipe provider/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian provider, dan parsing referensi model |
    | `plugin-sdk/transcripts` | Tipe provider sumber transkrip bersama, helper registry, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Registry target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang sudah usang; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper bersama untuk pemuatan media jarak jauh/lokal |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang sudah usang; impor `zod` langsung dari `zod` |
    | `plugin-sdk/testing` | Barrel kompatibilitas usang lokal repo untuk pengujian OpenClaw lama. Pengujian repo baru sebaiknya mengimpor subjalur pengujian lokal yang terfokus seperti `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, atau `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` lokal repo untuk pengujian unit registrasi Plugin langsung tanpa mengimpor bridge helper pengujian repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adapter runtime agen native lokal repo untuk pengujian auth, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi channel lokal repo untuk kontrak tindakan/setup/status generik, asersi direktori, siklus hidup startup akun, threading konfigurasi pengiriman, mock runtime, masalah status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Suite bersama lokal repo untuk kasus kesalahan resolusi target dalam pengujian channel |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak lokal repo untuk paket Plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak lokal repo untuk runtime provider, auth, discovery, onboard, katalog, wizard, kemampuan media, kebijakan replay, audio langsung STT waktu nyata, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in lokal repo untuk pengujian provider yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture lokal repo generik untuk tangkapan runtime CLI, konteks sandbox, penulis skill, pesan agen, event sistem, pemuatan ulang modul, jalur Plugin bundel, teks terminal, pemotongan, token auth, dan kasus bertipe |
    | `plugin-sdk/test-node-mocks` | Helper mock bawaan Node terfokus lokal repo untuk digunakan di dalam factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Subjalur memori">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/memory-core` | Permukaan helper memory-core bundel untuk helper pengelola/konfigurasi/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime indeks/pencarian memori |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper registry provider embedding memori ringan |
    | `plugin-sdk/memory-core-host-engine-foundation` | Ekspor engine fondasi host memori |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrak embedding host memori, akses registry, provider lokal, dan helper batch/jarak jauh generik. `registerMemoryEmbeddingProvider` pada permukaan ini sudah usang; gunakan API provider embedding generik untuk provider baru. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Ekspor engine QMD host memori |
    | `plugin-sdk/memory-core-host-engine-storage` | Ekspor engine penyimpanan host memori |
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
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memori |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory untuk akses pengelola pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang sudah usang; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subjalur helper bundel yang dicadangkan">
    Subjalur SDK helper bundel yang dicadangkan adalah permukaan sempit khusus owner untuk
    kode Plugin bundel. Subjalur ini dilacak dalam inventaris SDK agar build paket
    dan aliasing tetap deterministik, tetapi bukan API penulisan Plugin umum.
    Kontrak host baru yang dapat digunakan kembali sebaiknya menggunakan subjalur SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subjalur | Owner dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper Plugin Codex bundel untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi thread server aplikasi Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex bundel untuk mencerminkan subagen native server aplikasi Codex ke status tugas OpenClaw |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
