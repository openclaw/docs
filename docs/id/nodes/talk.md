---
read_when:
    - Mengimplementasikan mode talk di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode talk: percakapan suara berkelanjutan dengan provider TTS yang dikonfigurasi'
title: Mode talk
x-i18n:
    generated_at: "2026-04-26T11:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Mode talk adalah loop percakapan suara berkelanjutan:

1. Mendengarkan ucapan
2. Mengirim transkrip ke model (sesi utama, `chat.send`)
3. Menunggu respons
4. Mengucapkannya melalui provider Talk yang dikonfigurasi (`talk.speak`)

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Talk diaktifkan.
- Transisi fase **Listening → Thinking → Speaking**.
- Pada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interupsi saat ada ucapan** (default aktif): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan pemutaran dan mencatat timestamp interupsi untuk prompt berikutnya.

## Directive suara dalam balasan

Asisten dapat menambahkan awalan pada balasannya dengan **satu baris JSON** untuk mengendalikan suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris non-kosong pertama.
- Key yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini.
- Tanpa `once`, suara menjadi default baru untuk mode Talk.
- Baris JSON dihapus sebelum pemutaran TTS.

Key yang didukung:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Default:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: jika tidak diatur, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms` di macOS dan Android, `900 ms` di iOS)
- `provider`: memilih provider Talk aktif. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.
- `providers.<provider>.voiceId`: fallback ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` untuk ElevenLabs (atau suara ElevenLabs pertama saat API key tersedia).
- `providers.elevenlabs.modelId`: default ke `eleven_v3` jika tidak diatur.
- `providers.mlx.modelId`: default ke `mlx-community/Soprano-80M-bf16` jika tidak diatur.
- `providers.elevenlabs.apiKey`: fallback ke `ELEVENLABS_API_KEY` (atau profil shell gateway jika tersedia).
- `speechLocale`: id locale BCP 47 opsional untuk pengenalan suara Talk pada perangkat di iOS/macOS. Biarkan tidak diatur untuk menggunakan default perangkat.
- `outputFormat`: default ke `pcm_44100` di macOS/iOS dan `pcm_24000` di Android (atur `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle bilah menu: **Talk**
- Tab config: grup **Talk Mode** (voice id + toggle interupsi)
- Overlay:
  - **Listening**: denyut awan dengan level mic
  - **Thinking**: animasi tenggelam
  - **Speaking**: cincin memancar
  - Klik awan: hentikan bicara
  - Klik X: keluar dari mode Talk

## UI Android

- Toggle tab Voice: **Talk**
- **Mic** manual dan **Talk** adalah mode penangkapan runtime yang saling eksklusif.
- Mic manual berhenti saat aplikasi keluar dari foreground atau pengguna meninggalkan tab Voice.
- Talk Mode tetap berjalan sampai dimatikan atau Android Node terputus, dan menggunakan jenis foreground-service mikrofon Android saat aktif.

## Catatan

- Memerlukan izin Speech + Microphone.
- Menggunakan `chat.send` terhadap key sesi `main`.
- Gateway me-resolve pemutaran Talk melalui `talk.speak` menggunakan provider Talk aktif. Android fallback ke TTS sistem lokal hanya saat RPC itu tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan helper `openclaw-mlx-tts` bawaan jika ada, atau executable di `PATH`. Atur `OPENCLAW_MLX_TTS_BIN` untuk menunjuk ke binary helper kustom selama pengembangan.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat diatur.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack berlatensi rendah.

## Terkait

- [Voice wake](/id/nodes/voicewake)
- [Audio and voice notes](/id/nodes/audio)
- [Media understanding](/id/nodes/media-understanding)
