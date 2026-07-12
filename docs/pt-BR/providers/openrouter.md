---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para gerar músicas
    - Você quer usar o OpenRouter para geração de vídeos
summary: Use a API unificada do OpenRouter para acessar diversos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T00:19:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

O OpenRouter encaminha solicitações para muitos modelos por meio de uma única API e uma única chave. Ele é
compatível com a OpenAI, portanto, o OpenClaw se comunica com ele pelo mesmo
transporte no estilo `openai-completions` usado para outros provedores de proxy.

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Execute a integração inicial com OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        O OpenClaw abre o fluxo de login do OpenRouter no navegador (PKCE), troca o
        código por uma chave de API do OpenRouter e a armazena no perfil de
        autenticação padrão do OpenRouter. Em hosts remotos ou sem interface gráfica, o OpenClaw exibe a
        URL de login e solicita que você cole a URL de redirecionamento após entrar.
      </Step>
      <Step title="(Opcional) Mude para um modelo específico">
        A integração inicial usa `openrouter/auto` por padrão. Escolha um modelo específico posteriormente:

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
      <Step title="Execute a integração inicial com chave de API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcional) Mude para um modelo específico">
        A integração inicial usa `openrouter/auto` por padrão. Escolha um modelo específico posteriormente:

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
As referências de modelos seguem o padrão `openrouter/<provider>/<model>`. Para ver a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Modelos alternativos incluídos, usados quando a descoberta do catálogo em tempo real não está disponível:

| Referência do modelo              | Observações                          |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | Encaminhamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 por meio da MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 por meio da MoonshotAI     |

Qualquer outra referência `openrouter/<provider>/<model>`, incluindo
`openrouter/openrouter/fusion` (consulte [Roteador Fusion](#fusion-router)), é resolvida
dinamicamente com base no catálogo de modelos em tempo real do OpenRouter.

## Geração de imagens

O OpenRouter pode fornecer a infraestrutura para a ferramenta `image_generate`. Defina um modelo de imagem do OpenRouter
em `agents.defaults.imageGenerationModel`:

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

O OpenClaw envia solicitações de imagem para a API de imagens de conclusões de chat do OpenRouter com
`modalities: ["image", "text"]`. Os modelos de imagem Gemini também recebem
indicações de `aspectRatio` e `resolution` por meio de `image_config` do OpenRouter; outros
modelos de imagem não as recebem. Use `agents.defaults.imageGenerationModel.timeoutMs` para
modelos mais lentos; o `timeoutMs` de cada chamada da ferramenta `image_generate` ainda tem precedência.

## Geração de vídeos

O OpenRouter pode fornecer a infraestrutura para a ferramenta `video_generate` por meio de sua API assíncrona
`/videos`. Defina um modelo de vídeo do OpenRouter em
`agents.defaults.videoGenerationModel`:

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

O OpenClaw envia tarefas de texto para vídeo e de imagem para vídeo, consulta periodicamente a
`polling_url` retornada e baixa o vídeo concluído das
`unsigned_urls` do OpenRouter ou do endpoint de conteúdo da tarefa. As imagens de referência usam por padrão
imagens do primeiro/último quadro; imagens marcadas com `reference_image` são enviadas como
referências de entrada. O padrão incluído `google/veo-3.1-fast` oferece suporte a durações de 4/6/8
segundos, resoluções `720P`/`1080P` e proporções `16:9`/`9:16`.
Não há suporte para vídeo para vídeo: a API upstream aceita apenas referências de texto e imagem.

## Geração de música

O OpenRouter pode fornecer a infraestrutura para a ferramenta `music_generate` por meio da saída de áudio de
conclusões de chat. Defina um modelo de áudio do OpenRouter em
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

O provedor de música do OpenRouter incluído usa `google/lyria-3-pro-preview`
por padrão e também disponibiliza `google/lyria-3-clip-preview`. O OpenClaw envia `modalities:
["text", "audio"]`, transmite a resposta, coleta os fragmentos de áudio e salva
o resultado como mídia gerada para entrega pelo canal. Os modelos Lyria aceitam uma
imagem de referência por meio do parâmetro compartilhado `music_generate image=...`.
O áudio transmitido, a retenção da transcrição e o envelope de eventos SSE derivado são
limitados por `agents.defaults.mediaMaxMb` (o limite padrão de áudio é 16 MB).

## Conversão de texto em fala

O OpenRouter pode atuar como provedor de TTS por meio de seu endpoint
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

Se `messages.tts.providers.openrouter.apiKey` for omitido, o TTS recorre a
`models.providers.openrouter.apiKey` e, em seguida, a `OPENROUTER_API_KEY`.

## Conversão de fala em texto (áudio recebido)

O OpenRouter pode transcrever anexos de voz/áudio recebidos por meio do caminho compartilhado
`tools.media.audio`, usando seu endpoint de STT (`/audio/transcriptions`).
Isso se aplica a qualquer Plugin de canal que encaminhe voz/áudio recebido para a
pré-verificação de compreensão de mídia.

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

O OpenClaw envia solicitações de STT ao OpenRouter como JSON, com o áudio em base64 em
`input_audio` (o contrato de STT do OpenRouter), e não como envios de formulário multipart
da OpenAI.

## Roteador Fusion

O OpenRouter Fusion envia uma referência de modelo do OpenClaw para vários modelos do OpenRouter em
paralelo, faz com que o OpenRouter avalie as respostas e retorna uma resposta final
por meio do endpoint normal do OpenRouter. O identificador do modelo upstream é
`openrouter/fusion`, portanto, a referência de modelo do OpenClaw inclui tanto o prefixo do
provedor do OpenClaw quanto o namespace upstream do OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configure o painel e o avaliador do Fusion por meio de `params.extraBody` do modelo;
esses campos são encaminhados diretamente para o corpo da solicitação de conclusões de chat do OpenRouter.
O Fusion funciona com a integração inicial por OAuth ou por chave de API; se você usar OAuth,
omita a linha `env.OPENROUTER_API_KEY` abaixo.

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

`analysis_models` é o painel paralelo; `model`, dentro da configuração do Plugin Fusion,
é o modelo avaliador. Não defina `tool_choice` no nível superior como `"required"`
em interações normais de agente/chat para tentar forçar o Fusion: as interações do OpenClaw podem incluir
suas próprias definições de ferramentas, e uma escolha obrigatória de ferramenta no nível superior pode selecionar uma
delas em vez do roteador Fusion. Quando essa configuração do Plugin Fusion está presente,
o OpenClaw adiciona uma observação higienizada ao prompt de sistema que lista os modelos de análise
e o modelo avaliador configurados, para que o agente possa responder a perguntas sobre seu próprio painel
Fusion. Outros campos de `extraBody` não são copiados para o prompt.

O Fusion é mais lento por definição: o OpenRouter distribui o prompt para vários
modelos de análise e depois executa uma etapa de avaliação/síntese, portanto, a latência é maior do que
em uma solicitação direta a um único modelo. Use-o para respostas deliberadas e de alta qualidade ou
caminhos de escalonamento, não como padrão sensível à latência. Mantenha o painel pequeno e
escolha modelos de análise/avaliação mais rápidos para obter respostas mais rápidas.

Teste uma referência configurada com uma chamada local única:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Autenticação e cabeçalhos

O OpenRouter usa um token Bearer proveniente da sua chave de API. O OAuth do OpenRouter é um fluxo de
login PKCE que emite uma chave de API do OpenRouter, portanto, o OpenClaw armazena o resultado no
mesmo perfil de autenticação por chave de API `openrouter:default` usado pela configuração manual
com chave de API.

Para entrar ou trocar a chave armazenada em uma instalação existente sem executar novamente
toda a integração inicial:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Em solicitações verificadas ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw adiciona
os cabeçalhos documentados de atribuição do aplicativo do OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Se você redirecionar o provedor OpenRouter para outro proxy ou URL base, o OpenClaw
**não** injetará esses cabeçalhos específicos do OpenRouter nem os marcadores de cache da Anthropic.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Cache de respostas">
    O cache de respostas do OpenRouter é opcional. Ative-o para cada modelo:

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
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`) são aceitos, assim como `responseCacheTtl` /
    `response_cache_ttl` sem o sufixo `Seconds`.

    Isso é separado do cache de prompts do provedor e dos marcadores
    `cache_control` da Anthropic no OpenRouter. Aplica-se apenas a rotas verificadas
    de `openrouter.ai`, não a URLs base de proxies personalizados.

  </Accordion>

  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas verificadas do OpenRouter, as referências de modelos Anthropic mantêm os
    marcadores `cache_control` da Anthropic no OpenRouter para melhorar a reutilização do cache de prompts em
    blocos de prompts de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Preenchimento prévio de raciocínio da Anthropic">
    Em rotas verificadas do OpenRouter, as referências de modelos da Anthropic com raciocínio habilitado
    removem os turnos finais de preenchimento prévio do assistente antes que a solicitação chegue ao
    OpenRouter, atendendo ao requisito da Anthropic de que conversas de raciocínio
    terminem com um turno do usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento/raciocínio">
    Em rotas compatíveis que não sejam `auto`, o OpenClaw mapeia o nível de pensamento selecionado
    para cargas de raciocínio do proxy do OpenRouter. `openrouter/auto` e indicações de
    modelos incompatíveis ignoram essa injeção. Referências obsoletas de `openrouter/hunter-alpha` também
    a ignoram, pois o OpenRouter poderia retornar o texto da resposta final nos campos de raciocínio
    dessa rota descontinuada.
  </Accordion>

  <Accordion title="Reprodução de raciocínio do DeepSeek V4">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem o `reasoning_content` ausente em
    turnos reproduzidos do assistente, mantendo as conversas de pensamento/ferramentas no formato de
    acompanhamento exigido pelo DeepSeek V4. O OpenClaw envia valores de
    `reasoning.effort` compatíveis com o OpenRouter para essas rotas: `xhigh`/`max` são mapeados para `xhigh`,
    e todos os outros níveis que não sejam desativados são mapeados para `high`.
  </Accordion>

  <Accordion title="Formatação de solicitações exclusiva da OpenAI">
    O OpenRouter opera pelo caminho compatível com a OpenAI no estilo proxy, portanto a
    formatação nativa de solicitações exclusiva da OpenAI, como `serviceTier`, `store` da Responses,
    cargas de compatibilidade de raciocínio da OpenAI e indicações de cache de prompts, não é encaminhada.
  </Accordion>

  <Accordion title="Rotas baseadas no Gemini">
    As referências do OpenRouter baseadas no Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a sanitização de assinaturas de pensamento do Gemini nesse caminho, mas não habilita a validação
    nativa de reprodução do Gemini nem reescritas de inicialização.
  </Accordion>

  <Accordion title="Metadados de roteamento de provedores">
    O OpenRouter é compatível com um objeto de solicitação `provider` para o roteamento do provedor
    subjacente. Configure uma política padrão para todas as solicitações de modelos de texto do OpenRouter
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

    O OpenClaw encaminha esse objeto ao OpenRouter como a carga `provider`
    da solicitação. Use os campos em snake_case documentados pelo OpenRouter, incluindo `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` e `enforce_distillable_text`.

    Os parâmetros específicos de cada modelo substituem o objeto de roteamento de todo o provedor:

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

    Isso se aplica apenas às rotas de conclusões de chat do OpenRouter. Rotas diretas da Anthropic,
    Google, OpenAI ou de provedores personalizados ignoram os parâmetros de roteamento do OpenRouter.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
