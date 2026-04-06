---
read_when:
    - Membuat gambar melalui agen
    - Mengonfigurasi penyedia dan model pembuatan gambar
    - Memahami parameter tool image_generate
summary: Buat dan edit gambar menggunakan penyedia yang dikonfigurasi (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Pembuatan Gambar
x-i18n:
    generated_at: "2026-04-06T09:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 903cc522c283a8da2cbd449ae3e25f349a74d00ecfdaf0f323fd8aa3f2107aea
    source_path: tools/image-generation.md
    workflow: 15
---

# Pembuatan Gambar

Tool `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan penyedia yang telah Anda konfigurasi. Gambar yang dibuat akan dikirim secara otomatis sebagai lampiran media dalam balasan agen.

<Note>
Tool ini hanya muncul ketika setidaknya satu penyedia pembuatan gambar tersedia. Jika Anda tidak melihat `image_generate` dalam tools agen Anda, konfigurasikan `agents.defaults.imageGenerationModel` atau siapkan kunci API penyedia.
</Note>

## Mulai cepat

1. Tetapkan kunci API untuk setidaknya satu penyedia (misalnya `OPENAI_API_KEY` atau `GEMINI_API_KEY`).
2. Secara opsional, tetapkan model pilihan Anda:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Minta agen: _"Buat gambar maskot lobster yang ramah."_

Agen memanggil `image_generate` secara otomatis. Tidak perlu allow-list tool — tool ini diaktifkan secara default saat penyedia tersedia.

## Penyedia yang didukung

| Penyedia | Model default                    | Dukungan edit                       | Kunci API                                               |
| -------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Ya (hingga 5 gambar)                | `OPENAI_API_KEY`                                        |
| Google   | `gemini-3.1-flash-image-preview` | Ya                                  | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Ya                                  | `FAL_KEY`                                               |
| MiniMax  | `image-01`                       | Ya (referensi subjek)               | `MINIMAX_API_KEY` atau OAuth MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Ya (1 gambar, dikonfigurasi alur kerja) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud  |
| Vydra    | `grok-imagine`                   | Tidak                               | `VYDRA_API_KEY`                                         |

Gunakan `action: "list"` untuk memeriksa penyedia dan model yang tersedia saat runtime:

```
/tool image_generate action=list
```

## Parameter tool

| Parameter     | Tipe     | Deskripsi                                                                            |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt pembuatan gambar (wajib untuk `action: "generate"`)                           |
| `action`      | string   | `"generate"` (default) atau `"list"` untuk memeriksa penyedia                        |
| `model`       | string   | Override penyedia/model, misalnya `openai/gpt-image-1`                               |
| `image`       | string   | Path atau URL satu gambar referensi untuk mode edit                                  |
| `images`      | string[] | Beberapa gambar referensi untuk mode edit (hingga 5)                                 |
| `size`        | string   | Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`     |
| `aspectRatio` | string   | Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Petunjuk resolusi: `1K`, `2K`, atau `4K`                                             |
| `count`       | number   | Jumlah gambar yang akan dibuat (1–4)                                                 |
| `filename`    | string   | Petunjuk nama file keluaran                                                          |

Tidak semua penyedia mendukung semua parameter. Tool ini meneruskan parameter yang didukung setiap penyedia, mengabaikan sisanya, dan melaporkan override yang diabaikan dalam hasil tool.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Urutan pemilihan penyedia

Saat membuat gambar, OpenClaw mencoba penyedia dalam urutan ini:

1. Parameter **`model`** dari pemanggilan tool (jika agen menentukannya)
2. **`imageGenerationModel.primary`** dari konfigurasi
3. **`imageGenerationModel.fallbacks`** secara berurutan
4. **Deteksi otomatis** — hanya menggunakan default penyedia yang didukung autentikasi:
   - penyedia default saat ini terlebih dahulu
   - penyedia pembuatan gambar terdaftar lainnya yang tersisa dalam urutan provider-id

Jika suatu penyedia gagal (kesalahan autentikasi, batas laju, dll.), kandidat berikutnya akan dicoba secara otomatis. Jika semuanya gagal, kesalahan akan menyertakan detail dari setiap percobaan.

Catatan:

- Deteksi otomatis bersifat sadar autentikasi. Default penyedia hanya masuk ke daftar kandidat
  ketika OpenClaw benar-benar dapat mengautentikasi penyedia tersebut.
- Gunakan `action: "list"` untuk memeriksa penyedia yang saat ini terdaftar, model
  default mereka, dan petunjuk env var autentikasi.

### Pengeditan gambar

OpenAI, Google, fal, MiniMax, dan ComfyUI mendukung pengeditan gambar referensi. Berikan path atau URL gambar referensi:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI dan Google mendukung hingga 5 gambar referensi melalui parameter `images`. fal, MiniMax, dan ComfyUI mendukung 1.

Pembuatan gambar MiniMax tersedia melalui kedua jalur autentikasi MiniMax bawaan:

- `minimax/image-01` untuk penyiapan kunci API
- `minimax-portal/image-01` untuk penyiapan OAuth

## Kemampuan penyedia

| Kemampuan            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Buat                 | Ya (hingga 4)        | Ya (hingga 4)        | Ya (hingga 4)       | Ya (hingga 9)              | Ya (keluaran ditentukan alur kerja) | Ya (1) |
| Edit/referensi       | Ya (hingga 5 gambar) | Ya (hingga 5 gambar) | Ya (1 gambar)       | Ya (1 gambar, referensi subjek) | Ya (1 gambar, dikonfigurasi alur kerja) | Tidak      |
| Kontrol ukuran       | Ya                   | Ya                   | Ya                  | Tidak                      | Tidak                              | Tidak   |
| Rasio aspek          | Tidak                | Ya                   | Ya (hanya generate) | Ya                         | Tidak                              | Tidak   |
| Resolusi (1K/2K/4K)  | Tidak                | Ya                   | Ya                  | Tidak                      | Tidak                              | Tidak   |

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agen yang tersedia
- [fal](/id/providers/fal) — penyiapan penyedia gambar dan video fal
- [ComfyUI](/id/providers/comfy) — penyiapan alur kerja ComfyUI lokal dan Comfy Cloud
- [Google (Gemini)](/id/providers/google) — penyiapan penyedia gambar Gemini
- [MiniMax](/id/providers/minimax) — penyiapan penyedia gambar MiniMax
- [OpenAI](/id/providers/openai) — penyiapan penyedia OpenAI Images
- [Vydra](/id/providers/vydra) — penyiapan gambar, video, dan ucapan Vydra
- [Referensi Konfigurasi](/id/gateway/configuration-reference#agent-defaults) — konfigurasi `imageGenerationModel`
- [Models](/id/concepts/models) — konfigurasi model dan failover
