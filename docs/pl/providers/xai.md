---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Używanie modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-05T14:04:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d11f27b48c69eed6324595977bca3506c7709424eef64cc73899f8d049148b82
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw zawiera wbudowaną wtyczkę dostawcy `xai` dla modeli Grok.

## Konfiguracja

1. Utwórz klucz API w konsoli xAI.
2. Ustaw `XAI_API_KEY` albo uruchom:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Wybierz model, na przykład:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw używa teraz API xAI Responses jako wbudowanego transportu xAI. Ten sam
`XAI_API_KEY` może również zasilać oparte na Grok `web_search`, natywne
`x_search` oraz zdalne `code_execution`.
Jeśli przechowujesz klucz xAI w `plugins.entries.xai.config.webSearch.apiKey`,
wbudowany dostawca modeli xAI również użyje tego klucza jako mechanizmu zapasowego.
Dostrajanie `code_execution` znajduje się w `plugins.entries.xai.config.codeExecution`.

## Obecny katalog modeli wbudowanych

OpenClaw zawiera teraz te rodziny modeli xAI od razu po instalacji:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Wtyczka rozpoznaje też nowsze identyfikatory `grok-4*` i `grok-code-fast*`,
gdy mają ten sam kształt API.

Uwagi dotyczące modeli fast:

- `grok-4-fast`, `grok-4-1-fast` oraz warianty `grok-4.20-beta-*` to obecne
  referencje Grok z obsługą obrazów w wbudowanym katalogu.
- `/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true`
  przepisuje natywne żądania xAI w następujący sposób:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Starsze aliasy zgodności są nadal normalizowane do kanonicznych wbudowanych identyfikatorów. Na
przykład:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Wyszukiwanie w sieci

Wbudowany dostawca wyszukiwania w sieci `grok` również używa `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Znane ograniczenia

- Uwierzytelnianie obecnie działa tylko przez klucz API. OpenClaw nie obsługuje jeszcze przepływu xAI OAuth/device-code.
- `grok-4.20-multi-agent-experimental-beta-0304` nie jest obsługiwany w zwykłej ścieżce dostawcy xAI, ponieważ wymaga innej powierzchni API upstream niż standardowy transport xAI w OpenClaw.

## Uwagi

- OpenClaw automatycznie stosuje poprawki zgodności schematu narzędzi i wywołań narzędzi specyficzne dla xAI na współdzielonej ścieżce wykonawczej.
- Natywne żądania xAI domyślnie używają `tool_stream: true`. Ustaw
  `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
  to wyłączyć.
- Wbudowany wrapper xAI usuwa nieobsługiwane flagi ścisłego schematu narzędzi i
  klucze ładunku reasoning przed wysłaniem natywnych żądań xAI.
- `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia OpenClaw. OpenClaw włącza konkretną wbudowaną funkcję xAI potrzebną dla każdego żądania narzędzia zamiast dołączać wszystkie natywne narzędzia do każdej tury czatu.
- `x_search` i `code_execution` należą do wbudowanej wtyczki xAI, a nie są zakodowane na stałe w podstawowym runtime modeli.
- `code_execution` to zdalne wykonanie w sandboxie xAI, a nie lokalne [`exec`](/tools/exec).
- Szerszy przegląd dostawców znajdziesz w [Dostawcy modeli](/providers/index).
