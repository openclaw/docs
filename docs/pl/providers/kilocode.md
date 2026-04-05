---
read_when:
    - Chcesz jednego klucza API do wielu LLM-ów
    - Chcesz uruchamiać modele przez Kilo Gateway w OpenClaw
summary: Używaj zunifikowanego API Kilo Gateway, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T14:03:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway udostępnia **zunifikowane API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

## Uzyskanie klucza API

1. Przejdź do [app.kilo.ai](https://app.kilo.ai)
2. Zaloguj się lub utwórz konto
3. Przejdź do API Keys i wygeneruj nowy klucz

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Albo ustaw zmienną środowiskową:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Fragment config

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

## Model domyślny

Domyślnym modelem jest `kilocode/kilo/auto`, model smart-routing
należący do providera i zarządzany przez Kilo Gateway.

OpenClaw traktuje `kilocode/kilo/auto` jako stabilną domyślną referencję, ale nie
publikuje mapowania zadanie-do-modelu-upstream opartego na źródle dla tej trasy.

## Dostępne modele

OpenClaw dynamicznie wykrywa dostępne modele z Kilo Gateway przy starcie. Użyj
`/models kilocode`, aby zobaczyć pełną listę modeli dostępnych dla twojego konta.

Każdy model dostępny w gateway można używać z prefiksem `kilocode/`:

```
kilocode/kilo/auto              (domyślny - smart routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...i wiele innych
```

## Uwagi

- Referencje modeli mają postać `kilocode/<model-id>` (np. `kilocode/anthropic/claude-sonnet-4`).
- Model domyślny: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Dołączony katalog fallback zawsze zawiera `kilocode/kilo/auto` (`Kilo Auto`) z
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`
  oraz `maxTokens: 128000`
- Przy starcie OpenClaw próbuje `GET https://api.kilo.ai/api/gateway/models` i
  scala wykryte modele przed statycznym katalogiem fallback
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowany na stałe w OpenClaw
- Kilo Gateway jest udokumentowany w źródłach jako zgodny z OpenRouter, więc pozostaje na
  ścieżce proxy-style OpenAI-compatible zamiast natywnego kształtowania żądań OpenAI
- Referencje Kilo oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje tam
  sanityzację sygnatur myśli Gemini bez włączania natywnej walidacji odtwarzania Gemini
  ani przepisywania bootstrapu.
- Współdzielony wrapper strumieni Kilo dodaje nagłówek aplikacji providera i normalizuje
  proxy reasoning payloads dla obsługiwanych referencji konkretnych modeli. `kilocode/kilo/auto`
  oraz inne wskazówki bez obsługi proxy-reasoning pomijają to wstrzykiwanie rozumowania.
- Więcej opcji modeli/providerów znajdziesz w [/concepts/model-providers](/concepts/model-providers).
- Kilo Gateway pod spodem używa Bearer tokena z twoim kluczem API.
