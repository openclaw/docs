---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui plugin ke arsitektur plugin modern
    - Anda memelihara Plugin eksternal OpenClaw
sidebarTitle: Migrate to SDK
summary: Bermigrasi dari lapisan kompatibilitas mundur lama ke SDK plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-07-20T03:56:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af65ffc5b71e5e2bfd3e54e6cfe80fd02a058dfa33646994386ab08ad583fbb0
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw mengganti lapisan kompatibilitas mundur yang luas dengan arsitektur plugin
modern yang dibangun dari impor kecil dan terfokus. Jika plugin Anda dibuat sebelum
perubahan tersebut, panduan ini membantu memigrasikannya ke kontrak saat ini.

## Yang berubah

Beberapa permukaan impor yang sangat terbuka sebelumnya memungkinkan plugin mengakses hampir semua hal
dari satu titik masuk:

- **`openclaw/plugin-sdk`** dan **`openclaw/plugin-sdk/compat`** - mengekspor ulang
  puluhan helper selama SDK terfokus sedang dibangun. Kedua root tersebut kini
  telah dihapus; gunakan subpath terdokumentasi sebagai gantinya.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel luas yang mencampurkan event sistem,
  status heartbeat, antrean pengiriman, helper fetch/proxy, helper file,
  tipe persetujuan, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel konfigurasi luas yang dipertahankan
  hanya untuk jendela kompatibilitas berikutnya; helper langsung untuk memuat/menulis saat runtime
  telah dihapus.
- **`openclaw/extension-api`** - bridge yang telah dihapus dan memberi plugin akses langsung
  ke helper sisi host seperti runner agen tertanam.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook khusus runner tertanam
  yang telah dihapus dan mengamati event runner tertanam seperti `tool_result`. Gunakan middleware
  hasil alat agen sebagai gantinya (lihat [Migrasikan ekstensi hasil alat tertanam
  ke middleware](#how-to-migrate)).

SDK root, barrel kompatibilitas, bridge ekstensi, dan factory ekstensi tertanam
telah dihapus. `infra-runtime` dan `config-runtime` tetap tersedia hanya untuk
jendela berikutnya yang dicatat secara terpisah; plugin baru harus menggunakan subpath terfokus.

<Warning>
  Plugin yang mengimpor permukaan root, kompatibilitas, atau ekstensi yang telah dihapus tidak lagi
  dapat dimuat. Ikuti pemetaan di bawah sebelum melakukan peningkatan.
</Warning>

OpenClaw tidak menghapus atau menafsirkan ulang perilaku plugin terdokumentasi dalam
perubahan yang sama dengan diperkenalkannya pengganti. Perubahan kontrak yang merusak kompatibilitas terlebih dahulu
melalui adaptor kompatibilitas, diagnostik, dokumentasi, dan jendela penghentian.
Hal tersebut berlaku untuk impor SDK, field manifes, API penyiapan, hook, dan perilaku
pendaftaran runtime.

### Alasannya

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait.
- **Dependensi melingkar** - ekspor ulang yang luas memudahkan terbentuknya
  siklus impor.
- **Permukaan API yang tidak jelas** - tidak ada cara untuk membedakan ekspor stabil dari ekspor internal.

Setiap `openclaw/plugin-sdk/<subpath>` kini merupakan modul kecil dan mandiri dengan
kontrak terdokumentasi.

Seam kemudahan provider lama untuk channel bawaan juga telah dihapus -
pintasan helper bermerek channel merupakan kemudahan privat mono-repo, bukan
kontrak plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam
workspace plugin bawaan, simpan helper milik provider di
`api.ts` atau `runtime-api.ts` milik plugin tersebut:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` /
  `contract-api.ts` miliknya sendiri.
- OpenAI menyimpan builder provider, helper model default, dan builder provider
  realtime di `api.ts` miliknya sendiri.
- OpenRouter menyimpan builder provider serta helper onboarding/konfigurasi di
  `api.ts` miliknya sendiri.

## Kebijakan kompatibilitas

Pekerjaan kompatibilitas plugin eksternal mengikuti urutan ini:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama yang terhubung melalui adaptor kompatibilitas.
3. Keluarkan diagnostik atau peringatan yang menyebutkan path lama dan penggantinya.
4. Cakup kedua path dalam pengujian.
5. Dokumentasikan penghentian dan jalur migrasinya.
6. Hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis
   mayor.

Jika sebuah field manifes masih diterima, terus gunakan field tersebut hingga dokumentasi dan
diagnostik menyatakan sebaliknya. Kode baru sebaiknya mengutamakan pengganti yang terdokumentasi;
plugin yang sudah ada tidak boleh rusak selama rilis minor biasa.

Audit antrean migrasi saat ini dengan `pnpm plugins:boundary-report`:

| Flag                                                    | Efek                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (atau `pnpm plugins:boundary-report:summary`) | Jumlah ringkas alih-alih detail lengkap.                                        |
| `--json`                                                | Laporan yang dapat dibaca mesin.                                                |
| `--owner <id>`                                          | Filter ke satu plugin atau pemilik kompatibilitas.                              |
| `--fail-on-cross-owner`                                 | Keluar dengan nilai bukan nol untuk impor SDK khusus pemilik lain yang dicadangkan. |
| `--fail-on-eligible-compat`                             | Keluar dengan nilai bukan nol ketika tanggal `removeAfter` milik catatan kompatibilitas yang dihentikan telah berlalu. |
| `--fail-on-unclassified-unused-reserved`                | Keluar dengan nilai bukan nol untuk shim SDK cadangan yang tidak digunakan.     |

`pnpm plugins:boundary-report:ci` berjalan dengan ketiga flag kegagalan. Setiap
catatan kompatibilitas memiliki tanggal `removeAfter` yang eksplisit (bukan "rilis
mayor berikutnya" yang samar) - laporan mengelompokkan catatan yang dihentikan berdasarkan tanggal tersebut, menghitung
referensi kode/dokumentasi lokal, menampilkan impor SDK khusus pemilik lain yang dicadangkan, dan
merangkum bridge SDK host memori privat. Subpath SDK yang dicadangkan harus memiliki
penggunaan pemilik yang dilacak; ekspor cadangan yang tidak digunakan harus dihapus dari SDK
publik.

## Cara melakukan migrasi

<Steps>
  <Step title="Migrasikan helper pemuatan/penulisan konfigurasi runtime">
    Plugin bawaan harus berhenti memanggil `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Utamakan konfigurasi yang sudah
    diteruskan ke jalur pemanggilan aktif. Handler berumur panjang yang memerlukan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Alat agen
    berumur panjang harus membaca `ctx.getRuntimeConfig()` di dalam `execute` agar alat
    yang dibuat sebelum penulisan konfigurasi tetap melihat konfigurasi yang telah diperbarui.

    Penulisan konfigurasi dilakukan melalui helper transaksional dengan kebijakan
    setelah penulisan yang eksplisit:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika perubahan memerlukan
    restart gateway yang bersih, dan `afterWrite: { mode: "none", reason: "..." }`
    hanya ketika pemanggil memiliki tindak lanjut dan sengaja menonaktifkan
    perencana pemuatan ulang. Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk
    pengujian dan pencatatan; gateway tetap bertanggung jawab untuk menerapkan atau
    menjadwalkan restart.

    `loadConfig` dan `writeConfigFile` telah dihapus dari runtime
    plugin. Plugin bawaan dan kode runtime repo dilindungi oleh
    `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan baru dalam plugin produksi
    langsung gagal, penulisan konfigurasi langsung gagal, metode server gateway harus menggunakan
    snapshot runtime permintaan, helper pengiriman/tindakan/klien channel runtime
    harus menerima konfigurasi dari batasnya, dan modul runtime berumur panjang
    tidak mengizinkan panggilan ambient `loadConfig()`.

    Kode plugin baru sebaiknya menghindari barrel `openclaw/plugin-sdk/config-runtime`
    yang luas. Gunakan subpath sempit sesuai kebutuhan:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe konfigurasi seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Pencarian konfigurasi entri plugin | `api.pluginConfig` |
    | Penggabungan konfigurasi | Logika lokal plugin pada batas konfigurasi |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan konfigurasi | `openclaw/plugin-sdk/config-mutation` |
    | Helper penyimpanan sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfigurasi tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input rahasia | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bawaan dan pengujiannya dilindungi pemindai dari barrel
    luas tersebut agar impor dan mock tetap lokal terhadap perilaku yang dibutuhkan. Barrel
    tersebut masih tersedia untuk kompatibilitas eksternal, tetapi kode baru tidak boleh
    bergantung padanya.

  </Step>

  <Step title="Migrasikan ekstensi hasil alat tertanam ke middleware">
    Plugin bawaan harus mengganti handler hasil alat `api.registerEmbeddedExtensionFactory(...)`
    khusus runner tertanam dengan middleware yang netral terhadap
    runtime:

    ```typescript
    // Alat runtime OpenClaw dan alat dinamis runtime Codex (hasil dapat
    // ditransformasi). Hasil alat native Codex juga diteruskan untuk pengamatan,
    // tetapi output yang ditransformasi tidak pernah mencapai model: kontrak hook
    // PostToolUse Codex tidak dapat menggantikan respons alat native.
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

    Plugin terinstal juga dapat mendaftarkan middleware hasil alat ketika diaktifkan
    secara eksplisit dan setiap runtime yang ditargetkan dideklarasikan dalam
    `contracts.agentToolResultMiddleware`. Pendaftaran middleware terinstal
    yang tidak dideklarasikan akan ditolak.

  </Step>

  <Step title="Migrasikan handler native persetujuan ke fakta kapabilitas">
    Plugin channel yang mendukung persetujuan mengekspos perilaku persetujuan native melalui
    `approvalCapability.nativeRuntime` beserta registry konteks runtime
    bersama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`.
    - Pindahkan autentikasi/pengiriman khusus persetujuan dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`.
    - `ChannelPlugin.approvals` telah dihapus dari kontrak
      plugin channel publik; pindahkan field pengiriman/native/render ke
      `approvalCapability`.
    - `plugin.auth` tetap digunakan hanya untuk alur login/logout channel; core tidak
      lagi membaca hook autentikasi persetujuan dari sana.
    - Daftarkan objek runtime milik channel (klien, token, aplikasi Bolt)
      melalui `openclaw/plugin-sdk/channel-runtime-context`.
    - Jangan kirim pemberitahuan pengalihan rute milik plugin dari handler persetujuan native;
      core memiliki pemberitahuan dialihkan-ke-tempat-lain berdasarkan hasil pengiriman aktual.
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang sebenarnya - stub parsial akan
      ditolak.

    Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins) untuk tata letak
    kapabilitas persetujuan saat ini.

  </Step>

  <Step title="Audit perilaku fallback wrapper Windows">
    Jika plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak dapat diresolusikan kini gagal secara tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`:

    ```typescript
    // Sebelum
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Sesudah
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Tetapkan ini hanya untuk pemanggil kompatibilitas tepercaya yang secara sengaja
      // menerima fallback yang dimediasi shell.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak sengaja bergantung pada fallback shell, jangan tetapkan
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Temukan impor yang dihentikan">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Ganti dengan impor terfokus">
    Setiap ekspor dari permukaan lama dipetakan ke path impor modern tertentu:

    ```typescript
    // Sebelum (lapisan kompatibilitas mundur yang tidak digunakan lagi)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Setelah (impor terfokus modern)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk pembantu sisi host, gunakan runtime plugin yang diinjeksi alih-alih
    mengimpor secara langsung:

    ```typescript
    // Sebelum (jembatan extension-api yang tidak digunakan lagi)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Setelah (runtime yang diinjeksi)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk pembantu jembatan lama lainnya:

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
    `openclaw/plugin-sdk/infra-runtime` masih tersedia untuk kompatibilitas
    eksternal, tetapi kode baru harus mengimpor permukaan terfokus yang benar-benar
    dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Pembantu antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Pembantu pengaktifan, peristiwa, dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas saluran | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache deduplikasi dalam memori dan berbasis penyimpanan persisten | `openclaw/plugin-sdk/dedupe-runtime` |
    | Pembantu jalur media/berkas lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Pengambilan yang memperhitungkan dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Pembantu pengambilan melalui proksi dan dengan pengamanan | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/penyelesaian persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Pembantu payload balasan persetujuan dan perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Pembantu pemformatan kesalahan | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transportasi | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Pembantu token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron terbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Penegasan nilai wajib untuk invarian yang dapat dibuktikan | `openclaw/plugin-sdk/expect-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Kunci asinkron lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Kunci berkas | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai dari `infra-runtime`, sehingga kode repo
    tidak dapat mengalami regresi kembali ke barrel yang luas.

  </Step>

  <Step title="Migrasikan pembantu rute saluran">
    Kode rute saluran baru menggunakan `openclaw/plugin-sdk/channel-route`. Nama
    kunci rute yang lebih lama tetap tersedia sebagai alias kompatibilitas:

    | Pembantu lama | Pembantu modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    Pembantu rute modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, deduplikasi
    pesan masuk, pengiriman cron, dan perutean sesi.

    Jangan tambahkan penggunaan baru `ChannelMessagingAdapter.parseExplicitTarget` atau
    `resolveChannelRouteTargetWithParser(...)` dari
    `plugin-sdk/channel-route` — semuanya tidak digunakan lagi dan hanya dipertahankan untuk
    plugin lama. Plugin saluran baru harus menggunakan
    `messaging.targetResolver.resolveTarget(...)` untuk normalisasi ID target
    dan fallback ketika direktori tidak menemukan hasil,
    `messaging.inferTargetChatType(...)` ketika inti memerlukan jenis peer sejak awal,
    serta `messaging.resolveOutboundSessionRoute(...)` untuk identitas sesi
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

Peta ekspor paket publik adalah sumber kebenaran untuk subjalur SDK yang dapat
diimpor. Gunakan panduan SDK berdasarkan topik yang ditautkan dari [ikhtisar SDK](/id/plugins/sdk-overview)
dan utamakan subjalur publik terdokumentasi yang paling sempit. Inventaris compiler dalam
`scripts/lib/plugin-sdk-entrypoints.json` juga memuat entri lokal privat yang digunakan
untuk membangun plugin bawaan; keberadaannya di sana tidak menjadikannya ekspor paket publik.

Tabel ini adalah subset migrasi umum, bukan keseluruhan permukaan SDK.
Inventaris titik masuk compiler berada di `scripts/lib/plugin-sdk-entrypoints.json`;
ekspor paket dihasilkan dari subset publik.

Jalur pembantu khusus plugin bawaan telah dihentikan dari peta ekspor
SDK publik, kecuali fasad kompatibilitas yang didokumentasikan secara eksplisit seperti
shim `plugin-sdk/discord` yang tidak digunakan lagi dan dipertahankan untuk plugin eksternal yang masih
mengimpor paket `@openclaw/discord` yang dipublikasikan secara langsung. Pembantu khusus pemilik
berada di dalam paket plugin pemiliknya; perilaku host bersama dipindahkan
melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime`, dan API plugin yang diinjeksi.

Gunakan impor paling sempit yang sesuai dengan tugasnya. Jika Anda tidak dapat menemukan ekspor,
periksa sumber di `src/plugin-sdk/` atau tanyakan kepada maintainer kontrak
generik mana yang harus memilikinya.

## Permukaan kompatibilitas yang dihapus

Penyisiran Juli 2026 menghapus barrel SDK root dan compat, jembatan API ekstensi,
alias subjalur SDK yang kedaluwarsa, subjalur SDK yang tidak digunakan, serta ekspor
publik untuk modul SDK khusus bawaan. Modul khusus bawaan tetap tersedia bagi
pemiliknya di repositori melalui pemetaan build lokal privat; modul tersebut tidak
dapat diimpor dari paket yang dipublikasikan.

### Publikasi penyedia API global proses

`registerApiProvider(...)` dan `unregisterApiProviders(...)` dihapus dari
`openclaw/plugin-sdk/llm`. Keduanya memublikasikan transportasi API ke state global
proses, yang kemudian harus disalin oleh runtime model milik siklus hidup ke setiap
registry yang telah disiapkan.

Plugin penyedia harus mendaftarkan penyedia inferensi teks melalui
`api.registerProvider(...)`. Kode dan pengujian milik host yang membuat
`ApiRegistry` harus mendaftar langsung pada registry tersebut agar kepemilikan
penyedia dan pembongkaran tetap terbatas pada runtime yang telah disiapkan.

### Barrel pengujian privat

`openclaw/plugin-sdk/testing` bersifat lokal repo dan dikecualikan dari artefak
paket yang dirilis, sehingga dihapus sebelum tanggal `removeAfter` 2026-07-28. Pengujian
repositori menggunakan subjalur terfokus seperti `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`,
`plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures`.

## Referensi migrasi

Pemetaan ini mencakup permukaan yang dihapus pada Juli 2026 serta penghentian
aktif dengan jangka waktu yang lebih panjang. Pemetaan merupakan panduan migrasi, bukan bukti bahwa
permukaan lama masih tersedia; lihat registry kompatibilitas dan linimasa
penghapusan untuk status terkini.

<AccordionGroup>
  <Accordion title="pembuat bantuan command-auth -> command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, diimpor
    dari subjalur yang lebih sempit. Ekspor ulang kompatibilitas `command-auth`
    telah dihapus.

    ```typescript
    // Sebelum
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Setelah
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Pembantu pengendalian sebutan -> resolveInboundMentionDecision">
    **Lama**: `resolveMentionGating(params)` dan
    `resolveMentionGatingWithBypass(params)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` — satu objek
    keputusan alih-alih dua bentuk pemanggilan terpisah.

    Diterapkan di Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp, dan Zalo. Model peristiwa `app_mention` milik Slack
    tidak menggunakan pembantu ini.

  </Accordion>

  <Accordion title="Shim runtime saluran dan pembantu tindakan saluran">
    `openclaw/plugin-sdk/channel-runtime` telah dihapus. Gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Pembantu skema pesan native dalam `openclaw/plugin-sdk/channel-actions`
    dihapus bersama ekspor saluran "actions" mentah. Ekspos kemampuan
    melalui permukaan semantik `presentation` sebagai gantinya — plugin saluran
    mendeklarasikan apa yang direndernya (kartu, tombol, pilihan), bukan nama
    tindakan mentah yang diterimanya.

  </Accordion>

  <Accordion title="Pembantu tool() penyedia pencarian web -> createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` secara langsung pada plugin penyedia.
    OpenClaw tidak lagi memerlukan pembantu SDK untuk mendaftarkan wrapper alat.

  </Accordion>

  <Accordion title="Envelope saluran teks biasa -> BodyForAgent">
    **Lama**: `api.runtime.channel.reply.formatInboundEnvelope(...)` (dan
    bidang `channelEnvelope` pada objek pesan masuk) untuk membuat envelope
    prompt teks biasa datar dari pesan saluran masuk.

    **Baru**: `BodyForAgent` beserta blok konteks pengguna terstruktur. Plugin
    saluran melampirkan metadata perutean (utas, topik, balas-ke, reaksi) sebagai
    bidang bertipe alih-alih menggabungkannya ke dalam string prompt. Pembantu
    `formatAgentEnvelope(...)` masih didukung untuk envelope
    sintetis yang ditujukan bagi asisten, tetapi envelope teks biasa masuk sedang dalam proses
    dihentikan.

    Area yang terdampak: `inbound_claim`, `message_received`, dan setiap plugin
    saluran kustom yang melakukan pascapemrosesan pada teks envelope lama.

  </Accordion>

  <Accordion title="hook deactivate -> gateway_stop">
    **Lama**: `api.on("deactivate", handler)`.

    **Baru**: `api.on("gateway_stop", handler)`. Kontrak pembersihan saat penghentian
    tetap sama; hanya nama hook yang berubah.

    ```typescript
    // Sebelum
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Setelah
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` tetap terhubung sebagai alias kompatibilitas yang tidak digunakan lagi hingga
    dihapus setelah 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning -> pengikatan utas inti">
    **Lama**: `api.on("subagent_spawning", handler)` yang mengembalikan
    `threadBindingReady` atau `deliveryOrigin`.

    **Baru**: biarkan inti menyiapkan pengikatan subagen `thread: true` melalui
    adaptor pengikatan sesi saluran. Gunakan `api.on("subagent_spawned", handler)`
    hanya untuk observasi setelah peluncuran.

    ```typescript
    // Sebelum
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Setelah
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, dan
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` tetap hanya sebagai
    permukaan kompatibilitas yang tidak digunakan lagi selama plugin eksternal bermigrasi, lalu dihapus
    setelah 2026-08-30.

  </Accordion>

  <Accordion title="Tipe penemuan penyedia -> tipe katalog penyedia">
    Empat alias tipe penemuan kini menjadi wrapper tipis untuk tipe era
    katalog:

    | Alias lama                 | Tipe baru                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Alias tersebut dan kumpulan statis lama `ProviderCapabilities` telah
    dihapus. Plugin penyedia
    harus menggunakan hook penyedia eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn`, bukan objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan penalaran -> resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan
    daftar tingkat yang diperingkat. OpenClaw menurunkan tingkat nilai tersimpan yang sudah usang berdasarkan peringkat profil
    secara otomatis.

    Konteks tersebut mencakup fakta `provider`, `modelId`, gabungan `reasoning` opsional,
    dan gabungan fakta model `compat` opsional. Plugin penyedia dapat menggunakan
    fakta katalog tersebut untuk mengekspos profil khusus model hanya jika kontrak
    permintaan yang dikonfigurasi mendukungnya.

    Implementasikan satu hook, bukan tiga. Hook lama telah dihapus.

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
    Bidang manifes **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan pencarian variabel lingkungan yang sama ke `setup.providers[].envVars`
    pada manifes. Ini menggabungkan metadata lingkungan penyiapan/status di satu tempat
    dan menghindari menjalankan runtime plugin hanya untuk menjawab pencarian variabel lingkungan.

    `providerAuthEnvVars` tidak lagi diterima.

  </Accordion>

  <Accordion title="Pendaftaran plugin memori -> registerMemoryCapability">
    **Lama**: tiga panggilan terpisah - `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API status memori -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan pendaftaran. Pembantu prompt dan korpus tambahan
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    tidak terpengaruh.

  </Accordion>

  <Accordion title="API penyedia embedding memori">
    **Lama**: `api.registerMemoryEmbeddingProvider(...)` ditambah
    `contracts.memoryEmbeddingProviders`.

    **Baru**: `api.registerEmbeddingProvider(...)` ditambah
    `contracts.embeddingProviders`.

    Kontrak penyedia embedding generik dapat digunakan kembali di luar memori dan merupakan
    jalur yang didukung untuk penyedia baru. API pendaftaran khusus memori
    tetap terhubung sebagai kompatibilitas yang tidak digunakan lagi selama penyedia yang ada
    bermigrasi. Pemeriksaan plugin melaporkan penggunaan non-bawaan sebagai utang
    kompatibilitas.

  </Accordion>

  <Accordion title="Hasil pengiriman kanal mentah -> OutboundDeliveryResult">
    **Lama**: kembalikan `{ ok, messageId, error }` melalui
    `ChannelSendRawResult` dan normalkan dengan
    `createRawChannelSendResultAdapter(...)`.

    **Baru**: kembalikan bidang `OutboundDeliveryResult` dan lampirkan kanal dengan
    `createAttachedChannelResultAdapter(...)`. Pengiriman yang gagal harus melempar pengecualian,
    bukan mengembalikan string kesalahan. Jenis hasil mentah tetap tersedia hingga
    rilis mayor SDK plugin berikutnya.

  </Accordion>

  <Accordion title="Jenis pesan sesi subagen diganti namanya">
    Dua alias jenis lama masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` tidak digunakan lagi dan digantikan oleh
    `getSessionMessages`. Tanda tangan sama; metode lama meneruskan panggilan ke
    metode baru.

  </Accordion>

  <Accordion title="API berkas sesi dan transkrip yang dihapus">
    Peralihan sesi/transkrip ke SQLite menghapus atau menghentikan penggunaan API yang menghadap plugin
    yang mengekspos penyimpanan `sessions.json` aktif, jalur transkrip JSONL, atau daftar
    berkas sesi. Plugin runtime harus menggunakan identitas sesi dan pembantu runtime SDK,
    bukan menyelesaikan atau mengubah berkas aktif.

    | Permukaan yang dimigrasikan | Pengganti |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)`, dan `resolveSessionStoreEntry(...)` yang tidak digunakan lagi | `getSessionEntry(...)`, `listSessionEntries(...)`, dan mutasi sesi tingkat baris. |
    | `resolveSessionFilePath(...)` yang tidak digunakan lagi | Identitas sesi (`sessionKey`, `sessionId`, dan pembantu target runtime SDK) serta metode Gateway yang beroperasi pada sesi saat ini. |
    | `saveSessionStore(...)` yang dihapus | API runtime sesi milik Gateway; kode plugin harus meminta atau mengubah status sesi melalui pembantu runtime/konteks yang terdokumentasi, bukan menulis berkas penyimpanan aktif. |
    | `resolveSessionTranscriptPathInDir(...)` dan `resolveAndPersistSessionFile(...)` yang dihapus | Identitas sesi dan metode Gateway yang beroperasi pada sesi saat ini. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Pembaca transkrip berbasis identitas yang diekspos oleh konteks runtime saat ini, atau metode riwayat/sesi Gateway ketika plugin berada di luar jalur pemilik transkrip. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` dengan `agentId`, `sessionKey`, dan `sessionId`. |
    | Masukan sinkronisasi memori seperti `sessionFiles` | Sumber transkrip/sesi berbasis identitas yang disediakan oleh host; jangan telusuri berkas JSONL aktif untuk sesi langsung. |
    | Opsi runtime bernama `transcriptPath` atau `sessionFile` untuk sesi aktif | Objek `sessionTarget`/target runtime yang membawa identitas sesi netral-penyimpanan. |

    Berkas transkrip JSONL lama tetap valid sebagai artefak impor, arsip, ekspor, dan
    dukungan. Berkas tersebut tidak lagi menjadi kontrak runtime kondisi tetap untuk
    sesi aktif.

    Plugin resmi yang dirilis dengan `v2026.7.1-beta.5` mengimpor empat
    pembantu yang tidak digunakan lagi di atas. `openclaw/plugin-sdk/session-store-runtime` mempertahankan
    jembatan persis tersebut hingga 2026-10-12; plugin baru harus menggunakan penggantinya.
    `resolveStorePath(...)` tetap menjadi pembantu SDK yang didukung dan bukan bagian dari
    penghentian penggunaan ini.

    `openclaw plugins inspect --all --runtime` melaporkan plugin non-bawaan yang
    kesalahan pemuatan atau diagnostiknya masih merujuk pada API berkas yang dihapus ini. Penyisiran
    advisori `@openclaw/plugin-inspector` harus menggunakan versi `0.3.17` atau
    yang lebih baru agar pemindaian paket eksternal juga menandai pembantu sesi seluruh penyimpanan,
    pembantu jalur berkas sesi, target berkas transkrip lama, dan pembantu
    transkrip tingkat rendah sebelum rilis.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan pengakses alur tugas
    langsung.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi TaskFlow terkelola
    untuk plugin yang membuat, memperbarui, membatalkan, atau menjalankan tugas turunan dari suatu
    alur. Gunakan `runtime.tasks.flows` ketika plugin hanya memerlukan
    pembacaan berbasis DTO.

    ```typescript
    // Sebelumnya
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Sesudahnya
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Alias lama dihapus pada Juli 2026.

  </Accordion>

  <Accordion title="Factory ekstensi tertanam -> middleware hasil alat agen">
    Dicakup dalam [Cara bermigrasi](#how-to-migrate) di atas. Disertakan di sini untuk
    kelengkapan: jalur `api.registerEmbeddedExtensionFactory(...)` khusus runner tertanam
    yang dihapus digantikan oleh `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime eksplisit
    dalam `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    Alias SDK akar `OpenClawSchemaType` telah dihapus. Gunakan nama kanonis
    `OpenClawConfig`.

    ```typescript
    // Sebelumnya
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Sesudahnya
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Penghentian penggunaan tingkat ekstensi (di dalam plugin kanal/penyedia bawaan di bawah
`extensions/`) dilacak dalam barrel `api.ts` dan `runtime-api.ts`
miliknya sendiri. Penghentian ini tidak memengaruhi kontrak plugin pihak ketiga dan tidak dicantumkan
di sini. Jika barrel lokal plugin bawaan digunakan secara langsung, baca
komentar penghentian penggunaan dalam barrel tersebut sebelum melakukan peningkatan.
</Note>

## Migrasi Talk dan suara waktu nyata

Kode suara waktu nyata, telefoni, rapat, dan Talk peramban berbagi satu pengontrol
sesi Talk yang diekspor oleh `openclaw/plugin-sdk/realtime-voice`. Pengontrol tersebut
memiliki amplop peristiwa Talk umum, status giliran aktif, status pengambilan,
status audio keluaran, riwayat peristiwa terbaru, dan penolakan giliran usang.
Plugin penyedia memiliki sesi waktu nyata khusus vendor. Plugin rapat-peramban
menggunakan `openclaw/plugin-sdk/meeting-runtime` untuk mekanisme sesi, peramban, audio, host-node,
konsultasi-agen, dan panggilan suara, lalu mengimplementasikan `MeetingPlatformAdapter`
untuk aturan URL, skrip DOM, pemetaan tindakan manual, takarir, pembuatan, dan rencana
akses masuk. API REST platform, OAuth, artefak, pemilih, dan nama wire tetap berada dalam
plugin. Rencana izin peramban menerima URL rapat yang diminta agar setiap
platform hanya dapat memberikan izin untuk origin yang didukungnya secara tepat. Runtime sesi juga harus
menormalkan kesehatan langsung khusus platform setelah kepergian dari peramban dikonfirmasi;
bidang transkrip historis dapat tetap ada, tetapi kesiapan takarir dan audio tidak boleh
tetap aktif setelah keluar.

Semua permukaan bawaan berjalan pada pengontrol bersama: relay peramban,
serah-terima ruang terkelola, waktu nyata panggilan suara, STT streaming panggilan suara, waktu nyata Google
Meet, dan tekan-untuk-bicara native. Gateway mengiklankan satu kanal peristiwa Talk langsung
dalam `hello-ok.features.events`: `talk.event`.

Kode baru tidak boleh memanggil `createTalkEventSequencer(...)` secara langsung kecuali
mengimplementasikan adaptor tingkat rendah atau fixture pengujian. Gunakan pengontrol bersama agar
peristiwa dengan cakupan giliran tidak dapat dipancarkan tanpa id giliran, panggilan `turnEnd` /
`turnCancel` yang usang tidak dapat menghapus giliran aktif yang lebih baru, dan peristiwa
siklus hidup audio keluaran tetap konsisten di seluruh telefoni, rapat, relay peramban,
serah-terima ruang terkelola, dan klien Talk native.

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

Sesi WebRTC/websocket-penyedia milik peramban menggunakan `talk.client.create`,
karena peramban memiliki negosiasi penyedia dan transportasi media, sedangkan
Gateway memiliki kredensial, instruksi, dan kebijakan alat. `talk.session.*` adalah
permukaan umum yang dikelola Gateway untuk waktu nyata gateway-relay, transkripsi
gateway-relay, dan sesi STT/TTS native ruang terkelola.

Konfigurasi lama yang menempatkan pemilih waktu nyata di samping `talk.provider` /
`talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; Talk runtime
tidak menafsirkan ulang konfigurasi penyedia ucapan/TTS sebagai konfigurasi penyedia waktu nyata.

Kombinasi `talk.session.create` yang didukung sengaja dibatasi:

| Mode            | Transport       | Brain           | Pemilik            | Catatan                                                                                                                    |
| --------------- | --------------- | --------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio penyedia dupleks penuh yang dijembatani melalui Gateway; pemanggilan alat dirutekan melalui alat agent-consult.       |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya STT streaming; pemanggil mengirim audio masukan dan menerima peristiwa transkrip.                                    |
| `stt-tts`       | `managed-room`  | `agent-consult` | Ruang native/klien | Ruang bergaya tekan-untuk-bicara dan walkie-talkie, dengan klien mengelola perekaman/pemutaran dan Gateway mengelola status giliran. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Ruang native/klien | Mode ruang khusus admin untuk antarmuka pihak pertama tepercaya yang menjalankan tindakan alat Gateway secara langsung.     |

Peta metode untuk pembaca yang bermigrasi dari keluarga `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` lama (semuanya telah dihapus):

| Lama                             | Baru                                                     |
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

Kosakata kontrol terpadu juga sengaja dibuat terbatas:

| Metode                          | Berlaku untuk                                            | Kontrak                                                                                                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan potongan audio PCM base64 ke sesi penyedia yang dimiliki oleh koneksi Gateway yang sama.                                                                                                                        |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai giliran pengguna di ruang terkelola.                                                                                                                                                                                |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri giliran aktif setelah validasi giliran kedaluwarsa.                                                                                                                                                                |
| `talk.session.cancelTurn`       | semua sesi milik Gateway                                | Batalkan pekerjaan perekaman/penyedia/agen/TTS yang aktif untuk suatu giliran.                                                                                                                                            |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan keluaran audio asisten tanpa harus mengakhiri giliran pengguna.                                                                                                                                                  |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan pemanggilan alat penyedia setelah penyelesaian asinkron apa pun yang diekspos oleh jembatannya; teruskan `options.willContinue` untuk keluaran sementara atau, jika didukung, `options.suppressResponse` untuk menghindari respons asisten lainnya. |
| `talk.session.steer`            | sesi Talk yang didukung agen                              | Kirim kontrol lisan `status`, `steer`, `cancel`, atau `followup` ke eksekusi tertanam aktif yang ditentukan dari sesi Talk.                                                                        |
| `talk.session.close`            | semua sesi terpadu                                       | Hentikan sesi relai atau cabut status ruang terkelola, lalu lupakan ID sesi terpadu.                                                                                                                                       |

Jangan memperkenalkan kasus khusus penyedia atau platform di inti agar ini berfungsi.
Inti mengelola semantik sesi Talk. Plugin penyedia mengelola penyiapan sesi vendor.
Voice-call dan Google Meet mengelola adaptor telepon/pertemuan. Browser dan aplikasi
native mengelola UX perekaman/pemutaran perangkat.

## Linimasa penghapusan

| Kapan                                       | Yang terjadi                                                                                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sekarang**                                | Permukaan usang yang mendukung peringatan memancarkan peringatan runtime; penjaga repositori menolak impor SDK usang dari inti dan Plugin bawaan. |
| **Tanggal `removeAfter` setiap catatan kompatibilitas** | Permukaan tertentu tersebut dapat dihapus; `pnpm plugins:boundary-report --fail-on-eligible-compat` menggagalkan CI setelah tanggal tersebut berlalu. |
| **Rilis mayor berikutnya**                  | Semua permukaan yang masih belum dimigrasikan akan dihapus; Plugin yang masih menggunakannya akan gagal.                                         |

Subpath SDK publik yang tersisa di bawah ini memiliki jangka waktu penghapusan
yang didukung registri. Baris 30 Juli dihapus setelah penyisiran awal yang
diotorisasi pengelola: subpath yang tidak digunakan dihapus, alias kompatibilitas
sebelumnya dihapus, dan modul khusus bawaan diturunkan menjadi pemetaan build lokal privat.

| `removeAfter` | Tingkat                            | Subpath SDK                                                                                                                                                            |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | Pengusangan kompatibilitas sebelumnya | `agent-config-primitives`, `channel-logging`, `channel-secret-runtime`, `channel-streaming`, `group-access`, `inbound-reply-dispatch`, `matrix`, `text-runtime`, `zod` |
| `2026-09-01`  | Pengusangan kompatibilitas sebelumnya | `channel-lifecycle`, `channel-message`, `channel-reply-pipeline`, `config-runtime`, `infra-runtime`                                                                    |

Semua Plugin inti telah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya. Jalankan `pnpm plugins:boundary-report` untuk melihat
catatan kompatibilitas yang tenggatnya paling dekat bagi permukaan yang digunakan Plugin Anda.

## Menonaktifkan peringatan untuk sementara

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - buat Plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi lengkap impor subpath
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) - membuat Plugin saluran
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - membuat Plugin penyedia
- [Internal Plugin](/id/plugins/architecture) - pembahasan mendalam tentang arsitektur
- [Manifes Plugin](/id/plugins/manifest) - referensi skema manifes
