---
read_when:
    - Chcesz mieć jeden klucz API do wielu LLM-ów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
summary: Używaj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T14:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter zapewnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Fragment konfiguracji

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

## Uwagi

- Odwołania do modeli mają postać `openrouter/<provider>/<model>`.
- Onboarding domyślnie ustawia `openrouter/auto`. Później przełącz się na konkretny model za pomocą
  `openclaw models set openrouter/<provider>/<model>`.
- Więcej opcji modeli/dostawców znajdziesz w [/concepts/model-providers](/pl/concepts/model-providers).
- OpenRouter używa wewnętrznie tokenu Bearer z Twoim kluczem API.
- Przy rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw również
  dodaje udokumentowane nagłówki atrybucji aplikacji OpenRouter:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw` oraz
  `X-OpenRouter-Categories: cli-agent`.
- Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują również
  specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa
  do lepszego ponownego wykorzystania pamięci podręcznej promptów w blokach promptów systemowych/developerskich.
- Jeśli przekierujesz dostawcę OpenRouter na inne proxy/base URL, OpenClaw
  nie wstrzykuje tych specyficznych dla OpenRouter nagłówków ani znaczników pamięci podręcznej Anthropic.
- OpenRouter nadal działa przez ścieżkę proxy zgodną z OpenAI, więc
  natywne formatowanie żądań wyłącznie dla OpenAI, takie jak `serviceTier`, `store` dla Responses,
  payloady zgodności reasoning OpenAI i wskazówki pamięci podręcznej promptów, nie są przekazywane dalej.
- Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje tam
  sanityzację sygnatur myślenia Gemini, ale nie włącza natywnej walidacji replay Gemini
  ani przepisów bootstrap.
- Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom thinking na
  payloady reasoning proxy OpenRouter. Nieobsługiwane wskazówki modelu oraz
  `openrouter/auto` pomijają to wstrzykiwanie reasoning.
- Jeśli przekazujesz routing dostawcy OpenRouter w parametrach modelu, OpenClaw przekazuje
  go jako metadane routingu OpenRouter, zanim uruchomione zostaną współdzielone wrappery strumieni.
