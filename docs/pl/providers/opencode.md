---
read_when:
    - Chcesz dostępu do modeli hostowanych przez OpenCode.
    - Chcesz wybrać między katalogami Zen i Go.
summary: Używanie katalogów OpenCode Zen i Go z OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T09:29:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode udostępnia w OpenClaw dwa hostowane katalogi:

| Katalog | Prefiks           | Dostawca runtime |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Oba katalogi używają tego samego klucza API OpenCode. OpenClaw utrzymuje rozdzielone identyfikatory dostawców runtime,
aby routing per model upstream pozostawał poprawny, ale onboarding i dokumentacja traktują je
jako jedną konfigurację OpenCode.

## Pierwsze kroki

<Tabs>
  <Tab title="Katalog Zen">
    **Najlepszy dla:** kuratorowanego wielomodelowego proxy OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Ustaw model Zen jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Zweryfikuj dostępność modeli">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Katalog Go">
    **Najlepszy dla:** hostowanej przez OpenCode linii modeli Kimi, GLM i MiniMax.

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Ustaw model Go jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Zweryfikuj dostępność modeli">
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
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Wbudowane katalogi

### Zen

| Właściwość       | Wartość                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| Dostawca runtime | `opencode`                                                             |
| Przykładowe modele | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Właściwość       | Wartość                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Dostawca runtime | `opencode-go`                                                           |
| Przykładowe modele | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Aliasy klucza API">
    `OPENCODE_ZEN_API_KEY` jest również obsługiwany jako alias dla `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Współdzielone poświadczenia">
    Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje poświadczenia dla obu dostawców runtime. Nie trzeba osobno przechodzić onboardingu dla każdego katalogu.
  </Accordion>

  <Accordion title="Billing i dashboard">
    Logujesz się do OpenCode, dodajesz dane rozliczeniowe i kopiujesz klucz API. Billing
    i dostępność katalogów są zarządzane z dashboardu OpenCode.
  </Accordion>

  <Accordion title="Zachowanie replay Gemini">
    Odwołania OpenCode oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje
    tam sanityzację sygnatur thought Gemini bez włączania natywnej
    walidacji replay Gemini ani przepisania bootstrap.
  </Accordion>

  <Accordion title="Zachowanie replay non-Gemini">
    Odwołania OpenCode inne niż Gemini zachowują minimalną politykę replay zgodną z OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje poświadczenia dla obu dostawców runtime Zen i
Go, więc onboarding wystarczy przejść tylko raz.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
