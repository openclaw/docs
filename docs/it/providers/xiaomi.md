---
read_when:
    - Vuoi usare i modelli Xiaomi MiMo in OpenClaw
    - Hai bisogno della configurazione di `XIAOMI_API_KEY`
summary: Usa i modelli Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T14:02:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo è la piattaforma API per i modelli **MiMo**. OpenClaw usa l'endpoint Xiaomi
compatibile con OpenAI con autenticazione tramite chiave API. Crea la tua chiave API nella
[Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys), poi configura il
provider integrato `xiaomi` con quella chiave.

## Catalogo integrato

- URL base: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Autorizzazione: `Bearer $XIAOMI_API_KEY`

| Riferimento modello     | Input        | Contesto  | Output massimo | Note                         |
| ----------------------- | ------------ | --------- | -------------- | ---------------------------- |
| `xiaomi/mimo-v2-flash`  | text         | 262,144   | 8,192          | Modello predefinito          |
| `xiaomi/mimo-v2-pro`    | text         | 1,048,576 | 32,000         | Reasoning abilitato          |
| `xiaomi/mimo-v2-omni`   | text, image  | 262,144   | 32,000         | Multimodale con reasoning abilitato |

## Configurazione CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# oppure non interattivo
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Snippet di configurazione

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Note

- Riferimento modello predefinito: `xiaomi/mimo-v2-flash`.
- Modelli integrati aggiuntivi: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Il provider viene iniettato automaticamente quando `XIAOMI_API_KEY` è impostato (o esiste un profilo di autenticazione).
- Vedi [/concepts/model-providers](/concepts/model-providers) per le regole dei provider.
