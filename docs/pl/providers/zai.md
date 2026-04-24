---
read_when:
    - Chcesz używać modeli Z.AI / GLM w OpenClaw
    - Potrzebujesz prostej konfiguracji `ZAI_API_KEY`
summary: Używaj Z.AI (modele GLM) z OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T09:30:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI to platforma API dla modeli **GLM**. Udostępnia REST API dla GLM i używa kluczy API
do uwierzytelniania. Utwórz klucz API w konsoli Z.AI. OpenClaw używa dostawcy `zai`
z kluczem API Z.AI.

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- API: Z.AI Chat Completions (uwierzytelnianie Bearer)

## Pierwsze kroki

<Tabs>
  <Tab title="Automatyczne wykrywanie punktu końcowego">
    **Najlepsze dla:** większości użytkowników. OpenClaw wykrywa pasujący punkt końcowy Z.AI na podstawie klucza i automatycznie stosuje prawidłowy Base URL.

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
    **Najlepsze dla:** użytkowników, którzy chcą wymusić konkretny Coding Plan lub ogólną powierzchnię API.

    <Steps>
      <Step title="Wybierz właściwy onboarding choice">
        ```bash
        # Coding Plan Global (zalecane dla użytkowników Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (region China)
        openclaw onboard --auth-choice zai-coding-cn

        # Ogólne API
        openclaw onboard --auth-choice zai-global

        # Ogólne API CN (region China)
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

OpenClaw obecnie zasila dołączonego dostawcę `zai` następującymi modelami:

| Odwołanie do modelu   | Uwagi         |
| --------------------- | ------------- |
| `zai/glm-5.1`         | Model domyślny |
| `zai/glm-5`           |               |
| `zai/glm-5-turbo`     |               |
| `zai/glm-5v-turbo`    |               |
| `zai/glm-4.7`         |               |
| `zai/glm-4.7-flash`   |               |
| `zai/glm-4.7-flashx`  |               |
| `zai/glm-4.6`         |               |
| `zai/glm-4.6v`        |               |
| `zai/glm-4.5`         |               |
| `zai/glm-4.5-air`     |               |
| `zai/glm-4.5-flash`   |               |
| `zai/glm-4.5v`        |               |

<Tip>
Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`). Domyślne dołączone odwołanie do modelu to `zai/glm-5.1`.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Przekazywane rozstrzyganie nieznanych modeli GLM-5">
    Nieznane identyfikatory `glm-5*` nadal są rozstrzygane przekazywaniem na ścieżce dołączonego dostawcy przez
    syntetyzowanie metadanych należących do dostawcy z szablonu `glm-4.7`, gdy identyfikator
    pasuje do obecnego kształtu rodziny GLM-5.
  </Accordion>

  <Accordion title="Streaming wywołań narzędzi">
    `tool_stream` jest domyślnie włączone dla streamingu wywołań narzędzi Z.AI. Aby je wyłączyć:

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

  <Accordion title="Rozumienie obrazów">
    Dołączony Plugin Z.AI rejestruje rozumienie obrazów.

    | Właściwość | Wartość    |
    | ---------- | ---------- |
    | Model      | `glm-4.6v` |

    Rozumienie obrazów jest automatycznie rozstrzygane na podstawie skonfigurowanego uwierzytelniania Z.AI — nie
    jest potrzebna dodatkowa konfiguracja.

  </Accordion>

  <Accordion title="Szczegóły uwierzytelniania">
    - Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
    - Onboarding choice `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI na podstawie prefiksu klucza.
    - Użyj jawnych regionalnych choices (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), gdy chcesz wymusić konkretną powierzchnię API.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Rodzina modeli GLM" href="/pl/providers/glm" icon="microchip">
    Przegląd rodziny modeli GLM.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
</CardGroup>
