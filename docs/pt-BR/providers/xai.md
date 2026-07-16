---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando a autenticação ou os IDs de modelo da xAI
summary: Use modelos xAI Grok no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T12:51:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw inclui um Plugin de provedor `xai` integrado para modelos Grok. O
caminho recomendado é o OAuth do Grok com uma assinatura elegível do SuperGrok ou X Premium.
Gateway, configuração, roteamento e ferramentas permanecem locais; somente as solicitações do Grok
são enviadas à API da xAI.

O OAuth não exige uma chave de API da xAI nem o aplicativo Grok Build. A xAI ainda pode
exibir o Grok Build na tela de consentimento porque o OpenClaw usa o cliente OAuth
compartilhado da xAI.

## Configuração

<Steps>
  <Step title="Nova instalação">
    Execute a integração inicial com a instalação do daemon e selecione o OAuth da xAI/Grok na
    etapa de modelo/autenticação:

    ```bash
    openclaw onboard --install-daemon
    ```

    Em um VPS ou via SSH, selecione diretamente o OAuth da xAI; ele usa a verificação
    por código de dispositivo e não precisa de um callback de localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Instalação existente">
    Entre somente na xAI; não execute novamente toda a integração inicial apenas para conectar o Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Defina o Grok como modelo padrão separadamente:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Execute novamente toda a integração inicial somente se quiser alterar intencionalmente o Gateway,
    daemon, canal, espaço de trabalho ou outras opções de configuração.

  </Step>
  <Step title="Caminho com chave de API">
    A configuração por chave de API ainda funciona para chaves do xAI Console e para recursos de mídia
    que precisam de configuração de provedor baseada em chave:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Escolha um modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
O OpenClaw usa a API Responses da xAI como transporte integrado da xAI. A mesma
credencial de `openclaw models auth login --provider xai --method oauth` ou
`--method api-key` também alimenta `web_search` (id do provedor `grok`), `x_search`,
`code_execution`, fala/transcrição e geração de imagens/vídeos da xAI. Se uma
chave da xAI for armazenada em `plugins.entries.xai.config.webSearch.apiKey`, o
provedor de modelos da xAI integrado também a reutilizará como alternativa.
</Note>

## Solução de problemas do OAuth

- Para SSH, Docker, VPS ou outras configurações remotas, use
  `openclaw models auth login --provider xai --method oauth`; ele usa
  verificação por código de dispositivo, não um callback de localhost.
- Se a entrada for bem-sucedida, mas o Grok não for o modelo padrão, execute
  `openclaw models set xai/grok-4.3`.
- Inspecione os perfis de autenticação da xAI salvos:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- A xAI decide quais contas podem receber tokens de API OAuth. Se uma conta
  não for elegível, use o caminho com chave de API ou verifique a assinatura na xAI.

<Tip>
Use `xai-oauth` ao entrar via SSH, Docker ou VPS. O OpenClaw exibe uma
URL e um código curto; conclua a entrada em qualquer navegador local enquanto o processo
remoto consulta a xAI para verificar a conclusão da troca de tokens.
</Tip>

## Catálogo integrado

IDs selecionáveis nos seletores de modelo. O Plugin ainda resolve IDs mais antigos do Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast e Grok Code para configurações existentes;
consulte [compatibilidade legada e aliases móveis](#legacy-compatibility-and-moving-aliases).

| Família        | IDs de modelo                                                |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (aliases: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (aliases: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Use `grok-4.5` para chat geral, programação e trabalho agêntico quando estiver disponível.
O Grok 4.3 continua sendo o padrão de configuração seguro para regiões; `grok-build-0.1` e ambas
as variantes datadas do Grok 4.20 continuam selecionáveis.
</Tip>

## Cobertura de recursos

O Plugin integrado mapeia as APIs compatíveis da xAI para os contratos compartilhados de provedor e
ferramentas do OpenClaw. Os recursos que não se encaixam no contrato compartilhado estão listados
abaixo ou nas limitações conhecidas.

| Recurso da xAI             | Recurso do OpenClaw                    | Status                                               |
| -------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Chat / Responses           | Provedor de modelos `xai/<model>` | Sim                                                  |
| Pesquisa web no servidor   | Provedor `web_search` `grok` | Sim                                             |
| Pesquisa no X no servidor  | Ferramenta `x_search`          | Sim                                                  |
| Execução de código no servidor | Ferramenta `code_execution`      | Sim                                                  |
| Imagens                    | `image_generate`                     | Sim                                                  |
| Vídeos                     | `video_generate`                     | Sim                                                  |
| Texto para fala em lote    | `messages.tts.provider: "xai"` / `tts` | Sim                                                |
| TTS por streaming          | `textToSpeechStream`                     | Sim, via `wss://api.x.ai/v1/tts` (não é voz em tempo real) |
| Fala para texto em lote    | Compreensão de mídia `tools.media.audio` | Sim                                                |
| Fala para texto por streaming | Voice Call `streaming.provider: "xai"`      | Sim                                                  |
| Voz em tempo real          | Talk `talk.realtime.provider: "xai"`                | Sim; retransmissão pelo Gateway para Nodes Talk nativos |
| Arquivos / lotes           | Apenas compatibilidade com a API genérica de modelos | Não é uma ferramenta de primeira classe do OpenClaw |

<Note>
O OpenClaw usa as APIs REST de imagem/vídeo/TTS/STT da xAI para geração de mídia e
transcrição em lote, o WebSocket de STT por streaming da xAI para transcrição de chamadas
de voz ao vivo, o WebSocket do Grok Voice Agent da xAI para sessões Talk em tempo real
e a API Responses para chat, pesquisa e ferramentas de execução de código.
</Note>

### Compatibilidade legada do modo rápido

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
ainda reescreve configurações mais antigas da xAI da seguinte forma. Esses IDs de destino são
mantidos apenas para compatibilidade; use os modelos selecionáveis atuais em novas
configurações.

| Modelo de origem | Destino do modo rápido |
| ---------------- | ---------------------- |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Compatibilidade legada e aliases móveis

Aliases mais antigos são normalizados da seguinte forma:

| Alias legado                                                  | ID normalizado    |
| ------------------------------------------------------------- | ----------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Os IDs 0309 datados são as entradas selecionáveis do catálogo. O OpenClaw envia todos os outros
aliases atuais do Grok 4.20 literalmente para que a xAI mantenha o controle da semântica dos aliases
estáveis, mais recentes, beta, experimentais e datados. O alias global `grok-latest` também é
preservado literalmente.

A xAI descontinuou os seguintes IDs exatos. O OpenClaw os mantém como linhas de compatibilidade
ocultas para configurações já distribuídas, com os limites e preços de seus destinos de
redirecionamento atuais:

| IDs descontinuados                                                   | Comportamento atual                 |
| -------------------------------------------------------------------- | ----------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 com raciocínio `low` |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 com raciocínio desativado |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Qualidade de imagem do Grok Imagine |

`openclaw doctor --fix` atualiza os padrões persistidos das ferramentas de servidor da xAI e o
slug descontinuado de imagem de qualidade, remove linhas obsoletas do catálogo gerado e corrige
metadados de contexto obsoletos em linhas 4.20 ativas. Ele não fixa os aliases
`beta-latest` ativos do 4.20 em um snapshot datado.

## Recursos

<Warning>
  `x_search` e `code_execution` são executados nos servidores da xAI. A xAI cobra US$ 5 por 1.000
  chamadas de ferramentas, além dos tokens de entrada e saída do modelo. Quando a configuração
  `enabled` de cada ferramenta é omitida, o OpenClaw a disponibiliza somente para um modelo da xAI ativo.
  Um provedor conhecido de modelos que não é da xAI exige um `enabled: true` explícito por ferramenta;
  um provedor ausente ou não resolvido falha de forma fechada. A autenticação da xAI é sempre obrigatória,
  e `enabled: false` desativa a ferramenta para todos os provedores.
</Warning>

<AccordionGroup>
  <Accordion title="Pesquisa web">
    O provedor integrado de pesquisa web `grok` prioriza o OAuth da xAI e, em seguida, usa como alternativa
    `XAI_API_KEY` ou uma chave de pesquisa web do Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeos">
    O Plugin integrado `xai` registra a geração de vídeos por meio da ferramenta
    compartilhada `video_generate`.

    - Modelo padrão: `xai/grok-imagine-video`
    - Modelo adicional: `xai/grok-imagine-video-1.5`
    - Modos clássicos: texto para vídeo, imagem para vídeo, geração com imagem de referência,
      edição remota de vídeo e extensão remota de vídeo
    - Modo Video 1.5: somente imagem para vídeo, com exatamente uma imagem de primeiro quadro
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      a conversão de imagem para vídeo clássica e do Video 1.5 herda a proporção da imagem de origem quando
      omitida
    - Resoluções: clássica `480P`/`720P`; o Video 1.5 também aceita `1080P`; todos
      os modos de geração usam `480P` como padrão
    - Duração: 1-15 segundos para geração/imagem para vídeo, 1-10 segundos ao
      usar funções clássicas `reference_image`, 2-10 segundos para extensão clássica
    - Geração com imagem de referência: defina `imageRoles` como `reference_image` para
      cada imagem fornecida; a xAI aceita até 7 dessas imagens
    - A edição/extensão de vídeo herda a proporção e a resolução do vídeo de entrada;
      essas operações não aceitam substituições de geometria
    - Tempo limite padrão da operação: 600 segundos, a menos que `video_generate.timeoutMs`
      ou `agents.defaults.videoGenerationModel.timeoutMs` esteja definido

    <Warning>
    Buffers locais de vídeo não são aceitos. Use URLs remotas `http(s)` como entradas para
    edição/extensão de vídeo. A conversão de imagem para vídeo aceita buffers locais de imagem porque
    o OpenClaw os codifica como URLs de dados para a xAI.
    </Warning>

    O Video 1.5 também reconhece os identificadores `grok-imagine-video-1.5-preview` e
    `grok-imagine-video-1.5-2026-05-30` da xAI. O OpenClaw encaminha o
    identificador selecionado sem alterações, mas aplica a mesma validação exclusiva para imagens.

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
    Consulte [Geração de vídeos](/pt-BR/tools/video-generation) para conhecer os parâmetros compartilhados da
    ferramenta, a seleção de provedor e o comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de imagens">
    O Plugin integrado `xai` registra a geração de imagens por meio da ferramenta
    compartilhada `image_generate`.

    - Modelo de imagem padrão: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-quality`
    - Modos: texto para imagem e edição de imagem de referência
    - Entradas de referência: uma `image` ou até três `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluções: `1K`, `2K`
    - Quantidade: até 4 imagens
    - Tempo limite padrão da operação: 600 segundos, a menos que `image_generate.timeoutMs`
      ou `agents.defaults.imageGenerationModel.timeoutMs` esteja definido

    O OpenClaw solicita à xAI respostas de imagem `b64_json` para que a mídia gerada possa ser
    armazenada e entregue pelo caminho normal de anexos do canal. Imagens de
    referência locais são convertidas em URLs de dados; referências remotas `http(s)`
    são encaminhadas sem alterações.

    Para usar a xAI como provedor de imagens padrão:

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
    A xAI também documenta `quality`, `mask`, `user` e uma proporção `auto`.
    Atualmente, o OpenClaw encaminha apenas os controles de imagem compartilhados entre provedores;
    essas opções exclusivas do provedor nativo não são expostas por meio de `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Conversão de texto em fala">
    O Plugin integrado `xai` registra a conversão de texto em fala por meio da superfície
    compartilhada do provedor `tts`.

    - Vozes: catálogo autenticado em tempo real da xAI; liste-o com
      `openclaw infer tts voices --provider xai`
    - Vozes alternativas offline: `ara`, `eve`, `leo`, `rex`, `sal`
    - Voz padrão: `eve`
    - IDs de vozes personalizadas da conta são encaminhados mesmo quando estão ausentes da
      resposta do catálogo integrado
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: substituição de velocidade nativa do provedor
    - O formato nativo Opus de mensagem de voz não é compatível

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
    O OpenClaw usa o endpoint em lote `/v1/tts` da xAI para síntese com buffer,
    a descoberta autenticada do catálogo `/v1/tts/voices` e o recurso nativo
    `wss://api.x.ai/v1/tts` para síntese por streaming. O streaming é restrito ao
    host nativo `api.x.ai`, portanto valores personalizados de `baseUrl` são rejeitados nesse
    caminho. Ele usa os controles existentes de idioma, voz, codec e velocidade; os
    padrões da xAI são aplicados à taxa de amostragem e à taxa de bits. A síntese de arquivos
    de áudio respeita todos os codecs configurados. Destinos de mensagens de voz usam MP3 para streaming e
    alternativa com buffer porque os codecs brutos da xAI não contêm metadados de codec/taxa. O
    stream envia `text.delta` e depois
    `text.done`, recebe `audio.delta`, `audio.done` ou `error` e aplica um
    `timeoutMs` de inatividade que é renovado a cada bloco de áudio. Ele é separado das
    sessões de voz em tempo real. Consulte o contrato da [API de TTS por streaming](https://docs.x.ai/developers/rest-api-reference/inference/voice) da xAI.
    </Note>

  </Accordion>

  <Accordion title="Conversão de fala em texto">
    O Plugin integrado `xai` registra a conversão de fala em texto em lote por meio da
    superfície de transcrição para compreensão de mídia do OpenClaw.

    - Endpoint: REST da xAI `/v1/stt`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Seleção de modelo: a xAI escolhe o modelo de transcrição internamente; o
      endpoint não tem seletor de modelo
    - Usado sempre que a transcrição de áudio recebido lê `tools.media.audio`,
      incluindo segmentos de canais de voz do Discord e anexos de áudio dos canais

    Para forçar o uso da xAI na transcrição de áudio recebido:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    O idioma pode ser fornecido pela configuração compartilhada de mídia de áudio ou pela solicitação
    de transcrição de cada chamada. Dicas de prompt são aceitas pela superfície compartilhada do
    OpenClaw, mas a integração REST de STT da xAI encaminha apenas o arquivo e o idioma
    porque eles correspondem ao endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Conversão de fala em texto por streaming">
    O Plugin integrado `xai` também registra um provedor de transcrição em tempo real
    para áudio de chamadas de voz ao vivo.

    - Endpoint: WebSocket da xAI `wss://api.x.ai/v1/stt`
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Detecção de fim de fala padrão: `800ms`
    - Transcrições provisórias: ativadas por padrão

    O stream de mídia do Twilio do Voice Call envia quadros de áudio G.711 mu-law, portanto o
    provedor xAI encaminha esses quadros diretamente, sem transcodificação:

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
    Este provedor de streaming se destina ao caminho de transcrição em tempo real do Voice Call.
    A voz do Discord grava segmentos curtos e usa o caminho de transcrição em lote
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real (Talk)">
    O Plugin integrado `xai` registra sessões em tempo real do Grok Voice Agent para
    o modo Talk por meio do contrato compartilhado `registerRealtimeVoiceProvider`.

    - Endpoint: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Modelo padrão: `grok-voice-latest`
    - Voz padrão: `eve`
    - Transporte: `gateway-relay` (caminhos de retransmissão do iOS, Android e Control UI)
    - Áudio: PCM16 24 kHz ou G.711 µ-law 8 kHz
    - Interrupção: o VAD do servidor da xAI interrompe a resposta; o OpenClaw limpa a reprodução na fila
      e trunca o histórico não reproduzido do provedor

    Configure o Talk no Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Ative somente se a reprodução da sessão no lado do provedor for aceitável.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    A configuração pertencente ao provedor também é resolvida de
    `plugins.entries.voice-call.config.realtime.providers.xai` quando o Voice Call
    ou seletores compartilhados em tempo real reutilizam o mesmo mapa de provedores. As chaves compatíveis são
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` e `sessionResumption`.
    `reasoningEffort` aceita apenas `high` ou `none`, de acordo com a API Voice Agent da xAI.

    O VAD do servidor da xAI sempre cria respostas e processa interrupções de áudio.
    Use `consultRouting: "provider-direct"`; o roteamento forçado de transcrições e a desativação
    da interrupção do áudio de entrada não são compatíveis com o protocolo Voice Agent da xAI.

    <Note>
    O OAuth da xAI ou `XAI_API_KEY` pode autenticar a voz em tempo real. O WebRTC controlado
    pelo navegador ainda não faz parte dessa superfície do provedor; use o Talk com retransmissão pelo Gateway em
    Nodes nativos ou o caminho de retransmissão da Control UI.
    </Note>

    <Note>
    `sessionResumption` usa `false` como padrão. Quando definido como `true`, o OpenClaw solicita
    à xAI que mantenha estado suficiente da sessão para retomar a mesma conversa após uma
    reconexão e, em seguida, reconecta usando o ID de conversa retornado. Mantenha-o
    desativado quando a reprodução/retenção no lado do provedor não for aceitável; nesse caso, soquetes
    interrompidos falham de forma fechada, em vez de iniciar silenciosamente uma nova conversa.
    </Note>

  </Accordion>

  <Accordion title="Configuração do x_search">
    O Plugin integrado da xAI expõe `x_search` como uma ferramenta do OpenClaw para
    pesquisar conteúdo do X (antigo Twitter) por meio do Grok.

    Caminho da configuração: `plugins.entries.xai.config.xSearch`

    | Chave               | Tipo    | Padrão                   | Descrição                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Automático para modelos da xAI  | Desative ou ative para um provedor conhecido que não seja da xAI |
    | `model`           | string  | `grok-4.3`                | Modelo usado para solicitações de x_search                 |
    | `baseUrl`         | string  | -                         | Substituição da URL base de Responses da xAI                  |
    | `inlineCitations` | boolean | -                         | Incluir citações embutidas nos resultados              |
    | `maxTurns`        | number  | -                         | Número máximo de turnos da conversa                       |
    | `timeoutSeconds`  | number  | `30`                      | Tempo limite da solicitação em segundos                       |
    | `cacheTtlMinutes` | number  | `15`                      | Tempo de vida do cache em minutos                    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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

  <Accordion title="Configuração da execução de código">
    O Plugin integrado da xAI expõe `code_execution` como uma ferramenta do OpenClaw para
    execução remota de código no ambiente de sandbox da xAI.

    Caminho da configuração: `plugins.entries.xai.config.codeExecution`

    | Chave              | Tipo    | Padrão                  | Descrição                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | Automático para modelos da xAI | Desative ou ative para um provedor conhecido que não seja da xAI |
    | `model`          | string  | `grok-4.3`               | Modelo usado para solicitações de execução de código           |
    | `maxTurns`       | number  | -                        | Número máximo de turnos da conversa                       |
    | `timeoutSeconds` | number  | `30`                     | Tempo limite da solicitação em segundos                       |

    <Note>
    Esta é uma execução remota no sandbox da xAI, não uma execução local de [`exec`](/pt-BR/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limitações conhecidas">
    - A autenticação da xAI pode usar uma chave de API, variável de ambiente, fallback
      de configuração de plugin ou OAuth com uma conta xAI elegível. O OAuth usa
      verificação por código de dispositivo sem um callback de localhost. A xAI decide quais contas
      podem receber tokens de API OAuth, e a página de consentimento pode exibir o Grok Build,
      embora o OpenClaw não exija o aplicativo Grok Build.
    - Atualmente, o OpenClaw não disponibiliza a família de modelos multiagente da xAI. A xAI
      fornece esses modelos por meio da Responses API, mas eles não aceitam
      as ferramentas do lado do cliente ou personalizadas usadas pelo loop de agente compartilhado do OpenClaw.
      Consulte as
      [limitações dos modelos multiagente da xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Atualmente, a voz em tempo real da xAI disponibiliza apenas o transporte de conversação por retransmissão do Gateway.
      As sessões WebSocket do provedor controladas pelo navegador ainda não estão integradas
      à interface de controle.
    - A imagem `quality`, a imagem `mask` e as proporções adicionais exclusivas do modo nativo
      não são disponibilizadas até que a ferramenta compartilhada `image_generate` tenha controles
      correspondentes entre provedores.
  </Accordion>

  <Accordion title="Notas avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para esquemas e chamadas de ferramentas
      no caminho compartilhado do executor.
    - As solicitações nativas da xAI usam `tool_stream: true` por padrão. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false`
      para desativá-lo.
    - O wrapper integrado da xAI remove limites de contagem de ocorrências não compatíveis nos esquemas
      e chaves de carga útil de *esforço* de raciocínio não compatíveis antes de enviar solicitações
      nativas da xAI. O Grok 4.5 oferece suporte a esforço baixo, médio e
      alto (padrão: alto). O Grok 4.3 oferece suporte a esforço nenhum, baixo, médio e alto
      (padrão: baixo). Outros modelos da xAI com capacidade de raciocínio não disponibilizam um
      controle de esforço configurável, mas ainda solicitam
      `include: ["reasoning.encrypted_content"]` para que o raciocínio criptografado anterior
      possa ser reproduzido em interações subsequentes.
    - `web_search`, `x_search` e `code_execution` são disponibilizados como ferramentas do OpenClaw.
      O OpenClaw anexa à solicitação de cada ferramenta somente o recurso integrado específico da xAI
      necessário para ela, em vez de anexar todas as ferramentas nativas a cada
      interação do chat.
    - O `web_search` do Grok lê `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lê `plugins.entries.xai.config.xSearch.baseUrl` e, em seguida,
      usa como alternativa a URL base de pesquisa na web do Grok.
    - `x_search` e `code_execution` pertencem ao plugin integrado da xAI,
      em vez de serem codificados diretamente no runtime principal do modelo.
    - `code_execution` é uma execução remota no sandbox da xAI, não uma execução local
      de [`exec`](/pt-BR/tools/exec).
  </Accordion>
</AccordionGroup>

## Testes em ambiente real

Os caminhos de mídia da xAI são cobertos por testes de unidade e suítes ao vivo opcionais. Exporte
`XAI_API_KEY` no ambiente do processo antes de executar as verificações ao vivo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo ao vivo específico do provedor sintetiza TTS normal, TTS PCM adequado para telefonia, transcreve áudio pelo STT em lote da xAI, transmite o mesmo PCM pelo STT em tempo real da xAI, gera uma saída de texto para imagem e edita uma imagem de referência.
O arquivo ao vivo compartilhado de imagens verifica o mesmo provedor xAI por meio da seleção de runtime, fallback, normalização e caminho de anexos de mídia do OpenClaw. O caso opcional do Video 1.5 envia uma imagem gerada para o primeiro quadro em 1080P e verifica o download do vídeo concluído.

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Todos os provedores" href="/pt-BR/providers/index" icon="grid-2">
    Uma visão geral mais ampla dos provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
