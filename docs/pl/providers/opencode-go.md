---
read_when:
    - Chcesz katalog OpenCode Go
    - Potrzebujesz odwołań do modeli środowiska wykonawczego dla modeli hostowanych w Go
summary: Użyj katalogu Go OpenCode ze współdzieloną konfiguracją OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:14:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go to katalog Go w ramach [OpenCode](/pl/providers/opencode).
Używa tego samego `OPENCODE_API_KEY` co katalog Zen, ale zachowuje identyfikator
dostawcy runtime `opencode-go`, aby nadrzędne routowanie per model pozostało poprawne.

| Właściwość        | Wartość                         |
| ----------------- | ------------------------------- |
| Dostawca runtime  | `opencode-go`                   |
| Uwierzytelnianie  | `OPENCODE_API_KEY`              |
| Konfiguracja nadrzędna | [OpenCode](/pl/providers/opencode) |

## Wbudowany katalog

OpenClaw pobiera większość wierszy katalogu Go z dołączonego rejestru modeli OpenClaw i
uzupełnia bieżące wiersze nadrzędne, podczas gdy rejestr nadrabia zaległości. Uruchom
`openclaw models list --provider opencode-go`, aby zobaczyć bieżącą listę modeli.

Dostawca obejmuje:

| Ref modelu                     | Nazwa                 |
| ------------------------------ | --------------------- |
| `opencode-go/glm-5`            | GLM-5                 |
| `opencode-go/glm-5.1`          | GLM-5.1               |
| `opencode-go/glm-5.2`          | GLM-5.2               |
| `opencode-go/kimi-k2.5`        | Kimi K2.5             |
| `opencode-go/kimi-k2.6`        | Kimi K2.6 (limity 3x) |
| `opencode-go/kimi-k2.7-code`   | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`  | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash    |
| `opencode-go/mimo-v2-omni`     | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`      | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`     | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`     | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`     | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`     | Qwen3.6 Plus          |

GLM-5.2 używa okna kontekstu o wielkości 1 mln tokenów i obsługuje do 131 tys. tokenów wyjściowych.

## Pierwsze kroki

<Tabs>
  <Tab title="Interaktywnie">
    <Steps>
      <Step title="Uruchom wdrożenie">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ustaw model Go jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
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
      <Step title="Sprawdź, czy modele są dostępne">
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

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie routowania">
    OpenClaw automatycznie obsługuje routowanie per model, gdy ref modelu używa
    `opencode-go/...`. Nie jest wymagana dodatkowa konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Konwencja ref runtime">
    Refy runtime pozostają jawne: `opencode/...` dla Zen, `opencode-go/...` dla Go.
    Dzięki temu nadrzędne routowanie per model pozostaje poprawne w obu katalogach.
  </Accordion>

  <Accordion title="Wspólne dane uwierzytelniające">
    Ten sam `OPENCODE_API_KEY` jest używany przez katalogi Zen i Go. Wprowadzenie
    klucza podczas konfiguracji zapisuje dane uwierzytelniające dla obu dostawców runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Zobacz [OpenCode](/pl/providers/opencode), aby uzyskać wspólny przegląd wdrożenia oraz pełne
odniesienie do katalogów Zen + Go.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenCode (nadrzędny)" href="/pl/providers/opencode" icon="server">
    Wspólne wdrożenie, przegląd katalogu i uwagi zaawansowane.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, refów modeli i zachowania przełączania awaryjnego.
  </Card>
</CardGroup>
