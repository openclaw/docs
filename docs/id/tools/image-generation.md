---
read_when:
    - Membuat gambar melalui agen
    - Mengonfigurasi penyedia dan model pembuatan gambar
    - Memahami parameter tool image_generate
summary: Membuat dan mengedit gambar menggunakan penyedia yang dikonfigurasi (OpenAI, Google Gemini, fal, MiniMax)
title: Pembuatan Gambar
x-i18n:
    generated_at: "2026-04-05T14:08:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Pembuatan Gambar

Tool `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan penyedia yang telah Anda konfigurasi. Gambar yang dihasilkan dikirim secara otomatis sebagai lampiran media dalam balasan agen.

<Note>
Tool ini hanya muncul ketika setidaknya satu penyedia pembuatan gambar tersedia. Jika Anda tidak melihat `image_generate` dalam tools agen Anda, konfigurasi `agents.defaults.imageGenerationModel` atau siapkan API key penyedia.
</Note>

## Mulai cepat

1. Setel API key untuk setidaknya satu penyedia (misalnya `OPENAI_API_KEY` atau `GEMINI_API_KEY`).
2. Opsional, setel model pilihan Anda:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Minta agen: _"Buat gambar maskot lobster yang ramah."_

Agen akan memanggil `image_generate` secara otomatis. Tidak perlu allow-list tool — tool ini aktif secara default ketika penyedia tersedia.

## Penyedia yang didukung

| Penyedia | Model default                    | Dukungan edit          | API key                                               |
| -------- | -------------------------------- | ---------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Ya (hingga 5 gambar)   | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Ya                     | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`                | Ya                     | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Ya (referensi subjek)  | `MINIMAX_API_KEY` atau OAuth MiniMax (`minimax-portal`) |

Gunakan `action: "list"` untuk memeriksa penyedia dan model yang tersedia saat runtime:

```
/tool image_generate action=list
```

## Parameter tool

| Parameter     | Tipe     | Deskripsi                                                                           |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt pembuatan gambar (wajib untuk `action: "generate"`)                          |
| `action`      | string   | `"generate"` (default) atau `"list"` untuk memeriksa penyedia                       |
| `model`       | string   | Penimpaan penyedia/model, misalnya `openai/gpt-image-1`                             |
| `image`       | string   | Jalur atau URL gambar referensi tunggal untuk mode edit                             |
| `images`      | string[] | Beberapa gambar referensi untuk mode edit (hingga 5)                                |
| `size`        | string   | Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`    |
| `aspectRatio` | string   | Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Petunjuk resolusi: `1K`, `2K`, atau `4K`                                            |
| `count`       | number   | Jumlah gambar yang akan dibuat (1–4)                                                |
| `filename`    | string   | Petunjuk nama file output                                                           |

Tidak semua penyedia mendukung semua parameter. Tool ini meneruskan apa yang didukung masing-masing penyedia dan mengabaikan sisanya.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      // Bentuk string: hanya model utama
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Bentuk objek: utama + fallback berurutan
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
4. **Deteksi otomatis** — hanya menggunakan default penyedia yang didukung auth:
   - penyedia default saat ini terlebih dahulu
   - penyedia pembuatan gambar terdaftar lainnya yang tersisa dalam urutan provider-id

Jika suatu penyedia gagal (error auth, rate limit, dan sebagainya), kandidat berikutnya akan dicoba secara otomatis. Jika semuanya gagal, error akan menyertakan detail dari setiap percobaan.

Catatan:

- Deteksi otomatis bersifat sadar-auth. Default penyedia hanya masuk ke daftar kandidat
  ketika OpenClaw benar-benar dapat mengautentikasi penyedia tersebut.
- Gunakan `action: "list"` untuk memeriksa penyedia yang saat ini terdaftar, model
  defaultnya, dan petunjuk env var auth.

### Pengeditan gambar

OpenAI, Google, fal, dan MiniMax mendukung pengeditan gambar referensi. Teruskan jalur atau URL gambar referensi:

```
"Buat versi cat air dari foto ini" + image: "/path/to/photo.jpg"
```

OpenAI dan Google mendukung hingga 5 gambar referensi melalui parameter `images`. fal dan MiniMax mendukung 1.

Pembuatan gambar MiniMax tersedia melalui kedua jalur auth MiniMax bawaan:

- `minimax/image-01` untuk penyiapan API key
- `minimax-portal/image-01` untuk penyiapan OAuth

## Kemampuan penyedia

| Kemampuan            | OpenAI               | Google               | fal                 | MiniMax                    |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- |
| Membuat              | Ya (hingga 4)        | Ya (hingga 4)        | Ya (hingga 4)       | Ya (hingga 9)              |
| Edit/referensi       | Ya (hingga 5 gambar) | Ya (hingga 5 gambar) | Ya (1 gambar)       | Ya (1 gambar, ref subjek)  |
| Kontrol ukuran       | Ya                   | Ya                   | Ya                  | Tidak                      |
| Rasio aspek          | Tidak                | Ya                   | Ya (hanya pembuatan) | Ya                        |
| Resolusi (1K/2K/4K)  | Tidak                | Ya                   | Ya                  | Tidak                      |

## Terkait

- [Gambaran Umum Tools](/tools) — semua tool agen yang tersedia
- [Referensi Konfigurasi](/id/gateway/configuration-reference#agent-defaults) — konfigurasi `imageGenerationModel`
- [Model](/id/concepts/models) — konfigurasi model dan failover
