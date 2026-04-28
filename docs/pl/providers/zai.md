---
read_when:
    - Chcesz używać modeli Z.AI / GLM w OpenClaw
    - Potrzebujesz prostej konfiguracji `ZAI_API_KEY`
summary: Używaj Z.AI (modele GLM) z OpenClaw
title: Z.AI
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:40:11Z"
  model: gpt-5.4
  provider: openai
  source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
  source_path: providers/zai.md
  workflow: 15
---

Z.AI to platforma API dla modeli **GLM**. Udostępnia interfejsy REST API dla GLM i używa kluczy API
do uwierzytelniania. Utwórz klucz API w konsoli Z.AI. OpenClaw używa dostawcy `zai`
z kluczem API Z.AI.

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- API: Z.AI Chat Completions (uwierzytelnianie Bearer)

## Pierwsze kroki

<Tabs>
  <Tab title="Automatyczne wykrywanie punktu końcowego">
    **Najlepsze dla:** większości użytkowników. OpenClaw wykrywa pasujący punkt końcowy Z.AI na podstawie klucza i automatycznie stosuje poprawny bazowy URL.

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
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Jawny regionalny punkt końcowy">
    **Najlepsze dla:** użytkowników, którzy chcą wymusić określony Coding Plan lub ogólną powierzchnię API.

    <Steps>
      <Step title="Wybierz właściwą opcję onboardingu">
        ```bash
        # Coding Plan Global (zalecane dla użytkowników Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (region Chiny)
        openclaw onboard --auth-choice zai-coding-cn

        # Ogólne API
        openclaw onboard --auth-choice zai-global

        # Ogólne API CN (region Chiny)
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
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Wbudowany katalog

OpenClaw obecnie inicjalizuje dołączonego dostawcę `zai` następującymi modelami:

| Odwołanie do modelu  | Uwagi            |
| -------------------- | ---------------- |
| `zai/glm-5.1`        | Model domyślny   |
| `zai/glm-5`          |                  |
| `zai/glm-5-turbo`    |                  |
| `zai/glm-5v-turbo`   |                  |
| `zai/glm-4.7`        |                  |
| `zai/glm-4.7-flash`  |                  |
| `zai/glm-4.7-flashx` |                  |
| `zai/glm-4.6`        |                  |
| `zai/glm-4.6v`       |                  |
| `zai/glm-4.5`        |                  |
| `zai/glm-4.5-air`    |                  |
| `zai/glm-4.5-flash`  |                  |
| `zai/glm-4.5v`       |                  |

<Tip>
Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`). Domyślne odwołanie do dołączonego modelu to `zai/glm-5.1`.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Rozwiązywanie nieznanych modeli GLM-5 do przodu">
    Nieznane identyfikatory `glm-5*` są nadal rozwiązywane do przodu na ścieżce dołączonego dostawcy przez
    syntetyzowanie metadanych należących do dostawcy z szablonu `glm-4.7`, gdy identyfikator
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
    Myślenie Z.AI podąża za kontrolkami `/think` OpenClaw. Przy wyłączonym myśleniu
    OpenClaw wysyła `thinking: { type: "disabled" }`, aby uniknąć odpowiedzi,
    które zużywają budżet wyjściowy na `reasoning_content` przed widocznym tekstem.

    Zachowane myślenie jest opcjonalne, ponieważ Z.AI wymaga ponownego odtworzenia pełnego historycznego
    `reasoning_content`, co zwiększa liczbę tokenów promptu. Włącz je
    per model:

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
    `reasoning_content` dla tej samej zgodnej z OpenAI transkrypcji.

    Zaawansowani użytkownicy nadal mogą nadpisać dokładny ładunek dostawcy przez
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Rozumienie obrazów">
    Dołączony Plugin Z.AI rejestruje rozumienie obrazów.

    | Właściwość | Wartość    |
    | ---------- | ---------- |
    | Model      | `glm-4.6v` |

    Rozumienie obrazów jest automatycznie rozwiązywane na podstawie skonfigurowanego uwierzytelniania Z.AI — nie
    jest potrzebna dodatkowa konfiguracja.

  </Accordion>

  <Accordion title="Szczegóły uwierzytelniania">
    - Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
    - Opcja onboardingu `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI na podstawie prefiksu klucza.
    - Użyj jawnych opcji regionalnych (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), gdy chcesz wymusić określoną powierzchnię API.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Rodzina modeli GLM" href="/pl/providers/glm" icon="microchip">
    Przegląd rodziny modeli GLM.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania awaryjnego.
  </Card>
</CardGroup>
