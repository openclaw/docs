---
read_when:
    - Mengaktifkan text-to-speech untuk balasan
    - Mengonfigurasi provider TTS, rantai fallback, atau persona
    - Menggunakan perintah atau directive /tts
sidebarTitle: Text to speech (TTS)
summary: Text-to-speech untuk balasan outbound — provider, persona, slash command, dan output per-channel
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-26T11:41:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw dapat mengubah balasan outbound menjadi audio di **13 provider speech**
dan mengirim pesan suara native di Feishu, Matrix, Telegram, dan WhatsApp,
lampiran audio di semua tempat lain, serta stream PCM/Ulaw untuk telepon dan Talk.

## Mulai cepat

<Steps>
  <Step title="Pilih provider">
    OpenAI dan ElevenLabs adalah opsi hosted yang paling andal. Microsoft dan
    Local CLI berfungsi tanpa API key. Lihat [matriks provider](#supported-providers)
    untuk daftar lengkap.
  </Step>
  <Step title="Atur API key">
    Ekspor env var untuk provider Anda (misalnya `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft dan Local CLI tidak memerlukan key.
  </Step>
  <Step title="Aktifkan di config">
    Atur `messages.tts.auto: "always"` dan `messages.tts.provider`:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Coba di chat">
    `/tts status` menampilkan status saat ini. `/tts audio Hello from OpenClaw`
    mengirim balasan audio sekali jalan.
  </Step>
</Steps>

<Note>
Auto-TTS **nonaktif** secara default. Saat `messages.tts.provider` tidak diatur,
OpenClaw memilih provider terkonfigurasi pertama dalam urutan auto-select registry.
</Note>

## Provider yang didukung

| Provider          | Auth                                                                                                             | Catatan                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (juga `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Output pesan suara Ogg/Opus native dan telepon.                          |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` atau `XI_API_KEY`                                                                           | Voice cloning, multibahasa, deterministik melalui `seed`.                |
| **Google Gemini** | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                                                                           | Gemini API TTS; sadar persona melalui `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Output pesan suara dan telepon.                                          |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS streaming. Opus native untuk pesan suara dan PCM telepon.        |
| **Local CLI**     | tidak ada                                                                                                        | Menjalankan perintah TTS lokal yang dikonfigurasi.                       |
| **Microsoft**     | tidak ada                                                                                                        | TTS neural Edge publik melalui `node-edge-tts`. Best-effort, tanpa SLA.  |
| **MiniMax**       | `MINIMAX_API_KEY` (atau Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)  | API T2A v2. Default ke `speech-2.8-hd`.                                  |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Juga digunakan untuk ringkasan otomatis; mendukung persona `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (dapat menggunakan ulang `models.providers.openrouter.apiKey`)                             | Model default `hexgrad/kokoro-82m`.                                      |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token lama: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                           |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Provider bersama untuk gambar, video, dan speech.                        |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS batch xAI. Opus native untuk pesan suara **tidak** didukung.         |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo melalui chat completions Xiaomi.                                |

Jika beberapa provider dikonfigurasi, provider yang dipilih digunakan terlebih dahulu dan
yang lainnya menjadi opsi fallback. Ringkasan otomatis menggunakan `summaryModel` (atau
`agents.defaults.model.primary`), jadi provider tersebut juga harus diautentikasi
jika Anda tetap mengaktifkan ringkasan.

<Warning>
Provider **Microsoft** bawaan menggunakan layanan TTS neural online Microsoft Edge
melalui `node-edge-tts`. Ini adalah layanan web publik tanpa
SLA atau kuota yang dipublikasikan — perlakukan sebagai best-effort. Id provider lama `edge`
dinormalisasi menjadi `microsoft` dan `openclaw doctor --fix` menulis ulang
config yang disimpan; config baru harus selalu menggunakan `microsoft`.
</Warning>

## Config

Config TTS berada di bawah `messages.tts` di `~/.openclaw/openclaw.json`. Pilih
preset dan sesuaikan blok provider:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Prompt gaya bahasa alami opsional:
          // audioProfile: "Bicara dengan nada tenang seperti pembawa acara podcast.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (tanpa key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Override suara per agen

Gunakan `agents.list[].tts` saat satu agen harus berbicara dengan provider,
suara, model, persona, atau mode auto-TTS yang berbeda. Blok agen akan di-deep-merge di atas
`messages.tts`, sehingga kredensial provider dapat tetap berada dalam config provider global:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Untuk menetapkan persona per agen, atur `agents.list[].tts.persona` di samping config provider
— ini menimpa `messages.tts.persona` global hanya untuk agen tersebut.

Urutan prioritas untuk balasan otomatis, `/tts audio`, `/tts status`, dan
tool agen `tts`:

1. `messages.tts`
2. `agents.list[].tts` yang aktif
3. override channel, saat channel mendukung `channels.<channel>.tts`
4. override akun, saat channel meneruskan `channels.<channel>.accounts.<id>.tts`
5. preferensi `/tts` lokal untuk host ini
6. directive inline `[[tts:...]]` saat [override berbasis model](#model-driven-directives) diaktifkan

Override channel dan akun menggunakan bentuk yang sama seperti `messages.tts` dan
di-deep-merge di atas lapisan sebelumnya, sehingga kredensial provider bersama dapat tetap berada di
`messages.tts` sementara sebuah channel atau akun bot hanya mengubah voice, model, persona,
atau mode otomatis:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persona

**Persona** adalah identitas suara stabil yang dapat diterapkan secara deterministik
di berbagai provider. Persona dapat mengutamakan satu provider, mendefinisikan intent prompt netral-provider, dan membawa binding khusus provider untuk voice, model, template prompt, seed, dan pengaturan voice.

### Persona minimal

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Persona lengkap (prompt netral-provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Narator pelayan Inggris yang kering tetapi hangat.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Seorang kepala pelayan Inggris yang brilian. Kering, jenaka, hangat, menawan, ekspresif secara emosional, tidak pernah generik.",
            scene: "Ruang kerja tenang di larut malam. Narasi close-mic untuk operator tepercaya.",
            sampleContext: "Pembicara sedang menjawab permintaan teknis pribadi dengan keyakinan ringkas dan kehangatan yang kering.",
            style: "Anggun, tertahan, sedikit geli.",
            accent: "British English.",
            pacing: "Terukur, dengan jeda dramatis singkat.",
            constraints: ["Jangan bacakan nilai konfigurasi dengan suara keras.", "Jangan jelaskan persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Resolusi persona

Persona aktif dipilih secara deterministik:

1. Preferensi lokal `/tts persona <id>`, jika diatur.
2. `messages.tts.persona`, jika diatur.
3. Tidak ada persona.

Pemilihan provider berjalan dengan prinsip explicit-first:

1. Override langsung (CLI, gateway, Talk, directive TTS yang diizinkan).
2. Preferensi lokal `/tts provider <id>`.
3. `provider` milik persona aktif.
4. `messages.tts.provider`.
5. Auto-select registry.

Untuk setiap percobaan provider, OpenClaw menggabungkan config dalam urutan ini:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Override permintaan tepercaya
4. Override directive TTS yang dihasilkan model dan diizinkan

### Cara provider menggunakan prompt persona

Field prompt persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) bersifat **netral-provider**. Setiap provider memutuskan bagaimana
menggunakannya:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Membungkus field prompt persona dalam struktur prompt Gemini TTS **hanya ketika**
    config provider Google yang efektif mengatur `promptTemplate: "audio-profile-v1"`
    atau `personaPrompt`. Field lama `audioProfile` dan `speakerName` masih
    ditambahkan di awal sebagai teks prompt khusus Google. Tag audio inline seperti
    `[whispers]` atau `[laughs]` di dalam blok `[[tts:text]]` dipertahankan
    di dalam transkrip Gemini; OpenClaw tidak membuat tag ini.
  </Accordion>
  <Accordion title="OpenAI">
    Memetakan field prompt persona ke field permintaan `instructions` **hanya ketika**
    tidak ada `instructions` OpenAI eksplisit yang dikonfigurasi. `instructions`
    eksplisit selalu menang.
  </Accordion>
  <Accordion title="Provider lain">
    Hanya menggunakan binding persona khusus provider di bawah
    `personas.<id>.providers.<provider>`. Field prompt persona diabaikan
    kecuali provider mengimplementasikan pemetaan prompt-persona miliknya sendiri.
  </Accordion>
</AccordionGroup>

### Kebijakan fallback

`fallbackPolicy` mengontrol perilaku saat sebuah persona **tidak memiliki binding** untuk
provider yang sedang dicoba:

| Kebijakan           | Perilaku                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Default.** Field prompt netral-provider tetap tersedia; provider dapat menggunakannya atau mengabaikannya.                                     |
| `provider-defaults` | Persona dihilangkan dari persiapan prompt untuk percobaan itu; provider menggunakan default netralnya sementara fallback ke provider lain tetap berlanjut. |
| `fail`              | Lewati percobaan provider itu dengan `reasonCode: "not_configured"` dan `personaBinding: "missing"`. Provider fallback tetap dicoba.            |

Seluruh permintaan TTS hanya gagal ketika **setiap** provider yang dicoba dilewati
atau gagal.

## Directive berbasis model

Secara default, asisten **dapat** mengeluarkan directive `[[tts:...]]` untuk menimpa
voice, model, atau kecepatan untuk satu balasan, ditambah blok
`[[tts:text]]...[[/tts:text]]` opsional untuk isyarat ekspresif yang hanya
boleh muncul dalam audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Saat `messages.tts.auto` adalah `"tagged"`, **directive diperlukan** untuk memicu
audio. Pengiriman blok streaming menghapus directive dari teks yang terlihat sebelum
channel melihatnya, bahkan saat terpecah di beberapa blok yang berdekatan.

`provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`. Saat sebuah
balasan mendeklarasikan `provider=...`, key lain dalam directive tersebut di-parse
hanya oleh provider itu; key yang tidak didukung dihapus dan dilaporkan sebagai peringatan directive TTS.

**Key directive yang tersedia:**

- `provider` (id provider terdaftar; memerlukan `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (pitch integer MiniMax, −12 hingga 12; nilai pecahan dipotong)
- `emotion` (tag emosi Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Nonaktifkan override model sepenuhnya:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Izinkan pergantian provider sambil tetap menjaga pengaturan lain dapat dikonfigurasi:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash command

Satu perintah `/tts`. Di Discord, OpenClaw juga mendaftarkan `/voice` karena
`/tts` adalah perintah bawaan Discord — teks `/tts ...` tetap berfungsi.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Perintah memerlukan pengirim yang diotorisasi (aturan allowlist/owner berlaku) dan
baik `commands.text` maupun registrasi perintah native harus diaktifkan.
</Note>

Catatan perilaku:

- `/tts on` menulis preferensi TTS lokal ke `always`; `/tts off` menulisnya ke `off`.
- `/tts chat on|off|default` menulis override auto-TTS dengan cakupan sesi untuk chat saat ini.
- `/tts persona <id>` menulis preferensi persona lokal; `/tts persona off` menghapusnya.
- `/tts latest` membaca balasan asisten terbaru dari transkrip sesi saat ini dan mengirimkannya sebagai audio sekali. Perintah ini hanya menyimpan hash balasan tersebut pada entri sesi untuk menekan pengiriman suara duplikat.
- `/tts audio` menghasilkan balasan audio sekali jalan (tidak mengaktifkan TTS).
- `limit` dan `summary` disimpan di **preferensi lokal**, bukan config utama.
- `/tts status` menyertakan diagnostik fallback untuk percobaan terbaru — `Fallback: <primary> -> <used>`, `Attempts: ...`, dan detail per percobaan (`provider:outcome(reasonCode) latency`).
- `/status` menampilkan mode TTS aktif beserta provider, model, voice, dan metadata endpoint kustom yang telah disanitasi saat TTS diaktifkan.

## Preferensi per pengguna

Slash command menulis override lokal ke `prefsPath`. Default-nya adalah
`~/.openclaw/settings/tts.json`; timpa dengan env var `OPENCLAW_TTS_PREFS`
atau `messages.tts.prefsPath`.

| Field tersimpan | Efek                                        |
| --------------- | ------------------------------------------- |
| `auto`          | Override auto-TTS lokal (`always`, `off`, …) |
| `provider`      | Override provider utama lokal               |
| `persona`       | Override persona lokal                      |
| `maxLength`     | Ambang ringkasan (default `1500` karakter)  |
| `summarize`     | Toggle ringkasan (default `true`)           |

Ini menimpa config efektif dari `messages.tts` ditambah blok
`agents.list[].tts` aktif untuk host tersebut.

## Format output (tetap)

Pengiriman suara TTS digerakkan oleh kapabilitas channel. Plugin channel mengiklankan
apakah TTS bergaya suara harus meminta target `voice-note` native ke provider atau
mempertahankan sintesis `audio-file` normal dan hanya menandai output yang kompatibel untuk pengiriman suara.

- **Channel yang mendukung voice-note**: balasan voice-note mengutamakan Opus (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI).
  - 48kHz / 64kbps adalah kompromi yang baik untuk pesan suara.
- **Feishu / WhatsApp**: saat balasan voice-note dihasilkan sebagai MP3/WebM/WAV/M4A
  atau file audio lain yang mungkin, plugin channel mentranskodenya ke
  Ogg/Opus 48kHz dengan `ffmpeg` sebelum mengirim pesan suara native. WhatsApp mengirim
  hasilnya melalui payload Baileys `audio` dengan `ptt: true` dan
  `audio/ogg; codecs=opus`. Jika konversi gagal, Feishu menerima file asli
  sebagai lampiran; pengiriman WhatsApp gagal alih-alih memposting payload
  PTT yang tidak kompatibel.
- **BlueBubbles**: mempertahankan sintesis provider pada jalur audio-file normal; output MP3
  dan CAF ditandai untuk pengiriman memo suara iMessage.
- **Channel lain**: MP3 (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI).
  - 44.1kHz / 128kbps adalah keseimbangan default untuk kejernihan ucapan.
- **MiniMax**: MP3 (model `speech-2.8-hd`, sample rate 32kHz) untuk lampiran audio normal. Untuk target voice-note yang diiklankan channel, OpenClaw mentranskode MP3 MiniMax ke Opus 48kHz dengan `ffmpeg` sebelum pengiriman saat channel mengiklankan transcoding.
- **Xiaomi MiMo**: MP3 secara default, atau WAV saat dikonfigurasi. Untuk target voice-note yang diiklankan channel, OpenClaw mentranskode output Xiaomi ke Opus 48kHz dengan `ffmpeg` sebelum pengiriman saat channel mengiklankan transcoding.
- **Local CLI**: menggunakan `outputFormat` yang dikonfigurasi. Target voice-note diubah
  ke Ogg/Opus dan output telepon diubah ke PCM mono mentah 16 kHz
  dengan `ffmpeg`.
- **Google Gemini**: Gemini API TTS mengembalikan PCM mentah 24kHz. OpenClaw membungkusnya sebagai WAV untuk lampiran audio, mentranskodenya ke Opus 48kHz untuk target voice-note, dan mengembalikan PCM secara langsung untuk Talk/telepon.
- **Gradium**: WAV untuk lampiran audio, Opus untuk target voice-note, dan `ulaw_8000` pada 8 kHz untuk telepon.
- **Inworld**: MP3 untuk lampiran audio normal, `OGG_OPUS` native untuk target voice-note, dan `PCM` mentah pada 22050 Hz untuk Talk/telepon.
- **xAI**: MP3 secara default; `responseFormat` dapat berupa `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw`. OpenClaw menggunakan endpoint TTS REST batch xAI dan mengembalikan lampiran audio lengkap; WebSocket TTS streaming xAI tidak digunakan oleh jalur provider ini. Format voice-note Opus native tidak didukung oleh jalur ini.
- **Microsoft**: menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`).
  - Transport bawaan menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan.
  - Nilai format output mengikuti format output Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan
    pesan suara Opus yang terjamin.
  - Jika format output Microsoft yang dikonfigurasi gagal, OpenClaw mencoba ulang dengan MP3.

Format output OpenAI/ElevenLabs ditetapkan per channel (lihat di atas).

## Perilaku auto-TTS

Saat `messages.tts.auto` diaktifkan, OpenClaw:

- Melewati TTS jika balasan sudah berisi media atau directive `MEDIA:`.
- Melewati balasan yang sangat pendek (kurang dari 10 karakter).
- Merangkum balasan yang panjang saat ringkasan diaktifkan, menggunakan
  `summaryModel` (atau `agents.defaults.model.primary`).
- Melampirkan audio yang dihasilkan ke balasan.
- Dalam `mode: "final"`, tetap mengirim TTS hanya-audio untuk balasan akhir yang di-stream
  setelah stream teks selesai; media yang dihasilkan melalui normalisasi media
  channel yang sama seperti lampiran balasan normal.

Jika balasan melebihi `maxLength` dan ringkasan nonaktif (atau tidak ada API key untuk
model ringkasan), audio dilewati dan balasan teks normal dikirim.

```text
Balasan -> TTS diaktifkan?
  tidak -> kirim teks
  ya    -> ada media / MEDIA: / pendek?
          ya    -> kirim teks
          tidak -> panjang > batas?
                   tidak -> TTS -> lampirkan audio
                   ya    -> ringkasan diaktifkan?
                            tidak -> kirim teks
                            ya    -> rangkum -> TTS -> lampirkan audio
```

## Format output berdasarkan channel

| Target                                | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Balasan voice-note mengutamakan **Opus** (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI). 48 kHz / 64 kbps menyeimbangkan kejernihan dan ukuran. |
| Channel lain                          | **MP3** (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI). 44.1 kHz / 128 kbps adalah default untuk ucapan.                      |
| Talk / telepon                        | **PCM** native provider (Inworld 22050 Hz, Google 24 kHz), atau `ulaw_8000` dari Gradium untuk telepon.                             |

Catatan per provider:

- **Transcoding Feishu / WhatsApp:** Saat balasan voice-note berupa MP3/WebM/WAV/M4A, plugin channel mentranskodenya ke Ogg/Opus 48 kHz dengan `ffmpeg`. WhatsApp mengirim melalui Baileys dengan `ptt: true` dan `audio/ogg; codecs=opus`. Jika konversi gagal: Feishu fallback ke melampirkan file asli; pengiriman WhatsApp gagal alih-alih memposting payload PTT yang tidak kompatibel.
- **MiniMax / Xiaomi MiMo:** MP3 default (32 kHz untuk MiniMax `speech-2.8-hd`); ditranskode ke Opus 48 kHz untuk target voice-note melalui `ffmpeg`.
- **Local CLI:** Menggunakan `outputFormat` yang dikonfigurasi. Target voice-note diubah ke Ogg/Opus dan output telepon ke PCM mono mentah 16 kHz.
- **Google Gemini:** Mengembalikan PCM mentah 24 kHz. OpenClaw membungkusnya sebagai WAV untuk lampiran, mentranskodenya ke Opus 48 kHz untuk target voice-note, dan mengembalikan PCM langsung untuk Talk/telepon.
- **Inworld:** Lampiran MP3, voice-note native `OGG_OPUS`, `PCM` mentah 22050 Hz untuk Talk/telepon.
- **xAI:** MP3 secara default; `responseFormat` dapat berupa `mp3|wav|pcm|mulaw|alaw`. Menggunakan endpoint REST batch xAI — WebSocket TTS streaming **tidak** digunakan. Format voice-note Opus native **tidak** didukung.
- **Microsoft:** Menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan pesan suara Opus yang terjamin. Jika format Microsoft yang dikonfigurasi gagal, OpenClaw mencoba ulang dengan MP3.

Format output OpenAI dan ElevenLabs ditetapkan per channel seperti tercantum di atas.

## Referensi field

<AccordionGroup>
  <Accordion title="messages.tts.* tingkat atas">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Mode auto-TTS. `inbound` hanya mengirim audio setelah pesan suara masuk; `tagged` hanya mengirim audio saat balasan menyertakan directive `[[tts:...]]` atau blok `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Toggle lama. `openclaw doctor --fix` memigrasikan ini ke `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` menyertakan balasan tool/blok selain balasan akhir.
    </ParamField>
    <ParamField path="provider" type="string">
      id provider speech. Saat tidak diatur, OpenClaw menggunakan provider terkonfigurasi pertama dalam urutan auto-select registry. `provider: "edge"` lama ditulis ulang ke `"microsoft"` oleh `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      id persona aktif dari `personas`. Dinormalisasi ke huruf kecil.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identitas suara stabil. Field: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Lihat [Persona](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Model murah untuk ringkasan otomatis; default ke `agents.defaults.model.primary`. Menerima `provider/model` atau alias model yang dikonfigurasi.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Izinkan model mengeluarkan directive TTS. `enabled` default ke `true`; `allowProvider` default ke `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Pengaturan milik provider yang dikunci berdasarkan id provider speech. Blok langsung lama (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) ditulis ulang oleh `openclaw doctor --fix`; commit hanya `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Batas keras untuk karakter input TTS. `/tts audio` gagal jika terlampaui.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Timeout permintaan dalam milidetik.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Timpa path JSON preferensi lokal (provider/batas/ringkasan). Default `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, atau `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Region Azure Speech (misalnya `eastus`). Env: `AZURE_SPEECH_REGION` atau `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Override endpoint Azure Speech opsional (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName voice Azure. Default `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Kode bahasa SSML. Default `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` untuk audio standar. Default `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` untuk output voice-note. Default `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Fallback ke `ELEVENLABS_API_KEY` atau `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">id model (misalnya `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">id voice ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (masing-masing `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Mode normalisasi teks.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 2 huruf (misalnya `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Bilangan bulat `0..4294967295` untuk determinisme best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Timpa base URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Fallback ke `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Jika dihilangkan, TTS dapat menggunakan kembali `models.providers.google.apiKey` sebelum fallback env.</ParamField>
    <ParamField path="model" type="string">Model Gemini TTS. Default `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nama voice bawaan Gemini. Default `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt gaya bahasa alami yang ditambahkan di awal sebelum teks yang diucapkan.</ParamField>
    <ParamField path="speakerName" type="string">Label pembicara opsional yang ditambahkan di awal sebelum teks yang diucapkan saat prompt Anda menggunakan pembicara bernama.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Atur ke `audio-profile-v1` untuk membungkus field prompt persona aktif dalam struktur prompt Gemini TTS yang deterministik.</ParamField>
    <ParamField path="personaPrompt" type="string">Teks prompt persona tambahan khusus Google yang ditambahkan ke Director's Notes template.</ParamField>
    <ParamField path="baseUrl" type="string">Hanya `https://generativelanguage.googleapis.com` yang diterima.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Default Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Default `inworld-tts-1.5-max`. Juga: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Default `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Suhu sampling `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Executable lokal atau string perintah untuk CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Argumen perintah. Mendukung placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Format output CLI yang diharapkan. Default `mp3` untuk lampiran audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Timeout perintah dalam milidetik. Default `120000`.</ParamField>
    <ParamField path="cwd" type="string">Direktori kerja perintah opsional.</ParamField>
    <ParamField path="env" type="Record<string, string>">Override environment opsional untuk perintah.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (tanpa API key)">
    <ParamField path="enabled" type="boolean" default="true">Izinkan penggunaan speech Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nama voice neural Microsoft (misalnya `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Kode bahasa (misalnya `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format output Microsoft. Default `audio-24khz-48kbitrate-mono-mp3`. Tidak semua format didukung oleh transport bawaan berbasis Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">String persen (misalnya `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Tulis subtitle JSON di samping file audio.</ParamField>
    <ParamField path="proxy" type="string">URL proxy untuk permintaan speech Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Override timeout permintaan (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias lama. Jalankan `openclaw doctor --fix` untuk menulis ulang config yang disimpan ke `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Fallback ke `MINIMAX_API_KEY`. Auth Token Plan melalui `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, atau `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Default `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Default `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Default `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Default `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Bilangan bulat `-12..12`. Default `0`. Nilai pecahan dipotong sebelum permintaan.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Fallback ke `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">id model OpenAI TTS (misalnya `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nama voice (misalnya `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Field `instructions` OpenAI eksplisit. Saat diatur, field prompt persona **tidak** dipetakan otomatis.</ParamField>
    <ParamField path="baseUrl" type="string">
      Timpa endpoint OpenAI TTS. Urutan resolusi: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Nilai non-default diperlakukan sebagai endpoint TTS yang kompatibel dengan OpenAI, sehingga nama model dan voice kustom diterima.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Dapat menggunakan ulang `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://openrouter.ai/api/v1`. `https://openrouter.ai/v1` lama dinormalisasi.</ParamField>
    <ParamField path="model" type="string">Default `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Default `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Default `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override kecepatan native provider.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Default `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Gunakan `seed-tts-2.0` saat project Anda memiliki entitlement TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Header app key. Default `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Timpa endpoint HTTP TTS Seed Speech. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Jenis voice. Default `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Rasio kecepatan native provider.</ParamField>
    <ParamField path="emotion" type="string">Tag emosi native provider.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Field lama Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (default `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Default `eve`. Voice live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Kode bahasa BCP-47 atau `auto`. Default `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Default `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override kecepatan native provider.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Default `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Juga mendukung `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Default `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Default `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instruksi gaya bahasa alami opsional yang dikirim sebagai pesan pengguna; tidak diucapkan.</ParamField>
  </Accordion>
</AccordionGroup>

## Tool agen

Tool `tts` mengubah teks menjadi speech dan mengembalikan lampiran audio untuk
pengiriman balasan. Di Feishu, Matrix, Telegram, dan WhatsApp, audio
dikirim sebagai pesan suara alih-alih lampiran file. Feishu dan
WhatsApp dapat mentranskode output TTS non-Opus pada jalur ini saat `ffmpeg`
tersedia.

WhatsApp mengirim audio melalui Baileys sebagai catatan suara PTT (`audio` dengan
`ptt: true`) dan mengirim teks yang terlihat **secara terpisah** dari audio PTT karena
klien tidak selalu merender caption pada catatan suara.

Tool ini menerima field `channel` dan `timeoutMs` opsional; `timeoutMs` adalah
timeout permintaan provider per panggilan dalam milidetik.

## RPC Gateway

| Method            | Tujuan                                   |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Membaca status TTS saat ini dan percobaan terakhir. |
| `tts.enable`      | Mengatur preferensi otomatis lokal ke `always`. |
| `tts.disable`     | Mengatur preferensi otomatis lokal ke `off`. |
| `tts.convert`     | Teks → audio sekali jalan.               |
| `tts.setProvider` | Mengatur preferensi provider lokal.      |
| `tts.setPersona`  | Mengatur preferensi persona lokal.       |
| `tts.providers`   | Mencantumkan provider yang dikonfigurasi dan statusnya. |

## Tautan layanan

- [Panduan OpenAI text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provider Azure Speech](/id/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/id/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/id/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/id/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Terkait

- [Ikhtisar media](/id/tools/media-overview)
- [Pembuatan musik](/id/tools/music-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Slash commands](/id/tools/slash-commands)
- [Plugin voice call](/id/plugins/voice-call)
