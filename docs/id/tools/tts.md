---
read_when:
    - Mengaktifkan text-to-speech untuk balasan
    - Mengonfigurasi provider atau batas TTS
    - Menggunakan perintah `/tts`
summary: Text-to-speech (TTS) untuk balasan outbound
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-24T09:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw dapat mengonversi balasan outbound menjadi audio menggunakan ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI, atau xAI.
Ini berfungsi di mana pun OpenClaw dapat mengirim audio.

## Layanan yang didukung

- **ElevenLabs** (provider utama atau fallback)
- **Google Gemini** (provider utama atau fallback; menggunakan Gemini API TTS)
- **Microsoft** (provider utama atau fallback; implementasi bundled saat ini menggunakan `node-edge-tts`)
- **MiniMax** (provider utama atau fallback; menggunakan API T2A v2)
- **OpenAI** (provider utama atau fallback; juga digunakan untuk ringkasan)
- **xAI** (provider utama atau fallback; menggunakan API TTS xAI)

### Catatan speech Microsoft

Provider speech Microsoft yang dibundel saat ini menggunakan layanan TTS neural
online Microsoft Edge melalui library `node-edge-tts`. Ini adalah layanan terhosting (bukan
lokal), menggunakan endpoint Microsoft, dan tidak memerlukan API key.
`node-edge-tts` mengekspos opsi konfigurasi speech dan format output, tetapi
tidak semua opsi didukung oleh layanan tersebut. Konfigurasi lama dan input directive
yang menggunakan `edge` masih berfungsi dan dinormalisasi menjadi `microsoft`.

Karena jalur ini adalah layanan web publik tanpa SLA atau kuota yang dipublikasikan,
perlakukan ini sebagai best-effort. Jika Anda membutuhkan batas yang terjamin dan dukungan, gunakan OpenAI
atau ElevenLabs.

## Key opsional

Jika Anda ingin OpenAI, ElevenLabs, Google Gemini, MiniMax, atau xAI:

- `ELEVENLABS_API_KEY` (atau `XI_API_KEY`)
- `GEMINI_API_KEY` (atau `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Speech Microsoft **tidak** memerlukan API key.

Jika beberapa provider dikonfigurasi, provider yang dipilih digunakan terlebih dahulu dan yang lain menjadi opsi fallback.
Auto-summary menggunakan `summaryModel` yang dikonfigurasi (atau `agents.defaults.model.primary`),
jadi provider itu juga harus diautentikasi jika Anda mengaktifkan ringkasan.

## Tautan layanan

- [Panduan OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autentikasi ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Apakah ini aktif secara default?

Tidak. Auto‑TTS **nonaktif** secara default. Aktifkan di konfigurasi dengan
`messages.tts.auto` atau secara lokal dengan `/tts on`.

Ketika `messages.tts.provider` tidak diatur, OpenClaw memilih provider
speech pertama yang dikonfigurasi dalam urutan auto-select registry.

## Konfigurasi

Konfigurasi TTS berada di bawah `messages.tts` di `openclaw.json`.
Skema lengkap ada di [Konfigurasi Gateway](/id/gateway/configuration).

### Konfigurasi minimal (aktifkan + provider)

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

### OpenAI utama dengan fallback ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft sebagai utama (tanpa API key)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax sebagai utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

### Google Gemini sebagai utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS menggunakan jalur API key Gemini API. API key Google Cloud Console
yang dibatasi untuk Gemini API valid di sini, dan ini adalah gaya key yang sama yang digunakan
oleh provider pembuatan gambar Google bawaan. Urutan resolusinya adalah
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI sebagai utama

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS menggunakan jalur `XAI_API_KEY` yang sama seperti provider model Grok bawaan.
Urutan resolusinya adalah `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Voice live saat ini adalah `ara`, `eve`, `leo`, `rex`, `sal`, dan `una`; `eve` adalah
default. `language` menerima tag BCP-47 atau `auto`.

### Nonaktifkan speech Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Batas kustom + path preferensi

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Hanya balas dengan audio setelah pesan suara inbound

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Nonaktifkan auto-summary untuk balasan panjang

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Lalu jalankan:

```
/tts summary off
```

### Catatan tentang field

- `auto`: mode auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` hanya mengirim audio setelah pesan suara inbound.
  - `tagged` hanya mengirim audio saat balasan menyertakan directive `[[tts:key=value]]` atau blok `[[tts:text]]...[[/tts:text]]`.
- `enabled`: toggle lama (doctor memigrasikan ini ke `auto`).
- `mode`: `"final"` (default) atau `"all"` (termasuk balasan tool/block).
- `provider`: id provider speech seperti `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"`, atau `"openai"` (fallback otomatis).
- Jika `provider` **tidak** diatur, OpenClaw menggunakan provider speech pertama yang dikonfigurasi dalam urutan auto-select registry.
- `provider: "edge"` lama masih berfungsi dan dinormalisasi menjadi `microsoft`.
- `summaryModel`: model murah opsional untuk auto-summary; default ke `agents.defaults.model.primary`.
  - Menerima `provider/model` atau alias model yang dikonfigurasi.
- `modelOverrides`: izinkan model mengeluarkan directive TTS (aktif secara default).
  - `allowProvider` default ke `false` (pergantian provider bersifat opt-in).
- `providers.<id>`: pengaturan milik provider yang dikunci oleh id provider speech.
- Blok provider langsung lama (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) dimigrasikan otomatis ke `messages.tts.providers.<id>` saat load.
- `maxTextLength`: batas keras untuk input TTS (karakter). `/tts audio` gagal jika melebihi.
- `timeoutMs`: timeout permintaan (ms).
- `prefsPath`: override path JSON preferensi lokal (provider/batas/ringkasan).
- Nilai `apiKey` fallback ke env vars (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: override base URL API ElevenLabs.
- `providers.openai.baseUrl`: override endpoint OpenAI TTS.
  - Urutan resolusi: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nilai non-default diperlakukan sebagai endpoint TTS yang kompatibel dengan OpenAI, sehingga nama model dan voice kustom diterima.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 2 huruf (mis. `en`, `de`)
- `providers.elevenlabs.seed`: integer `0..4294967295` (determinisme best-effort)
- `providers.minimax.baseUrl`: override base URL API MiniMax (default `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (default `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: pengidentifikasi voice (default `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: kecepatan pemutaran `0.5..2.0` (default 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (default 1.0; harus lebih besar dari 0).
- `providers.minimax.pitch`: pergeseran pitch `-12..12` (default 0).
- `providers.google.model`: model Gemini TTS (default `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nama voice prebuilt Gemini (default `Kore`; `voice` juga diterima).
- `providers.google.baseUrl`: override base URL Gemini API. Hanya `https://generativelanguage.googleapis.com` yang diterima.
  - Jika `messages.tts.providers.google.apiKey` dihilangkan, TTS dapat menggunakan ulang `models.providers.google.apiKey` sebelum fallback env.
- `providers.xai.apiKey`: API key xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: override base URL xAI TTS (default `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id voice xAI (default `eve`; voice live saat ini: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: kode bahasa BCP-47 atau `auto` (default `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw` (default `mp3`).
- `providers.xai.speed`: override kecepatan native provider.
- `providers.microsoft.enabled`: izinkan penggunaan speech Microsoft (default `true`; tanpa API key).
- `providers.microsoft.voice`: nama voice neural Microsoft (mis. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kode bahasa (mis. `en-US`).
- `providers.microsoft.outputFormat`: format output Microsoft (mis. `audio-24khz-48kbitrate-mono-mp3`).
  - Lihat format output Microsoft Speech untuk nilai yang valid; tidak semua format didukung oleh transport berbasis Edge bawaan.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: string persentase (mis. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: tulis subtitle JSON di samping file audio.
- `providers.microsoft.proxy`: URL proxy untuk permintaan speech Microsoft.
- `providers.microsoft.timeoutMs`: override timeout permintaan (ms).
- `edge.*`: alias lama untuk pengaturan Microsoft yang sama.

## Override berbasis model (aktif secara default)

Secara default, model **dapat** mengeluarkan directive TTS untuk satu balasan.
Saat `messages.tts.auto` adalah `tagged`, directive ini wajib untuk memicu audio.

Saat diaktifkan, model dapat mengeluarkan directive `[[tts:...]]` untuk mengoverride voice
untuk satu balasan, ditambah blok `[[tts:text]]...[[/tts:text]]` opsional untuk
menyediakan tag ekspresif (tawa, isyarat bernyanyi, dll.) yang hanya boleh muncul di
audio.

Directive `provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`.

Contoh payload balasan:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Key directive yang tersedia (saat diaktifkan):

- `provider` (id provider speech yang terdaftar, misalnya `openai`, `elevenlabs`, `google`, `minimax`, atau `microsoft`; memerlukan `allowProvider: true`)
- `voice` (voice OpenAI), `voiceName` / `voice_name` / `google_voice` (voice Google), atau `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (model OpenAI TTS, id model ElevenLabs, atau model MiniMax) atau `google_model` (model Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (pitch MiniMax, -12 hingga 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Nonaktifkan semua override model:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Allowlist opsional (aktifkan perpindahan provider sambil mempertahankan knob lain tetap dapat dikonfigurasi):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferensi per pengguna

Perintah slash menulis override lokal ke `prefsPath` (default:
`~/.openclaw/settings/tts.json`, override dengan `OPENCLAW_TTS_PREFS` atau
`messages.tts.prefsPath`).

Field yang disimpan:

- `enabled`
- `provider`
- `maxLength` (ambang ringkasan; default 1500 karakter)
- `summarize` (default `true`)

Ini mengoverride `messages.tts.*` untuk host tersebut.

## Format output (tetap)

- **Feishu / Matrix / Telegram / WhatsApp**: pesan suara Opus (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI).
  - 48kHz / 64kbps adalah kompromi yang baik untuk pesan suara.
- **Kanal lain**: MP3 (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI).
  - 44.1kHz / 128kbps adalah keseimbangan default untuk kejernihan suara.
- **MiniMax**: MP3 (`speech-2.8-hd` model, sample rate 32kHz). Format voice-note tidak didukung secara native; gunakan OpenAI atau ElevenLabs untuk pesan suara Opus yang terjamin.
- **Google Gemini**: Gemini API TTS mengembalikan PCM 24kHz mentah. OpenClaw membungkusnya sebagai WAV untuk lampiran audio dan mengembalikan PCM langsung untuk Talk/telephony. Format voice-note Opus native tidak didukung oleh jalur ini.
- **xAI**: MP3 secara default; `responseFormat` dapat berupa `mp3`, `wav`, `pcm`, `mulaw`, atau `alaw`. OpenClaw menggunakan endpoint REST TTS batch xAI dan mengembalikan lampiran audio lengkap; WebSocket streaming TTS xAI tidak digunakan oleh jalur provider ini. Format voice-note Opus native tidak didukung oleh jalur ini.
- **Microsoft**: menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`).
  - Transport bawaan menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan.
  - Nilai format output mengikuti format output Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan
    pesan suara Opus yang terjamin.
  - Jika format output Microsoft yang dikonfigurasi gagal, OpenClaw mencoba ulang dengan MP3.

Format output OpenAI/ElevenLabs bersifat tetap per kanal (lihat di atas).

## Perilaku auto-TTS

Saat diaktifkan, OpenClaw:

- melewati TTS jika balasan sudah berisi media atau directive `MEDIA:`.
- melewati balasan yang sangat singkat (< 10 karakter).
- meringkas balasan panjang saat diaktifkan menggunakan `agents.defaults.model.primary` (atau `summaryModel`).
- melampirkan audio yang dihasilkan ke balasan.

Jika balasan melebihi `maxLength` dan ringkasan nonaktif (atau tidak ada API key untuk
model ringkasan), audio
dilewati dan balasan teks normal dikirim.

## Diagram alur

```
Reply -> TTS enabled?
  no  -> kirim teks
  yes -> ada media / MEDIA: / pendek?
          yes -> kirim teks
          no  -> panjang > batas?
                   no  -> TTS -> lampirkan audio
                   yes -> ringkasan aktif?
                            no  -> kirim teks
                            yes -> ringkas (summaryModel atau agents.defaults.model.primary)
                                      -> TTS -> lampirkan audio
```

## Penggunaan perintah slash

Hanya ada satu perintah: `/tts`.
Lihat [Perintah slash](/id/tools/slash-commands) untuk detail pengaktifan.

Catatan Discord: `/tts` adalah perintah Discord bawaan, jadi OpenClaw mendaftarkan
`/voice` sebagai perintah native di sana. Teks `/tts ...` tetap berfungsi.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Catatan:

- Perintah memerlukan pengirim yang diotorisasi (aturan allowlist/owner tetap berlaku).
- `commands.text` atau pendaftaran perintah native harus diaktifkan.
- Konfigurasi `messages.tts.auto` menerima `off|always|inbound|tagged`.
- `/tts on` menulis preferensi TTS lokal menjadi `always`; `/tts off` menulisnya menjadi `off`.
- Gunakan konfigurasi jika Anda menginginkan default `inbound` atau `tagged`.
- `limit` dan `summary` disimpan di preferensi lokal, bukan konfigurasi utama.
- `/tts audio` menghasilkan balasan audio satu kali (tidak mengaktifkan TTS).
- `/tts status` menyertakan visibilitas fallback untuk percobaan terbaru:
  - fallback berhasil: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - gagal: `Error: ...` plus `Attempts: ...`
  - diagnostik terperinci: `Attempt details: provider:outcome(reasonCode) latency`
- Kegagalan API OpenAI dan ElevenLabs kini menyertakan detail error provider yang telah diparse dan request id (saat dikembalikan oleh provider), yang ditampilkan dalam error/log TTS.

## Alat agen

Alat `tts` mengonversi teks menjadi speech dan mengembalikan lampiran audio untuk
pengiriman balasan. Saat kanalnya adalah Feishu, Matrix, Telegram, atau WhatsApp,
audio dikirim sebagai pesan suara, bukan sebagai lampiran file.
Alat ini menerima field `channel` dan `timeoutMs` opsional; `timeoutMs` adalah
timeout permintaan provider per panggilan dalam milidetik.

## Gateway RPC

Metode Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Terkait

- [Ikhtisar media](/id/tools/media-overview)
- [Pembuatan musik](/id/tools/music-generation)
- [Pembuatan video](/id/tools/video-generation)
