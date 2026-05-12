---
read_when:
    - Anda ingin menggunakan kerangka server aplikasi Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan yang hanya menggunakan Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang dibundel
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-12T00:59:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI tertanam
melalui server aplikasi Codex, bukan melalui harness PI bawaan.

Gunakan harness Codex saat Anda ingin Codex menangani sesi agen tingkat rendah:
resume thread native, kelanjutan alat native, compaction native, dan
eksekusi server aplikasi. OpenClaw tetap menangani kanal chat, file sesi,
pemilihan model, alat dinamis OpenClaw, persetujuan, pengiriman media, dan
cerminan transkrip yang terlihat.

Penyiapan normal menggunakan ref model OpenAI kanonis seperti `openai/gpt-5.5`.
Jangan konfigurasi ref model `openai-codex/gpt-*`. Letakkan urutan auth agen OpenAI
di bawah `auth.order.openai`; profil `openai-codex:*` lama dan entri
`auth.order.openai-codex` tetap didukung untuk instalasi yang sudah ada.

OpenClaw memulai thread server aplikasi Codex dengan mode kode native Codex dan
khusus-mode-kode diaktifkan. Ini menjaga alat dinamis OpenClaw yang tertunda/dapat dicari
di dalam eksekusi kode dan permukaan pencarian-alat milik Codex sendiri, alih-alih menambahkan
wrapper pencarian-alat bergaya PI di atas Codex.

Untuk pemisahan model/provider/runtime yang lebih luas, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau kanal lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- Jika config Anda menggunakan `plugins.allow`, sertakan `codex`.
- Server aplikasi Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  server aplikasi Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai-codex`,
  akun server aplikasi di home Codex agen, atau profil auth kunci API Codex eksplisit.

Untuk prioritas auth, isolasi lingkungan, perintah server aplikasi kustom, penemuan model,
dan semua bidang config, lihat
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

Mulai ulang gateway setelah mengubah config plugin. Jika chat yang sudah ada sudah
memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan runtime agar giliran berikutnya
menyelesaikan harness dari config saat ini.

## Konfigurasi

Config mulai cepat adalah config harness Codex minimum yang layak. Atur opsi
harness Codex di config OpenClaw, dan gunakan CLI hanya untuk auth Codex:

| Kebutuhan                              | Atur                                                                             | Tempat                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Mengaktifkan harness                   | `plugins.entries.codex.enabled: true`                                            | Config OpenClaw                    |
| Mempertahankan instalasi plugin allowlisted | Sertakan `codex` di `plugins.allow`                                          | Config OpenClaw                    |
| Merutekan giliran agen OpenAI melalui Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*`    | Config agen OpenClaw               |
| Masuk dengan OAuth Codex               | `openclaw models auth login --provider openai-codex`                             | Profil auth CLI                    |
| Menambahkan cadangan kunci API untuk run Codex | Profil kunci API `openai:*` yang dicantumkan setelah auth langganan di `auth.order.openai` | Profil auth CLI + config OpenClaw |
| Gagal tertutup saat Codex tidak tersedia | Provider atau model `agentRuntime.id: "codex"`                                  | Config model/provider OpenClaw     |
| Menggunakan traffic API OpenAI langsung | Provider atau model `agentRuntime.id: "pi"` dengan auth OpenAI normal           | Config model/provider OpenClaw     |
| Menyetel perilaku server aplikasi      | `plugins.entries.codex.config.appServer.*`                                       | Config plugin Codex                |
| Mengaktifkan aplikasi plugin Codex native | `plugins.entries.codex.config.codexPlugins.*`                                  | Config plugin Codex                |
| Mengaktifkan Codex Computer Use        | `plugins.entries.codex.config.computerUse.*`                                     | Config plugin Codex                |

Gunakan ref model `openai/gpt-*` untuk giliran agen OpenAI yang didukung Codex. Utamakan
`auth.order.openai` untuk pengurutan langganan-dahulu/cadangan-kunci-API. Profil auth
`openai-codex:*` dan `auth.order.openai-codex` yang sudah ada tetap valid, tetapi
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
bentuk deployment, perutean gagal-tertutup, kebijakan persetujuan guardian, plugin Codex native,
dan Computer Use. Untuk daftar opsi lengkap, default, enum, penemuan,
isolasi lingkungan, timeout, dan bidang transport server aplikasi, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` di chat tempat Anda mengharapkan Codex. Giliran agen OpenAI yang didukung Codex
menampilkan:

```text
Runtime: OpenAI Codex
```

Lalu periksa status server aplikasi Codex:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas server aplikasi, akun, batas laju, server MCP,
dan skills. `/codex models` mencantumkan katalog server aplikasi Codex live untuk
harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Perutean dan pemilihan model

Jaga agar ref provider dan kebijakan runtime tetap terpisah:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan `openai-codex/gpt-*` dalam config. Jalankan `openclaw doctor --fix` untuk
  memperbaiki ref lama dan pin rute sesi usang.
- `agentRuntime.id: "codex"` bersifat opsional untuk mode otomatis OpenAI normal, tetapi berguna
  saat deployment harus gagal tertutup jika Codex tidak tersedia.
- `agentRuntime.id: "pi"` memilih provider atau model ke perilaku PI langsung saat
  itu memang disengaja.
- `/codex ...` mengontrol percakapan server aplikasi Codex native dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya saat pengguna meminta
  ACP/acpx atau adaptor harness eksternal.

Perutean perintah umum:

| Niat pengguna                  | Gunakan                                 |
| ------------------------------ | --------------------------------------- |
| Melampirkan chat saat ini      | `/codex bind [--cwd <path>]`            |
| Melanjutkan thread Codex yang ada | `/codex resume <thread-id>`          |
| Mencantumkan atau memfilter thread Codex | `/codex threads [filter]`       |
| Mengirim feedback Codex saja   | `/codex diagnostics [note]`             |
| Memulai tugas ACP/acpx         | Perintah sesi ACP/acpx, bukan `/codex`  |

| Kasus penggunaan                                      | Konfigurasi                                                      | Verifikasi                               | Catatan                            |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- | ---------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native  | `openai/gpt-*` plus plugin `codex` yang diaktifkan               | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan        |
| Gagal tertutup jika Codex tidak tersedia             | Provider atau model `agentRuntime.id: "codex"`                   | Giliran gagal alih-alih fallback PI      | Gunakan untuk deployment khusus Codex |
| Traffic kunci API OpenAI langsung melalui PI         | Provider atau model `agentRuntime.id: "pi"` dan auth OpenAI normal | `/status` menampilkan runtime PI        | Gunakan hanya saat PI disengaja    |
| Config lama                                          | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` menulis ulangnya | Jangan tulis config baru dengan cara ini |
| Adaptor Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Status tugas/sesi ACP                    | Terpisah dari harness Codex native |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya saat pemahaman gambar
harus berjalan melalui giliran server aplikasi Codex yang dibatasi. Jangan gunakan
`openai-codex/gpt-*`; doctor menulis ulang prefiks lama itu menjadi `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan config mulai cepat saat semua giliran agen OpenAI harus menggunakan Codex secara
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
`codex` menggunakan server aplikasi Codex.

### Deployment Codex gagal-tertutup

Untuk giliran agen OpenAI, `openai/gpt-*` sudah diselesaikan ke Codex saat
plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit saat Anda menginginkan aturan
gagal-tertutup tertulis:

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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan, server
aplikasi terlalu lama, atau server aplikasi tidak dapat dimulai.

## Kebijakan server aplikasi

Secara default, plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan transport
stdio. Atur `appServer.command` hanya saat Anda sengaja ingin menjalankan
executable yang berbeda. Gunakan transport WebSocket hanya saat server aplikasi sudah
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

Sesi server aplikasi stdio lokal secara default menggunakan postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit tersebut, OpenClaw memilih izin guardian yang diizinkan sebagai gantinya.
Saat sandbox OpenClaw aktif untuk sesi, OpenClaw mempersempit Codex
`danger-full-access` menjadi Codex `workspace-write` agar giliran mode kode Codex native
tetap berada di dalam ruang kerja yang di-sandbox.

Gunakan mode guardian saat Anda menginginkan peninjauan otomatis native Codex sebelum keluar dari sandbox
atau izin tambahan:

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

Mode guardian diperluas menjadi persetujuan server aplikasi Codex, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` saat persyaratan lokal mengizinkan nilai-nilai tersebut.

Untuk setiap bidang server aplikasi, urutan autentikasi, isolasi lingkungan, penemuan, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash pada channel apa pun yang
mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` memeriksa konektivitas server aplikasi, model, akun, batas laju,
  server MCP, dan skills.
- `/codex models` mencantumkan model server aplikasi Codex yang aktif.
- `/codex threads [filter]` mencantumkan thread server aplikasi Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk memadatkan thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik Codex untuk
  thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan skills server aplikasi Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam percakapan
tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta persetujuan untuk mengirim bundel umpan balik Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
obrolan grup.

Gunakan `/codex diagnostics [note]` hanya saat Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang sedang dilampirkan tanpa bundel diagnostik Gateway
lengkap.

### Periksa thread Codex secara lokal

Cara tercepat untuk memeriksa run Codex yang bermasalah sering kali adalah membuka thread Codex
native secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan id thread dari balasan `/diagnostics` yang selesai, `/codex binding`, atau
`/codex threads [filter]`.

Untuk mekanisme unggahan dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

Autentikasi dipilih dalam urutan ini:

1. Profil autentikasi OpenAI terurut untuk agen, sebaiknya di bawah
   `auth.order.openai`. Id profil `openai-codex:*` yang sudah ada tetap valid.
2. Akun yang sudah ada milik server aplikasi di rumah Codex agen tersebut.
3. Hanya untuk peluncuran server aplikasi stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun server aplikasi dan autentikasi OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang diluncurkan. Ini
membuat kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran server aplikasi Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login server aplikasi
alih-alih env proses anak yang diwarisi. Koneksi server aplikasi WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil autentikasi eksplisit atau akun
milik server aplikasi jarak jauh.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu reset
saat Codex melaporkannya dan mencoba profil autentikasi terurut berikutnya untuk run Codex
yang sama. Saat waktu reset berlalu, profil langganan kembali memenuhi syarat
tanpa mengubah model `openai/gpt-*` atau runtime Codex yang dipilih.

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

`appServer.clearEnv` hanya memengaruhi proses anak server aplikasi Codex yang diluncurkan.

Alat dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos
alat dinamis yang menduplikasi operasi ruang kerja native Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Alat integrasi OpenClaw
lainnya seperti perpesanan, sesi, media, cron, browser, node,
gateway, `heartbeat_respond`, dan `web_search` tersedia melalui pencarian alat Codex
di bawah namespace `openclaw`, sehingga konteks model awal tetap
lebih kecil.
`sessions_yield` dan balasan sumber khusus alat pesan tetap langsung karena itu
adalah kontrak kontrol giliran. Instruksi kolaborasi Heartbeat memberi tahu Codex untuk
mencari `heartbeat_respond` sebelum mengakhiri giliran heartbeat saat alat tersebut
belum dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat tersambung ke server aplikasi Codex kustom
yang tidak dapat mencari alat dinamis tertunda atau saat men-debug payload alat lengkap.

Bidang Plugin Codex tingkat atas yang didukung:

| Bidang                     | Default        | Makna                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung dalam konteks alat Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama alat dinamis OpenClaw tambahan yang dihilangkan dari giliran server aplikasi Codex.              |
| `codexPlugins`             | dinonaktifkan  | Dukungan Plugin/aplikasi Codex native untuk Plugin terkurasi yang dimigrasikan dari instalasi sumber.           |

Bidang `appServer` yang didukung:

| Bidang                        | Default                                                | Makna                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` meluncurkan Codex; `"websocket"` tersambung ke `url`.                                                                                                                                                                                |
| `command`                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                          |
| `url`                         | tidak disetel                                          | URL server aplikasi WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | tidak disetel                                          | Token bearer untuk transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Header WebSocket tambahan.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses server aplikasi stdio yang diluncurkan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen OpenClaw pada peluncuran lokal.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout untuk panggilan bidang kontrol server aplikasi.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Jendela senyap setelah permintaan server aplikasi Codex berskala giliran saat OpenClaw menunggu `turn/completed`. Naikkan ini untuk fase sintesis lambat setelah alat atau hanya status.                                                                     |
| `mode`                        | `"yolo"` kecuali persyaratan Codex lokal tidak mengizinkan YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan `danger-full-access`, persetujuan `never`, atau peninjau `user` membuat default implisit menjadi guardian.                                                   |
| `approvalPolicy`              | `"never"` atau kebijakan persetujuan guardian yang diizinkan       | Kebijakan persetujuan native Codex yang dikirim ke start/resume/turn thread. Default guardian memilih `"on-request"` saat diizinkan.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` atau sandbox guardian yang diizinkan  | Mode sandbox native Codex yang dikirim ke start/resume thread. Default guardian memilih `"workspace-write"` saat diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, `danger-full-access` dipersempit menjadi `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` atau peninjau guardian yang diizinkan               | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native saat diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias lama.                                                                      |
| `serviceTier`                 | tidak disetel                                          | Tier layanan server aplikasi Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan flex, `null` menghapus override, dan `"fast"` lama diterima sebagai `"priority"`.                                         |

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan Codex `item/tool/call` menggunakan
watchdog OpenClaw 30 detik secara default. Argumen `timeoutMs` per panggilan
yang bernilai positif memperpanjang atau memperpendek anggaran alat tertentu
itu. Alat `image_generate` juga menggunakan
`agents.defaults.imageGenerationModel.timeoutMs` ketika panggilan alat tidak
menyediakan timeout-nya sendiri, dan alat `image` untuk pemahaman media
menggunakan `tools.media.image.timeoutSeconds` atau default media 60 detiknya.
Anggaran alat dinamis dibatasi maksimum 600000 ms. Saat timeout, OpenClaw
membatalkan sinyal alat jika didukung dan mengembalikan respons alat dinamis
yang gagal ke Codex agar giliran dapat berlanjut, alih-alih membiarkan sesi
tetap dalam `processing`.

Setelah OpenClaw merespons permintaan server aplikasi bercakupan giliran Codex,
harness juga mengharapkan Codex menyelesaikan giliran native dengan
`turn/completed`. Jika server aplikasi diam selama
`appServer.turnCompletionIdleTimeoutMs` setelah respons itu, OpenClaw
menginterupsi giliran Codex dengan upaya terbaik, mencatat timeout diagnostik,
dan melepaskan jalur sesi OpenClaw agar pesan chat lanjutan tidak diantrekan di
belakang giliran native yang basi. Notifikasi non-terminal apa pun untuk giliran
yang sama, termasuk `rawResponseItem/completed`, menonaktifkan watchdog singkat
itu karena Codex telah membuktikan bahwa giliran masih hidup; watchdog terminal
yang lebih panjang tetap melindungi giliran yang benar-benar macet. Diagnostik
timeout menyertakan metode notifikasi server aplikasi terakhir dan, untuk item
respons asisten mentah, tipe item, peran, id, serta pratinjau teks asisten yang
dibatasi.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola ketika
`appServer.command` tidak diatur.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya,
atau `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali
pakai. Config lebih disukai untuk deployment yang dapat diulang karena menjaga
perilaku Plugin dalam file yang sama yang ditinjau seperti bagian lain dari
penyiapan harness Codex.

## Plugin Codex native

Dukungan Plugin Codex native menggunakan kemampuan aplikasi dan Plugin milik
server aplikasi Codex sendiri dalam thread Codex yang sama dengan giliran
harness OpenClaw. OpenClaw tidak menerjemahkan Plugin Codex menjadi alat dinamis
OpenClaw sintetis `codex_plugin_*`.

`codexPlugins` hanya memengaruhi sesi yang memilih harness Codex native. Ini
tidak berpengaruh pada eksekusi PI, eksekusi penyedia OpenAI normal, pengikatan
percakapan ACP, atau harness lainnya.

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

Config aplikasi thread dihitung ketika OpenClaw membentuk sesi harness Codex
atau mengganti pengikatan thread Codex yang basi. Ini tidak dihitung ulang pada
setiap giliran. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau
mulai ulang gateway agar sesi harness Codex di masa mendatang dimulai dengan set
aplikasi yang diperbarui.

Untuk kelayakan migrasi, inventaris aplikasi, kebijakan tindakan destruktif,
elisitasi, dan diagnostik Plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

## Computer Use

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau
menjalankan tindakan desktop sendiri. OpenClaw menyiapkan server aplikasi Codex,
memverifikasi bahwa server MCP `computer-use` tersedia, lalu membiarkan Codex
memiliki panggilan alat MCP native selama giliran mode Codex.

## Batas runtime

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw menjalankan alat-alat
  tersebut, sehingga OpenClaw tetap berada di jalur eksekusi.
- Shell, patch, MCP, dan alat aplikasi native milik Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir peristiwa native tertentu melalui
  relay yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex memiliki Compaction native. OpenClaw menyimpan cermin transkrip untuk
  riwayat channel, pencarian, `/new`, `/reset`, dan perpindahan model atau
  harness di masa mendatang.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan output alat pesan
  terus melalui pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw,
  bukan catatan hasil alat native Codex.

Untuk lapisan hook, permukaan V1 yang didukung, penanganan izin native,
pengarahan antrean, mekanisme unggah umpan balik Codex, dan detail Compaction,
lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini sudah sesuai untuk
config baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** pastikan ref model adalah
`openai/gpt-*` pada penyedia OpenAI resmi dan Plugin Codex telah diinstal serta
diaktifkan. Jika Anda membutuhkan bukti ketat saat pengujian, atur provider atau
model `agentRuntime.id: "codex"`. Runtime Codex yang dipaksa akan gagal alih-alih
fallback ke PI.

**Config lama `openai-codex/*` masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model lama ke `openai/*`, menghapus pin runtime sesi
dan seluruh agen yang basi, serta mempertahankan override profil auth yang ada.

**Server aplikasi ditolak:** gunakan server aplikasi Codex `0.125.0` atau yang
lebih baru. Prarilis versi yang sama atau versi bersufiks build seperti
`0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena OpenClaw menguji batas
bawah protokol stabil `0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa Plugin `codex` bawaan
diaktifkan, bahwa `plugins.allow` menyertakannya ketika allowlist dikonfigurasi,
dan bahwa `appServer.command`, `url`, `authToken`, atau header kustom apa pun
valid.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan.
Lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa server aplikasi jarak jauh berbicara versi protokol server
aplikasi Codex yang sama.

**Model non-Codex menggunakan PI:** ini sudah sesuai kecuali kebijakan runtime
penyedia atau model merutekannya ke harness lain. Ref penyedia non-OpenAI biasa
tetap berada pada jalur penyedia normalnya dalam mode `auto`.

**Computer Use diinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap
terjadi, mulai ulang gateway untuk membersihkan registrasi hook native yang
basi. Lihat
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
- [Hook Plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
