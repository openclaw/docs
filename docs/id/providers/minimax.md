---
read_when:
    - Anda ingin model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-19T05:34:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ce1329cedc88128aaca3eb132be433f7115edb30368dda6df7ab115cc46031c
    source_path: providers/minimax.md
    workflow: 16
---

Plugin `minimax` bawaan mendaftarkan dua penyedia serta lima kapabilitas: chat, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan (T2A v2), dan pencarian web.

| ID penyedia      | Autentikasi    | Kapabilitas                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Kunci API | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan, pencarian web |
| `minimax-portal` | OAuth   | Teks, pembuatan gambar, pembuatan musik, pembuatan video, pemahaman gambar, ucapan             |

<Tip>
Tautan rujukan untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

## Katalog bawaan

| Model                    | Jenis             | Deskripsi                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | Chat (penalaran) | Model penalaran terhost default           |
| `MiniMax-M2.7`           | Chat (penalaran) | Model penalaran terhost sebelumnya          |
| `MiniMax-M2.7-highspeed` | Chat (penalaran) | Tingkat penalaran M2.7 yang lebih cepat               |
| `MiniMax-VL-01`          | Visi           | Model pemahaman gambar                |
| `image-01`               | Pembuatan gambar | Pembuatan teks-ke-gambar dan pengeditan gambar-ke-gambar |
| `music-2.6`              | Pembuatan musik | Model musik default                      |
| `MiniMax-Hailuo-2.3`     | Pembuatan video | Alur teks-ke-video dan gambar-ke-video   |

Referensi model mengikuti jalur autentikasi: `minimax/<model>` untuk penyiapan dengan kunci API, `minimax-portal/<model>` untuk penyiapan OAuth.

## Memulai

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Paling cocok untuk:** penyiapan cepat dengan MiniMax Coding Plan melalui OAuth, tanpa memerlukan kunci API.

    <Tabs>
      <Tab title="Internasional">
        <Steps>
          <Step title="Jalankan orientasi awal">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL dasar penyedia yang dihasilkan: `api.minimax.io`.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Tiongkok">
        <Steps>
          <Step title="Jalankan orientasi awal">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL dasar penyedia yang dihasilkan: `api.minimaxi.com`.
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
    Penyiapan OAuth menggunakan ID penyedia `minimax-portal`. Referensi model mengikuti format `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Kunci API">
    **Paling cocok untuk:** MiniMax terhost dengan API yang kompatibel dengan Anthropic.

    <Tabs>
      <Tab title="Internasional">
        <Steps>
          <Step title="Jalankan orientasi awal">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Tindakan ini mengonfigurasi `api.minimax.io` sebagai URL dasar.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Tiongkok">
        <Steps>
          <Step title="Jalankan orientasi awal">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Tindakan ini mengonfigurasi `api.minimaxi.com` sebagai URL dasar.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
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
    Endpoint streaming MiniMax-M2.x yang kompatibel dengan Anthropic memancarkan `reasoning_content` dalam potongan delta bergaya OpenAI, bukan blok pemikiran Anthropic asli, sehingga penalaran internal bocor ke keluaran yang terlihat jika pemikiran dibiarkan aktif secara implisit. OpenClaw menonaktifkan pemikiran M2.x secara default kecuali Anda menetapkan sendiri `thinking` secara eksplisit. MiniMax-M3 (dan M3.x yang kompatibel ke depan) dikecualikan: M3 memancarkan blok pemikiran Anthropic yang semestinya dan mengharuskan pemikiran aktif untuk menghasilkan konten yang terlihat, sehingga OpenClaw mempertahankan M3 pada jalur pemikiran adaptif penyedia. Lihat bagian Default pemikiran pada Konfigurasi lanjutan di bawah.
    </Warning>

    <Note>
    Penyiapan dengan kunci API menggunakan ID penyedia `minimax`. Referensi model mengikuti format `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Konfigurasikan melalui `openclaw configure`

<Steps>
  <Step title="Luncurkan wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Pilih Model/auth">
    Pilih **Model/auth** dari menu.
  </Step>
  <Step title="Pilih opsi autentikasi MiniMax">
    | Pilihan autentikasi            | Deskripsi                        |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | OAuth internasional (Coding Plan)  |
    | `minimax-cn-oauth`     | OAuth Tiongkok (Coding Plan)          |
    | `minimax-global-api`   | Kunci API internasional              |
    | `minimax-cn-api`       | Kunci API Tiongkok                      |
  </Step>
  <Step title="Pilih model default Anda">
    Pilih model default Anda saat diminta.
  </Step>
</Steps>

## Kapabilitas

### Pembuatan gambar

Plugin MiniMax mendaftarkan model `image-01` untuk alat `image_generate` pada `minimax` dan `minimax-portal`, dengan menggunakan kembali autentikasi `MINIMAX_API_KEY` atau OAuth yang sama seperti model teks.

- Pembuatan teks-ke-gambar dan pengeditan gambar-ke-gambar (referensi subjek), keduanya dengan kontrol rasio aspek
- Hingga 9 gambar keluaran per permintaan, 1 gambar referensi per permintaan pengeditan
- Rasio aspek yang didukung: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Pembuatan gambar selalu menggunakan endpoint gambar khusus MiniMax (`/v1/image_generation`) dan mengabaikan `models.providers.minimax.baseUrl`, karena bidang tersebut mengonfigurasi URL dasar chat/yang kompatibel dengan Anthropic. Tetapkan `MINIMAX_API_HOST=https://api.minimaxi.com` untuk merutekan pembuatan gambar melalui endpoint CN; endpoint global default adalah `https://api.minimax.io`.

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Teks-ke-ucapan

Plugin `minimax` bawaan mendaftarkan MiniMax T2A v2 sebagai penyedia ucapan untuk `messages.tts`.

- Model TTS default: `speech-2.8-hd`
- Suara default: `English_expressive_narrator`
- ID model bawaan: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`
- Urutan resolusi autentikasi: `messages.tts.providers.minimax.apiKey`, lalu profil autentikasi OAuth/token `minimax-portal`, lalu kunci lingkungan Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), kemudian `MINIMAX_API_KEY`
- Jika tidak ada host TTS yang dikonfigurasi, OpenClaw menggunakan kembali host OAuth `minimax-portal` yang dikonfigurasi dan menghapus sufiks jalur yang kompatibel dengan Anthropic seperti `/anthropic`
- Lampiran audio biasa tetap menggunakan MP3. Target pesan suara (Feishu, Telegram, dan saluran lain yang meminta lampiran yang kompatibel dengan pesan suara) ditranskode dari MP3 MiniMax ke Opus 48kHz dengan `ffmpeg`, karena misalnya API file Feishu/Lark hanya menerima `file_type: "opus"` untuk pesan audio asli
- MiniMax T2A menerima `speed` dan `vol` pecahan, tetapi `pitch` dikirim sebagai bilangan bulat; OpenClaw memotong nilai pecahan `pitch` sebelum permintaan API

| Pengaturan                                  | Variabel lingkungan                | Default                       | Deskripsi                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID model TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID suara yang digunakan untuk keluaran ucapan. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Kecepatan pemutaran, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Pergeseran nada bilangan bulat, `-12..12`.  |

### Pembuatan musik

Plugin MiniMax bawaan mendaftarkan pembuatan musik melalui alat bersama `music_generate` untuk `minimax` dan `minimax-portal`.

- Model musik default: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Juga mendukung `music-2.6-free`, `music-cover`, dan `music-cover-free`
- Kontrol prompt: `lyrics`, `instrumental`
- Format keluaran: `mp3`
- Proses yang didukung sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Musik](/id/tools/music-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Pembuatan video

Plugin MiniMax bawaan mendaftarkan pembuatan video melalui alat bersama `video_generate` untuk `minimax` dan `minimax-portal`.

- Model video default: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Juga mendukung `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live`, dan `I2V-01`
- Mode: alur teks-ke-video dan referensi gambar tunggal
- Mendukung `resolution` (`768P` atau `1080P` pada model Hailuo 2.3/02); `aspectRatio` tidak didukung dan diabaikan

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Pemahaman gambar

Plugin MiniMax mendaftarkan pemahaman gambar secara terpisah dari katalog teks:

| ID penyedia      | Model gambar default | Ekstraksi teks PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Itulah sebabnya perutean media otomatis dapat menggunakan pemahaman gambar MiniMax meskipun katalog penyedia teks bawaan juga menyertakan referensi obrolan M3 yang mendukung gambar. Pemahaman PDF menggunakan `MiniMax-M2.7` hanya untuk ekstraksi teks; MiniMax tidak mendaftarkan jalur konversi PDF-ke-gambar.

### Pencarian web

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Token Plan (`/v1/coding_plan/search`).

- ID penyedia: `minimax`
- Hasil terstruktur: judul, URL, cuplikan, kueri terkait
- Variabel lingkungan yang diutamakan: `MINIMAX_CODE_PLAN_KEY`
- Alias lingkungan yang diterima: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Fallback kompatibilitas: `MINIMAX_API_KEY` jika sudah mengarah ke kredensial paket token
- Penggunaan ulang wilayah: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, kemudian URL dasar penyedia MiniMax
- Pencarian tetap menggunakan ID penyedia `minimax`; penyiapan OAuth CN/global dapat mengarahkan wilayah secara tidak langsung melalui `models.providers.minimax-portal.baseUrl` dan dapat menyediakan autentikasi bearer melalui `MINIMAX_OAUTH_TOKEN`

Konfigurasi berada di bawah `plugins.entries.minimax.config.webSearch.*`.

<Note>
Lihat [Pencarian MiniMax](/id/tools/minimax-search) untuk konfigurasi dan penggunaan pencarian web secara lengkap.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Opsi konfigurasi">
    | Opsi | Deskripsi |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Utamakan `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` bersifat opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.api` | Utamakan `anthropic-messages`; `openai-completions` bersifat opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.apiKey` | Kunci API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Tentukan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias, parameter, dan metadata per model |
    | `agents.defaults.modelPolicy.allow` | Daftar model yang diizinkan secara eksplisit dan bersifat opsional |
    | `models.mode` | Pertahankan `merge` jika ingin menambahkan MiniMax bersama komponen bawaan |
  </Accordion>

  <Accordion title="Default pemikiran">
    Pada `api: "anthropic-messages"`, OpenClaw menyisipkan `thinking: { type: "disabled" }` untuk model MiniMax M2.x, kecuali pembungkus sebelumnya telah menetapkan kolom `thinking` dalam payload. Hal ini mencegah endpoint streaming M2.x memancarkan `reasoning_content` dalam potongan delta bergaya OpenAI, yang akan membocorkan penalaran internal ke keluaran yang terlihat.

    MiniMax-M3 (dan M3.x) dikecualikan: M3 mengembalikan larik `content` kosong dengan `stop_reason: "end_turn"` saat pemikiran dinonaktifkan, sehingga OpenClaw menghapus default nonaktif implisit untuk M3 dan, saat tingkat pemikiran ditetapkan, memaksakan `thinking: { type: "adaptive" }` sebagai gantinya.

    Tingkat pemikiran yang tersedia untuk setiap keluarga model:

    | Keluarga model   | Tingkat                                   | Default    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Mode cepat">
    `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed` pada jalur aliran yang kompatibel dengan Anthropic (`api: "anthropic-messages"`, penyedia `minimax` atau `minimax-portal`).
  </Accordion>

  <Accordion title="Contoh fallback">
    **Paling cocok untuk:** mempertahankan model generasi terbaru yang paling kuat sebagai model utama dan beralih ke MiniMax M2.7 saat gagal. Contoh di bawah menggunakan Opus sebagai model utama konkret; ganti dengan model utama generasi terbaru pilihan Anda.

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
    - API penggunaan Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` atau `https://api.minimax.io/v1/token_plan/remains` (memerlukan kunci paket pengodean).
    - Polling penggunaan memperoleh host dari `models.providers.minimax-portal.baseUrl` atau `models.providers.minimax.baseUrl` jika dikonfigurasi, sehingga penyiapan global yang menggunakan `https://api.minimax.io/anthropic` melakukan polling terhadap `api.minimax.io`. URL dasar yang tidak ada atau salah format tetap menggunakan fallback CN demi kompatibilitas.
    - OpenClaw menormalisasi penggunaan paket pengodean MiniMax ke tampilan `% left` yang sama dengan yang digunakan penyedia lain. Kolom mentah `usage_percent` / `usagePercent` milik MiniMax menunjukkan kuota tersisa, bukan kuota yang telah digunakan, sehingga OpenClaw membalikkannya. Kolom berbasis jumlah diprioritaskan jika tersedia.
    - Saat API mengembalikan `model_remains`, OpenClaw mengutamakan entri model obrolan, memperoleh label jendela dari `start_time` / `end_time` bila diperlukan, dan menyertakan nama model yang dipilih dalam label paket agar jendela paket pengodean lebih mudah dibedakan.
    - Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, `minimax-portal`, dan `minimax-portal-cn` sebagai permukaan kuota MiniMax yang sama, serta mengutamakan OAuth MiniMax yang tersimpan sebelum beralih ke variabel lingkungan kunci Coding Plan.

  </Accordion>
</AccordionGroup>

## Catatan

- Model obrolan default: `MiniMax-M3`. Model obrolan alternatif: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Orientasi awal dan penyiapan kunci API langsung menulis definisi model untuk M3 dan kedua varian M2.7
- Pemahaman gambar menggunakan penyedia media `MiniMax-VL-01` yang dimiliki Plugin
- Perbarui nilai harga di `models.json` jika memerlukan pelacakan biaya yang tepat
- Gunakan `openclaw models list` untuk mengonfirmasi ID penyedia saat ini, lalu beralih dengan `openclaw models set minimax/MiniMax-M3` atau `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Lihat [Penyedia model](/id/concepts/model-providers) untuk aturan penyedia.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title='"Model tidak dikenal: minimax/MiniMax-M3"'>
    Ini biasanya berarti **penyedia MiniMax belum dikonfigurasi** (tidak ditemukan entri penyedia yang cocok maupun profil autentikasi/kunci lingkungan MiniMax). Perbaiki dengan:

    - Menjalankan `openclaw configure` dan memilih opsi autentikasi **MiniMax**, atau
    - Menambahkan blok `models.providers.minimax` atau `models.providers.minimax-portal` yang cocok secara manual, atau
    - Menetapkan `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau profil autentikasi MiniMax agar penyedia yang cocok dapat disisipkan.

    Pastikan ID model **peka huruf besar-kecil**:

    - Jalur kunci API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, atau `minimax/MiniMax-M2.7-highspeed`
    - Jalur OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, atau `minimax-portal/MiniMax-M2.7-highspeed`

    Kemudian periksa kembali dengan:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Bantuan selengkapnya: [Pemecahan Masalah](/id/help/troubleshooting) dan [Tanya Jawab Umum](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
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
    Pemecahan masalah umum dan tanya jawab umum.
  </Card>
</CardGroup>
