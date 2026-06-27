---
read_when:
    - Você quer uma única chave de API para os principais LLMs de código aberto
    - Você quer executar modelos pela API da DeepInfra no OpenClaw
summary: Use a API unificada da DeepInfra para acessar os modelos de código aberto e de fronteira mais populares no OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:02:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

A DeepInfra fornece uma **API unificada** que roteia solicitações para os modelos open source e de fronteira mais populares por trás de um único endpoint e chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

## Instalar Plugin

Instale o Plugin oficial e depois reinicie o Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obtendo uma chave de API

1. Acesse [https://deepinfra.com/](https://deepinfra.com/)
2. Faça login ou crie uma conta
3. Navegue até Dashboard / Keys e gere uma nova chave de API ou use a que foi criada automaticamente

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

## Superfícies do OpenClaw compatíveis

O Plugin registra todas as superfícies da DeepInfra que correspondem aos contratos atuais de provedores do OpenClaw. Chat, geração de imagens e geração de vídeo atualizam seus catálogos de modelos em tempo real a partir de `/v1/openai/models?sort_by=openclaw&filter=with_meta` quando `DEEPINFRA_API_KEY` está configurado; as outras superfícies usam os padrões estáticos selecionados abaixo.

| Superfície               | Modelo padrão                                                                                           | Configuração/ferramenta do OpenClaw                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / provedor de modelo | primeira entrada marcada como chat do catálogo em tempo real (fallback do manifesto `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Geração/edição de imagens | primeira entrada marcada como `image-gen` do catálogo em tempo real (fallback estático `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Entendimento de mídia     | `moonshotai/Kimi-K2.5` para imagens                                                                     | entendimento de imagens de entrada                       |
| Fala para texto           | `openai/whisper-large-v3-turbo`                                                                         | transcrição de áudio de entrada                          |
| Texto para fala           | `hexgrad/Kokoro-82M`                                                                                    | `messages.tts.provider: "deepinfra"`                     |
| Geração de vídeo          | primeira entrada marcada como `video-gen` do catálogo em tempo real (fallback estático `Pixverse/Pixverse-T2V`) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de memória     | `BAAI/bge-m3`                                                                                           | `agents.defaults.memorySearch.provider: "deepinfra"`     |

A DeepInfra também expõe reranking, classificação, detecção de objetos e outros tipos de modelos nativos. Atualmente, o OpenClaw não tem contratos de provedor de primeira classe para essas categorias, então este Plugin ainda não as registra.

## Modelos disponíveis

O OpenClaw descobre dinamicamente os modelos da DeepInfra disponíveis na inicialização. Use `/models deepinfra` para ver a lista completa de modelos disponíveis.

Qualquer modelo disponível em [DeepInfra.com](https://deepinfra.com/) pode ser usado com o prefixo `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Observações

- As referências de modelo são `deepinfra/<provider>/<model>` (por exemplo, `deepinfra/Qwen/Qwen3-Max`).
- Modelo padrão: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL base: `https://api.deepinfra.com/v1/openai`
- A geração de vídeo nativa usa `https://api.deepinfra.com/v1/inference/<model>`.

## Relacionado

- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Todos os provedores](/pt-BR/providers/index)
