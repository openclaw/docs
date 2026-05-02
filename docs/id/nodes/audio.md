---
read_when:
    - Mengubah transkripsi audio atau penanganan media
summary: Cara audio/catatan suara yang masuk diunduh, ditranskripsi, dan disisipkan ke dalam balasan
title: Audio dan catatan suara
x-i18n:
    generated_at: "2026-05-02T23:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Catatan Suara (2026-01-17)

## Yang berfungsi

- **Pemahaman media (audio)**: Jika pemahaman audio diaktifkan (atau terdeteksi otomatis), OpenClaw:
  1. Menemukan lampiran audio pertama (path lokal atau URL) dan mengunduhnya jika perlu.
  2. Menerapkan `maxBytes` sebelum mengirim ke setiap entri model.
  3. Menjalankan entri model pertama yang memenuhi syarat secara berurutan (provider atau CLI).
  4. Jika gagal atau dilewati (ukuran/timeout), OpenClaw mencoba entri berikutnya.
  5. Jika berhasil, OpenClaw mengganti `Body` dengan blok `[Audio]` dan menetapkan `{{Transcript}}`.
- **Penguraian perintah**: Saat transkripsi berhasil, `CommandBody`/`RawBody` ditetapkan ke transkrip sehingga perintah slash tetap berfungsi.
- **Logging verbose**: Dalam `--verbose`, kami mencatat saat transkripsi berjalan dan saat transkripsi mengganti body.
- **Dikte Control UI**: Penyusun Chat dapat mengirim klip mikrofon yang direkam browser ke `chat.transcribeAudio`. RPC Gateway tersebut menulis klip ke file lokal sementara, menjalankan pipeline transkripsi audio yang sama, mengembalikan teks draf ke browser, dan menghapus file sementara. Ini tidak membuat run agen dengan sendirinya.

## Deteksi otomatis (default)

Jika Anda **tidak mengonfigurasi model** dan `tools.media.audio.enabled` **tidak** diatur ke `false`,
OpenClaw mendeteksi otomatis dalam urutan ini dan berhenti pada opsi pertama yang berfungsi:

1. **Model balasan aktif** saat provider-nya mendukung pemahaman audio.
2. **CLI lokal** (jika terinstal)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (dari `whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
3. **CLI Gemini** (`gemini`) menggunakan `read_many_files`
4. **Autentikasi provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung audio dicoba terlebih dahulu
   - Urutan fallback bawaan: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Untuk menonaktifkan deteksi otomatis, atur `tools.media.audio.enabled: false`.
Untuk menyesuaikan, atur `tools.media.audio.models`.
Catatan: Deteksi biner bersifat upaya terbaik di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau atur model CLI eksplisit dengan path perintah lengkap.

## Contoh konfigurasi

### Fallback provider + CLI (OpenAI + Whisper CLI)

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

### Hanya provider dengan pembatasan cakupan

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

### Hanya provider (Deepgram)

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

### Hanya provider (Mistral Voxtral)

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

### Hanya provider (SenseAudio)

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

## Catatan & batasan

- Autentikasi provider mengikuti urutan autentikasi model standar (profil autentikasi, env vars, `models.providers.*.apiKey`).
- Detail penyiapan Groq: [Groq](/id/providers/groq).
- Deepgram mengambil `DEEPGRAM_API_KEY` saat `provider: "deepgram"` digunakan.
- Detail penyiapan Deepgram: [Deepgram (transkripsi audio)](/id/providers/deepgram).
- Detail penyiapan Mistral: [Mistral](/id/providers/mistral).
- SenseAudio mengambil `SENSEAUDIO_API_KEY` saat `provider: "senseaudio"` digunakan.
- Detail penyiapan SenseAudio: [SenseAudio](/id/providers/senseaudio).
- Provider audio dapat menimpa `baseUrl`, `headers`, dan `providerOptions` melalui `tools.media.audio`.
- Batas ukuran default adalah 20MB (`tools.media.audio.maxBytes`). Audio yang terlalu besar dilewati untuk model tersebut dan entri berikutnya dicoba.
- File audio tiny/kosong di bawah 1024 byte dilewati sebelum transkripsi provider/CLI.
- `maxChars` default untuk audio **tidak diatur** (transkrip penuh). Atur `tools.media.audio.maxChars` atau `maxChars` per entri untuk memangkas output.
- Default otomatis OpenAI adalah `gpt-4o-mini-transcribe`; atur `model: "gpt-4o-transcribe"` untuk akurasi lebih tinggi.
- Gunakan `tools.media.audio.attachments` untuk memproses beberapa catatan suara (`mode: "all"` + `maxAttachments`).
- Transkrip tersedia untuk templat sebagai `{{Transcript}}`.
- `tools.media.audio.echoTranscript` nonaktif secara default; aktifkan untuk mengirim konfirmasi transkrip kembali ke chat asal sebelum pemrosesan agen.
- `tools.media.audio.echoFormat` menyesuaikan teks gema (placeholder: `{transcript}`).
- stdout CLI dibatasi (5MB); jaga agar output CLI tetap ringkas.
- `args` CLI sebaiknya menggunakan `{{MediaPath}}` untuk path file audio lokal. Jalankan `openclaw doctor --fix` untuk memigrasikan placeholder `{input}` yang sudah usang dari konfigurasi `audio.transcription.command` lama.

### Dukungan lingkungan proxy

Transkripsi audio berbasis provider mematuhi env vars proxy outbound standar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jika tidak ada env vars proxy yang diatur, egress langsung digunakan. Jika konfigurasi proxy salah format, OpenClaw mencatat peringatan dan fallback ke fetch langsung.

## Deteksi mention dalam grup

Saat `requireMention: true` diatur untuk chat grup, OpenClaw sekarang mentranskripsi audio **sebelum** memeriksa mention. Ini memungkinkan catatan suara diproses bahkan ketika berisi mention.

**Cara kerjanya:**

1. Jika pesan suara tidak memiliki body teks dan grup memerlukan mention, OpenClaw melakukan transkripsi "preflight".
2. Transkrip diperiksa untuk pola mention (misalnya, `@BotName`, pemicu emoji).
3. Jika mention ditemukan, pesan dilanjutkan melalui pipeline balasan penuh.
4. Transkrip digunakan untuk deteksi mention sehingga catatan suara dapat melewati gerbang mention.

**Perilaku fallback:**

- Jika transkripsi gagal selama preflight (timeout, kesalahan API, dll.), pesan diproses berdasarkan deteksi mention teks saja.
- Ini memastikan bahwa pesan campuran (teks + audio) tidak pernah keliru dibuang.

**Opt-out per grup/topik Telegram:**

- Atur `channels.telegram.groups.<chatId>.disableAudioPreflight: true` untuk melewati pemeriksaan mention transkrip preflight untuk grup tersebut.
- Atur `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` untuk menimpa per topik (`true` untuk melewati, `false` untuk memaksa aktif).
- Default adalah `false` (preflight diaktifkan saat kondisi yang dibatasi mention cocok).

**Contoh:** Pengguna mengirim catatan suara yang mengatakan "Hey @Claude, what's the weather?" di grup Telegram dengan `requireMention: true`. Catatan suara ditranskripsi, mention terdeteksi, dan agen membalas.

## Hal yang perlu diperhatikan

- Aturan cakupan menggunakan kecocokan pertama yang menang. `chatType` dinormalisasi menjadi `direct`, `group`, atau `room`.
- Pastikan CLI Anda keluar dengan 0 dan mencetak teks biasa; JSON perlu diproses melalui `jq -r .text`.
- Untuk `parakeet-mlx`, jika Anda meneruskan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat `--output-format` adalah `txt` (atau dihilangkan); format output non-`txt` fallback ke penguraian stdout.
- Jaga timeout tetap wajar (`timeoutSeconds`, default 60d) untuk menghindari pemblokiran antrean balasan.
- Transkripsi preflight hanya memproses lampiran audio **pertama** untuk deteksi mention. Audio tambahan diproses selama fase utama pemahaman media.

## Terkait

- [Pemahaman media](/id/nodes/media-understanding)
- [Mode bicara](/id/nodes/talk)
- [Bangun suara](/id/nodes/voicewake)
