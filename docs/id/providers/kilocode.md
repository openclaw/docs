---
read_when:
    - Anda menginginkan satu API key untuk banyak LLM
    - Anda ingin menjalankan model melalui Kilo Gateway di OpenClaw
summary: Gunakan API terpadu Kilo Gateway untuk mengakses banyak model di OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T14:03:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan API key. Ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI dapat digunakan hanya dengan mengganti base URL.

## Mendapatkan API key

1. Buka [app.kilo.ai](https://app.kilo.ai)
2. Masuk atau buat akun
3. Navigasikan ke API Keys dan buat key baru

## Penyiapan CLI

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Atau tetapkan variabel environment:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Cuplikan konfigurasi

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Model default

Model default adalah `kilocode/kilo/auto`, model smart-routing milik provider
yang dikelola oleh Kilo Gateway.

OpenClaw memperlakukan `kilocode/kilo/auto` sebagai referensi default stabil, tetapi tidak
memublikasikan pemetaan tugas-ke-model-upstream berbasis sumber untuk rute tersebut.

## Model yang tersedia

OpenClaw secara dinamis menemukan model yang tersedia dari Kilo Gateway saat startup. Gunakan
`/models kilocode` untuk melihat daftar lengkap model yang tersedia untuk akun Anda.

Model apa pun yang tersedia di gateway dapat digunakan dengan prefiks `kilocode/`:

```
kilocode/kilo/auto              (default - smart routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...dan banyak lagi
```

## Catatan

- Referensi model berbentuk `kilocode/<model-id>` (misalnya, `kilocode/anthropic/claude-sonnet-4`).
- Model default: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Katalog fallback bawaan selalu menyertakan `kilocode/kilo/auto` (`Kilo Auto`) dengan
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`,
  dan `maxTokens: 128000`
- Saat startup, OpenClaw mencoba `GET https://api.kilo.ai/api/gateway/models` dan
  menggabungkan model yang ditemukan sebelum katalog fallback statis
- Routing upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan di-hardcode di OpenClaw
- Kilo Gateway didokumentasikan dalam source sebagai kompatibel dengan OpenRouter, sehingga tetap berada pada
  jalur gaya proxy yang kompatibel dengan OpenAI alih-alih pembentukan request OpenAI native
- Referensi Kilo berbasis Gemini tetap berada pada jalur proxy-Gemini, sehingga OpenClaw tetap
  mempertahankan sanitasi thought-signature Gemini di sana tanpa mengaktifkan validasi replay Gemini
  native atau penulisan ulang bootstrap.
- Wrapper stream bersama Kilo menambahkan header aplikasi provider dan menormalkan
  payload reasoning proxy untuk referensi model konkret yang didukung. `kilocode/kilo/auto`
  dan petunjuk lain yang tidak mendukung proxy-reasoning melewati injeksi reasoning tersebut.
- Untuk lebih banyak opsi model/provider, lihat [/concepts/model-providers](/id/concepts/model-providers).
- Kilo Gateway menggunakan token Bearer dengan API key Anda di balik layar.
