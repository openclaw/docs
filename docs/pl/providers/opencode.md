---
read_when:
    - Chcesz dostępu do modeli hostowanych przez OpenCode
    - Chcesz wybrać między katalogami Zen i Go
summary: Używaj katalogów OpenCode Zen i Go z OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode udostępnia dwa hostowane katalogi w OpenClaw:

| Katalog | Prefiks           | Dostawca środowiska uruchomieniowego |
| ------- | ----------------- | ------------------------------------ |
| **Zen** | `opencode/...`    | `opencode`                           |
| **Go**  | `opencode-go/...` | `opencode-go`                        |

Oba katalogi używają tego samego klucza API OpenCode. OpenClaw zachowuje oddzielne identyfikatory dostawców środowiska uruchomieniowego,
aby routing poszczególnych modeli po stronie upstream pozostał prawidłowy, ale wdrażanie i dokumentacja traktują je
jako jedną konfigurację OpenCode.

## Pierwsze kroki

<Tabs>
  <Tab title="Katalog Zen">
    **Najlepsze do:** wyselekcjonowanego wielomodelowego proxy OpenCode (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Uruchom wdrażanie">
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
    **Najlepsze do:** hostowanej przez OpenCode oferty modeli Kimi, GLM i MiniMax.

    <Steps>
      <Step title="Uruchom wdrażanie">
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

| Właściwość                      | Wartość                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| Dostawca środowiska uruchomieniowego | `opencode`                                                                                |
| Przykładowe modele              | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Właściwość                      | Wartość                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ |
| Dostawca środowiska uruchomieniowego | `opencode-go`                                                        |
| Przykładowe modele              | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Aliasy klucza API">
    `OPENCODE_ZEN_API_KEY` jest również obsługiwany jako alias `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Wspólne dane uwierzytelniające">
    Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje dane uwierzytelniające dla obu dostawców środowiska uruchomieniowego. Nie musisz wdrażać każdego katalogu osobno.
  </Accordion>

  <Accordion title="Rozliczenia i pulpit">
    Logujesz się do OpenCode, dodajesz dane rozliczeniowe i kopiujesz swój klucz API. Rozliczenia
    i dostępność katalogu są zarządzane z pulpitu OpenCode.
  </Accordion>

  <Accordion title="Zachowanie odtwarzania Gemini">
    Referencje OpenCode oparte na Gemini pozostają na ścieżce proxy Gemini, więc OpenClaw zachowuje
    tam oczyszczanie sygnatur myśli Gemini bez włączania natywnej walidacji odtwarzania Gemini
    ani przepisywania bootstrap.
  </Accordion>

  <Accordion title="Zachowanie odtwarzania modeli innych niż Gemini">
    Referencje OpenCode inne niż Gemini zachowują minimalną politykę odtwarzania zgodną z OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje dane uwierzytelniające dla dostawców środowiska uruchomieniowego Zen i
Go, więc wdrażanie trzeba przeprowadzić tylko raz.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
