---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin panggilan suara
    - Anda membutuhkan suara waktu nyata atau transkripsi streaming pada telefoni
sidebarTitle: Voice call
summary: Lakukan panggilan suara keluar dan terima panggilan suara masuk melalui Twilio, Telnyx, atau Plivo, dengan suara realtime dan transkripsi streaming opsional
title: Plugin panggilan suara
x-i18n:
    generated_at: "2026-06-27T18:01:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

Panggilan suara untuk OpenClaw melalui sebuah Plugin. Mendukung notifikasi keluar,
percakapan multi-giliran, suara realtime full-duplex, transkripsi
streaming, dan panggilan masuk dengan kebijakan allowlist.

**Penyedia saat ini:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/tanpa jaringan).

<Note>
Plugin Voice Call berjalan **di dalam proses Gateway**. Jika Anda menggunakan
Gateway jarak jauh, instal dan konfigurasikan Plugin pada mesin yang menjalankan
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

    Gunakan paket tanpa versi untuk mengikuti tag rilis resmi saat ini. Pin
    versi persis hanya saat Anda membutuhkan instalasi yang dapat direproduksi.

    Mulai ulang Gateway setelahnya agar Plugin dimuat.

  </Step>
  <Step title="Konfigurasikan penyedia dan Webhook">
    Tetapkan konfigurasi di bawah `plugins.entries.voice-call.config` (lihat
    [Konfigurasi](#configuration) di bawah untuk bentuk lengkapnya). Minimal:
    `provider`, kredensial penyedia, `fromNumber`, dan URL Webhook yang dapat
    dijangkau publik.
  </Step>
  <Step title="Verifikasi setup">
    ```bash
    openclaw voicecall setup
    ```

    Output bawaan dapat dibaca di log chat dan terminal. Ini memeriksa
    pengaktifan Plugin, kredensial penyedia, paparan Webhook, dan memastikan
    hanya satu mode audio (`streaming` atau `realtime`) yang aktif. Gunakan
    `--json` untuk skrip.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Keduanya adalah dry run secara bawaan. Tambahkan `--yes` untuk benar-benar
    melakukan panggilan notifikasi keluar singkat:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Untuk Twilio, Telnyx, dan Plivo, setup harus menghasilkan **URL Webhook publik**.
Jika `publicUrl`, URL tunnel, URL Tailscale, atau fallback serve
menghasilkan loopback atau ruang jaringan privat, setup akan gagal alih-alih
memulai penyedia yang tidak dapat menerima Webhook operator.
</Warning>

## Konfigurasi

Jika `enabled: true` tetapi penyedia yang dipilih tidak memiliki kredensial,
startup Gateway mencatat peringatan setup-belum-lengkap dengan kunci yang hilang dan
melewati startup runtime. Perintah, panggilan RPC, dan tool agen tetap
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Catatan paparan dan keamanan penyedia">
    - Twilio, Telnyx, dan Plivo semuanya membutuhkan URL Webhook yang **dapat dijangkau publik**.
    - `mock` adalah penyedia dev lokal (tanpa panggilan jaringan).
    - Telnyx membutuhkan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
    - `skipSignatureVerification` hanya untuk pengujian lokal.
    - Pada tier gratis ngrok, tetapkan `publicUrl` ke URL ngrok yang persis; verifikasi tanda tangan selalu diberlakukan.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan Webhook Twilio dengan tanda tangan tidak valid **hanya** saat `tunnel.provider="ngrok"` dan `serve.bind` adalah loopback (agen lokal ngrok). Hanya untuk dev lokal.
    - URL tier gratis Ngrok dapat berubah atau menambahkan perilaku interstitial; jika `publicUrl` bergeser, tanda tangan Twilio gagal. Produksi: pilih domain stabil atau funnel Tailscale.

  </Accordion>
  <Accordion title="Batas koneksi streaming">
    - `streaming.preStartTimeoutMs` menutup soket yang tidak pernah mengirim frame `start` yang valid.
    - `streaming.maxPendingConnections` membatasi total soket pra-start yang belum terautentikasi.
    - `streaming.maxPendingConnectionsPerIp` membatasi soket pra-start yang belum terautentikasi per IP sumber.
    - `streaming.maxConnections` membatasi total soket media stream yang terbuka (tertunda + aktif).

  </Accordion>
  <Accordion title="Migrasi konfigurasi legacy">
    Konfigurasi lama yang menggunakan `provider: "log"`, `twilio.from`, atau kunci OpenAI
    `streaming.*` legacy ditulis ulang oleh `openclaw doctor --fix`.
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

Secara bawaan, Voice Call menggunakan `sessionScope: "per-phone"` sehingga panggilan berulang dari
penelepon yang sama mempertahankan memori percakapan. Tetapkan `sessionScope: "per-call"` saat
setiap panggilan operator harus dimulai dengan konteks baru, misalnya alur resepsionis,
pemesanan, IVR, atau bridge Google Meet saat nomor telepon yang sama mungkin
mewakili rapat yang berbeda.

Voice Call menyimpan kunci sesi yang dihasilkan di bawah namespace agen yang dikonfigurasi
(`agent:<agentId>:voice:*`) sehingga memori panggilan bertahan melewati kanonikalisasi
kunci sesi Gateway setelah restart. Kunci integrasi eksplisit mentah menggunakan
namespace agen yang sama. Kunci kanonis `agent:<configuredAgentId>:*` mempertahankan pemilik itu,
dan alias utamanya menghormati `session.mainKey` inti dan cakupan global. Input
`agent:*` asing atau salah bentuk dicakup sebagai kunci buram di bawah agen yang dikonfigurasi;
`global` dan `unknown` tetap menjadi sentinel global. Startup Gateway mempromosikan kunci
mentah lama di store bawaan atau bertemplat `{agentId}` saat path membuktikan satu
pemilik. Pada store kustom tetap, baris legacy yang ambigu dibiarkan tidak tersentuh karena
tidak berisi cukup informasi untuk memilih pemilik; panggilan baru menggunakan
riwayat kanonis bercakupan agen.

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
- `realtime.provider` bersifat opsional. Jika tidak ditetapkan, Voice Call menggunakan penyedia suara realtime terdaftar pertama.
- Penyedia suara realtime bawaan: Google Gemini Live (`google`) dan OpenAI (`openai`), didaftarkan oleh Plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `realtime.providers.<providerId>`.
- Voice Call mengekspos tool realtime bersama `openclaw_agent_consult` secara bawaan. Model realtime dapat memanggilnya saat penelepon meminta penalaran lebih mendalam, informasi terkini, atau tool OpenClaw normal.
- `realtime.consultPolicy` secara opsional menambahkan panduan tentang kapan model realtime harus memanggil `openclaw_agent_consult`.
- `realtime.agentContext.enabled` nonaktif secara bawaan. Saat diaktifkan, Voice Call menyisipkan identitas agen terbatas dan kapsul file workspace terpilih ke instruksi penyedia realtime saat setup sesi.
- `realtime.fastContext.enabled` nonaktif secara bawaan. Saat diaktifkan, Voice Call terlebih dahulu mencari konteks memori/sesi terindeks untuk pertanyaan konsultasi dan mengembalikan cuplikan tersebut ke model realtime dalam `realtime.fastContext.timeoutMs` sebelum fallback ke agen konsultasi penuh hanya jika `realtime.fastContext.fallbackToConsult` bernilai true.
- Jika `realtime.provider` menunjuk ke penyedia yang tidak terdaftar, atau tidak ada penyedia suara realtime yang terdaftar sama sekali, Voice Call mencatat peringatan dan melewati media realtime alih-alih menggagalkan seluruh Plugin.
- Kunci sesi konsultasi menggunakan ulang sesi panggilan yang tersimpan saat tersedia, lalu fallback ke `sessionScope` yang dikonfigurasi (`per-phone` secara bawaan, atau `per-call` untuk panggilan terisolasi).

### Kebijakan tool

`realtime.toolPolicy` mengontrol run konsultasi:

| Kebijakan        | Perilaku                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Mengekspos tool konsultasi dan membatasi agen reguler ke `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`. |
| `owner`          | Mengekspos tool konsultasi dan membiarkan agen reguler menggunakan kebijakan tool agen normal.                                        |
| `none`           | Tidak mengekspos tool konsultasi. `realtime.tools` kustom tetap diteruskan ke penyedia realtime.                                      |

`realtime.consultPolicy` hanya mengontrol instruksi model realtime:

| Kebijakan     | Panduan                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| `auto`        | Pertahankan prompt bawaan dan biarkan penyedia memutuskan kapan memanggil tool konsultasi. |
| `substantive` | Jawab penghubung percakapan sederhana secara langsung dan konsultasikan sebelum fakta, memori, tool, atau konteks. |
| `always`      | Konsultasikan sebelum setiap jawaban substantif.                                           |

### Konteks suara agen

Aktifkan `realtime.agentContext` ketika jembatan suara harus terdengar seperti
agen OpenClaw yang dikonfigurasi tanpa membayar perjalanan pulang-pergi konsultasi
agen penuh pada giliran biasa. Kapsul konteks ditambahkan satu kali saat sesi realtime
dibuat, sehingga tidak menambah latensi per giliran. Panggilan ke
`openclaw_agent_consult` tetap menjalankan agen OpenClaw penuh dan harus digunakan
untuk pekerjaan alat, informasi terkini, pencarian memori, atau status workspace.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Contoh penyedia realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Default: kunci API dari `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, atau `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; suara `Kore`.
    `sessionResumption` dan `contextWindowCompression` aktif secara default untuk panggilan yang lebih panjang
    dan dapat disambungkan ulang. Gunakan `silenceDurationMs`, `startSensitivity`, dan
    `endSensitivity` untuk menyesuaikan pengambilan giliran yang lebih cepat pada audio telepon.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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
[penyedia OpenAI](/id/providers/openai) untuk opsi suara realtime
khusus penyedia.

## Transkripsi streaming

`streaming` memilih penyedia transkripsi realtime untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak disetel, Panggilan Suara menggunakan penyedia transkripsi realtime terdaftar pertama.
- Penyedia transkripsi realtime bawaan: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI (`xai`), yang didaftarkan oleh Plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `streaming.providers.<providerId>`.
- Setelah Twilio mengirim pesan `start` stream yang diterima, Panggilan Suara segera mendaftarkan stream, mengantrekan media masuk melalui penyedia transkripsi saat penyedia tersambung, dan memulai sapaan awal hanya setelah transkripsi realtime siap.
- Jika `streaming.provider` mengarah ke penyedia yang tidak terdaftar, atau tidak ada yang terdaftar, Panggilan Suara mencatat peringatan dan melewati streaming media alih-alih menggagalkan seluruh Plugin.

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

Panggilan Suara menggunakan konfigurasi inti `messages.tts` untuk streaming
ucapan pada panggilan. Anda dapat menimpanya di bawah konfigurasi Plugin dengan
**bentuk yang sama** — konfigurasi ini digabungkan secara mendalam dengan `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech diabaikan untuk panggilan suara.** Audio telepon membutuhkan PCM;
transport Microsoft saat ini tidak mengekspos keluaran PCM telepon.
</Warning>

Catatan perilaku:

- Kunci lama `tts.<provider>` di dalam konfigurasi Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang di-commit harus menggunakan `tts.providers.<provider>`.
- TTS inti digunakan saat streaming media Twilio diaktifkan; jika tidak, panggilan kembali ke suara native penyedia.
- Jika stream media Twilio sudah aktif, Panggilan Suara tidak kembali ke TwiML `<Say>`. Jika TTS telepon tidak tersedia dalam status itu, permintaan pemutaran gagal alih-alih mencampur dua jalur pemutaran.
- Saat TTS telepon kembali ke penyedia sekunder, Panggilan Suara mencatat peringatan dengan rantai penyedia (`from`, `to`, `attempts`) untuk debugging.
- Saat barge-in Twilio atau pembongkaran stream membersihkan antrean TTS yang tertunda, permintaan pemutaran yang diantrekan diselesaikan alih-alih membiarkan penelepon menunggu penyelesaian pemutaran tanpa akhir.

### Contoh TTS

<Tabs>
  <Tab title="Hanya TTS inti">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="Penimpaan model OpenAI (deep-merge)">
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
                speakerVoice: "marin",
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

Kebijakan masuk default adalah `disabled`. Untuk mengaktifkan panggilan masuk, setel:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` adalah penyaringan ID penelepon dengan tingkat keyakinan rendah. Plugin
menormalkan nilai `From` yang disediakan penyedia dan membandingkannya dengan
`allowFrom`. Verifikasi Webhook mengautentikasi pengiriman penyedia dan
integritas payload, tetapi **tidak** membuktikan kepemilikan nomor penelepon
PSTN/VoIP. Perlakukan `allowFrom` sebagai pemfilteran ID penelepon, bukan identitas
penelepon yang kuat.
</Warning>

Respons otomatis menggunakan sistem agen. Sesuaikan dengan `responseModel`,
`responseSystemPrompt`, dan `responseTimeoutMs`.

### Perutean per nomor

Gunakan `numbers` ketika satu Plugin Panggilan Suara menerima panggilan untuk beberapa nomor telepon
dan setiap nomor harus berperilaku seperti saluran yang berbeda. Misalnya, satu
nomor dapat menggunakan asisten pribadi santai sementara nomor lain menggunakan persona
bisnis, agen respons berbeda, dan suara TTS berbeda.

Rute dipilih dari nomor `To` yang ditelepon dan disediakan penyedia. Kunci harus berupa
nomor E.164. Saat panggilan tiba, Panggilan Suara menyelesaikan rute yang cocok satu kali,
menyimpan rute yang cocok pada catatan panggilan, dan menggunakan kembali konfigurasi efektif itu
untuk sapaan, jalur respons otomatis klasik, jalur konsultasi realtime, dan pemutaran
TTS. Jika tidak ada rute yang cocok, konfigurasi Panggilan Suara global digunakan.
Panggilan keluar tidak menggunakan `numbers`; teruskan target keluar, pesan, dan
sesi secara eksplisit saat memulai panggilan.

Penimpaan rute saat ini mendukung:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Nilai rute `tts` digabungkan secara mendalam di atas konfigurasi `tts` Panggilan Suara global, sehingga
biasanya Anda dapat menimpa hanya suara penyedia:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Kontrak keluaran lisan

Untuk respons otomatis, Panggilan Suara menambahkan kontrak keluaran lisan yang ketat ke
prompt sistem:

```text
{"spoken":"..."}
```

Panggilan Suara mengekstrak teks ucapan secara defensif:

- Mengabaikan payload yang ditandai sebagai konten penalaran/kesalahan.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` inline.
- Kembali ke teks biasa dan menghapus paragraf pengantar perencanaan/meta yang kemungkinan ada.

Ini menjaga pemutaran lisan tetap berfokus pada teks yang ditujukan kepada penelepon dan menghindari
kebocoran teks perencanaan ke dalam audio.

### Perilaku awal percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terikat pada status
pemutaran langsung:

- Pembersihan antrean barge-in dan respons otomatis ditekan hanya saat sapaan awal sedang aktif diucapkan.
- Jika pemutaran awal gagal, panggilan kembali ke `listening` dan pesan awal tetap diantrekan untuk dicoba ulang.
- Pemutaran awal untuk streaming Twilio dimulai saat stream tersambung tanpa penundaan tambahan.
- Barge-in membatalkan pemutaran aktif dan membersihkan entri TTS Twilio yang diantrekan tetapi belum diputar. Entri yang dibersihkan diselesaikan sebagai dilewati, sehingga logika respons lanjutan dapat berlanjut tanpa menunggu audio yang tidak akan pernah diputar.
- Percakapan suara realtime menggunakan giliran pembuka milik stream realtime sendiri. Panggilan Suara **tidak** memposting pembaruan TwiML `<Say>` lama untuk pesan awal itu, sehingga sesi `<Connect><Stream>` keluar tetap terpasang.

### Masa tenggang pemutusan stream Twilio

Saat stream media Twilio terputus, Voice Call menunggu **2000 ms** sebelum
mengakhiri panggilan secara otomatis:

- Jika stream tersambung kembali selama jendela waktu tersebut, pengakhiran otomatis dibatalkan.
- Jika tidak ada stream yang mendaftar ulang setelah masa tenggang, panggilan diakhiri untuk mencegah panggilan aktif yang macet.

## Pembersih panggilan basi

Gunakan `staleCallReaperSeconds` untuk mengakhiri panggilan yang tidak pernah menerima
Webhook terminal (misalnya, panggilan mode notifikasi yang tidak pernah selesai). Nilai bawaan
adalah `0` (dinonaktifkan).

Rentang yang direkomendasikan:

- **Produksi:** `120`–`300` detik untuk alur bergaya notifikasi.
- Pertahankan nilai ini **lebih tinggi daripada `maxDurationSeconds`** agar panggilan normal dapat selesai. Titik awal yang baik adalah `maxDurationSeconds + 30–60` detik.

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

Ketika proxy atau tunnel berada di depan Gateway, Plugin
merekonstruksi URL publik untuk verifikasi tanda tangan. Opsi-opsi ini
mengontrol header penerusan mana yang dipercaya:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Izinkan host dari header penerusan.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Percayai header yang diteruskan tanpa daftar izin.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Hanya percayai header yang diteruskan ketika IP jarak jauh permintaan cocok dengan daftar.
</ParamField>

Perlindungan tambahan:

- **Perlindungan pemutaran ulang** Webhook diaktifkan untuk Twilio dan Plivo. Permintaan Webhook valid yang diputar ulang diakui tetapi dilewati untuk efek samping.
- Giliran percakapan Twilio menyertakan token per giliran dalam callback `<Gather>`, sehingga callback ucapan yang basi/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.
- Permintaan Webhook tanpa autentikasi ditolak sebelum pembacaan body ketika header tanda tangan wajib dari penyedia tidak ada.
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

Ketika Gateway sudah berjalan, perintah operasional `voicecall` didelegasikan
ke runtime voice-call milik Gateway sehingga CLI tidak mengikat server
Webhook kedua. Jika tidak ada Gateway yang dapat dijangkau, perintah kembali ke
runtime CLI mandiri.

`latency` membaca `calls.jsonl` dari jalur penyimpanan voice-call bawaan.
Gunakan `--file <path>` untuk menunjuk ke log lain dan `--last <n>` untuk membatasi
analisis ke N rekaman terakhir (bawaan 200). Output menyertakan p50/p90/p99
untuk latensi giliran dan waktu tunggu-dengar.

## Tool agen

Nama tool: `voice_call`.

| Tindakan        | Argumen                                    |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Plugin voice-call mengirimkan keterampilan agen yang sesuai.

## RPC Gateway

| Metode              | Argumen                                    |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` hanya valid dengan `mode: "conversation"`. Panggilan mode notifikasi
sebaiknya menggunakan `voicecall.dtmf` setelah panggilan ada jika memerlukan digit
setelah tersambung.

## Pemecahan masalah

### Penyiapan gagal mengekspos Webhook

Jalankan penyiapan dari lingkungan yang sama dengan yang menjalankan Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Untuk `twilio`, `telnyx`, dan `plivo`, `webhook-exposure` harus hijau. `publicUrl`
yang dikonfigurasi tetap gagal ketika mengarah ke ruang jaringan lokal atau privat,
karena operator tidak dapat memanggil balik ke alamat tersebut. Jangan gunakan
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, atau `fd00::/8` sebagai `publicUrl`.

Panggilan keluar mode notifikasi Twilio mengirim TwiML `<Say>` awal secara langsung dalam
permintaan create-call, sehingga pesan lisan pertama tidak bergantung pada Twilio
mengambil TwiML Webhook. Webhook publik tetap diperlukan untuk callback status,
panggilan percakapan, DTMF pra-sambung, stream realtime, dan kontrol panggilan
pasca-sambung.

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

Periksa penyedia yang dipilih dan kolom kredensial yang diperlukan:

- Twilio: `twilio.accountSid`, `twilio.authToken`, dan `fromNumber`, atau
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, dan `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, dan
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, dan `fromNumber`.

Kredensial harus ada di host Gateway. Mengedit profil shell lokal tidak
memengaruhi Gateway yang sudah berjalan sampai Gateway dimulai ulang atau memuat ulang
lingkungannya.

### Panggilan dimulai tetapi Webhook penyedia tidak masuk

Konfirmasikan konsol penyedia mengarah ke URL Webhook publik yang tepat:

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
- Firewall atau DNS mengarahkan hostname publik ke tempat selain Gateway.
- Gateway dimulai ulang tanpa Plugin Voice Call diaktifkan.

Ketika reverse proxy atau tunnel berada di depan Gateway, atur
`webhookSecurity.allowedHosts` ke hostname publik, atau gunakan
`webhookSecurity.trustedProxyIPs` untuk alamat proxy yang diketahui. Gunakan
`webhookSecurity.trustForwardingHeaders` hanya ketika batas proxy berada di bawah
kendali Anda.

### Verifikasi tanda tangan gagal

Tanda tangan penyedia diperiksa terhadap URL publik yang direkonstruksi OpenClaw
dari permintaan masuk. Jika tanda tangan gagal:

- Konfirmasikan URL Webhook penyedia sama persis dengan `publicUrl`, termasuk
  skema, host, dan jalur.
- Untuk URL tingkat gratis ngrok, perbarui `publicUrl` ketika hostname tunnel berubah.
- Pastikan proxy mempertahankan header host dan proto asli, atau konfigurasikan
  `webhookSecurity.allowedHosts`.
- Jangan aktifkan `skipSignatureVerification` di luar pengujian lokal.

### Gabung Google Meet Twilio gagal

Google Meet menggunakan Plugin ini untuk gabung dial-in Twilio. Pertama, verifikasi Voice Call:

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

Google Meet memulai kaki telepon Twilio melalui `voicecall.start` dengan
urutan DTMF pra-sambung. Urutan yang diturunkan dari PIN menyertakan
`voiceCall.dtmfDelayMs` milik Plugin Google Meet sebagai digit tunggu Twilio di depan.
Nilai bawaan adalah 12 detik karena prompt dial-in Meet dapat tiba terlambat. Voice Call kemudian mengarahkan kembali ke
penanganan realtime sebelum salam pembuka diminta.

Gunakan `openclaw logs --follow` untuk jejak fase langsung. Gabung Twilio Meet
yang sehat mencatat urutan ini:

- Google Meet mendelegasikan gabung Twilio ke Voice Call.
- Voice Call menyimpan TwiML DTMF pra-sambung.
- TwiML awal Twilio digunakan dan disajikan sebelum penanganan realtime.
- Voice Call menyajikan TwiML realtime untuk panggilan Twilio.
- Google Meet meminta ucapan pembuka dengan `voicecall.speak` setelah penundaan pasca-DTMF.

`openclaw voicecall tail` tetap menampilkan rekaman panggilan yang dipersistenkan; ini berguna untuk
status panggilan dan transkrip, tetapi tidak setiap transisi Webhook/realtime muncul
di sana.

### Panggilan realtime tidak memiliki ucapan

Konfirmasikan hanya satu mode audio yang diaktifkan. `realtime.enabled` dan
`streaming.enabled` tidak boleh sama-sama true.

Untuk panggilan Twilio realtime, verifikasi juga:

- Plugin penyedia realtime dimuat dan terdaftar.
- `realtime.provider` tidak diatur atau menamai penyedia yang terdaftar.
- Kunci API penyedia tersedia untuk proses Gateway.
- `openclaw logs --follow` menunjukkan TwiML realtime disajikan, bridge realtime
  dimulai, dan salam awal diantrekan.

## Terkait

- [Mode bicara](/id/nodes/talk)
- [Teks-ke-ucapan](/id/tools/tts)
- [Bangun suara](/id/nodes/voicewake)
