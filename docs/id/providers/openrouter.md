---
read_when:
    - Anda ingin satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
    - Anda ingin menggunakan OpenRouter untuk pembuatan video
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. Ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

## Memulai

<Steps>
  <Step title="Get your API key">
    Buat kunci API di [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    Onboarding menggunakan default `openrouter/auto`. Pilih model konkret nanti:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

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

OpenClaw mengirim permintaan gambar ke API gambar chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` OpenRouter. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk model gambar OpenRouter yang lebih lambat; parameter `timeoutMs` per panggilan milik alat `image_generate` tetap diutamakan.

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

OpenClaw mengirim tugas teks-ke-video dan gambar-ke-video ke OpenRouter, melakukan polling
pada `polling_url` yang dikembalikan, dan mengunduh video yang selesai dari
`unsigned_urls` OpenRouter atau endpoint konten tugas yang terdokumentasi.
Gambar referensi dikirim sebagai gambar bingkai pertama/terakhir secara default; gambar
yang ditandai dengan `reference_image` dikirim sebagai referensi input OpenRouter. Default
bawaan `google/veo-3.1-fast` mengiklankan durasi 4/6/8 detik yang saat ini didukung,
resolusi `720P`/`1080P`, dan rasio aspek `16:9`/`9:16`. Video-ke-video tidak didaftarkan
untuk OpenRouter karena API pembuatan video upstream saat ini menerima teks dan referensi gambar.

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
          voice: "af_alloy",
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
Ini berlaku untuk Plugin kanal apa pun yang meneruskan suara/audio masuk ke
pra-pemeriksaan pemahaman media.

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

## Autentikasi dan header

OpenRouter menggunakan token Bearer dengan kunci API Anda di balik layar.

Pada permintaan OpenRouter sungguhan (`https://openrouter.ai/api/v1`), OpenClaw juga menambahkan
header atribusi aplikasi yang terdokumentasi oleh OpenRouter:

| Header                    | Nilai                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jika Anda mengarahkan ulang penyedia OpenRouter ke proksi atau URL dasar lain, OpenClaw
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
    `openrouter.ai` terverifikasi, bukan URL dasar proksi kustom.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Pada rute OpenRouter terverifikasi, ref model Anthropic mempertahankan
    penanda `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    penggunaan ulang cache prompt yang lebih baik pada blok prompt sistem/pengembang.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Pada rute OpenRouter terverifikasi, ref model Anthropic dengan reasoning diaktifkan
    menghapus giliran prefill asisten di akhir sebelum permintaan mencapai OpenRouter,
    sesuai dengan persyaratan Anthropic bahwa percakapan reasoning berakhir dengan giliran
    pengguna.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan level thinking yang dipilih ke
    payload reasoning proksi OpenRouter. Petunjuk model yang tidak didukung dan
    `openrouter/auto` melewati injeksi reasoning tersebut. Hunter Alpha juga melewati
    reasoning proksi untuk ref model terkonfigurasi yang kedaluwarsa karena OpenRouter dapat
    mengembalikan teks jawaban akhir dalam kolom reasoning untuk rute yang telah dihentikan tersebut.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Pada rute OpenRouter terverifikasi, `openrouter/deepseek/deepseek-v4-flash` dan
    `openrouter/deepseek/deepseek-v4-pro` mengisi `reasoning_content` yang hilang pada
    giliran asisten yang diputar ulang agar percakapan thinking/alat mempertahankan bentuk
    tindak lanjut yang diperlukan DeepSeek V4. OpenClaw mengirim nilai
    `reasoning_effort` yang didukung OpenRouter untuk rute ini; `xhigh` adalah level
    tertinggi yang diiklankan, dan override `max` yang kedaluwarsa dipetakan ke `xhigh`.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proksi, sehingga
    pembentukan permintaan khusus OpenAI native seperti `serviceTier`, Responses `store`,
    payload kompatibilitas reasoning OpenAI, dan petunjuk cache prompt tidak diteruskan.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Ref OpenRouter yang didukung Gemini tetap berada di jalur proksi-Gemini: OpenClaw mempertahankan
    sanitasi tanda tangan pemikiran Gemini di sana, tetapi tidak mengaktifkan validasi replay
    Gemini native atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Jika Anda meneruskan perutean penyedia OpenRouter di bawah parameter model, OpenClaw meneruskannya
    sebagai metadata perutean OpenRouter sebelum wrapper stream bersama berjalan.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agent, model, dan penyedia.
  </Card>
</CardGroup>
