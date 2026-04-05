---
read_when:
    - Mengaktifkan text-to-speech untuk balasan
    - Mengonfigurasi provider atau batas TTS
    - Menggunakan perintah /tts
summary: Text-to-speech (TTS) untuk balasan outbound
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-05T14:10:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8487c8acef7585bd4eb5e3b39e2a063ebc6b5f0103524abdcbadd3a7781ffc46
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw dapat mengubah balasan outbound menjadi audio menggunakan ElevenLabs, Microsoft, MiniMax, atau OpenAI.
Ini berfungsi di mana pun OpenClaw dapat mengirim audio.

## Layanan yang didukung

- **ElevenLabs** (provider utama atau fallback)
- **Microsoft** (provider utama atau fallback; implementasi bundled saat ini menggunakan `node-edge-tts`)
- **MiniMax** (provider utama atau fallback; menggunakan API T2A v2)
- **OpenAI** (provider utama atau fallback; juga digunakan untuk ringkasan)

### Catatan speech Microsoft

Provider speech Microsoft bundled saat ini menggunakan layanan TTS neural online Microsoft Edge melalui library `node-edge-tts`. Ini adalah layanan terhosting (bukan lokal), menggunakan endpoint Microsoft, dan tidak memerlukan API key.
`node-edge-tts` mengekspos opsi konfigurasi speech dan format output, tetapi
tidak semua opsi didukung oleh layanan. Input config dan directive legacy yang
menggunakan `edge` tetap berfungsi dan dinormalisasi menjadi `microsoft`.

Karena jalur ini adalah layanan web publik tanpa SLA atau kuota yang dipublikasikan,
perlakukan sebagai best-effort. Jika Anda memerlukan batas dan dukungan yang terjamin, gunakan OpenAI
atau ElevenLabs.

## Key opsional

Jika Anda ingin OpenAI, ElevenLabs, atau MiniMax:

- `ELEVENLABS_API_KEY` (atau `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Speech Microsoft **tidak** memerlukan API key.

Jika beberapa provider dikonfigurasi, provider yang dipilih digunakan terlebih dahulu dan yang lain menjadi opsi fallback.
Auto-summary menggunakan `summaryModel` yang dikonfigurasi (atau `agents.defaults.model.primary`),
jadi provider tersebut juga harus diautentikasi jika Anda mengaktifkan ringkasan.

## Tautan layanan

- [Panduan OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Referensi API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autentikasi ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Format output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Apakah ini aktif secara default?

Tidak. Auto‑TTS **nonaktif** secara default. Aktifkan di config dengan
`messages.tts.auto` atau per sesi dengan `/tts always` (alias: `/tts on`).

Ketika `messages.tts.provider` tidak disetel, OpenClaw memilih provider
speech pertama yang dikonfigurasi dalam urutan auto-select registry.

## Config

Config TTS berada di bawah `messages.tts` di `openclaw.json`.
Skema lengkap ada di [Konfigurasi Gateway](/id/gateway/configuration).

### Config minimal (aktifkan + provider)

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

### Microsoft utama (tanpa API key)

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

### MiniMax utama

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

### Hanya balas dengan audio setelah pesan suara masuk

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
  - `inbound` hanya mengirim audio setelah pesan suara masuk.
  - `tagged` hanya mengirim audio saat balasan menyertakan tag `[[tts]]`.
- `enabled`: toggle legacy (doctor memigrasikan ini ke `auto`).
- `mode`: `"final"` (default) atau `"all"` (termasuk balasan tool/block).
- `provider`: id provider speech seperti `"elevenlabs"`, `"microsoft"`, `"minimax"`, atau `"openai"` (fallback otomatis).
- Jika `provider` **tidak** disetel, OpenClaw menggunakan provider speech pertama yang dikonfigurasi dalam urutan auto-select registry.
- Legacy `provider: "edge"` tetap berfungsi dan dinormalisasi menjadi `microsoft`.
- `summaryModel`: model murah opsional untuk auto-summary; default ke `agents.defaults.model.primary`.
  - Menerima `provider/model` atau alias model yang dikonfigurasi.
- `modelOverrides`: memungkinkan model mengeluarkan directive TTS (aktif secara default).
  - `allowProvider` default ke `false` (pergantian provider perlu opt-in).
- `providers.<id>`: pengaturan milik provider yang diberi key menurut id provider speech.
- Blok provider langsung legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) dimigrasikan otomatis ke `messages.tts.providers.<id>` saat load.
- `maxTextLength`: batas keras untuk input TTS (karakter). `/tts audio` gagal jika melebihi.
- `timeoutMs`: batas waktu request (ms).
- `prefsPath`: override path JSON preferensi lokal (provider/limit/summary).
- Nilai `apiKey` fallback ke env vars (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: override base URL API ElevenLabs.
- `providers.openai.baseUrl`: override endpoint TTS OpenAI.
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
- `providers.minimax.voiceId`: pengenal voice (default `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: kecepatan pemutaran `0.5..2.0` (default 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (default 1.0; harus lebih besar dari 0).
- `providers.minimax.pitch`: pergeseran pitch `-12..12` (default 0).
- `providers.microsoft.enabled`: izinkan penggunaan speech Microsoft (default `true`; tanpa API key).
- `providers.microsoft.voice`: nama voice neural Microsoft (mis. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kode bahasa (mis. `en-US`).
- `providers.microsoft.outputFormat`: format output Microsoft (mis. `audio-24khz-48kbitrate-mono-mp3`).
  - Lihat format output Microsoft Speech untuk nilai yang valid; tidak semua format didukung oleh transport bundled berbasis Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: string persen (mis. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: tulis subtitle JSON di samping file audio.
- `providers.microsoft.proxy`: URL proxy untuk request speech Microsoft.
- `providers.microsoft.timeoutMs`: override batas waktu request (ms).
- `edge.*`: alias legacy untuk pengaturan Microsoft yang sama.

## Override berbasis model (aktif secara default)

Secara default, model **dapat** mengeluarkan directive TTS untuk satu balasan.
Ketika `messages.tts.auto` adalah `tagged`, directive ini diperlukan untuk memicu audio.

Saat diaktifkan, model dapat mengeluarkan directive `[[tts:...]]` untuk mengoverride voice
untuk satu balasan, ditambah blok `[[tts:text]]...[[/tts:text]]` opsional untuk
memberikan tag ekspresif (tawa, isyarat bernyanyi, dll.) yang seharusnya hanya muncul di
audio.

Directive `provider=...` diabaikan kecuali `modelOverrides.allowProvider: true`.

Contoh payload balasan:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Key directive yang tersedia (saat diaktifkan):

- `provider` (id provider speech terdaftar, misalnya `openai`, `elevenlabs`, `minimax`, atau `microsoft`; memerlukan `allowProvider: true`)
- `voice` (voice OpenAI) atau `voiceId` (ElevenLabs / MiniMax)
- `model` (model TTS OpenAI, id model ElevenLabs, atau model MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (pitch MiniMax, -12 sampai 12)
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

Allowlist opsional (aktifkan pergantian provider sambil mempertahankan knob lain tetap dapat dikonfigurasi):

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

Slash command menulis override lokal ke `prefsPath` (default:
`~/.openclaw/settings/tts.json`, override dengan `OPENCLAW_TTS_PREFS` atau
`messages.tts.prefsPath`).

Field yang disimpan:

- `enabled`
- `provider`
- `maxLength` (ambang ringkasan; default 1500 karakter)
- `summarize` (default `true`)

Field-field ini mengoverride `messages.tts.*` untuk host tersebut.

## Format output (tetap)

- **Feishu / Matrix / Telegram / WhatsApp**: pesan suara Opus (`opus_48000_64` dari ElevenLabs, `opus` dari OpenAI).
  - 48kHz / 64kbps adalah kompromi yang baik untuk pesan suara.
- **Channel lain**: MP3 (`mp3_44100_128` dari ElevenLabs, `mp3` dari OpenAI).
  - 44.1kHz / 128kbps adalah keseimbangan default untuk kejernihan speech.
- **MiniMax**: MP3 (model `speech-2.8-hd`, sample rate 32kHz). Format voice-note tidak didukung secara native; gunakan OpenAI atau ElevenLabs untuk pesan suara Opus yang terjamin.
- **Microsoft**: menggunakan `microsoft.outputFormat` (default `audio-24khz-48kbitrate-mono-mp3`).
  - Transport bundled menerima `outputFormat`, tetapi tidak semua format tersedia dari layanan.
  - Nilai format output mengikuti format output Microsoft Speech (termasuk Ogg/WebM Opus).
  - Telegram `sendVoice` menerima OGG/MP3/M4A; gunakan OpenAI/ElevenLabs jika Anda memerlukan
    pesan suara Opus yang terjamin.
  - Jika format output Microsoft yang dikonfigurasi gagal, OpenClaw mencoba ulang dengan MP3.

Format output OpenAI/ElevenLabs tetap per channel (lihat di atas).

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

## Penggunaan slash command

Ada satu command: `/tts`.
Lihat [Slash commands](/tools/slash-commands) untuk detail pengaktifan.

Catatan Discord: `/tts` adalah command bawaan Discord, jadi OpenClaw mendaftarkan
`/voice` sebagai command native di sana. Teks `/tts ...` tetap berfungsi.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Catatan:

- Command memerlukan pengirim yang berwenang (aturan allowlist/owner tetap berlaku).
- `commands.text` atau pendaftaran command native harus diaktifkan.
- `off|always|inbound|tagged` adalah toggle per sesi (`/tts on` adalah alias untuk `/tts always`).
- `limit` dan `summary` disimpan dalam preferensi lokal, bukan config utama.
- `/tts audio` menghasilkan balasan audio satu kali (tidak mengaktifkan TTS).
- `/tts status` mencakup visibilitas fallback untuk percobaan terbaru:
  - fallback berhasil: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - gagal: `Error: ...` plus `Attempts: ...`
  - diagnostik terperinci: `Attempt details: provider:outcome(reasonCode) latency`
- Kegagalan API OpenAI dan ElevenLabs sekarang menyertakan detail error provider yang sudah diparse dan request id (jika dikembalikan oleh provider), yang ditampilkan dalam error/log TTS.

## Tool agen

Tool `tts` mengubah teks menjadi speech dan mengembalikan lampiran audio untuk
pengiriman balasan. Ketika channel adalah Feishu, Matrix, Telegram, atau WhatsApp,
audio dikirim sebagai pesan suara, bukan lampiran file.

## Gateway RPC

Method Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
