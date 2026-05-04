---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para geração de vídeo
summary: Use a API unificada da OpenRouter para acessar vários modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T05:54:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único endpoint e uma única chave de API. Ela é compatível com a OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

## Primeiros passos

<Steps>
  <Step title="Get your API key">
    Crie uma chave de API em [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
    O onboarding usa `openrouter/auto` por padrão. Escolha um modelo concreto depois:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Exemplo de configuração

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referências de modelos

<Note>
Refs de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Ref. do modelo                   | Observações                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Roteamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |

## Geração de imagens

OpenRouter também pode respaldar a ferramenta `image_generate`. Use um modelo de imagem do OpenRouter em `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

O OpenClaw envia solicitações de imagem para a API de imagens de conclusões de chat do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas compatíveis de `aspectRatio` e `resolution` por meio do `image_config` do OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem mais lentos do OpenRouter; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda tem precedência.

## Geração de vídeo

OpenRouter também pode respaldar a ferramenta `video_generate` por meio de sua API assíncrona `/videos`. Use um modelo de vídeo do OpenRouter em `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

O OpenClaw envia trabalhos de texto para vídeo e imagem para vídeo ao OpenRouter, consulta
a `polling_url` retornada e baixa o vídeo concluído de
`unsigned_urls` do OpenRouter ou do endpoint documentado de conteúdo do trabalho.
Imagens de referência são enviadas como imagens do primeiro/último quadro por padrão; imagens
marcadas com `reference_image` são enviadas como referências de entrada do OpenRouter. O padrão
incluído `google/veo-3.1-fast` anuncia as durações atualmente compatíveis de 4/6/8
segundos, resoluções `720P`/`1080P` e proporções de aspecto `16:9`/`9:16`.
Vídeo para vídeo não é registrado para o OpenRouter porque a API upstream
de geração de vídeo atualmente aceita texto e referências de imagem.

## Texto para fala

OpenRouter também pode ser usado como provedor de TTS por meio de seu endpoint
`/audio/speech` compatível com a OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Se `messages.tts.providers.openrouter.apiKey` for omitido, o TTS reutiliza
`models.providers.openrouter.apiKey` e depois `OPENROUTER_API_KEY`.

## Autenticação e cabeçalhos

OpenRouter usa um token Bearer com sua chave de API internamente.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os cabeçalhos documentados de atribuição de app do OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se você redirecionar o provedor OpenRouter para algum outro proxy ou URL base, o OpenClaw
**não** injeta esses cabeçalhos específicos do OpenRouter nem marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Response caching">
    O cache de respostas do OpenRouter é opcional. Habilite-o por modelo do OpenRouter com
    parâmetros de modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    O OpenClaw envia `X-OpenRouter-Cache: true` e, quando configurado,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` força uma atualização para
    a solicitação atual e armazena a resposta substituta. Aliases em snake_case
    (`response_cache`, `response_cache_ttl_seconds` e
    `response_cache_clear`) também são aceitos.

    Isso é separado do cache de prompt do provedor e dos marcadores
    Anthropic `cache_control` do OpenRouter. Ele é aplicado apenas em rotas
    `openrouter.ai` verificadas, não em URLs base de proxy personalizadas.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Em rotas verificadas do OpenRouter, refs de modelo Anthropic mantêm os
    marcadores Anthropic `cache_control` específicos do OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Em rotas verificadas do OpenRouter, refs de modelo Anthropic com raciocínio habilitado
    removem turnos finais de preenchimento prévio do assistente antes que a solicitação chegue ao OpenRouter,
    correspondendo à exigência da Anthropic de que conversas de raciocínio terminem com um
    turno do usuário.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Em rotas não `auto` compatíveis, o OpenClaw mapeia o nível de pensamento selecionado para
    payloads de raciocínio do proxy OpenRouter. Dicas de modelo não compatíveis e
    `openrouter/auto` ignoram essa injeção de raciocínio. Hunter Alpha também ignora
    o raciocínio de proxy para refs de modelo configuradas obsoletas porque o OpenRouter poderia
    retornar texto de resposta final em campos de raciocínio para essa rota descontinuada.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem `reasoning_content` ausente em
    turnos de assistente reproduzidos para que conversas com pensamento/ferramentas mantenham o formato
    de acompanhamento exigido pelo DeepSeek V4.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter ainda passa pelo caminho compatível com OpenAI no estilo proxy, então
    a modelagem de solicitação nativa apenas da OpenAI, como `serviceTier`, `store` de Responses,
    payloads compatíveis com raciocínio da OpenAI e dicas de cache de prompt, não é encaminhada.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Refs do OpenRouter respaldadas por Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de assinatura de pensamento Gemini lá, mas não habilita a validação nativa de reprodução
    Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Se você passar roteamento de provedor do OpenRouter em parâmetros de modelo, o OpenClaw o encaminha
    como metadados de roteamento do OpenRouter antes que os wrappers de stream compartilhados sejam executados.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
