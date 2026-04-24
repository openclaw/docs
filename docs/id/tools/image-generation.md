---
read_when:
    - Menghasilkan gambar melalui agen
    - Mengonfigurasi provider dan model pembuatan gambar
    - Memahami parameter tool `image_generate`
summary: Hasilkan dan edit gambar menggunakan provider yang dikonfigurasi (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Pembuatan gambar
x-i18n:
    generated_at: "2026-04-24T09:31:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

Tool `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan provider yang Anda konfigurasi. Gambar yang dihasilkan dikirim otomatis sebagai lampiran media dalam balasan agen.

<Note>
Tool ini hanya muncul ketika setidaknya satu provider pembuatan gambar tersedia. Jika Anda tidak melihat `image_generate` di tools agen Anda, konfigurasikan `agents.defaults.imageGenerationModel`, siapkan API key provider, atau login dengan OpenAI Codex OAuth.
</Note>

## Mulai cepat

1. Atur API key untuk setidaknya satu provider (misalnya `OPENAI_API_KEY`, `GEMINI_API_KEY`, atau `OPENROUTER_API_KEY`) atau login dengan OpenAI Codex OAuth.
2. Opsional, atur model pilihan Anda:

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

Codex OAuth menggunakan ref model `openai/gpt-image-2` yang sama. Saat profil
OAuth `openai-codex` dikonfigurasi, OpenClaw merutekan permintaan gambar
melalui profil OAuth yang sama alih-alih terlebih dahulu mencoba `OPENAI_API_KEY`.
Config gambar `models.providers.openai` kustom yang eksplisit, seperti API key atau
base URL kustom/Azure, akan mengaktifkan kembali rute OpenAI Images API langsung.
Untuk endpoint LAN yang kompatibel dengan OpenAI seperti LocalAI, pertahankan
`models.providers.openai.baseUrl` kustom dan ikut sertakan secara eksplisit dengan
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; endpoint gambar privat/internal tetap diblokir secara default.

3. Minta agen: _"Generate an image of a friendly robot mascot."_

Agen memanggil `image_generate` secara otomatis. Tidak perlu allow-listing tool — tool ini aktif secara default ketika provider tersedia.

## Provider yang didukung

| Provider   | Model default                            | Dukungan edit                      | Auth                                                  |
| ---------- | ---------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | Ya (hingga 4 gambar)               | `OPENAI_API_KEY` atau OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | Ya (hingga 5 gambar input)         | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`         | Ya                                 | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                        | Ya                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                               | Ya (referensi subjek)              | `MINIMAX_API_KEY` atau MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                               | Ya (1 gambar, dikonfigurasi workflow) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| Vydra      | `grok-imagine`                           | Tidak                              | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                     | Ya (hingga 5 gambar)               | `XAI_API_KEY`                                         |

Gunakan `action: "list"` untuk memeriksa provider dan model yang tersedia saat runtime:

```
/tool image_generate action=list
```

## Parameter tool

<ParamField path="prompt" type="string" required>
Prompt pembuatan gambar. Wajib untuk `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Gunakan `"list"` untuk memeriksa provider dan model yang tersedia saat runtime.
</ParamField>

<ParamField path="model" type="string">
Override provider/model, misalnya `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Path atau URL gambar referensi tunggal untuk mode edit.
</ParamField>

<ParamField path="images" type="string[]">
Beberapa gambar referensi untuk mode edit (hingga 5).
</ParamField>

<ParamField path="size" type="string">
Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Petunjuk resolusi.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Petunjuk kualitas ketika provider mendukungnya.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Petunjuk format output ketika provider mendukungnya.
</ParamField>

<ParamField path="count" type="number">
Jumlah gambar yang akan dihasilkan (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Timeout permintaan provider opsional dalam milidetik.
</ParamField>

<ParamField path="filename" type="string">
Petunjuk nama file output.
</ParamField>

<ParamField path="openai" type="object">
Petunjuk khusus OpenAI: `background`, `moderation`, `outputCompression`, dan `user`.
</ParamField>

Tidak semua provider mendukung semua parameter. Ketika provider fallback mendukung opsi geometri yang dekat alih-alih yang diminta secara tepat, OpenClaw memetakan ulang ke ukuran, rasio aspek, atau resolusi yang paling dekat didukung sebelum pengiriman. Petunjuk output yang tidak didukung seperti `quality` atau `outputFormat` dibuang untuk provider yang tidak mendeklarasikan dukungan dan dilaporkan dalam hasil tool.

Hasil tool melaporkan pengaturan yang diterapkan. Ketika OpenClaw memetakan ulang geometri selama fallback provider, nilai `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang benar-benar dikirim, dan `details.normalization` mencatat terjemahan dari permintaan ke yang diterapkan.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Urutan pemilihan provider

Saat menghasilkan gambar, OpenClaw mencoba provider dalam urutan ini:

1. Parameter **`model`** dari pemanggilan tool (jika agen menentukannya)
2. **`imageGenerationModel.primary`** dari config
3. **`imageGenerationModel.fallbacks`** secara berurutan
4. **Deteksi otomatis** — hanya menggunakan default provider yang didukung auth:
   - provider default saat ini terlebih dahulu
   - provider pembuatan gambar terdaftar yang tersisa dalam urutan id provider

Jika sebuah provider gagal (error auth, rate limit, dll.), kandidat berikutnya dicoba secara otomatis. Jika semuanya gagal, error akan menyertakan detail dari setiap percobaan.

Catatan:

- Deteksi otomatis sadar-auth. Default provider hanya masuk ke daftar kandidat
  ketika OpenClaw benar-benar dapat mengautentikasi provider tersebut.
- Deteksi otomatis aktif secara default. Atur
  `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin pembuatan gambar hanya menggunakan entri `model`, `primary`, dan `fallbacks`
  yang eksplisit.
- Gunakan `action: "list"` untuk memeriksa provider yang saat ini terdaftar, model
  default mereka, dan petunjuk env-var auth.

### Pengeditan gambar

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI, dan xAI mendukung pengeditan gambar referensi. Berikan path atau URL gambar referensi:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google, dan xAI mendukung hingga 5 gambar referensi melalui parameter `images`. fal, MiniMax, dan ComfyUI mendukung 1.

### Model gambar OpenRouter

Pembuatan gambar OpenRouter menggunakan `OPENROUTER_API_KEY` yang sama dan dirutekan melalui API gambar chat completions milik OpenRouter. Pilih model gambar OpenRouter dengan prefiks `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw meneruskan `prompt`, `count`, gambar referensi, dan petunjuk `aspectRatio` / `resolution` yang kompatibel dengan Gemini ke OpenRouter. Shortcut model gambar OpenRouter bawaan saat ini mencakup `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview`, dan `openai/gpt-5.4-image-2`; gunakan `action: "list"` untuk melihat apa yang diekspos Plugin terkonfigurasi Anda.

### OpenAI `gpt-image-2`

Pembuatan gambar OpenAI default-nya menggunakan `openai/gpt-image-2`. Jika profil
OAuth `openai-codex` dikonfigurasi, OpenClaw menggunakan ulang profil OAuth yang sama
yang dipakai oleh model chat langganan Codex dan mengirim permintaan gambar
melalui backend Codex Responses; OpenClaw tidak diam-diam fallback ke
`OPENAI_API_KEY` untuk permintaan itu. Untuk memaksa perutean OpenAI Images API langsung,
konfigurasikan `models.providers.openai` secara eksplisit dengan API key, base URL kustom,
atau endpoint Azure. Model lama
`openai/gpt-image-1` masih bisa dipilih secara eksplisit, tetapi permintaan
pembuatan gambar dan pengeditan gambar OpenAI yang baru sebaiknya menggunakan `gpt-image-2`.

`gpt-image-2` mendukung pembuatan text-to-image dan
pengeditan gambar referensi melalui tool `image_generate` yang sama. OpenClaw meneruskan `prompt`,
`count`, `size`, `quality`, `outputFormat`, dan gambar referensi ke OpenAI.
OpenAI tidak menerima `aspectRatio` atau `resolution` secara langsung; bila memungkinkan
OpenClaw memetakan keduanya ke `size` yang didukung, jika tidak maka tool melaporkannya sebagai
override yang diabaikan.

Opsi khusus OpenAI berada di bawah objek `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` menerima `transparent`, `opaque`, atau `auto`; output
transparan memerlukan `outputFormat` `png` atau `webp`. `openai.outputCompression`
berlaku untuk output JPEG/WebP.

Hasilkan satu gambar landscape 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Hasilkan dua gambar persegi:

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

Untuk merutekan pembuatan gambar OpenAI melalui deployment Azure OpenAI
alih-alih `api.openai.com`, lihat [Azure OpenAI endpoints](/id/providers/openai#azure-openai-endpoints)
di dokumentasi provider OpenAI.

Pembuatan gambar MiniMax tersedia melalui kedua jalur auth MiniMax bawaan:

- `minimax/image-01` untuk penyiapan API key
- `minimax-portal/image-01` untuk penyiapan OAuth

## Kapabilitas provider

| Kapabilitas           | OpenAI               | Google               | fal                 | MiniMax                     | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | --------------------------- | ---------------------------------- | ------- | -------------------- |
| Generate              | Ya (hingga 4)        | Ya (hingga 4)        | Ya (hingga 4)       | Ya (hingga 9)               | Ya (output ditentukan workflow)    | Ya (1)  | Ya (hingga 4)        |
| Edit/referensi        | Ya (hingga 5 gambar) | Ya (hingga 5 gambar) | Ya (1 gambar)       | Ya (1 gambar, referensi subjek) | Ya (1 gambar, dikonfigurasi workflow) | Tidak   | Ya (hingga 5 gambar) |
| Kontrol ukuran        | Ya (hingga 4K)       | Ya                   | Ya                  | Tidak                       | Tidak                              | Tidak   | Tidak                |
| Rasio aspek           | Tidak                | Ya                   | Ya (khusus generate) | Ya                         | Tidak                              | Tidak   | Ya                   |
| Resolusi (1K/2K/4K)   | Tidak                | Ya                   | Ya                  | Tidak                       | Tidak                              | Tidak   | Ya (1K/2K)           |

### xAI `grok-imagine-image`

Provider xAI bawaan menggunakan `/v1/images/generations` untuk permintaan yang hanya berisi prompt
dan `/v1/images/edits` saat `image` atau `images` ada.

- Model: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Jumlah: hingga 4
- Referensi: satu `image` atau hingga lima `images`
- Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resolusi: `1K`, `2K`
- Output: dikembalikan sebagai lampiran gambar yang dikelola OpenClaw

OpenClaw sengaja tidak mengekspos `quality`, `mask`, `user` native milik xAI, atau
rasio aspek tambahan yang hanya native sampai kontrol tersebut ada dalam
kontrak `image_generate` lintas-provider bersama.

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agen yang tersedia
- [fal](/id/providers/fal) — penyiapan provider gambar dan video fal
- [ComfyUI](/id/providers/comfy) — penyiapan workflow ComfyUI lokal dan Comfy Cloud
- [Google (Gemini)](/id/providers/google) — penyiapan provider gambar Gemini
- [MiniMax](/id/providers/minimax) — penyiapan provider gambar MiniMax
- [OpenAI](/id/providers/openai) — penyiapan provider OpenAI Images
- [Vydra](/id/providers/vydra) — penyiapan gambar, video, dan speech Vydra
- [xAI](/id/providers/xai) — penyiapan gambar, video, pencarian, eksekusi kode, dan TTS Grok
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) — config `imageGenerationModel`
- [Models](/id/concepts/models) — konfigurasi model dan failover
