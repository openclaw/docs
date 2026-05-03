---
read_when:
    - Anda ingin menggunakan harness server aplikasi Codex bawaan
    - Anda memerlukan contoh konfigurasi kerangka kerja Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tersemat OpenClaw melalui harness app-server Codex bawaan
title: Kerangka Codex
x-i18n:
    generated_at: "2026-05-03T09:18:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui server aplikasi Codex, bukan melalui kerangka PI bawaan.

Gunakan ini saat Anda ingin Codex mengelola sesi agen tingkat rendah: penemuan model, pelanjutan utas native, Compaction native, dan eksekusi server aplikasi. OpenClaw tetap mengelola kanal chat, berkas sesi, pemilihan model, alat, persetujuan, pengiriman media, dan cerminan transkrip yang terlihat.

Saat giliran chat sumber berjalan melalui kerangka Codex, balasan yang terlihat secara default memakai alat `message` OpenClaw jika penerapan belum mengonfigurasi `messages.visibleReplies` secara eksplisit. Agen tetap dapat menyelesaikan giliran Codex-nya secara privat; agen hanya mengirim ke kanal saat memanggil `message(action="send")`. Atur `messages.visibleReplies: "automatic"` untuk mempertahankan balasan akhir chat langsung pada jalur pengiriman otomatis lama.

Giliran Heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara default, sehingga agen dapat mencatat apakah bangunannya harus tetap senyap atau memberi notifikasi tanpa menyandikan alur kontrol itu dalam teks akhir.

Jika Anda mencoba memahami konteksnya, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram, Discord, Slack, atau kanal lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam melalui runtime server aplikasi Codex native. Referensi model tetap kanonis sebagai `openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan dari prefiks model `openai-codex/*`.

Pertama masuk dengan OAuth Codex jika belum:

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

Jika konfigurasi Anda memakai `plugins.allow`, sertakan juga `codex` di sana:

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

Jangan gunakan `openai-codex/gpt-*` jika yang Anda maksud adalah runtime Codex native. Prefiks itu adalah rute eksplisit "OAuth Codex melalui PI". Perubahan konfigurasi berlaku untuk sesi baru atau sesi yang direset; sesi yang ada tetap memakai runtime yang sudah tercatat.

## Yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                       | Cara menggunakannya                                | Yang dilakukannya                                                            |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui server aplikasi Codex.     |
| Perintah kontrol chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol utas server aplikasi Codex dari percakapan pesan.     |
| Penyedia/katalog server aplikasi Codex | internal `codex`, diekspos melalui kerangka         | Memungkinkan runtime menemukan dan memvalidasi model server aplikasi.         |
| Jalur pemahaman media Codex       | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran server aplikasi Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relai hook native                 | Hook Plugin di sekitar peristiwa native Codex       | Memungkinkan OpenClaw mengamati/memblokir peristiwa alat/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi referensi model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx sebagai jalur Codex default
- mengganti langsung sesi yang sudah mencatat runtime PI
- mengganti pengiriman kanal OpenClaw, berkas sesi, penyimpanan profil autentikasi, atau perutean pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat native `/codex`. Jika Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan, mengarahkan, menghentikan, atau memeriksa utas Codex dari chat, agen sebaiknya lebih memilih `/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit saat pengguna meminta ACP/acpx atau sedang menguji adaptor ACP Codex.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip tercermin
- `before_agent_finalize` melalui relai `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral runtime untuk menulis ulang hasil alat dinamis OpenClaw setelah OpenClaw mengeksekusi alat dan sebelum hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik `tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks) dan [Perilaku guard Plugin](/id/tools/plugin).

Kerangka ini nonaktif secara default. Konfigurasi baru harus menjaga referensi model OpenAI tetap kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat menginginkan eksekusi server aplikasi native. Referensi model lama `codex/*` masih otomatis memilih kerangka ini untuk kompatibilitas, tetapi prefiks penyedia lama yang didukung runtime tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih `openai-codex/*`, `openclaw doctor` memberi peringatan alih-alih mengubah rute. Itu disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan Codex PI, dan eksekusi server aplikasi native tetap menjadi pilihan runtime eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                            | Referensi model          | Konfigurasi runtime                   | Rute autentikasi/profil      | Label status yang diharapkan   |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth Codex atau akun Codex  | `Runtime: OpenAI Codex`        |
| OpenAI API melalui runner OpenClaw normal           | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`       | Kunci API OpenAI             | `Runtime: OpenClaw Pi Default` |
| Langganan ChatGPT/Codex melalui PI                  | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`       | Penyedia OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Penyedia campuran dengan mode otomatis konservatif  | referensi khusus penyedia  | `agentRuntime.id: "auto"`              | Per penyedia yang dipilih    | Bergantung pada runtime yang dipilih |
| Sesi adaptor Codex ACP eksplisit                    | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Autentikasi backend ACP      | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/autentikasi mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi giliran tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau dikontrol chat ini?"
- ACP menjawab "proses kerangka eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik prefiks. Untuk penyiapan umum langganan plus runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`. Gunakan `openai-codex/*` hanya saat Anda sengaja menginginkan OAuth Codex melalui PI:

| Referensi model                              | Jalur runtime                                | Gunakan saat                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan runner PI default. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Kerangka server aplikasi Codex               | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul di rute kunci API OpenAI langsung dan rute langganan Codex saat akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan kerangka server aplikasi Codex untuk runtime Codex native, `openai-codex/gpt-5.5` untuk OAuth PI, atau `openai/gpt-5.5` tanpa override runtime Codex untuk lalu lintas kunci API langsung.

Referensi lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi kompatibilitas doctor menulis ulang referensi runtime utama lama menjadi referensi model kanonis dan mencatat kebijakan runtime secara terpisah, sementara referensi lama yang hanya fallback dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh kontainer agen. Konfigurasi OAuth Codex PI baru harus memakai `openai-codex/gpt-*`; konfigurasi kerangka server aplikasi native baru harus memakai `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur penyedia OAuth OpenAI Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan melalui giliran server aplikasi Codex terbatas. Model server aplikasi Codex harus mengiklankan dukungan input gambar; model Codex hanya teks gagal sebelum giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi kerangka efektif untuk sesi saat ini. Jika pemilihannya mengejutkan, aktifkan pencatatan debug untuk subsistem `agents/harness` dan periksa catatan terstruktur `agent harness selected` milik Gateway. Catatan itu mencakup id kerangka yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan saat semua ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan" berarti "runtime server aplikasi Codex native." OpenClaw tidak melakukan lompatan itu. Peringatan tersebut berarti:

- **Tidak diperlukan perubahan** jika Anda memang bermaksud memakai OAuth ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda bermaksud memakai eksekusi server aplikasi
  native.
- Sesi yang ada tetap memerlukan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat lengket.

Pemilihan kerangka bukan kontrol sesi langsung. Saat giliran tertanam berjalan, OpenClaw mencatat id kerangka yang dipilih pada sesi itu dan terus menggunakannya untuk giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi `agentRuntime` atau `OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang memakai kerangka lain; gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan percakapan yang ada antara PI dan Codex. Ini menghindari pemutaran ulang satu transkrip melalui dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum pin kerangka diperlakukan sebagai ter-pin PI setelah memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memilih Codex bagi percakapan itu setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness Codex app-server muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- Codex app-server `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, jadi perintah `codex` lokal
  di `PATH` tidak memengaruhi startup harness normal.
- Autentikasi Codex tersedia untuk proses app-server atau untuk jembatan autentikasi Codex
  milik OpenClaw. Peluncuran app-server lokal menggunakan Codex home yang dikelola OpenClaw untuk setiap
  agen dan `HOME` anak yang terisolasi, jadi secara default peluncuran tersebut tidak membaca akun
  `~/.codex` pribadi Anda, skills, plugins, config, status thread, atau
  `$HOME/.agents/skills` native.

Plugin memblokir handshake app-server lama atau tanpa versi. Ini menjaga
OpenClaw tetap berada pada permukaan protokol yang sudah diuji.

Untuk uji smoke live dan Docker, autentikasi biasanya berasal dari akun Codex CLI
atau profil autentikasi `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga dapat
kembali memakai `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui discovery dokumen proyek native. OpenClaw
tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file fallback
Codex untuk file persona, karena fallback Codex hanya berlaku ketika
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap
lainnya (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, dan `MEMORY.md` ketika ada) dan meneruskannya melalui instruksi
config Codex pada `thread/start` dan `thread/resume`. Ini menjaga konteks
persona/profil workspace `SOUL.md` dan terkait tetap terlihat tanpa
menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan atur `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih
antara Codex dan model penyedia non-Codex. Runtime yang dipaksa berlaku untuk setiap
giliran tertanam untuk agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Letakkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan penyedia campuran normal.
- Gunakan ref lama `codex/*` hanya untuk kompatibilitas. Config baru sebaiknya memilih
  `openai/*` ditambah kebijakan runtime Codex eksplisit.

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
- Agen `codex` menggunakan harness Codex app-server.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran tersebut gagal
  alih-alih diam-diam memakai PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan maksud, bukan berdasarkan kata "Codex" saja:

| Pengguna meminta...                                    | Agen harus menggunakan...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                               | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                               | `/codex threads`                                 |
| "Ajukan laporan dukungan untuk eksekusi Codex yang buruk" | `/diagnostics [note]`                         |
| "Hanya kirim masukan Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                      |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`   |
| "Gunakan langganan ChatGPT/Codex saya melalui PI"      | ref model `openai-codex/*`                       |
| "Jalankan Codex melalui ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen ketika ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan plugin skills tidak boleh mengajarkan agen tentang
perutean ACP.

## Deployment khusus Codex

Paksa harness Codex ketika Anda perlu membuktikan bahwa setiap giliran agen tertanam
menggunakan Codex. Runtime plugin eksplisit gagal tertutup dan tidak pernah diam-diam dicoba ulang
melalui PI:

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

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap memakai
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

Gunakan perintah sesi normal untuk beralih agen dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan membiarkan giliran berikutnya menyelesaikan harness dari config saat ini lagi.

## Discovery model

Secara default, plugin Codex meminta model yang tersedia kepada app-server. Jika
discovery gagal atau timeout, plugin memakai katalog fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyesuaikan discovery di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan discovery ketika Anda ingin startup menghindari probing Codex dan tetap memakai
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

Secara default, plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Biner yang dikelola dikirim bersama paket plugin `codex`. Ini menjaga versi
app-server terikat ke plugin bawaan, bukan ke Codex CLI terpisah mana pun
yang kebetulan terinstal secara lokal. Atur `appServer.command` hanya ketika
Anda sengaja ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk heartbeat otonom: Codex dapat menggunakan alat shell dan jaringan tanpa
berhenti pada prompt approval native yang tidak ada orang untuk menjawabnya.

Untuk ikut memakai approval yang ditinjau guardian Codex, atur `appServer.mode:
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
jaringan, Codex merutekan permintaan approval itu ke reviewer native, bukan ke
prompt manusia. Reviewer menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian ketika Anda menginginkan guardrail lebih banyak daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk terus bergerak.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap mengoverride `mode`, sehingga deployment tingkat lanjut dapat memadukan
preset dengan pilihan eksplisit. Nilai reviewer lama `guardian_subagent`
masih diterima sebagai alias kompatibilitas, tetapi config baru sebaiknya memakai
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

Peluncuran app-server Stdio mewarisi environment proses OpenClaw secara default,
tetapi OpenClaw memiliki jembatan akun Codex app-server dan menetapkan baik
`CODEX_HOME` maupun `HOME` ke direktori per agen di bawah state OpenClaw agen tersebut.
Skill loader milik Codex membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, jadi kedua nilai tersebut diisolasi untuk peluncuran app-server
lokal. Itu menjaga skills, plugins, config, akun, dan status thread native Codex
tetap berada dalam cakupan agen OpenClaw alih-alih bocor dari home Codex CLI
pribadi operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry
plugin dan skill loader OpenClaw sendiri. Aset Codex CLI pribadi tidak. Jika Anda memiliki
skills atau plugins Codex CLI berguna yang seharusnya menjadi bagian dari agen OpenClaw,
inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin skills ke workspace agen OpenClaw saat ini.
Plugin native Codex, hook, dan file config dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan otomatis, karena semuanya dapat
mengeksekusi perintah, mengekspos server MCP, atau membawa kredensial.

Autentikasi dipilih dalam urutan ini:

1. Profil autentikasi Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang ada di Codex home agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dibuat. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran Codex app-server native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci environment stdio lokal menggunakan login app-server
alih-alih env proses anak yang diwarisi. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil autentikasi eksplisit atau
akun milik app-server remote sendiri.

Jika deployment membutuhkan isolasi environment tambahan, tambahkan variabel tersebut ke
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

`appServer.clearEnv` hanya memengaruhi proses anak Codex app-server yang dibuat.

Codex dynamic tools secara default menggunakan profil `native-first`. Dalam mode tersebut,
OpenClaw tidak mengekspos dynamic tools yang menduplikasi operasi workspace
native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Alat integrasi OpenClaw seperti perpesanan, sesi, media,
cron, peramban, node, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Field Plugin Codex tingkat atas yang didukung:

| Field                      | Default          | Arti                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set dynamic tool OpenClaw penuh ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama dynamic tool OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.   |

Field `appServer` yang didukung:

| Field               | Default                                  | Arti                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                       |
| `command`           | biner Codex terkelola                    | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola; atur hanya untuk override eksplisit.                                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                       |
| `url`               | tidak diatur                             | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | tidak diatur                             | Token Bearer untuk transport WebSocket.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan native Codex yang dikirim ke mulai/lanjutkan/giliran thread.                                                                                                                                                   |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke mulai/lanjutkan thread.                                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias lama.                                                                                                                 |
| `serviceTier`       | tidak diatur                             | Tier layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                                                                                                                      |

Panggilan dynamic tool milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus menerima
respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons dynamic-tool yang gagal ke Codex agar
giliran dapat berlanjut alih-alih membiarkan sesi dalam `processing`.

Setelah OpenClaw merespons permintaan app-server dengan cakupan giliran Codex,
harness juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server tidak aktif selama 60 detik setelah respons tersebut, OpenClaw sebisa mungkin
menginterupsi giliran Codex, mencatat timeout diagnostik, dan melepaskan lane
sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran
native yang basi.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Config lebih
disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin di
file yang sama-sama ditinjau seperti sisa setup harness Codex.

## Penggunaan komputer

Computer Use dibahas dalam panduan setup tersendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau mengeksekusi
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa
server MCP `computer-use` tersedia, lalu membiarkan Codex menangani panggilan alat
MCP native selama giliran mode Codex.

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

Setup dapat diperiksa atau dipasang dari permukaan command:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use khusus macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengontrol aplikasi. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, giliran mode Codex gagal sebelum thread dimulai alih-alih
diam-diam berjalan tanpa alat Computer Use native. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop standar yang dibundel dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah runtime atau config Computer Use agar sesi yang ada tidak mempertahankan
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

Pergantian model tetap dikendalikan OpenClaw. Saat sesi OpenClaw terlampir
ke thread Codex yang ada, giliran berikutnya mengirim model OpenAI, penyedia,
kebijakan persetujuan, sandbox, dan tier layanan yang saat ini dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Command Codex

Plugin yang dibundel mendaftarkan `/codex` sebagai slash command resmi. Ini
generik dan berfungsi di channel apa pun yang mendukung command teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas rate, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang ada.
- `/codex compact` meminta app-server Codex melakukan compact pada thread yang terlampir.
- `/codex review` memulai review native Codex untuk thread yang terlampir.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread yang terlampir.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` memasang Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas rate.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

### Alur kerja debugging umum

Saat agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau channel lain, mulai dengan percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan tersebut membuat zip
   diagnostik Gateway lokal dan, karena sesi menggunakan harness Codex, juga
   mengirim bundel umpan balik Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau utas dukungan.
   Balasan itu mencakup jalur bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id utas Codex, dan baris `Inspect locally` untuk setiap utas Codex.
4. Jika Anda ingin men-debug eksekusi itu sendiri, jalankan perintah
   `Inspect locally` yang dicetak di terminal. Bentuknya seperti
   `codex resume <thread-id>` dan membuka utas Codex native agar Anda dapat
   memeriksa percakapan, melanjutkannya secara lokal, atau bertanya kepada Codex
   mengapa ia memilih tool atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan
unggahan umpan balik Codex untuk utas yang saat ini terlampir tanpa bundel
diagnostik OpenClaw Gateway lengkap. Untuk sebagian besar laporan dukungan,
`/diagnostics [note]` adalah titik awal yang lebih baik karena mengikat status
Gateway lokal dan id utas Codex bersama-sama dalam satu balasan. Lihat
[Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi lengkap dan
perilaku obrolan grup.

OpenClaw inti juga mengekspos `/diagnostics [note]` khusus pemilik sebagai
perintah diagnostik Gateway umum. Prompt persetujuannya menampilkan pembuka
data sensitif, menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan
meminta `openclaw gateway diagnostics export --json` melalui persetujuan exec
eksplisit setiap kali. Jangan setujui diagnostik dengan aturan izinkan-semua.
Setelah persetujuan, OpenClaw mengirim laporan yang dapat ditempel dengan jalur
bundel lokal dan ringkasan manifes. Ketika sesi OpenClaw aktif menggunakan
harness Codex, persetujuan yang sama juga mengizinkan pengiriman bundel umpan
balik Codex yang relevan ke server OpenAI. Prompt persetujuan mengatakan bahwa
umpan balik Codex akan dikirim, tetapi tidak mencantumkan id sesi atau utas
Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik di obrolan grup, OpenClaw menjaga
kanal bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara
pembuka diagnostik, prompt persetujuan, dan id sesi/utas Codex dikirim kepada
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` app-server Codex dan
meminta app-server menyertakan log untuk setiap utas yang tercantum dan subutas
Codex yang dibuat jika tersedia. Unggahan tersebut melalui jalur umpan balik
normal Codex ke server OpenAI; jika umpan balik Codex dinonaktifkan di app-server
tersebut, perintah mengembalikan kesalahan app-server. Balasan diagnostik yang
selesai mencantumkan kanal, id sesi OpenClaw, id utas Codex, dan perintah
`codex resume <thread-id>` lokal untuk utas yang dikirim. Jika Anda menolak atau
mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut. Unggahan ini
tidak menggantikan ekspor diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama yang digunakan harness
untuk giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan utas Codex
tersebut, meneruskan model OpenClaw yang saat ini dipilih ke app-server, dan
tetap mengaktifkan riwayat lanjutan.

### Periksa utas Codex dari CLI

Cara tercepat untuk memahami eksekusi Codex yang buruk sering kali adalah
membuka utas Codex native secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan kanal dan ingin memeriksa
sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada
Codex mengapa ia membuat pilihan tool atau penalaran tertentu. Jalur termudah
biasanya adalah menjalankan `/diagnostics [note]` terlebih dahulu: setelah Anda
menyetujuinya, laporan yang selesai mencantumkan setiap utas Codex dan mencetak
perintah `Inspect locally`, misalnya `codex resume <thread-id>`. Anda dapat
menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id utas dari `/codex binding` untuk obrolan saat ini
atau `/codex threads [filter]` untuk utas app-server Codex terbaru, lalu
menjalankan perintah `codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan app-server Codex `0.125.0` atau yang lebih baru.
Metode kontrol individual dilaporkan sebagai `unsupported by this Codex app-server`
jika app-server mendatang atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar tool dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan tool native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk
merutekan perilaku plugin OpenClaw. Untuk bridge tool native dan izin yang
didukung, OpenClaw menyuntikkan konfigurasi Codex per utas untuk `PreToolUse`,
`PostToolUse`, `PermissionRequest`, dan `Stop`. Hook Codex lain seperti
`SessionStart` dan `UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook
tersebut tidak diekspos sebagai hook plugin OpenClaw dalam kontrak v1.

Untuk tool dinamis OpenClaw, OpenClaw mengeksekusi tool setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku plugin dan middleware yang
dimilikinya di adaptor harness. Untuk tool native Codex, Codex memiliki catatan
tool kanonis. OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat
menulis ulang utas Codex native kecuali Codex mengekspos operasi tersebut melalui
app-server atau callback hook native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server
Codex dan status adaptor OpenClaw, bukan perintah hook native Codex.
Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adaptor, bukan tangkapan
byte-demi-byte dari permintaan internal atau payload compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajectory
dan debugging. Notifikasi tersebut tidak memanggil hook plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki
lebih banyak bagian dari loop model native, dan OpenClaw mengadaptasi permukaan
plugin dan sesinya di sekitar batas tersebut.

Didukung di runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | App-server Codex memiliki giliran OpenAI, pelanjutan utas native, dan kelanjutan tool native.                                                                                                        |
| Perutean dan pengiriman kanal OpenClaw        | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lain tetap berada di luar runtime model.                                                                                                     |
| Tool dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                      |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan utas.                                                                                 |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah giliran, dan koordinasi compaction mesin konteks berjalan untuk giliran Codex.                                                                           |
| Hook tool dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                    |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan payload mode Codex yang jujur.                                                                   |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native      | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                       |
| Blokir atau observasi shell, patch, dan MCP native | Didukung melalui relay hook native | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan tool native yang berkomitmen, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw saat runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex berlanjut melalui jalur guardian atau persetujuan pengguna normalnya. |
| Penangkapan trajectory app-server             | Didukung                                | OpenClaw merekam permintaan yang dikirim ke app-server dan notifikasi app-server yang diterimanya.                                                                                                  |

Tidak didukung di runtime Codex v1:

| Permukaan                                          | Batas V1                                                                                                                                        | Jalur masa depan                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                         | Hook pre-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat Codex-native.                                      | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                          |
| Riwayat transkrip Codex-native yang dapat diedit   | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cerminan dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread native diperlukan.         |
| `tool_result_persist` untuk rekaman alat Codex-native | Hook tersebut mentransformasi penulisan transkrip milik OpenClaw, bukan rekaman alat Codex-native.                                             | Dapat mencerminkan rekaman yang telah ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata compaction native yang kaya               | OpenClaw mengamati awal dan penyelesaian compaction, tetapi tidak menerima daftar kept/dropped yang stabil, delta token, atau payload ringkasan. | Memerlukan event compaction Codex yang lebih kaya.                                        |
| Intervensi compaction                              | Hook compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                               | Tambahkan hook pre/post compaction Codex jika plugins perlu memveto atau menulis ulang compaction native. |
| Penangkapan permintaan API model byte-demi-byte    | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI final secara internal.          | Memerlukan event tracing permintaan model Codex atau API debug.                           |

## Alat, media, dan compaction

Harness Codex hanya mengubah executor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat perpesanan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur alat dan izin Codex-native yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan berasumsi bahwa setiap event hook
Codex mendatang adalah permukaan plugin OpenClaw sampai kontrak runtime
menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan allow atau deny
eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukan allow. Codex
memperlakukannya sebagai tidak ada keputusan hook dan meneruskannya ke jalur
guardian atau persetujuan pengguna miliknya sendiri.

Elisitasi persetujuan alat Codex MCP dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt Codex `request_user_input` dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang diantrekan menjawab permintaan
server native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lainnya tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
diantrekan selama jendela senyap yang dikonfigurasi dan mengirimnya sebagai satu
permintaan `turn/steer` dalam urutan kedatangan. Mode legacy `queue` mengirim
permintaan `turn/steer` terpisah. Giliran review dan compaction manual Codex
dapat menolak pengarahan dalam giliran yang sama; dalam kasus itu OpenClaw
menggunakan antrean followup ketika mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke app-server Codex. OpenClaw menyimpan cerminan transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness di
masa depan. Cerminan mencakup prompt pengguna, teks asisten final, dan rekaman
penalaran atau rencana Codex ringan ketika app-server memancarkannya. Saat ini,
OpenClaw hanya merekam sinyal awal dan penyelesaian compaction native. OpenClaw
belum mengekspos ringkasan compaction yang dapat dibaca manusia atau daftar yang
dapat diaudit tentang entri mana yang disimpan Codex setelah compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang rekaman hasil alat Codex-native. Hook itu hanya berlaku ketika
OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu memang diharapkan
untuk konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref legacy `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI, bukan Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Setel
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian.
Runtime Codex yang dipaksa akan gagal alih-alih fallback ke PI. Setelah app-server
Codex dipilih, kegagalannya muncul secara langsung.

**App-server ditolak:** tingkatkan Codex agar handshake app-server
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis versi yang sama atau
versi bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak
karena floor protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa app-server jarak jauh menggunakan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref legacy
`codex/*`. Ref biasa `openai/gpt-*` dan provider lain tetap berada di jalur
provider normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`,
setiap giliran tertanam untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika terus terjadi, mulai ulang
gateway untuk membersihkan registrasi hook native yang usang. Jika `computer-use.list_apps`
timeout, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Provider model](/id/concepts/model-providers)
- [Provider OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook Plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
