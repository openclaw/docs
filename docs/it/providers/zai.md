---
read_when:
    - Vuoi usare modelli Z.AI / GLM in OpenClaw
    - Hai bisogno di una semplice configurazione di `ZAI_API_KEY`
summary: Usare Z.AI (modelli GLM) con OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T14:02:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI è la piattaforma API per i modelli **GLM**. Fornisce API REST per GLM e usa API key
per l'autenticazione. Crea la tua API key nella console Z.AI. OpenClaw usa il provider `zai`
con una API key Z.AI.

## Configurazione CLI

```bash
# Configurazione generica con API key e rilevamento automatico dell'endpoint
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, consigliato per gli utenti Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (regione Cina), consigliato per gli utenti Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# API generale
openclaw onboard --auth-choice zai-global

# API generale CN (regione Cina)
openclaw onboard --auth-choice zai-cn
```

## Esempio di configurazione

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` consente a OpenClaw di rilevare dall'API key l'endpoint Z.AI corrispondente
e applicare automaticamente il `baseUrl` corretto. Usa le scelte regionali esplicite quando
vuoi forzare una specifica superficie Coding Plan o API generale.

## Catalogo GLM incluso

Attualmente OpenClaw inizializza il provider `zai` incluso con:

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

## Note

- I modelli GLM sono disponibili come `zai/<model>` (esempio: `zai/glm-5`).
- Riferimento al modello incluso predefinito: `zai/glm-5`
- Gli id `glm-5*` sconosciuti vengono comunque risolti in inoltro sul percorso del provider incluso
  sintetizzando metadati di proprietà del provider a partire dal template `glm-4.7` quando l'id
  corrisponde all'attuale struttura della famiglia GLM-5.
- `tool_stream` è abilitato per impostazione predefinita per lo streaming delle tool call Z.AI. Imposta
  `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
- Vedi [/providers/glm](/providers/glm) per la panoramica della famiglia di modelli.
- Z.AI usa autenticazione Bearer con la tua API key.
