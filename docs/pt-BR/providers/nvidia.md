---
read_when:
    - Você quer usar modelos abertos no OpenClaw gratuitamente
    - Você precisa configurar `NVIDIA_API_KEY`
summary: Use a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-08T02:17:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b00f8cedaf223a33ba9f6a6dd8cf066d88cebeea52d391b871e435026182228a
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para modelos abertos gratuitamente. Autentique-se com uma chave de API de [build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Configuração pela CLI

Exporte a chave uma vez e depois execute o onboarding e defina um modelo NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
```

Se você ainda passar `--token`, lembre-se de que ele vai para o histórico do shell e para a saída de `ps`; prefira a variável de ambiente quando possível.

## Trecho de configuração

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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## IDs de modelo

| Model ref                                  | Name                         | Context | Max output |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Observações

- Endpoint `/v1` compatível com OpenAI; use uma chave de API de [build.nvidia.com](https://build.nvidia.com/).
- O provider é ativado automaticamente quando `NVIDIA_API_KEY` está definida.
- O catálogo incluído é estático; os custos têm valor padrão `0` no código-fonte.
