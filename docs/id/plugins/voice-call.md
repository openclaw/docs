---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin voice-call
    - Anda memerlukan suara realtime atau transkripsi streaming di telephony
sidebarTitle: Voice call
summary: Lakukan panggilan suara keluar dan terima panggilan suara masuk melalui Twilio, Telnyx, atau Plivo, dengan suara realtime opsional dan transkripsi streaming
title: Plugin voice call
x-i18n:
    generated_at: "2026-04-26T11:36:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Panggilan suara untuk OpenClaw melalui sebuah Plugin. Mendukung notifikasi keluar,
percakapan multi-giliran, suara realtime full-duplex, transkripsi
streaming, dan panggilan masuk dengan kebijakan allowlist.

**Provider saat ini:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transfer XML + GetInput
speech), `mock` (dev/tanpa jaringan).

<Note>
Plugin Voice Call berjalan **di dalam proses Gateway**. Jika Anda menggunakan
Gateway remote, instal dan konfigurasikan Plugin pada mesin yang menjalankan
Gateway, lalu restart Gateway agar Plugin dimuat.
</Note>

## Mulai cepat

<Steps>
  <Step title="Instal Plugin">
    <Tabs>
      <Tab title="Dari npm (disarankan)">
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

    Restart Gateway setelahnya agar Plugin dimuat.

  </Step>
  <Step title="Konfigurasikan provider dan Webhook">
    Atur config di bawah `plugins.entries.voice-call.config` (lihat
    [Konfigurasi](#configuration) di bawah untuk bentuk lengkap). Minimal:
    `provider`, kredensial provider, `fromNumber`, dan URL Webhook
    yang dapat dijangkau secara publik.
  </Step>
  <Step title="Verifikasi penyiapan">
    ```bash
    openclaw voicecall setup
    ```

    Output default mudah dibaca di log chat dan terminal. Ini memeriksa
    apakah Plugin diaktifkan, kredensial provider, eksposur Webhook, dan
    bahwa hanya satu mode audio (`streaming` atau `realtime`) yang aktif. Gunakan
    `--json` untuk skrip.

  </Step>
  <Step title="Uji smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Keduanya adalah dry run secara default. Tambahkan `--yes` untuk benar-benar melakukan
    panggilan notify keluar singkat:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Untuk Twilio, Telnyx, dan Plivo, penyiapan harus me-resolve ke **URL Webhook publik**.
Jika `publicUrl`, URL tunnel, URL Tailscale, atau fallback serve
me-resolve ke loopback atau ruang jaringan privat, setup akan gagal alih-alih
memulai provider yang tidak dapat menerima Webhook dari carrier.
</Warning>

## Konfigurasi

Jika `enabled: true` tetapi provider yang dipilih kekurangan kredensial,
startup Gateway mencatat peringatan setup-incomplete dengan key yang hilang dan
melewati startup runtime. Perintah, panggilan RPC, dan tool agen tetap
mengembalikan konfigurasi provider yang hilang secara persis saat digunakan.

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
            // Public key Webhook Telnyx dari Mission Control Portal
            // (Base64; juga dapat diatur melalui TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* lihat Transkripsi streaming */ },
          realtime: { enabled: false /* lihat Suara realtime */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan eksposur dan keamanan provider">
    - Twilio, Telnyx, dan Plivo semuanya memerlukan **URL Webhook yang dapat dijangkau secara publik**.
    - `mock` adalah provider dev lokal (tanpa panggilan jaringan).
    - Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
    - `skipSignatureVerification` hanya untuk pengujian lokal.
    - Pada tier gratis ngrok, atur `publicUrl` ke URL ngrok yang persis; verifikasi signature selalu diberlakukan.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan Webhook Twilio dengan signature tidak valid **hanya** saat `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Hanya untuk dev lokal.
    - URL ngrok tier gratis dapat berubah atau menambahkan perilaku interstitial; jika `publicUrl` bergeser, signature Twilio gagal. Untuk produksi: pilih domain stabil atau funnel Tailscale.

  </Accordion>
  <Accordion title="Batas koneksi streaming">
    - `streaming.preStartTimeoutMs` menutup socket yang tidak pernah mengirim frame `start` yang valid.
    - `streaming.maxPendingConnections` membatasi total socket pra-start yang belum diautentikasi.
    - `streaming.maxPendingConnectionsPerIp` membatasi socket pra-start yang belum diautentikasi per IP sumber.
    - `streaming.maxConnections` membatasi total socket media stream yang terbuka (tertunda + aktif).

  </Accordion>
  <Accordion title="Migrasi config lama">
    Config lama yang menggunakan `provider: "log"`, `twilio.from`, atau key OpenAI `streaming.*`
    lama ditulis ulang oleh `openclaw doctor --fix`.
    Fallback runtime masih menerima key voice-call lama untuk sementara,
    tetapi jalur penulisan ulangnya adalah `openclaw doctor --fix` dan
    shim kompatibilitas ini bersifat sementara.

    Key streaming yang dimigrasikan otomatis:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Percakapan suara realtime

`realtime` memilih provider suara realtime full-duplex untuk audio panggilan
langsung. Ini terpisah dari `streaming`, yang hanya meneruskan audio ke
provider transkripsi realtime.

<Warning>
`realtime.enabled` tidak dapat digabungkan dengan `streaming.enabled`. Pilih satu
mode audio per panggilan.
</Warning>

Perilaku runtime saat ini:

- `realtime.enabled` didukung untuk Twilio Media Streams.
- `realtime.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan provider suara realtime terdaftar pertama.
- Provider suara realtime bawaan: Google Gemini Live (`google`) dan OpenAI (`openai`), didaftarkan oleh Plugin provider mereka.
- Config mentah milik provider berada di bawah `realtime.providers.<providerId>`.
- Voice Call mengekspos tool realtime bersama `openclaw_agent_consult` secara default. Model realtime dapat memanggilnya ketika penelepon meminta reasoning yang lebih mendalam, informasi terkini, atau tool OpenClaw biasa.
- Jika `realtime.provider` menunjuk ke provider yang tidak terdaftar, atau tidak ada provider suara realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan melewati media realtime alih-alih menggagalkan seluruh Plugin.
- Key sesi consult menggunakan kembali sesi suara yang ada bila tersedia, lalu fallback ke nomor telepon penelepon/penerima sehingga panggilan consult lanjutan tetap menjaga konteks selama panggilan.

### Kebijakan tool

`realtime.toolPolicy` mengendalikan run consult:

| Kebijakan        | Perilaku                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Mengekspos tool consult dan membatasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`. |
| `owner`          | Mengekspos tool consult dan membiarkan agen reguler menggunakan kebijakan tool agen normal.                                              |
| `none`           | Jangan mengekspos tool consult. `realtime.tools` kustom tetap diteruskan ke provider realtime.                                          |

### Contoh provider realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Default: API key dari `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, atau `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; suara `Kore`.

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
                instructions: "Berbicaralah singkat. Panggil openclaw_agent_consult sebelum menggunakan tool yang lebih dalam.",
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

Lihat [provider Google](/id/providers/google) dan
[provider OpenAI](/id/providers/openai) untuk opsi suara realtime yang
khusus provider.

## Transkripsi streaming

`streaming` memilih provider transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan provider transkripsi realtime terdaftar pertama.
- Provider transkripsi realtime bawaan: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI (`xai`), didaftarkan oleh Plugin provider mereka.
- Config mentah milik provider berada di bawah `streaming.providers.<providerId>`.
- Jika `streaming.provider` menunjuk ke provider yang tidak terdaftar, atau tidak ada yang terdaftar, Voice Call mencatat peringatan dan melewati media streaming alih-alih menggagalkan seluruh Plugin.

### Contoh provider streaming

<Tabs>
  <Tab title="OpenAI">
    Default: API key `streaming.providers.openai.apiKey` atau
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

  </Tab>
  <Tab title="xAI">
    Default: API key `streaming.providers.xai.apiKey` atau `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; sample rate `8000`;
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

  </Tab>
</Tabs>

## TTS untuk panggilan

Voice Call menggunakan konfigurasi core `messages.tts` untuk streaming
ucapan pada panggilan. Anda dapat mengoverride-nya di bawah config Plugin dengan
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

<Warning>
**Ucapan Microsoft diabaikan untuk panggilan suara.** Audio telephony memerlukan PCM;
transport Microsoft saat ini tidak mengekspos output PCM untuk telephony.
</Warning>

Catatan perilaku:

- Key lama `tts.<provider>` di dalam config Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) diperbaiki oleh `openclaw doctor --fix`; config yang di-commit harus menggunakan `tts.providers.<provider>`.
- Core TTS digunakan ketika Twilio media streaming diaktifkan; jika tidak, panggilan fallback ke suara native milik provider.
- Jika media stream Twilio sudah aktif, Voice Call tidak fallback ke TwiML `<Say>`. Jika TTS telephony tidak tersedia dalam keadaan itu, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telephony fallback ke provider sekunder, Voice Call mencatat peringatan dengan rantai provider (`from`, `to`, `attempts`) untuk debugging.
- Saat barge-in atau stream teardown Twilio membersihkan antrean TTS yang tertunda, permintaan pemutaran yang diantrekan diselesaikan alih-alih membuat penelepon menunggu tanpa akhir hingga pemutaran selesai.

### Contoh TTS

<Tabs>
  <Tab title="Hanya core TTS">
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
  <Tab title="Override ke ElevenLabs (hanya panggilan)">
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
  <Tab title="Override model OpenAI (deep-merge)">
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

Kebijakan masuk secara default adalah `disabled`. Untuk mengaktifkan panggilan masuk, atur:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Halo! Ada yang bisa saya bantu?",
}
```

<Warning>
`inboundPolicy: "allowlist"` adalah penyaringan caller-ID dengan tingkat jaminan rendah. Plugin
menormalkan nilai `From` yang diberikan provider dan membandingkannya dengan
`allowFrom`. Verifikasi Webhook mengautentikasi pengiriman provider dan
integritas payload, tetapi **tidak** membuktikan kepemilikan nomor penelepon PSTN/VoIP.
Perlakukan `allowFrom` sebagai pemfilter caller-ID, bukan identitas penelepon yang kuat.
</Warning>

Respons otomatis menggunakan sistem agen. Atur dengan `responseModel`,
`responseSystemPrompt`, dan `responseTimeoutMs`.

### Kontrak output lisan

Untuk respons otomatis, Voice Call menambahkan kontrak output lisan yang ketat ke
system prompt:

```text
{"spoken":"..."}
```

Voice Call mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten reasoning/error.
- Mem-parse JSON langsung, JSON dalam fenced block, atau key `"spoken"` inline.
- Fallback ke teks biasa dan menghapus paragraf pembuka yang tampak seperti planning/meta.

Ini menjaga pemutaran lisan tetap fokus pada teks yang ditujukan ke penelepon dan menghindari
kebocoran teks perencanaan ke audio.

### Perilaku startup percakapan

Untuk panggilan keluar `conversation`, penanganan pesan pertama terkait dengan status
pemutaran live:

- Pengosongan antrean barge-in dan respons otomatis ditekan hanya saat salam awal sedang aktif berbicara.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap diantrekan untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terkoneksi tanpa penundaan tambahan.
- Barge-in membatalkan pemutaran aktif dan membersihkan entri TTS Twilio yang sudah diantrekan tetapi belum mulai diputar. Entri yang dibersihkan diselesaikan sebagai skipped, sehingga logika respons lanjutan dapat terus berjalan tanpa menunggu audio yang tidak akan pernah diputar.
- Percakapan suara realtime menggunakan giliran pembukaan milik stream realtime itu sendiri. Voice Call **tidak** memposting pembaruan TwiML `<Say>` lama untuk pesan awal itu, sehingga sesi keluar `<Connect><Stream>` tetap terpasang.

### Grace saat stream Twilio terputus

Saat media stream Twilio terputus, Voice Call menunggu **2000 ms** sebelum
mengakhiri panggilan secara otomatis:

- Jika stream terhubung kembali dalam jendela itu, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang terdaftar ulang setelah masa grace, panggilan diakhiri untuk mencegah panggilan aktif yang macet.

## Pembersih panggilan stale

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima
Webhook terminal (misalnya panggilan mode notify yang tidak pernah selesai). Default
adalah `0` (nonaktif).

Rentang yang disarankan:

- **Produksi:** `120`–`300` detik untuk alur bergaya notify.
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

Saat proxy atau tunnel berada di depan Gateway, Plugin
merekonstruksi URL publik untuk verifikasi signature. Opsi ini
mengendalikan header forwarded mana yang dipercaya:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist host dari header forwarding.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Percayai header forwarded tanpa allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Percayai header forwarded hanya saat IP remote permintaan cocok dengan daftar.
</ParamField>

Perlindungan tambahan:

- Perlindungan **replay Webhook** diaktifkan untuk Twilio dan Plivo. Permintaan Webhook valid yang diputar ulang akan diakui tetapi dilewati untuk efek samping.
- Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga callback ucapan yang stale/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.
- Permintaan Webhook yang tidak diautentikasi ditolak sebelum body dibaca ketika header signature yang diwajibkan provider tidak ada.
- Webhook voice-call menggunakan profil body pre-auth bersama (64 KB / 5 detik) ditambah batas in-flight per-IP sebelum verifikasi signature.

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Halo dari OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias untuk call
openclaw voicecall continue --call-id <id> --message "Ada pertanyaan?"
openclaw voicecall speak --call-id <id> --message "Sebentar ya"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # ringkas latensi giliran dari log
openclaw voicecall expose --mode funnel
```

`latency` membaca `calls.jsonl` dari path penyimpanan voice-call default.
Gunakan `--file <path>` untuk menunjuk ke log lain dan `--last <n>` untuk membatasi
analisis ke N catatan terakhir (default 200). Output mencakup p50/p90/p99
untuk latensi giliran dan waktu tunggu listening.

## Tool agen

Nama tool: `voice_call`.

| Aksi            | Arg                       |
| ---------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Repo ini menyertakan dokumen skill yang cocok di `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metode              | Arg                       |
| ------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Terkait

- [Mode talk](/id/nodes/talk)
- [Text-to-speech](/id/tools/tts)
- [Voice wake](/id/nodes/voicewake)
