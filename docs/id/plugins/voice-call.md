---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin voice-call
summary: 'Plugin Voice Call: panggilan keluar + masuk melalui Twilio/Telnyx/Plivo (instal plugin + konfigurasi + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-05T14:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Panggilan suara untuk OpenClaw melalui plugin. Mendukung notifikasi keluar dan
percakapan multi-putaran dengan kebijakan panggilan masuk.

Provider saat ini:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfer XML + GetInput speech)
- `mock` (dev/tanpa jaringan)

Model mental cepat:

- Instal plugin
- Restart Gateway
- Konfigurasikan di bawah `plugins.entries.voice-call.config`
- Gunakan `openclaw voicecall ...` atau tool `voice_call`

## Tempat plugin ini berjalan (lokal vs remote)

Plugin Voice Call berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway remote, instal/konfigurasikan plugin di **mesin yang menjalankan Gateway**, lalu restart Gateway agar plugin dimuat.

## Instalasi

### Opsi A: instal dari npm (disarankan)

```bash
openclaw plugins install @openclaw/voice-call
```

Restart Gateway setelahnya.

### Opsi B: instal dari folder lokal (dev, tanpa menyalin)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Restart Gateway setelahnya.

## Konfigurasi

Setel konfigurasi di bawah `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

- Twilio/Telnyx memerlukan URL webhook yang **dapat dijangkau secara publik**.
- Plivo memerlukan URL webhook yang **dapat dijangkau secara publik**.
- `mock` adalah provider dev lokal (tanpa panggilan jaringan).
- Jika konfigurasi lama masih menggunakan `provider: "log"`, `twilio.from`, atau key OpenAI `streaming.*` lawas, jalankan `openclaw doctor --fix` untuk menulis ulangnya.
- Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
- `skipSignatureVerification` hanya untuk pengujian lokal.
- Jika Anda menggunakan tier gratis ngrok, setel `publicUrl` ke URL ngrok yang tepat; verifikasi tanda tangan selalu diterapkan.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan tanda tangan tidak valid **hanya** saat `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agent lokal ngrok). Gunakan hanya untuk dev lokal.
- URL ngrok tier gratis dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` berubah, tanda tangan Twilio akan gagal. Untuk produksi, utamakan domain stabil atau Tailscale funnel.
- Default keamanan streaming:
  - `streaming.preStartTimeoutMs` menutup socket yang tidak pernah mengirim frame `start` yang valid.
- `streaming.maxPendingConnections` membatasi total socket pra-mulai yang belum diautentikasi.
- `streaming.maxPendingConnectionsPerIp` membatasi socket pra-mulai yang belum diautentikasi per IP sumber.
- `streaming.maxConnections` membatasi total socket stream media yang terbuka (tertunda + aktif).
- Fallback runtime untuk sementara masih menerima key voice-call lama tersebut, tetapi jalur penulisan ulangnya adalah `openclaw doctor --fix` dan shim kompatibilitas ini bersifat sementara.

## Transkripsi streaming

`streaming` memilih provider transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak disetel, Voice Call menggunakan provider transkripsi realtime pertama yang terdaftar.
- Saat ini provider bawaan adalah OpenAI, yang didaftarkan oleh plugin bawaan `openai`.
- Konfigurasi mentah milik provider berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke provider yang tidak terdaftar, atau tidak ada provider transkripsi realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan melewati streaming media alih-alih menggagalkan seluruh plugin.

Default transkripsi streaming OpenAI:

- Kunci API: `streaming.providers.openai.apiKey` atau `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

Key lama masih dimigrasikan secara otomatis oleh `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Pembersih panggilan basi

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima webhook terminal
(misalnya, panggilan mode notify yang tidak pernah selesai). Default-nya adalah `0`
(dinonaktifkan).

Rentang yang direkomendasikan:

- **Produksi:** `120`–`300` detik untuk alur bergaya notify.
- Pertahankan nilai ini **lebih tinggi dari `maxDurationSeconds`** agar panggilan normal dapat
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

Saat proxy atau tunnel berada di depan Gateway, plugin membangun ulang
URL publik untuk verifikasi tanda tangan. Opsi ini mengontrol header yang diteruskan mana yang dipercaya.

`webhookSecurity.allowedHosts` membuat allowlist host dari header penerusan.

`webhookSecurity.trustForwardingHeaders` mempercayai header penerusan tanpa allowlist.

`webhookSecurity.trustedProxyIPs` hanya mempercayai header penerusan saat
IP remote permintaan cocok dengan daftar.

Perlindungan replay webhook diaktifkan untuk Twilio dan Plivo. Permintaan webhook valid yang diputar ulang
diakui tetapi dilewati untuk efek samping.

Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga
callback ucapan yang basi/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.

Permintaan webhook yang tidak diautentikasi ditolak sebelum body dibaca saat
header tanda tangan wajib milik provider tidak ada.

Webhook voice-call menggunakan profil body pra-auth bersama (64 KB / 5 detik)
ditambah batas in-flight per-IP sebelum verifikasi tanda tangan.

Contoh dengan host publik stabil:

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

Voice Call menggunakan konfigurasi `messages.tts` inti untuk
streaming ucapan pada panggilan. Anda dapat menimpanya di bawah konfigurasi plugin dengan
**bentuk yang sama** — ini di-deep-merge dengan `messages.tts`.

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

- Key lama `tts.<provider>` di dalam konfigurasi plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) dimigrasikan otomatis ke `tts.providers.<provider>` saat load. Utamakan bentuk `providers` dalam konfigurasi yang dikomit.
- **Microsoft speech diabaikan untuk panggilan suara** (audio telefoni memerlukan PCM; transport Microsoft saat ini tidak mengekspos output PCM telefoni).
- TTS inti digunakan saat streaming media Twilio diaktifkan; jika tidak, panggilan akan fallback ke suara native provider.
- Jika stream media Twilio sudah aktif, Voice Call tidak melakukan fallback ke TwiML `<Say>`. Jika TTS telefoni tidak tersedia dalam keadaan tersebut, permintaan pemutaran akan gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telefoni melakukan fallback ke provider sekunder, Voice Call mencatat peringatan dengan rantai provider (`from`, `to`, `attempts`) untuk debugging.

### Contoh lainnya

Gunakan TTS inti saja (tanpa override):

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

Default kebijakan panggilan masuk adalah `disabled`. Untuk mengaktifkan panggilan masuk, setel:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` adalah penyaringan caller-ID dengan tingkat keyakinan rendah. Plugin
menormalkan nilai `From` yang diberikan provider dan membandingkannya dengan `allowFrom`.
Verifikasi webhook mengautentikasi pengiriman provider dan integritas payload, tetapi
tidak membuktikan kepemilikan nomor penelepon PSTN/VoIP. Perlakukan `allowFrom` sebagai
filter caller-ID, bukan identitas penelepon yang kuat.

Respons otomatis menggunakan sistem agent. Sesuaikan dengan:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke system prompt:

- `{"spoken":"..."}`

Voice Call kemudian mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten penalaran/error.
- Mengurai JSON langsung, JSON berpagar, atau key `"spoken"` inline.
- Melakukan fallback ke teks biasa dan menghapus paragraf pembuka yang kemungkinan merupakan perencanaan/meta.

Ini menjaga pemutaran ucapan tetap fokus pada teks yang ditujukan kepada penelepon dan menghindari kebocoran teks perencanaan ke audio.

### Perilaku startup percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terikat pada status pemutaran langsung:

- Pembersihan antrean barge-in dan respons otomatis ditekan hanya saat salam awal sedang aktif berbicara.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap masuk antrean untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.

### Grace pemutusan stream Twilio

Saat stream media Twilio terputus, Voice Call menunggu `2000ms` sebelum mengakhiri panggilan secara otomatis:

- Jika stream tersambung kembali selama jendela itu, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang didaftarkan ulang setelah masa grace, panggilan diakhiri untuk mencegah panggilan aktif yang macet.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari path penyimpanan voice-call default. Gunakan
`--file <path>` untuk menunjuk ke log yang berbeda dan `--last <n>` untuk membatasi analisis
ke N catatan terakhir (default 200). Output mencakup p50/p90/p99 untuk
latensi giliran dan waktu tunggu mendengarkan.

## Tool agent

Nama tool: `voice_call`

Aksi:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Repo ini menyertakan dokumen skill yang cocok di `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
