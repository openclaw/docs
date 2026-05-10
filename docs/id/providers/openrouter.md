---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
    - Anda ingin menggunakan OpenRouter untuk pembuatan video
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
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
    Onboarding secara default menggunakan `openrouter/auto`. Pilih model konkret nanti:

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

| Ref model                         | Catatan                         |
| --------------------------------- | ------------------------------- |
| `openrouter/auto`                 | Perutean otomatis OpenRouter    |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 melalui MoonshotAI    |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 melalui MoonshotAI    |

## Pembuatan gambar

OpenRouter juga dapat mendukung tool `image_generate`. Gunakan model gambar OpenRouter di bawah `agents.defaults.imageGenerationModel`:

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

OpenClaw mengirim permintaan gambar ke API gambar chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` OpenRouter. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk model gambar OpenRouter yang lebih lambat; parameter `timeoutMs` per panggilan milik tool `image_generate` tetap diutamakan.

## Pembuatan video

OpenRouter juga dapat mendukung tool `video_generate` melalui API `/videos` asinkronnya. Gunakan model video OpenRouter di bawah `agents.defaults.videoGenerationModel`:

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
pada `polling_url` yang dikembalikan, dan mengunduh video yang selesai dari
`unsigned_urls` OpenRouter atau endpoint konten pekerjaan yang terdokumentasi.
Gambar referensi dikirim sebagai gambar frame pertama/terakhir secara default; gambar
yang diberi tag `reference_image` dikirim sebagai referensi input OpenRouter. Default
bawaan `google/veo-3.1-fast` mengiklankan durasi 4/6/8 detik yang saat ini
didukung, resolusi `720P`/`1080P`, dan rasio aspek `16:9`/`9:16`.
Video-ke-video tidak terdaftar untuk OpenRouter karena API pembuatan video upstream
saat ini menerima teks dan referensi gambar.

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
header atribusi aplikasi OpenRouter yang terdokumentasi:

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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` memaksa refresh untuk
    permintaan saat ini dan menyimpan respons pengganti. Alias snake_case
    (`response_cache`, `response_cache_ttl_seconds`, dan
    `response_cache_clear`) juga diterima.

    Ini terpisah dari caching prompt penyedia dan dari marker
    `cache_control` Anthropic milik OpenRouter. Ini hanya diterapkan pada rute
    `openrouter.ai` yang terverifikasi, bukan URL dasar proxy kustom.

  </Accordion>

  <Accordion title="Marker cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, ref model Anthropic mempertahankan
    marker `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    penggunaan ulang cache prompt yang lebih baik pada blok prompt sistem/developer.
  </Accordion>

  <Accordion title="Prefill penalaran Anthropic">
    Pada rute OpenRouter yang terverifikasi, ref model Anthropic dengan penalaran yang diaktifkan
    menghapus giliran prefill asisten di akhir sebelum permintaan mencapai OpenRouter,
    sesuai dengan persyaratan Anthropic bahwa percakapan penalaran harus berakhir dengan giliran pengguna.
  </Accordion>

  <Accordion title="Injeksi thinking / penalaran">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat thinking yang dipilih ke
    payload penalaran proxy OpenRouter. Petunjuk model yang tidak didukung dan
    `openrouter/auto` melewati injeksi penalaran tersebut. Hunter Alpha juga melewati
    penalaran proxy untuk ref model terkonfigurasi yang kedaluwarsa karena OpenRouter dapat
    mengembalikan teks jawaban akhir dalam kolom penalaran untuk rute yang sudah dihentikan tersebut.
  </Accordion>

  <Accordion title="Pemutaran ulang penalaran DeepSeek V4">
    Pada rute OpenRouter yang terverifikasi, `openrouter/deepseek/deepseek-v4-flash` dan
    `openrouter/deepseek/deepseek-v4-pro` mengisi `reasoning_content` yang hilang pada
    giliran asisten yang diputar ulang agar percakapan thinking/tool mempertahankan bentuk
    tindak lanjut yang diwajibkan DeepSeek V4. OpenClaw mengirim nilai
    `reasoning_effort` yang didukung OpenRouter untuk rute ini; `xhigh` adalah tingkat
    tertinggi yang diiklankan, dan override `max` yang kedaluwarsa dipetakan ke `xhigh`.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proxy, sehingga
    pembentukan permintaan khusus OpenAI native seperti `serviceTier`, `store` Responses,
    payload kompatibilitas penalaran OpenAI, dan petunjuk cache prompt tidak diteruskan.
  </Accordion>

  <Accordion title="Rute yang didukung Gemini">
    Ref OpenRouter yang didukung Gemini tetap berada di jalur proxy-Gemini: OpenClaw mempertahankan
    sanitasi thought-signature Gemini di sana, tetapi tidak mengaktifkan validasi pemutaran ulang Gemini
    native atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Metadata perutean penyedia">
    Jika Anda meneruskan perutean penyedia OpenRouter di bawah parameter model, OpenClaw meneruskannya
    sebagai metadata perutean OpenRouter sebelum wrapper stream bersama berjalan.
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
