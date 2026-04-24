---
read_when:
    - Anda ingin menggunakan generasi video Alibaba Wan di OpenClaw
    - Anda memerlukan penyiapan API key Model Studio atau DashScope untuk generasi video
summary: Generasi video Alibaba Model Studio Wan di OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T09:21:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw menyertakan provider generasi video `alibaba` bawaan untuk model Wan di
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Auth yang dipilih: `MODELSTUDIO_API_KEY`
- Juga diterima: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: generasi video async DashScope / Model Studio

## Memulai

<Steps>
  <Step title="Setel API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Setel model video default">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifikasi bahwa provider tersedia">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Salah satu key auth yang diterima (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) akan berfungsi. Pilihan onboarding `qwen-standard-api-key` mengonfigurasi kredensial DashScope bersama.
</Note>

## Model Wan bawaan

Provider `alibaba` bawaan saat ini mendaftarkan:

| Ref model                  | Mode                        |
| -------------------------- | --------------------------- |
| `alibaba/wan2.6-t2v`       | Text-to-video               |
| `alibaba/wan2.6-i2v`       | Image-to-video              |
| `alibaba/wan2.6-r2v`       | Reference-to-video          |
| `alibaba/wan2.6-r2v-flash` | Reference-to-video (cepat)  |
| `alibaba/wan2.7-r2v`       | Reference-to-video          |

## Batas saat ini

| Parameter             | Batas                                                     |
| --------------------- | --------------------------------------------------------- |
| Video output          | Hingga **1** per permintaan                               |
| Gambar input          | Hingga **1**                                              |
| Video input           | Hingga **4**                                              |
| Durasi                | Hingga **10 detik**                                       |
| Kontrol yang didukung | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Gambar/video referensi | Hanya URL `http(s)` remote                               |

<Warning>
Mode gambar/video referensi saat ini memerlukan **URL http(s) remote**. Path file lokal tidak didukung untuk input referensi.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Hubungan dengan Qwen">
    Provider `qwen` bawaan juga menggunakan endpoint DashScope yang di-host Alibaba untuk
    generasi video Wan. Gunakan:

    - `qwen/...` saat Anda menginginkan permukaan provider Qwen kanonis
    - `alibaba/...` saat Anda menginginkan permukaan video Wan milik vendor langsung

    Lihat [dokumentasi provider Qwen](/id/providers/qwen) untuk detail lebih lanjut.

  </Accordion>

  <Accordion title="Prioritas key auth">
    OpenClaw memeriksa key auth dalam urutan ini:

    1. `MODELSTUDIO_API_KEY` (dipilih)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Salah satu dari ini akan mengautentikasi provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Generasi video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Qwen" href="/id/providers/qwen" icon="microchip">
    Penyiapan provider Qwen dan integrasi DashScope.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agen dan konfigurasi model.
  </Card>
</CardGroup>
