---
read_when:
    - Anda ingin menggunakan harness app-server Codex yang disertakan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui kerangka app-server Codex bawaan
title: Kerangka kerja Codex
x-i18n:
    generated_at: "2026-04-30T10:00:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
app-server Codex, bukan harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: penemuan
model, melanjutkan thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, tools,
persetujuan, pengiriman media, dan mirror transkrip yang terlihat.

Jika Anda mencoba mencari orientasi, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Yang diubah Plugin ini

Plugin `codex` bawaan menyumbang beberapa kapabilitas terpisah:

| Kapabilitas                      | Cara menggunakannya                                | Yang dilakukannya                                                            |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime tertanam native          | `agentRuntime.id: "codex"`                         | Menjalankan giliran agen tertanam OpenClaw melalui app-server Codex.          |
| Perintah kontrol chat native     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread app-server Codex dari percakapan pesan.        |
| Penyedia/katalog app-server Codex | internal `codex`, ditampilkan melalui harness      | Memungkinkan runtime menemukan dan memvalidasi model app-server.              |
| Jalur pemahaman media Codex      | jalur kompatibilitas model gambar `codex/*`        | Menjalankan giliran app-server Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                | Hook Plugin di sekitar event native Codex          | Memungkinkan OpenClaw mengamati/memblokir event tool/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx jalur Codex default
- melakukan hot-switch sesi yang sudah merekam runtime PI
- menggantikan pengiriman channel OpenClaw, file sesi, penyimpanan profil auth, atau
  routing pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat native `/codex`. Jika
Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan, mengarahkan, menghentikan, atau memeriksa
thread Codex dari chat, agen sebaiknya memilih `/codex ...` dibanding ACP. ACP tetap
menjadi fallback eksplisit saat pengguna meminta ACP/acpx atau sedang menguji adapter ACP
Codex.

Giliran native Codex menjaga hook Plugin OpenClaw sebagai lapisan kompatibilitas publik.
Ini adalah hook OpenClaw dalam proses, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip mirror
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil tool yang netral runtime untuk menulis ulang
hasil tool dinamis OpenClaw setelah OpenClaw mengeksekusi tool dan sebelum
hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil tool transkrip milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku penjaga Plugin](/id/tools/plugin).

Harness nonaktif secara default. Config baru sebaiknya menjaga ref model OpenAI
kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat mereka
menginginkan eksekusi app-server native. Ref model legacy `codex/*` tetap otomatis memilih
harness untuk kompatibilitas, tetapi prefix penyedia legacy yang didukung runtime
tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` memberi peringatan alih-alih mengubah route. Itu
disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan PI Codex, dan
eksekusi app-server native tetap menjadi pilihan runtime eksplisit.

## Peta route

Gunakan tabel ini sebelum mengubah config:

| Perilaku yang diinginkan                  | Ref model                  | Config runtime                         | Persyaratan Plugin          | Label status yang diharapkan   |
| ----------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API OpenAI melalui runner OpenClaw normal | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`       | Penyedia OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/langganan Codex melalui PI          | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`       | Penyedia OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Giliran tertanam app-server native Codex  | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Penyedia campuran dengan mode auto konservatif | ref spesifik penyedia      | `agentRuntime.id: "auto"`              | Runtime Plugin opsional     | Bergantung pada runtime terpilih |
| Sesi adapter ACP Codex eksplisit          | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | backend `acpx` sehat        | Status tugas/sesi ACP          |

Pembagian pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "route penyedia/auth mana yang harus PI gunakan?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi
  giliran tertanam ini?"
- `/codex ...` menjawab "percakapan native Codex mana yang harus diikat
  atau dikontrol chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefix model yang tepat

Route keluarga OpenAI bersifat spesifik prefix. Gunakan `openai-codex/*` saat Anda ingin
OAuth Codex melalui PI; gunakan `openai/*` saat Anda ingin akses API OpenAI langsung atau
saat Anda memaksa harness app-server native Codex:

| Ref model                                     | Jalur runtime                                | Gunakan saat                                                               |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda ingin akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda ingin auth langganan ChatGPT/Codex dengan runner PI default.          |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                    | Anda ingin eksekusi app-server native Codex untuk giliran agen tertanam.   |

GPT-5.5 saat ini hanya langganan/OAuth di OpenClaw. Gunakan
`openai-codex/gpt-5.5` untuk OAuth PI, atau `openai/gpt-5.5` dengan harness
app-server Codex. Akses kunci API langsung untuk `openai/gpt-5.5` didukung
setelah OpenAI mengaktifkan GPT-5.5 di API publik.

Ref legacy `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas doctor menulis ulang ref runtime utama legacy menjadi ref model
kanonis dan mencatat kebijakan runtime secara terpisah, sedangkan ref legacy yang hanya fallback
dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh container agen.
Config OAuth PI Codex baru sebaiknya menggunakan `openai-codex/gpt-*`; config harness
app-server native baru sebaiknya menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pembagian prefix yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur penyedia OAuth
OpenAI Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran app-server Codex terbatas. Model app-server Codex harus
mengiklankan dukungan input gambar; model Codex khusus teks gagal sebelum giliran media
dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa catatan terstruktur `agent harness selected` milik gateway. Catatan itu
mencakup id harness terpilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan saat semua hal ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan" berarti
"runtime app-server native Codex." OpenClaw tidak melakukan lompatan itu. Peringatan
berarti:

- **Tidak perlu perubahan** jika Anda memang menginginkan OAuth ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan setel
  `agentRuntime.id: "codex"` jika Anda menginginkan eksekusi
  app-server native.
- Sesi yang ada tetap memerlukan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat melekat.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tertanam berjalan,
OpenClaw mencatat id harness terpilih pada sesi tersebut dan terus menggunakannya untuk
giliran berikutnya dalam id sesi yang sama. Ubah config `agentRuntime` atau
`OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan percakapan yang ada
antara PI dan Codex. Ini menghindari memutar ulang satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi legacy yang dibuat sebelum pin harness diperlakukan sebagai ter-pin PI setelah mereka
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memasukkan percakapan itu ke
Codex setelah mengubah config.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- App-server Codex `0.125.0` atau lebih baru. Plugin bawaan mengelola binary
  app-server Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server atau untuk bridge auth Codex
  OpenClaw.

Plugin memblokir handshake app-server yang lebih lama atau tidak berversi. Itu menjaga
OpenClaw pada permukaan protokol yang telah diuji.

Untuk pengujian smoke live dan Docker, auth biasanya berasal dari akun CLI Codex
atau profil auth `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga dapat
fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` saat tidak ada akun.

## Config minimal

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

Jika config Anda menggunakan `plugins.allow`, sertakan juga `codex` di sana:

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

Config legacy yang menyetel `agents.defaults.model` atau model agen menjadi
`codex/<model>` tetap otomatis mengaktifkan Plugin `codex` bawaan. Config baru sebaiknya
memilih `openai/<model>` plus entri eksplisit `agentRuntime` di atas.

## Tambahkan Codex bersama model lain

Jangan setel `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih
antara Codex dan model penyedia non-Codex. Runtime paksa berlaku untuk setiap
giliran tertanam untuk agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih diam-diam me-route giliran itu melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Letakkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan
  penyedia campuran normal.
- Gunakan ref `codex/*` lama hanya untuk kompatibilitas. Konfigurasi baru sebaiknya memilih
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
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran akan gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan niat, bukan hanya berdasarkan kata "Codex":

| Pengguna meminta...                                      | Agen sebaiknya menggunakan...                     |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                                 | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                  | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                                 | `/codex threads`                                 |
| "Ajukan laporan dukungan untuk proses Codex yang buruk"  | `/diagnostics [note]`                            |
| "Hanya kirim umpan balik Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                      |
| "Gunakan Codex sebagai runtime untuk agen ini"           | perubahan konfigurasi ke `agentRuntime.id`       |
| "Gunakan langganan ChatGPT/Codex saya dengan OpenClaw normal" | ref model `openai-codex/*`                       |
| "Jalankan Codex melalui ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam sebuah thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen saat ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan Skills plugin tidak boleh mengajarkan agen tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen tertanam
menggunakan Codex. Runtime Plugin eksplisit default tanpa fallback PI, jadi
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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai. Tetapkan
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda sengaja ingin PI menangani
pemilihan harness yang hilang.

## Codex per agen

Anda dapat membuat satu agen hanya-Codex sementara agen default tetap memakai
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
dan membiarkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia kepada app-server. Jika
penemuan gagal atau timeout, plugin menggunakan katalog fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyetel penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Secara default, plugin memulai binary Codex terkelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Binary terkelola dideklarasikan sebagai dependensi runtime plugin bawaan dan di-stage
bersama dependensi plugin `codex` lainnya. Ini menjaga versi app-server tetap terikat
ke plugin bawaan, bukan ke CLI Codex terpisah mana pun yang kebetulan terinstal lokal.
Tetapkan `appServer.command` hanya saat Anda sengaja ingin menjalankan executable berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan tool shell dan jaringan tanpa
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

Mode Guardian menggunakan jalur persetujuan auto-review native Codex. Saat Codex meminta untuk
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan persetujuan tersebut ke peninjau native, bukan prompt manusia.
Peninjau menerapkan kerangka risiko Codex dan menyetujui atau menolak permintaan spesifik tersebut.
Gunakan Guardian saat Anda menginginkan guardrail lebih banyak daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap mengesampingkan `mode`, sehingga deployment lanjutan dapat mencampur
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
tetapi OpenClaw memiliki bridge akun app-server Codex. Auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang sudah ada, seperti sign-in ChatGPT CLI Codex lokal.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang di-spawn. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran app-server Codex native secara tidak sengaja ditagih melalui API.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login app-server
alih-alih env proses anak yang diwarisi. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau akun milik
app-server remote.

Jika sebuah deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
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

| Bidang              | Default                                  | Arti                                                                                                                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                              |
| `command`           | biner Codex terkelola                    | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk penggantian eksplisit.         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                              |
| `url`               | tidak disetel                            | URL app-server WebSocket.                                                                                                                   |
| `authToken`         | tidak disetel                            | Token bearer untuk transport WebSocket.                                                                                                     |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                  |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan turunan. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan bidang kontrol app-server.                                                                                          |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                     |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan native Codex yang dikirim ke thread start/resume/turn.                                                                |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke thread start/resume.                                                                              |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap merupakan alias lama.                      |
| `serviceTier`       | tidak disetel                            | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                          |

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus menerima
respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons alat dinamis yang gagal ke Codex agar
turn dapat berlanjut alih-alih membiarkan sesi berada dalam `processing`.

Setelah OpenClaw merespons permintaan app-server berskala turn dari Codex, harness
juga mengharapkan Codex menyelesaikan turn native dengan `turn/completed`. Jika
app-server tidak merespons selama 60 detik setelah respons tersebut, OpenClaw
sebisa mungkin menginterupsi turn Codex, mencatat timeout diagnostik, dan
melepaskan lane sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang
turn native yang basi.

Penggantian lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola ketika
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin
dalam file yang sama-sama ditinjau seperti sisa penyiapan harness Codex.

## Penggunaan komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak menyertakan aplikasi kontrol desktop sebagai vendor atau menjalankan
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
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
server MCP Codex dapat mengontrol aplikasi. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, turn mode Codex gagal sebelum thread dimulai alih-alih
berjalan diam-diam tanpa alat Penggunaan Komputer native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Ketika `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop bawaan standar dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah konfigurasi runtime atau Penggunaan Komputer agar sesi yang ada tidak mempertahankan
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

Peralihan model tetap dikendalikan OpenClaw. Ketika sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, turn berikutnya mengirim model OpenAI,
provider, kebijakan persetujuan, sandbox, dan tingkat layanan yang sedang dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash resmi. Perintah ini
generik dan berfungsi pada channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas laju, server MCP, dan skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex memadatkan thread yang terlampir.
- `/codex review` memulai tinjauan native Codex untuk thread yang terlampir.
- `/codex diagnostics [note]` meminta izin sebelum mengirim umpan balik diagnostik Codex untuk thread yang terlampir.
- `/codex computer-use status` memeriksa plugin Penggunaan Komputer dan server MCP yang dikonfigurasi.
- `/codex computer-use install` menginstal plugin Penggunaan Komputer yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan skills app-server Codex.

### Alur kerja debugging umum

Ketika agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau channel lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan tersebut membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga mengirim bundle umpan balik Codex
   yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan tersebut menyertakan path bundle lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   thread Codex native sehingga Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan upload
umpan balik Codex untuk thread yang saat ini terlampir tanpa bundle diagnostik
Gateway OpenClaw lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena mengikat status Gateway lokal dan id thread Codex
bersama-sama dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku chat grup.

Core OpenClaw juga mengekspos `/diagnostics [note]` khusus owner sebagai perintah diagnostik
Gateway umum. Prompt persetujuannya menampilkan pembuka data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan exec eksplisit
setiap kali. Jangan setujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan,
OpenClaw mengirim laporan yang dapat ditempel dengan path bundle lokal dan ringkasan
manifes. Ketika sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang
sama juga mengotorisasi pengiriman bundle umpan balik Codex yang relevan ke
server OpenAI. Prompt persetujuan menyatakan bahwa umpan balik Codex akan dikirim, tetapi
tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh owner dalam chat grup, OpenClaw menjaga
channel bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sedangkan
pembuka diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke
owner melalui rute persetujuan pribadi. Jika tidak ada rute owner pribadi,
OpenClaw menolak permintaan grup dan meminta owner menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` app-server Codex dan meminta
app-server menyertakan log untuk setiap thread yang tercantum dan subthread Codex
yang dibuat saat tersedia. Unggahan berjalan melalui jalur umpan balik normal
Codex ke server OpenAI; jika umpan balik Codex dinonaktifkan di app-server itu,
perintah mengembalikan kesalahan app-server. Balasan diagnostik yang selesai
mencantumkan channel, id sesi OpenClaw, id thread Codex, dan perintah lokal
`codex resume <thread-id>` untuk thread yang dikirim. Jika Anda menolak atau
mengabaikan persetujuan, OpenClaw tidak mencetak id Codex tersebut. Unggahan ini
tidak menggantikan ekspor diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama dengan yang digunakan
harness untuk giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread
Codex tersebut, meneruskan model OpenClaw yang saat ini dipilih ke app-server,
dan menjaga riwayat panjang tetap aktif.

### Memeriksa thread Codex dari CLI

Cara tercepat untuk memahami proses Codex yang buruk sering kali adalah membuka
thread Codex native secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini saat Anda menemukan bug dalam percakapan channel dan ingin memeriksa
sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada
Codex mengapa ia membuat pilihan alat atau penalaran tertentu. Jalur termudah
biasanya menjalankan `/diagnostics [note]` terlebih dahulu: setelah Anda
menyetujuinya, laporan yang selesai mencantumkan setiap thread Codex dan mencetak
perintah `Inspect locally`, misalnya `codex resume <thread-id>`. Anda dapat
menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk chat saat ini
atau `/codex threads [filter]` untuk thread app-server Codex terbaru, lalu
menjalankan perintah `codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan app-server Codex `0.125.0` atau yang lebih baru.
Metode kontrol individual dilaporkan sebagai `unsupported by this Codex app-server`
jika app-server mendatang atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin lintas harness PI dan Codex.           |
| Middleware ekstensi app-server Codex  | Plugin bawaan OpenClaw   | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk
merutekan perilaku Plugin OpenClaw. Untuk jembatan alat native dan izin yang
didukung, OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`,
`PostToolUse`, `PermissionRequest`, dan `Stop`. Hook Codex lain seperti
`SessionStart` dan `UserPromptSubmit` tetap merupakan kontrol tingkat Codex;
keduanya tidak diekspos sebagai hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw menjalankan alat setelah Codex meminta
panggilan tersebut, sehingga OpenClaw memicu perilaku Plugin dan middleware yang
dimilikinya di adaptor harness. Untuk alat native Codex, Codex memiliki catatan
alat kanonis. OpenClaw dapat mencerminkan event tertentu, tetapi tidak dapat
menulis ulang thread Codex native kecuali Codex mengekspos operasi tersebut
melalui app-server atau callback hook native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi app-server
Codex dan status adaptor OpenClaw, bukan perintah hook native Codex. Event
`before_compaction`, `after_compaction`, `llm_input`, dan `llm_output` milik
OpenClaw adalah observasi tingkat adaptor, bukan tangkapan byte demi byte dari
permintaan internal Codex atau payload Compaction.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai event agen `codex_app_server.hook` untuk trajektori dan
debugging. Keduanya tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki
lebih banyak bagian dari loop model native, dan OpenClaw menyesuaikan permukaan
Plugin dan sesinya di sekitar batas tersebut.

Didukung di runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | App-server Codex memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan alat native.                                                                                                       |
| Perutean dan pengiriman channel OpenClaw      | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lain tetap berada di luar runtime model.                                                                                                    |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw menjalankan alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                        |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                            |
| Hook alat dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                     |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                      |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native      | `Stop` Codex diteruskan ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                     |
| Blokir atau observasi shell, patch, dan MCP native | Didukung melalui relay hook native | `PreToolUse` dan `PostToolUse` Codex diteruskan untuk permukaan alat native yang sudah dikomit, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw saat runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui guardian normalnya atau jalur persetujuan pengguna. |
| Tangkapan trajektori app-server               | Didukung                                | OpenClaw merekam permintaan yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                |

Tidak didukung di runtime Codex v1:

| Permukaan                                           | Batas V1                                                                                                                                       | Jalur mendatang                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                     | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                         |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika operasi thread native diperlukan.           |
| `tool_result_persist` untuk catatan alat native Codex | Hook tersebut mentransformasi penulisan transkrip milik OpenClaw, bukan catatan alat native Codex.                                            | Dapat mencerminkan catatan yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya                | OpenClaw mengamati awal dan penyelesaian Compaction, tetapi tidak menerima daftar tersimpan/dibuang yang stabil, delta token, atau payload ringkasan. | Memerlukan event Compaction Codex yang lebih kaya.                                        |
| Intervensi Compaction                               | Hook Compaction OpenClaw saat ini berada di tingkat notifikasi dalam mode Codex.                                                               | Tambahkan hook Compaction pra/pasca Codex jika Plugin perlu memveto atau menulis ulang Compaction native. |
| Tangkapan permintaan API model byte demi byte        | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI akhir secara internal.        | Memerlukan event pelacakan permintaan model Codex atau API debug.                        |

## Alat, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat pesan
tetap berjalan melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1 terbatas
pada jalur alat native Codex dan izin yang diuji OpenClaw. Dalam runtime Codex,
itu mencakup payload shell, patch, dan MCP `PreToolUse`, `PostToolUse`, dan
`PermissionRequest`. Jangan berasumsi bahwa setiap event hook Codex di masa depan
adalah permukaan Plugin OpenClaw sampai kontrak runtime menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak yang eksplisit saat kebijakan memutuskan. Hasil tanpa keputusan bukan
izin. Codex memperlakukannya sebagai tidak ada keputusan hook dan jatuh ke
guardian miliknya sendiri atau jalur persetujuan pengguna.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan Plugin
OpenClaw saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat asal,
dan pesan tindak lanjut antrean berikutnya menjawab permintaan server native itu
alih-alih diarahkan sebagai konteks tambahan. Permintaan elisitasi MCP lainnya
tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke Codex app-server `turn/steer`. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan obrolan
yang masuk antrean selama quiet window yang dikonfigurasi dan mengirimkannya
sebagai satu permintaan `turn/steer` dalam urutan kedatangan. Mode `queue`
legacy mengirim permintaan `turn/steer` terpisah. Turn peninjauan Codex dan
Compaction manual dapat menolak pengarahan same-turn, dalam kasus ini
OpenClaw menggunakan antrean followup jika mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke Codex app-server. OpenClaw mempertahankan cermin transkrip untuk riwayat
channel, pencarian, `/new`, `/reset`, serta peralihan model atau harness di masa depan. Cermin
tersebut mencakup prompt pengguna, teks akhir asisten, dan catatan penalaran atau rencana Codex
yang ringan ketika app-server memancarkannya. Saat ini, OpenClaw hanya
mencatat sinyal mulai dan selesai Compaction native. OpenClaw belum mengekspos
ringkasan Compaction yang dapat dibaca manusia atau daftar teraudit tentang entri mana yang
dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang catatan hasil tool native Codex. Ini hanya berlaku ketika
OpenClaw menulis hasil tool transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Pemahaman gambar, video, musik, PDF, TTS, dan media
tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu sesuai ekspektasi untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref `codex/*` legacy), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI, bukan Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime
Codex yang dipaksa sekarang gagal alih-alih fallback ke PI kecuali Anda
secara eksplisit mengatur `agentRuntime.fallback: "pi"`. Setelah Codex app-server
dipilih, kegagalannya muncul langsung tanpa konfigurasi fallback tambahan.

**App-server ditolak:** tingkatkan Codex agar handshake app-server
melaporkan versi `0.125.0` atau lebih baru. Prarilis versi yang sama atau versi bersufiks build
seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
floor protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server jarak jauh berbicara dengan versi protokol Codex app-server yang sama.

**Model non-Codex menggunakan PI:** itu sesuai ekspektasi kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agent tersebut atau memilih ref
`codex/*` legacy. Ref biasa `openai/gpt-*` dan provider lain tetap berada di jalur
provider normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap turn
tertanam untuk agent tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terinstal tetapi tool tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah tool melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan pendaftaran native hook yang usang. Jika `computer-use.list_apps`
mengalami timeout, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agent](/id/plugins/sdk-agent-harness)
- [Runtime agent](/id/concepts/agent-runtimes)
- [Provider model](/id/concepts/model-providers)
- [Provider OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
