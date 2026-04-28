---
read_when:
    - Anda ingin menggunakan model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:37:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

Provider MiniMax OpenClaw menggunakan default **MiniMax M2.7**.

MiniMax juga menyediakan:

- Sintesis ucapan bawaan melalui T2A v2
- Pemahaman gambar bawaan melalui `MiniMax-VL-01`
- Pembuatan musik bawaan melalui `music-2.6`
- `web_search` bawaan melalui API pencarian MiniMax Coding Plan

Pemisahan provider:

| ID Provider      | Auth    | Kapabilitas                                                                                         |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan, pencarian web |
| `minimax-portal` | OAuth   | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan                |

## Katalog bawaan

| Model                    | Jenis            | Deskripsi                                |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Model reasoning hosted default           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Tier reasoning M2.7 yang lebih cepat     |
| `MiniMax-VL-01`          | Vision           | Model pemahaman gambar                   |
| `image-01`               | Pembuatan gambar | Text-to-image dan pengeditan image-to-image |
| `music-2.6`              | Pembuatan musik  | Model musik default                      |
| `music-2.5`              | Pembuatan musik  | Tier pembuatan musik sebelumnya          |
| `music-2.0`              | Pembuatan musik  | Tier pembuatan musik lama                |
| `MiniMax-Hailuo-2.3`     | Pembuatan video  | Alur text-to-video dan referensi gambar  |

## Memulai

Pilih metode auth yang Anda sukai dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Paling cocok untuk:** penyiapan cepat dengan MiniMax Coding Plan melalui OAuth, tanpa memerlukan API key.

    <Tabs>
      <Tab title="Internasional">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Ini mengautentikasi ke `api.minimax.io`.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Ini mengautentikasi ke `api.minimaxi.com`.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Penyiapan OAuth menggunakan id provider `minimax-portal`. Referensi model mengikuti bentuk `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Paling cocok untuk:** MiniMax hosted dengan API yang kompatibel dengan Anthropic.

    <Tabs>
      <Tab title="Internasional">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Ini mengonfigurasi `api.minimax.io` sebagai base URL.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Ini mengonfigurasi `api.minimaxi.com` sebagai base URL.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Contoh config

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
    Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax secara default kecuali Anda secara eksplisit mengatur `thinking` sendiri. Endpoint streaming MiniMax memancarkan `reasoning_content` dalam potongan delta bergaya OpenAI, bukan blok thinking native Anthropic, yang dapat membocorkan reasoning internal ke output yang terlihat jika dibiarkan aktif secara implisit.
    </Warning>

    <Note>
    Penyiapan API key menggunakan id provider `minimax`. Referensi model mengikuti bentuk `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfigurasi melalui `openclaw configure`

Gunakan wizard config interaktif untuk menetapkan MiniMax tanpa mengedit JSON:

<Steps>
  <Step title="Luncurkan wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Pilih Model/auth">
    Pilih **Model/auth** dari menu.
  </Step>
  <Step title="Pilih salah satu opsi auth MiniMax">
    Pilih salah satu opsi MiniMax yang tersedia:

    | Pilihan auth | Deskripsi |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internasional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth China (Coding Plan) |
    | `minimax-global-api` | API key internasional |
    | `minimax-cn-api` | API key China |

  </Step>
  <Step title="Pilih model default Anda">
    Pilih model default Anda saat diminta.
  </Step>
</Steps>

## Kapabilitas

### Pembuatan gambar

Plugin MiniMax mendaftarkan model `image-01` untuk tool `image_generate`. Ini mendukung:

- **Pembuatan text-to-image** dengan kontrol rasio aspek
- **Pengeditan image-to-image** (referensi subjek) dengan kontrol rasio aspek
- Hingga **9 gambar output** per permintaan
- Hingga **1 gambar referensi** per permintaan edit
- Rasio aspek yang didukung: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Untuk menggunakan MiniMax dalam pembuatan gambar, atur sebagai provider pembuatan gambar:

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
`image-01` yang sama. Penyiapan API key menggunakan `MINIMAX_API_KEY`; penyiapan OAuth dapat menggunakan
jalur auth `minimax-portal` bawaan sebagai gantinya.

Pembuatan gambar selalu menggunakan endpoint gambar khusus MiniMax
(`/v1/image_generation`) dan mengabaikan `models.providers.minimax.baseUrl`,
karena field tersebut mengonfigurasi base URL chat/yang kompatibel dengan Anthropic. Atur
`MINIMAX_API_HOST=https://api.minimaxi.com` untuk merutekan pembuatan gambar
melalui endpoint CN; endpoint global default adalah
`https://api.minimax.io`.

Saat onboarding atau penyiapan API key menulis entri `models.providers.minimax`
eksplisit, OpenClaw mematerialisasikan `MiniMax-M2.7` dan
`MiniMax-M2.7-highspeed` sebagai model chat khusus teks. Pemahaman gambar
diekspose secara terpisah melalui provider media `MiniMax-VL-01` milik Plugin.

<Note>
Lihat [Image Generation](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

### Text-to-speech

Plugin `minimax` bawaan mendaftarkan MiniMax T2A v2 sebagai provider ucapan untuk
`messages.tts`.

- Model TTS default: `speech-2.8-hd`
- Suara default: `English_expressive_narrator`
- Model id bawaan yang didukung mencakup `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, dan `speech-01-turbo`.
- Resolusi auth adalah `messages.tts.providers.minimax.apiKey`, lalu
  auth profile OAuth/token `minimax-portal`, lalu key environment Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), lalu `MINIMAX_API_KEY`.
- Jika tidak ada host TTS yang dikonfigurasi, OpenClaw menggunakan ulang host OAuth
  `minimax-portal` yang dikonfigurasi dan menghapus suffix path yang kompatibel dengan Anthropic
  seperti `/anthropic`.
- Lampiran audio normal tetap MP3.
- Target voice-note seperti Feishu dan Telegram ditranskode dari MP3 MiniMax
  menjadi Opus 48kHz dengan `ffmpeg`, karena API file Feishu/Lark hanya
  menerima `file_type: "opus"` untuk pesan audio native.
- MiniMax T2A menerima `speed` dan `vol` pecahan, tetapi `pitch` dikirim sebagai
  integer; OpenClaw memotong nilai `pitch` pecahan sebelum permintaan API.

| Pengaturan                               | Env var                | Default                       | Deskripsi                         |
| ---------------------------------------- | ---------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Model id TTS.                     |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Voice id yang digunakan untuk output ucapan. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Kecepatan pemutaran, `0.5..2.0`.  |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Pergeseran pitch integer, `-12..12`. |

### Pembuatan musik

Plugin MiniMax bawaan mendaftarkan pembuatan musik melalui tool bersama
`music_generate` untuk `minimax` dan `minimax-portal`.

- Model musik default: `minimax/music-2.6`
- Model musik OAuth: `minimax-portal/music-2.6`
- Juga mendukung `minimax/music-2.5` dan `minimax/music-2.0`
- Kontrol prompt: `lyrics`, `instrumental`, `durationSeconds`
- Format output: `mp3`
- Run berbasis sesi dilepas melalui alur task/status bersama, termasuk `action: "status"`

Untuk menggunakan MiniMax sebagai provider musik default:

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
Lihat [Music Generation](/id/tools/music-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

### Pembuatan video

Plugin MiniMax bawaan mendaftarkan pembuatan video melalui tool bersama
`video_generate` untuk `minimax` dan `minimax-portal`.

- Model video default: `minimax/MiniMax-Hailuo-2.3`
- Model video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Mode: text-to-video dan alur referensi satu gambar
- Mendukung `aspectRatio` dan `resolution`

Untuk menggunakan MiniMax sebagai provider video default:

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
Lihat [Video Generation](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

### Pemahaman gambar

Plugin MiniMax mendaftarkan pemahaman gambar secara terpisah dari katalog
teks:

| ID Provider      | Model gambar default |
| ---------------- | -------------------- |
| `minimax`        | `MiniMax-VL-01`      |
| `minimax-portal` | `MiniMax-VL-01`      |

Itulah sebabnya routing media otomatis dapat menggunakan pemahaman gambar MiniMax meskipun
katalog text-provider bawaan masih hanya menampilkan referensi chat M2.7 khusus teks.

### Pencarian web

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Coding Plan.

- Id provider: `minimax`
- Hasil terstruktur: judul, URL, cuplikan, kueri terkait
- Env var yang diutamakan: `MINIMAX_CODE_PLAN_KEY`
- Alias env yang diterima: `MINIMAX_CODING_API_KEY`
- Fallback kompatibilitas: `MINIMAX_API_KEY` saat sudah menunjuk ke token coding-plan
- Penggunaan ulang region: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, lalu base URL provider MiniMax
- Pencarian tetap berada pada id provider `minimax`; penyiapan OAuth CN/global tetap dapat mengarahkan region secara tidak langsung melalui `models.providers.minimax-portal.baseUrl`

Config berada di bawah `plugins.entries.minimax.config.webSearch.*`.

<Note>
Lihat [MiniMax Search](/id/tools/minimax-search) untuk konfigurasi dan penggunaan pencarian web lengkap.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Opsi konfigurasi">
    | Opsi | Deskripsi |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Pilih `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.api` | Pilih `anthropic-messages`; `openai-completions` opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisikan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Beri alias pada model yang Anda inginkan dalam allowlist |
    | `models.mode` | Pertahankan `merge` jika Anda ingin menambahkan MiniMax bersama bawaan |
  </Accordion>

  <Accordion title="Default thinking">
    Pada `api: "anthropic-messages"`, OpenClaw menyuntikkan `thinking: { type: "disabled" }` kecuali thinking sudah diatur secara eksplisit di params/config.

    Ini mencegah endpoint streaming MiniMax memancarkan `reasoning_content` dalam potongan delta bergaya OpenAI, yang akan membocorkan reasoning internal ke output yang terlihat.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed` pada jalur stream yang kompatibel dengan Anthropic.
  </Accordion>

  <Accordion title="Contoh fallback">
    **Paling cocok untuk:** mempertahankan model generasi terbaru terkuat Anda sebagai primary, lalu fail over ke MiniMax M2.7. Contoh di bawah menggunakan Opus sebagai primary konkret; ganti dengan model primary generasi terbaru pilihan Anda.

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
    - API penggunaan Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (memerlukan key coding plan).
    - OpenClaw menormalkan penggunaan coding-plan MiniMax ke tampilan `% tersisa` yang sama seperti provider lain. Field mentah `usage_percent` / `usagePercent` MiniMax adalah kuota tersisa, bukan kuota yang dikonsumsi, jadi OpenClaw membalikkannya. Field berbasis hitungan menang bila ada.
    - Saat API mengembalikan `model_remains`, OpenClaw mengutamakan entri model chat, menurunkan label jendela dari `start_time` / `end_time` bila perlu, dan menyertakan nama model terpilih dalam label plan agar jendela coding-plan lebih mudah dibedakan.
    - Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai surface kuota MiniMax yang sama, dan mengutamakan OAuth MiniMax yang tersimpan sebelum fallback ke env var key Coding Plan.

  </Accordion>
</AccordionGroup>

## Catatan

- Referensi model mengikuti jalur auth:
  - Penyiapan API key: `minimax/<model>`
  - Penyiapan OAuth: `minimax-portal/<model>`
- Model chat default: `MiniMax-M2.7`
- Model chat alternatif: `MiniMax-M2.7-highspeed`
- Onboarding dan penyiapan API key langsung menulis definisi model khusus teks untuk kedua varian M2.7
- Pemahaman gambar menggunakan provider media `MiniMax-VL-01` milik Plugin
- Perbarui nilai harga di `models.json` jika Anda memerlukan pelacakan biaya yang presisi
- Gunakan `openclaw models list` untuk mengonfirmasi id provider saat ini, lalu ganti dengan `openclaw models set minimax/MiniMax-M2.7` atau `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Lihat [Model providers](/id/concepts/model-providers) untuk aturan provider.
</Note>

## Troubleshooting

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Ini biasanya berarti **provider MiniMax belum dikonfigurasi** (tidak ada entri provider yang cocok dan tidak ditemukan auth profile/env key MiniMax). Perbaikan untuk deteksi ini ada di **2026.1.12**. Perbaiki dengan:

    - Upgrade ke **2026.1.12** (atau jalankan dari source `main`), lalu restart gateway.
    - Jalankan `openclaw configure` dan pilih opsi auth **MiniMax**, atau
    - Tambahkan blok `models.providers.minimax` atau `models.providers.minimax-portal` yang cocok secara manual, atau
    - Atur `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau auth profile MiniMax agar provider yang cocok dapat disuntikkan.

    Pastikan model id **peka huruf besar/kecil**:

    - Jalur API key: `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed`
    - Jalur OAuth: `minimax-portal/MiniMax-M2.7` atau `minimax-portal/MiniMax-M2.7-highspeed`

    Lalu periksa kembali dengan:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Troubleshooting](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan provider.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="MiniMax Search" href="/id/tools/minimax-search" icon="magnifying-glass">
    Konfigurasi pencarian web melalui MiniMax Coding Plan.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Troubleshooting umum dan FAQ.
  </Card>
</CardGroup>
