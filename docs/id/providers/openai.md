---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex alih-alih API key
summary: Gunakan OpenAI melalui API key atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T14:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI menyediakan API pengembang untuk model GPT. Codex mendukung **sign-in ChatGPT** untuk akses
berbasis langganan atau **sign-in API key** untuk akses berbasis penggunaan. Codex cloud memerlukan sign-in ChatGPT.
OpenAI secara eksplisit mendukung penggunaan OAuth langganan dalam alat/alur kerja eksternal seperti OpenClaw.

## Gaya interaksi default

OpenClaw menambahkan overlay prompt kecil khusus OpenAI secara default untuk eksekusi
`openai/*` dan `openai-codex/*`. Overlay ini menjaga asisten tetap hangat,
kolaboratif, ringkas, dan langsung tanpa menggantikan prompt sistem OpenClaw
dasar.

Key konfigurasi:

`plugins.entries.openai.config.personalityOverlay`

Nilai yang diizinkan:

- `"friendly"`: default; aktifkan overlay khusus OpenAI.
- `"off"`: nonaktifkan overlay dan gunakan hanya prompt dasar OpenClaw.

Cakupan:

- Berlaku untuk model `openai/*`.
- Berlaku untuk model `openai-codex/*`.
- Tidak memengaruhi provider lain.

Perilaku ini aktif secara default:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### Nonaktifkan overlay prompt OpenAI

Jika Anda lebih suka prompt dasar OpenClaw tanpa modifikasi, nonaktifkan overlay:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Anda juga dapat menetapkannya langsung dengan CLI konfigurasi:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Opsi A: API key OpenAI (OpenAI Platform)

**Terbaik untuk:** akses API langsung dan penagihan berbasis penggunaan.
Dapatkan API key Anda dari dashboard OpenAI.

### Penyiapan CLI

```bash
openclaw onboard --auth-choice openai-api-key
# atau non-interaktif
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Cuplikan konfigurasi

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

Dokumentasi model API OpenAI saat ini mencantumkan `gpt-5.4` dan `gpt-5.4-pro` untuk penggunaan
API OpenAI langsung. OpenClaw meneruskan keduanya melalui jalur Responses `openai/*`.
OpenClaw sengaja menyembunyikan baris usang `openai/gpt-5.3-codex-spark`,
karena panggilan API OpenAI langsung menolaknya dalam traffic live.

OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark` pada jalur API OpenAI langsung.
`pi-ai` masih menyediakan baris bawaan untuk model itu, tetapi permintaan API OpenAI live
saat ini menolaknya. Spark diperlakukan sebagai khusus Codex di OpenClaw.

## Opsi B: Langganan OpenAI Code (Codex)

**Terbaik untuk:** menggunakan akses langganan ChatGPT/Codex alih-alih API key.
Codex cloud memerlukan sign-in ChatGPT, sedangkan Codex CLI mendukung sign-in ChatGPT atau API key.

### Penyiapan CLI (Codex OAuth)

```bash
# Jalankan Codex OAuth di wizard
openclaw onboard --auth-choice openai-codex

# Atau jalankan OAuth secara langsung
openclaw models auth login --provider openai-codex
```

### Cuplikan konfigurasi (langganan Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Dokumentasi Codex OpenAI saat ini mencantumkan `gpt-5.4` sebagai model Codex saat ini. OpenClaw
memetakannya ke `openai-codex/gpt-5.4` untuk penggunaan OAuth ChatGPT/Codex.

Jika onboarding menggunakan ulang login Codex CLI yang sudah ada, kredensial tersebut tetap
dikelola oleh Codex CLI. Saat kedaluwarsa, OpenClaw membaca ulang sumber Codex eksternal
terlebih dahulu dan, ketika provider dapat menyegarkannya, menulis kembali kredensial yang telah diperbarui
ke penyimpanan Codex alih-alih mengambil alih kepemilikannya dalam salinan terpisah khusus OpenClaw.

Jika akun Codex Anda memiliki hak untuk Codex Spark, OpenClaw juga mendukung:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw memperlakukan Codex Spark sebagai khusus Codex. OpenClaw tidak mengekspos jalur
API-key langsung `openai/gpt-5.3-codex-spark`.

OpenClaw juga mempertahankan `openai-codex/gpt-5.3-codex-spark` ketika `pi-ai`
menemukannya. Perlakukan ini sebagai bergantung pada entitlement dan eksperimental: Codex Spark
terpisah dari `/fast` GPT-5.4, dan ketersediaannya bergantung pada akun Codex /
ChatGPT yang sedang sign-in.

### Batas context window Codex

OpenClaw memperlakukan metadata model Codex dan batas konteks runtime sebagai
nilai yang terpisah.

Untuk `openai-codex/gpt-5.4`:

- `contextWindow` native: `1050000`
- batas runtime `contextTokens` default: `272000`

Ini menjaga metadata model tetap akurat sambil mempertahankan jendela runtime default yang lebih kecil
yang dalam praktiknya memiliki karakteristik latensi dan kualitas yang lebih baik.

Jika Anda menginginkan batas efektif yang berbeda, tetapkan `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Gunakan `contextWindow` hanya saat Anda mendeklarasikan atau menimpa metadata model
native. Gunakan `contextTokens` saat Anda ingin membatasi anggaran konteks runtime.

### Default transport

OpenClaw menggunakan `pi-ai` untuk streaming model. Untuk `openai/*` maupun
`openai-codex/*`, transport default adalah `"auto"` (WebSocket terlebih dahulu, lalu fallback
ke SSE).

Dalam mode `"auto"`, OpenClaw juga mencoba ulang satu kegagalan WebSocket awal yang dapat dicoba ulang
sebelum fallback ke SSE. Mode `"websocket"` yang dipaksakan tetap menampilkan error transport
secara langsung alih-alih menyembunyikannya di balik fallback.

Setelah kegagalan WebSocket saat koneksi atau awal turn dalam mode `"auto"`, OpenClaw menandai
jalur WebSocket sesi itu sebagai terdegradasi selama sekitar 60 detik dan mengirim
turn berikutnya melalui SSE selama masa cool-down alih-alih berpindah-pindah
antara transport.

Untuk endpoint keluarga OpenAI native (`openai/*`, `openai-codex/*`, dan Azure
OpenAI Responses), OpenClaw juga melampirkan status identitas sesi dan turn yang stabil
ke permintaan agar retry, reconnect, dan fallback SSE tetap selaras dengan identitas
percakapan yang sama. Pada rute keluarga OpenAI native, ini mencakup header identitas request
sesi/turn yang stabil plus metadata transport yang cocok.

OpenClaw juga menormalkan penghitung penggunaan OpenAI lintas varian transport sebelum
mencapai permukaan sesi/status. Traffic Responses OpenAI/Codex native dapat
melaporkan penggunaan sebagai `input_tokens` / `output_tokens` atau
`prompt_tokens` / `completion_tokens`; OpenClaw memperlakukan keduanya sebagai penghitung input
dan output yang sama untuk `/status`, `/usage`, dan log sesi. Saat traffic
WebSocket native menghilangkan `total_tokens` (atau melaporkan `0`), OpenClaw melakukan fallback ke
total input + output yang telah dinormalisasi agar tampilan sesi/status tetap terisi.

Anda dapat menetapkan `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: paksa SSE
- `"websocket"`: paksa WebSocket
- `"auto"`: coba WebSocket, lalu fallback ke SSE

Untuk `openai/*` (Responses API), OpenClaw juga mengaktifkan warm-up WebSocket secara
default (`openaiWsWarmup: true`) saat transport WebSocket digunakan.

Dokumentasi OpenAI terkait:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket OpenAI

Dokumentasi OpenAI menjelaskan warm-up sebagai opsional. OpenClaw mengaktifkannya secara default untuk
`openai/*` untuk mengurangi latensi turn pertama saat menggunakan transport WebSocket.

### Nonaktifkan warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Aktifkan warm-up secara eksplisit

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Pemrosesan prioritas OpenAI dan Codex

API OpenAI mengekspos pemrosesan prioritas melalui `service_tier=priority`. Di
OpenClaw, tetapkan `agents.defaults.models["<provider>/<model>"].params.serviceTier`
untuk meneruskan field tersebut pada endpoint Responses OpenAI/Codex native.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Nilai yang didukung adalah `auto`, `default`, `flex`, dan `priority`.

OpenClaw meneruskan `params.serviceTier` ke permintaan Responses `openai/*`
langsung maupun permintaan Codex Responses `openai-codex/*` saat model tersebut mengarah
ke endpoint OpenAI/Codex native.

Perilaku penting:

- `openai/*` langsung harus menargetkan `api.openai.com`
- `openai-codex/*` harus menargetkan `chatgpt.com/backend-api`
- jika Anda merutekan salah satu provider melalui base URL atau proxy lain, OpenClaw membiarkan `service_tier` apa adanya

### Mode cepat OpenAI

OpenClaw mengekspos toggle mode cepat bersama untuk sesi `openai/*` dan
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Konfigurasi: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Saat mode cepat diaktifkan, OpenClaw memetakannya ke pemrosesan prioritas OpenAI:

- panggilan Responses `openai/*` langsung ke `api.openai.com` mengirim `service_tier = "priority"`
- panggilan Responses `openai-codex/*` ke `chatgpt.com/backend-api` juga mengirim `service_tier = "priority"`
- nilai payload `service_tier` yang sudah ada dipertahankan
- mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`

Contoh:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Override sesi lebih diutamakan daripada konfigurasi. Menghapus override sesi di UI Sessions
mengembalikan sesi ke default yang dikonfigurasi.

### Rute OpenAI native versus yang kompatibel dengan OpenAI

OpenClaw memperlakukan endpoint OpenAI, Codex, dan Azure OpenAI langsung secara berbeda
dibanding proxy `/v1` generik yang kompatibel dengan OpenAI:

- rute `openai/*`, `openai-codex/*`, dan Azure OpenAI native mempertahankan
  `reasoning: { effort: "none" }` saat Anda secara eksplisit menonaktifkan reasoning
- rute keluarga OpenAI native menggunakan mode strict untuk tool schema secara default
- header atribusi OpenClaw tersembunyi (`originator`, `version`, dan
  `User-Agent`) hanya dilampirkan pada host OpenAI native yang terverifikasi
  (`api.openai.com`) dan host Codex native (`chatgpt.com/backend-api`)
- rute OpenAI/Codex native mempertahankan pembentukan request khusus OpenAI seperti
  `service_tier`, Responses `store`, payload reasoning-compat OpenAI, dan
  petunjuk prompt-cache
- rute gaya proxy yang kompatibel dengan OpenAI mempertahankan perilaku compat yang lebih longgar dan tidak
  memaksakan tool schema strict, pembentukan request khusus native, atau header atribusi
  OpenAI/Codex tersembunyi

Azure OpenAI tetap berada dalam kelompok rute native untuk perilaku transport dan compat,
tetapi tidak menerima header atribusi OpenAI/Codex tersembunyi.

Ini mempertahankan perilaku OpenAI Responses native saat ini tanpa memaksakan shim
lama yang kompatibel dengan OpenAI ke backend `/v1` pihak ketiga.

### Pemadatan sisi server OpenAI Responses

Untuk model OpenAI Responses langsung (`openai/*` menggunakan `api: "openai-responses"` dengan
`baseUrl` di `api.openai.com`), OpenClaw kini secara otomatis mengaktifkan petunjuk payload
pemadatan sisi server OpenAI:

- Memaksa `store: true` (kecuali compat model menetapkan `supportsStore: false`)
- Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`

Secara default, `compact_threshold` adalah `70%` dari `contextWindow` model (atau `80000`
jika tidak tersedia).

### Aktifkan pemadatan sisi server secara eksplisit

Gunakan ini saat Anda ingin memaksa injeksi `context_management` pada model
Responses yang kompatibel (misalnya Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Aktifkan dengan ambang batas kustom

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Nonaktifkan pemadatan sisi server

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` hanya mengontrol injeksi `context_management`.
Model OpenAI Responses langsung tetap memaksa `store: true` kecuali compat menetapkan
`supportsStore: false`.

## Catatan

- Referensi model selalu menggunakan `provider/model` (lihat [/concepts/models](/id/concepts/models)).
- Detail autentikasi + aturan penggunaan ulang ada di [/concepts/oauth](/id/concepts/oauth).
