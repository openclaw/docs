---
read_when:
    - Anda memerlukan setiap bidang konfigurasi harness Codex
    - Anda mengubah perilaku transport, autentikasi, penemuan, atau batas waktu app-server
    - Anda sedang men-debug inisialisasi harness Codex, penemuan model, atau isolasi lingkungan
summary: Referensi konfigurasi, autentikasi, penemuan, dan server aplikasi untuk harness Codex
title: Referensi kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-10T19:42:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Referensi ini mencakup konfigurasi terperinci untuk Plugin `codex`
bawaan. Untuk penyiapan dan keputusan perutean, mulai dari
[Codex harness](/id/plugins/codex-harness).

## Permukaan konfigurasi Plugin

Semua pengaturan Codex harness berada di bawah `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Kolom tingkat atas yang didukung:

| Kolom                      | Default                  | Arti                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | diaktifkan                  | Pengaturan penemuan model untuk Codex app-server `model/list`.                                                                               |
| `appServer`                | app-server stdio terkelola | Pengaturan transport, perintah, auth, persetujuan, sandbox, dan timeout.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung di konteks alat Codex awal.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Nama alat dinamis OpenClaw tambahan yang dihilangkan dari giliran Codex app-server.                                                               |
| `codexPlugins`             | dinonaktifkan                 | Dukungan Plugin/aplikasi Codex native untuk Plugin kurasi terinstal dari sumber yang dimigrasikan. Lihat [Plugin Codex native](/id/plugins/codex-native-plugins). |
| `computerUse`              | dinonaktifkan                 | Penyiapan Codex Computer Use. Lihat [Codex Computer Use](/id/plugins/codex-computer-use).                                                          |

## Transport app-server

Secara default, OpenClaw memulai biner Codex terkelola yang dikirim bersama
Plugin bawaan:

```bash
codex app-server --listen stdio://
```

Ini menjaga versi app-server tetap terkait dengan Plugin `codex` bawaan, bukan
Codex CLI terpisah mana pun yang kebetulan terinstal secara lokal. Atur
`appServer.command` hanya saat Anda memang ingin menjalankan executable yang
berbeda.

Untuk app-server yang sudah berjalan, gunakan transport WebSocket:

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Kolom `appServer` yang didukung:

| Kolom                         | Default                                                | Arti                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                        |
| `command`                     | biner Codex terkelola                                   | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola.                                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                  |
| `url`                         | tidak diatur                                                  | URL app-server WebSocket.                                                                                                                                                                       |
| `authToken`                   | tidak diatur                                                  | Token bearer untuk transport WebSocket.                                                                                                                                                           |
| `headers`                     | `{}`                                                   | Header WebSocket tambahan.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan turunannya.                                                             |
| `requestTimeoutMs`            | `60000`                                                | Timeout untuk panggilan control-plane app-server.                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Jendela senyap setelah permintaan app-server yang tercakup pada satu giliran sementara OpenClaw menunggu `turn/completed`.                                                                                                  |
| `mode`                        | `"yolo"` kecuali persyaratan Codex lokal tidak mengizinkan YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                 |
| `approvalPolicy`              | `"never"` atau kebijakan persetujuan guardian yang diizinkan       | Kebijakan persetujuan Codex native yang dikirim ke awal thread, resume, dan giliran.                                                                                                                            |
| `sandbox`                     | `"danger-full-access"` atau sandbox guardian yang diizinkan  | Mode sandbox Codex native yang dikirim ke awal thread dan resume.                                                                                                                                      |
| `approvalsReviewer`           | `"user"` atau peninjau guardian yang diizinkan               | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native saat diizinkan.                                                                                                                   |
| `defaultWorkspaceDir`         | direktori proses saat ini                              | Workspace yang digunakan oleh `/codex bind` saat `--cwd` dihilangkan.                                                                                                                                        |
| `serviceTier`                 | tidak diatur                                                  | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan flex, dan `null` menghapus override. `"fast"` lama diterima sebagai `"priority"`. |

Plugin memblokir handshake app-server lama atau tanpa versi. Codex app-server
harus melaporkan versi stabil `0.125.0` atau yang lebih baru.

## Mode persetujuan dan sandbox

Sesi app-server stdio lokal secara default menggunakan mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Postur operator lokal tepercaya ini memungkinkan
giliran dan Heartbeat OpenClaw tanpa pengawasan tetap berjalan tanpa prompt
persetujuan native yang tidak ada orang untuk menjawabnya.

Jika file persyaratan sistem lokal Codex tidak mengizinkan nilai persetujuan,
peninjau, atau sandbox YOLO implisit, OpenClaw memperlakukan default implisit
sebagai guardian dan memilih izin guardian yang diizinkan. Entri
`[[remote_sandbox_config]]` yang mencocokkan hostname dalam file persyaratan yang
sama dihormati untuk keputusan default sandbox.

Atur `appServer.mode: "guardian"` untuk persetujuan Codex yang ditinjau
guardian:

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

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` saat nilai
tersebut diizinkan. Kolom kebijakan individual mengesampingkan `mode`. Nilai
peninjau lama `guardian_subagent` masih diterima sebagai alias kompatibilitas,
tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

## Auth dan isolasi lingkungan

Auth dipilih dalam urutan ini:

1. Profil auth OpenClaw Codex eksplisit untuk agen.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI masih
   diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, ia menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dijalankan. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embeddings atau model
OpenAI langsung tanpa membuat giliran app-server Codex native tanpa sengaja
ditagihkan melalui API.

Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan
login app-server, bukan env proses anak yang diwariskan. Koneksi app-server
WebSocket tidak menerima fallback kunci API env Gateway; gunakan profil auth
eksplisit atau akun app-server remote itu sendiri.

Peluncuran app-server stdio mewarisi lingkungan proses OpenClaw secara default,
tetapi OpenClaw memiliki bridge akun app-server Codex dan menetapkan `CODEX_HOME`
serta `HOME` ke direktori per agen di bawah state OpenClaw agen tersebut.
Pemuat skill Codex sendiri membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai tersebut diisolasi untuk peluncuran
app-server lokal. Itu menjaga skills, Plugin, konfigurasi, akun, dan state thread
Codex-native tetap tercakup pada agen OpenClaw, bukan bocor dari home Codex CLI
pribadi operator.

Plugin OpenClaw dan snapshot skill OpenClaw masih mengalir melalui registry
Plugin dan pemuat skill milik OpenClaw sendiri. Aset Codex CLI pribadi tidak.
Jika Anda memiliki skill atau Plugin Codex CLI berguna yang sebaiknya menjadi
bagian dari agen OpenClaw, inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jika deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel
tersebut ke `appServer.clearEnv`:

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

`appServer.clearEnv` hanya memengaruhi proses anak Codex app-server yang
dijalankan. `CODEX_HOME` dan `HOME` tetap dicadangkan untuk isolasi Codex per
agen milik OpenClaw pada peluncuran lokal.

## Alat dinamis

Alat dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw
tidak mengekspos alat dinamis yang menduplikasi operasi workspace Codex-native:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Alat integrasi OpenClaw yang tersisa, seperti olah pesan, sesi, media, cron,
browser, nodes, gateway, `heartbeat_respond`, dan `web_search`, tersedia
melalui pencarian alat Codex di bawah namespace `openclaw`. Ini menjaga konteks
model awal tetap lebih kecil. `sessions_yield` dan balasan sumber khusus alat
pesan tetap langsung karena keduanya adalah kontrak kendali giliran.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat menyambungkan ke app-server
Codex khusus yang tidak dapat mencari alat dinamis tertunda atau saat men-debug payload
alat lengkap.

## Batas Waktu

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`. Setiap permintaan Codex `item/tool/call` menggunakan
batas waktu pertama yang tersedia dalam urutan ini:

- Argumen `timeoutMs` per panggilan yang positif.
- Untuk `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Untuk alat `image` pemahaman media, `tools.media.image.timeoutSeconds`
  yang dikonversi ke milidetik, atau default media 60 detik.
- Default alat dinamis 30 detik.

Anggaran alat dinamis dibatasi pada 600000 md. Saat batas waktu habis, OpenClaw
membatalkan sinyal alat jika didukung dan mengembalikan respons alat dinamis
yang gagal ke Codex agar giliran dapat berlanjut alih-alih membiarkan sesi dalam
`processing`.

Setelah OpenClaw merespons permintaan app-server bercakupan giliran Codex, harness
juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server menjadi diam selama `appServer.turnCompletionIdleTimeoutMs` setelah
respons itu, OpenClaw melakukan interupsi best-effort terhadap giliran Codex,
mencatat batas waktu diagnostik, dan melepaskan jalur sesi OpenClaw agar pesan
chat lanjutan tidak mengantre di belakang giliran native yang kedaluwarsa.

Notifikasi non-terminal apa pun untuk giliran yang sama, termasuk
`rawResponseItem/completed`, menonaktifkan watchdog singkat itu karena Codex telah
membuktikan giliran masih hidup. Watchdog terminal yang lebih panjang terus
melindungi giliran yang benar-benar macet. Diagnostik batas waktu menyertakan
metode notifikasi app-server terakhir dan, untuk item respons asisten mentah,
jenis item, role, id, serta pratinjau teks asisten yang dibatasi.

## Penemuan Model

Secara default, Plugin Codex meminta model yang tersedia dari app-server.
Ketersediaan model dimiliki oleh app-server Codex, sehingga daftar dapat berubah
ketika OpenClaw meningkatkan versi `@openai/codex` bawaan atau ketika deployment
mengarahkan `appServer.command` ke biner Codex yang berbeda. Ketersediaan juga
dapat bercakupan akun. Gunakan `/codex models` pada gateway yang sedang berjalan
untuk melihat katalog live bagi harness dan akun tersebut.

Jika penemuan gagal atau habis waktu, OpenClaw menggunakan katalog fallback
bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Harness bawaan saat ini adalah `@openai/codex` `0.130.0`. Probe `model/list`
terhadap app-server bawaan tersebut mengembalikan:

| Id model              | Default | Tersembunyi | Modalitas input | Upaya reasoning          |
| --------------------- | ------- | ----------- | --------------- | ------------------------ |
| `gpt-5.5`             | Ya      | Tidak       | text, image     | low, medium, high, xhigh |
| `gpt-5.4`             | Tidak   | Tidak       | text, image     | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Tidak   | Tidak       | text, image     | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Tidak   | Tidak       | text, image     | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Tidak   | Tidak       | text            | low, medium, high, xhigh |
| `gpt-5.2`             | Tidak   | Tidak       | text, image     | low, medium, high, xhigh |

Model tersembunyi dapat dikembalikan oleh katalog app-server untuk alur internal
atau khusus, tetapi model tersebut bukan pilihan pemilih model normal.

Sesuaikan penemuan di bawah `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Nonaktifkan penemuan saat Anda ingin startup menghindari probe Codex dan hanya
menggunakan katalog fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## File Bootstrap Ruang Kerja

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native.
OpenClaw tidak menulis file dokumen proyek Codex sintetis atau bergantung pada
nama file fallback Codex untuk file persona, karena fallback Codex hanya berlaku
ketika `AGENTS.md` tidak ada.

Untuk paritas ruang kerja OpenClaw, harness Codex menyelesaikan file bootstrap
lainnya, termasuk `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` saat ada, dan meneruskannya
melalui instruksi developer Codex pada `thread/start` dan `thread/resume`.
Ini menjaga konteks persona dan profil ruang kerja tetap terlihat pada jalur
pembentuk perilaku Codex native tanpa menduplikasi `AGENTS.md`.

## Penggantian Lingkungan

Penggantian lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak ditetapkan.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai.
Konfigurasi lebih disukai untuk deployment yang dapat diulang karena menjaga
perilaku Plugin dalam file yang ditinjau yang sama dengan sisa penyiapan harness
Codex.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Penyedia OpenAI](/id/providers/openai)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
