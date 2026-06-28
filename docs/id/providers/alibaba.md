---
read_when:
    - Anda ingin menggunakan pembuatan video Alibaba Wan di OpenClaw
    - Anda perlu menyiapkan kunci API Model Studio atau DashScope untuk pembuatan video
summary: Pembuatan video Alibaba Model Studio Wan di OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:24:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw menyertakan Plugin `alibaba` bawaan yang mendaftarkan penyedia pembuatan video untuk model Wan di Alibaba Model Studio (nama internasional untuk DashScope). Plugin ini diaktifkan secara default; Anda hanya perlu menetapkan API key.

| Properti         | Nilai                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| ID penyedia      | `alibaba`                                                                       |
| Plugin           | bawaan, `enabledByDefault: true`                                                |
| Variabel env auth | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (kecocokan pertama menang) |
| Flag onboarding  | `--auth-choice alibaba-model-studio-api-key`                                    |
| Flag CLI langsung | `--alibaba-model-studio-api-key <key>`                                          |
| Model default    | `alibaba/wan2.6-t2v`                                                            |
| URL dasar default | `https://dashscope-intl.aliyuncs.com`                                           |

## Memulai

<Steps>
  <Step title="Tetapkan API key">
    Gunakan onboarding untuk menyimpan key pada penyedia `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Atau teruskan key secara langsung selama instalasi/onboarding:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Atau ekspor salah satu variabel env yang diterima sebelum memulai Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Tetapkan model video default">
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
  <Step title="Verifikasi bahwa penyedia telah dikonfigurasi">
    ```bash
    openclaw models list --provider alibaba
    ```

    Daftar tersebut seharusnya menyertakan kelima model Wan bawaan. Jika `MODELSTUDIO_API_KEY` belum terselesaikan, `openclaw models status --json` melaporkan kredensial yang hilang di bawah `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Plugin Alibaba dan [Plugin Qwen](/id/providers/qwen) sama-sama mengautentikasi ke DashScope dan menerima variabel env yang saling tumpang tindih. Gunakan ID model `alibaba/...` untuk menjalankan permukaan video Wan khusus; gunakan ID `qwen/...` saat Anda menginginkan permukaan chat, embedding, atau pemahaman media Qwen.
</Note>

## Model Wan bawaan

| Ref model                  | Mode                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Teks-ke-video (default)   |
| `alibaba/wan2.6-i2v`       | Gambar-ke-video           |
| `alibaba/wan2.6-r2v`       | Referensi-ke-video        |
| `alibaba/wan2.6-r2v-flash` | Referensi-ke-video (cepat) |
| `alibaba/wan2.7-r2v`       | Referensi-ke-video        |

## Kemampuan dan batasan

Penyedia bawaan ini mencerminkan batas API video Wan DashScope. Ketiga mode memiliki jumlah video dan batas durasi per permintaan yang sama; hanya bentuk inputnya yang berbeda.

| Mode               | Video output maks | Gambar input maks | Video input maks | Durasi maks | Kontrol yang didukung                                    |
| ------------------ | ----------------- | ----------------- | ---------------- | ----------- | --------------------------------------------------------- |
| Teks-ke-video      | 1                 | n/a               | n/a              | 10 dtk      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Gambar-ke-video    | 1                 | 1                 | n/a              | 10 dtk      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referensi-ke-video | 1                 | n/a               | 4                | 10 dtk      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Saat permintaan menghilangkan `durationSeconds`, penyedia mengirim default yang diterima DashScope sebesar **5 detik**. Tetapkan `durationSeconds` secara eksplisit pada [alat pembuatan video](/id/tools/video-generation) untuk memperpanjang hingga 10 dtk.

<Warning>
  Input gambar dan video referensi harus berupa URL `http(s)` jarak jauh. Jalur file lokal tidak diterima oleh mode referensi DashScope; unggah ke object storage terlebih dahulu atau gunakan alur [alat media](/id/tools/media-overview) yang sudah menghasilkan URL publik.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Timpa URL dasar DashScope">
    Penyedia menggunakan endpoint DashScope internasional secara default. Untuk menargetkan endpoint region Tiongkok, tetapkan:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Penyedia menghapus garis miring penutup sebelum menyusun URL task AIGC.

  </Accordion>

  <Accordion title="Prioritas env auth">
    OpenClaw menyelesaikan API key Alibaba dari variabel lingkungan dalam urutan ini, dengan mengambil nilai pertama yang tidak kosong:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Entri `auth.profiles` yang dikonfigurasi (ditetapkan melalui `openclaw models auth login`) menimpa resolusi variabel env. Lihat [Profil auth di FAQ model](/id/help/faq-models#what-is-an-auth-profile) untuk rotasi profil, cooldown, dan mekanisme penimpaan.

  </Accordion>

  <Accordion title="Hubungan dengan Plugin Qwen">
    Kedua Plugin bawaan berkomunikasi dengan DashScope dan menerima API key yang saling tumpang tindih. Gunakan:

    - ID `alibaba/wan*.*` untuk menjalankan penyedia video Wan khusus yang didokumentasikan di halaman ini.
    - ID `qwen/*` untuk chat, embedding, dan pemahaman media Qwen (lihat [Qwen](/id/providers/qwen)).

    Menetapkan `MODELSTUDIO_API_KEY` sekali akan mengautentikasi kedua Plugin karena daftar variabel env auth sengaja saling tumpang tindih; Anda tidak perlu melakukan onboarding tiap Plugin secara terpisah.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Qwen" href="/id/providers/qwen" icon="microchip">
    Penyiapan chat, embedding, dan pemahaman media Qwen pada auth DashScope yang sama.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Default agent dan konfigurasi model.
  </Card>
  <Card title="FAQ model" href="/id/help/faq-models" icon="circle-question">
    Profil auth, mengganti model, dan menyelesaikan error "no profile".
  </Card>
</CardGroup>
