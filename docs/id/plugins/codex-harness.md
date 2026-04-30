---
read_when:
    - Anda ingin menggunakan harness app-server Codex yang disertakan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih beralih ke PI sebagai cadangan
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang disertakan
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-04-30T20:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini ketika Anda ingin Codex menangani sesi agen tingkat rendah: penemuan
model, pelanjutan thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap menangani saluran chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Jika Anda mencoba memahami arahnya, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau saluran lain tetap menjadi permukaan komunikasi.

## Yang diubah Plugin ini

Plugin `codex` bawaan menyediakan beberapa kemampuan terpisah:

| Kemampuan                         | Cara menggunakannya                                 | Fungsinya                                                                     |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui app-server Codex.          |
| Perintah kontrol chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread app-server Codex dari percakapan pesan.        |
| Penyedia/katalog app-server Codex | internal `codex`, diekspos melalui harness          | Memungkinkan runtime menemukan dan memvalidasi model app-server.              |
| Jalur pemahaman media Codex       | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran app-server Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                 | Hook Plugin di sekitar event Codex-native           | Memungkinkan OpenClaw mengamati/memblokir event alat/finalisasi Codex-native yang didukung. |

Mengaktifkan Plugin membuat kemampuan tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx jalur Codex default
- melakukan hot-switch pada sesi yang sudah merekam runtime PI
- mengganti pengiriman saluran OpenClaw, file sesi, penyimpanan profil auth, atau
  perutean pesan

Plugin yang sama juga menangani permukaan perintah kontrol chat `/codex` native. Jika
Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan, mengarahkan, menghentikan, atau memeriksa
thread Codex dari chat, agen sebaiknya memilih `/codex ...` daripada ACP. ACP tetap
menjadi fallback eksplisit ketika pengguna meminta ACP/acpx atau sedang menguji adapter ACP
Codex.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan kompatibilitas publik.
Ini adalah hook OpenClaw dalam proses, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip yang dicerminkan
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral-runtime untuk menulis ulang
hasil alat dinamis OpenClaw setelah OpenClaw mengeksekusi alat dan sebelum
hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip
milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru sebaiknya menjaga ref model OpenAI
tetap kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` ketika ingin
eksekusi app-server native. Ref model legacy `codex/*` masih memilih otomatis
harness untuk kompatibilitas, tetapi prefiks penyedia legacy yang didukung runtime
tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` memberi peringatan alih-alih mengubah rute. Itu
disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan PI Codex, dan
eksekusi app-server native tetap menjadi pilihan runtime eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                 | Ref model                  | Konfigurasi runtime                    | Kebutuhan Plugin             | Label status yang diharapkan   |
| ---------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| API OpenAI melalui runner OpenClaw normal | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`       | Penyedia OpenAI              | `Runtime: OpenClaw Pi Default` |
| OAuth/langganan Codex melalui PI          | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`       | Penyedia OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Giliran tertanam app-server Codex native  | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`               | `Runtime: OpenAI Codex`        |
| Penyedia campuran dengan mode otomatis konservatif | ref khusus penyedia | `agentRuntime.id: "auto"`              | Runtime Plugin opsional      | Bergantung pada runtime yang dipilih |
| Sesi adapter ACP Codex eksplisit          | bergantung pada prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | backend `acpx` sehat       | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/auth mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi
  giliran tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat
  atau dikontrol chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik prefiks. Gunakan `openai-codex/*` ketika Anda menginginkan
OAuth Codex melalui PI; gunakan `openai/*` ketika Anda menginginkan akses API OpenAI langsung atau
ketika Anda memaksa harness app-server Codex native:

| Ref model                                     | Jalur runtime                                | Gunakan ketika                                                            |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan auth langganan ChatGPT/Codex dengan runner PI default.  |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Anda menginginkan eksekusi app-server Codex native untuk giliran agen tertanam. |

GPT-5.5 saat ini hanya langganan/OAuth di OpenClaw. Gunakan
`openai-codex/gpt-5.5` untuk OAuth PI, atau `openai/gpt-5.5` dengan harness
app-server Codex. Akses kunci API langsung untuk `openai/gpt-5.5` didukung
setelah OpenAI mengaktifkan GPT-5.5 di API publik.

Ref legacy `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas doctor menulis ulang ref runtime utama legacy menjadi ref model
kanonis dan merekam kebijakan runtime secara terpisah, sementara ref legacy yang hanya fallback
dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh kontainer agen.
Konfigurasi OAuth PI Codex baru sebaiknya menggunakan `openai-codex/gpt-*`; konfigurasi
harness app-server native baru sebaiknya menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` ketika pemahaman gambar harus berjalan melalui jalur penyedia OAuth OpenAI
Codex. Gunakan `codex/gpt-*` ketika pemahaman gambar harus berjalan
melalui giliran app-server Codex terbatas. Model app-server Codex harus
mengiklankan dukungan input gambar; model Codex yang hanya teks gagal sebelum giliran media
dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa catatan terstruktur gateway `agent harness selected`. Catatan itu
menyertakan id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan ketika semua ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan" berarti
"runtime app-server Codex native." OpenClaw tidak membuat lompatan itu. Peringatan
berarti:

- **Tidak ada perubahan yang diperlukan** jika Anda memang bermaksud menggunakan OAuth ChatGPT/Codex melalui PI.
- Ubah model ke `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda bermaksud menggunakan eksekusi
  app-server native.
- Sesi yang ada tetap memerlukan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat lekat.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tertanam berjalan,
OpenClaw merekam id harness yang dipilih pada sesi tersebut dan terus menggunakannya untuk
giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi `agentRuntime` atau
`OPENCLAW_AGENT_RUNTIME` ketika Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengganti percakapan yang ada
antara PI dan Codex. Ini menghindari pemutaran ulang satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi legacy yang dibuat sebelum pin harness diperlakukan sebagai terpin PI setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memasukkan percakapan itu ke
Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- app-server Codex `0.125.0` atau lebih baru. Plugin bawaan mengelola biner
  app-server Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server atau untuk jembatan auth Codex
  OpenClaw. Peluncuran app-server stdio lokal menggunakan home Codex yang dikelola OpenClaw untuk setiap
  agen dan child `HOME` terisolasi, sehingga secara default tidak membaca akun
  `~/.codex`, Skills, plugin, konfigurasi, status thread, atau
  `$HOME/.agents/skills` native pribadi Anda.

Plugin memblokir handshake app-server yang lebih lama atau tidak berversi. Itu menjaga
OpenClaw tetap pada permukaan protokol yang telah diuji.

Untuk pengujian smoke live dan Docker, auth biasanya berasal dari akun CLI Codex
atau profil auth `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga dapat
fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## Konfigurasi minimal

Gunakan `openai/gpt-5.5`, aktifkan Plugin bawaan, dan paksa harness `codex`:

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

Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `codex` di sana juga:

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

Konfigurasi legacy yang mengatur `agents.defaults.model` atau model agen ke
`codex/<model>` tetap otomatis mengaktifkan Plugin `codex` bawaan. Konfigurasi baru sebaiknya
memilih `openai/<model>` plus entri `agentRuntime` eksplisit di atas.

## Tambahkan Codex bersama model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih
antara Codex dan model penyedia non-Codex. Runtime yang dipaksakan berlaku untuk setiap
giliran tertanam bagi agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksakan, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Tempatkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan
  penyedia campuran normal.
- Gunakan referensi legacy `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya memilih
  `openai/*` plus kebijakan runtime Codex yang eksplisit.

Misalnya, ini mempertahankan agen default pada pemilihan otomatis normal dan
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

- Agen default `main` menggunakan jalur penyedia normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness app-server Codex.
- Jika Codex tidak ada atau tidak didukung untuk agen `codex`, giliran akan gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan niat, bukan berdasarkan kata "Codex" saja:

| Pengguna meminta...                                      | Agen harus menggunakan...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                                 | `/codex bind`                                    |
| "Lanjutkan utas Codex `<id>` di sini"                    | `/codex resume <id>`                             |
| "Tampilkan utas Codex"                                   | `/codex threads`                                 |
| "Buat laporan dukungan untuk eksekusi Codex yang buruk"  | `/diagnostics [note]`                            |
| "Kirim feedback Codex hanya untuk utas terlampir ini"    | `/codex diagnostics [note]`                      |
| "Gunakan Codex sebagai runtime untuk agen ini"           | perubahan konfigurasi ke `agentRuntime.id`       |
| "Gunakan langganan ChatGPT/Codex saya dengan OpenClaw normal" | referensi model `openai-codex/*`             |
| "Jalankan Codex melalui ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam utas"    | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen saat ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan Skills plugin tidak boleh mengajari agen tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen tertanam
menggunakan Codex. Runtime plugin eksplisit default-nya tanpa fallback PI, jadi
`fallback: "none"` opsional tetapi sering berguna sebagai dokumentasi:

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

Override lingkungan:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan Codex dipaksakan, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai. Tetapkan
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda sengaja ingin PI menangani
pemilihan harness yang tidak ada.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap memakai
pemilihan otomatis normal:

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
OpenClaw baru dan harness Codex membuat atau melanjutkan utas app-server sidecar-nya
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk utas tersebut
dan memungkinkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, plugin Codex meminta app-server untuk model yang tersedia. Jika
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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap memakai
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

Secara default, plugin memulai binary Codex terkelola milik OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Binary terkelola dideklarasikan sebagai dependensi runtime plugin bawaan dan di-stage
bersama dependensi plugin `codex` lainnya. Ini membuat versi app-server
terikat ke plugin bawaan, bukan ke CLI Codex terpisah mana pun yang kebetulan
terpasang secara lokal. Tetapkan `appServer.command` hanya saat Anda
sengaja ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan shell dan alat jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orang untuk menjawabnya.

Untuk ikut menggunakan persetujuan yang ditinjau guardian Codex, tetapkan `appServer.mode:
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

Mode Guardian menggunakan jalur persetujuan auto-review native Codex. Saat Codex meminta
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan persetujuan itu ke peninjau native alih-alih prompt
manusia. Peninjau menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian saat Anda menginginkan guardrail lebih banyak daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap mengoverride `mode`, sehingga deployment tingkat lanjut dapat mencampur
preset dengan pilihan eksplisit. Nilai peninjau lama `guardian_subagent`
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

Peluncuran app-server stdio mewarisi lingkungan proses OpenClaw secara default,
tetapi OpenClaw memiliki bridge akun app-server Codex dan menetapkan baik
`CODEX_HOME` maupun `HOME` ke direktori per agen di bawah state OpenClaw agen tersebut.
Loader skill milik Codex membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran app-server
lokal. Itu menjaga skill native Codex, plugin, konfigurasi, akun, dan state utas
tetap tercakup ke agen OpenClaw alih-alih bocor dari home CLI Codex pribadi
operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry plugin
dan loader skill milik OpenClaw. Aset CLI Codex pribadi tidak. Jika Anda memiliki
skill atau plugin CLI Codex berguna yang harus menjadi bagian dari agen OpenClaw,
inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin skill ke workspace agen OpenClaw saat ini.
Plugin native Codex, hook, dan file konfigurasi dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan otomatis, karena mereka dapat
mengeksekusi perintah, mengekspos server MCP, atau membawa kredensial.

Auth dipilih dalam urutan ini:

1. Profil auth OpenClaw Codex eksplisit untuk agen.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, ia menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang di-spawn. Itu
membuat kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran app-server native Codex tertagih melalui API tanpa sengaja.
Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan login app-server
alih-alih env proses anak yang diwarisi. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau
akun milik app-server jarak jauh sendiri.

Jika deployment membutuhkan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
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

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex yang di-spawn.

Field `appServer` yang didukung:

| Bidang              | Default                                  | Makna                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                     |
| `command`           | biner Codex terkelola                    | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola; atur hanya untuk override eksplisit.                                                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                     |
| `url`               | tidak diatur                             | URL app-server WebSocket.                                                                                                                                                                                                          |
| `authToken`         | tidak diatur                             | Token bearer untuk transport WebSocket.                                                                                                                                                                                            |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan bidang kontrol app-server.                                                                                                                                                                                 |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                            |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan native Codex yang dikirim ke mulai/lanjutkan/turn thread.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke mulai/lanjutkan thread.                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias lama.                                                                                                               |
| `serviceTier`       | tidak diatur                             | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                                                                                                                 |

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus menerima
respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons alat dinamis yang gagal ke Codex agar
turn dapat berlanjut alih-alih membiarkan sesi dalam status `processing`.

Setelah OpenClaw merespons permintaan app-server dengan cakupan turn dari Codex,
harness juga mengharapkan Codex menyelesaikan turn native dengan `turn/completed`. Jika
app-server diam selama 60 detik setelah respons tersebut, OpenClaw dengan upaya terbaik
menginterupsi turn Codex, mencatat timeout diagnostik, dan melepaskan jalur sesi
OpenClaw agar pesan chat lanjutan tidak mengantre di belakang turn native yang usang.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak diatur.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal satu kali. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin di
file yang sama-sama ditinjau dengan sisa penyiapan harness Codex.

## Penggunaan komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak menyertakan app kontrol desktop sebagai vendor atau mengeksekusi
tindakan desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex menangani panggilan alat MCP native
selama turn mode Codex.

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
        fallback: "none",
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

Penggunaan Komputer khusus macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengontrol app. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, turn mode Codex gagal sebelum thread dimulai alih-alih
berjalan diam-diam tanpa alat Penggunaan Komputer native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop standar bawaan dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah konfigurasi runtime atau Penggunaan Komputer agar sesi yang sudah ada tidak mempertahankan
binding PI atau thread Codex lama.

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

Pergantian model tetap dikontrol OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, turn berikutnya mengirim model OpenAI,
penyedia, kebijakan persetujuan, sandbox, dan tingkat layanan yang sedang dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash resmi. Perintah ini
generik dan berfungsi di channel mana pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex memadatkan thread terlampir.
- `/codex review` memulai peninjauan native Codex untuk thread terlampir.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread terlampir.
- `/codex computer-use status` memeriksa plugin Penggunaan Komputer dan server MCP yang dikonfigurasi.
- `/codex computer-use install` menginstal plugin Penggunaan Komputer yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

### Alur kerja debugging umum

Saat agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau channel lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik sekali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga
   mengirim bundel umpan balik Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan tersebut menyertakan jalur bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Perintahnya terlihat seperti `codex resume <thread-id>` dan membuka
   thread Codex native agar Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik Gateway OpenClaw penuh. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah titik awal yang lebih baik karena mengikat status Gateway lokal dan id thread Codex bersama-sama dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi lengkap dan perilaku obrolan grup.

Inti OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah diagnostik Gateway umum. Prompt persetujuannya menampilkan pembuka data sensitif, menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta `openclaw gateway diagnostics export --json` melalui persetujuan eksekusi eksplisit setiap kali. Jangan menyetujui diagnostik dengan aturan izinkan-semua. Setelah disetujui, OpenClaw mengirim laporan yang dapat ditempel dengan jalur bundel lokal dan ringkasan manifes. Ketika sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang sama juga mengizinkan pengiriman bundel umpan balik Codex yang relevan ke server OpenAI. Prompt persetujuan menyatakan bahwa umpan balik Codex akan dikirim, tetapi tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam obrolan grup, OpenClaw menjaga kanal bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara pembuka diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat, OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` app-server Codex dan meminta app-server menyertakan log untuk setiap thread yang tercantum dan subthread Codex yang dibuat bila tersedia. Unggahan melewati jalur umpan balik normal Codex ke server OpenAI; jika umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan kesalahan app-server. Balasan diagnostik yang selesai mencantumkan kanal, id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>` untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor diagnostik Gateway lokal.

`/codex resume` menulis berkas sidecar binding yang sama dengan yang digunakan harness untuk giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan model OpenClaw yang saat ini dipilih ke app-server, dan menjaga riwayat yang diperluas tetap aktif.

### Periksa thread Codex dari CLI

Cara tercepat untuk memahami eksekusi Codex yang buruk sering kali adalah membuka thread Codex native secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan kanal dan ingin memeriksa sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia membuat pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan `/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai mencantumkan setiap thread Codex dan mencetak perintah `Periksa secara lokal`, misalnya `codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk obrolan saat ini atau `/codex threads [filter]` untuk thread app-server Codex terbaru, lalu menjalankan perintah `codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan app-server Codex `0.125.0` atau yang lebih baru. Metode kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adapter per-giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan berkas `hooks.json` proyek atau global Codex untuk merutekan perilaku Plugin OpenClaw. Untuk jembatan alat native dan izin yang didukung, OpenClaw menyuntikkan konfigurasi Codex per-thread untuk `PreToolUse`, `PostToolUse`, `PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook tersebut tidak diekspos sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta panggilan, sehingga OpenClaw menjalankan perilaku Plugin dan middleware yang dimilikinya dalam adapter harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis. OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread Codex native kecuali Codex mengekspos operasi tersebut melalui app-server atau callback hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server Codex dan status adapter OpenClaw, bukan perintah hook native Codex. Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan `llm_output` OpenClaw adalah observasi tingkat adapter, bukan tangkapan byte-demi-byte dari permintaan internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajectory dan debugging. Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak loop model native, dan OpenClaw mengadaptasi permukaan Plugin dan sesi di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                | Mengapa                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | App-server Codex memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan alat native.                                                                                                       |
| Perutean dan pengiriman kanal OpenClaw        | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lain tetap berada di luar runtime model.                                                                                                      |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                       |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan pasca-giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                              |
| Hook alat dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                     |
| Hook siklus hidup                             | Didukung sebagai observasi adapter      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan payload mode Codex yang jujur.                                                                    |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native      | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                        |
| Blokir atau observasi shell, patch, dan MCP native | Didukung melalui relay hook native | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan alat native yang telah dikomit, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw ketika runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui guardian normal atau jalur persetujuan pengguna. |
| Penangkapan trajectory app-server             | Didukung                                | OpenClaw merekam permintaan yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                          | Batas V1                                                                                                                                        | Jalur masa depan                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                         | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                         |
| Riwayat transkrip native Codex yang dapat diedit   | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API server aplikasi Codex eksplisit jika pembedahan thread native diperlukan. |
| `tool_result_persist` untuk catatan alat native Codex | Hook itu mengubah penulisan transkrip milik OpenClaw, bukan catatan alat native Codex.                                                          | Dapat mencerminkan catatan yang telah diubah, tetapi penulisan ulang kanonis membutuhkan dukungan Codex. |
| Metadata compaction native yang kaya               | OpenClaw mengamati awal dan penyelesaian compaction, tetapi tidak menerima daftar stabil yang dipertahankan/dibuang, delta token, atau payload ringkasan. | Membutuhkan event compaction Codex yang lebih kaya.                                      |
| Intervensi compaction                              | Hook compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                              | Tambahkan hook pra/pasca compaction Codex jika plugin perlu memveto atau menulis ulang compaction native. |
| Penangkapan permintaan API model byte-demi-byte    | OpenClaw dapat menangkap permintaan dan notifikasi server aplikasi, tetapi inti Codex membangun permintaan API OpenAI final secara internal.     | Membutuhkan event pelacakan permintaan model Codex atau API debug.                       |

## Alat, media, dan compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat pesan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur alat dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, serta `PermissionRequest`. Jangan menganggap setiap event hook
Codex di masa depan sebagai permukaan plugin OpenClaw sampai kontrak runtime
menamakannya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tidak ada keputusan hook dan meneruskan ke
jalur guardian atau persetujuan penggunanya sendiri.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang mengantre menjawab permintaan
server native itu alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lain tetap gagal tertutup.

Pengarahan antrean run aktif dipetakan ke `turn/steer` server aplikasi Codex.
Dengan default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan
chat yang mengantre selama jendela tenang yang dikonfigurasi dan mengirimnya
sebagai satu permintaan `turn/steer` sesuai urutan kedatangan. Mode `queue`
lama mengirim permintaan `turn/steer` terpisah. Turn tinjauan Codex dan
compaction manual dapat menolak pengarahan pada turn yang sama, dalam hal ini
OpenClaw menggunakan antrean tindak lanjut ketika mode yang dipilih mengizinkan
fallback. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke server aplikasi Codex. OpenClaw mempertahankan cermin
transkrip untuk riwayat channel, pencarian, `/new`, `/reset`, dan peralihan
model atau harness di masa depan. Cermin itu mencakup prompt pengguna, teks
asisten final, dan catatan penalaran atau rencana Codex yang ringan ketika
server aplikasi memancarkannya. Saat ini, OpenClaw hanya mencatat sinyal awal
dan penyelesaian compaction native. OpenClaw belum mengekspos ringkasan
compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang
entri mana yang dipertahankan Codex setelah compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini
tidak menulis ulang catatan hasil alat native Codex. Itu hanya berlaku ketika
OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan penyedia/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** itu memang diharapkan
untuk konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref lama `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime
Codex yang dipaksa kini gagal alih-alih kembali ke PI kecuali Anda secara
eksplisit mengatur `agentRuntime.fallback: "pi"`. Setelah server aplikasi Codex
dipilih, kegagalannya muncul langsung tanpa konfigurasi fallback tambahan.

**Server aplikasi ditolak:** tingkatkan Codex agar handshake server aplikasi
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis dengan versi sama atau
versi bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak
karena batas bawah protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa server aplikasi jarak jauh menggunakan versi protokol server aplikasi
Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen itu atau memilih ref lama
`codex/*`. Ref `openai/gpt-*` biasa dan penyedia lain tetap berada pada jalur
penyedia normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap turn tertanam
untuk agen itu harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan pendaftaran hook native yang kedaluwarsa. Jika `computer-use.list_apps`
mengalami timeout, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
