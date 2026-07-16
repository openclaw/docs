---
read_when:
    - Anda ingin menggunakan harness app-server Codex resmi
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih beralih kembali ke OpenClaw
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex resmi
title: Harness Codex
x-i18n:
    generated_at: "2026-07-16T18:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin resmi `codex` menjalankan giliran agen OpenAI tersemat melalui Codex
app-server, bukan melalui harness bawaan OpenClaw. Codex memiliki
sesi agen tingkat rendah: melanjutkan thread secara native, melanjutkan alat secara native,
compaction native, dan eksekusi app-server. OpenClaw tetap memiliki saluran
obrolan, file sesi, pemilihan model, alat dinamis OpenClaw, persetujuan,
pengiriman media, dan cerminan transkrip yang terlihat.

Gunakan referensi model OpenAI kanonis seperti `openai/gpt-5.6-sol`. Jangan mengonfigurasi
referensi GPT Codex lama; tempatkan urutan autentikasi agen OpenAI di bawah `auth.order.openai`.
ID profil autentikasi Codex lama dan entri urutan autentikasi Codex lama
diperbaiki oleh `openclaw doctor --fix`.

Saat kebijakan runtime penyedia/model tidak ditetapkan atau `auto`, prefiks `openai/*` saja
tidak pernah memilih harness ini. OpenAI dapat memilih Codex secara implisit hanya untuk
rute HTTPS resmi Platform Responses atau ChatGPT Responses yang tepat tanpa
penggantian permintaan yang ditulis pengguna. Lihat
[runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).
Jika Codex memiliki autentikasi sebelum perutean Platform versus ChatGPT diketahui, OpenClaw
tetap mewajibkan setiap rute kandidat untuk menyatakan kompatibilitas Codex. Kepemilikan
autentikasi native saja tidak pernah melewati pemeriksaan rute tersebut.

Saat tidak ada sandbox OpenClaw yang aktif, OpenClaw memulai thread Codex app-server
dengan mode kode native Codex diaktifkan (code-mode-only tetap nonaktif secara default), sehingga
kemampuan ruang kerja/kode native tetap tersedia bersama alat dinamis
OpenClaw yang dirutekan melalui jembatan `item/tool/call` app-server. Sandbox
OpenClaw yang aktif atau kebijakan alat terbatas menonaktifkan mode kode native
sepenuhnya, kecuali Anda mengaktifkan jalur eksperimental exec-server sandbox.

Dengan `tools.exec.host: "auto"` default dan tanpa sandbox OpenClaw yang aktif,
Codex juga menerima alat `node_exec` dan `node_process` untuk perintah pada node yang dipasangkan.
Shell native tetap berada di host dan ruang kerja Codex app-server
(lokal Gateway untuk penerapan stdio default); `node_exec` memilih node berdasarkan
nama atau ID dan mempertahankan kebijakan persetujuan node OpenClaw. Jika daftar izin
runtime terbatas menonaktifkan Mode Kode native dan menyebabkan giliran tidak memiliki
lingkungan eksekusi, OpenClaw tetap menyediakan alat `exec` dan `process`
yang telah difilter oleh kebijakannya untuk eksekusi langsung tanpa sandbox.

Fitur native Codex ini terpisah dari
[mode kode OpenClaw](/id/reference/code-mode), runtime QuickJS-WASI opsional
untuk proses OpenClaw generik dengan bentuk input `exec` yang berbeda. Untuk
pemisahan model/penyedia/runtime yang lebih luas, mulailah dengan
[Runtime agen](/id/concepts/agent-runtimes): `openai/gpt-5.6-sol` adalah referensi
model, `codex` adalah runtime, dan Telegram, Discord, Slack, atau
saluran lain adalah permukaan komunikasi.

## Persyaratan

- Plugin resmi `@openclaw/codex` terinstal. Sertakan `codex` dalam
  `plugins.allow` jika konfigurasi Anda menggunakan daftar izin.
- Codex app-server `0.143.0` atau yang lebih baru. Plugin mengelola biner
  yang kompatibel secara default, sehingga perintah `codex` pada `PATH` tidak memengaruhi
  proses mulai normal.
- Autentikasi Codex melalui `openclaw models auth login --provider openai`, akun
  app-server yang sudah ada di direktori home Codex milik agen, atau
  profil autentikasi kunci API Codex yang eksplisit.

Untuk prioritas autentikasi, isolasi lingkungan, perintah app-server khusus,
penemuan model, dan daftar lengkap bidang konfigurasi, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Instal Plugin resmi, lalu masuk dengan OAuth Codex:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Aktifkan Plugin `codex` dan pilih model agen OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Jika konfigurasi Anda menggunakan `plugins.allow`, tambahkan juga `codex` di sana:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Mulai ulang Gateway setelah mengubah konfigurasi Plugin. Jika obrolan sudah memiliki
sesi, jalankan `/new` atau `/reset` terlebih dahulu agar giliran berikutnya menentukan harness
dari konfigurasi saat ini.

## Bagikan thread dengan Codex Desktop dan CLI

`appServer.homeScope: "agent"` default mengisolasi setiap agen OpenClaw dari
status native Codex milik operator. Agar pemilik dapat memeriksa dan mengelola
thread native yang sama dengan yang ditampilkan oleh Codex Desktop dan CLI Codex, aktifkan
direktori home Codex pengguna:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Mode direktori home pengguna mendukung proses stdio terkelola lokal atau transport
soket Unix bersama. Mode ini menggunakan `$CODEX_HOME` jika ditetapkan dan `~/.codex` jika tidak, termasuk
autentikasi, konfigurasi, Plugin, dan penyimpanan thread native Codex di direktori home tersebut. OpenClaw
tidak menyuntikkan profil autentikasi OpenClaw ke app-server ini.

Giliran pemilik memperoleh alat `codex_threads`: mencantumkan, mencari, membaca, membuat fork, mengganti nama,
mengarsipkan, dan memulihkan thread native. Buat fork thread untuk melanjutkannya di
OpenClaw; fork tersebut terhubung ke sesi OpenClaw saat ini dan tetap
terlihat oleh klien native Codex lainnya. Pengarsipan memerlukan konfirmasi
eksplisit bahwa thread telah ditutup di tempat lain. Saat pengawasan juga
diaktifkan, bidang dan mutasi transkrip memerlukan pengaktifan
`supervision.allowRawTranscripts` atau `supervision.allowWriteControls` yang sesuai.

Jangan melanjutkan atau menulis thread yang sama secara bersamaan melalui App Server stdio
terkelola yang independen. Codex mengoordinasikan penulis aktif di dalam satu App Server, bukan
di antara proses yang terpisah. Pembuatan fork adalah jalur koeksistensi yang aman untuk sesi
stdio direktori home pengguna biasa.

`appServer.homeScope: "user"` saja tidak mengendalikan katalog armada. Penemuan
sesi native diaktifkan selama Plugin aktif; tetapkan
`sessionCatalog.enabled: false` untuk menghapusnya dari bilah sisi OpenClaw tanpa
menonaktifkan Codex. Katalog menggunakan koneksi pengawasan terpisah; tanpa
pengaturan koneksi `appServer` yang eksplisit, koneksi tersebut secara default menggunakan stdio
terkelola di direktori home pengguna, sedangkan harness biasa tetap tercakup pada agen. Pengaturan
`appServer` yang eksplisit dipatuhi oleh kedua jalur. Tetapkan `homeScope: "user"`
secara eksplisit, seperti di atas, jika harness biasa juga harus berbagi status native.

## Awasi sesi Codex

Plugin `codex` yang sama dapat mencantumkan sesi Codex yang tidak diarsipkan dari komputer
Gateway dan node berpasangan yang telah diikutsertakan. Sesi lokal Gateway yang tersimpan atau menganggur dapat
membuat Obrolan yang dikunci ke model dan mencerminkan riwayat pengguna serta asisten
tersimpan yang dibatasi. Pengikatan privatnya menggunakan koneksi pengawasan untuk snapshot
native, cabang kanonis, dan giliran berikutnya, sementara sesi Codex biasa tetap
tercakup pada agen. Proses mulai kanonis pertama menggunakan model dan penyedia yang persis
dikembalikan Codex untuk fork snapshot. Proses melanjutkan berikutnya menyerahkan pemilihan kepada
konfigurasi native Codex; model OpenClaw luar dan rantai fallback tidak pernah
menggantikannya. Baris tersimpan dan menganggur dapat diarsipkan setelah konfirmasi eksplisit
bahwa tidak ada pelaksana lain. Sumber aktif tidak dapat membuat cabang atau diarsipkan; Obrolan
terawasi yang sudah ada tetap dapat dibuka. Sesi node berpasangan tetap hanya berupa metadata.

Lihat [Awasi sesi Codex](/plugins/codex-supervision) untuk penyiapan, aturan
percabangan, batas node berpasangan, paparan metadata, dan pemecahan masalah.

## Konfigurasi

| Kebutuhan                                           | Tetapkan                                                                                         | Lokasi                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Aktifkan harness                                    | `plugins.entries.codex.enabled: true`                                                            | Konfigurasi OpenClaw               |
| Sembunyikan penemuan sesi native Codex              | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Konfigurasi Plugin Codex           |
| Pertahankan instalasi Plugin dalam daftar izin      | Sertakan `codex` dalam `plugins.allow`                                                               | Konfigurasi OpenClaw               |
| Izinkan giliran OpenAI yang memenuhi syarat menggunakan Codex secara implisit | Rute HTTPS resmi Responses/ChatGPT yang tepat, tanpa penggantian permintaan yang ditulis pengguna, runtime tidak ditetapkan/`auto` | Konfigurasi penyedia/model OpenAI |
| Masuk dengan OAuth ChatGPT/Codex                    | `openclaw models auth login --provider openai`                                                   | Profil autentikasi CLI             |
| Tambahkan cadangan kunci API untuk proses Codex     | Profil kunci API `openai:*` yang dicantumkan setelah autentikasi langganan dalam `auth.order.openai`                 | Profil autentikasi CLI + konfigurasi OpenClaw |
| Gagal secara tertutup saat Codex tidak tersedia     | Penyedia atau model `agentRuntime.id: "codex"`                                                     | Konfigurasi model/penyedia OpenClaw |
| Gunakan lalu lintas API OpenAI langsung             | Penyedia atau model `agentRuntime.id: "openclaw"` dengan autentikasi OpenAI normal                          | Konfigurasi model/penyedia OpenClaw |
| Sesuaikan perilaku app-server                       | `plugins.entries.codex.config.appServer.*`                                                       | Konfigurasi Plugin Codex           |
| Aktifkan aplikasi Plugin native Codex               | `plugins.entries.codex.config.codexPlugins.*`                                                    | Konfigurasi Plugin Codex           |
| Aktifkan Penggunaan Komputer Codex                  | `plugins.entries.codex.config.computerUse.*`                                                     | Konfigurasi Plugin Codex           |

Utamakan `auth.order.openai` untuk pengurutan yang mendahulukan langganan dan menggunakan kunci API sebagai cadangan.
ID profil autentikasi Codex lama dan urutan autentikasi Codex lama yang sudah ada adalah
status lama khusus doctor; jangan tulis referensi GPT Codex lama yang baru.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Untuk rute efektif yang kompatibel dengan Codex, kedua profil di atas tetap menjadi kandidat
untuk proses Codex yang sama. Urutan profil memilih kredensial, bukan runtime.
Mengubah urutan autentikasi tidak membuat rute khusus, Completions, HTTP, atau
rute dengan penggantian permintaan menjadi kompatibel dengan Codex.

### Compaction

Jangan tetapkan `compaction.model` atau `compaction.provider` pada agen yang didukung Codex.
Codex melakukan compaction melalui status thread app-server native miliknya, sehingga
OpenClaw mengabaikan penggantian peringkas lokal tersebut saat runtime, dan
`openclaw doctor --fix` menghapusnya saat agen menggunakan Codex.

Lossless tetap didukung sebagai mesin konteks untuk perakitan, penyerapan, dan
pemeliharaan di sekitar giliran Codex, yang dikonfigurasi melalui
`plugins.slots.contextEngine: "lossless-claw"` dan
`plugins.entries.lossless-claw.config.summaryModel`, bukan melalui
`agents.defaults.compaction.provider`. `openclaw doctor --fix` memigrasikan
bentuk `compaction.provider: "lossless-claw"` lama ke slot mesin konteks
Lossless saat Codex merupakan runtime aktif, tetapi Codex native tetap
memiliki compaction. Harness app-server native mendukung mesin konteks
yang memerlukan perakitan sebelum prompt; backend CLI generik, termasuk `codex-cli`,
tidak menyediakan kemampuan host tersebut.

Untuk agen yang didukung Codex, `/compact` memulai compaction Codex app-server
native pada thread yang terikat. OpenClaw tidak menunggu penyelesaian,
memberlakukan batas waktu OpenClaw, memulai ulang app-server bersama, atau beralih sebagai fallback ke
mesin konteks maupun peringkas OpenAI publik. Jika pengikatan thread Codex native
hilang atau kedaluwarsa, perintah gagal secara tertutup alih-alih diam-diam
mengganti backend compaction.

Bagian lain halaman ini membahas bentuk penerapan, perutean gagal-tertutup, kebijakan
persetujuan guardian, Plugin native Codex, dan Penggunaan Komputer. Untuk daftar lengkap
opsi, nilai default, enum, penemuan, isolasi lingkungan, batas waktu, dan
bidang transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` dalam percakapan tempat Anda mengharapkan Codex. Giliran agen OpenAI
yang didukung Codex menampilkan:

```text
Runtime: OpenAI Codex
```

Kemudian periksa status app-server Codex:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, batas laju, server
MCP, dan Skills. `/codex models` mencantumkan katalog app-server Codex aktif
untuk harness dan akun tersebut. Jika `/status` tidak sesuai harapan, lihat
[Pemecahan masalah](#troubleshooting).

## Perutean dan pemilihan model

Pisahkan referensi penyedia dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk pemilihan model OpenAI kanonis. Prefiks saja
  tidak pernah memilih Codex.
- Jika runtime tidak ditetapkan atau `auto`, hanya rute HTTPS Platform Responses
  atau ChatGPT Responses resmi yang sama persis tanpa penggantian permintaan yang dibuat pengguna yang dapat memilih Codex
  secara implisit.
- Jangan gunakan referensi GPT Codex lama dalam konfigurasi; jalankan `openclaw doctor --fix` untuk
  memperbaiki referensi lama dan pin rute sesi yang usang.
- `agentRuntime.id: "codex"` menjadikan Codex persyaratan fail-closed untuk
  rute yang kompatibel. Ini tidak membuat rute efektif yang tidak kompatibel menjadi kompatibel.
- `agentRuntime.id: "openclaw"` mengikutsertakan penyedia atau model ke dalam runtime
  OpenClaw tertanam jika memang disengaja.
- `/codex ...` mengontrol percakapan app-server Codex native dari obrolan.
- ACP/acpx adalah jalur harness eksternal yang terpisah. Gunakan hanya ketika pengguna
  meminta ACP/acpx atau adaptor harness eksternal.

| Maksud pengguna                                             | Gunakan                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Lampirkan percakapan saat ini                              | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Lanjutkan thread Codex yang ada                            | `/codex resume <thread-id>`                                                                           |
| Cantumkan atau filter thread Codex                         | `/codex threads [filter]`                                                                             |
| Cantumkan plugin Codex native                              | `/codex plugins list`                                                                                 |
| Aktifkan atau nonaktifkan plugin Codex native terkonfigurasi | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Lanjutkan sesi CLI Codex tersimpan sebagai giliran node berpasangan | `/codex sessions --host <node> [filter]`, lalu `/codex resume <session-id> --host <node> --bind here` |
| Lihat sesi Codex yang tidak diarsipkan di seluruh komputer | Aktifkan pengawasan Codex dan buka **Sesi Codex**                                                  |
| Ubah model, mode cepat, atau izin thread yang terikat      | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Hentikan atau arahkan giliran aktif                        | `/codex stop`, `/codex steer <text>`                                                                  |
| Lepaskan ikatan saat ini                                   | `/codex detach` (alias `/codex unbind`)                                                               |
| Kirim hanya umpan balik Codex                              | `/codex diagnostics [note]`                                                                           |
| Mulai tugas ACP/acpx                                       | Perintah sesi ACP/acpx, bukan `/codex`                                                               |

| Kasus penggunaan                                | Konfigurasikan                                                                                               | Verifikasi                               | Catatan                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Rute OpenAI yang memenuhi syarat dengan runtime Codex native | Rute Responses/ChatGPT HTTPS resmi yang sama persis tanpa penggantian permintaan yang dibuat pengguna, ditambah plugin `codex` yang diaktifkan | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur implisit ketika runtime tidak ditetapkan/`auto` |
| Fail-closed jika Codex tidak tersedia           | `agentRuntime.id: "codex"` penyedia atau model                                                                | Giliran gagal alih-alih menggunakan fallback tertanam | Gunakan untuk deployment khusus Codex      |
| Lalu lintas kunci API OpenAI langsung melalui OpenClaw | `agentRuntime.id: "openclaw"` penyedia atau model dan autentikasi OpenAI normal                                      | `/status` menampilkan runtime OpenClaw        | Gunakan hanya jika OpenClaw memang disengaja |
| Konfigurasi lama                                | referensi GPT Codex lama                                                                                       | `openclaw doctor --fix` menulis ulang konfigurasi tersebut     | Jangan tulis konfigurasi baru dengan cara ini |
| Adaptor Codex ACP/acpx                          | `sessions_spawn({ runtime: "acp" })` ACP                                                                    | Status tugas/sesi ACP                   | Terpisah dari harness Codex native         |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar
harus dijalankan melalui giliran app-server Codex yang dibatasi. Doctor menulis ulang
referensi GPT Codex lama menjadi `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan konfigurasi mulai cepat untuk model OpenAI yang rute HTTPS resmi efektifnya
memenuhi syarat untuk memilih Codex secara implisit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Deployment penyedia campuran

Pertahankan Claude sebagai agen default dan tambahkan agen Codex bernama:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Agen `main` menggunakan jalur penyedia normalnya. Agen `codex` menggunakan
app-server Codex ketika rute OpenAI efektifnya tetap kompatibel; tambahkan
`agentRuntime.id: "codex"` eksplisit dengan cakupan model jika hal tersebut harus menjadi persyaratan
fail-closed.

### Deployment Codex fail-closed

Rute OpenAI HTTPS resmi yang sama persis dan memenuhi syarat dapat ditetapkan ke Codex ketika
plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit untuk aturan
fail-closed tertulis:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Jika Codex diwajibkan, OpenClaw gagal lebih awal jika rute efektif tidak dinyatakan
kompatibel dengan Codex, plugin dinonaktifkan, app-server terlalu lama, atau
app-server tidak dapat dimulai.

## Kebijakan app-server

Secara default, plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan
transport stdio. Tetapkan `appServer.command` hanya untuk menjalankan
executable lain secara sengaja. Gunakan transport WebSocket hanya ketika app-server
sudah berjalan di tempat lain:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Sesi app-server stdio lokal secara default menggunakan postur operator lokal
tepercaya: `approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit tersebut, OpenClaw memilih izin guardian yang diizinkan
sebagai gantinya. Ketika sandbox OpenClaw aktif untuk sesi tersebut, OpenClaw
menonaktifkan Code Mode native Codex, server MCP pengguna, dan eksekusi plugin
yang didukung aplikasi untuk giliran tersebut, alih-alih mengandalkan sandboxing sisi host Codex.
Akses shell sebagai gantinya melalui alat dinamis yang didukung sandbox OpenClaw seperti
`sandbox_exec` dan `sandbox_process` ketika alat exec/process normal
tersedia.

Gunakan mode exec OpenClaw yang dinormalisasi untuk tinjauan otomatis native Codex sebelum
keluar dari sandbox atau memberikan izin tambahan:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Untuk sesi app-server Codex, `tools.exec.mode: "auto"` dipetakan ke persetujuan
yang ditinjau Codex Guardian: biasanya `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` ketika
persyaratan lokal mengizinkan nilai tersebut. Dalam `tools.exec.mode: "auto"`,
OpenClaw tidak mempertahankan penggantian Codex lama yang tidak aman, yaitu `approvalPolicy: "never"` atau
`sandbox: "danger-full-access"`; gunakan `tools.exec.mode: "full"` untuk
postur Codex tanpa persetujuan yang disengaja. Preset lama
`plugins.entries.codex.config.appServer.mode: "guardian"` masih
berfungsi, tetapi `tools.exec.mode: "auto"` adalah permukaan OpenClaw yang dinormalisasi.

Untuk perbandingan tingkat mode dengan persetujuan exec host dan izin ACPX,
lihat [Mode izin](/id/tools/permission-modes). Untuk setiap kolom
app-server, urutan autentikasi, isolasi lingkungan, dan perilaku batas waktu,
lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin `codex` mendaftarkan `/codex` sebagai perintah garis miring pada kanal apa pun yang
mendukung perintah teks OpenClaw.

Eksekusi dan kontrol native memerlukan pemilik atau klien Gateway
`operator.admin`: mengikat atau melanjutkan thread, mengirim atau menghentikan giliran,
mengubah status model, mode cepat, atau izin, melakukan compaction atau peninjauan, serta
melepaskan ikatan. Pengirim resmi lainnya hanya memiliki akses baca ke perintah pemeriksaan
status, bantuan, akun, model, thread, server MCP, skill, dan ikatan.

Bentuk umum:

- `/codex status` memeriksa konektivitas app-server, model, akun, batas
  laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex aktif.
- `/codex threads [filter]` mencantumkan thread app-server Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang ada.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  melampirkan percakapan saat ini.
- `/codex detach` (atau `/codex unbind`) melepaskan ikatan saat ini.
- `/codex binding` menjelaskan ikatan saat ini.
- `/codex stop` menghentikan giliran aktif; `/codex steer <text>` mengarahkannya.
- `/codex model <model>`, `/codex fast [on|off|status]`, dan
  `/codex permissions [default|yolo|status]` mengubah status per percakapan.
- `/codex compact` meminta app-server Codex melakukan compaction pada thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik Codex untuk
  thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.
- `/codex plugins list`, `/codex plugins enable <name>`, dan
  `/codex plugins disable <name>` mengelola plugin Codex native yang dikonfigurasi.
- `/codex computer-use [status|install]` mengelola Penggunaan Komputer Codex.
- `/codex help` mencantumkan seluruh hierarki perintah.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam
percakapan tempat bug terjadi. Tindakan ini membuat satu laporan diagnostik Gateway
dan, untuk sesi harness Codex, meminta persetujuan untuk mengirim
bundel umpan balik Codex yang relevan. Lihat
[Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
obrolan grup. Gunakan `/codex diagnostics [note]` hanya jika Anda secara khusus
ingin mengunggah umpan balik Codex untuk utas yang saat ini terlampir tanpa
bundel diagnostik Gateway lengkap.

### Memeriksa utas Codex secara lokal

Cara tercepat untuk memeriksa proses Codex yang bermasalah sering kali adalah membuka
utas Codex native secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan ID utas dari balasan `/diagnostics` yang telah selesai, `/codex binding`,
atau `/codex threads [filter]`.

Untuk mekanisme pengunggahan dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

### Urutan autentikasi

Di direktori beranda per agen default, autentikasi dipilih dalam urutan berikut:

1. Profil autentikasi OpenAI yang diurutkan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan ID profil
   autentikasi Codex lama dan urutan autentikasi Codex lama.
2. Akun app-server yang sudah ada di direktori beranda Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, OpenClaw
menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex
yang dimunculkan. Dengan demikian, kunci API tingkat Gateway tetap tersedia untuk embedding atau
model OpenAI langsung tanpa secara tidak sengaja membuat giliran app-server Codex native
ditagihkan melalui API. Profil kunci API Codex eksplisit dan fallback
kunci lingkungan stdio lokal menggunakan login app-server, bukan lingkungan
proses anak yang diwariskan. Koneksi app-server WebSocket tidak menerima fallback
kunci API lingkungan Gateway; gunakan profil autentikasi eksplisit atau akun milik
app-server jarak jauh.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat
waktu reset ketika Codex melaporkannya dan mencoba profil autentikasi berikutnya
dalam urutan untuk proses Codex yang sama. Setelah waktu reset berlalu, profil
langganan kembali memenuhi syarat tanpa mengubah model `openai/gpt-*`
atau runtime Codex yang dipilih.

Ketika plugin Codex native dikonfigurasi, OpenClaw menginstal atau memperbarui
plugin tersebut melalui app-server yang terhubung sebelum menampilkan aplikasi
milik plugin ke utas Codex. `app/list` tetap menjadi sumber kebenaran untuk ID
aplikasi, aksesibilitas, dan metadata, tetapi OpenClaw mengendalikan keputusan
pengaktifan per utas: jika kebijakan mengizinkan aplikasi yang tercantum dan dapat diakses, OpenClaw
mengirim `thread/start.config.apps[appId].enabled = true` meskipun `app/list`
saat ini melaporkan bahwa aplikasi tersebut dinonaktifkan. Jalur ini tidak mengada-adakan
penginstalan aplikasi untuk ID yang tidak dikenal; OpenClaw hanya mengaktifkan plugin marketplace
dengan `plugin/install`, lalu memperbarui inventaris.

### Isolasi lingkungan

Untuk peluncuran app-server stdio lokal, OpenClaw menetapkan `CODEX_HOME` ke
direktori per agen agar konfigurasi Codex, berkas autentikasi/akun, cache/data plugin,
dan status utas native secara default tidak membaca atau menulis ke
`~/.codex` pribadi milik operator. OpenClaw mempertahankan `HOME`
proses normal; subproses yang dijalankan Codex tetap dapat menemukan konfigurasi dan token
direktori beranda pengguna, dan Codex dapat menemukan entri `$HOME/.agents/skills` dan
`$HOME/.agents/plugins/marketplace.json` bersama. Dengan
`appServer.homeScope: "user"`, OpenClaw justru menggunakan direktori beranda Codex native
milik pengguna beserta akun yang sudah ada tanpa menyuntikkan profil autentikasi OpenClaw.

Jika deployment memerlukan isolasi lingkungan tambahan, tambahkan
variabel tersebut ke `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex
yang dimunculkan. OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama
normalisasi peluncuran lokal: `CODEX_HOME` tetap mengarah ke cakupan
agen atau pengguna yang dipilih, dan `HOME` tetap diwariskan agar subproses dapat menggunakan
status direktori beranda pengguna normal.

### Alat dinamis dan pencarian web

Alat dinamis Codex menggunakan pemuatan `searchable` secara default. OpenClaw biasanya
tidak menampilkan alat dinamis yang menduplikasi operasi ruang kerja native Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search`, dan `tool_search_code`. Sebagian besar
alat integrasi OpenClaw yang tersisa, seperti perpesanan, media, Cron,
browser, node, gateway, dan `heartbeat_respond`, tersedia melalui
pencarian alat Codex di bawah namespace `openclaw`, sehingga konteks model awal
tetap lebih kecil. Fallback shell giliran terbatas merupakan pengecualian untuk
`exec` dan `process` ketika daftar izin terbatas menonaktifkan Code Mode native;
daftar izin runtime dan `codexDynamicToolsExclude` tetap berlaku.

Alat yang ditandai `catalogMode: "direct-only"`, termasuk alat `computer`
OpenClaw, menggunakan namespace `openclaw_direct`. Codex memperlakukan namespace tersebut
sebagai `DirectModelOnly`, sehingga alat tersebut tetap terlihat langsung oleh model dalam utas normal dan
utas khusus mode kode, alih-alih melewati panggilan `tools.*` Code Mode bertingkat.

Pencarian web menggunakan alat `web_search` yang dihosting Codex secara default ketika pencarian
diaktifkan dan tidak ada penyedia terkelola yang dipilih. Pencarian native yang dihosting dan
alat dinamis `web_search` terkelola milik OpenClaw saling eksklusif agar
pencarian terkelola tidak dapat melewati pembatasan domain native. OpenClaw menggunakan
alat terkelola ketika pencarian yang dihosting tidak tersedia, dinonaktifkan secara eksplisit, atau
digantikan oleh penyedia terkelola yang dipilih. OpenClaw mempertahankan ekstensi mandiri
`web.run` milik Codex dalam keadaan nonaktif karena lalu lintas app-server produksi menolak
namespace `web` yang ditentukan pengguna. `tools.web.search.enabled: false`
menonaktifkan kedua jalur, demikian pula proses khusus LLM dengan alat dinonaktifkan. Codex memperlakukan
`"cached"` sebagai preferensi dan menetapkannya menjadi akses eksternal langsung untuk
giliran app-server tanpa pembatasan. Fallback terkelola otomatis gagal secara tertutup ketika
`allowedDomains` native ditetapkan agar daftar izin tidak dapat dilewati.
Perubahan kebijakan pencarian efektif yang persisten merotasi utas Codex yang terikat
sebelum giliran berikutnya; pembatasan sementara per giliran menggunakan utas
terbatas sementara dan mempertahankan pengikatan yang ada untuk dilanjutkan nanti.

`sessions_yield` dan balasan sumber khusus alat pesan tetap langsung karena
keduanya merupakan kontrak kontrol giliran. `sessions_spawn` tetap dapat dicari agar
`spawn_agent` native milik Codex tetap menjadi permukaan subagen Codex utama,
sementara delegasi OpenClaw atau ACP eksplisit tetap tersedia melalui
namespace alat dinamis `openclaw`. Instruksi kolaborasi Heartbeat
memberi tahu Codex untuk mencari `heartbeat_respond` sebelum mengakhiri giliran Heartbeat
ketika alat belum dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya ketika terhubung ke app-server
Codex khusus yang tidak dapat mencari alat dinamis yang ditangguhkan atau ketika
men-debug payload alat lengkap.

### Bidang konfigurasi

Bidang Plugin Codex tingkat teratas yang didukung:

| Bidang                     | Default        | Arti                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung dalam konteks alat Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex. |
| `codexPlugins`             | dinonaktifkan  | Dukungan plugin/aplikasi Codex native untuk plugin pilihan yang dimigrasikan dan diinstal dari sumber. |
| `sessionCatalog`           | diaktifkan     | Penemuan bilah samping untuk sesi Codex native pada Gateway ini dan node berpasangan yang memenuhi syarat. |
| `supervision`              | dinonaktifkan  | Kebijakan transkrip sesi native dan kontrol penulisan yang ditujukan kepada agen.         |

Bidang `appServer` yang didukung:

| Bidang                                         | Default                                                | Arti                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"unix"` eksplisit terhubung ke soket kontrol lokal; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status harness biasa per agen OpenClaw. `"user"` merupakan pilihan ikut serta eksplisit yang membagikan `$CODEX_HOME` atau `~/.codex` native, menggunakan autentikasi native, dan mengaktifkan pengelolaan utas khusus pemilik. Cakupan pengguna mendukung stdio lokal atau transport Unix. Untuk koneksi pengawasan terpisah, nilai yang tidak ditetapkan akan diresolusikan menjadi `"user"` untuk stdio atau Unix dan `"agent"` untuk WebSocket.     |
| `command`                                     | biner Codex terkelola                                   | Berkas yang dapat dieksekusi untuk transport stdio. Biarkan tidak ditetapkan untuk menggunakan biner terkelola; tetapkan hanya untuk penggantian eksplisit.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak ditetapkan                                                  | URL App Server WebSocket atau URL `unix://`. Jalur Unix eksplisit yang kosong memilih soket kontrol kanonis di direktori utama pengguna.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | tidak ditetapkan                                                  | Token bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. OpenClaw mempertahankan `CODEX_HOME` yang dipilih dan `HOME` yang diwarisi untuk peluncuran lokal.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Ikut serta menggunakan permukaan alat khusus mode kode milik Codex. Alat dinamis OpenClaw biasa tetap tersedia melalui panggilan `tools.*` bertingkat; alat `openclaw_direct` tetap terlihat langsung oleh model.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | tidak ditetapkan                                                  | Root ruang kerja app-server Codex jarak jauh. Saat ditetapkan, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang telah diresolusikan, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang telah diresolusikan, OpenClaw menolak secara tertutup alih-alih mengirim jalur lokal Gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Batas waktu untuk panggilan bidang kontrol app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima giliran atau setelah permintaan app-server dalam cakupan giliran saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Pengaman progres dan kondisi diam saat penyelesaian yang digunakan setelah penyerahan alat, penyelesaian alat native, progres mentah asisten setelah alat, penyelesaian penalaran mentah, atau progres penalaran saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis setelah alat secara sah dapat tetap senyap lebih lama daripada anggaran rilis akhir asisten.                                |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan `danger-full-access`, persetujuan `never`, atau peninjau `user` menjadikan default implisit sebagai guardian.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan       | Kebijakan persetujuan native Codex yang dikirim saat memulai/melanjutkan utas/giliran. Default guardian mengutamakan `"on-request"` jika diizinkan.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan  | Mode sandbox native Codex yang dikirim saat memulai/melanjutkan utas. Default guardian mengutamakan `"workspace-write"` jika diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, giliran `danger-full-access` menggunakan `workspace-write` Codex dengan akses jaringan yang berasal dari pengaturan egress sandbox OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan               | Gunakan `"auto_review"` agar Codex meninjau perintah persetujuan native jika diizinkan, jika tidak gunakan `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias lama.                                                                                                                                                                                                                              |
| `serviceTier`                                 | tidak ditetapkan                                                  | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan fleksibel, `null` menghapus penggantian, dan `"fast"` lama diterima sebagai `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | dinonaktifkan                                               | Ikut serta menggunakan jaringan profil izin Codex untuk perintah app-server. OpenClaw menentukan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Pilihan ikut serta pratinjau yang mendaftarkan lingkungan Codex berbasis sandbox OpenClaw pada app-server Codex yang didukung agar eksekusi native Codex dapat berjalan di dalam sandbox OpenClaw yang aktif.                                                                                                                                                                                                            |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menetapkan `features.network_proxy.enabled`
dan `default_permissions` dalam konfigurasi utas Codex agar profil
izin yang dihasilkan dapat memulai jaringan terkelola Codex. Secara default, OpenClaw
menghasilkan nama profil `openclaw-network-<fingerprint>` yang tahan benturan
dari isi profil; gunakan `profileName` hanya saat nama lokal yang stabil
diperlukan.

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Jika runtime app-server normal adalah `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem berkas bergaya ruang kerja untuk profil
izin yang dihasilkan: penegakan jaringan yang dikelola Codex merupakan jaringan
dalam sandbox, sehingga profil akses penuh tidak akan melindungi lalu lintas keluar.
Entri domain menggunakan `allow` atau `deny`; entri soket Unix menggunakan nilai
`allow` atau `none` milik Codex.

### Batas waktu pemanggilan alat dinamis

Pemanggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan `item/tool/call` Codex secara default menggunakan watchdog OpenClaw selama 90
detik. Argumen `timeoutMs` per pemanggilan yang bernilai positif
memperpanjang atau memperpendek anggaran alat tertentu tersebut, dengan batas maksimum 600000 ms.
Alat `image_generate` menggunakan `agents.defaults.imageGenerationModel.timeoutMs`
ketika pemanggilan alat tidak menyediakan batas waktunya sendiri, atau menggunakan nilai default
pembuatan gambar selama 120 detik. Alat pemahaman media `image`
menggunakan `tools.media.image.timeoutSeconds` atau nilai default medianya selama 60 detik; untuk
pemahaman gambar, batas waktu tersebut berlaku pada permintaan itu sendiri dan tidak
dikurangi oleh pekerjaan persiapan sebelumnya. Ketika batas waktu tercapai, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons kegagalan alat dinamis kepada Codex
agar giliran dapat berlanjut, alih-alih membiarkan sesi dalam `processing`.
Watchdog ini adalah anggaran luar `item/tool/call` dinamis; batas waktu
permintaan khusus penyedia berjalan di dalam pemanggilan tersebut dan mempertahankan semantik batas waktunya sendiri.

Setelah Codex menerima sebuah giliran, dan setelah OpenClaw merespons permintaan
app-server yang terbatas pada giliran, harness mengharapkan Codex membuat kemajuan pada giliran saat ini
dan pada akhirnya menyelesaikan giliran native dengan `turn/completed`. Jika
app-server tidak memberikan aktivitas selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
sebisa mungkin menginterupsi giliran Codex, mencatat batas waktu diagnostik, dan
melepaskan jalur sesi OpenClaw agar pesan obrolan lanjutan tidak
mengantre di belakang giliran native yang sudah kedaluwarsa. Sebagian besar notifikasi nonterminal untuk
giliran yang sama menonaktifkan watchdog singkat tersebut karena Codex telah membuktikan bahwa giliran
masih aktif.

Serah terima alat menggunakan anggaran menganggur pascaalat yang lebih panjang: setelah OpenClaw mengembalikan
respons `item/tool/call`, setelah item alat native seperti
`commandExecution` selesai, setelah penyelesaian mentah `custom_tool_call_output`,
dan setelah kemajuan asisten mentah pascaalat, penyelesaian penalaran mentah,
atau kemajuan penalaran. Pengaman menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` ketika dikonfigurasi dan
secara default menggunakan lima menit jika tidak; anggaran yang sama juga memperpanjang
watchdog kemajuan untuk jendela sintesis senyap sebelum Codex memancarkan
peristiwa berikutnya pada giliran saat ini. Notifikasi app-server global, seperti
pembaruan batas laju, tidak mengatur ulang kemajuan saat giliran menganggur. Penyelesaian penalaran,
penyelesaian `agentMessage` komentar, serta penalaran mentah atau
kemajuan asisten sebelum alat dapat diikuti oleh balasan akhir otomatis, sehingga semuanya menggunakan
pengaman balasan pascakemajuan, alih-alih langsung melepaskan jalur sesi.

Hanya item `agentMessage` akhir/nonkomentar yang telah selesai dan penyelesaian asisten mentah
sebelum alat yang mengaktifkan pelepasan keluaran asisten: jika Codex kemudian
tidak memberikan aktivitas tanpa `turn/completed`, OpenClaw sebisa mungkin menginterupsi giliran native
dan melepaskan jalur sesi. Jika pemantauan giliran lain memenangkan perlombaan pelepasan tersebut,
OpenClaw tetap menerima item asisten akhir yang telah selesai setelah tidak ada
permintaan native, item, atau penyelesaian alat dinamis yang masih aktif dan
pelepasan keluaran asisten masih terkait dengan item terakhir yang selesai,
tanpa penyelesaian item yang lebih baru. Hal ini dapat mempertahankan jawaban akhir setelah
pekerjaan alat selesai tanpa memutar ulang giliran. Delta asisten parsial,
balasan lama sebelumnya, dan penyelesaian berikutnya yang kosong tidak memenuhi syarat.

Kegagalan app-server stdio yang aman untuk diputar ulang, termasuk batas waktu menganggur saat penyelesaian giliran
tanpa bukti asisten, alat, item aktif, atau efek samping, dicoba kembali satu kali
melalui upaya app-server baru. Batas waktu yang tidak aman tetap menghentikan
klien app-server yang macet dan melepaskan jalur sesi OpenClaw; batas waktu tersebut juga
menghapus pengikatan thread native yang kedaluwarsa alih-alih memutarnya ulang
secara otomatis. Batas waktu pemantauan penyelesaian menampilkan teks batas waktu
khusus Codex: kasus yang aman untuk diputar ulang menyatakan bahwa respons mungkin tidak lengkap, sedangkan kasus
yang tidak aman meminta pengguna memverifikasi keadaan saat ini sebelum mencoba kembali. Diagnostik batas waktu
publik mencakup bidang struktural seperti metode notifikasi app-server terakhir,
id/jenis/peran item respons asisten mentah, jumlah permintaan/item aktif,
dan status pemantauan yang aktif; ketika notifikasi terakhir adalah item respons
asisten mentah, diagnostik juga menyertakan pratinjau teks asisten yang dibatasi.
Diagnostik tidak menyertakan isi mentah prompt atau alat.

### Penggantian variabel lingkungan untuk pengujian lokal

- `OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner yang dikelola ketika
  `appServer.command` tidak ditetapkan.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena mempertahankan perilaku plugin
dalam berkas yang telah ditinjau yang sama dengan seluruh penyiapan harness Codex lainnya.

## Plugin native Codex

Dukungan plugin native Codex menggunakan kemampuan aplikasi dan plugin
milik app-server Codex sendiri dalam thread Codex yang sama dengan giliran harness OpenClaw. OpenClaw
tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw `codex_plugin_*`
sintetis.

`codexPlugins` hanya memengaruhi sesi yang memilih harness native Codex.
Pengaturan ini tidak berpengaruh pada eksekusi harness bawaan, eksekusi penyedia OpenAI normal, pengikatan
percakapan ACP, atau harness lainnya.

Konfigurasi minimum yang telah dimigrasikan:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Konfigurasi aplikasi thread dihitung ketika OpenClaw membuat sesi harness
Codex atau mengganti pengikatan thread Codex yang kedaluwarsa; konfigurasi ini tidak dihitung ulang pada
setiap giliran. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang
Gateway agar sesi harness Codex berikutnya dimulai dengan kumpulan aplikasi
yang telah diperbarui.

Untuk kelayakan migrasi, inventaris aplikasi, kebijakan tindakan destruktif,
elisitasi, dan diagnostik plugin native, lihat
[Plugin native Codex](/id/plugins/codex-native-plugins).

Akses aplikasi dan plugin di sisi OpenAI dikendalikan oleh akun Codex
yang telah masuk dan, untuk ruang kerja Business dan Enterprise/Edu, oleh kontrol aplikasi
ruang kerja. Lihat
[Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
untuk ringkasan OpenAI mengenai kontrol akun dan ruang kerja.

## Penggunaan Komputer

Penggunaan Komputer memiliki panduan penyiapan tersendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkat: OpenClaw tidak menyertakan aplikasi kontrol desktop atau menjalankan
tindakan desktop itu sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex mengendalikan pemanggilan alat
MCP native selama giliran mode Codex.

## Batas runtime

Harness Codex hanya mengubah pelaksana agen tersemat tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw menjalankan
  alat tersebut, sehingga OpenClaw tetap berada dalam jalur eksekusi.
- Shell, patch, MCP, dan alat aplikasi native Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir peristiwa native tertentu melalui relai
  yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex mengendalikan Compaction native. OpenClaw menyimpan cerminan transkrip untuk
  riwayat kanal, pencarian, `/new`, `/reset`, serta peralihan model atau harness
  pada masa mendatang, tetapi tidak mengganti Compaction Codex dengan peringkas OpenClaw atau
  mesin konteks.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan keluaran alat
  perpesanan tetap melalui pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw,
  bukan catatan hasil alat native Codex.

Untuk lapisan hook, permukaan V1 yang didukung, penanganan izin native, pengarahan
antrean, mekanisme pengunggahan umpan balik Codex, dan detail Compaction, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** hal ini sesuai harapan untuk konfigurasi
baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan harness bawaan alih-alih Codex:** pastikan rute efektif
merupakan rute resmi HTTPS Platform Responses atau ChatGPT Responses yang tepat,
tidak memiliki penggantian permintaan yang dibuat pengguna, serta plugin Codex telah dipasang dan
diaktifkan. Awalan `openai/gpt-*` saja tidak cukup. Untuk pembuktian ketat saat
menguji, tetapkan `agentRuntime.id: "codex"` penyedia atau model; Codex yang dipaksakan akan gagal
alih-alih melakukan fallback ketika rute atau harness tidak kompatibel.

**Runtime OpenAI Codex melakukan fallback ke jalur kunci API:** kumpulkan cuplikan
Gateway yang telah disunting yang menampilkan model, runtime, penyedia terpilih, dan
kegagalan. Minta kolaborator yang terdampak menjalankan perintah hanya-baca ini pada host
OpenClaw mereka:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Cuplikan yang berguna biasanya mencakup `openai/gpt-5.6-sol` atau `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` atau `harnessRuntime`,
`candidateProvider: "openai"`, serta hasil `401`, `Incorrect API key`, atau
`No API key`. Eksekusi yang telah diperbaiki seharusnya menampilkan jalur OAuth OpenAI
alih-alih kegagalan kunci API OpenAI biasa.

**Konfigurasi referensi model Codex lama masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang referensi model lama menjadi `openai/*`, menghapus pin runtime sesi dan
seluruh agen yang kedaluwarsa, serta mempertahankan penggantian profil autentikasi yang ada.

**App-server ditolak:** gunakan app-server Codex `0.143.0` atau yang lebih baru.
Versi prarilis dengan versi yang sama atau versi dengan akhiran build seperti
`0.143.0-alpha.2` atau `0.143.0+custom` ditolak karena OpenClaw menguji
batas minimum protokol stabil `0.143.0`.

**`/codex status` tidak dapat terhubung:** periksa apakah plugin `codex`
diaktifkan, apakah `plugins.allow` menyertakannya saat daftar izin
dikonfigurasi, dan apakah `appServer.command`, `url`, `authToken` khusus, atau
header apa pun valid.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan.
Lihat [referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transpor WebSocket langsung gagal:** periksa `appServer.url`,
`authToken`, header, dan pastikan app-server jarak jauh menggunakan versi
protokol app-server Codex yang sama.

**Shell native atau alat patch diblokir dengan `Native hook relay
unavailable`:** thread Codex masih mencoba menggunakan id relai hook native
yang tidak lagi terdaftar di OpenClaw. Ini adalah masalah transpor hook
Codex native, bukan kegagalan backend ACP, penyedia, GitHub, atau perintah shell.
Mulai sesi baru dalam percakapan yang terdampak dengan `/new` atau `/reset`,
lalu coba kembali perintah yang tidak berbahaya. Jika perintah tersebut berhasil sekali tetapi pemanggilan
alat native berikutnya kembali gagal, perlakukan `/new` hanya sebagai solusi sementara: salin
prompt ke sesi baru setelah memulai ulang app-server Codex atau
Gateway OpenClaw agar thread lama dihapus dan pendaftaran hook native
dibuat ulang.

**Pemanggilan alat Codex membuat terlalu banyak proses hook berumur pendek:** tetapkan
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
dan mulai ulang gateway. Tindakan ini hanya menonaktifkan subproses `PreToolUse` Codex
yang digunakan untuk deteksi loop OpenClaw beserta penanda tanpa kebijakannya. Relai
`before_tool_call` yang diperlukan dan kebijakan alat tepercaya tetap diaktifkan.

**Model non-Codex menggunakan harness bawaan:** hal ini wajar kecuali kebijakan runtime
penyedia atau model mengarahkannya ke harness lain. Referensi penyedia biasa non-OpenAI
tetap menggunakan jalur penyedia normalnya dalam mode `auto`.

**Computer Use terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan pemulihan relai hook native di atas.
Lihat [Computer Use Codex](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Supervisi Codex](/plugins/codex-supervision)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Computer Use Codex](/id/plugins/codex-computer-use)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Bantuan OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Hook Plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
