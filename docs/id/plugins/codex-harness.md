---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan yang hanya menggunakan Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-05-01T09:26:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
Codex app-server, bukan harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: penemuan
model, resume thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki saluran chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Jika Anda sedang mencoba memahami arahnya, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau saluran lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Untuk menggunakan harness Codex untuk giliran agen GPT, pertahankan ref model kanonis sebagai
`openai/gpt-*`, aktifkan Plugin `codex` bawaan, dan atur
`agentRuntime.id: "codex"`:

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

Jangan gunakan `openai-codex/gpt-*` untuk jalur ini. Itu memilih OAuth Codex melalui
runner PI normal kecuali Anda memaksa runtime secara terpisah. Perubahan konfigurasi berlaku
untuk sesi baru atau yang direset; sesi yang ada tetap mempertahankan runtime yang tercatat.

## Yang diubah oleh Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                       | Cara menggunakannya                                  | Yang dilakukan                                                               |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui Codex app-server.          |
| Perintah kontrol chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread Codex app-server dari percakapan perpesanan.   |
| Penyedia/katalog Codex app-server | internal `codex`, diekspos melalui harness          | Memungkinkan runtime menemukan dan memvalidasi model app-server.              |
| Jalur pemahaman media Codex       | jalur kompatibilitas model-gambar `codex/*`         | Menjalankan giliran Codex app-server terbatas untuk model pemahaman gambar yang didukung. |
| Relai hook native                 | Hook Plugin di sekitar peristiwa native Codex       | Memungkinkan OpenClaw mengamati/memblokir peristiwa alat/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx sebagai jalur Codex default
- mengganti sesi yang sudah ada secara panas jika sudah mencatat runtime PI
- menggantikan pengiriman saluran OpenClaw, file sesi, penyimpanan profil auth, atau
  routing pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat native `/codex`. Jika
Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan, mengarahkan, menghentikan, atau memeriksa
thread Codex dari chat, agen sebaiknya memilih `/codex ...` daripada ACP. ACP tetap
menjadi fallback eksplisit saat pengguna meminta ACP/acpx atau sedang menguji adapter ACP
Codex.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan kompatibilitas publik.
Ini adalah hook OpenClaw dalam proses, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip yang dicerminkan
- `before_agent_finalize` melalui relai `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral runtime untuk menulis ulang
hasil alat dinamis OpenClaw setelah OpenClaw mengeksekusi alat dan sebelum
hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip
milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru harus mempertahankan ref model OpenAI
kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat mereka
menginginkan eksekusi app-server native. Ref model lama `codex/*` masih otomatis memilih
harness demi kompatibilitas, tetapi prefiks penyedia lama yang didukung runtime
tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` memberi peringatan alih-alih mengubah rute. Itu
disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan Codex PI, dan
eksekusi app-server native tetap menjadi pilihan runtime eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                   | Ref model                 | Konfigurasi runtime                    | Persyaratan Plugin         | Label status yang diharapkan   |
| ------------------------------------------ | ------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| API OpenAI melalui runner OpenClaw normal  | `openai/gpt-*`            | dihilangkan atau `runtime: "pi"`       | Penyedia OpenAI            | `Runtime: OpenClaw Pi Default` |
| OAuth/langganan Codex melalui PI           | `openai-codex/gpt-*`      | dihilangkan atau `runtime: "pi"`       | Penyedia OAuth Codex OpenAI | `Runtime: OpenClaw Pi Default` |
| Giliran tertanam Codex app-server native   | `openai/gpt-*`            | `agentRuntime.id: "codex"`             | Plugin `codex`             | `Runtime: OpenAI Codex`        |
| Penyedia campuran dengan mode otomatis konservatif | ref khusus penyedia       | `agentRuntime.id: "auto"`              | Runtime Plugin opsional    | Bergantung pada runtime yang dipilih |
| Sesi adapter ACP Codex eksplisit           | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | backend `acpx` sehat       | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/auth mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi giliran
  tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol oleh chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI spesifik terhadap prefiks. Gunakan `openai-codex/*` saat Anda ingin
OAuth Codex melalui PI; gunakan `openai/*` saat Anda ingin akses API OpenAI langsung atau
saat Anda memaksa harness Codex app-server native:

| Ref model                                     | Jalur runtime                                | Gunakan saat                                                               |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth Codex OpenAI melalui OpenClaw/PI       | Anda menginginkan auth langganan ChatGPT/Codex dengan runner PI default.   |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                     | Anda menginginkan eksekusi Codex app-server native untuk giliran agen tertanam. |

GPT-5.5 saat ini hanya tersedia melalui langganan/OAuth di OpenClaw. Gunakan
`openai-codex/gpt-5.5` untuk OAuth PI, atau `openai/gpt-5.5` dengan harness
Codex app-server. Akses kunci API langsung untuk `openai/gpt-5.5` didukung
setelah OpenAI mengaktifkan GPT-5.5 di API publik.

Ref lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas Doctor menulis ulang ref runtime utama lama menjadi ref model kanonis
dan mencatat kebijakan runtime secara terpisah, sementara ref lama khusus fallback
dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh kontainer agen.
Konfigurasi OAuth Codex PI baru harus menggunakan `openai-codex/gpt-*`; konfigurasi
harness app-server native baru harus menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur penyedia OAuth Codex
OpenAI. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran Codex app-server terbatas. Model Codex app-server harus
mengiklankan dukungan input gambar; model Codex khusus teks gagal sebelum giliran media
dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa catatan terstruktur `agent harness selected` milik gateway. Catatan itu
mencakup id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan saat semua ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen itu bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan" berarti
"runtime Codex app-server native." OpenClaw tidak membuat lompatan itu. Peringatan
berarti:

- **Tidak ada perubahan yang diperlukan** jika Anda memang bermaksud menggunakan OAuth ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda bermaksud menggunakan eksekusi
  app-server native.
- Sesi yang ada masih memerlukan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat lengket.

Pemilihan harness bukan kontrol sesi live. Saat giliran tertanam berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi itu dan terus menggunakannya untuk
giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi `agentRuntime` atau
`OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan percakapan
yang ada antara PI dan Codex. Ini menghindari memutar ulang satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai terpin ke PI setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memasukkan percakapan itu ke
Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness Codex app-server muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- Codex app-server `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server atau untuk jembatan auth Codex
  OpenClaw. Peluncuran app-server stdio lokal menggunakan home Codex yang dikelola OpenClaw untuk setiap
  agen dan `HOME` anak yang terisolasi, sehingga secara default tidak membaca akun
  `~/.codex`, skills, plugin, konfigurasi, status thread, atau
  `$HOME/.agents/skills` native pribadi Anda.

Plugin memblokir handshake app-server yang lebih lama atau tidak berversi. Itu menjaga
OpenClaw pada permukaan protokol yang telah diuji.

Untuk pengujian smoke live dan Docker, auth biasanya berasal dari akun CLI Codex
atau profil auth `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga dapat
fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` saat tidak ada akun.

## Tambahkan Codex berdampingan dengan model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih
antara Codex dan model penyedia non-Codex. Runtime yang dipaksa berlaku untuk setiap
giliran tertanam bagi agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Letakkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan
  penyedia campuran normal.
- Gunakan referensi lama `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya memilih
  `openai/*` ditambah kebijakan runtime Codex yang eksplisit.

Contohnya, ini mempertahankan agen default pada pemilihan otomatis normal dan
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
- Jika Codex tidak ada atau tidak didukung untuk agen `codex`, giliran gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan maksud, bukan hanya berdasarkan kata "Codex":

| Pengguna meminta...                                      | Agen harus menggunakan...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Ikat obrolan ini ke Codex"                              | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                  | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                                 | `/codex threads`                                 |
| "Ajukan laporan dukungan untuk proses Codex yang buruk"  | `/diagnostics [note]`                            |
| "Hanya kirim umpan balik Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                    |
| "Gunakan Codex sebagai runtime untuk agen ini"           | perubahan konfigurasi ke `agentRuntime.id`       |
| "Gunakan langganan ChatGPT/Codex saya dengan OpenClaw normal" | referensi model `openai-codex/*`             |
| "Jalankan Codex melalui ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam sebuah thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen saat ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
system prompt dan Skills Plugin tidak boleh mengajarkan agen tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen tertanam
menggunakan Codex. Runtime Plugin eksplisit secara default tidak memiliki fallback PI, jadi
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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai. Tetapkan
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda memang ingin PI menangani
pemilihan harness yang hilang.

## Codex per agen

Anda dapat membuat satu agen hanya-Codex sementara agen default tetap mempertahankan
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
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan memungkinkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, Plugin Codex meminta app-server untuk model yang tersedia. Jika
penemuan gagal atau waktu habis, Plugin menggunakan katalog fallback bawaan untuk:

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

Secara default, Plugin memulai binary Codex terkelola milik OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Binary terkelola dideklarasikan sebagai dependensi runtime Plugin bawaan dan di-stage
bersama dependensi Plugin `codex` lainnya. Ini menjaga versi app-server
terikat ke Plugin bawaan, bukan ke CLI Codex terpisah mana pun yang kebetulan
terinstal secara lokal. Tetapkan `appServer.command` hanya saat Anda
memang ingin menjalankan executable yang berbeda.

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

Mode Guardian menggunakan jalur persetujuan tinjauan otomatis native Codex. Saat Codex meminta untuk
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses
jaringan, Codex merutekan permintaan persetujuan itu ke peninjau native alih-alih
prompt manusia. Peninjau menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian saat Anda menginginkan lebih banyak guardrail daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk membuat progres.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan dapat mencampur
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

Peluncuran app-server stdio secara default mewarisi lingkungan proses OpenClaw,
tetapi OpenClaw memiliki bridge akun app-server Codex dan menetapkan baik
`CODEX_HOME` maupun `HOME` ke direktori per-agen di bawah state OpenClaw agen tersebut.
Loader Skills milik Codex sendiri membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran app-server
lokal. Itu menjaga Skills native Codex, Plugin, konfigurasi, akun, dan state thread
tetap tercakup pada agen OpenClaw alih-alih bocor dari home CLI Codex pribadi
operator.

Plugin OpenClaw dan snapshot Skills OpenClaw tetap mengalir melalui registry Plugin dan loader Skills
milik OpenClaw sendiri. Aset CLI Codex pribadi tidak. Jika Anda memiliki
Skills atau Plugin CLI Codex yang berguna dan seharusnya menjadi bagian dari agen OpenClaw,
inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin Skills ke workspace agen OpenClaw saat ini.
Plugin native Codex, hook, dan file konfigurasi dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan otomatis, karena semua itu dapat
menjalankan perintah, mengekspos server MCP, atau membawa kredensial.

Auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang di-spawn. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran app-server Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan login app-server
alih-alih env proses anak yang diwariskan. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau
akun milik app-server jarak jauh sendiri.

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

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex yang di-spawn.

Field `appServer` yang didukung:

| Bidang              | Default                                  | Arti                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                       |
| `command`           | biner Codex terkelola                    | Berkas eksekusi untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk penggantian eksplisit.                                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                       |
| `url`               | tidak disetel                            | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | tidak disetel                            | Token bearer untuk transport WebSocket.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan turunannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke thread start/resume/turn.                                                                                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke thread start/resume.                                                                                                                                                                       |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias legacy.                                                                                                               |
| `serviceTier`       | tidak disetel                            | Tier layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy yang tidak valid diabaikan.                                                                                                                    |

Panggilan tool dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus
menerima respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan
sinyal tool jika didukung dan mengembalikan respons dynamic-tool yang gagal ke
Codex sehingga turn dapat berlanjut alih-alih membiarkan sesi tetap dalam
`processing`.

Setelah OpenClaw merespons permintaan app-server bercakupan turn dari Codex,
harness juga mengharapkan Codex menyelesaikan turn native dengan
`turn/completed`. Jika app-server tidak merespons selama 60 detik setelah
respons tersebut, OpenClaw secara best-effort menginterupsi turn Codex, mencatat
timeout diagnostik, dan melepaskan lane sesi OpenClaw sehingga pesan chat
lanjutan tidak mengantre di belakang turn native yang stale.

Penggantian lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai.
Konfigurasi lebih disarankan untuk deployment yang dapat diulang karena menjaga
perilaku plugin dalam file yang ditinjau yang sama dengan sisa penyiapan harness
Codex.

## Penggunaan komputer

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau
menjalankan aksi desktop sendiri. OpenClaw menyiapkan app-server Codex,
memverifikasi bahwa server MCP `computer-use` tersedia, lalu membiarkan Codex
menangani panggilan tool MCP native selama turn mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Codex Computer Use](/id/plugins/codex-computer-use) untuk perbedaan antara
Computer Use yang dimiliki Codex dan pendaftaran MCP langsung.

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

Computer Use khusus macOS dan mungkin memerlukan izin OS lokal sebelum server
MCP Codex dapat mengontrol aplikasi. Jika `computerUse.enabled` bernilai true
dan server MCP tidak tersedia, turn mode Codex gagal sebelum thread dimulai
alih-alih berjalan diam-diam tanpa tool Computer Use native. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan
marketplace Codex Desktop bundled standar dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah konfigurasi runtime atau Computer Use agar sesi yang ada tidak
mempertahankan pengikatan PI atau thread Codex lama.

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

Pergantian model tetap dikendalikan OpenClaw. Saat sesi OpenClaw dilampirkan ke
thread Codex yang ada, turn berikutnya mengirim model OpenAI, provider,
kebijakan persetujuan, sandbox, dan tier layanan yang saat ini dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2`
mempertahankan pengikatan thread tetapi meminta Codex melanjutkan dengan model
yang baru dipilih.

## Perintah Codex

Plugin bundled mendaftarkan `/codex` sebagai perintah slash yang diotorisasi.
Perintah ini generik dan bekerja pada channel apa pun yang mendukung perintah
teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server live, model, akun, batas rate, server MCP, dan skills.
- `/codex models` mencantumkan model app-server Codex live.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang ada.
- `/codex compact` meminta app-server Codex melakukan compact pada thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim feedback diagnostik Codex untuk thread yang dilampirkan.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` menginstal Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas rate.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan skills app-server Codex.

### Alur kerja debugging umum

Saat agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram,
Discord, Slack, atau channel lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan tersebut membuat zip
   diagnostik Gateway lokal dan, karena sesi menggunakan harness Codex, juga
   mengirim bundle feedback Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan itu mencakup path bundle lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run itu sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan
   membuka thread Codex native sehingga Anda dapat memeriksa percakapan,
   melanjutkannya secara lokal, atau bertanya kepada Codex mengapa memilih tool
   atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik Gateway OpenClaw lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah titik awal yang lebih baik karena mengaitkan status Gateway lokal dan id thread Codex dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi lengkap dan perilaku obrolan grup.

Inti OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah diagnostik Gateway umum. Prompt persetujuannya menampilkan pembukaan data sensitif, menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta `openclaw gateway diagnostics export --json` melalui persetujuan exec eksplisit setiap kali. Jangan setujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan, OpenClaw mengirim laporan yang dapat ditempel dengan jalur bundel lokal dan ringkasan manifes. Ketika sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang sama juga mengizinkan pengiriman bundel umpan balik Codex yang relevan ke server OpenAI. Prompt persetujuan menyatakan bahwa umpan balik Codex akan dikirim, tetapi tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam obrolan grup, OpenClaw menjaga kanal bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara pembukaan diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim kepada pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat, OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil Codex app-server `feedback/upload` dan meminta app-server menyertakan log untuk setiap thread yang tercantum dan subthread Codex yang dibuat jika tersedia. Unggahan berjalan melalui jalur umpan balik normal Codex ke server OpenAI; jika umpan balik Codex dinonaktifkan di app-server tersebut, perintah mengembalikan galat app-server. Balasan diagnostik yang selesai mencantumkan kanal, id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>` untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama seperti yang digunakan harness untuk giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan model OpenClaw yang saat ini dipilih ke app-server, dan menjaga riwayat diperluas tetap aktif.

### Periksa thread Codex dari CLI

Cara tercepat untuk memahami eksekusi Codex yang buruk sering kali adalah membuka thread Codex asli secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan kanal dan ingin memeriksa sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia membuat pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan `/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai mencantumkan setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya `codex resume <thread-id>`. Anda dapat menyalin perintah tersebut langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk obrolan saat ini atau `/codex threads [filter]` untuk thread Codex app-server terbaru, lalu menjalankan perintah `codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan Codex app-server `0.125.0` atau lebih baru. Metode kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi Codex app-server  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk merutekan perilaku Plugin OpenClaw. Untuk bridge alat native dan izin yang didukung, OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`, `PostToolUse`, `PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan `UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook tersebut tidak diekspos sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta panggilan, sehingga OpenClaw memicu perilaku Plugin dan middleware yang dimilikinya dalam adaptor harness. Untuk alat native Codex, Codex memiliki rekaman alat kanonis. OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread native Codex kecuali Codex mengekspos operasi tersebut melalui app-server atau callback hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi Codex app-server dan status adaptor OpenClaw, bukan perintah hook native Codex. Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan `llm_output` OpenClaw adalah observasi tingkat adaptor, bukan tangkapan byte-demi-byte dari permintaan internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging. Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak loop model native, dan OpenClaw mengadaptasi permukaan Plugin serta sesi di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | Codex app-server memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan alat native.                                                                                                      |
| Perutean dan pengiriman kanal OpenClaw        | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan kanal lain tetap berada di luar runtime model.                                                                                                     |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                      |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                               |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                           |
| Hook alat dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                    |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                     |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native      | Codex `Stop` direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                       |
| Blokir atau observasi shell, patch, dan MCP native | Didukung melalui relay hook native | Codex `PreToolUse` dan `PostToolUse` direlay untuk permukaan alat native yang telah dikomit, termasuk payload MCP pada Codex app-server `0.125.0` atau lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | Codex `PermissionRequest` dapat dirutekan melalui kebijakan OpenClaw saat runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui jalur guardian normal atau persetujuan pengguna. |
| Penangkapan trajektori app-server             | Didukung                                | OpenClaw merekam permintaan yang dikirimkannya ke app-server dan notifikasi app-server yang diterimanya.                                                                                             |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batas V1                                                                                                                                        | Jalur masa depan                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                                         |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API server aplikasi Codex eksplisit jika operasi thread native diperlukan.                     |
| `tool_result_persist` untuk rekaman alat native Codex | Hook tersebut mengubah penulisan transkrip milik OpenClaw, bukan rekaman alat native Codex.                                                     | Dapat mencerminkan rekaman yang diubah, tetapi penulisan ulang kanonis memerlukan dukungan Codex.         |
| Metadata compaction native yang kaya                | OpenClaw mengamati awal dan penyelesaian compaction, tetapi tidak menerima daftar disimpan/dibuang yang stabil, delta token, atau payload ringkasan. | Memerlukan event compaction Codex yang lebih kaya.                                                       |
| Intervensi compaction                               | Hook compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                              | Tambahkan hook pra/pasca compaction Codex jika Plugin perlu memveto atau menulis ulang compaction native. |
| Penangkapan permintaan API model byte demi byte      | OpenClaw dapat menangkap permintaan dan notifikasi server aplikasi, tetapi inti Codex membangun permintaan API OpenAI final secara internal.     | Memerlukan event pelacakan permintaan model Codex atau API debug.                                        |

## Alat, media, dan compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat pesan
tetap melewati jalur pengiriman normal OpenClaw.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur alat dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan berasumsi setiap event hook
Codex di masa depan adalah permukaan Plugin OpenClaw sampai kontrak runtime
menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan allow atau deny
eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukan allow. Codex
memperlakukannya sebagai tidak ada keputusan hook dan meneruskannya ke jalur
guardian atau persetujuan pengguna miliknya sendiri.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan Plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt Codex `request_user_input` dikirim kembali ke chat
asal, dan pesan tindak lanjut antrean berikutnya menjawab permintaan server
native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan elisitasi
MCP lainnya tetap gagal tertutup.

Pengarahan antrean run aktif dipetakan ke `turn/steer` server aplikasi Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
diantrekan untuk jendela senyap yang dikonfigurasi dan mengirimkannya sebagai satu
permintaan `turn/steer` dalam urutan kedatangan. Mode lama `queue` mengirim
permintaan `turn/steer` terpisah. Giliran review dan compaction manual Codex dapat
menolak pengarahan giliran yang sama, dalam hal itu OpenClaw menggunakan antrean
followup ketika mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke server aplikasi Codex. OpenClaw menyimpan cermin transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan perpindahan model atau harness
di masa depan. Cermin tersebut mencakup prompt pengguna, teks asisten final, dan
rekaman penalaran atau rencana Codex yang ringan ketika server aplikasi
memancarkannya. Saat ini, OpenClaw hanya merekam sinyal awal dan penyelesaian
compaction native. OpenClaw belum mengekspos ringkasan compaction yang dapat
dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang disimpan
Codex setelah compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang rekaman hasil alat native Codex. Ini hanya berlaku ketika OpenClaw
menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan penyedia/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** itu diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref lama `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Setel
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime
Codex yang dipaksa kini gagal alih-alih fallback ke PI kecuali Anda
secara eksplisit menyetel `agentRuntime.fallback: "pi"`. Setelah server aplikasi Codex
dipilih, kegagalannya muncul langsung tanpa konfigurasi fallback tambahan.

**Server aplikasi ditolak:** tingkatkan Codex agar handshake server aplikasi
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis versi yang sama atau
versi berakhiran build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
batas bawah protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa server aplikasi jarak jauh berbicara versi protokol server aplikasi Codex yang sama.

**Model non-Codex menggunakan PI:** itu diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref lama
`codex/*`. Ref `openai/gpt-*` biasa dan ref penyedia lain tetap berada pada jalur
penyedia normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap
giliran tertanam untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan registrasi hook native yang kedaluwarsa. Jika `computer-use.list_apps`
habis waktu, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook Plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
