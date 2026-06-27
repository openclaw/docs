---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar OpenRouter para geração de música
    - Você quer usar o OpenRouter para geração de vídeo
summary: Use a API unificada da OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:05:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

A OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ela é compatível com a OpenAI, então a maioria dos SDKs da OpenAI funciona alterando a URL base.

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Executar integração OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        O OpenClaw abre o fluxo de login no navegador da OpenRouter, troca o código
        PKCE por uma chave de API da OpenRouter e armazena essa chave no perfil de
        autenticação padrão da OpenRouter. Em hosts remotos/sem interface gráfica, o OpenClaw imprime a
        URL de login e pede que você cole a URL de redirecionamento depois de entrar.
      </Step>
      <Step title="(Opcional) Alternar para um modelo específico">
        A integração usa `openrouter/auto` por padrão. Escolha um modelo concreto depois:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Chave de API">
    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie uma chave de API em [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Executar integração com chave de API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcional) Alternar para um modelo específico">
        A integração usa `openrouter/auto` por padrão. Escolha um modelo concreto depois:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

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
As referências de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Referência de modelo              | Observações                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Roteamento automático da OpenRouter |
| `openrouter/openrouter/fusion`    | Roteador OpenRouter Fusion   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

## Geração de imagens

A OpenRouter também pode oferecer suporte à ferramenta `image_generate`. Use um modelo de imagem da OpenRouter em `agents.defaults.imageGenerationModel`:

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

O OpenClaw envia solicitações de imagem para a API de imagem de conclusões de chat da OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas compatíveis de `aspectRatio` e `resolution` por meio de `image_config` da OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem da OpenRouter mais lentos; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda prevalece.

## Geração de vídeo

A OpenRouter também pode oferecer suporte à ferramenta `video_generate` por meio de sua API assíncrona `/videos`. Use um modelo de vídeo da OpenRouter em `agents.defaults.videoGenerationModel`:

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

O OpenClaw envia trabalhos de texto para vídeo e imagem para vídeo para a OpenRouter, consulta
a `polling_url` retornada e baixa o vídeo concluído a partir dos
`unsigned_urls` da OpenRouter ou do endpoint de conteúdo de trabalho documentado.
Imagens de referência são enviadas como imagens do primeiro/último quadro por padrão; imagens
marcadas com `reference_image` são enviadas como referências de entrada da OpenRouter. O padrão
incluído `google/veo-3.1-fast` anuncia as durações de 4/6/8
segundos compatíveis no momento, resoluções `720P`/`1080P` e proporções
`16:9`/`9:16`. Vídeo para vídeo não é registrado para a OpenRouter porque a API upstream
de geração de vídeo atualmente aceita referências de texto e imagem.

## Geração de música

A OpenRouter também pode oferecer suporte à ferramenta `music_generate` por meio de saída
de áudio de conclusões de chat. Use um modelo de áudio da OpenRouter em
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

O provedor de música OpenRouter incluído usa
`google/lyria-3-pro-preview` por padrão e também expõe
`google/lyria-3-clip-preview`. O OpenClaw envia `modalities: ["text",
"audio"]`, ativa streaming, coleta os blocos de áudio transmitidos e salva
o resultado como mídia gerada para entrega no canal. Imagens de referência são
aceitas para modelos Lyria por meio do parâmetro compartilhado `music_generate image=...`.

## Texto para fala

A OpenRouter também pode ser usada como provedor de TTS por meio de seu endpoint
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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Se `messages.tts.providers.openrouter.apiKey` for omitido, o TTS reutiliza
`models.providers.openrouter.apiKey` e depois `OPENROUTER_API_KEY`.

## Fala para texto (áudio de entrada)

O OpenRouter pode transcrever anexos de voz/áudio de entrada pelo caminho
compartilhado `tools.media.audio` usando seu endpoint de STT
(`/audio/transcriptions`). Isso se aplica a qualquer channel plugin que encaminhe
voz/áudio de entrada para a pré-verificação de entendimento de mídia.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

O OpenClaw envia solicitações de STT do OpenRouter como JSON com áudio em base64
em `input_audio` (contrato de STT do OpenRouter), não como uploads de formulário
OpenAI multipart.

## Roteador Fusion

Use o OpenRouter Fusion quando quiser que uma referência de modelo do OpenClaw
pergunte a vários modelos do OpenRouter em paralelo, faça o OpenRouter julgar as
respostas e retorne uma única resposta final pelo endpoint normal do provedor
OpenRouter. Como o slug do modelo upstream é `openrouter/fusion`, a referência
de modelo do OpenClaw inclui tanto o prefixo do provedor OpenClaw quanto o
namespace upstream do OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configure o painel e o juiz do Fusion por meio de `params.extraBody` do modelo.
Esses campos são encaminhados para o corpo da solicitação de chat-completions do
OpenRouter. O Fusion funciona tanto com onboarding via OAuth do OpenRouter quanto
com onboarding por chave de API; se você usar OAuth, omita a linha
`env.OPENROUTER_API_KEY` do exemplo abaixo.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

A lista `analysis_models` é o painel paralelo, e `model` dentro da configuração
do plugin Fusion é o modelo juiz. Não defina `tool_choice` de nível superior como
`"required"` em turnos normais de agente/chat do OpenClaw para tentar forçar o
Fusion; os turnos do OpenClaw podem incluir definições de ferramentas do
OpenClaw, e uma escolha obrigatória de ferramenta no nível superior pode exigir
uma dessas ferramentas em vez do roteador Fusion. Quando essa configuração do
plugin Fusion está presente, o OpenClaw também adiciona uma nota sanitizada ao
prompt do sistema com os modelos de análise e o modelo juiz configurados, para
que o agente possa responder a perguntas sobre seu painel Fusion atual. Outros
campos de `extraBody` não são copiados para o prompt.

O Fusion é mais lento por design. O OpenRouter pode enviar o mesmo prompt do
OpenClaw a vários modelos de análise e depois executar uma etapa final de
julgamento/síntese, portanto a latência costuma ser maior do que em uma
solicitação direta a um único modelo. Use o Fusion para respostas deliberadas e
de alta qualidade ou caminhos de escalonamento, não como padrão para chats
sensíveis à latência. Para respostas mais rápidas, mantenha o painel pequeno e
escolha modelos de análise e juiz mais rápidos.

Teste a referência configurada com uma chamada local avulsa ao modelo:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticação e cabeçalhos

O OpenRouter usa internamente um token Bearer com sua chave de API. O OAuth do
OpenRouter é um fluxo de login PKCE que emite uma chave de API do OpenRouter, de
modo que o OpenClaw armazena o resultado como o mesmo perfil de autenticação por
chave de API `openrouter:default` usado pelo caminho de configuração manual por
chave de API.

Para uma instalação existente, faça login ou rotacione a chave armazenada do
OpenRouter sem executar novamente o onboarding completo:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Use `openclaw models auth login --provider openrouter --method api-key` quando
quiser colar uma chave criada manualmente no OpenRouter.

Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw
também adiciona os cabeçalhos documentados de atribuição de aplicativo do
OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se você redirecionar o provedor OpenRouter para outro proxy ou URL base, o
OpenClaw **não** injetará esses cabeçalhos específicos do OpenRouter nem os
marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Cache de respostas">
    O cache de respostas do OpenRouter é opcional. Habilite-o por modelo
    OpenRouter com parâmetros de modelo:

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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` força uma atualização
    para a solicitação atual e armazena a resposta substituta. Aliases em
    snake_case (`response_cache`, `response_cache_ttl_seconds` e
    `response_cache_clear`) também são aceitos.

    Isso é separado do cache de prompts do provedor e dos marcadores
    `cache_control` da Anthropic no OpenRouter. Ele só é aplicado em rotas
    `openrouter.ai` verificadas, não em URLs base de proxy personalizadas.

  </Accordion>

  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas verificadas do OpenRouter, referências de modelo da Anthropic
    mantêm os marcadores `cache_control` específicos do OpenRouter para a
    Anthropic que o OpenClaw usa para melhor reutilização do cache de prompts em
    blocos de prompt de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Prefill de raciocínio da Anthropic">
    Em rotas verificadas do OpenRouter, referências de modelo da Anthropic com raciocínio habilitado
    removem turnos finais de prefill do assistente antes que a solicitação chegue ao OpenRouter,
    correspondendo ao requisito da Anthropic de que conversas com raciocínio terminem com um turno
    do usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento / raciocínio">
    Em rotas compatíveis que não sejam `auto`, o OpenClaw mapeia o nível de pensamento selecionado para
    payloads de raciocínio de proxy do OpenRouter. Dicas de modelo incompatíveis e
    `openrouter/auto` ignoram essa injeção de raciocínio. O Hunter Alpha também ignora
    o raciocínio de proxy para referências de modelo configuradas obsoletas, porque o OpenRouter poderia
    retornar texto da resposta final em campos de raciocínio para essa rota descontinuada.
  </Accordion>

  <Accordion title="Reprodução de raciocínio do DeepSeek V4">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem `reasoning_content` ausente em
    turnos do assistente reproduzidos para que conversas de pensamento/ferramentas mantenham o
    formato de acompanhamento exigido pelo DeepSeek V4. O OpenClaw envia valores de
    `reasoning_effort` compatíveis com o OpenRouter para essas rotas; `xhigh` é o nível
    mais alto anunciado, e substituições obsoletas de `max` são mapeadas para `xhigh`.
  </Accordion>

  <Accordion title="Formatação de solicitação exclusiva do OpenAI">
    O OpenRouter ainda passa pelo caminho compatível com OpenAI em estilo proxy, portanto
    a formatação de solicitação nativa exclusiva do OpenAI, como `serviceTier`, `store` do Responses,
    payloads de compatibilidade de raciocínio do OpenAI e dicas de cache de prompt não é encaminhada.
  </Accordion>

  <Accordion title="Rotas baseadas no Gemini">
    Referências do OpenRouter baseadas no Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de assinatura de pensamento do Gemini ali, mas não habilita a validação nativa de
    reprodução do Gemini nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provedor">
    O OpenRouter oferece suporte a um objeto de solicitação `provider` para roteamento do provedor
    subjacente. Configure uma política padrão para todas as solicitações de modelo de texto do OpenRouter
    com `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    O OpenClaw encaminha esse objeto ao OpenRouter como o payload `provider`
    da solicitação. Use os campos snake_case documentados do OpenRouter, incluindo `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` e `enforce_distillable_text`.

    Parâmetros por modelo ainda substituem o objeto de roteamento de todo o provedor:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Isso se aplica apenas às rotas de chat-completions do OpenRouter. Rotas diretas da Anthropic,
    Google, OpenAI ou de provedor personalizado ignoram parâmetros de roteamento do OpenRouter.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
