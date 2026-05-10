---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para geração de vídeo
summary: Use a API unificada da OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

O OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ele é compatível com a OpenAI, então a maioria dos SDKs da OpenAI funciona alterando a URL base.

## Introdução

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
    O onboarding usa `openrouter/auto` como padrão. Escolha um modelo concreto depois:

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
As refs de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Ref de modelo                    | Observações                         |
| --------------------------------- | ----------------------------------- |
| `openrouter/auto`                 | Roteamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI            |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI            |

## Geração de imagens

O OpenRouter também pode dar suporte à ferramenta `image_generate`. Use um modelo de imagem do OpenRouter em `agents.defaults.imageGenerationModel`:

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

O OpenClaw envia solicitações de imagem para a API de imagens de conclusões de chat do OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas compatíveis de `aspectRatio` e `resolution` por meio de `image_config` do OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem do OpenRouter mais lentos; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda prevalece.

## Geração de vídeos

O OpenRouter também pode dar suporte à ferramenta `video_generate` por meio de sua API assíncrona `/videos`. Use um modelo de vídeo do OpenRouter em `agents.defaults.videoGenerationModel`:

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

O OpenClaw envia tarefas de texto para vídeo e imagem para vídeo ao OpenRouter, consulta
a `polling_url` retornada e baixa o vídeo concluído de
`unsigned_urls` do OpenRouter ou do endpoint de conteúdo de tarefa documentado.
Imagens de referência são enviadas como imagens de primeiro/último quadro por padrão; imagens
marcadas com `reference_image` são enviadas como referências de entrada do OpenRouter. O
padrão incluído `google/veo-3.1-fast` anuncia as durações de 4/6/8 segundos
atualmente compatíveis, resoluções `720P`/`1080P` e proporções
`16:9`/`9:16`. Vídeo para vídeo não é registrado para o OpenRouter porque a API upstream
de geração de vídeos atualmente aceita texto e referências de imagem.

## Conversão de texto em fala

O OpenRouter também pode ser usado como provedor de TTS por meio de seu endpoint
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

O OpenRouter usa internamente um token Bearer com sua chave de API.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também adiciona
os cabeçalhos documentados de atribuição de aplicativo do OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se você redirecionar o provedor OpenRouter para outro proxy ou URL base, o OpenClaw
**não** injeta esses cabeçalhos específicos do OpenRouter nem marcadores de cache da Anthropic.
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

    O OpenClaw envia `X-OpenRouter-Cache: true` e, quando configurado,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` força uma atualização para
    a solicitação atual e armazena a resposta substituta. Aliases em snake_case
    (`response_cache`, `response_cache_ttl_seconds` e
    `response_cache_clear`) também são aceitos.

    Isso é separado do cache de prompt do provedor e dos marcadores
    `cache_control` da Anthropic do OpenRouter. Ele só é aplicado em rotas
    `openrouter.ai` verificadas, não em URLs base de proxy personalizadas.

  </Accordion>

  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas verificadas do OpenRouter, refs de modelo da Anthropic mantêm os
    marcadores `cache_control` da Anthropic específicos do OpenRouter que o OpenClaw usa para
    melhor reutilização do cache de prompt em blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Preenchimento prévio de raciocínio da Anthropic">
    Em rotas verificadas do OpenRouter, refs de modelo da Anthropic com raciocínio habilitado
    removem turnos finais de preenchimento prévio do assistente antes de a solicitação chegar ao OpenRouter,
    correspondendo ao requisito da Anthropic de que conversas de raciocínio terminem com um turno
    de usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento / raciocínio">
    Em rotas não `auto` compatíveis, o OpenClaw mapeia o nível de pensamento selecionado para
    payloads de raciocínio de proxy do OpenRouter. Dicas de modelo incompatíveis e
    `openrouter/auto` ignoram essa injeção de raciocínio. O Hunter Alpha também ignora
    raciocínio de proxy para refs de modelo configuradas obsoletas porque o OpenRouter poderia
    retornar texto de resposta final em campos de raciocínio para essa rota desativada.
  </Accordion>

  <Accordion title="Repetição de raciocínio do DeepSeek V4">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem `reasoning_content` ausente em
    turnos de assistente repetidos para que conversas de pensamento/ferramenta mantenham o formato
    de acompanhamento exigido pelo DeepSeek V4. O OpenClaw envia valores
    `reasoning_effort` compatíveis com o OpenRouter para essas rotas; `xhigh` é o nível mais alto anunciado,
    e substituições `max` obsoletas são mapeadas para `xhigh`.
  </Accordion>

  <Accordion title="Formatação de solicitação apenas da OpenAI">
    O OpenRouter ainda passa pelo caminho compatível com a OpenAI em estilo de proxy, portanto
    formatações de solicitação nativas apenas da OpenAI, como `serviceTier`, Responses `store`,
    payloads de compatibilidade de raciocínio da OpenAI e dicas de cache de prompt não são encaminhadas.
  </Accordion>

  <Accordion title="Rotas baseadas no Gemini">
    Refs do OpenRouter baseadas no Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de assinatura de pensamento do Gemini ali, mas não habilita validação de repetição
    nativa do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento do provedor">
    Se você passar roteamento de provedor do OpenRouter em parâmetros de modelo, o OpenClaw encaminha
    isso como metadados de roteamento do OpenRouter antes da execução dos wrappers de stream compartilhados.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
