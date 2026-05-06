---
read_when:
    - Você quer usar os modelos Grok no OpenClaw
    - Você está configurando a autenticação da xAI ou IDs de modelo
summary: Use modelos xAI Grok no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T09:11:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw inclui um plugin de provedor `xai` integrado para modelos Grok.

## Introdução

<Steps>
  <Step title="Create an API key">
    Crie uma chave de API no [console da xAI](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Defina `XAI_API_KEY` ou execute:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa a API Responses da xAI como o transporte xAI integrado. A mesma
`XAI_API_KEY` também pode alimentar `web_search` com suporte do Grok, `x_search`
de primeira classe e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provedor de modelo xAI integrado também reutiliza essa chave como fallback.
Defina `plugins.entries.xai.config.webSearch.baseUrl` para rotear `web_search`
do Grok e, por padrão, `x_search` por meio de um proxy da API Responses da xAI
operado pelo usuário.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo integrado

OpenClaw inclui estas famílias de modelos xAI prontas para uso:

| Família        | IDs de modelo                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

O plugin também resolve automaticamente IDs `grok-4*` e `grok-code-fast*` mais
novos quando eles seguem o mesmo formato de API.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*`
são as referências atuais do Grok com suporte a imagens no catálogo integrado.
</Tip>

## Cobertura de recursos do OpenClaw

O plugin integrado mapeia a superfície atual da API pública da xAI para os
contratos compartilhados de provedor e ferramentas do OpenClaw. Capacidades que
não se encaixam no contrato compartilhado (por exemplo, TTS por streaming e voz
em tempo real) não são expostas - veja a tabela abaixo.

| Capacidade da xAI          | Superfície do OpenClaw                    | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provedor de modelo `xai/<model>`          | Sim                                                                 |
| Busca na web no servidor   | provedor `web_search` `grok`              | Sim                                                                 |
| Busca no X no servidor     | ferramenta `x_search`                     | Sim                                                                 |
| Execução de código no servidor | ferramenta `code_execution`             | Sim                                                                 |
| Imagens                    | `image_generate`                          | Sim                                                                 |
| Vídeos                     | `video_generate`                          | Sim                                                                 |
| Texto para fala em lote    | `messages.tts.provider: "xai"` / `tts`    | Sim                                                                 |
| TTS por streaming          | -                                         | Não exposto; o contrato de TTS do OpenClaw retorna buffers de áudio completos |
| Fala para texto em lote    | `tools.media.audio` / entendimento de mídia | Sim                                                               |
| Fala para texto por streaming | Voice Call `streaming.provider: "xai"` | Sim                                                                 |
| Voz em tempo real          | -                                         | Ainda não exposto; contrato de sessão/WebSocket diferente           |
| Arquivos / lotes           | Compatibilidade apenas com a API genérica de modelo | Não é uma ferramenta OpenClaw de primeira classe             |

<Note>
OpenClaw usa as APIs REST de imagem/vídeo/TTS/STT da xAI para geração de mídia,
fala e transcrição em lote, o WebSocket STT de streaming da xAI para transcrição
de chamadas de voz ao vivo e a API Responses para ferramentas de modelo, busca e
execução de código. Recursos que precisam de contratos diferentes do OpenClaw,
como sessões de voz em tempo real, são documentados aqui como capacidades do
upstream em vez de comportamento oculto do plugin.
</Note>

### Mapeamentos de modo rápido

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescreve solicitações nativas da xAI da seguinte forma:

| Modelo de origem | Destino do modo rápido |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Aliases de compatibilidade legada

Aliases legados ainda são normalizados para os IDs integrados canônicos:

| Alias legado              | ID canônico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Recursos

<AccordionGroup>
  <Accordion title="Web search">
    O provedor integrado de busca na web `grok` também usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    O plugin `xai` integrado registra geração de vídeo por meio da ferramenta
    compartilhada `video_generate`.

    - Modelo de vídeo padrão: `xai/grok-imagine-video`
    - Modos: texto para vídeo, imagem para vídeo, geração com imagem de
      referência, edição remota de vídeo e extensão remota de vídeo
    - Proporções de tela: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluções: `480P`, `720P`
    - Duração: 1-15 segundos para geração/imagem para vídeo, 1-10 segundos ao
      usar papéis `reference_image`, 2-10 segundos para extensão
    - Geração com imagem de referência: defina `imageRoles` como `reference_image` para
      cada imagem fornecida; a xAI aceita até 7 imagens desse tipo

    <Warning>
    Buffers de vídeo locais não são aceitos. Use URLs `http(s)` remotas para
    entradas de edição/extensão de vídeo. Imagem para vídeo aceita buffers de
    imagem locais porque o OpenClaw pode codificá-los como URLs de dados para a xAI.
    </Warning>

    Para usar a xAI como provedor de vídeo padrão:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros
    compartilhados da ferramenta, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    O plugin `xai` integrado registra geração de imagem por meio da ferramenta
    compartilhada `image_generate`.

    - Modelo de imagem padrão: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto para imagem e edição com imagem de referência
    - Entradas de referência: uma `image` ou até cinco `images`
    - Proporções de tela: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Quantidade: até 4 imagens

    OpenClaw solicita respostas de imagem `b64_json` à xAI para que a mídia
    gerada possa ser armazenada e entregue pelo caminho normal de anexos do
    canal. Imagens de referência locais são convertidas em URLs de dados;
    referências remotas `http(s)` são repassadas.

    Para usar a xAI como provedor de imagem padrão:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    A xAI também documenta `quality`, `mask`, `user` e proporções nativas
    adicionais como `1:2`, `2:1`, `9:20` e `20:9`. Hoje, o OpenClaw encaminha
    apenas os controles de imagem compartilhados entre provedores; ajustes
    nativos sem suporte são intencionalmente não expostos por meio de `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    O plugin `xai` integrado registra texto para fala por meio da superfície
    compartilhada do provedor `tts`.

    - Vozes: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz padrão: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: substituição de velocidade nativa do provedor
    - O formato nativo Opus para notas de voz não é compatível

    Para usar a xAI como provedor de TTS padrão:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw usa o endpoint em lote `/v1/tts` da xAI. A xAI também oferece TTS
    por streaming via WebSocket, mas o contrato de provedor de fala do OpenClaw
    atualmente espera um buffer de áudio completo antes da entrega da resposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O plugin `xai` integrado registra fala para texto em lote por meio da
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `grok-stt`
    - Endpoint: REST xAI `/v1/stt`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Suportado pelo OpenClaw em qualquer lugar em que a transcrição de áudio
      de entrada usa `tools.media.audio`, incluindo segmentos de canais de voz
      do Discord e anexos de áudio de canais

    Para forçar a xAI para transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    O idioma pode ser fornecido por meio da configuração compartilhada de mídia
    de áudio ou por solicitação de transcrição por chamada. Dicas de prompt são
    aceitas pela superfície compartilhada do OpenClaw, mas a integração STT REST
    da xAI encaminha apenas arquivo, modelo e idioma porque eles mapeiam
    diretamente para o endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    O plugin `xai` integrado também registra um provedor de transcrição em
    tempo real para áudio de chamadas de voz ao vivo.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Endpointing padrão: `800ms`
    - Transcrições intermediárias: habilitadas por padrão

    O stream de mídia Twilio do Voice Call envia quadros de áudio G.711 µ-law,
    então o provedor xAI pode encaminhar esses quadros diretamente sem
    transcodificação:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    A configuração pertencente ao provedor fica em
    `plugins.entries.voice-call.config.streaming.providers.xai`. As chaves
    compatíveis são `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Este provedor de streaming é para o caminho de transcrição em tempo real do Voice Call.
    A voz do Discord atualmente grava segmentos curtos e usa o caminho de transcrição em lote
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O plugin xAI incluído expõe `x_search` como uma ferramenta do OpenClaw para pesquisar
    conteúdo do X (antigo Twitter) via Grok.

    Caminho de configuração: `plugins.entries.xai.config.xSearch`

    | Chave              | Tipo    | Padrão            | Descrição                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Ativa ou desativa x_search           |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitações de x_search |
    | `baseUrl`          | string  | -                  | Substituição da URL base de Responses da xAI |
    | `inlineCitations`  | boolean | -                  | Inclui citações inline nos resultados |
    | `maxTurns`         | number  | -                  | Máximo de turnos de conversa         |
    | `timeoutSeconds`   | number  | -                  | Tempo limite da solicitação em segundos |
    | `cacheTtlMinutes`  | number  | -                  | Tempo de vida do cache em minutos    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuração de execução de código">
    O plugin xAI incluído expõe `code_execution` como uma ferramenta do OpenClaw para
    execução remota de código no ambiente de sandbox da xAI.

    Caminho de configuração: `plugins.entries.xai.config.codeExecution`

    | Chave             | Tipo    | Padrão            | Descrição                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se a chave estiver disponível) | Ativa ou desativa a execução de código |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitações de execução de código |
    | `maxTurns`        | number  | -                  | Máximo de turnos de conversa             |
    | `timeoutSeconds`  | number  | -                  | Tempo limite da solicitação em segundos  |

    <Note>
    Esta é a execução remota no sandbox da xAI, não o [`exec`](/pt-BR/tools/exec) local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limites conhecidos">
    - A autenticação hoje é somente por chave de API. Ainda não há fluxo de OAuth ou código de dispositivo da xAI no
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` não é compatível com o
      caminho normal do provedor xAI porque exige uma superfície de API upstream diferente
      do transporte xAI padrão do OpenClaw.
    - A voz em tempo real da xAI ainda não está registrada como um provedor do OpenClaw. Ela
      precisa de um contrato de sessão de voz bidirecional diferente de STT em lote ou
      transcrição por streaming.
    - `quality` de imagem da xAI, `mask` de imagem e proporções extras somente nativas
      não são expostos até que a ferramenta compartilhada `image_generate` tenha controles
      correspondentes entre provedores.
  </Accordion>

  <Accordion title="Notas avançadas">
    - O OpenClaw aplica correções de compatibilidade específicas da xAI para esquema de ferramentas e chamadas de ferramenta
      automaticamente no caminho do runner compartilhado.
    - Solicitações nativas da xAI usam `tool_stream: true` por padrão. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
      desativar isso.
    - O wrapper xAI incluído remove flags rígidas de esquema de ferramentas sem suporte e
      chaves de payload de raciocínio antes de enviar solicitações nativas da xAI.
    - `web_search`, `x_search` e `code_execution` são expostos como ferramentas do OpenClaw.
      O OpenClaw habilita o recurso integrado específico da xAI de que precisa dentro de cada solicitação de ferramenta
      em vez de anexar todas as ferramentas nativas a cada turno de chat.
    - O `web_search` do Grok lê `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lê `plugins.entries.xai.config.xSearch.baseUrl` e depois
      recorre à URL base de pesquisa na web do Grok.
    - `x_search` e `code_execution` pertencem ao plugin xAI incluído, em vez de
      serem codificados diretamente no runtime do modelo principal.
    - `code_execution` é execução remota no sandbox da xAI, não
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Testes ao vivo

Os caminhos de mídia da xAI são cobertos por testes unitários e suítes ao vivo opcionais. Os comandos ao vivo carregam segredos do seu shell de login, incluindo `~/.profile`, antes de verificar `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo ao vivo específico do provedor sintetiza TTS normal, TTS PCM adequado para telefonia, transcreve áudio por STT em lote da xAI, transmite o mesmo PCM por STT em tempo real da xAI, gera saída de texto para imagem e edita uma imagem de referência. O arquivo ao vivo compartilhado de imagens verifica o mesmo provedor xAI pelo caminho de seleção de runtime, fallback, normalização e anexo de mídia do OpenClaw.

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta compartilhada de vídeo e seleção de provedor.
  </Card>
  <Card title="Todos os provedores" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais ampla dos provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
