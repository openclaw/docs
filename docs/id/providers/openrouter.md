---
read_when:
    - Anda ingin satu kunci API untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T14:03:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. API ini kompatibel dengan OpenAI, sehingga sebagian besar OpenAI SDK dapat berfungsi hanya dengan mengganti base URL.

## Penyiapan CLI

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Cuplikan konfigurasi

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

## Catatan

- Ref model adalah `openrouter/<provider>/<model>`.
- Onboarding default ke `openrouter/auto`. Ganti ke model konkret nanti dengan
  `openclaw models set openrouter/<provider>/<model>`.
- Untuk opsi model/provider lainnya, lihat [/concepts/model-providers](/id/concepts/model-providers).
- OpenRouter menggunakan token Bearer dengan kunci API Anda di balik layar.
- Pada permintaan OpenRouter nyata (`https://openrouter.ai/api/v1`), OpenClaw juga
  menambahkan header atribusi aplikasi OpenRouter yang didokumentasikan:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw`, dan
  `X-OpenRouter-Categories: cli-agent`.
- Pada rute OpenRouter yang terverifikasi, ref model Anthropic juga mempertahankan
  marker `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
  penggunaan ulang prompt-cache yang lebih baik pada blok prompt system/developer.
- Jika Anda mengarahkan ulang provider OpenRouter ke proxy/base URL lain, OpenClaw
  tidak akan menyuntikkan header khusus OpenRouter atau marker cache Anthropic tersebut.
- OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proxy, sehingga
  pembentukan permintaan native yang khusus OpenAI seperti `serviceTier`, Responses `store`,
  payload kompatibilitas penalaran OpenAI, dan petunjuk prompt-cache tidak diteruskan.
- Ref OpenRouter berbasis Gemini tetap berada di jalur proxy-Gemini: OpenClaw mempertahankan
  sanitasi tanda tangan thought Gemini di sana, tetapi tidak mengaktifkan validasi replay Gemini native
  atau penulisan ulang bootstrap.
- Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat thinking yang dipilih ke
  payload reasoning proxy OpenRouter. Petunjuk model yang tidak didukung dan
  `openrouter/auto` melewati penyuntikan reasoning tersebut.
- Jika Anda meneruskan routing provider OpenRouter di bawah parameter model, OpenClaw meneruskannya
  sebagai metadata routing OpenRouter sebelum wrapper stream bersama dijalankan.
