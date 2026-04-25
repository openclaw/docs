---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando autenticação xAI ou IDs de modelo
summary: Usar modelos xAI Grok no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-25T18:21:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

O OpenClaw inclui um Plugin de provider `xai` empacotado para modelos Grok.

## Primeiros passos

<Steps>
  <Step title="Crie uma chave de API">
    Crie uma chave de API no [console do xAI](https://console.x.ai/).
  </Step>
  <Step title="Defina sua chave de API">
    Defina `XAI_API_KEY` ou execute:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Escolha um modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
O OpenClaw usa a API Responses da xAI como transporte xAI empacotado. A mesma
`XAI_API_KEY` também pode alimentar `web_search` com Grok, `x_search` nativo
e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provider de modelo xAI empacotado também reutilizará essa chave como fallback.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo integrado

O OpenClaw inclui estas famílias de modelos xAI prontas para uso:

| Family         | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

O Plugin também resolve adiante ids mais novos `grok-4*` e `grok-code-fast*` quando
eles seguem o mesmo formato de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*` são as
referências Grok atuais com suporte a imagem no catálogo empacotado.
</Tip>

## Cobertura de recursos do OpenClaw

O Plugin empacotado mapeia a superfície atual da API pública da xAI para os contratos
compartilhados de provider e ferramenta do OpenClaw. Capacidades que não se encaixam no contrato compartilhado
(por exemplo, TTS em streaming e voz em tempo real) não são expostas — consulte a tabela
abaixo.

| xAI capability             | OpenClaw surface                          | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provider de modelo `xai/<model>`          | Sim                                                                 |
| Server-side web search     | provider `grok` de `web_search`           | Sim                                                                 |
| Server-side X search       | ferramenta `x_search`                     | Sim                                                                 |
| Server-side code execution | ferramenta `code_execution`               | Sim                                                                 |
| Images                     | `image_generate`                          | Sim                                                                 |
| Videos                     | `video_generate`                          | Sim                                                                 |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | Sim                                                                 |
| Streaming TTS              | —                                         | Não exposto; o contrato de TTS do OpenClaw retorna buffers de áudio completos |
| Batch speech-to-text       | `tools.media.audio` / entendimento de mídia | Sim                                                               |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | Sim                                                                 |
| Realtime voice             | —                                         | Ainda não exposto; contrato diferente de sessão/WebSocket           |
| Files / batches            | Apenas compatibilidade com API genérica de modelo | Não é uma ferramenta de primeira classe do OpenClaw          |

<Note>
O OpenClaw usa as APIs REST de imagem/vídeo/TTS/STT da xAI para geração de mídia,
fala e transcrição em lote, o WebSocket de STT em streaming da xAI para
transcrição ao vivo de chamadas de voz e a API Responses para ferramentas de modelo, busca e
execução de código. Recursos que exigem contratos diferentes do OpenClaw, como
sessões de voz Realtime, são documentados aqui como capacidades upstream em vez de
comportamento oculto do Plugin.
</Note>

### Mapeamentos de modo rápido

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescreve solicitações nativas da xAI da seguinte forma:

| Source model  | Fast-mode target   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Aliases legados de compatibilidade

Aliases legados ainda são normalizados para os ids canônicos empacotados:

| Legacy alias              | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Recursos

<AccordionGroup>
  <Accordion title="Busca na web">
    O provider de busca na web `grok` empacotado também usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeo">
    O Plugin `xai` empacotado registra a geração de vídeo por meio da ferramenta compartilhada
    `video_generate`.

    - Modelo de vídeo padrão: `xai/grok-imagine-video`
    - Modos: texto para vídeo, imagem para vídeo, geração com imagem de referência, edição
      remota de vídeo e extensão remota de vídeo
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluções: `480P`, `720P`
    - Duração: 1-15 segundos para geração/imagem para vídeo, 1-10 segundos ao
      usar papéis `reference_image`, 2-10 segundos para extensão
    - Geração com imagem de referência: defina `imageRoles` como `reference_image` para
      cada imagem fornecida; a xAI aceita até 7 dessas imagens

    <Warning>
    Buffers locais de vídeo não são aceitos. Use URLs remotas `http(s)` para
    entradas de edição/extensão de vídeo. Imagem para vídeo aceita buffers locais de imagem porque
    o OpenClaw pode codificá-los como URLs de dados para a xAI.
    </Warning>

    Para usar xAI como provider de vídeo padrão:

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
    Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta,
    seleção de provider e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de imagem">
    O Plugin `xai` empacotado registra a geração de imagem por meio da ferramenta compartilhada
    `image_generate`.

    - Modelo de imagem padrão: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto para imagem e edição com imagem de referência
    - Entradas de referência: uma `image` ou até cinco `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Quantidade: até 4 imagens

    O OpenClaw solicita respostas de imagem `b64_json` à xAI para que a mídia gerada possa ser
    armazenada e entregue pelo caminho normal de anexos de canal. Imagens
    locais de referência são convertidas para URLs de dados; referências remotas `http(s)` são
    repassadas.

    Para usar xAI como provider de imagem padrão:

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
    como `1:2`, `2:1`, `9:20` e `20:9`. O OpenClaw atualmente repassa apenas os
    controles compartilhados de imagem entre providers; controles nativos exclusivos não compatíveis
    intencionalmente não são expostos por `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    O Plugin `xai` empacotado registra text-to-speech por meio da superfície compartilhada do provider `tts`.

    - Vozes: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz padrão: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: substituição de velocidade nativa do provider
    - O formato nativo Opus para mensagem de voz não é compatível

    Para usar xAI como provider de TTS padrão:

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
    O OpenClaw usa o endpoint em lote `/v1/tts` da xAI. A xAI também oferece TTS em streaming
    por WebSocket, mas o contrato atual do provider de fala do OpenClaw espera
    um buffer de áudio completo antes da entrega da resposta.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O Plugin `xai` empacotado registra speech-to-text em lote por meio da
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `grok-stt`
    - Endpoint: REST `/v1/stt` da xAI
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw onde quer que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canais

    Para forçar xAI para transcrição de áudio de entrada:

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

    O idioma pode ser fornecido pela configuração compartilhada de mídia de áudio ou por solicitação
    de transcrição por chamada. Dicas de prompt são aceitas pela superfície compartilhada do OpenClaw,
    mas a integração REST STT da xAI só repassa arquivo, modelo e
    idioma porque esses se mapeiam de forma limpa para o endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Speech-to-text em streaming">
    O Plugin `xai` empacotado também registra um provider de transcrição em tempo real
    para áudio ao vivo de chamadas de voz.

    - Endpoint: WebSocket da xAI `wss://api.x.ai/v1/stt`
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Endpointing padrão: `800ms`
    - Transcrições intermediárias: ativadas por padrão

    O fluxo de mídia do Twilio do Voice Call envia frames de áudio G.711 µ-law, então o
    provider xAI pode repassar esses frames diretamente sem transcodificação:

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

    A configuração de propriedade do provider fica em
    `plugins.entries.voice-call.config.streaming.providers.xai`. As
    chaves compatíveis são `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Este provider em streaming é para o caminho de transcrição em tempo real do Voice Call.
    O voice do Discord atualmente grava segmentos curtos e usa o caminho em lote de transcrição
    `tools.media.audio` no lugar disso.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O Plugin xAI empacotado expõe `x_search` como uma ferramenta do OpenClaw para pesquisar
    conteúdo do X (antigo Twitter) via Grok.

    Caminho de configuração: `plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Ativa ou desativa x_search           |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitações x_search |
    | `inlineCitations`  | boolean | —                  | Inclui citações inline nos resultados |
    | `maxTurns`         | number  | —                  | Número máximo de turnos de conversa  |
    | `timeoutSeconds`   | number  | —                  | Timeout da solicitação em segundos   |
    | `cacheTtlMinutes`  | number  | —                  | Tempo de vida do cache em minutos    |

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
    O Plugin xAI empacotado expõe `code_execution` como uma ferramenta do OpenClaw para
    execução remota de código no ambiente sandbox da xAI.

    Caminho de configuração: `plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default            | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se houver chave disponível) | Ativa ou desativa a execução de código |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitações de execução de código |
    | `maxTurns`        | number  | —                  | Número máximo de turnos de conversa      |
    | `timeoutSeconds`  | number  | —                  | Timeout da solicitação em segundos       |

    <Note>
    Isto é execução remota em sandbox da xAI, não [`exec`](/pt-BR/tools/exec) local.
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
    - A autenticação hoje é apenas por chave de API. Ainda não existe fluxo de OAuth nem de código de dispositivo xAI no
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` não é compatível com o
      caminho normal do provider xAI porque exige uma superfície de API upstream
      diferente do transporte xAI padrão do OpenClaw.
    - A voz Realtime da xAI ainda não está registrada como um provider do OpenClaw. Ela
      precisa de um contrato diferente de sessão de voz bidirecional do que STT em lote ou
      transcrição em streaming.
    - `quality` de imagem da xAI, `mask` de imagem e proporções extras exclusivas nativas
      não são expostas até que a ferramenta compartilhada `image_generate` tenha controles
      correspondentes entre providers.
  </Accordion>

  <Accordion title="Notas avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para schema de ferramentas e chamadas de ferramenta
      no caminho compartilhado do runner.
    - Solicitações xAI nativas usam por padrão `tool_stream: true`. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
      desativá-lo.
    - O wrapper xAI empacotado remove sinalizadores estritos de schema de ferramentas não compatíveis e
      chaves de payload de reasoning antes de enviar solicitações xAI nativas.
    - `web_search`, `x_search` e `code_execution` são expostos como ferramentas do OpenClaw.
      O OpenClaw ativa o recurso interno específico da xAI de que precisa dentro de cada
      solicitação de ferramenta em vez de anexar todas as ferramentas nativas a cada turno de chat.
    - `x_search` e `code_execution` pertencem ao Plugin xAI empacotado em vez de
      ficarem hardcoded no runtime central de modelos.
    - `code_execution` é execução remota em sandbox da xAI, não
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Testes ao vivo

Os caminhos de mídia xAI são cobertos por testes unitários e suítes ao vivo opt-in. Os comandos
ao vivo carregam segredos do seu shell de login, incluindo `~/.profile`, antes de
verificar `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo ao vivo específico do provider sintetiza TTS normal, TTS PCM
adequado para telefonia, transcreve áudio por STT em lote da xAI, transmite o mesmo PCM por STT em tempo real da xAI,
gera saída de texto para imagem e edita uma imagem de referência. O
arquivo compartilhado de imagem ao vivo verifica o mesmo provider xAI por meio da
seleção de runtime, fallback, normalização e caminho de anexos de mídia do OpenClaw.

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="Todos os providers" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais ampla de providers.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
