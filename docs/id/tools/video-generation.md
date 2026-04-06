---
read_when:
    - Menghasilkan video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter tool video_generate
summary: Hasilkan video dari teks, gambar, atau video yang sudah ada menggunakan 12 backend penyedia
title: Pembuatan Video
x-i18n:
    generated_at: "2026-04-06T09:13:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90d8a392b35adbd899232b02c55c10895b9d7ffc9858d6ca448f2e4e4a57f12f
    source_path: tools/video-generation.md
    workflow: 15
---

# Pembuatan Video

Agen OpenClaw dapat menghasilkan video dari prompt teks, gambar referensi, atau video yang sudah ada. Dua belas backend penyedia didukung, masing-masing dengan opsi model, mode input, dan kumpulan fitur yang berbeda. Agen memilih penyedia yang tepat secara otomatis berdasarkan konfigurasi Anda dan API key yang tersedia.

<Note>
Tool `video_generate` hanya muncul ketika setidaknya satu penyedia pembuatan video tersedia. Jika Anda tidak melihatnya di tool agen Anda, tetapkan API key penyedia atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

## Mulai cepat

1. Tetapkan API key untuk penyedia yang didukung:

```bash
export GEMINI_API_KEY="your-key"
```

2. Secara opsional sematkan model default:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Minta agen:

> Hasilkan video sinematik berdurasi 5 detik tentang seekor lobster ramah yang berselancar saat matahari terbenam.

Agen memanggil `video_generate` secara otomatis. Tidak perlu allowlist tool.

## Apa yang terjadi saat Anda menghasilkan video

Pembuatan video bersifat asinkron. Saat agen memanggil `video_generate` dalam sebuah sesi:

1. OpenClaw mengirim permintaan ke penyedia dan segera mengembalikan ID tugas.
2. Penyedia memproses pekerjaan di latar belakang (biasanya 30 detik hingga 5 menit tergantung pada penyedia dan resolusi).
3. Saat video siap, OpenClaw membangunkan sesi yang sama dengan peristiwa penyelesaian internal.
4. Agen memposting video yang sudah selesai kembali ke percakapan asli.

Saat sebuah pekerjaan sedang berjalan, panggilan `video_generate` duplikat dalam sesi yang sama mengembalikan status tugas saat ini alih-alih memulai pembuatan lain. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa progres dari CLI.

Di luar eksekusi agen berbasis sesi (misalnya, pemanggilan tool langsung), tool ini kembali ke pembuatan inline dan mengembalikan path media akhir dalam giliran yang sama.

## Penyedia yang didukung

| Penyedia | Model default                   | Teks | Referensi gambar  | Referensi video | API key                                  |
| -------- | ------------------------------- | ---- | ----------------- | --------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Ya   | Ya (URL jarak jauh) | Ya (URL jarak jauh) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Ya   | 1 gambar          | Tidak           | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Ya   | 1 gambar          | Tidak           | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Ya   | 1 gambar          | Tidak           | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Ya   | 1 gambar          | 1 video         | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Ya   | 1 gambar          | Tidak           | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Ya   | 1 gambar          | 1 video         | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Ya   | Ya (URL jarak jauh) | Ya (URL jarak jauh) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Ya   | 1 gambar          | 1 video         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Ya   | 1 gambar          | Tidak           | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Ya   | 1 gambar (`kling`) | Tidak         | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Ya   | 1 gambar          | 1 video         | `XAI_API_KEY`                            |

Beberapa penyedia menerima variabel env API key tambahan atau alternatif. Lihat [halaman penyedia](#related) masing-masing untuk detailnya.

Jalankan `video_generate action=list` untuk memeriksa penyedia dan model yang tersedia saat runtime.

## Parameter tool

### Wajib

| Parameter | Tipe   | Deskripsi                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------- |
| `prompt`  | string | Deskripsi teks video yang akan dihasilkan (wajib untuk `action: "generate"`) |

### Input konten

| Parameter | Tipe     | Deskripsi                             |
| --------- | -------- | ------------------------------------- |
| `image`   | string   | Satu gambar referensi (path atau URL) |
| `images`  | string[] | Beberapa gambar referensi (hingga 5)  |
| `video`   | string   | Satu video referensi (path atau URL)  |
| `videos`  | string[] | Beberapa video referensi (hingga 4)   |

### Kontrol gaya

| Parameter         | Tipe    | Deskripsi                                                               |
| ----------------- | ------- | ----------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`  |
| `resolution`      | string  | `480P`, `720P`, atau `1080P`                                            |
| `durationSeconds` | number  | Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia) |
| `size`            | string  | Petunjuk ukuran saat penyedia mendukungnya                              |
| `audio`           | boolean | Aktifkan audio yang dihasilkan jika didukung                            |
| `watermark`       | boolean | Alihkan watermark penyedia jika didukung                                |

### Lanjutan

| Parameter  | Tipe   | Deskripsi                                      |
| ---------- | ------ | ---------------------------------------------- |
| `action`   | string | `"generate"` (default), `"status"`, atau `"list"` |
| `model`    | string | Override penyedia/model (misalnya `runway/gen4.5`) |
| `filename` | string | Petunjuk nama file output                      |

Tidak semua penyedia mendukung semua parameter. Override yang tidak didukung diabaikan berdasarkan upaya terbaik dan dilaporkan sebagai peringatan dalam hasil tool. Batas kemampuan keras (seperti terlalu banyak input referensi) gagal sebelum pengiriman.

## Aksi

- **generate** (default) -- buat video dari prompt yang diberikan dan input referensi opsional.
- **status** -- periksa status tugas video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.
- **list** -- tampilkan penyedia, model, dan kapabilitasnya yang tersedia.

## Pemilihan model

Saat menghasilkan video, OpenClaw menyelesaikan model dalam urutan ini:

1. **`model` parameter tool** -- jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** -- dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** -- dicoba secara berurutan.
4. **Deteksi otomatis** -- menggunakan penyedia yang memiliki autentikasi valid, dimulai dari penyedia default saat ini, lalu penyedia yang tersisa dalam urutan alfabet.

Jika sebuah penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua kandidat gagal, error menyertakan detail dari setiap percobaan.

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

## Catatan penyedia

| Penyedia | Catatan                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Menggunakan endpoint asinkron DashScope/Model Studio. Gambar dan video referensi harus berupa URL `http(s)` jarak jauh.                                  |
| BytePlus | Hanya satu gambar referensi.                                                                                                                               |
| ComfyUI  | Eksekusi lokal atau cloud berbasis workflow. Mendukung text-to-video dan image-to-video melalui graph yang dikonfigurasi.                                 |
| fal      | Menggunakan alur berbasis antrean untuk pekerjaan yang berjalan lama. Hanya satu gambar referensi.                                                        |
| Google   | Menggunakan Gemini/Veo. Mendukung satu referensi gambar atau satu referensi video.                                                                         |
| MiniMax  | Hanya satu gambar referensi.                                                                                                                               |
| OpenAI   | Hanya override `size` yang diteruskan. Override gaya lainnya (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan peringatan.            |
| Qwen     | Backend DashScope yang sama dengan Alibaba. Input referensi harus berupa URL `http(s)` jarak jauh; file lokal ditolak sejak awal.                         |
| Runway   | Mendukung file lokal melalui URI data. Video-to-video memerlukan `runway/gen4_aleph`. Eksekusi khusus teks mengekspos rasio aspek `16:9` dan `9:16`.     |
| Together | Hanya satu gambar referensi.                                                                                                                               |
| Vydra    | Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari pengalihan yang membuang autentikasi. `veo3` dibundel hanya sebagai text-to-video; `kling` memerlukan URL gambar jarak jauh. |
| xAI      | Mendukung alur text-to-video, image-to-video, dan edit/perluas video jarak jauh.                                                                          |

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

- [Ikhtisar Tools](/id/tools)
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
