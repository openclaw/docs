---
read_when:
    - Chcesz używać modeli Z.AI / GLM w OpenClaw
    - Potrzebujesz prostej konfiguracji ZAI_API_KEY
summary: Używanie Z.AI (modeli GLM) z OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:16:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI to platforma API dla modeli **GLM**. Udostępnia interfejsy REST API dla GLM i
używa kluczy API do uwierzytelniania. Utwórz klucz API w konsoli Z.AI.
OpenClaw używa dostawcy `zai` z kluczem API Z.AI.

| Właściwość | Wartość                                      |
| ---------- | -------------------------------------------- |
| Dostawca   | `zai`                                        |
| Pakiet     | `@openclaw/zai-provider`                     |
| Uwierzytelnianie | `ZAI_API_KEY` (starszy alias: `Z_AI_API_KEY`) |
| API        | Z.AI Chat Completions (uwierzytelnianie Bearer) |

## Modele GLM

GLM to rodzina modeli, a nie osobny dostawca. W OpenClaw modele GLM używają
odwołań takich jak `zai/glm-5.2`: dostawca `zai`, identyfikator modelu `glm-5.2`.

## Pierwsze kroki

Najpierw zainstaluj Plugin dostawcy:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **Najlepsze dla:** większości użytkowników. OpenClaw sprawdza obsługiwane punkty końcowe Z.AI przy użyciu Twojego klucza API i automatycznie stosuje poprawny bazowy URL.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **Najlepsze dla:** użytkowników, którzy chcą wymusić określony Coding Plan lub ogólną powierzchnię API.

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Przykład konfiguracji

<Tip>
`zai-api-key` pozwala OpenClaw wykryć pasujący punkt końcowy Z.AI na podstawie klucza i
automatycznie zastosować poprawny bazowy URL. Użyj jawnych wyborów regionalnych, gdy
chcesz wymusić określony Coding Plan lub ogólną powierzchnię API.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Wbudowany katalog

Plugin dostawcy `zai` dostarcza swój katalog w manifeście Pluginu, więc lista tylko do odczytu
może pokazywać znane wiersze GLM bez ładowania środowiska uruchomieniowego dostawcy:

```bash
openclaw models list --all --provider zai
```

Katalog oparty na manifeście obecnie obejmuje:

| Odwołanie modelu     | Uwagi                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Domyślny Coding Plan; kontekst 1M |
| `zai/glm-5.1`        | Domyślne ogólne API             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 obsługuje poziomy myślenia `off`, `low`, `high` i `max`. OpenClaw mapuje
`low` i `high` na wysoki wysiłek rozumowania Z.AI, a `max` na maksymalny wysiłek.
</Tip>

<Note>
Konfiguracja Coding Plan domyślnie używa `zai/glm-5.2`; konfiguracja ogólnego API zachowuje
`zai/glm-5.1`. Automatyczne wykrywanie punktu końcowego wraca do `glm-5.1` lub `glm-4.7`,
gdy wybrany plan nie udostępnia GLM-5.2. Wersje i dostępność GLM
mogą się zmieniać; uruchom `openclaw models list --all --provider zai`, aby zobaczyć katalog
znany Twojej zainstalowanej wersji.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    Nieznane identyfikatory `glm-5*` nadal są rozwiązywane naprzód na ścieżce dostawcy przez
    syntetyzowanie metadanych należących do dostawcy z szablonu `glm-4.7`, gdy identyfikator
    pasuje do bieżącego kształtu rodziny GLM-5.
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` jest domyślnie włączone dla strumieniowania wywołań narzędzi Z.AI. Aby je wyłączyć:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking and preserved thinking">
    Myślenie Z.AI działa zgodnie z kontrolkami OpenClaw `/think`. Gdy myślenie jest wyłączone,
    OpenClaw wysyła `thinking: { type: "disabled" }`, aby uniknąć odpowiedzi, które
    zużywają budżet wyjściowy na `reasoning_content` przed widocznym tekstem.

    Zachowane myślenie jest opcjonalne, ponieważ Z.AI wymaga odtworzenia pełnej historycznej
    zawartości `reasoning_content`, co zwiększa liczbę tokenów w prompcie. Włącz je
    dla modelu:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Gdy jest włączone i myślenie jest aktywne, OpenClaw wysyła
    `thinking: { type: "enabled", clear_thinking: false }` i odtwarza wcześniejsze
    `reasoning_content` dla tego samego transkryptu zgodnego z OpenAI.

    Zaawansowani użytkownicy nadal mogą nadpisać dokładny ładunek dostawcy za pomocą
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Image understanding">
    Plugin Z.AI rejestruje rozumienie obrazów.

    | Właściwość   | Wartość     |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Rozumienie obrazów jest automatycznie rozwiązywane na podstawie skonfigurowanego uwierzytelniania Z.AI — nie jest
    potrzebna dodatkowa konfiguracja.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
    - Wybór onboardingu `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI, sprawdzając obsługiwane punkty końcowe za pomocą Twojego klucza.
    - Użyj jawnych wyborów regionalnych (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), gdy chcesz wymusić określoną powierzchnię API.
    - Starsza zmienna środowiskowa `Z_AI_API_KEY` jest nadal akceptowana; OpenClaw kopiuje ją do `ZAI_API_KEY` podczas uruchamiania, jeśli `ZAI_API_KEY` nie jest ustawiona.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji OpenClaw, w tym ustawienia dostawców i modeli.
  </Card>
</CardGroup>
