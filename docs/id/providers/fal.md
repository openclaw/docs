---
read_when:
    - Anda ingin menggunakan pembuatan gambar fal di OpenClaw
    - Anda memerlukan alur autentikasi FAL_KEY
    - Anda menginginkan nilai default fal untuk image_generate atau video_generate
summary: Penyiapan pembuatan gambar dan video fal di OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:34:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw menyertakan penyedia `fal` bawaan untuk pembuatan gambar dan video yang dihosting.

| Properti | Nilai                                                         |
| -------- | ------------------------------------------------------------- |
| Penyedia | `fal`                                                         |
| Autentikasi | `FAL_KEY` (kanonis; `FAL_API_KEY` juga berfungsi sebagai fallback) |
| API      | endpoint model fal                                           |

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

Penyedia pembuatan gambar `fal` bawaan secara default menggunakan
`fal/fal-ai/flux/dev`.

| Kemampuan      | Nilai                                                       |
| -------------- | ----------------------------------------------------------- |
| Gambar maksimum | 4 per permintaan                                               |
| Mode edit      | Flux: 1 gambar referensi; GPT Image 2: 10; Nano Banana 2: 14 |
| Penggantian ukuran | Didukung                                                   |
| Rasio aspek   | Didukung untuk generate dan edit GPT Image 2/Nano Banana 2   |
| Resolusi     | Didukung                                                   |
| Format keluaran  | `png` atau `jpeg`                                             |

<Warning>
Permintaan image-to-image Flux **tidak** mendukung penggantian `aspectRatio`. Permintaan edit GPT
Image 2 dan Nano Banana 2 menggunakan endpoint `/edit` milik fal dan menerima
petunjuk rasio aspek.
</Warning>

Gunakan `outputFormat: "png"` saat Anda menginginkan keluaran PNG. fal tidak mendeklarasikan
kontrol latar belakang transparan eksplisit di OpenClaw, sehingga `background:
"transparent"` dilaporkan sebagai penggantian yang diabaikan untuk model fal.

Untuk menggunakan fal sebagai penyedia gambar default:

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

## Pembuatan video

Penyedia pembuatan video `fal` bawaan secara default menggunakan
`fal/fal-ai/minimax/video-01-live`.

| Kemampuan | Nilai                                                              |
| ---------- | ------------------------------------------------------------------ |
| Mode      | Teks-ke-video, referensi gambar tunggal, referensi-ke-video Seedance |
| Runtime    | Alur submit/status/result berbasis antrean untuk pekerjaan berdurasi lama       |

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

  <Accordion title="Contoh config Seedance 2.0">
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

  <Accordion title="Contoh config reference-to-video Seedance 2.0">
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

  <Accordion title="Contoh config agen video HeyGen">
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

<Tip>
Gunakan `openclaw models list --provider fal` untuk melihat daftar lengkap model fal
yang tersedia, termasuk entri yang baru ditambahkan.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen termasuk pemilihan model gambar dan video.
  </Card>
</CardGroup>
