---
read_when:
    - Anda ingin menggunakan harness app-server Codex yang dibundel
    - Anda memerlukan contoh konfigurasi kerangka kerja Codex
    - Anda ingin penerapan yang hanya menggunakan Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-07T13:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agent tertanam melalui
Codex app-server alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex mengelola sesi agent tingkat rendah: penemuan
model, resume thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap mengelola kanal chat, file sesi, pemilihan model, tools,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Saat giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat
secara default menggunakan tool `message` OpenClaw jika deployment belum secara
eksplisit mengonfigurasi `messages.visibleReplies`. Agent tetap dapat
menyelesaikan giliran Codex-nya secara privat; ia hanya memposting ke kanal saat
memanggil `message(action="send")`. Tetapkan
`messages.visibleReplies: "automatic"` untuk mempertahankan balasan akhir chat
langsung pada jalur pengiriman otomatis lama.

Giliran heartbeat Codex juga mendapatkan tool `heartbeat_respond` secara default,
sehingga agent dapat mencatat apakah wake harus tetap senyap atau memberi
notifikasi tanpa menyandikan alur kontrol itu dalam teks akhir.

Panduan inisiatif khusus heartbeat dikirim sebagai instruksi developer
collaboration-mode Codex pada giliran heartbeat itu sendiri. Giliran chat biasa
memulihkan mode Default Codex alih-alih membawa filosofi heartbeat dalam prompt
runtime normalnya.

Jika Anda sedang mencoba memahami konteksnya, mulai dari
[Runtime agent](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau kanal lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute
ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agent tertanam
melalui runtime Codex app-server native. Referensi model tetap kanonis sebagai
`openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan dari
prefiks model `openai-codex/*`.

Pertama, masuk dengan Codex OAuth jika belum:

```bash
openclaw models auth login --provider openai-codex
```

Lalu aktifkan Plugin `codex` bawaan dan paksa runtime Codex:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan juga `codex` di sana:

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

Jangan gunakan `openai-codex/gpt-*` dalam konfigurasi. Prefiks itu adalah rute
lama yang ditulis ulang oleh `openclaw doctor --fix` menjadi `openai/gpt-*` di
model utama, fallback, override heartbeat/subagent/compaction, hook, override
kanal, dan pin rute sesi tersimpan yang usang.

## Perubahan yang dibuat Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                       | Cara menggunakannya                                  | Yang dilakukannya                                                           |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agent tertanam OpenClaw melalui Codex app-server.       |
| Perintah kontrol chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread Codex app-server dari percakapan pesan.      |
| Provider/katalog Codex app-server | internal `codex`, diekspos melalui harness          | Memungkinkan runtime menemukan dan memvalidasi model app-server.            |
| Jalur pemahaman media Codex       | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran Codex app-server terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                 | Hook Plugin di sekitar peristiwa native Codex       | Memungkinkan OpenClaw mengamati/memblokir peristiwa tool/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- menggantikan permukaan kunci API OpenAI langsung seperti gambar, embedding,
  speech, atau realtime
- mengonversi referensi model `openai-codex/*` tanpa `openclaw doctor --fix`
- menjadikan ACP/acpx sebagai jalur Codex default
- mengganti secara panas sesi yang sudah mencatat runtime PI
- menggantikan pengiriman kanal OpenClaw, file sesi, penyimpanan profil
  autentikasi, atau perutean pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat native `/codex`.
Jika Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan,
mengarahkan, menghentikan, atau memeriksa thread Codex dari chat, agent sebaiknya
memilih `/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit saat
pengguna meminta ACP/acpx atau sedang menguji adapter Codex ACP.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan
kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook perintah
`hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk rekaman transkrip cermin
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil tool yang netral-runtime untuk
menulis ulang hasil tool dinamis OpenClaw setelah OpenClaw menjalankan tool dan
sebelum hasilnya dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil tool transkrip milik
OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Referensi model agent OpenAI menggunakan harness secara default. Konfigurasi baru
sebaiknya mempertahankan referensi model OpenAI yang kanonis sebagai
`openai/gpt-*`; `agentRuntime.id: "codex"` tetap valid tetapi tidak lagi wajib
untuk giliran agent OpenAI. Referensi model lama `codex/*` tetap otomatis memilih
harness untuk kompatibilitas, tetapi prefiks provider lama yang didukung runtime
tidak ditampilkan sebagai pilihan model/provider normal.

Jika rute model yang dikonfigurasi masih berupa `openai-codex/*`,
`openclaw doctor --fix` menulis ulang menjadi `openai/*`. Untuk rute agent yang
cocok, ini menetapkan runtime agent ke `codex` dan mempertahankan override profil
autentikasi `openai-codex` yang ada.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                              | Referensi model          | Konfigurasi runtime                    | Rute autentikasi/profil        | Label status yang diharapkan |
| ----------------------------------------------------- | ------------------------ | -------------------------------------- | ------------------------------ | ---------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native   | `openai/gpt-*`           | dihilangkan atau `agentRuntime.id: "codex"` | Codex OAuth atau akun Codex | `Runtime: OpenAI Codex`      |
| Autentikasi kunci API OpenAI untuk model agent        | `openai/gpt-*`           | dihilangkan atau `agentRuntime.id: "codex"` | Profil kunci API `openai-codex` | `Runtime: OpenAI Codex`      |
| Konfigurasi lama yang memerlukan perbaikan doctor     | `openai-codex/gpt-*`     | diperbaiki ke `codex`                  | Autentikasi yang sudah dikonfigurasi | Periksa ulang setelah `doctor --fix` |
| Provider campuran dengan mode otomatis konservatif    | referensi khusus provider | `agentRuntime.id: "auto"`             | Per provider yang dipilih      | Bergantung pada runtime yang dipilih |
| Sesi adapter Codex ACP eksplisit                      | bergantung pada prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Autentikasi backend ACP | Status tugas/sesi ACP        |

Pemisahan pentingnya adalah provider versus runtime:

- `openai-codex/*` adalah rute lama yang ditulis ulang oleh doctor.
- `agentRuntime.id: "codex"` memerlukan harness Codex dan gagal tertutup jika
  tidak tersedia.
- `agentRuntime.id: "auto"` memungkinkan harness terdaftar mengklaim rute
  provider yang cocok; referensi agent OpenAI diselesaikan ke Codex alih-alih PI.
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol oleh chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat khusus-prefiks. Untuk penyiapan umum langganan plus
runtime Codex native, gunakan `openai/*`.
Perlakukan `openai-codex/*` sebagai konfigurasi lama yang harus ditulis ulang
oleh doctor:

| Referensi model                                  | Jalur runtime                            | Gunakan saat                                                       |
| ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| `openai/gpt-5.4`                                 | Harness Codex app-server untuk giliran agent | Anda menginginkan model agent OpenAI melalui Codex.             |
| `openai-codex/gpt-5.5`                           | Rute lama yang diperbaiki oleh doctor    | Anda menggunakan konfigurasi lama; jalankan `openclaw doctor --fix` untuk menulis ulang. |
| `openai/gpt-5.5` + profil kunci API `openai-codex` | Harness Codex app-server               | Anda menginginkan autentikasi kunci API untuk model agent OpenAI.  |

GPT-5.5 dapat muncul di rute kunci API OpenAI langsung dan rute langganan Codex
saat akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness Codex
app-server untuk runtime Codex native, atau `openai/gpt-5.5` tanpa override
runtime Codex untuk lalu lintas kunci API langsung.

Referensi lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas.
Migrasi kompatibilitas doctor menulis ulang referensi runtime lama ke referensi
model kanonis dan mencatat kebijakan runtime secara terpisah. Konfigurasi harness
app-server native baru sebaiknya menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai/gpt-*` untuk rute OpenAI normal dan `codex/gpt-*` saat pemahaman gambar
harus berjalan melalui giliran Codex app-server terbatas. Jangan gunakan
`openai-codex/gpt-*`; doctor menulis ulang prefiks lama itu menjadi
`openai/gpt-*`. Model Codex app-server harus mengiklankan dukungan input gambar;
model Codex khusus teks gagal sebelum giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif bagi sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa rekaman terstruktur `agent harness selected` milik gateway. Rekaman
itu mencakup id harness yang dipilih, alasan pemilihan, kebijakan
runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memperingatkan saat referensi model yang dikonfigurasi atau
status rute sesi tersimpan masih menggunakan `openai-codex/*`.
`openclaw doctor --fix` menulis ulang rute tersebut menjadi:

- `openai/<model>`
- `agentRuntime.id: "codex"`

Rute `codex` memaksa harness Codex native. Konfigurasi runtime PI tidak
diizinkan untuk giliran model agent OpenAI.
Doctor juga memperbaiki pin sesi tersimpan yang usang di seluruh store sesi
agent yang ditemukan sehingga percakapan lama tidak tetap tersangkut pada rute
yang dihapus.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tertanam berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi itu dan terus
menggunakannya untuk giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi
`agentRuntime` atau `OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang
menggunakan harness lain; gunakan `/new` atau `/reset` untuk memulai sesi baru
sebelum mengganti percakapan yang ada antara PI dan Codex. Ini menghindari
pemutaran ulang satu transkrip melalui dua sistem sesi native yang tidak
kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai terpaku ke PI
setelah memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk
memasukkan percakapan itu ke Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness Codex app-server muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- Codex app-server `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, sehingga perintah `codex`
  lokal di `PATH` tidak memengaruhi startup harness normal.
- Autentikasi Codex tersedia untuk proses app-server atau untuk bridge
  autentikasi Codex milik OpenClaw. Peluncuran app-server lokal menggunakan
  Codex home yang dikelola OpenClaw untuk tiap agen dan `HOME` anak yang
  terisolasi, sehingga secara default tidak membaca akun, skills, plugins,
  konfigurasi, status thread, atau `$HOME/.agents/skills` native pribadi Anda
  dari `~/.codex`.

Plugin memblokir handshake app-server yang lebih lama atau tidak berversi. Ini
menjaga OpenClaw tetap pada permukaan protokol yang sudah diuji.

Untuk smoke test live dan Docker, autentikasi biasanya berasal dari akun Codex
CLI atau profil autentikasi OpenClaw `openai-codex`. Peluncuran app-server stdio
lokal juga dapat fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` saat tidak ada
akun.

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui discovery dokumen proyek native.
OpenClaw tidak menulis file dokumen proyek Codex sintetis atau bergantung pada
nama file fallback Codex untuk file persona, karena fallback Codex hanya berlaku
saat `AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap
lainnya (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, dan `MEMORY.md` jika ada) lalu meneruskannya melalui instruksi
developer Codex pada `thread/start` dan `thread/resume`. Ini menjaga konteks
persona/profil workspace `SOUL.md` dan yang terkait tetap terlihat di jalur
pembentukan perilaku native Codex tanpa menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agen yang sama
harus bebas beralih antara Codex dan model provider non-Codex. Runtime yang
dipaksa berlaku untuk setiap giliran tertanam bagi agen atau sesi tersebut. Jika
Anda memilih model Anthropic saat runtime itu dipaksa, OpenClaw tetap mencoba
harness Codex dan gagal tertutup alih-alih diam-diam merutekan giliran itu
melalui PI.

Gunakan salah satu bentuk berikut sebagai gantinya:

- Tempatkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk
  penggunaan provider campuran normal.
- Gunakan ref lama `codex/*` hanya untuk kompatibilitas. Konfigurasi baru
  sebaiknya memilih `openai/*` plus kebijakan runtime Codex eksplisit.

Sebagai contoh, ini mempertahankan agen default pada pemilihan otomatis normal
dan menambahkan agen Codex terpisah:

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
      agentRuntime: {
        id: "auto",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Dengan bentuk ini:

- Agen `main` default menggunakan jalur provider normal dan fallback
  kompatibilitas PI.
- Agen `codex` menggunakan harness Codex app-server.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran akan gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan intensi, bukan hanya kata
"Codex":

| Pengguna meminta...                                          | Agen harus menggunakan...                         |
| ------------------------------------------------------------ | ------------------------------------------------- |
| "Ikat chat ini ke Codex"                                     | `/codex bind`                                     |
| "Lanjutkan thread Codex `<id>` di sini"                      | `/codex resume <id>`                              |
| "Tampilkan thread Codex"                                     | `/codex threads`                                  |
| "Ajukan laporan dukungan untuk run Codex yang buruk"         | `/diagnostics [note]`                             |
| "Kirim feedback Codex hanya untuk thread terlampir ini"      | `/codex diagnostics [note]`                       |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex"  | `openai/*`                                        |
| "Perbaiki pin konfigurasi/sesi lama `openai-codex/*`"        | `openclaw doctor --fix`                           |
| "Jalankan Codex melalui ACP/acpx"                            | ACP `sessions_spawn({ runtime: "acp", ... })`     |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread"      | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen saat ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak
tersedia, system prompt dan Skills Plugin tidak boleh mengajari agen tentang
perutean ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen
tertanam menggunakan Codex. Runtime Plugin eksplisit gagal tertutup dan tidak
pernah diam-diam dicoba ulang melalui PI:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Override environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap
menggunakan pemilihan otomatis normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Gunakan perintah sesi normal untuk berpindah agen dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server
sidecar-nya sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk
thread tersebut dan membiarkan giliran berikutnya menyelesaikan harness dari
konfigurasi saat ini lagi.

## Discovery model

Secara default, Plugin Codex meminta daftar model yang tersedia kepada
app-server. Jika discovery gagal atau timeout, Plugin menggunakan katalog
fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyesuaikan discovery di bawah
`plugins.entries.codex.config.discovery`:

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

Nonaktifkan discovery saat Anda ingin startup menghindari probing Codex dan tetap
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

## Koneksi dan kebijakan app-server

Secara default, Plugin memulai biner Codex yang dikelola OpenClaw secara lokal
dengan:

```bash
codex app-server --listen stdio://
```

Biner yang dikelola dikirim bersama paket Plugin `codex`. Ini menjaga versi
app-server tetap terikat ke Plugin bawaan, bukan ke Codex CLI terpisah mana pun
yang kebetulan terinstal secara lokal. Tetapkan `appServer.command` hanya saat
Anda sengaja ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang
digunakan untuk Heartbeat otonom: Codex dapat menggunakan shell dan tool jaringan
tanpa berhenti pada prompt persetujuan native yang tidak ada orang di sekitar
untuk menjawabnya.

Untuk ikut menggunakan persetujuan yang ditinjau guardian Codex, tetapkan
`appServer.mode: "guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Mode Guardian menggunakan jalur persetujuan auto-review native Codex. Saat Codex
meminta keluar dari sandbox, menulis di luar workspace, atau menambahkan izin
seperti akses jaringan, Codex merutekan permintaan persetujuan itu ke peninjau
native, bukan prompt manusia. Peninjau menerapkan kerangka risiko Codex dan
menyetujui atau menolak permintaan spesifik tersebut. Gunakan Guardian saat Anda
menginginkan guardrail lebih banyak daripada mode YOLO tetapi tetap memerlukan
agen tanpa pendamping untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`. Field
kebijakan individual tetap meng-override `mode`, sehingga deployment lanjutan
dapat mencampur preset dengan pilihan eksplisit. Nilai peninjau lama
`guardian_subagent` masih diterima sebagai alias kompatibilitas, tetapi
konfigurasi baru sebaiknya menggunakan `auto_review`.

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
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Peluncuran app-server stdio mewarisi environment proses OpenClaw secara default,
tetapi OpenClaw memiliki bridge akun Codex app-server dan menetapkan
`CODEX_HOME` serta `HOME` ke direktori per agen di bawah state OpenClaw milik
agen tersebut. Skill loader Codex sendiri membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai terisolasi untuk peluncuran
app-server lokal. Itu menjaga skills, plugins, konfigurasi, akun, dan state
thread native Codex tetap dalam cakupan agen OpenClaw alih-alih bocor dari Codex
CLI home pribadi operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry
Plugin dan skill loader milik OpenClaw sendiri. Aset Codex CLI pribadi tidak.
Jika Anda memiliki skills atau plugins Codex CLI yang berguna dan seharusnya
menjadi bagian dari agen OpenClaw, inventarisasi secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider migrasi Codex menyalin skills ke workspace agen OpenClaw saat ini.
Plugins, hooks, dan file konfigurasi native Codex dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan otomatis, karena semuanya dapat
mengeksekusi perintah, mengekspos server MCP, atau membawa kredensial.

Autentikasi dipilih dalam urutan ini:

1. Profil autentikasi Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang sudah ada di Codex home milik agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan autentikasi OpenAI masih
   diperlukan.

Saat OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT,
OpenClaw menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex
yang di-spawn. Itu menjaga API key tingkat Gateway tetap tersedia untuk
embeddings atau model OpenAI langsung tanpa membuat giliran native Codex
app-server tidak sengaja ditagihkan melalui API. Profil API-key Codex eksplisit
dan fallback env-key stdio lokal menggunakan login app-server alih-alih env
proses anak yang diwariskan. Koneksi app-server WebSocket tidak menerima
fallback API-key env Gateway; gunakan profil autentikasi eksplisit atau akun
milik app-server remote sendiri.

Jika deployment memerlukan isolasi environment tambahan, tambahkan variabel
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
di-spawn.

Codex dynamic tools default ke profil `native-first`. Dalam mode itu,
OpenClaw tidak mengekspos dynamic tools yang menduplikasi operasi workspace
native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Alat integrasi OpenClaw seperti perpesanan, sesi, media,
cron, browser, node, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Field Plugin Codex tingkat atas yang didukung:

| Field                      | Default          | Arti                                                                                          |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set lengkap dynamic tool OpenClaw ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama dynamic tool OpenClaw tambahan yang dihilangkan dari turn app-server Codex.              |

Field `appServer` yang didukung:

| Field                         | Default                                  | Arti                                                                                                                                                                                                                                  |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                         |
| `command`                     | binary Codex terkelola                   | Executable untuk transport stdio. Biarkan tidak diatur untuk memakai binary terkelola; atur hanya untuk override eksplisit.                                                                                                           |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                        |
| `url`                         | tidak diatur                             | URL app-server WebSocket.                                                                                                                                                                                                             |
| `authToken`                   | tidak diatur                             | Token Bearer untuk transport WebSocket.                                                                                                                                                                                               |
| `headers`                     | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                            |
| `clearEnv`                    | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`            | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Jendela senyap setelah request app-server Codex berscope turn saat OpenClaw menunggu `turn/completed`. Naikkan ini untuk fase sintesis pasca-tool atau hanya-status yang lambat.                                                       |
| `mode`                        | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                               |
| `approvalPolicy`              | `"never"`                                | Kebijakan approval native Codex yang dikirim ke thread start/resume/turn.                                                                                                                                                             |
| `sandbox`                     | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke thread start/resume.                                                                                                                                                                        |
| `approvalsReviewer`           | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt approval native. `guardian_subagent` tetap merupakan alias lama.                                                                                                                   |
| `serviceTier`                 | tidak diatur                             | Tier layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                                                                                                                       |

Panggilan dynamic tool milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap request Codex `item/tool/call` harus
menerima respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan
sinyal tool jika didukung dan mengembalikan respons dynamic-tool yang gagal ke
Codex sehingga turn dapat berlanjut, bukan membiarkan sesi dalam `processing`.

Setelah OpenClaw merespons request app-server berscope turn Codex, harness
juga mengharapkan Codex menyelesaikan turn native dengan `turn/completed`. Jika
app-server senyap selama `appServer.turnCompletionIdleTimeoutMs` setelah
respons itu, OpenClaw berupaya sebaik mungkin menginterupsi turn Codex,
mencatat timeout diagnostik, dan melepas lane sesi OpenClaw agar pesan chat
lanjutan tidak mengantre di belakang turn native yang basi. Notifikasi
non-terminal apa pun untuk turn yang sama, termasuk `rawResponseItem/completed`,
menonaktifkan watchdog pendek itu karena Codex telah membuktikan turn masih
hidup; watchdog terminal yang lebih panjang tetap melindungi turn yang benar-
benar macet. Diagnostik timeout menyertakan metode notifikasi app-server
terakhir dan, untuk item respons asisten mentah, jenis item, peran, id, serta
pratinjau teks asisten yang dibatasi.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati binary terkelola saat
`appServer.command` tidak diatur.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Config
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin di
file yang ditinjau yang sama dengan setup harness Codex lainnya.

## Penggunaan komputer

Computer Use dibahas dalam panduan setup tersendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau menjalankan
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa
server MCP `computer-use` tersedia, lalu membiarkan Codex menangani panggilan
tool MCP native selama turn mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Codex Computer Use](/id/plugins/codex-computer-use) untuk perbedaan
antara Computer Use milik Codex dan pendaftaran MCP langsung.

Config minimal:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Setup dapat diperiksa atau diinstal dari permukaan command:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use khusus macOS dan mungkin memerlukan izin OS lokal sebelum server
MCP Codex dapat mengontrol app. Jika `computerUse.enabled` true dan server MCP
tidak tersedia, turn mode Codex gagal sebelum thread dimulai alih-alih berjalan
diam-diam tanpa tool Computer Use native. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog remote, alasan status, dan troubleshooting.

Saat `computerUse.autoInstall` true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop bundel standar dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah runtime atau config Computer Use agar sesi yang ada tidak menyimpan
binding thread PI atau Codex lama.

## Resep umum

Codex lokal dengan transport stdio default:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validasi harness khusus Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
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

Approval Codex yang ditinjau guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remote dengan header eksplisit:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Pergantian model tetap dikontrol OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, turn berikutnya mengirim model
OpenAI, provider, kebijakan approval, sandbox, dan tier layanan yang saat ini
dipilih ke app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2`
mempertahankan binding thread tetapi meminta Codex melanjutkan dengan model
yang baru dipilih.

## Command Codex

Plugin bundel mendaftarkan `/codex` sebagai slash command resmi. Command ini
generik dan berfungsi di channel mana pun yang mendukung command teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` menautkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk memadatkan thread yang tertaut.
- `/codex review` memulai peninjauan native Codex untuk thread yang tertaut.
- `/codex diagnostics [note]` meminta persetujuan sebelum mengirim umpan balik diagnostik Codex untuk thread yang tertaut.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` memasang Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

Ketika Codex melaporkan kegagalan batas penggunaan, OpenClaw menyertakan waktu
reset app-server berikutnya jika Codex menyediakannya. Gunakan `/codex account` dalam
percakapan yang sama untuk memeriksa akun dan jendela batas laju saat ini.

### Alur kerja debugging umum

Ketika agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau kanal lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan tersebut membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga
   mengirim bundel umpan balik Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan itu mencakup jalur bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   thread native Codex sehingga Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa ia memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini tertaut tanpa bundel diagnostik OpenClaw
Gateway lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena mengikat status Gateway lokal dan id thread Codex
bersama dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku obrolan grup.

Core OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan pembukaan data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan exec eksplisit
setiap kali. Jangan menyetujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan,
OpenClaw mengirim laporan yang dapat ditempel dengan jalur bundel lokal dan ringkasan
manifest. Ketika sesi OpenClaw aktif menggunakan harness Codex,
persetujuan yang sama juga mengotorisasi pengiriman bundel umpan balik Codex yang relevan ke
server OpenAI. Prompt persetujuan menyatakan bahwa umpan balik Codex akan dikirim, tetapi
tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam obrolan grup, OpenClaw menjaga
kanal bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sedangkan
pembukaan diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` app-server Codex dan meminta
app-server menyertakan log untuk setiap thread yang tercantum dan subthread Codex yang dibuat
jika tersedia. Unggahan berjalan melalui jalur umpan balik normal Codex ke server OpenAI;
jika umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan
galat app-server. Balasan diagnostik yang selesai mencantumkan kanal,
id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke app-server, dan tetap mengaktifkan riwayat
diperpanjang.

### Memeriksa thread Codex dari CLI

Cara tercepat untuk memahami run Codex yang buruk sering kali adalah membuka thread native Codex
secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan kanal dan ingin memeriksa
sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia membuat
pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai mencantumkan
setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk obrolan saat ini atau
`/codex threads [filter]` untuk thread app-server Codex terbaru, lalu menjalankan perintah
`codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan app-server Codex `0.125.0` atau lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau khusus tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk merutekan
perilaku Plugin OpenClaw. Untuk jembatan alat native dan izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Ketika persetujuan app-server Codex diaktifkan
(`approvalPolicy` bukan `"never"`), konfigurasi hook native bawaan yang disuntikkan
menghilangkan `PermissionRequest` sehingga peninjau app-server Codex dan jembatan persetujuan
OpenClaw menangani eskalasi nyata setelah peninjauan. Operator tetap dapat secara eksplisit menambahkan
`permission_request` ke `nativeHookRelay.events` ketika mereka membutuhkan relay
kompatibilitas. Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi
kontrol tingkat Codex; hook tersebut tidak diekspos sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku plugin dan middleware yang dimilikinya di
adaptor harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis.
OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread native Codex
kecuali Codex mengekspos operasi tersebut melalui app-server atau callback hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server Codex
dan status adaptor OpenClaw, bukan perintah hook native Codex.
Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adaptor, bukan tangkapan byte-demi-byte
dari permintaan internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak
bagian dari loop model native, dan OpenClaw menyesuaikan permukaan plugin dan sesinya
di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                                                             | Alasan                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                                                             | Codex app-server memiliki giliran OpenAI, pelanjutan thread native, dan pelanjutan tool native.                                                                                                            |
| Perutean dan pengiriman kanal OpenClaw        | Didukung                                                                             | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lain tetap berada di luar runtime model.                                                                                                           |
| Tool dinamis OpenClaw                         | Didukung                                                                             | Codex meminta OpenClaw mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                            |
| Plugin prompt dan konteks                     | Didukung                                                                             | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                     |
| Siklus hidup mesin konteks                    | Didukung                                                                             | Perakitan, ingestion atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                              |
| Hook tool dinamis                             | Didukung                                                                             | Middleware `before_tool_call`, `after_tool_call`, dan hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                          |
| Hook siklus hidup                             | Didukung sebagai observasi adapter                                                   | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                           |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native                                                   | Codex `Stop` direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu pass model lagi sebelum finalisasi.                                                                                 |
| Shell, patch, dan MCP native diblokir atau diamati | Didukung melalui relay hook native                                              | Codex `PreToolUse` dan `PostToolUse` direlay untuk permukaan tool native yang dikomit, termasuk payload MCP pada Codex app-server `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui persetujuan Codex app-server dan relay hook native kompatibilitas   | Permintaan persetujuan Codex app-server dirutekan melalui OpenClaw setelah peninjauan Codex. Relay hook native `PermissionRequest` bersifat opt-in untuk mode persetujuan native karena Codex memancarkannya sebelum peninjauan guardian. |
| Penangkapan trajektori app-server             | Didukung                                                                             | OpenClaw merekam permintaan yang dikirimkannya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                   |

Tidak didukung di runtime Codex v1:

| Permukaan                                           | Batasan V1                                                                                                                                       | Jalur ke depan                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Mutasi argumen tool native                          | Hook pra-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen tool native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input tool pengganti.                         |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API Codex app-server eksplisit jika pembedahan thread native diperlukan.       |
| `tool_result_persist` untuk catatan tool native Codex | Hook tersebut mentransformasi penulisan transkrip milik OpenClaw, bukan catatan tool native Codex.                                             | Dapat mencerminkan catatan yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya                | OpenClaw mengamati awal dan penyelesaian Compaction, tetapi tidak menerima daftar kept/dropped yang stabil, delta token, atau payload ringkasan. | Memerlukan peristiwa Compaction Codex yang lebih kaya.                                    |
| Intervensi Compaction                               | Hook Compaction OpenClaw saat ini berada pada level notifikasi dalam mode Codex.                                                                | Tambahkan hook pra/pasca Compaction Codex jika plugin perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte-demi-byte     | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI akhir secara internal.         | Memerlukan peristiwa pelacakan permintaan model Codex atau API debug.                    |

## Tool, media, dan Compaction

Harness Codex hanya mengubah executor agen tersemat tingkat rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output tool pesan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur tool dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan berasumsi setiap peristiwa hook
Codex mendatang adalah permukaan plugin OpenClaw sampai kontrak runtime
menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan allow atau deny
eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah allow.
Codex memperlakukannya sebagai tidak ada keputusan hook dan meneruskannya ke
jalur guardian atau persetujuan penggunanya sendiri. Mode persetujuan Codex
app-server menghilangkan hook native ini secara default; paragraf ini berlaku
ketika `permission_request` disertakan secara eksplisit dalam
`nativeHookRelay.events` atau runtime kompatibilitas memasangnya.
Ketika operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat fingerprint input provider/session/tool/cwd yang persis itu
untuk jendela sesi terbatas. Keputusan yang diingat sengaja hanya exact-match:
perintah, argumen, payload tool, atau cwd yang berubah membuat persetujuan baru.

Elisitasi persetujuan tool MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt Codex `request_user_input` dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang mengantre menjawab permintaan
server native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lain tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke Codex app-server `turn/steer`. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
mengantre selama jendela senyap yang dikonfigurasi dan mengirimkannya sebagai
satu permintaan `turn/steer` dalam urutan kedatangan. Mode legacy `queue`
mengirim permintaan `turn/steer` terpisah. Peninjauan Codex dan giliran
Compaction manual dapat menolak pengarahan same-turn, dalam hal ini OpenClaw
menggunakan antrean followup ketika mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke Codex app-server. OpenClaw menyimpan cermin transkrip untuk
riwayat kanal, pencarian, `/new`, `/reset`, dan peralihan model atau harness di
masa mendatang. Cermin tersebut mencakup prompt pengguna, teks asisten akhir,
dan catatan penalaran atau rencana Codex ringan ketika app-server memancarkannya.
Saat ini, OpenClaw hanya merekam sinyal awal dan penyelesaian Compaction native.
OpenClaw belum mengekspos ringkasan Compaction yang dapat dibaca manusia atau
daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah
Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang catatan hasil tool native Codex. Hook ini hanya berlaku ketika
OpenClaw menulis hasil tool transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang cocok seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan Masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref legacy `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow`
mengecualikan `codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian.
Runtime Codex yang dipaksa gagal alih-alih fallback ke PI. Setelah Codex
app-server dipilih, kegagalannya muncul langsung.

**App-server ditolak:** tingkatkan Codex agar handshake app-server
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis versi yang sama atau
versi bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak
karena lantai protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server remote berbicara versi protokol Codex app-server yang sama.

**Model non-Codex menggunakan PI:** itu diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref legacy
`codex/*`. `openai/gpt-*` biasa dan ref provider lain tetap berada di jalur
provider normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap giliran tersemat
untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
Gateway untuk menghapus pendaftaran native hook yang usang. Jika `computer-use.list_apps`
mengalami timeout, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook Plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
