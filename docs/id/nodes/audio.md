---
read_when:
    - Mengubah transkripsi audio atau penanganan media
summary: Cara catatan audio/suara masuk diunduh, ditranskripsikan, dan disisipkan ke dalam balasan
title: Audio dan catatan suara
x-i18n:
    generated_at: "2026-07-12T14:20:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Fungsinya

Ketika pemahaman audio diaktifkan (atau terdeteksi otomatis), OpenClaw:

1. Menemukan lampiran audio pertama (jalur lokal atau URL) dan mengunduhnya jika diperlukan.
2. Menerapkan `maxBytes` sebelum mengirimkannya ke setiap entri model.
3. Menjalankan entri model pertama yang memenuhi syarat secara berurutan (penyedia atau CLI); jika suatu entri gagal atau dilewati (ukuran/batas waktu), entri berikutnya akan dicoba.
4. Jika berhasil, mengganti `Body` dengan blok `[Audio]` dan menetapkan `{{Transcript}}`.

Ketika transkripsi berhasil, `CommandBody`/`RawBody` juga ditetapkan ke transkrip agar perintah garis miring tetap berfungsi. Dengan `--verbose`, log menunjukkan kapan transkripsi dijalankan dan kapan transkripsi menggantikan isi pesan.

## Deteksi otomatis (bawaan)

Jika Anda belum mengonfigurasi model dan `tools.media.audio.enabled` bukan `false`, OpenClaw melakukan deteksi otomatis dalam urutan berikut dan berhenti pada opsi pertama yang berfungsi:

1. **Model balasan aktif**, ketika penyedianya mendukung pemahaman audio.
2. **Autentikasi penyedia yang dikonfigurasi** — setiap entri `models.providers.*` dengan autentikasi yang tersedia untuk penyedia yang mendukung transkripsi audio. Ini diperiksa sebelum CLI lokal, sehingga kunci API yang dikonfigurasi selalu diutamakan daripada biner lokal di `PATH`.
   Prioritas penyedia ketika beberapa penyedia dikonfigurasi: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLI lokal** (hanya jika autentikasi penyedia tidak berhasil ditemukan). OpenClaw menyusun daftar fallback berurutan:
   - `whisper-cli`, sebelum opsi bawaan CPU hanya ketika pemanggilan model sebelumnya dalam proses saat ini mendeteksi Metal atau CUDA
   - `sherpa-onnx-offline` pada penyedia CPU bawaannya (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan `tokens.txt`, `encoder.onnx`, `decoder.onnx`, dan `joiner.onnx`)
   - `whisper-cli` ketika Metal/CUDA hanya didukung oleh hasil build atau backend yang dipilih belum teramati
   - `parakeet-mlx` pada Apple Silicon (mendukung MLX; penggunaan perangkat tetap belum teramati)
   - `whisper` (CLI Python; mengunduh model secara otomatis)

Asal penginstalan/penautan merupakan bukti kemampuan, bukan bukti eksekusi. Hal tersebut tidak pernah dengan sendirinya memindahkan kandidat ke urutan sebelum sherpa CPU. OpenClaw tidak memuat model selama penyiapan atau pemeriksaan status hanya untuk memeriksa backend.
whisper.cpp yang terdeteksi otomatis tetap mengaktifkan log normal saat model dijalankan agar OpenClaw dapat merekam baris `using … backend` dari sumber upstream. Entri CLI eksplisit mempertahankan flag keluaran yang dikonfigurasi.

Deteksi otomatis Gemini CLI untuk pemahaman media telah digantikan oleh fallback Antigravity CLI (`agy`) dalam sandbox untuk gambar/video; audio tidak menggunakan fallback CLI selain biner lokal di atas.

Untuk menonaktifkan deteksi otomatis, tetapkan `tools.media.audio.enabled: false`. Untuk menyesuaikannya, tetapkan `tools.media.audio.models`.

<Note>
Deteksi biner dilakukan sebisa mungkin di macOS/Linux/Windows. Pastikan CLI berada di `PATH` (`~` diperluas), atau tetapkan model CLI eksplisit dengan jalur perintah lengkap.
</Note>

Periksa pilihan lokal tanpa mentranskripsikan audio:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Inventaris penyedia melaporkan pemenang fallback lokal secara terpisah dari pemilihan penyedia global, beserta bidang backend yang mampu, diminta, dan teramati. Setelah transkripsi dijalankan, `/status` melaporkan backend yang diminta atau teramati pada baris media. Entri CLI eksplisit dalam `tools.media.audio.models` tetap melewati pemilihan otomatis; gunakan flag khusus backend masing-masing seperti `--provider=cuda` untuk sherpa atau `--no-gpu`/`--device` untuk whisper.cpp.

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
          { provider: "openai", model: "gpt-4o-transcribe" },
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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Kirim transkrip kembali ke obrolan (opsional)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // nilai bawaan adalah false
        echoFormat: '📝 "{transcript}"', // opsional, mendukung {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Catatan dan batasan

- Autentikasi penyedia mengikuti urutan autentikasi model standar (profil autentikasi, variabel lingkungan, `models.providers.*.apiKey`).
- Detail penyiapan Groq: [Groq](/id/providers/groq).
- Deepgram menggunakan `DEEPGRAM_API_KEY` ketika `provider: "deepgram"` digunakan. Detail penyiapan: [Deepgram](/id/providers/deepgram).
- Detail penyiapan Mistral: [Mistral](/id/providers/mistral).
- SenseAudio menggunakan `SENSEAUDIO_API_KEY` ketika `provider: "senseaudio"` digunakan. Detail penyiapan: [SenseAudio](/id/providers/senseaudio).
- Penyedia audio dapat mengganti `baseUrl`, `headers`, dan `providerOptions` melalui `tools.media.audio`.
- Batas ukuran bawaan adalah 20 MB (`tools.media.audio.maxBytes`). Audio yang melebihi ukuran akan dilewati untuk model tersebut dan entri berikutnya akan dicoba.
- Berkas audio yang lebih kecil dari 1024 byte dilewati sebelum transkripsi penyedia/CLI.
- `maxChars` bawaan untuk audio **tidak ditetapkan** (transkrip lengkap). Tetapkan `tools.media.audio.maxChars` atau `maxChars` per entri untuk memangkas keluaran.
- Nilai bawaan deteksi otomatis OpenAI adalah `gpt-4o-transcribe`; tetapkan `model: "gpt-4o-mini-transcribe"` untuk opsi yang lebih murah/cepat.
- Gunakan `tools.media.audio.attachments` untuk memproses beberapa catatan suara (`mode: "all"` beserta `maxAttachments`, nilai bawaan 1).
- Transkrip tersedia bagi templat sebagai `{{Transcript}}`.
- `tools.media.audio.echoTranscript` dinonaktifkan secara bawaan; aktifkan untuk mengirim konfirmasi transkrip kembali ke obrolan asal sebelum pemrosesan agen.
- `tools.media.audio.echoFormat` menyesuaikan teks balasan transkrip (placeholder: `{transcript}`; nilai bawaan `📝 "{transcript}"`).
- Keluaran standar CLI dibatasi hingga 5 MB; pertahankan keluaran CLI agar ringkas.
- `args` CLI harus menggunakan `{{MediaPath}}` untuk jalur berkas audio lokal. Jalankan `openclaw doctor --fix` untuk memigrasikan placeholder `{input}` yang sudah tidak digunakan dari konfigurasi `audio.transcription.command` lama (kunci yang dihentikan: `audio.transcription`, digantikan oleh `tools.media.audio.models`).
- `tools.media.concurrency` membatasi tugas media; ini bukan penjadwal GPU.

### STT lokal residen

STT lokal yang terdeteksi otomatis tetap menggunakan satu proses per permintaan. Saat ini OpenClaw tidak mengelola server whisper.cpp residen karena paket Homebrew `whisper-cpp` standar menonaktifkan server tersebut, sementara contoh upstream tidak memiliki antrean penerimaan terbatas yang dikonfigurasi. Siklus hidup residen yang dimiliki Plugin memerlukan pekerja terkemas dan terpelihara dengan pemeriksaan kesehatan/pemulaian, persistensi model, pengantrean terbatas, pembatalan/batas waktu, operasi local loopback tanpa autentikasi, dan tanpa fallback cloud sebelum dapat diaktifkan dengan aman.

### Dukungan lingkungan proksi

Transkripsi audio berbasis penyedia mematuhi variabel lingkungan proksi keluar standar, sesuai dengan semantik `EnvHttpProxyAgent` milik undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Variabel huruf kecil lebih diutamakan daripada huruf besar; entri `NO_PROXY`/`no_proxy` (nama host, `*.suffix`, atau `host:port`) melewati proksi. Jika tidak ada variabel lingkungan proksi yang ditetapkan, akses keluar langsung digunakan. Jika penyiapan proksi gagal (URL salah format), OpenClaw mencatat peringatan dan menggunakan pengambilan langsung sebagai fallback.

## Deteksi penyebutan dalam grup

Pada saluran yang mendukung pemeriksaan awal audio, OpenClaw mentranskripsikan audio **sebelum** memeriksa penyebutan ketika `requireMention: true` ditetapkan untuk obrolan grup. Hal ini memungkinkan catatan suara tanpa keterangan melewati gerbang penyebutan ketika transkripnya berisi pola penyebutan yang dikonfigurasi. Dokumentasi khusus saluran menjelaskan transportasi yang mengharuskan penyebutan tertulis.

**Cara kerjanya:**

1. Jika pesan suara tidak memiliki isi teks dan grup mengharuskan penyebutan, OpenClaw melakukan transkripsi awal terhadap lampiran audio pertama.
2. Transkrip diperiksa untuk menemukan pola penyebutan (misalnya `@BotName`, pemicu emoji).
3. Jika penyebutan ditemukan, pesan dilanjutkan melalui seluruh alur pemrosesan balasan.

**Perilaku fallback:** jika transkripsi awal gagal (batas waktu, kesalahan API, dan sebagainya), pesan kembali menggunakan deteksi penyebutan berbasis teks saja agar pesan campuran (teks + audio) tidak pernah diabaikan.

**Penonaktifan per grup/topik Telegram:**

- Tetapkan `channels.telegram.groups.<chatId>.disableAudioPreflight: true` untuk melewati pemeriksaan penyebutan pada transkrip awal bagi grup tersebut.
- Tetapkan `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` untuk mengganti pengaturan per topik (`true` untuk melewati, `false` untuk memaksa pengaktifan).
- Nilai bawaannya adalah `false` (pemeriksaan awal diaktifkan ketika kondisi yang dibatasi penyebutan terpenuhi).

**Contoh:** seorang pengguna mengirim catatan suara yang mengatakan "Hai @Claude, bagaimana cuacanya?" dalam grup Telegram dengan `requireMention: true`. Catatan suara tersebut ditranskripsikan, penyebutannya terdeteksi, dan agen membalas.

## Hal yang perlu diperhatikan

- Aturan cakupan menggunakan kecocokan pertama yang menang; `chatType` dinormalisasi menjadi `direct`, `group`, atau `channel`.
- Pastikan CLI Anda keluar dengan kode 0 dan mencetak teks biasa; keluaran JSON perlu diolah melalui `jq -r .text`.
- Mode keluaran berkas yang diketahui bersifat otoritatif: berkas transkrip hasil inferensi yang kosong atau tidak ada tidak menghasilkan transkrip, alih-alih menggunakan keluaran progres CLI sebagai fallback.
- Untuk `parakeet-mlx`, gunakan `--output-format txt` (atau `all`) dengan `--output-dir` dan templat keluaran bawaan `{filename}`. Variabel lingkungan upstream `PARAKEET_OUTPUT_FORMAT` dan `PARAKEET_OUTPUT_TEMPLATE` juga dipatuhi. OpenClaw membaca `<output-dir>/<media-basename>.txt`; format bawaan `srt`, format lainnya, dan templat keluaran khusus tetap menggunakan keluaran standar.
- Tetapkan batas waktu yang wajar (`timeoutSeconds`, nilai bawaan 60 detik) agar antrean balasan tidak terblokir.
- Transkripsi awal hanya memproses lampiran audio **pertama** untuk deteksi penyebutan. Lampiran audio tambahan diproses selama tahap utama pemahaman media.

## Terkait

- [Pemahaman media](/id/nodes/media-understanding)
- [Mode bicara](/id/nodes/talk)
- [Pengaktifan suara](/id/nodes/voicewake)
