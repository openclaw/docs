---
read_when:
    - Anda menginginkan model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T09:29:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

Default penyedia MiniMax OpenClaw adalah **MiniMax M2.7**.

MiniMax juga menyediakan:

- Sintesis ucapan bawaan melalui T2A v2
- Pemahaman gambar bawaan melalui `MiniMax-VL-01`
- Pembuatan musik bawaan melalui `music-2.6`
- `web_search` bawaan melalui API pencarian MiniMax Token Plan

Pemisahan penyedia:

| ID Penyedia      | Autentikasi | Kapabilitas                                                                                         |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Kunci API   | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan, pencarian web |
| `minimax-portal` | OAuth       | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan                 |

## Katalog bawaan

| Model                    | Jenis            | Deskripsi                                |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (penalaran) | Model penalaran hosted default           |
| `MiniMax-M2.7-highspeed` | Chat (penalaran) | Tingkat penalaran M2.7 yang lebih cepat  |
| `MiniMax-VL-01`          | Visi             | Model pemahaman gambar                   |
| `image-01`               | Pembuatan gambar | Pengeditan teks-ke-gambar dan gambar-ke-gambar |
| `music-2.6`              | Pembuatan musik  | Model musik default                      |
| `music-2.5`              | Pembuatan musik  | Tingkat pembuatan musik sebelumnya       |
| `music-2.0`              | Pembuatan musik  | Tingkat pembuatan musik lama             |
| `MiniMax-Hailuo-2.3`     | Pembuatan video  | Alur teks-ke-video dan referensi gambar  |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Paling cocok untuk:** penyiapan cepat dengan MiniMax Coding Plan melalui OAuth, tanpa memerlukan kunci API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Ini mengautentikasi terhadap `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Ini mengautentikasi terhadap `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Penyiapan OAuth menggunakan id penyedia `minimax-portal`. Referensi model mengikuti bentuk `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Paling cocok untuk:** MiniMax hosted dengan API yang kompatibel dengan Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Ini mengonfigurasi `api.minimax.io` sebagai URL dasar.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Ini mengonfigurasi `api.minimaxi.com` sebagai URL dasar.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Contoh konfigurasi

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan pemikiran MiniMax secara default kecuali Anda secara eksplisit menetapkan `thinking` sendiri. Endpoint streaming MiniMax memancarkan `reasoning_content` dalam potongan delta bergaya OpenAI, bukan blok pemikiran Anthropic native, yang dapat membocorkan penalaran internal ke keluaran yang terlihat jika dibiarkan aktif secara implisit.
    </Warning>

    <Note>
    Penyiapan kunci API menggunakan id penyedia `minimax`. Referensi model mengikuti bentuk `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfigurasikan melalui `openclaw configure`

Gunakan wizard konfigurasi interaktif untuk mengatur MiniMax tanpa mengedit JSON:

<Steps>
  <Step title="Luncurkan wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Pilih Model/auth">
    Pilih **Model/auth** dari menu.
  </Step>
  <Step title="Pilih opsi auth MiniMax">
    Pilih salah satu opsi MiniMax yang tersedia:

    | Pilihan auth | Deskripsi |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internasional (Paket Coding) |
    | `minimax-cn-oauth` | OAuth Tiongkok (Paket Coding) |
    | `minimax-global-api` | Kunci API internasional |
    | `minimax-cn-api` | Kunci API Tiongkok |

  </Step>
  <Step title="Pilih model default Anda">
    Pilih model default Anda saat diminta.
  </Step>
</Steps>

## Kemampuan

### Pembuatan gambar

Plugin MiniMax mendaftarkan model `image-01` untuk alat `image_generate`. Model ini mendukung:

- **Pembuatan teks-ke-gambar** dengan kontrol rasio aspek
- **Pengeditan gambar-ke-gambar** (referensi subjek) dengan kontrol rasio aspek
- Hingga **9 gambar keluaran** per permintaan
- Hingga **1 gambar referensi** per permintaan edit
- Rasio aspek yang didukung: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Untuk menggunakan MiniMax untuk pembuatan gambar, tetapkan sebagai penyedia pembuatan gambar:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin menggunakan `MINIMAX_API_KEY` atau auth OAuth yang sama seperti model teks. Tidak diperlukan konfigurasi tambahan jika MiniMax sudah disiapkan.

Baik `minimax` maupun `minimax-portal` mendaftarkan `image_generate` dengan model
`image-01` yang sama. Penyiapan kunci API menggunakan `MINIMAX_API_KEY`; penyiapan OAuth dapat menggunakan
jalur auth `minimax-portal` bawaan sebagai gantinya.

Pembuatan gambar selalu menggunakan endpoint gambar khusus MiniMax
(`/v1/image_generation`) dan mengabaikan `models.providers.minimax.baseUrl`,
karena kolom tersebut mengonfigurasi URL dasar chat/kompatibel Anthropic. Tetapkan
`MINIMAX_API_HOST=https://api.minimaxi.com` untuk merutekan pembuatan gambar
melalui endpoint CN; endpoint global default adalah
`https://api.minimax.io`.

Saat onboarding atau penyiapan kunci API menulis entri `models.providers.minimax`
eksplisit, OpenClaw mewujudkan `MiniMax-M2.7` dan
`MiniMax-M2.7-highspeed` sebagai model chat khusus teks. Pemahaman gambar
diekspos secara terpisah melalui penyedia media `MiniMax-VL-01` milik Plugin.

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Teks-ke-ucapan

Plugin `minimax` bawaan mendaftarkan MiniMax T2A v2 sebagai penyedia ucapan untuk
`messages.tts`.

- Model TTS default: `speech-2.8-hd`
- Suara default: `English_expressive_narrator`
- ID model bawaan yang didukung mencakup `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, dan `speech-01-turbo`.
- Resolusi auth adalah `messages.tts.providers.minimax.apiKey`, lalu
  profil auth OAuth/token `minimax-portal`, lalu kunci lingkungan Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), lalu `MINIMAX_API_KEY`.
- Jika tidak ada host TTS yang dikonfigurasi, OpenClaw menggunakan kembali host OAuth
  `minimax-portal` yang dikonfigurasi dan menghapus sufiks jalur kompatibel Anthropic
  seperti `/anthropic`.
- Lampiran audio normal tetap MP3.
- Target catatan suara seperti Feishu dan Telegram ditranskode dari MP3 MiniMax
  ke Opus 48kHz dengan `ffmpeg`, karena API file Feishu/Lark hanya
  menerima `file_type: "opus"` untuk pesan audio native.
- MiniMax T2A menerima `speed` dan `vol` pecahan, tetapi `pitch` dikirim sebagai
  bilangan bulat; OpenClaw memotong nilai `pitch` pecahan sebelum permintaan API.

| Pengaturan                              | Variabel env           | Default                       | Deskripsi                         |
| --------------------------------------- | ---------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.             |
| `messages.tts.providers.minimax.model`  | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID model TTS.                     |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID suara yang digunakan untuk keluaran ucapan. |
| `messages.tts.providers.minimax.speed`  |                        | `1.0`                         | Kecepatan pemutaran, `0.5..2.0`.  |
| `messages.tts.providers.minimax.vol`    |                        | `1.0`                         | Volume, `(0, 10]`.                |
| `messages.tts.providers.minimax.pitch`  |                        | `0`                           | Pergeseran pitch bilangan bulat, `-12..12`. |

### Pembuatan musik

Plugin MiniMax bawaan mendaftarkan pembuatan musik melalui alat bersama
`music_generate` untuk `minimax` dan `minimax-portal`.

- Model musik default: `minimax/music-2.6`
- Model musik OAuth: `minimax-portal/music-2.6`
- Juga mendukung `minimax/music-2.5` dan `minimax/music-2.0`
- Kontrol prompt: `lyrics`, `instrumental`, `durationSeconds`
- Format keluaran: `mp3`
- Eksekusi berbasis sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

Untuk menggunakan MiniMax sebagai penyedia musik default:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Musik](/id/tools/music-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Pembuatan video

Plugin MiniMax bawaan mendaftarkan pembuatan video melalui alat bersama
`video_generate` untuk `minimax` dan `minimax-portal`.

- Model video default: `minimax/MiniMax-Hailuo-2.3`
- Model video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Mode: alur teks-ke-video dan referensi satu gambar
- Mendukung `aspectRatio` dan `resolution`

Untuk menggunakan MiniMax sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku peralihan cadangan.
</Note>

### Pemahaman gambar

Plugin MiniMax mendaftarkan pemahaman gambar secara terpisah dari katalog teks:

| ID penyedia      | Model gambar bawaan |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Itulah mengapa perutean media otomatis dapat menggunakan pemahaman gambar MiniMax bahkan saat katalog penyedia teks bawaan masih menampilkan referensi obrolan M2.7 khusus teks.

### Pencarian web

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Token Plan.

- ID penyedia: `minimax`
- Hasil terstruktur: judul, URL, cuplikan, kueri terkait
- Variabel lingkungan yang disarankan: `MINIMAX_CODE_PLAN_KEY`
- Alias lingkungan yang diterima: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Cadangan kompatibilitas: `MINIMAX_API_KEY` saat sudah mengarah ke kredensial Token Plan
- Penggunaan ulang wilayah: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, lalu URL dasar penyedia MiniMax
- Pencarian tetap berada pada ID penyedia `minimax`; penyiapan OAuth CN/global dapat mengarahkan wilayah secara tidak langsung melalui `models.providers.minimax-portal.baseUrl` dan dapat menyediakan autentikasi Bearer melalui `MINIMAX_OAUTH_TOKEN`

Konfigurasi berada di bawah `plugins.entries.minimax.config.webSearch.*`.

<Note>
Lihat [Pencarian MiniMax](/id/tools/minimax-search) untuk konfigurasi dan penggunaan pencarian web lengkap.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Opsi konfigurasi">
    | Opsi | Deskripsi |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Utamakan `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` opsional untuk muatan yang kompatibel dengan OpenAI |
    | `models.providers.minimax.api` | Utamakan `anthropic-messages`; `openai-completions` opsional untuk muatan yang kompatibel dengan OpenAI |
    | `models.providers.minimax.apiKey` | Kunci API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Tentukan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Beri alias pada model yang ingin Anda masukkan ke daftar izin |
    | `models.mode` | Pertahankan `merge` jika Anda ingin menambahkan MiniMax bersama bawaan |
  </Accordion>

  <Accordion title="Nilai bawaan pemikiran">
    Pada `api: "anthropic-messages"`, OpenClaw menyuntikkan `thinking: { type: "disabled" }` kecuali thinking sudah ditetapkan secara eksplisit di parameter/konfigurasi.

    Ini mencegah titik akhir streaming MiniMax menghasilkan `reasoning_content` dalam potongan delta bergaya OpenAI, yang akan membocorkan penalaran internal ke keluaran yang terlihat.

  </Accordion>

  <Accordion title="Mode cepat">
    `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed` pada jalur streaming yang kompatibel dengan Anthropic.
  </Accordion>

  <Accordion title="Contoh cadangan">
    **Paling cocok untuk:** mempertahankan model generasi terbaru terkuat Anda sebagai utama, dengan MiniMax M2.7 sebagai cadangan. Contoh di bawah menggunakan Opus sebagai model utama konkret; ganti dengan model utama generasi terbaru pilihan Anda.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Detail penggunaan Coding Plan">
    - API penggunaan Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` atau `https://api.minimax.io/v1/token_plan/remains` (memerlukan kunci Coding Plan).
    - Polling penggunaan mengambil host dari `models.providers.minimax-portal.baseUrl` atau `models.providers.minimax.baseUrl` saat dikonfigurasi, sehingga penyiapan global yang menggunakan `https://api.minimax.io/anthropic` melakukan polling ke `api.minimax.io`. URL dasar yang hilang atau salah format tetap menggunakan cadangan CN demi kompatibilitas.
    - OpenClaw menormalkan penggunaan Coding Plan MiniMax ke tampilan `% left` yang sama dengan yang digunakan penyedia lain. Bidang mentah MiniMax `usage_percent` / `usagePercent` adalah kuota tersisa, bukan kuota terpakai, sehingga OpenClaw membalikkannya. Bidang berbasis hitungan diutamakan saat ada.
    - Saat API mengembalikan `model_remains`, OpenClaw memprioritaskan entri model obrolan, memperoleh label jendela dari `start_time` / `end_time` bila diperlukan, dan menyertakan nama model yang dipilih dalam label paket agar jendela Coding Plan lebih mudah dibedakan.
    - Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai cakupan kuota MiniMax yang sama, dan memprioritaskan OAuth MiniMax yang tersimpan sebelum menggunakan variabel lingkungan kunci Coding Plan sebagai cadangan.

  </Accordion>
</AccordionGroup>

## Catatan

- Referensi model mengikuti jalur autentikasi:
  - Penyiapan kunci API: `minimax/<model>`
  - Penyiapan OAuth: `minimax-portal/<model>`
- Model obrolan bawaan: `MiniMax-M2.7`
- Model obrolan alternatif: `MiniMax-M2.7-highspeed`
- Proses orientasi dan penyiapan langsung dengan kunci API menulis definisi model khusus teks untuk kedua varian M2.7
- Pemahaman gambar menggunakan penyedia media `MiniMax-VL-01` milik Plugin
- Perbarui nilai harga di `models.json` jika Anda memerlukan pelacakan biaya yang tepat
- Gunakan `openclaw models list` untuk mengonfirmasi ID penyedia saat ini, lalu beralih dengan `openclaw models set minimax/MiniMax-M2.7` atau `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Tautan rujukan untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Lihat [Penyedia model](/id/concepts/model-providers) untuk aturan penyedia.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Ini biasanya berarti **penyedia MiniMax belum dikonfigurasi** (tidak ada entri penyedia yang cocok dan tidak ditemukan profil autentikasi/kunci lingkungan MiniMax). Perbaikan untuk deteksi ini ada di **2026.1.12**. Perbaiki dengan:

    - Memutakhirkan ke **2026.1.12** (atau menjalankan dari sumber `main`), lalu memulai ulang Gateway.
    - Menjalankan `openclaw configure` dan memilih opsi autentikasi **MiniMax**, atau
    - Menambahkan blok `models.providers.minimax` atau `models.providers.minimax-portal` yang cocok secara manual, atau
    - Mengatur `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau profil autentikasi MiniMax agar penyedia yang cocok dapat disuntikkan.

    Pastikan ID model **peka huruf besar-kecil**:

    - Jalur kunci API: `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed`
    - Jalur OAuth: `minimax-portal/MiniMax-M2.7` atau `minimax-portal/MiniMax-M2.7-highspeed`

    Lalu periksa ulang dengan:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku peralihan cadangan.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter alat musik bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pencarian MiniMax" href="/id/tools/minimax-search" icon="magnifying-glass">
    Konfigurasi pencarian web melalui MiniMax Token Plan.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
