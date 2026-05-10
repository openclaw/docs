---
read_when:
    - Mengaktifkan teks-ke-ucapan untuk balasan
    - Mengonfigurasi penyedia TTS, rantai cadangan, atau persona
    - Menggunakan perintah atau arahan /tts
sidebarTitle: Text to speech (TTS)
summary: Teks ke ucapan untuk balasan keluar — penyedia, persona, perintah garis miring, dan keluaran per saluran
title: Teks ke ucapan
x-i18n:
    generated_at: "2026-05-10T19:57:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9beda419aa5171c7907a238d008bcab7e67e63900a7cadbe289e58c5585a564
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw dapat mengonversi balasan keluar menjadi audio di **14 penyedia ucapan**
dan mengirim pesan suara native di Feishu, Matrix, Telegram, dan WhatsApp,
lampiran audio di tempat lain, serta stream PCM/Ulaw untuk telepon dan Talk.

TTS adalah separuh keluaran ucapan dari mode `stt-tts` Talk. Sesi Talk
`realtime` native penyedia menyintesis ucapan di dalam penyedia realtime, bukan
memanggil jalur TTS ini, sementara sesi `transcription` tidak menyintesis
respons suara asisten.

## Mulai cepat

<Steps>
  <Step title="Pilih penyedia">
    OpenAI dan ElevenLabs adalah opsi hosted yang paling andal. Microsoft dan
    Local CLI berfungsi tanpa kunci API. Lihat [matriks penyedia](#supported-providers)
    untuk daftar lengkapnya.
  </Step>
  <Step title="Atur kunci API">
    Ekspor variabel env untuk penyedia Anda (misalnya `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft dan Local CLI tidak memerlukan kunci.
  </Step>
  <Step title="Aktifkan di konfigurasi">
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
    mengirim balasan audio sekali pakai.
  </Step>
</Steps>

<Note>
Auto-TTS **nonaktif** secara default. Ketika `messages.tts.provider` belum diatur,
OpenClaw memilih penyedia pertama yang dikonfigurasi dalam urutan pilih otomatis registry.
Tool agen `tts` bawaan hanya untuk niat eksplisit: chat biasa tetap berupa
teks kecuali pengguna meminta audio, menggunakan `/tts`, atau mengaktifkan ucapan
Auto-TTS/direktif.
</Note>

## Penyedia yang didukung

| Penyedia          | Auth                                                                                                             | Catatan                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (juga `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Keluaran catatan suara Ogg/Opus native dan telepon.                                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS kompatibel OpenAI. Default ke `hexgrad/Kokoro-82M`.                                     |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` atau `XI_API_KEY`                                                                           | Kloning suara, multibahasa, deterministik melalui `seed`; di-stream untuk pemutaran suara Discord. |
| **Google Gemini** | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                                                                           | TTS batch Gemini API; sadar persona melalui `promptTemplate: "audio-profile-v1"`.           |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Keluaran catatan suara dan telepon.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS streaming. Catatan suara Opus native dan telepon PCM.                               |
| **Local CLI**     | tidak ada                                                                                                        | Menjalankan perintah TTS lokal yang dikonfigurasi.                                          |
| **Microsoft**     | tidak ada                                                                                                        | TTS neural Edge publik melalui `node-edge-tts`. Upaya terbaik, tanpa SLA.                   |
| **MiniMax**       | `MINIMAX_API_KEY` (atau Paket Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)  | API T2A v2. Default ke `speech-2.8-hd`.                                                     |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Juga digunakan untuk ringkasan otomatis; mendukung persona `instructions`.                  |
| **OpenRouter**    | `OPENROUTER_API_KEY` (dapat memakai ulang `models.providers.openrouter.apiKey`)                                  | Model default `hexgrad/kokoro-82m`.                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token lama: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Penyedia gambar, video, dan ucapan bersama.                                                 |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS batch xAI. Catatan suara Opus native **tidak** didukung.                                |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo melalui completion chat Xiaomi.                                                    |

Jika beberapa penyedia dikonfigurasi, penyedia yang dipilih digunakan terlebih dahulu dan
yang lain menjadi opsi fallback. Ringkasan otomatis menggunakan `summaryModel` (atau
`agents.defaults.model.primary`), sehingga penyedia tersebut juga harus diautentikasi
jika Anda tetap mengaktifkan ringkasan.

<Warning>
Penyedia **Microsoft** bawaan menggunakan layanan TTS neural online Microsoft Edge
melalui `node-edge-tts`. Ini adalah layanan web publik tanpa SLA atau kuota yang
dipublikasikan — anggap sebagai upaya terbaik. Id penyedia lama `edge`
dinormalisasi menjadi `microsoft` dan `openclaw doctor --fix` menulis ulang
konfigurasi persisten; konfigurasi baru harus selalu menggunakan `microsoft`.
</Warning>

## Konfigurasi

Konfigurasi TTS berada di bawah `messages.tts` dalam `~/.openclaw/openclaw.json`. Pilih
preset dan sesuaikan blok penyedia:

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
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
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
  <Tab title="Microsoft (tanpa kunci)">
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

### Penggantian suara per agen

Gunakan `agents.list[].tts` ketika satu agen harus berbicara dengan penyedia,
suara, model, persona, atau mode Auto-TTS yang berbeda. Blok agen melakukan deep merge di atas
`messages.tts`, sehingga kredensial penyedia dapat tetap berada di konfigurasi penyedia global:

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

Untuk menetapkan persona per agen, atur `agents.list[].tts.persona` bersama
konfigurasi provider — ini menimpa `messages.tts.persona` global hanya untuk agen tersebut.

Urutan prioritas untuk balasan otomatis, `/tts audio`, `/tts status`, dan
tool agen `tts`:

1. `messages.tts`
2. `agents.list[].tts` aktif
3. override channel, ketika channel mendukung `channels.<channel>.tts`
4. override akun, ketika channel meneruskan `channels.<channel>.accounts.<id>.tts`
5. preferensi `/tts` lokal untuk host ini
6. direktif inline `[[tts:...]]` ketika [override model](#model-driven-directives) diaktifkan

Override channel dan akun menggunakan bentuk yang sama seperti `messages.tts` dan
melakukan deep-merge di atas lapisan sebelumnya, sehingga kredensial provider bersama dapat tetap berada di
`messages.tts` sementara channel atau akun bot hanya mengubah suara, model, persona,
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

**Persona** adalah identitas lisan stabil yang dapat diterapkan secara deterministik
di berbagai provider. Persona dapat mengutamakan satu provider, mendefinisikan intensi prompt
yang netral terhadap provider, dan membawa binding khusus provider untuk suara, model, template
prompt, seed, dan pengaturan suara.

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

### Persona lengkap (prompt netral provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
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

1. preferensi lokal `/tts persona <id>`, jika diatur.
2. `messages.tts.persona`, jika diatur.
3. Tanpa persona.

Pemilihan provider berjalan dengan prioritas eksplisit:

1. Override langsung (CLI, Gateway, Talk, direktif TTS yang diizinkan).
2. preferensi lokal `/tts provider <id>`.
3. `provider` milik persona aktif.
4. `messages.tts.provider`.
5. Pemilihan otomatis registry.

Untuk setiap upaya provider, OpenClaw menggabungkan konfigurasi dalam urutan ini:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Override permintaan tepercaya
4. Override direktif TTS yang dipancarkan model dan diizinkan

### Cara provider menggunakan prompt persona

Field prompt persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) bersifat **netral terhadap provider**. Setiap provider memutuskan cara
menggunakannya:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Membungkus field prompt persona dalam struktur prompt TTS Gemini **hanya ketika**
    konfigurasi provider Google efektif mengatur `promptTemplate: "audio-profile-v1"`
    atau `personaPrompt`. Field lama `audioProfile` dan `speakerName` masih
    ditambahkan di awal sebagai teks prompt khusus Google. Tag audio inline seperti
    `[whispers]` atau `[laughs]` di dalam blok `[[tts:text]]` dipertahankan
    di dalam transkrip Gemini; OpenClaw tidak membuat tag ini.
  </Accordion>
  <Accordion title="OpenAI">
    Memetakan field prompt persona ke field permintaan `instructions` **hanya ketika**
    tidak ada `instructions` OpenAI eksplisit yang dikonfigurasi. `instructions` eksplisit
    selalu menang.
  </Accordion>
  <Accordion title="Provider lain">
    Hanya menggunakan binding persona khusus provider di bawah
    `personas.<id>.providers.<provider>`. Field prompt persona diabaikan
    kecuali provider menerapkan pemetaan prompt-persona sendiri.
  </Accordion>
</AccordionGroup>

### Kebijakan fallback

`fallbackPolicy` mengontrol perilaku ketika persona **tidak memiliki binding** untuk
provider yang dicoba:

| Kebijakan           | Perilaku                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Default.** Field prompt yang netral terhadap provider tetap tersedia; provider dapat menggunakannya atau mengabaikannya.                    |
| `provider-defaults` | Persona dihilangkan dari persiapan prompt untuk upaya tersebut; provider menggunakan default netralnya sementara fallback ke provider lain berlanjut. |
| `fail`              | Lewati upaya provider tersebut dengan `reasonCode: "not_configured"` dan `personaBinding: "missing"`. Provider fallback tetap dicoba.          |

Seluruh permintaan TTS hanya gagal ketika **setiap** provider yang dicoba dilewati
atau gagal.

Pemilihan provider sesi Talk dibatasi pada sesi. Klien Talk sebaiknya memilih
id provider, id model, id suara, dan locale dari `talk.catalog` dan meneruskannya
melalui sesi Talk atau permintaan handoff. Membuka sesi suara sebaiknya
tidak mengubah `messages.tts` atau default provider Talk global.

## Direktif berbasis model

Secara default, asisten **dapat** memancarkan direktif `[[tts:...]]` untuk menimpa
suara, model, atau kecepatan untuk satu balasan, plus blok opsional
`[[tts:text]]...[[/tts:text]]` untuk isyarat ekspresif yang seharusnya muncul
hanya dalam audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Ketika `messages.tts.auto` adalah `"tagged"`, **direktif diperlukan** untuk memicu
audio. Pengiriman blok streaming menghapus direktif dari teks yang terlihat sebelum
channel melihatnya, bahkan ketika terpisah di blok yang bersebelahan.

`provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`. Ketika sebuah
balasan mendeklarasikan `provider=...`, key lain dalam direktif tersebut diurai
hanya oleh provider tersebut; key yang tidak didukung dihapus dan dilaporkan sebagai peringatan
direktif TTS.

**Key direktif yang tersedia:**

- `provider` (id provider terdaftar; memerlukan `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (pitch bilangan bulat MiniMax, −12 hingga 12; nilai pecahan dipotong)
- `emotion` (tag emosi Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Nonaktifkan override model sepenuhnya:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Izinkan pengalihan provider sambil tetap menjaga knob lain dapat dikonfigurasi:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Perintah slash

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
Perintah memerlukan pengirim yang berwenang (aturan allowlist/pemilik berlaku) dan antara
`commands.text` atau pendaftaran perintah native harus diaktifkan.
</Note>

Catatan perilaku:

- `/tts on` menulis preferensi TTS lokal ke `always`; `/tts off` menulisnya ke `off`.
- `/tts chat on|off|default` menulis override TTS otomatis yang dibatasi sesi untuk chat saat ini.
- `/tts persona <id>` menulis preferensi persona lokal; `/tts persona off` menghapusnya.
- `/tts latest` membaca balasan asisten terbaru dari transkrip sesi saat ini dan mengirimkannya sebagai audio satu kali. Perintah ini hanya menyimpan hash balasan tersebut pada entri sesi untuk menekan pengiriman suara duplikat.
- `/tts audio` menghasilkan balasan audio sekali pakai (tidak **mengaktifkan** TTS).
- `limit` dan `summary` disimpan di **preferensi lokal**, bukan konfigurasi utama.
- `/tts status` menyertakan diagnostik fallback untuk upaya terbaru — `Fallback: <primary> -> <used>`, `Attempts: ...`, dan detail per upaya (`provider:outcome(reasonCode) latency`).
- `/status` menampilkan mode TTS aktif plus provider, model, suara, dan metadata endpoint kustom yang disanitasi ketika TTS diaktifkan.

## Preferensi per pengguna

Perintah slash menulis override lokal ke `prefsPath`. Default-nya adalah
`~/.openclaw/settings/tts.json`; timpa dengan variabel env `OPENCLAW_TTS_PREFS`
atau `messages.tts.prefsPath`.

| Field tersimpan | Efek                                         |
| --------------- | -------------------------------------------- |
| `auto`          | Override TTS otomatis lokal (`always`, `off`, …) |
| `provider`      | Override provider utama lokal                |
| `persona`       | Override persona lokal                       |
| `maxLength`     | Ambang ringkasan (default `1500` karakter)   |
| `summarize`     | Toggle ringkasan (default `true`)            |

Ini menimpa konfigurasi efektif dari `messages.tts` plus blok
`agents.list[].tts` aktif untuk host tersebut.

## Format output (tetap)

Pengiriman suara TTS digerakkan oleh kapabilitas channel. Plugin channel mengiklankan
apakah TTS bergaya suara harus meminta target `voice-note` native kepada provider atau
mempertahankan sintesis `audio-file` normal dan hanya menandai output yang kompatibel untuk pengiriman
suara.

- **Saluran yang mendukung catatan suara**: balasan catatan suara lebih memilih Opus (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI).
  - 48kHz / 64kbps adalah tradeoff yang baik untuk pesan suara.
- **Feishu / WhatsApp**: ketika balasan catatan suara dibuat sebagai MP3/WebM/WAV/M4A
  atau file audio lain yang kemungkinan sesuai, Plugin saluran mentranskodenya ke 48kHz
  Ogg/Opus dengan `ffmpeg` sebelum mengirim pesan suara native. WhatsApp mengirim
  hasilnya melalui payload `audio` Baileys dengan `ptt: true` dan
  `audio/ogg; codecs=opus`. Jika konversi gagal, Feishu menerima file asli
  sebagai lampiran; pengiriman WhatsApp gagal alih-alih memposting payload PTT
  yang tidak kompatibel.
- **Saluran lain**: MP3 (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI).
  - 44.1kHz / 128kbps adalah keseimbangan default untuk kejernihan ucapan.
- **MiniMax**: MP3 (model `speech-2.8-hd`, laju sampel 32kHz) untuk lampiran audio normal. Untuk target catatan suara yang diiklankan saluran, OpenClaw mentranskode MP3 MiniMax ke Opus 48kHz dengan `ffmpeg` sebelum pengiriman ketika saluran mengiklankan transcoding.
- **Xiaomi MiMo**: MP3 secara default, atau WAV ketika dikonfigurasi. Untuk target catatan suara yang diiklankan saluran, OpenClaw mentranskode output Xiaomi ke Opus 48kHz dengan `ffmpeg` sebelum pengiriman ketika saluran mengiklankan transcoding.
- **CLI Lokal**: menggunakan `outputFormat` yang dikonfigurasi. Target catatan suara
  dikonversi ke Ogg/Opus dan output telepon dikonversi ke PCM mono mentah 16 kHz
  dengan `ffmpeg`.
- **Google Gemini**: TTS Gemini API mengembalikan PCM mentah 24kHz. OpenClaw membungkusnya sebagai WAV untuk lampiran audio, mentranskodenya ke Opus 48kHz untuk target catatan suara, dan mengembalikan PCM langsung untuk Talk/telepon.
- **Gradium**: WAV untuk lampiran audio, Opus untuk target catatan suara, dan `ulaw_8000` pada 8 kHz untuk telepon.
- **Inworld**: MP3 untuk lampiran audio normal, `OGG_OPUS` native untuk target catatan suara, dan `PCM` mentah pada 22050 Hz untuk Talk/telepon.
- **xAI**: MP3 secara default; `responseFormat` dapat berupa `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw`. OpenClaw menggunakan endpoint TTS REST batch xAI dan mengembalikan lampiran audio lengkap; WebSocket TTS streaming xAI tidak digunakan oleh jalur penyedia ini. Format catatan suara Opus native tidak didukung oleh jalur ini.
- **Microsoft**: menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`).
  - Transport yang dibundel menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan.
  - Nilai format output mengikuti format output Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan
    pesan suara Opus yang terjamin.
  - Jika format output Microsoft yang dikonfigurasi gagal, OpenClaw mencoba lagi dengan MP3.

Format output OpenAI/ElevenLabs bersifat tetap per saluran (lihat di atas).

## Perilaku Auto-TTS

Ketika `messages.tts.auto` diaktifkan, OpenClaw:

- Melewati TTS jika balasan sudah berisi media atau direktif `MEDIA:`.
- Melewati balasan yang sangat pendek (di bawah 10 karakter).
- Meringkas balasan panjang ketika ringkasan diaktifkan, menggunakan
  `summaryModel` (atau `agents.defaults.model.primary`).
- Melampirkan audio yang dihasilkan ke balasan.
- Dalam `mode: "final"`, tetap mengirim TTS hanya-audio untuk balasan final yang di-streaming
  setelah stream teks selesai; media yang dihasilkan melalui normalisasi media
  saluran yang sama seperti lampiran balasan normal.

Jika balasan melebihi `maxLength` dan ringkasan nonaktif (atau tidak ada API key untuk
model ringkasan), audio dilewati dan balasan teks normal dikirim.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Format output berdasarkan saluran

  | Target                                | Format                                                                                                                                   |
  | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Balasan catatan suara lebih memilih **Opus** (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI). 48 kHz / 64 kbps menyeimbangkan kejernihan dan ukuran. |
  | Saluran lain                          | **MP3** (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI). 44.1 kHz / 128 kbps default untuk ucapan.                                  |
  | Talk / telefoni                       | **PCM** native penyedia (Inworld 22050 Hz, Google 24 kHz), atau `ulaw_8000` dari Gradium untuk telefoni.                                  |

  Catatan per penyedia:

  - **Transkode Feishu / WhatsApp:** Ketika balasan catatan suara masuk sebagai MP3/WebM/WAV/M4A, plugin saluran mentranskode ke Ogg/Opus 48 kHz dengan `ffmpeg`. WhatsApp mengirim melalui Baileys dengan `ptt: true` dan `audio/ogg; codecs=opus`. Jika konversi gagal: Feishu fallback dengan melampirkan file asli; pengiriman WhatsApp gagal alih-alih memposting payload PTT yang tidak kompatibel.
  - **MiniMax / Xiaomi MiMo:** MP3 default (32 kHz untuk MiniMax `speech-2.8-hd`); ditranskode ke Opus 48 kHz untuk target catatan suara melalui `ffmpeg`.
  - **CLI lokal:** Menggunakan `outputFormat` yang dikonfigurasi. Target catatan suara dikonversi ke Ogg/Opus dan keluaran telefoni ke PCM mono 16 kHz mentah.
  - **Google Gemini:** Mengembalikan PCM 24 kHz mentah. OpenClaw membungkusnya sebagai WAV untuk lampiran, mentranskode ke Opus 48 kHz untuk target catatan suara, mengembalikan PCM langsung untuk Talk/telefoni.
  - **Inworld:** Lampiran MP3, catatan suara `OGG_OPUS` native, `PCM` mentah 22050 Hz untuk Talk/telefoni.
  - **xAI:** MP3 secara default; `responseFormat` dapat berupa `mp3|wav|pcm|mulaw|alaw`. Menggunakan endpoint REST batch xAI — TTS WebSocket streaming **tidak** digunakan. Format catatan suara Opus native **tidak** didukung.
  - **Microsoft:** Menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` Telegram menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan pesan suara Opus yang dijamin. Jika format Microsoft yang dikonfigurasi gagal, OpenClaw mencoba ulang dengan MP3.

  Format keluaran OpenAI dan ElevenLabs ditetapkan per saluran seperti yang tercantum di atas.

  ## Referensi bidang

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Mode Auto-TTS. `inbound` hanya mengirim audio setelah pesan suara masuk; `tagged` hanya mengirim audio ketika balasan menyertakan direktif `[[tts:...]]` atau blok `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Toggle lama. `openclaw doctor --fix` memigrasikan ini ke `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` menyertakan balasan alat/blok selain balasan final.
    </ParamField>
    <ParamField path="provider" type="string">
      ID penyedia ucapan. Jika tidak disetel, OpenClaw menggunakan penyedia pertama yang dikonfigurasi dalam urutan pilih otomatis registry. `provider: "edge"` lama ditulis ulang menjadi `"microsoft"` oleh `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID persona aktif dari `personas`. Dinormalisasi ke huruf kecil.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identitas lisan yang stabil. Bidang: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Lihat [Persona](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Model murah untuk ringkasan otomatis; default ke `agents.defaults.model.primary`. Menerima `provider/model` atau alias model yang dikonfigurasi.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Izinkan model memancarkan direktif TTS. `enabled` default ke `true`; `allowProvider` default ke `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Pengaturan milik penyedia yang dikunci berdasarkan ID penyedia ucapan. Blok langsung lama (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) ditulis ulang oleh `openclaw doctor --fix`; commit hanya `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Batas keras untuk karakter input TTS. `/tts audio` gagal jika terlampaui.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Timeout permintaan dalam milidetik.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Timpa path JSON preferensi lokal (penyedia/batas/ringkasan). Default `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, atau `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Region Azure Speech (mis. `eastus`). Env: `AZURE_SPEECH_REGION` atau `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Penimpaan endpoint Azure Speech opsional (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName suara Azure. Default `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Kode bahasa SSML. Default `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` Azure untuk audio standar. Default `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` Azure untuk keluaran catatan suara. Default `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Fallback ke `ELEVENLABS_API_KEY` atau `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID model (mis. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ID suara ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (masing-masing `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Mode normalisasi teks.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 2 huruf (mis. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Bilangan bulat `0..4294967295` untuk determinisme best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Timpa URL dasar API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Fallback ke `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Jika dihilangkan, TTS dapat menggunakan kembali `models.providers.google.apiKey` sebelum fallback env.</ParamField>
    <ParamField path="model" type="string">Model TTS Gemini. Default `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nama suara bawaan Gemini. Default `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt gaya bahasa alami yang ditambahkan sebelum teks lisan.</ParamField>
    <ParamField path="speakerName" type="string">Label pembicara opsional yang ditambahkan sebelum teks lisan ketika prompt Anda menggunakan pembicara bernama.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Setel ke `audio-profile-v1` untuk membungkus bidang prompt persona aktif dalam struktur prompt TTS Gemini yang deterministik.</ParamField>
    <ParamField path="personaPrompt" type="string">Teks prompt persona ekstra khusus Google yang ditambahkan ke Catatan Sutradara template.</ParamField>
    <ParamField path="baseUrl" type="string">Hanya `https://generativelanguage.googleapis.com` yang diterima.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Lingkungan: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Bawaan `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Bawaan Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Primer Inworld

    <ParamField path="apiKey" type="string">Lingkungan: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Bawaan `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Bawaan `inworld-tts-1.5-max`. Juga: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Bawaan `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Suhu sampling `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI Lokal (tts-local-cli)">
    <ParamField path="command" type="string">Executable lokal atau string perintah untuk CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Argumen perintah. Mendukung placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Format output CLI yang diharapkan. Bawaan `mp3` untuk lampiran audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Batas waktu perintah dalam milidetik. Bawaan `120000`.</ParamField>
    <ParamField path="cwd" type="string">Direktori kerja perintah opsional.</ParamField>
    <ParamField path="env" type="Record<string, string>">Override lingkungan opsional untuk perintah.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (tanpa kunci API)">
    <ParamField path="enabled" type="boolean" default="true">Izinkan penggunaan suara Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nama suara neural Microsoft (mis. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Kode bahasa (mis. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format output Microsoft. Bawaan `audio-24khz-48kbitrate-mono-mp3`. Tidak semua format didukung oleh transport bawaan berbasis Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">String persen (mis. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Tulis subtitel JSON bersama file audio.</ParamField>
    <ParamField path="proxy" type="string">URL proksi untuk permintaan suara Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Override batas waktu permintaan (md).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias lama. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Fallback ke `MINIMAX_API_KEY`. Autentikasi Token Plan melalui `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, atau `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Bawaan `https://api.minimax.io`. Lingkungan: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Bawaan `speech-2.8-hd`. Lingkungan: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Bawaan `English_expressive_narrator`. Lingkungan: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Bawaan `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Bawaan `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Bilangan bulat `-12..12`. Bawaan `0`. Nilai pecahan dipotong sebelum permintaan.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Fallback ke `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID model TTS OpenAI (mis. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nama suara (mis. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Kolom OpenAI `instructions` eksplisit. Saat disetel, kolom prompt persona **tidak** dipetakan otomatis.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Kolom JSON tambahan yang digabungkan ke dalam body permintaan `/audio/speech` setelah kolom TTS OpenAI yang dihasilkan. Gunakan ini untuk endpoint yang kompatibel dengan OpenAI seperti Kokoro yang memerlukan kunci khusus penyedia seperti `lang`; kunci prototipe yang tidak aman diabaikan.</ParamField>
    <ParamField path="baseUrl" type="string">
      Override endpoint TTS OpenAI. Urutan resolusi: konfigurasi → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Nilai non-bawaan diperlakukan sebagai endpoint TTS yang kompatibel dengan OpenAI, sehingga nama model dan suara khusus diterima.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Lingkungan: `OPENROUTER_API_KEY`. Dapat menggunakan ulang `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Bawaan `https://openrouter.ai/api/v1`. Lama `https://openrouter.ai/v1` dinormalisasi.</ParamField>
    <ParamField path="model" type="string">Bawaan `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Bawaan `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Bawaan `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override kecepatan bawaan penyedia.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Lingkungan: `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Bawaan `seed-tts-1.0`. Lingkungan: `VOLCENGINE_TTS_RESOURCE_ID`. Gunakan `seed-tts-2.0` saat proyek Anda memiliki hak TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Header kunci aplikasi. Bawaan `aGjiRDfUWi`. Lingkungan: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Override endpoint HTTP Seed Speech TTS. Lingkungan: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Jenis suara. Bawaan `en_female_anna_mars_bigtts`. Lingkungan: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Rasio kecepatan bawaan penyedia.</ParamField>
    <ParamField path="emotion" type="string">Tag emosi bawaan penyedia.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Kolom lama Volcengine Speech Console. Lingkungan: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (bawaan `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Lingkungan: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Bawaan `https://api.x.ai/v1`. Lingkungan: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Bawaan `eve`. Suara live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Kode bahasa BCP-47 atau `auto`. Bawaan `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Bawaan `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override kecepatan bawaan penyedia.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Lingkungan: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Bawaan `https://api.xiaomimimo.com/v1`. Lingkungan: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Bawaan `mimo-v2.5-tts`. Lingkungan: `XIAOMI_TTS_MODEL`. Juga mendukung `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Bawaan `mimo_default`. Lingkungan: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Bawaan `mp3`. Lingkungan: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instruksi gaya bahasa alami opsional yang dikirim sebagai pesan pengguna; tidak diucapkan.</ParamField>
  </Accordion>
</AccordionGroup>

## Alat agen

Alat `tts` mengonversi teks menjadi ucapan dan mengembalikan lampiran audio untuk
pengiriman balasan. Di Feishu, Matrix, Telegram, dan WhatsApp, audio
dikirim sebagai pesan suara, bukan lampiran file. Feishu dan
WhatsApp dapat mentranskode output TTS non-Opus pada jalur ini saat `ffmpeg`
tersedia.

WhatsApp mengirim audio melalui Baileys sebagai catatan suara PTT (`audio` dengan
`ptt: true`) dan mengirim teks yang terlihat **secara terpisah** dari audio PTT karena
klien tidak selalu merender keterangan pada catatan suara secara konsisten.

Alat ini menerima kolom `channel` dan `timeoutMs` opsional; `timeoutMs` adalah
batas waktu permintaan penyedia per panggilan dalam milidetik.

## RPC Gateway

| Metode            | Tujuan                                   |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Membaca status TTS saat ini dan percobaan terakhir. |
| `tts.enable`      | Mengatur preferensi otomatis lokal ke `always`. |
| `tts.disable`     | Mengatur preferensi otomatis lokal ke `off`. |
| `tts.convert`     | Teks satu kali → audio.                  |
| `tts.setProvider` | Mengatur preferensi penyedia lokal.      |
| `tts.setPersona`  | Mengatur preferensi persona lokal.       |
| `tts.providers`   | Mencantumkan penyedia yang dikonfigurasi dan statusnya. |

## Tautan layanan

- [Panduan teks-ke-ucapan OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Teks-ke-ucapan REST Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Penyedia Azure Speech](/id/providers/azure-speech)
- [Teks ke Ucapan ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autentikasi ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/id/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/id/providers/volcengine#text-to-speech)
- [Sintesis ucapan Xiaomi MiMo](/id/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Teks ke ucapan xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Terkait

- [Ikhtisar media](/id/tools/media-overview)
- [Pembuatan musik](/id/tools/music-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Perintah slash](/id/tools/slash-commands)
- [Plugin panggilan suara](/id/plugins/voice-call)
