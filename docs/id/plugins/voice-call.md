---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin voice-call
summary: 'Plugin Voice Call: panggilan keluar + masuk melalui Twilio/Telnyx/Plivo (instalasi Plugin + config + CLI)'
title: Plugin voice call
x-i18n:
    generated_at: "2026-04-24T09:21:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Panggilan suara untuk OpenClaw melalui Plugin. Mendukung notifikasi panggilan keluar dan
percakapan multi-giliran dengan kebijakan masuk.

Provider saat ini:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + GetInput speech)
- `mock` (dev/tanpa jaringan)

Model mental cepat:

- Instal Plugin
- Mulai ulang Gateway
- Konfigurasikan di bawah `plugins.entries.voice-call.config`
- Gunakan `openclaw voicecall ...` atau tool `voice_call`

## Tempat dijalankan (lokal vs remote)

Plugin Voice Call berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway remote, instal/konfigurasikan Plugin di **mesin yang menjalankan Gateway**, lalu mulai ulang Gateway untuk memuatnya.

## Instalasi

### Opsi A: instal dari npm (direkomendasikan)

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

## Config

Atur config di bawah `plugins.entries.voice-call.config`:

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
            // kunci publik webhook Telnyx dari Telnyx Mission Control Portal
            // (string Base64; juga dapat diatur melalui TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Keamanan webhook (direkomendasikan untuk tunnel/proxy)
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
            provider: "openai", // opsional; provider transkripsi realtime pertama yang terdaftar saat tidak diatur
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY diatur
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
        },
      },
    },
  },
}
```

Catatan:

- Twilio/Telnyx memerlukan URL webhook yang **dapat dijangkau publik**.
- Plivo memerlukan URL webhook yang **dapat dijangkau publik**.
- `mock` adalah provider dev lokal (tanpa panggilan jaringan).
- Jika config lama masih menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI `streaming.*` lama, jalankan `openclaw doctor --fix` untuk menulis ulang.
- Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
- `skipSignatureVerification` hanya untuk pengujian lokal.
- Jika Anda menggunakan tier gratis ngrok, atur `publicUrl` ke URL ngrok yang tepat; verifikasi tanda tangan selalu ditegakkan.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan tanda tangan tidak valid **hanya** ketika `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Gunakan hanya untuk dev lokal.
- URL tier gratis ngrok dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` bergeser, tanda tangan Twilio akan gagal. Untuk produksi, lebih baik gunakan domain stabil atau Tailscale funnel.
- Default keamanan streaming:
  - `streaming.preStartTimeoutMs` menutup socket yang tidak pernah mengirim frame `start` yang valid.
- `streaming.maxPendingConnections` membatasi total socket pra-start yang belum diautentikasi.
- `streaming.maxPendingConnectionsPerIp` membatasi socket pra-start yang belum diautentikasi per IP sumber.
- `streaming.maxConnections` membatasi total socket media stream yang terbuka (pending + aktif).
- Fallback runtime masih menerima kunci voice-call lama tersebut untuk saat ini, tetapi jalur penulisannya ulang adalah `openclaw doctor --fix` dan shim kompatibilitas ini bersifat sementara.

## Transkripsi streaming

`streaming` memilih provider transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan provider transkripsi realtime pertama yang terdaftar.
- Provider transkripsi realtime bawaan termasuk Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI
  (`xai`), yang didaftarkan oleh Plugin provider masing-masing.
- Config mentah milik provider berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke provider yang tidak terdaftar, atau tidak ada provider
  transkripsi realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan
  melewati media streaming alih-alih menggagalkan seluruh Plugin.

Default transkripsi streaming OpenAI:

- API key: `streaming.providers.openai.apiKey` atau `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Default transkripsi streaming xAI:

- API key: `streaming.providers.xai.apiKey` atau `XAI_API_KEY`
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
                apiKey: "sk-...", // opsional jika OPENAI_API_KEY diatur
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
                apiKey: "${XAI_API_KEY}", // opsional jika XAI_API_KEY diatur
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

## Reaper panggilan stale

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima webhook terminal
(misalnya, panggilan mode notify yang tidak pernah selesai). Default-nya adalah `0`
(dinonaktifkan).

Rentang yang direkomendasikan:

- **Produksi:** `120`–`300` detik untuk alur gaya notify.
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

Ketika proxy atau tunnel berada di depan Gateway, Plugin merekonstruksi
URL publik untuk verifikasi tanda tangan. Opsi ini mengontrol header forwarded mana
yang dipercaya.

`webhookSecurity.allowedHosts` membuat allowlist host dari header forwarding.

`webhookSecurity.trustForwardingHeaders` mempercayai header forwarded tanpa allowlist.

`webhookSecurity.trustedProxyIPs` hanya mempercayai header forwarded saat
IP remote permintaan cocok dengan daftar.

Perlindungan replay webhook diaktifkan untuk Twilio dan Plivo. Permintaan webhook valid yang di-replay
diakui tetapi dilewati untuk efek samping.

Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga
callback speech yang stale/di-replay tidak dapat memenuhi giliran transkrip baru yang sedang menunggu.

Permintaan webhook yang tidak diautentikasi ditolak sebelum pembacaan body ketika header tanda tangan wajib milik provider tidak ada.

Webhook voice-call menggunakan profil body pra-auth bersama (64 KB / 5 detik)
ditambah batas in-flight per-IP sebelum verifikasi tanda tangan.

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
streaming ucapan pada panggilan. Anda dapat menimpanya di bawah config Plugin dengan
**bentuk yang sama** — konfigurasi ini di-deep-merge dengan `messages.tts`.

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

- Kunci `tts.<provider>` lama di dalam config Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) dimigrasikan otomatis ke `tts.providers.<provider>` saat load. Lebih baik gunakan bentuk `providers` di config yang di-commit.
- **Ucapan Microsoft diabaikan untuk panggilan suara** (audio telepon memerlukan PCM; transport Microsoft saat ini tidak mengekspos output PCM telepon).
- TTS inti digunakan saat media streaming Twilio diaktifkan; jika tidak, panggilan fallback ke suara native provider.
- Jika media stream Twilio sudah aktif, Voice Call tidak fallback ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam state tersebut, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telepon fallback ke provider sekunder, Voice Call mencatat peringatan dengan rantai provider (`from`, `to`, `attempts`) untuk debugging.

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

Kebijakan masuk default adalah `disabled`. Untuk mengaktifkan panggilan masuk, atur:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Halo! Ada yang bisa saya bantu?",
}
```

`inboundPolicy: "allowlist"` adalah penyaringan caller ID dengan tingkat jaminan rendah. Plugin ini
menormalkan nilai `From` yang disediakan provider lalu membandingkannya dengan `allowFrom`.
Verifikasi webhook mengautentikasi pengiriman provider dan integritas payload, tetapi
tidak membuktikan kepemilikan nomor penelepon PSTN/VoIP. Perlakukan `allowFrom` sebagai
penyaringan caller ID, bukan identitas penelepon yang kuat.

Respons otomatis menggunakan sistem agen. Setel dengan:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke prompt sistem:

- `{"spoken":"..."}`

Lalu Voice Call mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten penalaran/error.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` inline.
- Fallback ke teks biasa dan menghapus paragraf pembuka yang kemungkinan berisi perencanaan/meta.

Ini menjaga pemutaran ucapan tetap berfokus pada teks yang ditujukan kepada penelepon dan menghindari kebocoran teks perencanaan ke audio.

### Perilaku startup percakapan

Untuk panggilan keluar `conversation`, penanganan pesan pertama terikat pada state pemutaran langsung:

- Pembersihan antrean barge-in dan respons otomatis hanya ditekan saat salam awal sedang aktif diucapkan.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap antre untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.

### Grace pemutusan stream Twilio

Saat media stream Twilio terputus, Voice Call menunggu `2000ms` sebelum mengakhiri panggilan secara otomatis:

- Jika stream tersambung kembali selama jendela itu, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang didaftarkan ulang setelah masa grace, panggilan diakhiri untuk mencegah panggilan aktif macet.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias untuk call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # merangkum latensi giliran dari log
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari path penyimpanan voice-call default. Gunakan
`--file <path>` untuk menunjuk ke log yang berbeda dan `--last <n>` untuk membatasi analisis
ke N catatan terakhir (default 200). Output mencakup p50/p90/p99 untuk latensi giliran
dan waktu tunggu listen.

## Tool agen

Nama tool: `voice_call`

Aksi:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Repo ini menyertakan dokumen skill yang sesuai di `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Mode Talk](/id/nodes/talk)
- [Voice wake](/id/nodes/voicewake)
