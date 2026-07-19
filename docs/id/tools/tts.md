---
read_when:
    - Mengaktifkan text-to-speech untuk balasan
    - Mengonfigurasi penyedia TTS, rantai fallback, atau persona
    - Menggunakan perintah atau direktif /tts
sidebarTitle: Text to speech (TTS)
summary: Teks-ke-ucapan untuk balasan keluar — penyedia, persona, perintah garis miring, dan keluaran per kanal
title: Teks-ke-ucapan
x-i18n:
    generated_at: "2026-07-19T05:13:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0f4bc2832eab2579960c4afaa7ec1ed91b6eb452d0f268914a383c2a5c03157e
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw mengonversi balasan keluar menjadi audio melalui **14 penyedia ucapan**:
pesan suara native di Feishu, Matrix, Telegram, dan WhatsApp; lampiran audio
di tempat lain; serta stream PCM/Ulaw untuk telefoni dan Talk.

TTS adalah bagian keluaran ucapan dari mode `stt-tts` Talk (`talk.speak` menggunakan
jalur sintesis yang sama). Sesi Talk `realtime` yang native dari penyedia menyintesis
ucapan di dalam penyedia waktu nyata; sesi `transcription` tidak pernah
menyintesis balasan suara asisten.

## Mulai cepat

<Steps>
  <Step title="Pilih penyedia">
    OpenAI dan ElevenLabs adalah opsi terkelola yang paling andal. Microsoft dan
    CLI Lokal berfungsi tanpa kunci API. Lihat [matriks penyedia](#supported-providers)
    untuk daftar lengkap.
  </Step>
  <Step title="Atur kunci API">
    Ekspor variabel lingkungan untuk penyedia Anda (misalnya `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft dan CLI Lokal tidak memerlukan kunci.
  </Step>
  <Step title="Aktifkan dalam konfigurasi">
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
  <Step title="Coba dalam obrolan">
    `/tts status` menampilkan status saat ini. `/tts audio Hello from OpenClaw`
    mengirim balasan audio satu kali.
  </Step>
</Steps>

<Note>
TTS otomatis **nonaktif** secara default. Saat `messages.tts.provider` tidak diatur,
OpenClaw memilih penyedia pertama yang dikonfigurasi berdasarkan urutan pemilihan otomatis registri.
Alat agen bawaan `tts` hanya untuk maksud eksplisit: obrolan biasa tetap berupa
teks kecuali pengguna meminta audio, menggunakan `/tts`, atau mengaktifkan TTS otomatis/ucapan
direktif.
</Note>

## Penyedia yang didukung

| Penyedia          | Autentikasi                                                                                                      | Catatan                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (juga `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Keluaran catatan suara Ogg/Opus native dan telefoni.                                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                               | TTS yang kompatibel dengan OpenAI. Defaultnya `hexgrad/Kokoro-82M`.                           |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` atau `XI_API_KEY`                                                                       | Kloning suara, multibahasa, deterministik melalui `seed`; dialirkan untuk pemutaran suara Discord. |
| **Google Gemini** | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                                                                       | TTS batch Gemini API; memahami persona melalui `promptTemplate: "audio-profile-v1"`.                          |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                               | Keluaran catatan suara dan telefoni.                                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                               | API TTS streaming. Catatan suara Opus native dan telefoni PCM.                              |
| **CLI Lokal**     | tidak ada                                                                                                        | Menjalankan perintah TTS lokal yang dikonfigurasi.                                          |
| **Microsoft**     | tidak ada                                                                                                        | TTS neural Edge publik melalui `node-edge-tts`. Upaya terbaik, tanpa SLA.                 |
| **MiniMax**       | `MINIMAX_API_KEY` (atau Paket Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                 | API T2A v2. Defaultnya `speech-2.8-hd`.                                                   |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                               | Juga digunakan untuk ringkasan otomatis; mendukung persona `instructions`.              |
| **OpenRouter**    | `OPENROUTER_API_KEY` (dapat menggunakan kembali `models.providers.openrouter.apiKey`)                                                | Model default `hexgrad/kokoro-82m`.                                                           |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token lama: `VOLCENGINE_TTS_APPID`/`_TOKEN`)              | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                               | Penyedia bersama untuk gambar, video, dan ucapan.                                           |
| **xAI**           | `XAI_API_KEY`                                                                                               | TTS batch xAI. Catatan suara Opus native **tidak** didukung.                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                               | TTS MiMo melalui penyelesaian obrolan Xiaomi.                                                |

Jika beberapa penyedia dikonfigurasi, penyedia yang dipilih digunakan terlebih dahulu dan
penyedia lainnya menjadi opsi fallback. Ringkasan otomatis menggunakan `summaryModel` (atau
`agents.defaults.model.primary`), sehingga penyedia tersebut juga harus diautentikasi
jika ringkasan tetap diaktifkan.

<Warning>
Penyedia bawaan **Microsoft** menggunakan layanan TTS neural daring Microsoft Edge
melalui `node-edge-tts`. Ini adalah layanan web publik tanpa SLA atau kuota yang
dipublikasikan—perlakukan sebagai upaya terbaik. ID penyedia lama `edge`
dinormalisasi menjadi `microsoft` dan `openclaw doctor --fix` menulis ulang konfigurasi
yang disimpan; konfigurasi baru harus selalu menggunakan `microsoft`.
</Warning>

## Konfigurasi

Konfigurasi TTS berada di bawah `messages.tts` dalam `~/.openclaw/openclaw.json`. Pilih
preset dan sesuaikan blok penyedia. Kolom `speakerVoice`/`speakerVoiceId`
yang ditampilkan di bawah bersifat kanonis; nama kolom `voice`/`voiceId`/
`voiceName` milik setiap penyedia tetap berfungsi sebagai alias lama.

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // Perintah gaya bahasa alami opsional:
          // audioProfile: "Bicaralah dengan nada tenang seperti pembawa acara podcast.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="CLI Lokal">
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
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Untuk Xiaomi `mimo-v2.5-tts-voicedesign`, hilangkan `speakerVoice` dan atur `style` menjadi
perintah desain suara. OpenClaw mengirim perintah tersebut sebagai pesan TTS `user`
dan tidak mengirim `audio.voice` untuk model voicedesign.

### Penggantian suara per agen

Gunakan `agents.list[].tts` ketika satu agen harus berbicara dengan penyedia,
suara, model, persona, atau mode TTS otomatis yang berbeda. Blok agen digabungkan secara mendalam di atas
`messages.tts`, sehingga kredensial penyedia dapat tetap berada dalam konfigurasi penyedia global:

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Untuk menetapkan persona per agen, atur `agents.list[].tts.persona` bersama konfigurasi
penyedia — pengaturan ini menggantikan `messages.tts.persona` global hanya untuk agen tersebut.

Urutan prioritas untuk balasan otomatis, `/tts audio`, `/tts status`, dan
alat agen `tts`:

1. `messages.tts`
2. `agents.list[].tts` aktif
3. penggantian saluran, ketika saluran mendukung `channels.<channel>.tts`
4. penggantian akun, ketika saluran meneruskan `channels.<channel>.accounts.<id>.tts`
5. preferensi `/tts` lokal untuk host ini
6. direktif `[[tts:...]]` sebaris ketika [penggantian model](#model-driven-directives) diaktifkan

Penggantian saluran dan akun menggunakan bentuk yang sama dengan `messages.tts` dan
digabungkan secara mendalam di atas lapisan sebelumnya, sehingga kredensial penyedia bersama dapat tetap berada di
`messages.tts`, sementara saluran atau akun bot hanya mengubah suara pembicara, model, persona,
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
              openai: { speakerVoice: "shimmer" },
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
di berbagai penyedia. Persona dapat memprioritaskan satu penyedia, menentukan maksud prompt yang
netral terhadap penyedia, dan membawa pengikatan khusus penyedia untuk suara, model, templat
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
          label: "Narator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Persona lengkap (prompt netral terhadap penyedia)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Narator kepala pelayan Inggris yang tenang, hangat, dan jenaka.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Kepala pelayan Inggris yang cerdas. Tenang, jenaka, hangat, menawan, ekspresif secara emosional, dan tidak pernah generik.",
            scene: "Ruang kerja yang tenang pada larut malam. Narasi dengan mikrofon dekat untuk operator tepercaya.",
            sampleContext: "Pembicara menjawab permintaan teknis pribadi dengan keyakinan yang ringkas dan kehangatan yang jenaka.",
            style: "Berkelas, bersahaja, sedikit geli.",
            accent: "Bahasa Inggris Britania.",
            pacing: "Terukur, dengan jeda dramatis singkat.",
            constraints: ["Jangan bacakan nilai konfigurasi.", "Jangan jelaskan persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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
3. Tanpa persona.

Pemilihan penyedia mendahulukan pengaturan eksplisit:

1. Penggantian langsung (CLI, Gateway, Talk, direktif TTS yang diizinkan).
2. Preferensi lokal `/tts provider <id>`.
3. `provider` milik persona aktif.
4. `messages.tts.provider`.
5. Pemilihan otomatis dari registri.

Untuk setiap percobaan penyedia, OpenClaw menggabungkan konfigurasi dalam urutan berikut:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Penggantian permintaan tepercaya
4. Penggantian direktif TTS yang dihasilkan model dan diizinkan

### Cara penyedia menggunakan prompt persona

Bidang prompt persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) bersifat **netral terhadap penyedia**. Setiap penyedia menentukan cara
menggunakannya:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Membungkus bidang prompt persona dalam struktur prompt TTS Gemini **hanya ketika**
    konfigurasi efektif penyedia Google menetapkan `promptTemplate: "audio-profile-v1"`
    atau `personaPrompt`. Bidang lama `audioProfile` dan `speakerName`
    tetap ditambahkan di awal sebagai teks prompt khusus Google. Tag audio sebaris seperti
    `[whispers]` atau `[laughs]` di dalam blok `[[tts:text]]` dipertahankan
    dalam transkrip Gemini; OpenClaw tidak menghasilkan tag tersebut.
  </Accordion>
  <Accordion title="OpenAI">
    Memetakan bidang prompt persona ke bidang permintaan `instructions` **hanya ketika**
    tidak ada `instructions` OpenAI eksplisit yang dikonfigurasi. `instructions` eksplisit
    selalu diutamakan.
  </Accordion>
  <Accordion title="Penyedia lain">
    Hanya menggunakan pengikatan persona khusus penyedia di bawah
    `personas.<id>.providers.<provider>`. Bidang prompt persona diabaikan
    kecuali penyedia menerapkan pemetaan prompt personanya sendiri.
  </Accordion>
</AccordionGroup>

### Kebijakan fallback

`fallbackPolicy` mengontrol perilaku ketika persona **tidak memiliki pengikatan** untuk
penyedia yang dicoba:

| Kebijakan           | Perilaku                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Default.** Bidang prompt netral terhadap penyedia tetap tersedia; penyedia dapat menggunakan atau mengabaikannya.                                                             |
| `provider-defaults` | Persona tidak disertakan dalam persiapan prompt untuk percobaan tersebut; penyedia menggunakan default netralnya sementara fallback ke penyedia lain berlanjut.                 |
| `fail`              | Lewati percobaan penyedia tersebut dengan `reasonCode: "not_configured"` dan `personaBinding: "missing"`. Penyedia fallback tetap dicoba.                                       |

Seluruh permintaan TTS hanya gagal ketika **setiap** penyedia yang dicoba dilewati
atau gagal.

Pemilihan penyedia sesi Talk memiliki cakupan sesi. Klien Talk harus memilih
ID penyedia, ID model, ID suara, dan lokal dari `talk.catalog`, lalu meneruskannya
melalui permintaan sesi atau serah terima Talk. Membuka sesi suara tidak boleh
mengubah `messages.tts` atau default penyedia Talk global.

## Direktif yang digerakkan model

Secara default, asisten **dapat** menghasilkan direktif `[[tts:...]]` untuk mengganti
suara, model, atau kecepatan untuk satu balasan, ditambah blok opsional
`[[tts:text]]...[[/tts:text]]` untuk isyarat ekspresif yang hanya boleh muncul dalam
audio:

```text
Ini dia.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](tertawa) Bacakan lagu itu sekali lagi.[[/tts:text]]
```

Ketika `messages.tts.auto` adalah `"tagged"`, **direktif diwajibkan** untuk memicu
audio. Pengiriman blok streaming menghapus direktif dari teks yang terlihat sebelum
saluran menerimanya, bahkan ketika direktif terbagi di antara blok yang berdekatan.

`provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`. Ketika sebuah
balasan mendeklarasikan `provider=...`, kunci lain dalam direktif tersebut diurai
hanya oleh penyedia itu; kunci yang tidak didukung dihapus dan dilaporkan sebagai
peringatan direktif TTS.

**Kunci direktif yang tersedia:**

- `provider` (ID penyedia terdaftar; memerlukan `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias lama: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, `(0, 10]`)
- `pitch` (nada bilangan bulat MiniMax, −12 hingga 12; nilai pecahan dipotong)
- `emotion` (tag emosi Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Nonaktifkan penggantian model sepenuhnya:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Izinkan peralihan penyedia sambil mempertahankan konfigurabilitas pengaturan lain:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Perintah garis miring

Perintah tunggal `/tts`. Di Discord, OpenClaw juga mendaftarkan `/voice` karena
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
Perintah memerlukan pengirim yang diotorisasi (aturan daftar izin/pemilik berlaku) dan
`commands.text` atau pendaftaran perintah native harus diaktifkan.
</Note>

Catatan perilaku:

- `/tts on` menulis preferensi TTS lokal ke `always`; `/tts off` menulisnya ke `off`.
- `/tts chat on|off|default` menulis penggantian TTS otomatis dengan cakupan sesi untuk percakapan saat ini.
- `/tts persona <id>` menulis preferensi persona lokal; `/tts persona off` menghapusnya.
- `/tts latest` membaca balasan asisten terbaru dari transkrip sesi saat ini dan mengirimkannya satu kali sebagai audio. Perintah ini hanya menyimpan hash balasan tersebut pada entri sesi untuk mencegah pengiriman suara duplikat.
- `/tts audio` menghasilkan balasan audio satu kali (dan **tidak** mengaktifkan TTS).
- `/tts limit <chars>` menerima **100–4096** (4096 adalah batas maksimum keterangan/pesan Telegram); nilai di luar rentang tersebut ditolak.
- `limit` dan `summary` disimpan dalam **preferensi lokal**, bukan konfigurasi utama.
- `/tts status` menyertakan diagnostik fallback untuk percobaan terbaru — `Fallback: <primary> -> <used>`, `Attempts: ...`, dan detail per percobaan (`provider:outcome(reasonCode) latency`).
- `/status` menampilkan mode TTS aktif beserta penyedia, model, suara, dan metadata titik akhir khusus yang telah disanitasi saat TTS diaktifkan.

## Preferensi per pengguna

Perintah garis miring menulis penggantian lokal ke `prefsPath`. Default-nya adalah
`~/.openclaw/settings/tts.json`; ganti dengan variabel lingkungan `OPENCLAW_TTS_PREFS`
atau `messages.tts.prefsPath`.

| Bidang tersimpan | Efek                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Penggantian otomatis TTS lokal (`always`, `off`, …)                                     |
| `provider`   | Penggantian penyedia utama lokal                                                  |
| `persona`    | Penggantian persona lokal                                                           |
| `maxLength`  | Ambang batas ringkasan/pemotongan (bawaan `1500` karakter, rentang `/tts limit` 100–4096) |
| `summarize`  | Tombol ringkasan (bawaan `true`)                                                  |

Ini menggantikan konfigurasi efektif dari `messages.tts` beserta blok
`agents.list[].tts` aktif untuk host tersebut.

## Format keluaran

Pengiriman suara TTS ditentukan oleh kemampuan kanal. Plugin kanal mengiklankan
apakah TTS bergaya suara harus meminta target `voice-note` native dari penyedia atau
mempertahankan sintesis `audio-file` normal, serta apakah kanal mentranskode
keluaran non-native sebelum mengirimkannya.

| Target                                | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Balasan pesan suara mengutamakan **Opus** (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI). 48 kHz / 64 kbps menyeimbangkan kejernihan dan ukuran. |
| Kanal lain                        | **MP3** (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI). 44.1 kHz / 128 kbps adalah keseimbangan bawaan untuk ucapan.                  |
| Percakapan / telefoni                      | **PCM** native penyedia (Inworld 22050 Hz, Google 24 kHz), atau `ulaw_8000` dari Gradium untuk telefoni.                                 |

Catatan per penyedia:

- **Transkode Feishu / WhatsApp:** ketika balasan pesan suara diterima sebagai MP3/WebM/WAV/M4A atau berkas audio lain yang mungkin, Plugin kanal mentranskodenya menjadi Ogg/Opus 48 kHz dengan `ffmpeg` (`libopus`, 64 kbps) sebelum mengirim pesan suara native. WhatsApp mengirim hasilnya melalui payload `audio` Baileys dengan `ptt: true` dan `audio/ogg; codecs=opus`. Jika transkode gagal: Feishu menangkap galat dan kembali mengirimkan berkas asli sebagai lampiran biasa; WhatsApp tidak memiliki fallback, sehingga pengiriman itu sendiri gagal alih-alih memposting payload PTT yang tidak kompatibel.
- **MiniMax:** MP3 (model `speech-2.8-hd`, laju sampel 32 kHz) untuk lampiran audio normal; ditranskode menjadi Opus 48 kHz dengan `ffmpeg` untuk target pesan suara yang diiklankan kanal.
- **Xiaomi MiMo:** MP3 secara bawaan, atau WAV jika dikonfigurasi; ditranskode menjadi Opus 48 kHz dengan `ffmpeg` untuk target pesan suara yang diiklankan kanal.
- **CLI lokal:** menggunakan `outputFormat` yang dikonfigurasi. Target pesan suara dikonversi menjadi Ogg/Opus dan keluaran telefoni dikonversi menjadi PCM mono mentah 16 kHz dengan `ffmpeg`.
- **Google Gemini:** mengembalikan PCM mentah 24 kHz. OpenClaw membungkusnya sebagai WAV untuk lampiran audio, mentranskodenya menjadi Opus 48 kHz untuk target pesan suara, dan mengembalikan PCM secara langsung untuk Percakapan/telefoni.
- **Gradium:** WAV untuk lampiran audio, Opus untuk target pesan suara, dan `ulaw_8000` pada 8 kHz untuk telefoni.
- **Inworld:** MP3 untuk lampiran audio normal, `OGG_OPUS` native untuk target pesan suara, dan `PCM` mentah pada 22050 Hz untuk Percakapan/telefoni.
- **xAI:** MP3 secara bawaan; sintesis berkas audio dapat menggunakan `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw` untuk keluaran dengan buffering maupun streaming. Target pesan suara menggunakan MP3 untuk streaming dan fallback dengan buffering karena keluaran `pcm`, `mulaw`, dan `alaw` xAI merupakan audio mentah tanpa header. Sintesis dengan buffering menggunakan endpoint `/v1/tts` REST batch xAI; `textToSpeechStream` menggunakan `wss://api.x.ai/v1/tts` native. Ini bukan kontrak suara waktu nyata. Format pesan suara Opus native tidak didukung.
- **Microsoft:** menggunakan `microsoft.outputFormat` (bawaan `audio-24khz-48kbitrate-mono-mp3`).
  - Transport terpaket menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan tersebut.
  - Nilai format keluaran mengikuti format keluaran Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan pesan suara Opus yang terjamin.
  - Jika format keluaran Microsoft yang dikonfigurasi gagal, OpenClaw mencoba kembali dengan MP3.
  - Jika tidak ada penggantian suara eksplisit yang ditetapkan dan suara bahasa Inggris bawaan digunakan, OpenClaw otomatis beralih ke suara neural bahasa Tionghoa (`zh-CN-XiaoxiaoNeural`, lokal `zh-CN`) jika teks balasan didominasi CJK.

Format keluaran OpenAI dan ElevenLabs ditetapkan per kanal seperti tercantum di atas.

## Perilaku TTS otomatis

Saat `messages.tts.auto` diaktifkan, OpenClaw:

- Melewati TTS jika balasan sudah berisi media terstruktur.
- Melewati balasan yang sangat singkat (di bawah 10 karakter).
- Meringkas balasan panjang jika ringkasan diaktifkan, menggunakan
  `summaryModel` (atau `agents.defaults.model.primary`).
- Melampirkan audio yang dihasilkan ke balasan.
- Dalam `mode: "final"`, tetap mengirim TTS hanya-audio untuk balasan akhir yang dialirkan
  setelah aliran teks selesai; media yang dihasilkan melalui normalisasi media
  kanal yang sama seperti lampiran balasan normal.

Jika balasan melebihi `maxLength`, OpenClaw tidak pernah melewati audio sepenuhnya:

- **Ringkasan aktif** (bawaan) dan model ringkasan tersedia: meringkas
  teks menjadi sekitar `maxLength` karakter, lalu menyintesis ringkasan tersebut.
- **Ringkasan nonaktif**, peringkasan gagal, atau tidak tersedia kunci API untuk
  model ringkasan: memotong teks menjadi `maxLength` karakter dan menyintesis
  teks yang telah dipotong.

```text
Balasan -> TTS diaktifkan?
  tidak -> kirim teks
  ya    -> memiliki media / singkat?
           ya    -> kirim teks
           tidak -> panjang > batas?
                    tidak -> TTS -> lampirkan audio
                    ya    -> ringkasan diaktifkan dan tersedia?
                             tidak -> potong -> TTS -> lampirkan audio
                             ya    -> ringkas -> TTS -> lampirkan audio
```

## Referensi bidang

<AccordionGroup>
  <Accordion title="messages.tts.* tingkat teratas">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Mode TTS otomatis. `inbound` hanya mengirim audio setelah pesan suara masuk; `tagged` hanya mengirim audio saat balasan menyertakan direktif `[[tts:...]]` atau blok `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Tombol lama. `openclaw doctor --fix` memigrasikan ini ke `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` menyertakan balasan alat/blok selain balasan akhir.
    </ParamField>
    <ParamField path="provider" type="string">
      ID penyedia ucapan. Jika tidak ditetapkan, OpenClaw menggunakan penyedia terkonfigurasi pertama dalam urutan pemilihan otomatis registri. `provider: "edge"` lama ditulis ulang menjadi `"microsoft"` oleh `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID persona aktif dari `personas`. Dinormalisasi menjadi huruf kecil.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identitas lisan yang stabil. Bidang: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Lihat [Persona](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Model murah untuk ringkasan otomatis; bawaan ke `agents.defaults.model.primary`. Menerima `provider/model` atau alias model yang dikonfigurasi.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Mengizinkan model menghasilkan direktif TTS. `enabled` secara bawaan bernilai `true`; `allowProvider` secara bawaan bernilai `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Pengaturan milik penyedia yang dikunci berdasarkan ID penyedia ucapan. Blok langsung lama (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) ditulis ulang oleh `openclaw doctor --fix`; commit hanya `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Batas maksimum karakter masukan TTS. `/tts audio`, `tts.convert`, dan `tts.speak` gagal jika terlampaui.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Batas waktu permintaan dalam milidetik. `timeoutMs` per panggilan (alat agen, Gateway) berlaku jika ditetapkan; jika tidak, `messages.tts.timeoutMs` yang dikonfigurasi secara eksplisit berlaku atas bawaan penyedia apa pun yang dibuat Plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Mengganti jalur JSON preferensi lokal (penyedia/batas/ringkasan). Bawaan `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

Bidang `apiKey` penyedia dapat berupa string mentah atau SecretRef. Selama startup dingin Gateway,
SecretRef TTS yang tidak tersedia menandai kemampuan TTS bawaan sebagai
dikonfigurasi-tidak-tersedia alih-alih menghentikan Gateway. `tts.speak` kemudian mengembalikan
`UNAVAILABLE` dengan alasan `SECRET_SURFACE_UNAVAILABLE`, dan tidak ada permintaan penyedia yang
dikirim. Status dan doctor mencantumkan pemilik TTS yang terdegradasi beserta jalur konfigurasinya. Referensi
eksplisit tetap berada dalam snapshot runtime, sehingga kredensial lingkungan atau profil
tidak dapat secara diam-diam memilih akun lain. Pemuatan ulang dan pra-pemeriksaan penulisan konfigurasi
menerapkan kebijakan degradasi yang menyadari pemilik: pemilik TTS yang memenuhi syarat dan tidak berubah
dapat mempertahankan kredensial terakhir-yang-diketahui-baik sebagai usang, sementara kegagalan baru atau yang berubah
menjadi dingin tanpa memblokir pemilik yang sehat. Referensi yang secara struktural tidak valid
dan nilai yang telah diselesaikan tetap menggagalkan startup atau menolak pembaruan.

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Lingkungan: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, atau `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Wilayah Azure Speech (misalnya `eastus`). Lingkungan: `AZURE_SPEECH_REGION` atau `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Penggantian endpoint Azure Speech opsional (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName suara Azure. Bawaan `en-US-JennyNeural`. Alias lama: `voice`.</ParamField>
    <ParamField path="lang" type="string">Kode bahasa SSML. Bawaan `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` Azure untuk audio standar. Bawaan `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` Azure untuk keluaran pesan suara. Bawaan `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Menggunakan `ELEVENLABS_API_KEY` atau `XI_API_KEY` sebagai fallback.</ParamField>
    <ParamField path="model" type="string">ID model. Default `eleven_multilingual_v2`. ID lama `eleven_turbo_v2_5`/`eleven_turbo_v2` dinormalisasi ke model `flash` yang sesuai.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ID suara ElevenLabs. Default `pMsXgVXv3BLzUgSXRplE`. Alias lama: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (masing-masing `0..1`, default `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, default `true`), `speed` (`0.5..2.0`, default `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Mode normalisasi teks.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 2 huruf (misalnya `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Bilangan bulat `0..4294967295` untuk determinisme upaya terbaik.</ParamField>
    <ParamField path="baseUrl" type="string">Mengganti URL dasar API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Menggunakan `GEMINI_API_KEY` / `GOOGLE_API_KEY` sebagai fallback. Jika dihilangkan, TTS dapat menggunakan kembali `models.providers.google.apiKey` sebelum fallback ke variabel lingkungan.</ParamField>
    <ParamField path="model" type="string">Model TTS Gemini. Default `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nama suara bawaan Gemini. Default `Kore`. Alias lama: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt gaya dalam bahasa alami yang ditambahkan sebelum teks yang diucapkan.</ParamField>
    <ParamField path="speakerName" type="string">Label pembicara opsional yang ditambahkan sebelum teks yang diucapkan saat prompt menggunakan pembicara bernama.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Atur ke `audio-profile-v1` untuk membungkus bidang prompt persona aktif dalam struktur prompt TTS Gemini yang deterministik.</ParamField>
    <ParamField path="personaPrompt" type="string">Teks prompt persona tambahan khusus Google yang ditambahkan ke Catatan Sutradara pada templat.</ParamField>
    <ParamField path="baseUrl" type="string">Hanya `https://generativelanguage.googleapis.com` yang diterima.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Variabel lingkungan: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL API Gradium HTTPS di `api.gradium.ai`. Default `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Default Emma (`YTpq7expH9539ERJ`). Alias lama: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld utama

    <ParamField path="apiKey" type="string">Variabel lingkungan: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Default `inworld-tts-1.5-max`. Juga: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Default `Sarah`. Alias lama: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Suhu pengambilan sampel `0..2` (tidak termasuk 0).</ParamField>

  </Accordion>

  <Accordion title="CLI Lokal (tts-local-cli)">
    <ParamField path="command" type="string">String perintah atau berkas yang dapat dieksekusi secara lokal untuk TTS CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumen perintah. Mendukung placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Format keluaran CLI yang diharapkan. Default `mp3` untuk lampiran audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Batas waktu perintah dalam milidetik. Default `120000`.</ParamField>
    <ParamField path="cwd" type="string">Direktori kerja perintah opsional.</ParamField>
    <ParamField path="env" type="Record<string, string>">Penggantian variabel lingkungan opsional untuk perintah.</ParamField>

    Keluaran standar perintah serta audio yang dihasilkan atau dikonversi dibatasi hingga 50 MiB. Keluaran kesalahan diagnostik dibatasi hingga 1 MiB. OpenClaw menghentikan perintah dan menggagalkan sintesis ketika salah satu batas terlampaui.

  </Accordion>

  <Accordion title="Microsoft (tanpa kunci API)">
    <ParamField path="enabled" type="boolean" default="true">Mengizinkan penggunaan ucapan Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nama suara neural Microsoft (misalnya `en-US-MichelleNeural`). Alias lama: `voice`. Jika suara bahasa Inggris default sedang digunakan dan teks balasan didominasi CJK, OpenClaw otomatis beralih ke `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Kode bahasa (misalnya `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format keluaran Microsoft. Default `audio-24khz-48kbitrate-mono-mp3`. Tidak semua format didukung oleh transport berbasis Edge yang disertakan.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">String persentase (misalnya `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Menulis subtitel JSON di samping berkas audio.</ParamField>
    <ParamField path="proxy" type="string">URL proksi untuk permintaan ucapan Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Penggantian batas waktu permintaan (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias lama. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan menjadi `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Menggunakan `MINIMAX_API_KEY` sebagai fallback. Autentikasi Token Plan melalui `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, atau `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.minimax.io`. Variabel lingkungan: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Default `speech-2.8-hd`. Variabel lingkungan: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Default `English_expressive_narrator`. Variabel lingkungan: `MINIMAX_TTS_VOICE_ID`. Alias lama: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Default `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Default `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Bilangan bulat `-12..12`. Default `0`. Nilai pecahan dipotong sebelum permintaan.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Menggunakan `OPENAI_API_KEY` sebagai fallback.</ParamField>
    <ParamField path="model" type="string">ID model TTS OpenAI. Default `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nama suara (misalnya `alloy`, `cedar`). Default `coral`. Alias lama: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Bidang `instructions` OpenAI yang eksplisit. Saat diatur, bidang prompt persona **tidak** dipetakan secara otomatis.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Bidang JSON tambahan yang digabungkan ke isi permintaan `/audio/speech` setelah bidang TTS OpenAI yang dihasilkan. Gunakan ini untuk endpoint yang kompatibel dengan OpenAI, seperti Kokoro, yang memerlukan kunci khusus penyedia seperti `lang`; kunci prototipe yang tidak aman diabaikan.</ParamField>
    <ParamField path="baseUrl" type="string">
      Mengganti endpoint TTS OpenAI. Urutan resolusi: konfigurasi → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Nilai non-default diperlakukan sebagai endpoint TTS yang kompatibel dengan OpenAI, sehingga nama model dan suara khusus diterima, dan `speed` tidak lagi diperiksa terhadap rentang `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Variabel lingkungan: `OPENROUTER_API_KEY`. Dapat menggunakan kembali `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://openrouter.ai/api/v1`. `https://openrouter.ai/v1` lama dinormalisasi.</ParamField>
    <ParamField path="model" type="string">Default `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Default `af_alloy`. Alias lama: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Default `mp3`.</ParamField>
    <ParamField path="speed" type="number">Penggantian kecepatan bawaan penyedia.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Variabel lingkungan: `VOLCENGINE_TTS_API_KEY` atau `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Default `seed-tts-1.0`. Variabel lingkungan: `VOLCENGINE_TTS_RESOURCE_ID`. Gunakan `seed-tts-2.0` jika proyek Anda memiliki hak akses TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Header kunci aplikasi. Default `aGjiRDfUWi`. Variabel lingkungan: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Mengganti endpoint HTTP TTS Seed Speech. Variabel lingkungan: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Jenis suara. Default `en_female_anna_mars_bigtts`. Variabel lingkungan: `VOLCENGINE_TTS_VOICE`. Alias lama: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Rasio kecepatan bawaan penyedia, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Tag emosi bawaan penyedia.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Bidang lama Volcengine Speech Console. Variabel lingkungan: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (default `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Variabel lingkungan: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.x.ai/v1`. Variabel lingkungan: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Default `eve`. Dengan autentikasi, `openclaw infer tts voices --provider xai` mengambil katalog bawaan saat ini; tanpa autentikasi, perintah tersebut mencantumkan fallback luring `ara`, `eve`, `leo`, `rex`, dan `sal`. ID suara khusus akun diteruskan meskipun tidak ada dalam daftar bawaan. Alias lama: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Kode bahasa BCP-47 atau `auto`. Default `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Default `mp3`.</ParamField>
    <ParamField path="speed" type="number">Penggantian kecepatan bawaan penyedia, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Default `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Default `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Juga mendukung `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Default `mimo_default` untuk model suara preset. Env: `XIAOMI_TTS_VOICE`. Alias lama: `voice`. Tidak dikirim untuk `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Default `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instruksi gaya bahasa alami opsional yang dikirim sebagai pesan pengguna; tidak diucapkan. Untuk `mimo-v2.5-tts-voicedesign`, ini adalah prompt desain suara; OpenClaw menyediakan nilai default jika dihilangkan.</ParamField>
  </Accordion>
</AccordionGroup>

## Alat agen

Alat `tts` mengonversi teks menjadi ucapan dan mengembalikan lampiran audio untuk
pengiriman balasan. Di Feishu, Matrix, Telegram, dan WhatsApp, audio
dikirim sebagai pesan suara, bukan sebagai lampiran file. Feishu dan
WhatsApp dapat mentranskode keluaran TTS non-Opus pada jalur ini ketika `ffmpeg`
tersedia.

WhatsApp mengirim audio melalui Baileys sebagai pesan suara PTT (`audio` dengan
`ptt: true`) dan mengirim teks yang terlihat **secara terpisah** dari audio PTT karena
klien tidak secara konsisten menampilkan keterangan pada pesan suara.

Alat ini menerima kolom opsional `channel` dan `timeoutMs`; `timeoutMs` adalah
batas waktu permintaan penyedia per panggilan dalam milidetik. Nilai per panggilan menggantikan
`messages.tts.timeoutMs`; batas waktu TTS yang dikonfigurasi menggantikan nilai default penyedia
yang ditentukan oleh plugin.

## RPC Gateway

| Metode            | Tujuan                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Membaca status TTS saat ini dan upaya terakhir.     |
| `tts.enable`      | Mengatur preferensi otomatis lokal ke `always`.       |
| `tts.disable`     | Mengatur preferensi otomatis lokal ke `off`.          |
| `tts.convert`     | Teks sekali pakai → audio.                        |
| `tts.setProvider` | Mengatur preferensi penyedia lokal.               |
| `tts.personas`    | Mencantumkan persona yang dikonfigurasi dan persona aktif. |
| `tts.setPersona`  | Mengatur preferensi persona lokal.                |
| `tts.providers`   | Mencantumkan penyedia yang dikonfigurasi dan statusnya.        |

## Tautan layanan

- [Panduan teks ke ucapan OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Teks ke ucapan REST Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Penyedia Azure Speech](/id/providers/azure-speech)
- [Teks ke Ucapan ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autentikasi ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/id/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/id/providers/volcengine#text-to-speech)
- [Sintesis ucapan Xiaomi MiMo](/id/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format keluaran Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Teks ke ucapan xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Terkait

- [Ikhtisar media](/id/tools/media-overview)
- [Pembuatan musik](/id/tools/music-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Perintah garis miring](/id/tools/slash-commands)
- [Plugin panggilan suara](/id/plugins/voice-call)
