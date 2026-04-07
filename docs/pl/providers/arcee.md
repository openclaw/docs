---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API lub opcji uwierzytelniania w CLI
summary: Konfiguracja Arcee AI (uwierzytelnianie + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-07T09:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb04909a708fec08dd2c8c863501b178f098bc4818eaebad38aea264157969d8
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) zapewnia dostęp do rodziny modeli Trinity typu mixture-of-experts przez API zgodne z OpenAI. Wszystkie modele Trinity są licencjonowane na Apache 2.0.

Dostęp do modeli Arcee AI można uzyskać bezpośrednio przez platformę Arcee lub przez [OpenRouter](/pl/providers/openrouter).

- Provider: `arcee`
- Uwierzytelnianie: `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)
- API: zgodne z OpenAI
- Base URL: `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter)

## Szybki start

1. Pobierz klucz API z [Arcee AI](https://chat.arcee.ai/) lub [OpenRouter](https://openrouter.ai/keys).

2. Ustaw klucz API (zalecane: zapisz go dla Gateway):

```bash
# Direct (platforma Arcee)
openclaw onboard --auth-choice arceeai-api-key

# Via OpenRouter
openclaw onboard --auth-choice arceeai-openrouter
```

3. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "arcee/trinity-large-thinking" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
# Direct (platforma Arcee)
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-api-key \
  --arceeai-api-key "$ARCEEAI_API_KEY"

# Via OpenRouter
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-openrouter \
  --openrouter-api-key "$OPENROUTER_API_KEY"
```

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako daemon (`launchd`/`systemd`), upewnij się, że `ARCEEAI_API_KEY`
(lub `OPENROUTER_API_KEY`) jest dostępne dla tego procesu (na przykład w
`~/.openclaw/.env` lub przez `env.shellEnv`).

## Wbudowany katalog

OpenClaw obecnie dostarcza ten dołączony katalog Arcee:

| Model ref                      | Nazwa                  | Wejście | Kontekst | Koszt (wej./wyj. na 1M) | Uwagi                                     |
| ------------------------------ | ---------------------- | ------- | -------- | ---------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text    | 256K     | $0.25 / $0.90          | Model domyślny; reasoning włączone        |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text    | 128K     | $0.25 / $1.00          | Ogólnego przeznaczenia; 400B parametrów, 13B aktywnych |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text    | 128K     | $0.045 / $0.15         | Szybki i oszczędny kosztowo; function calling |

Te same referencje modeli działają zarówno dla konfiguracji bezpośrednich, jak i przez OpenRouter (na przykład `arcee/trinity-large-thinking`).

Preset onboardingu ustawia `arcee/trinity-large-thinking` jako model domyślny.

## Obsługiwane funkcje

- Streaming
- Użycie narzędzi / function calling
- Structured output (tryb JSON i schemat JSON)
- Extended thinking (Trinity Large Thinking)
