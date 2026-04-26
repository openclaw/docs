---
read_when:
    - Anda ingin menggunakan image generation fal di OpenClaw
    - Anda memerlukan alur auth `FAL_KEY`
    - Anda menginginkan default fal untuk `image_generate` atau `video_generate`
summary: Penyiapan fal image dan video generation di OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw menyertakan provider bawaan `fal` untuk hosted image dan video generation.

| Properti | Nilai                                                        |
| -------- | ------------------------------------------------------------ |
| Provider | `fal`                                                        |
| Auth     | `FAL_KEY` (kanonis; `FAL_API_KEY` juga berfungsi sebagai fallback) |
| API      | endpoint model fal                                           |

## Memulai

<Steps>
  <Step title="Atur API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Atur model image default">
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

## Image generation

Provider image-generation `fal` bawaan default ke
`fal/fal-ai/flux/dev`.

| Capability     | Nilai                      |
| -------------- | -------------------------- |
| Max images     | 4 per permintaan           |
| Edit mode      | Aktif, 1 gambar referensi  |
| Size overrides | Didukung                   |
| Aspect ratio   | Didukung                   |
| Resolution     | Didukung                   |
| Output format  | `png` atau `jpeg`          |

<Warning>
Endpoint edit image fal **tidak** mendukung override `aspectRatio`.
</Warning>

Gunakan `outputFormat: "png"` saat Anda menginginkan output PNG. fal tidak mendeklarasikan
kontrol latar belakang transparan eksplisit di OpenClaw, jadi `background:
"transparent"` dilaporkan sebagai override yang diabaikan untuk model fal.

Untuk menggunakan fal sebagai provider image default:

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

## Video generation

Provider video-generation `fal` bawaan default ke
`fal/fal-ai/minimax/video-01-live`.

| Capability | Nilai                                                               |
| ---------- | ------------------------------------------------------------------- |
| Modes      | Text-to-video, referensi gambar tunggal, Seedance reference-to-video |
| Runtime    | Alur submit/status/result berbasis antrean untuk job yang berjalan lama |

<AccordionGroup>
  <Accordion title="Model video yang tersedia">
    **HeyGen video-agent:**

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

  <Accordion title="Contoh config Seedance 2.0 reference-to-video">
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
    melalui parameter bersama `video_generate` yaitu `images`, `videos`, dan `audioRefs`,
    dengan total maksimal 12 file referensi.

  </Accordion>

  <Accordion title="Contoh config HeyGen video-agent">
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
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Parameter tool image bersama dan pemilihan provider.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen termasuk pemilihan model image dan video.
  </Card>
</CardGroup>
