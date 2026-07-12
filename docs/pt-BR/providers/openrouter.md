---
read_when:
    - Você quer uma única chave de API para vários LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
    - Você quer usar o OpenRouter para geração de imagens
    - Você quer usar o OpenRouter para geração de música
    - Você quer usar o OpenRouter para geração de vídeos
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T15:32:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

O OpenRouter encaminha solicitações para vários modelos por meio de uma única API e uma única chave. Ele é
compatível com a OpenAI, portanto o OpenClaw se comunica com ele pelo mesmo transporte
no estilo `openai-completions` usado para outros provedores de proxy.

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Execute a configuração inicial do OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        O OpenClaw abre o fluxo de login do OpenRouter no navegador (PKCE), troca o
        código por uma chave de API do OpenRouter e a armazena no perfil de
        autenticação padrão do OpenRouter. Em hosts remotos/sem interface gráfica, o OpenClaw exibe a
        URL de login e solicita que você cole a URL de redirecionamento após entrar.
      </Step>
      <Step title="(Opcional) Mude para um modelo específico">
        A configuração inicial usa `openrouter/auto` por padrão. Escolha um modelo específico depois:

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
      <Step title="Execute a configuração inicial com chave de API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcional) Mude para um modelo específico">
        A configuração inicial usa `openrouter/auto` por padrão. Escolha um modelo específico depois:

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
As referências de modelos seguem o padrão `openrouter/<provider>/<model>`. Para consultar a lista completa de
provedores e modelos disponíveis, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
</Note>

Modelos de contingência incluídos, usados quando a descoberta do catálogo em tempo real não está disponível:

| Referência do modelo              | Observações                         |
| --------------------------------- | ----------------------------------- |
| `openrouter/auto`                 | Roteamento automático do OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI            |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI            |

Qualquer outra referência `openrouter/<provider>/<model>`, incluindo
`openrouter/openrouter/fusion` (consulte [Roteador Fusion](#fusion-router)), é resolvida
dinamicamente com base no catálogo de modelos em tempo real do OpenRouter.

## Geração de imagens

O OpenRouter pode fornecer o backend para a ferramenta `image_generate`. Defina um modelo de imagem do OpenRouter
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

O OpenClaw envia solicitações de imagem à API de imagens de conclusões de chat do OpenRouter com
`modalities: ["image", "text"]`. Os modelos de imagem Gemini também recebem
dicas de `aspectRatio` e `resolution` por meio de `image_config` do OpenRouter; outros
modelos de imagem não recebem. Use `agents.defaults.imageGenerationModel.timeoutMs` para
modelos mais lentos; o `timeoutMs` por chamada da ferramenta `image_generate` ainda tem precedência.

## Geração de vídeos

O OpenRouter pode fornecer o backend para a ferramenta `video_generate` por meio de sua API assíncrona
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

O OpenClaw envia trabalhos de texto para vídeo e de imagem para vídeo, consulta periodicamente a
`polling_url` retornada e baixa o vídeo concluído a partir de
`unsigned_urls` do OpenRouter ou do endpoint de conteúdo do trabalho. Por padrão, as imagens de referência são
imagens do primeiro/último quadro; imagens marcadas com `reference_image` são enviadas como referências de
entrada. O modelo padrão incluído `google/veo-3.1-fast` aceita durações de 4/6/8
segundos, resoluções `720P`/`1080P` e proporções de tela `16:9`/`9:16`.
Vídeo para vídeo não é compatível: a API upstream aceita apenas texto e referências de
imagem.

## Geração de música

O OpenRouter pode fornecer o backend para a ferramenta `music_generate` por meio da saída de áudio de
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

O provedor de música OpenRouter incluído usa `google/lyria-3-pro-preview`
por padrão e também disponibiliza `google/lyria-3-clip-preview`. O OpenClaw envia `modalities:
["text", "audio"]`, transmite a resposta, coleta os fragmentos de áudio e salva
o resultado como mídia gerada para entrega pelo canal. Os modelos Lyria aceitam uma
imagem de referência por meio do parâmetro compartilhado `music_generate image=...`.
O áudio transmitido, a retenção da transcrição e o envelope de evento SSE derivado são
limitados por `agents.defaults.mediaMaxMb` (o limite padrão de áudio é 16 MB).

## Conversão de texto em fala

O OpenRouter pode atuar como um provedor de TTS por meio de seu endpoint
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

Se `messages.tts.providers.openrouter.apiKey` for omitido, o TTS recorrerá a
`models.providers.openrouter.apiKey` e, em seguida, a `OPENROUTER_API_KEY`.

## Conversão de fala em texto (áudio recebido)

O OpenRouter pode transcrever anexos de voz/áudio recebidos por meio do caminho
compartilhado `tools.media.audio`, usando seu endpoint de STT (`/audio/transcriptions`).
Isso se aplica a qualquer plugin de canal que encaminhe voz/áudio recebido para
a verificação preliminar de compreensão de mídia.

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

O OpenClaw envia solicitações de STT ao OpenRouter como JSON, com o áudio em
base64 no campo `input_audio` (o contrato de STT do OpenRouter), e não como
uploads de formulário multipart compatíveis com OpenAI.

## Roteador Fusion

O OpenRouter Fusion envia uma referência de modelo do OpenClaw para vários
modelos do OpenRouter em paralelo, faz o OpenRouter julgar as respostas e
retorna uma resposta final pelo endpoint normal do OpenRouter. O slug do modelo
upstream é `openrouter/fusion`, portanto a referência de modelo do OpenClaw
contém tanto o prefixo de provedor do OpenClaw quanto o namespace upstream do
OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configure o painel e o modelo julgador do Fusion por meio de `params.extraBody`
do modelo; esses campos são encaminhados diretamente para o corpo da solicitação
de conclusões de chat do OpenRouter. O Fusion funciona com integração via OAuth
ou chave de API; se você usar OAuth, omita a linha `env.OPENROUTER_API_KEY`
abaixo.

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

`analysis_models` é o painel paralelo; `model`, dentro da configuração do plugin
Fusion, é o modelo julgador. Não defina o `tool_choice` de nível superior como
`"required"` em interações normais de agente/chat para tentar forçar o Fusion:
as interações do OpenClaw podem incluir suas próprias definições de ferramentas,
e uma escolha obrigatória de ferramenta no nível superior pode selecionar uma
delas em vez do roteador Fusion. Quando essa configuração do plugin Fusion está
presente, o OpenClaw adiciona uma observação sanitizada ao prompt do sistema,
listando os modelos de análise configurados e o modelo julgador, para que o
agente possa responder a perguntas sobre seu próprio painel Fusion. Outros
campos de `extraBody` não são copiados para o prompt.

O Fusion é mais lento por definição: o OpenRouter distribui o prompt para
vários modelos de análise e depois executa uma etapa de julgamento/síntese,
portanto a latência é maior do que em uma solicitação direta a um único modelo.
Use-o para respostas deliberadas e de alta qualidade ou para caminhos de
escalonamento, não como padrão sensível à latência. Mantenha o painel pequeno e
escolha modelos de análise e julgamento mais rápidos para obter respostas mais
rápidas.

Teste uma referência configurada com uma chamada local única:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Responda exatamente com: FUSION_OK" \
  --json
```

## Autenticação e cabeçalhos

O OpenRouter usa um token Bearer da sua chave de API. O OAuth do OpenRouter é um fluxo de login PKCE que emite uma chave de API do OpenRouter; portanto, o OpenClaw armazena o resultado no mesmo perfil de autenticação por chave de API `openrouter:default` usado pela configuração manual da chave de API.

Para fazer login ou substituir a chave armazenada em uma instalação existente sem executar novamente todo o processo de integração:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Em solicitações verificadas do OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw adiciona os cabeçalhos documentados de atribuição do aplicativo do OpenRouter:

| Cabeçalho                 | Valor                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

  <Warning>
  Se você redirecionar o provedor OpenRouter para algum outro proxy ou URL base, o OpenClaw
  **não** injetará esses cabeçalhos específicos do OpenRouter nem os marcadores de cache da Anthropic.
  </Warning>

  ## Configuração avançada

  <AccordionGroup>
  <Accordion title="Cache de respostas">
    O cache de respostas do OpenRouter é opcional. Ative-o por modelo:

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
    a solicitação atual e armazena a resposta substituta. Também são aceitos os aliases em snake_case
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), assim como `responseCacheTtl` /
    `response_cache_ttl` sem o sufixo `Seconds`.

    Isso é independente do cache de prompts do provedor e dos marcadores
    `cache_control` da Anthropic no OpenRouter. Aplica-se somente a rotas
    verificadas de `openrouter.ai`, não a URLs base de proxies personalizados.

  </Accordion>

  <Accordion title="Marcadores de cache da Anthropic">
    Em rotas verificadas do OpenRouter, as referências de modelos da Anthropic mantêm
    os marcadores `cache_control` da Anthropic definidos pelo OpenRouter para melhorar a reutilização do cache de prompts em
    blocos de prompts de sistema/desenvolvedor.
  </Accordion>

  <Accordion title="Prefill de raciocínio da Anthropic">
    Em rotas verificadas do OpenRouter, referências de modelos da Anthropic com raciocínio habilitado
    removem os turnos finais de prefill do assistente antes que a solicitação chegue ao
    OpenRouter, atendendo ao requisito da Anthropic de que conversas de raciocínio
    terminem com um turno do usuário.
  </Accordion>

  <Accordion title="Injeção de pensamento / raciocínio">
    Em rotas compatíveis que não sejam `auto`, o OpenClaw mapeia o nível de pensamento selecionado
    para payloads de raciocínio do proxy do OpenRouter. `openrouter/auto` e indicações de
    modelos não compatíveis ignoram essa injeção. Referências obsoletas de `openrouter/hunter-alpha` também
    a ignoram, pois o OpenRouter podia retornar o texto da resposta final em campos de raciocínio
    nessa rota descontinuada.
  </Accordion>

  <Accordion title="Reprodução de raciocínio do DeepSeek V4">
    Em rotas verificadas do OpenRouter, `openrouter/deepseek/deepseek-v4-flash` e
    `openrouter/deepseek/deepseek-v4-pro` preenchem o `reasoning_content` ausente nos
    turnos reproduzidos do assistente, mantendo as conversas de pensamento/ferramentas no formato
    de continuidade exigido pelo DeepSeek V4. O OpenClaw envia valores de
    `reasoning.effort` compatíveis com o OpenRouter para essas rotas: `xhigh`/`max` são mapeados para `xhigh`;
    todos os outros níveis que não sejam desativados são mapeados para `high`.
  </Accordion>

  <Accordion title="Formatação de solicitações exclusiva do OpenAI">
    O OpenRouter é executado pelo caminho compatível com OpenAI no estilo proxy, portanto,
    a formatação de solicitações exclusiva do OpenAI nativo, como `serviceTier`, `store` da API Responses,
    payloads de compatibilidade de raciocínio do OpenAI e indicações de cache de prompts, não é encaminhada.
  </Accordion>

  <Accordion title="Rotas apoiadas pelo Gemini">
    As referências do OpenRouter apoiadas pelo Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
    a higienização de assinaturas de pensamento do Gemini nesse caminho, mas não habilita a validação
    de reprodução nativa do Gemini nem regravações de inicialização.
  </Accordion>

  <Accordion title="Metadados de roteamento do provedor">
    O OpenRouter oferece suporte a um objeto de solicitação `provider` para o roteamento do provedor
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

    O OpenClaw encaminha esse objeto ao OpenRouter como o payload `provider`
    da solicitação. Use os campos em snake_case documentados pelo OpenRouter, incluindo `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` e `enforce_distillable_text`.

    Os parâmetros por modelo substituem o objeto de roteamento de todo o provedor:

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

    Isso se aplica somente às rotas de chat-completions do OpenRouter. Rotas diretas da Anthropic,
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
