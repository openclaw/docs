---
read_when:
    - Chcesz używać modeli GLM w OpenClaw
    - Potrzebujesz konwencji nazewnictwa modeli i konfiguracji
summary: Przegląd rodziny modeli GLM i sposób użycia jej w OpenClaw
title: Modele GLM
x-i18n:
    generated_at: "2026-04-05T14:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# Modele GLM

GLM to **rodzina modeli** (a nie firma) dostępna przez platformę Z.AI. W OpenClaw modele GLM
są dostępne przez dostawcę `zai` oraz identyfikatory modeli takie jak `zai/glm-5`.

## Konfiguracja CLI

```bash
# Ogólna konfiguracja klucza API z automatycznym wykrywaniem endpointu
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, zalecane dla użytkowników Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (region Chiny), zalecane dla użytkowników Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (region Chiny)
openclaw onboard --auth-choice zai-cn
```

## Fragment konfiguracji

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` pozwala OpenClaw wykryć pasujący endpoint Z.AI na podstawie klucza i
automatycznie zastosować poprawny base URL. Używaj jawnych opcji regionalnych, gdy
chcesz wymusić konkretną powierzchnię Coding Plan albo General API.

## Obecne bundled modele GLM

OpenClaw obecnie inicjalizuje bundled dostawcę `zai` następującymi odwołaniami GLM:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Uwagi

- Wersje GLM i ich dostępność mogą się zmieniać; najnowsze informacje znajdziesz w dokumentacji Z.AI.
- Domyślne bundled odwołanie do modelu to `zai/glm-5`.
- Szczegóły dotyczące dostawcy znajdziesz w [/providers/zai](/providers/zai).
