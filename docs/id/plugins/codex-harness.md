---
read_when:
    - Anda ingin menggunakan harness server-aplikasi Codex bawaan
    - Anda memerlukan ref model Codex dan contoh konfigurasi
    - Anda ingin menonaktifkan fallback PI untuk deployment khusus Codex
summary: Jalankan giliran agen tersemat OpenClaw melalui harness server-aplikasi Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-24T09:18:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Plugin bundled `codex` memungkinkan OpenClaw menjalankan giliran agen tersemat melalui
server-aplikasi Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: discovery
model, resume thread native, Compaction native, dan eksekusi server-aplikasi.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, tool,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan kompatibilitas publik.
Ini adalah hook OpenClaw di dalam proses, bukan hook perintah `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` untuk rekaman transkrip cermin
- `agent_end`

Plugin bundled juga dapat mendaftarkan factory ekstensi server-aplikasi Codex untuk menambahkan middleware `tool_result` async. Middleware itu berjalan untuk tool dinamis OpenClaw
setelah OpenClaw mengeksekusi tool dan sebelum hasilnya dikembalikan ke Codex. Middleware ini
terpisah dari hook Plugin publik `tool_result_persist`, yang mentransformasi penulisan hasil tool transkrip milik OpenClaw.

Harness ini nonaktif secara default. Konfigurasi baru harus menjaga ref model
OpenAI tetap kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`embeddedHarness.runtime: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat mereka
menginginkan eksekusi server-aplikasi native. Ref model lama `codex/*` tetap otomatis memilih
harness demi kompatibilitas.

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik terhadap prefiks. Gunakan `openai-codex/*` saat Anda menginginkan
OAuth Codex melalui PI; gunakan `openai/*` saat Anda menginginkan akses OpenAI API langsung atau
saat Anda memaksa harness server-aplikasi Codex native:

| Ref model                                            | Jalur runtime                                | Gunakan saat                                                              |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Provider OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan auth langganan ChatGPT/Codex dengan runner PI default.  |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness server-aplikasi Codex               | Anda menginginkan eksekusi server-aplikasi Codex native untuk giliran agen tersemat. |

GPT-5.5 saat ini hanya subscription/OAuth di OpenClaw. Gunakan
`openai-codex/gpt-5.5` untuk PI OAuth, atau `openai/gpt-5.5` dengan harness
server-aplikasi Codex. Akses API-key langsung untuk `openai/gpt-5.5` didukung
setelah OpenAI mengaktifkan GPT-5.5 di API publik.

Ref lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Konfigurasi OAuth Codex PI
baru sebaiknya menggunakan `openai-codex/gpt-*`; konfigurasi harness server-aplikasi native
baru sebaiknya menggunakan `openai/gpt-*` plus `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur provider OAuth OpenAI
Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran server-aplikasi Codex yang dibatasi. Model server-aplikasi Codex harus
mengiklankan dukungan input gambar; model Codex yang hanya teks akan gagal sebelum giliran media
dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa rekaman terstruktur `agent harness selected` milik Gateway. Rekaman itu
mencakup id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan,
dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

Pemilihan harness bukanlah kontrol sesi live. Saat giliran tersemat berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi tersebut dan terus
menggunakannya untuk giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi
`embeddedHarness` atau `OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi di masa depan menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengganti percakapan yang sudah ada antara PI dan Codex. Ini menghindari pemutaran ulang satu transkrip melalui dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai dipin ke PI setelah memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memilih Codex untuk percakapan itu setelah mengubah konfigurasi.

`/status` menampilkan harness non-PI efektif di samping `Fast`, misalnya
`Fast · codex`. Harness PI default tetap `Runner: pi (embedded)` dan tidak
menambahkan badge harness terpisah.

## Persyaratan

- OpenClaw dengan Plugin bundled `codex` tersedia.
- Server-aplikasi Codex `0.118.0` atau lebih baru.
- Auth Codex tersedia untuk proses server-aplikasi.

Plugin memblokir handshake server-aplikasi yang lebih lama atau tanpa versi. Itu menjaga
OpenClaw tetap pada permukaan protokol yang telah diuji.

Untuk live test dan smoke test Docker, auth biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi auth yang sama dengan yang digunakan server-aplikasi Codex lokal Anda.

## Konfigurasi minimal

Gunakan `openai/gpt-5.5`, aktifkan Plugin bundled, dan paksa harness `codex`:

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
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
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

Konfigurasi lama yang menetapkan `agents.defaults.model` atau model agen ke
`codex/<model>` tetap mengaktifkan otomatis Plugin bundled `codex`. Konfigurasi baru sebaiknya
memilih `openai/<model>` plus entri `embeddedHarness` eksplisit di atas.

## Tambahkan Codex tanpa mengganti model lain

Pertahankan `runtime: "auto"` saat Anda ingin ref lama `codex/*` memilih Codex dan
PI untuk semua yang lain. Untuk konfigurasi baru, lebih baik gunakan `runtime: "codex"` eksplisit pada
agen yang harus menggunakan harness.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Dengan bentuk ini:

- `/model gpt` atau `/model openai/gpt-5.5` menggunakan harness server-aplikasi Codex untuk konfigurasi ini.
- `/model opus` menggunakan jalur provider Anthropic.
- Jika model non-Codex dipilih, PI tetap menjadi harness kompatibilitas.

## Deployment khusus Codex

Nonaktifkan fallback PI ketika Anda perlu membuktikan bahwa setiap giliran agen tersemat menggunakan
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override lingkungan:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
server-aplikasi terlalu lama, atau server-aplikasi tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap mempertahankan
pemilihan otomatis normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Gunakan perintah sesi normal untuk mengganti agen dan model. `/new` membuat
sesi OpenClaw baru dan harness Codex membuat atau melanjutkan sidecar thread server-aplikasinya
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread itu
dan membiarkan giliran berikutnya me-resolve harness dari konfigurasi saat ini lagi.

## Discovery model

Secara default, Plugin Codex meminta model yang tersedia ke server-aplikasi. Jika
discovery gagal atau timeout, Plugin menggunakan katalog fallback bundled untuk:

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

Nonaktifkan discovery ketika Anda ingin startup menghindari probe Codex dan tetap pada
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

## Koneksi server-aplikasi dan kebijakan

Secara default, Plugin memulai Codex secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan shell dan tool jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orang untuk menjawabnya.

Untuk memilih persetujuan yang ditinjau Guardian Codex, setel `appServer.mode:
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

Guardian adalah peninjau persetujuan native Codex. Saat Codex meminta keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan, Codex merutekan permintaan persetujuan itu ke sub-agen peninjau alih-alih prompt manusia. Peninjau menerapkan kerangka risiko Codex dan menyetujui atau menolak permintaan spesifik tersebut. Gunakan Guardian saat Anda menginginkan guardrail lebih banyak daripada mode YOLO tetapi tetap membutuhkan agen tanpa pengawasan untuk membuat kemajuan.

Preset `guardian` berkembang menjadi `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"`, dan `sandbox: "workspace-write"`. Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan dapat mencampur preset dengan pilihan eksplisit.

Untuk server-aplikasi yang sudah berjalan, gunakan transport WebSocket:

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

| Field               | Default                                  | Arti                                                                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` men-spawn Codex; `"websocket"` terhubung ke `url`.                                             |
| `command`           | `"codex"`                                | Executable untuk transport stdio.                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                            |
| `url`               | unset                                    | URL WebSocket server-aplikasi.                                                                            |
| `authToken`         | unset                                    | Bearer token untuk transport WebSocket.                                                                   |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane server-aplikasi.                                                    |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau Guardian.                                                   |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke start/resume/turn thread.                             |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke start/resume thread.                                            |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"guardian_subagent"` agar Codex Guardian meninjau prompt.                                        |
| `serviceTier`       | unset                                    | Tingkat layanan server-aplikasi Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy yang tidak valid diabaikan. |

Variabel lingkungan lama tetap berfungsi sebagai fallback untuk pengujian lokal saat
field konfigurasi yang cocok tidak disetel:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali jalan. Konfigurasi
lebih disukai untuk deployment yang dapat diulang karena menjaga perilaku Plugin tetap berada di
file yang sama dan telah ditinjau bersama penyiapan harness Codex lainnya.

## Recipe umum

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

Validasi harness khusus Codex, dengan fallback PI dinonaktifkan:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Persetujuan Codex yang ditinjau Guardian:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Server-aplikasi remote dengan header eksplisit:

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

Perpindahan model tetap dikontrol oleh OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, giliran berikutnya mengirim model
OpenAI yang saat ini dipilih, provider, kebijakan persetujuan, sandbox, dan tingkat layanan ke
server-aplikasi lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bundled mendaftarkan `/codex` sebagai slash command yang diotorisasi. Perintah ini
bersifat generik dan berfungsi di channel mana pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas server-aplikasi live, model, akun, rate limit, server MCP, dan Skills.
- `/codex models` mencantumkan model server-aplikasi Codex live.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta server-aplikasi Codex melakukan Compaction pada thread yang terlampir.
- `/codex review` memulai peninjauan native Codex untuk thread yang terlampir.
- `/codex account` menampilkan status akun dan rate-limit.
- `/codex mcp` mencantumkan status server MCP server-aplikasi Codex.
- `/codex skills` mencantumkan Skills server-aplikasi Codex.

`/codex resume` menulis file sidecar binding yang sama dengan yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex itu, meneruskan model OpenClaw
yang saat ini dipilih ke server-aplikasi, dan menjaga riwayat yang diperluas tetap
aktif.

Permukaan perintah ini memerlukan server-aplikasi Codex `0.118.0` atau lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
server-aplikasi masa depan atau kustom tidak mengekspos metode JSON-RPC itu.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/plugin di PI dan harness Codex.               |
| Middleware ekstensi server-aplikasi Codex | Plugin bundled OpenClaw | Perilaku adaptor per giliran di sekitar tool dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan tool native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex tingkat project atau global untuk merutekan
perilaku Plugin OpenClaw. Hook native Codex berguna untuk operasi milik Codex
seperti kebijakan shell, peninjauan hasil tool native, penanganan stop, dan
siklus hidup model/Compaction native, tetapi hook tersebut bukan API Plugin OpenClaw.

Untuk tool dinamis OpenClaw, OpenClaw mengeksekusi tool setelah Codex meminta
pemanggilan, sehingga OpenClaw memicu perilaku Plugin dan middleware yang dimilikinya di
adaptor harness. Untuk tool native Codex, Codex memiliki rekaman tool kanonis.
OpenClaw dapat mencerminkan event tertentu, tetapi tidak dapat menulis ulang thread
Codex native kecuali Codex mengekspos operasi tersebut melalui server-aplikasi atau callback
hook native.

Saat build server-aplikasi Codex yang lebih baru mengekspos event hook native untuk Compaction dan siklus hidup model,
OpenClaw seharusnya mem-gate dukungan protokol itu berdasarkan versi dan memetakan
event tersebut ke kontrak hook OpenClaw yang ada ketika semantiknya jujur.
Sampai saat itu, event `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` milik OpenClaw adalah observasi tingkat adaptor, bukan penangkapan byte-per-byte
dari permintaan internal atau payload Compaction milik Codex.

Notifikasi server-aplikasi native Codex `hook/started` dan `hook/completed`
diproyeksikan sebagai event agen `codex_app_server.hook` untuk trajectory dan debugging.
Notifikasi itu tidak memanggil hook Plugin OpenClaw.

## Tools, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen tersemat tingkat rendah.

OpenClaw tetap membangun daftar tool dan menerima hasil tool dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output tool pengiriman pesan
tetap melalui jalur pengiriman OpenClaw normal.

Elicitation persetujuan tool MCP Codex dirutekan melalui alur persetujuan Plugin OpenClaw saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke
chat asal, dan pesan tindak lanjut berikutnya yang diantrikan menjawab permintaan server native itu alih-alih diarahkan sebagai konteks tambahan. Permintaan elicitation MCP lainnya tetap gagal secara fail-closed.

Saat model yang dipilih menggunakan harness Codex, Compaction thread native didelegasikan ke server-aplikasi Codex. OpenClaw mempertahankan cermin transkrip untuk riwayat channel, pencarian, `/new`, `/reset`, dan perpindahan model atau harness di masa depan. Cermin itu mencakup prompt pengguna, teks asisten final, dan rekaman reasoning atau plan Codex yang ringan saat server-aplikasi mengeluarkannya. Saat ini, OpenClaw hanya mencatat sinyal mulai dan selesai Compaction native. OpenClaw belum mengekspos ringkasan Compaction yang dapat dibaca manusia atau daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah Compaction.

Karena Codex memiliki thread native yang kanonis, `tool_result_persist` saat ini tidak
menulis ulang rekaman hasil tool native Codex. Hook itu hanya berlaku saat
OpenClaw menulis hasil tool transkrip sesi milik OpenClaw.

Generasi media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang cocok seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul di `/model`:** aktifkan `plugins.entries.codex.enabled`,
pilih model `openai/gpt-*` dengan `embeddedHarness.runtime: "codex"` (atau
ref lama `codex/*`), dan periksa apakah `plugins.allow` mengecualikan `codex`.

**OpenClaw menggunakan PI alih-alih Codex:** jika tidak ada harness Codex yang mengklaim eksekusi,
OpenClaw dapat menggunakan PI sebagai backend kompatibilitas. Setel
`embeddedHarness.runtime: "codex"` untuk memaksa pemilihan Codex saat menguji, atau
`embeddedHarness.fallback: "none"` untuk gagal saat tidak ada harness Plugin yang cocok. Setelah
server-aplikasi Codex dipilih, kegagalannya muncul secara langsung tanpa
konfigurasi fallback tambahan.

**Server-aplikasi ditolak:** upgrade Codex agar handshake server-aplikasi
melaporkan versi `0.118.0` atau lebih baru.

**Discovery model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan discovery.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa server-aplikasi remote berbicara dengan versi protokol server-aplikasi Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`embeddedHarness.runtime: "codex"` (atau memilih ref lama `codex/*`). Ref
`openai/gpt-*` biasa dan provider lain tetap berada di jalur provider normalnya.

## Terkait

- [Plugin Harness Agen](/id/plugins/sdk-agent-harness)
- [Provider Model](/id/concepts/model-providers)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
