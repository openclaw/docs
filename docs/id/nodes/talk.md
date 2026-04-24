---
read_when:
    - Mengimplementasikan mode Talk di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode Talk: percakapan suara berkelanjutan dengan ElevenLabs TTS'
title: Mode Talk
x-i18n:
    generated_at: "2026-04-24T09:15:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Mode Talk adalah loop percakapan suara berkelanjutan:

1. Dengarkan ucapan
2. Kirim transkrip ke model (sesi utama, chat.send)
3. Tunggu respons
4. Ucapkan melalui provider Talk yang dikonfigurasi (`talk.speak`)

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Talk diaktifkan.
- Transisi fase **Mendengarkan → Berpikir → Berbicara**.
- Pada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interupsi saat ada ucapan** (default aktif): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan pemutaran dan mencatat timestamp interupsi untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat memberi prefiks pada balasannya dengan **satu baris JSON** untuk mengontrol suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris non-kosong pertama.
- Kunci yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini.
- Tanpa `once`, suara tersebut menjadi default baru untuk mode Talk.
- Baris JSON dihapus sebelum pemutaran TTS.

Kunci yang didukung:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfigurasi (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Default:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms di macOS dan Android, 900 ms di iOS`)
- `voiceId`: kembali ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (atau suara ElevenLabs pertama saat API key tersedia)
- `modelId`: default ke `eleven_v3` saat tidak disetel
- `apiKey`: kembali ke `ELEVENLABS_API_KEY` (atau profil shell Gateway jika tersedia)
- `outputFormat`: default ke `pcm_44100` di macOS/iOS dan `pcm_24000` di Android (setel `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle bilah menu: **Talk**
- Tab konfigurasi: grup **Mode Talk** (voice id + toggle interupsi)
- Overlay:
  - **Mendengarkan**: cloud berdenyut dengan level mic
  - **Berpikir**: animasi tenggelam
  - **Berbicara**: cincin memancar
  - Klik cloud: hentikan berbicara
  - Klik X: keluar dari mode Talk

## Catatan

- Memerlukan izin Speech + Microphone.
- Menggunakan `chat.send` terhadap session key `main`.
- Gateway me-resolve pemutaran Talk melalui `talk.speak` menggunakan provider Talk aktif. Android kembali ke TTS sistem lokal hanya ketika RPC itu tidak tersedia.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat disetel.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack berlatensi rendah.

## Terkait

- [Voice wake](/id/nodes/voicewake)
- [Audio dan voice note](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
