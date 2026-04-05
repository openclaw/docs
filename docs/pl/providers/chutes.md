---
read_when:
    - Chcesz używać Chutes z OpenClaw
    - Potrzebujesz ścieżki konfiguracji OAuth lub klucza API
    - Chcesz poznać model domyślny, aliasy lub zachowanie wykrywania
summary: Konfiguracja Chutes (OAuth lub klucz API, wykrywanie modeli, aliasy)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T14:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) udostępnia katalogi modeli open-source przez API
zgodne z OpenAI. OpenClaw obsługuje zarówno OAuth przez przeglądarkę, jak i
bezpośrednie uwierzytelnianie kluczem API dla dołączonego providera `chutes`.

- Provider: `chutes`
- API: zgodne z OpenAI
- Base URL: `https://llm.chutes.ai/v1`
- Uwierzytelnianie:
  - OAuth przez `openclaw onboard --auth-choice chutes`
  - Klucz API przez `openclaw onboard --auth-choice chutes-api-key`
  - Zmienne env runtime: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Szybki start

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw uruchamia lokalnie przepływ przez przeglądarkę albo pokazuje URL + przepływ
wklejania przekierowania na hostach zdalnych/headless. Tokeny OAuth są automatycznie odświeżane przez profile
auth OpenClaw.

Opcjonalne nadpisania OAuth:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### Klucz API

```bash
openclaw onboard --auth-choice chutes-api-key
```

Pobierz swój klucz na
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Obie ścieżki uwierzytelniania rejestrują dołączony katalog Chutes i ustawiają model domyślny
na `chutes/zai-org/GLM-4.7-TEE`.

## Zachowanie wykrywania

Gdy dostępne jest uwierzytelnianie Chutes, OpenClaw odpytuje katalog Chutes przy użyciu tych
poświadczeń i korzysta z wykrytych modeli. Jeśli wykrywanie się nie powiedzie, OpenClaw wraca
do dołączonego statycznego katalogu, aby onboarding i start nadal działały.

## Domyślne aliasy

OpenClaw rejestruje też trzy wygodne aliasy dla dołączonego katalogu Chutes:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Wbudowany katalog startowy

Dołączony katalog fallback zawiera bieżące referencje Chutes, takie jak:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Przykład konfiguracji

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

## Uwagi

- Pomoc OAuth i wymagania aplikacji przekierowania: [dokumentacja OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
- Wykrywanie klucza API i OAuth używa tego samego identyfikatora providera `chutes`.
- Modele Chutes są rejestrowane jako `chutes/<model-id>`.
