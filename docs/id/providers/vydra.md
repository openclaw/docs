---
read_when:
    - Anda menginginkan pembuatan media Vydra di OpenClaw
    - Anda memerlukan panduan penyiapan API key Vydra
summary: Gunakan gambar, video, dan speech Vydra di OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T09:25:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Plugin Vydra bawaan menambahkan:

- Pembuatan gambar melalui `vydra/grok-imagine`
- Pembuatan video melalui `vydra/veo3` dan `vydra/kling`
- Sintesis speech melalui rute TTS Vydra yang didukung ElevenLabs

OpenClaw menggunakan `VYDRA_API_KEY` yang sama untuk ketiga kapabilitas tersebut.

<Warning>
Gunakan `https://www.vydra.ai/api/v1` sebagai base URL.

Host apex Vydra (`https://vydra.ai/api/v1`) saat ini mengalihkan ke `www`. Beberapa klien HTTP menghapus `Authorization` pada redirect lintas-host itu, yang membuat API key yang valid terlihat seperti kegagalan auth yang menyesatkan. Plugin bawaan menggunakan base URL `www` secara langsung untuk menghindari hal tersebut.
</Warning>

## Penyiapan

<Steps>
  <Step title="Jalankan onboarding interaktif">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Atau atur env var secara langsung:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Pilih kapabilitas default">
    Pilih satu atau lebih kapabilitas di bawah ini (gambar, video, atau speech) lalu terapkan konfigurasi yang sesuai.
  </Step>
</Steps>

## Kapabilitas

<AccordionGroup>
  <Accordion title="Pembuatan gambar">
    Model gambar default:

    - `vydra/grok-imagine`

    Tetapkan sebagai provider gambar default:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Dukungan bawaan saat ini hanya text-to-image. Rute edit yang di-host Vydra mengharapkan URL gambar jarak jauh, dan OpenClaw belum menambahkan bridge upload khusus Vydra di Plugin bawaan.

    <Note>
    Lihat [Image Generation](/id/tools/image-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Pembuatan video">
    Model video yang terdaftar:

    - `vydra/veo3` untuk text-to-video
    - `vydra/kling` untuk image-to-video

    Tetapkan Vydra sebagai provider video default:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Catatan:

    - `vydra/veo3` dibundel hanya sebagai text-to-video.
    - `vydra/kling` saat ini memerlukan referensi URL gambar jarak jauh. Upload file lokal ditolak sejak awal.
    - Rute HTTP `kling` Vydra saat ini tidak konsisten mengenai apakah rute tersebut memerlukan `image_url` atau `video_url`; provider bawaan memetakan URL gambar jarak jauh yang sama ke kedua field.
    - Plugin bawaan tetap konservatif dan tidak meneruskan knob gaya yang tidak terdokumentasi seperti rasio aspek, resolusi, watermark, atau audio yang dihasilkan.

    <Note>
    Lihat [Video Generation](/id/tools/video-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Live test video">
    Cakupan live khusus provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    File live Vydra bawaan sekarang mencakup:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video menggunakan URL gambar jarak jauh

    Override fixture gambar jarak jauh bila diperlukan:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sintesis speech">
    Tetapkan Vydra sebagai provider speech:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Default:

    - Model: `elevenlabs/tts`
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    Plugin bawaan saat ini mengekspos satu voice default yang sudah terbukti baik dan mengembalikan file audio MP3.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Direktori provider" href="/id/providers/index" icon="list">
    Telusuri semua provider yang tersedia.
  </Card>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan provider.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen dan konfigurasi model.
  </Card>
</CardGroup>
