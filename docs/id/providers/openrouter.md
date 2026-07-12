---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
    - Anda ingin menggunakan OpenRouter untuk menghasilkan musik
    - Anda ingin menggunakan OpenRouter untuk pembuatan video
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T14:33:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter merutekan permintaan ke banyak model di balik satu API dan satu kunci. OpenRouter
kompatibel dengan OpenAI, sehingga OpenClaw berkomunikasi dengannya melalui transport bergaya
`openai-completions` yang sama seperti yang digunakan untuk penyedia proksi lainnya.

## Memulai

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Jalankan orientasi OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw membuka alur masuk melalui peramban OpenRouter (PKCE), menukarkan
        kode dengan kunci API OpenRouter, dan menyimpannya dalam profil autentikasi
        OpenRouter bawaan. Pada host jarak jauh/tanpa antarmuka grafis, OpenClaw mencetak
        URL masuk dan meminta Anda menempelkan URL pengalihan setelah masuk.
      </Step>
      <Step title="(Opsional) Beralih ke model tertentu">
        Orientasi menggunakan `openrouter/auto` secara bawaan. Pilih model tertentu nanti:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Kunci API">
    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat kunci API di [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Jalankan orientasi dengan kunci API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opsional) Beralih ke model tertentu">
        Orientasi menggunakan `openrouter/auto` secara bawaan. Pilih model tertentu nanti:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Contoh konfigurasi

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referensi model

<Note>
Referensi model mengikuti pola `openrouter/<provider>/<model>`. Untuk daftar lengkap
penyedia dan model yang tersedia, lihat [/concepts/model-providers](/id/concepts/model-providers).
</Note>

Model fallback bawaan, yang digunakan ketika penemuan katalog langsung tidak tersedia:

| Referensi model                   | Catatan                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Perutean otomatis OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 melalui MoonshotAI |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 melalui MoonshotAI |

Referensi `openrouter/<provider>/<model>` lainnya, termasuk
`openrouter/openrouter/fusion` (lihat [Perute Fusion](#fusion-router)), diselesaikan
secara dinamis terhadap katalog model langsung OpenRouter.

## Pembuatan gambar

OpenRouter dapat mendukung alat `image_generate`. Tetapkan model gambar OpenRouter
di bawah `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw mengirim permintaan gambar ke API gambar penyelesaian obrolan OpenRouter dengan
`modalities: ["image", "text"]`. Model gambar Gemini juga menerima petunjuk
`aspectRatio` dan `resolution` melalui `image_config` OpenRouter; model
gambar lainnya tidak. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk
model yang lebih lambat; `timeoutMs` per panggilan milik alat `image_generate` tetap diutamakan.

## Pembuatan video

OpenRouter dapat mendukung alat `video_generate` melalui API asinkron
`/videos`. Tetapkan model video OpenRouter di bawah
`agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw mengirim pekerjaan teks-ke-video dan gambar-ke-video, melakukan polling pada
`polling_url` yang dikembalikan, dan mengunduh video yang telah selesai dari
`unsigned_urls` OpenRouter atau titik akhir konten pekerjaan. Gambar referensi secara bawaan
digunakan sebagai gambar bingkai pertama/terakhir; gambar yang diberi tag `reference_image`
dikirim sebagai referensi masukan. Model bawaan `google/veo-3.1-fast` mendukung durasi
4/6/8 detik, resolusi `720P`/`1080P`, dan rasio aspek `16:9`/`9:16`.
Video-ke-video tidak didukung: API hulu hanya menerima referensi teks dan gambar.

## Pembuatan musik

OpenRouter dapat mendukung alat `music_generate` melalui keluaran audio penyelesaian obrolan.
Tetapkan model audio OpenRouter di bawah
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Penyedia musik OpenRouter bawaan menggunakan `google/lyria-3-pro-preview`
secara bawaan dan juga menyediakan `google/lyria-3-clip-preview`. OpenClaw mengirim `modalities:
["text", "audio"]`, mengalirkan respons, mengumpulkan potongan audio, dan menyimpan
hasilnya sebagai media yang dihasilkan untuk dikirimkan melalui saluran. Model Lyria menerima satu
gambar referensi melalui parameter bersama `music_generate image=...`.
Audio streaming, penyimpanan transkrip, dan amplop peristiwa SSE yang dihasilkan
dibatasi oleh `agents.defaults.mediaMaxMb` (batas audio bawaan adalah 16 MB).

## Teks-ke-ucapan

OpenRouter dapat bertindak sebagai penyedia TTS melalui endpoint
`/audio/speech` yang kompatibel dengan OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Jika `messages.tts.providers.openrouter.apiKey` tidak dicantumkan, TTS akan beralih menggunakan
`models.providers.openrouter.apiKey`, lalu `OPENROUTER_API_KEY`.

## Ucapan ke teks (audio masuk)

OpenRouter dapat mentranskripsikan lampiran suara/audio yang masuk melalui jalur bersama
`tools.media.audio`, menggunakan endpoint STT-nya (`/audio/transcriptions`).
Hal ini berlaku untuk setiap plugin kanal yang meneruskan suara/audio masuk ke
pemeriksaan awal pemahaman media.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw mengirim permintaan STT OpenRouter sebagai JSON dengan audio base64 di bawah
`input_audio` (kontrak STT OpenRouter), bukan sebagai unggahan formulir OpenAI
multipart.

## Router Fusion

OpenRouter Fusion mengirim satu referensi model OpenClaw ke beberapa model OpenRouter secara
paralel, meminta OpenRouter menilai jawaban mereka, dan mengembalikan satu respons akhir
melalui endpoint OpenRouter biasa. Slug model upstream adalah
`openrouter/fusion`, sehingga referensi model OpenClaw membawa prefiks penyedia OpenClaw
dan namespace OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Konfigurasikan panel dan penilai Fusion melalui `params.extraBody` milik model;
bidang tersebut diteruskan langsung ke isi permintaan penyelesaian percakapan OpenRouter.
Fusion berfungsi dengan orientasi OAuth maupun kunci API; jika Anda menggunakan OAuth,
hilangkan baris `env.OPENROUTER_API_KEY` di bawah ini.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` adalah panel paralel; `model` di dalam konfigurasi plugin Fusion
adalah model penilai. Jangan atur `tool_choice` tingkat atas menjadi `"required"`
dalam giliran agen/percakapan biasa untuk mencoba memaksa Fusion: giliran OpenClaw dapat menyertakan
definisi alatnya sendiri, dan pilihan alat wajib tingkat atas mungkin memilih salah satu
alat tersebut alih-alih router Fusion. Saat konfigurasi plugin Fusion ini tersedia,
OpenClaw menambahkan catatan perintah sistem yang telah disanitasi dan mencantumkan model analisis
serta model penilai yang dikonfigurasi, sehingga agen dapat menjawab pertanyaan tentang panel Fusion
miliknya sendiri. Bidang `extraBody` lainnya tidak disalin ke dalam perintah.

Fusion sengaja dirancang lebih lambat: OpenRouter menyebarkan perintah ke beberapa
model analisis, lalu menjalankan langkah penilaian/sintesis, sehingga latensinya lebih tinggi daripada
permintaan langsung ke satu model. Gunakan untuk jawaban yang dipertimbangkan dengan matang dan berkualitas tinggi atau
jalur eskalasi, bukan sebagai nilai bawaan yang peka terhadap latensi. Pertahankan ukuran panel tetap kecil dan
pilih model analisis/penilai yang lebih cepat untuk memperoleh respons lebih cepat.

Uji referensi yang telah dikonfigurasi dengan satu panggilan lokal:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autentikasi dan header

OpenRouter menggunakan token Bearer dari kunci API Anda. OAuth OpenRouter adalah alur
masuk PKCE yang menerbitkan kunci API OpenRouter, sehingga OpenClaw menyimpan hasilnya dalam
profil autentikasi kunci API `openrouter:default` yang sama dengan yang digunakan oleh penyiapan
kunci API manual.

Untuk masuk atau merotasi kunci yang tersimpan pada instalasi yang sudah ada tanpa menjalankan ulang
seluruh orientasi:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Pada permintaan OpenRouter yang terverifikasi (`https://openrouter.ai/api/v1`), OpenClaw menambahkan
header atribusi aplikasi OpenRouter yang terdokumentasi:

| Header                    | Nilai                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jika Anda mengarahkan ulang penyedia OpenRouter ke proksi atau URL dasar lain, OpenClaw
**tidak** menyisipkan header khusus OpenRouter atau penanda cache Anthropic tersebut.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penyimpanan cache respons">
    Penyimpanan cache respons OpenRouter bersifat opsional. Aktifkan untuk setiap model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mengirim `X-OpenRouter-Cache: true` dan, jika dikonfigurasi,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` memaksa penyegaran untuk
    permintaan saat ini dan menyimpan respons penggantinya. Alias snake_case
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) diterima, demikian pula `responseCacheTtl` /
    `response_cache_ttl` tanpa sufiks `Seconds`.

    Ini terpisah dari penyimpanan cache perintah penyedia dan penanda
    `cache_control` Anthropic milik OpenRouter. Fitur ini hanya berlaku pada rute
    `openrouter.ai` yang terverifikasi, bukan URL dasar proksi khusus.

  </Accordion>

  <Accordion title="Penanda cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic mempertahankan
    penanda `cache_control` Anthropic milik OpenRouter agar cache perintah dapat digunakan kembali dengan lebih baik pada
    blok perintah sistem/pengembang.
  </Accordion>

  <Accordion title="Prefill penalaran Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic dengan penalaran diaktifkan
    menghapus giliran prefill asisten di bagian akhir sebelum permintaan mencapai
    OpenRouter, sesuai dengan persyaratan Anthropic bahwa percakapan penalaran
    harus diakhiri dengan giliran pengguna.
  </Accordion>

  <Accordion title="Injeksi pemikiran / penalaran">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat pemikiran yang dipilih
    ke payload penalaran proksi OpenRouter. `openrouter/auto` dan petunjuk model
    yang tidak didukung melewati injeksi tersebut. Referensi `openrouter/hunter-alpha` yang usang juga
    melewatinya karena OpenRouter dapat mengembalikan teks jawaban akhir dalam kolom
    penalaran pada rute yang telah dihentikan tersebut.
  </Accordion>

  <Accordion title="Pemutaran ulang penalaran DeepSeek V4">
    Pada rute OpenRouter yang terverifikasi, `openrouter/deepseek/deepseek-v4-flash` dan
    `openrouter/deepseek/deepseek-v4-pro` mengisi `reasoning_content` yang tidak ada pada
    giliran asisten yang diputar ulang, sehingga percakapan pemikiran/alat tetap dalam
    format tindak lanjut yang diwajibkan DeepSeek V4. OpenClaw mengirim nilai
    `reasoning.effort` yang didukung OpenRouter untuk rute ini: `xhigh`/`max` dipetakan ke `xhigh`,
    sedangkan setiap tingkat aktif lainnya dipetakan ke `high`.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter berjalan melalui jalur kompatibel OpenAI bergaya proksi, sehingga
    pembentukan permintaan khusus OpenAI native seperti `serviceTier`, `store` pada Responses,
    payload kompatibilitas penalaran OpenAI, dan petunjuk cache prompt tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Referensi OpenRouter berbasis Gemini tetap berada pada jalur proksi-Gemini: OpenClaw mempertahankan
    sanitasi tanda tangan pemikiran Gemini di sana, tetapi tidak mengaktifkan validasi
    pemutaran ulang Gemini native atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Metadata perutean penyedia">
    OpenRouter mendukung objek permintaan `provider` untuk perutean penyedia
    yang mendasarinya. Konfigurasikan kebijakan bawaan untuk semua permintaan model teks OpenRouter
    dengan `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw meneruskan objek tersebut ke OpenRouter sebagai payload `provider`
    permintaan. Gunakan kolom snake_case yang didokumentasikan OpenRouter, termasuk `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, dan `enforce_distillable_text`.

    Parameter per model menggantikan objek perutean tingkat penyedia:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Ini hanya berlaku pada rute chat-completions OpenRouter. Rute langsung Anthropic,
    Google, OpenAI, atau penyedia khusus mengabaikan parameter perutean OpenRouter.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan kegagalan.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
