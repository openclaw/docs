---
read_when:
    - Anda ingin model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T09:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

Provider MiniMax bawaan OpenClaw secara default menggunakan **MiniMax M2.7**.

MiniMax juga menyediakan:

- Sintesis speech bawaan melalui T2A v2
- Image understanding bawaan melalui `MiniMax-VL-01`
- Generasi musik bawaan melalui `music-2.5+`
- `web_search` bawaan melalui API pencarian MiniMax Coding Plan

Pemisahan provider:

| ID Provider      | Auth    | Kapabilitas                                                    |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | API key | Teks, generasi gambar, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Teks, generasi gambar, image understanding                     |

## Katalog bawaan

| Model                    | Tipe             | Deskripsi                                 |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Model reasoning hosted default            |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Tier reasoning M2.7 yang lebih cepat      |
| `MiniMax-VL-01`          | Vision           | Model image understanding                 |
| `image-01`               | Image generation | Text-to-image dan pengeditan image-to-image |
| `music-2.5+`             | Music generation | Model musik default                       |
| `music-2.5`              | Music generation | Tier generasi musik sebelumnya            |
| `music-2.0`              | Music generation | Tier generasi musik legacy                |
| `MiniMax-Hailuo-2.3`     | Video generation | Alur text-to-video dan image reference    |

## Mulai menggunakan

Pilih metode auth yang Anda sukai dan ikuti langkah setup.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Terbaik untuk:** setup cepat dengan MiniMax Coding Plan melalui OAuth, tanpa API key.

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
    Setup OAuth menggunakan id provider `minimax-portal`. Model ref mengikuti bentuk `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Terbaik untuk:** MiniMax hosted dengan API yang kompatibel dengan Anthropic.

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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax secara default kecuali Anda secara eksplisit menetapkan `thinking` sendiri. Endpoint streaming MiniMax mengeluarkan `reasoning_content` dalam chunk delta bergaya OpenAI, bukan blok thinking Anthropic native, yang dapat membocorkan reasoning internal ke output yang terlihat jika dibiarkan aktif secara implisit.
    </Warning>

    <Note>
    Setup API key menggunakan id provider `minimax`. Model ref mengikuti bentuk `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfigurasikan melalui `openclaw configure`

Gunakan wizard konfigurasi interaktif untuk menyiapkan MiniMax tanpa mengedit JSON:

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

### Generasi gambar

Plugin MiniMax mendaftarkan model `image-01` untuk tool `image_generate`. Tool ini mendukung:

- **Generasi text-to-image** dengan kontrol aspect ratio
- **Pengeditan image-to-image** (subject reference) dengan kontrol aspect ratio
- Hingga **9 gambar output** per permintaan
- Hingga **1 gambar referensi** per permintaan edit
- Aspect ratio yang didukung: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Untuk menggunakan MiniMax untuk generasi gambar, setel sebagai provider generasi gambar:

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
`image-01` yang sama. Setup API key menggunakan `MINIMAX_API_KEY`; setup OAuth dapat menggunakan
jalur autentikasi `minimax-portal` bawaan sebagai gantinya.

Ketika onboarding atau setup API key menulis entri `models.providers.minimax`
secara eksplisit, OpenClaw mematerialisasi `MiniMax-M2.7` dan
`MiniMax-M2.7-highspeed` dengan `input: ["text", "image"]`.

Katalog teks MiniMax bawaan yang dikirim bersama sendiri tetap berupa metadata khusus teks sampai
konfigurasi provider eksplisit tersebut ada. Image understanding ditampilkan secara terpisah
melalui provider media `MiniMax-VL-01` milik Plugin.

<Note>
Lihat [Image Generation](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

### Generasi musik

Plugin `minimax` bawaan juga mendaftarkan generasi musik melalui tool bersama
`music_generate`.

- Model musik default: `minimax/music-2.5+`
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
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Lihat [Music Generation](/id/tools/music-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

### Generasi video

Plugin `minimax` bawaan juga mendaftarkan generasi video melalui tool bersama
`video_generate`.

- Model video default: `minimax/MiniMax-Hailuo-2.3`
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

### Image understanding

Plugin MiniMax mendaftarkan image understanding secara terpisah dari katalog
teks:

| ID Provider      | Model gambar default |
| ---------------- | -------------------- |
| `minimax`        | `MiniMax-VL-01`      |
| `minimax-portal` | `MiniMax-VL-01`      |

Itulah sebabnya routing media otomatis dapat menggunakan image understanding MiniMax bahkan
ketika katalog text-provider bawaan masih hanya menampilkan ref obrolan M2.7 khusus teks.

### Web search

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Coding Plan.

- ID provider: `minimax`
- Hasil terstruktur: judul, URL, snippet, kueri terkait
- Env var yang diprioritaskan: `MINIMAX_CODE_PLAN_KEY`
- Alias env yang diterima: `MINIMAX_CODING_API_KEY`
- Fallback kompatibilitas: `MINIMAX_API_KEY` ketika nilainya sudah menunjuk ke token coding-plan
- Penggunaan ulang region: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, lalu base URL provider MiniMax
- Pencarian tetap berada pada id provider `minimax`; setup OAuth CN/global tetap dapat mengarahkan region secara tidak langsung melalui `models.providers.minimax-portal.baseUrl`

Konfigurasi berada di bawah `plugins.entries.minimax.config.webSearch.*`.

<Note>
Lihat [MiniMax Search](/id/tools/minimax-search) untuk konfigurasi dan penggunaan web search lengkap.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Opsi konfigurasi">
    | Opsi | Deskripsi |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Gunakan `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.api` | Gunakan `anthropic-messages`; `openai-completions` opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisikan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias model yang Anda inginkan dalam allowlist |
    | `models.mode` | Tetap gunakan `merge` jika Anda ingin menambahkan MiniMax bersama model bawaan |
  </Accordion>

  <Accordion title="Default thinking">
    Pada `api: "anthropic-messages"`, OpenClaw menyuntikkan `thinking: { type: "disabled" }` kecuali thinking sudah diatur secara eksplisit di params/config.

    Ini mencegah endpoint streaming MiniMax mengeluarkan `reasoning_content` dalam chunk delta bergaya OpenAI, yang akan membocorkan reasoning internal ke output yang terlihat.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed` pada jalur stream yang kompatibel dengan Anthropic.
  </Accordion>

  <Accordion title="Contoh fallback">
    **Terbaik untuk:** mempertahankan model generasi terbaru terkuat Anda sebagai primary, lalu fail over ke MiniMax M2.7. Contoh di bawah menggunakan Opus sebagai primary konkret; ganti dengan model primary generasi terbaru yang Anda sukai.

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
    - API penggunaan Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (memerlukan coding plan key).
    - OpenClaw menormalisasi penggunaan coding-plan MiniMax ke tampilan `% tersisa` yang sama seperti provider lain. Field mentah `usage_percent` / `usagePercent` dari MiniMax adalah kuota yang tersisa, bukan kuota yang telah digunakan, sehingga OpenClaw membalikkannya. Field berbasis hitungan menang jika ada.
    - Ketika API mengembalikan `model_remains`, OpenClaw mengutamakan entri model chat, menurunkan label window dari `start_time` / `end_time` bila perlu, dan menyertakan nama model yang dipilih di label plan agar window coding-plan lebih mudah dibedakan.
    - Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama, dan mengutamakan OAuth MiniMax yang tersimpan sebelum fallback ke env var Coding Plan key.
  </Accordion>
</AccordionGroup>

## Catatan

- Model ref mengikuti jalur auth:
  - Setup API key: `minimax/<model>`
  - Setup OAuth: `minimax-portal/<model>`
- Model chat default: `MiniMax-M2.7`
- Model chat alternatif: `MiniMax-M2.7-highspeed`
- Onboarding dan setup API key langsung menulis definisi model eksplisit dengan `input: ["text", "image"]` untuk kedua varian M2.7
- Katalog provider bawaan saat ini menampilkan ref chat sebagai metadata khusus teks sampai konfigurasi provider MiniMax eksplisit ada
- Perbarui nilai harga di `models.json` jika Anda memerlukan pelacakan biaya yang akurat
- Gunakan `openclaw models list` untuk mengonfirmasi id provider saat ini, lalu ganti dengan `openclaw models set minimax/MiniMax-M2.7` atau `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Lihat [Model providers](/id/concepts/model-providers) untuk aturan provider.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Ini biasanya berarti **provider MiniMax belum dikonfigurasi** (tidak ada entri provider yang cocok dan tidak ditemukan auth profile/env key MiniMax). Perbaikan untuk deteksi ini ada di **2026.1.12**. Perbaiki dengan:

    - Upgrade ke **2026.1.12** (atau jalankan dari source `main`), lalu restart gateway.
    - Jalankan `openclaw configure` dan pilih opsi auth **MiniMax**, atau
    - Tambahkan blok `models.providers.minimax` atau `models.providers.minimax-portal` yang cocok secara manual, atau
    - Setel `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau auth profile MiniMax agar provider yang cocok dapat disuntikkan.

    Pastikan model id bersifat **case-sensitive**:

    - Jalur API key: `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed`
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
    Memilih provider, model ref, dan perilaku failover.
  </Card>
  <Card title="Generasi gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Generasi musik" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan provider.
  </Card>
  <Card title="Generasi video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="MiniMax Search" href="/id/tools/minimax-search" icon="magnifying-glass">
    Konfigurasi web search melalui MiniMax Coding Plan.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
