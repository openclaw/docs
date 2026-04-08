---
read_when:
    - Chcesz używać Z.AI / modeli GLM w OpenClaw
    - Potrzebujesz prostej konfiguracji ZAI_API_KEY
summary: Używaj Z.AI (modeli GLM) z OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-08T06:01:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66cbd9813ee28d202dcae34debab1b0cf9927793acb00743c1c62b48d9e381f9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI to platforma API dla modeli **GLM**. Udostępnia interfejsy REST API dla GLM i używa kluczy API
do uwierzytelniania. Utwórz swój klucz API w konsoli Z.AI. OpenClaw używa dostawcy `zai`
z kluczem API Z.AI.

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

## Dołączony katalog GLM

OpenClaw obecnie inicjalizuje dołączonego dostawcę `zai` następującymi pozycjami:

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

- Modele GLM są dostępne jako `zai/<model>` (na przykład: `zai/glm-5`).
- Domyślne odwołanie do dołączonego modelu: `zai/glm-5.1`
- Nieznane identyfikatory `glm-5*` nadal są rozwiązywane na ścieżce dołączonego dostawcy przez
  syntetyzowanie metadanych należących do dostawcy na podstawie szablonu `glm-4.7`, gdy identyfikator
  pasuje do obecnego kształtu rodziny GLM-5.
- `tool_stream` jest domyślnie włączone dla strumieniowania wywołań narzędzi Z.AI. Ustaw
  `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby je wyłączyć.
- Przegląd rodziny modeli znajdziesz w [/providers/glm](/pl/providers/glm).
- Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
