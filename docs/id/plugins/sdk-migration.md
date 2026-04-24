---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda sedang memperbarui Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur legacy ke SDK Plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-04-24T09:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw telah beralih dari lapisan kompatibilitas mundur yang luas ke arsitektur Plugin
modern dengan impor yang terfokus dan terdokumentasi. Jika Plugin Anda dibuat sebelum
arsitektur baru, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem Plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan Plugin mengimpor
apa saja yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** — satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga Plugin lama berbasis hook tetap berfungsi saat
  arsitektur Plugin baru sedang dibangun.
- **`openclaw/extension-api`** — jembatan yang memberi Plugin akses langsung ke
  helper sisi host seperti embedded agent runner.

Kedua permukaan ini sekarang **deprecated**. Keduanya masih berfungsi saat runtime, tetapi Plugin
baru tidak boleh menggunakannya, dan Plugin yang ada sebaiknya bermigrasi sebelum rilis major berikutnya menghapusnya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku Plugin yang terdokumentasi dalam perubahan yang sama
yang memperkenalkan penggantinya. Perubahan kontrak yang breaking harus terlebih dahulu
melewati adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprecation.
Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku registrasi runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus pada rilis major mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak ketika itu terjadi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menimbulkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** — ekspor ulang yang luas memudahkan terciptanya siklus impor
- **Permukaan API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

SDK Plugin modern memperbaikinya: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak yang terdokumentasi.

Seam convenience provider legacy untuk kanal bawaan juga telah dihapus. Impor
seperti `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper bermerek kanal, dan
`openclaw/plugin-sdk/telegram-core` adalah pintasan mono-repo privat, bukan
kontrak Plugin yang stabil. Sebagai gantinya, gunakan subpath SDK generik yang sempit. Di dalam
workspace Plugin bawaan, simpan helper yang dimiliki provider di
`api.ts` atau `runtime-api.ts` Plugin itu sendiri.

Contoh provider bawaan saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider
  realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan helper builder provider dan onboarding/config di
  `api.ts` miliknya sendiri

## Kebijakan kompatibilitas

Untuk Plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

1. tambahkan kontrak baru
2. pertahankan perilaku lama yang tetap terhubung melalui adapter kompatibilitas
3. keluarkan diagnostik atau peringatan yang menyebut path lama dan penggantinya
4. cakup kedua jalur dalam test
5. dokumentasikan deprecation dan jalur migrasinya
6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis major

Jika suatu field manifest masih diterima, penulis Plugin dapat terus menggunakannya sampai
dokumentasi dan diagnostik mengatakan sebaliknya. Kode baru sebaiknya memilih
pengganti yang terdokumentasi, tetapi Plugin yang ada tidak boleh rusak selama rilis minor biasa.

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan handler approval-native ke capability facts">
    Plugin kanal yang mendukung approval sekarang menampilkan perilaku approval native melalui
    `approvalCapability.nativeRuntime` plus registry runtime-context bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/delivery khusus approval dari wiring legacy `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak publik channel-plugin;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap ada hanya untuk alur login/logout kanal; hook auth approval
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik kanal seperti client, token, atau app Bolt melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik Plugin dari handler approval native;
      core sekarang memiliki pemberitahuan routed-elsewhere dari hasil delivery aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial akan ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk tata letak capability approval saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika Plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan sekarang gagal tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Sebelumnya
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sesudah
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Setel ini hanya untuk pemanggil kompatibilitas tepercaya yang memang
      // menerima fallback melalui shell.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak secara sengaja bergantung pada shell fallback, jangan setel
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang deprecated">
    Telusuri Plugin Anda untuk impor dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ganti dengan impor yang terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke path impor modern tertentu:

    ```typescript
    // Sebelumnya (lapisan kompatibilitas mundur yang deprecated)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sesudah (impor modern yang terfokus)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime Plugin yang disuntikkan alih-alih mengimpor
    secara langsung:

    ```typescript
    // Sebelumnya (jembatan extension-api yang deprecated)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sesudah (runtime yang disuntikkan)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper jembatan legacy lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build dan test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi path impor

  <Accordion title="Tabel path impor umum">
  | Path impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entri Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Umbrella re-export legacy untuk definisi/builder entri kanal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri provider tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri kanal yang terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard setup bersama | Prompt allowlist, builder status setup |
  | `plugin-sdk/setup-runtime` | Helper runtime saat setup | Adapter patch setup yang aman diimpor, helper lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy setup terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Helper adapter setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tooling setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar/konfigurasi/gerbang aksi akun |
  | `plugin-sdk/account-id` | Helper id akun | `DEFAULT_ACCOUNT_ID`, normalisasi id akun |
  | `plugin-sdk/account-resolution` | Helper lookup akun | Helper lookup akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun yang sempit | Helper daftar akun/aksi akun |
  | `plugin-sdk/channel-setup` | Adapter wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring prefix balasan + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter konfigurasi | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder skema konfigurasi | Tipe skema konfigurasi kanal |
  | `plugin-sdk/telegram-command-config` | Helper konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper status akun dan siklus hidup draft stream | `createAccountStatusSink`, helper finalisasi pratinjau draf |
  | `plugin-sdk/inbound-envelope` | Helper inbound envelope | Helper builder route + envelope bersama |
  | `plugin-sdk/inbound-reply-dispatch` | Helper balasan inbound | Helper record-and-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Helper parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Pemuatan media outbound bersama |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper identitas/delegasi kirim outbound dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Helper siklus hidup dan adapter thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper payload media legacy | Builder payload media agen untuk layout field legacy |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas deprecated | Hanya utilitas runtime kanal legacy |
  | `plugin-sdk/channel-send-result` | Tipe hasil kirim | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime yang luas | Helper runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Helper env runtime yang sempit | Helper logger/runtime env, timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime Plugin bersama | Helper perintah/hooks/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline webhook/internal hook bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, waits, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Helper klien Gateway dan patch status kanal |
  | `plugin-sdk/config-runtime` | Helper konfigurasi | Helper load/write konfigurasi |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil-fallback ketika permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt approval | Helper payload approval exec/plugin, approval capability/profile, helper routing/runtime native approval |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approval | Resolusi approver, auth aksi same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper klien approval | Helper profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helper delivery approval | Adapter native approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Helper gateway approval | Helper resolusi-gateway approval bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter approval | Helper pemuatan adapter native approval ringan untuk entrypoint kanal panas |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approval | Helper runtime handler approval yang lebih luas; utamakan seam adapter/gateway yang lebih sempit jika itu sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target approval | Helper binding target/akun native approval |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan approval | Helper payload balasan approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context kanal | Helper register/get/watch runtime-context kanal generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper trust, gating DM, konten-eksternal, dan pengumpulan secret bersama |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper allowlist host dan kebijakan jaringan private |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper pinned-dispatcher, guarded fetch, kebijakan SSRF |
  | `plugin-sdk/collection-runtime` | Helper cache terbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper graph error |
  | `plugin-sdk/fetch-runtime` | Helper wrapped fetch/proxy | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan helper permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registry perintah |
  | `plugin-sdk/command-status` | Renderer status/help perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input secret | Helper input secret |
  | `plugin-sdk/webhook-ingress` | Helper permintaan webhook | Utilitas target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body webhook | Helper baca/batasi body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch inbound, Heartbeat, planner balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan yang sempit | Helper finalize, provider dispatch, dan conversation-label |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper penyimpanan sesi | Helper path penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Helper path status | Helper direktori status dan OAuth |
  | `plugin-sdk/routing` | Helper routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalisasi session-key |
  | `plugin-sdk/status-helpers` | Helper status kanal | Builder ringkasan status kanal/akun, default runtime-state, helper metadata issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Helper normalisasi string | Helper normalisasi slug/string |
  | `plugin-sdk/request-url` | Helper URL permintaan | Ekstrak URL string dari input mirip request |
  | `plugin-sdk/run-command` | Helper perintah bertimeout | Runner perintah bertimeout dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param tool/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload ternormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak field target kirim kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Helper path temp | Helper path unduhan-temp bersama |
  | `plugin-sdk/logging-core` | Helper logging | Logger subsistem dan helper redaksi |
  | `plugin-sdk/markdown-table-runtime` | Helper tabel Markdown | Helper mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Helper setup provider lokal/self-hosted yang terkurasi | Helper discovery/config provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper setup provider self-hosted yang kompatibel dengan OpenAI dan terfokus | Helper discovery/config provider self-hosted yang sama |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime provider | Helper resolusi API-key runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper setup API-key provider | Helper onboarding/profile-write API-key |
  | `plugin-sdk/provider-auth-result` | Helper auth-result provider | Builder auth-result OAuth standar |
  | `plugin-sdk/provider-auth-login` | Helper login interaktif provider | Helper login interaktif bersama |
  | `plugin-sdk/provider-selection-runtime` | Helper pemilihan provider | Pemilihan provider configured-or-auto dan penggabungan konfigurasi provider mentah |
  | `plugin-sdk/provider-env-vars` | Helper env-var provider | Helper lookup env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Helper model/replay provider bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder kebijakan replay bersama, helper endpoint provider, dan helper normalisasi model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper katalog provider bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Helper konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP provider | Helper HTTP/kapabilitas endpoint provider generik, termasuk helper multipart form untuk transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch provider | Helper registrasi/cache provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper konfigurasi web-search provider | Helper konfigurasi/kredensial web-search sempit untuk provider yang tidak memerlukan wiring plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Helper kontrak web-search provider | Helper kontrak konfigurasi/kredensial web-search sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial bercakupan |
  | `plugin-sdk/provider-web-search` | Helper web-search provider | Helper registrasi/cache/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Helper kompatibilitas tool/skema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan helper kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper penggunaan provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan helper penggunaan provider lainnya |
  | `plugin-sdk/provider-stream` | Helper pembungkus stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, dan helper pembungkus bersama untuk Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper transport provider | Helper transport provider native seperti guarded fetch, transform pesan transport, dan stream event transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media bersama | Helper fetch/transform/store media ditambah builder payload media |
  | `plugin-sdk/media-generation-runtime` | Helper generasi media bersama | Helper failover bersama, pemilihan kandidat, dan pesan missing-model untuk generasi gambar/video/musik |
  | `plugin-sdk/media-understanding` | Helper media-understanding | Tipe provider media understanding ditambah ekspor helper gambar/audio yang menghadap provider |
  | `plugin-sdk/text-runtime` | Helper teks bersama | Penghapusan teks-yang-terlihat-asisten, helper render/chunking/tabel markdown, helper redaksi, helper directive-tag, utilitas safe-text, dan helper teks/logging terkait |
  | `plugin-sdk/text-chunking` | Helper chunking teks | Helper chunking teks outbound |
  | `plugin-sdk/speech` | Helper speech | Tipe provider speech ditambah helper directive, registry, dan validasi yang menghadap provider |
  | `plugin-sdk/speech-core` | Inti speech bersama | Tipe provider speech, registry, directive, normalisasi |
  | `plugin-sdk/realtime-transcription` | Helper realtime transcription | Tipe provider, helper registry, dan helper sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Helper realtime voice | Tipe provider, helper registry/resolusi, dan helper sesi bridge |
  | `plugin-sdk/image-generation-core` | Inti image-generation bersama | Tipe image-generation, failover, autentikasi, dan helper registry |
  | `plugin-sdk/music-generation` | Helper music-generation | Tipe provider/permintaan/hasil music-generation |
  | `plugin-sdk/music-generation-core` | Inti music-generation bersama | Tipe music-generation, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/video-generation` | Helper video-generation | Tipe provider/permintaan/hasil video-generation |
  | `plugin-sdk/video-generation-core` | Inti video-generation bersama | Tipe video-generation, helper failover, lookup provider, dan parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Helper balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi kanal | Primitif channel config-schema yang sempit |
  | `plugin-sdk/channel-config-writes` | Helper penulisan konfigurasi kanal | Helper otorisasi penulisan konfigurasi kanal |
  | `plugin-sdk/channel-plugin-common` | Prelude kanal bersama | Ekspor prelude plugin kanal bersama |
  | `plugin-sdk/channel-status` | Helper status kanal | Helper snapshot/ringkasan status kanal bersama |
  | `plugin-sdk/allowlist-config-edit` | Helper konfigurasi allowlist | Helper edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Helper akses grup | Helper keputusan group-access bersama |
  | `plugin-sdk/direct-dm` | Helper direct-DM | Helper auth/guard direct-DM bersama |
  | `plugin-sdk/extension-shared` | Helper ekstensi bersama | Primitif helper passive-channel/status dan ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper target webhook | Registry target webhook dan helper pemasangan route |
  | `plugin-sdk/webhook-path` | Helper path webhook | Helper normalisasi path webhook |
  | `plugin-sdk/web-media` | Helper media web bersama | Helper pemuatan media remote/lokal |
  | `plugin-sdk/zod` | Re-ekspor Zod | `zod` yang diekspor ulang untuk konsumen SDK Plugin |
  | `plugin-sdk/memory-core` | Helper memory-core bawaan | Permukaan helper manajer/konfigurasi/file/CLI memory |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime index/search memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin fondasi host memory | Ekspor mesin fondasi host memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memory | Kontrak embedding memory, akses registry, provider lokal, dan helper batch/remote generik; provider remote konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memory | Ekspor mesin QMD host memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin storage host memory | Ekspor mesin storage host memory |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodal host memory | Helper multimodal host memory |
  | `plugin-sdk/memory-core-host-query` | Helper query host memory | Helper query host memory |
  | `plugin-sdk/memory-core-host-secret` | Helper secret host memory | Helper secret host memory |
  | `plugin-sdk/memory-core-host-events` | Helper jurnal event host memory | Helper jurnal event host memory |
  | `plugin-sdk/memory-core-host-status` | Helper status host memory | Helper status host memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memory | Helper runtime CLI host memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memory | Helper runtime inti host memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memory | Helper file/runtime host memory |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memory | Alias netral-vendor untuk helper runtime inti host memory |
  | `plugin-sdk/memory-host-events` | Alias jurnal event host memory | Alias netral-vendor untuk helper jurnal event host memory |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memory | Alias netral-vendor untuk helper file/runtime host memory |
  | `plugin-sdk/memory-host-markdown` | Helper managed markdown | Helper managed-markdown bersama untuk Plugin yang berdekatan dengan memory |
  | `plugin-sdk/memory-host-search` | Fasad active memory search | Fasad runtime lazy active-memory search-manager |
  | `plugin-sdk/memory-host-status` | Alias status host memory | Alias netral-vendor untuk helper status host memory |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb bawaan | Permukaan helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitas test | Helper dan mock test |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan SDK.
Daftar lengkap 200+ entrypoint ada di
`scripts/lib/plugin-sdk-entrypoints.json`.

Daftar itu masih menyertakan beberapa seam helper bundled-plugin seperti
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan `plugin-sdk/matrix*`. Seam tersebut tetap diekspor untuk
pemeliharaan dan kompatibilitas bundled-plugin, tetapi sengaja
dihilangkan dari tabel migrasi umum dan bukan target yang direkomendasikan untuk
kode Plugin baru.

Aturan yang sama berlaku untuk keluarga helper bundled lainnya seperti:

- helper dukungan browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- permukaan helper/plugin bawaan seperti `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, dan `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` saat ini menampilkan permukaan helper token sempit
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, dan `resolveCopilotApiToken`.

Gunakan impor yang paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan ekspor, periksa source di `src/plugin-sdk/` atau tanyakan di Discord.

## Timeline penghapusan

| Kapan                  | Apa yang terjadi                                                         |
| ---------------------- | ------------------------------------------------------------------------ |
| **Sekarang**           | Permukaan deprecated mengeluarkan peringatan runtime                     |
| **Rilis major berikutnya** | Permukaan deprecated akan dihapus; Plugin yang masih menggunakannya akan gagal |

Semua Plugin inti sudah dimigrasikan. Plugin eksternal sebaiknya bermigrasi
sebelum rilis major berikutnya.

## Menyembunyikan peringatan untuk sementara

Setel variabel lingkungan ini saat Anda sedang mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah escape hatch sementara, bukan solusi permanen.

## Terkait

- [Getting Started](/id/plugins/building-plugins) — membangun Plugin pertama Anda
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Channel Plugins](/id/plugins/sdk-channel-plugins) — membangun Plugin kanal
- [Provider Plugins](/id/plugins/sdk-provider-plugins) — membangun Plugin provider
- [Plugin Internals](/id/plugins/architecture) — pembahasan mendalam arsitektur
- [Plugin Manifest](/id/plugins/manifest) — referensi skema manifest
