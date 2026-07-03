---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
    - Anda ingin menggunakan OpenRouter untuk pembuatan musik
    - Anda ingin menggunakan OpenRouter untuk pembuatan video
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T10:00:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. API ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

## Memulai

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Jalankan onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw membuka alur masuk browser OpenRouter, menukar kode PKCE
        dengan kunci API OpenRouter, dan menyimpan kunci tersebut di profil autentikasi
        OpenRouter default. Pada host jarak jauh/headless, OpenClaw mencetak
        URL masuk dan meminta Anda menempelkan URL pengalihan setelah masuk.
      </Step>
      <Step title="(Opsional) Beralih ke model tertentu">
        Onboarding menggunakan `openrouter/auto` secara default. Pilih model konkret nanti:

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
      <Step title="Jalankan onboarding kunci API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opsional) Beralih ke model tertentu">
        Onboarding menggunakan `openrouter/auto` secara default. Pilih model konkret nanti:

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
Ref model mengikuti pola `openrouter/<provider>/<model>`. Untuk daftar lengkap
penyedia dan model yang tersedia, lihat [/concepts/model-providers](/id/concepts/model-providers).
</Note>

Contoh fallback bawaan:

| Ref model                         | Catatan                      |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Perutean otomatis OpenRouter |
| `openrouter/openrouter/fusion`    | Router OpenRouter Fusion     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 melalui MoonshotAI |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 melalui MoonshotAI |

## Pembuatan gambar

OpenRouter juga dapat mendukung alat `image_generate`. Gunakan model gambar OpenRouter di bawah `agents.defaults.imageGenerationModel`:

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

OpenClaw mengirim permintaan gambar ke API gambar chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` OpenRouter. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk model gambar OpenRouter yang lebih lambat; parameter `timeoutMs` per panggilan alat `image_generate` tetap berlaku lebih dulu.

## Pembuatan video

OpenRouter juga dapat mendukung alat `video_generate` melalui API `/videos` asinkronnya. Gunakan model video OpenRouter di bawah `agents.defaults.videoGenerationModel`:

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

OpenClaw mengirim pekerjaan teks-ke-video dan gambar-ke-video ke OpenRouter, melakukan polling pada
`polling_url` yang dikembalikan, dan mengunduh video yang sudah selesai dari
`unsigned_urls` OpenRouter atau endpoint konten pekerjaan yang terdokumentasi.
Gambar referensi dikirim sebagai gambar frame pertama/terakhir secara default; gambar
yang diberi tag `reference_image` dikirim sebagai referensi input OpenRouter. Default
bawaan `google/veo-3.1-fast` mengiklankan durasi 4/6/8
detik yang saat ini didukung, resolusi `720P`/`1080P`, dan rasio aspek
`16:9`/`9:16`. Video-ke-video tidak didaftarkan untuk OpenRouter karena API
pembuatan video upstream saat ini menerima referensi teks dan gambar.

## Pembuatan musik

OpenRouter juga dapat mendukung alat `music_generate` melalui output audio
chat completions. Gunakan model audio OpenRouter di bawah
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

Penyedia musik OpenRouter bawaan menggunakan
`google/lyria-3-pro-preview` secara default dan juga mengekspos
`google/lyria-3-clip-preview`. OpenClaw mengirim `modalities: ["text",
"audio"]`, mengaktifkan streaming, mengumpulkan potongan audio yang dialirkan, dan menyimpan
hasilnya sebagai media yang dihasilkan untuk pengiriman channel. Gambar referensi
diterima untuk model Lyria melalui parameter bersama `music_generate image=...`.

## Teks-ke-ucapan

OpenRouter juga dapat digunakan sebagai penyedia TTS melalui endpoint
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

Jika `messages.tts.providers.openrouter.apiKey` dihilangkan, TTS menggunakan kembali
`models.providers.openrouter.apiKey`, lalu `OPENROUTER_API_KEY`.

## Ucapan-ke-teks (audio masuk)

OpenRouter dapat mentranskripsikan lampiran suara/audio yang masuk melalui jalur
`tools.media.audio` bersama menggunakan endpoint STT-nya (`/audio/transcriptions`).
Ini berlaku untuk Plugin channel apa pun yang meneruskan suara/audio masuk ke
prapemeriksaan pemahaman media.

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
`input_audio` (kontrak STT OpenRouter), bukan sebagai unggahan formulir OpenAI multipart.

## Router Fusion

Gunakan OpenRouter Fusion saat Anda ingin satu ref model OpenClaw meminta beberapa
model OpenRouter secara paralel, membuat OpenRouter menilai jawaban mereka, dan mengembalikan
satu respons akhir melalui endpoint penyedia OpenRouter normal. Karena slug model upstream adalah
`openrouter/fusion`, ref model OpenClaw menyertakan
prefiks penyedia OpenClaw dan namespace OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Konfigurasikan panel dan penilai Fusion melalui `params.extraBody` model. Field
tersebut diteruskan ke body permintaan chat-completions OpenRouter. Fusion
berfungsi dengan onboarding OAuth OpenRouter atau onboarding kunci API; jika Anda menggunakan
OAuth, hilangkan baris `env.OPENROUTER_API_KEY` dari contoh di bawah.

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

Daftar `analysis_models` adalah panel paralel, dan `model` di dalam konfigurasi
Plugin Fusion adalah model penilai. Jangan tetapkan `tool_choice` tingkat atas ke
`"required"` dalam giliran agen/chat OpenClaw normal untuk mencoba memaksa Fusion;
giliran OpenClaw dapat menyertakan definisi alat OpenClaw, dan pilihan alat wajib
tingkat atas dapat mewajibkan salah satu alat tersebut, bukan router Fusion. Saat
konfigurasi Plugin Fusion ini ada, OpenClaw juga menambahkan catatan
system-prompt yang disanitasi dengan model analisis dan model penilai yang dikonfigurasi agar
agen dapat menjawab pertanyaan tentang panel Fusion saat ini. Field `extraBody`
lainnya tidak disalin ke prompt.

Fusion sengaja dirancang lebih lambat. OpenRouter dapat mengirim prompt OpenClaw yang sama ke
beberapa model analisis lalu menjalankan langkah penilaian/sintesis akhir, sehingga latensi
biasanya lebih tinggi daripada permintaan langsung ke satu model. Gunakan Fusion untuk jawaban
yang deliberatif dan berkualitas tinggi atau jalur eskalasi, bukan sebagai default untuk
chat yang sensitif terhadap latensi. Untuk respons yang lebih cepat, pertahankan panel tetap kecil dan pilih
model analisis dan penilai yang lebih cepat.

Uji ref yang dikonfigurasi dengan satu panggilan model lokal sekali jalan:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autentikasi dan header

OpenRouter menggunakan token Bearer dengan kunci API Anda di balik layar. OAuth OpenRouter
adalah alur login PKCE yang menerbitkan kunci API OpenRouter, sehingga OpenClaw menyimpan
hasilnya sebagai profil autentikasi kunci API `openrouter:default` yang sama dengan yang digunakan oleh
jalur penyiapan kunci API manual.

Untuk instalasi yang sudah ada, masuk atau rotasi kunci OpenRouter tersimpan tanpa
menjalankan ulang onboarding penuh:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Gunakan `openclaw models auth login --provider openrouter --method api-key` saat
Anda ingin menempelkan kunci yang Anda buat secara manual di OpenRouter.

Pada permintaan OpenRouter nyata (`https://openrouter.ai/api/v1`), OpenClaw juga menambahkan
header atribusi aplikasi yang didokumentasikan OpenRouter:

| Header                    | Nilai                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jika Anda mengarahkan ulang penyedia OpenRouter ke proxy atau URL dasar lain, OpenClaw
**tidak** menyuntikkan header khusus OpenRouter tersebut atau penanda cache Anthropic.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Response caching">
    Caching respons OpenRouter bersifat opt-in. Aktifkan per model OpenRouter dengan
    parameter model:

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

    OpenClaw mengirim `X-OpenRouter-Cache: true` dan, saat dikonfigurasi,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` memaksa penyegaran untuk
    permintaan saat ini dan menyimpan respons pengganti. Alias snake_case
    (`response_cache`, `response_cache_ttl_seconds`, dan
    `response_cache_clear`) juga diterima.

    Ini terpisah dari caching prompt penyedia dan dari penanda
    `cache_control` Anthropic milik OpenRouter. Ini hanya diterapkan pada rute
    `openrouter.ai` yang terverifikasi, bukan URL dasar proxy khusus.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Pada rute OpenRouter yang terverifikasi, ref model Anthropic mempertahankan
    penanda `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    penggunaan ulang cache prompt yang lebih baik pada blok prompt sistem/pengembang.
  </Accordion>

  <Accordion title="Prefill penalaran Anthropic">
    Pada rute OpenRouter terverifikasi, ref model Anthropic dengan penalaran yang
    diaktifkan menghapus giliran prefill asisten di bagian akhir sebelum
    permintaan mencapai OpenRouter, sesuai dengan persyaratan Anthropic bahwa
    percakapan penalaran harus berakhir dengan giliran pengguna.
  </Accordion>

  <Accordion title="Injeksi berpikir / penalaran">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat berpikir yang
    dipilih ke payload penalaran proksi OpenRouter. Hint model yang tidak
    didukung dan `openrouter/auto` melewati injeksi penalaran tersebut. Hunter
    Alpha juga melewati penalaran proksi untuk ref model terkonfigurasi yang
    usang karena OpenRouter dapat mengembalikan teks jawaban akhir di kolom
    penalaran untuk rute yang sudah dihentikan itu.
  </Accordion>

  <Accordion title="Pemutaran ulang penalaran DeepSeek V4">
    Pada rute OpenRouter terverifikasi, `openrouter/deepseek/deepseek-v4-flash`
    dan `openrouter/deepseek/deepseek-v4-pro` mengisi `reasoning_content` yang
    hilang pada giliran asisten yang diputar ulang agar percakapan
    berpikir/tool mempertahankan bentuk tindak lanjut yang diwajibkan DeepSeek
    V4. OpenClaw mengirim nilai `reasoning.effort` yang didukung OpenRouter
    untuk rute ini; tingkat non-off yang lebih rendah dipetakan ke `high`, dan
    override `max` yang usang dipetakan ke `xhigh`.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proksi,
    sehingga pembentukan permintaan khusus OpenAI asli seperti `serviceTier`,
    Responses `store`, payload kompatibilitas penalaran OpenAI, dan hint
    prompt-cache tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Ref OpenRouter berbasis Gemini tetap berada di jalur proksi-Gemini:
    OpenClaw mempertahankan sanitasi thought-signature Gemini di sana, tetapi
    tidak mengaktifkan validasi pemutaran ulang Gemini asli atau penulisan ulang
    bootstrap.
  </Accordion>

  <Accordion title="Metadata perutean penyedia">
    OpenRouter mendukung objek permintaan `provider` untuk perutean penyedia
    yang mendasarinya. Konfigurasikan kebijakan default untuk semua permintaan
    model teks OpenRouter dengan `models.providers.openrouter.params.provider`:

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

    OpenClaw meneruskan objek tersebut ke OpenRouter sebagai payload permintaan
    `provider`. Gunakan kolom snake_case yang didokumentasikan OpenRouter,
    termasuk `sort`, `only`, `ignore`, `order`, `allow_fallbacks`,
    `require_parameters`, `data_collection`, `quantizations`, `max_price`,
    `preferred_max_latency`, `preferred_min_throughput`, `zdr`, dan
    `enforce_distillable_text`.

    Param per model tetap menimpa objek perutean tingkat penyedia:

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

    Ini hanya berlaku pada rute chat-completions OpenRouter. Rute Anthropic,
    Google, OpenAI, atau penyedia kustom langsung mengabaikan param perutean
    OpenRouter.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
