---
read_when:
    - Anda ingin menggunakan kerangka server aplikasi Codex yang disertakan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-05-02T23:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen level rendah: penemuan
model, pelanjutan thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Saat giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat
secara default memakai alat `message` OpenClaw jika deployment belum secara
eksplisit mengonfigurasi `messages.visibleReplies`. Agen tetap dapat
menyelesaikan giliran Codex-nya secara privat; agen hanya memposting ke channel
saat memanggil `message(action="send")`. Atur
`messages.visibleReplies: "automatic"` untuk mempertahankan balasan akhir
chat langsung pada jalur pengiriman otomatis lama.

Giliran heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara
default, sehingga agen dapat mencatat apakah wake harus tetap senyap atau
memberi notifikasi tanpa mengodekan alur kontrol itu di teks akhir.

Jika Anda sedang mencoba memahami orientasinya, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute ini:
masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam melalui
runtime app-server Codex native. Referensi model tetap kanonis sebagai
`openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan
dari prefiks model `openai-codex/*`.

Masuk terlebih dahulu dengan Codex OAuth jika Anda belum melakukannya:

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

Jangan gunakan `openai-codex/gpt-*` saat yang Anda maksud adalah runtime Codex
native. Prefiks itu adalah rute eksplisit "Codex OAuth melalui PI". Perubahan
konfigurasi berlaku untuk sesi baru atau yang direset; sesi yang sudah ada tetap
mempertahankan runtime yang tercatat.

## Yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                      | Cara Anda menggunakannya                            | Yang dilakukannya                                                           |
| -------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Runtime tertanam native          | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui app-server Codex.        |
| Perintah kontrol chat native     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread app-server Codex dari percakapan pesan.      |
| Penyedia/katalog app-server Codex | internal `codex`, diekspos melalui harness          | Memungkinkan runtime menemukan dan memvalidasi model app-server.            |
| Jalur pemahaman media Codex      | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran app-server Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                | Hook Plugin di sekitar event Codex-native           | Memungkinkan OpenClaw mengamati/memblokir event alat/finalisasi Codex-native yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi referensi model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx jalur Codex default
- mengganti secara langsung sesi yang sudah mencatat runtime PI
- menggantikan pengiriman channel OpenClaw, file sesi, penyimpanan profil
  autentikasi, atau routing pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat `/codex` native.
Jika Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan,
mengarahkan, menghentikan, atau memeriksa thread Codex dari chat, agen harus
memilih `/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit saat
pengguna meminta ACP/acpx atau sedang menguji adaptor Codex ACP.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan
kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook
perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip yang dicerminkan
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral terhadap
runtime untuk menulis ulang hasil alat dinamis OpenClaw setelah OpenClaw
mengeksekusi alat dan sebelum hasil dikembalikan ke Codex. Ini terpisah dari
hook Plugin publik `tool_result_persist`, yang mentransformasi penulisan hasil
alat transkrip milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru harus mempertahankan referensi
model OpenAI secara kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat menginginkan
eksekusi app-server native. Referensi model lama `codex/*` masih otomatis
memilih harness untuk kompatibilitas, tetapi prefiks penyedia lama yang
didukung runtime tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih `openai-codex/*`,
`openclaw doctor` memberi peringatan alih-alih mengubah rute. Itu disengaja:
`openai-codex/*` tetap menjadi jalur PI Codex OAuth/langganan, dan eksekusi
app-server native tetap menjadi pilihan runtime eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                         | Referensi model           | Konfigurasi runtime                    | Rute autentikasi/profil     | Label status yang diharapkan   |
| ------------------------------------------------ | ------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*`          | `agentRuntime.id: "codex"`             | Codex OAuth atau akun Codex | `Runtime: OpenAI Codex`        |
| OpenAI API melalui runner OpenClaw normal        | `openai/gpt-*`            | dihilangkan atau `runtime: "pi"`       | Kunci API OpenAI            | `Runtime: OpenClaw Pi Default` |
| Langganan ChatGPT/Codex melalui PI               | `openai-codex/gpt-*`      | dihilangkan atau `runtime: "pi"`       | Penyedia OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Penyedia campuran dengan mode otomatis konservatif | referensi spesifik penyedia | `agentRuntime.id: "auto"`            | Per penyedia yang dipilih   | Bergantung pada runtime yang dipilih |
| Sesi adaptor Codex ACP eksplisit                 | bergantung pada prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Autentikasi backend ACP | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/autentikasi mana yang harus dipakai PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi
  giliran tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik prefiks. Untuk setup umum langganan plus
runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`.
Gunakan `openai-codex/*` hanya saat Anda sengaja menginginkan Codex OAuth melalui PI:

| Referensi model                              | Jalur runtime                                | Gunakan saat                                                              |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses OpenAI Platform API langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth melalui OpenClaw/PI       | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan runner PI default. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                    | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul pada rute kunci API OpenAI langsung dan langganan Codex
saat akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness
app-server Codex untuk runtime Codex native, `openai-codex/gpt-5.5` untuk PI
OAuth, atau `openai/gpt-5.5` tanpa override runtime Codex untuk trafik kunci API
langsung.

Referensi lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas.
Migrasi kompatibilitas doctor menulis ulang referensi runtime utama lama menjadi
referensi model kanonis dan mencatat kebijakan runtime secara terpisah, sementara
referensi lama yang hanya fallback dibiarkan tidak berubah karena runtime
dikonfigurasi untuk seluruh kontainer agen. Konfigurasi PI Codex OAuth baru
harus menggunakan `openai-codex/gpt-*`; konfigurasi harness app-server native
baru harus menggunakan `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur penyedia
OpenAI Codex OAuth. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran app-server Codex terbatas. Model app-server Codex harus
mengiklankan dukungan input gambar; model Codex yang hanya teks gagal sebelum
giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pemilihannya mengejutkan, aktifkan logging debug untuk subsistem
`agents/harness` dan periksa catatan terstruktur `agent harness selected` milik
Gateway. Catatan itu mencakup id harness yang dipilih, alasan pemilihan,
kebijakan runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap
kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan saat semua hal ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan"
berarti "runtime app-server Codex native." OpenClaw tidak mengambil lompatan
itu. Peringatan tersebut berarti:

- **Tidak ada perubahan yang diperlukan** jika Anda memang bermaksud menggunakan
  ChatGPT/Codex OAuth melalui PI.
- Ubah model menjadi `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda bermaksud menggunakan eksekusi
  app-server native.
- Sesi yang sudah ada tetap memerlukan `/new` atau `/reset` setelah perubahan
  runtime, karena pin runtime sesi bersifat melekat.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tertanam berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi tersebut dan terus
menggunakannya untuk giliran berikutnya dalam id sesi yang sama. Ubah
konfigurasi `agentRuntime` atau `OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi
mendatang menggunakan harness lain; gunakan `/new` atau `/reset` untuk memulai
sesi baru sebelum mengganti percakapan yang sudah ada antara PI dan Codex. Ini
menghindari pemutaran ulang satu transkrip melalui dua sistem sesi native yang
tidak kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai terpin PI setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memasukkan
percakapan itu ke Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan yang tersedia.
- App-server Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  app-server Codex yang kompatibel secara default, sehingga perintah `codex`
  lokal di `PATH` tidak memengaruhi startup harness normal.
- Autentikasi Codex tersedia untuk proses app-server atau untuk bridge autentikasi
  Codex OpenClaw. Peluncuran app-server lokal menggunakan home Codex yang dikelola
  OpenClaw untuk setiap agent dan `HOME` turunan yang terisolasi, sehingga secara
  default tidak membaca akun, skills, plugins, konfigurasi, status thread, atau
  `$HOME/.agents/skills` native pribadi Anda di `~/.codex`.

Plugin memblokir handshake app-server yang lebih lama atau tidak berversi. Ini menjaga
OpenClaw tetap berada pada permukaan protokol yang telah diuji.

Untuk uji smoke live dan Docker, autentikasi biasanya berasal dari akun CLI Codex
atau profil autentikasi `openai-codex` OpenClaw. Peluncuran app-server stdio lokal
juga dapat beralih ke `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native. OpenClaw
tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file fallback
Codex untuk file persona, karena fallback Codex hanya berlaku ketika
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap lain
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, dan `MEMORY.md` jika ada) dan meneruskannya melalui instruksi
konfigurasi Codex pada `thread/start` dan `thread/resume`. Ini membuat konteks
persona/profil workspace `SOUL.md` dan yang terkait tetap terlihat tanpa
menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agent yang sama harus
bebas beralih antara Codex dan model penyedia non-Codex. Runtime yang dipaksa berlaku
untuk setiap giliran tertanam bagi agent atau sesi tersebut. Jika Anda memilih model
Anthropic saat runtime tersebut dipaksa, OpenClaw tetap mencoba harness Codex dan gagal
tertutup alih-alih secara diam-diam merutekan giliran tersebut melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Letakkan Codex pada agent khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agent default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan
  penyedia campuran normal.
- Gunakan referensi lama `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya
  menggunakan `openai/*` plus kebijakan runtime Codex eksplisit.

Contohnya, ini mempertahankan agent default pada pemilihan otomatis normal dan
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

- Agent `main` default menggunakan jalur penyedia normal dan fallback kompatibilitas PI.
- Agent `codex` menggunakan harness app-server Codex.
- Jika Codex hilang atau tidak didukung untuk agent `codex`, giliran gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agent

Agent harus merutekan permintaan pengguna berdasarkan maksud, bukan hanya berdasarkan kata "Codex":

| Pengguna meminta...                                      | Agent harus menggunakan...                         |
| -------------------------------------------------------- | -------------------------------------------------- |
| "Ikat chat ini ke Codex"                                 | `/codex bind`                                      |
| "Lanjutkan thread Codex `<id>` di sini"                  | `/codex resume <id>`                               |
| "Tampilkan thread Codex"                                 | `/codex threads`                                   |
| "Buat laporan dukungan untuk eksekusi Codex yang buruk"  | `/diagnostics [note]`                              |
| "Hanya kirim masukan Codex untuk thread terlampir ini"   | `/codex diagnostics [note]`                        |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`      |
| "Gunakan langganan ChatGPT/Codex saya melalui PI"        | referensi model `openai-codex/*`                  |
| "Jalankan Codex melalui ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`      |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread"  | ACP/acpx, bukan `/codex` dan bukan sub-agent native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agent ketika ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan skills Plugin tidak boleh mengajari agent tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex ketika Anda perlu membuktikan bahwa setiap giliran agent tertanam
menggunakan Codex. Runtime Plugin eksplisit secara default tidak memiliki fallback PI, sehingga
`fallback: "none"` bersifat opsional tetapi sering berguna sebagai dokumentasi:

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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan, app-server
terlalu lama, atau app-server tidak dapat dimulai. Tetapkan
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda sengaja ingin PI menangani
pemilihan harness yang hilang.

## Codex per agent

Anda dapat membuat satu agent hanya-Codex sementara agent default mempertahankan
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

Gunakan perintah sesi normal untuk beralih agent dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan memungkinkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, Plugin Codex meminta app-server untuk model yang tersedia. Jika
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

Secara default, Plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Biner terkelola dikirim bersama paket Plugin `codex`. Ini membuat versi app-server
terikat pada Plugin bawaan alih-alih pada CLI Codex terpisah mana pun yang kebetulan
terpasang secara lokal. Tetapkan `appServer.command` hanya ketika Anda sengaja ingin
menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan alat shell dan jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orangnya untuk menjawab.

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

Mode Guardian menggunakan jalur persetujuan auto-review native Codex. Ketika Codex meminta
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan persetujuan tersebut ke peninjau native alih-alih prompt manusia.
Peninjau menerapkan kerangka risiko Codex dan menyetujui atau menolak permintaan spesifik
tersebut. Gunakan Guardian ketika Anda menginginkan pagar pengaman lebih banyak daripada mode
YOLO tetapi tetap membutuhkan agent tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan dapat mencampur
preset dengan pilihan eksplisit. Nilai peninjau lama `guardian_subagent` masih diterima sebagai
alias kompatibilitas, tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

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
tetapi OpenClaw memiliki bridge akun app-server Codex dan menetapkan
`CODEX_HOME` serta `HOME` ke direktori per-agent di bawah status OpenClaw agent tersebut.
Loader skill milik Codex membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran app-server
lokal. Itu membuat skills, plugins, konfigurasi, akun, dan status thread native Codex
tetap terscope ke agent OpenClaw alih-alih bocor dari home CLI Codex pribadi operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry Plugin dan
loader skill milik OpenClaw sendiri. Aset CLI Codex pribadi tidak. Jika Anda memiliki
skills atau plugins CLI Codex yang berguna dan seharusnya menjadi bagian dari agent OpenClaw,
inventariskan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin skills ke workspace agent OpenClaw saat ini.
Plugin native Codex, hook, dan file konfigurasi dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan secara otomatis, karena dapat
menjalankan perintah, mengekspos server MCP, atau membawa kredensial.

Autentikasi dipilih dalam urutan ini:

1. Profil autentikasi Codex OpenClaw eksplisit untuk agent.
2. Akun app-server yang sudah ada di home Codex agent tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, ia menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses turunan Codex yang di-spawn. Itu
membuat kunci API tingkat Gateway tetap tersedia untuk embeddings atau model OpenAI langsung
tanpa membuat giliran app-server Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login app-server
alih-alih env proses turunan yang diwariskan. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil autentikasi eksplisit atau akun
milik app-server jarak jauh sendiri.

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

`appServer.clearEnv` hanya memengaruhi proses turunan app-server Codex yang dijalankan.

Dynamic tools Codex secara default menggunakan profil `native-first`. Dalam mode itu,
OpenClaw tidak mengekspos dynamic tools yang menduplikasi operasi workspace native Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Alat integrasi OpenClaw seperti messaging, sessions, media,
cron, browser, nodes, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Bidang Plugin Codex tingkat atas yang didukung:

| Bidang                     | Bawaan          | Makna                                                                                              |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set dynamic tool OpenClaw lengkap ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama dynamic tool OpenClaw tambahan yang dihilangkan dari giliran app-server Codex.                |

Bidang `appServer` yang didukung:

| Bidang              | Bawaan                                  | Makna                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                         |
| `command`           | biner Codex terkelola                    | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                         |
| `url`               | tidak disetel                            | URL app-server WebSocket.                                                                                                                                                                                                              |
| `authToken`         | tidak disetel                            | Token Bearer untuk transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per-agent OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan native Codex yang dikirim ke thread start/resume/turn.                                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke thread start/resume.                                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias lama.                                                                                                                   |
| `serviceTier`       | tidak disetel                            | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                                                                                                                     |

Panggilan dynamic tool yang dimiliki OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan `item/tool/call` Codex harus
menerima respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan
sinyal alat jika didukung dan mengembalikan respons dynamic-tool yang gagal ke
Codex agar giliran dapat berlanjut alih-alih membiarkan sesi dalam status
`processing`.

Setelah OpenClaw merespons permintaan app-server dengan cakupan giliran Codex,
harness juga mengharapkan Codex menyelesaikan giliran native dengan
`turn/completed`. Jika app-server diam selama 60 detik setelah respons itu,
OpenClaw melakukan interrupt best-effort pada giliran Codex, mencatat timeout
diagnostik, dan melepaskan lane sesi OpenClaw agar pesan chat lanjutan tidak
mengantre di belakang giliran native yang kedaluwarsa.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Config
lebih disukai untuk deployment yang dapat diulang karena menjaga perilaku plugin
dalam file yang sama-sama ditinjau seperti bagian lain dari penyiapan harness Codex.

## Penggunaan komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau menjalankan
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex menangani panggilan alat MCP native
selama giliran mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk perbedaan
antara Penggunaan Komputer yang dimiliki Codex dan pendaftaran MCP langsung.

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
        fallback: "none",
      },
    },
  },
}
```

Penyiapan dapat diperiksa atau diinstal dari command surface:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Penggunaan Komputer bersifat khusus macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengontrol aplikasi. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, giliran mode Codex gagal sebelum thread dimulai alih-alih
berjalan diam-diam tanpa alat Penggunaan Komputer native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop standar yang dibundel dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah runtime atau config Penggunaan Komputer agar sesi yang ada tidak menyimpan
binding PI atau thread Codex lama.

## Resep umum

Codex lokal dengan transport stdio bawaan:

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

Pergantian model tetap dikendalikan OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, giliran berikutnya mengirim model OpenAI,
provider, kebijakan persetujuan, sandbox, dan tingkat layanan yang saat ini dipilih
ke app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex untuk melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin yang dibundel mendaftarkan `/codex` sebagai slash command yang diotorisasi. Perintah ini
generik dan berfungsi pada channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas server aplikasi langsung, model, akun, batas laju, server MCP, dan skills.
- `/codex models` mencantumkan model server aplikasi Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk memadatkan thread yang terlampir.
- `/codex review` memulai peninjauan native Codex untuk thread yang terlampir.
- `/codex diagnostics [note]` meminta persetujuan sebelum mengirim umpan balik diagnostik Codex untuk thread yang terlampir.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` memasang Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan skills server aplikasi Codex.

### Alur kerja debugging umum

Ketika agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau saluran lain, mulailah dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik sekali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga mengirim
   bundel umpan balik Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan itu menyertakan path bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   thread native Codex sehingga Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa ia memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik
Gateway OpenClaw lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]`
adalah titik awal yang lebih baik karena mengaitkan status Gateway lokal dan id
thread Codex dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku chat grup.

Core OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan mukadimah data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan eksekusi eksplisit
setiap kali. Jangan setujui diagnostik dengan aturan izinkan semua. Setelah disetujui,
OpenClaw mengirim laporan yang dapat ditempel dengan path bundel lokal dan ringkasan
manifest. Ketika sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang
sama juga mengotorisasi pengiriman bundel umpan balik Codex yang relevan ke
server OpenAI. Prompt persetujuan mengatakan bahwa umpan balik Codex akan dikirim, tetapi
tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam chat grup, OpenClaw menjaga
saluran bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara
mukadimah diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil server aplikasi Codex `feedback/upload` dan meminta
server aplikasi menyertakan log untuk setiap thread yang dicantumkan dan subthread Codex
yang dibuat saat tersedia. Unggahan berjalan melalui jalur umpan balik normal Codex ke
server OpenAI; jika umpan balik Codex dinonaktifkan di server aplikasi tersebut, perintah
mengembalikan kesalahan server aplikasi. Balasan diagnostik yang selesai mencantumkan saluran,
id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis file pengikatan sidecar yang sama dengan yang digunakan harness untuk
turn normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke server aplikasi, dan menjaga riwayat diperluas
tetap aktif.

### Memeriksa thread Codex dari CLI

Cara tercepat untuk memahami run Codex yang buruk sering kali adalah membuka thread
native Codex secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan saluran dan ingin memeriksa
sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia membuat
pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai mencantumkan
setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk chat saat ini atau
`/codex threads [filter]` untuk thread server aplikasi Codex terbaru, lalu menjalankan perintah
`codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan server aplikasi Codex `0.125.0` atau yang lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
server aplikasi masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi server aplikasi Codex | Plugin bundel OpenClaw | Perilaku adapter per turn di sekitar alat dinamis OpenClaw.         |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex proyek atau global untuk merutekan
perilaku Plugin OpenClaw. Untuk alat native dan bridge izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook tersebut tidak diekspos sebagai
hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw menjalankan alat setelah Codex meminta
panggilan, sehingga OpenClaw memicu perilaku Plugin dan middleware yang dimilikinya di
adapter harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis.
OpenClaw dapat mencerminkan peristiwa terpilih, tetapi tidak dapat menulis ulang thread native Codex
kecuali Codex mengekspos operasi tersebut melalui server aplikasi atau callback hook native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi server aplikasi Codex
dan status adapter OpenClaw, bukan perintah hook native Codex. Peristiwa
`before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adapter, bukan tangkapan byte-per-byte
dari permintaan internal atau payload Compaction Codex.

Notifikasi server aplikasi `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk lintasan dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak bagian
dari loop model native, dan OpenClaw mengadaptasi permukaan Plugin dan sesinya
di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | Server aplikasi Codex memiliki turn OpenAI, pelanjutan thread native, dan kelanjutan alat native.                                                                                                     |
| Perutean dan pengiriman saluran OpenClaw      | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan saluran lain tetap berada di luar runtime model.                                                                                                     |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw menjalankan alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                        |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke turn Codex sebelum memulai atau melanjutkan thread.                                                                                   |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah turn, dan koordinasi Compaction mesin konteks berjalan untuk turn Codex.                                                                                  |
| Hook alat dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                     |
| Hook siklus hidup                             | Didukung sebagai observasi adapter      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                      |
| Gate revisi jawaban akhir                     | Didukung melalui relay hook native      | `Stop` Codex diteruskan ke `before_agent_finalize`; `revise` meminta Codex melakukan satu pass model lagi sebelum finalisasi.                                                                         |
| Blokir atau amati shell, patch, dan MCP native | Didukung melalui relay hook native      | `PreToolUse` dan `PostToolUse` Codex diteruskan untuk permukaan alat native yang dikomit, termasuk payload MCP pada server aplikasi Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw ketika runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui jalur guardian atau persetujuan pengguna normalnya. |
| Penangkapan lintasan server aplikasi          | Didukung                                | OpenClaw merekam permintaan yang dikirimnya ke server aplikasi dan notifikasi server aplikasi yang diterimanya.                                                                                       |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                          | Batas V1                                                                                                                                             | Jalur masa depan                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                         | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                           | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                             |
| Riwayat transkrip native Codex yang dapat diedit   | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki mirror dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API server aplikasi Codex eksplisit jika operasi thread native diperlukan.          |
| `tool_result_persist` untuk rekaman alat native Codex | Hook tersebut mentransformasi penulisan transkrip milik OpenClaw, bukan rekaman alat native Codex.                                                   | Dapat mencerminkan rekaman yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya               | OpenClaw mengamati awal dan selesainya Compaction, tetapi tidak menerima daftar disimpan/dibuang yang stabil, delta token, atau payload ringkasan.    | Memerlukan peristiwa Compaction Codex yang lebih kaya.                                       |
| Intervensi Compaction                              | Hook Compaction OpenClaw saat ini berada di tingkat notifikasi dalam mode Codex.                                                                      | Tambahkan hook pra/pasca Compaction Codex jika plugin perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte-per-byte      | OpenClaw dapat menangkap permintaan dan notifikasi server aplikasi, tetapi inti Codex membangun permintaan API OpenAI final secara internal.          | Memerlukan peristiwa pelacakan permintaan model Codex atau API debug.                        |

## Alat, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw masih membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat perpesanan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1 dibatasi
pada jalur alat native Codex dan izin yang diuji OpenClaw. Dalam runtime Codex,
itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan menganggap setiap peristiwa hook
Codex di masa depan sebagai permukaan plugin OpenClaw sampai kontrak runtime
menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau tolak eksplisit
ketika kebijakan memutuskan. Hasil tanpa keputusan bukan berarti izin. Codex memperlakukannya sebagai tanpa
keputusan hook dan melanjutkan ke jalur penjaga atau persetujuan pengguna miliknya sendiri.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt Codex `request_user_input` dikirim kembali ke
chat asal, dan pesan tindak lanjut berikutnya yang diantrekan menjawab permintaan server
native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan elisitasi MCP lain
tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke `turn/steer` server aplikasi Codex. Dengan
`messages.queue.mode: "steer"` default, OpenClaw mengelompokkan pesan chat yang diantrekan
untuk jendela senyap yang dikonfigurasi dan mengirimkannya sebagai satu permintaan `turn/steer` dalam
urutan kedatangan. Mode `queue` lama mengirim permintaan `turn/steer` terpisah. Giliran
review Codex dan Compaction manual dapat menolak pengarahan giliran yang sama, dalam hal ini
OpenClaw menggunakan antrean tindak lanjut ketika mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke server aplikasi Codex. OpenClaw menyimpan mirror transkrip untuk riwayat
channel, pencarian, `/new`, `/reset`, dan perpindahan model atau harness mendatang. Mirror
mencakup prompt pengguna, teks asisten final, dan rekaman penalaran atau rencana Codex
ringan ketika server aplikasi memancarkannya. Saat ini, OpenClaw hanya
merekam sinyal awal dan selesainya Compaction native. Ini belum mengekspos
ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang Codex
simpan setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang rekaman hasil alat native Codex. Ini hanya berlaku ketika
OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan pemahaman
media tetap menggunakan pengaturan penyedia/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan Masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref lama `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime
Codex yang dipaksa sekarang gagal alih-alih fallback ke PI kecuali Anda
secara eksplisit mengatur `agentRuntime.fallback: "pi"`. Setelah server aplikasi Codex
dipilih, kegagalannya muncul langsung tanpa konfigurasi fallback tambahan.

**Server aplikasi ditolak:** tingkatkan Codex agar handshake server aplikasi
melaporkan versi `0.125.0` atau lebih baru. Prarilis versi sama atau versi bersufiks build
seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
batas bawah protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa server aplikasi jarak jauh menggunakan versi protokol server aplikasi Codex yang sama.

**Model non-Codex menggunakan PI:** ini diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref lama
`codex/*`. Ref `openai/gpt-*` biasa dan penyedia lain tetap berada di jalur
penyedia normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap giliran tertanam
untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan pendaftaran hook native yang usang. Jika `computer-use.list_apps`
habis waktu, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
