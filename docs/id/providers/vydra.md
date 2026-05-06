---
read_when:
    - Anda menginginkan pembuatan media Vydra di OpenClaw
    - Anda memerlukan panduan penyiapan kunci API Vydra
summary: Gunakan gambar, video, dan wicara Vydra di OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:26:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra bawaan menambahkan:

- Pembuatan gambar melalui `vydra/grok-imagine`
- Pembuatan video melalui `vydra/veo3` dan `vydra/kling`
- Sintesis ucapan melalui rute TTS Vydra yang didukung ElevenLabs

OpenClaw menggunakan `VYDRA_API_KEY` yang sama untuk ketiga kapabilitas tersebut.

| Properti        | Nilai                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| ID penyedia     | `vydra`                                                                   |
| Plugin          | bawaan, `enabledByDefault: true`                                          |
| Variabel env auth | `VYDRA_API_KEY`                                                         |
| Flag onboarding | `--auth-choice vydra-api-key`                                             |
| Flag CLI langsung | `--vydra-api-key <key>`                                                 |
| Kontrak         | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL dasar       | `https://www.vydra.ai/api/v1` (gunakan host `www`)                        |

<Warning>
  Gunakan `https://www.vydra.ai/api/v1` sebagai URL dasar. Host apex Vydra (`https://vydra.ai/api/v1`) saat ini mengalihkan ke `www`. Beberapa klien HTTP menghapus `Authorization` pada pengalihan lintas-host tersebut, yang mengubah kunci API valid menjadi kegagalan auth yang menyesatkan. Plugin bawaan menggunakan URL dasar `www` secara langsung untuk menghindari hal itu.
</Warning>

## Penyiapan

<Steps>
  <Step title="Jalankan onboarding interaktif">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Atau atur variabel env secara langsung:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Pilih kapabilitas default">
    Pilih satu atau beberapa kapabilitas di bawah ini (gambar, video, atau ucapan) dan terapkan konfigurasi yang sesuai.
  </Step>
</Steps>

## Kapabilitas

<AccordionGroup>
  <Accordion title="Pembuatan gambar">
    Model gambar default:

    - `vydra/grok-imagine`

    Tetapkan sebagai penyedia gambar default:

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

    Dukungan bawaan saat ini hanya teks-ke-gambar. Rute edit yang dihosting Vydra mengharapkan URL gambar jarak jauh, dan OpenClaw belum menambahkan jembatan unggah khusus Vydra di Plugin bawaan.

    <Note>
    Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Pembuatan video">
    Model video terdaftar:

    - `vydra/veo3` untuk teks-ke-video
    - `vydra/kling` untuk gambar-ke-video

    Tetapkan Vydra sebagai penyedia video default:

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

    - `vydra/veo3` dibundel hanya sebagai teks-ke-video.
    - `vydra/kling` saat ini memerlukan referensi URL gambar jarak jauh. Unggahan file lokal ditolak sejak awal.
    - Rute HTTP `kling` Vydra saat ini tidak konsisten mengenai apakah memerlukan `image_url` atau `video_url`; penyedia bawaan memetakan URL gambar jarak jauh yang sama ke kedua bidang.
    - Plugin bawaan tetap konservatif dan tidak meneruskan pengaturan gaya yang tidak terdokumentasi seperti rasio aspek, resolusi, watermark, atau audio yang dihasilkan.

    <Note>
    Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
    </Note>

  </Accordion>

  <Accordion title="Pengujian live video">
    Cakupan live khusus penyedia:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    File live Vydra bawaan kini mencakup:

    - `vydra/veo3` teks-ke-video
    - `vydra/kling` gambar-ke-video menggunakan URL gambar jarak jauh

    Timpa fixture gambar jarak jauh bila diperlukan:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sintesis ucapan">
    Tetapkan Vydra sebagai penyedia ucapan:

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
    - ID suara: `21m00Tcm4TlvDq8ikWAM`

    Plugin bawaan saat ini mengekspos satu suara default yang telah terbukti baik dan mengembalikan file audio MP3.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Direktori penyedia" href="/id/providers/index" icon="list">
    Jelajahi semua penyedia yang tersedia.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen dan konfigurasi model.
  </Card>
</CardGroup>
