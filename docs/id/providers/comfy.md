---
read_when:
    - Anda ingin menggunakan alur kerja ComfyUI lokal dengan OpenClaw
    - Anda ingin menggunakan Comfy Cloud dengan alur kerja gambar, video, atau musik
    - Anda memerlukan kunci config Plugin comfy bawaan
summary: Penyiapan generasi gambar, video, dan musik alur kerja ComfyUI di OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T09:22:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw mengirimkan Plugin `comfy` bawaan untuk run ComfyUI berbasis alur kerja. Plugin ini sepenuhnya digerakkan oleh alur kerja, sehingga OpenClaw tidak mencoba memetakan `size`, `aspectRatio`, `resolution`, `durationSeconds`, atau kontrol bergaya TTS generik ke graph Anda.

| Property        | Detail                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                           |
| Models          | `comfy/workflow`                                                                  |
| Shared surfaces | `image_generate`, `video_generate`, `music_generate`                              |
| Auth            | Tidak ada untuk ComfyUI lokal; `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` dan Comfy Cloud `/api/*`                 |

## Yang didukung

- Generasi gambar dari JSON alur kerja
- Penyuntingan gambar dengan 1 gambar referensi yang diunggah
- Generasi video dari JSON alur kerja
- Generasi video dengan 1 gambar referensi yang diunggah
- Generasi musik atau audio melalui alat bersama `music_generate`
- Unduh output dari Node yang dikonfigurasi atau semua Node output yang cocok

## Memulai

Pilih antara menjalankan ComfyUI di mesin Anda sendiri atau menggunakan Comfy Cloud.

<Tabs>
  <Tab title="Lokal">
    **Terbaik untuk:** menjalankan instance ComfyUI Anda sendiri di mesin atau LAN Anda.

    <Steps>
      <Step title="Mulai ComfyUI secara lokal">
        Pastikan instance ComfyUI lokal Anda sedang berjalan (default ke `http://127.0.0.1:8188`).
      </Step>
      <Step title="Siapkan JSON alur kerja Anda">
        Ekspor atau buat file JSON alur kerja ComfyUI. Catat ID Node untuk Node input prompt dan Node output yang ingin Anda baca oleh OpenClaw.
      </Step>
      <Step title="Konfigurasikan provider">
        Setel `mode: "local"` dan arahkan ke file alur kerja Anda. Berikut contoh gambar minimal:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Setel model default">
        Arahkan OpenClaw ke model `comfy/workflow` untuk kemampuan yang Anda konfigurasikan:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Terbaik untuk:** menjalankan alur kerja di Comfy Cloud tanpa mengelola sumber daya GPU lokal.

    <Steps>
      <Step title="Dapatkan kunci API">
        Daftar di [comfy.org](https://comfy.org) dan buat kunci API dari dasbor akun Anda.
      </Step>
      <Step title="Setel kunci API">
        Berikan kunci Anda melalui salah satu metode berikut:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Siapkan JSON alur kerja Anda">
        Ekspor atau buat file JSON alur kerja ComfyUI. Catat ID Node untuk Node input prompt dan Node output.
      </Step>
      <Step title="Konfigurasikan provider">
        Setel `mode: "cloud"` dan arahkan ke file alur kerja Anda:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        Mode cloud default `baseUrl` ke `https://cloud.comfy.org`. Anda hanya perlu menyetel `baseUrl` jika menggunakan endpoint cloud kustom.
        </Tip>
      </Step>
      <Step title="Setel model default">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfigurasi

Comfy mendukung pengaturan koneksi tingkat atas bersama plus section alur kerja per-kemampuan (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### Kunci bersama

| Key                   | Type                   | Description                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` or `"cloud"` | Mode koneksi.                                                                         |
| `baseUrl`             | string                 | Default ke `http://127.0.0.1:8188` untuk lokal atau `https://cloud.comfy.org` untuk cloud. |
| `apiKey`              | string                 | Kunci inline opsional, alternatif untuk var env `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Izinkan `baseUrl` privat/LAN dalam mode cloud.                                        |

### Kunci per-kemampuan

Kunci ini berlaku di dalam section `image`, `video`, atau `music`:

| Key                          | Required | Default  | Description                                                                  |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` or `workflowPath` | Ya       | --       | Path ke file JSON alur kerja ComfyUI.                                        |
| `promptNodeId`               | Ya       | --       | ID Node yang menerima prompt teks.                                           |
| `promptInputName`            | Tidak    | `"text"` | Nama input pada Node prompt.                                                 |
| `outputNodeId`               | Tidak    | --       | ID Node untuk membaca output. Jika dihilangkan, semua Node output yang cocok digunakan. |
| `pollIntervalMs`             | Tidak    | --       | Interval polling dalam milidetik untuk penyelesaian job.                     |
| `timeoutMs`                  | Tidak    | --       | Timeout dalam milidetik untuk run alur kerja.                                |

Section `image` dan `video` juga mendukung:

| Key                   | Required                             | Default   | Description                                         |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | Ya (saat mengirim gambar referensi)  | --        | ID Node yang menerima gambar referensi yang diunggah. |
| `inputImageInputName` | Tidak                                | `"image"` | Nama input pada Node gambar.                        |

## Detail alur kerja

<AccordionGroup>
  <Accordion title="Alur kerja gambar">
    Setel model gambar default ke `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Contoh penyuntingan gambar referensi:**

    Untuk mengaktifkan penyuntingan gambar dengan gambar referensi yang diunggah, tambahkan `inputImageNodeId` ke config gambar Anda:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Alur kerja video">
    Setel model video default ke `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Alur kerja video Comfy mendukung text-to-video dan image-to-video melalui graph yang dikonfigurasi.

    <Note>
    OpenClaw tidak meneruskan video input ke alur kerja Comfy. Hanya prompt teks dan gambar referensi tunggal yang didukung sebagai input.
    </Note>

  </Accordion>

  <Accordion title="Alur kerja musik">
    Plugin bawaan mendaftarkan provider music-generation untuk output audio atau musik yang didefinisikan alur kerja, yang dimunculkan melalui alat bersama `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Gunakan section config `music` untuk mengarah ke JSON alur kerja audio dan Node output Anda.

  </Accordion>

  <Accordion title="Kompatibilitas mundur">
    Config gambar tingkat atas yang sudah ada (tanpa section `image` bertingkat) tetap berfungsi:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw memperlakukan bentuk legacy itu sebagai config alur kerja gambar. Anda tidak perlu segera bermigrasi, tetapi section bertingkat `image` / `video` / `music` direkomendasikan untuk penyiapan baru.

    <Tip>
    Jika Anda hanya menggunakan generasi gambar, config legacy datar dan section `image` bertingkat baru setara secara fungsional.
    </Tip>

  </Accordion>

  <Accordion title="Pengujian live">
    Cakupan live opt-in ada untuk Plugin bawaan:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Pengujian live melewati kasus gambar, video, atau musik individual kecuali section alur kerja Comfy yang cocok sudah dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Image Generation" href="/id/tools/image-generation" icon="image">
    Konfigurasi dan penggunaan alat generasi gambar.
  </Card>
  <Card title="Video Generation" href="/id/tools/video-generation" icon="video">
    Konfigurasi dan penggunaan alat generasi video.
  </Card>
  <Card title="Music Generation" href="/id/tools/music-generation" icon="music">
    Penyiapan alat generasi musik dan audio.
  </Card>
  <Card title="Provider Directory" href="/id/providers/index" icon="layers">
    Ikhtisar semua provider dan ref model.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Referensi config lengkap termasuk default agen.
  </Card>
</CardGroup>
