---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando autenticação xAI ou IDs de modelo
summary: Usar modelos xAI Grok no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T06:09:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

O OpenClaw inclui um Plugin de provedor `xai` empacotado para modelos Grok.

## Primeiros passos

<Steps>
  <Step title="Criar uma chave de API">
    Crie uma chave de API no [console xAI](https://console.x.ai/).
  </Step>
  <Step title="Definir sua chave de API">
    Defina `XAI_API_KEY`, ou execute:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Escolher um modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
O OpenClaw usa a API xAI Responses como transporte xAI empacotado. A mesma
`XAI_API_KEY` também pode alimentar `web_search` com suporte de Grok, `x_search`
de primeira classe e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provedor de modelo xAI empacotado também reutiliza essa chave como fallback.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo interno

O OpenClaw inclui essas famílias de modelos xAI prontas para uso:

| Família        | IDs de modelo                                                             |
| -------------- | ------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code      | `grok-code-fast-1`                                                        |

O Plugin também resolve adiante IDs mais novos `grok-4*` e `grok-code-fast*` quando
eles seguem o mesmo formato de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*` são as
referências Grok com suporte atual a imagem no catálogo empacotado.
</Tip>

## Cobertura de recursos no OpenClaw

O Plugin empacotado mapeia a superfície atual da API pública da xAI para os contratos compartilhados
de provedor e ferramenta do OpenClaw. Capacidades que não se encaixam no contrato compartilhado
(por exemplo, TTS por streaming e voz realtime) não são expostas — consulte a tabela
abaixo.

| Capacidade xAI             | Superfície OpenClaw                      | Status                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provedor de modelo `xai/<model>`         | Sim                                                                 |
| Web search no servidor     | provedor `web_search` `grok`             | Sim                                                                 |
| X search no servidor       | ferramenta `x_search`                    | Sim                                                                 |
| Code execution no servidor | ferramenta `code_execution`              | Sim                                                                 |
| Imagens                    | `image_generate`                         | Sim                                                                 |
| Vídeos                     | `video_generate`                         | Sim                                                                 |
| Text-to-speech em lote     | `messages.tts.provider: "xai"` / `tts`   | Sim                                                                 |
| TTS por streaming          | —                                        | Não exposto; o contrato TTS do OpenClaw retorna buffers completos de áudio |
| Speech-to-text em lote     | `tools.media.audio` / entendimento de mídia | Sim                                                              |
| Speech-to-text por streaming | Voice Call `streaming.provider: "xai"` | Sim                                                                 |
| Voz realtime               | —                                        | Ainda não exposto; contrato diferente de sessão/WebSocket           |
| Arquivos / batches         | Apenas compatibilidade genérica com API de modelo | Não é uma ferramenta de primeira classe do OpenClaw          |

<Note>
O OpenClaw usa as APIs REST da xAI para imagem/vídeo/TTS/STT em geração de mídia,
fala e transcrição em lote, o WebSocket de STT por streaming da xAI para
transcrição ao vivo em chamadas de voz, e a API Responses para ferramentas
de modelo, busca e code execution. Recursos que exigem contratos diferentes do OpenClaw, como
sessões de voz Realtime, são documentados aqui como capacidades upstream em vez de
comportamento oculto do Plugin.
</Note>

### Mapeamentos de fast mode

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescrevem requisições xAI nativas da seguinte forma:

| Modelo de origem | Alvo de fast mode |
| ---------------- | ----------------- |
| `grok-3`         | `grok-3-fast`     |
| `grok-3-mini`    | `grok-3-mini-fast` |
| `grok-4`         | `grok-4-fast`     |
| `grok-4-0709`    | `grok-4-fast`     |

### Aliases legados de compatibilidade

Aliases legados ainda são normalizados para os IDs canônicos empacotados:

| Alias legado              | ID canônico                            |
| ------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`  |

## Recursos

<AccordionGroup>
  <Accordion title="Web search">
    O provedor empacotado `grok` de web search também usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeo">
    O Plugin empacotado `xai` registra geração de vídeo por meio da ferramenta compartilhada
    `video_generate`.

    - Modelo de vídeo padrão: `xai/grok-imagine-video`
    - Modos: texto para vídeo, imagem para vídeo, edição remota de vídeo e extensão remota
      de vídeo
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluções: `480P`, `720P`
    - Duração: 1-15 segundos para geração/imagem para vídeo, 2-10 segundos para
      extensão

    <Warning>
    Buffers de vídeo locais não são aceitos. Use URLs remotas `http(s)` para
    entradas de edição/extensão de vídeo. Imagem para vídeo aceita buffers de imagem locais porque
    o OpenClaw pode codificá-los como data URLs para a xAI.
    </Warning>

    Para usar xAI como provedor de vídeo padrão:

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

  <Accordion title="Geração de imagem">
    O Plugin empacotado `xai` registra geração de imagem por meio da ferramenta compartilhada
    `image_generate`.

    - Modelo de imagem padrão: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto para imagem e edição com imagem de referência
    - Entradas de referência: uma `image` ou até cinco `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Quantidade: até 4 imagens

    O OpenClaw solicita à xAI respostas de imagem `b64_json` para que a mídia gerada possa ser
    armazenada e entregue pelo caminho normal de anexos do canal. Imagens locais de
    referência são convertidas para data URLs; referências remotas `http(s)` são
    repassadas.

    Para usar xAI como provedor de imagem padrão:

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
    A xAI também documenta `quality`, `mask`, `user` e proporções nativas adicionais
    como `1:2`, `2:1`, `9:20` e `20:9`. Hoje o OpenClaw encaminha apenas os
    controles de imagem compartilhados entre provedores; opções nativas não compatíveis
    são intencionalmente não expostas por `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    O Plugin empacotado `xai` registra text-to-speech por meio da superfície compartilhada
    de provedor `tts`.

    - Vozes: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz padrão: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: sobrescrita de velocidade nativa do provedor
    - O formato nativo Opus de nota de voz não é compatível

    Para usar xAI como provedor TTS padrão:

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
    O OpenClaw usa o endpoint em lote `/v1/tts` da xAI. A xAI também oferece TTS por streaming
    via WebSocket, mas o contrato de provedor de fala do OpenClaw atualmente espera
    um buffer de áudio completo antes da entrega da resposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O Plugin empacotado `xai` registra speech-to-text em lote por meio da
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `grok-stt`
    - Endpoint: REST xAI `/v1/stt`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw onde quer que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canal

    Para forçar xAI na transcrição de áudio de entrada:

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

    O idioma pode ser fornecido pela configuração compartilhada de mídia de áudio ou por requisição individual
    de transcrição. Dicas de prompt são aceitas pela superfície compartilhada do OpenClaw,
    mas a integração REST STT da xAI encaminha apenas arquivo, modelo e
    idioma porque esses mapeiam de forma limpa para o endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Speech-to-text por streaming">
    O Plugin empacotado `xai` também registra um provedor de transcrição realtime
    para áudio ao vivo de chamadas de voz.

    - Endpoint: WebSocket xAI `wss://api.x.ai/v1/stt`
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Endpointing padrão: `800ms`
    - Transcrições intermediárias: ativadas por padrão

    O stream de mídia do Twilio no Voice Call envia frames de áudio G.711 µ-law, então o
    provedor xAI pode encaminhar esses frames diretamente sem transcodificação:

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

    A configuração controlada pelo provedor fica em
    `plugins.entries.voice-call.config.streaming.providers.xai`. As chaves
    compatíveis são `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Este provedor de streaming é para o caminho de transcrição realtime do Voice Call.
    A voz do Discord atualmente grava segmentos curtos e usa o caminho em lote de transcrição
    `tools.media.audio` em vez disso.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O Plugin empacotado xAI expõe `x_search` como uma ferramenta do OpenClaw para pesquisar
    conteúdo do X (antigo Twitter) por meio do Grok.

    Caminho de configuração: `plugins.entries.xai.config.xSearch`

    | Chave             | Tipo    | Padrão             | Descrição                           |
    | ----------------- | ------- | ------------------ | ----------------------------------- |
    | `enabled`         | boolean | —                  | Ativar ou desativar `x_search`      |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para requisições `x_search` |
    | `inlineCitations` | boolean | —                  | Incluir citações inline nos resultados |
    | `maxTurns`        | number  | —                  | Máximo de turnos de conversa        |
    | `timeoutSeconds`  | number  | —                  | Timeout da requisição em segundos   |
    | `cacheTtlMinutes` | number  | —                  | Tempo de vida do cache em minutos   |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuração de code execution">
    O Plugin empacotado xAI expõe `code_execution` como uma ferramenta do OpenClaw para
    execução remota de código no ambiente sandbox da xAI.

    Caminho de configuração: `plugins.entries.xai.config.codeExecution`

    | Chave             | Tipo    | Padrão                     | Descrição                                |
    | ----------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se houver chave disponível) | Ativar ou desativar code execution |
    | `model`           | string  | `grok-4-1-fast`            | Modelo usado para requisições de code execution |
    | `maxTurns`        | number  | —                          | Máximo de turnos de conversa             |
    | `timeoutSeconds`  | number  | —                          | Timeout da requisição em segundos        |

    <Note>
    Isso é execução remota em sandbox da xAI, não [`exec`](/pt-BR/tools/exec) local.
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
    - A autenticação é apenas por chave de API atualmente. Ainda não há fluxo de OAuth nem device-code da xAI no
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` não é compatível no
      caminho normal do provedor xAI porque exige uma superfície de API upstream
      diferente do transporte xAI padrão do OpenClaw.
    - A voz Realtime da xAI ainda não está registrada como provedor do OpenClaw. Ela
      precisa de um contrato diferente de sessão de voz bidirecional em relação a STT em lote ou
      transcrição por streaming.
    - `quality` de imagem da xAI, `mask` de imagem e proporções extras apenas nativas
      não são expostas até que a ferramenta compartilhada `image_generate` tenha controles
      correspondentes entre provedores.
  </Accordion>

  <Accordion title="Observações avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para schema de ferramenta e chamadas de ferramenta
      no caminho compartilhado do executor.
    - Requisições nativas xAI usam por padrão `tool_stream: true`. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
      desativá-lo.
    - O wrapper empacotado xAI remove flags estritas de schema de ferramenta não compatíveis e
      chaves de payload de raciocínio antes de enviar requisições xAI nativas.
    - `web_search`, `x_search` e `code_execution` são expostos como ferramentas do OpenClaw. O OpenClaw ativa a função interna específica da xAI de que precisa dentro de cada
      requisição de ferramenta, em vez de anexar todas as ferramentas nativas a cada turno de chat.
    - `x_search` e `code_execution` são controlados pelo Plugin empacotado xAI, em vez de
      serem codificados diretamente no runtime de modelo do core.
    - `code_execution` é execução remota em sandbox da xAI, não
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Testes live

Os caminhos de mídia da xAI são cobertos por testes unitários e suítes live opt-in. Os comandos
live carregam segredos do seu shell de login, incluindo `~/.profile`, antes de
sondar `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo live específico do provedor sintetiza TTS normal, TTS PCM amigável para telefonia,
transcreve áudio via STT em lote da xAI, transmite o mesmo PCM pela STT
realtime da xAI, gera saída de texto para imagem e edita uma imagem de referência. O
arquivo live compartilhado de imagem verifica o mesmo provedor xAI pelo caminho de
seleção de runtime, fallback, normalização e anexo de mídia do OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolher provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Todos os provedores" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais ampla de provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
