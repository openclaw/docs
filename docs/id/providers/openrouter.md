---
read_when:
    - Anda ingin satu API key untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-26T11:37:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan API key. API ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI dapat digunakan dengan mengganti base URL.

## Memulai

<Steps>
  <Step title="Dapatkan API key Anda">
    Buat API key di [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Jalankan onboarding">
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

## Contoh config

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
provider dan model yang tersedia, lihat [/concepts/model-providers](/id/concepts/model-providers).
</Note>

Contoh fallback bawaan:

| Ref model                            | Catatan                      |
| ------------------------------------ | ---------------------------- |
| `openrouter/auto`                    | Perutean otomatis OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 via MoonshotAI     |
| `openrouter/openrouter/healer-alpha` | Rute OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Rute OpenRouter Hunter Alpha |

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

OpenClaw mengirim permintaan gambar ke API image chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` OpenRouter. Gunakan `agents.defaults.imageGenerationModel.timeoutMs` untuk model gambar OpenRouter yang lebih lambat; parameter `timeoutMs` per panggilan milik tool `image_generate` tetap lebih diutamakan.

## Text-to-speech

OpenRouter juga dapat digunakan sebagai provider TTS melalui endpoint
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

OpenRouter menggunakan Bearer token dengan API key Anda di balik layar.

Pada permintaan OpenRouter nyata (`https://openrouter.ai/api/v1`), OpenClaw juga menambahkan
header atribusi aplikasi yang didokumentasikan oleh OpenRouter:

| Header                    | Nilai                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Jika Anda mengarahkan ulang provider OpenRouter ke proxy atau base URL lain, OpenClaw
**tidak** akan menyuntikkan header khusus OpenRouter tersebut atau penanda cache Anthropic.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penanda cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, ref model Anthropic mempertahankan
    penanda `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    reuse cache prompt yang lebih baik pada blok prompt system/developer.
  </Accordion>

  <Accordion title="Penyuntikan thinking / reasoning">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat thinking yang dipilih ke
    payload reasoning proxy OpenRouter. Petunjuk model yang tidak didukung dan
    `openrouter/auto` melewati penyuntikan reasoning tersebut.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter tetap berjalan melalui path kompatibel OpenAI bergaya proxy, sehingga
    pembentukan permintaan khusus OpenAI native seperti `serviceTier`, Responses `store`,
    payload kompatibilitas reasoning OpenAI, dan petunjuk cache prompt tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Ref OpenRouter berbasis Gemini tetap berada pada path proxy-Gemini: OpenClaw mempertahankan
    sanitasi thought-signature Gemini di sana, tetapi tidak mengaktifkan replay validation
    atau bootstrap rewrite Gemini native.
  </Accordion>

  <Accordion title="Metadata perutean provider">
    Jika Anda meneruskan perutean provider OpenRouter di bawah parameter model, OpenClaw meneruskannya
    sebagai metadata perutean OpenRouter sebelum wrapper stream bersama dijalankan.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi config lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
