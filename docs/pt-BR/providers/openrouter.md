---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para geração de música
    - Você quer usar o OpenRouter para geração de vídeo
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:28:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona ao trocar a URL base.

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Executar integração OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw abre o fluxo de login no navegador da OpenRouter, troca o código
        PKCE por uma chave de API da OpenRouter e armazena essa chave no perfil de autenticação
        padrão da OpenRouter. Em hosts remotos/headless, OpenClaw imprime a
        URL de login e pede que você cole a URL de redirecionamento depois de fazer login.
      </Step>
      <Step title="(Opcional) Mudar para um modelo específico">
        A integração usa `openrouter/auto` por padrão. Escolha um modelo concreto depois:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Chave de API">
    <Steps>
      <Step title="Obter sua chave de API">
        Crie uma chave de API em [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Executar integração com chave de API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcional) Mudar para um modelo específico">
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

## Referências de modelos

<Note>
Referências de modelo seguem o padrão `openrouter/<provider>/<model>`. Para a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Exemplos de fallback incluídos:

| Referência de modelo              | Observações                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Roteamento automático da OpenRouter |
| `openrouter/openrouter/fusion`    | Roteador Fusion da OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

## Geração de imagens

OpenRouter também pode dar suporte à ferramenta `image_generate`. Use um modelo de imagem da OpenRouter em `agents.defaults.imageGenerationModel`:

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

OpenClaw envia solicitações de imagem para a API de imagens de conclusões de chat da OpenRouter com `modalities: ["image", "text"]`. Modelos de imagem Gemini recebem dicas compatíveis de `aspectRatio` e `resolution` por meio de `image_config` da OpenRouter. Use `agents.defaults.imageGenerationModel.timeoutMs` para modelos de imagem mais lentos da OpenRouter; o parâmetro `timeoutMs` por chamada da ferramenta `image_generate` ainda prevalece.

## Geração de vídeo

OpenRouter também pode dar suporte à ferramenta `video_generate` por meio de sua API assíncrona `/videos`. Use um modelo de vídeo da OpenRouter em `agents.defaults.videoGenerationModel`:

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

OpenClaw envia tarefas de texto para vídeo e imagem para vídeo para a OpenRouter, consulta
o `polling_url` retornado e baixa o vídeo concluído a partir dos
`unsigned_urls` da OpenRouter ou do endpoint documentado de conteúdo da tarefa.
Imagens de referência são enviadas como imagens do primeiro/último quadro por padrão; imagens
marcadas com `reference_image` são enviadas como referências de entrada da OpenRouter. O
padrão incluído `google/veo-3.1-fast` anuncia as durações de 4/6/8
segundos atualmente compatíveis, resoluções `720P`/`1080P` e proporções
de aspecto `16:9`/`9:16`. Vídeo para vídeo não é registrado para a OpenRouter porque a API upstream
de geração de vídeo atualmente aceita referências de texto e imagem.

## Geração de música

OpenRouter também pode dar suporte à ferramenta `music_generate` por meio da saída
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
`google/lyria-3-clip-preview`. OpenClaw envia `modalities: ["text",
"audio"]`, habilita streaming, coleta os fragmentos de áudio transmitidos e salva
o resultado como mídia gerada para entrega em canais. Imagens de referência são
aceitas para modelos Lyria por meio do parâmetro compartilhado `music_generate image=...`.

## Texto para fala

OpenRouter também pode ser usado como provedor de TTS por meio do endpoint
compatível com OpenAI `/audio/speech`.

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
`models.providers.openrouter.apiKey`, depois `OPENROUTER_API_KEY`.

## Fala para texto (áudio de entrada)

O OpenRouter pode transcrever anexos de voz/áudio de entrada pelo caminho
compartilhado `tools.media.audio` usando seu endpoint de STT
(`/audio/transcriptions`). Isso se aplica a qualquer Plugin de canal que
encaminhe voz/áudio de entrada para o preflight de entendimento de mídia.

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
multipart do OpenAI.

## Roteador Fusion

Use o OpenRouter Fusion quando quiser que uma ref de modelo do OpenClaw consulte
vários modelos do OpenRouter em paralelo, que o OpenRouter julgue as respostas
deles e retorne uma única resposta final pelo endpoint normal do provedor
OpenRouter. Como o slug do modelo upstream é `openrouter/fusion`, a ref de modelo
do OpenClaw inclui tanto o prefixo de provedor do OpenClaw quanto o namespace
upstream do OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configure o painel e o juiz do Fusion por meio de `params.extraBody` do modelo.
Esses campos são encaminhados para o corpo da solicitação de chat-completions do
OpenRouter. O Fusion funciona com onboarding OAuth do OpenRouter ou onboarding
por chave de API; se você usar OAuth, omita a linha `env.OPENROUTER_API_KEY` do
exemplo abaixo.

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
do Plugin Fusion é o modelo juiz. Não defina `tool_choice` de nível superior como
`"required"` em turnos normais de agente/chat do OpenClaw para tentar forçar o
Fusion; os turnos do OpenClaw podem incluir definições de ferramentas do
OpenClaw, e uma escolha de ferramenta obrigatória em nível superior pode exigir
uma dessas ferramentas em vez do roteador Fusion. Quando essa configuração do
Plugin Fusion está presente, o OpenClaw também adiciona uma nota sanitizada ao
prompt do sistema com os modelos de análise configurados e o modelo juiz, para
que o agente possa responder a perguntas sobre seu painel Fusion atual. Outros
campos de `extraBody` não são copiados para o prompt.

O Fusion é mais lento por design. O OpenRouter pode enviar o mesmo prompt do
OpenClaw para vários modelos de análise e depois executar uma etapa final de
julgamento/síntese, portanto a latência geralmente é maior do que em uma
solicitação direta a um único modelo. Use o Fusion para respostas deliberadas e
de alta qualidade ou caminhos de escalonamento, não como padrão para chats
sensíveis à latência. Para respostas mais rápidas, mantenha o painel pequeno e
escolha modelos de análise e juiz mais rápidos.

Teste a ref configurada com uma chamada local de modelo de uso único:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticação e cabeçalhos

O OpenRouter usa um token Bearer com sua chave de API nos bastidores. O OAuth do
OpenRouter é um fluxo de login PKCE que emite uma chave de API do OpenRouter,
então o OpenClaw armazena o resultado como o mesmo perfil de autenticação por
chave de API `openrouter:default` usado pelo caminho de configuração manual por
chave de API.

Em uma instalação existente, faça login ou rotacione a chave armazenada do
OpenRouter sem executar novamente todo o onboarding:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Use `openclaw models auth login --provider openrouter --method api-key` quando
quiser colar uma chave criada manualmente no OpenRouter.

Em solicitações reais do OpenRouter (`https://openrouter.ai/api/v1`), o
OpenClaw também adiciona os cabeçalhos de atribuição de app documentados pelo
OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se você apontar novamente o provedor OpenRouter para outro proxy ou URL base, o
OpenClaw **não** injetará esses cabeçalhos específicos do OpenRouter nem
marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Response caching">
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

    Isso é separado do cache de prompt do provedor e dos marcadores
    `cache_control` da Anthropic no OpenRouter. Ele é aplicado somente em rotas
    `openrouter.ai` verificadas, não em URLs base de proxy personalizado.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Em rotas verificadas do OpenRouter, refs de modelo Anthropic mantêm os
    marcadores `cache_control` específicos da Anthropic no OpenRouter que o
    OpenClaw usa para melhor reutilização do cache de prompt em blocos de prompt
    de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Preenchimento prévio de raciocínio Anthropic">
    Em rotas OpenRouter verificadas, referências de modelo Anthropic com raciocínio habilitado
    descartam turnos finais de preenchimento prévio do assistente antes que a requisição chegue ao OpenRouter,
    correspondendo ao requisito da Anthropic de que conversas de raciocínio terminem com um turno
    do usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento / raciocínio">
    Em rotas compatíveis que não sejam `auto`, o OpenClaw mapeia o nível de pensamento selecionado para
    payloads de raciocínio do proxy OpenRouter. Dicas de modelo sem suporte e
    `openrouter/auto` ignoram essa injeção de raciocínio. Hunter Alpha também ignora
    raciocínio de proxy para referências de modelo configuradas obsoletas porque o OpenRouter poderia
    retornar texto de resposta final em campos de raciocínio para essa rota descontinuada.
  </Accordion>

  <Accordion title="Repetição de raciocínio do DeepSeek V4">
    Em rotas OpenRouter verificadas, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem `reasoning_content` ausente em
    turnos de assistente repetidos para que conversas de pensamento/ferramentas mantenham o formato de acompanhamento exigido pelo DeepSeek V4. O OpenClaw envia valores de
    `reasoning.effort` compatíveis com o OpenRouter para essas rotas; níveis menores que não sejam desligados são mapeados para
    `high`, e substituições obsoletas de `max` são mapeadas para `xhigh`.
  </Accordion>

  <Accordion title="Formatação de requisições somente OpenAI">
    O OpenRouter ainda passa pelo caminho compatível com OpenAI no estilo proxy, portanto
    formatações de requisição nativas somente OpenAI, como `serviceTier`, Responses `store`,
    payloads de compatibilidade de raciocínio OpenAI e dicas de cache de prompt não são encaminhadas.
  </Accordion>

  <Accordion title="Rotas baseadas em Gemini">
    Referências OpenRouter baseadas em Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de assinatura de pensamento do Gemini ali, mas não habilita a validação de repetição nativa do Gemini
    nem reescritas de bootstrap.
  </Accordion>

  <Accordion title="Metadados de roteamento de provedor">
    O OpenRouter aceita um objeto de requisição `provider` para roteamento do provedor
    subjacente. Configure uma política padrão para todas as requisições de modelo de texto do OpenRouter
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
    da requisição. Use os campos snake_case documentados pelo OpenRouter, incluindo `sort`,
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

    Isso se aplica somente em rotas de conclusões de chat do OpenRouter. Rotas diretas da Anthropic,
    Google, OpenAI ou de provedores personalizados ignoram os parâmetros de roteamento do OpenRouter.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
