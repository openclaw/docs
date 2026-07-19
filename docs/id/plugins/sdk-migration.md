---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur lama ke SDK plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-07-19T05:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50cd42eb7512d223d7693a9dbc99db27392bf2797e409d096bbcf11c59c1fd2b
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw mengganti lapisan kompatibilitas mundur yang luas dengan arsitektur plugin
modern yang dibangun dari impor kecil dan terfokus. Jika plugin Anda dibuat sebelum
perubahan tersebut, panduan ini akan memigrasikannya ke kontrak saat ini.

## Yang berubah

Dua permukaan impor yang sangat terbuka dahulu memungkinkan plugin mengakses hampir
apa saja dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - mengekspor ulang puluhan helper agar
  plugin lama berbasis hook tetap berfungsi selama arsitektur baru dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel luas yang mencampurkan peristiwa
  sistem, status heartbeat, antrean pengiriman, helper fetch/proxy, helper berkas,
  jenis persetujuan, dan utilitas yang tidak berkaitan.
- **`openclaw/plugin-sdk/config-runtime`** - barrel konfigurasi luas yang masih
  membawa helper pemuatan/penulisan langsung yang tidak digunakan lagi selama periode migrasi.
- **`openclaw/extension-api`** - jembatan yang memberi plugin akses langsung ke
  helper sisi host seperti runner agen tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook khusus runner tertanam yang telah
  dihapus, yang mengamati peristiwa runner tertanam seperti `tool_result`. Sebagai gantinya,
  gunakan middleware hasil alat agen (lihat [Migrasikan ekstensi hasil alat tertanam
  ke middleware](#how-to-migrate)).

Permukaan ini **tidak digunakan lagi**: permukaan tersebut masih berfungsi, tetapi plugin baru
tidak boleh menggunakannya, dan plugin yang sudah ada sebaiknya bermigrasi sebelum rilis mayor
berikutnya menghapusnya. `registerEmbeddedExtensionFactory` telah dihapus;
pendaftaran lama tidak lagi dimuat.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan berhenti berfungsi ketika itu terjadi.
</Warning>

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin yang terdokumentasi dalam
perubahan yang sama dengan diperkenalkannya pengganti. Perubahan kontrak yang merusak terlebih
dahulu melalui adaptor kompatibilitas, diagnostik, dokumentasi, dan periode penghentian.
Hal ini berlaku untuk impor SDK, bidang manifes, API penyiapan, hook, dan perilaku
pendaftaran runtime.

### Alasan

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak berkaitan.
- **Dependensi melingkar** - ekspor ulang yang luas memudahkan pembuatan
  siklus impor.
- **Permukaan API tidak jelas** - tidak ada cara untuk membedakan ekspor stabil dari ekspor internal.

Setiap `openclaw/plugin-sdk/<subpath>` kini merupakan modul kecil dan mandiri dengan
kontrak yang terdokumentasi.

Lapisan kemudahan penyedia lama untuk saluran bawaan juga telah dihapus -
pintasan helper bermerek saluran merupakan kemudahan privat mono-repo, bukan
kontrak plugin yang stabil. Gunakan subjalur SDK generik yang sempit sebagai gantinya. Di dalam
ruang kerja plugin bawaan, simpan helper milik penyedia di
`api.ts` atau `runtime-api.ts` milik plugin tersebut:

- Anthropic menyimpan helper stream khusus Claude dalam lapisan `api.ts` /
  `contract-api.ts` miliknya sendiri.
- OpenAI menyimpan builder penyedia, helper model default, dan builder penyedia
  realtime dalam `api.ts` miliknya sendiri.
- OpenRouter menyimpan builder penyedia dan helper onboarding/konfigurasi dalam
  `api.ts` miliknya sendiri.

## Kebijakan kompatibilitas

Pekerjaan kompatibilitas plugin eksternal mengikuti urutan ini:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama yang terhubung melalui adaptor kompatibilitas.
3. Tampilkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya.
4. Cakup kedua jalur dalam pengujian.
5. Dokumentasikan penghentian dan jalur migrasi.
6. Hapus hanya setelah periode migrasi yang diumumkan, biasanya dalam rilis
   mayor.

Jika suatu bidang manifes masih diterima, tetap gunakan bidang tersebut hingga dokumentasi dan
diagnostik menyatakan sebaliknya. Kode baru sebaiknya memilih pengganti yang terdokumentasi;
plugin yang sudah ada tidak boleh rusak selama rilis minor biasa.

Audit antrean migrasi saat ini dengan `pnpm plugins:boundary-report`:

| Flag                                                    | Dampak                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (atau `pnpm plugins:boundary-report:summary`) | Jumlah ringkas sebagai pengganti detail lengkap.                                         |
| `--json`                                                | Laporan yang dapat dibaca mesin.                                                       |
| `--owner <id>`                                          | Filter ke satu plugin atau pemilik kompatibilitas.                                   |
| `--fail-on-cross-owner`                                 | Keluar dengan kode bukan nol pada impor SDK tercadangkan lintas pemilik.                             |
| `--fail-on-eligible-compat`                             | Keluar dengan kode bukan nol ketika tanggal `removeAfter` milik catatan kompatibilitas yang tidak digunakan lagi telah berlalu. |
| `--fail-on-unclassified-unused-reserved`                | Keluar dengan kode bukan nol pada shim SDK tercadangkan yang tidak digunakan.                                    |

`pnpm plugins:boundary-report:ci` dijalankan dengan ketiga flag kegagalan. Setiap
catatan kompatibilitas memiliki tanggal `removeAfter` yang eksplisit (bukan "rilis
mayor berikutnya" yang tidak jelas) - laporan mengelompokkan catatan yang tidak digunakan lagi berdasarkan
tanggal tersebut, menghitung referensi kode/dokumentasi lokal, menampilkan impor SDK tercadangkan lintas pemilik,
dan merangkum jembatan SDK host memori privat. Subjalur SDK tercadangkan harus memiliki
penggunaan pemilik yang dilacak; ekspor tercadangkan yang tidak digunakan sebaiknya dihapus dari
SDK publik.

## Cara bermigrasi

<Steps>
  <Step title="Migrasikan helper pemuatan/penulisan konfigurasi runtime">
    Plugin bawaan sebaiknya berhenti memanggil `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Utamakan konfigurasi yang sudah
    diteruskan ke jalur panggilan aktif. Handler berumur panjang yang memerlukan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Alat agen
    berumur panjang sebaiknya membaca `ctx.getRuntimeConfig()` di dalam `execute` agar alat
    yang dibuat sebelum penulisan konfigurasi tetap melihat konfigurasi yang telah diperbarui.

    Penulisan konfigurasi dilakukan melalui helper transaksional dengan kebijakan
    setelah-penulisan yang eksplisit:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika perubahan memerlukan
    restart Gateway yang bersih, dan `afterWrite: { mode: "none", reason: "..." }`
    hanya ketika pemanggil memiliki tindak lanjut dan dengan sengaja menonaktifkan
    perencana pemuatan ulang. Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk
    pengujian dan pencatatan; Gateway tetap bertanggung jawab untuk menerapkan atau
    menjadwalkan restart.

    `loadConfig` dan `writeConfigFile` tetap tersedia sebagai helper kompatibilitas
    yang tidak digunakan lagi untuk plugin eksternal dan memperingatkan satu kali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bawaan dan kode
    runtime repo dijaga oleh `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan plugin produksi baru
    langsung gagal, penulisan konfigurasi langsung gagal, metode server Gateway harus menggunakan
    snapshot runtime permintaan, helper pengiriman/tindakan/klien saluran runtime
    harus menerima konfigurasi dari batasnya, dan modul runtime berumur panjang
    tidak mengizinkan panggilan ambien `loadConfig()`.

    Kode plugin baru sebaiknya menghindari barrel `openclaw/plugin-sdk/config-runtime`
    yang luas. Gunakan subjalur sempit untuk kebutuhan tersebut:

    | Kebutuhan | Impor |
    | --- | --- |
    | Jenis konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Pernyataan konfigurasi yang sudah dimuat, pencarian konfigurasi entri plugin, dan penggabungan konfigurasi | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Penggantian model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bawaan dan pengujiannya dijaga pemindai agar tidak menggunakan barrel
    luas tersebut sehingga impor dan mock tetap lokal pada perilaku yang diperlukan.
    Barrel tersebut masih tersedia untuk kompatibilitas eksternal, tetapi kode baru sebaiknya tidak
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi hasil alat tertanam ke middleware">
    Plugin bawaan harus mengganti handler hasil alat
    `api.registerEmbeddedExtensionFactory(...)` yang khusus runner tertanam dengan
    middleware yang netral terhadap runtime:

    ```typescript
    // Alat runtime OpenClaw dan alat dinamis runtime Codex (hasil dapat
    // ditransformasikan). Hasil alat native Codex juga diteruskan untuk observasi,
    // tetapi output yang ditransformasikan tidak pernah mencapai model: kontrak hook
    // PostToolUse Codex tidak dapat mengganti respons alat native.
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Perbarui manifes plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin yang terinstal juga dapat mendaftarkan middleware hasil alat ketika diaktifkan
    secara eksplisit dan setiap runtime yang ditargetkan dideklarasikan dalam
    `contracts.agentToolResultMiddleware`. Pendaftaran middleware terinstal
    yang tidak dideklarasikan akan ditolak.

  </Step>

  <Step title="Migrasikan handler persetujuan native ke fakta kapabilitas">
    Plugin saluran berkemampuan persetujuan mengekspos perilaku persetujuan native melalui
    `approvalCapability.nativeRuntime` beserta registry konteks runtime
    bersama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`.
    - Pindahkan autentikasi/pengiriman khusus persetujuan dari pengkabelan lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`.
    - `ChannelPlugin.approvals` telah dihapus dari kontrak
      plugin saluran publik; pindahkan bidang pengiriman/native/render ke
      `approvalCapability`.
    - `plugin.auth` tetap tersedia hanya untuk alur login/logout saluran; inti tidak
      lagi membaca hook autentikasi persetujuan di sana.
    - Daftarkan objek runtime milik saluran (klien, token, aplikasi Bolt)
      melalui `openclaw/plugin-sdk/channel-runtime-context`.
    - Jangan kirim pemberitahuan pengalihan rute milik plugin dari handler persetujuan native;
      inti memiliki pemberitahuan dialihkan-ke-tempat-lain dari hasil pengiriman aktual.
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang nyata - stub parsial akan
      ditolak.

    Lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins) untuk tata letak
    kapabilitas persetujuan saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak dapat diurai kini gagal secara tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`:

    ```typescript
    // Sebelum
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Setelah
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Tetapkan ini hanya untuk pemanggil kompatibilitas tepercaya yang dengan sengaja
      // menerima fallback yang dimediasi shell.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak secara sengaja bergantung pada fallback shell, jangan tetapkan
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang tidak digunakan lagi">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Ganti dengan impor terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke jalur impor modern tertentu:

    ```typescript
    // Sebelum (lapisan kompatibilitas mundur yang tidak digunakan lagi)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sesudah (impor terfokus modern)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime plugin yang diinjeksi, bukan
    mengimpor secara langsung:

    ```typescript
    // Sebelum (jembatan extension-api yang tidak digunakan lagi)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Sesudah (runtime yang diinjeksi)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper jembatan lama lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper penyimpanan sesi | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Ganti impor infra-runtime yang luas">
    `openclaw/plugin-sdk/infra-runtime` masih tersedia untuk kompatibilitas
    eksternal, tetapi kode baru harus mengimpor permukaan terfokus yang benar-benar
    diperlukan:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper pengaktifan, peristiwa, dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas saluran | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache deduplikasi dalam memori dan yang didukung penyimpanan persisten | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper jalur berkas/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Pengambilan yang memperhitungkan dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper pengambilan dengan proksi dan perlindungan | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/penyelesaian persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload balasan dan perintah persetujuan | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan kesalahan | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transportasi | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron terbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Pernyataan nilai wajib untuk invarian yang dapat dibuktikan | `openclaw/plugin-sdk/expect-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Kunci asinkron lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Kunci berkas | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai terhadap `infra-runtime`, sehingga kode repositori
    tidak dapat kembali menggunakan barrel yang luas.

  </Step>

  <Step title="Migrasikan helper rute saluran">
    Kode rute saluran baru menggunakan `openclaw/plugin-sdk/channel-route`. Nama
    kunci rute yang lebih lama tetap tersedia sebagai alias kompatibilitas:

    | Helper lama | Helper modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Helper rute modern menormalisasi `{ channel, to, accountId, threadId }`
    secara konsisten pada persetujuan native, penekanan balasan, deduplikasi masuk,
    pengiriman cron, dan perutean sesi.

    Jangan tambahkan penggunaan baru `ChannelMessagingAdapter.parseExplicitTarget` atau
    `resolveChannelRouteTargetWithParser(...)` dari
    `plugin-sdk/channel-route`—semuanya tidak digunakan lagi dan dipertahankan hanya untuk
    plugin lama. Plugin saluran baru harus menggunakan
    `messaging.targetResolver.resolveTarget(...)` untuk normalisasi ID target
    dan fallback ketika direktori tidak ditemukan,
    `messaging.inferTargetChatType(...)` saat inti memerlukan jenis peer lebih awal,
    dan `messaging.resolveOutboundSessionRoute(...)` untuk identitas sesi
    dan utas native penyedia.

  </Step>

  <Step title="Bangun dan uji">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Common import path table">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Pembantu entri Plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung lama untuk definisi/pembangun entri saluran | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi akar | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pembantu entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan pembangun entri saluran terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
  | `plugin-sdk/setup` | Pembantu bersama untuk wizard penyiapan | Penerjemah penyiapan, prompt daftar yang diizinkan, pembangun status penyiapan |
  | `plugin-sdk/setup-runtime` | Pembantu runtime saat penyiapan | `createSetupTranslator`, adaptor patch penyiapan yang aman untuk impor, pembantu catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi penyiapan yang didelegasikan |
  | `plugin-sdk/setup-adapter-runtime` | Alias adaptor penyiapan yang tidak digunakan lagi | Gunakan `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pembantu alat penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pembantu multiakun | Pembantu daftar akun/konfigurasi/pengendali tindakan |
  | `plugin-sdk/account-id` | Pembantu ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Pembantu pencarian akun | Pembantu pencarian akun + fallback bawaan |
  | `plugin-sdk/account-helpers` | Pembantu akun terbatas | Pembantu daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, serta `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengawatan prefiks balasan, indikator pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adaptor konfigurasi dan pembantu akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Pembangun skema konfigurasi | Hanya primitif skema konfigurasi saluran bersama dan pembangun generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi yang dibundel | Hanya plugin bundel yang dikelola OpenClaw; plugin baru harus menentukan skema lokal plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bundel yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk plugin bundel yang dipelihara |
  | `plugin-sdk/telegram-command-config` | Pembantu konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pembantu amplop masuk | Pembantu bersama untuk pembangun rute + amplop |
  | `plugin-sdk/channel-inbound` | Pembantu penerimaan masuk | Pembangunan konteks, pemformatan, akar, runner, pengiriman balasan yang telah disiapkan, dan predikat pengiriman |
  | `plugin-sdk/messaging-targets` | Jalur impor penguraian target yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-targets` untuk pembantu penguraian target generik, `plugin-sdk/channel-route` untuk perbandingan rute, serta `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` milik plugin untuk resolusi target khusus penyedia |
  | `plugin-sdk/outbound-media` | Pembantu media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pembantu siklus hidup pesan keluar | Adaptor pesan, tanda terima, pembantu pengiriman persisten, pembantu pratinjau langsung/streaming, opsi balasan, pembantu siklus hidup, identitas keluar, dan perencanaan payload |
  | `plugin-sdk/channel-streaming` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pembantu pengikatan utas | Siklus hidup pengikatan utas dan pembantu adaptor |
  | `plugin-sdk/agent-media-payload` | Pembantu payload media lama | Pembangun payload media agen untuk tata letak bidang lama |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime saluran lama |
  | `plugin-sdk/channel-send-result` | Jenis hasil pengiriman | Jenis hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan Plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Pembantu runtime umum | Pembantu runtime/pencatatan/pencadangan/instalasi plugin |
  | `plugin-sdk/runtime-env` | Pembantu lingkungan runtime terbatas | Pembantu pencatat/lingkungan runtime, batas waktu, percobaan ulang, dan jeda bertahap |
  | `plugin-sdk/plugin-runtime` | Pembantu runtime Plugin bersama | Pembantu perintah/kait/http/interaktif Plugin |
  | `plugin-sdk/hook-runtime` | Pembantu pipeline kait | Pembantu pipeline Webhook/kait internal bersama |
  | `plugin-sdk/lazy-runtime` | Pembantu runtime malas | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pembantu proses | Pembantu eksekusi bersama |
  | `plugin-sdk/cli-runtime` | Pembantu runtime CLI | Pemformatan perintah, penantian, pembantu versi |
  | `plugin-sdk/gateway-runtime` | Pembantu Gateway | Klien Gateway, pembantu mulai saat loop peristiwa siap, resolusi host LAN yang diumumkan, dan pembantu patch status saluran |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Utamakan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pembantu perintah Telegram | Pembantu validasi perintah Telegram dengan fallback stabil ketika permukaan kontrak Telegram yang dibundel tidak tersedia |
  | `plugin-sdk/approval-runtime` | Pembantu prompt persetujuan | Payload persetujuan eksekusi/plugin, pembantu kapabilitas/profil persetujuan, pembantu perutean/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Pembantu autentikasi persetujuan | Resolusi pemberi persetujuan, autentikasi tindakan dalam obrolan yang sama |
  | `plugin-sdk/approval-client-runtime` | Pembantu klien persetujuan | Pembantu profil/filter persetujuan eksekusi native |
  | `plugin-sdk/approval-delivery-runtime` | Pembantu pengiriman persetujuan | Adaptor kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Pembantu Gateway persetujuan | Resolver Gateway persetujuan bersama |
  | `plugin-sdk/approval-reference-runtime` | Referensi transportasi persetujuan | Pembantu pencari lokasi persisten yang deterministik untuk callback yang dibatasi transportasi |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pembantu adaptor persetujuan | Pembantu ringan untuk memuat adaptor persetujuan native bagi titik masuk saluran yang sering digunakan |
  | `plugin-sdk/approval-handler-runtime` | Pembantu penangan persetujuan | Pembantu runtime penangan persetujuan yang lebih luas; utamakan seam adaptor/Gateway yang lebih sempit bila memadai |
  | `plugin-sdk/approval-native-runtime` | Pembantu target persetujuan | Pembantu pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Pembantu balasan persetujuan | Pembantu payload balasan persetujuan eksekusi/plugin |
  | `plugin-sdk/channel-runtime-context` | Pembantu konteks runtime saluran | Pembantu generik untuk mendaftarkan/mendapatkan/memantau konteks runtime saluran |
  | `plugin-sdk/security-runtime` | Pembantu keamanan | Pembantu bersama untuk kepercayaan, pengendalian DM, file/jalur yang dibatasi akar, konten eksternal, dan pengumpulan rahasia |
  | `plugin-sdk/ssrf-policy` | Pembantu kebijakan SSRF | Pembantu daftar host yang diizinkan dan kebijakan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Pembantu runtime SSRF | Dispatcher tersemat, pengambilan terlindungi, pembantu kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Pembantu peristiwa sistem | `enqueueSystemEvent` (termasuk penggantian berdasarkan kunci), `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pembantu Heartbeat | Pembantu pembangkitan, peristiwa, dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pembantu antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pembantu aktivitas saluran | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pembantu deduplikasi | Cache deduplikasi dalam memori dan berbasis penyimpanan persisten |
  | `plugin-sdk/file-access-runtime` | Pembantu akses file | Pembantu jalur file/media lokal yang aman |
  | `plugin-sdk/transport-ready-runtime` | Pembantu kesiapan transportasi | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pembantu kebijakan persetujuan eksekusi | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pembantu cache terbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pembantu pengendalian diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pembantu kesalahan | `formatUncaughtError`, `isApprovalNotFoundError`, pembantu grafik kesalahan, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Pembantu pengambilan terbungkus/proksi | `resolveFetch`, pembantu proksi, pembantu opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pembantu normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pembantu percobaan ulang | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan daftar yang diizinkan dan pemetaan input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Pembantu pengendalian perintah dan permukaan perintah | `resolveControlCommandGate`, pembantu otorisasi pengirim, pembantu registri perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Penguraian input rahasia | Pembantu input rahasia |
  | `plugin-sdk/webhook-ingress` | Pembantu permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Pembantu pengaman isi Webhook | Pembantu pembacaan/pembatasan isi permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Pengiriman masuk, Heartbeat, perencana balasan, pemotongan menjadi bagian |
  | `plugin-sdk/reply-dispatch-runtime` | Pembantu pengiriman balasan terbatas | Pembantu finalisasi, pengiriman penyedia, dan label percakapan |
  | `plugin-sdk/reply-history` | Pembantu riwayat balasan | `createChannelHistoryWindow`; ekspor kompatibilitas pembantu peta yang tidak digunakan lagi seperti `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pembantu potongan balasan | Pembantu pemotongan teks/markdown menjadi bagian |
  | `plugin-sdk/session-store-runtime` | Pembantu penyimpanan sesi | Pembantu baris sesi tercakup, pembantu jalur penyimpanan, dan pembacaan waktu pembaruan |
  | `plugin-sdk/state-paths` | Pembantu jalur status | Pembantu direktori status dan OAuth |
  | `plugin-sdk/routing` | Pembantu perutean/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pembantu normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Pembantu status saluran | Pembangun ringkasan status saluran/akun, nilai bawaan status runtime, pembantu metadata masalah |
  | `plugin-sdk/target-resolver-runtime` | Pembantu resolver target | Pembantu resolver target bersama |
  | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi string | Pembantu normalisasi slug/string |
  | `plugin-sdk/request-url` | Pembantu URL permintaan | Mengekstrak URL string dari input menyerupai permintaan |
  | `plugin-sdk/run-command` | Pembantu perintah berwaktu | Runner perintah berwaktu dengan stdout/stderr yang dinormalisasi |
  | `plugin-sdk/param-readers` | Pembaca parameter | Pembaca parameter alat/CLI umum |
  | `plugin-sdk/tool-payload` | Ekstraksi payload alat | Mengekstrak payload yang dinormalisasi dari objek hasil alat |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman alat | Mengekstrak bidang target pengiriman kanonis dari argumen alat |
  | `plugin-sdk/temp-path` | Pembantu jalur sementara | Pembantu jalur unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu pencatatan | Pembantu pencatat subsistem dan penyuntingan data sensitif |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Jenis balasan pesan | Jenis payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/dihosting mandiri pilihan | Pembantu penemuan/konfigurasi penyedia yang dihosting mandiri |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu terfokus untuk penyiapan penyedia yang dihosting mandiri dan kompatibel dengan OpenAI | Pembantu penemuan/konfigurasi penyedia yang dihosting mandiri yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu autentikasi runtime penyedia | Pembantu resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan kunci API penyedia | Pembantu orientasi kunci API/penulisan profil |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil autentikasi penyedia | Pembangun hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia yang dikonfigurasi atau otomatis dan penggabungan konfigurasi mentah penyedia |
  | `plugin-sdk/provider-env-vars` | Pembantu variabel lingkungan penyedia | Pembantu pencarian variabel lingkungan autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/pemutaran ulang penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan pemutaran ulang bersama, pembantu titik akhir penyedia, dan pembantu normalisasi ID model |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch orientasi penyedia | Pembantu konfigurasi orientasi |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu generik untuk kemampuan HTTP/titik akhir penyedia, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu pengambilan web penyedia | Pembantu pendaftaran/cache penyedia pengambilan web |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi pencarian web penyedia | Pembantu konfigurasi/kredensial pencarian web terbatas untuk penyedia yang tidak memerlukan pengabelan pengaktifan plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak pencarian web penyedia | Pembantu kontrak konfigurasi/kredensial pencarian web terbatas seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta penyetel/pengambil kredensial tercakup |
  | `plugin-sdk/provider-web-search` | Pembantu pencarian web penyedia | Pembantu pendaftaran/cache/runtime penyedia pencarian web |
  | `plugin-sdk/provider-tools` | Pembantu kompatibilitas alat/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu pembungkus aliran penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe pembungkus aliran, dan pembantu pembungkus bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transportasi penyedia | Pembantu transportasi penyedia native seperti pengambilan terlindungi, ekstraksi teks hasil alat, transformasi pesan transportasi, dan aliran peristiwa transportasi yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean asinkron terurut | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu pengambilan/transformasi/penyimpanan media, pemeriksaan dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu pembuatan media bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model yang tidak tersedia untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu pemahaman media | Tipe penyedia pemahaman media beserta ekspor pembantu gambar/audio yang ditujukan bagi penyedia |
  | `plugin-sdk/text-runtime` | Ekspor kompatibilitas teks luas yang usang | Gunakan `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan `logging-core` |
  | `plugin-sdk/text-chunking` | Pembantu pemenggalan teks | Pembantu pemenggalan teks keluar dan rentang yang mempertahankan offset |
  | `plugin-sdk/speech` | Pembantu ucapan | Tipe penyedia ucapan beserta pembantu direktif, registri, dan validasi yang ditujukan bagi penyedia, serta pembuat TTS yang kompatibel dengan OpenAI |
  | `plugin-sdk/speech-core` | Inti ucapan bersama | Tipe penyedia ucapan, registri, direktif, normalisasi |
  | `plugin-sdk/speech-settings` | Pengaturan ucapan | Primitif ringan untuk resolusi dan normalisasi konfigurasi TTS tanpa registri penyedia atau runtime sintesis |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi waktu nyata | Tipe penyedia, pembantu registri, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara waktu nyata | Tipe penyedia, pembantu registri/resolusi, pembantu sesi jembatan, kerangka sesi yang independen dari transportasi, gerbang energi audio/awal ucapan, antrean respons suara agen bersama, kontrol suara proses aktif, kesehatan transkrip/peristiwa, peredaman gema, pencocokan pertanyaan konsultasi, koordinasi konsultasi paksa, pelacakan konteks giliran, pelacakan aktivitas keluaran, dan pembantu konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Pembantu pembuatan gambar | Tipe penyedia pembuatan gambar beserta pembantu aset gambar/URL data dan pembuat penyedia gambar yang kompatibel dengan OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe pembuatan gambar, failover, autentikasi, dan pembantu registri |
  | `plugin-sdk/music-generation` | Pembantu pembuatan musik | Tipe penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe pembuatan musik, pembantu failover, pencarian penyedia, dan penguraian referensi model |
  | `plugin-sdk/video-generation` | Pembantu pembuatan video | Tipe penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe pembuatan video, pembantu failover, pencarian penyedia, dan penguraian referensi model |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi saluran | Primitif skema konfigurasi saluran terbatas |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi saluran | Pembantu otorisasi penulisan konfigurasi saluran |
  | `plugin-sdk/channel-plugin-common` | Pendahuluan saluran bersama | Ekspor pendahuluan plugin saluran bersama |
  | `plugin-sdk/channel-status` | Pembantu status saluran | Pembantu snapshot/ringkasan status saluran bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi daftar izin | Pembantu pengeditan/pembacaan konfigurasi daftar izin |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang usang | Gunakan `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pembantu penjaga DM langsung | Pembantu kebijakan penjagaan pra-kriptografi terbatas |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu saluran pasif/status dan proksi sekitar |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Pembantu registri target dan pemasangan rute Webhook |
  | `plugin-sdk/webhook-path` | Alias jalur Webhook yang usang | Gunakan `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Ekspor ulang kompatibilitas Zod yang usang | Impor `zod` langsung dari `zod` |
  | `plugin-sdk/memory-core` | Pembantu memory-core bawaan | Permukaan pembantu pengelola/konfigurasi/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registri embedding memori | Pembantu registri penyedia embedding memori ringan |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin fondasi host memori | Ekspor mesin fondasi host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registri, penyedia lokal, dan pembantu generik batch/jarak jauh; penyedia jarak jauh konkret berada dalam plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memori | Ekspor mesin QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin penyimpanan host memori | Ekspor mesin penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Pembantu multimodal host memori | Pembantu multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Pembantu kueri host memori | Pembantu kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Pembantu rahasia host memori | Pembantu rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Alias peristiwa memori yang usang | Gunakan `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pembantu status host memori | Pembantu status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Pembantu runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Pembantu runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Pembantu file/runtime host memori | Pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral-vendor untuk pembantu runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal peristiwa host memori | Alias netral-vendor untuk pembantu jurnal peristiwa host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime memori yang usang | Gunakan `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu markdown terkelola bersama untuk plugin yang berkaitan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian memori aktif | Fasad runtime pengelola pencarian memori aktif yang dimuat secara malas |
  | `plugin-sdk/memory-host-status` | Alias status host memori yang usang | Gunakan `plugin-sdk/memory-core-host-status` |
</Accordion>

Tabel ini adalah subset migrasi umum, bukan keseluruhan permukaan SDK. Inventaris
titik masuk compiler berada di `scripts/lib/plugin-sdk-entrypoints.json`;
ekspor paket dihasilkan dari subset publik.

Seam helper plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor
SDK publik, kecuali facade kompatibilitas yang didokumentasikan secara eksplisit seperti
shim `plugin-sdk/discord` yang tidak digunakan lagi dan dipertahankan untuk plugin eksternal yang masih
mengimpor paket `@openclaw/discord` yang dipublikasikan secara langsung. Helper khusus pemilik
berada di dalam paket plugin pemiliknya; perilaku host bersama dialihkan
melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

Gunakan impor tersempit yang sesuai dengan tugas. Jika Anda tidak dapat menemukan ekspor,
periksa sumber di `src/plugin-sdk/` atau tanyakan kepada pengelola kontrak generik mana
yang seharusnya memilikinya.

## Permukaan kompatibilitas yang dihapus

### Barrel pengujian privat

`openclaw/plugin-sdk/testing` bersifat lokal repositori dan dikecualikan dari artefak paket
yang dirilis, sehingga dihapus sebelum tanggal `removeAfter` 2026-07-28. Pengujian
repositori menggunakan subpath terfokus seperti `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures`.

## Penghentian aktif

Penghentian yang lebih sempit di seluruh SDK plugin, kontrak penyedia, permukaan
runtime, dan manifes. Masing-masing masih berfungsi saat ini, tetapi akan dihapus dalam rilis
mayor mendatang. Setiap entri memetakan API lama ke pengganti kanonisnya.

  <AccordionGroup>
  <Accordion title="pembuat bantuan command-auth -> command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, ekspor yang sama
    — hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspornya kembali sebagai stub kompatibilitas.

    ```typescript
    // Sebelum
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Sesudah
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Pembantu pengendalian sebutan -> resolveInboundMentionDecision">
    **Lama**: `resolveMentionGating(params)` dan
    `resolveMentionGatingWithBypass(params)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` - satu objek
    keputusan, bukan dua bentuk pemanggilan terpisah.

    Diterapkan di Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp, dan Zalo. Model peristiwa `app_mention` milik Slack
    tidak menggunakan pembantu ini.

  </Accordion>

  <Accordion title="Shim runtime saluran dan pembantu tindakan saluran">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk plugin
    saluran lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Helper `channelActions*` di `openclaw/plugin-sdk/channel-actions`
    tidak digunakan lagi bersama ekspor channel "actions" mentah. Ekspos kapabilitas
    melalui permukaan semantik `presentation` sebagai gantinya - plugin channel
    mendeklarasikan apa yang direndernya (kartu, tombol, pilihan), bukan nama
    tindakan mentah yang diterimanya.

  </Accordion>

  <Accordion title="Helper tool() penyedia pencarian web -> createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` secara langsung pada plugin penyedia.
    OpenClaw tidak lagi memerlukan helper SDK untuk mendaftarkan pembungkus alat.

  </Accordion>

  <Accordion title="Envelope channel teks biasa -> BodyForAgent">
    **Lama**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (dan field
    `channelEnvelope` pada objek pesan masuk) untuk membuat envelope prompt
    teks biasa datar dari pesan channel masuk.

    **Baru**: `BodyForAgent` beserta blok konteks pengguna terstruktur. Plugin
    channel melampirkan metadata perutean (utas, topik, balasan-ke, reaksi) sebagai
    field bertipe, alih-alih menggabungkannya ke dalam string prompt. Helper
    `formatAgentEnvelope(...)` masih didukung untuk envelope sintetis
    yang ditujukan kepada asisten, tetapi envelope teks biasa masuk sedang
    dihentikan.

    Area yang terdampak: `inbound_claim`, `message_received`, dan setiap
    plugin channel khusus yang melakukan pascapemrosesan pada teks envelope lama.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Lama**: `api.on("deactivate", handler)`.

    **Baru**: `api.on("gateway_stop", handler)`. Kontrak pembersihan saat penghentian
    tetap sama; hanya nama hook yang berubah.

    ```typescript
    // Sebelum
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Sesudah
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` tetap terhubung sebagai alias kompatibilitas yang tidak digunakan lagi hingga
    dihapus setelah 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> pengikatan utas inti">
    **Lama**: `api.on("subagent_spawning", handler)` yang mengembalikan
    `threadBindingReady` atau `deliveryOrigin`.

    **Baru**: biarkan inti menyiapkan pengikatan subagen `thread: true` melalui
    adaptor pengikatan sesi channel. Gunakan `api.on("subagent_spawned", handler)`
    hanya untuk observasi setelah peluncuran.

    ```typescript
    // Sebelum
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Sesudah
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, dan
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` hanya dipertahankan sebagai
    permukaan kompatibilitas yang tidak digunakan lagi selama plugin eksternal bermigrasi, lalu dihapus
    setelah 2026-08-30.

  </Accordion>

  <Accordion title="Jenis penemuan penyedia -> jenis katalog penyedia">
    Empat alias jenis penemuan kini menjadi pembungkus tipis untuk jenis era
    katalog:

    | Alias lama                | Jenis baru                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Selain itu, ada kumpulan statis lama `ProviderCapabilities` — plugin penyedia
    sebaiknya menggunakan hook penyedia eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan penalaran -> resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar tingkat berperingkat. OpenClaw menurunkan nilai tersimpan yang usang berdasarkan peringkat profil
    secara otomatis.

    Konteks tersebut mencakup `provider`, `modelId`, `reasoning` gabungan opsional,
    dan fakta model `compat` gabungan opsional. Plugin penyedia dapat menggunakan fakta
    katalog tersebut untuk mengekspos profil khusus model hanya jika kontrak
    permintaan yang dikonfigurasi mendukungnya.

    Implementasikan satu hook, bukan tiga. Hook lama tetap berfungsi selama
    periode penghentian, tetapi tidak digabungkan dengan hasil profil.

  </Accordion>

  <Accordion title="Penyedia autentikasi eksternal -> contracts.externalAuthProviders">
    **Lama**: mengimplementasikan hook autentikasi eksternal tanpa mendeklarasikan penyedia
    dalam manifes plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` dalam manifes plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Pencarian variabel lingkungan penyedia -> setup.providers[].envVars">
    Kolom manifes **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan pencarian variabel lingkungan yang sama ke `setup.providers[].envVars`
    pada manifes. Ini menyatukan metadata lingkungan penyiapan/status di satu tempat
    dan menghindari pemuatan runtime plugin hanya untuk menjawab pencarian variabel lingkungan.

    `providerAuthEnvVars` tetap didukung melalui adaptor kompatibilitas
    hingga periode penghentian berakhir.

  </Accordion>

  <Accordion title="Pendaftaran plugin memori -> registerMemoryCapability">
    **Lama**: tiga pemanggilan terpisah — `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Baru**: satu pemanggilan pada API status memori —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu pemanggilan pendaftaran. Pembantu prompt dan korpus tambahan
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) tidak
    terpengaruh.

  </Accordion>

  <Accordion title="API penyedia penyematan memori">
    **Lama**: `api.registerMemoryEmbeddingProvider(...)` beserta
    `contracts.memoryEmbeddingProviders`.

    **Baru**: `api.registerEmbeddingProvider(...)` beserta
    `contracts.embeddingProviders`.

    Kontrak penyedia penyematan generik dapat digunakan kembali di luar memori dan merupakan
    jalur yang didukung untuk penyedia baru. API pendaftaran khusus memori
    tetap terhubung sebagai kompatibilitas yang dihentikan secara bertahap selagi penyedia yang ada
    bermigrasi. Pemeriksaan plugin melaporkan penggunaan yang tidak disertakan sebagai utang
    kompatibilitas.

  </Accordion>

  <Accordion title="Hasil pengiriman kanal mentah -> OutboundDeliveryResult">
    **Lama**: kembalikan `{ ok, messageId, error }` melalui
    `ChannelSendRawResult` dan normalkan dengan
    `createRawChannelSendResultAdapter(...)`.

    **Baru**: kembalikan kolom `OutboundDeliveryResult` dan lampirkan kanal dengan
    `createAttachedChannelResultAdapter(...)`. Pengiriman yang gagal seharusnya melempar pengecualian,
    bukan mengembalikan string kesalahan. Jenis hasil mentah tetap tersedia hingga
    rilis mayor SDK plugin berikutnya.

  </Accordion>

  <Accordion title="Jenis pesan sesi subagen diganti namanya">
    Dua alias jenis lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` dihentikan secara bertahap dan digantikan oleh
    `getSessionMessages`. Signaturnya sama; metode lama meneruskan pemanggilan ke metode
    baru.

  </Accordion>

  <Accordion title="API berkas sesi dan transkrip yang dihapus">
    Peralihan sesi/transkrip ke SQLite menghapus atau menghentikan secara bertahap API yang ditujukan bagi plugin
    yang mengekspos penyimpanan `sessions.json` aktif, jalur transkrip JSONL, atau daftar
    berkas sesi. Plugin runtime sebaiknya menggunakan identitas sesi dan pembantu runtime SDK,
    bukan menyelesaikan atau mengubah berkas aktif.

    | Permukaan yang dimigrasikan | Pengganti |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)`, dan `resolveSessionStoreEntry(...)` yang dihentikan secara bertahap | `getSessionEntry(...)`, `listSessionEntries(...)`, dan mutasi sesi tingkat baris. |
    | `resolveSessionFilePath(...)` yang dihentikan secara bertahap | Identitas sesi (`sessionKey`, `sessionId`, dan pembantu target runtime SDK) beserta metode Gateway yang beroperasi pada sesi saat ini. |
    | `saveSessionStore(...)` yang dihapus | API runtime sesi milik Gateway; kode plugin sebaiknya meminta atau mengubah status sesi melalui pembantu runtime/konteks yang terdokumentasi, bukan menulis berkas penyimpanan aktif. |
    | `resolveSessionTranscriptPathInDir(...)` dan `resolveAndPersistSessionFile(...)` yang dihapus | Identitas sesi dan metode Gateway yang beroperasi pada sesi saat ini. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Pembaca transkrip berbasis identitas yang diekspos oleh konteks runtime saat ini, atau metode riwayat/sesi Gateway ketika plugin berada di luar jalur pemilik transkrip. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` dengan `agentId`, `sessionKey`, dan `sessionId`. |
    | Masukan sinkronisasi memori seperti `sessionFiles` | Sumber transkrip/sesi berbasis identitas yang disediakan oleh host; jangan telusuri berkas JSONL aktif untuk sesi langsung. |
    | Opsi runtime bernama `transcriptPath` atau `sessionFile` untuk sesi aktif | Objek target `sessionTarget`/runtime yang membawa identitas sesi netral-penyimpanan. |

    File transkrip JSONL lama tetap valid sebagai artefak impor, arsip, ekspor, dan
    dukungan. File tersebut tidak lagi menjadi kontrak runtime keadaan stabil untuk
    sesi aktif.

    Plugin resmi yang dirilis dengan `v2026.7.1-beta.5` mengimpor empat
    helper yang tidak digunakan lagi di atas. `openclaw/plugin-sdk/session-store-runtime` mempertahankan
    jembatan yang sama persis hingga 2026-10-12; plugin baru harus menggunakan penggantinya.
    `resolveStorePath(...)` tetap menjadi helper SDK yang didukung dan bukan bagian dari
    penghentian ini.

    `openclaw plugins inspect --all --runtime` melaporkan plugin non-bawaan yang
    kesalahan pemuatan atau diagnostiknya masih merujuk pada API file yang telah dihapus ini. Penyisiran
    advisori `@openclaw/plugin-inspector` harus menggunakan versi `0.3.17` atau
    yang lebih baru agar pemindaian paket eksternal juga menandai helper sesi seluruh penyimpanan,
    helper jalur file sesi, target file transkrip lama, dan helper transkrip
    tingkat rendah sebelum rilis.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan pengakses
    alur tugas aktif.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi TaskFlow terkelola
    untuk plugin yang membuat, memperbarui, membatalkan, atau menjalankan tugas turunan dari sebuah
    alur. Gunakan `runtime.tasks.flows` ketika plugin hanya memerlukan
    pembacaan berbasis DTO.

    ```typescript
    // Sebelum
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Sesudah
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Dihapus setelah 2026-07-26.

  </Accordion>

  <Accordion title="Factory ekstensi tertanam -> middleware hasil alat agen">
    Dibahas dalam [Cara bermigrasi](#how-to-migrate) di atas. Disertakan di sini untuk
    kelengkapan: jalur `api.registerEmbeddedExtensionFactory(...)` khusus runner tertanam
    yang telah dihapus digantikan oleh
    `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime eksplisit
    dalam `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` kini menjadi
    alias satu baris untuk `OpenClawConfig`. Utamakan nama kanonis.

    ```typescript
    // Sebelum
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Sesudah
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Penghentian tingkat ekstensi (di dalam plugin saluran/penyedia bawaan di bawah
`extensions/`) dilacak dalam barrel `api.ts` dan `runtime-api.ts`
masing-masing. Penghentian tersebut tidak memengaruhi kontrak plugin pihak ketiga dan tidak dicantumkan
di sini. Jika Anda menggunakan barrel lokal plugin bawaan secara langsung, baca
komentar penghentian dalam barrel tersebut sebelum meningkatkan versi.
</Note>

## Migrasi Talk dan suara waktu nyata

Kode suara waktu nyata, telefoni, rapat, dan Talk browser menggunakan satu pengontrol
sesi Talk yang diekspor oleh `openclaw/plugin-sdk/realtime-voice`. Pengontrol
tersebut memiliki amplop peristiwa Talk umum, status giliran aktif, status pengambilan,
status audio keluaran, riwayat peristiwa terbaru, dan penolakan giliran kedaluwarsa.
Plugin penyedia memiliki sesi waktu nyata khusus vendor. Plugin rapat browser
menggunakan `openclaw/plugin-sdk/meeting-runtime` untuk mekanisme sesi, browser, audio, host-node,
konsultasi-agen, dan panggilan suara, lalu mengimplementasikan `MeetingPlatformAdapter`
untuk aturan URL, skrip DOM, pemetaan tindakan manual, teks keterangan, pembuatan, dan rencana
panggilan masuk. API REST platform, OAuth, artefak, pemilih, dan nama wire tetap berada dalam
plugin. Rencana izin browser menerima URL rapat yang diminta agar setiap
platform hanya dapat memberikan izin untuk origin persis yang didukungnya. Runtime sesi juga harus
menormalkan kondisi aktif khusus platform setelah keberangkatan dari browser dikonfirmasi;
kolom transkrip historis dapat tetap ada, tetapi kesiapan teks keterangan dan audio tidak boleh
tetap aktif setelah keluar.

Semua permukaan bawaan berjalan pada pengontrol bersama: relay browser,
serah terima ruang terkelola, waktu nyata panggilan suara, STT streaming panggilan suara, waktu nyata Google
Meet, dan push-to-talk native. Gateway mengiklankan satu saluran peristiwa Talk aktif
dalam `hello-ok.features.events`: `talk.event`.

Kode baru tidak boleh memanggil `createTalkEventSequencer(...)` secara langsung kecuali
saat mengimplementasikan adaptor tingkat rendah atau fixture pengujian. Gunakan pengontrol bersama agar
peristiwa dengan cakupan giliran tidak dapat dipancarkan tanpa id giliran, panggilan `turnEnd` /
`turnCancel` yang kedaluwarsa tidak dapat menghapus giliran aktif yang lebih baru, dan peristiwa
siklus hidup audio keluaran tetap konsisten di seluruh telefoni, rapat, relay browser,
serah terima ruang terkelola, dan klien Talk native.

Bentuk API publik:

```typescript
// API sesi Talk milik Gateway.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// API sesi penyedia milik klien.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sesi WebRTC/websocket-penyedia milik browser menggunakan `talk.client.create`,
karena browser memiliki negosiasi penyedia dan transportasi media, sedangkan
Gateway memiliki kredensial, instruksi, dan kebijakan alat. `talk.session.*` adalah
permukaan umum yang dikelola Gateway untuk waktu nyata gateway-relay, transkripsi gateway-relay,
dan sesi STT/TTS native ruang terkelola.

Konfigurasi lama yang menempatkan pemilih waktu nyata di samping `talk.provider` /
`talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; Talk runtime
tidak menafsirkan ulang konfigurasi penyedia ucapan/TTS sebagai konfigurasi penyedia waktu nyata.

Kombinasi `talk.session.create` yang didukung sengaja dibatasi:

| Mode            | Transportasi       | Otak           | Pemilik              | Catatan                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio penyedia dupleks penuh yang dijembatani melalui Gateway; panggilan alat dirutekan melalui alat konsultasi-agen.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya STT streaming; pemanggil mengirim audio masukan dan menerima peristiwa transkrip.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Ruang native/klien | Ruang bergaya push-to-talk dan walkie-talkie tempat klien memiliki pengambilan/pemutaran dan Gateway memiliki status giliran. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Ruang native/klien | Mode ruang khusus admin untuk permukaan pihak pertama tepercaya yang menjalankan tindakan alat Gateway secara langsung.                  |

Peta metode untuk pembaca yang bermigrasi dari kelompok `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` yang lebih lama (semuanya dihapus):

| Lama                              | Baru                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` atau `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Kosakata kontrol terpadu juga sengaja dibatasi:

| Metode                          | Berlaku untuk                                              | Kontrak                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan potongan audio PCM base64 ke sesi penyedia yang dimiliki oleh koneksi Gateway yang sama.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai giliran pengguna ruang terkelola.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri giliran aktif setelah validasi giliran kedaluwarsa.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | semua sesi milik Gateway                              | Batalkan pekerjaan pengambilan/penyedia/agen/TTS yang aktif untuk suatu giliran.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan keluaran audio asisten tanpa harus mengakhiri giliran pengguna.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan panggilan alat penyedia setelah penyelesaian asinkron apa pun yang diekspos oleh jembatannya; berikan `options.willContinue` untuk keluaran sementara atau, jika didukung, `options.suppressResponse` untuk menghindari respons asisten lain. |
| `talk.session.steer`            | sesi Talk yang didukung agen                              | Kirim kontrol lisan `status`, `steer`, `cancel`, atau `followup` ke proses tertanam aktif yang diresolusi dari sesi Talk.                                                                                                 |
| `talk.session.close`            | semua sesi terpadu                                    | Hentikan sesi relay atau cabut status ruang terkelola, lalu lupakan id sesi terpadu.                                                                                                                                     |

Jangan memperkenalkan kasus khusus penyedia atau platform di core agar ini dapat berfungsi.
Core memiliki semantik sesi Talk. Plugin penyedia memiliki penyiapan sesi vendor.
Voice-call dan Google Meet memiliki adaptor telefoni/rapat. Browser dan aplikasi
native memiliki UX pengambilan/pemutaran perangkat.

## Linimasa penghapusan

| Kapan                                        | Yang terjadi                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Sekarang**                                     | Permukaan usang yang mendukung peringatan memancarkan peringatan runtime; penjaga repositori menolak impor SDK usang dari core dan Plugin bawaan. |
| **Tanggal `removeAfter` setiap catatan kompatibilitas** | Permukaan spesifik tersebut memenuhi syarat untuk dihapus; `pnpm plugins:boundary-report --fail-on-eligible-compat` menggagalkan CI setelah tanggal tersebut berlalu.    |
| **Rilis mayor berikutnya**                      | Semua permukaan yang masih belum dimigrasikan dihapus; Plugin yang masih menggunakannya akan gagal.                                                          |

Subpath SDK publik di bawah ini memiliki jendela penghapusan atau penurunan
tingkat yang didukung registri. Saat ini subpath tersebut tidak memancarkan
peringatan runtime saat Plugin eksternal mengimpornya. Penjaga penggunaan usang
repositori hanya berlaku pada tingkat θ1 yang sama sekali tidak digunakan dan
tingkat kompatibilitas sebelumnya; θ2 tetap tersedia bagi Plugin bawaan selama
jendela tersebut.

Untuk jendela yang diperkenalkan pada 2026-07-15, θ1 tidak memiliki konsumen
eksternal atau bawaan yang diketahui dan akan dihapus setelah jendela tersebut.
θ2 memiliki konsumen bawaan, tetapi tidak memiliki konsumen eksternal yang
diketahui; hanya ekspor paket publiknya yang akan dihentikan. Modulnya akan
tetap tersedia bagi Plugin bawaan sebagai subpath khusus privat-lokal.

| `removeAfter` | Tingkat                                | Subpath SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-30`  | Penghentian kompatibilitas sebelumnya | `agent-dir-compat`, `channel-envelope`, `channel-inbound-roots`, `channel-location`, `channel-message-runtime`, `channel-pairing-paths`, `channel-reply-options-runtime`, `config-schema`, `config-types`, `direct-dm`, `direct-dm-access`, `mattermost`, `media-generation-runtime-shared`, `memory-core`, `memory-core-engine-runtime`, `memory-core-host-events`, `memory-core-host-multimodal`, `memory-core-host-query`, `memory-host-files`, `memory-host-status`, `music-generation-core`, `outbound-runtime`, `outbound-send-deps`, `provider-auth-login`, `provider-zai-endpoint`, `reply-dedupe`, `runtime-logger`, `runtime-secret-resolution`, `self-hosted-provider-setup`, `setup-adapter-runtime`, `telegram-command-config`, `webhook-path`, `zalouser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `2026-07-30`  | θ1: sepenuhnya tidak digunakan; hapus subpath       | `command-gating`, `lmstudio`, `lmstudio-runtime`, `secret-provider-integration`, `skills-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `2026-07-30`  | θ2: hanya dibundel; hentikan ekspor publik | `access-groups`, `account-resolution-runtime`, `acp-binding-resolve-runtime`, `acp-binding-runtime`, `acp-runtime`, `acp-runtime-backend`, `agent-core`, `agent-harness-exec-review-runtime`, `agent-harness-task-runtime`, `agent-harness-tool-runtime`, `agent-media-payload`, `agent-sessions`, `approval-reaction-runtime`, `approval-reference-runtime`, `async-lock-runtime`, `browser-config`, `bundled-channel-config-schema`, `channel-activity-runtime`, `channel-config-writes`, `channel-mention-gating`, `channel-route`, `channel-secret-tts-runtime`, `channel-targets`, `chat-channel-ids`, `cli-backend`, `cli-runtime`, `codex-mcp-projection`, `command-status-runtime`, `command-surface`, `concurrency-runtime`, `context-visibility-runtime`, `conversation-binding-runtime`, `cron-store-runtime`, `dangerous-name-runtime`, `delivery-queue-runtime`, `direct-dm-guard-policy`, `directory-config-runtime`, `document-extractor`, `embedding-providers`, `exec-approvals-runtime`, `expect-runtime`, `fetch-runtime`, `file-access-runtime`, `file-lock`, `global-singleton`, `group-activation`, `heartbeat-runtime`, `host-runtime`, `html-entity-runtime`, `image-generation`, `image-generation-core`, `image-generation-runtime`, `inline-image-data-url-runtime`, `json-schema-runtime`, `json-unsafe-integers`, `keyed-async-queue`, `llm`, `markdown-table-runtime`, `media-generation-runtime`, `media-understanding`, `memory-core-host-embedding-registry`, `memory-core-host-engine-embeddings`, `memory-core-host-engine-qmd`, `memory-core-host-engine-storage`, `memory-core-host-runtime-cli`, `memory-core-host-runtime-core`, `memory-core-host-runtime-files`, `memory-core-host-secret`, `memory-core-host-status`, `memory-host-core`, `memory-host-events`, `memory-host-markdown`, `memory-host-search`, `message-tool-delivery-hints`, `migration`, `migration-runtime`, `music-generation`, `node-host`, `number-runtime`, `outbound-media`, `pair-loop-guard-runtime`, `plugin-config-runtime`, `plugin-state-runtime`, `poll-runtime`, `process-runtime`, `provider-auth-api-key`, `provider-auth-login-flow-runtime`, `provider-auth-result`, `provider-auth-runtime`, `provider-catalog-live-runtime`, `provider-catalog-shared`, `provider-entry`, `provider-env-vars`, `provider-http`, `provider-model-shared`, `provider-model-types`, `provider-oauth-runtime`, `provider-onboard`, `provider-selection-runtime`, `provider-setup`, `provider-stream`, `provider-stream-family`, `provider-stream-shared`, `provider-tools`, `provider-transport-runtime`, `provider-usage`, `provider-web-fetch`, `provider-web-fetch-contract`, `provider-web-search`, `provider-web-search-config-contract`, `provider-web-search-contract`, `qa-runner-runtime`, `realtime-bootstrap-context`, `realtime-transcription`, `realtime-voice`, `reply-reference`, `request-url`, `response-limit-runtime`, `retry-runtime`, `runtime-doctor`, `runtime-fetch`, `sandbox`, `secret-file-runtime`, `secure-random-runtime`, `session-binding-runtime`, `session-catalog`, `session-key-runtime`, `session-transcript-hit`, `session-transcript-runtime`, `session-visibility`, `simple-completion-runtime`, `speech`, `speech-core`, `sqlite-runtime`, `ssrf-dispatcher`, `string-normalization-runtime`, `system-event-runtime`, `talk-config-runtime`, `target-resolver-runtime`, `text-autolink-runtime`, `text-utility-runtime`, `thread-bindings-runtime`, `thread-bindings-session-runtime`, `time-runtime`, `tool-payload`, `tool-plugin`, `tool-results`, `transcripts`, `transport-ready-runtime`, `tts-runtime`, `types`, `video-generation`, `video-generation-core`, `video-generation-runtime`, `web-content-extractor`, `webhook-targets`, `windows-spawn` |
| `2026-08-15`  | Penghentian kompatibilitas sebelumnya     | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `2026-09-01`  | Penghentian kompatibilitas sebelumnya     | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Semua plugin inti telah bermigrasi. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya. Jalankan `pnpm plugins:boundary-report` untuk melihat
catatan kompatibilitas yang tenggatnya paling dekat untuk permukaan yang digunakan plugin Anda.

## Menonaktifkan peringatan untuk sementara

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - buat plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi lengkap impor subjalur
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) - membuat plugin saluran
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - membuat plugin penyedia
- [Internal Plugin](/id/plugins/architecture) - pembahasan mendalam tentang arsitektur
- [Manifes Plugin](/id/plugins/manifest) - referensi skema manifes
