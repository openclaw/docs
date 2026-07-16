---
summary: 'Jak OpenClaw organizuje wbudowane środowisko uruchomieniowe agenta: układ kodu, granice, manifesty zasobów i wybór środowiska uruchomieniowego.'
title: Architektura środowiska uruchomieniowego agenta
x-i18n:
    generated_at: "2026-07-16T17:57:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw jest właścicielem wbudowanego środowiska uruchomieniowego agenta. Kod środowiska uruchomieniowego znajduje się w `src/agents/`, transport modeli/dostawców znajduje się w `src/llm/`, a kontrakty przeznaczone dla pluginów są udostępniane przez moduły zbiorcze `openclaw/plugin-sdk/*`.

## Układ środowiska uruchomieniowego

| Ścieżka                             | Odpowiada za                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Wbudowaną pętlę prób (`run.ts`, `run/`), wybór modelu i normalizację dostawcy (`model*.ts`), parametry żądań dla poszczególnych dostawców (`extra-params.*`), Compaction oraz integrację transkrypcji i sesji.                            |
| `src/agents/sessions/`              | Trwałość sesji (`session-manager.ts`), wykrywanie zasobów (`package-manager.ts`, `resource-loader.ts`), ładowanie `extensions` w ramach sesji, szablony promptów, Skills, motywy oraz renderery narzędzi oparte na TUI (`tools/`). |
| `packages/agent-core/`              | Rdzeń agenta wielokrotnego użytku (`@openclaw/agent-core`): pętlę agenta, typy infrastruktury wykonawczej, wiadomości, funkcje pomocnicze Compaction, szablony promptów, Skills oraz kontrakty przechowywania sesji.                                                           |
| `src/agents/runtime/`               | Fasadę OpenClaw, która łączy `@openclaw/agent-core` ze środowiskiem uruchomieniowym LLM zestawu SDK pluginów oraz ponownie eksportuje je wraz z lokalnymi narzędziami serwera proxy.                                                                                             |
| `src/agents/agent-tools*.ts`        | Definicje narzędzi należące do OpenClaw, schematy parametrów, zasady narzędzi, adaptery wywołań narzędzi przed wykonaniem i po nim oraz narzędzia edycji hosta/piaskownicy.                                                                                            |
| `src/agents/agent-hooks/`           | Wbudowane punkty zaczepienia środowiska uruchomieniowego: zabezpieczenie Compaction, instrukcje Compaction, przycinanie kontekstu.                                                                                                                                   |
| `src/agents/harness/`               | Rejestr infrastruktury wykonawczej, zasady wyboru i cykl życia wbudowanych oraz zarejestrowanych przez pluginy infrastruktur wykonawczych.                                                                                                                       |
| `src/llm/`                          | Rejestr modeli/dostawców, funkcje pomocnicze transportu oraz implementacje strumieni specyficzne dla dostawców (`src/llm/providers/`).                                                                                                          |

## Granice

Rdzeń wywołuje wbudowane środowisko uruchomieniowe za pośrednictwem modułów OpenClaw i modułów zbiorczych SDK; nie pozostały żadne zewnętrzne pakiety struktur programistycznych agentów. Pluginy używają udokumentowanych punktów wejścia `openclaw/plugin-sdk/*` i nie importują wewnętrznych elementów `src/**`.

`@earendil-works/pi-tui` pozostaje zależnością zewnętrzną: zestawem komponentów terminalowych używanym przez lokalne TUI i renderery narzędzi sesji. Włączenie go do projektu byłoby osobnym przedsięwzięciem związanym z kopiowaniem kodu zależności.

## Manifesty

Pakiety zasobów deklarują zasoby OpenClaw w metadanych `package.json`. Wpisy są ścieżkami plików lub wzorcami glob względem katalogu głównego pakietu:

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

Typy zasobów niewymienione w manifeście korzystają awaryjnie z wykrywania standardowych katalogów `extensions/`, `skills/`, `prompts/` i `themes/`.

## Wybór środowiska uruchomieniowego

- Identyfikator wbudowanego środowiska uruchomieniowego to `openclaw`. Starszy alias `pi` jest normalizowany do `openclaw`; `codex-app-server` jest normalizowany do `codex`.
- Infrastruktury wykonawcze pluginów rejestrują dodatkowe identyfikatory środowisk uruchomieniowych (na przykład `codex`).
- Zasady środowiska uruchomieniowego określa konfiguracja `agentRuntime.id` ograniczona do modelu/dostawcy (wpis modelu ma pierwszeństwo przed wpisem dostawcy). Wartość nieustawiona lub `default` jest rozstrzygana jako `auto`.
- `auto` wybiera zarejestrowaną infrastrukturę wykonawczą pluginu, która obsługuje efektywną trasę dostawcy, a w przeciwnym razie wbudowane środowisko uruchomieniowe OpenClaw. Sam prefiks dostawcy lub modelu nigdy nie powoduje wyboru infrastruktury wykonawczej.
- OpenAI może niejawnie wybrać `codex` wyłącznie dla dokładnie pasującej oficjalnej trasy HTTPS Platform Responses lub ChatGPT Responses, bez jawnego nadpisania żądania. Adaptery Completions, niestandardowe punkty końcowe i trasy z jawnym zachowaniem żądań pozostają w `openclaw`; oficjalne punkty końcowe korzystające z nieszyfrowanego protokołu HTTP są odrzucane. Zobacz [niejawne środowisko uruchomieniowe agenta OpenAI](/pl/providers/openai#implicit-agent-runtime).

## Powiązane

- [Przepływ pracy środowiska uruchomieniowego agenta OpenClaw](/pl/openclaw-agent-runtime)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
