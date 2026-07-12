---
read_when:
    - Anda ingin menggunakan alur kerja ComfyUI lokal dengan OpenClaw
    - Anda ingin menggunakan Comfy Cloud dengan alur kerja gambar, video, atau musik
    - Anda memerlukan kunci konfigurasi plugin comfy bawaan
summary: Penyiapan pembuatan gambar, video, dan musik dengan alur kerja ComfyUI di OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T14:34:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw menyertakan Plugin `comfy` bawaan untuk menjalankan ComfyUI berbasis alur kerja. Plugin ini sepenuhnya digerakkan oleh alur kerja: OpenClaw tidak memetakan kontrol umum seperti `size`, `aspectRatio`, `resolution`, `durationSeconds`, atau kontrol bergaya TTS ke grafik Anda.

| Properti        | Detail                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Penyedia        | `comfy`                                                                                        |
| Model           | `comfy/workflow`                                                                               |
| Alat bersama    | `image_generate`, `video_generate`, `music_generate`                                           |
| Autentikasi     | Tidak ada untuk ComfyUI lokal; `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk Comfy Cloud     |
| API             | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                                 |

## Yang didukung

- Pembuatan dan penyuntingan gambar dari JSON alur kerja (penyuntingan menerima 1 gambar referensi yang diunggah)
- Pembuatan video dari JSON alur kerja, teks-ke-video atau gambar-ke-video (1 gambar referensi)
- Pembuatan musik/audio melalui alat bersama `music_generate`, dengan 1 gambar referensi opsional
- Pengunduhan keluaran dari Node yang dikonfigurasi, atau dari semua Node keluaran yang cocok jika tidak ada yang dikonfigurasi

## Memulai

Pilih antara menjalankan ComfyUI di mesin Anda sendiri atau menggunakan Comfy Cloud.

<Tabs>
  <Tab title="Lokal">
    **Paling sesuai untuk:** menjalankan instans ComfyUI Anda sendiri di mesin atau LAN Anda.

    <Steps>
      <Step title="Jalankan ComfyUI secara lokal">
        Pastikan instans ComfyUI lokal Anda sedang berjalan (nilai bawaan `http://127.0.0.1:8188`).
      </Step>
      <Step title="Siapkan JSON alur kerja Anda">
        Ekspor atau buat berkas JSON alur kerja ComfyUI. Catat ID Node untuk Node masukan perintah dan Node keluaran yang ingin dibaca OpenClaw.
      </Step>
      <Step title="Konfigurasikan penyedia">
        Tetapkan `mode: "local"` dan arahkan ke berkas alur kerja Anda. Contoh gambar minimal:

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
      <Step title="Tetapkan model bawaan">
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
    **Paling sesuai untuk:** menjalankan alur kerja di Comfy Cloud tanpa mengelola sumber daya GPU lokal.

    <Steps>
      <Step title="Dapatkan kunci API">
        Daftar di [comfy.org](https://comfy.org) dan buat kunci API dari dasbor akun Anda.
      </Step>
      <Step title="Tetapkan kunci API">
        Berikan kunci Anda melalui salah satu metode berikut:

        ```bash
        # Flag orientasi awal
        openclaw onboard --comfy-api-key "your-key"

        # Variabel lingkungan (disarankan untuk daemon)
        export COMFY_API_KEY="your-key"

        # Variabel lingkungan alternatif
        export COMFY_CLOUD_API_KEY="your-key"

        # Atau langsung di konfigurasi
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Siapkan JSON alur kerja Anda">
        Ekspor atau buat berkas JSON alur kerja ComfyUI. Catat ID Node untuk Node masukan perintah dan Node keluaran.
      </Step>
      <Step title="Konfigurasikan penyedia">
        Tetapkan `mode: "cloud"` dan arahkan ke berkas alur kerja Anda:

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
        Mode cloud menetapkan nilai bawaan `baseUrl` ke `https://cloud.comfy.org`. Tetapkan `baseUrl` hanya untuk titik akhir cloud khusus.
        </Tip>
      </Step>
      <Step title="Tetapkan model bawaan">
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

Comfy mendukung pengaturan koneksi tingkat atas bersama serta bagian alur kerja per kemampuan (`image`, `video`, `music`):

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

| Kunci                 | Jenis                  | Deskripsi                                                                                     |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` atau `"cloud"` | Mode koneksi. Nilai bawaan adalah `"local"`.                                                 |
| `baseUrl`             | string                 | Nilai bawaan `http://127.0.0.1:8188` untuk lokal atau `https://cloud.comfy.org` untuk cloud.  |
| `apiKey`              | string                 | Kunci langsung opsional, sebagai alternatif variabel lingkungan `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Izinkan `baseUrl` privat/LAN dalam mode cloud atau FQDN DNS privat lokal.                     |

<Note>
Dalam mode `local`, literal IP loopback/privat dan nama layanan berlabel tunggal seperti `http://comfyui:8188` berfungsi tanpa `allowPrivateNetwork`. FQDN DNS privat yang tampak publik seperti `https://comfy.local.example.com` memerlukan `allowPrivateNetwork: true`. Kepercayaan terhadap asal privat tetap dibatasi pada skema, nama host, dan porta yang dikonfigurasi; pengalihan lokal tidak dapat meninggalkan nama host yang dikonfigurasi, sedangkan pengalihan cloud ke CDN publik diperiksa menggunakan kebijakan SSRF bawaan.
</Note>

### Kunci per kemampuan

Kunci berikut berlaku di dalam bagian `image`, `video`, atau `music`:

| Kunci                        | Wajib | Bawaan   | Deskripsi                                                                         |
| ---------------------------- | ----- | -------- | --------------------------------------------------------------------------------- |
| `workflow` atau `workflowPath` | Ya  | --       | JSON alur kerja langsung, atau jalur ke berkas JSON alur kerja ComfyUI.           |
| `promptNodeId`               | Ya    | --       | ID Node yang menerima perintah teks.                                              |
| `promptInputName`            | Tidak | `"text"` | Nama masukan pada Node perintah.                                                  |
| `outputNodeId`               | Tidak | --       | ID Node tempat keluaran dibaca. Jika dihilangkan, semua Node keluaran yang cocok akan digunakan. |
| `pollIntervalMs`             | Tidak | `1500`   | Interval polling dalam milidetik untuk penyelesaian tugas.                        |
| `timeoutMs`                  | Tidak | `300000` | Batas waktu dalam milidetik untuk menjalankan alur kerja.                         |

Bagian `image` dan `video` juga mendukung Node masukan gambar referensi:

| Kunci                 | Wajib                                      | Bawaan   | Deskripsi                                               |
| --------------------- | ------------------------------------------ | -------- | ------------------------------------------------------- |
| `inputImageNodeId`    | Ya (saat meneruskan gambar referensi)      | --       | ID Node yang menerima gambar referensi yang diunggah.   |
| `inputImageInputName` | Tidak                                      | `"image"` | Nama masukan pada Node gambar.                          |

`apiKey` menerima string literal atau objek [referensi rahasia](/id/gateway/configuration-reference#secrets).

## Detail alur kerja

<AccordionGroup>
  <Accordion title="Alur kerja gambar">
    Tetapkan model gambar bawaan ke `comfy/workflow`:

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

    Untuk mengaktifkan penyuntingan gambar dengan gambar referensi yang diunggah, tambahkan `inputImageNodeId` ke konfigurasi gambar Anda:

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
    Tetapkan model video bawaan ke `comfy/workflow`:

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

    Alur kerja video Comfy mendukung teks-ke-video dan gambar-ke-video melalui grafik yang dikonfigurasi.

    <Note>
    OpenClaw tidak meneruskan video masukan ke alur kerja Comfy. Hanya perintah teks dan satu gambar referensi yang didukung sebagai masukan.
    </Note>

  </Accordion>

  <Accordion title="Alur kerja musik">
    Plugin bawaan mendaftarkan penyedia pembuatan musik untuk keluaran audio atau musik yang ditentukan oleh alur kerja, dan menyediakannya melalui alat bersama `music_generate`. Alat ini menerima satu gambar referensi opsional (maksimal 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Gunakan bagian konfigurasi `music` untuk mengarahkan ke JSON alur kerja audio dan Node keluaran Anda.

  </Accordion>

  <Accordion title="Kompatibilitas mundur">
    Konfigurasi gambar tingkat atas yang sudah ada (tanpa bagian `image` bertingkat) tetap berfungsi:

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

    OpenClaw memperlakukan bentuk lama tersebut sebagai konfigurasi alur kerja gambar. Anda tidak perlu segera melakukan migrasi, tetapi bagian `image` / `video` / `music` bertingkat disarankan untuk penyiapan baru. Jika Anda hanya menggunakan pembuatan gambar, konfigurasi datar lama dan bagian `image` bertingkat yang baru setara secara fungsional.

  </Accordion>

  <Accordion title="Pengujian langsung">
    Cakupan pengujian langsung opsional tersedia untuk Plugin bawaan:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Pengujian langsung melewati kasus gambar, video, atau musik secara terpisah kecuali bagian alur kerja Comfy yang sesuai telah dikonfigurasi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan Gambar" href="/id/tools/image-generation" icon="image">
    Konfigurasi dan penggunaan alat pembuatan gambar.
  </Card>
  <Card title="Pembuatan Video" href="/id/tools/video-generation" icon="video">
    Konfigurasi dan penggunaan alat pembuatan video.
  </Card>
  <Card title="Pembuatan Musik" href="/id/tools/music-generation" icon="music">
    Penyiapan alat pembuatan musik dan audio.
  </Card>
  <Card title="Direktori Penyedia" href="/id/providers/index" icon="layers">
    Ikhtisar semua penyedia dan referensi model.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Referensi konfigurasi lengkap termasuk nilai default agen.
  </Card>
</CardGroup>
