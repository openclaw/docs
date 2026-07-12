---
read_when:
    - Anda ingin menggunakan pembuatan gambar fal di OpenClaw
    - Anda memerlukan alur autentikasi FAL_KEY
    - Anda menginginkan nilai default fal untuk image_generate, video_generate, atau music_generate
summary: penyiapan pembuatan gambar, video, dan musik fal di OpenClaw
title: Salah
x-i18n:
    generated_at: "2026-07-12T14:35:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw menyertakan provider `fal` bawaan untuk pembuatan gambar, video, dan musik
yang dihosting.

| Properti | Nilai                                                                           |
| -------- | ------------------------------------------------------------------------------- |
| Provider | `fal`                                                                           |
| Autentikasi | `FAL_KEY` (kanonis; `FAL_API_KEY` juga berfungsi sebagai cadangan)           |
| API      | Endpoint model fal (`https://fal.run`; tugas video menggunakan `https://queue.fal.run`) |
| URL dasar | Timpa dengan `models.providers.fal.baseUrl`                                    |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Penyiapan noninteraktif dapat meneruskan `--fal-api-key <key>` atau mengekspor `FAL_KEY`.
    Proses orientasi juga menetapkan `fal/fal-ai/flux/dev` sebagai model gambar default jika
    belum ada yang dikonfigurasi.

  </Step>
  <Step title="Tetapkan model gambar default">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Pembuatan gambar

Provider pembuatan gambar `fal` bawaan menggunakan
`fal/fal-ai/flux/dev` secara default.

| Kemampuan      | Nilai                                                              |
| -------------- | ------------------------------------------------------------------ |
| Gambar maksimum | 4 per permintaan; Krea 2: 1 per permintaan                         |
| Penimpaan ukuran | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`  |
| Rasio aspek    | Didukung di semua tempat kecuali gambar-ke-gambar Flux             |
| Resolusi       | `1K`, `2K`, `4K` (batas per model di bawah)                        |
| Format keluaran | `png` (default) atau `jpeg`; Krea 2 menolak penimpaan `outputFormat` |

Permintaan pengeditan (gambar referensi melalui parameter bersama `image` / `images`)
diarahkan ke endpoint pengeditan per model dengan batas referensi per model:

| Keluarga model            | Referensi model setelah `fal/`           | Endpoint pengeditan | Gambar referensi maksimum |
| ------------------------- | ---------------------------------------- | ------------------- | ------------------------- |
| Flux dan model fal lainnya | `fal-ai/flux/dev` (default)             | `/image-to-image`   | 1                         |
| GPT Image                 | `openai/gpt-image-*`                     | `/edit`             | 10                        |
| Grok Imagine              | `xai/grok-imagine-image`                 | `/edit`             | 3                         |
| Nano Banana (lama)        | `fal-ai/nano-banana`                     | `/edit`             | 3                         |
| Nano Banana 2             | `fal-ai/nano-banana-*`                   | `/edit`             | 14                        |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`              | `/edit`             | 14                        |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image`   | tidak ada (referensi gaya) | 10 referensi gaya   |

<Warning>
Permintaan gambar-ke-gambar Flux **tidak** mendukung penimpaan `aspectRatio`. Permintaan
pengeditan GPT Image dan Nano Banana 2 menggunakan endpoint `/edit` milik fal dan menerima
petunjuk rasio aspek. Nano Banana 2 juga menerima rasio lebar/tinggi ekstra-native
seperti `4:1`, `1:4`, `8:1`, dan `1:8`; Krea 2 memvalidasi subset rasio aspeknya
sendiri yang lebih kecil. Grok Imagine memiliki daftar rasionya sendiri (termasuk `2:1`,
`20:9`, `19.5:9`, dan kebalikannya) serta hanya menerima resolusi `1K`/`2K`;
Nano Banana lama dan Nano Banana 2 Lite menolak penimpaan `resolution`.
</Warning>

Model Krea 2 menggunakan skema payload Krea native milik fal. OpenClaw mengirim
`aspect_ratio`, `creativity`, dan `image_style_references`, bukan payload
`image_size` / endpoint pengeditan generik yang digunakan oleh Flux. Referensi modelnya adalah:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Gunakan Medium untuk ilustrasi ekspresif, anime, lukisan, dan gaya artistik
yang lebih cepat. Gunakan Large untuk hasil fotorealistis, tekstur mentah, butiran film, dan tampilan
mendetail yang lebih lambat. Krea menggunakan `fal.creativity: "medium"` secara default; nilai yang didukung adalah
`raw`, `low`, `medium`, dan `high`.

Krea 2 mengekspos rasio aspek, bukan `image_size`, dalam skema permintaan fal. Utamakan
`aspectRatio`; OpenClaw memetakan `size` ke rasio aspek Krea terdekat yang didukung
dan menolak `resolution` untuk Krea alih-alih mengabaikannya.

Gunakan `outputFormat: "png"` ketika Anda menginginkan keluaran PNG dari model fal yang mengekspos
`output_format`. fal tidak mendeklarasikan kontrol latar belakang transparan secara eksplisit
di OpenClaw, sehingga `background: "transparent"` dilaporkan sebagai penimpaan yang diabaikan
untuk model fal.
Endpoint Krea 2 tidak mengekspos bidang permintaan `output_format` melalui fal, sehingga
OpenClaw menolak penimpaan `outputFormat` untuk permintaan Krea.

Untuk menggunakan Krea 2 Medium:

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

## Pembuatan video

Provider pembuatan video `fal` bawaan menggunakan
`fal/fal-ai/minimax/video-01-live` secara default.

| Kemampuan | Nilai                                                              |
| ---------- | ------------------------------------------------------------------ |
| Mode       | Teks-ke-video, referensi satu gambar, referensi-ke-video Seedance   |
| Waktu proses | Alur pengiriman/status/hasil berbasis antrean untuk tugas berdurasi panjang |
| Batas waktu | 20 menit per tugas secara default; status diperiksa setiap 5 detik |

<AccordionGroup>
  <Accordion title="Model video yang tersedia">
    **MiniMax (default):**

    - `fal/fal-ai/minimax/video-01-live`

    **Agen video HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling dan Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Permintaan MiniMax Live dan HeyGen hanya mengirim prompt beserta satu gambar
    referensi opsional; penimpaan lainnya tidak diteruskan. Model Seedance
    menerima `aspectRatio`, `size`, `resolution`, durasi 4–15 detik, dan
    pengalih audio.

  </Accordion>

  <Accordion title="Contoh konfigurasi Seedance 2.0">
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
  </Accordion>

  <Accordion title="Contoh konfigurasi referensi-ke-video Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Referensi-ke-video menerima hingga 9 gambar, 3 video, dan 3 referensi audio
    melalui parameter bersama `images`, `videos`, dan `audioRefs` milik
    `video_generate`, dengan maksimum 12 berkas referensi secara keseluruhan. Referensi audio memerlukan
    setidaknya satu referensi gambar atau video dalam permintaan yang sama.

  </Accordion>

  <Accordion title="Contoh konfigurasi agen video HeyGen">
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
  </Accordion>
</AccordionGroup>

## Pembuatan musik

Plugin `fal` bawaan juga mendaftarkan provider pembuatan musik untuk alat
bersama `music_generate`.

| Kemampuan     | Nilai                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Model default | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Model         | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Durasi maksimum | 240 detik                                                                                                              |
| Waktu proses  | Permintaan sinkron beserta pengunduhan audio yang dihasilkan                                                             |

Gunakan fal sebagai provider musik default:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` mendukung lirik eksplisit dan mode instrumental,
tetapi tidak keduanya dalam permintaan yang sama. ACE-Step dan Stable Audio adalah
endpoint prompt-ke-audio; pilih endpoint tersebut dengan penimpaan `model` ketika Anda menginginkan
keluarga model tersebut. ACE-Step menolak lirik eksplisit; Stable Audio menolak
lirik maupun mode instrumental.

<Tip>
Tabel dan akordeon di atas mencakup keluarga model yang diperlakukan secara khusus oleh
provider fal bawaan. ID endpoint gambar fal lainnya tetap dapat dipilih sebagai
model gambar; ID tersebut diperlakukan seperti Flux (payload `image_size` generik, satu
gambar referensi melalui `/image-to-image`).
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter alat musik bersama dan pemilihan provider.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen, termasuk pemilihan model gambar, video, dan musik.
  </Card>
</CardGroup>
