---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você precisa de onboarding com chave de API do Mistral e referências de modelo
summary: Use modelos Mistral e transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-08T02:17:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e32a0eb2a37dba6383ba338b06a8d0be600e7443aa916225794ccb0fdf46aee
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

O OpenClaw oferece suporte ao Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral em entendimento de mídia.
O Mistral também pode ser usado para embeddings de memória (`memorySearch.provider = "mistral"`).

## Configuração via CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Trecho de configuração (provedor LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Catálogo de LLM incluído

Atualmente, o OpenClaw inclui este catálogo Mistral:

| Model ref                        | Input       | Context | Max output | Notes                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | Programação                                                      |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | Com suporte a raciocínio                                         |

## Trecho de configuração (transcrição de áudio com Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Raciocínio ajustável (`mistral-small-latest`)

`mistral/mistral-small-latest` corresponde ao Mistral Small 4 e oferece suporte a [raciocínio ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions via `reasoning_effort` (`none` minimiza pensamento extra na saída; `high` exibe rastros completos de pensamento antes da resposta final).

O OpenClaw mapeia o nível de **thinking** da sessão para a API do Mistral:

- **off** / **minimal** → `none`
- **low** / **medium** / **high** / **xhigh** / **adaptive** → `high`

Os outros modelos do catálogo Mistral incluído não usam esse parâmetro; continue usando modelos `magistral-*` quando quiser o comportamento nativo do Mistral focado primeiro em raciocínio.

## Observações

- A autenticação do Mistral usa `MISTRAL_API_KEY`.
- A URL base do provedor usa por padrão `https://api.mistral.ai/v1`.
- O modelo padrão no onboarding é `mistral/mistral-large-latest`.
- O modelo de áudio padrão de entendimento de mídia para Mistral é `voxtral-mini-latest`.
- O caminho de transcrição de mídia usa `/v1/audio/transcriptions`.
- O caminho de embeddings de memória usa `/v1/embeddings` (modelo padrão: `mistral-embed`).
