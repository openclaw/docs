---
read_when:
    - Anda menginginkan satu API key untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
    - Anda ingin menggunakan OpenRouter untuk pembuatan musik
    - Anda ingin menggunakan OpenRouter untuk pembuatan video
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:06:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
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
        dengan kunci API OpenRouter, dan menyimpan kunci itu di profil autentikasi
        OpenRouter default. Pada host jarak jauh/headless, OpenClaw mencetak URL
        masuk dan meminta Anda menempelkan URL pengalihan setelah masuk.
      </Step>
      <Step title="(Opsional) Beralih ke model tertentu">
        Onboarding default ke `openrouter/auto`. Pilih model konkret nanti:

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
        Onboarding default ke `openrouter/auto`. Pilih model konkret nanti:

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

Contoh fallback bawaan:

| Referensi model                  | Catatan                     |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Perutean otomatis OpenRouter |
| `openrouter/openrouter/fusion`    | Router Fusion OpenRouter     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

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

OpenClaw mengirim permintaan gambar ke API gambar chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` OpenRouter. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk model gambar OpenRouter yang lebih lambat; parameter `timeoutMs` per panggilan milik alat `image_generate` tetap lebih diprioritaskan.

## Pembuatan video

OpenRouter juga dapat mendukung alat `video_generate` melalui API asinkron `/videos` miliknya. Gunakan model video OpenRouter di bawah `agents.defaults.videoGenerationModel`:

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

OpenClaw mengirim pekerjaan teks-ke-video dan gambar-ke-video ke OpenRouter, melakukan polling
pada `polling_url` yang dikembalikan, dan mengunduh video selesai dari
`unsigned_urls` OpenRouter atau endpoint konten pekerjaan yang terdokumentasi.
Gambar referensi dikirim sebagai gambar frame pertama/terakhir secara default; gambar
yang diberi tag `reference_image` dikirim sebagai referensi input OpenRouter. Default
bawaan `google/veo-3.1-fast` mengiklankan durasi 4/6/8
detik, resolusi `720P`/`1080P`, dan rasio aspek `16:9`/`9:16` yang saat ini didukung.
Video-ke-video tidak didaftarkan untuk OpenRouter karena API pembuatan video upstream
saat ini menerima referensi teks dan gambar.

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

Penyedia musik OpenRouter bawaan default ke
`google/lyria-3-pro-preview` dan juga mengekspos
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

OpenRouter dapat mentranskripsikan lampiran suara/audio masuk melalui jalur bersama
`tools.media.audio` menggunakan endpoint STT miliknya (`/audio/transcriptions`).
Ini berlaku untuk Plugin channel apa pun yang meneruskan suara/audio masuk ke
preflight pemahaman media.

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
`input_audio` (kontrak STT OpenRouter), bukan sebagai unggahan formulir multipart OpenAI.

## Router Fusion

Gunakan OpenRouter Fusion saat Anda ingin satu referensi model OpenClaw meminta beberapa
model OpenRouter secara paralel, meminta OpenRouter menilai jawaban mereka, dan mengembalikan
satu respons final melalui endpoint penyedia OpenRouter normal. Karena slug model
upstream adalah `openrouter/fusion`, referensi model OpenClaw menyertakan
prefiks penyedia OpenClaw dan namespace OpenRouter upstream:

```bash
openclaw models set openrouter/openrouter/fusion
```

Konfigurasikan panel dan penilai Fusion melalui `params.extraBody` model. Field
tersebut diteruskan ke isi permintaan chat-completions OpenRouter. Fusion
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

Daftar `analysis_models` adalah panel paralel, dan `model` di dalam konfigurasi Plugin
Fusion adalah model penilai. Jangan tetapkan `tool_choice` tingkat atas ke
`"required"` dalam giliran agen/chat OpenClaw normal untuk mencoba memaksa Fusion;
giliran OpenClaw dapat menyertakan definisi alat OpenClaw, dan pilihan alat wajib
tingkat atas dapat mewajibkan salah satu alat tersebut, bukan router Fusion. Saat
konfigurasi Plugin Fusion ini ada, OpenClaw juga menambahkan catatan system-prompt
yang disanitasi dengan model analisis dan model penilai yang dikonfigurasi agar
agen dapat menjawab pertanyaan tentang panel Fusion saat ini. Field `extraBody`
lain tidak disalin ke prompt.

Fusion lebih lambat secara desain. OpenRouter dapat mengirim prompt OpenClaw yang sama ke
beberapa model analisis lalu menjalankan langkah penilaian/sintesis final, sehingga latensi
biasanya lebih tinggi daripada permintaan langsung ke satu model. Gunakan Fusion untuk jawaban
yang disengaja dan berkualitas tinggi atau jalur eskalasi, bukan sebagai default untuk
chat yang sensitif terhadap latensi. Untuk respons yang lebih cepat, jaga panel tetap kecil dan pilih
model analisis serta penilai yang lebih cepat.

Uji referensi yang dikonfigurasi dengan panggilan model lokal sekali jalan:

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

Untuk instalasi yang sudah ada, masuk atau rotasi kunci OpenRouter yang tersimpan tanpa
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
**tidak** menyuntikkan header khusus OpenRouter tersebut atau marker cache Anthropic.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Cache respons">
    Cache respons OpenRouter bersifat opt-in. Aktifkan per model OpenRouter dengan
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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` memaksa refresh untuk
    permintaan saat ini dan menyimpan respons pengganti. Alias snake_case
    (`response_cache`, `response_cache_ttl_seconds`, dan
    `response_cache_clear`) juga diterima.

    Ini terpisah dari cache prompt penyedia dan dari marker
    `cache_control` Anthropic milik OpenRouter. Ini hanya diterapkan pada rute
    `openrouter.ai` yang terverifikasi, bukan URL dasar proxy kustom.

  </Accordion>

  <Accordion title="Marker cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic mempertahankan
    marker `cache_control` khusus OpenRouter untuk Anthropic yang digunakan OpenClaw untuk
    penggunaan ulang cache prompt yang lebih baik pada blok prompt sistem/developer.
  </Accordion>

  <Accordion title="Prefill penalaran Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic dengan penalaran diaktifkan
    menghapus giliran prefill asisten di akhir sebelum permintaan mencapai OpenRouter,
    sesuai dengan persyaratan Anthropic bahwa percakapan penalaran harus berakhir dengan giliran
    pengguna.
  </Accordion>

  <Accordion title="Injeksi thinking / reasoning">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat thinking yang dipilih ke
    payload penalaran proxy OpenRouter. Petunjuk model yang tidak didukung dan
    `openrouter/auto` melewati injeksi penalaran tersebut. Hunter Alpha juga melewati
    penalaran proxy untuk referensi model terkonfigurasi yang usang karena OpenRouter dapat
    mengembalikan teks jawaban akhir di bidang penalaran untuk rute yang sudah dihentikan tersebut.
  </Accordion>

  <Accordion title="Pemutaran ulang penalaran DeepSeek V4">
    Pada rute OpenRouter yang terverifikasi, `openrouter/deepseek/deepseek-v4-flash` dan
    `openrouter/deepseek/deepseek-v4-pro` mengisi `reasoning_content` yang hilang pada
    giliran asisten yang diputar ulang sehingga percakapan thinking/tool mempertahankan bentuk
    tindak lanjut yang diwajibkan DeepSeek V4. OpenClaw mengirim nilai
    `reasoning_effort` yang didukung OpenRouter untuk rute-rute ini; `xhigh` adalah tingkat
    tertinggi yang diiklankan, dan override `max` yang usang dipetakan ke `xhigh`.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter masih berjalan melalui jalur proxy bergaya kompatibel OpenAI, sehingga
    pembentukan permintaan native yang khusus OpenAI seperti `serviceTier`, Responses `store`,
    payload kompatibilitas penalaran OpenAI, dan petunjuk prompt-cache tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Referensi OpenRouter berbasis Gemini tetap berada di jalur proxy-Gemini: OpenClaw mempertahankan
    sanitasi thought-signature Gemini di sana, tetapi tidak mengaktifkan validasi pemutaran ulang
    native Gemini atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Metadata perutean penyedia">
    OpenRouter mendukung objek permintaan `provider` untuk perutean penyedia yang mendasarinya.
    Konfigurasikan kebijakan default untuk semua permintaan model teks OpenRouter
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
    permintaan. Gunakan bidang snake_case terdokumentasi OpenRouter, termasuk `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, dan `enforce_distillable_text`.

    Param per model tetap menimpa objek perutean di seluruh penyedia:

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
    Google, OpenAI langsung, atau penyedia khusus mengabaikan param perutean OpenRouter.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
