---
read_when:
    - Anda ingin menggunakan harness app-server Codex resmi
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih beralih kembali ke OpenClaw
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex resmi
title: Harness Codex
x-i18n:
    generated_at: "2026-07-19T16:43:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 791c637e772760a9ff580575f93c84ce4f477e08a08ee8bd29e251b3e0c18091
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin resmi `codex` menjalankan giliran agen OpenAI tertanam melalui Codex
app-server, bukan melalui harness bawaan OpenClaw. Codex mengelola
sesi agen tingkat rendah: pelanjutan thread native, kelanjutan alat native,
compaction native, dan eksekusi app-server. OpenClaw tetap mengelola saluran
chat, file sesi, pemilihan model, alat dinamis OpenClaw, persetujuan,
pengiriman media, dan cerminan transkrip yang terlihat.

Gunakan referensi model OpenAI kanonis seperti `openai/gpt-5.6-sol`. Jangan mengonfigurasi
referensi GPT Codex lama; tempatkan urutan autentikasi agen OpenAI di bawah `auth.order.openai`.
ID profil autentikasi Codex lama dan entri urutan autentikasi Codex lama
diperbaiki oleh `openclaw doctor --fix`.

Saat kebijakan runtime penyedia/model tidak ditetapkan atau `auto`, prefiks `openai/*` saja
tidak pernah memilih harness ini. OpenAI dapat memilih Codex secara implisit hanya untuk
rute resmi HTTPS Platform Responses atau ChatGPT Responses yang tepat tanpa
penggantian permintaan yang ditulis pengguna. Lihat
[Runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).
Jika Codex mengelola autentikasi sebelum perutean Platform versus ChatGPT diketahui, OpenClaw
tetap mewajibkan setiap rute kandidat untuk menyatakan kompatibilitas Codex. Kepemilikan
autentikasi native saja tidak pernah melewati pemeriksaan rute tersebut.

Saat tidak ada sandbox OpenClaw yang aktif, OpenClaw memulai thread Codex app-server
dengan mode kode native Codex diaktifkan (khusus-mode-kode tetap nonaktif secara default), sehingga
kemampuan ruang kerja/kode native tetap tersedia bersama alat dinamis OpenClaw
yang dirutekan melalui jembatan app-server `item/tool/call`. Sandbox OpenClaw
yang aktif atau kebijakan alat terbatas menonaktifkan mode kode native
sepenuhnya kecuali Anda memilih jalur eksperimental exec-server sandbox.

Dengan `tools.exec.host: "auto"` default dan tanpa sandbox OpenClaw aktif,
Codex juga menerima alat `node_exec` dan `node_process` untuk perintah pada
node yang dipasangkan. Shell native tetap berada pada host dan ruang kerja Codex app-server
(lokal Gateway untuk penerapan stdio default); `node_exec` memilih node berdasarkan
nama atau ID dan tetap memberlakukan kebijakan persetujuan node OpenClaw. Jika daftar izin
runtime terbatas menonaktifkan Mode Kode native dan membuat giliran tidak memiliki
lingkungan eksekusi, OpenClaw mempertahankan alat `exec` dan `process`
yang telah difilter kebijakan sebagai gantinya untuk eksekusi langsung tanpa sandbox.

Fitur native Codex ini terpisah dari
[Mode Kode OpenClaw](/id/tools/code-mode), runtime QuickJS-WASI opsional
untuk proses OpenClaw generik dengan bentuk input `exec` yang berbeda. Untuk
pemisahan model/penyedia/runtime yang lebih luas, mulai dari
[Runtime agen](/id/concepts/agent-runtimes): `openai/gpt-5.6-sol` adalah referensi
model, `codex` adalah runtime, dan Telegram, Discord, Slack, atau saluran
lainnya adalah permukaan komunikasi.

## Persyaratan

- Plugin resmi `@openclaw/codex` telah diinstal. Sertakan `codex` dalam
  `plugins.allow` jika konfigurasi Anda menggunakan daftar izin.
- Codex app-server stabil dari `0.143.0` hingga `0.144.6`. Plugin mengelola biner yang kompatibel
  secara default, sehingga perintah `codex` pada `PATH` tidak memengaruhi proses mulai
  normal.
- Autentikasi Codex melalui `openclaw models auth login --provider openai`, akun
  app-server yang sudah ada di home Codex agen, atau
  profil autentikasi kunci API Codex eksplisit.

Untuk prioritas autentikasi, isolasi lingkungan, perintah app-server khusus,
penemuan model, dan daftar lengkap bidang konfigurasi, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Instal Plugin resmi, lalu masuk dengan Codex OAuth:

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

Mulai ulang Gateway setelah mengubah konfigurasi Plugin. Jika sebuah chat sudah memiliki
sesi, jalankan `/new` atau `/reset` terlebih dahulu agar giliran berikutnya menentukan harness
dari konfigurasi saat ini.

## Bagikan thread dengan Codex Desktop dan CLI

`appServer.homeScope: "agent"` default mengisolasi setiap agen OpenClaw dari
status native Codex milik operator. Agar pemilik dapat memeriksa dan mengelola
thread native yang sama seperti yang ditampilkan oleh Codex Desktop dan CLI Codex, pilih
home Codex pengguna:

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

Mode home pengguna mendukung proses stdio terkelola lokal atau transport
soket Unix bersama. Mode ini menggunakan `$CODEX_HOME` saat ditetapkan dan `~/.codex` jika tidak, termasuk
autentikasi, konfigurasi, Plugin, dan penyimpanan thread native Codex milik home tersebut. OpenClaw
tidak menyuntikkan profil autentikasi OpenClaw ke app-server ini.

Giliran pemilik memperoleh alat `codex_threads`: membuat daftar, mencari, membaca, membuat fork, mengganti nama,
mengarsipkan, dan memulihkan thread native. Buat fork thread untuk melanjutkannya di
OpenClaw; fork tersebut ditautkan ke sesi OpenClaw saat ini dan tetap
terlihat oleh klien native Codex lainnya. Pengarsipan memerlukan
konfirmasi eksplisit bahwa thread telah ditutup di tempat lain. Saat pengawasan juga
diaktifkan, bidang transkrip dan mutasi memerlukan keikutsertaan
`supervision.allowRawTranscripts` atau `supervision.allowWriteControls` yang sesuai.

Jangan melanjutkan atau menulis thread yang sama secara bersamaan melalui App Server stdio
terkelola yang independen. Codex mengoordinasikan penulis aktif di dalam satu App Server, bukan
di antara proses terpisah. Pembuatan fork adalah jalur koeksistensi yang aman untuk sesi stdio
home pengguna biasa.

`appServer.homeScope: "user"` saja tidak mengontrol katalog armada. Penemuan
sesi native diaktifkan selama Plugin aktif; tetapkan
`sessionCatalog.enabled: false` untuk menghapusnya dari bilah samping OpenClaw tanpa
menonaktifkan Codex. Katalog menggunakan koneksi pengawasan terpisah; tanpa
pengaturan koneksi `appServer` eksplisit, koneksi tersebut menggunakan stdio terkelola
home pengguna secara default sementara harness biasa tetap tercakup per agen. Pengaturan
`appServer` eksplisit dipatuhi oleh kedua jalur. Tetapkan `homeScope: "user"`
secara eksplisit, seperti di atas, jika harness biasa juga harus berbagi status native.

## Awasi sesi Codex

Plugin `codex` yang sama dapat menampilkan sesi Codex yang tidak diarsipkan dari komputer Gateway
dan node pasangan yang telah mengaktifkannya. Sesi lokal Gateway yang tersimpan atau menganggur dapat
membuat Chat yang terkunci ke model dan mencerminkan riwayat pengguna serta asisten tersimpan
yang dibatasi. Pengikatan privatnya menggunakan koneksi pengawasan untuk snapshot native,
cabang kanonis, dan giliran berikutnya, sementara sesi Codex biasa tetap
tercakup per agen. Permulaan kanonis pertama menggunakan model dan penyedia persis seperti yang
dikembalikan Codex untuk fork snapshot. Pelanjutan berikutnya menyerahkan pemilihan kepada
konfigurasi native Codex; model OpenClaw luar dan rantai fallback tidak pernah
menggantikannya. Baris tersimpan dan menganggur dapat diarsipkan setelah konfirmasi eksplisit bahwa
tidak ada runner lain. Sumber aktif tidak dapat membuat cabang atau diarsipkan; Chat
terawasi yang sudah ada tetap dapat dibuka. Sesi node pasangan tetap hanya berupa metadata.

Lihat [Awasi sesi Codex](/id/plugins/codex-supervision) untuk penyiapan, aturan
percabangan, batas node pasangan, pemaparan metadata, dan pemecahan masalah.

## Konfigurasi

| Kebutuhan                                           | Tetapkan                                                                                         | Lokasi                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Aktifkan harness                                    | `plugins.entries.codex.enabled: true`                                                            | Konfigurasi OpenClaw               |
| Sembunyikan penemuan sesi native Codex              | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Konfigurasi Plugin Codex           |
| Pertahankan instalasi Plugin dalam daftar izin      | Sertakan `codex` dalam `plugins.allow`                                                               | Konfigurasi OpenClaw               |
| Izinkan giliran OpenAI yang memenuhi syarat menggunakan Codex secara implisit | Rute resmi HTTPS Responses/ChatGPT yang tepat, tanpa penggantian permintaan yang ditulis pengguna, runtime tidak ditetapkan/`auto` | Konfigurasi penyedia/model OpenAI  |
| Masuk dengan ChatGPT/Codex OAuth                    | `openclaw models auth login --provider openai`                                                   | Profil autentikasi CLI             |
| Tambahkan cadangan kunci API untuk proses Codex     | Profil kunci API `openai:*` yang dicantumkan setelah autentikasi langganan dalam `auth.order.openai`                 | Profil autentikasi CLI + konfigurasi OpenClaw |
| Gagal tertutup saat Codex tidak tersedia            | Penyedia atau model `agentRuntime.id: "codex"`                                                     | Konfigurasi model/penyedia OpenClaw |
| Gunakan lalu lintas API OpenAI langsung             | Penyedia atau model `agentRuntime.id: "openclaw"` dengan autentikasi OpenAI normal                          | Konfigurasi model/penyedia OpenClaw |
| Sesuaikan perilaku app-server                       | `plugins.entries.codex.config.appServer.*`                                                       | Konfigurasi Plugin Codex           |
| Aktifkan aplikasi Plugin native Codex               | `plugins.entries.codex.config.codexPlugins.*`                                                    | Konfigurasi Plugin Codex           |
| Aktifkan Penggunaan Komputer Codex                  | `plugins.entries.codex.config.computerUse.*`                                                     | Konfigurasi Plugin Codex           |

Utamakan `auth.order.openai` untuk urutan langganan-terlebih-dahulu/cadangan-kunci-API.
ID profil autentikasi Codex lama dan urutan autentikasi Codex lama yang sudah ada adalah
status lama khusus doctor; jangan menulis referensi GPT Codex lama yang baru.

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

Jangan tetapkan `compaction.model` atau `compaction.provider` pada agen yang didukung
Codex. Codex melakukan compaction melalui status thread app-server native-nya, sehingga
OpenClaw mengabaikan penggantian peringkas lokal tersebut saat runtime, dan
`openclaw doctor --fix` menghapusnya saat agen menggunakan Codex.

Lossless tetap didukung sebagai mesin konteks untuk perakitan, penyerapan, dan
pemeliharaan seputar giliran Codex, yang dikonfigurasi melalui
`plugins.slots.contextEngine: "lossless-claw"` dan
`plugins.entries.lossless-claw.config.summaryModel`, bukan melalui
`agents.defaults.compaction.provider`. `openclaw doctor --fix` memigrasikan
bentuk lama `compaction.provider: "lossless-claw"` ke slot mesin konteks
Lossless saat Codex menjadi runtime aktif, tetapi Codex native tetap
mengelola compaction. Harness app-server native mendukung mesin konteks
yang memerlukan perakitan pra-prompt; backend CLI generik, termasuk `codex-cli`,
tidak menyediakan kemampuan host tersebut.

Untuk agen yang didukung Codex, `/compact` memulai compaction app-server
native Codex pada thread yang terikat. OpenClaw tidak menunggu penyelesaian,
memberlakukan batas waktu OpenClaw, memulai ulang app-server bersama, atau beralih ke
mesin konteks maupun peringkas OpenAI publik sebagai fallback. Jika pengikatan thread
native Codex hilang atau kedaluwarsa, perintah gagal tertutup alih-alih diam-diam
mengganti backend compaction.

Bagian selanjutnya dari halaman ini membahas bentuk deployment, perutean fail-closed, kebijakan persetujuan guardian, plugin Codex native, dan Computer Use. Untuk daftar opsi lengkap, nilai default, enum, discovery, isolasi lingkungan, batas waktu, dan kolom transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` dalam chat tempat Anda mengharapkan Codex. Giliran agen OpenAI yang didukung Codex menampilkan:

```text
Runtime: OpenAI Codex
```

Kemudian periksa status app-server Codex:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, batas laju, server MCP, dan skill. `/codex models` mencantumkan katalog app-server Codex aktif untuk harness dan akun tersebut. Jika `/status` tidak sesuai harapan, lihat
[Pemecahan masalah](#troubleshooting).

## Perutean dan pemilihan model

Pisahkan referensi penyedia dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk pemilihan model OpenAI kanonis. Prefiks saja tidak pernah memilih Codex.
- Jika runtime tidak ditetapkan atau `auto`, hanya rute HTTPS Platform Responses atau ChatGPT Responses resmi yang sama persis tanpa penggantian permintaan buatan pengguna yang dapat memilih Codex secara implisit.
- Jangan gunakan referensi GPT Codex lama dalam konfigurasi; jalankan `openclaw doctor --fix` untuk memperbaiki referensi lama dan pin rute sesi yang usang.
- `agentRuntime.id: "codex"` menjadikan Codex persyaratan fail-closed untuk rute yang kompatibel. Ini tidak membuat rute efektif yang tidak kompatibel menjadi kompatibel.
- `agentRuntime.id: "openclaw"` mengikutsertakan penyedia atau model ke dalam runtime OpenClaw tersemat ketika hal tersebut memang disengaja.
- `/codex ...` mengontrol percakapan app-server Codex native dari chat.
- ACP/acpx adalah jalur harness eksternal yang terpisah. Gunakan hanya ketika pengguna meminta ACP/acpx atau adaptor harness eksternal.

| Maksud pengguna                                            | Gunakan                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Lampirkan chat saat ini                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Lanjutkan thread Codex yang sudah ada                      | `/codex resume <thread-id>`                                                                           |
| Cantumkan atau filter thread Codex                         | `/codex threads [filter]`                                                                             |
| Baca atau perbarui tujuan native thread yang terikat       | `/codex goal [status\|set <objective>\|pause\|resume\|block\|complete\|clear]`                        |
| Cantumkan plugin Codex native                              | `/codex plugins list`                                                                                 |
| Aktifkan atau nonaktifkan plugin Codex native terkonfigurasi | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Lanjutkan sesi CLI Codex tersimpan sebagai giliran node berpasangan | `/codex sessions --host <node> [filter]`, lalu `/codex resume <session-id> --host <node> --bind here` |
| Lihat sesi Codex yang tidak diarsipkan di seluruh komputer | Aktifkan supervisi Codex dan buka **Sesi Codex**                                                  |
| Ubah model, mode cepat, atau izin thread yang terikat      | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Hentikan atau arahkan giliran aktif                        | `/codex stop`, `/codex steer <text>`                                                                  |
| Lepaskan ikatan saat ini                                   | `/codex detach` (alias `/codex unbind`)                                                               |
| Kirim hanya umpan balik Codex                              | `/codex diagnostics [note]`                                                                           |
| Mulai tugas ACP/acpx                                       | Perintah sesi ACP/acpx, bukan `/codex`                                                               |

| Kasus penggunaan                                | Konfigurasikan                                                                                               | Verifikasi                              | Catatan                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Rute OpenAI yang memenuhi syarat dengan runtime Codex native | Rute HTTPS Responses/ChatGPT resmi yang sama persis tanpa penggantian permintaan buatan pengguna, ditambah plugin `codex` yang diaktifkan | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur implisit ketika runtime tidak ditetapkan/`auto` |
| Fail closed jika Codex tidak tersedia           | Penyedia atau model `agentRuntime.id: "codex"`                                                                | Giliran gagal alih-alih fallback tersemat | Gunakan untuk deployment khusus Codex             |
| Lalu lintas kunci API OpenAI langsung melalui OpenClaw | Penyedia atau model `agentRuntime.id: "openclaw"` dan autentikasi OpenAI normal                                      | `/status` menampilkan runtime OpenClaw        | Gunakan hanya ketika OpenClaw memang disengaja      |
| Konfigurasi lama                                | referensi GPT Codex lama                                                                                       | `openclaw doctor --fix` menulis ulang konfigurasi tersebut     | Jangan tulis konfigurasi baru dengan cara ini           |
| Adaptor Codex ACP/acpx                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | Status tugas/sesi ACP                 | Terpisah dari harness Codex native         |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*` untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar harus dijalankan melalui giliran app-server Codex yang dibatasi. Doctor menulis ulang referensi GPT Codex lama menjadi `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan konfigurasi mulai cepat untuk model OpenAI yang rute HTTPS resmi efektifnya memenuhi syarat untuk memilih Codex secara implisit:

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

Agen `main` menggunakan jalur penyedia normalnya. Agen `codex` menggunakan app-server Codex ketika rute OpenAI efektifnya tetap kompatibel; tambahkan `agentRuntime.id: "codex"` eksplisit dengan cakupan model ketika hal tersebut harus menjadi persyaratan fail-closed.

### Deployment Codex fail-closed

Rute OpenAI HTTPS resmi yang sama persis dan memenuhi syarat dapat diresolusikan ke Codex ketika plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit untuk aturan fail-closed tertulis:

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

Ketika Codex dipaksakan, OpenClaw gagal lebih awal jika rute efektif tidak dinyatakan kompatibel dengan Codex, plugin dinonaktifkan, app-server terlalu lama, atau app-server tidak dapat dimulai.

## Kebijakan app-server

Secara default, plugin memulai biner Codex terkelola OpenClaw secara lokal dengan transport stdio. Tetapkan `appServer.command` hanya untuk sengaja menjalankan executable yang berbeda. Codex mengklasifikasikan transport WebSocket sebagai eksperimental dan tidak didukung; gunakan hanya untuk pengujian nonproduksi terhadap app-server yang sudah berjalan di tempat lain:

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

Sesi app-server stdio lokal secara default menggunakan postur operator lokal tepercaya: `approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan `sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan postur YOLO implisit tersebut, OpenClaw akan memilih izin guardian yang diperbolehkan sebagai gantinya. Ketika sandbox OpenClaw aktif untuk sesi tersebut, OpenClaw menonaktifkan Code Mode native Codex, server MCP pengguna, dan eksekusi plugin yang didukung aplikasi untuk giliran itu alih-alih mengandalkan sandboxing sisi host Codex. Akses shell sebagai gantinya melalui alat dinamis yang didukung sandbox OpenClaw seperti `sandbox_exec` dan `sandbox_process` ketika alat exec/process normal tersedia.

Gunakan mode exec OpenClaw yang dinormalisasi untuk review otomatis native Codex sebelum pelolosan sandbox atau izin tambahan:

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

Untuk sesi app-server Codex, `tools.exec.mode: "auto"` dipetakan ke persetujuan yang direview Codex Guardian: biasanya `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` ketika persyaratan lokal mengizinkan nilai tersebut. Dalam `tools.exec.mode: "auto"`, OpenClaw tidak mempertahankan penggantian Codex lama yang tidak aman `approvalPolicy: "never"` atau `sandbox: "danger-full-access"`; gunakan `tools.exec.mode: "full"` untuk postur Codex tanpa persetujuan yang disengaja. Preset lama `plugins.entries.codex.config.appServer.mode: "guardian"` masih berfungsi, tetapi `tools.exec.mode: "auto"` adalah permukaan OpenClaw yang dinormalisasi.

Untuk perbandingan tingkat mode dengan persetujuan exec host dan izin ACPX, lihat [Mode izin](/id/tools/permission-modes). Untuk setiap kolom app-server, urutan autentikasi, isolasi lingkungan, dan perilaku batas waktu, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin `codex` mendaftarkan `/codex` sebagai perintah slash pada setiap channel yang mendukung perintah teks OpenClaw.

Eksekusi dan kontrol native memerlukan pemilik atau klien Gateway `operator.admin`: mengikat atau melanjutkan thread, mengirim atau menghentikan giliran, mengubah model, mode cepat, atau status izin, melakukan compaction atau review, dan melepaskan ikatan. Pengirim resmi lainnya tetap memiliki perintah hanya-baca untuk memeriksa status, bantuan, akun, model, thread, tujuan native, server MCP, skill, dan ikatan.

Bentuk umum:

- `/codex status` memeriksa konektivitas app-server, model, akun, batas
  laju, server MCP, dan skills.
- `/codex models` mencantumkan model app-server Codex yang aktif.
- `/codex threads [filter]` mencantumkan thread app-server Codex terbaru.
- `/codex goal` membaca atau memperbarui goal Codex native milik thread yang dilampirkan. Kelanjutan goal otomatis Codex tetap dinonaktifkan; OpenClaw belum mengelola giliran lanjutan otonom.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  melampirkan chat saat ini.
- `/codex detach` (atau `/codex unbind`) melepaskan pengikatan saat ini.
- `/codex binding` menjelaskan pengikatan saat ini.
- `/codex stop` menghentikan giliran aktif; `/codex steer <text>` mengarahkannya.
- `/codex model <model>`, `/codex fast [on|off|status]`, dan
  `/codex permissions [default|yolo|status]` mengubah status per percakapan.
- `/codex compact` meminta app-server Codex melakukan pemadatan pada thread yang dilampirkan.
- `/codex review` memulai review native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik Codex untuk
  thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan skills app-server Codex.
- `/codex plugins list`, `/codex plugins enable <name>`, dan
  `/codex plugins disable <name>` mengelola plugin native Codex yang dikonfigurasi.
- `/codex computer-use [status|install]` mengelola Codex Computer Use.
- `/codex help` mencantumkan seluruh pohon perintah.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam
percakapan tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway
dan, untuk sesi harness Codex, meminta persetujuan untuk mengirim bundel umpan balik
Codex yang relevan. Lihat
[Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
chat grup. Gunakan `/codex diagnostics [note]` hanya jika Anda secara khusus
ingin mengunggah umpan balik Codex untuk thread yang saat ini dilampirkan tanpa
bundel diagnostik Gateway lengkap.

### Memeriksa thread Codex secara lokal

Cara tercepat untuk memeriksa proses Codex yang bermasalah sering kali adalah dengan membuka
thread native Codex secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan id thread dari balasan `/diagnostics` yang telah selesai, `/codex binding`,
atau `/codex threads [filter]`.

Untuk mekanisme pengunggahan dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

### Urutan autentikasi

Di home per agen default, autentikasi dipilih dalam urutan berikut:

1. Profil autentikasi OpenAI yang diurutkan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan id profil
   autentikasi Codex lama dan urutan autentikasi Codex lama.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, OpenClaw
menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses turunan Codex yang
dijalankan. Hal ini menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau
model OpenAI langsung tanpa secara tidak sengaja membuat giliran app-server native Codex
ditagihkan melalui API. Profil kunci API Codex eksplisit dan fallback
kunci lingkungan stdio lokal menggunakan login app-server, bukan lingkungan
proses turunan yang diwariskan. Koneksi app-server WebSocket tidak menerima fallback
kunci API lingkungan Gateway; gunakan profil autentikasi eksplisit atau akun milik
app-server jarak jauh.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat
waktu reset ketika Codex melaporkannya dan mencoba profil autentikasi berikutnya yang
telah diurutkan untuk proses Codex yang sama. Setelah waktu reset berlalu, profil
langganan kembali memenuhi syarat tanpa mengubah model `openai/gpt-*`
atau runtime Codex yang dipilih.

Saat plugin native Codex dikonfigurasi, OpenClaw menginstal atau menyegarkan
plugin tersebut melalui app-server yang terhubung sebelum menyediakan aplikasi milik plugin
kepada thread Codex. `app/list` tetap menjadi sumber kebenaran untuk id aplikasi,
aksesibilitas, dan metadata, tetapi OpenClaw mengelola keputusan pengaktifan
per thread: jika kebijakan mengizinkan aplikasi tercantum yang dapat diakses, OpenClaw
mengirim `thread/start.config.apps[appId].enabled = true` meskipun `app/list`
saat ini melaporkan bahwa aplikasi tersebut dinonaktifkan. Jalur ini tidak mengarang
instalasi aplikasi untuk id yang tidak dikenal; OpenClaw hanya mengaktifkan plugin marketplace
dengan `plugin/install`, lalu menyegarkan inventaris.

### Isolasi lingkungan

Untuk peluncuran app-server stdio lokal, OpenClaw menetapkan `CODEX_HOME` ke
direktori per agen sehingga konfigurasi Codex, file autentikasi/akun, cache/data plugin,
dan status thread native tidak membaca atau menulis ke
`~/.codex` pribadi milik operator secara default. OpenClaw mempertahankan `HOME`
proses normal; subproses yang dijalankan Codex tetap dapat menemukan konfigurasi dan token
home pengguna, dan Codex dapat menemukan entri `$HOME/.agents/skills` dan
`$HOME/.agents/plugins/marketplace.json` bersama. Dengan
`appServer.homeScope: "user"`, OpenClaw sebagai gantinya menggunakan home Codex pengguna native
dan akun yang sudah ada tanpa menyuntikkan profil autentikasi OpenClaw.

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

`appServer.clearEnv` hanya memengaruhi proses turunan app-server Codex yang
dijalankan. OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama
normalisasi peluncuran lokal: `CODEX_HOME` tetap diarahkan ke cakupan
agen atau pengguna yang dipilih, dan `HOME` tetap diwariskan agar subproses dapat menggunakan
status home pengguna normal.

### Alat dinamis dan pencarian web

Alat dinamis Codex menggunakan pemuatan `searchable` secara default. OpenClaw biasanya
tidak menyediakan alat dinamis yang menduplikasi operasi workspace native Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`get_goal`, `create_goal`, `update_goal`, `tool_call`, `tool_describe`,
`tool_search`, dan `tool_search_code`. Operasi goal tetap native di Codex,
sehingga OpenClaw tidak memproyeksikan penyimpanan goal kedua ke dalam giliran Codex. Sebagian besar
alat integrasi OpenClaw lainnya, seperti perpesanan, media, cron,
browser, node, gateway, dan `heartbeat_respond`, tersedia melalui
pencarian alat Codex di bawah namespace `openclaw`, sehingga konteks model
awal tetap lebih kecil. Fallback shell giliran terbatas adalah pengecualian untuk
`exec` dan `process` ketika daftar izin terbatas menonaktifkan Code Mode native;
daftar izin runtime dan `codexDynamicToolsExclude` tetap berlaku.

Alat yang ditandai `catalogMode: "direct-only"`, termasuk alat `computer`
OpenClaw, menggunakan namespace `openclaw_direct`. Codex memperlakukan namespace tersebut
sebagai `DirectModelOnly`, sehingga alat tersebut tetap terlihat langsung oleh model dalam thread
normal dan khusus mode kode, bukan melewati panggilan `tools.*` Code Mode bertingkat.

Pencarian web menggunakan alat `web_search` yang dihosting Codex secara default ketika pencarian
diaktifkan dan tidak ada penyedia terkelola yang dipilih. Pencarian native yang dihosting dan
alat dinamis `web_search` terkelola OpenClaw saling eksklusif agar
pencarian terkelola tidak dapat melewati pembatasan domain native. OpenClaw menggunakan
alat terkelola ketika pencarian yang dihosting tidak tersedia, dinonaktifkan secara eksplisit, atau
digantikan oleh penyedia terkelola yang dipilih. OpenClaw tetap menonaktifkan ekstensi
`web.run` mandiri Codex karena lalu lintas app-server produksi menolak
namespace `web` yang ditentukan pengguna. `tools.web.search.enabled: false`
menonaktifkan kedua jalur, demikian juga proses khusus LLM dengan alat dinonaktifkan. Codex memperlakukan
`"cached"` sebagai preferensi dan mengubahnya menjadi akses eksternal aktif untuk
giliran app-server tanpa pembatasan. Fallback terkelola otomatis gagal secara tertutup ketika
`allowedDomains` native ditetapkan agar daftar izin tidak dapat dilewati.
Perubahan kebijakan pencarian efektif yang persisten merotasi thread Codex yang terikat
sebelum giliran berikutnya; pembatasan sementara per giliran menggunakan thread
terbatas sementara dan mempertahankan pengikatan yang ada untuk dilanjutkan nanti.

`sessions_yield` dan balasan sumber khusus alat pesan tetap langsung karena
keduanya merupakan kontrak kontrol giliran. `sessions_spawn` tetap dapat dicari agar
`spawn_agent` native Codex tetap menjadi permukaan subagen Codex utama,
sementara delegasi OpenClaw atau ACP eksplisit tetap tersedia melalui
namespace alat dinamis `openclaw`. Instruksi kolaborasi Heartbeat
meminta Codex mencari `heartbeat_respond` sebelum mengakhiri giliran Heartbeat
ketika alat tersebut belum dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke app-server
Codex kustom yang tidak dapat mencari alat dinamis yang ditangguhkan atau saat
men-debug seluruh payload alat.

### Bidang konfigurasi

Bidang plugin Codex tingkat atas yang didukung:

| Bidang                     | Default        | Arti                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw secara langsung dalam konteks alat Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex. |
| `codexPlugins`             | dinonaktifkan  | Dukungan plugin/aplikasi native Codex untuk plugin terkurasi terinstal dari sumber yang telah dimigrasikan. |
| `sessionCatalog`           | diaktifkan     | Penemuan bilah samping untuk sesi native Codex pada Gateway ini dan node berpasangan yang memenuhi syarat. |
| `supervision`              | dinonaktifkan  | Kebijakan transkrip sesi native dan kontrol penulisan yang ditujukan bagi agen.           |

Bidang `appServer` yang didukung:

| Bidang                                         | Default                                                | Arti                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"unix"` yang eksplisit terhubung ke soket kontrol lokal; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status harness biasa untuk setiap agen OpenClaw. `"user"` merupakan keikutsertaan eksplisit yang membagikan `$CODEX_HOME` atau `~/.codex` native, menggunakan autentikasi native, dan mengaktifkan pengelolaan thread khusus pemilik. Cakupan pengguna mendukung stdio lokal atau transport Unix. Untuk koneksi supervisi terpisah, nilai yang tidak ditetapkan diselesaikan menjadi `"user"` untuk stdio atau Unix dan `"agent"` untuk WebSocket.     |
| `command`                                     | biner Codex terkelola                                   | Berkas yang dapat dieksekusi untuk transport stdio. Biarkan tidak ditetapkan untuk menggunakan biner terkelola; tetapkan hanya untuk penggantian eksplisit.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak ditetapkan                                                  | URL App Server WebSocket atau URL `unix://`. Jalur Unix eksplisit yang kosong memilih soket kontrol kanonis di direktori utama pengguna.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | tidak ditetapkan                                                  | Token bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan yang diwarisinya. OpenClaw mempertahankan `CODEX_HOME` yang dipilih dan `HOME` yang diwarisi untuk peluncuran lokal.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Ikut serta dalam permukaan alat khusus mode kode milik Codex. Alat dinamis OpenClaw biasa tetap tersedia melalui panggilan `tools.*` bertingkat; alat `openclaw_direct` tetap terlihat langsung oleh model.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | tidak ditetapkan                                                  | Root ruang kerja app-server Codex jarak jauh. Jika ditetapkan, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang telah diresolusi, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang telah diresolusi, OpenClaw menolak secara tertutup alih-alih mengirim jalur lokal Gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Batas waktu untuk panggilan bidang kontrol app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela hening setelah Codex menerima suatu giliran atau setelah permintaan app-server yang tercakup pada satu giliran, sementara OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Jendela hening setelah item asisten final/nonkomentar atau penyelesaian asisten mentah pra-alat mempersiapkan pelepasan keluaran asisten sementara OpenClaw masih menunggu `turn/completed`. Menaikkan nilainya memberi Codex lebih banyak waktu untuk memancarkan `turn/completed` sebelum OpenClaw menginterupsi dan melepaskan jalur sesi.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga progres dan keadaan diam penyelesaian yang digunakan setelah penyerahan alat, penyelesaian alat native, progres asisten mentah pasca-alat, penyelesaian penalaran mentah, atau progres penalaran sementara OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-alat dapat secara sah tetap hening lebih lama daripada anggaran pelepasan asisten final.                                |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang tidak menyertakan `danger-full-access`, persetujuan `never`, atau peninjau `user` menjadikan default implisit sebagai guardian.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan       | Kebijakan persetujuan Codex native yang dikirim saat memulai/melanjutkan thread/giliran. Default guardian mengutamakan `"on-request"` jika diizinkan.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan  | Mode sandbox Codex native yang dikirim saat memulai/melanjutkan thread. Default guardian mengutamakan `"workspace-write"` jika diizinkan, atau `"read-only"` jika tidak. Saat sandbox OpenClaw aktif, giliran `danger-full-access` menggunakan `workspace-write` Codex dengan akses jaringan yang diturunkan dari pengaturan egress sandbox OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan               | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native jika diizinkan, atau `guardian_subagent` maupun `user` jika tidak. `guardian_subagent` tetap menjadi alias lama.                                                                                                                                                                                                                              |
| `serviceTier`                                 | tidak ditetapkan                                                  | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan fleksibel, `null` menghapus penggantian, dan `"fast"` lama diterima sebagai `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | dinonaktifkan                                               | Ikut serta dalam jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Keikutsertaan pratinjau yang mendaftarkan lingkungan Codex yang didukung sandbox OpenClaw pada app-server Codex yang didukung agar eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw yang aktif.                                                                                                                                                                                                            |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menetapkan `features.network_proxy.enabled`
dan `default_permissions` dalam konfigurasi thread Codex agar profil
izin yang dihasilkan dapat memulai jaringan terkelola Codex. Secara default, OpenClaw
menghasilkan nama profil `openclaw-network-<fingerprint>` yang tahan benturan
dari isi profil; gunakan `profileName` hanya ketika nama lokal yang stabil
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
izin yang dihasilkan: penegakan jaringan terkelola Codex adalah jaringan
yang di-sandbox, sehingga profil akses penuh tidak akan melindungi lalu lintas keluar.
Entri domain menggunakan `allow` atau `deny`; entri soket Unix menggunakan nilai
`allow` atau `none` milik Codex.

### Batas waktu pemanggilan alat dinamis

Pemanggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan `item/tool/call` Codex secara default menggunakan watchdog
OpenClaw selama 90 detik. Argumen `timeoutMs` per pemanggilan yang positif
memperpanjang atau memperpendek anggaran alat tertentu tersebut, dengan batas maksimum 600000 ms.
Alat `image_generate` menggunakan `agents.defaults.imageGenerationModel.timeoutMs`
ketika pemanggilan alat tidak menyediakan batas waktunya sendiri, atau default
pembuatan gambar selama 120 detik jika tidak. Alat pemahaman media `image`
menggunakan `tools.media.image.timeoutSeconds` atau default medianya selama 60 detik; untuk
pemahaman gambar, batas waktu tersebut berlaku pada permintaan itu sendiri dan tidak
dikurangi oleh pekerjaan persiapan sebelumnya. Saat batas waktu terlampaui, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons alat dinamis yang gagal kepada Codex
agar giliran dapat dilanjutkan, alih-alih membiarkan sesi dalam `processing`.
Watchdog ini adalah anggaran `item/tool/call` dinamis terluar; batas waktu
permintaan khusus penyedia berjalan di dalam pemanggilan tersebut dan mempertahankan semantik batas waktunya sendiri.

Setelah Codex menerima suatu giliran, dan setelah OpenClaw merespons permintaan
app-server dalam cakupan giliran, harness mengharapkan Codex untuk membuat kemajuan pada giliran saat ini
dan pada akhirnya menyelesaikan giliran native dengan `turn/completed`. Jika
app-server tidak memberikan aktivitas selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
berupaya sebaik mungkin menginterupsi giliran Codex, mencatat batas waktu diagnostik, dan
melepaskan jalur sesi OpenClaw agar pesan obrolan lanjutan tidak
mengantre di belakang giliran native yang sudah basi. Sebagian besar notifikasi nonterminal untuk
giliran yang sama menonaktifkan watchdog singkat tersebut karena Codex telah membuktikan bahwa giliran
masih aktif.

Serah terima alat menggunakan anggaran diam pasca-alat yang lebih panjang: setelah OpenClaw mengembalikan
respons `item/tool/call`, setelah item alat native seperti
`commandExecution` selesai, setelah penyelesaian mentah `custom_tool_call_output`,
dan setelah kemajuan asisten mentah pasca-alat, penyelesaian penalaran mentah,
atau kemajuan penalaran. Pengaman menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` saat dikonfigurasi dan
secara default menggunakan lima menit jika tidak; anggaran yang sama juga memperpanjang
watchdog kemajuan untuk jendela sintesis senyap sebelum Codex memancarkan
peristiwa giliran saat ini berikutnya. Notifikasi app-server global, seperti
pembaruan batas laju, tidak mengatur ulang kemajuan diam giliran. Penyelesaian penalaran,
penyelesaian `agentMessage` komentar, serta kemajuan penalaran mentah atau
asisten pra-alat dapat diikuti oleh balasan akhir otomatis, sehingga semuanya menggunakan
pengaman balasan pasca-kemajuan alih-alih segera melepaskan jalur sesi.

Hanya item `agentMessage` selesai yang final/nonkomentar dan penyelesaian asisten mentah
pra-alat yang mengaktifkan pelepasan keluaran asisten: jika Codex kemudian
diam tanpa `turn/completed`, OpenClaw berupaya sebaik mungkin menginterupsi giliran native
dan melepaskan jalur sesi. Jika pengawas giliran lain memenangkan perlombaan pelepasan tersebut,
OpenClaw tetap menerima item asisten akhir yang telah selesai setelah tidak ada
penyelesaian permintaan native, item, atau alat dinamis yang tetap aktif dan
pelepasan keluaran asisten masih menjadi milik item terbaru yang telah selesai, tanpa
penyelesaian item berikutnya. Hal ini dapat mempertahankan jawaban akhir setelah
pekerjaan alat selesai tanpa memutar ulang giliran. Delta asisten parsial,
balasan lama sebelumnya, dan penyelesaian berikutnya yang kosong tidak memenuhi syarat.

Kegagalan app-server stdio yang aman untuk diputar ulang, termasuk batas waktu diam
penyelesaian giliran tanpa bukti asisten, alat, item aktif, atau efek samping,
dicoba ulang satu kali pada upaya app-server baru. Batas waktu yang tidak aman tetap menghentikan
klien app-server yang macet dan melepaskan jalur sesi OpenClaw; kegagalan tersebut juga
menghapus pengikatan thread native yang basi alih-alih diputar ulang
secara otomatis. Batas waktu pengawasan penyelesaian menampilkan teks batas waktu
khusus Codex: kasus yang aman untuk diputar ulang menyatakan bahwa respons mungkin tidak lengkap,
sedangkan kasus yang tidak aman memberi tahu pengguna agar memverifikasi keadaan saat ini sebelum mencoba lagi.
Diagnostik batas waktu publik mencakup bidang struktural seperti metode notifikasi
app-server terakhir, id/jenis/peran item respons asisten mentah, jumlah
permintaan/item aktif, dan status pengawas yang diaktifkan; ketika notifikasi terakhir adalah
item respons asisten mentah, diagnostik juga mencakup pratinjau teks asisten
yang dibatasi. Diagnostik tidak mencakup prompt mentah atau konten alat.

### Penggantian env untuk pengujian lokal

- `OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola ketika
  `appServer.command` tidak ditetapkan.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Sebagai gantinya, gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"`, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin
dalam berkas yang telah ditinjau yang sama dengan penyiapan harness Codex lainnya.

## Plugin native Codex

Dukungan plugin native Codex menggunakan kemampuan aplikasi dan plugin
milik app-server Codex sendiri dalam thread Codex yang sama dengan giliran harness OpenClaw. OpenClaw
tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw `codex_plugin_*`
sintetis.

`codexPlugins` hanya memengaruhi sesi yang memilih harness native Codex.
Ini tidak berpengaruh pada eksekusi harness bawaan, eksekusi penyedia OpenAI normal, pengikatan
percakapan ACP, atau harness lainnya.

Konfigurasi minimal yang dimigrasikan:

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

Konfigurasi aplikasi thread dihitung ketika OpenClaw membuat sesi harness Codex
atau mengganti pengikatan thread Codex yang basi; konfigurasi ini tidak dihitung ulang pada
setiap giliran. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang
gateway agar sesi harness Codex berikutnya dimulai dengan kumpulan aplikasi
yang diperbarui.

Untuk kelayakan migrasi, inventaris aplikasi, kebijakan tindakan destruktif,
elisitasi, dan diagnostik plugin native, lihat
[Plugin native Codex](/id/plugins/codex-native-plugins).

Akses aplikasi dan plugin di sisi OpenAI dikendalikan oleh akun Codex
yang digunakan untuk masuk dan, untuk ruang kerja Business dan Enterprise/Edu, kontrol aplikasi
ruang kerja. Lihat
[Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
untuk ikhtisar akun dan kontrol ruang kerja OpenAI.

## Penggunaan Komputer

Penggunaan Komputer memiliki panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkat: OpenClaw tidak menyertakan aplikasi kontrol desktop atau menjalankan
tindakan desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa
server MCP `computer-use` tersedia, lalu membiarkan Codex mengelola pemanggilan
alat MCP native selama giliran mode Codex.

## Batas runtime

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw untuk menjalankan
  alat tersebut, sehingga OpenClaw tetap berada dalam jalur eksekusi.
- Shell, patch, MCP, dan alat aplikasi native Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir peristiwa native tertentu melalui relay
  yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex mengelola Compaction native. OpenClaw menyimpan cerminan transkrip untuk
  riwayat kanal, pencarian, `/new`, `/reset`, serta pergantian model atau harness
  pada masa mendatang, tetapi tidak mengganti Compaction Codex dengan peringkas OpenClaw atau
  mesin konteks.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan keluaran alat
  perpesanan tetap berjalan melalui pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw,
  bukan catatan hasil alat native Codex.

Untuk lapisan hook, permukaan V1 yang didukung, penanganan izin native, pengarahan
antrean, mekanisme pengunggahan umpan balik Codex, dan detail Compaction, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini diharapkan untuk konfigurasi
baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan harness bawaan alih-alih Codex:** pastikan rute efektif
merupakan rute resmi HTTPS Platform Responses atau ChatGPT Responses yang tepat,
tidak memiliki penggantian permintaan yang dibuat pengguna, dan bahwa plugin Codex telah dipasang dan
diaktifkan. Awalan `openai/gpt-*` saja tidak cukup. Untuk pembuktian ketat selama
pengujian, tetapkan `agentRuntime.id: "codex"` penyedia atau model; Codex yang dipaksakan akan gagal
alih-alih beralih ke fallback ketika rute atau harness tidak kompatibel.

**Runtime OpenAI Codex beralih ke fallback jalur kunci API:** kumpulkan cuplikan
gateway yang telah disunting yang menampilkan model, runtime, penyedia terpilih, dan
kegagalan. Minta kolaborator yang terdampak untuk menjalankan perintah hanya-baca ini pada
host OpenClaw mereka:

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
`candidateProvider: "openai"`, dan hasil `401`, `Incorrect API key`, atau
`No API key`. Eksekusi yang telah diperbaiki seharusnya menampilkan jalur OAuth OpenAI
alih-alih kegagalan kunci API OpenAI biasa.

**Konfigurasi referensi model Codex lama masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang referensi model lama menjadi `openai/*`, menghapus pin runtime sesi dan
seluruh agen yang usang, serta mempertahankan penimpaan profil autentikasi yang ada.

**App-server ditolak:** gunakan app-server Codex stabil dari `0.143.0`
melalui `0.144.6` yang disertakan. Versi prarilis, versi dengan sufiks build, dan rilis lebih baru
yang belum divalidasi ditolak karena OpenClaw memvalidasi skema yang dihasilkan
terhadap versi app-server yang disertakan.

**`/codex status` tidak dapat terhubung:** periksa bahwa Plugin `codex`
diaktifkan, bahwa `plugins.allow` menyertakannya saat daftar izin
dikonfigurasi, serta bahwa setiap `appServer.command`, `url`, `authToken`, atau
header khusus valid.

**App-server Codex menggunakan terlalu banyak memori:** bedakan kedua proses tersebut
terlebih dahulu. OpenClaw menjalankan app-server Codex lokal sebagai proses anak Rust terpisah.
`NODE_OPTIONS=--max-old-space-size=...` hanya mengubah heap V8 Node.js milik Gateway;
pengaturan ini tidak membatasi atau memperbesar Codex. Instalasi Gateway terkelola sudah memilih
heap V8 adaptif, dan meningkatkannya dapat menyisakan lebih sedikit memori host untuk Codex. Gunakan
[pemecahan masalah memori Gateway](/id/gateway/troubleshooting#gateway-exits-during-high-memory-use)
untuk tekanan pada Gateway, dan periksa memori host atau kontainer untuk proses anak Codex.

Codex yang disertakan tidak memiliki batas heap atau RSS maupun penundaan pemuatan keluar saat tidak aktif
yang dapat dikonfigurasi. Setelah klien terakhir berhenti berlangganan, thread yang tidak aktif dapat tetap dimuat
hingga 30 menit. Pada host dengan sumber daya terbatas, kurangi fan-out subagen Codex native
sebelum meningkatkan heap Gateway:

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            args: ["-c", "agents.max_threads=3", "app-server", "--listen", "stdio://"],
          },
        },
      },
    },
  },
}
```

Pengaturan tersebut membatasi thread anak native untuk backend multiagen default
Codex yang disertakan. Jika Anda secara eksplisit mengaktifkan multiagen Codex v2, gunakan
`features.multi_agent_v2.max_concurrent_threads_per_session=3`; batas v2
mencakup thread root dan tidak dapat digabungkan dengan `agents.max_threads`.
Untuk menyediakan lebih banyak ruang memori bagi Codex, tingkatkan alokasi memori host, kontainer, atau
cgroup. Batas keras OS dapat menghentikan Codex alih-alih menerapkan tekanan balik.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan.
Lihat [referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`,
`authToken`, header, serta pastikan app-server jarak jauh menggunakan versi protokol
app-server Codex yang sama. Transport WebSocket Codex masih bersifat eksperimental
dan tidak didukung; utamakan stdio terkelola atau soket kontrol Unix lokal.

**Alat shell atau patch native diblokir dengan `Native hook relay
unavailable`:** thread Codex masih mencoba menggunakan id relai hook native
yang tidak lagi terdaftar di OpenClaw. Ini adalah masalah transport hook Codex
native, bukan kegagalan backend ACP, penyedia, GitHub, atau perintah shell.
Mulai sesi baru di percakapan yang terdampak dengan `/new` atau `/reset`,
lalu coba kembali perintah yang tidak berbahaya. Jika berhasil sekali tetapi pemanggilan alat native
berikutnya kembali gagal, perlakukan `/new` hanya sebagai solusi sementara: salin
prompt ke sesi baru setelah memulai ulang app-server Codex atau
Gateway OpenClaw agar thread lama dihapus dan pendaftaran hook native
dibuat ulang.

**Pemanggilan alat Codex membuat terlalu banyak proses hook berumur pendek:** tetapkan
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
dan mulai ulang Gateway. Ini hanya menonaktifkan subproses `PreToolUse` Codex
yang digunakan untuk deteksi loop OpenClaw beserta penanda tanpa kebijakannya. Relai
`before_tool_call` yang diwajibkan dan kebijakan alat tepercaya tetap diaktifkan.

**Model non-Codex menggunakan harness bawaan:** ini sesuai harapan, kecuali kebijakan runtime
penyedia atau model mengarahkannya ke harness lain. Referensi penyedia biasa non-OpenAI
tetap menggunakan jalur penyedia normalnya dalam mode `auto`.

**Computer Use terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan pemulihan relai hook native di atas.
Lihat [Computer Use Codex](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Supervisi Codex](/id/plugins/codex-supervision)
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
