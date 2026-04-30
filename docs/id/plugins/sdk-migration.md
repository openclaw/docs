---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui Plugin agar menggunakan arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke SDK Plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-04-30T10:03:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah berpindah dari lapisan kompatibilitas mundur yang luas ke arsitektur plugin modern
dengan impor yang terfokus dan terdokumentasi. Jika plugin Anda dibuat sebelum
arsitektur baru ini, panduan ini membantu Anda bermigrasi.

## Apa yang berubah

Sistem plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan plugin mengimpor
apa pun yang mereka butuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** — satu impor yang mengekspor ulang puluhan
  helper. Ini diperkenalkan untuk menjaga agar plugin lama berbasis hook tetap berfungsi sementara
  arsitektur plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** — barrel helper runtime yang luas yang
  mencampur event sistem, status heartbeat, antrean pengiriman, helper fetch/proxy,
  helper file, jenis approval, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** — barrel kompatibilitas konfigurasi yang luas
  yang masih membawa helper load/write langsung yang sudah deprecated selama jendela
  migrasi.
- **`openclaw/extension-api`** — bridge yang memberi plugin akses langsung ke
  helper sisi host seperti runner agen tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook ekstensi bundled khusus Pi yang telah dihapus
  yang dapat mengamati event runner tertanam seperti
  `tool_result`.

Permukaan impor yang luas sekarang **deprecated**. Permukaan tersebut masih berfungsi saat runtime,
tetapi plugin baru tidak boleh menggunakannya, dan plugin yang ada sebaiknya bermigrasi sebelum
rilis mayor berikutnya menghapusnya. API pendaftaran factory ekstensi tertanam khusus Pi
telah dihapus; gunakan middleware hasil tool sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin terdokumentasi dalam perubahan yang sama
yang memperkenalkan penggantinya. Perubahan kontrak yang bersifat breaking harus terlebih dahulu melewati
adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprecation.
Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku
pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
  Pendaftaran factory ekstensi tertanam khusus Pi sudah tidak lagi dimuat.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** — mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi melingkar** — ekspor ulang yang luas memudahkan pembuatan siklus impor
- **Permukaan API tidak jelas** — tidak ada cara untuk mengetahui ekspor mana yang stabil dibanding internal

SDK plugin modern memperbaiki ini: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`)
adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak terdokumentasi.

Seam kemudahan provider legacy untuk channel bundled juga telah hilang.
Seam helper bermerek channel adalah pintasan mono-repo privat, bukan kontrak
plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace
plugin bundled, simpan helper milik provider di `api.ts` atau
`runtime-api.ts` milik plugin tersebut sendiri.

Contoh provider bundled saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime
  di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider serta helper onboarding/konfigurasi di
  `api.ts` miliknya sendiri

## Kebijakan kompatibilitas

Untuk plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

1. tambahkan kontrak baru
2. pertahankan perilaku lama yang dihubungkan melalui adapter kompatibilitas
3. emit diagnostik atau peringatan yang menyebutkan path lama dan penggantinya
4. cakup kedua path dalam pengujian
5. dokumentasikan deprecation dan jalur migrasi
6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

Maintainer dapat mengaudit antrean migrasi saat ini dengan
`pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
jumlah ringkas, `--owner <id>` untuk satu plugin atau pemilik kompatibilitas, dan
`pnpm plugins:boundary-report:ci` ketika gate CI harus gagal pada record
kompatibilitas yang jatuh tempo, impor SDK reserved lintas pemilik, atau subpath SDK reserved
yang tidak digunakan. Laporan mengelompokkan record
kompatibilitas deprecated berdasarkan tanggal penghapusan, menghitung referensi kode/dokumen lokal,
menampilkan impor SDK reserved lintas pemilik, dan merangkum bridge SDK
memory-host privat agar pembersihan kompatibilitas tetap eksplisit alih-alih
mengandalkan pencarian ad hoc. Subpath SDK reserved harus memiliki penggunaan pemilik yang dilacak;
ekspor helper reserved yang tidak digunakan harus dihapus dari SDK publik.

Jika field manifest masih diterima, penulis plugin dapat tetap menggunakannya hingga
dokumentasi dan diagnostik mengatakan sebaliknya. Kode baru sebaiknya memilih pengganti
terdokumentasi, tetapi plugin yang ada tidak boleh rusak selama rilis minor
biasa.

## Cara bermigrasi

<Steps>
  <Step title="Migrate runtime config load/write helpers">
    Plugin bundled harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Pilih konfigurasi yang
    sudah diteruskan ke jalur panggilan aktif. Handler berumur panjang yang membutuhkan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Tool agen
    berumur panjang harus menggunakan `ctx.getRuntimeConfig()` milik konteks tool di dalam
    `execute` sehingga tool yang dibuat sebelum penulisan konfigurasi tetap melihat
    konfigurasi runtime yang telah disegarkan.

    Penulisan konfigurasi harus melalui helper transaksional dan memilih kebijakan
    setelah tulis:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika pemanggil mengetahui
    perubahan tersebut memerlukan restart Gateway bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya ketika pemanggil memiliki
    tindak lanjut dan sengaja ingin menekan planner reload.
    Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk pengujian dan logging;
    Gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap tersedia sebagai helper kompatibilitas
    deprecated untuk plugin eksternal selama jendela migrasi dan memperingatkan sekali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bundled dan kode runtime repo
    dilindungi oleh guardrail scanner di
    `pnpm check:deprecated-internal-config-api` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan konfigurasi langsung gagal, metode server Gateway harus menggunakan
    snapshot runtime request, helper send/action/client channel runtime
    harus menerima konfigurasi dari batasnya, dan modul runtime berumur panjang memiliki
    nol panggilan ambient `loadConfig()` yang diizinkan.

    Kode plugin baru juga sebaiknya menghindari impor barrel kompatibilitas
    `openclaw/plugin-sdk/config-runtime` yang luas. Gunakan subpath SDK sempit
    yang sesuai dengan tugas:

    | Kebutuhan | Impor |
    | --- | --- |
    | Jenis konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertion konfigurasi yang sudah dimuat dan lookup konfigurasi entry plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bundled dan pengujiannya dijaga scanner terhadap barrel yang luas
    agar impor dan mock tetap lokal pada perilaku yang dibutuhkan. Barrel yang luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru sebaiknya tidak
    bergantung padanya.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Plugin bundled harus mengganti handler hasil tool khusus Pi
    `api.registerEmbeddedExtensionFactory(...)` dengan
    middleware netral runtime.

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

    Plugin eksternal tidak dapat mendaftarkan middleware hasil tool karena middleware tersebut dapat
    menulis ulang output tool berkepercayaan tinggi sebelum model melihatnya.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugin channel berkemampuan approval sekarang mengekspos perilaku approval native melalui
    `approvalCapability.nativeRuntime` plus registry konteks runtime bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus approval dari wiring legacy `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak channel-plugin publik;
      pindahkan field delivery/native/render ke `approvalCapability`
    - `plugin.auth` tetap untuk alur login/logout channel saja; hook auth approval
      di sana tidak lagi dibaca oleh core
    - Daftarkan objek runtime milik channel seperti client, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik plugin dari handler approval native;
      core sekarang memiliki pemberitahuan routed-elsewhere dari hasil pengiriman aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, berikan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk layout capability approval
    saat ini.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan sekarang gagal tertutup kecuali Anda secara eksplisit meneruskan
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

    Jika pemanggil Anda tidak sengaja bergantung pada fallback shell, jangan set
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Find deprecated imports">
    Cari plugin Anda untuk impor dari salah satu permukaan deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Setiap ekspor dari permukaan lama dipetakan ke path impor modern tertentu:

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

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk pembantu bridge legacy lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | pembantu penyimpanan sesi | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Ganti impor infra-runtime yang luas">
    `openclaw/plugin-sdk/infra-runtime` masih ada untuk kompatibilitas
    eksternal, tetapi kode baru sebaiknya mengimpor permukaan pembantu terfokus yang
    benar-benar dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Pembantu antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Pembantu peristiwa dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas kanal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe dalam memori | `openclaw/plugin-sdk/dedupe-runtime` |
    | Pembantu jalur file lokal/media yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Pembantu proxy dan fetch terlindungi | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/resolusi persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Payload balasan persetujuan dan pembantu perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Pembantu pemformatan error | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Pembantu token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas async terbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Lock async lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai terhadap `infra-runtime`, sehingga kode repo
    tidak dapat kembali mengalami regresi ke barrel yang luas.

  </Step>

  <Step title="Migrasikan pembantu rute kanal">
    Kode rute kanal baru sebaiknya menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap tersedia sebagai alias
    kompatibilitas selama jendela migrasi, tetapi plugin baru sebaiknya menggunakan nama rute
    yang menjelaskan perilaku secara langsung:

    | Pembantu lama | Pembantu modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Pembantu rute modern menormalisasi `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, dedupe masuk,
    pengiriman cron, dan perutean sesi. Jika plugin Anda memiliki tata bahasa target
    kustom, gunakan `resolveChannelRouteTargetWithParser(...)` untuk mengadaptasi
    parser tersebut ke kontrak target rute yang sama.

  </Step>

  <Step title="Build dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Tabel jalur impor umum">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Pembantu entri Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/pembuat entri kanal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pembantu entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan pembuat entri kanal terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Pembantu wizard penyiapan bersama | Prompt allowlist, pembuat status penyiapan |
  | `plugin-sdk/setup-runtime` | Pembantu runtime saat penyiapan | Adaptor patch penyiapan aman impor, pembantu catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi penyiapan terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Pembantu adaptor penyiapan | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Pembantu alat penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pembantu multi-akun | Pembantu daftar akun/konfigurasi/gerbang tindakan |
  | `plugin-sdk/account-id` | Pembantu ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Pembantu pencarian akun | Pembantu pencarian akun + fallback default |
  | `plugin-sdk/account-helpers` | Pembantu akun sempit | Pembantu daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengkabelan prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adaptor konfigurasi dan pembantu akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Pembuat skema konfigurasi | Primitif skema konfigurasi kanal bersama dan hanya pembuat generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bundel | Hanya plugin bundel yang dipelihara OpenClaw; plugin baru harus mendefinisikan skema lokal plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bundel yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk plugin bundel yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Pembantu konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikasi/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Pembantu status akun dan siklus hidup stream draf | `createAccountStatusSink`, pembantu finalisasi pratinjau draf |
  | `plugin-sdk/inbound-envelope` | Pembantu amplop masuk | Pembantu rute bersama + pembuat amplop |
  | `plugin-sdk/inbound-reply-dispatch` | Pembantu balasan masuk | Pembantu catat-dan-dispatch bersama |
  | `plugin-sdk/messaging-targets` | Parsing target pesan | Pembantu parsing/pencocokan target |
  | `plugin-sdk/outbound-media` | Pembantu media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Pembantu dependensi pengiriman keluar | Pencarian `resolveOutboundSendDep` ringan tanpa mengimpor runtime keluar lengkap |
  | `plugin-sdk/outbound-runtime` | Pembantu runtime keluar | Pembantu pengiriman keluar, delegasi identitas/kirim, sesi, pemformatan, dan perencanaan payload |
  | `plugin-sdk/thread-bindings-runtime` | Pembantu pengikatan thread | Pembantu siklus hidup pengikatan thread dan adaptor |
  | `plugin-sdk/agent-media-payload` | Pembantu payload media lama | Pembuat payload media agen untuk tata letak bidang lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime kanal lama |
  | `plugin-sdk/channel-send-result` | Jenis hasil pengiriman | Jenis hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Pembantu runtime luas | Pembantu runtime/logging/cadangan/pemasangan plugin |
  | `plugin-sdk/runtime-env` | Pembantu env runtime sempit | Env logger/runtime, timeout, retry, dan backoff |
  | `plugin-sdk/plugin-runtime` | Pembantu runtime Plugin bersama | Pembantu perintah/hook/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Pembantu pipeline hook | Pembantu pipeline webhook/hook internal bersama |
  | `plugin-sdk/lazy-runtime` | Pembantu runtime malas | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pembantu proses | Pembantu exec bersama |
  | `plugin-sdk/cli-runtime` | Pembantu runtime CLI | Pemformatan perintah, penantian, pembantu versi |
  | `plugin-sdk/gateway-runtime` | Pembantu Gateway | Klien Gateway, pembantu mulai siap event-loop, dan pembantu patch status kanal |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Utamakan `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pembantu perintah Telegram | Pembantu validasi perintah Telegram stabil fallback saat permukaan kontrak Telegram bundel tidak tersedia |
  | `plugin-sdk/approval-runtime` | Pembantu prompt persetujuan | Payload persetujuan exec/plugin, pembantu kapabilitas/profil persetujuan, perutean/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Pembantu auth persetujuan | Resolusi pemberi persetujuan, auth tindakan chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Pembantu klien persetujuan | Pembantu profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Pembantu pengiriman persetujuan | Adaptor kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Pembantu Gateway persetujuan | Pembantu resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu adaptor persetujuan | Pembantu pemuatan adaptor persetujuan native ringan untuk entrypoint kanal panas |
  | `plugin-sdk/approval-handler-runtime` | Pembantu handler persetujuan | Pembantu runtime handler persetujuan yang lebih luas; utamakan seam adaptor/Gateway yang lebih sempit saat sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan | Pembantu pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Pembantu balasan persetujuan | Pembantu payload balasan persetujuan exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Pembantu konteks runtime kanal | Pembantu registrasi/ambil/pantau konteks runtime kanal generik |
  | `plugin-sdk/security-runtime` | Pembantu keamanan | Pembantu trust, gating DM, konten eksternal, dan pengumpulan rahasia bersama |
  | `plugin-sdk/ssrf-policy` | Pembantu kebijakan SSRF | Pembantu allowlist host dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Pembantu runtime SSRF | Dispatcher tersemat, fetch terlindungi, pembantu kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Pembantu peristiwa sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pembantu Heartbeat | Pembantu peristiwa dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pembantu antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pembantu aktivitas kanal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pembantu deduplikasi | Cache deduplikasi dalam memori |
  | `plugin-sdk/file-access-runtime` | Pembantu akses file | Pembantu jalur file/media lokal yang aman |
  | `plugin-sdk/transport-ready-runtime` | Pembantu kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Pembantu cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pembantu gating diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pembantu pemformatan kesalahan | `formatUncaughtError`, `isApprovalNotFoundError`, pembantu grafik kesalahan |
  | `plugin-sdk/fetch-runtime` | Pembantu fetch/proxy terbungkus | `resolveFetch`, pembantu proxy, pembantu opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pembantu normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pembantu retry | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Pemetaan input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating perintah dan pembantu permukaan perintah | `resolveControlCommandGate`, pembantu otorisasi pengirim, pembantu registri perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Pembantu input rahasia |
  | `plugin-sdk/webhook-ingress` | Pembantu permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Pembantu guard body Webhook | Pembantu baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, heartbeat, perencana balasan, pemotongan |
  | `plugin-sdk/reply-dispatch-runtime` | Pembantu dispatch balasan sempit | Finalisasi, dispatch penyedia, dan pembantu label percakapan |
  | `plugin-sdk/reply-history` | Pembantu riwayat balasan | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pembantu potongan balasan | Pembantu pemotongan teks/markdown |
  | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan sesi | Pembantu jalur penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Pembantu jalur state | Pembantu direktori state dan OAuth |
  | `plugin-sdk/routing` | Pembantu perutean/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pembantu normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Pembantu status kanal | Pembuat ringkasan status kanal/akun, default state runtime, pembantu metadata isu |
  | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target | Pembantu resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi string | Pembantu normalisasi slug/string |
  | `plugin-sdk/request-url` | Pembantu URL permintaan | Ekstrak URL string dari input mirip permintaan |
  | `plugin-sdk/run-command` | Pembantu perintah berwaktu | Runner perintah berwaktu dengan stdout/stderr ternormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param alat/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload alat | Mengekstrak payload ternormalisasi dari objek hasil alat |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman alat | Mengekstrak bidang target kirim kanonis dari argumen alat |
  | `plugin-sdk/temp-path` | Pembantu jalur sementara | Pembantu jalur unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu pencatatan log | Pencatat log subsistem dan pembantu redaksi |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/swa-hosting terkurasi | Pembantu penemuan/konfigurasi penyedia swa-hosting |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia swa-hosting kompatibel OpenAI yang terfokus | Pembantu penemuan/konfigurasi penyedia swa-hosting yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu autentikasi runtime penyedia | Pembantu resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan kunci API penyedia | Pembantu onboarding/penulisan profil kunci API |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil autentikasi penyedia | Pembuat hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-auth-login` | Pembantu login interaktif penyedia | Pembantu login interaktif bersama |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia terkonfigurasi atau otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Pembantu variabel lingkungan penyedia | Pembantu pencarian variabel lingkungan autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/replay penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi id model |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding penyedia | Pembantu konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu kapabilitas HTTP/endpoint penyedia generik, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu pengambilan web penyedia | Pembantu pendaftaran/cache penyedia pengambilan web |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi pencarian web penyedia | Pembantu konfigurasi/kredensial pencarian web yang sempit untuk penyedia yang tidak memerlukan pengabelan pengaktifan Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak pencarian web penyedia | Pembantu kontrak konfigurasi/kredensial pencarian web yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, dan setter/getter kredensial berskala terbatas |
  | `plugin-sdk/provider-web-search` | Pembantu pencarian web penyedia | Pembantu pendaftaran/cache/runtime penyedia pencarian web |
  | `plugin-sdk/provider-tools` | Pembantu kompatibilitas alat/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pembersihan skema Gemini + diagnostik, dan pembantu kompatibilitas xAI seperti `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu pembungkus stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus stream, dan pembantu pembungkus Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot bersama |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia | Pembantu transport penyedia native seperti fetch terlindungi, transformasi pesan transport, dan stream peristiwa transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean asinkron berurutan | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu pengambilan/transformasi/penyimpanan media, probing dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu pembuatan media bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model hilang untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu pemahaman media | Tipe penyedia pemahaman media plus ekspor pembantu gambar/audio untuk penyedia |
  | `plugin-sdk/text-runtime` | Pembantu teks bersama | Penghapusan teks yang terlihat oleh asisten, pembantu render/pemotongan/tabel markdown, pembantu redaksi, pembantu tag direktif, utilitas teks aman, dan pembantu teks/pencatatan log terkait |
  | `plugin-sdk/text-chunking` | Pembantu pemotongan teks | Pembantu pemotongan teks keluar |
  | `plugin-sdk/speech` | Pembantu ucapan | Tipe penyedia ucapan plus pembantu direktif, registry, validasi untuk penyedia, dan pembuat TTS kompatibel OpenAI |
  | `plugin-sdk/speech-core` | Inti ucapan bersama | Tipe penyedia ucapan, registry, direktif, normalisasi |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi waktu nyata | Tipe penyedia, pembantu registry, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara waktu nyata | Tipe penyedia, pembantu registry/resolusi, dan pembantu sesi bridge |
  | `plugin-sdk/image-generation` | Pembantu pembuatan gambar | Tipe penyedia pembuatan gambar plus pembantu URL aset/data gambar dan pembuat penyedia gambar kompatibel OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe pembuatan gambar, failover, autentikasi, dan pembantu registry |
  | `plugin-sdk/music-generation` | Pembantu pembuatan musik | Tipe penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe pembuatan musik, pembantu failover, pencarian penyedia, dan penguraian ref model |
  | `plugin-sdk/video-generation` | Pembantu pembuatan video | Tipe penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe pembuatan video, pembantu failover, pencarian penyedia, dan penguraian ref model |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi kanal | Primitif skema konfigurasi kanal yang sempit |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi kanal | Pembantu otorisasi penulisan konfigurasi kanal |
  | `plugin-sdk/channel-plugin-common` | Prelude kanal bersama | Ekspor prelude Plugin kanal bersama |
  | `plugin-sdk/channel-status` | Pembantu status kanal | Pembantu snapshot/ringkasan status kanal bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi allowlist | Pembantu edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm` | Pembantu DM langsung | Pembantu autentikasi/guard DM langsung bersama |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu kanal/status pasif dan proxy ambient |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Registry target Webhook dan pembantu pemasangan rute |
  | `plugin-sdk/webhook-path` | Pembantu jalur Webhook | Pembantu normalisasi jalur Webhook |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Ekspor ulang Zod | `zod` yang diekspor ulang untuk konsumen SDK Plugin |
  | `plugin-sdk/memory-core` | Pembantu memory-core terbundel | Permukaan pembantu manajer/konfigurasi/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin fondasi host memori | Ekspor mesin fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registry, penyedia lokal, dan pembantu batch/jarak jauh generik; penyedia jarak jauh konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memori | Ekspor mesin QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin penyimpanan host memori | Ekspor mesin penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Pembantu multimodal host memori | Pembantu multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Pembantu kueri host memori | Pembantu kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Pembantu rahasia host memori | Pembantu rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Pembantu jurnal peristiwa host memori | Pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-core-host-status` | Pembantu status host memori | Pembantu status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Pembantu runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Pembantu runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Pembantu file/runtime host memori | Pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral vendor untuk pembantu runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral vendor untuk pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host memori | Alias netral vendor untuk pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu markdown terkelola bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian active memory | Fasad runtime pengelola pencarian active-memory lazy |
  | `plugin-sdk/memory-host-status` | Alias status host memori | Alias netral vendor untuk pembantu status host memori |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas luas legacy; utamakan subjalur pengujian terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

Tabel ini sengaja berisi subset migrasi umum, bukan seluruh permukaan SDK. Daftar lengkap 200+ entrypoint berada di `scripts/lib/plugin-sdk-entrypoints.json`.

Seam helper Plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor SDK publik kecuali facade kompatibilitas yang didokumentasikan secara eksplisit seperti shim `plugin-sdk/discord` yang sudah usang dan dipertahankan untuk paket `@openclaw/discord@2026.3.13` yang telah dipublikasikan. Helper khusus pemilik berada di dalam paket Plugin pemiliknya; perilaku host bersama harus bergerak melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

Gunakan impor tersempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada maintainer kontrak generik mana yang seharusnya memilikinya.

## Depresiasi aktif

Depresiasi yang lebih sempit yang berlaku di seluruh SDK Plugin, kontrak penyedia, permukaan runtime, dan manifest. Masing-masing masih berfungsi hari ini tetapi akan dihapus dalam rilis major mendatang. Entri di bawah setiap item memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, ekspor yang sama — hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspornya ulang sebagai stub kompatibilitas.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` — mengembalikan satu objek keputusan, bukan dua panggilan terpisah.

    Plugin saluran downstream (Slack, Discord, Matrix, MS Teams) sudah beralih.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk Plugin saluran yang lebih lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions` sudah usang bersama ekspor saluran "actions" mentah. Ekspos kemampuan melalui permukaan semantik `presentation` sebagai gantinya — Plugin saluran mendeklarasikan apa yang mereka render (kartu, tombol, select), bukan nama tindakan mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada Plugin penyedia. OpenClaw tidak lagi membutuhkan helper SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun envelope prompt plaintext datar dari pesan saluran inbound.

    **Baru**: `BodyForAgent` ditambah blok konteks pengguna terstruktur. Plugin saluran melampirkan metadata routing (thread, topik, reply-to, reaksi) sebagai field bertipe, bukan menggabungkannya ke string prompt. Helper
    `formatAgentEnvelope(...)` masih didukung untuk envelope yang disintesis dan menghadap asisten, tetapi envelope plaintext inbound sedang dihentikan.

    Area yang terdampak: `inbound_claim`, `message_received`, dan Plugin saluran kustom apa pun yang memproses lanjut teks `channelEnvelope`.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Empat alias tipe discovery sekarang menjadi wrapper tipis di atas tipe era katalog:

    | Alias lama                | Tipe baru                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah bag statis `ProviderCapabilities` legacy — Plugin penyedia harus menggunakan hook penyedia eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan daftar level berperingkat. OpenClaw menurunkan nilai tersimpan yang sudah basi berdasarkan peringkat profil secara otomatis.

    Implementasikan satu hook, bukan tiga. Hook legacy tetap berfungsi selama jendela depresiasi tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan `resolveExternalOAuthProfiles(...)` tanpa mendeklarasikan penyedia di manifest Plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifest Plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`. Jalur "auth fallback" lama mengeluarkan peringatan saat runtime dan akan dihapus.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    Field manifest **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu tempat dan menghindari boot runtime Plugin hanya untuk menjawab lookup env-var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas hingga jendela depresiasi ditutup.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan pendaftaran. Helper memori aditif
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) tidak terdampak.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Dua alias tipe legacy masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` sudah usang dan digantikan oleh
    `getSessionMessages`. Signature yang sama; metode lama meneruskan panggilan ke yang baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (singular) mengembalikan accessor task-flow live.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi TaskFlow terkelola untuk Plugin yang membuat, memperbarui, membatalkan, atau menjalankan tugas turunan dari flow. Gunakan `runtime.tasks.flows` saat Plugin hanya membutuhkan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Dicakup dalam "Cara bermigrasi → Migrasikan ekstensi hasil-tool Pi ke
    middleware" di atas. Disertakan di sini demi kelengkapan: jalur khusus Pi
    `api.registerEmbeddedExtensionFactory(...)` yang dihapus digantikan oleh
    `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime eksplisit di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` sekarang menjadi alias satu baris untuk `OpenClawConfig`. Utamakan nama kanonisnya.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Depresiasi tingkat ekstensi (di dalam Plugin saluran/penyedia bawaan di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts` mereka sendiri. Itu tidak memengaruhi kontrak Plugin pihak ketiga dan tidak dicantumkan di sini. Jika Anda menggunakan barrel lokal Plugin bawaan secara langsung, baca komentar depresiasi di barrel tersebut sebelum meningkatkan versi.
</Note>

## Linimasa penghapusan

| Kapan                  | Yang terjadi                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**           | Permukaan yang sudah usang mengeluarkan peringatan runtime              |
| **Rilis major berikutnya** | Permukaan yang sudah usang akan dihapus; Plugin yang masih menggunakannya akan gagal |

Semua Plugin inti sudah dimigrasikan. Plugin eksternal harus bermigrasi sebelum rilis major berikutnya.

## Menekan peringatan sementara

Atur variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalur keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) — buat Plugin pertama Anda
- [Ringkasan SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) — membangun Plugin saluran
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — membangun Plugin penyedia
- [Internal Plugin](/id/plugins/architecture) — pendalaman arsitektur
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest
