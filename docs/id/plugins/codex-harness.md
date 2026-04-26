---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh config harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih fallback ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-26T11:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen level rendah: discovery
model, resume thread native, Compaction native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, tools,
approvals, pengiriman media, dan mirror transkrip yang terlihat.

Jika Anda sedang mencoba memahami arahnya, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi surface komunikasi.

## Apa yang diubah oleh Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                      | Cara menggunakannya                              | Fungsinya                                                                    |
| -------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Runtime tertanam native          | `agentRuntime.id: "codex"`                       | Menjalankan giliran agen tertanam OpenClaw melalui app-server Codex.         |
| Perintah kontrol chat native     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengendalikan thread app-server Codex dari percakapan pesan. |
| Provider/katalog app-server Codex | internal `codex`, ditampilkan melalui harness   | Memungkinkan runtime menemukan dan memvalidasi model app-server.             |
| Jalur pemahaman media Codex      | jalur kompatibilitas image-model `codex/*`       | Menjalankan giliran app-server Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                | Hook Plugin di sekitar peristiwa native Codex    | Memungkinkan OpenClaw mengamati/memblokir peristiwa tool/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengubah ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx jalur Codex default
- mengubah sesi yang sudah ada secara hot-switch jika sudah merekam runtime PI
- menggantikan pengiriman channel OpenClaw, file sesi, penyimpanan profil auth, atau
  routing pesan

Plugin yang sama juga memiliki surface perintah kontrol chat `/codex` native. Jika
Plugin diaktifkan dan pengguna meminta bind, resume, steer, stop, atau inspect
thread Codex dari chat, agen sebaiknya mengutamakan `/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit ketika pengguna meminta ACP/acpx atau sedang menguji adapter ACP
Codex.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan kompatibilitas publik.
Ini adalah hook OpenClaw in-process, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk rekaman transkrip mirror
- `before_agent_finalize` melalui relay Codex `Stop`
- `agent_end`

Plugins juga dapat mendaftarkan middleware hasil-tool yang netral terhadap runtime untuk menulis ulang hasil tool dinamis OpenClaw setelah OpenClaw mengeksekusi tool dan sebelum hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasikan penulisan hasil-tool transkrip
milik OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Plugin hooks](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness ini nonaktif secara default. Config baru sebaiknya mempertahankan ref model OpenAI
kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat mereka
menginginkan eksekusi app-server native. Ref model lama `codex/*` tetap memilih
harness secara otomatis demi kompatibilitas, tetapi prefix provider lama yang didukung runtime tidak ditampilkan sebagai pilihan model/provider normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` akan memberi peringatan alih-alih mengubah rutenya. Itu
disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan PI Codex, dan
eksekusi app-server native tetap merupakan pilihan runtime yang eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah config:

| Perilaku yang diinginkan                    | Ref model                  | Config runtime                         | Kebutuhan Plugin           | Label status yang diharapkan   |
| ------------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| OpenAI API melalui runner OpenClaw normal   | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`       | provider OpenAI            | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/langganan melalui PI            | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`       | provider OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Giliran tertanam app-server Codex native    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`             | `Runtime: OpenAI Codex`        |
| Provider campuran dengan mode auto konservatif | ref khusus provider     | `agentRuntime.id: "auto"`              | Plugin runtime opsional    | Bergantung pada runtime terpilih |
| Sesi adapter ACP Codex eksplisit            | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | backend `acpx` sehat     | Status task/sesi ACP           |

Pemisahan yang penting adalah provider versus runtime:

- `openai-codex/*` menjawab "jalur provider/auth mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi
  giliran tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat
  atau dikendalikan chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefix model yang tepat

Rute keluarga OpenAI bersifat khusus prefix. Gunakan `openai-codex/*` saat Anda ingin
OAuth Codex melalui PI; gunakan `openai/*` saat Anda ingin akses API OpenAI langsung atau
saat Anda memaksa harness app-server Codex native:

| Ref model                                     | Jalur runtime                                | Gunakan saat                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | provider OpenAI melalui plumbing OpenClaw/PI | Anda ingin akses API Platform OpenAI langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda ingin auth langganan ChatGPT/Codex dengan runner PI default.        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harness app-server Codex                     | Anda ingin eksekusi app-server Codex native untuk giliran agen tertanam. |

GPT-5.5 saat ini hanya mendukung langganan/OAuth di OpenClaw. Gunakan
`openai-codex/gpt-5.5` untuk OAuth PI, atau `openai/gpt-5.5` dengan harness
app-server Codex. Akses API-key langsung untuk `openai/gpt-5.5` didukung
setelah OpenAI mengaktifkan GPT-5.5 pada API publik.

Ref lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Doctor
migrasi kompatibilitas menulis ulang ref runtime utama lama ke ref model kanonis dan mencatat kebijakan runtime secara terpisah, sedangkan ref lama yang hanya fallback dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh kontainer agen.
Config baru OAuth PI Codex sebaiknya menggunakan `openai-codex/gpt-*`; config baru harness
app-server native sebaiknya menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pembagian prefix yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur provider OAuth OpenAI
Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran app-server Codex terbatas. Model app-server Codex harus
mengiklankan dukungan input gambar; model Codex khusus teks akan gagal sebelum giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa rekaman terstruktur `agent harness selected` milik gateway. Rekaman itu
menyertakan id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan ketika semua hal berikut benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering menganggap "Plugin Codex diaktifkan" berarti
"runtime app-server Codex native." OpenClaw tidak mengambil lompatan itu. Arti
peringatan tersebut:

- **Tidak perlu perubahan** jika Anda memang menginginkan OAuth ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda menginginkan eksekusi
  app-server native.
- Sesi yang sudah ada tetap memerlukan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat sticky.

Pemilihan harness bukan kontrol sesi live. Saat giliran tertanam dijalankan,
OpenClaw merekam id harness yang dipilih pada sesi tersebut dan terus menggunakannya untuk
giliran berikutnya dalam id sesi yang sama. Ubah config `agentRuntime` atau
`OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum memindahkan percakapan yang sudah ada antara PI dan Codex. Ini menghindari pemutaran ulang satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum adanya pin harness diperlakukan sebagai ter-pin ke PI setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk mengikutsertakan percakapan itu ke
Codex setelah mengubah config.

`/status` menampilkan runtime model yang efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- App-server Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola binary
  app-server Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH`
  tidak memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server.

Plugin memblokir handshake app-server yang lebih lama atau tanpa versi. Ini menjaga
OpenClaw tetap pada surface protokol yang telah diuji.

Untuk pengujian live dan smoke Docker, auth biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi auth yang sama seperti yang digunakan app-server Codex lokal Anda.

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

Config lama yang menetapkan `agents.defaults.model` atau model agen ke
`codex/<model>` tetap mengaktifkan Plugin `codex` bawaan secara otomatis. Config baru sebaiknya
mengutamakan `openai/<model>` plus entri `agentRuntime` eksplisit di atas.

## Tambahkan Codex bersama model lain

Jangan atur `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas berpindah
antara model provider Codex dan non-Codex. Runtime yang dipaksa berlaku untuk setiap
giliran tertanam bagi agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal secara tertutup
alih-alih diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk berikut sebagai gantinya:

- Tempatkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan provider campuran normal.
- Gunakan ref lama `codex/*` hanya untuk kompatibilitas. Config baru sebaiknya mengutamakan
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

- Agen default `main` menggunakan jalur provider normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness app-server Codex.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran tersebut gagal
  alih-alih diam-diam menggunakan PI.

## Routing perintah agen

Agen harus merutekan permintaan pengguna berdasarkan intent, bukan hanya berdasarkan kata "Codex":

| Pengguna meminta...                                     | Agen sebaiknya menggunakan...                   |
| ------------------------------------------------------- | ----------------------------------------------- |
| "Bind chat ini ke Codex"                                | `/codex bind`                                   |
| "Lanjutkan thread Codex `<id>` di sini"                 | `/codex resume <id>`                            |
| "Tampilkan thread Codex"                                | `/codex threads`                                |
| "Gunakan Codex sebagai runtime untuk agen ini"          | perubahan config ke `agentRuntime.id`           |
| "Gunakan langganan ChatGPT/Codex saya dengan OpenClaw normal" | ref model `openai-codex/*`               |
| "Jalankan Codex melalui ACP/acpx"                       | ACP `sessions_spawn({ runtime: "acp", ... })`   |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP ke agen saat ACP diaktifkan,
dapat didispatch, dan didukung backend runtime yang dimuat. Jika ACP tidak tersedia,
system prompt dan Skills Plugin seharusnya tidak mengajarkan agen tentang routing
ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen tertanam
menggunakan Codex. Runtime Plugin eksplisit default-nya tanpa fallback PI, sehingga
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

Override environment:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan Codex dipaksa, OpenClaw akan gagal lebih awal jika Plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai. Atur
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` hanya jika Anda memang ingin PI menangani
pemilihan harness yang hilang.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default mempertahankan
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

Gunakan perintah sesi normal untuk berpindah agen dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex akan membuat atau melanjutkan thread sidecar app-server
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan membiarkan giliran berikutnya me-resolve harness dari config saat ini lagi.

## Discovery model

Secara default, Plugin Codex meminta model yang tersedia dari app-server. Jika
discovery gagal atau timeout, Plugin menggunakan katalog fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyetel discovery di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan discovery saat Anda ingin startup menghindari probing Codex dan tetap menggunakan
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

## Koneksi app-server dan kebijakan

Secara default, Plugin memulai binary Codex terkelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Binary terkelola dideklarasikan sebagai dependensi runtime Plugin bawaan dan dipentaskan
bersama dependensi Plugin `codex` lainnya. Ini menjaga versi app-server tetap terikat
ke Plugin bawaan alih-alih ke CLI Codex terpisah mana pun yang kebetulan
terinstal secara lokal. Atur `appServer.command` hanya saat Anda
memang ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk heartbeat otonom: Codex dapat menggunakan tool shell dan jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orang untuk menjawabnya.

Untuk ikut menggunakan approvals yang ditinjau guardian Codex, atur `appServer.mode:
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
Codex merutekan permintaan persetujuan itu ke reviewer native alih-alih ke
prompt manusia. Reviewer menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian saat Anda menginginkan lebih banyak guardrail daripada mode YOLO
tetapi tetap memerlukan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan dapat mencampur
preset dengan pilihan eksplisit. Nilai reviewer lama `guardian_subagent` masih
diterima sebagai alias kompatibilitas, tetapi config baru sebaiknya menggunakan
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

Field `appServer` yang didukung:

| Field               | Default                                  | Arti                                                                                                            |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` meluncurkan Codex; `"websocket"` terhubung ke `url`.                                                  |
| `command`           | binary Codex terkelola                   | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan binary terkelola; atur hanya untuk override eksplisit. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                   |
| `url`               | tidak diatur                             | URL app-server WebSocket.                                                                                        |
| `authToken`         | tidak diatur                             | Bearer token untuk transport WebSocket.                                                                          |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                       |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau ditinjau guardian.                                                               |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke start/resume/turn thread.                                    |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke start/resume thread.                                                   |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias lama. |
| `serviceTier`       | tidak diatur                             | Tingkat service app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan. |

Override environment tetap tersedia untuk pengujian lokal:

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
lebih diutamakan untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
file yang sama dan telah ditinjau bersama pengaturan harness Codex lainnya.

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

Approvals Codex yang ditinjau guardian:

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

Penggantian model tetap dikendalikan oleh OpenClaw. Saat sebuah sesi OpenClaw terhubung
ke thread Codex yang sudah ada, giliran berikutnya mengirim model
OpenAI yang saat ini dipilih, provider, kebijakan persetujuan, sandbox, dan service tier ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai slash command yang diotorisasi. Perintah ini
bersifat generik dan berfungsi di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server live, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex live.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` menghubungkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta app-server Codex untuk melakukan Compaction pada thread yang terhubung.
- `/codex review` memulai review native Codex untuk thread yang terhubung.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

`/codex resume` menulis file binding sidecar yang sama dengan yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke app-server, dan mempertahankan riwayat yang diperluas
tetap aktif.

Surface perintah ini memerlukan app-server Codex `0.125.0` atau yang lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                              | Pemilik                  | Tujuan                                                              |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                 | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi app-server Codex | Plugin bawaan OpenClaw   | Perilaku adapter per giliran di sekitar tool dinamis OpenClaw.      |
| Hook native Codex                    | Codex                    | Siklus hidup Codex level rendah dan kebijakan tool native dari config Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex tingkat project atau global untuk merutekan
perilaku Plugin OpenClaw. Untuk bridge tool dan izin native yang didukung,
OpenClaw menyuntikkan config Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Hook Codex lainnya seperti `SessionStart` dan
`UserPromptSubmit` tetap merupakan kontrol level Codex; hook tersebut tidak diekspos sebagai
hook Plugin OpenClaw dalam kontrak v1.

Untuk tool dinamis OpenClaw, OpenClaw mengeksekusi tool setelah Codex meminta
pemanggilan, sehingga OpenClaw memicu perilaku Plugin dan middleware yang dimilikinya di
adapter harness. Untuk tool native Codex, Codex memiliki rekaman tool kanonis.
OpenClaw dapat melakukan mirror pada peristiwa tertentu, tetapi tidak dapat menulis ulang thread
Codex native kecuali Codex mengekspos operasi itu melalui app-server atau callback
hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi app-server Codex
dan status adapter OpenClaw, bukan dari perintah hook native Codex.
Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` milik OpenClaw adalah observasi level adapter, bukan tangkapan byte-for-byte
dari payload permintaan internal atau payload Compaction Codex.

Notifikasi app-server `hook/started` dan `hook/completed` native Codex diproyeksikan
sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan v1

Mode Codex bukan PI dengan pemanggilan model berbeda di bawahnya. Codex memiliki lebih banyak bagian dari
loop model native, dan OpenClaw menyesuaikan surface Plugin dan sesi
di sekitar batas tersebut.

Didukung di runtime Codex v1:

| Surface                                       | Dukungan                                | Mengapa                                                                                                                                                                                                    |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | App-server Codex memiliki giliran OpenAI, resume thread native, dan kelanjutan tool native.                                                                                                               |
| Routing dan pengiriman channel OpenClaw       | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan channel lainnya tetap berada di luar runtime model.                                                                                                      |
| Tool dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                           |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                    |
| Siklus hidup mesin konteks                    | Didukung                                | Assemble, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                                 |
| Hook tool dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil-tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                         |
| Hook siklus hidup                             | Didukung sebagai observasi adapter      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` dipicu dengan payload mode Codex yang jujur.                                                                          |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native      | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu pass model lagi sebelum finalisasi.                                                                                |
| Shell native, patch, dan MCP blok atau amati  | Didukung melalui relay hook native      | `PreToolUse` dan `PostToolUse` Codex direlay untuk surface tool native yang telah dikomit, termasuk payload MCP pada app-server Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw di tempat runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui jalur persetujuan guardian atau pengguna normalnya. |
| Penangkapan trajektori app-server             | Didukung                                | OpenClaw merekam permintaan yang dikirimnya ke app-server dan notifikasi app-server yang diterimanya.                                                                                                     |

Tidak didukung di runtime Codex v1:

| Surface                                             | Batas v1                                                                                                                                       | Jalur masa depan                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen tool native                          | Hook pre-tool native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen tool native Codex.                                     | Memerlukan dukungan hook/schema Codex untuk penggantian input tool.                       |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki mirror dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memodifikasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika operasi thread native diperlukan.           |
| `tool_result_persist` untuk rekaman tool native Codex | Hook tersebut mentransformasikan penulisan transkrip milik OpenClaw, bukan rekaman tool native Codex.                                        | Dapat melakukan mirror rekaman yang ditransformasikan, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native yang kaya                | OpenClaw mengamati mulai dan selesainya Compaction, tetapi tidak menerima daftar tetap/dibuang yang stabil, delta token, atau payload ringkasan. | Memerlukan peristiwa Compaction Codex yang lebih kaya.                                    |
| Intervensi Compaction                               | Hook Compaction OpenClaw saat ini bersifat notifikasi saja dalam mode Codex.                                                                   | Tambahkan hook pre/post Compaction Codex jika Plugins perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte-for-byte      | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi core Codex membangun permintaan API OpenAI akhir secara internal.        | Memerlukan peristiwa tracing model-request Codex atau API debug.                          |

## Tools, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen tertanam level rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, approvals, dan output tool pesan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur tool dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan mengasumsikan setiap peristiwa hook Codex di masa depan adalah surface Plugin OpenClaw sampai kontrak runtime menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan allow atau deny eksplisit
saat kebijakan memutuskan. Hasil tanpa keputusan bukanlah allow. Codex memperlakukannya sebagai tidak ada
keputusan hook dan melanjutkan ke jalur persetujuan guardian atau pengguna miliknya sendiri.

Elicitations persetujuan tool MCP Codex dirutekan melalui alur persetujuan Plugin
OpenClaw saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang diantrikan menjawab permintaan server native
tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan elicitation MCP
lainnya tetap gagal secara tertutup.

Saat model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw mempertahankan mirror transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness di masa depan. Mirror tersebut
mencakup prompt pengguna, teks asisten akhir, dan rekaman penalaran atau rencana Codex yang ringan saat app-server mengeluarkannya. Saat ini, OpenClaw hanya merekam sinyal mulai dan selesai Compaction native. OpenClaw belum mengekspos ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini tidak
menulis ulang rekaman hasil tool native Codex. Itu hanya berlaku saat
OpenClaw sedang menulis hasil tool transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Pembuatan gambar, video, musik, PDF, TTS, dan pemahaman media
tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu diharapkan untuk
config baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref `codex/*` lama), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas saat tidak ada harness Codex yang mengklaim eksekusi. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime Codex yang
dipaksa sekarang gagal alih-alih fallback ke PI kecuali Anda
secara eksplisit mengatur `agentRuntime.fallback: "pi"`. Setelah app-server Codex
dipilih, kegagalannya ditampilkan langsung tanpa config fallback tambahan.

**App-server ditolak:** upgrade Codex agar handshake app-server
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis dengan versi yang sama atau
versi dengan sufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
lantai protokol stabil `0.125.0` itulah yang diuji OpenClaw.

**Discovery model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan discovery.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa app-server remote berbicara dengan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref
`codex/*` lama. Ref `openai/gpt-*` biasa dan provider lainnya tetap berada pada jalur
provider normal mereka dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap giliran tertanam
untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

## Terkait

- [Plugins harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Provider model](/id/concepts/model-providers)
- [Provider OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Plugin hooks](/id/plugins/hooks)
- [Referensi config](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
