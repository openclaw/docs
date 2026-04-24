---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
    - Anda ingin menggunakan OpenRouter untuk pembuatan gambar
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T09:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. API ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi cukup dengan mengganti base URL.

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
Referensi model mengikuti pola `openrouter/<provider>/<model>`. Untuk daftar lengkap
provider dan model yang tersedia, lihat [/concepts/model-providers](/id/concepts/model-providers).
</Note>

Contoh fallback bawaan:

| Referensi model                            | Catatan                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Perutean otomatis OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 melalui MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Rute OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Rute OpenRouter Hunter Alpha |

## Pembuatan gambar

OpenRouter juga dapat mendukung alat `image_generate`. Gunakan model gambar OpenRouter di bawah `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw mengirim permintaan gambar ke API gambar chat completions OpenRouter dengan `modalities: ["image", "text"]`. Model gambar Gemini menerima petunjuk `aspectRatio` dan `resolution` yang didukung melalui `image_config` milik OpenRouter.

## Autentikasi dan header

OpenRouter menggunakan token Bearer dengan kunci API Anda di balik layar.

Pada permintaan OpenRouter nyata (`https://openrouter.ai/api/v1`), OpenClaw juga menambahkan
header atribusi aplikasi yang didokumentasikan OpenRouter:

| Header                    | Nilai                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Jika Anda mengarahkan ulang provider OpenRouter ke proxy atau base URL lain, OpenClaw
**tidak** akan menyisipkan header khusus OpenRouter tersebut atau penanda cache Anthropic.
</Warning>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penanda cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, referensi model Anthropic mempertahankan
    penanda `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    penggunaan ulang prompt-cache yang lebih baik pada blok prompt system/developer.
  </Accordion>

  <Accordion title="Injeksi thinking / reasoning">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat thinking yang dipilih ke
    payload reasoning proxy OpenRouter. Petunjuk model yang tidak didukung dan
    `openrouter/auto` melewati injeksi reasoning tersebut.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proxy, jadi
    pembentukan permintaan khusus OpenAI asli seperti `serviceTier`, Responses `store`,
    payload kompatibilitas reasoning OpenAI, dan petunjuk prompt-cache tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Referensi OpenRouter berbasis Gemini tetap berada pada jalur proxy-Gemini: OpenClaw tetap
    mempertahankan sanitasi thought-signature Gemini di sana, tetapi tidak mengaktifkan
    validasi replay Gemini asli atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Metadata perutean provider">
    Jika Anda meneruskan perutean provider OpenRouter di bawah parameter model, OpenClaw meneruskannya
    sebagai metadata perutean OpenRouter sebelum wrapper stream bersama dijalankan.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
