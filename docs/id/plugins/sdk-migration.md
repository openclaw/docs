---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke Plugin SDK modern
title: Migrasi Plugin SDK
x-i18n:
    generated_at: "2026-04-26T11:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin modern dengan import yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum arsitektur baru ini, panduan ini membantu Anda melakukan migrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan terbuka lebar yang memungkinkan plugin mengimpor apa pun yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** — satu import yang mengekspor ulang puluhan helper. Ini diperkenalkan untuk menjaga plugin lama berbasis hook tetap berfungsi saat arsitektur plugin baru sedang dibangun.
- **`openclaw/extension-api`** — sebuah jembatan yang memberi plugin akses langsung ke helper sisi host seperti embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook extension terbundel khusus Pi yang telah dihapus dan dapat mengamati peristiwa embedded-runner seperti `tool_result`.

Permukaan import yang luas sekarang **deprecated**. Permukaan tersebut masih berfungsi saat runtime, tetapi plugin baru tidak boleh menggunakannya, dan plugin yang sudah ada harus bermigrasi sebelum rilis mayor berikutnya menghapusnya. API pendaftaran embedded extension factory khusus Pi telah dihapus; gunakan middleware tool-result sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin yang terdokumentasi dalam perubahan yang sama yang memperkenalkan pengganti. Perubahan kontrak yang breaking harus terlebih dahulu melalui adaptor kompatibilitas, diagnostik, dokumentasi, dan jendela deprecasi. Ini berlaku untuk import SDK, field manifest, API setup, hook, dan perilaku pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus pada rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak ketika itu terjadi.
  Pendaftaran embedded extension factory khusus Pi sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menimbulkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi melingkar** — ekspor ulang yang luas memudahkan terciptanya siklus import
- **Permukaan API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil versus internal

SDK plugin modern memperbaikinya: setiap path import (`openclaw/plugin-sdk/\<subpath\>`) adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam kemudahan provider lama untuk channel terbundel juga sudah dihapus. Import seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, seam helper bermerek channel, dan `openclaw/plugin-sdk/telegram-core` adalah pintasan mono-repo privat, bukan kontrak plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace plugin terbundel, simpan helper yang dimiliki provider di `api.ts` atau `runtime-api.ts` milik plugin tersebut.

Contoh provider terbundel saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` / `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper default-model, dan builder provider realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/config di `api.ts` miliknya sendiri

## Kebijakan kompatibilitas

Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

1. tambahkan kontrak baru
2. pertahankan perilaku lama tetap terhubung melalui adaptor kompatibilitas
3. keluarkan diagnostik atau peringatan yang menyebutkan path lama dan penggantinya
4. cakup kedua path dalam pengujian
5. dokumentasikan deprecasi dan jalur migrasi
6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

Jika sebuah field manifest masih diterima, penulis plugin dapat terus menggunakannya sampai dokumentasi dan diagnostik menyatakan sebaliknya. Kode baru sebaiknya memilih pengganti yang terdokumentasi, tetapi plugin yang sudah ada tidak boleh rusak selama rilis minor biasa.

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan extension tool-result Pi ke middleware">
    Plugin terbundel harus mengganti handler tool-result
    `api.registerEmbeddedExtensionFactory(...)` khusus Pi dengan
    middleware yang netral terhadap runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Perbarui manifest plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugin eksternal tidak dapat mendaftarkan middleware tool-result karena itu
    dapat menulis ulang output tool dengan tingkat kepercayaan tinggi sebelum model melihatnya.

  </Step>

  <Step title="Migrasikan handler native approval ke fakta kapabilitas">
    Plugin channel yang mampu melakukan approval kini mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` ditambah registry runtime-context bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus approval dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak channel-plugin publik;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap digunakan hanya untuk alur login/logout channel; hook auth
      approval di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti client, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan pengalihan milik plugin dari handler native approval;
      core kini memiliki pemberitahuan diarahkan-ke-tempat-lain dari hasil pengiriman yang sebenarnya
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, berikan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak kapabilitas approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak dapat diselesaikan kini gagal secara tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak secara sengaja bergantung pada shell fallback, jangan set
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan import yang deprecated">
    Cari di plugin Anda import dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan import yang terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke path import modern tertentu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksikan alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper jembatan lama lainnya:

    | Import lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi path import

  <Accordion title="Tabel path import umum">
  | Path import | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/builder entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri channel yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime saat setup | Adaptor patch setup yang aman diimpor, helper catatan lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Helper adaptor setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar/config/action-gate akun |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalisasi account-id |
  | `plugin-sdk/account-resolution` | Helper lookup akun | Helper lookup akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun sempit | Helper daftar akun/aksi akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ditambah `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primtif pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring prefiks balasan + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adaptor config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder skema config | Primtif skema config channel bersama; ekspor skema bernama bundled-channel hanya untuk kompatibilitas lama |
  | `plugin-sdk/telegram-command-config` | Helper config perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper status akun dan siklus hidup aliran draf | `createAccountStatusSink`, helper finalisasi pratinjau draf |
  | `plugin-sdk/inbound-envelope` | Helper envelope inbound | Helper route + builder envelope bersama |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan inbound | Helper record-and-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Pemuatan media outbound bersama |
  | `plugin-sdk/outbound-send-deps` | Helper dependensi pengiriman outbound | Lookup `resolveOutboundSendDep` ringan tanpa mengimpor runtime outbound penuh |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper pengiriman outbound, identitas/send delegate, sesi, pemformatan, dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Helper siklus hidup dan adaptor thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper payload media lama | Builder payload media agent untuk tata letak field lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime channel lama |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime luas | Helper runtime/logging/backup/instalasi plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime sempit | Logger/runtime env, helper timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime plugin bersama | Helper perintah/hook/http/interaktif plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline hook Webhook/internal bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, wait, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Helper klien Gateway dan patch channel-status |
  | `plugin-sdk/config-runtime` | Helper config | Helper muat/tulis config |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil terhadap fallback saat permukaan kontrak Telegram terbundel tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Payload approval exec/plugin, helper kapabilitas/profil approval, helper routing/runtime native approval, dan pemformatan path tampilan approval terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Resolusi approver, auth aksi same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper klien approval | Helper profil/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman approval | Adaptor kapabilitas/pengiriman native approval |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approval | Helper resolusi Gateway approval bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adaptor approval | Helper pemuatan adaptor native approval yang ringan untuk entrypoint channel panas |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approval | Helper runtime handler approval yang lebih luas; pilih seam adaptor/Gateway yang lebih sempit jika sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target approval | Helper binding target/akun native approval |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan approval | Helper payload balasan approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context channel | Helper register/get/watch runtime-context channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, gating DM, konten eksternal, dan pengumpulan secret bersama |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper pinned-dispatcher, guarded fetch, kebijakan SSRF |
  | `plugin-sdk/collection-runtime` | Helper cache terbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy terbungkus | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper gating perintah dan permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Renderer status/help perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input secret | Helper input secret |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch inbound, Heartbeat, perencana balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan sempit | Helper finalisasi, dispatch provider, dan label percakapan |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper session store | Helper path store + updated-at |
  | `plugin-sdk/state-paths` | Helper path state | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status channel | Builder ringkasan status channel/akun, default runtime-state, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip request |
  | `plugin-sdk/run-command` | Helper perintah bertimer | Runner perintah bertimer dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca parameter | Pembaca parameter tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload ternormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak field target pengiriman kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper path temp | Helper path unduhan temp bersama |
  | `plugin-sdk/logging-core` | Helper logging | Logger subsistem dan helper redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel Markdown | Helper mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted terkurasi | Helper discovery/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus | Helper discovery/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API-key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API-key provider | Helper onboarding/tulis profil API-key |
  | `plugin-sdk/provider-auth-result` | Helper auth-result provider | Builder auth-result OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-selection-runtime` | Helper pemilihan provider | Pemilihan provider terkonfigurasi-atau-otomatis dan penggabungan config provider mentah |
  | `plugin-sdk/provider-env-vars` | Helper env-var provider | Helper lookup env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder replay-policy bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper config onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP provider | Helper kemampuan HTTP/endpoint provider generik, termasuk helper formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper registrasi/cache provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper config web-search provider | Helper config/kredensial web-search yang sempit untuk provider yang tidak memerlukan wiring plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Helper kontrak web-search provider | Helper kontrak config/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berscope |
  | `plugin-sdk/provider-web-search` | Helper web-search provider | Helper registrasi/cache/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Helper kompat tool/skema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompat xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
  | `plugin-sdk/provider-stream` | Helper wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan helper wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
  | `plugin-sdk/provider-transport-runtime` | Helper transport provider | Helper transport provider native seperti guarded fetch, transform pesan transport, dan stream event transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media ditambah builder payload media |
  | `plugin-sdk/media-generation-runtime` | Helper generation media bersama | Helper failover bersama, pemilihan candidate, dan pesan missing-model untuk generation gambar/video/musik |
  | `plugin-sdk/media-understanding` | Helper pemahaman media | Tipe provider pemahaman media ditambah ekspor helper gambar/audio yang menghadap provider |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks yang terlihat oleh asisten, helper render/chunking/tabel markdown, helper redaksi, helper tag directive, utilitas teks aman, dan helper teks/logging terkait |
  | `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks outbound |
  | `plugin-sdk/speech` | Helper speech | Tipe provider speech ditambah helper directive, registry, dan validasi yang menghadap provider |
  | `plugin-sdk/speech-core` | Core speech bersama | Tipe provider speech, registry, directive, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper transkripsi realtime | Tipe provider, helper registry, dan helper sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Helper voice realtime | Tipe provider, helper registry/resolusi, dan helper sesi bridge |
  | `plugin-sdk/image-generation-core` | Core generation gambar bersama | Tipe image-generation, failover, auth, dan helper registry |
  | `plugin-sdk/music-generation` | Helper generation musik | Tipe provider/request/result music-generation |
  | `plugin-sdk/music-generation-core` | Core generation musik bersama | Tipe music-generation, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/video-generation` | Helper generation video | Tipe provider/request/result video-generation |
  | `plugin-sdk/video-generation-core` | Core generation video bersama | Tipe video-generation, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primtif config channel | Primtif config-schema channel yang sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan config channel | Helper otorisasi penulisan config channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude plugin channel bersama |
  | `plugin-sdk/channel-status` | Helper status channel | Helper snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper config allowlist | Helper edit/baca config allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Helper direct-DM | Helper auth/guard direct-DM bersama |
  | `plugin-sdk/extension-shared` | Helper extension bersama | Primtif helper passive-channel/status dan ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper target Webhook | Registry target Webhook dan helper pemasangan route |
  | `plugin-sdk/webhook-path` | Helper path Webhook | Helper normalisasi path Webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen SDK plugin |
  | `plugin-sdk/memory-core` | Helper memory-core terbundel | Permukaan helper pengelola/config/file/CLI memory |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime engine memory | Fasad runtime indeks/pencarian memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Engine fondasi host memory | Ekspor engine fondasi host memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Engine embedding host memory | Kontrak embedding memory, akses registry, provider lokal, dan helper batch/remote generik; provider remote konkret berada di plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Engine QMD host memory | Ekspor engine QMD host memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Engine penyimpanan host memory | Ekspor engine penyimpanan host memory |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memory | Helper multimodal host memory |
  | `plugin-sdk/memory-core-host-query` | Helper query host memory | Helper query host memory |
  | `plugin-sdk/memory-core-host-secret` | Helper secret host memory | Helper secret host memory |
  | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memory | Helper jurnal event host memory |
  | `plugin-sdk/memory-core-host-status` | Helper status host memory | Helper status host memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memory | Helper runtime CLI host memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host memory | Helper runtime core host memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memory | Helper file/runtime host memory |
  | `plugin-sdk/memory-host-core` | Alias runtime core host memory | Alias netral-vendor untuk helper runtime core host memory |
  | `plugin-sdk/memory-host-events` | Alias jurnal event host memory | Alias netral-vendor untuk helper jurnal event host memory |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memory | Alias netral-vendor untuk helper file/runtime host memory |
  | `plugin-sdk/memory-host-markdown` | Helper markdown terkelola | Helper managed-markdown bersama untuk plugin yang berdekatan dengan memory |
  | `plugin-sdk/memory-host-search` | Fasad pencarian Active Memory | Fasad runtime search-manager active-memory yang lazy |
  | `plugin-sdk/memory-host-status` | Alias status host memory | Alias netral-vendor untuk helper status host memory |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb terbundel | Permukaan helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitas pengujian | Helper dan mock pengujian |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan SDK.
Daftar lengkap 200+ entrypoint ada di
`scripts/lib/plugin-sdk-entrypoints.json`.

Daftar tersebut masih mencakup beberapa seam helper bundled-plugin seperti
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Seam tersebut tetap diekspor untuk
pemeliharaan bundled-plugin dan kompatibilitas, tetapi sengaja
tidak disertakan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk
kode plugin baru.

Aturan yang sama berlaku untuk keluarga bundled-helper lain seperti:

- helper dukungan browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- permukaan bundled helper/plugin seperti `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini mengekspos permukaan helper token sempit
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan import yang paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan suatu ekspor,
periksa source di `src/plugin-sdk/` atau tanyakan di Discord.

## Deprecasi aktif

Deprecasi yang lebih sempit yang berlaku di seluruh SDK plugin, kontrak provider,
permukaan runtime, dan manifest. Masing-masing masih berfungsi saat ini tetapi akan dihapus
pada rilis mayor mendatang. Entri di bawah setiap item memetakan API lama ke
pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="builder help command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature sama, ekspor sama
    — hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspor ulang semuanya sebagai stub kompat.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper gating mention → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` — mengembalikan
    satu objek keputusan alih-alih dua pemanggilan terpisah.

    Plugin channel downstream (Slack, Discord, Matrix, Microsoft Teams) sudah
    beralih.

  </Accordion>

  <Accordion title="Shim runtime channel dan helper aksi channel">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk plugin
    channel lama. Jangan impor ini dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions` deprecated
    bersama ekspor channel "actions" mentah. Ekspos kapabilitas
    melalui permukaan `presentation` yang semantik sebagai gantinya — plugin
    channel mendeklarasikan apa yang mereka render (card, button, select) alih-alih
    nama aksi mentah apa yang mereka terima.

  </Accordion>

  <Accordion title="Helper tool() provider web search → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin provider.
    OpenClaw tidak lagi memerlukan helper SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope channel plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun prompt
    envelope plaintext datar dari pesan channel inbound.

    **Baru**: `BodyForAgent` ditambah blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata routing (thread, topic, reply-to, reaction) sebagai
    field bertipe alih-alih menggabungkannya ke dalam string prompt. Helper
    `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis
    yang menghadap asisten, tetapi envelope plaintext inbound sedang
    dihentikan.

    Area yang terdampak: `inbound_claim`, `message_received`, dan setiap
    plugin channel kustom yang pascapemrosesan teks `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipe discovery provider → tipe katalog provider">
    Empat alias tipe discovery sekarang merupakan wrapper tipis di atas
    tipe era katalog:

    | Alias lama                | Tipe baru                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah static bag lama `ProviderCapabilities` — plugin provider
    sebaiknya melampirkan fakta kapabilitas melalui kontrak runtime provider
    alih-alih objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan Thinking → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar level berperingkat. OpenClaw menurunkan nilai tersimpan yang kedaluwarsa berdasarkan peringkat profil
    secara otomatis.

    Implementasikan satu hook alih-alih tiga. Hook lama tetap berfungsi selama
    jendela deprecasi tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Fallback provider OAuth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan `resolveExternalOAuthProfiles(...)` tanpa
    mendeklarasikan provider di manifest plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifest plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`. Jalur lama "auth
    fallback" mengeluarkan peringatan saat runtime dan akan dihapus.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var provider → setup.providers[].envVars">
    **Field manifest lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari boot runtime plugin hanya untuk menjawab lookup
    env-var.

    `providerAuthEnvVars` tetap didukung melalui adaptor kompatibilitas
    sampai jendela deprecasi ditutup.

  </Accordion>

  <Accordion title="Pendaftaran plugin memory → registerMemoryCapability">
    **Lama**: tiga pemanggilan terpisah —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu pemanggilan pada API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot sama, satu pemanggilan pendaftaran. Helper memory aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) tidak terdampak.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagent diubah namanya">
    Dua alias tipe lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` deprecated dan digantikan oleh
    `getSessionMessages`. Signature sama; metode lama meneruskan pemanggilan ke
    metode baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan accessor task-flow aktif.

    **Baru**: `runtime.tasks.flows` (jamak) mengembalikan akses TaskFlow berbasis DTO,
    yang aman diimpor dan tidak memerlukan runtime task penuh untuk
    dimuat.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factory embedded extension → middleware agent tool-result">
    Dibahas dalam "Cara bermigrasi → Migrasikan extension tool-result Pi ke
    middleware" di atas. Disertakan di sini untuk kelengkapan: jalur
    `api.registerEmbeddedExtensionFactory(...)` khusus Pi yang telah dihapus digantikan oleh
    `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime
    eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` sekarang merupakan
    alias satu baris untuk `OpenClawConfig`. Gunakan nama kanonis.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecasi tingkat extension (di dalam plugin channel/provider terbundel di bawah
`extensions/`) dilacak di barrel `api.ts` dan `runtime-api.ts`
milik masing-masing. Deprecasi tersebut tidak memengaruhi kontrak plugin pihak ketiga dan tidak dicantumkan
di sini. Jika Anda langsung menggunakan barrel lokal plugin terbundel,
bacalah komentar deprecasi di barrel tersebut sebelum melakukan upgrade.
</Note>

## Linimasa penghapusan

| Kapan                  | Apa yang terjadi                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**           | Permukaan deprecated mengeluarkan peringatan runtime                    |
| **Rilis mayor berikutnya** | Permukaan deprecated akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin inti sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis mayor berikutnya.

## Menekan peringatan untuk sementara

Setel variabel environment ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah escape hatch sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) — bangun plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi import subpath lengkap
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun plugin provider
- [Internal Plugin](/id/plugins/architecture) — pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest
