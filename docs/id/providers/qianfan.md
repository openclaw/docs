---
read_when:
    - Anda menginginkan satu API key untuk banyak LLM
    - Anda memerlukan panduan setup Baidu Qianfan
summary: Gunakan API terpadu Qianfan untuk mengakses banyak model di OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T14:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Panduan Provider Qianfan

Qianfan adalah platform MaaS milik Baidu, yang menyediakan **API terpadu** untuk merutekan permintaan ke banyak model di balik satu
endpoint dan API key. API ini kompatibel dengan OpenAI, jadi sebagian besar SDK OpenAI dapat digunakan dengan mengganti base URL.

## Prasyarat

1. Akun Baidu Cloud dengan akses API Qianfan
2. API key dari konsol Qianfan
3. OpenClaw terinstal di sistem Anda

## Mendapatkan API key Anda

1. Kunjungi [Konsol Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Buat aplikasi baru atau pilih aplikasi yang sudah ada
3. Buat API key (format: `bce-v3/ALTAK-...`)
4. Salin API key untuk digunakan dengan OpenClaw

## Setup CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Cuplikan konfigurasi

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## Catatan

- Ref model bawaan default: `qianfan/deepseek-v3.2`
- Base URL default: `https://qianfan.baidubce.com/v2`
- Katalog bawaan saat ini mencakup `deepseek-v3.2` dan `ernie-5.0-thinking-preview`
- Tambahkan atau override `models.providers.qianfan` hanya jika Anda memerlukan base URL atau metadata model kustom
- Qianfan berjalan melalui jalur transport yang kompatibel dengan OpenAI, bukan pembentukan permintaan OpenAI native

## Dokumentasi Terkait

- [Konfigurasi OpenClaw](/id/gateway/configuration)
- [Provider Model](/id/concepts/model-providers)
- [Setup Agen](/id/concepts/agent)
- [Dokumentasi API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
