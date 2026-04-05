---
read_when:
    - Anda ingin model Xiaomi MiMo di OpenClaw
    - Anda memerlukan penyiapan `XIAOMI_API_KEY`
summary: Gunakan model Xiaomi MiMo dengan OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T14:04:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo adalah platform API untuk model **MiMo**. OpenClaw menggunakan endpoint Xiaomi
yang kompatibel dengan OpenAI dengan autentikasi kunci API. Buat kunci API Anda di
[konsol Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), lalu konfigurasikan
provider bawaan `xiaomi` dengan kunci tersebut.

## Katalog bawaan

- Base URL: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Otorisasi: `Bearer $XIAOMI_API_KEY`

| Model ref              | Input       | Konteks   | Output maks | Catatan                     |
| ---------------------- | ----------- | --------- | ----------- | --------------------------- |
| `xiaomi/mimo-v2-flash` | teks        | 262,144   | 8,192       | Model default               |
| `xiaomi/mimo-v2-pro`   | teks        | 1,048,576 | 32,000      | Reasoning diaktifkan        |
| `xiaomi/mimo-v2-omni`  | teks, gambar | 262,144   | 32,000      | Multimodal dengan reasoning |

## Penyiapan CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# atau non-interaktif
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Cuplikan konfigurasi

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Catatan

- Ref model default: `xiaomi/mimo-v2-flash`.
- Model bawaan tambahan: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Provider disuntikkan secara otomatis saat `XIAOMI_API_KEY` disetel (atau ada profil auth).
- Lihat [/concepts/model-providers](/id/concepts/model-providers) untuk aturan provider.
