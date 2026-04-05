---
read_when:
    - Chcesz używać modeli Z.AI / GLM w OpenClaw
    - Potrzebujesz prostej konfiguracji `ZAI_API_KEY`
summary: Używanie Z.AI (modeli GLM) z OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T14:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI to platforma API dla modeli **GLM**. Udostępnia REST API dla GLM i używa kluczy API
do uwierzytelniania. Utwórz swój klucz API w konsoli Z.AI. OpenClaw używa providera `zai`
z kluczem API Z.AI.

## Konfiguracja przez CLI

```bash
# Ogólna konfiguracja z kluczem API i automatycznym wykrywaniem endpointu
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
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` pozwala OpenClaw wykryć pasujący endpoint Z.AI na podstawie klucza i
automatycznie zastosować właściwy base URL. Użyj jawnych wyborów regionalnych, gdy
chcesz wymusić określoną powierzchnię Coding Plan albo ogólnego API.

## Dołączony katalog GLM

OpenClaw obecnie inicjalizuje dołączonego providera `zai` następującymi modelami:

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

- Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`).
- Domyślna dołączona referencja modelu: `zai/glm-5`
- Nieznane identyfikatory `glm-5*` nadal są forward-resolve na ścieżce dołączonego providera przez
  syntetyzowanie metadanych należących do providera z szablonu `glm-4.7`, gdy identyfikator
  pasuje do aktualnego kształtu rodziny GLM-5.
- `tool_stream` jest domyślnie włączone dla streamingu wywołań narzędzi Z.AI. Ustaw
  `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
- Zobacz [/providers/glm](/providers/glm), aby zapoznać się z przeglądem rodziny modeli.
- Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
