---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih kembali menggunakan PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang dibundel
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-02T09:26:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini ketika Anda ingin Codex memiliki sesi agen tingkat rendah: penemuan
model, pelanjutan thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Ketika giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat
secara default menggunakan alat `message` OpenClaw jika deployment belum secara
eksplisit mengonfigurasi `messages.visibleReplies`. Agen masih dapat
menyelesaikan giliran Codex secara privat; agen hanya mengirim ke channel ketika
memanggil `message(action="send")`. Atur
`messages.visibleReplies: "automatic"` untuk mempertahankan balasan akhir chat
langsung pada jalur pengiriman otomatis lama.

Giliran heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara
default, sehingga agen dapat mencatat apakah wake harus tetap senyap atau
memberi notifikasi tanpa menyandikan alur kontrol itu dalam teks akhir.

Jika Anda mencoba memahami konteksnya, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute
ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam
melalui runtime app-server Codex native. Ref model tetap kanonis sebagai
`openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan dari
prefiks model `openai-codex/*`.

Pertama masuk dengan OAuth Codex jika Anda belum melakukannya:

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
        fallback: "none",
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

Jangan gunakan `openai-codex/gpt-*` ketika yang Anda maksud adalah runtime Codex
native. Prefiks itu adalah rute eksplisit "OAuth Codex melalui PI". Perubahan
konfigurasi berlaku untuk sesi baru atau yang direset; sesi yang ada tetap
menyimpan runtime yang tercatat.

## Apa yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kemampuan terpisah:

| Kemampuan                         | Cara Anda menggunakannya                            | Fungsinya                                                                      |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui app-server Codex.           |
| Perintah kontrol chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread app-server Codex dari percakapan perpesanan.    |
| Penyedia/katalog app-server Codex | internal `codex`, diekspos melalui harness          | Memungkinkan runtime menemukan dan memvalidasi model app-server.               |
| Jalur pemahaman media Codex       | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran app-server Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                 | Hook Plugin di sekitar event native Codex           | Memungkinkan OpenClaw mengamati/memblokir event alat/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kemampuan tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengubah ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx sebagai jalur Codex default
- hot-switch sesi yang sudah ada yang telah mencatat runtime PI
- menggantikan pengiriman channel OpenClaw, file sesi, penyimpanan profil autentikasi, atau
  perutean pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat native `/codex`.
Jika Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan,
mengarahkan, menghentikan, atau memeriksa thread Codex dari chat, agen sebaiknya
lebih memilih `/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit
ketika pengguna meminta ACP/acpx atau sedang menguji adapter Codex ACP.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan
kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook perintah
`hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip yang dicerminkan
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral runtime untuk
menulis ulang hasil alat dinamis OpenClaw setelah OpenClaw menjalankan alat dan
sebelum hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip yang
dimiliki OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru sebaiknya mempertahankan ref
model OpenAI tetap kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` ketika
menginginkan eksekusi app-server native. Ref model lama `codex/*` masih
memilih harness secara otomatis untuk kompatibilitas, tetapi prefiks
penyedia lama yang didukung runtime tidak ditampilkan sebagai pilihan
model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` memberi peringatan alih-alih mengubah rute.
Ini disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan Codex PI, dan
eksekusi app-server native tetap menjadi pilihan runtime eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                              | Ref model                  | Konfigurasi runtime                   | Rute autentikasi/profil      | Label status yang diharapkan   |
| ----------------------------------------------------- | -------------------------- | ------------------------------------- | ---------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native   | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | OAuth Codex atau akun Codex  | `Runtime: OpenAI Codex`        |
| OpenAI API melalui runner OpenClaw normal             | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`      | Kunci API OpenAI             | `Runtime: OpenClaw Pi Default` |
| Langganan ChatGPT/Codex melalui PI                    | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`      | Penyedia OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Penyedia campuran dengan mode otomatis konservatif    | ref khusus penyedia        | `agentRuntime.id: "auto"`             | Per penyedia yang dipilih    | Bergantung pada runtime yang dipilih |
| Sesi adapter ACP Codex eksplisit                      | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Autentikasi backend ACP      | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/autentikasi mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi giliran
  tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol oleh chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat khusus prefiks. Untuk penyiapan umum langganan
plus runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`.
Gunakan `openai-codex/*` hanya ketika Anda sengaja menginginkan OAuth Codex
melalui PI:

| Ref model                                     | Jalur runtime                                | Gunakan ketika                                                             |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan runner PI default. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul pada rute kunci API OpenAI langsung dan langganan Codex
ketika akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness
app-server Codex untuk runtime Codex native, `openai-codex/gpt-5.5` untuk OAuth
PI, atau `openai/gpt-5.5` tanpa override runtime Codex untuk trafik kunci API
langsung.

Ref lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas doctor menulis ulang ref runtime utama lama menjadi ref model
kanonis dan mencatat kebijakan runtime secara terpisah, sementara ref lama yang
hanya fallback dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh
container agen. Konfigurasi OAuth Codex PI baru sebaiknya menggunakan
`openai-codex/gpt-*`; konfigurasi harness app-server native baru sebaiknya
menggunakan `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` ketika pemahaman gambar harus berjalan melalui jalur
penyedia OAuth OpenAI Codex. Gunakan `codex/gpt-*` ketika pemahaman gambar harus
berjalan melalui giliran app-server Codex terbatas. Model app-server Codex harus
mengiklankan dukungan input gambar; model Codex khusus teks gagal sebelum giliran
media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa catatan terstruktur `agent harness selected` milik gateway. Catatan
itu mencakup id harness yang dipilih, alasan pemilihan, kebijakan
runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan ketika semua ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan"
berarti "runtime app-server Codex native." OpenClaw tidak membuat lompatan itu.
Peringatan tersebut berarti:

- **Tidak ada perubahan yang diperlukan** jika Anda memang menginginkan OAuth ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda menginginkan eksekusi app-server
  native.
- Sesi yang ada masih memerlukan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat lengket.

Pemilihan harness bukan kontrol sesi langsung. Ketika giliran tertanam berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi tersebut dan terus
menggunakannya untuk giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi
`agentRuntime` atau `OPENCLAW_AGENT_RUNTIME` ketika Anda ingin sesi mendatang
menggunakan harness lain; gunakan `/new` atau `/reset` untuk memulai sesi baru
sebelum beralih pada percakapan yang ada antara PI dan Codex. Ini menghindari
pemutaran ulang satu transkrip melalui dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai dipin ke PI
setelah memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk
mengikutsertakan percakapan tersebut ke Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI bawaan muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- App-server Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  app-server Codex yang kompatibel secara default, sehingga perintah `codex` lokal
  pada `PATH` tidak memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server atau untuk bridge auth Codex
  OpenClaw. Peluncuran app-server lokal menggunakan home Codex yang dikelola
  OpenClaw untuk setiap agen dan child `HOME` yang terisolasi, sehingga secara
  default tidak membaca akun, skills, plugins, konfigurasi, status thread, atau
  `$HOME/.agents/skills` native pribadi Anda di `~/.codex`.

Plugin memblokir handshake app-server yang lebih lama atau tanpa versi. Ini menjaga
OpenClaw tetap berada pada permukaan protokol yang telah diuji.

Untuk pengujian smoke live dan Docker, auth biasanya berasal dari akun CLI Codex
atau profil auth `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga
dapat fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## Tambahkan Codex berdampingan dengan model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agen yang sama harus
bebas beralih antara Codex dan model penyedia non-Codex. Runtime yang dipaksakan
berlaku untuk setiap giliran tertanam untuk agen atau sesi tersebut. Jika Anda
memilih model Anthropic saat runtime tersebut dipaksakan, OpenClaw tetap mencoba
harness Codex dan gagal tertutup alih-alih diam-diam merutekan giliran tersebut
melalui PI.

Gunakan salah satu bentuk berikut sebagai gantinya:

- Tempatkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk
  penggunaan penyedia campuran normal.
- Gunakan ref lama `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya
  memilih `openai/*` ditambah kebijakan runtime Codex yang eksplisit.

Contohnya, ini mempertahankan agen default pada seleksi otomatis normal dan
menambahkan agen Codex terpisah:

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
        fallback: "pi",
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

- Agen `main` default menggunakan jalur penyedia normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness app-server Codex.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran akan gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan intent, bukan hanya kata "Codex":

| Pengguna meminta...                                   | Agen sebaiknya menggunakan...                     |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                               | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                               | `/codex threads`                                 |
| "Ajukan laporan dukungan untuk run Codex yang buruk"   | `/diagnostics [note]`                            |
| "Hanya kirim feedback Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                      |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Gunakan langganan ChatGPT/Codex saya melalui PI"      | ref model `openai-codex/*`                       |
| "Jalankan Codex melalui ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen ketika ACP diaktifkan,
dapat di-dispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak
tersedia, system prompt dan Plugin skills tidak boleh mengajarkan agen tentang
perutean ACP.

## Deployment khusus Codex

Paksa harness Codex ketika Anda perlu membuktikan bahwa setiap giliran agen
tertanam menggunakan Codex. Runtime Plugin eksplisit default-nya tanpa fallback PI,
sehingga `fallback: "none"` bersifat opsional tetapi sering berguna sebagai
dokumentasi:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan Codex dipaksakan, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai. Tetapkan
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda memang ingin PI menangani
pemilihan harness yang hilang.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap mempertahankan
seleksi otomatis normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Gunakan perintah sesi normal untuk beralih agen dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server
sidecar-nya sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk
thread tersebut dan membiarkan giliran berikutnya menyelesaikan harness dari
konfigurasi saat ini lagi.

## Penemuan model

Secara default, Plugin Codex meminta model yang tersedia kepada app-server. Jika
penemuan gagal atau timeout, ia menggunakan katalog fallback bawaan untuk:

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

Nonaktifkan penemuan ketika Anda ingin startup menghindari probing Codex dan tetap
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

Secara default, Plugin memulai biner Codex terkelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Biner terkelola dikirim bersama paket Plugin `codex`. Ini menjaga versi app-server
tetap terikat ke Plugin bawaan alih-alih ke CLI Codex terpisah mana pun yang
kebetulan terinstal secara lokal. Tetapkan `appServer.command` hanya ketika Anda
memang ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang
digunakan untuk Heartbeat otonom: Codex dapat menggunakan shell dan alat jaringan
tanpa berhenti pada prompt approval native yang tidak ada orang di sekitar untuk
menjawabnya.

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

Mode Guardian menggunakan jalur approval auto-review native Codex. Ketika Codex
meminta untuk keluar dari sandbox, menulis di luar workspace, atau menambahkan
izin seperti akses jaringan, Codex merutekan permintaan approval tersebut ke
reviewer native alih-alih prompt manusia. Reviewer menerapkan kerangka risiko
Codex dan menyetujui atau menolak permintaan spesifik tersebut. Gunakan Guardian
ketika Anda menginginkan guardrail lebih banyak daripada mode YOLO tetapi tetap
membutuhkan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap mengesampingkan `mode`, sehingga deployment
lanjutan dapat mencampur preset dengan pilihan eksplisit. Nilai reviewer
`guardian_subagent` yang lebih lama masih diterima sebagai alias kompatibilitas,
tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

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
tetapi OpenClaw memiliki bridge akun app-server Codex dan menetapkan baik
`CODEX_HOME` maupun `HOME` ke direktori per agen di bawah state OpenClaw agen
tersebut. Loader skill milik Codex membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran
app-server lokal. Ini menjaga skills native Codex, plugins, konfigurasi, akun,
dan status thread tetap tercakup pada agen OpenClaw alih-alih bocor dari home
CLI Codex pribadi operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry
Plugin dan loader skill milik OpenClaw. Aset CLI Codex pribadi tidak. Jika Anda
memiliki skills atau plugins CLI Codex yang berguna dan seharusnya menjadi bagian
dari agen OpenClaw, inventarisasi secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin skills ke workspace agen OpenClaw saat ini.
Plugins, hooks, dan file konfigurasi native Codex dilaporkan atau diarsipkan untuk
review manual alih-alih diaktifkan otomatis, karena mereka dapat mengeksekusi
perintah, mengekspos server MCP, atau membawa kredensial.

Auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan auth OpenAI masih
   diperlukan.

Ketika OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, ia menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses child Codex yang di-spawn. Ini
menjaga kunci API tingkat Gateway tetap tersedia untuk embeddings atau model
OpenAI langsung tanpa membuat giliran app-server Codex native secara tidak sengaja
ditagihkan melalui API. Profil kunci API Codex eksplisit dan fallback env-key
stdio lokal menggunakan login app-server alih-alih env proses child yang diwarisi.
Koneksi app-server WebSocket tidak menerima fallback kunci API env Gateway;
gunakan profil auth eksplisit atau akun milik app-server jarak jauh.

Jika deployment membutuhkan isolasi environment tambahan, tambahkan variabel
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

`appServer.clearEnv` hanya memengaruhi proses child app-server Codex yang di-spawn.

Tools dinamis Codex default ke profil `native-first`. Dalam mode tersebut,
OpenClaw tidak mengekspos tools dinamis yang menduplikasi operasi workspace
native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Tools integrasi OpenClaw seperti messaging, sessions, media,
Cron, browser, nodes, Gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Bidang Plugin Codex tingkat atas yang didukung:

| Bidang                     | Nilai default   | Makna                                                                                                  |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set lengkap alat dinamis OpenClaw ke app-server Codex.    |
| `codexDynamicToolsExclude` | `[]`             | Nama alat dinamis OpenClaw tambahan yang dihilangkan dari giliran app-server Codex.                    |

Bidang `appServer` yang didukung:

| Bidang              | Nilai default                           | Makna                                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` memunculkan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                  |
| `command`           | biner Codex terkelola                    | Berkas yang dapat dieksekusi untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola; atur hanya untuk penimpaan eksplisit.                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                                  |
| `url`               | tidak diatur                             | URL app-server WebSocket.                                                                                                                                                                                                                       |
| `authToken`         | tidak diatur                             | Token Bearer untuk transport WebSocket.                                                                                                                                                                                                         |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                                      |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dimunculkan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Tenggat waktu untuk panggilan bidang kendali app-server.                                                                                                                                                                                        |
| `mode`              | `"yolo"`                                 | Prasetel untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                       |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke mulai/lanjutkan/giliran thread.                                                                                                                                                              |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke mulai/lanjutkan thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias lama.                                                                                                                           |
| `serviceTier`       | tidak diatur                             | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                                                                                                                             |

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan `item/tool/call` Codex harus menerima
respons OpenClaw dalam 30 detik. Saat tenggat habis, OpenClaw membatalkan sinyal
alat jika didukung dan mengembalikan respons alat dinamis yang gagal ke Codex agar
giliran dapat berlanjut, bukan membiarkan sesi tetap dalam `processing`.

Setelah OpenClaw merespons permintaan app-server bercakupan giliran Codex, harness
juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server tidak merespons selama 60 detik setelah respons tersebut, OpenClaw sebisa mungkin
menginterupsi giliran Codex, mencatat tenggat waktu diagnostik, dan melepaskan
jalur sesi OpenClaw agar pesan obrolan lanjutan tidak mengantre di belakang giliran
native yang sudah basi.

Penimpaan lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak diatur.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
berkas yang ditinjau sama seperti sisa penyiapan harness Codex.

## Penggunaan komputer

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak menyertakan aplikasi kendali desktop atau menjalankan
tindakan desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa
server MCP `computer-use` tersedia, lalu membiarkan Codex menangani panggilan alat
MCP native selama giliran mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Codex Computer Use](/id/plugins/codex-computer-use) untuk perbedaan
antara Computer Use milik Codex dan pendaftaran MCP langsung.

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
        fallback: "none",
      },
    },
  },
}
```

Penyiapan dapat diperiksa atau dipasang dari permukaan perintah:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use bersifat khusus macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengendalikan aplikasi. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, giliran mode Codex gagal sebelum thread dimulai, bukan berjalan
diam-diam tanpa alat Computer Use native. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop bundel standar dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah konfigurasi runtime atau Computer Use agar sesi yang ada tidak mempertahankan
pengikatan PI atau thread Codex lama.

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

Peralihan model tetap dikendalikan OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang ada, giliran berikutnya mengirim model OpenAI,
penyedia, kebijakan persetujuan, sandbox, dan tingkat layanan yang saat ini dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
pengikatan thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bundel mendaftarkan `/codex` sebagai perintah garis miring yang diotorisasi. Perintah ini
bersifat generik dan berfungsi pada channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang ada.
- `/codex compact` meminta app-server Codex memadatkan thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread yang dilampirkan.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` memasang Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan skills app-server Codex.

### Alur kerja debugging umum

Saat agen yang didukung Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau channel lain, mulai dengan percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik sekali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga mengirim bundle umpan balik
   Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau utas dukungan.
   Balasan itu mencakup path bundle lokal, ringkasan privasi, id sesi OpenClaw,
   id utas Codex, dan baris `Inspect locally` untuk setiap utas Codex.
4. Jika Anda ingin men-debug run tersebut sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   utas Codex native sehingga Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa ia memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk utas yang saat ini terlampir tanpa bundle diagnostik Gateway
OpenClaw lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena mengikat status Gateway lokal dan id utas Codex
bersama dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku chat grup.

Core OpenClaw juga mengekspos `/diagnostics [note]` khusus owner sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan pembuka data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan exec eksplisit
setiap kali. Jangan setujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan,
OpenClaw mengirim laporan yang dapat ditempel dengan path bundle lokal dan ringkasan
manifest. Ketika sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang
sama juga mengotorisasi pengiriman bundle umpan balik Codex yang relevan ke
server OpenAI. Prompt persetujuan menyatakan bahwa umpan balik Codex akan dikirim, tetapi
tidak mencantumkan id sesi atau utas Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh owner dalam chat grup, OpenClaw menjaga kanal
bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara
pembuka diagnostik, prompt persetujuan, dan id sesi/utas Codex dikirim ke
owner melalui rute persetujuan privat. Jika tidak ada rute owner privat,
OpenClaw menolak permintaan grup dan meminta owner menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` app-server Codex dan meminta
app-server menyertakan log untuk setiap utas yang tercantum dan subutas Codex yang dibuat
bila tersedia. Unggahan melewati jalur umpan balik normal Codex ke server OpenAI;
jika umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan
error app-server. Balasan diagnostik yang selesai mencantumkan kanal,
id sesi OpenClaw, id utas Codex, dan perintah lokal `codex resume <thread-id>`
untuk utas yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan utas Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke app-server, dan tetap mengaktifkan histori
diperluas.

### Periksa utas Codex dari CLI

Cara tercepat untuk memahami run Codex yang buruk sering kali adalah membuka utas Codex
native secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan kanal dan ingin memeriksa sesi
Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia
membuat pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai
mencantumkan setiap utas Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id utas dari `/codex binding` untuk chat saat ini atau
`/codex threads [filter]` untuk utas app-server Codex terbaru, lalu menjalankan perintah
`codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan app-server Codex `0.125.0` atau yang lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Owner                    | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex  | Plugin bundel OpenClaw   | Perilaku adapter per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex proyek atau global untuk merutekan
perilaku plugin OpenClaw. Untuk bridge alat native dan izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per utas untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol tingkat Codex; keduanya tidak diekspos sebagai
hook plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku plugin dan middleware yang dimilikinya
di adapter harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis.
OpenClaw dapat mencerminkan event terpilih, tetapi tidak dapat menulis ulang utas
Codex native kecuali Codex mengekspos operasi itu melalui app-server atau callback hook
native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server Codex
dan status adapter OpenClaw, bukan perintah hook native Codex. Event
`before_compaction`, `after_compaction`, `llm_input`, dan `llm_output` OpenClaw
adalah observasi tingkat adapter, bukan tangkapan byte-demi-byte dari request internal
atau payload compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex diproyeksikan
sebagai event agen `codex_app_server.hook` untuk trajectory dan debugging.
Keduanya tidak memanggil hook plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model yang berbeda di bawahnya. Codex memiliki lebih
banyak bagian dari loop model native, dan OpenClaw mengadaptasi permukaan plugin dan
sesi di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                      | Dukungan                                | Alasan                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loop model OpenAI melalui Codex               | Didukung                                | App-server Codex memiliki giliran OpenAI, resume utas native, dan kelanjutan alat native.                                                                                                              |
| Routing dan pengiriman kanal OpenClaw         | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lain tetap berada di luar runtime model.                                                                                                       |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                        |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan utas.                                                                                  |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah giliran, dan koordinasi compaction mesin konteks berjalan untuk giliran Codex.                                                                            |
| Hook alat dinamis                             | Didukung                                | Middleware `before_tool_call`, `after_tool_call`, dan hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                     |
| Hook siklus hidup                             | Didukung sebagai observasi adapter      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan payload mode Codex yang jujur.                                                                    |
| Gerbang revisi jawaban final                  | Didukung melalui relay hook native      | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex menjalankan satu pass model lagi sebelum finalisasi.                                                                          |
| Shell native, patch, dan blokir atau observasi MCP | Didukung melalui relay hook native | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan alat native yang committed, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw ketika runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui jalur guardian normal atau persetujuan pengguna. |
| Tangkapan trajectory app-server               | Didukung                                | OpenClaw merekam request yang dikirim ke app-server dan notifikasi app-server yang diterimanya.                                                                                                       |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batas V1                                                                                                                                       | Jalur mendatang                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native Codex                    | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                          |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API server aplikasi Codex eksplisit jika operasi bedah thread native diperlukan. |
| `tool_result_persist` untuk catatan alat native Codex | Hook itu mengubah penulisan transkrip milik OpenClaw, bukan catatan alat native Codex.                                                          | Dapat mencerminkan catatan yang diubah, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata compaction native yang kaya                | OpenClaw mengamati awal dan penyelesaian compaction, tetapi tidak menerima daftar disimpan/dibuang yang stabil, delta token, atau payload ringkasan. | Memerlukan peristiwa compaction Codex yang lebih kaya.                                     |
| Intervensi compaction                               | Hook compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                              | Tambahkan hook pra/pasca compaction Codex jika plugin perlu memveto atau menulis ulang compaction native. |
| Penangkapan permintaan API model byte demi byte     | OpenClaw dapat menangkap permintaan dan notifikasi server aplikasi, tetapi core Codex membangun permintaan API OpenAI final secara internal.    | Memerlukan peristiwa pelacakan permintaan model Codex atau API debug.                     |

## Alat, media, dan compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat pesan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1 terbatas
pada jalur alat dan izin native Codex yang diuji OpenClaw. Dalam runtime Codex,
itu mencakup payload shell, patch, dan MCP `PreToolUse`, `PostToolUse`, dan
`PermissionRequest`. Jangan berasumsi setiap peristiwa hook Codex mendatang
adalah permukaan plugin OpenClaw sampai kontrak runtime menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak yang eksplisit saat kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tanpa keputusan hook dan meneruskannya ke
guardian atau jalur persetujuan penggunanya sendiri.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang antre menjawab permintaan server
native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan elisitasi
MCP lainnya tetap gagal tertutup.

Pengarahan antrean run aktif dipetakan ke `turn/steer` server aplikasi Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
antre selama jendela hening yang dikonfigurasi dan mengirimnya sebagai satu
permintaan `turn/steer` sesuai urutan kedatangan. Mode `queue` lama mengirim
permintaan `turn/steer` terpisah. Giliran ulasan Codex dan compaction manual
dapat menolak pengarahan pada giliran yang sama, dalam hal ini OpenClaw
menggunakan antrean tindak lanjut saat mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Saat model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke server aplikasi Codex. OpenClaw menyimpan cermin transkrip untuk
riwayat kanal, pencarian, `/new`, `/reset`, dan peralihan model atau harness di
masa mendatang. Cermin tersebut mencakup prompt pengguna, teks asisten final, dan
catatan reasoning atau rencana Codex ringan saat server aplikasi memancarkannya.
Saat ini, OpenClaw hanya mencatat sinyal awal dan penyelesaian compaction native.
OpenClaw belum mengekspos ringkasan compaction yang dapat dibaca manusia atau
daftar yang dapat diaudit tentang entri mana yang disimpan Codex setelah
compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang catatan hasil alat native Codex. Itu hanya berlaku saat OpenClaw
menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan pemahaman
media tetap menggunakan pengaturan penyedia/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** itu memang diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref lama `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas saat tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime
Codex yang dipaksa sekarang gagal alih-alih fallback ke PI kecuali Anda secara
eksplisit mengatur `agentRuntime.fallback: "pi"`. Setelah server aplikasi Codex
dipilih, kegagalannya muncul langsung tanpa konfigurasi fallback tambahan.

**Server aplikasi ditolak:** tingkatkan Codex agar handshake server aplikasi
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis versi yang sama atau
versi dengan sufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
lantai protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa server aplikasi jarak jauh menggunakan versi protokol server aplikasi Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref lama
`codex/*`. Ref biasa `openai/gpt-*` dan penyedia lain tetap berada di jalur
penyedia normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap
giliran tertanam untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika suatu alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika berlanjut, mulai ulang
gateway untuk membersihkan pendaftaran hook native yang kedaluwarsa. Jika `computer-use.list_apps`
kehabisan waktu, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
