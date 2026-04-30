---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin voice-call
    - Anda memerlukan suara waktu nyata atau transkripsi streaming pada telefoni
sidebarTitle: Voice call
summary: Lakukan panggilan suara keluar dan terima panggilan suara masuk melalui Twilio, Telnyx, atau Plivo, dengan opsi suara waktu nyata dan transkripsi yang dialirkan
title: Plugin panggilan suara
x-i18n:
    generated_at: "2026-04-30T10:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Panggilan suara untuk OpenClaw melalui plugin. Mendukung notifikasi keluar,
percakapan multi-giliran, suara realtime dupleks penuh, transkripsi
streaming, dan panggilan masuk dengan kebijakan daftar izin.

**Penyedia saat ini:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/tanpa jaringan).

<Note>
Plugin Voice Call berjalan **di dalam proses Gateway**. Jika Anda menggunakan
Gateway jarak jauh, instal dan konfigurasikan plugin pada mesin yang menjalankan
Gateway, lalu mulai ulang Gateway untuk memuatnya.
</Note>

## Mulai cepat

<Steps>
  <Step title="Instal plugin">
    <Tabs>
      <Tab title="Dari npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Dari folder lokal (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Jika npm melaporkan paket milik OpenClaw sebagai tidak digunakan lagi, versi paket itu
    berasal dari rangkaian paket eksternal yang lebih lama; gunakan build OpenClaw
    terpaket saat ini atau jalur folder lokal sampai paket npm yang lebih baru dipublikasikan.

    Mulai ulang Gateway setelahnya agar plugin dimuat.

  </Step>
  <Step title="Konfigurasikan penyedia dan webhook">
    Atur konfigurasi di bawah `plugins.entries.voice-call.config` (lihat
    [Konfigurasi](#configuration) di bawah untuk bentuk lengkapnya). Minimal:
    `provider`, kredensial penyedia, `fromNumber`, dan URL webhook yang dapat
    dijangkau secara publik.
  </Step>
  <Step title="Verifikasi penyiapan">
    ```bash
    openclaw voicecall setup
    ```

    Output default dapat dibaca di log chat dan terminal. Ini memeriksa
    pengaktifan plugin, kredensial penyedia, paparan webhook, dan bahwa
    hanya satu mode audio (`streaming` atau `realtime`) yang aktif. Gunakan
    `--json` untuk skrip.

  </Step>
  <Step title="Uji smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Keduanya adalah dry run secara default. Tambahkan `--yes` untuk benar-benar
    melakukan panggilan notifikasi keluar singkat:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Untuk Twilio, Telnyx, dan Plivo, penyiapan harus menghasilkan **URL webhook publik**.
Jika `publicUrl`, URL tunnel, URL Tailscale, atau fallback serve
menghasilkan loopback atau ruang jaringan pribadi, penyiapan gagal alih-alih
memulai penyedia yang tidak dapat menerima webhook operator.
</Warning>

## Konfigurasi

Jika `enabled: true` tetapi penyedia yang dipilih tidak memiliki kredensial,
startup Gateway mencatat peringatan penyiapan-belum-lengkap dengan kunci yang hilang dan
melewati pemulaian runtime. Perintah, panggilan RPC, dan alat agen tetap
mengembalikan konfigurasi penyedia yang hilang secara persis saat digunakan.

<Note>
Kredensial voice-call menerima SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` dan `plugins.entries.voice-call.config.tts.providers.*.apiKey` diselesaikan melalui permukaan SecretRef standar; lihat [permukaan kredensial SecretRef](/id/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan paparan dan keamanan penyedia">
    - Twilio, Telnyx, dan Plivo semuanya memerlukan URL webhook yang **dapat dijangkau secara publik**.
    - `mock` adalah penyedia dev lokal (tanpa panggilan jaringan).
    - Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
    - `skipSignatureVerification` hanya untuk pengujian lokal.
    - Pada tingkat gratis ngrok, atur `publicUrl` ke URL ngrok yang persis; verifikasi tanda tangan selalu diberlakukan.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan tanda tangan tidak valid **hanya** ketika `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Hanya dev lokal.
    - URL tingkat gratis Ngrok dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` bergeser, tanda tangan Twilio gagal. Produksi: pilih domain stabil atau funnel Tailscale.

  </Accordion>
  <Accordion title="Batas koneksi streaming">
    - `streaming.preStartTimeoutMs` menutup soket yang tidak pernah mengirim frame `start` yang valid.
    - `streaming.maxPendingConnections` membatasi total soket pra-start yang belum diautentikasi.
    - `streaming.maxPendingConnectionsPerIp` membatasi soket pra-start yang belum diautentikasi per IP sumber.
    - `streaming.maxConnections` membatasi total soket media stream yang terbuka (pending + aktif).

  </Accordion>
  <Accordion title="Migrasi konfigurasi lama">
    Konfigurasi lama yang menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI
    `streaming.*` lama ditulis ulang oleh `openclaw doctor --fix`.
    Fallback runtime masih menerima kunci voice-call lama untuk saat ini, tetapi
    jalur penulisan ulangnya adalah `openclaw doctor --fix` dan shim kompatibilitas
    bersifat sementara.

    Kunci streaming yang dimigrasikan otomatis:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Percakapan suara realtime

`realtime` memilih penyedia suara realtime dupleks penuh untuk audio panggilan
langsung. Ini terpisah dari `streaming`, yang hanya meneruskan audio ke
penyedia transkripsi realtime.

<Warning>
`realtime.enabled` tidak dapat digabungkan dengan `streaming.enabled`. Pilih satu
mode audio per panggilan.
</Warning>

Perilaku runtime saat ini:

- `realtime.enabled` didukung untuk Twilio Media Streams.
- `realtime.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia suara realtime terdaftar pertama.
- Penyedia suara realtime bawaan: Google Gemini Live (`google`) dan OpenAI (`openai`), didaftarkan oleh plugin penyedianya.
- Konfigurasi mentah milik penyedia berada di bawah `realtime.providers.<providerId>`.
- Voice Call mengekspos alat realtime bersama `openclaw_agent_consult` secara default. Model realtime dapat memanggilnya saat penelepon meminta penalaran yang lebih mendalam, informasi terkini, atau alat OpenClaw normal.
- Jika `realtime.provider` menunjuk ke penyedia yang tidak terdaftar, atau tidak ada penyedia suara realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan melewati media realtime alih-alih menggagalkan seluruh plugin.
- Kunci sesi konsultasi menggunakan kembali sesi suara yang ada saat tersedia, lalu fallback ke nomor telepon penelepon/penerima agar panggilan konsultasi lanjutan tetap memiliki konteks selama panggilan.

### Kebijakan alat

`realtime.toolPolicy` mengontrol eksekusi konsultasi:

| Kebijakan        | Perilaku                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Ekspos alat konsultasi dan batasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`. |
| `owner`          | Ekspos alat konsultasi dan biarkan agen reguler menggunakan kebijakan alat agen normal.                                                  |
| `none`           | Jangan ekspos alat konsultasi. `realtime.tools` kustom tetap diteruskan ke penyedia realtime.                                           |

### Contoh penyedia realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Default: kunci API dari `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, atau `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; voice `Kore`.

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
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
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

  </Tab>
  <Tab title="OpenAI">
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
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Lihat [penyedia Google](/id/providers/google) dan
[penyedia OpenAI](/id/providers/openai) untuk opsi suara realtime khusus penyedia.

## Transkripsi streaming

`streaming` memilih penyedia transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia transkripsi realtime terdaftar pertama.
- Penyedia transkripsi realtime bawaan: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI (`xai`), didaftarkan oleh plugin penyedianya.
- Konfigurasi mentah milik penyedia berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke penyedia yang tidak terdaftar, atau tidak ada yang terdaftar, Voice Call mencatat peringatan dan melewati streaming media alih-alih menggagalkan seluruh plugin.

### Contoh penyedia streaming

<Tabs>
  <Tab title="OpenAI">
    Default: kunci API `streaming.providers.openai.apiKey` atau
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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

  </Tab>
  <Tab title="xAI">
    Default: kunci API `streaming.providers.xai.apiKey` atau `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; laju sampel `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

  </Tab>
</Tabs>

## TTS untuk panggilan

Voice Call menggunakan konfigurasi inti `messages.tts` untuk streaming
ucapan pada panggilan. Anda dapat menimpanya di bawah konfigurasi plugin dengan
**bentuk yang sama** — konfigurasi ini digabungkan secara mendalam dengan `messages.tts`.

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

<Warning>
**Microsoft speech diabaikan untuk panggilan suara.** Audio telepon memerlukan PCM;
transport Microsoft saat ini tidak mengekspos output PCM telepon.
</Warning>

Catatan perilaku:

- Kunci lama `tts.<provider>` di dalam konfigurasi plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang di-commit harus menggunakan `tts.providers.<provider>`.
- TTS inti digunakan saat streaming media Twilio diaktifkan; jika tidak, panggilan akan kembali menggunakan suara native penyedia.
- Jika stream media Twilio sudah aktif, Voice Call tidak kembali ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam keadaan tersebut, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telepon kembali ke penyedia sekunder, Voice Call mencatat peringatan dengan rantai penyedia (`from`, `to`, `attempts`) untuk debugging.
- Saat barge-in Twilio atau pembongkaran stream mengosongkan antrean TTS tertunda, permintaan pemutaran yang mengantre akan diselesaikan alih-alih membuat penelepon menunggu penyelesaian pemutaran tanpa akhir.

### Contoh TTS

<Tabs>
  <Tab title="Core TTS only">
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
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
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
  </Tab>
</Tabs>

## Panggilan masuk

Kebijakan masuk memiliki default `disabled`. Untuk mengaktifkan panggilan masuk, tetapkan:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` adalah penyaringan ID penelepon dengan jaminan rendah. Plugin
menormalkan nilai `From` yang diberikan penyedia dan membandingkannya dengan
`allowFrom`. Verifikasi Webhook mengautentikasi pengiriman penyedia dan
integritas payload, tetapi **tidak** membuktikan kepemilikan nomor penelepon
PSTN/VoIP. Perlakukan `allowFrom` sebagai pemfilteran ID penelepon, bukan identitas
penelepon yang kuat.
</Warning>

Respons otomatis menggunakan sistem agen. Sesuaikan dengan `responseModel`,
`responseSystemPrompt`, dan `responseTimeoutMs`.

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke
prompt sistem:

```text
{"spoken":"..."}
```

Voice Call mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten penalaran/error.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` inline.
- Kembali ke teks biasa dan menghapus paragraf pembuka yang kemungkinan berupa perencanaan/meta.

Ini menjaga pemutaran ucapan tetap berfokus pada teks untuk penelepon dan menghindari
kebocoran teks perencanaan ke audio.

### Perilaku awal percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama dikaitkan dengan status
pemutaran langsung:

- Pengosongan antrean barge-in dan respons otomatis ditekan hanya saat sapaan awal sedang aktif diucapkan.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap dalam antrean untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.
- Barge-in membatalkan pemutaran aktif dan mengosongkan entri TTS Twilio yang mengantre tetapi belum diputar. Entri yang dikosongkan diselesaikan sebagai dilewati, sehingga logika respons lanjutan dapat berlanjut tanpa menunggu audio yang tidak akan pernah diputar.
- Percakapan suara realtime menggunakan giliran pembuka milik stream realtime. Voice Call **tidak** memposting pembaruan TwiML `<Say>` lama untuk pesan awal tersebut, sehingga sesi `<Connect><Stream>` keluar tetap terpasang.

### Masa tenggang pemutusan stream Twilio

Saat stream media Twilio terputus, Voice Call menunggu **2000 ms** sebelum
mengakhiri panggilan secara otomatis:

- Jika stream tersambung kembali selama jendela waktu tersebut, auto-end dibatalkan.
- Jika tidak ada stream yang mendaftar ulang setelah masa tenggang, panggilan diakhiri untuk mencegah panggilan aktif macet.

## Reaper panggilan usang

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima
Webhook terminal (misalnya, panggilan mode notifikasi yang tidak pernah selesai). Nilai default
adalah `0` (dinonaktifkan).

Rentang yang disarankan:

- **Produksi:** `120`–`300` detik untuk alur bergaya notifikasi.
- Pertahankan nilai ini **lebih tinggi dari `maxDurationSeconds`** agar panggilan normal dapat selesai. Titik awal yang baik adalah `maxDurationSeconds + 30–60` detik.

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

Saat proxy atau tunnel berada di depan Gateway, plugin
merekonstruksi URL publik untuk verifikasi tanda tangan. Opsi berikut
mengontrol header penerusan mana yang dipercaya:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Izinkan host dari header penerusan.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Percayai header yang diteruskan tanpa allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Hanya percayai header yang diteruskan saat IP jarak jauh permintaan cocok dengan daftar.
</ParamField>

Perlindungan tambahan:

- **Perlindungan replay** Webhook diaktifkan untuk Twilio dan Plivo. Permintaan Webhook valid yang diputar ulang diakui tetapi dilewati untuk efek samping.
- Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga callback ucapan yang usang/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.
- Permintaan Webhook yang tidak terautentikasi ditolak sebelum pembacaan body saat header tanda tangan yang diwajibkan penyedia tidak ada.
- Webhook voice-call menggunakan profil body pra-autentikasi bersama (64 KB / 5 detik) plus batas in-flight per IP sebelum verifikasi tanda tangan.

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
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari jalur penyimpanan voice-call default.
Gunakan `--file <path>` untuk menunjuk ke log lain dan `--last <n>` untuk membatasi
analisis ke N catatan terakhir (default 200). Output menyertakan p50/p90/p99
untuk latensi giliran dan waktu tunggu-dengar.

## Alat agen

Nama alat: `voice_call`.

| Tindakan        | Argumen                   |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Repo ini menyertakan dokumen skill yang sesuai di `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metode               | Argumen                   |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Terkait

- [Mode bicara](/id/nodes/talk)
- [Teks-ke-ucapan](/id/tools/tts)
- [Voice wake](/id/nodes/voicewake)
