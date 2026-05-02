---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin panggilan suara
    - Anda memerlukan suara waktu nyata atau transkripsi streaming untuk telefoni
sidebarTitle: Voice call
summary: Lakukan panggilan suara keluar dan terima panggilan suara masuk melalui Twilio, Telnyx, atau Plivo, dengan opsi suara waktu nyata dan transkripsi aliran langsung.
title: Plugin panggilan suara
x-i18n:
    generated_at: "2026-05-02T20:59:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Panggilan suara untuk OpenClaw melalui Plugin. Mendukung notifikasi keluar,
percakapan multi-giliran, suara realtime full-duplex, transkripsi
streaming, dan panggilan masuk dengan kebijakan allowlist.

**Penyedia saat ini:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transfer XML + speech
GetInput), `mock` (dev/tanpa jaringan).

<Note>
Plugin Voice Call berjalan **di dalam proses Gateway**. Jika Anda menggunakan
Gateway jarak jauh, instal dan konfigurasikan Plugin di mesin yang menjalankan
Gateway, lalu mulai ulang Gateway untuk memuatnya.
</Note>

## Mulai cepat

<Steps>
  <Step title="Instal Plugin">
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
    terpaket saat ini atau jalur folder lokal sampai paket npm yang lebih baru diterbitkan.

    Mulai ulang Gateway setelahnya agar Plugin dimuat.

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
    pengaktifan Plugin, kredensial penyedia, eksposur webhook, dan bahwa
    hanya satu mode audio (`streaming` atau `realtime`) yang aktif. Gunakan
    `--json` untuk skrip.

  </Step>
  <Step title="Uji smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Keduanya adalah dry run secara default. Tambahkan `--yes` untuk benar-benar melakukan panggilan
    notifikasi keluar singkat:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Untuk Twilio, Telnyx, dan Plivo, penyiapan harus menghasilkan **URL webhook publik**.
Jika `publicUrl`, URL tunnel, URL Tailscale, atau fallback serve
menghasilkan loopback atau ruang jaringan privat, penyiapan gagal alih-alih
memulai penyedia yang tidak dapat menerima webhook operator.
</Warning>

## Konfigurasi

Jika `enabled: true` tetapi penyedia yang dipilih tidak memiliki kredensial,
startup Gateway mencatat peringatan penyiapan-belum-lengkap dengan kunci yang hilang dan
melewati startup runtime. Perintah, panggilan RPC, dan alat agen tetap
mengembalikan konfigurasi penyedia yang hilang secara persis saat digunakan.

<Note>
Kredensial voice-call menerima SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, dan `plugins.entries.voice-call.config.tts.providers.*.apiKey` diselesaikan melalui permukaan SecretRef standar; lihat [Permukaan kredensial SecretRef](/id/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
  <Accordion title="Catatan eksposur dan keamanan penyedia">
    - Twilio, Telnyx, dan Plivo semuanya memerlukan URL webhook yang **dapat dijangkau secara publik**.
    - `mock` adalah penyedia dev lokal (tanpa panggilan jaringan).
    - Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
    - `skipSignatureVerification` hanya untuk pengujian lokal.
    - Pada tingkat gratis ngrok, atur `publicUrl` ke URL ngrok yang persis; verifikasi tanda tangan selalu diberlakukan.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan webhook Twilio dengan tanda tangan tidak valid **hanya** saat `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Hanya untuk dev lokal.
    - URL tingkat gratis Ngrok dapat berubah atau menambahkan perilaku interstitial; jika `publicUrl` bergeser, tanda tangan Twilio gagal. Produksi: sebaiknya gunakan domain stabil atau funnel Tailscale.

  </Accordion>
  <Accordion title="Batas koneksi streaming">
    - `streaming.preStartTimeoutMs` menutup soket yang tidak pernah mengirim frame `start` yang valid.
    - `streaming.maxPendingConnections` membatasi total soket pra-start yang tidak terautentikasi.
    - `streaming.maxPendingConnectionsPerIp` membatasi soket pra-start yang tidak terautentikasi per IP sumber.
    - `streaming.maxConnections` membatasi total soket stream media terbuka (pending + aktif).

  </Accordion>
  <Accordion title="Migrasi konfigurasi lama">
    Konfigurasi lama yang menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI
    `streaming.*` lama ditulis ulang oleh `openclaw doctor --fix`.
    Fallback runtime masih menerima kunci voice-call lama untuk saat ini, tetapi
    jalur penulisan ulangnya adalah `openclaw doctor --fix` dan shim kompatibilitasnya
    bersifat sementara.

    Kunci streaming yang dimigrasikan otomatis:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Cakupan sesi

Secara default, Voice Call menggunakan `sessionScope: "per-phone"` sehingga panggilan berulang dari
pemanggil yang sama mempertahankan memori percakapan. Atur `sessionScope: "per-call"` saat
setiap panggilan operator harus dimulai dengan konteks baru, misalnya alur resepsionis,
pemesanan, IVR, atau bridge Google Meet ketika nomor telepon yang sama dapat
merepresentasikan rapat yang berbeda.

## Percakapan suara realtime

`realtime` memilih penyedia suara realtime full-duplex untuk audio panggilan
langsung. Ini terpisah dari `streaming`, yang hanya meneruskan audio ke
penyedia transkripsi realtime.

<Warning>
`realtime.enabled` tidak dapat digabungkan dengan `streaming.enabled`. Pilih satu
mode audio per panggilan.
</Warning>

Perilaku runtime saat ini:

- `realtime.enabled` didukung untuk Twilio Media Streams.
- `realtime.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia suara realtime terdaftar pertama.
- Penyedia suara realtime bawaan: Google Gemini Live (`google`) dan OpenAI (`openai`), didaftarkan oleh Plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `realtime.providers.<providerId>`.
- Voice Call mengekspos alat realtime bersama `openclaw_agent_consult` secara default. Model realtime dapat memanggilnya saat pemanggil meminta penalaran lebih mendalam, informasi terkini, atau alat OpenClaw normal.
- `realtime.fastContext.enabled` nonaktif secara default. Saat diaktifkan, Voice Call terlebih dahulu mencari konteks memori/sesi terindeks untuk pertanyaan konsultasi dan mengembalikan cuplikan tersebut ke model realtime dalam `realtime.fastContext.timeoutMs` sebelum fallback ke agen konsultasi penuh hanya jika `realtime.fastContext.fallbackToConsult` bernilai true.
- Jika `realtime.provider` menunjuk ke penyedia yang tidak terdaftar, atau tidak ada penyedia suara realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan melewati media realtime alih-alih menggagalkan seluruh Plugin.
- Kunci sesi konsultasi menggunakan ulang sesi panggilan tersimpan jika tersedia, lalu fallback ke `sessionScope` yang dikonfigurasi (`per-phone` secara default, atau `per-call` untuk panggilan terisolasi).

### Kebijakan alat

`realtime.toolPolicy` mengontrol run konsultasi:

| Kebijakan        | Perilaku                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Ekspos alat konsultasi dan batasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`. |
| `owner`          | Ekspos alat konsultasi dan izinkan agen reguler menggunakan kebijakan alat agen normal.                                                |
| `none`           | Jangan ekspos alat konsultasi. `realtime.tools` kustom tetap diteruskan ke penyedia realtime.                                         |

### Contoh penyedia realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Default: kunci API dari `realtime.providers.google.apiKey`,
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

Lihat [Penyedia Google](/id/providers/google) dan
[Penyedia OpenAI](/id/providers/openai) untuk opsi suara realtime khusus penyedia.

## Transkripsi streaming

`streaming` memilih penyedia transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak diatur, Voice Call menggunakan penyedia transkripsi realtime terdaftar pertama.
- Penyedia transkripsi realtime bawaan: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI (`xai`), yang didaftarkan oleh plugin penyedianya.
- Konfigurasi mentah milik penyedia berada di bawah `streaming.providers.<providerId>`.
- Setelah Twilio mengirim pesan `start` stream yang diterima, Voice Call segera mendaftarkan stream, mengantrekan media masuk melalui penyedia transkripsi saat penyedia terhubung, dan memulai sapaan awal hanya setelah transkripsi realtime siap.
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
transport Microsoft saat ini tidak mengekspos keluaran PCM telepon.
</Warning>

Catatan perilaku:

- Kunci lama `tts.<provider>` di dalam konfigurasi plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang dikomit sebaiknya menggunakan `tts.providers.<provider>`.
- TTS inti digunakan saat streaming media Twilio diaktifkan; jika tidak, panggilan kembali menggunakan suara bawaan penyedia.
- Jika stream media Twilio sudah aktif, Voice Call tidak kembali ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam keadaan tersebut, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telepon kembali ke penyedia sekunder, Voice Call mencatat peringatan dengan rantai penyedia (`from`, `to`, `attempts`) untuk debugging.
- Saat barge-in Twilio atau pembongkaran stream membersihkan antrean TTS tertunda, permintaan pemutaran yang diantrekan diselesaikan alih-alih membuat penelepon menunggu penyelesaian pemutaran.

### Contoh TTS

<Tabs>
  <Tab title="Hanya TTS inti">
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
  <Tab title="Timpa ke ElevenLabs (hanya panggilan)">
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
  <Tab title="Timpa model OpenAI (gabung mendalam)">
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

Kebijakan masuk default adalah `disabled`. Untuk mengaktifkan panggilan masuk, atur:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` adalah penyaringan caller-ID dengan jaminan rendah. Plugin
menormalisasi nilai `From` yang disediakan penyedia dan membandingkannya dengan
`allowFrom`. Verifikasi Webhook mengautentikasi pengiriman penyedia dan
integritas payload, tetapi **tidak** membuktikan kepemilikan nomor penelepon
PSTN/VoIP. Perlakukan `allowFrom` sebagai pemfilteran caller-ID, bukan identitas
penelepon yang kuat.
</Warning>

Respons otomatis menggunakan sistem agen. Sesuaikan dengan `responseModel`,
`responseSystemPrompt`, dan `responseTimeoutMs`.

### Perutean per nomor

Gunakan `numbers` saat satu plugin Voice Call menerima panggilan untuk beberapa nomor
telepon dan setiap nomor harus berperilaku seperti saluran yang berbeda. Misalnya, satu
nomor dapat menggunakan asisten pribadi kasual, sementara nomor lain menggunakan persona
bisnis, agen respons yang berbeda, dan suara TTS yang berbeda.

Rute dipilih dari nomor `To` yang ditelepon dan disediakan penyedia. Kunci harus berupa
nomor E.164. Saat panggilan masuk, Voice Call menyelesaikan rute yang cocok satu kali,
menyimpan rute yang cocok pada catatan panggilan, dan menggunakan ulang konfigurasi efektif
tersebut untuk sapaan, jalur respons otomatis klasik, jalur konsultasi realtime, dan
pemutaran TTS. Jika tidak ada rute yang cocok, konfigurasi global Voice Call digunakan.
Panggilan keluar tidak menggunakan `numbers`; teruskan target keluar, pesan, dan
sesi secara eksplisit saat memulai panggilan.

Timpa rute saat ini mendukung:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Nilai rute `tts` digabungkan secara mendalam di atas konfigurasi `tts` Voice Call global, sehingga
biasanya Anda cukup menimpa suara penyedia:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Kontrak keluaran lisan

Untuk respons otomatis, Voice Call menambahkan kontrak keluaran lisan yang ketat ke
prompt sistem:

```text
{"spoken":"..."}
```

Voice Call mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten penalaran/kesalahan.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` inline.
- Kembali ke teks biasa dan menghapus paragraf pembuka yang kemungkinan berupa perencanaan/meta.

Ini menjaga pemutaran ucapan tetap berfokus pada teks untuk penelepon dan menghindari
bocornya teks perencanaan ke audio.

### Perilaku awal percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terikat pada status
pemutaran langsung:

- Pembersihan antrean barge-in dan respons otomatis hanya ditekan saat sapaan awal sedang aktif berbicara.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap diantrekan untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream terhubung tanpa penundaan tambahan.
- Barge-in membatalkan pemutaran aktif dan membersihkan entri TTS Twilio yang diantrekan tetapi belum diputar. Entri yang dibersihkan diselesaikan sebagai dilewati, sehingga logika respons lanjutan dapat berlanjut tanpa menunggu audio yang tidak akan pernah diputar.
- Percakapan suara realtime menggunakan giliran pembuka milik stream realtime sendiri. Voice Call **tidak** memposting pembaruan TwiML `<Say>` lama untuk pesan awal tersebut, sehingga sesi `<Connect><Stream>` keluar tetap terpasang.

### Masa tenggang pemutusan stream Twilio

Saat stream media Twilio terputus, Voice Call menunggu **2000 ms** sebelum
mengakhiri panggilan secara otomatis:

- Jika stream terhubung kembali selama jendela tersebut, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang mendaftar ulang setelah masa tenggang, panggilan diakhiri untuk mencegah panggilan aktif macet.

## Pembersih panggilan usang

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima Webhook
terminal (misalnya, panggilan mode notifikasi yang tidak pernah selesai). Default
adalah `0` (dinonaktifkan).

Rentang yang direkomendasikan:

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
merekonstruksi URL publik untuk verifikasi tanda tangan. Opsi ini
mengontrol header terusan mana yang dipercaya:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist host dari header penerusan.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Percayai header terusan tanpa allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Percayai header terusan hanya saat IP jarak jauh permintaan cocok dengan daftar.
</ParamField>

Perlindungan tambahan:

- **Perlindungan replay** Webhook diaktifkan untuk Twilio dan Plivo. Permintaan Webhook valid yang diulang diakui tetapi dilewati untuk efek samping.
- Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga callback ucapan yang usang/diulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.
- Permintaan Webhook yang tidak terautentikasi ditolak sebelum pembacaan body saat header tanda tangan yang diperlukan penyedia tidak ada.
- Webhook voice-call menggunakan profil body pra-autentikasi bersama (64 KB / 5 detik) ditambah batas in-flight per IP sebelum verifikasi tanda tangan.

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

Saat Gateway sudah berjalan, perintah operasional `voicecall` mendelegasikan
ke runtime voice-call milik Gateway sehingga CLI tidak mengikat server
Webhook kedua. Jika tidak ada Gateway yang dapat dijangkau, perintah kembali ke
runtime CLI mandiri.

`latency` membaca `calls.jsonl` dari jalur penyimpanan panggilan suara default.
Gunakan `--file <path>` untuk mengarah ke log lain dan `--last <n>` untuk membatasi
analisis ke N rekaman terakhir (default 200). Output menyertakan p50/p90/p99
untuk latensi giliran dan waktu tunggu-dengar.

## Alat agen

Nama alat: `voice_call`.

| Tindakan        | Argumen                                    |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Repo ini menyertakan dokumen skill yang sesuai di `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metode              | Argumen                                    |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` hanya valid dengan `mode: "conversation"`. Panggilan mode-notifikasi
harus menggunakan `voicecall.dtmf` setelah panggilan ada jika memerlukan digit
pasca-koneksi.

## Pemecahan masalah

### Penyiapan gagal mengekspos Webhook

Jalankan penyiapan dari lingkungan yang sama dengan yang menjalankan Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Untuk `twilio`, `telnyx`, dan `plivo`, `webhook-exposure` harus hijau. `publicUrl`
yang dikonfigurasi tetap gagal saat mengarah ke ruang jaringan lokal atau privat,
karena operator tidak dapat memanggil balik ke alamat tersebut. Jangan gunakan
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, atau `fd00::/8` sebagai `publicUrl`.

Panggilan keluar mode-notifikasi Twilio mengirim TwiML `<Say>` awalnya langsung
dalam permintaan create-call, sehingga pesan lisan pertama tidak bergantung pada
Twilio yang mengambil TwiML Webhook. Webhook publik tetap diperlukan untuk callback
status, panggilan percakapan, DTMF pra-koneksi, stream realtime, dan kontrol
panggilan pasca-koneksi.

Gunakan satu jalur eksposur publik:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Setelah mengubah konfigurasi, mulai ulang atau muat ulang Gateway, lalu jalankan:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` adalah dry run kecuali Anda meneruskan `--yes`.

### Kredensial penyedia gagal

Periksa penyedia yang dipilih dan bidang kredensial yang diperlukan:

- Twilio: `twilio.accountSid`, `twilio.authToken`, dan `fromNumber`, atau
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, dan `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, dan
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, dan `fromNumber`.

Kredensial harus ada di host Gateway. Mengedit profil shell lokal tidak
memengaruhi Gateway yang sudah berjalan hingga Gateway dimulai ulang atau memuat
ulang lingkungannya.

### Panggilan dimulai tetapi Webhook penyedia tidak tiba

Pastikan konsol penyedia mengarah ke URL Webhook publik yang tepat:

```text
https://voice.example.com/voice/webhook
```

Lalu periksa status runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Penyebab umum:

- `publicUrl` mengarah ke jalur yang berbeda dari `serve.path`.
- URL tunnel berubah setelah Gateway dimulai.
- Proxy meneruskan permintaan tetapi menghapus atau menulis ulang header host/proto.
- Firewall atau DNS merutekan hostname publik ke tempat selain Gateway.
- Gateway dimulai ulang tanpa Plugin Voice Call diaktifkan.

Saat reverse proxy atau tunnel berada di depan Gateway, atur
`webhookSecurity.allowedHosts` ke hostname publik, atau gunakan
`webhookSecurity.trustedProxyIPs` untuk alamat proxy yang diketahui. Gunakan
`webhookSecurity.trustForwardingHeaders` hanya saat batas proxy berada di bawah
kendali Anda.

### Verifikasi tanda tangan gagal

Tanda tangan penyedia diperiksa terhadap URL publik yang direkonstruksi OpenClaw
dari permintaan masuk. Jika tanda tangan gagal:

- Pastikan URL Webhook penyedia sama persis dengan `publicUrl`, termasuk
  skema, host, dan jalur.
- Untuk URL tingkat gratis ngrok, perbarui `publicUrl` saat hostname tunnel berubah.
- Pastikan proxy mempertahankan header host dan proto asli, atau konfigurasikan
  `webhookSecurity.allowedHosts`.
- Jangan aktifkan `skipSignatureVerification` di luar pengujian lokal.

### Bergabung Google Meet melalui Twilio gagal

Google Meet menggunakan Plugin ini untuk bergabung melalui dial-in Twilio. Pertama, verifikasi Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Lalu verifikasi transport Google Meet secara eksplisit:

```bash
openclaw googlemeet setup --transport twilio
```

Jika Voice Call hijau tetapi peserta Meet tidak pernah bergabung, periksa nomor
dial-in Meet, PIN, dan `--dtmf-sequence`. Panggilan telepon dapat sehat sementara
rapat menolak atau mengabaikan urutan DTMF yang salah.

Google Meet meneruskan urutan DTMF Meet dan teks intro ke `voicecall.start`.
Untuk panggilan Twilio, Voice Call menyajikan TwiML DTMF terlebih dahulu,
mengalihkan kembali ke Webhook, lalu membuka stream media realtime sehingga intro
yang tersimpan dibuat setelah peserta telepon bergabung ke rapat.

Gunakan `openclaw logs --follow` untuk jejak fase langsung. Bergabung Twilio Meet
yang sehat mencatat urutan ini:

- Google Meet mendelegasikan bergabung Twilio ke Voice Call.
- Voice Call menyimpan TwiML DTMF pra-koneksi.
- TwiML awal Twilio dikonsumsi dan disajikan sebelum penanganan realtime.
- Voice Call menyajikan TwiML realtime untuk panggilan Twilio.
- Bridge realtime dimulai dengan salam awal yang diantrekan.

`openclaw voicecall tail` tetap menampilkan rekaman panggilan yang dipersistenkan; ini berguna untuk
status panggilan dan transkrip, tetapi tidak setiap transisi Webhook/realtime muncul
di sana.

### Panggilan realtime tidak memiliki ucapan

Pastikan hanya satu mode audio yang diaktifkan. `realtime.enabled` dan
`streaming.enabled` tidak dapat sama-sama bernilai true.

Untuk panggilan realtime Twilio, verifikasi juga:

- Plugin penyedia realtime dimuat dan terdaftar.
- `realtime.provider` tidak diatur atau menyebut penyedia terdaftar.
- Kunci API penyedia tersedia untuk proses Gateway.
- `openclaw logs --follow` menampilkan TwiML realtime disajikan, bridge realtime
  dimulai, dan salam awal diantrekan.

## Terkait

- [Mode bicara](/id/nodes/talk)
- [Teks-ke-ucapan](/id/tools/tts)
- [Bangun suara](/id/nodes/voicewake)
