---
read_when:
    - Menghasilkan atau mengedit gambar melalui agen
    - Mengonfigurasi provider dan model pembuatan gambar
    - Memahami parameter tool `image_generate`
sidebarTitle: Image generation
summary: Hasilkan dan edit gambar melalui `image_generate` di OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI, Vydra
title: Pembuatan gambar
x-i18n:
    generated_at: "2026-04-26T11:40:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

Tool `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan
provider yang telah Anda konfigurasi. Gambar yang dihasilkan dikirim secara otomatis sebagai lampiran media dalam balasan agen.

<Note>
Tool ini hanya muncul saat setidaknya satu provider pembuatan gambar
tersedia. Jika Anda tidak melihat `image_generate` di tools agen Anda,
konfigurasikan `agents.defaults.imageGenerationModel`, siapkan API key provider,
atau masuk dengan OpenAI Codex OAuth.
</Note>

## Mulai cepat

<Steps>
  <Step title="Konfigurasikan auth">
    Atur API key untuk setidaknya satu provider (misalnya `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) atau masuk dengan OpenAI Codex OAuth.
  </Step>
  <Step title="Pilih model default (opsional)">
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

    Codex OAuth menggunakan ref model `openai/gpt-image-2` yang sama. Saat
    profil OAuth `openai-codex` dikonfigurasi, OpenClaw merutekan permintaan
    gambar melalui profil OAuth tersebut alih-alih terlebih dahulu mencoba
    `OPENAI_API_KEY`. Config `models.providers.openai` eksplisit (API key,
    base URL kustom/Azure) akan mengikutkan kembali jalur
    OpenAI Images API langsung.

  </Step>
  <Step title="Minta agen">
    _"Buat gambar maskot robot yang ramah."_

    Agen memanggil `image_generate` secara otomatis. Tidak perlu allow-listing
    tool — tool ini diaktifkan secara default saat provider tersedia.

  </Step>
</Steps>

<Warning>
Untuk endpoint LAN yang kompatibel dengan OpenAI seperti LocalAI, pertahankan
`models.providers.openai.baseUrl` kustom dan ikut gunakan secara eksplisit
dengan `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Endpoint gambar privat dan
internal tetap diblokir secara default.
</Warning>

## Rute umum

| Tujuan                                               | Ref model                                          | Auth                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Pembuatan gambar OpenAI dengan penagihan API         | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Pembuatan gambar OpenAI dengan auth langganan Codex  | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP dengan latar belakang transparan     | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` atau OpenAI Codex OAuth |
| Pembuatan gambar OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Pembuatan gambar LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Pembuatan gambar Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`   |

Tool `image_generate` yang sama menangani text-to-image dan pengeditan
reference-image. Gunakan `image` untuk satu referensi atau `images` untuk beberapa referensi.
Hint output yang didukung provider seperti `quality`, `outputFormat`, dan
`background` diteruskan saat tersedia dan dilaporkan sebagai diabaikan ketika suatu
provider tidak mendukungnya. Dukungan latar belakang transparan bawaan bersifat
khusus OpenAI; provider lain mungkin tetap mempertahankan alpha PNG jika backend mereka
menghasilkannya.

## Provider yang didukung

| Provider   | Model default                           | Dukungan edit                     | Auth                                                  |
| ---------- | --------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Ya (1 gambar, dikonfigurasi workflow) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| fal        | `fal-ai/flux/dev`                       | Ya                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Ya                                | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Ya (hingga 5 gambar input)        | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Ya (referensi subjek)             | `MINIMAX_API_KEY` atau MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Ya (hingga 4 gambar)              | `OPENAI_API_KEY` atau OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ya (hingga 5 gambar input)        | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Tidak                             | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Ya (hingga 5 gambar)              | `XAI_API_KEY`                                         |

Gunakan `action: "list"` untuk memeriksa provider dan model yang tersedia saat runtime:

```text
/tool image_generate action=list
```

## Kapabilitas provider

| Kapabilitas           | ComfyUI            | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Generate (jumlah maks) | Ditentukan workflow | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Edit / referensi      | 1 gambar (workflow) | 1 gambar          | Hingga 5 gambar | 1 gambar (referensi subjek) | Hingga 5 gambar | —     | Hingga 5 gambar |
| Kontrol ukuran        | —                  | ✓                 | ✓              | —                     | Hingga 4K      | —     | —              |
| Rasio aspek           | —                  | ✓ (hanya generate) | ✓             | ✓                     | —              | —     | ✓              |
| Resolusi (1K/2K/4K)   | —                  | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parameter tool

<ParamField path="prompt" type="string" required>
  Prompt pembuatan gambar. Wajib untuk `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Gunakan `"list"` untuk memeriksa provider dan model yang tersedia saat runtime.
</ParamField>
<ParamField path="model" type="string">
  Override provider/model (misalnya `openai/gpt-image-2`). Gunakan
  `openai/gpt-image-1.5` untuk latar belakang OpenAI yang transparan.
</ParamField>
<ParamField path="image" type="string">
  Path atau URL gambar referensi tunggal untuk mode edit.
</ParamField>
<ParamField path="images" type="string[]">
  Beberapa gambar referensi untuk mode edit (hingga 5 pada provider yang mendukung).
</ParamField>
<ParamField path="size" type="string">
  Hint ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Hint resolusi.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Hint kualitas saat provider mendukungnya.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Hint format output saat provider mendukungnya.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Hint latar belakang saat provider mendukungnya. Gunakan `transparent` dengan
  `outputFormat: "png"` atau `"webp"` untuk provider yang mendukung transparansi.
</ParamField>
<ParamField path="count" type="number">Jumlah gambar yang akan dihasilkan (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Timeout permintaan provider opsional dalam milidetik.</ParamField>
<ParamField path="filename" type="string">Hint nama file output.</ParamField>
<ParamField path="openai" type="object">
  Hint khusus OpenAI: `background`, `moderation`, `outputCompression`, dan `user`.
</ParamField>

<Note>
Tidak semua provider mendukung semua parameter. Saat provider fallback mendukung
opsi geometri yang berdekatan alih-alih yang diminta secara persis, OpenClaw memetakan ulang ke
ukuran, rasio aspek, atau resolusi terdekat yang didukung sebelum pengiriman.
Hint output yang tidak didukung dibuang untuk provider yang tidak menyatakan
dukungan dan dilaporkan dalam hasil tool. Hasil tool melaporkan pengaturan yang diterapkan; `details.normalization` menangkap translasi yang diminta-ke-yang-diterapkan.
</Note>

## Config

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

### Urutan pemilihan provider

OpenClaw mencoba provider dalam urutan ini:

1. **Parameter `model`** dari pemanggilan tool (jika agen menentukannya).
2. **`imageGenerationModel.primary`** dari config.
3. **`imageGenerationModel.fallbacks`** secara berurutan.
4. **Deteksi otomatis** — hanya default provider yang didukung auth:
   - provider default saat ini terlebih dahulu;
   - provider pembuatan gambar terdaftar yang tersisa dalam urutan id provider.

Jika suatu provider gagal (error auth, batas laju, dll.), kandidat terkonfigurasi
berikutnya akan dicoba secara otomatis. Jika semuanya gagal, error menyertakan detail
dari setiap percobaan.

<AccordionGroup>
  <Accordion title="Override model per panggilan bersifat persis">
    Override `model` per panggilan hanya mencoba provider/model itu saja dan
    tidak melanjutkan ke provider primary/fallback terkonfigurasi atau provider yang terdeteksi otomatis.
  </Accordion>
  <Accordion title="Deteksi otomatis sadar auth">
    Default provider hanya masuk ke daftar kandidat saat OpenClaw benar-benar dapat
    mengautentikasi provider tersebut. Atur
    `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya menggunakan
    entri `model`, `primary`, dan `fallbacks` yang eksplisit.
  </Accordion>
  <Accordion title="Timeout">
    Atur `agents.defaults.imageGenerationModel.timeoutMs` untuk backend gambar
    yang lambat. Parameter tool `timeoutMs` per panggilan menimpa default yang
    dikonfigurasi.
  </Accordion>
  <Accordion title="Periksa saat runtime">
    Gunakan `action: "list"` untuk memeriksa provider yang saat ini terdaftar,
    model default mereka, dan hint env-var auth.
  </Accordion>
</AccordionGroup>

### Pengeditan gambar

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI, dan xAI mendukung pengeditan
gambar referensi. Berikan path atau URL gambar referensi:

```text
"Buat versi cat air dari foto ini" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google, dan xAI mendukung hingga 5 gambar referensi melalui parameter
`images`. fal, MiniMax, dan ComfyUI mendukung 1.

## Penjelasan mendalam provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (dan gpt-image-1.5)">
    Pembuatan gambar OpenAI default-nya `openai/gpt-image-2`. Jika profil
    OAuth `openai-codex` dikonfigurasi, OpenClaw menggunakan kembali profil
    OAuth yang sama yang digunakan oleh model chat langganan Codex dan mengirim
    permintaan gambar melalui backend Codex Responses. Base URL Codex lama
    seperti `https://chatgpt.com/backend-api` dikanonisasi menjadi
    `https://chatgpt.com/backend-api/codex` untuk permintaan gambar. OpenClaw
    **tidak** melakukan fallback secara diam-diam ke `OPENAI_API_KEY` untuk permintaan tersebut —
    untuk memaksa routing OpenAI Images API langsung, konfigurasikan
    `models.providers.openai` secara eksplisit dengan API key, base URL kustom,
    atau endpoint Azure.

    Model `openai/gpt-image-1.5`, `openai/gpt-image-1`, dan
    `openai/gpt-image-1-mini` masih dapat dipilih secara eksplisit. Gunakan
    `gpt-image-1.5` untuk output PNG/WebP dengan latar belakang transparan; API
    `gpt-image-2` saat ini menolak `background: "transparent"`.

    `gpt-image-2` mendukung pembuatan text-to-image dan
    pengeditan reference-image melalui tool `image_generate` yang sama.
    OpenClaw meneruskan `prompt`, `count`, `size`, `quality`, `outputFormat`,
    dan gambar referensi ke OpenAI. OpenAI **tidak** menerima
    `aspectRatio` atau `resolution` secara langsung; jika memungkinkan OpenClaw memetakan
    nilai tersebut ke `size` yang didukung, jika tidak tool akan melaporkannya sebagai
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

    `openai.background` menerima `transparent`, `opaque`, atau `auto`;
    output transparan memerlukan `outputFormat` `png` atau `webp` dan model gambar OpenAI yang mendukung transparansi. OpenClaw merutekan
    permintaan latar belakang transparan default `gpt-image-2` ke `gpt-image-1.5`.
    `openai.outputCompression` berlaku untuk output JPEG/WebP.

    Hint `background` tingkat atas bersifat netral-provider dan saat ini dipetakan
    ke field permintaan OpenAI `background` yang sama saat provider OpenAI
    dipilih. Provider yang tidak menyatakan dukungan latar belakang akan mengembalikannya
    dalam `ignoredOverrides` alih-alih menerima parameter yang tidak didukung tersebut.

    Untuk merutekan pembuatan gambar OpenAI melalui deployment Azure OpenAI
    alih-alih `api.openai.com`, lihat
    [Endpoint Azure OpenAI](/id/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Model gambar OpenRouter">
    Pembuatan gambar OpenRouter menggunakan `OPENROUTER_API_KEY` yang sama dan
    dirutekan melalui API gambar chat completions OpenRouter. Pilih
    model gambar OpenRouter dengan prefix `openrouter/`:

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

    OpenClaw meneruskan `prompt`, `count`, gambar referensi, dan
    hint `aspectRatio` / `resolution` yang kompatibel dengan Gemini ke OpenRouter.
    Shortcut model gambar OpenRouter bawaan saat ini mencakup
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, dan `openai/gpt-5.4-image-2`. Gunakan
    `action: "list"` untuk melihat apa yang diekspos oleh plugin yang telah Anda konfigurasi.

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    Pembuatan gambar MiniMax tersedia melalui kedua jalur auth MiniMax
    bawaan:

    - `minimax/image-01` untuk penyiapan API-key
    - `minimax-portal/image-01` untuk penyiapan OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Provider xAI bawaan menggunakan `/v1/images/generations` untuk
    permintaan yang hanya berisi prompt dan `/v1/images/edits` saat `image` atau `images` ada.

    - Model: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Jumlah: hingga 4
    - Referensi: satu `image` atau hingga lima `images`
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolusi: `1K`, `2K`
    - Output: dikembalikan sebagai lampiran gambar yang dikelola OpenClaw

    OpenClaw sengaja tidak mengekspos `quality`, `mask`,
    `user`, atau rasio aspek native-only tambahan milik xAI sampai kontrol tersebut tersedia
    dalam kontrak `image_generate` lintas-provider bersama.

  </Accordion>
</AccordionGroup>

## Contoh

<Tabs>
  <Tab title="Generate (lanskap 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (PNG transparan)">
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
  <Tab title="Generate (dua persegi)">
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

Flag `--output-format` dan `--background` yang sama juga tersedia pada
`openclaw infer image edit`; `--openai-background` tetap menjadi
alias khusus OpenAI. Provider bawaan selain OpenAI saat ini tidak menyatakan
kontrol latar belakang eksplisit, sehingga `background: "transparent"` dilaporkan
sebagai diabaikan untuk mereka.

## Terkait

- [Ikhtisar tools](/id/tools) — semua tool agen yang tersedia
- [ComfyUI](/id/providers/comfy) — penyiapan workflow ComfyUI lokal dan Comfy Cloud
- [fal](/id/providers/fal) — penyiapan provider gambar dan video fal
- [Google (Gemini)](/id/providers/google) — penyiapan provider gambar Gemini
- [MiniMax](/id/providers/minimax) — penyiapan provider gambar MiniMax
- [OpenAI](/id/providers/openai) — penyiapan provider OpenAI Images
- [Vydra](/id/providers/vydra) — penyiapan gambar, video, dan speech Vydra
- [xAI](/id/providers/xai) — penyiapan gambar, video, pencarian, eksekusi kode, dan TTS Grok
- [Referensi config](/id/gateway/config-agents#agent-defaults) — config `imageGenerationModel`
- [Models](/id/concepts/models) — konfigurasi model dan failover
