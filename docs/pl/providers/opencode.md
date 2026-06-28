---
read_when:
    - Chcesz dostępu do modeli hostowanych przez OpenCode
    - Chcesz wybrać między katalogami Zen i Go
summary: Używaj katalogów OpenCode Zen i Go z OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenCode udostępnia w OpenClaw dwa hostowane katalogi:

| Katalog | Prefiks           | Dostawca runtime |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Oba katalogi używają tego samego klucza API OpenCode. OpenClaw zachowuje rozdzielone identyfikatory dostawców runtime,
aby routing upstream dla poszczególnych modeli pozostał poprawny, ale onboarding i dokumentacja traktują je
jako jedną konfigurację OpenCode.

## Pierwsze kroki

<Tabs>
  <Tab title="Katalog Zen">
    **Najlepsze do:** wyselekcjonowanego wielomodelowego proxy OpenCode (Claude, GPT, Gemini).

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
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Katalog Go">
    **Najlepsze do:** hostowanej przez OpenCode linii modeli Kimi, GLM i MiniMax.

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
| Przykładowe modele | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Aliasy klucza API">
    `OPENCODE_ZEN_API_KEY` jest również obsługiwany jako alias dla `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Współdzielone poświadczenia">
    Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje poświadczenia dla obu dostawców runtime. Nie musisz przechodzić onboardingu osobno dla każdego katalogu.
  </Accordion>

  <Accordion title="Rozliczanie i panel">
    Logujesz się do OpenCode, dodajesz dane rozliczeniowe i kopiujesz swój klucz API. Rozliczanie
    i dostępność katalogów są zarządzane z panelu OpenCode.
  </Accordion>

  <Accordion title="Zachowanie odtwarzania Gemini">
    Odwołania OpenCode oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje tam
    sanityzację sygnatur myślenia Gemini bez włączania natywnej walidacji odtwarzania Gemini
    ani przepisów bootstrap.
  </Accordion>

  <Accordion title="Zachowanie odtwarzania dla modeli innych niż Gemini">
    Odwołania OpenCode inne niż Gemini zachowują minimalną politykę odtwarzania zgodną z OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje poświadczenia dla dostawców runtime Zen i
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
