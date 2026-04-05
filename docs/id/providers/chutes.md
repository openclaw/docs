---
read_when:
    - Anda ingin menggunakan Chutes dengan OpenClaw
    - Anda memerlukan jalur penyiapan OAuth atau API key
    - Anda ingin mengetahui model default, alias, atau perilaku penemuan
summary: Penyiapan Chutes (OAuth atau API key, penemuan model, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T14:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) mengekspos katalog model open-source melalui API
yang kompatibel dengan OpenAI. OpenClaw mendukung auth OAuth berbasis browser
dan auth API key langsung untuk provider `chutes` bawaan.

- Provider: `chutes`
- API: kompatibel dengan OpenAI
- Base URL: `https://llm.chutes.ai/v1`
- Auth:
  - OAuth melalui `openclaw onboard --auth-choice chutes`
  - API key melalui `openclaw onboard --auth-choice chutes-api-key`
  - Variabel lingkungan runtime: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Mulai cepat

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw meluncurkan alur browser secara lokal, atau menampilkan URL + alur
tempel-redirect pada host remote/headless. Token OAuth diperbarui otomatis melalui
profil auth OpenClaw.

Override OAuth opsional:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### API key

```bash
openclaw onboard --auth-choice chutes-api-key
```

Dapatkan key Anda di
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Kedua jalur auth mendaftarkan katalog Chutes bawaan dan menyetel model default
ke `chutes/zai-org/GLM-4.7-TEE`.

## Perilaku penemuan

Saat auth Chutes tersedia, OpenClaw meminta katalog Chutes dengan kredensial
tersebut dan menggunakan model yang ditemukan. Jika penemuan gagal, OpenClaw
fallback ke katalog statis bawaan sehingga onboarding dan startup tetap berfungsi.

## Alias default

OpenClaw juga mendaftarkan tiga alias kemudahan untuk katalog Chutes bawaan:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Katalog awal bawaan

Katalog fallback bawaan mencakup referensi Chutes saat ini seperti:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Contoh config

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Catatan

- Bantuan OAuth dan persyaratan app redirect: [dokumen OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
- Penemuan API key dan OAuth sama-sama menggunakan ID provider `chutes`.
- Model Chutes didaftarkan sebagai `chutes/<model-id>`.
