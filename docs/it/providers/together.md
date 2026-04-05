---
read_when:
    - Vuoi usare Together AI con OpenClaw
    - Hai bisogno della variabile env della chiave API o della scelta auth CLI
summary: Configurazione Together AI (auth + selezione del modello)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T14:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) fornisce accesso ai principali modelli open source, tra cui Llama, DeepSeek, Kimi e altri, tramite un'API unificata.

- Provider: `together`
- Auth: `TOGETHER_API_KEY`
- API: compatibile con OpenAI
- Base URL: `https://api.together.xyz/v1`

## Avvio rapido

1. Imposta la chiave API (consigliato: memorizzarla per il Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Questo imposterà `together/moonshotai/Kimi-K2.5` come modello predefinito.

## Nota sull'environment

Se il Gateway è in esecuzione come daemon (launchd/systemd), assicurati che `TOGETHER_API_KEY`
sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).

## Catalogo integrato

OpenClaw attualmente include questo catalogo Together bundled:

| Model ref                                                    | Nome                                   | Input       | Contesto   | Note                             |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | Modello predefinito; reasoning abilitato |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | Modello testuale general-purpose |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Modello instruction veloce       |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodale                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodale                      |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | Modello testuale generalista     |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | Modello di reasoning             |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | Modello testuale Kimi secondario |

Il preset di onboarding imposta `together/moonshotai/Kimi-K2.5` come modello predefinito.
