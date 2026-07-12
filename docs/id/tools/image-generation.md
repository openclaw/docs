---
read_when:
    - Membuat atau mengedit gambar melalui agen
    - Mengonfigurasi penyedia dan model pembuatan gambar
    - Memahami parameter alat image_generate
sidebarTitle: Image generation
summary: Buat dan edit gambar melalui image_generate di OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Pembuatan gambar
x-i18n:
    generated_at: "2026-07-12T14:44:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Alat `image_generate` membuat dan mengedit gambar melalui penyedia yang telah Anda
konfigurasikan. Dalam sesi obrolan, alat ini berjalan secara asinkron: OpenClaw mencatat
tugas latar belakang, segera mengembalikan id tugas, dan membangunkan agen ketika
penyedia selesai. Agen penyelesaian mengikuti mode balasan terlihat normal milik sesi:
pengiriman balasan akhir otomatis jika dikonfigurasi, atau
`message(action="send")` jika sesi mengharuskan alat pesan. Jika sesi
peminta tidak aktif atau pembangkitan aktifnya gagal, OpenClaw mengirim
fallback langsung yang idempoten beserta gambar yang dihasilkan agar hasilnya tidak
hilang.

<Note>
Alat ini hanya muncul jika setidaknya satu penyedia pembuatan gambar
tersedia. Jika Anda tidak melihat `image_generate` dalam alat agen Anda,
konfigurasikan `agents.defaults.imageGenerationModel`, siapkan kunci API penyedia,
atau masuk dengan OAuth OpenAI ChatGPT/Codex.
</Note>

## Mulai cepat

<Steps>
  <Step title="Konfigurasikan autentikasi">
    Tetapkan kunci API untuk setidaknya satu penyedia (misalnya `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) atau masuk dengan OAuth OpenAI Codex.
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

    OAuth ChatGPT/Codex menggunakan referensi model `openai/gpt-image-2` yang sama. Ketika
    profil OAuth `openai` dikonfigurasikan, OpenClaw merutekan permintaan gambar
    melalui profil OAuth tersebut alih-alih terlebih dahulu mencoba `OPENAI_API_KEY`.
    Konfigurasi `models.providers.openai` yang eksplisit (kunci API, URL dasar khusus/Azure)
    mengaktifkan kembali rute langsung API OpenAI Images.

  </Step>
  <Step title="Minta agen">
    _"Buat gambar maskot robot yang ramah."_

    Agen memanggil `image_generate` secara otomatis. Tidak diperlukan pencantuman dalam daftar izin alat
    - alat ini diaktifkan secara default ketika penyedia tersedia. Alat ini
    mengembalikan id tugas latar belakang, lalu agen penyelesaian mengirim
    lampiran yang dihasilkan melalui alat `message` ketika sudah siap.

  </Step>
</Steps>

<Warning>
Untuk titik akhir LAN yang kompatibel dengan OpenAI seperti LocalAI, pertahankan
`models.providers.openai.baseUrl` khusus dan ikut serta secara eksplisit dengan
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Titik akhir gambar privat dan
internal tetap diblokir secara default.
</Warning>

## Rute umum

| Tujuan                                               | Referensi model                                    | Autentikasi                            |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Pembuatan gambar OpenAI dengan penagihan API         | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Pembuatan gambar OpenAI dengan autentikasi langganan Codex | `openai/gpt-image-2`                          | OAuth OpenAI ChatGPT/Codex             |
| PNG/WebP OpenAI dengan latar belakang transparan     | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` atau OAuth OpenAI Codex |
| Pembuatan gambar DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Pembuatan ekspresif/berbasis gaya fal Krea 2         | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Pembuatan gambar OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Pembuatan gambar LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Pembuatan gambar Microsoft Foundry MAI               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` atau Entra ID   |
| Pembuatan gambar Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` atau `GOOGLE_API_KEY` |

Alat yang sama menangani pembuatan teks-ke-gambar dan pengeditan gambar referensi. Gunakan `image`
untuk satu referensi atau `images` untuk beberapa referensi. Untuk model Krea 2 di fal,
referensi tersebut dikirim sebagai referensi gaya, bukan sebagai masukan pengeditan.
Petunjuk keluaran yang didukung penyedia seperti `quality`, `outputFormat`, dan
`background` diteruskan jika tersedia dan dilaporkan sebagai diabaikan ketika
penyedia tidak menyatakan dukungan. Dukungan latar belakang transparan bawaan
khusus untuk OpenAI; penyedia lain mungkin tetap mempertahankan alfa PNG jika
backend mereka menghasilkannya.

## Penyedia yang didukung

| Penyedia          | Model default                            | Dukungan pengeditan                  | Autentikasi                                           |
| ----------------- | --------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Ya (1 gambar, dikonfigurasi alur kerja) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Ya (1 gambar)                        | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Ya (batas khusus model)              | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Ya (hingga 5 gambar)                 | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | Ya (hingga 5 gambar masukan)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Ya (hanya model MAI-Image-2.5)       | `AZURE_OPENAI_API_KEY` atau Entra ID (`az login`)     |
| MiniMax           | `image-01`                              | Ya (referensi subjek)                | `MINIMAX_API_KEY` atau OAuth MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Ya (hingga 5 gambar)                 | `OPENAI_API_KEY` atau OAuth OpenAI ChatGPT/Codex      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Ya (hingga 5 gambar masukan)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Tidak                                | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Ya (hingga 3 gambar)                 | `XAI_API_KEY`                                         |

Gunakan `action: "list"` untuk memeriksa penyedia dan model yang tersedia saat runtime:

```text
/tool image_generate action=list
```

Gunakan `action: "status"` untuk memeriksa tugas pembuatan gambar aktif untuk
sesi saat ini:

```text
/tool image_generate action=status
```

## Kemampuan penyedia

| Kemampuan              | ComfyUI                   | DeepInfra | fal                                                    | Google           | Microsoft Foundry | MiniMax                     | OpenAI           | Vydra | xAI              |
| ---------------------- | ------------------------- | --------- | ------------------------------------------------------ | ---------------- | ----------------- | --------------------------- | ---------------- | ----- | ---------------- |
| Pembuatan (jumlah maks.) | 1                       | 4         | 4                                                      | 4                | 1                 | 9                           | 4                | 1     | 4                |
| Edit / referensi       | 1 gambar (alur kerja)     | 1 gambar  | Flux: 1; GPT: 10; ref gaya Krea: 10; NB2: 14           | Hingga 5 gambar  | 1 gambar          | 1 gambar (ref subjek)       | Hingga 5 gambar  | -     | Hingga 3 gambar  |
| Kontrol ukuran         | -                         | ✓         | ✓                                                      | ✓                | ✓                 | -                           | Hingga 4K        | -     | -                |
| Rasio aspek            | -                         | -         | ✓                                                      | ✓                | -                 | ✓                           | -                | -     | ✓                |
| Resolusi (1K/2K/4K)    | -                         | -         | ✓                                                      | ✓                | -                 | -                           | -                | -     | 1K, 2K           |

## Parameter alat

<ParamField path="prompt" type="string" required>
  Perintah pembuatan gambar. Wajib untuk `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Gunakan `"status"` untuk memeriksa tugas sesi aktif atau `"list"` untuk memeriksa
  penyedia dan model yang tersedia saat runtime.
</ParamField>
<ParamField path="model" type="string">
  Penggantian penyedia/model (misalnya `openai/gpt-image-2`). Gunakan
  `openai/gpt-image-1.5` untuk latar belakang OpenAI transparan.
</ParamField>
<ParamField path="image" type="string">
  Jalur atau URL satu gambar referensi untuk mode pengeditan.
</ParamField>
<ParamField path="images" type="string[]">
  Beberapa gambar referensi untuk mode pengeditan atau model referensi gaya (hingga 14
  melalui alat bersama; batas khusus penyedia tetap berlaku).
</ParamField>
<ParamField path="size" type="string">
  Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Rasio aspek: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Penyedia memvalidasi subset khusus model mereka.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Petunjuk resolusi.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Petunjuk kualitas jika penyedia mendukungnya.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Petunjuk format keluaran jika penyedia mendukungnya.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Petunjuk latar belakang jika penyedia mendukungnya. Gunakan `transparent` dengan
  `outputFormat: "png"` atau `"webp"` untuk penyedia yang mendukung transparansi.
</ParamField>
<ParamField path="count" type="number">Jumlah gambar yang akan dibuat (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Batas waktu permintaan penyedia opsional dalam milidetik. Ketika Codex memanggil
  `image_generate` melalui alat dinamis, nilai per panggilan ini tetap menggantikan
  nilai default yang dikonfigurasikan dan dibatasi hingga 600000 md.
</ParamField>
<ParamField path="filename" type="string">Petunjuk nama berkas keluaran.</ParamField>
<ParamField path="openai" type="object">
  Petunjuk khusus OpenAI: `background`, `moderation`, `outputCompression`, dan `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Kontrol kreativitas fal Krea 2. Nilai defaultnya adalah `medium`.
</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. Ketika penyedia fallback mendukung
opsi geometri yang mendekati alih-alih opsi persis yang diminta, OpenClaw memetakan ulang ke
ukuran, rasio aspek, atau resolusi terdekat yang didukung sebelum pengiriman.
Petunjuk keluaran yang tidak didukung dihapus untuk penyedia yang tidak menyatakan
dukungan dan dilaporkan dalam hasil alat. Hasil alat melaporkan pengaturan yang
diterapkan; `details.normalization` mencatat setiap penerjemahan dari yang diminta ke yang
diterapkan.
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

OpenClaw mencoba penyedia dalam urutan berikut:

1. Parameter **`model`** dari pemanggilan alat (jika agen menentukannya).
2. **`imageGenerationModel.primary`** dari konfigurasi.
3. **`imageGenerationModel.fallbacks`** secara berurutan.
4. **Deteksi otomatis** - hanya default penyedia yang didukung autentikasi:
   - penyedia default saat ini terlebih dahulu;
   - penyedia pembuatan gambar terdaftar lainnya berdasarkan urutan ID penyedia.

Jika suatu penyedia gagal (kesalahan autentikasi, batas laju, dan sebagainya), kandidat
terkonfigurasi berikutnya akan dicoba secara otomatis. Jika semuanya gagal, kesalahan
akan menyertakan detail dari setiap percobaan.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Penggantian `model` per pemanggilan hanya mencoba penyedia/model tersebut dan
    tidak melanjutkan ke penyedia utama/cadangan terkonfigurasi atau penyedia yang terdeteksi otomatis.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Default penyedia hanya dimasukkan ke daftar kandidat ketika OpenClaw benar-benar
    dapat mengautentikasi penyedia tersebut. Atur
    `agents.defaults.mediaGenerationAutoProviderFallback: false` agar hanya menggunakan
    entri `model`, `primary`, dan `fallbacks` yang eksplisit.
  </Accordion>
  <Accordion title="Timeouts">
    Atur `agents.defaults.imageGenerationModel.timeoutMs` untuk backend gambar yang
    lambat. Parameter alat `timeoutMs` per pemanggilan menggantikan default
    terkonfigurasi, dan default terkonfigurasi menggantikan default penyedia yang
    ditentukan Plugin. Penyedia gambar yang dihosting Google dan OpenRouter menggunakan
    default 180 detik; pembuatan gambar Microsoft Foundry MAI, xAI, dan Azure OpenAI
    menggunakan 600 detik. Pemanggilan alat dinamis Codex menggunakan default jembatan
    `image_generate` selama 120 detik dan mematuhi anggaran batas waktu yang sama saat
    dikonfigurasi, dengan batas maksimum jembatan alat dinamis OpenClaw sebesar 600000 md.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Gunakan `action: "list"` untuk memeriksa penyedia yang saat ini terdaftar,
    model defaultnya, dan petunjuk variabel lingkungan autentikasi.
  </Accordion>
</AccordionGroup>

### Penyuntingan gambar

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI, dan xAI mendukung penyuntingan gambar referensi. Model Krea 2 di fal
menggunakan bidang `image` / `images` yang sama sebagai referensi gaya, bukan
sebagai masukan penyuntingan. Berikan jalur atau URL gambar referensi:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, dan Google mendukung hingga 5 gambar referensi melalui parameter
`images`; xAI mendukung hingga 3. fal mendukung 1 gambar referensi untuk
Flux gambar-ke-gambar, hingga 10 untuk penyuntingan GPT Image 2, hingga 10 referensi gaya
untuk Krea 2, dan hingga 14 untuk penyuntingan Nano Banana 2. Microsoft Foundry, MiniMax,
dan ComfyUI mendukung 1.

## Pembahasan mendalam penyedia

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    Pembuatan gambar OpenAI menggunakan default `openai/gpt-image-2`. Jika profil
    OAuth `openai` dikonfigurasi, OpenClaw menggunakan kembali profil OAuth
    yang sama dengan yang digunakan oleh model percakapan langganan Codex dan mengirimkan
    permintaan gambar melalui backend Codex Responses. URL dasar Codex lama
    seperti `https://chatgpt.com/backend-api` dikanonisasi menjadi
    `https://chatgpt.com/backend-api/codex` untuk permintaan gambar. OpenClaw
    **tidak** secara diam-diam beralih ke `OPENAI_API_KEY` untuk permintaan tersebut -
    untuk memaksa perutean langsung melalui OpenAI Images API, konfigurasikan
    `models.providers.openai` secara eksplisit dengan kunci API, URL dasar khusus,
    atau titik akhir Azure.

    Model `openai/gpt-image-1.5`, `openai/gpt-image-1`, dan
    `openai/gpt-image-1-mini` tetap dapat dipilih secara eksplisit. Gunakan
    `gpt-image-1.5` untuk keluaran PNG/WebP berlatar transparan; API
    `gpt-image-2` saat ini menolak `background: "transparent"`.

    `gpt-image-2` mendukung pembuatan teks-ke-gambar maupun
    penyuntingan gambar referensi melalui alat `image_generate` yang sama.
    OpenClaw meneruskan `prompt`, `count`, `size`, `quality`, `outputFormat`,
    dan gambar referensi ke OpenAI. OpenAI **tidak** menerima
    `aspectRatio` atau `resolution` secara langsung; jika memungkinkan, OpenClaw memetakan
    nilai tersebut ke `size` yang didukung. Jika tidak, alat akan melaporkannya sebagai
    penggantian yang diabaikan.

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
    keluaran transparan memerlukan `outputFormat` `png` atau `webp` serta model
    gambar OpenAI yang mendukung transparansi. OpenClaw merutekan permintaan
    default `gpt-image-2` dengan latar transparan ke `gpt-image-1.5`.
    `openai.outputCompression` berlaku untuk keluaran JPEG/WebP dan diabaikan
    untuk keluaran PNG.

    Petunjuk `background` tingkat atas bersifat netral terhadap penyedia dan saat ini dipetakan
    ke bidang permintaan `background` OpenAI yang sama ketika penyedia OpenAI
    dipilih. Penyedia yang tidak menyatakan dukungan latar belakang mengembalikannya
    dalam `ignoredOverrides`, alih-alih menerima parameter yang tidak didukung.

    Untuk merutekan pembuatan gambar OpenAI melalui deployment Azure OpenAI
    sebagai pengganti `api.openai.com`, lihat
    [titik akhir Azure OpenAI](/id/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Pembuatan gambar Microsoft Foundry menggunakan nama deployment gambar MAI yang telah
    diterapkan dengan prefiks penyedia `microsoft-foundry/`. Tidak ada model default
    tingkat penyedia karena API MAI mengharapkan nama deployment Anda dalam bidang
    `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Penyedia ini menggunakan API MAI Microsoft Foundry, bukan OpenAI Images API:

    - Titik akhir pembuatan: `/mai/v1/images/generations`
    - Titik akhir penyuntingan: `/mai/v1/images/edits`
    - Autentikasi: `AZURE_OPENAI_API_KEY` / kunci API penyedia, atau Entra ID melalui `az login`
    - Keluaran: satu gambar PNG
    - Ukuran: default `1024x1024`; lebar dan tinggi masing-masing harus sekurang-kurangnya 768 px,
      dan jumlah total piksel tidak boleh melebihi 1.048.576
    - Penyuntingan: satu gambar referensi PNG atau JPEG, hanya didukung oleh
      deployment `MAI-Image-2.5-Flash` dan `MAI-Image-2.5`

    Pembuatan yang hanya menggunakan prompt dapat memakai nama deployment khusus dengan hanya
    titik akhir Foundry yang dikonfigurasi. Penyuntingan dengan nama deployment khusus memerlukan
    metadata orientasi awal/model agar OpenClaw dapat memverifikasi bahwa deployment tersebut
    didukung oleh `MAI-Image-2.5-Flash` atau `MAI-Image-2.5`.

    Model gambar MAI saat ini adalah `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e`, dan `MAI-Image-2`. Lihat
    [Plugin Microsoft Foundry](/id/plugins/reference/microsoft-foundry) untuk penyiapan
    dan perilaku model percakapan.

  </Accordion>
  <Accordion title="OpenRouter image models">
    Pembuatan gambar OpenRouter menggunakan `OPENROUTER_API_KEY` yang sama dan
    dirutekan melalui API gambar penyelesaian percakapan OpenRouter. Pilih
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
    `action: "list"` untuk melihat apa yang diekspos oleh Plugin terkonfigurasi Anda.

  </Accordion>
  <Accordion title="fal Krea 2">
    Model Krea 2 di fal menggunakan skema Krea native milik fal, bukan skema umum
    `image_size` yang digunakan oleh Flux. OpenClaw mengirimkan:

    - `aspect_ratio` untuk petunjuk rasio aspek
    - `creativity`, dengan default `medium`
    - `image_style_references` ketika `image` atau `images` diberikan

    Pilih Krea 2 Medium untuk ilustrasi ekspresif yang lebih cepat dan Krea 2 Large
    untuk tampilan fotorealistis dan bertekstur yang lebih lambat tetapi lebih terperinci:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 saat ini mengembalikan satu gambar per permintaan. Utamakan `aspectRatio` untuk
    Krea; OpenClaw memetakan `size` ke rasio aspek Krea terdekat yang didukung dan
    menolak `resolution` untuk Krea alih-alih menghapusnya. Gunakan `fal.creativity`
    ketika Anda menginginkan tingkat kreativitas native Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    Pembuatan gambar MiniMax tersedia melalui kedua jalur autentikasi MiniMax
    bawaan:

    - `minimax/image-01` untuk penyiapan berbasis kunci API
    - `minimax-portal/image-01` untuk penyiapan OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Penyedia xAI bawaan menggunakan `/v1/images/generations` untuk permintaan
    yang hanya berisi prompt dan `/v1/images/edits` ketika terdapat `image` atau `images`.

    - Model: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Jumlah: hingga 4
    - Referensi: satu `image` atau hingga tiga `images`
    - Rasio aspek: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resolusi: `1K`, `2K`
    - Keluaran: dikembalikan sebagai lampiran gambar yang dikelola OpenClaw

    OpenClaw sengaja tidak mengekspos `quality`, `mask`, `user`, atau rasio aspek
    `auto` native xAI hingga kontrol tersebut tersedia dalam kontrak lintas penyedia
    `image_generate` bersama.

  </Accordion>
</AccordionGroup>

## Contoh

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI yang setara:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Buat (dua persegi)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dua arah visual untuk ikon aplikasi produktivitas yang tenang" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (satu referensi)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Pertahankan subjek, ganti latar belakang dengan penataan studio yang cerah" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (beberapa referensi)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Gabungkan identitas karakter dari gambar pertama dengan palet warna dari gambar kedua" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Referensi gaya Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Potret editorial ekspresif menggunakan palet warna dan tekstur cetak ini" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Flag `--output-format`, `--background`, `--quality`, dan
`--openai-moderation` yang sama tersedia pada `openclaw infer image edit`;
`--openai-background` tetap menjadi alias khusus OpenAI. Penyedia bawaan
selain OpenAI saat ini tidak mendeklarasikan kontrol latar belakang secara eksplisit, sehingga
`background: "transparent"` dilaporkan sebagai diabaikan untuk penyedia tersebut.

## Terkait

- [Ikhtisar alat](/id/tools) - semua alat agen yang tersedia
- [ComfyUI](/id/providers/comfy) - penyiapan alur kerja ComfyUI lokal dan Comfy Cloud
- [fal](/id/providers/fal) - penyiapan penyedia gambar dan video fal
- [Google (Gemini)](/id/providers/google) - penyiapan penyedia gambar Gemini
- [Plugin Microsoft Foundry](/id/plugins/reference/microsoft-foundry) - penyiapan percakapan Microsoft Foundry dan gambar MAI
- [MiniMax](/id/providers/minimax) - penyiapan penyedia gambar MiniMax
- [OpenAI](/id/providers/openai) - penyiapan penyedia OpenAI Images
- [Vydra](/id/providers/vydra) - penyiapan gambar, video, dan suara Vydra
- [xAI](/id/providers/xai) - penyiapan gambar, video, pencarian, eksekusi kode, dan TTS Grok
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) - konfigurasi `imageGenerationModel`
- [Model](/id/concepts/models) - konfigurasi model dan failover
