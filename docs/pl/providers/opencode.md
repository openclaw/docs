---
read_when:
    - Chcesz uzyskać dostęp do modeli hostowanych przez OpenCode
    - Chcesz wybrać między katalogami Zen i Go
summary: Używanie katalogów OpenCode Zen i Go z OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T15:33:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode udostępnia w OpenClaw dwa hostowane katalogi:

| Katalog | Prefiks           | Dostawca środowiska wykonawczego |
| ------- | ----------------- | -------------------------------- |
| **Zen** | `opencode/...`    | `opencode`                       |
| **Go**  | `opencode-go/...` | `opencode-go`                    |

Oba katalogi korzystają z jednego klucza API OpenCode (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). OpenClaw zachowuje oddzielne identyfikatory dostawców
środowiska wykonawczego, aby routing poszczególnych modeli po stronie usługi
nadrzędnej pozostał prawidłowy, jednak proces konfiguracji początkowej i
dokumentacja traktują je jako jedną konfigurację OpenCode.

## Pierwsze kroki

<Tabs>
  <Tab title="Katalog Zen">
    **Najlepszy do:** wyselekcjonowanego, wielomodelowego serwera proxy OpenCode
    (Claude, GPT, Gemini, GLM, DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Uruchom konfigurację początkową">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Możesz też przekazać klucz bezpośrednio:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Ustaw model Zen jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Sprawdź dostępność modeli">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Katalog Go">
    **Najlepszy do:** hostowanej przez OpenCode gamy modeli Kimi, GLM, MiniMax,
    Qwen i DeepSeek.

    <Steps>
      <Step title="Uruchom konfigurację początkową">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Możesz też przekazać klucz bezpośrednio:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

| Właściwość                    | Wartość                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Dostawca środowiska wykonawczego | `opencode`                                                                                 |
| Przykładowe modele            | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

Uruchom `openclaw models list --provider opencode`, aby wyświetlić pełną aktualną
listę, która zawiera również pozycje bezpłatnej warstwy, takie jak
`opencode/big-pickle` i `opencode/deepseek-v4-flash-free`.

### Go

| Właściwość                    | Wartość                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| Dostawca środowiska wykonawczego | `opencode-go`                                                          |
| Przykładowe modele            | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Pełną tabelę modeli Go znajdziesz w sekcji [OpenCode Go](/pl/providers/opencode-go).

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Aliasy klucza API">
    `OPENCODE_ZEN_API_KEY` jest również akceptowany jako alias dla
    `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Współdzielone dane uwierzytelniające">
    Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje dane
    uwierzytelniające dla obu dostawców środowiska wykonawczego. Nie trzeba
    osobno przeprowadzać konfiguracji początkowej każdego katalogu.
  </Accordion>

  <Accordion title="Uzyskiwanie klucza API">
    Utwórz konto OpenCode i wygeneruj klucz API na stronie
    [opencode.ai/auth](https://opencode.ai/auth). Rozliczeniami i dostępnością
    katalogów zarządza się z poziomu panelu OpenCode.
  </Accordion>

  <Accordion title="Zachowanie odtwarzania dla Gemini">
    Odwołania OpenCode oparte na Gemini pozostają na ścieżce proxy Gemini, dzięki
    czemu OpenClaw zachowuje tam oczyszczanie sygnatur procesu rozumowania Gemini
    bez włączania natywnej walidacji odtwarzania Gemini ani przepisywania danych
    inicjalizacyjnych.
  </Accordion>

  <Accordion title="Zachowanie odtwarzania dla modeli innych niż Gemini">
    Odwołania OpenCode inne niż Gemini zachowują minimalną politykę odtwarzania
    zgodną z OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/pl/providers/opencode-go" icon="server">
    Pełna dokumentacja katalogu Go.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu działania przełączania
    awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
