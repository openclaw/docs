---
read_when:
    - Chcesz używać modeli GLM w OpenClaw
    - Potrzebujesz konwencji nazewnictwa modeli i konfiguracji
summary: Przegląd rodziny modeli GLM oraz sposób używania ich w OpenClaw
title: Modele GLM
x-i18n:
    generated_at: "2026-04-08T06:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a55acfa139847b4b85dbc09f1068cbd2febb1e49f984a23ea9e3b43bc910eb
    source_path: providers/glm.md
    workflow: 15
---

# Modele GLM

GLM to **rodzina modeli** (nie firma) dostępna za pośrednictwem platformy Z.AI. W OpenClaw modele
GLM są dostępne przez dostawcę `zai` i identyfikatory modeli takie jak `zai/glm-5`.

## Konfiguracja CLI

```bash
# Ogólna konfiguracja klucza API z automatycznym wykrywaniem punktu końcowego
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, zalecane dla użytkowników Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (region Chiny), zalecane dla użytkowników Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# Ogólne API
openclaw onboard --auth-choice zai-global

# Ogólne API CN (region Chiny)
openclaw onboard --auth-choice zai-cn
```

## Fragment konfiguracji

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

`zai-api-key` pozwala OpenClaw wykryć pasujący punkt końcowy Z.AI na podstawie klucza i
automatycznie zastosować poprawny bazowy URL. Użyj jawnych opcji regionalnych, jeśli
chcesz wymusić konkretny wariant Coding Plan lub ogólnego API.

## Obecnie dołączone modele GLM

OpenClaw obecnie inicjalizuje dołączonego dostawcę `zai` następującymi odwołaniami GLM:

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

- Wersje GLM i ich dostępność mogą się zmieniać; sprawdź dokumentację Z.AI, aby uzyskać najnowsze informacje.
- Domyślnym dołączonym odwołaniem do modelu jest `zai/glm-5.1`.
- Szczegóły dostawcy znajdziesz w [/providers/zai](/pl/providers/zai).
