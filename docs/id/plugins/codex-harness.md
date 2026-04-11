---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan ref model Codex dan contoh konfigurasi
    - Anda ingin menonaktifkan fallback PI untuk deployment khusus Codex
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-04-11T02:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: penemuan
model, pelanjutan thread native, kompaksi native, dan eksekusi app-server.
OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, alat,
approval, pengiriman media, dan mirror transkrip yang terlihat.

Harness ini nonaktif secara default. Harness dipilih hanya saat plugin `codex`
diaktifkan dan model yang diresolusikan adalah model `codex/*`, atau saat Anda secara eksplisit
memaksa `embeddedHarness.runtime: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.
Jika Anda tidak pernah mengonfigurasi `codex/*`, proses PI, OpenAI, Anthropic, Gemini, local,
dan custom-provider yang ada tetap mempertahankan perilaku saat ini.

## Pilih prefix model yang tepat

OpenClaw memiliki rute terpisah untuk akses berbentuk OpenAI dan Codex:

| Ref model              | Jalur runtime                                 | Gunakan saat                                                                |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | Provider OpenAI melalui plumbing OpenClaw/PI | Anda ingin akses langsung OpenAI Platform API dengan `OPENAI_API_KEY`.       |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth melalui PI       | Anda ingin ChatGPT/Codex OAuth tanpa harness app-server Codex.      |
| `codex/gpt-5.4`        | Provider Codex bawaan plus harness Codex    | Anda ingin eksekusi app-server Codex native untuk giliran agen tertanam. |

Harness Codex hanya mengklaim ref model `codex/*`. Ref provider `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, dan custom yang ada tetap
menggunakan jalur normalnya.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- App-server Codex `0.118.0` atau yang lebih baru.
- Auth Codex tersedia untuk proses app-server.

Plugin ini memblokir handshake app-server yang lebih lama atau tanpa versi. Itu menjaga
OpenClaw tetap pada permukaan protokol yang telah diuji.

Untuk uji smoke langsung dan Docker, auth biasanya berasal dari `OPENAI_API_KEY`, ditambah
file CLI Codex opsional seperti `~/.codex/auth.json` dan
`~/.codex/config.toml`. Gunakan materi auth yang sama dengan yang digunakan app-server Codex lokal Anda.

## Konfigurasi minimal

Gunakan `codex/gpt-5.4`, aktifkan plugin bawaan, dan paksa harness `codex`:

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
      model: "codex/gpt-5.4",
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

Menetapkan `agents.defaults.model` atau model agen ke `codex/<model>` juga
secara otomatis mengaktifkan plugin `codex` bawaan. Entri plugin eksplisit tetap
berguna dalam konfigurasi bersama karena membuat maksud deployment menjadi jelas.

## Menambahkan Codex tanpa mengganti model lain

Pertahankan `runtime: "auto"` saat Anda menginginkan Codex untuk model `codex/*` dan PI untuk
yang lainnya:

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Dengan bentuk ini:

- `/model codex` atau `/model codex/gpt-5.4` menggunakan harness app-server Codex.
- `/model gpt` atau `/model openai/gpt-5.4` menggunakan jalur provider OpenAI.
- `/model opus` menggunakan jalur provider Anthropic.
- Jika model non-Codex dipilih, PI tetap menjadi harness kompatibilitas.

## Deployment khusus Codex

Nonaktifkan fallback PI saat Anda perlu membuktikan bahwa setiap giliran agen tertanam menggunakan
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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

Dengan fallback dinonaktifkan, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
model yang diminta bukan ref `codex/*`, app-server terlalu lama, atau
app-server tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap menggunakan
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
        model: "codex/gpt-5.4",
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
sesi OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia kepada app-server. Jika
penemuan gagal atau time out, plugin menggunakan katalog fallback bawaan:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap menggunakan
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

Secara default, plugin memulai Codex secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Anda dapat mempertahankan default tersebut dan hanya menyesuaikan kebijakan native Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Field               | Default                                  | Arti                                                                  |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                 |
| `command`           | `"codex"`                                | Executable untuk transport stdio.                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                           |
| `url`               | unset                                    | URL app-server WebSocket.                                                |
| `authToken`         | unset                                    | Token Bearer untuk transport WebSocket.                                    |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                 |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                              |
| `approvalPolicy`    | `"never"`                                | Kebijakan approval Codex native yang dikirim ke start/resume/turn thread.           |
| `sandbox`           | `"workspace-write"`                      | Mode sandbox Codex native yang dikirim ke start/resume thread.                   |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"guardian_subagent"` agar guardian Codex meninjau approval native. |
| `serviceTier`       | unset                                    | Tier layanan Codex opsional, misalnya `"priority"`.                   |

Variabel lingkungan lama masih berfungsi sebagai fallback untuk pengujian lokal saat
field konfigurasi yang sesuai tidak ditetapkan:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Konfigurasi lebih disukai untuk deployment yang dapat diulang.

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

Approval Codex yang ditinjau guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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
ke thread Codex yang ada, giliran berikutnya mengirim model `codex/*`,
provider, kebijakan approval, sandbox, dan service tier yang saat ini dipilih ke
app-server lagi. Beralih dari `codex/gpt-5.4` ke `codex/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash yang diotorisasi. Perintah ini
generik dan berfungsi di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas app-server langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang ada.
- `/codex compact` meminta app-server Codex untuk mengompaksi thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

`/codex resume` menulis file binding sidecar yang sama yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model `codex/*` OpenClaw yang saat ini dipilih ke app-server, dan menjaga
riwayat diperluas tetap aktif.

Permukaan perintah memerlukan app-server Codex `0.118.0` atau yang lebih baru. Metode control individual dilaporkan sebagai `unsupported by this Codex app-server` jika app-server masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Alat, media, dan kompaksi

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, approval, dan keluaran alat perpesanan
tetap melalui jalur pengiriman OpenClaw normal.

Saat model yang dipilih menggunakan harness Codex, kompaksi thread native didelegasikan
ke app-server Codex. OpenClaw mempertahankan mirror transkrip untuk riwayat channel,
pencarian, `/new`, `/reset`, dan perpindahan model atau harness di masa mendatang. Mirror
tersebut mencakup prompt pengguna, teks asisten final, dan catatan reasoning atau rencana Codex
ringan saat app-server mengeluarkannya.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul di `/model`:** aktifkan `plugins.entries.codex.enabled`,
tetapkan ref model `codex/*`, atau periksa apakah `plugins.allow` mengecualikan `codex`.

**OpenClaw fallback ke PI:** tetapkan `embeddedHarness.fallback: "none"` atau
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` saat pengujian.

**App-server ditolak:** upgrade Codex agar handshake app-server
melaporkan versi `0.118.0` atau yang lebih baru.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan bahwa app-server jarak jauh menggunakan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan. Harness Codex hanya mengklaim
ref model `codex/*`.

## Terkait

- [Plugin Harness Agen](/id/plugins/sdk-agent-harness)
- [Provider Model](/id/concepts/model-providers)
- [Referensi Konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing#live-codex-app-server-harness-smoke)
