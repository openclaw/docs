---
read_when:
    - Chcesz katalog OpenCode Go
    - Potrzebujesz odwołań do modeli środowiska uruchomieniowego dla modeli hostowanych przez Go
summary: Użyj katalogu OpenCode Go ze współdzieloną konfiguracją OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T15:35:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go to katalog Go w [OpenCode](/pl/providers/opencode). Współdzieli
dane uwierzytelniające `OPENCODE_API_KEY` z katalogiem Zen, ale zachowuje własny
identyfikator dostawcy środowiska uruchomieniowego (`opencode-go`), dzięki czemu nadrzędne trasowanie
dla poszczególnych modeli pozostaje prawidłowe.

| Właściwość                     | Wartość                                            |
| ------------------------------ | -------------------------------------------------- |
| Dostawca środowiska uruchomieniowego | `opencode-go`                                 |
| Uwierzytelnianie               | `OPENCODE_API_KEY` (alias: `OPENCODE_ZEN_API_KEY`) |
| Konfiguracja nadrzędna         | [OpenCode](/pl/providers/opencode)                    |

## Pierwsze kroki

<Tabs>
  <Tab title="Interaktywnie">
    <Steps>
      <Step title="Uruchom wprowadzenie">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ustaw model Go jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Sprawdź dostępność modeli">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Nieinteraktywnie">
    <Steps>
      <Step title="Przekaż klucz bezpośrednio">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź dostępność modeli">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Przykład konfiguracji

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Wbudowany katalog

Uruchom `openclaw models list --provider opencode-go`, aby wyświetlić aktualną listę modeli.
Dołączone pozycje:

| Odwołanie do modelu             | Nazwa             | Kontekst  | Maks. dane wyjściowe | Obrazy na wejściu |
| ------------------------------- | ----------------- | --------- | -------------------- | ----------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K                 | Nie               |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K                 | Nie               |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768               | Nie               |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768               | Nie               |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072              | Nie               |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768               | Nie               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536               | Tak               |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536               | Tak               |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144              | Tak               |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000              | Tak               |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000              | Nie               |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536               | Nie               |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072              | Nie               |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072              | Nie               |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536               | Tak               |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536               | Tak               |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536               | Nie               |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536               | Tak               |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Sposób trasowania">
    OpenClaw automatycznie trasuje każde odwołanie do modelu `opencode-go/...`. Nie jest wymagana
    dodatkowa konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Konwencja odwołań środowiska uruchomieniowego">
    Odwołania środowiska uruchomieniowego pozostają jednoznaczne: `opencode/...` dla Zen, `opencode-go/...` dla
    Go. Zapewnia to prawidłowe nadrzędne trasowanie dla poszczególnych modeli w obu katalogach.
  </Accordion>

  <Accordion title="Współdzielone dane uwierzytelniające">
    Jeden klucz `OPENCODE_API_KEY` obsługuje zarówno katalog Zen, jak i Go. Wprowadzenie
    klucza podczas konfiguracji zapisuje dane uwierzytelniające dla obu dostawców środowiska uruchomieniowego.
  </Accordion>
</AccordionGroup>

<Tip>
Zobacz [OpenCode](/pl/providers/opencode), aby zapoznać się ze wspólnym omówieniem procesu wprowadzenia i pełną
dokumentacją katalogów Zen oraz Go.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenCode (nadrzędny)" href="/pl/providers/opencode" icon="server">
    Wspólny proces wprowadzenia, omówienie katalogu i uwagi zaawansowane.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
</CardGroup>
