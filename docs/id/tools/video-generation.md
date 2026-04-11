---
read_when:
    - Membuat video melalui agen
    - Mengonfigurasi provider dan model pembuatan video
    - Memahami parameter alat `video_generate`
summary: Hasilkan video dari teks, gambar, atau video yang sudah ada menggunakan 12 backend provider
title: Pembuatan Video
x-i18n:
    generated_at: "2026-04-11T02:48:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6848d03ef578181902517d068e8d9fe2f845e572a90481bbdf7bd9f1c591f245
    source_path: tools/video-generation.md
    workflow: 15
---

# Pembuatan Video

Agen OpenClaw dapat membuat video dari prompt teks, gambar referensi, atau video yang sudah ada. Dua belas backend provider didukung, masing-masing dengan opsi model, mode input, dan kumpulan fitur yang berbeda. Agen memilih provider yang tepat secara otomatis berdasarkan konfigurasi Anda dan API key yang tersedia.

<Note>
Alat `video_generate` hanya muncul saat setidaknya satu provider pembuatan video tersedia. Jika Anda tidak melihatnya di alat agen Anda, tetapkan API key provider atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` untuk permintaan text-to-video tanpa media referensi
- `imageToVideo` saat permintaan menyertakan satu atau lebih gambar referensi
- `videoToVideo` saat permintaan menyertakan satu atau lebih video referensi

Provider dapat mendukung subset mana pun dari mode tersebut. Alat memvalidasi mode
aktif sebelum pengiriman dan melaporkan mode yang didukung dalam `action=list`.

## Mulai cepat

1. Tetapkan API key untuk provider yang didukung:

```bash
export GEMINI_API_KEY="your-key"
```

2. Secara opsional sematkan model default:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Minta agen:

> Buat video sinematik berdurasi 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

Agen memanggil `video_generate` secara otomatis. Tidak perlu allowlist alat.

## Apa yang terjadi saat Anda membuat video

Pembuatan video bersifat asinkron. Saat agen memanggil `video_generate` dalam sebuah sesi:

1. OpenClaw mengirimkan permintaan ke provider dan langsung mengembalikan ID tugas.
2. Provider memproses pekerjaan di latar belakang (biasanya 30 detik hingga 5 menit tergantung provider dan resolusi).
3. Saat video siap, OpenClaw membangunkan sesi yang sama dengan event penyelesaian internal.
4. Agen memposting video yang telah selesai kembali ke percakapan asli.

Saat sebuah pekerjaan sedang berjalan, panggilan `video_generate` duplikat dalam sesi yang sama mengembalikan status tugas saat ini alih-alih memulai pembuatan lain. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa progres dari CLI.

Di luar eksekusi agen berbasis sesi (misalnya, pemanggilan alat langsung), alat melakukan fallback ke pembuatan inline dan mengembalikan path media final dalam giliran yang sama.

### Siklus hidup tugas

Setiap permintaan `video_generate` melalui empat status:

1. **queued** -- tugas dibuat, menunggu provider menerimanya.
2. **running** -- provider sedang memproses (biasanya 30 detik hingga 5 menit tergantung provider dan resolusi).
3. **succeeded** -- video siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- error provider atau timeout; agen bangun dengan detail error.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikasi: jika tugas video sudah `queued` atau `running` untuk sesi saat ini, `video_generate` mengembalikan status tugas yang ada alih-alih memulai tugas baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu pembuatan baru.

## Provider yang didukung

| Provider | Model default                   | Teks | Ref gambar         | Ref video        | API key                                  |
| -------- | ------------------------------- | ---- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Ya  | Ya (URL remote)  | Ya (URL remote) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Ya  | 1 gambar           | Tidak               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Ya  | 1 gambar           | Tidak               | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Ya  | 1 gambar           | Tidak               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Ya  | 1 gambar           | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Ya  | 1 gambar           | Tidak               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Ya  | 1 gambar           | 1 video          | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Ya  | Ya (URL remote)  | Ya (URL remote) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Ya  | 1 gambar           | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Ya  | 1 gambar           | Tidak               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Ya  | 1 gambar (`kling`) | Tidak               | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Ya  | 1 gambar           | 1 video          | `XAI_API_KEY`                            |

Beberapa provider menerima variabel env API key tambahan atau alternatif. Lihat [halaman provider](#related) masing-masing untuk detail.

Jalankan `video_generate action=list` untuk memeriksa provider, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kapabilitas yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `video_generate`, pengujian kontrak,
dan shared live sweep.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes saat ini                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ya        | Ya            | Ya            | `generate`, `imageToVideo`; `videoToVideo` dilewati karena provider ini memerlukan URL video `http(s)` remote                               |
| BytePlus | Ya        | Ya            | Tidak             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Ya        | Ya            | Tidak             | Tidak ada dalam shared sweep; cakupan khusus workflow ada bersama pengujian Comfy                                                               |
| fal      | Ya        | Ya            | Tidak             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Ya        | Ya            | Ya            | `generate`, `imageToVideo`; shared `videoToVideo` dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima input tersebut  |
| MiniMax  | Ya        | Ya            | Tidak             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Ya        | Ya            | Ya            | `generate`, `imageToVideo`; shared `videoToVideo` dilewati karena jalur org/input ini saat ini memerlukan akses inpaint/remix sisi provider |
| Qwen     | Ya        | Ya            | Ya            | `generate`, `imageToVideo`; `videoToVideo` dilewati karena provider ini memerlukan URL video `http(s)` remote                               |
| Runway   | Ya        | Ya            | Ya            | `generate`, `imageToVideo`; `videoToVideo` hanya berjalan saat model yang dipilih adalah `runway/gen4_aleph`                                      |
| Together | Ya        | Ya            | Tidak             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Ya        | Ya            | Tidak             | `generate`; shared `imageToVideo` dilewati karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar remote            |
| xAI      | Ya        | Ya            | Ya            | `generate`, `imageToVideo`; `videoToVideo` dilewati karena provider ini saat ini memerlukan URL MP4 remote                                |

## Parameter alat

### Wajib

| Parameter | Tipe   | Deskripsi                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | Deskripsi teks video yang akan dibuat (wajib untuk `action: "generate"`) |

### Input konten

| Parameter | Tipe     | Deskripsi                          |
| --------- | -------- | ------------------------------------ |
| `image`   | string   | Gambar referensi tunggal (path atau URL) |
| `images`  | string[] | Beberapa gambar referensi (hingga 5)  |
| `video`   | string   | Video referensi tunggal (path atau URL) |
| `videos`  | string[] | Beberapa video referensi (hingga 4)  |

### Kontrol gaya

| Parameter         | Tipe    | Deskripsi                                                              |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`  |
| `resolution`      | string  | `480P`, `720P`, `768P`, atau `1080P`                                       |
| `durationSeconds` | number  | Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung provider) |
| `size`            | string  | Petunjuk ukuran saat provider mendukungnya                                  |
| `audio`           | boolean | Aktifkan audio yang dihasilkan jika didukung                                    |
| `watermark`       | boolean | Aktifkan/nonaktifkan watermark provider jika didukung                              |

### Lanjutan

| Parameter  | Tipe   | Deskripsi                                     |
| ---------- | ------ | ----------------------------------------------- |
| `action`   | string | `"generate"` (default), `"status"`, atau `"list"` |
| `model`    | string | Override provider/model (misalnya `runway/gen4.5`)  |
| `filename` | string | Petunjuk nama file keluaran                            |

Tidak semua provider mendukung semua parameter. OpenClaw sudah menormalkan durasi ke nilai terdekat yang didukung provider, dan juga memetakan ulang petunjuk geometri yang diterjemahkan seperti size-to-aspect-ratio saat provider fallback mengekspos permukaan kontrol yang berbeda. Override yang benar-benar tidak didukung diabaikan dengan upaya terbaik dan dilaporkan sebagai peringatan dalam hasil alat. Batas kapabilitas keras (seperti terlalu banyak input referensi) gagal sebelum pengiriman.

Hasil alat melaporkan pengaturan yang diterapkan. Saat OpenClaw memetakan ulang durasi atau geometri selama fallback provider, nilai `durationSeconds`, `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang dikirimkan, dan `details.normalization` menangkap terjemahan dari yang diminta ke yang diterapkan.

Input referensi juga memilih mode runtime:

- Tanpa media referensi: `generate`
- Referensi gambar apa pun: `imageToVideo`
- Referensi video apa pun: `videoToVideo`

Referensi gambar dan video campuran bukan permukaan kapabilitas bersama yang stabil.
Utamakan satu jenis referensi per permintaan.

## Aksi

- **generate** (default) -- buat video dari prompt yang diberikan dan input referensi opsional.
- **status** -- periksa status tugas video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.
- **list** -- tampilkan provider, model, dan kapabilitasnya yang tersedia.

## Pemilihan model

Saat membuat video, OpenClaw meresolusikan model dalam urutan ini:

1. **Parameter alat `model`** -- jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** -- dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** -- dicoba sesuai urutan.
4. **Deteksi otomatis** -- menggunakan provider yang memiliki auth valid, dimulai dari provider default saat ini, lalu provider lain yang tersisa dalam urutan alfabet.

Jika sebuah provider gagal, kandidat berikutnya dicoba secara otomatis. Jika semua kandidat gagal, error akan menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
pembuatan video hanya menggunakan entri `model`, `primary`, dan `fallbacks`
yang eksplisit.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

HeyGen video-agent di fal dapat disematkan dengan:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

Seedance 2.0 di fal dapat disematkan dengan:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

## Catatan provider

| Provider | Catatan                                                                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Menggunakan endpoint async DashScope/Model Studio. Gambar dan video referensi harus berupa URL `http(s)` remote.                                                               |
| BytePlus | Hanya satu gambar referensi.                                                                                                                                         |
| ComfyUI  | Eksekusi lokal atau cloud berbasis workflow. Mendukung text-to-video dan image-to-video melalui graph yang dikonfigurasi.                                                    |
| fal      | Menggunakan alur berbasis antrean untuk pekerjaan yang berjalan lama. Hanya satu gambar referensi. Termasuk ref model HeyGen video-agent dan Seedance 2.0 text-to-video dan image-to-video. |
| Google   | Menggunakan Gemini/Veo. Mendukung satu gambar atau satu video referensi.                                                                                                          |
| MiniMax  | Hanya satu gambar referensi.                                                                                                                                         |
| OpenAI   | Hanya override `size` yang diteruskan. Override gaya lain (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan peringatan.                             |
| Qwen     | Backend DashScope yang sama dengan Alibaba. Input referensi harus berupa URL `http(s)` remote; file lokal ditolak sejak awal.                                                 |
| Runway   | Mendukung file lokal melalui data URI. Video-to-video memerlukan `runway/gen4_aleph`. Proses hanya teks mengekspos rasio aspek `16:9` dan `9:16`.                              |
| Together | Hanya satu gambar referensi.                                                                                                                                         |
| Vydra    | Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari redirect yang menjatuhkan auth. `veo3` dibundel hanya sebagai text-to-video; `kling` memerlukan URL gambar remote.          |
| xAI      | Mendukung text-to-video, image-to-video, dan alur edit/extend video remote.                                                                                          |

## Mode kapabilitas provider

Kontrak pembuatan video bersama sekarang memungkinkan provider mendeklarasikan
kapabilitas spesifik mode, bukan hanya batas agregat datar. Implementasi provider
baru sebaiknya mengutamakan blok mode eksplisit:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Field agregat datar seperti `maxInputImages` dan `maxInputVideos` tidak
cukup untuk mengiklankan dukungan mode transformasi. Provider harus mendeklarasikan
`generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar live test,
contract test, dan alat bersama `video_generate` dapat memvalidasi dukungan mode
secara deterministis.

## Live test

Cakupan live opt-in untuk provider bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

File live ini memuat variabel env provider yang hilang dari `~/.profile`, mengutamakan
API key live/env dibanding profil auth tersimpan secara default, dan menjalankan
mode yang dideklarasikan yang dapat dijalankan dengan aman menggunakan media lokal:

- `generate` untuk setiap provider dalam sweep
- `imageToVideo` saat `capabilities.imageToVideo.enabled`
- `videoToVideo` saat `capabilities.videoToVideo.enabled` dan provider/model
  menerima input video lokal berbasis buffer dalam shared sweep

Saat ini lane live `videoToVideo` bersama mencakup:

- `runway` hanya saat Anda memilih `runway/gen4_aleph`

## Konfigurasi

Tetapkan model pembuatan video default di konfigurasi OpenClaw Anda:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Atau melalui CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Terkait

- [Ikhtisar Alat](/id/tools)
- [Tugas Latar Belakang](/id/automation/tasks) -- pelacakan tugas untuk pembuatan video asinkron
- [Alibaba Model Studio](/id/providers/alibaba)
- [BytePlus](/id/concepts/model-providers#byteplus-international)
- [ComfyUI](/id/providers/comfy)
- [fal](/id/providers/fal)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [OpenAI](/id/providers/openai)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [Together AI](/id/providers/together)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
- [Referensi Konfigurasi](/id/gateway/configuration-reference#agent-defaults)
- [Models](/id/concepts/models)
