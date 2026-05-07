---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui rangkaian app-server Codex bawaan
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-07T01:53:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
Codex app-server, bukan melalui harness PI bawaan.

Gunakan ini ketika Anda ingin Codex menangani sesi agen tingkat rendah: penemuan
model, pelanjutan thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap menangani kanal chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Ketika giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat
secara default menggunakan alat `message` OpenClaw jika deployment belum secara
eksplisit mengonfigurasi `messages.visibleReplies`. Agen tetap dapat menyelesaikan
giliran Codex-nya secara privat; ia hanya memposting ke kanal ketika memanggil
`message(action="send")`. Atur `messages.visibleReplies: "automatic"` untuk
mempertahankan balasan akhir chat langsung pada jalur pengiriman otomatis lama.

Giliran heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara default,
sehingga agen dapat mencatat apakah wake harus tetap senyap atau memberi
notifikasi tanpa mengodekan alur kontrol tersebut dalam teks akhir.

Panduan inisiatif khusus heartbeat dikirim sebagai instruksi developer mode
kolaborasi Codex pada giliran heartbeat itu sendiri. Giliran chat biasa
memulihkan mode Default Codex alih-alih membawa filosofi heartbeat dalam prompt
runtime normalnya.

Jika Anda sedang mencoba memahami konteksnya, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau kanal lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute
ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam
melalui runtime Codex app-server native. Referensi model tetap kanonis sebagai
`openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan dari
prefiks model `openai-codex/*`.

Pertama, masuk dengan Codex OAuth jika Anda belum melakukannya:

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

Jangan gunakan `openai-codex/gpt-*` dalam konfigurasi. Prefiks tersebut adalah
rute lama yang ditulis ulang oleh `openclaw doctor --fix` menjadi `openai/gpt-*`
di seluruh model utama, fallback, override heartbeat/subagen/compaction, hook,
override kanal, dan pin rute sesi persisten yang usang.

## Apa yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                       | Cara menggunakannya                                 | Yang dilakukannya                                                            |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui Codex app-server.          |
| Perintah kontrol-chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread Codex app-server dari percakapan pesan.        |
| Penyedia/katalog Codex app-server | internal `codex`, diekspos melalui harness          | Memungkinkan runtime menemukan dan memvalidasi model app-server.              |
| Jalur pemahaman media Codex       | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran Codex app-server terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                 | Hook Plugin di sekitar peristiwa Codex-native       | Memungkinkan OpenClaw mengamati/memblokir peristiwa alat/finalisasi Codex-native yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi referensi model `openai-codex/*` menjadi runtime native tanpa doctor
  memverifikasi bahwa Codex terinstal, aktif, menyumbangkan harness `codex`,
  dan siap OAuth
- menjadikan ACP/acpx sebagai jalur Codex default
- melakukan hot-switch pada sesi yang sudah ada yang telah mencatat runtime PI
- menggantikan pengiriman kanal OpenClaw, file sesi, penyimpanan profil autentikasi, atau
  perutean pesan

Plugin yang sama juga menangani permukaan perintah kontrol-chat native `/codex`.
Jika Plugin aktif dan pengguna meminta untuk mengikat, melanjutkan, mengarahkan,
menghentikan, atau memeriksa thread Codex dari chat, agen sebaiknya memilih
`/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit ketika pengguna
meminta ACP/acpx atau sedang menguji adapter ACP Codex.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan
kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook perintah
Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip yang dicerminkan
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral-runtime untuk
menulis ulang hasil alat dinamis OpenClaw setelah OpenClaw menjalankan alat dan
sebelum hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip milik
OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru sebaiknya mempertahankan
referensi model OpenAI yang kanonis sebagai `openai/gpt-*` dan secara eksplisit
memaksa `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` ketika
menginginkan eksekusi app-server native. Referensi model lama `codex/*` masih
memilih harness secara otomatis untuk kompatibilitas, tetapi prefiks penyedia
lama yang didukung runtime tidak ditampilkan sebagai pilihan model/penyedia
normal.

Jika ada rute model yang dikonfigurasi masih `openai-codex/*`, `openclaw doctor --fix`
menulis ulang rute tersebut menjadi `openai/*`. Untuk rute agen yang cocok, ia
mengatur runtime agen ke `codex` hanya ketika Plugin Codex terinstal, aktif,
menyumbangkan harness `codex`, dan memiliki OAuth yang dapat digunakan; jika
tidak, ia mengatur runtime ke `pi`.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                          | Referensi model          | Konfigurasi runtime                    | Rute autentikasi/profil      | Label status yang diharapkan   |
| ------------------------------------------------- | ------------------------ | -------------------------------------- | ---------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*`           | `agentRuntime.id: "codex"`             | OAuth Codex atau akun Codex  | `Runtime: OpenAI Codex`        |
| OpenAI API melalui runner OpenClaw normal         | `openai/gpt-*`           | dihilangkan atau `runtime: "pi"`       | Kunci OpenAI API             | `Runtime: OpenClaw Pi Default` |
| Konfigurasi lama yang perlu diperbaiki doctor     | `openai-codex/gpt-*`     | diperbaiki ke `codex` atau `pi`        | Autentikasi yang sudah dikonfigurasi | Periksa ulang setelah `doctor --fix` |
| Penyedia campuran dengan mode otomatis konservatif | referensi khusus penyedia | `agentRuntime.id: "auto"`              | Per penyedia yang dipilih    | Bergantung pada runtime yang dipilih |
| Sesi adapter ACP Codex eksplisit                  | bergantung pada prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Autentikasi backend ACP      | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` adalah rute lama yang ditulis ulang oleh doctor.
- `agentRuntime.id: "codex"` memerlukan harness Codex dan gagal secara tertutup jika
  tidak tersedia.
- `agentRuntime.id: "auto"` memungkinkan harness terdaftar mengklaim rute penyedia
  yang cocok, tetapi referensi OpenAI kanonis tetap dimiliki PI kecuali sebuah
  harness mendukung pasangan penyedia/model tersebut.
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol oleh chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik-prefiks. Untuk pengaturan umum langganan
plus runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`.
Perlakukan `openai-codex/*` sebagai konfigurasi lama yang harus ditulis ulang
oleh doctor:

| Referensi model                              | Jalur runtime                                | Gunakan ketika                                                            |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses OpenAI Platform API langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | Rute lama yang diperbaiki oleh doctor        | Anda menggunakan konfigurasi lama; jalankan `openclaw doctor --fix` untuk menulis ulangnya. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                    | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul di rute kunci API OpenAI langsung maupun langganan Codex
ketika akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness Codex
app-server untuk runtime Codex native, atau `openai/gpt-5.5` tanpa override
runtime Codex untuk traffic kunci API langsung.

Referensi lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas doctor menulis ulang referensi runtime lama menjadi referensi
model kanonis dan mencatat kebijakan runtime secara terpisah. Konfigurasi harness
app-server native baru sebaiknya menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai/gpt-*` untuk rute OpenAI normal dan `codex/gpt-*` ketika pemahaman gambar
harus berjalan melalui giliran Codex app-server terbatas. Jangan gunakan
`openai-codex/gpt-*`; doctor menulis ulang prefiks lama tersebut menjadi
`openai/gpt-*`. Model Codex app-server harus mengiklankan dukungan input gambar;
model Codex khusus teks gagal sebelum giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa catatan terstruktur `agent harness selected` milik gateway. Catatan
itu mencakup id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan tiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memperingatkan ketika referensi model yang dikonfigurasi atau
status rute sesi persisten masih menggunakan `openai-codex/*`. `openclaw doctor --fix`
menulis ulang rute tersebut menjadi:

- `openai/<model>`
- `agentRuntime.id: "codex"` ketika Codex terinstal, aktif, menyumbangkan
  harness `codex`, dan memiliki OAuth yang dapat digunakan
- `agentRuntime.id: "pi"` jika tidak

Rute `codex` memaksa harness Codex native. Rute `pi` mempertahankan agen pada
runner OpenClaw default alih-alih mengaktifkan atau menginstal Codex sebagai efek
samping pembersihan rute lama.
Doctor juga memperbaiki pin sesi persisten yang usang di seluruh penyimpanan sesi
agen yang ditemukan sehingga percakapan lama tidak tetap macet pada rute yang
sudah dihapus.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tertanam berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi tersebut dan terus menggunakannya untuk
giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi `agentRuntime` atau
`OPENCLAW_AGENT_RUNTIME` ketika Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan percakapan yang
sudah ada antara Pi dan Codex. Ini menghindari pemutaran ulang satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi legacy yang dibuat sebelum pin harness diperlakukan sebagai dipin ke Pi setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk mengikutkan percakapan itu ke
Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness Pi default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan yang tersedia.
- Codex app-server `0.125.0` atau lebih baru. Plugin bawaan mengelola binary
  Codex app-server yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server atau untuk bridge auth Codex
  OpenClaw. Peluncuran app-server lokal menggunakan home Codex yang dikelola OpenClaw untuk tiap
  agent dan child `HOME` yang terisolasi, sehingga secara default tidak membaca akun
  `~/.codex` pribadi, skills, plugins, config, status thread, atau
  `$HOME/.agents/skills` native Anda.

Plugin memblokir handshake app-server lama atau tanpa versi. Itu menjaga
OpenClaw tetap pada permukaan protokol yang telah diuji.

Untuk pengujian smoke live dan Docker, auth biasanya berasal dari akun Codex CLI
atau profil auth `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga dapat
fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui penemuan project-doc native. OpenClaw
tidak menulis file project-doc Codex sintetis atau bergantung pada nama file fallback Codex
untuk file persona, karena fallback Codex hanya berlaku ketika
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap
lainnya (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, dan `MEMORY.md` bila ada) dan meneruskannya melalui instruksi
developer Codex pada `thread/start` dan `thread/resume`. Ini menjaga
`SOUL.md` dan konteks persona/profil workspace terkait tetap terlihat pada lane
pembentukan perilaku Codex native tanpa menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agent yang sama harus bebas beralih
antara Codex dan model provider non-Codex. Runtime yang dipaksa berlaku untuk setiap
giliran tertanam bagi agent atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih diam-diam merutekan giliran itu melalui Pi.

Gunakan salah satu bentuk ini sebagai gantinya:

- Tempatkan Codex pada agent khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agent default pada `agentRuntime.id: "auto"` dan fallback Pi untuk penggunaan provider campuran normal.
- Gunakan ref legacy `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya memilih
  `openai/*` ditambah kebijakan runtime Codex eksplisit.

Misalnya, ini mempertahankan agent default pada pemilihan otomatis normal dan
menambahkan agent Codex terpisah:

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

- Agent `main` default menggunakan jalur provider normal dan fallback kompatibilitas Pi.
- Agent `codex` menggunakan harness app-server Codex.
- Jika Codex hilang atau tidak didukung untuk agent `codex`, giliran gagal
  alih-alih diam-diam menggunakan Pi.

## Perutean perintah agent

Agent harus merutekan permintaan pengguna berdasarkan intent, bukan hanya berdasarkan kata "Codex":

| Pengguna meminta...                                    | Agent sebaiknya menggunakan...                    |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                               | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                               | `/codex threads`                                 |
| "Buat laporan dukungan untuk run Codex yang buruk"     | `/diagnostics [note]`                            |
| "Hanya kirim umpan balik Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                  |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`  |
| "Perbaiki pin konfigurasi/sesi `openai-codex/*` lama"  | `openclaw doctor --fix`                          |
| "Jalankan Codex melalui ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agent native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agent ketika ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan Skills plugin tidak boleh mengajari agent tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex ketika Anda perlu membuktikan bahwa setiap giliran agent tertanam
menggunakan Codex. Runtime plugin eksplisit gagal tertutup dan tidak pernah diam-diam dicoba ulang
melalui Pi:

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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai.

## Codex per agent

Anda dapat membuat satu agent khusus Codex sementara agent default mempertahankan
pemilihan otomatis normal:

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

Gunakan perintah sesi normal untuk beralih agent dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan memungkinkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia kepada app-server. Jika
penemuan gagal atau timeout, plugin menggunakan katalog fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyesuaikan penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan penemuan ketika Anda ingin startup menghindari probing Codex dan tetap menggunakan
katalog fallback:

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

Secara default, plugin memulai binary Codex yang dikelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Binary yang dikelola dikirim bersama package plugin `codex`. Ini menjaga versi
app-server terikat pada plugin bawaan, bukan pada Codex CLI terpisah mana pun
yang kebetulan terinstal secara lokal. Tetapkan `appServer.command` hanya ketika
Anda secara sengaja ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan shell dan alat jaringan tanpa
berhenti pada prompt approval native yang tidak ada orang di sekitar untuk menjawabnya.

Untuk ikut menggunakan approval yang ditinjau guardian Codex, tetapkan `appServer.mode:
"guardian"`:

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

Mode Guardian menggunakan jalur approval auto-review native Codex. Ketika Codex meminta untuk
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses
jaringan, Codex merutekan permintaan approval itu ke reviewer native alih-alih
prompt manusia. Reviewer menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian ketika Anda menginginkan lebih banyak guardrail daripada mode YOLO
tetapi tetap membutuhkan agent tanpa pengawasan untuk tetap berjalan.

Preset `guardian` diekspansi menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap mengoverride `mode`, sehingga deployment tingkat lanjut dapat mencampur
preset dengan pilihan eksplisit. Nilai reviewer `guardian_subagent` yang lebih lama
masih diterima sebagai alias kompatibilitas, tetapi konfigurasi baru sebaiknya menggunakan
`auto_review`.

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
tetapi OpenClaw memiliki bridge akun Codex app-server dan menetapkan baik
`CODEX_HOME` maupun `HOME` ke direktori per-agent di bawah status OpenClaw
agent tersebut. Skill loader milik Codex membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran app-server
lokal. Itu menjaga skills, plugins, config, akun, dan status thread native Codex
tetap tercakup pada agent OpenClaw alih-alih bocor dari home Codex CLI pribadi
operator.

Plugin OpenClaw dan snapshot Skills OpenClaw tetap mengalir melalui registry
plugin dan skill loader OpenClaw sendiri. Aset Codex CLI pribadi tidak. Jika Anda memiliki
skills atau plugins Codex CLI yang berguna dan seharusnya menjadi bagian dari agent OpenClaw,
inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider migrasi Codex menyalin skills ke workspace agent OpenClaw saat ini.
Plugin native Codex, hooks, dan file config dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan otomatis, karena dapat
menjalankan perintah, mengekspos server MCP, atau membawa kredensial.

Auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agent.
2. Akun app-server yang sudah ada di home Codex agent tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dijalankan. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran app-server Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login app-server
alih-alih env proses anak yang diwariskan. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil autentikasi eksplisit atau
akun milik app-server jarak jauh itu sendiri.

Jika deployment memerlukan isolasi environment tambahan, tambahkan variabel tersebut ke
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

Tool dinamis Codex secara default menggunakan profil `native-first`. Dalam mode itu,
OpenClaw tidak mengekspos tool dinamis yang menduplikasi operasi workspace
native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Tool integrasi OpenClaw seperti perpesanan, sesi, media,
cron, browser, node, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Kolom Plugin Codex tingkat atas yang didukung:

| Kolom                      | Default          | Arti                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set lengkap tool dinamis OpenClaw ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama tool dinamis OpenClaw tambahan yang dihilangkan dari giliran app-server Codex.               |

Kolom `appServer` yang didukung:

| Kolom               | Default                                  | Arti                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                             |
| `command`           | biner Codex terkelola                     | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola; atur hanya untuk override eksplisit.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                       |
| `url`               | belum diatur                                    | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | belum diatur                                    | Token bearer untuk transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nama variabel environment tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun environment warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan native Codex yang dikirim ke mulai/lanjutkan/giliran thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke mulai/lanjutkan thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias legacy.                                                                                                                         |
| `serviceTier`       | belum diatur                                    | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy yang tidak valid diabaikan.                                                                                                                            |

Panggilan tool dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus menerima
respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan sinyal tool
jika didukung dan mengembalikan respons tool dinamis yang gagal ke Codex agar
giliran dapat berlanjut alih-alih membiarkan sesi berada dalam `processing`.

Setelah OpenClaw merespons permintaan app-server berskala giliran Codex, harness
juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server diam selama 60 detik setelah respons itu, OpenClaw berupaya sebaik mungkin
menginterupsi giliran Codex, mencatat timeout diagnostik, dan melepaskan lane sesi
OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran native yang basi.

Override environment tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola ketika
`appServer.command` belum diatur.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disukai untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
file yang ditinjau yang sama dengan sisa penyiapan harness Codex.

## Penggunaan komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau menjalankan
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex menangani panggilan tool MCP native
selama giliran mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk perbedaan
antara Penggunaan Komputer milik Codex dan pendaftaran MCP langsung.

Konfigurasi minimal:

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

Penyiapan dapat diperiksa atau diinstal dari permukaan perintah:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Penggunaan Komputer spesifik untuk macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengontrol aplikasi. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, giliran mode Codex gagal sebelum thread dimulai alih-alih
berjalan diam-diam tanpa tool Penggunaan Komputer native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Ketika `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop bundled standar dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah konfigurasi runtime atau Penggunaan Komputer agar sesi yang ada tidak mempertahankan
ikatan PI atau thread Codex lama.

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

Persetujuan Codex yang ditinjau guardian:

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

App-server jarak jauh dengan header eksplisit:

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

Pergantian model tetap dikendalikan OpenClaw. Ketika sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, giliran berikutnya mengirim model
OpenAI, provider, kebijakan persetujuan, sandbox, dan tingkat layanan yang saat ini dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
ikatan thread tetapi meminta Codex untuk melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bundled mendaftarkan `/codex` sebagai perintah slash resmi. Perintah ini
generik dan bekerja di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex memadatkan thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread yang dilampirkan.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` memasang Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

Ketika Codex melaporkan kegagalan batas penggunaan, OpenClaw menyertakan waktu reset
app-server berikutnya saat Codex menyediakannya. Gunakan `/codex account` dalam
percakapan yang sama untuk memeriksa akun saat ini dan jendela batas laju.

### Alur kerja debugging umum

Ketika agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau saluran lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga mengirim bundel umpan balik
   Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan ini mencakup path bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   thread native Codex agar Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa ia memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini dilampirkan tanpa bundel diagnostik
Gateway OpenClaw lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena mengaitkan status Gateway lokal dan id thread Codex
dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku obrolan grup.

Inti OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan pembukaan data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan exec eksplisit
setiap kali. Jangan setujui diagnostik dengan aturan allow-all. Setelah persetujuan,
OpenClaw mengirim laporan yang dapat ditempelkan dengan path bundel lokal dan ringkasan
manifes. Ketika sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang sama
juga mengizinkan pengiriman bundel umpan balik Codex yang relevan ke server OpenAI.
Prompt persetujuan mengatakan bahwa umpan balik Codex akan dikirim, tetapi tidak
mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam obrolan grup, OpenClaw menjaga
saluran bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara
pembukaan diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` app-server Codex dan meminta
app-server menyertakan log untuk setiap thread yang tercantum dan subthread Codex yang dibuat
jika tersedia. Unggahan berjalan melalui jalur umpan balik normal Codex ke server OpenAI;
jika umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan
galat app-server. Balasan diagnostik yang selesai mencantumkan saluran,
id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama dengan yang digunakan harness untuk
turn normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke app-server, dan tetap mengaktifkan riwayat
yang diperluas.

### Memeriksa thread Codex dari CLI

Cara tercepat untuk memahami run Codex yang buruk sering kali adalah membuka thread native Codex
secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan saluran dan ingin memeriksa sesi
Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia
membuat pilihan alat atau penalaran tertentu. Jalur termudah biasanya adalah menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai
mencantumkan setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk obrolan saat ini atau
`/codex threads [filter]` untuk thread app-server Codex terbaru, lalu menjalankan perintah
`codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan app-server Codex `0.125.0` atau yang lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adapter per-turn di sekitar alat dinamis OpenClaw.         |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari config Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk merutekan
perilaku Plugin OpenClaw. Untuk alat native dan bridge izin yang didukung,
OpenClaw menyuntikkan config Codex per-thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Ketika persetujuan app-server Codex diaktifkan
(`approvalPolicy` bukan `"never"`), config hook native default yang disuntikkan
menghilangkan `PermissionRequest` agar reviewer app-server Codex dan bridge persetujuan
OpenClaw menangani eskalasi nyata setelah peninjauan. Operator tetap dapat secara eksplisit
menambahkan `permission_request` ke `nativeHookRelay.events` ketika mereka membutuhkan relay
kompatibilitas. Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi
kontrol tingkat Codex; hook tersebut tidak diekspos sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw menjalankan alat setelah Codex meminta
panggilan tersebut, sehingga OpenClaw memicu perilaku Plugin dan middleware yang dimilikinya di
adapter harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis.
OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread
native Codex kecuali Codex mengekspos operasi tersebut melalui app-server atau callback
hook native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server Codex
dan status adapter OpenClaw, bukan perintah hook native Codex.
Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adapter, bukan tangkapan byte demi byte
atas payload permintaan internal atau Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak
loop model native, dan OpenClaw mengadaptasi permukaan Plugin dan sesinya
di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                    | Dukungan                                                                             | Alasan                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loop model OpenAI melalui Codex               | Didukung                                                                             | app-server Codex memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan tool native.                                                                                                                    |
| Perutean dan pengiriman channel OpenClaw      | Didukung                                                                             | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lain tetap berada di luar runtime model.                                                                                                                 |
| Tool dinamis OpenClaw                         | Didukung                                                                             | Codex meminta OpenClaw menjalankan tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                                     |
| Plugin prompt dan konteks                     | Didukung                                                                             | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                             |
| Siklus hidup mesin konteks                    | Didukung                                                                             | Perakitan, penyerapan atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                                     |
| Hook tool dinamis                             | Didukung                                                                             | Middleware `before_tool_call`, `after_tool_call`, dan hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                                  |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor                                                   | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                                   |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native                                                   | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                                     |
| Blokir atau amati shell, patch, dan MCP native | Didukung melalui relay hook native                                                   | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan tool native yang sudah dikomit, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui persetujuan app-server Codex dan relay hook native kompatibilitas   | Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah peninjauan Codex. Relay hook native `PermissionRequest` bersifat opt-in untuk mode persetujuan native karena Codex memancarkannya sebelum peninjauan guardian. |
| Penangkapan trajektori app-server             | Didukung                                                                             | OpenClaw merekam permintaan yang dikirimkannya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                           |

Tidak didukung di runtime Codex v1:

| Permukaan                                           | Batas v1                                                                                                                                         | Jalur masa depan                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Mutasi argumen tool native                          | Hook pra-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen tool native Codex.                                       | Memerlukan dukungan hook/skema Codex untuk input tool pengganti.                                          |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika operasi thread native diperlukan.                           |
| `tool_result_persist` untuk catatan tool native Codex | Hook itu mengubah penulisan transkrip milik OpenClaw, bukan catatan tool native Codex.                                                          | Dapat mencerminkan catatan yang diubah, tetapi penulisan ulang kanonis memerlukan dukungan Codex.         |
| Metadata Compaction native yang kaya                | OpenClaw mengamati mulai dan selesainya Compaction, tetapi tidak menerima daftar kept/dropped yang stabil, delta token, atau payload ringkasan.  | Memerlukan event Compaction Codex yang lebih kaya.                                                        |
| Intervensi Compaction                               | Hook Compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                               | Tambahkan hook pra/pasca Compaction Codex jika plugin perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte demi byte      | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI akhir secara internal.          | Memerlukan event pelacakan permintaan model Codex atau API debug.                                         |

## Tool, media, dan Compaction

Harness Codex hanya mengubah pelaksana agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output tool pesan
terus melewati jalur pengiriman OpenClaw normal.

Relay hook native sengaja bersifat generik, tetapi kontrak dukungan v1
dibatasi pada jalur tool dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan menganggap setiap event hook
Codex di masa depan sebagai permukaan plugin OpenClaw sampai kontrak runtime
menyebutkannya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tidak ada keputusan hook dan meneruskannya
ke jalur guardian atau persetujuan penggunanya sendiri. Mode persetujuan
app-server Codex menghilangkan hook native ini secara default; paragraf ini
berlaku ketika `permission_request` disertakan secara eksplisit dalam
`nativeHookRelay.events` atau runtime kompatibilitas memasangnya.
Ketika operator memilih `allow-always` untuk permintaan izin native Codex,
OpenClaw mengingat sidik jari input provider/sesi/tool/cwd yang persis itu
untuk jendela sesi terbatas. Keputusan yang diingat sengaja hanya cocok persis:
perintah, argumen, payload tool, atau cwd yang berubah membuat persetujuan
baru.

Elisitasi persetujuan tool MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang mengantre menjawab permintaan
server native itu alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lainnya tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
mengantre untuk jendela senyap yang dikonfigurasi dan mengirimkannya sebagai
satu permintaan `turn/steer` dalam urutan kedatangan. Mode lama `queue`
mengirim permintaan `turn/steer` terpisah. Giliran peninjauan Codex dan
Compaction manual dapat menolak pengarahan giliran yang sama, dalam kasus ini
OpenClaw menggunakan antrean followup ketika mode yang dipilih mengizinkan
fallback. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw menyimpan cermin transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan pergantian model atau harness
di masa depan. Cermin tersebut mencakup prompt pengguna, teks asisten akhir,
dan catatan penalaran atau rencana Codex yang ringan ketika app-server
memancarkannya. Saat ini, OpenClaw hanya merekam sinyal mulai dan selesai
Compaction native. Belum ada ringkasan Compaction yang dapat dibaca manusia
atau daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex
setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini
tidak menulis ulang catatan hasil tool native Codex. Itu hanya berlaku ketika
OpenClaw menulis hasil tool transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media terus menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref lama `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow`
mengecualikan `codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian.
Runtime Codex yang dipaksa gagal alih-alih fallback ke PI. Setelah app-server
Codex dipilih, kegagalannya muncul secara langsung.

**app-server ditolak:** tingkatkan Codex agar handshake app-server melaporkan
versi `0.125.0` atau yang lebih baru. Prarilis versi yang sama atau versi
bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
lantai protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa app-server jarak jauh berbicara versi protokol app-server Codex yang
sama.

**Model non-Codex menggunakan PI:** itu diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref lama
`codex/*`. Ref biasa `openai/gpt-*` dan provider lain tetap berada pada jalur
provider normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap
giliran tertanam untuk agen tersebut harus berupa model OpenAI yang didukung
Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
Gateway untuk membersihkan pendaftaran native hook yang usang. Jika `computer-use.list_apps`
mengalami timeout, mulai ulang Codex Computer Use atau Codex Desktop lalu coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook Plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
