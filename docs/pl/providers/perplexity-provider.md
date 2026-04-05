---
read_when:
    - Chcesz skonfigurować Perplexity jako providera web search
    - Potrzebujesz klucza API Perplexity lub konfiguracji proxy OpenRouter
summary: Konfiguracja providera web search Perplexity (klucz API, tryby wyszukiwania, filtrowanie)
title: Perplexity (Provider)
x-i18n:
    generated_at: "2026-04-05T14:03:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Provider web search)

Plugin Perplexity udostępnia możliwości web search przez Perplexity
Search API albo Perplexity Sonar przez OpenRouter.

<Note>
Ta strona opisuje konfigurację **providera** Perplexity. Informacje o
**narzędziu** Perplexity (jak agent go używa) znajdziesz w [Perplexity tool](/tools/perplexity-search).
</Note>

- Typ: provider web search (nie provider modeli)
- Auth: `PERPLEXITY_API_KEY` (bezpośrednio) albo `OPENROUTER_API_KEY` (przez OpenRouter)
- Ścieżka konfiguracji: `plugins.entries.perplexity.config.webSearch.apiKey`

## Szybki start

1. Ustaw klucz API:

```bash
openclaw configure --section web
```

Albo ustaw go bezpośrednio:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. Agent będzie automatycznie używać Perplexity do web search, gdy zostanie skonfigurowany.

## Tryby wyszukiwania

Plugin automatycznie wybiera transport na podstawie prefiksu klucza API:

| Prefiks klucza | Transport                     | Funkcje                                          |
| -------------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`        | Natywne Perplexity Search API | Ustrukturyzowane wyniki, filtry domen/języka/daty |
| `sk-or-`       | OpenRouter (Sonar)            | Odpowiedzi syntetyzowane przez AI z cytowaniami  |

## Filtrowanie natywnego API

Przy użyciu natywnego API Perplexity (klucz `pplx-`) wyszukiwania obsługują:

- **Kraj**: 2-literowy kod kraju
- **Język**: kod języka ISO 639-1
- **Zakres dat**: day, week, month, year
- **Filtry domen**: allowlist/denylist (maks. 20 domen)
- **Budżet treści**: `max_tokens`, `max_tokens_per_page`

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że
`PERPLEXITY_API_KEY` jest dostępny dla tego procesu (na przykład w
`~/.openclaw/.env` albo przez `env.shellEnv`).
