---
read_when:
    - Mengubah transkripsi audio atau penanganan media
summary: Bagaimana audio/catatan suara masuk diunduh, ditranskripsi, dan dimasukkan ke dalam balasan
title: Audio dan catatan suara
x-i18n:
    generated_at: "2026-05-06T17:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## Yang berfungsi

- **Pemahaman media (audio)**: Jika pemahaman audio diaktifkan (atau terdeteksi otomatis), OpenClaw:
  1. Menemukan lampiran audio pertama (jalur lokal atau URL) dan mengunduhnya jika perlu.
  2. Menerapkan `maxBytes` sebelum mengirim ke setiap entri model.
  3. Menjalankan entri model pertama yang memenuhi syarat sesuai urutan (penyedia atau CLI).
  4. Jika gagal atau dilewati (ukuran/timeout), OpenClaw mencoba entri berikutnya.
  5. Saat berhasil, OpenClaw mengganti `Body` dengan blok `[Audio]` dan mengatur `{{Transcript}}`.
- **Penguraian perintah**: Saat transkripsi berhasil, `CommandBody`/`RawBody` diatur ke transkrip sehingga perintah slash tetap berfungsi.
- **Pencatatan log verbose**: Dalam `--verbose`, kami mencatat saat transkripsi berjalan dan saat transkripsi mengganti body.

## Deteksi otomatis (default)

Jika Anda **tidak mengonfigurasi model** dan `tools.media.audio.enabled` **tidak** diatur ke `false`,
OpenClaw mendeteksi otomatis dalam urutan ini dan berhenti pada opsi pertama yang berfungsi:

1. **Model balasan aktif** saat penyedianya mendukung pemahaman audio.
2. **CLI lokal** (jika terinstal)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (dari `whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
3. **CLI Gemini** (`gemini`) menggunakan `read_many_files`
4. **Autentikasi penyedia**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung audio dicoba terlebih dahulu
   - Urutan fallback bawaan: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Untuk menonaktifkan deteksi otomatis, atur `tools.media.audio.enabled: false`.
Untuk menyesuaikan, atur `tools.media.audio.models`.
Catatan: Deteksi biner bersifat upaya terbaik di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau atur model CLI eksplisit dengan jalur perintah lengkap.

## Contoh konfigurasi

### Fallback penyedia + CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Hanya penyedia dengan pembatasan cakupan

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Hanya penyedia (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Hanya penyedia (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Hanya penyedia (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Gema transkrip ke chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Catatan dan batasan

- Autentikasi penyedia mengikuti urutan autentikasi model standar (profil autentikasi, variabel env, `models.providers.*.apiKey`).
- Detail penyiapan Groq: [Groq](/id/providers/groq).
- Deepgram mengambil `DEEPGRAM_API_KEY` saat `provider: "deepgram"` digunakan.
- Detail penyiapan Deepgram: [Deepgram (transkripsi audio)](/id/providers/deepgram).
- Detail penyiapan Mistral: [Mistral](/id/providers/mistral).
- SenseAudio mengambil `SENSEAUDIO_API_KEY` saat `provider: "senseaudio"` digunakan.
- Detail penyiapan SenseAudio: [SenseAudio](/id/providers/senseaudio).
- Penyedia audio dapat menimpa `baseUrl`, `headers`, dan `providerOptions` melalui `tools.media.audio`.
- Batas ukuran default adalah 20MB (`tools.media.audio.maxBytes`). Audio yang terlalu besar dilewati untuk model tersebut dan entri berikutnya dicoba.
- File audio kecil/kosong di bawah 1024 byte dilewati sebelum transkripsi penyedia/CLI.
- `maxChars` default untuk audio **tidak diatur** (transkrip lengkap). Atur `tools.media.audio.maxChars` atau `maxChars` per entri untuk memangkas output.
- Default otomatis OpenAI adalah `gpt-4o-mini-transcribe`; atur `model: "gpt-4o-transcribe"` untuk akurasi yang lebih tinggi.
- Gunakan `tools.media.audio.attachments` untuk memproses beberapa catatan suara (`mode: "all"` + `maxAttachments`).
- Transkrip tersedia untuk templat sebagai `{{Transcript}}`.
- `tools.media.audio.echoTranscript` nonaktif secara default; aktifkan untuk mengirim konfirmasi transkrip kembali ke chat asal sebelum pemrosesan agen.
- `tools.media.audio.echoFormat` menyesuaikan teks gema (placeholder: `{transcript}`).
- stdout CLI dibatasi (5MB); jaga output CLI tetap ringkas.
- `args` CLI harus menggunakan `{{MediaPath}}` untuk jalur file audio lokal. Jalankan `openclaw doctor --fix` untuk memigrasikan placeholder `{input}` yang usang dari konfigurasi `audio.transcription.command` lama.

### Dukungan lingkungan proxy

Transkripsi audio berbasis penyedia mematuhi variabel env proxy outbound standar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jika tidak ada variabel env proxy yang diatur, egress langsung digunakan. Jika konfigurasi proxy salah format, OpenClaw mencatat peringatan dan kembali ke fetch langsung.

## Deteksi mention di grup

Saat `requireMention: true` diatur untuk chat grup, OpenClaw sekarang mentranskripsi audio **sebelum** memeriksa mention. Ini memungkinkan catatan suara diproses bahkan saat berisi mention.

**Cara kerjanya:**

1. Jika pesan suara tidak memiliki body teks dan grup memerlukan mention, OpenClaw melakukan transkripsi "preflight".
2. Transkrip diperiksa untuk pola mention (misalnya, `@BotName`, pemicu emoji).
3. Jika mention ditemukan, pesan dilanjutkan melalui pipeline balasan lengkap.
4. Transkrip digunakan untuk deteksi mention sehingga catatan suara dapat melewati gerbang mention.

**Perilaku fallback:**

- Jika transkripsi gagal selama preflight (timeout, kesalahan API, dll.), pesan diproses berdasarkan deteksi mention khusus teks.
- Ini memastikan pesan campuran (teks + audio) tidak pernah salah dijatuhkan.

**Opt-out per grup/topik Telegram:**

- Atur `channels.telegram.groups.<chatId>.disableAudioPreflight: true` untuk melewati pemeriksaan mention transkrip preflight untuk grup tersebut.
- Atur `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` untuk menimpa per topik (`true` untuk melewati, `false` untuk memaksa aktif).
- Default adalah `false` (preflight diaktifkan saat kondisi dengan gerbang mention cocok).

**Contoh:** Pengguna mengirim catatan suara yang mengatakan "Hey @Claude, what's the weather?" di grup Telegram dengan `requireMention: true`. Catatan suara ditranskripsi, mention terdeteksi, dan agen membalas.

## Hal yang perlu diperhatikan

- Aturan cakupan menggunakan kecocokan pertama yang menang. `chatType` dinormalisasi menjadi `direct`, `group`, atau `room`.
- Pastikan CLI Anda keluar dengan 0 dan mencetak teks biasa; JSON perlu disesuaikan melalui `jq -r .text`.
- Untuk `parakeet-mlx`, jika Anda meneruskan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat `--output-format` adalah `txt` (atau dihilangkan); format output non-`txt` kembali ke penguraian stdout.
- Jaga timeout tetap wajar (`timeoutSeconds`, default 60 dtk) agar tidak memblokir antrean balasan.
- Transkripsi preflight hanya memproses lampiran audio **pertama** untuk deteksi mention. Audio tambahan diproses selama fase utama pemahaman media.

## Terkait

- [Pemahaman media](/id/nodes/media-understanding)
- [Mode bicara](/id/nodes/talk)
- [Voice wake](/id/nodes/voicewake)
