---
read_when:
    - Anda ingin melakukan panggilan suara keluar dari OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin panggilan suara
    - Anda memerlukan suara waktu nyata atau transkripsi streaming pada teleponi
sidebarTitle: Voice call
summary: Lakukan panggilan suara keluar dan terima panggilan masuk melalui Twilio, Telnyx, atau Plivo, dengan suara waktu nyata dan transkripsi streaming opsional
title: Plugin panggilan suara
x-i18n:
    generated_at: "2026-07-12T14:30:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Panggilan suara untuk OpenClaw melalui Plugin: notifikasi keluar, percakapan
multi-giliran, suara waktu nyata dupleks penuh, transkripsi streaming, dan
panggilan masuk dengan kebijakan daftar izin.

**Penyedia:** `mock` (pengembangan, tanpa jaringan), `plivo` (Voice API + transfer XML +
ucapan GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Plugin Panggilan Suara berjalan **di dalam proses Gateway**. Jika Anda menggunakan
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
      <Tab title="Dari folder lokal (pengembangan)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Gunakan paket tanpa versi untuk mengikuti tag rilis saat ini. Sematkan versi yang
    tepat hanya ketika Anda memerlukan instalasi yang dapat direproduksi. Setelah itu,
    mulai ulang Gateway agar Plugin dimuat.

  </Step>
  <Step title="Konfigurasikan penyedia dan Webhook">
    Tetapkan konfigurasi di bawah `plugins.entries.voice-call.config` (lihat
    [Konfigurasi](#configuration) di bawah). Minimal: `provider`, kredensial
    penyedia, `fromNumber`, dan URL Webhook yang dapat dijangkau secara publik.
  </Step>
  <Step title="Verifikasi penyiapan">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Memeriksa pengaktifan Plugin, kredensial penyedia, keterpaparan Webhook, dan
    memastikan hanya satu mode audio (`streaming` atau `realtime`) yang aktif.

  </Step>
  <Step title="Uji cepat">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Keduanya merupakan simulasi secara default. Tambahkan `--yes` untuk melakukan
    panggilan notifikasi keluar singkat:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Untuk Twilio, Telnyx, dan Plivo, penyiapan harus menghasilkan **URL Webhook publik**.
Jika `publicUrl`, URL terowongan, URL Tailscale, atau fallback layanan
menghasilkan local loopback atau ruang jaringan privat, penyiapan akan gagal alih-alih
memulai penyedia yang tidak dapat menerima Webhook operator.
</Warning>

## Konfigurasi

Jika `enabled: true` tetapi penyedia yang dipilih tidak memiliki kredensial, saat
Gateway dimulai, log akan mencatat peringatan bahwa penyiapan belum lengkap beserta
kunci yang belum tersedia dan melewati proses memulai runtime. Perintah, panggilan RPC,
dan alat agen tetap mengembalikan konfigurasi yang belum tersedia secara tepat ketika digunakan.

<Note>
Kredensial panggilan suara menerima SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, dan `plugins.entries.voice-call.config.tts.providers.*.apiKey` diselesaikan melalui permukaan SecretRef standar; lihat [Permukaan kredensial SecretRef](/id/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, ada yang bisa saya bantu?",
              responseSystemPrompt: "Anda adalah spesialis kartu bisbol yang ringkas.",
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
            // region: "ie1", // opsional: us1 | ie1 | au1; defaultnya us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Kunci publik Webhook Telnyx dari Mission Control Portal
            // (Base64; juga dapat ditetapkan melalui TELNYX_PUBLIC_KEY).
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

          // Keamanan Webhook (disarankan untuk terowongan/proksi)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Keterpaparan publik (pilih satu)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* lihat Transkripsi streaming */ },
          realtime: { enabled: false /* lihat Percakapan suara waktu nyata */ },
        },
      },
    },
  },
}
```

### Referensi konfigurasi

Kunci tingkat teratas di bawah `plugins.entries.voice-call.config` yang tidak ditampilkan di atas:

| Kunci                           | Default      | Catatan                                                                                |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Sakelar utama aktif/nonaktif.                                                          |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Lihat [Panggilan masuk](#inbound-calls). |
| `allowFrom`                     | `[]`         | Daftar izin E.164 untuk `inboundPolicy: "allowlist"`.                                  |
| `maxDurationSeconds`            | `300`        | Batas durasi mutlak per panggilan, diterapkan terlepas dari status terjawab.            |
| `staleCallReaperSeconds`        | `120`        | Lihat [Pembersih panggilan usang](#stale-call-reaper). `0` menonaktifkannya.            |
| `silenceTimeoutMs`              | `800`        | Deteksi keheningan akhir ucapan untuk alur klasik (bukan waktu nyata).                  |
| `transcriptTimeoutMs`           | `180000`     | Waktu tunggu maksimum untuk transkrip penelepon sebelum menyerah pada satu giliran.     |
| `ringTimeoutMs`                 | `30000`      | Batas waktu dering untuk panggilan keluar.                                              |
| `maxConcurrentCalls`            | `1`          | Panggilan keluar yang melebihi batas ini ditolak.                                      |
| `outbound.notifyHangupDelaySec` | `3`          | Detik menunggu setelah TTS sebelum menutup otomatis dalam mode notifikasi.              |
| `skipSignatureVerification`     | `false`      | Hanya untuk pengujian lokal; jangan pernah aktifkan dalam produksi.                     |
| `store`                         | tidak diatur | Mengganti jalur log panggilan default `~/.openclaw/voice-calls`.                        |
| `agentId`                       | `"main"`     | Agen yang digunakan untuk pembuatan respons dan penyimpanan sesi.                       |
| `responseModel`                 | tidak diatur | Mengganti model default untuk respons klasik (bukan waktu nyata).                       |
| `responseSystemPrompt`          | dihasilkan   | Prompt sistem khusus untuk respons klasik.                                              |
| `responseTimeoutMs`             | `30000`      | Batas waktu pembuatan respons klasik (md).                                               |

Twilio menggunakan titik akhir REST US1 secara default. Untuk memproses panggilan di
Wilayah non-AS yang didukung, tetapkan `twilio.region` ke `ie1` atau `au1` dan gunakan
kredensial dari Wilayah tersebut. Lihat
[panduan REST API non-AS Twilio](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Catatan keterpaparan dan keamanan penyedia">
    - Twilio, Telnyx, dan Plivo semuanya memerlukan URL Webhook yang **dapat dijangkau secara publik**.
    - `mock` adalah penyedia pengembangan lokal (tanpa panggilan jaringan).
    - Telnyx memerlukan `telnyx.publicKey` (atau `TELNYX_PUBLIC_KEY`) kecuali `skipSignatureVerification` bernilai true.
    - `skipSignatureVerification` hanya untuk pengujian lokal.
    - Pada paket gratis ngrok, tetapkan `publicUrl` ke URL ngrok yang tepat; verifikasi tanda tangan selalu diterapkan.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` mengizinkan Webhook Twilio dengan tanda tangan tidak valid **hanya** ketika `tunnel.provider="ngrok"` dan `serve.bind` adalah local loopback (agen lokal ngrok). Hanya untuk pengembangan lokal.
    - URL paket gratis ngrok dapat berubah atau menambahkan perilaku interstisial; jika `publicUrl` menyimpang, tanda tangan Twilio gagal. Produksi: utamakan domain stabil atau funnel Tailscale.

  </Accordion>
  <Accordion title="Batas koneksi streaming">
    - `streaming.preStartTimeoutMs` (default `5000`) menutup soket yang tidak pernah mengirim bingkai `start` yang valid.
    - `streaming.maxPendingConnections` (default `32`) membatasi jumlah total soket pra-mulai yang belum diautentikasi.
    - `streaming.maxPendingConnectionsPerIp` (default `4`) membatasi soket pra-mulai yang belum diautentikasi per IP sumber.
    - `streaming.maxConnections` (default `128`) membatasi semua soket aliran media terbuka (tertunda + aktif).

  </Accordion>
  <Accordion title="Migrasi konfigurasi lama">
    Penguraian konfigurasi menormalkan kunci lama ini secara otomatis dan mencatat
    peringatan yang menyebutkan jalur pengganti; shim akan dihapus dalam rilis
    mendatang (`2026.6.0`), jadi jalankan `openclaw doctor --fix` untuk menulis ulang
    konfigurasi yang dikomit ke bentuk kanonis:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` dihapus (konteks waktu nyata kini menggunakan prompt agen yang dihasilkan)

  </Accordion>
</AccordionGroup>

## Cakupan sesi

Secara default, Panggilan Suara menggunakan `sessionScope: "per-phone"` sehingga panggilan
berulang dari penelepon yang sama mempertahankan memori percakapan. Tetapkan
`sessionScope: "per-call"` ketika setiap panggilan operator harus dimulai dengan konteks
baru, misalnya untuk resepsionis, pemesanan, IVR, atau alur jembatan Google Meet ketika
nomor telepon yang sama dapat mewakili rapat yang berbeda.

Panggilan Suara menyimpan kunci sesi yang dihasilkan di bawah namespace agen yang
dikonfigurasi (`agent:<agentId>:voice:*`). Kunci integrasi eksplisit mentah diselesaikan ke
namespace yang sama: kunci kanonis `agent:<configuredAgentId>:*` mempertahankan
pemilik tersebut dan mematuhi aliasing `session.mainKey`/cakupan global inti; masukan
`agent:*` asing atau tidak valid dicakup sebagai kunci buram di bawah agen yang
dikonfigurasi; `global` dan `unknown` tetap menjadi sentinel global.

## Percakapan suara waktu nyata

`realtime` memilih penyedia suara waktu nyata dupleks penuh untuk audio panggilan langsung.
Ini terpisah dari `streaming`, yang hanya meneruskan audio ke penyedia
transkripsi waktu nyata.

<Warning>
`realtime.enabled` tidak dapat digabungkan dengan `streaming.enabled`. Pilih satu
mode audio per panggilan.
</Warning>

Perilaku runtime saat ini:

- `realtime.enabled` didukung untuk Twilio dan Telnyx.
- `realtime.provider` bersifat opsional. Jika tidak ditetapkan, Voice Call menggunakan penyedia suara waktu nyata pertama yang terdaftar.
- Penyedia suara waktu nyata bawaan: Google Gemini Live (`google`) dan OpenAI (`openai`), yang didaftarkan oleh plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `realtime.providers.<providerId>`.
- Secara default, Voice Call menyediakan alat waktu nyata bersama `openclaw_agent_consult`. Model waktu nyata dapat memanggilnya ketika penelepon meminta penalaran lebih mendalam, informasi terkini, atau alat OpenClaw biasa.
- `realtime.consultPolicy` secara opsional menambahkan panduan tentang kapan model waktu nyata harus memanggil `openclaw_agent_consult`.
- `realtime.agentContext.enabled` secara default dinonaktifkan. Ketika diaktifkan, Voice Call memasukkan identitas agen terbatas dan kapsul berkas ruang kerja yang dipilih ke dalam instruksi penyedia waktu nyata saat penyiapan sesi.
- `realtime.fastContext.enabled` secara default dinonaktifkan. Ketika diaktifkan, Voice Call terlebih dahulu mencari konteks memori/sesi yang terindeks untuk pertanyaan konsultasi dan mengembalikan cuplikan tersebut kepada model waktu nyata dalam batas `realtime.fastContext.timeoutMs`, lalu beralih ke agen konsultasi lengkap hanya jika `realtime.fastContext.fallbackToConsult` bernilai true.
- Jika `realtime.provider` mengarah ke penyedia yang tidak terdaftar, atau sama sekali tidak ada penyedia suara waktu nyata yang terdaftar, Voice Call mencatat peringatan dan melewati media waktu nyata alih-alih menggagalkan seluruh plugin.
- `inboundPolicy` tidak boleh bernilai `"disabled"` ketika `realtime.enabled` bernilai true; `validateProviderConfig` menolak kombinasi tersebut.
- Kunci sesi konsultasi menggunakan kembali sesi panggilan tersimpan jika tersedia, lalu beralih ke `sessionScope` yang dikonfigurasi (`per-phone` secara default, atau `per-call` untuk panggilan terisolasi).

### Kebijakan alat

`realtime.toolPolicy` mengendalikan eksekusi konsultasi:

| Kebijakan        | Perilaku                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Menyediakan alat konsultasi dan membatasi agen biasa pada `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, dan `memory_get`.                                      |
| `owner`          | Menyediakan alat konsultasi dan mengizinkan agen biasa menggunakan kebijakan alat agen normal.                                                                                    |
| `none`           | Tidak menyediakan alat konsultasi. `realtime.tools` khusus tetap diteruskan ke penyedia waktu nyata.                                                                               |

`realtime.consultPolicy` hanya mengendalikan instruksi model waktu nyata:

| Kebijakan     | Panduan                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `auto`        | Mempertahankan prompt default dan membiarkan penyedia menentukan kapan harus memanggil alat konsultasi.         |
| `substantive` | Menjawab langsung percakapan penghubung sederhana dan berkonsultasi sebelum menyampaikan fakta, menggunakan memori, alat, atau konteks. |
| `always`      | Berkonsultasi sebelum setiap jawaban substantif.                                                               |

### Konteks suara agen

Aktifkan `realtime.agentContext` ketika jembatan suara harus terdengar seperti
agen OpenClaw yang dikonfigurasi tanpa memerlukan perjalanan pulang-pergi konsultasi agen lengkap pada
giliran biasa. Kapsul konteks ditambahkan sekali ketika sesi waktu nyata
dibuat, sehingga tidak menambah latensi per giliran. Panggilan ke
`openclaw_agent_consult` tetap menjalankan agen OpenClaw lengkap dan harus digunakan
untuk pekerjaan alat, informasi terkini, pencarian memori, atau keadaan ruang kerja.

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

### Contoh penyedia waktu nyata

<Tabs>
  <Tab title="Google Gemini Live">
    Default: kunci API dari `realtime.providers.google.apiKey`, `GEMINI_API_KEY`,
    atau `GOOGLE_API_KEY`; model `gemini-3.1-flash-live-preview`;
    suara `Kore`. `sessionResumption` dan `contextWindowCompression` aktif secara default
    untuk panggilan yang lebih lama dan dapat disambungkan kembali. Gunakan `silenceDurationMs`,
    `startSensitivity`, dan `endSensitivity` untuk menyesuaikan pergantian giliran yang lebih cepat pada
    audio telefoni.

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
                instructions: "Bicaralah dengan singkat. Panggil openclaw_agent_consult sebelum menggunakan alat yang lebih mendalam.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
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
[penyedia OpenAI](/id/providers/openai) untuk opsi suara waktu nyata
khusus penyedia.

## Transkripsi streaming

`streaming` memilih penyedia transkripsi waktu nyata untuk audio panggilan langsung.

Perilaku runtime saat ini:

- `streaming.provider` bersifat opsional. Jika tidak ditetapkan, Voice Call menggunakan penyedia transkripsi waktu nyata pertama yang terdaftar.
- Penyedia transkripsi waktu nyata bawaan: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), dan xAI (`xai`), yang didaftarkan oleh plugin penyedia masing-masing.
- Konfigurasi mentah milik penyedia berada di bawah `streaming.providers.<providerId>`.
- Setelah Twilio mengirim pesan `start` aliran yang diterima, Voice Call segera mendaftarkan aliran, mengantrekan media masuk melalui penyedia transkripsi saat penyedia tersambung, dan memulai sapaan awal hanya setelah transkripsi waktu nyata siap.
- Jika `streaming.provider` mengarah ke penyedia yang tidak terdaftar, atau tidak ada penyedia yang terdaftar, Voice Call mencatat peringatan dan melewati streaming media alih-alih menggagalkan seluruh plugin.

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

  </Tab>
  <Tab title="xAI">
    Default: kunci API `streaming.providers.xai.apiKey` atau `XAI_API_KEY` (beralih
    ke profil autentikasi OAuth xAI jika keduanya tidak ditetapkan); endpoint
    `wss://api.x.ai/v1/stt`; pengodean `mulaw`; laju sampel `8000`;
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

  </Tab>
</Tabs>

## TTS untuk panggilan

Voice Call menggunakan konfigurasi inti `messages.tts` untuk streaming ucapan pada
panggilan. Anda dapat menimpanya di bawah konfigurasi plugin dengan **struktur yang sama** —
konfigurasi tersebut digabungkan secara mendalam dengan `messages.tts`.

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
**Ucapan Microsoft diabaikan untuk panggilan suara.** Sintesis telefoni memerlukan
penyedia yang mengimplementasikan keluaran bertarget telefoni; penyedia ucapan Microsoft
tidak mengimplementasikannya, sehingga dilewati untuk panggilan dan penyedia lain dalam
rantai fallback dicoba sebagai gantinya.
</Warning>

Catatan perilaku:

- Kunci lama `tts.<provider>` di dalam konfigurasi plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) diperbaiki oleh `openclaw doctor --fix`; konfigurasi yang dikomit harus menggunakan `tts.providers.<provider>`.
- TTS inti digunakan ketika streaming media Twilio diaktifkan; jika tidak, panggilan beralih ke suara bawaan penyedia.
- Jika aliran media Twilio sudah aktif, Voice Call tidak beralih ke TwiML `<Say>`. Jika TTS telefoni tidak tersedia dalam keadaan tersebut, permintaan pemutaran gagal alih-alih mencampurkan dua jalur pemutaran.
- Ketika TTS telefoni beralih ke penyedia sekunder, Voice Call mencatat peringatan dengan rantai penyedia (`from`, `to`, `attempts`) untuk proses debug.
- Ketika interupsi Twilio atau penghentian aliran mengosongkan antrean TTS yang tertunda, permintaan pemutaran yang diantrekan diselesaikan alih-alih membuat penelepon yang menunggu penyelesaian pemutaran terus tertahan.

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
  <Tab title="Timpa dengan ElevenLabs (hanya panggilan)">
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
  <Tab title="Penimpaan model OpenAI (penggabungan mendalam)">
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

Kebijakan panggilan masuk secara default bernilai `disabled`. Untuk mengaktifkan panggilan masuk, tetapkan:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Halo! Apa yang bisa saya bantu?",
}
```

<Warning>
`inboundPolicy: "allowlist"` adalah penyaringan ID penelepon dengan tingkat jaminan rendah. Plugin
menormalkan nilai `From` yang diberikan penyedia dan membandingkannya dengan `allowFrom`.
Verifikasi Webhook mengautentikasi pengiriman penyedia dan integritas muatan,
tetapi **tidak** membuktikan kepemilikan nomor penelepon PSTN/VoIP. Perlakukan
`allowFrom` sebagai pemfilteran ID penelepon, bukan identitas penelepon yang kuat.
</Warning>

Respons otomatis menggunakan sistem agen. Sesuaikan dengan `responseModel`,
`responseSystemPrompt`, dan `responseTimeoutMs`.

### Perutean per nomor

Gunakan `numbers` saat satu Plugin Voice Call menerima panggilan untuk beberapa nomor
telepon dan setiap nomor harus berperilaku seperti saluran yang berbeda. Misalnya,
satu nomor dapat menggunakan asisten pribadi bergaya santai, sedangkan nomor lain menggunakan
persona bisnis, agen respons yang berbeda, dan suara TTS yang berbeda.

Rute dipilih dari nomor `To` yang dihubungi dan diberikan oleh penyedia. Kunci harus
berupa nomor E.164. Saat panggilan masuk, Voice Call menentukan rute yang cocok
satu kali, menyimpan rute yang cocok pada catatan panggilan, dan menggunakan kembali
konfigurasi efektif tersebut untuk salam, jalur respons otomatis klasik, jalur konsultasi
waktu nyata, dan pemutaran TTS. Jika tidak ada rute yang cocok, konfigurasi Voice Call
global akan digunakan. Panggilan keluar tidak menggunakan `numbers`; berikan target
keluar, pesan, dan sesi secara eksplisit saat memulai panggilan.

Penggantian rute saat ini mendukung:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Nilai rute `tts` digabungkan secara mendalam di atas konfigurasi `tts` Voice Call global, sehingga
biasanya Anda hanya perlu mengganti suara penyedia:

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

Untuk respons otomatis, Voice Call menambahkan kontrak keluaran lisan yang ketat ke
perintah sistem yang mewajibkan balasan JSON `{"spoken":"..."}`. Voice Call
mengekstrak teks ucapan secara defensif:

- Mengabaikan muatan yang ditandai sebagai konten penalaran/kesalahan.
- Mengurai JSON langsung, JSON berpagar, atau kunci `"spoken"` sebaris.
- Beralih ke teks biasa sebagai cadangan dan menghapus paragraf pembuka yang kemungkinan berisi perencanaan/meta.

Hal ini menjaga agar pemutaran ucapan tetap berfokus pada teks untuk penelepon dan mencegah
teks perencanaan bocor ke audio.

### Perilaku awal percakapan

Untuk panggilan `conversation` keluar, penanganan pesan pertama terikat pada status
pemutaran langsung:

- Pengosongan antrean interupsi dan respons otomatis hanya ditekan ketika salam awal sedang aktif diucapkan.
- Jika pemutaran awal gagal, panggilan kembali ke status `listening` dan pesan awal tetap berada dalam antrean untuk dicoba kembali.
- Pemutaran awal untuk streaming Twilio dimulai saat aliran terhubung tanpa penundaan tambahan.
- Interupsi membatalkan pemutaran aktif dan menghapus entri TTS Twilio yang sudah diantrekan tetapi belum diputar. Entri yang dihapus diselesaikan sebagai dilewati, sehingga logika respons lanjutan dapat terus berjalan tanpa menunggu audio yang tidak akan pernah diputar.
- Percakapan suara waktu nyata menggunakan giliran pembuka milik aliran waktu nyata itu sendiri. Voice Call **tidak** mengirim pembaruan TwiML `<Say>` lama untuk pesan awal tersebut, sehingga sesi `<Connect><Stream>` keluar tetap terhubung.

### Masa tenggang pemutusan aliran Twilio

Ketika aliran media Twilio terputus, Voice Call menunggu **2000 md** sebelum
mengakhiri panggilan secara otomatis:

- Jika aliran terhubung kembali selama jangka waktu tersebut, pengakhiran otomatis dibatalkan.
- Jika tidak ada aliran yang didaftarkan kembali setelah masa tenggang, panggilan diakhiri untuk mencegah panggilan aktif macet.

## Pembersih panggilan kedaluwarsa

Gunakan `staleCallReaperSeconds` (nilai bawaan **120**) untuk mengakhiri panggilan yang tidak pernah
dijawab dan tidak pernah mencapai status percakapan langsung, misalnya panggilan mode notifikasi
ketika penyedia tidak pernah mengirim Webhook terminal. Atur ke `0` untuk
menonaktifkannya.

Pembersih berjalan setiap 30 detik dan hanya mengakhiri panggilan yang tidak memiliki
stempel waktu `answeredAt` serta belum berada dalam status terminal atau langsung
(`speaking`/`listening`), sehingga percakapan yang dijawab tidak pernah dibersihkan
oleh pengatur waktu ini; `maxDurationSeconds` (nilai bawaan 300) adalah batas terpisah yang
mengakhiri panggilan yang dijawab jika berlangsung terlalu lama.

Untuk alur bergaya notifikasi ketika operator dapat lambat mengirim Webhook
dering/jawab, naikkan `staleCallReaperSeconds` melampaui nilai bawaan agar panggilan yang
lambat tetapi normal tidak dibersihkan terlalu dini; `120`-`300` detik adalah rentang
produksi yang wajar.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Keamanan Webhook

Ketika proksi atau terowongan berada di depan Gateway, Plugin merekonstruksi
URL publik untuk verifikasi tanda tangan. Opsi berikut mengontrol header
penerusan yang dipercaya:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Host yang diizinkan dari header penerusan.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Percayai header penerusan tanpa daftar izin.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Hanya percayai header penerusan ketika IP jarak jauh permintaan cocok dengan daftar.
</ParamField>

Perlindungan tambahan:

- **Perlindungan pemutaran ulang** Webhook diaktifkan untuk Twilio, Telnyx, dan Plivo. Permintaan Webhook valid yang diputar ulang dikonfirmasi tetapi dilewati untuk efek samping.
- Giliran percakapan Twilio menyertakan token per giliran dalam panggilan balik `<Gather>`, sehingga panggilan balik ucapan yang kedaluwarsa/diputar ulang tidak dapat memenuhi giliran transkrip tertunda yang lebih baru.
- Permintaan Webhook yang tidak diautentikasi ditolak sebelum isi dibaca jika header tanda tangan wajib penyedia tidak ada.
- Webhook voice-call menggunakan profil pembacaan isi praautentikasi bersama (ukuran isi maksimum 64 KB, batas waktu pembacaan 5 detik) ditambah batas permintaan berjalan per kunci (secara bawaan 8 permintaan bersamaan per kunci) sebelum verifikasi tanda tangan.

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

Ketika Gateway sudah berjalan, perintah operasional `voicecall`
mendelegasikan tugas ke runtime voice-call milik Gateway agar CLI tidak mengikat
server Webhook kedua. Jika Gateway tidak dapat dijangkau, perintah akan beralih sebagai cadangan ke
runtime CLI mandiri.

`latency` membaca `calls.jsonl` dari jalur penyimpanan voice-call bawaan. Gunakan
`--file <path>` untuk menunjuk ke log lain dan `--last <n>` untuk membatasi
analisis pada N catatan terakhir (nilai bawaan 200). Keluaran mencakup min/maks/rata-rata,
p50, dan p95 untuk latensi giliran serta waktu tunggu-dengar.

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

Plugin voice-call menyertakan skill agen yang sesuai.

## RPC Gateway

| Metode                      | Argumen                                                          | Catatan                                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Beralih ke konfigurasi `toNumber` sebagai cadangan ketika `to` tidak diberikan.              |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Sama seperti `initiate`, tetapi juga menerima `dtmfSequence` sebelum koneksi.                |
| `voicecall.continue`        | `callId`, `message`                                              | Memblokir hingga giliran selesai; mengembalikan transkrip.                                   |
| `voicecall.continue.start`  | `callId`, `message`                                              | Varian asinkron: segera mengembalikan `operationId`.                                         |
| `voicecall.continue.result` | `operationId`                                                    | Memeriksa secara berkala operasi `voicecall.continue.start` yang tertunda untuk mendapatkan hasilnya. |
| `voicecall.speak`           | `callId`, `message`                                              | Berbicara tanpa menunggu; menggunakan jembatan waktu nyata ketika `realtime.enabled`.        |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                             |
| `voicecall.end`             | `callId`                                                         |                                                                                             |
| `voicecall.status`          | `callId?`                                                        | Hilangkan `callId` untuk mencantumkan semua panggilan aktif.                                 |

`dtmfSequence` hanya valid dengan `mode: "conversation"`; panggilan mode notifikasi
harus menggunakan `voicecall.dtmf` setelah panggilan tersedia jika memerlukan digit
pascakoneksi.

## Pemecahan masalah

### Penyiapan eksposur Webhook gagal

Jalankan penyiapan dari lingkungan yang sama dengan tempat Gateway berjalan:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Untuk `twilio`, `telnyx`, dan `plivo`, `webhook-exposure` harus berstatus hijau. `publicUrl`
yang dikonfigurasi tetap gagal ketika menunjuk ke ruang jaringan lokal atau privat,
karena operator tidak dapat melakukan panggilan balik ke alamat tersebut.
Jangan gunakan `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8`, atau rentang NAT tingkat operator
lainnya sebagai `publicUrl`.

Panggilan keluar mode notifikasi Twilio mengirim TwiML `<Say>` awal secara langsung
dalam permintaan pembuatan panggilan, sehingga pesan lisan pertama tidak bergantung pada
Twilio yang mengambil TwiML Webhook. Webhook publik tetap diperlukan untuk panggilan balik
status, panggilan percakapan, DTMF prakoneksi, aliran waktu nyata, dan
kontrol panggilan pascakoneksi.

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

`voicecall smoke` adalah simulasi kecuali Anda memberikan `--yes`.

### Kredensial penyedia gagal

Periksa penyedia yang dipilih dan bidang kredensial yang diwajibkan:

- Twilio: `twilio.accountSid`, `twilio.authToken`, dan `fromNumber`, atau
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, dan `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, dan
  `fromNumber`, atau `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID`, dan
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken`, dan `fromNumber`, atau
  `PLIVO_AUTH_ID` dan `PLIVO_AUTH_TOKEN`.

Kredensial harus tersedia di host Gateway. Mengedit profil shell lokal
tidak memengaruhi Gateway yang sudah berjalan hingga Gateway dimulai ulang atau memuat ulang
lingkungannya.

### Panggilan dimulai tetapi Webhook penyedia tidak diterima

Pastikan konsol penyedia mengarah ke URL Webhook publik yang tepat:

```text
https://voice.example.com/voice/webhook
```

Kemudian periksa status runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Penyebab umum:

- `publicUrl` mengarah ke jalur yang berbeda dari `serve.path`.
- URL terowongan berubah setelah Gateway dimulai.
- Proksi meneruskan permintaan tetapi menghapus atau menulis ulang header host/proto.
- Firewall atau DNS merutekan nama host publik ke lokasi selain Gateway.
- Gateway dimulai ulang tanpa mengaktifkan Plugin Voice Call.

Ketika proksi balik atau terowongan berada di depan Gateway, atur
`webhookSecurity.allowedHosts` ke nama host publik, atau gunakan
`webhookSecurity.trustedProxyIPs` untuk alamat proksi yang diketahui. Gunakan
`webhookSecurity.trustForwardingHeaders` hanya ketika batas proksi berada
di bawah kendali Anda.

### Verifikasi tanda tangan gagal

Tanda tangan penyedia diperiksa terhadap URL publik yang direkonstruksi OpenClaw
dari permintaan masuk. Jika tanda tangan gagal:

- Pastikan URL Webhook penyedia sama persis dengan `publicUrl`, termasuk skema, host, dan jalur.
- Untuk URL tingkat gratis ngrok, perbarui `publicUrl` ketika nama host terowongan berubah.
- Pastikan proksi mempertahankan header host dan proto asli, atau konfigurasikan `webhookSecurity.allowedHosts`.
- Jangan aktifkan `skipSignatureVerification` di luar pengujian lokal.

### Penggabungan Google Meet melalui Twilio gagal

Google Meet menggunakan Plugin ini untuk bergabung melalui panggilan masuk Twilio. Pertama, verifikasi Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Kemudian verifikasi transport Google Meet secara eksplisit:

```bash
openclaw googlemeet setup --transport twilio
```

Jika Voice Call berstatus baik tetapi peserta Meet tidak pernah bergabung, periksa nomor
panggilan masuk Meet, PIN, dan `--dtmf-sequence`. Panggilan telepon dapat berfungsi
sementara rapat menolak atau mengabaikan urutan DTMF yang salah.

Google Meet memulai bagian panggilan telepon Twilio melalui `voicecall.start` dengan
urutan DTMF sebelum koneksi. Urutan yang berasal dari PIN menyertakan
`voiceCall.dtmfDelayMs` milik Plugin Google Meet (nilai bawaan **12000 ms**) sebagai digit tunggu
awal Twilio, karena perintah panggilan masuk Meet dapat terlambat muncul. Voice Call kemudian
mengalihkan kembali ke penanganan waktu nyata sebelum salam pembuka diminta.

Gunakan `openclaw logs --follow` untuk pelacakan fase langsung. Proses bergabung ke Meet melalui Twilio
yang berfungsi mencatat urutan berikut:

- Google Meet mendelegasikan proses bergabung melalui Twilio kepada Voice Call.
- Voice Call menyimpan TwiML DTMF sebelum koneksi.
- TwiML awal Twilio digunakan dan disajikan sebelum penanganan waktu nyata.
- Voice Call menyajikan TwiML waktu nyata untuk panggilan Twilio.
- Google Meet meminta ucapan pembuka dengan `voicecall.speak` setelah penundaan pasca-DTMF.

`openclaw voicecall tail` tetap menampilkan catatan panggilan yang disimpan; berguna untuk
status dan transkrip panggilan, tetapi tidak setiap transisi Webhook/waktu nyata
muncul di sana.

### Panggilan waktu nyata tidak mengeluarkan suara

Pastikan hanya satu mode audio yang diaktifkan: `realtime.enabled` dan
`streaming.enabled` tidak boleh bernilai true secara bersamaan.

Untuk panggilan waktu nyata Twilio/Telnyx, verifikasi juga:

- Plugin penyedia waktu nyata telah dimuat dan didaftarkan.
- `realtime.provider` tidak diatur atau menyebutkan penyedia yang terdaftar.
- Kunci API penyedia tersedia bagi proses Gateway.
- `openclaw logs --follow` menunjukkan TwiML waktu nyata disajikan, jembatan waktu nyata dimulai, dan salam awal dimasukkan ke antrean.

## Terkait

- [Mode bicara](/id/nodes/talk)
- [Teks ke ucapan](/id/tools/tts)
- [Pengaktifan suara](/id/nodes/voicewake)
