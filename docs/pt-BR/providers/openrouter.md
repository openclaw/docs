---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos por meio do OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para geração de vídeos
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ela é compatível com OpenAI, portanto a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Mude para um modelo específico">
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

## Referências de modelo

<Note>
As refs de modelo seguem o padrão `openrouter/<provider>/<model>`. Para ver a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Ref de modelo                    | Observações                  |
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

OpenClaw envia solicitações de imagem para a API de imagens de chat completions do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas de `aspectRatio` e `resolution` compatíveis por meio de `image_config` do OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem do OpenRouter mais lentos; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda prevalece.

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

OpenClaw envia trabalhos de texto para vídeo e imagem para vídeo para o OpenRouter, faz polling
da `polling_url` retornada e baixa o vídeo concluído a partir de
`unsigned_urls` do OpenRouter ou do endpoint documentado de conteúdo do trabalho.
Imagens de referência são enviadas por padrão como imagens do primeiro/último quadro; imagens
marcadas com `reference_image` são enviadas como referências de entrada do OpenRouter. O padrão
incluído `google/veo-3.1-fast` anuncia as durações atualmente compatíveis de 4/6/8
segundos, resoluções `720P`/`1080P` e proporções de aspecto `16:9`/`9:16`.
Vídeo para vídeo não é registrado para o OpenRouter porque a API upstream de
geração de vídeo atualmente aceita texto e referências de imagem.

## Texto para fala

OpenRouter também pode ser usado como provedor de TTS por meio de seu endpoint
`/audio/speech` compatível com OpenAI.

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

Se `messages.tts.providers.openrouter.apiKey` for omitido, TTS reutiliza
`models.providers.openrouter.apiKey` e depois `OPENROUTER_API_KEY`.

## Autenticação e cabeçalhos

OpenRouter usa um token Bearer com sua chave de API por baixo dos panos.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw também adiciona
os cabeçalhos documentados de atribuição de app do OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se você redirecionar o provedor OpenRouter para algum outro proxy ou URL base, OpenClaw
**não** injetará esses cabeçalhos específicos do OpenRouter nem marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Cache de respostas">
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

    OpenClaw envia `X-OpenRouter-Cache: true` e, quando configurado,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` força uma atualização para
    a solicitação atual e armazena a resposta substituta. Aliases em snake_case
    (`response_cache`, `response_cache_ttl_seconds` e
    `response_cache_clear`) também são aceitos.

    Isso é separado do cache de prompt do provedor e dos marcadores
    Anthropic `cache_control` do OpenRouter. Ele só é aplicado em rotas
    `openrouter.ai` verificadas, não em URLs base de proxy personalizadas.

  </Accordion>

  <Accordion title="Marcadores de cache Anthropic">
    Em rotas verificadas do OpenRouter, refs de modelo Anthropic mantêm os
    marcadores Anthropic `cache_control` específicos do OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Pré-preenchimento de raciocínio Anthropic">
    Em rotas verificadas do OpenRouter, refs de modelo Anthropic com raciocínio habilitado
    removem turnos finais de pré-preenchimento do assistente antes que a solicitação chegue ao OpenRouter,
    correspondendo ao requisito da Anthropic de que conversas com raciocínio terminem com um turno
    de usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento / raciocínio">
    Em rotas não `auto` compatíveis, OpenClaw mapeia o nível de pensamento selecionado para
    payloads de raciocínio de proxy do OpenRouter. Dicas de modelo não compatíveis e
    `openrouter/auto` ignoram essa injeção de raciocínio. Hunter Alpha também ignora
    raciocínio de proxy para refs de modelo configuradas obsoletas porque o OpenRouter poderia
    retornar texto de resposta final em campos de raciocínio para essa rota aposentada.
  </Accordion>

  <Accordion title="Replay de raciocínio DeepSeek V4">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem `reasoning_content` ausente em
    turnos de assistente reproduzidos para que conversas de pensamento/ferramenta mantenham o
    formato de acompanhamento exigido pelo DeepSeek V4. OpenClaw envia valores de
    `reasoning_effort` compatíveis com o OpenRouter para essas rotas; `xhigh` é o nível mais alto anunciado,
    e substituições `max` obsoletas são mapeadas para `xhigh`.
  </Accordion>

  <Accordion title="Formatação de solicitação apenas para OpenAI">
    OpenRouter ainda passa pelo caminho em estilo proxy compatível com OpenAI, portanto
    formatações de solicitação nativas apenas da OpenAI, como `serviceTier`, Responses `store`,
    payloads de compatibilidade com raciocínio da OpenAI e dicas de cache de prompt não são encaminhadas.
  </Accordion>

  <Accordion title="Rotas com backend Gemini">
    Refs do OpenRouter com backend Gemini permanecem no caminho proxy-Gemini: OpenClaw mantém
    a higienização de assinatura de pensamento do Gemini ali, mas não habilita a validação de replay
    nativa do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provedor">
    Se você passar roteamento de provedor do OpenRouter nos parâmetros de modelo, OpenClaw o encaminha
    como metadados de roteamento do OpenRouter antes que os wrappers de stream compartilhados sejam executados.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
