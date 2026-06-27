---
summary: Jak OpenClaw uruchamia wbudowane środowisko wykonawcze agenta, dostawców, sesje, narzędzia i rozszerzenia.
title: Architektura środowiska uruchomieniowego agentów
x-i18n:
    generated_at: "2026-06-27T17:08:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw bezpośrednio posiada wbudowane środowisko uruchomieniowe agenta. Kod środowiska uruchomieniowego znajduje się w `src/agents/`, pomocnicze elementy modelu/dostawcy znajdują się w `src/llm/`, a kontrakty przeznaczone dla Pluginów są udostępniane przez beczki `openclaw/plugin-sdk/*`.

## Układ Środowiska Uruchomieniowego

- `src/agents/embedded-agent-runner/`: wbudowana pętla prób agenta, adaptery strumieni dostawców, Compaction, wybór modelu i okablowanie sesji.
- `src/agents/sessions/`: utrwalanie sesji, ładowanie rozszerzeń, odkrywanie zasobów, Skills, prompty, motywy i renderery narzędzi oparte na TUI.
- `packages/agent-core/`: wielokrotnego użytku rdzeń agenta, niższopoziomowe typy uprzęży, wiadomości, pomocniki Compaction, szablony promptów oraz kontrakty narzędzi/sesji.
- `src/agents/runtime/`: fasada OpenClaw dla `@openclaw/agent-core` oraz lokalne narzędzia proxy.
- `src/agents/agent-tools*.ts`: definicje narzędzi, schematy, polityka, adaptery haków przed/po oraz obsługa edycji hosta należące do OpenClaw.
- `src/agents/agent-hooks/`: wbudowane haki środowiska uruchomieniowego, takie jak zabezpieczenia Compaction i przycinanie kontekstu.
- `src/llm/`: rejestr modeli/dostawców, pomocniki transportu oraz implementacje strumieni specyficzne dla dostawców.

## Granice

Kod rdzenia wywołuje wbudowane środowisko uruchomieniowe przez moduły OpenClaw i beczki SDK, a nie przez stare zewnętrzne pakiety agentów. Pluginy używają udokumentowanych punktów wejścia `openclaw/plugin-sdk/*` i nie importują wewnętrznych elementów `src/**`.

`@earendil-works/pi-tui` pozostaje zewnętrzną zależnością TUI. Jest używany jako zestaw komponentów terminalowych przez lokalne TUI i renderery sesji; jego internalizacja byłaby osobnym wysiłkiem vendoringu.

## Manifesty

Pakiety zasobów deklarują zasoby OpenClaw w metadanych pakietu:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Menedżer pakietów odkrywa również konwencjonalne katalogi `extensions/`, `skills/`, `prompts/` i `themes/`.

## Wybór Środowiska Uruchomieniowego

Domyślny identyfikator wbudowanego środowiska uruchomieniowego to `openclaw`. Uprzęże Pluginów mogą rejestrować dodatkowe identyfikatory środowisk uruchomieniowych. `auto` wybiera obsługującą uprząż Pluginu, gdy taka istnieje, a w przeciwnym razie używa wbudowanego środowiska uruchomieniowego OpenClaw.

## Powiązane

- [Przepływ pracy środowiska uruchomieniowego agenta OpenClaw](/pl/openclaw-agent-runtime)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
