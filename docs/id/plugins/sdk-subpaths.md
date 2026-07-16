---
read_when:
    - Memilih subpath plugin-sdk yang tepat untuk impor Plugin
    - Mengaudit subpath Plugin bawaan dan permukaan helper
summary: 'Katalog subpath SDK Plugin: impor mana berada di mana, dikelompokkan berdasarkan area'
title: Subjalur SDK Plugin
x-i18n:
    generated_at: "2026-07-16T18:34:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK plugin diekspos sebagai sekumpulan subpath publik terbatas di bawah
`openclaw/plugin-sdk/`. Halaman ini mencantumkan subpath yang umum digunakan dan dikelompokkan berdasarkan
tujuan. Tiga file mendefinisikan permukaan tersebut:

- `scripts/lib/plugin-sdk-entrypoints.json`: inventaris entrypoint yang dipelihara
  dan dikompilasi oleh build.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: subpath pengujian/internal
  lokal repo. Ekspor paket adalah inventaris dikurangi daftar ini.
- `src/plugin-sdk/entrypoints.ts`: metadata klasifikasi untuk subpath
  yang tidak digunakan lagi, helper bawaan yang dicadangkan, facade bawaan yang didukung, dan
  permukaan publik milik plugin.

Pemelihara mengaudit jumlah ekspor publik dengan `pnpm plugin-sdk:surface` dan
subpath helper cadangan yang aktif dengan `pnpm plugins:boundary-report:summary`;
ekspor helper cadangan yang tidak digunakan akan menggagalkan laporan CI alih-alih tetap berada dalam
SDK publik sebagai utang kompatibilitas yang tidak aktif.

Untuk panduan penulisan plugin, lihat [ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Entri plugin

| Subpath                        | Ekspor utama                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Helper item penyedia migrasi seperti `createMigrationItem`, konstanta alasan, penanda status item, helper redaksi, dan `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Helper migrasi runtime seperti `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime`, dan `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Pendaftaran pemeriksaan kesehatan Doctor, deteksi, perbaikan, pemilihan, tingkat keparahan, dan jenis temuan untuk konsumen kesehatan bawaan                                                                                |
| `plugin-sdk/config-schema`     | Tidak digunakan lagi. Skema Zod `openclaw.json` root (`OpenClawSchema`); sebagai gantinya, definisikan skema lokal plugin dan validasi dengan `plugin-sdk/json-schema-runtime`                                                  |

### Helper kompatibilitas dan pengujian yang tidak digunakan lagi

Subpath yang tidak digunakan lagi tetap diekspor untuk plugin lama, tetapi kode baru harus menggunakan
subpath SDK terfokus di bawah ini. Daftar yang dipelihara adalah
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI menolak impor produksi
bawaan darinya. Barrel luas seperti `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime`, dan
`plugin-sdk/text-runtime` hanya untuk kompatibilitas, dan `plugin-sdk/zod` adalah
ekspor ulang kompatibilitas: impor `zod` secara langsung dari `zod`. Barrel domain
luas `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime`, dan
`plugin-sdk/security-runtime` juga tidak digunakan lagi dan digantikan oleh
subpath terfokus.

Subpath helper pengujian OpenClaw yang didukung Vitest hanya bersifat lokal repo dan tidak
lagi menjadi ekspor paket: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks`, dan `testing`. Permukaan helper bawaan privat
`ssrf-runtime-internal` dan `codex-native-task-runtime` juga hanya bersifat lokal
repo.

### Subpath helper plugin bawaan yang dicadangkan

`plugin-sdk/codex-mcp-projection` adalah satu-satunya subpath yang dicadangkan: permukaan kompatibilitas
milik plugin untuk plugin Codex bawaan, bukan API SDK umum.
Impor plugin lintas pemilik diblokir oleh pagar pengaman kontrak paket, dan
CI gagal ketika subpath yang dicadangkan berhenti diimpor.
`plugin-sdk/codex-native-task-runtime` hanya bersifat lokal repo dan bukan merupakan ekspor
paket.

`src/plugin-sdk/entrypoints.ts` juga melacak facade bawaan yang didukung, yaitu entrypoint
SDK yang didukung oleh plugin bawaannya hingga kontrak generik menggantikannya:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime`, dan `plugin-sdk/zalouser`. Beberapa di antaranya juga
tidak digunakan lagi untuk kode baru; lihat catatan per baris di bawah ini.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Pembantu validasi Skema JSON yang di-cache untuk skema milik plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama, penerjemah penyiapan, prompt daftar izin, pembuat status penyiapan |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pembantu konfigurasi multi-akun/gerbang tindakan, pembantu fallback akun default |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pembantu normalisasi ID akun |
    | `plugin-sdk/account-resolution` | Pembantu pencarian akun + fallback default |
    | `plugin-sdk/account-helpers` | Pembantu terbatas untuk daftar akun/tindakan akun |
    | `plugin-sdk/access-groups` | Pembantu penguraian daftar izin grup akses dan diagnostik grup yang disamarkan |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitif skema konfigurasi kanal bersama beserta pembuat Zod dan JSON/TypeBox langsung |
    | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi kanal OpenClaw bawaan khusus untuk plugin bawaan yang dipelihara |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID kanal obrolan bawaan/resmi kanonis beserta label/alias pemformat untuk plugin yang perlu mengenali teks berawalan amplop tanpa melakukan hardcode pada tabelnya sendiri. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias kompatibilitas yang tidak digunakan lagi untuk skema konfigurasi kanal bawaan |
    | `plugin-sdk/telegram-command-config` | Normalisasi nama/deskripsi perintah Telegram dan pemeriksaan duplikasi/konflik yang tidak digunakan lagi; gunakan penanganan konfigurasi perintah lokal plugin dalam kode plugin baru |
    | `plugin-sdk/command-gating` | Pembantu gerbang otorisasi perintah terbatas |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime ingress kanal tingkat tinggi eksperimental dan pembuat fakta rute untuk jalur penerimaan kanal yang telah dimigrasikan. Utamakan ini daripada menyusun daftar izin efektif, daftar izin perintah, dan proyeksi lama di setiap plugin. Lihat [API ingress kanal](/id/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrak siklus hidup pesan beserta opsi pipeline balasan, tanda terima, pratinjau langsung/streaming, pembantu siklus hidup, identitas keluar, perencanaan payload, pengiriman tahan lama, dan pembantu konteks pengiriman pesan. Lihat [API keluar kanal](/id/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias kompatibilitas yang tidak digunakan lagi untuk `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Pembantu bersama untuk rute masuk + pembuat amplop |
    | `plugin-sdk/inbound-reply-dispatch` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` untuk runner masuk dan predikat pengiriman, serta `plugin-sdk/channel-outbound` untuk pembantu pengiriman pesan. |
    | `plugin-sdk/messaging-targets` | Alias penguraian target yang tidak digunakan lagi; gunakan `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Pembantu pemuatan media keluar bersama dan status media yang dihosting |
    | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Pembantu normalisasi jajak pendapat terbatas |
    | `plugin-sdk/thread-bindings-runtime` | Pembantu siklus hidup dan adaptor pengikatan utas |
    | `plugin-sdk/agent-media-payload` | Akar dan pemuat payload media agen |
    | `plugin-sdk/conversation-runtime` | Barrel luas yang tidak digunakan lagi untuk pengikatan percakapan/utas, pemasangan, dan pembantu pengikatan terkonfigurasi; utamakan subjalur pengikatan terfokus seperti `plugin-sdk/thread-bindings-runtime` dan `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Pembantu resolusi kebijakan grup runtime |
    | `plugin-sdk/channel-status` | Pembantu snapshot/ringkasan status kanal bersama |
    | `plugin-sdk/channel-config-primitives` | Primitif skema konfigurasi kanal terbatas |
    | `plugin-sdk/channel-config-writes` | Pembantu otorisasi penulisan konfigurasi kanal |
    | `plugin-sdk/channel-plugin-common` | Ekspor pendahuluan plugin kanal bersama |
    | `plugin-sdk/allowlist-config-edit` | Pembantu penyuntingan/pembacaan konfigurasi daftar izin |
    | `plugin-sdk/group-access` | Pembantu keputusan akses grup yang tidak digunakan lagi; gunakan `resolveChannelMessageIngress` dari `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Pembantu kebijakan pengaman pra-kriptografi DM langsung terbatas |
    | `plugin-sdk/discord` | Fasad kompatibilitas Discord yang tidak digunakan lagi untuk `@openclaw/discord@2026.3.13` yang dipublikasikan dan kompatibilitas pemilik yang dilacak; plugin baru sebaiknya menggunakan subjalur SDK kanal generik |
    | `plugin-sdk/telegram-account` | Fasad kompatibilitas resolusi akun Telegram yang tidak digunakan lagi untuk kompatibilitas pemilik yang dilacak; plugin baru sebaiknya menggunakan pembantu runtime yang diinjeksikan atau subjalur SDK kanal generik |
    | `plugin-sdk/zalouser` | Fasad kompatibilitas Zalo Personal yang tidak digunakan lagi untuk paket Lark/Zalo terpublikasi yang masih mengimpor otorisasi perintah pengirim; plugin baru sebaiknya menggunakan subjalur SDK kanal generik |
    | `plugin-sdk/interactive-runtime` | Pembantu presentasi pesan semantik, pengiriman, dan balasan interaktif lama. Lihat [Presentasi Pesan](/id/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Pembantu masuk bersama untuk klasifikasi peristiwa, pembuatan konteks, pemformatan, akar, debounce, pencocokan sebutan, kebijakan sebutan, dan pencatatan masuk |
    | `plugin-sdk/channel-inbound-debounce` | Pembantu debounce masuk terbatas |
    | `plugin-sdk/channel-mention-gating` | Pembantu terbatas untuk kebijakan sebutan, penanda sebutan, dan teks sebutan tanpa permukaan runtime masuk yang lebih luas |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-inbound` atau `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi. Gunakan `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Jenis hasil balasan |
    | `plugin-sdk/channel-actions` | Pembantu tindakan pesan kanal, beserta pembantu skema native yang tidak digunakan lagi tetapi dipertahankan untuk kompatibilitas plugin |
    | `plugin-sdk/channel-route` | Normalisasi rute bersama, resolusi target berbasis pengurai, konversi ID utas menjadi string, kunci rute deduplikasi/ringkas, jenis target terurai, serta pembantu perbandingan rute/target |
    | `plugin-sdk/channel-targets` | Pembantu penguraian target; pemanggil perbandingan rute sebaiknya menggunakan `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Jenis kontrak kanal |
    | `plugin-sdk/channel-feedback` | Pengkabelan umpan balik/reaksi |
  </Accordion>

Keluarga helper channel yang tidak digunakan lagi tetap tersedia hanya untuk
kompatibilitas Plugin yang telah dipublikasikan. Rencana penghapusannya adalah:
mempertahankannya selama periode migrasi Plugin eksternal, mempertahankan Plugin
repo/bawaan pada `channel-inbound` dan `channel-outbound`, lalu menghapus
subpath kompatibilitas dalam pembersihan SDK mayor berikutnya. Ini berlaku untuk
keluarga lama pesan/runtime channel, streaming channel, akses DM langsung,
pecahan helper masuk, opsi balasan, dan jalur pemasangan.

  <Accordion title="Subpath penyedia">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Fasad penyedia LM Studio yang didukung untuk penyiapan, penemuan katalog, dan persiapan model runtime |
    | `plugin-sdk/lmstudio-runtime` | Fasad runtime LM Studio yang didukung untuk default server lokal, penemuan model, header permintaan, dan pembantu model yang dimuat |
    | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/yang dihosting sendiri dan telah dikurasi |
    | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia yang dihosting sendiri dan kompatibel dengan OpenAI yang telah usang; gunakan `plugin-sdk/provider-setup` atau pembantu penyiapan milik plugin |
    | `plugin-sdk/cli-backend` | Default backend CLI + konstanta watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pembantu runtime autentikasi penyedia: alur loopback OAuth, pertukaran token, persistensi autentikasi, dan resolusi kunci API |
    | `plugin-sdk/provider-oauth-runtime` | Tipe callback OAuth penyedia generik, perenderan halaman callback, pembantu PKCE/status, penguraian input otorisasi, pembantu kedaluwarsa token, dan pembantu pembatalan |
    | `plugin-sdk/provider-auth-api-key` | Pembantu onboarding/penulisan profil kunci API seperti `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Penyusun hasil autentikasi OAuth standar |
    | `plugin-sdk/provider-env-vars` | Pembantu pencarian variabel lingkungan autentikasi penyedia |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pembantu impor autentikasi OpenAI Codex, ekspor kompatibilitas `resolveOpenClawAgentDir` yang telah usang |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, penyusun kebijakan pemutaran ulang bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model bersama |
    | `plugin-sdk/provider-catalog-live-runtime` | Pembantu katalog model penyedia langsung untuk penemuan bergaya `/models` yang dilindungi: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, pemfilteran ID model, cache TTL, dan fallback statis |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime augmentasi katalog penyedia dan seam registri penyedia plugin untuk pengujian kontrak |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Pembantu kemampuan HTTP/endpoint penyedia generik, galat HTTP penyedia, dan pembantu formulir multipart transkripsi audio |
    | `plugin-sdk/provider-web-fetch-contract` | Pembantu kontrak konfigurasi/pemilihan pengambilan web terbatas seperti `enablePluginInConfig` dan `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pembantu pendaftaran/cache penyedia pengambilan web |
    | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi/kredensial pencarian web terbatas untuk penyedia yang tidak memerlukan pengkabelan pengaktifan plugin |
    | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak konfigurasi/kredensial pencarian web terbatas seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta penyetel/pengambil kredensial dengan cakupan tertentu |
    | `plugin-sdk/provider-web-search` | Pembantu pendaftaran/cache/runtime penyedia pencarian web |
    | `plugin-sdk/embedding-providers` | Tipe penyedia embedding umum dan pembantu pembacaan, termasuk `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)`, dan `listEmbeddingProviders(...)`; plugin mendaftarkan penyedia melalui `api.registerEmbeddingProvider(...)` agar kepemilikan manifes diberlakukan |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipe snapshot penggunaan penyedia, pembantu pengambilan penggunaan bersama, dan pengambil penyedia seperti `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, kompatibilitas pemanggilan alat teks biasa, serta pembantu pembungkus bersama Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Pembantu pembungkus stream penyedia bersama publik, termasuk `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, serta utilitas stream yang kompatibel dengan Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Pembantu transportasi penyedia native seperti pengambilan yang dilindungi, ekstraksi teks hasil alat, transformasi pesan transportasi, dan stream peristiwa transportasi yang dapat ditulis |
    | `plugin-sdk/provider-onboard` | Pembantu patch konfigurasi onboarding |
    | `plugin-sdk/global-singleton` | Pembantu singleton/peta/cache lokal proses |
    | `plugin-sdk/group-activation` | Pembantu penguraian perintah dan mode aktivasi grup terbatas |
  </Accordion>

Snapshot penggunaan penyedia biasanya melaporkan satu atau beberapa `windows` kuota, masing-masing dengan
label, persentase yang digunakan, dan waktu reset opsional. Penyedia yang menampilkan teks saldo atau
status akun alih-alih jendela kuota yang dapat direset harus mengembalikan
`summary` dengan larik `windows` kosong, bukan mengarang persentase.
OpenClaw menampilkan teks ringkasan tersebut dalam keluaran status; gunakan `error` hanya ketika
endpoint penggunaan gagal atau tidak mengembalikan data penggunaan yang dapat digunakan.

  <Accordion title="Subpath autentikasi dan keamanan">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/command-auth` | Permukaan otorisasi perintah luas yang telah usang (`resolveControlCommandGate`, pembantu registri perintah termasuk pemformatan menu argumen dinamis, pembantu otorisasi pengirim); gunakan otorisasi ingress/runtime kanal atau pembantu status perintah |
    | `plugin-sdk/command-status` | Penyusun pesan perintah/bantuan seperti `buildCommandsMessagePaginated` dan `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pembantu resolusi pemberi persetujuan dan autentikasi tindakan dalam percakapan yang sama |
    | `plugin-sdk/approval-client-runtime` | Pembantu profil/filter persetujuan eksekusi native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptor kemampuan/pengiriman persetujuan native |
    | `plugin-sdk/approval-gateway-runtime` | Resolver Gateway persetujuan bersama |
    | `plugin-sdk/approval-reference-runtime` | Pembantu pelacak tahan lama yang deterministik untuk callback persetujuan dengan keterbatasan transportasi |
    | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu pemuatan adaptor persetujuan native ringan untuk titik masuk kanal yang sering digunakan |
    | `plugin-sdk/approval-handler-runtime` | Pembantu runtime penangan persetujuan yang lebih luas; prioritaskan seam adaptor/Gateway yang lebih terbatas ketika sudah memadai |
    | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan native, pengikatan akun, gerbang rute, fallback penerusan, dan penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reaction-runtime` | Pengikatan reaksi persetujuan yang di-hardcode, payload prompt reaksi, penyimpanan target reaksi, pembantu teks petunjuk reaksi, dan ekspor kompatibilitas untuk penekanan prompt eksekusi native lokal |
    | `plugin-sdk/approval-reply-runtime` | Pembantu payload balasan persetujuan eksekusi/plugin |
    | `plugin-sdk/approval-runtime` | Pembantu payload persetujuan eksekusi/plugin, penyusun kemampuan persetujuan, pembantu autentikasi/profil persetujuan, pembantu perutean/runtime persetujuan native, dan pembantu tampilan persetujuan terstruktur seperti `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Pembantu reset deduplikasi balasan masuk terbatas yang telah usang |
    | `plugin-sdk/command-auth-native` | Autentikasi perintah native, pemformatan menu argumen dinamis, dan pembantu target sesi native |
    | `plugin-sdk/command-detection` | Pembantu deteksi perintah bersama |
    | `plugin-sdk/command-primitives-runtime` | Predikat teks perintah ringan untuk jalur kanal yang sering digunakan |
    | `plugin-sdk/command-surface` | Normalisasi isi perintah dan pembantu permukaan perintah |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Pembantu alur login autentikasi penyedia yang dimuat secara malas untuk pemasangan kode perangkat kanal privat dan UI Web |
    | `plugin-sdk/channel-secret-runtime` | Permukaan kontrak rahasia luas yang telah usang (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipe target rahasia); prioritaskan subpath terfokus di bawah |
    | `plugin-sdk/channel-secret-basic-runtime` | Ekspor kontrak rahasia terbatas dan penyusun registri target untuk permukaan rahasia kanal/plugin non-TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Pembantu penetapan rahasia TTS kanal bertingkat yang terbatas |
    | `plugin-sdk/secret-ref-runtime` | Pengetikan dan resolusi SecretRef terbatas, serta pencarian jalur target rencana untuk penguraian kontrak rahasia/konfigurasi |
    | `plugin-sdk/secret-provider-integration` | Kontrak manifes dan preset integrasi penyedia SecretRef khusus tipe untuk plugin yang menerbitkan preset penyedia rahasia eksternal |
    | `plugin-sdk/security-runtime` | Barrel luas yang telah usang untuk kepercayaan, pembatasan DM, pembantu file/jalur yang dibatasi root termasuk penulisan khusus pembuatan, penggantian file atomik sinkron/asinkron, penulisan sementara berdampingan, fallback pemindahan lintas perangkat, pembantu penyimpanan file privat, pelindung induk symlink, konten eksternal, penyamaran teks sensitif, perbandingan rahasia waktu konstan, dan pembantu pengumpulan rahasia; prioritaskan subpath keamanan/SSRF/rahasia yang terfokus |
    | `plugin-sdk/ssrf-policy` | Pembantu daftar host yang diizinkan dan kebijakan SSRF jaringan privat |
    | `plugin-sdk/ssrf-dispatcher` | Pembantu dispatcher tersemat yang terbatas tanpa permukaan runtime infrastruktur yang luas |
    | `plugin-sdk/ssrf-runtime` | Pembantu dispatcher tersemat, pengambilan yang dilindungi SSRF, galat SSRF, dan kebijakan SSRF |
    | `plugin-sdk/secret-input` | Pembantu penguraian input rahasia |
    | `plugin-sdk/webhook-ingress` | Pembantu permintaan/target Webhook dan koersi websocket mentah/isi |
    | `plugin-sdk/webhook-request-guards` | Pembantu ukuran/batas waktu isi permintaan dan `runDetachedWebhookWork` untuk pemrosesan pasca-pengakuan yang dilacak |
  </Accordion>

  <Accordion title="Subjalur runtime dan penyimpanan">
    | Subjalur | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/runtime` | Pembantu runtime/pencatatan/pencadangan, peringatan jalur instalasi plugin, dan pembantu proses |
    | `plugin-sdk/runtime-env` | Pembantu lingkungan runtime, pencatat, batas waktu, percobaan ulang, dan backoff dengan cakupan terbatas |
    | `plugin-sdk/browser-config` | Fasad konfigurasi peramban yang didukung untuk profil/nilai default yang dinormalisasi, penguraian URL CDP, dan pembantu autentikasi kontrol peramban |
    | `plugin-sdk/agent-harness-task-runtime` | Pembantu generik untuk siklus hidup tugas dan pengiriman penyelesaian bagi agen berbasis harness yang menggunakan cakupan tugas yang diterbitkan host |
    | `plugin-sdk/codex-mcp-projection` | Pembantu Codex terbundel yang dicadangkan untuk memproyeksikan konfigurasi server MCP pengguna ke konfigurasi utas Codex; bukan untuk plugin pihak ketiga |
    | `plugin-sdk/codex-native-task-runtime` | Pembantu Codex terbundel lokal repositori untuk pengawatan cermin/runtime tugas native; bukan ekspor paket |
    | `plugin-sdk/channel-runtime-context` | Pembantu generik untuk pendaftaran dan pencarian konteks runtime saluran |
    | `plugin-sdk/matrix` | Fasad kompatibilitas Matrix yang tidak digunakan lagi untuk paket saluran pihak ketiga versi lama; plugin baru sebaiknya mengimpor `plugin-sdk/run-command` secara langsung |
    | `plugin-sdk/mattermost` | Fasad kompatibilitas Mattermost yang tidak digunakan lagi untuk paket saluran pihak ketiga versi lama; plugin baru sebaiknya mengimpor subjalur SDK generik secara langsung |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu perintah/plugin hook/HTTP/interaktif; utamakan subjalur runtime plugin yang terfokus |
    | `plugin-sdk/hook-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu pipeline webhook/hook internal; utamakan subjalur runtime hook/plugin yang terfokus |
    | `plugin-sdk/lazy-runtime` | Pembantu impor/pengikatan runtime secara malas seperti `createLazyRuntimeModule`, `createLazyRuntimeMethod`, dan `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pembantu eksekusi proses |
    | `plugin-sdk/node-host` | Pembantu resolusi berkas yang dapat dieksekusi pada host Node dan pelanjutan PTY |
    | `plugin-sdk/cli-runtime` | Barrel luas yang tidak digunakan lagi untuk pemformatan CLI, penantian, versi, pemanggilan argumen, dan pembantu grup perintah secara malas; utamakan subjalur CLI/runtime yang terfokus |
    | `plugin-sdk/qa-runner-runtime` | Fasad yang didukung untuk mengekspos skenario QA plugin melalui permukaan perintah CLI |
    | `plugin-sdk/tts-runtime` | Fasad yang didukung untuk skema konfigurasi teks-ke-ucapan dan pembantu runtime |
    | `plugin-sdk/gateway-method-runtime` | Pembantu pengiriman metode Gateway yang dicadangkan untuk rute HTTP plugin yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klien Gateway, pembantu memulai klien yang siap untuk loop peristiwa, RPC CLI Gateway, kesalahan protokol Gateway, resolusi host LAN yang diumumkan, dan pembantu patch status saluran |
    | `plugin-sdk/config-contracts` | Permukaan konfigurasi khusus tipe yang terfokus untuk bentuk konfigurasi plugin seperti `OpenClawConfig` dan tipe konfigurasi saluran/penyedia |
    | `plugin-sdk/plugin-config-runtime` | Pembantu konfigurasi plugin runtime seperti `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject`, dan `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pembantu mutasi konfigurasi transaksional seperti `mutateConfigFile`, `replaceConfigFile`, dan `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | String petunjuk metadata pengiriman bersama untuk alat pesan |
    | `plugin-sdk/runtime-config-snapshot` | Pembantu snapshot konfigurasi proses saat ini seperti `getRuntimeConfig`, `getRuntimeConfigSnapshot`, dan penyetel snapshot pengujian |
    | `plugin-sdk/text-autolink-runtime` | Deteksi tautan otomatis referensi berkas tanpa barrel teks yang luas |
    | `plugin-sdk/reply-runtime` | Pembantu runtime bersama untuk pesan masuk/balasan, pemotongan menjadi bagian, pengiriman, Heartbeat, dan perencana balasan |
    | `plugin-sdk/reply-dispatch-runtime` | Pembantu pengiriman/finalisasi balasan dan label percakapan dengan cakupan terbatas |
    | `plugin-sdk/reply-history` | Pembantu bersama untuk riwayat balasan dalam jangka pendek. Kode giliran pesan baru sebaiknya menggunakan `createChannelHistoryWindow`; pembantu peta tingkat rendah tetap hanya sebagai ekspor kompatibilitas yang tidak digunakan lagi |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Pembantu pemotongan teks/Markdown menjadi bagian dengan cakupan terbatas |
    | `plugin-sdk/session-store-runtime` | Pembantu alur kerja sesi (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), pembantu perbaikan/siklus hidup (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), pembantu penanda untuk nilai transisional `sessionFile`, pembacaan teks transkrip pengguna/asisten terbaru yang dibatasi berdasarkan identitas sesi, pembantu jalur penyimpanan sesi/kunci sesi, dan pembacaan waktu pembaruan, tanpa impor penulisan/pemeliharaan konfigurasi yang luas |
    | `plugin-sdk/session-transcript-runtime` | Identitas transkrip, pembantu target/baca/tulis dengan cakupan, proyeksi entri pesan yang terlihat, penerbitan pembaruan, penguncian penulisan, dan kunci temuan memori transkrip |
    | `plugin-sdk/sqlite-runtime` | Pembantu skema agen SQLite, jalur, dan transaksi yang terfokus untuk runtime pihak pertama, tanpa kontrol siklus hidup basis data |
    | `plugin-sdk/cron-store-runtime` | Pembantu jalur/muat/simpan penyimpanan Cron |
    | `plugin-sdk/state-paths` | Pembantu jalur direktori status/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipe status berkunci SQLite sidecar plugin beserta pragma koneksi terpusat, pemeliharaan WAL terverifikasi, dan pembantu migrasi skema STRICT atomik untuk basis data milik plugin |
    | `plugin-sdk/routing` | Pembantu pengikatan rute/kunci sesi/akun seperti `resolveAgentRoute`, `buildAgentSessionKey`, dan `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Pembantu ringkasan status saluran/akun bersama, nilai default status runtime, dan pembantu metadata masalah |
    | `plugin-sdk/target-resolver-runtime` | Pembantu penyelesai target bersama |
    | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi slug/string |
    | `plugin-sdk/request-url` | Mengekstrak URL string dari masukan serupa fetch/request |
    | `plugin-sdk/run-command` | Pelaksana perintah berbatas waktu dengan hasil stdout/stderr yang dinormalisasi |
    | `plugin-sdk/param-readers` | Pembaca parameter alat/CLI umum |
    | `plugin-sdk/tool-plugin` | Mendefinisikan plugin alat agen bertipe sederhana dan mengekspos metadata statis untuk pembuatan manifes |
    | `plugin-sdk/tool-payload` | Mengekstrak payload yang dinormalisasi dari objek hasil alat |
    | `plugin-sdk/tool-send` | Mengekstrak bidang target pengiriman kanonis dari argumen alat |
    | `plugin-sdk/sandbox` | Tipe backend sandbox dan pembantu perintah SSH/OpenShell, termasuk pemeriksaan awal perintah eksekusi yang langsung gagal |
    | `plugin-sdk/temp-path` | Pembantu jalur unduhan sementara bersama dan ruang kerja sementara privat yang aman |
    | `plugin-sdk/logging-core` | Pembantu pencatat subsistem dan penyuntingan informasi sensitif |
    | `plugin-sdk/markdown-table-runtime` | Pembantu mode tabel Markdown dan konversi |
    | `plugin-sdk/model-session-runtime` | Pembantu penggantian model/sesi seperti `applyModelOverrideToSessionEntry` dan `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pembantu resolusi konfigurasi penyedia percakapan |
    | `plugin-sdk/json-store` | Pembantu kecil untuk membaca/menulis status JSON |
    | `plugin-sdk/json-unsafe-integers` | Pembantu penguraian JSON yang mempertahankan literal bilangan bulat tidak aman sebagai string |
    | `plugin-sdk/file-lock` | Pembantu penguncian berkas reentran |
    | `plugin-sdk/persistent-dedupe` | Pembantu cache deduplikasi berbasis disk |
    | `plugin-sdk/acp-runtime` | Pembantu runtime/sesi ACP dan pengiriman balasan |
    | `plugin-sdk/acp-runtime-backend` | Pembantu ringan untuk pendaftaran backend ACP dan pengiriman balasan bagi plugin yang dimuat saat memulai |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolusi pengikatan ACP hanya-baca tanpa impor pemulaian siklus hidup |
    | `plugin-sdk/agent-config-primitives` | Primitif skema konfigurasi runtime agen yang tidak digunakan lagi; impor primitif skema dari permukaan terpelihara milik plugin |
    | `plugin-sdk/boolean-param` | Pembaca parameter boolean longgar |
    | `plugin-sdk/dangerous-name-runtime` | Pembantu resolusi pencocokan nama berbahaya |
    | `plugin-sdk/device-bootstrap` | Pembantu bootstrap perangkat dan token pemasangan, termasuk `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitif pembantu bersama untuk saluran pasif, status, dan proksi ambien |
    | `plugin-sdk/models-provider-runtime` | Pembantu balasan perintah/penyedia `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pembantu pencantuman perintah Skill |
    | `plugin-sdk/native-command-registry` | Pembantu registri/pembuatan/serialisasi perintah native |
    | `plugin-sdk/agent-harness` | Permukaan eksperimental untuk plugin tepercaya bagi harness agen tingkat rendah: tipe harness, pembantu pengarahan/pembatalan proses aktif, pembantu jembatan alat OpenClaw, pembantu kebijakan alat rencana runtime, klasifikasi hasil terminal, pembantu pemformatan/detail progres alat, dan utilitas hasil percobaan |
    | `plugin-sdk/provider-zai-endpoint` | Fasad deteksi endpoint milik penyedia Z.AI yang tidak digunakan lagi; gunakan API publik plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pembantu penguncian asinkron lokal proses untuk berkas status runtime kecil |
    | `plugin-sdk/channel-activity-runtime` | Pembantu telemetri aktivitas saluran |
    | `plugin-sdk/concurrency-runtime` | Pembantu konkurensi tugas asinkron yang dibatasi |
    | `plugin-sdk/dedupe-runtime` | Pembantu cache deduplikasi dalam memori dan berbasis penyimpanan persisten |
    | `plugin-sdk/delivery-queue-runtime` | Pembantu pengurasan pengiriman tertunda keluar |
    | `plugin-sdk/file-access-runtime` | Pembantu jalur berkas lokal dan sumber media yang aman |
    | `plugin-sdk/heartbeat-runtime` | Pembantu bangun, peristiwa, dan visibilitas Heartbeat |
    | `plugin-sdk/expect-runtime` | Pembantu asersi nilai wajib untuk invarian runtime yang dapat dibuktikan |
    | `plugin-sdk/number-runtime` | Pembantu koersi numerik |
    | `plugin-sdk/secure-random-runtime` | Pembantu token/UUID aman |
    | `plugin-sdk/system-event-runtime` | Pembantu antrean peristiwa sistem |
    | `plugin-sdk/transport-ready-runtime` | Pembantu penantian kesiapan transportasi |
    | `plugin-sdk/exec-approvals-runtime` | Pembantu berkas kebijakan persetujuan eksekusi tanpa barrel runtime infrastruktur yang luas |
    | `plugin-sdk/infra-runtime` | Shim kompatibilitas yang tidak digunakan lagi; gunakan subjalur runtime terfokus di atas |
    | `plugin-sdk/collection-runtime` | Pembantu cache kecil yang dibatasi |
    | `plugin-sdk/diagnostic-runtime` | Pembantu bendera diagnostik, peristiwa, dan konteks pelacakan |
    | `plugin-sdk/error-runtime` | Graf kesalahan, pemformatan, pembantu klasifikasi kesalahan bersama, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pembantu fetch terbungkus, proksi, opsi EnvHttpProxyAgent, dan pencarian yang disematkan |
    | `plugin-sdk/runtime-fetch` | Fetch runtime yang memahami dispatcher tanpa impor proksi/fetch terlindungi |
    | `plugin-sdk/inline-image-data-url-runtime` | Pembantu sanitasi URL data gambar sebaris dan pendeteksian tanda tangan tanpa permukaan runtime media yang luas |
    | `plugin-sdk/response-limit-runtime` | Pembaca isi respons yang dibatasi berdasarkan byte, waktu diam, dan tenggat tanpa permukaan runtime media yang luas |
    | `plugin-sdk/session-binding-runtime` | Status pengikatan percakapan saat ini tanpa perutean pengikatan terkonfigurasi atau penyimpanan pemasangan |
    | `plugin-sdk/context-visibility-runtime` | Resolusi visibilitas konteks dan pemfilteran konteks tambahan tanpa impor konfigurasi/keamanan yang luas |
    | `plugin-sdk/string-coerce-runtime` | Pembantu primitif dengan cakupan terbatas untuk koersi dan normalisasi rekaman/string tanpa impor Markdown/pencatatan |
    | `plugin-sdk/html-entity-runtime` | Pendekodean entitas HTML5 berakhiran titik koma dalam satu lintasan tanpa utilitas teks yang luas |
    | `plugin-sdk/text-utility-runtime` | Pembantu teks dan jalur tingkat rendah, termasuk penghindaran lima entitas HTML |
    | `plugin-sdk/widget-html` | Deteksi dokumen lengkap, validasi ukuran, dan kesalahan masukan alat untuk widget HTML mandiri |
    | `plugin-sdk/host-runtime` | Pembantu normalisasi nama host dan host SCP |
    | `plugin-sdk/retry-runtime` | Pembantu konfigurasi percobaan ulang dan pelaksana percobaan ulang |
    | `plugin-sdk/agent-runtime` | Barrel luas yang tidak digunakan lagi untuk pembantu direktori/identitas/ruang kerja agen, termasuk `resolveAgentDir`, `resolveDefaultAgentDir`, dan ekspor kompatibilitas `resolveOpenClawAgentDir` yang tidak digunakan lagi; utamakan subjalur agen/runtime yang terfokus |
    | `plugin-sdk/directory-runtime` | Kueri/deduplikasi direktori berbasis konfigurasi |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath kapabilitas dan pengujian">
    | Subpath | Ekspor utama |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel media luas yang tidak digunakan lagi, termasuk `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer`, dan `fetchRemoteMedia` yang tidak digunakan lagi; utamakan `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media`, dan subpath runtime kapabilitas, serta utamakan helper penyimpanan sebelum pembacaan buffer ketika URL harus menjadi media OpenClaw |
    | `plugin-sdk/media-mime` | Normalisasi MIME terbatas, pemetaan ekstensi file, deteksi MIME, dan helper jenis media |
    | `plugin-sdk/media-store` | Helper penyimpanan media terbatas seperti `saveMediaBuffer` dan `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper failover pembuatan media bersama, pemilihan kandidat, dan pesan model yang tidak tersedia |
    | `plugin-sdk/media-understanding` | Tipe penyedia pemahaman media beserta ekspor helper gambar/audio/ekstraksi terstruktur yang ditujukan bagi penyedia |
    | `plugin-sdk/text-chunking` | Pemotongan rentang teks keluar yang mempertahankan offset, pemotongan markdown/helper perenderan, tokenisasi tag HTML yang memperhitungkan tanda kutip, konversi tabel markdown, penghapusan tag direktif, dan utilitas teks aman |
    | `plugin-sdk/speech` | Tipe penyedia ucapan beserta ekspor direktif, registri, validasi, pembangun TTS yang kompatibel dengan OpenAI, dan helper ucapan yang ditujukan bagi penyedia |
    | `plugin-sdk/speech-core` | Tipe penyedia ucapan bersama, registri, direktif, normalisasi, dan ekspor helper ucapan |
    | `plugin-sdk/realtime-transcription` | Tipe penyedia transkripsi waktu nyata, helper registri, dan helper sesi WebSocket bersama |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrap profil waktu nyata untuk injeksi konteks `IDENTITY.md`, `USER.md`, dan `SOUL.md` yang terbatas |
    | `plugin-sdk/realtime-voice` | Tipe penyedia suara waktu nyata, helper registri, dan helper perilaku suara waktu nyata bersama, termasuk pelacakan aktivitas keluaran |
    | `plugin-sdk/image-generation` | Tipe penyedia pembuatan gambar beserta helper aset gambar/URL data dan pembangun penyedia gambar yang kompatibel dengan OpenAI |
    | `plugin-sdk/image-generation-core` | Tipe pembuatan gambar bersama serta helper failover, autentikasi, dan registri |
    | `plugin-sdk/music-generation` | Tipe penyedia/permintaan/hasil pembuatan musik |
    | `plugin-sdk/music-generation-core` | Tipe pembuatan musik bersama, helper failover, pencarian penyedia, dan penguraian referensi model yang tidak digunakan lagi; utamakan permukaan penyedia musik yang dimiliki Plugin |
    | `plugin-sdk/video-generation` | Tipe penyedia/permintaan/hasil pembuatan video |
    | `plugin-sdk/video-generation-core` | Tipe pembuatan video bersama, helper failover, pencarian penyedia, dan penguraian referensi model |
    | `plugin-sdk/transcripts` | Tipe penyedia sumber transkrip bersama, helper registri, deskriptor sesi, dan metadata ujaran |
    | `plugin-sdk/webhook-targets` | Registri target Webhook dan helper pemasangan rute |
    | `plugin-sdk/webhook-path` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper bersama untuk pemuatan media jarak jauh/lokal |
    | `plugin-sdk/zod` | Ekspor ulang kompatibilitas yang tidak digunakan lagi; impor `zod` langsung dari `zod` |
    | `plugin-sdk/plugin-test-api` | Helper `createTestPluginApi` minimal lokal repositori untuk pengujian unit registrasi Plugin langsung tanpa mengimpor jembatan helper pengujian repositori |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture kontrak adaptor runtime agen native lokal repositori untuk pengujian autentikasi, pengiriman, fallback, hook alat, overlay prompt, skema, dan proyeksi transkrip |
    | `plugin-sdk/channel-test-helpers` | Helper pengujian berorientasi saluran lokal repositori untuk kontrak tindakan/penyiapan/status generik, pernyataan direktori, siklus hidup permulaan akun, penerusan konfigurasi pengiriman, mock runtime, masalah status, pengiriman keluar, dan registrasi hook |
    | `plugin-sdk/channel-target-testing` | Rangkaian kasus galat resolusi target bersama lokal repositori untuk pengujian saluran |
    | `plugin-sdk/channel-contract-testing` | Helper pengujian kontrak saluran terbatas lokal repositori tanpa barrel pengujian luas |
    | `plugin-sdk/plugin-test-contracts` | Helper kontrak paket Plugin, registrasi, artefak publik, impor langsung, API runtime, dan efek samping impor lokal repositori |
    | `plugin-sdk/plugin-state-test-runtime` | Helper pengujian penyimpanan status Plugin, antrean ingress, dan basis data status lokal repositori |
    | `plugin-sdk/provider-test-contracts` | Helper kontrak lokal repositori untuk runtime penyedia, autentikasi, penemuan, orientasi, katalog, wizard, kapabilitas media, kebijakan pemutaran ulang, audio langsung STT waktu nyata, pencarian/pengambilan web, dan stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autentikasi Vitest lokal repositori yang dapat diaktifkan untuk pengujian penyedia yang menjalankan `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Helper lokal repositori untuk melampirkan metadata ke fixture payload balasan |
    | `plugin-sdk/sqlite-runtime-testing` | Helper siklus hidup SQLite lokal repositori untuk pengujian pihak pertama |
    | `plugin-sdk/test-fixtures` | Fixture lokal repositori untuk penangkapan runtime CLI generik, konteks sandbox, penulis skill, pesan agen, peristiwa sistem, pemuatan ulang modul, path Plugin terbundel, teks terminal, pemotongan, token autentikasi, dan kasus bertipe |
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
    | `plugin-sdk/memory-host-core` | Alias netral terhadap vendor untuk helper runtime inti host memori |
    | `plugin-sdk/memory-host-events` | Alias netral terhadap vendor untuk helper jurnal peristiwa host memori |
    | `plugin-sdk/memory-host-files` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola bersama untuk Plugin yang terkait dengan memori |
    | `plugin-sdk/memory-host-search` | Fasad runtime Active Memory untuk akses pengelola pencarian |
    | `plugin-sdk/memory-host-status` | Alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Subpath helper terbundel yang dicadangkan">
    Subpath SDK helper terbundel yang dicadangkan adalah permukaan terbatas khusus pemilik untuk
    kode Plugin terbundel. Subpath tersebut dilacak dalam inventaris SDK agar build
    paket dan pembuatan alias tetap deterministik, tetapi bukan API umum untuk
    pembuatan Plugin. Kontrak host baru yang dapat digunakan kembali harus memakai subpath SDK generik
    seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime`, dan
    `plugin-sdk/plugin-config-runtime`.

    | Subpath | Pemilik dan tujuan |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper Plugin Codex terbundel untuk memproyeksikan konfigurasi server MCP pengguna ke dalam konfigurasi utas app-server Codex (ekspor paket yang dicadangkan) |
    | `plugin-sdk/codex-native-task-runtime` | Helper Plugin Codex terbundel untuk mencerminkan subagen native app-server Codex ke dalam status tugas OpenClaw (hanya lokal repositori, bukan ekspor paket) |

  </Accordion>
</AccordionGroup>

## Terkait

- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
