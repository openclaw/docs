---
read_when:
    - Membuat gambar melalui agen
    - Mengonfigurasi penyedia dan model pembuatan gambar
    - Memahami parameter alat `image_generate`
summary: Buat dan edit gambar menggunakan penyedia yang dikonfigurasi (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Pembuatan Gambar
x-i18n:
    generated_at: "2026-04-23T13:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# Pembuatan Gambar

Alat `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan penyedia yang Anda konfigurasi. Gambar yang dihasilkan dikirim otomatis sebagai lampiran media dalam balasan agen.

<Note>
Alat ini hanya muncul ketika setidaknya satu penyedia pembuatan gambar tersedia. Jika Anda tidak melihat `image_generate` di alat agen Anda, konfigurasikan `agents.defaults.imageGenerationModel` atau siapkan kunci API penyedia.
</Note>

## Mulai cepat

1. Tetapkan kunci API untuk setidaknya satu penyedia (misalnya `OPENAI_API_KEY` atau `GEMINI_API_KEY`).
2. Secara opsional tetapkan model pilihan Anda:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. Minta agen: _"Buat gambar maskot lobster yang ramah."_

Agen memanggil `image_generate` secara otomatis. Tidak perlu daftar izin alat — ini diaktifkan secara default ketika penyedia tersedia.

## Penyedia yang didukung

| Penyedia | Model default                    | Dukungan edit                      | Kunci API                                              |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Ya (hingga 5 gambar)               | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Ya                                 | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                 |
| fal      | `fal-ai/flux/dev`                | Ya                                 | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Ya (referensi subjek)              | `MINIMAX_API_KEY` atau OAuth MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Ya (1 gambar, dikonfigurasi workflow) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| Vydra    | `grok-imagine`                   | Tidak                              | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`             | Ya (hingga 5 gambar)               | `XAI_API_KEY`                                          |

Gunakan `action: "list"` untuk memeriksa penyedia dan model yang tersedia saat runtime:

```
/tool image_generate action=list
```

## Parameter alat

| Parameter     | Tipe     | Deskripsi                                                                            |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt pembuatan gambar (wajib untuk `action: "generate"`)                           |
| `action`      | string   | `"generate"` (default) atau `"list"` untuk memeriksa penyedia                        |
| `model`       | string   | Override penyedia/model, misalnya `openai/gpt-image-2`                               |
| `image`       | string   | Jalur atau URL gambar referensi tunggal untuk mode edit                              |
| `images`      | string[] | Beberapa gambar referensi untuk mode edit (hingga 5)                                 |
| `size`        | string   | Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`     |
| `aspectRatio` | string   | Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Petunjuk resolusi: `1K`, `2K`, atau `4K`                                             |
| `count`       | number   | Jumlah gambar yang akan dibuat (1–4)                                                 |
| `filename`    | string   | Petunjuk nama file output                                                            |

Tidak semua penyedia mendukung semua parameter. Ketika penyedia fallback mendukung opsi geometri yang mirip alih-alih yang diminta secara tepat, OpenClaw memetakan ulang ke ukuran, rasio aspek, atau resolusi terdekat yang didukung sebelum pengiriman. Override yang benar-benar tidak didukung tetap dilaporkan dalam hasil alat.

Hasil alat melaporkan pengaturan yang diterapkan. Ketika OpenClaw memetakan ulang geometri selama fallback penyedia, nilai `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang benar-benar dikirim, dan `details.normalization` menangkap translasi dari yang diminta ke yang diterapkan.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Urutan pemilihan penyedia

Saat membuat gambar, OpenClaw mencoba penyedia dalam urutan ini:

1. Parameter **`model`** dari pemanggilan alat (jika agen menentukannya)
2. **`imageGenerationModel.primary`** dari config
3. **`imageGenerationModel.fallbacks`** secara berurutan
4. **Deteksi otomatis** — hanya menggunakan default penyedia yang didukung auth:
   - default penyedia saat ini terlebih dahulu
   - penyedia pembuatan gambar terdaftar lainnya yang tersisa dalam urutan provider-id

Jika penyedia gagal (kesalahan auth, batas laju, dll.), kandidat berikutnya dicoba secara otomatis. Jika semuanya gagal, kesalahan akan mencakup detail dari setiap percobaan.

Catatan:

- Deteksi otomatis sadar-auth. Default penyedia hanya masuk ke daftar kandidat
  ketika OpenClaw benar-benar dapat mengautentikasi penyedia tersebut.
- Deteksi otomatis diaktifkan secara default. Tetapkan
  `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin pembuatan gambar
  hanya menggunakan entri `model`, `primary`, dan `fallbacks`
  yang eksplisit.
- Gunakan `action: "list"` untuk memeriksa penyedia yang saat ini terdaftar, model
  default mereka, dan petunjuk env-var auth.

### Pengeditan gambar

OpenAI, Google, fal, MiniMax, ComfyUI, dan xAI mendukung pengeditan gambar referensi. Berikan jalur atau URL gambar referensi:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google, dan xAI mendukung hingga 5 gambar referensi melalui parameter `images`. fal, MiniMax, dan ComfyUI mendukung 1.

### OpenAI `gpt-image-2`

Pembuatan gambar OpenAI secara default menggunakan `openai/gpt-image-2`. Model
`openai/gpt-image-1` yang lebih lama masih dapat dipilih secara eksplisit, tetapi permintaan OpenAI baru
untuk pembuatan gambar dan pengeditan gambar sebaiknya menggunakan `gpt-image-2`.

`gpt-image-2` mendukung pembuatan teks-ke-gambar dan pengeditan
gambar referensi melalui alat `image_generate` yang sama. OpenClaw meneruskan `prompt`,
`count`, `size`, dan gambar referensi ke OpenAI. OpenAI tidak menerima
`aspectRatio` atau `resolution` secara langsung; jika memungkinkan OpenClaw memetakan itu ke
`size` yang didukung, jika tidak alat akan melaporkannya sebagai override yang diabaikan.

Buat satu gambar lanskap 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Buat dua gambar persegi:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Edit satu gambar referensi lokal:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Edit dengan beberapa referensi:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Untuk mengarahkan pembuatan gambar OpenAI melalui deployment Azure OpenAI
alih-alih `api.openai.com`, lihat [endpoint Azure OpenAI](/id/providers/openai#azure-openai-endpoints)
di dokumentasi penyedia OpenAI.

Pembuatan gambar MiniMax tersedia melalui kedua jalur auth MiniMax bawaan:

- `minimax/image-01` untuk penyiapan kunci API
- `minimax-portal/image-01` untuk penyiapan OAuth

## Kemampuan penyedia

| Kemampuan             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Buat                  | Ya (hingga 4)        | Ya (hingga 4)        | Ya (hingga 4)       | Ya (hingga 9)              | Ya (output ditentukan workflow)    | Ya (1)  | Ya (hingga 4)        |
| Edit/referensi        | Ya (hingga 5 gambar) | Ya (hingga 5 gambar) | Ya (1 gambar)       | Ya (1 gambar, referensi subjek) | Ya (1 gambar, dikonfigurasi workflow) | Tidak   | Ya (hingga 5 gambar) |
| Kontrol ukuran        | Ya (hingga 4K)       | Ya                   | Ya                  | Tidak                      | Tidak                              | Tidak   | Tidak                |
| Rasio aspek           | Tidak                | Ya                   | Ya (hanya generate) | Ya                         | Tidak                              | Tidak   | Ya                   |
| Resolusi (1K/2K/4K)   | Tidak                | Ya                   | Ya                  | Tidak                      | Tidak                              | Tidak   | Ya (1K/2K)           |

### xAI `grok-imagine-image`

Penyedia xAI bawaan menggunakan `/v1/images/generations` untuk permintaan
khusus prompt dan `/v1/images/edits` ketika `image` atau `images` ada.

- Model: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Jumlah: hingga 4
- Referensi: satu `image` atau hingga lima `images`
- Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resolusi: `1K`, `2K`
- Output: dikembalikan sebagai lampiran gambar yang dikelola OpenClaw

OpenClaw secara sengaja tidak mengekspos `quality`, `mask`, `user`, atau
rasio aspek tambahan khusus-native milik xAI sampai kontrol tersebut tersedia dalam kontrak
bersama lintas-penyedia `image_generate`.

## Terkait

- [Ikhtisar Alat](/id/tools) — semua alat agen yang tersedia
- [fal](/id/providers/fal) — penyiapan penyedia gambar dan video fal
- [ComfyUI](/id/providers/comfy) — penyiapan workflow ComfyUI lokal dan Comfy Cloud
- [Google (Gemini)](/id/providers/google) — penyiapan penyedia gambar Gemini
- [MiniMax](/id/providers/minimax) — penyiapan penyedia gambar MiniMax
- [OpenAI](/id/providers/openai) — penyiapan penyedia OpenAI Images
- [Vydra](/id/providers/vydra) — penyiapan gambar, video, dan ucapan Vydra
- [xAI](/id/providers/xai) — penyiapan Grok image, video, search, code execution, dan TTS
- [Referensi Konfigurasi](/id/gateway/configuration-reference#agent-defaults) — config `imageGenerationModel`
- [Models](/id/concepts/models) — konfigurasi model dan failover
