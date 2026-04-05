---
read_when:
    - Mengubah transkripsi audio atau penanganan media
summary: Cara audio/catatan suara masuk diunduh, ditranskripsikan, dan disuntikkan ke dalam balasan
title: Audio dan Catatan Suara
x-i18n:
    generated_at: "2026-04-05T13:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Catatan Suara (2026-01-17)

## Apa yang berfungsi

- **Pemahaman media (audio)**: Jika pemahaman audio diaktifkan (atau terdeteksi otomatis), OpenClaw:
  1. Menemukan lampiran audio pertama (path lokal atau URL) dan mengunduhnya jika diperlukan.
  2. Menerapkan `maxBytes` sebelum mengirim ke setiap entri model.
  3. Menjalankan entri model pertama yang memenuhi syarat secara berurutan (provider atau CLI).
  4. Jika gagal atau dilewati (ukuran/timeout), mencoba entri berikutnya.
  5. Jika berhasil, mengganti `Body` dengan blok `[Audio]` dan menetapkan `{{Transcript}}`.
- **Penguraian perintah**: Saat transkripsi berhasil, `CommandBody`/`RawBody` diatur ke transkrip agar slash command tetap berfungsi.
- **Logging verbose**: Dalam `--verbose`, kami mencatat saat transkripsi dijalankan dan saat transkripsi mengganti body.

## Deteksi otomatis (default)

Jika Anda **tidak mengonfigurasi model** dan `tools.media.audio.enabled` **tidak** disetel ke `false`,
OpenClaw mendeteksi otomatis dalam urutan ini dan berhenti pada opsi pertama yang berfungsi:

1. **Model balasan aktif** saat providernya mendukung pemahaman audio.
2. **CLI lokal** (jika terinstal)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (dari `whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (Python CLI; mengunduh model secara otomatis)
3. **Gemini CLI** (`gemini`) menggunakan `read_many_files`
4. **Auth provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung audio akan dicoba lebih dulu
   - Urutan fallback bawaan: OpenAI → Groq → Deepgram → Google → Mistral

Untuk menonaktifkan deteksi otomatis, setel `tools.media.audio.enabled: false`.
Untuk menyesuaikan, setel `tools.media.audio.models`.
Catatan: Deteksi biner adalah upaya terbaik di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami memperluas `~`), atau setel model CLI eksplisit dengan path perintah lengkap.

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

### Hanya provider dengan gating scope

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

- Auth provider mengikuti urutan auth model standar (profil auth, env var, `models.providers.*.apiKey`).
- Detail penyiapan Groq: [Groq](/providers/groq).
- Deepgram mengambil `DEEPGRAM_API_KEY` saat `provider: "deepgram"` digunakan.
- Detail penyiapan Deepgram: [Deepgram (transkripsi audio)](/providers/deepgram).
- Detail penyiapan Mistral: [Mistral](/providers/mistral).
- Provider audio dapat mengganti `baseUrl`, `headers`, dan `providerOptions` melalui `tools.media.audio`.
- Batas ukuran default adalah 20MB (`tools.media.audio.maxBytes`). Audio yang terlalu besar dilewati untuk model tersebut dan entri berikutnya akan dicoba.
- File audio kecil/kosong di bawah 1024 byte dilewati sebelum transkripsi provider/CLI.
- `maxChars` default untuk audio adalah **tidak disetel** (transkrip penuh). Setel `tools.media.audio.maxChars` atau `maxChars` per entri untuk memangkas output.
- Default otomatis OpenAI adalah `gpt-4o-mini-transcribe`; setel `model: "gpt-4o-transcribe"` untuk akurasi lebih tinggi.
- Gunakan `tools.media.audio.attachments` untuk memproses beberapa catatan suara (`mode: "all"` + `maxAttachments`).
- Transkrip tersedia untuk template sebagai `{{Transcript}}`.
- `tools.media.audio.echoTranscript` nonaktif secara default; aktifkan untuk mengirim konfirmasi transkrip kembali ke chat asal sebelum pemrosesan agent.
- `tools.media.audio.echoFormat` menyesuaikan teks echo (placeholder: `{transcript}`).
- Stdout CLI dibatasi (5MB); jaga output CLI tetap ringkas.

### Dukungan lingkungan proxy

Transkripsi audio berbasis provider mematuhi env var proxy keluar standar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada env var proxy yang disetel, egress langsung digunakan. Jika konfigurasi proxy salah format, OpenClaw mencatat peringatan dan kembali ke fetch langsung.

## Deteksi Mention di Grup

Saat `requireMention: true` disetel untuk chat grup, OpenClaw sekarang mentranskripsikan audio **sebelum** memeriksa mention. Ini memungkinkan catatan suara diproses meskipun mengandung mention.

**Cara kerjanya:**

1. Jika pesan suara tidak memiliki body teks dan grup memerlukan mention, OpenClaw melakukan transkripsi "preflight".
2. Transkrip diperiksa untuk pola mention (misalnya `@BotName`, pemicu emoji).
3. Jika mention ditemukan, pesan dilanjutkan ke pipeline balasan penuh.
4. Transkrip digunakan untuk deteksi mention sehingga catatan suara dapat lolos dari gerbang mention.

**Perilaku fallback:**

- Jika transkripsi gagal selama preflight (timeout, error API, dll.), pesan diproses berdasarkan deteksi mention berbasis teks saja.
- Ini memastikan bahwa pesan campuran (teks + audio) tidak pernah salah dibuang.

**Opt-out per grup/topik Telegram:**

- Setel `channels.telegram.groups.<chatId>.disableAudioPreflight: true` untuk melewati pemeriksaan mention transkrip preflight untuk grup tersebut.
- Setel `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` untuk override per topik (`true` untuk melewati, `false` untuk memaksa aktif).
- Default-nya adalah `false` (preflight aktif saat kondisi berpagar mention terpenuhi).

**Contoh:** Pengguna mengirim catatan suara yang mengatakan "Hey @Claude, what's the weather?" di grup Telegram dengan `requireMention: true`. Catatan suara ditranskripsikan, mention terdeteksi, dan agent membalas.

## Hal-hal yang perlu diperhatikan

- Aturan scope menggunakan kecocokan pertama yang menang. `chatType` dinormalisasi menjadi `direct`, `group`, atau `room`.
- Pastikan CLI Anda keluar dengan kode 0 dan mencetak teks biasa; JSON perlu disesuaikan melalui `jq -r .text`.
- Untuk `parakeet-mlx`, jika Anda meneruskan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat `--output-format` adalah `txt` (atau tidak ditentukan); format output non-`txt` akan kembali ke parsing stdout.
- Jaga timeout tetap masuk akal (`timeoutSeconds`, default 60 detik) agar tidak memblokir antrean balasan.
- Transkripsi preflight hanya memproses **lampiran audio pertama** untuk deteksi mention. Audio tambahan diproses selama fase utama pemahaman media.
