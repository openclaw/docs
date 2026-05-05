---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
    - Anda ingin menggunakan OpenRouter untuk pembuatan video
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. API ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Jalankan onboarding">
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

| Referensi model                  | Catatan                        |
| -------------------------------- | ------------------------------ |
| `openrouter/auto`                | Perutean otomatis OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 melalui MoonshotAI   |

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

OpenClaw mengirim permintaan gambar ke API gambar chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` OpenRouter. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk model gambar OpenRouter yang lebih lambat; parameter `timeoutMs` per-panggilan milik alat `image_generate` tetap diutamakan.

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

OpenClaw mengirim tugas teks-ke-video dan gambar-ke-video ke OpenRouter, melakukan polling
pada `polling_url` yang dikembalikan, dan mengunduh video yang selesai dari
`unsigned_urls` OpenRouter atau endpoint konten tugas yang terdokumentasi.
Gambar referensi dikirim sebagai gambar frame pertama/terakhir secara default; gambar
yang ditandai dengan `reference_image` dikirim sebagai referensi input OpenRouter. Default
bawaan `google/veo-3.1-fast` mengiklankan durasi 4/6/8
detik yang saat ini didukung, resolusi `720P`/`1080P`, dan rasio aspek
`16:9`/`9:16`. Video-ke-video tidak didaftarkan untuk OpenRouter karena API
pembuatan video upstream saat ini menerima teks dan referensi gambar.

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

## Autentikasi dan header

OpenRouter menggunakan token Bearer dengan kunci API Anda di balik layar.

Pada permintaan OpenRouter nyata (`https://openrouter.ai/api/v1`), OpenClaw juga menambahkan
header atribusi aplikasi yang terdokumentasi oleh OpenRouter:

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
  <Accordion title="Caching respons">
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

  <Accordion title="Penanda cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic mempertahankan
    penanda `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    penggunaan ulang prompt-cache yang lebih baik pada blok prompt sistem/developer.
  </Accordion>

  <Accordion title="Prefill reasoning Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic dengan reasoning aktif
    menghapus giliran prefill asisten di akhir sebelum permintaan mencapai OpenRouter,
    sesuai dengan persyaratan Anthropic bahwa percakapan reasoning diakhiri dengan giliran
    pengguna.
  </Accordion>

  <Accordion title="Injeksi thinking / reasoning">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan level thinking yang dipilih ke
    payload reasoning proxy OpenRouter. Petunjuk model yang tidak didukung dan
    `openrouter/auto` melewati injeksi reasoning tersebut. Hunter Alpha juga melewati
    reasoning proxy untuk referensi model terkonfigurasi yang usang karena OpenRouter dapat
    mengembalikan teks jawaban akhir di kolom reasoning untuk rute yang sudah dihentikan itu.
  </Accordion>

  <Accordion title="Replay reasoning DeepSeek V4">
    Pada rute OpenRouter yang terverifikasi, `openrouter/deepseek/deepseek-v4-flash` dan
    `openrouter/deepseek/deepseek-v4-pro` mengisi `reasoning_content` yang hilang pada
    giliran asisten yang diputar ulang agar percakapan thinking/tool mempertahankan bentuk
    tindak lanjut yang diwajibkan DeepSeek V4. OpenClaw mengirim nilai
    `reasoning_effort` yang didukung OpenRouter untuk rute ini; `xhigh` adalah level
    tertinggi yang diiklankan, dan override `max` yang usang dipetakan ke `xhigh`.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proxy, sehingga
    pembentukan permintaan khusus OpenAI native seperti `serviceTier`, `store` Responses,
    payload kompatibilitas reasoning OpenAI, dan petunjuk prompt-cache tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Referensi OpenRouter berbasis Gemini tetap berada pada jalur proxy-Gemini: OpenClaw mempertahankan
    sanitasi thought-signature Gemini di sana, tetapi tidak mengaktifkan validasi replay Gemini native
    atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Metadata perutean penyedia">
    Jika Anda meneruskan perutean penyedia OpenRouter di bawah parameter model, OpenClaw meneruskannya
    sebagai metadata perutean OpenRouter sebelum pembungkus stream bersama berjalan.
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
