---
read_when:
    - Anda ingin menggunakan pembuatan gambar fal di OpenClaw
    - Anda memerlukan alur autentikasi FAL_KEY
    - Anda menginginkan default fal untuk image_generate, video_generate, atau music_generate
summary: penyiapan pembuatan gambar, video, dan musik fal di OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:04:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw menyertakan provider `fal` bawaan untuk pembuatan gambar, video, dan musik
yang dihosting.

| Properti | Nilai                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY` (kanonis; `FAL_API_KEY` juga berfungsi sebagai fallback) |
| API      | endpoint model fal                                            |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
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

Provider pembuatan gambar `fal` bawaan menggunakan default
`fal/fal-ai/flux/dev`.

| Kapabilitas      | Nilai                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Gambar maks      | 4 per permintaan; Krea 2: 1 per permintaan                         |
| Mode edit        | Flux: 1 gambar referensi; GPT Image 2: 10; Nano Banana 2: 14       |
| Referensi gaya   | Krea 2: hingga 10 referensi gaya melalui `image` / `images`        |
| Override ukuran  | Didukung                                                           |
| Rasio aspek      | Didukung untuk generate, Krea 2, dan edit GPT Image 2/Nano Banana 2 |
| Resolusi         | Didukung                                                           |
| Format output    | `png` atau `jpeg`                                                  |

<Warning>
Permintaan image-to-image Flux **tidak** mendukung override `aspectRatio`. Permintaan edit GPT
Image 2 dan Nano Banana 2 menggunakan endpoint `/edit` fal dan menerima
petunjuk rasio aspek. Nano Banana 2 juga menerima rasio lebar/tinggi ekstra-native
seperti `4:1`, `1:4`, `8:1`, dan `1:8`; Krea 2 memvalidasi subset rasio
aspeknya sendiri yang lebih kecil.
</Warning>

Model Krea 2 menggunakan skema payload Krea native milik fal. OpenClaw mengirim
`aspect_ratio`, `creativity`, dan `image_style_references`, bukan payload
generik `image_size` / endpoint edit yang digunakan oleh Flux. Ref modelnya adalah:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Gunakan Medium untuk ilustrasi ekspresif, anime, lukisan, dan gaya artistik
yang lebih cepat. Gunakan Large untuk tampilan fotorealistis, tekstur mentah, grain film, dan detail
yang lebih lambat. Default Krea adalah `fal.creativity: "medium"`; nilai yang didukung adalah
`raw`, `low`, `medium`, dan `high`.

Krea 2 mengekspos rasio aspek, bukan `image_size`, dalam skema permintaan fal. Utamakan
`aspectRatio`; OpenClaw memetakan `size` ke rasio aspek Krea terdekat yang didukung
dan menolak `resolution` untuk Krea alih-alih mengabaikannya.

Gunakan `outputFormat: "png"` saat Anda menginginkan output PNG dari model fal yang mengekspos
`output_format`. fal tidak mendeklarasikan kontrol latar belakang transparan
eksplisit di OpenClaw, jadi `background: "transparent"` dilaporkan sebagai override yang diabaikan
untuk model fal.
Endpoint Krea 2 tidak mengekspos field permintaan `output_format` melalui fal, jadi
OpenClaw menolak override `outputFormat` untuk permintaan Krea.

Untuk menggunakan fal sebagai provider gambar default:

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

Provider pembuatan video `fal` bawaan menggunakan default
`fal/fal-ai/minimax/video-01-live`.

| Kapabilitas | Nilai                                                              |
| ----------- | ------------------------------------------------------------------ |
| Mode        | Text-to-video, referensi satu gambar, Seedance reference-to-video  |
| Runtime     | Alur submit/status/result berbasis antrean untuk pekerjaan berjalan lama |

<AccordionGroup>
  <Accordion title="Model video yang tersedia">
    **Agen video HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

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

  <Accordion title="Contoh konfigurasi reference-to-video Seedance 2.0">
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

    Reference-to-video menerima hingga 9 gambar, 3 video, dan 3 referensi audio
    melalui parameter bersama `video_generate` `images`, `videos`, dan `audioRefs`,
    dengan total maksimal 12 file referensi.

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

Plugin `fal` bawaan juga mendaftarkan provider pembuatan musik untuk tool
bersama `music_generate`.

| Kapabilitas   | Nilai                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Model default | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Model         | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime       | Permintaan sinkron ditambah unduhan audio yang dihasilkan                                              |

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

`fal-ai/minimax-music/v2.6` mendukung lirik eksplisit dan mode instrumental.
ACE-Step dan Stable Audio adalah endpoint prompt-to-audio; pilih keduanya dengan override
`model` saat Anda menginginkan keluarga model tersebut.

<Tip>
Gunakan `openclaw models list --provider fal` untuk melihat daftar lengkap model fal
yang tersedia, termasuk entri yang baru ditambahkan.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan provider.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen termasuk pemilihan model gambar, video, dan musik.
  </Card>
</CardGroup>
