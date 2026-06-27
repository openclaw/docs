---
read_when:
    - Anda menginginkan model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

Penyedia MiniMax OpenClaw secara default menggunakan **MiniMax M3**.

MiniMax juga menyediakan:

- Sintesis ucapan bawaan melalui T2A v2
- Pemahaman gambar bawaan melalui `MiniMax-VL-01`
- Pembuatan musik bawaan melalui `music-2.6`
- `web_search` bawaan melalui API pencarian MiniMax Token Plan

Pembagian penyedia:

| ID penyedia     | Autentikasi | Kemampuan                                                                                           |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Kunci API | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan, pencarian web |
| `minimax-portal` | OAuth   | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan             |

## Katalog bawaan

| Model                    | Jenis             | Deskripsi                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Chat (penalaran) | Model penalaran hosted default           |
| `MiniMax-M2.7`           | Chat (penalaran) | Model penalaran hosted sebelumnya          |
| `MiniMax-M2.7-highspeed` | Chat (penalaran) | Tingkat penalaran M2.7 yang lebih cepat               |
| `MiniMax-VL-01`          | Visi           | Model pemahaman gambar                |
| `image-01`               | Pembuatan gambar | Pengeditan teks-ke-gambar dan gambar-ke-gambar |
| `music-2.6`              | Pembuatan musik | Model musik default                      |
| `music-2.5`              | Pembuatan musik | Tingkat pembuatan musik sebelumnya           |
| `music-2.0`              | Pembuatan musik | Tingkat pembuatan musik legacy             |
| `MiniMax-Hailuo-2.3`     | Pembuatan video | Alur teks-ke-video dan referensi gambar  |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Paling cocok untuk:** penyiapan cepat dengan MiniMax Coding Plan melalui OAuth, tanpa kunci API.

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
    Penyiapan OAuth menggunakan id penyedia `minimax-portal`. Referensi model mengikuti bentuk `minimax-portal/MiniMax-M3`.
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax M2.x secara default kecuali Anda secara eksplisit menetapkan `thinking` sendiri. Endpoint streaming M2.x mengeluarkan `reasoning_content` dalam potongan delta bergaya OpenAI, bukan blok thinking Anthropic native, yang dapat membocorkan penalaran internal ke output yang terlihat jika dibiarkan aktif secara implisit. MiniMax-M3 (dan M3.x yang kompatibel ke depan) dikecualikan dari default ini: M3 mengeluarkan blok thinking Anthropic yang benar dan memerlukan thinking aktif untuk menghasilkan konten yang terlihat, sehingga OpenClaw mempertahankan M3 pada jalur thinking yang dihilangkan/adaptif milik penyedia.
    </Warning>

    <Note>
    Penyiapan kunci API menggunakan id penyedia `minimax`. Referensi model mengikuti bentuk `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Konfigurasi melalui `openclaw configure`

Gunakan wizard konfigurasi interaktif untuk mengatur MiniMax tanpa mengedit JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Pilih **Model/auth** dari menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Pilih salah satu opsi MiniMax yang tersedia:

    | Pilihan autentikasi | Deskripsi |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internasional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth China (Coding Plan) |
    | `minimax-global-api` | Kunci API internasional |
    | `minimax-cn-api` | Kunci API China |

  </Step>
  <Step title="Pick your default model">
    Pilih model default Anda saat diminta.
  </Step>
</Steps>

## Kemampuan

### Pembuatan gambar

Plugin MiniMax mendaftarkan model `image-01` untuk alat `image_generate`. Model ini mendukung:

- **Pembuatan teks-ke-gambar** dengan kontrol rasio aspek
- **Pengeditan gambar-ke-gambar** (referensi subjek) dengan kontrol rasio aspek
- Hingga **9 gambar output** per permintaan
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

Plugin menggunakan `MINIMAX_API_KEY` yang sama atau autentikasi OAuth yang sama seperti model teks. Tidak diperlukan konfigurasi tambahan jika MiniMax sudah disiapkan.

Baik `minimax` maupun `minimax-portal` mendaftarkan `image_generate` dengan model
`image-01` yang sama. Penyiapan kunci API menggunakan `MINIMAX_API_KEY`; penyiapan OAuth dapat menggunakan
jalur autentikasi `minimax-portal` bawaan sebagai gantinya.

Pembuatan gambar selalu menggunakan endpoint gambar khusus MiniMax
(`/v1/image_generation`) dan mengabaikan `models.providers.minimax.baseUrl`,
karena bidang tersebut mengonfigurasi URL dasar chat/kompatibel Anthropic. Tetapkan
`MINIMAX_API_HOST=https://api.minimaxi.com` untuk merutekan pembuatan gambar
melalui endpoint CN; endpoint global default adalah
`https://api.minimax.io`.

Saat onboarding atau penyiapan kunci API menulis entri eksplisit `models.providers.minimax`,
OpenClaw mematerialisasikan `MiniMax-M3`, `MiniMax-M2.7`, dan
`MiniMax-M2.7-highspeed` sebagai model chat. M3 mengiklankan input teks dan gambar;
pemahaman gambar tetap diekspos secara terpisah melalui penyedia media
`MiniMax-VL-01` yang dimiliki Plugin.

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Teks-ke-ucapan

Plugin `minimax` bawaan mendaftarkan MiniMax T2A v2 sebagai penyedia ucapan untuk
`messages.tts`.

- Model TTS default: `speech-2.8-hd`
- Suara default: `English_expressive_narrator`
- Id model bawaan yang didukung mencakup `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, dan `speech-01-turbo`.
- Resolusi autentikasi adalah `messages.tts.providers.minimax.apiKey`, lalu
  profil autentikasi OAuth/token `minimax-portal`, lalu kunci lingkungan Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), lalu `MINIMAX_API_KEY`.
- Jika tidak ada host TTS yang dikonfigurasi, OpenClaw menggunakan kembali host OAuth
  `minimax-portal` yang dikonfigurasi dan menghapus sufiks jalur yang kompatibel dengan Anthropic
  seperti `/anthropic`.
- Lampiran audio normal tetap MP3.
- Target catatan suara seperti Feishu dan Telegram ditranskode dari MP3 MiniMax
  ke Opus 48kHz dengan `ffmpeg`, karena API file Feishu/Lark hanya
  menerima `file_type: "opus"` untuk pesan audio native.
- MiniMax T2A menerima `speed` dan `vol` pecahan, tetapi `pitch` dikirim sebagai
  bilangan bulat; OpenClaw memotong nilai `pitch` pecahan sebelum permintaan API.

| Pengaturan                                         | Variabel env                | Default                       | Deskripsi                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id model TTS.                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id suara yang digunakan untuk output ucapan. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Kecepatan pemutaran, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Pergeseran pitch bilangan bulat, `-12..12`.  |

### Pembuatan musik

Plugin MiniMax bawaan mendaftarkan pembuatan musik melalui alat bersama
`music_generate` untuk `minimax` dan `minimax-portal`.

- Model musik bawaan: `minimax/music-2.6`
- Model musik OAuth: `minimax-portal/music-2.6`
- Juga mendukung `minimax/music-2.5` dan `minimax/music-2.0`
- Kontrol prompt: `lyrics`, `instrumental`
- Format keluaran: `mp3`
- Proses yang didukung sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

Untuk menggunakan MiniMax sebagai penyedia musik bawaan:

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

- Model video bawaan: `minimax/MiniMax-Hailuo-2.3`
- Model video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Mode: alur teks-ke-video dan referensi satu gambar
- Mendukung `aspectRatio` dan `resolution`

Untuk menggunakan MiniMax sebagai penyedia video bawaan:

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Pemahaman gambar

Plugin MiniMax mendaftarkan pemahaman gambar secara terpisah dari katalog
teks:

| ID Penyedia      | Model gambar bawaan |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Itulah sebabnya perutean media otomatis dapat menggunakan pemahaman gambar MiniMax bahkan
ketika katalog penyedia teks bawaan juga menyertakan referensi chat M3 yang mendukung gambar.

### Pencarian web

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Token Plan.

- ID penyedia: `minimax`
- Hasil terstruktur: judul, URL, cuplikan, kueri terkait
- Variabel env pilihan: `MINIMAX_CODE_PLAN_KEY`
- Alias env yang diterima: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Fallback kompatibilitas: `MINIMAX_API_KEY` ketika sudah mengarah ke kredensial token-plan
- Penggunaan ulang region: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, lalu URL dasar penyedia MiniMax
- Pencarian tetap berada pada ID penyedia `minimax`; penyiapan OAuth CN/global dapat mengarahkan region secara tidak langsung melalui `models.providers.minimax-portal.baseUrl` dan dapat menyediakan autentikasi bearer melalui `MINIMAX_OAUTH_TOKEN`

Konfigurasi berada di bawah `plugins.entries.minimax.config.webSearch.*`.

<Note>
Lihat [Pencarian MiniMax](/id/tools/minimax-search) untuk konfigurasi dan penggunaan pencarian web lengkap.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Configuration options">
    | Opsi | Deskripsi |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Utamakan `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.api` | Utamakan `anthropic-messages`; `openai-completions` opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.apiKey` | Kunci API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Tentukan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias model yang ingin Anda masukkan ke allowlist |
    | `models.mode` | Pertahankan `merge` jika Anda ingin menambahkan MiniMax berdampingan dengan bawaan |
  </Accordion>

  <Accordion title="Thinking defaults">
    Pada `api: "anthropic-messages"`, OpenClaw menyuntikkan `thinking: { type: "disabled" }` untuk model MiniMax M2.x kecuali thinking sudah ditetapkan secara eksplisit di params/config.

    Ini mencegah endpoint streaming M2.x memancarkan `reasoning_content` dalam potongan delta bergaya OpenAI, yang akan membocorkan penalaran internal ke keluaran yang terlihat.

    MiniMax-M3 (dan M3.x) dikecualikan: M3 memancarkan blok thinking Anthropic yang benar dan mengembalikan array `content` kosong dengan `stop_reason: "end_turn"` ketika thinking dinonaktifkan, sehingga wrapper mempertahankan M3 pada jalur thinking penyedia yang dihilangkan/adaptif.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed` pada jalur stream yang kompatibel dengan Anthropic.
  </Accordion>

  <Accordion title="Fallback example">
    **Terbaik untuk:** mempertahankan model generasi terbaru terkuat Anda sebagai utama, lalu failover ke MiniMax M2.7. Contoh di bawah menggunakan Opus sebagai utama konkret; ganti dengan model utama generasi terbaru pilihan Anda.

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

  <Accordion title="Coding Plan usage details">
    - API penggunaan Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` atau `https://api.minimax.io/v1/token_plan/remains` (memerlukan kunci coding plan).
    - Polling penggunaan memperoleh host dari `models.providers.minimax-portal.baseUrl` atau `models.providers.minimax.baseUrl` ketika dikonfigurasi, sehingga penyiapan global yang menggunakan `https://api.minimax.io/anthropic` melakukan polling ke `api.minimax.io`. URL dasar yang hilang atau salah bentuk mempertahankan fallback CN demi kompatibilitas.
    - OpenClaw menormalkan penggunaan coding-plan MiniMax ke tampilan `% tersisa` yang sama seperti penyedia lain. Kolom mentah MiniMax `usage_percent` / `usagePercent` adalah kuota tersisa, bukan kuota terpakai, sehingga OpenClaw membalikkannya. Kolom berbasis hitungan menang ketika ada.
    - Ketika API mengembalikan `model_remains`, OpenClaw mengutamakan entri model chat, memperoleh label jendela dari `start_time` / `end_time` bila diperlukan, dan menyertakan nama model yang dipilih dalam label paket sehingga jendela coding-plan lebih mudah dibedakan.
    - Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama, dan mengutamakan OAuth MiniMax tersimpan sebelum fallback ke variabel env kunci Coding Plan.

  </Accordion>
</AccordionGroup>

## Catatan

- Referensi model mengikuti jalur autentikasi:
  - Penyiapan kunci API: `minimax/<model>`
  - Penyiapan OAuth: `minimax-portal/<model>`
- Model chat bawaan: `MiniMax-M3`
- Model chat alternatif: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding dan penyiapan kunci API langsung menulis definisi model untuk M3 dan kedua varian M2.7
- Pemahaman gambar menggunakan penyedia media `MiniMax-VL-01` yang dimiliki plugin
- Perbarui nilai harga di `models.json` jika Anda memerlukan pelacakan biaya yang tepat
- Gunakan `openclaw models list` untuk mengonfirmasi ID penyedia saat ini, lalu beralih dengan `openclaw models set minimax/MiniMax-M3` atau `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Tautan referal untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Lihat [Penyedia model](/id/concepts/model-providers) untuk aturan penyedia.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    Ini biasanya berarti **penyedia MiniMax belum dikonfigurasi** (tidak ada entri penyedia yang cocok dan tidak ada profil autentikasi/kunci env MiniMax yang ditemukan). Perbaikan untuk deteksi ini ada di **2026.1.12**. Perbaiki dengan:

    - Meningkatkan ke **2026.1.12** (atau menjalankan dari sumber `main`), lalu memulai ulang gateway.
    - Menjalankan `openclaw configure` dan memilih opsi autentikasi **MiniMax**, atau
    - Menambahkan blok `models.providers.minimax` atau `models.providers.minimax-portal` yang cocok secara manual, atau
    - Menetapkan `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau profil autentikasi MiniMax agar penyedia yang cocok dapat disuntikkan.

    Pastikan ID model **peka huruf besar-kecil**:

    - Jalur kunci API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, atau `minimax/MiniMax-M2.7-highspeed`
    - Jalur OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, atau `minimax-portal/MiniMax-M2.7-highspeed`

    Lalu periksa ulang dengan:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Parameter alat musik bersama dan pemilihan penyedia.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="MiniMax Search" href="/id/tools/minimax-search" icon="magnifying-glass">
    Konfigurasi pencarian web melalui MiniMax Token Plan.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
