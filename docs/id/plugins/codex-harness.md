---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan yang hanya menggunakan Codex gagal alih-alih beralih ke PI sebagai cadangan
summary: Jalankan putaran agen tersemat OpenClaw melalui kerangka server aplikasi Codex bawaan
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-10T19:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI tertanam
melalui Codex app-server, bukan harness PI bawaan.

Gunakan harness Codex saat Anda ingin Codex memiliki sesi agen tingkat rendah:
resume thread native, kelanjutan tool native, compaction native, dan
eksekusi app-server. OpenClaw tetap memiliki channel chat, file sesi, pemilihan
model, tool dinamis OpenClaw, approval, pengiriman media, dan cerminan transkrip
yang terlihat.

Penyiapan normal menggunakan ref model OpenAI kanonis seperti `openai/gpt-5.5`.
Jangan konfigurasikan ref model `openai-codex/gpt-*`. `openai-codex` adalah
penyedia profil auth untuk profil Codex OAuth atau API key Codex, bukan prefiks
penyedia model untuk konfigurasi agen baru.

Untuk pemisahan model/penyedia/runtime yang lebih luas, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `codex`.
- Codex app-server `0.125.0` atau lebih baru. Plugin bawaan mengelola binary
  Codex app-server yang kompatibel secara default, sehingga perintah `codex`
  lokal di `PATH` tidak memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai-codex`,
  akun app-server di Codex home agen, atau profil auth API key Codex eksplisit.

Untuk urutan prioritas auth, isolasi environment, perintah app-server kustom,
penemuan model, dan semua field konfigurasi, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai Cepat

Sebagian besar pengguna yang menginginkan Codex di OpenClaw menginginkan jalur
ini: masuk dengan langganan ChatGPT/Codex, aktifkan plugin `codex` bawaan, dan
gunakan ref model `openai/gpt-*` kanonis.

Masuk dengan Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Aktifkan plugin `codex` bawaan dan pilih model agen OpenAI:

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
      model: "openai/gpt-5.5",
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

Mulai ulang Gateway setelah mengubah konfigurasi plugin. Jika chat yang ada
sudah memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan
runtime agar giliran berikutnya menyelesaikan harness dari konfigurasi saat ini.

## Konfigurasi

Konfigurasi quickstart adalah konfigurasi harness Codex minimum yang layak.
Tetapkan opsi harness Codex di konfigurasi OpenClaw, dan gunakan CLI hanya untuk
auth Codex:

| Kebutuhan                              | Tetapkan                                                           | Tempat                         |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Aktifkan harness                       | `plugins.entries.codex.enabled: true`                              | Konfigurasi OpenClaw           |
| Pertahankan instalasi plugin allowlist | Sertakan `codex` di `plugins.allow`                                | Konfigurasi OpenClaw           |
| Rutekan giliran agen OpenAI lewat Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*` | Konfigurasi agen OpenClaw      |
| Masuk dengan Codex OAuth               | `openclaw models auth login --provider openai-codex`               | Profil auth CLI                |
| Gagal tertutup saat Codex tidak tersedia | Penyedia atau model `agentRuntime.id: "codex"`                    | Konfigurasi model/penyedia OpenClaw |
| Gunakan traffic OpenAI API langsung    | Penyedia atau model `agentRuntime.id: "pi"` dengan auth OpenAI normal | Konfigurasi model/penyedia OpenClaw |
| Sesuaikan perilaku app-server          | `plugins.entries.codex.config.appServer.*`                         | Konfigurasi plugin Codex       |
| Aktifkan aplikasi plugin Codex native  | `plugins.entries.codex.config.codexPlugins.*`                      | Konfigurasi plugin Codex       |
| Aktifkan Codex Computer Use            | `plugins.entries.codex.config.computerUse.*`                       | Konfigurasi plugin Codex       |

Gunakan ref model `openai/gpt-*` untuk giliran agen OpenAI yang didukung Codex.
`openai-codex` hanya nama penyedia profil auth untuk profil Codex OAuth dan
API key Codex. Jangan tulis ref model `openai-codex/gpt-*` baru.

Sisa halaman ini membahas varian umum yang harus dipilih pengguna:
bentuk deployment, routing fail-closed, kebijakan approval guardian, plugin
Codex native, dan Computer Use. Untuk daftar opsi lengkap, default, enum,
penemuan, isolasi environment, timeout, dan field transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` di chat tempat Anda mengharapkan Codex. Giliran agen OpenAI
yang didukung Codex menampilkan:

```text
Runtime: OpenAI Codex
```

Lalu periksa status Codex app-server:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, batas laju, server
MCP, dan Skills. `/codex models` mencantumkan katalog Codex app-server live
untuk harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Routing dan pemilihan model

Pisahkan ref penyedia dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan `openai-codex/gpt-*` dalam konfigurasi. Jalankan `openclaw doctor --fix` untuk
  memperbaiki ref lama dan pin rute sesi yang usang.
- `agentRuntime.id: "codex"` opsional untuk mode otomatis OpenAI normal, tetapi berguna
  saat deployment harus gagal tertutup jika Codex tidak tersedia.
- `agentRuntime.id: "pi"` memilih penyedia atau model ke perilaku PI langsung saat
  itu memang disengaja.
- `/codex ...` mengontrol percakapan Codex app-server native dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya saat pengguna meminta
  ACP/acpx atau adapter harness eksternal.

Routing perintah umum:

| Niat pengguna                  | Gunakan                                 |
| ------------------------------ | --------------------------------------- |
| Lampirkan chat saat ini        | `/codex bind [--cwd <path>]`            |
| Lanjutkan thread Codex yang ada | `/codex resume <thread-id>`             |
| Cantumkan atau filter thread Codex | `/codex threads [filter]`            |
| Kirim feedback Codex saja      | `/codex diagnostics [note]`             |
| Mulai tugas ACP/acpx           | Perintah sesi ACP/acpx, bukan `/codex`  |

| Kasus penggunaan                                      | Konfigurasikan                                                   | Verifikasi                              | Catatan                            |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native  | `openai/gpt-*` plus plugin `codex` yang diaktifkan               | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan |
| Gagal tertutup jika Codex tidak tersedia             | Penyedia atau model `agentRuntime.id: "codex"`                   | Giliran gagal alih-alih fallback PI     | Gunakan untuk deployment khusus Codex |
| Traffic API key OpenAI langsung melalui PI           | Penyedia atau model `agentRuntime.id: "pi"` dan auth OpenAI normal | `/status` menampilkan runtime PI       | Gunakan hanya saat PI disengaja    |
| Konfigurasi lama                                     | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` menulis ulang   | Jangan tulis konfigurasi baru seperti ini |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Status tugas/sesi ACP                   | Terpisah dari harness Codex native |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai/gpt-*` untuk rute OpenAI normal dan `codex/gpt-*` hanya saat pemahaman
gambar harus berjalan melalui giliran Codex app-server yang dibatasi. Jangan
gunakan `openai-codex/gpt-*`; doctor menulis ulang prefiks lama itu menjadi
`openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan konfigurasi quickstart saat semua giliran agen OpenAI harus menggunakan
Codex secara default.

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
      model: "openai/gpt-5.5",
    },
  },
}
```

### Deployment penyedia campuran

Bentuk ini mempertahankan Claude sebagai agen default dan menambahkan agen Codex bernama:

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
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

Dengan konfigurasi ini, agen `main` menggunakan jalur penyedia normalnya dan
agen `codex` menggunakan Codex app-server.

### Deployment Codex fail-closed

Untuk giliran agen OpenAI, `openai/gpt-*` sudah terselesaikan ke Codex saat
plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit saat Anda menginginkan
aturan fail-closed tertulis:

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
      model: "openai/gpt-5.5",
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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai.

## Kebijakan app-server

Secara default, plugin memulai binary Codex yang dikelola OpenClaw secara lokal
dengan transport stdio. Tetapkan `appServer.command` hanya saat Anda memang ingin
menjalankan executable lain. Gunakan transport WebSocket hanya saat app-server
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

Sesi app-server stdio lokal default ke postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit itu, OpenClaw memilih izin guardian yang diizinkan sebagai gantinya.

Gunakan mode guardian saat Anda menginginkan auto-review native Codex sebelum
sandbox escape atau izin tambahan:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Mode guardian diperluas menjadi approval Codex app-server, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` saat persyaratan lokal mengizinkan nilai tersebut.

Untuk setiap field app-server, urutan auth, isolasi environment, penemuan, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash pada channel apa pun
yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` memeriksa konektivitas app-server, model, akun, batas laju,
  server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex yang aktif.
- `/codex threads [filter]` mencantumkan thread app-server Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk memadatkan thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik Codex untuk
  thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam percakapan
tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta persetujuan untuk mengirim bundle umpan balik Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku obrolan
grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini dilampirkan tanpa bundle diagnostik Gateway
lengkap.

### Periksa thread Codex secara lokal

Cara tercepat untuk memeriksa proses Codex yang buruk sering kali adalah membuka thread
native Codex secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan id thread dari balasan `/diagnostics` yang selesai, `/codex binding`, atau
`/codex threads [filter]`.

Untuk mekanisme unggahan dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

Auth dipilih dalam urutan ini:

1. Profil auth OpenClaw Codex eksplisit untuk agen.
2. Akun app-server yang sudah ada di Codex home agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dijalankan. Ini menjaga
kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran native app-server Codex tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login
app-server, bukan env proses anak yang diwarisi. Koneksi app-server WebSocket tidak
menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau akun milik
app-server jarak jauh itu sendiri.

Jika sebuah deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
`appServer.clearEnv`:

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

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex yang dijalankan.

Tools dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos
tools dinamis yang menduplikasi operasi workspace native Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Tools integrasi OpenClaw
yang tersisa seperti perpesanan, sesi, media, cron, browser, node,
gateway, `heartbeat_respond`, dan `web_search` tersedia melalui pencarian tool Codex
di bawah namespace `openclaw`, sehingga konteks model awal tetap lebih kecil.
`sessions_yield` dan balasan sumber khusus tool pesan tetap langsung karena itu adalah
kontrak kendali giliran. Instruksi kolaborasi Heartbeat memberi tahu Codex untuk
mencari `heartbeat_respond` sebelum mengakhiri giliran heartbeat ketika tool belum
dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya ketika terhubung ke app-server Codex
kustom yang tidak dapat mencari tools dinamis tertunda atau ketika men-debug payload tool
lengkap.

Field Plugin Codex tingkat atas yang didukung:

| Field                      | Default        | Arti                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menaruh tools dinamis OpenClaw langsung dalam konteks tool Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama tools dinamis OpenClaw tambahan yang dihilangkan dari giliran app-server Codex.     |
| `codexPlugins`             | dinonaktifkan  | Dukungan Plugin/aplikasi native Codex untuk Plugin curated terpasang dari sumber yang dimigrasikan. |

Field `appServer` yang didukung:

| Field                         | Default                                                | Arti                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                    |
| `command`                     | binary Codex terkelola                                 | Executable untuk transport stdio. Biarkan tidak ditetapkan untuk menggunakan binary terkelola; tetapkan hanya untuk override eksplisit.                                                                                           |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                    |
| `url`                         | tidak ditetapkan                                       | URL app-server WebSocket.                                                                                                                                                                                                         |
| `authToken`                   | tidak ditetapkan                                       | Token Bearer untuk transport WebSocket.                                                                                                                                                                                           |
| `headers`                     | `{}`                                                   | Header WebSocket tambahan.                                                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan yang diwarisi. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`            | `60000`                                                | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Jendela senyap setelah permintaan app-server Codex berskala giliran saat OpenClaw menunggu `turn/completed`. Naikkan ini untuk fase sintesis pascatool atau hanya status yang lambat.                                             |
| `mode`                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan `danger-full-access`, approval `never`, atau reviewer `user` membuat default implisit menjadi guardian.                       |
| `approvalPolicy`              | `"never"` atau kebijakan approval guardian yang diizinkan | Kebijakan approval native Codex yang dikirim ke start/resume/turn thread. Default guardian lebih memilih `"on-request"` ketika diizinkan.                                                                                         |
| `sandbox`                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox native Codex yang dikirim ke start/resume thread. Default guardian lebih memilih `"workspace-write"` ketika diizinkan, jika tidak `"read-only"`.                                                                      |
| `approvalsReviewer`           | `"user"` atau reviewer guardian yang diizinkan         | Gunakan `"auto_review"` agar Codex meninjau prompt approval native ketika diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias legacy.                                                  |
| `serviceTier`                 | tidak ditetapkan                                       | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan routing mode cepat, `"flex"` meminta pemrosesan flex, `null` menghapus override, dan legacy `"fast"` diterima sebagai `"priority"`.                         |

Panggilan tool dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan `item/tool/call` Codex menggunakan watchdog
OpenClaw 30 detik secara default. Argumen `timeoutMs` per panggilan yang positif
memperpanjang atau mempersingkat anggaran tool spesifik tersebut. Tool `image_generate`
juga menggunakan `agents.defaults.imageGenerationModel.timeoutMs` ketika panggilan tool
tidak menyediakan timeout sendiri, dan tool `image` untuk pemahaman media menggunakan
`tools.media.image.timeoutSeconds` atau default media 60 detiknya. Anggaran tool dinamis
dibatasi maksimal 600000 ms. Saat timeout, OpenClaw membatalkan sinyal tool
jika didukung dan mengembalikan respons tool dinamis yang gagal ke Codex sehingga giliran
dapat berlanjut alih-alih meninggalkan sesi dalam `processing`.

Setelah OpenClaw merespons permintaan app-server berskala giliran Codex, harness
juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server senyap selama `appServer.turnCompletionIdleTimeoutMs` setelah respons tersebut,
OpenClaw dengan upaya terbaik menginterupsi giliran Codex, mencatat timeout diagnostik,
dan melepaskan lane sesi OpenClaw sehingga pesan obrolan tindak lanjut tidak
mengantre di belakang giliran native yang basi. Notifikasi non-terminal apa pun untuk
giliran yang sama, termasuk `rawResponseItem/completed`, menonaktifkan watchdog singkat
tersebut karena Codex telah membuktikan giliran masih hidup; watchdog terminal yang lebih
panjang terus melindungi giliran yang benar-benar macet. Diagnostik timeout menyertakan
metode notifikasi app-server terakhir dan, untuk item respons asisten mentah, jenis item,
role, id, dan pratinjau teks asisten yang dibatasi.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati binary terkelola ketika
`appServer.command` tidak ditetapkan.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali jalan. Config
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin di
file yang sama-sama ditinjau seperti penyiapan Codex harness lainnya.

## Plugin Codex native

Dukungan plugin Codex native menggunakan kemampuan app dan plugin milik Codex app-server
sendiri dalam thread Codex yang sama dengan giliran OpenClaw harness. OpenClaw
tidak menerjemahkan plugin Codex menjadi dynamic tools OpenClaw
`codex_plugin_*` sintetis.

`codexPlugins` hanya memengaruhi sesi yang memilih Codex harness native. Ini
tidak berdampak pada eksekusi PI, eksekusi provider OpenAI normal, binding percakapan
ACP, atau harness lain.

Config migrasi minimal:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

Config app thread dihitung saat OpenClaw membuat sesi Codex harness
atau mengganti binding thread Codex yang kedaluwarsa. Ini tidak dihitung ulang pada setiap giliran.
Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang gateway agar
sesi Codex harness berikutnya dimulai dengan kumpulan app yang diperbarui.

Untuk kelayakan migrasi, inventaris app, kebijakan tindakan destruktif,
elisitasi, dan diagnostik plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

## Computer Use

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau mengeksekusi
tindakan desktop sendiri. OpenClaw menyiapkan Codex app-server, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex memiliki pemanggilan tool MCP native
selama giliran mode Codex.

## Batas runtime

Codex harness hanya mengubah executor agen tertanam tingkat rendah.

- Dynamic tools OpenClaw didukung. Codex meminta OpenClaw untuk mengeksekusi
  tool tersebut, sehingga OpenClaw tetap berada di jalur eksekusi.
- Tool shell, patch, MCP, dan app native milik Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir event native tertentu melalui relay yang didukung,
  tetapi tidak menulis ulang argumen tool native.
- Codex memiliki compaction native. OpenClaw menyimpan cermin transkrip untuk riwayat
  channel, pencarian, `/new`, `/reset`, dan perpindahan model atau harness di masa depan.
- Pembuatan media, pemahaman media, TTS, approval, dan output messaging-tool
  tetap berjalan melalui pengaturan provider/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil tool transkrip yang dimiliki OpenClaw, bukan
  catatan hasil tool native Codex.

Untuk lapisan hook, surface V1 yang didukung, penanganan izin native, pengarah antrean,
mekanisme unggah umpan balik Codex, dan detail compaction, lihat
[Runtime Codex harness](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu memang diharapkan untuk
config baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** pastikan ref model adalah
`openai/gpt-*` pada provider OpenAI resmi dan plugin Codex terpasang serta diaktifkan.
Jika Anda membutuhkan bukti ketat saat pengujian, setel provider atau model
`agentRuntime.id: "codex"`. Runtime Codex paksa akan gagal alih-alih
fallback ke PI.

**Config legacy `openai-codex/*` masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model legacy ke `openai/*`, menghapus pin runtime sesi dan
seluruh agen yang usang, serta mempertahankan override auth-profile yang ada.

**App-server ditolak:** gunakan Codex app-server `0.125.0` atau yang lebih baru.
Prerelease versi yang sama atau versi bersufiks build seperti
`0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena OpenClaw menguji
batas bawah protokol stabil `0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa plugin `codex` bawaan
diaktifkan, bahwa `plugins.allow` menyertakannya saat allowlist dikonfigurasi, dan
bahwa `appServer.command`, `url`, `authToken`, atau header kustom apa pun valid.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan. Lihat
[Referensi Codex harness](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa app-server jarak jauh berbicara dengan versi protokol Codex app-server
yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali kebijakan runtime
provider atau model merutekannya ke harness lain. Ref provider non-OpenAI biasa tetap berada pada
jalur provider normalnya dalam mode `auto`.

**Computer Use terpasang tetapi tool tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah tool melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan pendaftaran hook native yang usang. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi Codex harness](/id/plugins/codex-harness-reference)
- [Runtime Codex harness](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Provider model](/id/concepts/model-providers)
- [Provider OpenAI](/id/providers/openai)
- [Plugin agent harness](/id/plugins/sdk-agent-harness)
- [Hook plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
