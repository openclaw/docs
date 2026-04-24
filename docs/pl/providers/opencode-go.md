---
read_when:
    - Chcesz katalog OpenCode Go
    - Potrzebujesz odwołań modeli runtime dla modeli hostowanych przez Go
summary: Używaj katalogu OpenCode Go ze współdzieloną konfiguracją OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T09:28:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go to katalog Go w ramach [OpenCode](/pl/providers/opencode).
Używa tego samego `OPENCODE_API_KEY` co katalog Zen, ale zachowuje identyfikator providera runtime
`opencode-go`, aby routing upstream per model pozostał poprawny.

| Właściwość      | Wartość                       |
| --------------- | ----------------------------- |
| Provider runtime | `opencode-go`                |
| Auth            | `OPENCODE_API_KEY`            |
| Konfiguracja nadrzędna | [OpenCode](/pl/providers/opencode) |

## Wbudowany katalog

OpenClaw pobiera katalog Go z dołączonego rejestru modeli pi. Uruchom
`openclaw models list --provider opencode-go`, aby zobaczyć bieżącą listę modeli.

Według dołączonego katalogu pi provider zawiera:

| Ref modelu                 | Nazwa                 |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (limity 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Pierwsze kroki

<Tabs>
  <Tab title="Interaktywnie">
    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ustaw model Go jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Zweryfikuj, że modele są dostępne">
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
      <Step title="Zweryfikuj, że modele są dostępne">
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie routingu">
    OpenClaw automatycznie obsługuje routing per model, gdy odwołanie modelu używa
    `opencode-go/...`. Nie jest wymagana żadna dodatkowa konfiguracja providera.
  </Accordion>

  <Accordion title="Konwencja odwołań runtime">
    Odwołania runtime pozostają jawne: `opencode/...` dla Zen, `opencode-go/...` dla Go.
    Dzięki temu routing upstream per model pozostaje poprawny w obu katalogach.
  </Accordion>

  <Accordion title="Współdzielone poświadczenia">
    Ten sam `OPENCODE_API_KEY` jest używany przez katalogi Zen i Go. Wprowadzenie
    klucza podczas konfiguracji zapisuje poświadczenia dla obu providerów runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Zobacz [OpenCode](/pl/providers/opencode), aby poznać wspólny przegląd onboardingu oraz pełną
dokumentację katalogów Zen + Go.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenCode (nadrzędny)" href="/pl/providers/opencode" icon="server">
    Wspólny onboarding, przegląd katalogu i zaawansowane uwagi.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowania failover.
  </Card>
</CardGroup>
