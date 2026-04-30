---
read_when:
    - Você quer uma única chave de API para os principais LLMs de código aberto
    - Você quer executar modelos pela API da DeepInfra no OpenClaw
summary: Use a API unificada da DeepInfra para acessar os modelos de código aberto e de ponta mais populares no OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

A DeepInfra fornece uma **API unificada** que roteia solicitações para os modelos open source e frontier mais populares por trás de um único endpoint e uma chave de API. Ela é compatível com OpenAI, portanto a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

## Obtendo uma chave de API

1. Acesse [https://deepinfra.com/](https://deepinfra.com/)
2. Faça login ou crie uma conta
3. Navegue até Dashboard / Keys e gere uma nova chave de API ou use a criada automaticamente

## Configuração da CLI

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Superfícies do OpenClaw compatíveis

O Plugin incluído registra todas as superfícies da DeepInfra que correspondem aos contratos atuais de provedores do OpenClaw:

| Superfície                  | Modelo padrão                       | Configuração/ferramenta do OpenClaw                     |
| --------------------------- | ----------------------------------- | ------------------------------------------------------- |
| Chat / provedor de modelo   | `deepseek-ai/DeepSeek-V3.2`         | `agents.defaults.model`                                 |
| Geração/edição de imagem    | `black-forest-labs/FLUX-1-schnell`  | `image_generate`, `agents.defaults.imageGenerationModel` |
| Compreensão de mídia        | `moonshotai/Kimi-K2.5` para imagens | compreensão de imagem recebida                          |
| Fala para texto             | `openai/whisper-large-v3-turbo`     | transcrição de áudio recebido                           |
| Texto para fala             | `hexgrad/Kokoro-82M`                | `messages.tts.provider: "deepinfra"`                    |
| Geração de vídeo            | `Pixverse/Pixverse-T2V`             | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de memória       | `BAAI/bge-m3`                       | `agents.defaults.memorySearch.provider: "deepinfra"`    |

A DeepInfra também expõe reranking, classificação, detecção de objetos e outros tipos de modelos nativos. O OpenClaw atualmente não tem contratos de provedor de primeira classe para essas categorias, portanto este Plugin ainda não os registra.

## Modelos disponíveis

O OpenClaw descobre dinamicamente os modelos disponíveis da DeepInfra na inicialização. Use `/models deepinfra` para ver a lista completa de modelos disponíveis.

Qualquer modelo disponível em [DeepInfra.com](https://deepinfra.com/) pode ser usado com o prefixo `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...e muitos outros
```

## Observações

- As refs de modelo são `deepinfra/<provider>/<model>` (por exemplo, `deepinfra/Qwen/Qwen3-Max`).
- Modelo padrão: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- URL base: `https://api.deepinfra.com/v1/openai`
- A geração de vídeo nativa usa `https://api.deepinfra.com/v1/inference/<model>`.
