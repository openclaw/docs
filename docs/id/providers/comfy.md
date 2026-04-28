---
read_when:
    - Anda ingin menggunakan alur kerja ComfyUI lokal dengan OpenClaw
    - Anda ingin menggunakan Comfy Cloud dengan alur kerja gambar, video, atau musik
    - Anda memerlukan kunci config Plugin comfy bawaan
summary: Pengaturan pembuatan gambar, video, dan musik alur kerja ComfyUI di OpenClaw
title: ComfyUI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:53:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw mengirim Plugin `comfy` bawaan untuk run ComfyUI berbasis alur kerja. Plugin ini sepenuhnya berbasis alur kerja, jadi OpenClaw tidak mencoba memetakan `size`, `aspectRatio`, `resolution`, `durationSeconds`, atau kontrol bergaya TTS generik ke graph Anda.

| Properti        | Detail                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                            |
| Model           | `comfy/workflow`                                                                   |
| Permukaan bersama | `image_generate`, `video_generate`, `music_generate`                             |
| Auth            | Tidak ada untuk ComfyUI lokal; `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` dan Comfy Cloud `/api/*`                  |

## Yang didukung

- Pembuatan gambar dari JSON alur kerja
- Pengeditan gambar dengan 1 gambar referensi yang diunggah
- Pembuatan video dari JSON alur kerja
- Pembuatan video dengan 1 gambar referensi yang diunggah
- Pembuatan musik atau audio melalui tool `music_generate` bersama
- Pengunduhan output dari node yang dikonfigurasi atau semua node output yang cocok

## Memulai

Pilih antara menjalankan ComfyUI di mesin Anda sendiri atau menggunakan Comfy Cloud.

<Tabs>
  <Tab title="Lokal">
    **Terbaik untuk:** menjalankan instance ComfyUI Anda sendiri di mesin atau LAN Anda.

    <Steps>
      <Step title="Mulai ComfyUI secara lokal">
        Pastikan instance ComfyUI lokal Anda berjalan (default ke `http://127.0.0.1:8188`).
      </Step>
      <Step title="Siapkan JSON alur kerja Anda">
        Ekspor atau buat file JSON alur kerja ComfyUI. Catat ID node untuk node input prompt dan node output yang ingin dibaca OpenClaw.
      </Step>
      <Step title="Konfigurasikan provider">
        Atur `mode: "local"` dan arahkan ke file alur kerja Anda. Berikut contoh gambar minimal:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
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
          },
        }
        ```
      </Step>
      <Step title="Atur model default">
        Arahkan OpenClaw ke model `comfy/workflow` untuk capability yang Anda konfigurasi:

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
    **Terbaik untuk:** menjalankan alur kerja di Comfy Cloud tanpa mengelola resource GPU lokal.

    <Steps>
      <Step title="Dapatkan API key">
        Daftar di [comfy.org](https://comfy.org) dan buat API key dari dashboard akun Anda.
      </Step>
      <Step title="Atur API key">
        Berikan key Anda melalui salah satu metode berikut:

        ```bash
        # Environment variable (disarankan)
        export COMFY_API_KEY="your-key"

        # Environment variable alternatif
        export COMFY_CLOUD_API_KEY="your-key"

        # Atau inline di config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Siapkan JSON alur kerja Anda">
        Ekspor atau buat file JSON alur kerja ComfyUI. Catat ID node untuk node input prompt dan node output.
      </Step>
      <Step title="Konfigurasikan provider">
        Atur `mode: "cloud"` dan arahkan ke file alur kerja Anda:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        Mode cloud secara default menggunakan `baseUrl` `https://cloud.comfy.org`. Anda hanya perlu mengatur `baseUrl` jika menggunakan endpoint cloud kustom.
        </Tip>
      </Step>
      <Step title="Atur model default">
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

Comfy mendukung pengaturan koneksi tingkat atas bersama plus bagian alur kerja per-capability (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### Kunci bersama

| Kunci                 | Tipe                   | Deskripsi                                                                                |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `mode`                | `"local"` atau `"cloud"` | Mode koneksi.                                                                          |
| `baseUrl`             | string                 | Default ke `http://127.0.0.1:8188` untuk lokal atau `https://cloud.comfy.org` untuk cloud. |
| `apiKey`              | string                 | Key inline opsional, alternatif dari env var `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`.  |
| `allowPrivateNetwork` | boolean                | Izinkan `baseUrl` private/LAN dalam mode cloud.                                          |

### Kunci per-capability

Kunci ini berlaku di dalam bagian `image`, `video`, atau `music`:

| Kunci                        | Wajib    | Default  | Deskripsi                                                                  |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` atau `workflowPath` | Ya     | --       | Path ke file JSON alur kerja ComfyUI.                                       |
| `promptNodeId`               | Ya       | --       | ID node yang menerima prompt teks.                                          |
| `promptInputName`            | Tidak    | `"text"` | Nama input pada node prompt.                                                |
| `outputNodeId`               | Tidak    | --       | ID node untuk membaca output. Jika dihilangkan, semua node output yang cocok digunakan. |
| `pollIntervalMs`             | Tidak    | --       | Interval polling dalam milidetik untuk penyelesaian pekerjaan.              |
| `timeoutMs`                  | Tidak    | --       | Timeout dalam milidetik untuk run alur kerja.                               |

Bagian `image` dan `video` juga mendukung:

| Kunci                 | Wajib                                 | Default   | Deskripsi                                            |
| --------------------- | ------------------------------------- | --------- | ---------------------------------------------------- |
| `inputImageNodeId`    | Ya (saat meneruskan gambar referensi) | --        | ID node yang menerima gambar referensi yang diunggah. |
| `inputImageInputName` | Tidak                                 | `"image"` | Nama input pada node gambar.                         |

## Detail alur kerja

<AccordionGroup>
  <Accordion title="Alur kerja gambar">
    Atur model gambar default ke `comfy/workflow`:

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

    **Contoh pengeditan gambar referensi:**

    Untuk mengaktifkan pengeditan gambar dengan gambar referensi yang diunggah, tambahkan `inputImageNodeId` ke config gambar Anda:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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
      },
    }
    ```

  </Accordion>

  <Accordion title="Alur kerja video">
    Atur model video default ke `comfy/workflow`:

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
    OpenClaw tidak meneruskan video input ke alur kerja Comfy. Hanya prompt teks dan satu gambar referensi yang didukung sebagai input.
    </Note>

  </Accordion>

  <Accordion title="Alur kerja musik">
    Plugin bawaan mendaftarkan provider pembuatan musik untuk output audio atau musik yang didefinisikan alur kerja, yang ditampilkan melalui tool `music_generate` bersama:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Gunakan bagian config `music` untuk mengarahkan ke JSON alur kerja audio dan node output Anda.

  </Accordion>

  <Accordion title="Kompatibilitas mundur">
    Config gambar tingkat atas yang sudah ada (tanpa bagian `image` bertingkat) tetap berfungsi:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw memperlakukan bentuk lama tersebut sebagai config alur kerja gambar. Anda tidak perlu segera bermigrasi, tetapi bagian bertingkat `image` / `video` / `music` disarankan untuk pengaturan baru.

    <Tip>
    Jika Anda hanya menggunakan pembuatan gambar, config datar lama dan bagian `image` bertingkat baru secara fungsional setara.
    </Tip>

  </Accordion>

  <Accordion title="Pengujian live">
    Cakupan live opt-in tersedia untuk plugin bawaan:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Pengujian live melewati kasus gambar, video, atau musik individual kecuali bagian alur kerja Comfy yang cocok telah dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan Gambar" href="/id/tools/image-generation" icon="image">
    Konfigurasi dan penggunaan tool pembuatan gambar.
  </Card>
  <Card title="Pembuatan Video" href="/id/tools/video-generation" icon="video">
    Konfigurasi dan penggunaan tool pembuatan video.
  </Card>
  <Card title="Pembuatan Musik" href="/id/tools/music-generation" icon="music">
    Pengaturan tool pembuatan musik dan audio.
  </Card>
  <Card title="Direktori Provider" href="/id/providers/index" icon="layers">
    Ikhtisar semua provider dan referensi model.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Referensi config lengkap termasuk default agen.
  </Card>
</CardGroup>
