---
read_when:
    - Chcesz używać modeli GLM w OpenClaw
    - Potrzebujesz konwencji nazewnictwa modeli i konfiguracji
summary: Przegląd rodziny modeli GLM + jak używać jej w OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T09:27:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# Modele GLM

GLM to **rodzina modeli** (a nie firma) dostępna przez platformę Z.AI. W OpenClaw
modele GLM są dostępne przez dostawcę `zai` i identyfikatory modeli takie jak `zai/glm-5`.

## Pierwsze kroki

<Steps>
  <Step title="Wybierz ścieżkę uwierzytelniania i uruchom onboarding">
    Wybierz opcję onboardingu odpowiadającą Twojemu planowi Z.AI i regionowi:

    | Opcja uwierzytelniania | Najlepsza dla |
    | ----------- | -------- |
    | `zai-api-key` | Ogólna konfiguracja klucza API z automatycznym wykrywaniem endpointu |
    | `zai-coding-global` | Użytkownicy planu Coding (globalnie) |
    | `zai-coding-cn` | Użytkownicy planu Coding (region Chiny) |
    | `zai-global` | Ogólne API (globalnie) |
    | `zai-cn` | Ogólne API (region Chiny) |

    ```bash
    # Przykład: ogólne automatyczne wykrywanie
    openclaw onboard --auth-choice zai-api-key

    # Przykład: plan Coding globalnie
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Ustaw GLM jako domyślny model">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Przykład konfiguracji

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` pozwala OpenClaw wykryć pasujący endpoint Z.AI na podstawie klucza i
automatycznie zastosować poprawny base URL. Użyj jawnych opcji regionalnych, gdy
chcesz wymusić konkretny plan Coding lub ogólną powierzchnię API.
</Tip>

## Wbudowany katalog

OpenClaw obecnie inicjalizuje dołączonego dostawcę `zai` tymi odwołaniami GLM:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Domyślne dołączone odwołanie modelu to `zai/glm-5.1`. Wersje GLM i ich dostępność
mogą się zmieniać; sprawdź dokumentację Z.AI, aby zobaczyć najnowsze informacje.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Automatyczne wykrywanie endpointu">
    Gdy używasz opcji uwierzytelniania `zai-api-key`, OpenClaw analizuje format klucza,
    aby określić poprawny base URL Z.AI. Jawne opcje regionalne
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) nadpisują
    automatyczne wykrywanie i przypinają endpoint bezpośrednio.
  </Accordion>

  <Accordion title="Szczegóły dostawcy">
    Modele GLM są obsługiwane przez dostawcę runtime `zai`. Pełną konfigurację
    dostawcy, endpointy regionalne i dodatkowe możliwości znajdziesz w
    [dokumentacji dostawcy Z.AI](/pl/providers/zai).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawca Z.AI" href="/pl/providers/zai" icon="server">
    Pełna konfiguracja dostawcy Z.AI i endpointy regionalne.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, model ref i zachowania failover.
  </Card>
</CardGroup>
