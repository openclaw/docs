---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin voice-call
summary: 'Plugin Voice Call: panggilan keluar + masuk melalui Twilio/Telnyx/Plivo (instalasi plugin + konfigurasi + CLI)'
title: plugin panggilan suara
x-i18n:
    generated_at: "2026-04-24T10:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Panggilan suara untuk OpenClaw melalui sebuah plugin. Mendukung notifikasi keluar dan
percakapan multi-turn dengan kebijakan panggilan masuk.

Penyedia saat ini:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + GetInput speech)
- `mock` (dev/tanpa jaringan)

Model mental cepat:

- Instal plugin
- Mulai ulang Gateway
- Konfigurasikan di bawah `plugins.entries.voice-call.config`
- Gunakan `openclaw voicecall ...` atau tool `voice_call`

## Tempat menjalankannya (lokal vs jarak jauh)

Plugin Voice Call berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway jarak jauh, instal/konfigurasikan plugin pada **mesin yang menjalankan Gateway**, lalu mulai ulang Gateway untuk memuatnya.

## Instal

### Opsi A: instal dari npm (disarankan)

```bash
openclaw plugins install @openclaw/voice-call
```

Mulai ulang Gateway setelahnya.

### Opsi B: instal dari folder lokal (dev, tanpa menyalin)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Mulai ulang Gateway setelahnya.

## Konfigurasi

Tetapkan konfigurasi di bawah `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // atau "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // atau TWILIO_FROM_NUMBER untuk Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Kunci publik webhook Telnyx dari Telnyx Mission Control Portal
            // (string Base64; juga dapat ditetapkan melalui TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Keamanan Webhook (disarankan untuk tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Eksposur publik (pilih satu)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opsional; penyedia transkripsi realtime terdaftar pertama jika tidak diatur
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY ditetapkan
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // opsional; penyedia suara realtime terdaftar pertama jika tidak diatur
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Catatan:

- Twilio/Telnyx memerlukan URL Webhook yang **dapat dijangkau secara publik**.
- Plivo memerlukan URL Webhook yang **dapat dijangkau secara publik**.
- `mock` adalah penyedia dev lokal (tanpa panggilan jaringan).
- Jika konfigurasi lama masih menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI `streaming.*` lama, jalankan `openclaw doctor --fix` untuk menulis ulang.
- Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
- `skipSignatureVerification` hanya untuk pengujian lokal.
- Jika Anda menggunakan ngrok tingkat gratis, tetapkan `publicUrl` ke URL ngrok yang tepat; verifikasi tanda tangan selalu diberlakukan.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan tanda tangan tidak valid **hanya** ketika `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Gunakan hanya untuk dev lokal.
- URL ngrok tingkat gratis dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` berubah, tanda tangan Twilio akan gagal. Untuk produksi, gunakan domain stabil atau funnel Tailscale.
- `realtime.enabled` memulai percakapan suara-ke-suara penuh; jangan aktifkan bersamaan dengan `streaming.enabled`.
- Default keamanan streaming:
  - `streaming.preStartTimeoutMs` menutup socket yang tidak pernah mengirim frame `start` yang valid.
- `streaming.maxPendingConnections` membatasi total socket pra-mulai yang belum diautentikasi.
- `streaming.maxPendingConnectionsPerIp` membatasi socket pra-mulai yang belum diautentikasi per IP sumber.
- `streaming.maxConnections` membatasi total socket media stream terbuka (tertunda + aktif).
- Fallback runtime masih menerima kunci voice-call lama untuk saat ini, tetapi jalur penulisannya ulang adalah `openclaw doctor --fix` dan shim kompatibilitas ini bersifat sementara.

## Percakapan suara realtime

`realtime` memilih penyedia suara realtime full duplex untuk audio panggilan langsung.
Ini terpisah dari `streaming`, yang hanya meneruskan audio ke penyedia
transkripsi realtime.

Perilaku runtime saat ini:

- `realtime.enabled` didukung untuk Twilio Media Streams.
- `realtime.enabled` tidak dapat digabungkan dengan `streaming.enabled`.
- `realtime.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia suara realtime terdaftar pertama.
- Penyedia suara realtime bawaan mencakup Google Gemini Live (`google`) dan
  OpenAI (`openai`), yang didaftarkan oleh plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `realtime.providers.<providerId>`.
- Jika `realtime.provider` menunjuk ke penyedia yang tidak terdaftar, atau tidak ada penyedia
  suara realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan melewati
  media realtime alih-alih menggagalkan seluruh plugin.

Default realtime Google Gemini Live:

- Kunci API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, atau
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Contoh:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Bicaralah singkat dan tanyakan sebelum menggunakan tool.",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Gunakan OpenAI sebagai gantinya:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Lihat [penyedia Google](/id/providers/google) dan [penyedia OpenAI](/id/providers/openai)
untuk opsi suara realtime khusus penyedia.

## Transkripsi streaming

`streaming` memilih penyedia transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia
  transkripsi realtime terdaftar pertama.
- Penyedia transkripsi realtime bawaan mencakup Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI
  (`xai`), yang didaftarkan oleh plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke penyedia yang tidak terdaftar, atau tidak ada penyedia
  transkripsi realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan
  melewati streaming media alih-alih menggagalkan seluruh plugin.

Default transkripsi streaming OpenAI:

- Kunci API: `streaming.providers.openai.apiKey` atau `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Default transkripsi streaming xAI:

- Kunci API: `streaming.providers.xai.apiKey` atau `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Contoh:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY ditetapkan
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Gunakan xAI sebagai gantinya:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opsional jika XAI_API_KEY ditetapkan
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Kunci lama masih dimigrasikan otomatis oleh `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Pembersih panggilan usang

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima webhook terminal
(misalnya, panggilan mode notify yang tidak pernah selesai). Nilai default adalah `0`
(dinonaktifkan).

Rentang yang disarankan:

- **Produksi:** `120`–`300` detik untuk alur bergaya notify.
- Pertahankan nilai ini **lebih tinggi daripada `maxDurationSeconds`** agar panggilan normal dapat
  selesai. Titik awal yang baik adalah `maxDurationSeconds + 30–60` detik.

Contoh:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Keamanan Webhook

Saat proxy atau tunnel berada di depan Gateway, plugin merekonstruksi
URL publik untuk verifikasi tanda tangan. Opsi ini mengendalikan header penerusan
mana yang dipercaya.

`webhookSecurity.allowedHosts` mengizinkan host dari header penerusan.

`webhookSecurity.trustForwardingHeaders` mempercayai header penerusan tanpa allowlist.

`webhookSecurity.trustedProxyIPs` hanya mempercayai header penerusan ketika IP jarak jauh
permintaan cocok dengan daftar.

Perlindungan replay Webhook diaktifkan untuk Twilio dan Plivo. Permintaan webhook valid yang diputar ulang
diakui tetapi dilewati untuk efek samping.

Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga
callback ucapan yang usang/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.

Permintaan Webhook yang tidak diautentikasi ditolak sebelum pembacaan body ketika header tanda tangan yang diwajibkan
oleh penyedia tidak ada.

Webhook voice-call menggunakan profil body pra-autentikasi bersama (64 KB / 5 detik)
ditambah batas in-flight per IP sebelum verifikasi tanda tangan.

Contoh dengan host publik yang stabil:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS untuk panggilan

Voice Call menggunakan konfigurasi inti `messages.tts` untuk
streaming ucapan pada panggilan. Anda dapat menimpanya di bawah konfigurasi plugin dengan
**bentuk yang sama** — ini melakukan deep-merge dengan `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Catatan:

- Kunci lama `tts.<provider>` di dalam konfigurasi plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) dimigrasikan otomatis ke `tts.providers.<provider>` saat dimuat. Gunakan bentuk `providers` dalam konfigurasi yang dikomit.
- **Ucapan Microsoft diabaikan untuk panggilan suara** (audio telepon memerlukan PCM; transport Microsoft saat ini tidak mengekspos output PCM telepon).
- TTS inti digunakan saat streaming media Twilio diaktifkan; jika tidak, panggilan akan kembali menggunakan suara bawaan penyedia.
- Jika media stream Twilio sudah aktif, Voice Call tidak kembali ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam keadaan itu, permintaan pemutaran gagal alih-alih mencampurkan dua jalur pemutaran.
- Saat TTS telepon kembali ke penyedia sekunder, Voice Call mencatat peringatan dengan rantai penyedia (`from`, `to`, `attempts`) untuk debugging.

### Contoh lainnya

Gunakan hanya TTS inti (tanpa override):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Override ke ElevenLabs hanya untuk panggilan (pertahankan default inti di tempat lain):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Override hanya model OpenAI untuk panggilan (contoh deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Panggilan masuk

Kebijakan panggilan masuk secara default adalah `disabled`. Untuk mengaktifkan panggilan masuk, atur:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Halo! Ada yang bisa saya bantu?",
}
```

`inboundPolicy: "allowlist"` adalah penyaringan caller ID dengan tingkat keyakinan rendah. Plugin
menormalkan nilai `From` yang diberikan penyedia dan membandingkannya dengan `allowFrom`.
Verifikasi Webhook mengautentikasi pengiriman penyedia dan integritas payload, tetapi
itu tidak membuktikan kepemilikan nomor penelepon PSTN/VoIP. Perlakukan `allowFrom` sebagai
pemfilteran caller ID, bukan identitas penelepon yang kuat.

Respons otomatis menggunakan sistem agen. Sesuaikan dengan:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke system prompt:

- `{"spoken":"..."}`

Voice Call kemudian mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten reasoning/error.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` inline.
- Kembali ke teks biasa dan menghapus paragraf pembuka perencanaan/meta yang mungkin ada.

Ini menjaga pemutaran ucapan tetap berfokus pada teks yang ditujukan kepada penelepon dan menghindari kebocoran teks perencanaan ke audio.

### Perilaku saat memulai percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terkait dengan status pemutaran langsung:

- Pengosongan antrean barge-in dan respons otomatis hanya ditekan selama salam awal sedang aktif diucapkan.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap diantrikan untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.

### Tenggang putus sambungan stream Twilio

Saat media stream Twilio terputus, Voice Call menunggu `2000ms` sebelum mengakhiri panggilan secara otomatis:

- Jika stream tersambung kembali selama jendela itu, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang didaftarkan ulang setelah masa tenggang, panggilan diakhiri untuk mencegah panggilan aktif yang macet.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # meringkas latensi giliran dari log
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari path penyimpanan default voice-call. Gunakan
`--file <path>` untuk mengarah ke log lain dan `--last <n>` untuk membatasi analisis
ke N rekaman terakhir (default 200). Output mencakup p50/p90/p99 untuk latensi
giliran dan waktu tunggu mendengarkan.

## Tool agen

Nama tool: `voice_call`

Aksi:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Repo ini menyediakan dokumen Skills yang sesuai di `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Mode bicara](/id/nodes/talk)
- [Aktivasi suara](/id/nodes/voicewake)
