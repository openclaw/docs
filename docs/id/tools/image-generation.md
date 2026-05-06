---
read_when:
    - Membuat atau mengedit gambar melalui agen
    - Mengonfigurasi penyedia dan model pembuatan gambar
    - Memahami parameter alat image_generate
sidebarTitle: Image generation
summary: Buat dan sunting gambar melalui image_generate di OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Pembuatan gambar
x-i18n:
    generated_at: "2026-05-06T09:30:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

Alat `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan penyedia yang
Anda konfigurasi. Gambar yang dibuat dikirimkan secara otomatis sebagai lampiran media
dalam balasan agen.

<Note>
Alat ini hanya muncul ketika setidaknya satu penyedia pembuatan gambar
tersedia. Jika Anda tidak melihat `image_generate` di alat agen Anda,
konfigurasikan `agents.defaults.imageGenerationModel`, siapkan kunci API penyedia,
atau masuk dengan OpenAI Codex OAuth.
</Note>

## Mulai cepat

<Steps>
  <Step title="Configure auth">
    Tetapkan kunci API untuk setidaknya satu penyedia (misalnya `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) atau masuk dengan OpenAI Codex OAuth.
  </Step>
  <Step title="Pick a default model (optional)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth menggunakan referensi model `openai/gpt-image-2` yang sama. Ketika profil OAuth
    `openai-codex` dikonfigurasi, OpenClaw merutekan permintaan gambar
    melalui profil OAuth tersebut alih-alih mencoba
    `OPENAI_API_KEY` terlebih dahulu. Konfigurasi eksplisit `models.providers.openai` (kunci API,
    URL dasar kustom/Azure) memilih kembali rute OpenAI Images API
    langsung.

  </Step>
  <Step title="Ask the agent">
    _"Buat gambar maskot robot yang ramah."_

    Agen memanggil `image_generate` secara otomatis. Tidak perlu daftar izin alat -
    alat ini diaktifkan secara default ketika penyedia tersedia.

  </Step>
</Steps>

<Warning>
Untuk titik akhir LAN yang kompatibel dengan OpenAI seperti LocalAI, pertahankan
`models.providers.openai.baseUrl` kustom dan ikut serta secara eksplisit dengan
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Titik akhir gambar privat dan
internal tetap diblokir secara default.
</Warning>

## Rute umum

| Tujuan                                               | Referensi model                                   | Autentikasi                            |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Pembuatan gambar OpenAI dengan penagihan API         | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Pembuatan gambar OpenAI dengan autentikasi langganan Codex | `openai/gpt-image-2`                         | OpenAI Codex OAuth                     |
| PNG/WebP latar belakang transparan OpenAI            | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` atau OpenAI Codex OAuth |
| Pembuatan gambar DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Pembuatan gambar OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Pembuatan gambar LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Pembuatan gambar Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` atau `GOOGLE_API_KEY` |

Alat `image_generate` yang sama menangani teks-ke-gambar dan pengeditan
gambar referensi. Gunakan `image` untuk satu referensi atau `images` untuk beberapa referensi.
Petunjuk output yang didukung penyedia seperti `quality`, `outputFormat`, dan
`background` diteruskan ketika tersedia dan dilaporkan sebagai diabaikan ketika
penyedia tidak mendukungnya. Dukungan latar belakang transparan bawaan bersifat
khusus OpenAI; penyedia lain mungkin tetap mempertahankan alpha PNG jika
backend mereka menghasilkannya.

## Penyedia yang didukung

| Penyedia   | Model default                           | Dukungan edit                     | Autentikasi                                           |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Ya (1 gambar, dikonfigurasi alur kerja) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Ya (1 gambar)                     | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Ya                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Ya                                | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                           | Ya (hingga 5 gambar input)        | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Ya (referensi subjek)             | `MINIMAX_API_KEY` atau MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Ya (hingga 4 gambar)              | `OPENAI_API_KEY` atau OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ya (hingga 5 gambar input)        | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Tidak                             | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Ya (hingga 5 gambar)              | `XAI_API_KEY`                                         |

Gunakan `action: "list"` untuk memeriksa penyedia dan model yang tersedia saat runtime:

```text
/tool image_generate action=list
```

## Kapabilitas penyedia

| Kapabilitas          | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Buat (jumlah maks)    | Ditentukan alur kerja | 4      | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Edit / referensi      | 1 gambar (alur kerja) | 1 gambar | 1 gambar        | Hingga 5 gambar | 1 gambar (ref subjek) | Hingga 5 gambar | -    | Hingga 5 gambar |
| Kontrol ukuran        | -                  | ✓         | ✓                 | ✓              | -                     | Hingga 4K      | -     | -              |
| Rasio aspek           | -                  | -         | ✓ (hanya buat)    | ✓              | ✓                     | -              | -     | ✓              |
| Resolusi (1K/2K/4K)   | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## Parameter alat

<ParamField path="prompt" type="string" required>
  Prompt pembuatan gambar. Wajib untuk `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Gunakan `"list"` untuk memeriksa penyedia dan model yang tersedia saat runtime.
</ParamField>
<ParamField path="model" type="string">
  Pengganti penyedia/model (mis. `openai/gpt-image-2`). Gunakan
  `openai/gpt-image-1.5` untuk latar belakang transparan OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Jalur atau URL gambar referensi tunggal untuk mode edit.
</ParamField>
<ParamField path="images" type="string[]">
  Beberapa gambar referensi untuk mode edit (hingga 5 pada penyedia yang mendukung).
</ParamField>
<ParamField path="size" type="string">
  Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Petunjuk resolusi.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Petunjuk kualitas ketika penyedia mendukungnya.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Petunjuk format output ketika penyedia mendukungnya.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Petunjuk latar belakang ketika penyedia mendukungnya. Gunakan `transparent` dengan
  `outputFormat: "png"` atau `"webp"` untuk penyedia yang mendukung transparansi.
</ParamField>
<ParamField path="count" type="number">Jumlah gambar yang akan dibuat (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">Timeout permintaan penyedia opsional dalam milidetik.</ParamField>
<ParamField path="filename" type="string">Petunjuk nama file output.</ParamField>
<ParamField path="openai" type="object">
  Petunjuk khusus OpenAI: `background`, `moderation`, `outputCompression`, dan `user`.
</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. Ketika penyedia fallback mendukung
opsi geometri yang mirip alih-alih yang persis diminta, OpenClaw memetakan ulang ke
ukuran, rasio aspek, atau resolusi terdekat yang didukung sebelum pengiriman.
Petunjuk output yang tidak didukung dihapus untuk penyedia yang tidak menyatakan
dukungan dan dilaporkan dalam hasil alat. Hasil alat melaporkan pengaturan yang
diterapkan; `details.normalization` menangkap setiap terjemahan dari yang diminta ke yang diterapkan.
</Note>

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

### Urutan pemilihan penyedia

OpenClaw mencoba penyedia dalam urutan ini:

1. Parameter **`model`** dari panggilan alat (jika agen menentukannya).
2. **`imageGenerationModel.primary`** dari konfigurasi.
3. **`imageGenerationModel.fallbacks`** sesuai urutan.
4. **Deteksi otomatis** - hanya default penyedia yang didukung autentikasi:
   - penyedia default saat ini terlebih dahulu;
   - penyedia pembuatan gambar terdaftar lainnya dalam urutan ID penyedia.

Jika penyedia gagal (kesalahan autentikasi, batas laju, dll.), kandidat
terkonfigurasi berikutnya dicoba secara otomatis. Jika semuanya gagal, kesalahan menyertakan detail
dari setiap percobaan.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Pengganti `model` per panggilan hanya mencoba penyedia/model tersebut dan
    tidak melanjutkan ke primary/fallback terkonfigurasi atau penyedia yang terdeteksi otomatis.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Default penyedia hanya masuk ke daftar kandidat ketika OpenClaw dapat
    benar-benar mengautentikasi penyedia tersebut. Tetapkan
    `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya menggunakan
    entri eksplisit `model`, `primary`, dan `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Tetapkan `agents.defaults.imageGenerationModel.timeoutMs` untuk backend gambar yang lambat.
    Parameter alat `timeoutMs` per panggilan menggantikan default yang dikonfigurasi.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Gunakan `action: "list"` untuk memeriksa penyedia yang saat ini terdaftar,
    model default mereka, dan petunjuk env-var autentikasi.
  </Accordion>
</AccordionGroup>

### Pengeditan gambar

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI, dan xAI mendukung pengeditan
gambar referensi. Berikan jalur atau URL gambar referensi:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google, dan xAI mendukung hingga 5 gambar referensi melalui parameter
`images`. fal, MiniMax, dan ComfyUI mendukung 1.

## Uraian mendalam penyedia

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (dan gpt-image-1.5)">
    Pembuatan gambar OpenAI menggunakan default `openai/gpt-image-2`. Jika profil OAuth
    `openai-codex` dikonfigurasi, OpenClaw menggunakan kembali profil OAuth yang sama
    yang digunakan oleh model chat langganan Codex dan mengirim permintaan gambar
    melalui backend Codex Responses. URL dasar Codex lama seperti
    `https://chatgpt.com/backend-api` dikanonisasi menjadi
    `https://chatgpt.com/backend-api/codex` untuk permintaan gambar. OpenClaw
    **tidak** diam-diam beralih kembali ke `OPENAI_API_KEY` untuk permintaan tersebut -
    untuk memaksa perutean langsung OpenAI Images API, konfigurasikan
    `models.providers.openai` secara eksplisit dengan kunci API, URL dasar kustom,
    atau endpoint Azure.

    Model `openai/gpt-image-1.5`, `openai/gpt-image-1`, dan
    `openai/gpt-image-1-mini` masih dapat dipilih secara eksplisit. Gunakan
    `gpt-image-1.5` untuk output PNG/WebP berlatar transparan; API
    `gpt-image-2` saat ini menolak `background: "transparent"`.

    `gpt-image-2` mendukung pembuatan teks-ke-gambar dan pengeditan
    gambar referensi melalui tool `image_generate` yang sama. OpenClaw meneruskan
    `prompt`, `count`, `size`, `quality`, `outputFormat`, dan gambar referensi
    ke OpenAI. OpenAI **tidak** menerima `aspectRatio` atau `resolution`
    secara langsung; jika memungkinkan OpenClaw memetakannya ke `size` yang didukung,
    jika tidak tool melaporkannya sebagai override yang diabaikan.

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

    `openai.background` menerima `transparent`, `opaque`, atau `auto`;
    output transparan memerlukan `outputFormat` `png` atau `webp` dan model gambar
    OpenAI yang mendukung transparansi. OpenClaw merutekan permintaan berlatar transparan
    default `gpt-image-2` ke `gpt-image-1.5`.
    `openai.outputCompression` berlaku untuk output JPEG/WebP.

    Petunjuk `background` tingkat atas bersifat netral penyedia dan saat ini dipetakan
    ke kolom permintaan `background` OpenAI yang sama saat penyedia OpenAI
    dipilih. Penyedia yang tidak mendeklarasikan dukungan latar mengembalikannya
    dalam `ignoredOverrides` alih-alih menerima parameter yang tidak didukung.

    Untuk merutekan pembuatan gambar OpenAI melalui deployment Azure OpenAI
    alih-alih `api.openai.com`, lihat
    [endpoint Azure OpenAI](/id/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Model gambar OpenRouter">
    Pembuatan gambar OpenRouter menggunakan `OPENROUTER_API_KEY` yang sama dan
    dirutekan melalui API gambar chat completions OpenRouter. Pilih
    model gambar OpenRouter dengan prefiks `openrouter/`:

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

    OpenClaw meneruskan `prompt`, `count`, gambar referensi, serta petunjuk
    `aspectRatio` / `resolution` yang kompatibel dengan Gemini ke OpenRouter.
    Pintasan model gambar OpenRouter bawaan saat ini mencakup
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, dan `openai/gpt-5.4-image-2`. Gunakan
    `action: "list"` untuk melihat apa yang diekspos oleh plugin yang Anda konfigurasi.

  </Accordion>
  <Accordion title="autentikasi ganda MiniMax">
    Pembuatan gambar MiniMax tersedia melalui kedua jalur autentikasi MiniMax
    bawaan:

    - `minimax/image-01` untuk setup kunci API
    - `minimax-portal/image-01` untuk setup OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Penyedia xAI bawaan menggunakan `/v1/images/generations` untuk permintaan
    yang hanya berisi prompt dan `/v1/images/edits` saat `image` atau `images`
    ada.

    - Model: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Jumlah: hingga 4
    - Referensi: satu `image` atau hingga lima `images`
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolusi: `1K`, `2K`
    - Output: dikembalikan sebagai lampiran gambar yang dikelola OpenClaw

    OpenClaw sengaja tidak mengekspos `quality`, `mask`, `user`, atau rasio aspek tambahan
    yang hanya native xAI hingga kontrol tersebut ada dalam kontrak lintas-penyedia
    bersama `image_generate`.

  </Accordion>
</AccordionGroup>

## Contoh

<Tabs>
  <Tab title="Buat (lanskap 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Buat (PNG transparan)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI yang setara:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Buat (dua persegi)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (satu referensi)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (beberapa referensi)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Flag `--output-format` dan `--background` yang sama tersedia di
`openclaw infer image edit`; `--openai-background` tetap menjadi alias
khusus OpenAI. Penyedia bawaan selain OpenAI saat ini tidak mendeklarasikan
kontrol latar eksplisit, sehingga `background: "transparent"` dilaporkan
sebagai diabaikan untuk mereka.

## Terkait

- [Ringkasan tool](/id/tools) - semua tool agen yang tersedia
- [ComfyUI](/id/providers/comfy) - setup workflow ComfyUI lokal dan Comfy Cloud
- [fal](/id/providers/fal) - setup penyedia gambar dan video fal
- [Google (Gemini)](/id/providers/google) - setup penyedia gambar Gemini
- [MiniMax](/id/providers/minimax) - setup penyedia gambar MiniMax
- [OpenAI](/id/providers/openai) - setup penyedia OpenAI Images
- [Vydra](/id/providers/vydra) - setup gambar, video, dan ucapan Vydra
- [xAI](/id/providers/xai) - setup gambar, video, pencarian, eksekusi kode, dan TTS Grok
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) - konfigurasi `imageGenerationModel`
- [Model](/id/concepts/models) - konfigurasi model dan failover
