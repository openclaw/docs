---
read_when:
    - Mengubah transkripsi audio atau penanganan media
summary: Cara audio/pesan suara masuk diunduh, ditranskripsikan, dan disuntikkan ke dalam balasan
title: Audio dan pesan suara
x-i18n:
    generated_at: "2026-04-24T09:15:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Pesan Suara (2026-01-17)

## Apa yang berfungsi

- **Pemahaman media (audio)**: Jika pemahaman audio diaktifkan (atau terdeteksi otomatis), OpenClaw:
  1. Menemukan lampiran audio pertama (path lokal atau URL) dan mengunduhnya jika diperlukan.
  2. Menegakkan `maxBytes` sebelum mengirim ke setiap entri model.
  3. Menjalankan entri model pertama yang memenuhi syarat secara berurutan (provider atau CLI).
  4. Jika gagal atau dilewati (ukuran/timeout), OpenClaw mencoba entri berikutnya.
  5. Jika berhasil, OpenClaw mengganti `Body` dengan blok `[Audio]` dan menyetel `{{Transcript}}`.
- **Parsing perintah**: Saat transkripsi berhasil, `CommandBody`/`RawBody` disetel ke transkrip sehingga slash command tetap berfungsi.
- **Logging verbose**: Dalam `--verbose`, kami mencatat saat transkripsi berjalan dan saat transkripsi menggantikan body.

## Deteksi otomatis (default)

Jika Anda **tidak mengonfigurasi model** dan `tools.media.audio.enabled` **tidak** disetel ke `false`,
OpenClaw mendeteksi otomatis dalam urutan ini dan berhenti pada opsi pertama yang berfungsi:

1. **Model balasan aktif** saat provider-nya mendukung pemahaman audio.
2. **CLI lokal** (jika terinstal)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (dari `whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
3. **CLI Gemini** (`gemini`) menggunakan `read_many_files`
4. **Auth provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung audio dicoba lebih dulu
   - Urutan fallback bawaan: OpenAI → Groq → Deepgram → Google → Mistral

Untuk menonaktifkan deteksi otomatis, setel `tools.media.audio.enabled: false`.
Untuk menyesuaikan, setel `tools.media.audio.models`.
Catatan: deteksi biner bersifat best-effort di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami mengekspansi `~`), atau setel model CLI eksplisit dengan path perintah lengkap.

## Contoh config

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

### Khusus provider dengan gating scope

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

### Khusus provider (Deepgram)

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

### Khusus provider (Mistral Voxtral)

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

### Echo transkrip ke chat (opt-in)

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

- Auth provider mengikuti urutan auth model standar (profil auth, var env, `models.providers.*.apiKey`).
- Detail penyiapan Groq: [Groq](/id/providers/groq).
- Deepgram mengambil `DEEPGRAM_API_KEY` saat `provider: "deepgram"` digunakan.
- Detail penyiapan Deepgram: [Deepgram (audio transcription)](/id/providers/deepgram).
- Detail penyiapan Mistral: [Mistral](/id/providers/mistral).
- Provider audio dapat mengoverride `baseUrl`, `headers`, dan `providerOptions` melalui `tools.media.audio`.
- Batas ukuran default adalah 20MB (`tools.media.audio.maxBytes`). Audio yang terlalu besar dilewati untuk model tersebut dan entri berikutnya akan dicoba.
- File audio yang sangat kecil/kosong di bawah 1024 byte dilewati sebelum transkripsi provider/CLI.
- `maxChars` default untuk audio **tidak disetel** (transkrip penuh). Setel `tools.media.audio.maxChars` atau `maxChars` per-entri untuk memotong output.
- Default otomatis OpenAI adalah `gpt-4o-mini-transcribe`; setel `model: "gpt-4o-transcribe"` untuk akurasi lebih tinggi.
- Gunakan `tools.media.audio.attachments` untuk memproses beberapa pesan suara (`mode: "all"` + `maxAttachments`).
- Transkrip tersedia untuk template sebagai `{{Transcript}}`.
- `tools.media.audio.echoTranscript` nonaktif secara default; aktifkan untuk mengirim konfirmasi transkrip kembali ke chat asal sebelum pemrosesan agen.
- `tools.media.audio.echoFormat` menyesuaikan teks echo (placeholder: `{transcript}`).
- Stdout CLI dibatasi (5MB); pertahankan output CLI tetap ringkas.

### Dukungan environment proxy

Transkripsi audio berbasis provider mematuhi var env proxy keluar standar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada var env proxy yang disetel, direct egress digunakan. Jika config proxy salah bentuk, OpenClaw mencatat peringatan dan fallback ke fetch langsung.

## Deteksi Mention di Grup

Saat `requireMention: true` disetel untuk chat grup, OpenClaw sekarang mentranskripsikan audio **sebelum** memeriksa mention. Ini memungkinkan pesan suara diproses bahkan ketika berisi mention.

**Cara kerjanya:**

1. Jika pesan suara tidak memiliki body teks dan grup memerlukan mention, OpenClaw melakukan transkripsi "preflight".
2. Transkrip diperiksa untuk pola mention (misalnya `@BotName`, pemicu emoji).
3. Jika mention ditemukan, pesan melanjutkan ke pipeline balasan penuh.
4. Transkrip digunakan untuk deteksi mention sehingga pesan suara dapat lolos gerbang mention.

**Perilaku fallback:**

- Jika transkripsi gagal selama preflight (timeout, galat API, dll.), pesan diproses berdasarkan deteksi mention hanya-teks.
- Ini memastikan pesan campuran (teks + audio) tidak pernah salah dibuang.

**Opt-out per grup/topik Telegram:**

- Setel `channels.telegram.groups.<chatId>.disableAudioPreflight: true` untuk melewati pemeriksaan mention transkrip preflight untuk grup tersebut.
- Setel `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` untuk override per-topik (`true` untuk melewati, `false` untuk memaksa aktif).
- Default adalah `false` (preflight diaktifkan saat kondisi mention-gated cocok).

**Contoh:** Seorang pengguna mengirim pesan suara yang mengatakan "Hey @Claude, what's the weather?" di grup Telegram dengan `requireMention: true`. Pesan suara ditranskripsikan, mention terdeteksi, dan agen membalas.

## Hal yang perlu diperhatikan

- Aturan scope menggunakan first-match wins. `chatType` dinormalisasi menjadi `direct`, `group`, atau `room`.
- Pastikan CLI Anda keluar dengan kode 0 dan mencetak teks biasa; JSON perlu disesuaikan melalui `jq -r .text`.
- Untuk `parakeet-mlx`, jika Anda memberikan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat `--output-format` adalah `txt` (atau dihilangkan); format output non-`txt` fallback ke parsing stdout.
- Pertahankan timeout tetap wajar (`timeoutSeconds`, default 60 detik) agar tidak memblokir antrean balasan.
- Transkripsi preflight hanya memproses lampiran audio **pertama** untuk deteksi mention. Audio tambahan diproses selama fase pemahaman media utama.

## Terkait

- [Media understanding](/id/nodes/media-understanding)
- [Talk mode](/id/nodes/talk)
- [Voice wake](/id/nodes/voicewake)
