---
read_when:
    - Chcesz używać modeli Z.AI / GLM w OpenClaw
    - Wymagana jest prosta konfiguracja ZAI_API_KEY
summary: Używanie Z.AI (modeli GLM) z OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T10:01:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI to platforma API dla modeli **GLM**. Udostępnia interfejsy REST API dla GLM i używa kluczy API
do uwierzytelniania. Utwórz klucz API w konsoli Z.AI. OpenClaw używa providera `zai`
z kluczem API Z.AI.

- Provider: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- API: Z.AI Chat Completions (uwierzytelnianie Bearer)

## Pierwsze kroki

<Tabs>
  <Tab title="Automatyczne wykrywanie punktu końcowego">
    **Najlepsze dla:** większości użytkowników. OpenClaw wykrywa pasujący punkt końcowy Z.AI na podstawie klucza i automatycznie stosuje prawidłowy bazowy adres URL.

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy model jest na liście">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Jawny regionalny punkt końcowy">
    **Najlepsze dla:** użytkowników, którzy chcą wymusić konkretny Coding Plan albo ogólną powierzchnię API.

    <Steps>
      <Step title="Wybierz właściwą opcję onboardingu">
        ```bash
        # Coding Plan Global (zalecane dla użytkowników Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (region Chin)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (region Chin)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy model jest na liście">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Wbudowany katalog

OpenClaw dostarcza dołączony katalog providera `zai` w manifeście Plugin, więc lista tylko do odczytu
może pokazywać znane wiersze GLM bez ładowania środowiska uruchomieniowego providera:

```bash
openclaw models list --all --provider zai
```

Katalog oparty na manifeście obecnie obejmuje:

| Odwołanie do modelu | Uwagi             |
| ------------------- | ----------------- |
| `zai/glm-5.1`        | Model domyślny    |
| `zai/glm-5`          |                   |
| `zai/glm-5-turbo`    |                   |
| `zai/glm-5v-turbo`   |                   |
| `zai/glm-4.7`        |                   |
| `zai/glm-4.7-flash`  |                   |
| `zai/glm-4.7-flashx` |                   |
| `zai/glm-4.6`        |                   |
| `zai/glm-4.6v`       |                   |
| `zai/glm-4.5`        |                   |
| `zai/glm-4.5-air`    |                   |
| `zai/glm-4.5-flash`  |                   |
| `zai/glm-4.5v`       |                   |

<Tip>
Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`). Domyślne dołączone odwołanie do modelu to `zai/glm-5.1`.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Rozwiązywanie w przód nieznanych modeli GLM-5">
    Nieznane identyfikatory `glm-5*` nadal są rozwiązywane w przód na ścieżce dołączonego providera przez
    syntetyzowanie metadanych należących do providera z szablonu `glm-4.7`, gdy identyfikator
    pasuje do bieżącego kształtu rodziny GLM-5.
  </Accordion>

  <Accordion title="Strumieniowanie wywołań narzędzi">
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

  <Accordion title="Myślenie i zachowane myślenie">
    Myślenie Z.AI podąża za kontrolkami `/think` OpenClaw. Gdy myślenie jest wyłączone,
    OpenClaw wysyła `thinking: { type: "disabled" }`, aby uniknąć odpowiedzi, które
    zużywają budżet wyjściowy na `reasoning_content` przed widocznym tekstem.

    Zachowane myślenie jest opcjonalne, ponieważ Z.AI wymaga odtworzenia pełnej historycznej
    zawartości `reasoning_content`, co zwiększa liczbę tokenów promptu. Włącz je
    dla modelu:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
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

    Zaawansowani użytkownicy nadal mogą nadpisać dokładny ładunek providera za pomocą
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Rozumienie obrazów">
    Dołączony Plugin Z.AI rejestruje rozumienie obrazów.

    | Właściwość    | Wartość     |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Rozumienie obrazów jest automatycznie rozwiązywane na podstawie skonfigurowanego uwierzytelniania Z.AI — nie
    jest potrzebna dodatkowa konfiguracja.

  </Accordion>

  <Accordion title="Szczegóły uwierzytelniania">
    - Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
    - Opcja onboardingu `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI na podstawie prefiksu klucza.
    - Użyj jawnych opcji regionalnych (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), gdy chcesz wymusić konkretną powierzchnię API.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Rodzina modeli GLM" href="/pl/providers/glm" icon="microchip">
    Przegląd rodziny modeli GLM.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie providerów, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
</CardGroup>
