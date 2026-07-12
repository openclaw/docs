---
read_when:
    - Anda ingin membuat media Vydra di OpenClaw
    - Anda memerlukan panduan penyiapan kunci API Vydra
summary: Gunakan gambar, video, dan suara Vydra di OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T14:37:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra bawaan menambahkan:

- Pembuatan gambar melalui `vydra/grok-imagine`
- Pembuatan video melalui `vydra/veo3` (teks-ke-video) dan `vydra/kling` (gambar-ke-video)
- Sintesis ucapan melalui rute TTS Vydra yang didukung ElevenLabs

OpenClaw menggunakan `VYDRA_API_KEY` yang sama untuk ketiga kemampuan tersebut.

| Properti                    | Nilai                                                                     |
| --------------------------- | ------------------------------------------------------------------------- |
| ID penyedia                 | `vydra`                                                                   |
| Plugin                      | bawaan, `enabledByDefault: true`                                           |
| Variabel lingkungan autentikasi | `VYDRA_API_KEY`                                                       |
| Flag orientasi awal         | `--auth-choice vydra-api-key`                                             |
| Flag CLI langsung           | `--vydra-api-key <key>`                                                   |
| Kontrak                     | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL dasar                   | `https://www.vydra.ai/api/v1` (gunakan host `www`)                         |

<Warning>
Gunakan `https://www.vydra.ai/api/v1` sebagai URL dasar. Host apex Vydra (`https://vydra.ai/api/v1`) saat ini mengalihkan ke `www`. Beberapa klien HTTP menghapus `Authorization` saat pengalihan lintas host tersebut, sehingga kunci API yang valid tampak mengalami kegagalan autentikasi yang menyesatkan. Plugin bawaan menormalisasi setiap URL dasar `vydra.ai` yang dikonfigurasi menjadi `www.vydra.ai` untuk menghindari hal tersebut.
</Warning>

## Penyiapan

<Steps>
  <Step title="Jalankan orientasi awal interaktif">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Atau tetapkan variabel lingkungan secara langsung:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Pilih kemampuan default">
    Pilih satu atau beberapa kemampuan di bawah ini (gambar, video, atau ucapan), lalu terapkan konfigurasi yang sesuai.
  </Step>
</Steps>

## Kemampuan

<AccordionGroup>
  <Accordion title="Pembuatan gambar">
    Model gambar bawaan default dan satu-satunya:

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

    Dukungan bawaan hanya mencakup teks-ke-gambar, dengan maksimal satu gambar per permintaan. Rute penyuntingan yang dihosting Vydra mengharapkan URL gambar jarak jauh, dan Plugin bawaan tidak menambahkan jembatan unggahan khusus Vydra.

    <Note>
    Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku pengalihan saat gagal.
    </Note>

  </Accordion>

  <Accordion title="Pembuatan video">
    Model video yang terdaftar:

    - `vydra/veo3` untuk teks-ke-video (menolak masukan referensi gambar)
    - `vydra/kling` untuk gambar-ke-video (memerlukan tepat satu URL gambar jarak jauh)

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

    - `vydra/kling` langsung menolak unggahan berkas lokal; hanya referensi URL gambar jarak jauh yang dapat digunakan.
    - Rute HTTP `kling` Vydra tidak konsisten mengenai apakah rute tersebut memerlukan `image_url` atau `video_url`; penyedia bawaan mengirim URL gambar jarak jauh yang sama pada kedua bidang.
    - Plugin bawaan tetap konservatif dan tidak meneruskan pengaturan gaya yang tidak terdokumentasi seperti rasio aspek, resolusi, tanda air, atau audio yang dihasilkan.

    <Note>
    Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku pengalihan saat gagal.
    </Note>

  </Accordion>

  <Accordion title="Pengujian langsung video">
    Cakupan pengujian langsung khusus penyedia:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Berkas pengujian langsung Vydra bawaan mencakup:

    - `vydra/veo3` teks-ke-video
    - `vydra/kling` gambar-ke-video menggunakan URL gambar jarak jauh

    Ganti fixture gambar jarak jauh bila diperlukan:

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
    - ID suara: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    Plugin bawaan menyediakan satu suara default yang telah diketahui berfungsi dengan baik ini dan mengembalikan berkas audio MP3.

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
