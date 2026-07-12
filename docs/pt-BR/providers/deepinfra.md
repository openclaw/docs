---
read_when:
    - Você quer uma única chave de API para os principais LLMs de código aberto
    - Você quer executar modelos pela API da DeepInfra no OpenClaw
summary: Use a API unificada da DeepInfra para acessar os modelos de código aberto e de ponta mais populares no OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T00:18:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

A DeepInfra encaminha solicitações para modelos populares de código aberto e de fronteira por meio de um
único endpoint compatível com a OpenAI e uma chave de API. A maioria dos SDKs da OpenAI funciona com
ela ao alterar a URL base.

## Instalar o plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obter uma chave de API

1. Entre em [deepinfra.com](https://deepinfra.com/)
2. Acesse Dashboard / Keys e gere uma chave ou use a criada automaticamente

## Configuração pela CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Ou defina a variável de ambiente:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Trecho de configuração

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Recursos compatíveis

Chat, geração de imagens e geração de vídeos atualizam seus catálogos de modelos
em tempo real a partir de `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
assim que `DEEPINFRA_API_KEY` é configurada. Os outros recursos usam os valores
padrão estáticos abaixo até migrarem para o mesmo catálogo em tempo real.

| Recurso                    | Modelo padrão                                                                                                             | Configuração/ferramenta do OpenClaw                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / provedor de modelos | primeira entrada com a tag de chat do catálogo em tempo real (alternativa estática: `deepseek-ai/DeepSeek-V4-Flash`)       | `agents.defaults.model`                                  |
| Geração/edição de imagens  | primeira entrada com a tag `image-gen` do catálogo em tempo real (alternativa estática: `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Compreensão de mídia       | `moonshotai/Kimi-K2.5` para imagens                                                                                        | compreensão de imagens recebidas                         |
| Conversão de fala em texto | `openai/whisper-large-v3-turbo`                                                                                           | transcrição de áudios recebidos                          |
| Conversão de texto em fala | `hexgrad/Kokoro-82M`                                                                                                      | `messages.tts.provider: "deepinfra"`                     |
| Geração de vídeos           | alternativa estática: `Pixverse/Pixverse-T2V` (atualmente, não há linhas `video-gen` em tempo real da DeepInfra)           | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de memória      | `BAAI/bge-m3`                                                                                                             | `agents.defaults.memorySearch.provider: "deepinfra"`     |

A DeepInfra também disponibiliza reclassificação, classificação, detecção de objetos e outros
tipos nativos de modelos. O OpenClaw ainda não tem um contrato de provedor para essas categorias,
portanto, este plugin não as registra.

## Modelos disponíveis

O OpenClaw descobre dinamicamente os modelos da DeepInfra assim que uma chave é configurada. Use
`/models deepinfra` ou `openclaw models list --provider deepinfra` para ver a
lista atual.

Qualquer modelo disponível em [deepinfra.com](https://deepinfra.com/) funciona com o
prefixo `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...e muitos outros
```

## Observações

- As referências de modelos seguem o formato `deepinfra/<provider>/<model>` (por exemplo, `deepinfra/Qwen/Qwen3-Max`).
- Modelo de chat padrão: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL base: `https://api.deepinfra.com/v1/openai`
- A geração nativa de vídeos usa `https://api.deepinfra.com/v1/inference/<model>`.

## Conteúdo relacionado

- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
