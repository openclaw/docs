---
read_when:
    - Vuoi usare modelli NVIDIA in OpenClaw
    - Hai bisogno della configurazione di NVIDIA_API_KEY
summary: Usa l'API compatibile con OpenAI di NVIDIA in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T14:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA fornisce un'API compatibile con OpenAI su `https://integrate.api.nvidia.com/v1` per i modelli Nemotron e NeMo. Autenticati con una chiave API da [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Configurazione CLI

Esporta la chiave una volta, poi esegui l'onboarding e imposta un modello NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Se passi ancora `--token`, ricorda che finisce nella cronologia della shell e nell'output di `ps`; quando possibile preferisci la variabile env.

## Frammento di config

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## ID modello

| Model ref                                            | Nome                                     | Contesto | Output massimo |
| ---------------------------------------------------- | ---------------------------------------- | -------- | -------------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072  | 4,096          |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072  | 4,096          |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192    | 2,048          |

## Note

- Endpoint `/v1` compatibile con OpenAI; usa una chiave API da NVIDIA NGC.
- Il provider si abilita automaticamente quando è impostato `NVIDIA_API_KEY`.
- Il catalogo bundled è statico; i costi nel sorgente sono impostati per impostazione predefinita a `0`.
