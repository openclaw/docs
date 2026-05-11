---
read_when:
    - Anda ingin menggunakan kerangka server aplikasi Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang dibundel
title: Kerangka Codex
x-i18n:
    generated_at: "2026-05-11T20:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI tertanam
melalui app-server Codex, bukan harness PI bawaan.

Gunakan harness Codex ketika Anda ingin Codex memiliki sesi agen tingkat rendah:
lanjutkan thread native, kelanjutan alat native, compaction native, dan
eksekusi app-server. OpenClaw tetap memiliki channel chat, file sesi, pemilihan
model, alat dinamis OpenClaw, persetujuan, pengiriman media, dan cermin
transkrip yang terlihat.

Penyiapan normal menggunakan ref model OpenAI kanonis seperti `openai/gpt-5.5`.
Jangan konfigurasi ref model `openai-codex/gpt-*`. Letakkan urutan auth agen OpenAI
di bawah `auth.order.openai`; profil `openai-codex:*` lama dan entri
`auth.order.openai-codex` tetap didukung untuk instalasi yang sudah ada.

OpenClaw memulai thread app-server Codex dengan mode kode native Codex dan
hanya-mode-kode diaktifkan. Itu menjaga alat dinamis OpenClaw yang ditunda/dapat dicari
di dalam eksekusi kode dan permukaan pencarian alat milik Codex sendiri, bukan menambahkan
pembungkus pencarian alat bergaya PI di atas Codex.

Untuk pemisahan model/provider/runtime yang lebih luas, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- Jika config Anda menggunakan `plugins.allow`, sertakan `codex`.
- App-server Codex `0.125.0` atau lebih baru. Plugin bawaan mengelola biner
  app-server Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai-codex`,
  akun app-server di home Codex milik agen, atau profil auth kunci API Codex
  eksplisit.

Untuk prioritas auth, isolasi environment, perintah app-server kustom, penemuan model,
dan semua field config, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Sebagian besar pengguna yang menginginkan Codex di OpenClaw menginginkan jalur ini: masuk dengan
langganan ChatGPT/Codex, aktifkan plugin `codex` bawaan, dan gunakan
ref model `openai/gpt-*` kanonis.

Masuk dengan OAuth Codex:

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

Jika config Anda menggunakan `plugins.allow`, tambahkan `codex` di sana juga:

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

Mulai ulang Gateway setelah mengubah config plugin. Jika chat yang sudah ada sudah
memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan runtime agar giliran
berikutnya menyelesaikan harness dari config saat ini.

## Konfigurasi

Config mulai cepat adalah config harness Codex minimum yang layak. Atur opsi
harness Codex di config OpenClaw, dan gunakan CLI hanya untuk auth Codex:

| Kebutuhan                              | Atur                                                                             | Lokasi                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Aktifkan harness                       | `plugins.entries.codex.enabled: true`                                            | Config OpenClaw                    |
| Pertahankan instalasi plugin yang diizinkan | Sertakan `codex` di `plugins.allow`                                          | Config OpenClaw                    |
| Rutekan giliran agen OpenAI melalui Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*`     | Config agen OpenClaw               |
| Masuk dengan OAuth Codex               | `openclaw models auth login --provider openai-codex`                             | Profil auth CLI                    |
| Tambahkan cadangan kunci API untuk run Codex | Profil kunci API `openai:*` yang dicantumkan setelah auth langganan di `auth.order.openai` | Profil auth CLI + config OpenClaw |
| Gagal tertutup saat Codex tidak tersedia | Provider atau model `agentRuntime.id: "codex"`                                  | Config model/provider OpenClaw     |
| Gunakan lalu lintas API OpenAI langsung | Provider atau model `agentRuntime.id: "pi"` dengan auth OpenAI normal            | Config model/provider OpenClaw     |
| Setel perilaku app-server              | `plugins.entries.codex.config.appServer.*`                                       | Config plugin Codex                |
| Aktifkan aplikasi plugin Codex native  | `plugins.entries.codex.config.codexPlugins.*`                                    | Config plugin Codex                |
| Aktifkan Computer Use Codex            | `plugins.entries.codex.config.computerUse.*`                                     | Config plugin Codex                |

Gunakan ref model `openai/gpt-*` untuk giliran agen OpenAI yang didukung Codex. Utamakan
`auth.order.openai` untuk pengurutan langganan lebih dulu/cadangan kunci API. Profil auth
`openai-codex:*` yang sudah ada dan `auth.order.openai-codex` tetap valid, tetapi
jangan tulis ref model `openai-codex/gpt-*` baru.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Dalam bentuk itu, kedua profil tetap berjalan melalui Codex untuk giliran agen
`openai/gpt-*`. Kunci API hanya fallback auth, bukan permintaan untuk beralih ke PI atau
OpenAI Responses biasa.

Sisa halaman ini membahas varian umum yang harus dipilih pengguna:
bentuk deployment, routing gagal tertutup, kebijakan persetujuan guardian, plugin Codex
native, dan Computer Use. Untuk daftar opsi lengkap, default, enum, penemuan,
isolasi environment, timeout, dan field transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` di chat tempat Anda mengharapkan Codex. Giliran agen OpenAI
yang didukung Codex menampilkan:

```text
Runtime: OpenAI Codex
```

Lalu periksa status app-server Codex:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, batas laju, server MCP,
dan skills. `/codex models` mencantumkan katalog app-server Codex live untuk
harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Routing dan pemilihan model

Pisahkan ref provider dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan `openai-codex/gpt-*` dalam config. Jalankan `openclaw doctor --fix` untuk
  memperbaiki ref lama dan pin rute sesi usang.
- `agentRuntime.id: "codex"` bersifat opsional untuk mode otomatis OpenAI normal, tetapi berguna
  saat deployment harus gagal tertutup jika Codex tidak tersedia.
- `agentRuntime.id: "pi"` memilih provider atau model ke perilaku PI langsung ketika
  itu memang disengaja.
- `/codex ...` mengontrol percakapan app-server Codex native dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya ketika pengguna meminta
  ACP/acpx atau adapter harness eksternal.

Routing perintah umum:

| Maksud pengguna                  | Gunakan                                 |
| -------------------------------- | --------------------------------------- |
| Lampirkan chat saat ini          | `/codex bind [--cwd <path>]`            |
| Lanjutkan thread Codex yang ada  | `/codex resume <thread-id>`             |
| Cantumkan atau filter thread Codex | `/codex threads [filter]`             |
| Kirim feedback Codex saja        | `/codex diagnostics [note]`             |
| Mulai tugas ACP/acpx             | Perintah sesi ACP/acpx, bukan `/codex`  |

| Kasus penggunaan                                      | Konfigurasi                                                      | Verifikasi                              | Catatan                            |
| ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native   | `openai/gpt-*` plus plugin `codex` yang diaktifkan               | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan |
| Gagal tertutup jika Codex tidak tersedia              | Provider atau model `agentRuntime.id: "codex"`                   | Giliran gagal, bukan fallback PI        | Gunakan untuk deployment khusus Codex |
| Lalu lintas kunci API OpenAI langsung melalui PI      | Provider atau model `agentRuntime.id: "pi"` dan auth OpenAI normal | `/status` menampilkan runtime PI      | Gunakan hanya ketika PI disengaja  |
| Config lama                                           | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` menulis ulangnya | Jangan tulis config baru dengan cara ini |
| Adapter Codex ACP/acpx                                | ACP `sessions_spawn({ runtime: "acp" })`                         | Status tugas/sesi ACP                   | Terpisah dari harness Codex native |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar
harus berjalan melalui giliran app-server Codex terbatas. Jangan gunakan
`openai-codex/gpt-*`; doctor menulis ulang prefiks lama itu ke `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan config mulai cepat ketika semua giliran agen OpenAI harus menggunakan Codex secara
default.

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

### Deployment provider campuran

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

Dengan config ini, agen `main` menggunakan jalur provider normalnya dan agen
`codex` menggunakan app-server Codex.

### Deployment Codex gagal tertutup

Untuk giliran agen OpenAI, `openai/gpt-*` sudah menyelesaikan ke Codex ketika
plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit ketika Anda menginginkan aturan
gagal tertutup tertulis:

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

Secara default, plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan transport
stdio. Atur `appServer.command` hanya ketika Anda memang ingin menjalankan
executable berbeda. Gunakan transport WebSocket hanya ketika app-server sudah
berjalan di tempat lain:

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

Sesi app-server stdio lokal secara default menggunakan postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit tersebut, OpenClaw memilih izin guardian yang diizinkan
sebagai gantinya. Saat sandbox OpenClaw aktif untuk sesi tersebut, OpenClaw
mempersempit Codex `danger-full-access` menjadi Codex `workspace-write` agar
giliran mode kode native Codex tetap berada di dalam workspace yang di-sandbox.

Gunakan mode guardian saat Anda menginginkan peninjauan otomatis native Codex
sebelum keluar dari sandbox atau sebelum izin tambahan:

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

Mode guardian diperluas menjadi approval app-server Codex, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` saat persyaratan lokal mengizinkan nilai-nilai
tersebut.

Untuk setiap kolom app-server, urutan auth, isolasi lingkungan, penemuan, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash di channel apa pun
yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` memeriksa konektivitas app-server, model, akun, batas laju,
  server MCP, dan skills.
- `/codex models` mencantumkan model app-server Codex yang aktif.
- `/codex threads [filter]` mencantumkan thread app-server Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk memadatkan thread yang terlampir.
- `/codex review` memulai peninjauan native Codex untuk thread yang terlampir.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik Codex untuk
  thread yang terlampir.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan skills app-server Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam percakapan
tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta persetujuan untuk mengirim bundle umpan balik Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
obrolan grup.

Gunakan `/codex diagnostics [note]` hanya saat Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini terlampir tanpa bundle diagnostik Gateway
lengkap.

### Periksa thread Codex secara lokal

Cara tercepat untuk memeriksa proses Codex yang bermasalah sering kali adalah membuka
thread native Codex secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan id thread dari balasan `/diagnostics` yang selesai, `/codex binding`, atau
`/codex threads [filter]`.

Untuk mekanika unggahan dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

Auth dipilih dalam urutan ini:

1. Profil auth OpenAI yang diurutkan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Id profil `openai-codex:*` yang sudah ada tetap valid.
2. Akun app-server yang sudah ada di Codex home milik agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dijalankan. Hal itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran app-server native Codex tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login
app-server alih-alih env proses anak yang diwariskan. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau akun
milik app-server jarak jauh.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu reset
saat Codex melaporkannya dan mencoba profil auth berurutan berikutnya untuk proses Codex
yang sama. Saat waktu reset lewat, profil langganan kembali memenuhi syarat tanpa mengubah
model `openai/gpt-*` atau runtime Codex yang dipilih.

Jika deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
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

Tool dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos
tool dinamis yang menduplikasi operasi workspace native Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Tool integrasi OpenClaw
yang tersisa seperti messaging, sessions, media, cron, browser, nodes,
gateway, `heartbeat_respond`, dan `web_search` tersedia melalui pencarian tool Codex
di bawah namespace `openclaw`, sehingga konteks model awal lebih kecil.
`sessions_yield` dan balasan sumber khusus tool pesan tetap langsung karena itu adalah
kontrak kendali giliran. Instruksi kolaborasi Heartbeat memberi tahu Codex untuk
mencari `heartbeat_respond` sebelum mengakhiri giliran heartbeat saat tool tersebut
belum dimuat.

Setel `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke app-server Codex
kustom yang tidak dapat mencari tool dinamis yang ditangguhkan atau saat men-debug payload
tool lengkap.

Kolom Plugin Codex tingkat atas yang didukung:

| Kolom                      | Default        | Arti                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menaruh tool dinamis OpenClaw secara langsung dalam konteks tool Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama tool dinamis OpenClaw tambahan untuk dihilangkan dari giliran app-server Codex.              |
| `codexPlugins`             | dinonaktifkan       | Dukungan Plugin/app native Codex untuk Plugin terkurasi terpasang dari sumber yang telah dimigrasikan.           |

Kolom `appServer` yang didukung:

| Kolom                         | Default                                                | Arti                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                |
| `command`                     | biner Codex terkelola                                   | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                          |
| `url`                         | tidak disetel                                                  | URL app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | tidak disetel                                                  | Token bearer untuk transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Header WebSocket tambahan.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Jendela senyap setelah permintaan app-server Codex berscope giliran saat OpenClaw menunggu `turn/completed`. Naikkan ini untuk fase sintesis pasca-tool atau khusus status yang lambat.                                                                     |
| `mode`                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan approval `danger-full-access`, `never`, atau peninjau `user` membuat default implisit menjadi guardian.                                                   |
| `approvalPolicy`              | `"never"` atau kebijakan approval guardian yang diizinkan       | Kebijakan approval native Codex yang dikirim ke mulai/lanjutkan/giliran thread. Default guardian lebih memilih `"on-request"` saat diizinkan.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` atau sandbox guardian yang diizinkan  | Mode sandbox native Codex yang dikirim ke mulai/lanjutkan thread. Default guardian lebih memilih `"workspace-write"` saat diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, `danger-full-access` dipersempit menjadi `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` atau peninjau guardian yang diizinkan               | Gunakan `"auto_review"` untuk membiarkan Codex meninjau prompt approval native saat diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias legacy.                                                                      |
| `serviceTier`                 | tidak disetel                                                  | Tier layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan flex, `null` menghapus override, dan legacy `"fast"` diterima sebagai `"priority"`.                                         |

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan `item/tool/call` Codex menggunakan watchdog OpenClaw 30 detik
secara default. Argumen `timeoutMs` per panggilan yang bernilai positif memperpanjang
atau memperpendek anggaran alat tertentu itu. Alat `image_generate` juga menggunakan
`agents.defaults.imageGenerationModel.timeoutMs` ketika panggilan alat tidak
menyediakan timeout-nya sendiri, dan alat `image` untuk pemahaman media menggunakan
`tools.media.image.timeoutSeconds` atau default media 60 detiknya. Anggaran alat
dinamis dibatasi hingga 600000 ms. Saat timeout, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons alat dinamis yang gagal ke Codex agar giliran
dapat berlanjut alih-alih membiarkan sesi berada dalam `processing`.

Setelah OpenClaw merespons permintaan app-server yang dicakup oleh giliran Codex,
harness juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server tidak aktif selama `appServer.turnCompletionIdleTimeoutMs` setelah respons itu,
OpenClaw berupaya sebaik mungkin menginterupsi giliran Codex, mencatat timeout diagnostik,
dan melepaskan lane sesi OpenClaw agar pesan chat lanjutan tidak
mengantre di belakang giliran native yang basi. Notifikasi non-terminal apa pun untuk
giliran yang sama, termasuk `rawResponseItem/completed`, menonaktifkan watchdog singkat itu
karena Codex telah membuktikan bahwa giliran masih hidup; watchdog terminal yang lebih panjang
terus melindungi giliran yang benar-benar macet. Diagnostik timeout menyertakan
metode notifikasi app-server terakhir dan, untuk item respons asisten mentah, jenis item,
role, id, serta pratinjau teks asisten yang dibatasi.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal satu kali. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin dalam
file yang sama-sama ditinjau dengan sisa penyiapan harness Codex.

## Plugin Codex native

Dukungan plugin Codex native menggunakan kemampuan app dan plugin milik Codex app-server
dalam thread Codex yang sama dengan giliran harness OpenClaw. OpenClaw
tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw sintetis
`codex_plugin_*`.

`codexPlugins` hanya memengaruhi sesi yang memilih harness Codex native. Ini
tidak berpengaruh pada proses PI, proses penyedia OpenAI normal, binding percakapan
ACP, atau harness lain.

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

Konfigurasi app thread dihitung ketika OpenClaw membuat sesi harness Codex
atau mengganti binding thread Codex yang basi. Ini tidak dihitung ulang pada setiap giliran.
Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai ulang gateway agar
sesi harness Codex mendatang dimulai dengan set app yang diperbarui.

Untuk kelayakan migrasi, inventaris app, kebijakan tindakan destruktif,
elicitations, dan diagnostik plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

## Computer Use

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau menjalankan
tindakan desktop sendiri. OpenClaw menyiapkan Codex app-server, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex memiliki panggilan alat MCP native
selama giliran mode Codex.

## Batas runtime

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw untuk mengeksekusi
  alat tersebut, sehingga OpenClaw tetap berada di jalur eksekusi.
- Shell, patch, MCP, dan alat app native milik Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir event native tertentu melalui relay yang didukung,
  tetapi tidak menulis ulang argumen alat native.
- Codex memiliki compaction native. OpenClaw menyimpan cermin transkrip untuk riwayat
  channel, pencarian, `/new`, `/reset`, dan pengalihan model atau harness di masa mendatang.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan output alat messaging
  terus melewati pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw, bukan
  record hasil alat native Codex.

Untuk lapisan hook, permukaan V1 yang didukung, penanganan izin native, pengarahan antrean,
mekanisme unggah umpan balik Codex, dan detail compaction, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan Masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI, bukan Codex:** pastikan ref model adalah
`openai/gpt-*` pada penyedia OpenAI resmi dan bahwa plugin Codex
terinstal dan diaktifkan. Jika Anda memerlukan bukti ketat saat pengujian, tetapkan provider atau
model `agentRuntime.id: "codex"`. Runtime Codex yang dipaksakan akan gagal alih-alih
fallback ke PI.

**Konfigurasi legacy `openai-codex/*` masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model legacy menjadi `openai/*`, menghapus pin runtime sesi dan
seluruh agen yang basi, serta mempertahankan override profil auth yang ada.

**App-server ditolak:** gunakan Codex app-server `0.125.0` atau yang lebih baru.
Prerelease versi yang sama atau versi bersufiks build seperti
`0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena OpenClaw menguji
batas bawah protokol stabil `0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa plugin `codex` bawaan
diaktifkan, bahwa `plugins.allow` menyertakannya ketika allowlist dikonfigurasi, dan
bahwa `appServer.command`, `url`, `authToken`, atau header kustom apa pun valid.

**Discovery model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan discovery. Lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa app-server jarak jauh berbicara dengan versi protokol Codex app-server
yang sama.

**Model non-Codex menggunakan PI:** itu diharapkan kecuali kebijakan runtime provider atau model
merutekannya ke harness lain. Ref penyedia non-OpenAI biasa tetap berada pada
jalur penyedia normalnya dalam mode `auto`.

**Computer Use terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan registrasi hook native yang basi. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Hook plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
