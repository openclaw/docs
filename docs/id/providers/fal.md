---
read_when:
    - Anda ingin menggunakan pembuatan gambar fal di OpenClaw
    - Anda memerlukan alur autentikasi FAL_KEY
    - Anda menginginkan default fal untuk `image_generate` atau `video_generate`
summary: Penyiapan pembuatan gambar dan video fal di OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-24T09:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw menyediakan provider `fal` bawaan untuk pembuatan gambar dan video yang dihosting.

| Properti | Nilai                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Autentikasi     | `FAL_KEY` (kanonis; `FAL_API_KEY` juga berfungsi sebagai fallback) |
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

Provider pembuatan gambar `fal` bawaan secara default menggunakan
`fal/fal-ai/flux/dev`.

| Kemampuan     | Nilai                      |
| -------------- | -------------------------- |
| Gambar maksimum     | 4 per permintaan              |
| Mode edit      | Diaktifkan, 1 gambar referensi |
| Override ukuran | Didukung                  |
| Rasio aspek   | Didukung                  |
| Resolusi     | Didukung                  |

<Warning>
Endpoint edit gambar fal **tidak** mendukung override `aspectRatio`.
</Warning>

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

## Pembuatan video

Provider pembuatan video `fal` bawaan secara default menggunakan
`fal/fal-ai/minimax/video-01-live`.

| Kemampuan | Nilai                                                        |
| ---------- | ------------------------------------------------------------ |
| Mode      | Teks-ke-video, referensi satu gambar                        |
| Runtime    | Alur submit/status/result berbasis antrean untuk job yang berjalan lama |

<AccordionGroup>
  <Accordion title="Model video yang tersedia">
    **Agen video HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

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

<Tip>
Gunakan `openclaw models list --provider fal` untuk melihat daftar lengkap model fal
yang tersedia, termasuk entri yang baru ditambahkan.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan provider.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen termasuk pemilihan model gambar dan video.
  </Card>
</CardGroup>
