---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando a autenticação da xAI ou os IDs de modelo
summary: Use modelos Grok da xAI no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T00:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

O OpenClaw inclui um plugin de provedor `xai` integrado para os modelos Grok. O
caminho recomendado é o OAuth do Grok com uma assinatura SuperGrok ou X Premium
qualificada. Gateway, configuração, roteamento e ferramentas permanecem locais;
somente as solicitações do Grok são enviadas à API da xAI.

O OAuth não exige uma chave de API da xAI nem o aplicativo Grok Build. A xAI
ainda pode mostrar o Grok Build na tela de consentimento porque o OpenClaw usa o
cliente OAuth compartilhado da xAI.

## Configuração

<Steps>
  <Step title="Nova instalação">
    Execute a integração inicial com a instalação do daemon e selecione o OAuth
    da xAI/Grok na etapa de modelo/autenticação:

    ```bash
    openclaw onboard --install-daemon
    ```

    Em um VPS ou por SSH, selecione diretamente o OAuth da xAI; ele usa
    verificação por código de dispositivo e não precisa de um callback no
    localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Instalação existente">
    Entre somente na xAI; não execute novamente toda a integração inicial apenas
    para conectar o Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Defina o Grok como modelo padrão separadamente:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Execute novamente toda a integração inicial somente se quiser
    intencionalmente alterar o Gateway, daemon, canal, espaço de trabalho ou
    outras opções de configuração.

  </Step>
  <Step title="Caminho com chave de API">
    A configuração com chave de API continua funcionando para chaves do xAI
    Console e para recursos de mídia que precisam de uma configuração de
    provedor baseada em chave:

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
O OpenClaw usa a API Responses da xAI como transporte xAI integrado. A mesma
credencial de `openclaw models auth login --provider xai --method oauth` ou
`--method api-key` também fornece acesso a `web_search` (ID de provedor `grok`),
`x_search`, `code_execution`, síntese/transcrição de fala e geração de
imagens/vídeos da xAI. Se você armazenar uma chave da xAI em
`plugins.entries.xai.config.webSearch.apiKey`, o provedor de modelos xAI
integrado também a reutilizará como alternativa.
</Note>

## Solução de problemas do OAuth

- Para SSH, Docker, VPS ou outras configurações remotas, use
  `openclaw models auth login --provider xai --method oauth`; ele usa
  verificação por código de dispositivo, não um callback no localhost.
- Se a entrada for bem-sucedida, mas o Grok não for o modelo padrão, execute
  `openclaw models set xai/grok-4.3`.
- Inspecione os perfis de autenticação da xAI salvos:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- A xAI decide quais contas podem receber tokens de API por OAuth. Se uma conta
  não for qualificada, use o caminho com chave de API ou verifique a assinatura
  junto à xAI.

<Tip>
Use `xai-oauth` ao entrar por SSH, Docker ou VPS. O OpenClaw exibe uma URL e um
código curto; conclua a entrada em qualquer navegador local enquanto o processo
remoto consulta a xAI para verificar a conclusão da troca do token.
</Tip>

## Catálogo integrado

IDs selecionáveis nos seletores de modelos. O plugin ainda resolve IDs antigos
do Grok 3, Grok 4, Grok 4 Fast, Grok 4.1 Fast e Grok Code para configurações
existentes; consulte [compatibilidade legada e aliases móveis](#legacy-compatibility-and-moving-aliases).

| Família        | IDs de modelo                                                 |
| -------------- | ------------------------------------------------------------- |
| Grok 4.5       | `grok-4.5` (aliases: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                              |
| Grok 4.3       | `grok-4.3` (aliases: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Use `grok-4.5` para conversas gerais, programação e trabalho com agentes onde
ele estiver disponível. O Grok 4.3 continua sendo o padrão de configuração
seguro entre regiões; `grok-build-0.1` e ambas as variantes datadas do Grok 4.20
continuam selecionáveis.
</Tip>

## Cobertura de recursos

O plugin integrado mapeia as APIs compatíveis da xAI para os contratos
compartilhados de ferramentas e provedores do OpenClaw. Os recursos que não se
encaixam no contrato compartilhado estão listados abaixo ou na seção de
limitações conhecidas.

| Recurso da xAI                    | Recurso do OpenClaw                     | Status                                                                |
| --------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Conversa / Responses              | Provedor de modelos `xai/<model>`       | Sim                                                                   |
| Pesquisa na Web no servidor       | Provedor `grok` de `web_search`         | Sim                                                                   |
| Pesquisa no X no servidor         | Ferramenta `x_search`                   | Sim                                                                   |
| Execução de código no servidor    | Ferramenta `code_execution`             | Sim                                                                   |
| Imagens                           | `image_generate`                        | Sim                                                                   |
| Vídeos                            | `video_generate`                        | Fluxo de trabalho clássico completo; imagem para vídeo com Video 1.5  |
| Texto para fala em lote           | `messages.tts.provider: "xai"` / `tts`  | Sim                                                                   |
| TTS por streaming                 | -                                       | Ainda não implementado pelo provedor xAI                              |
| Fala para texto em lote           | Compreensão de mídia `tools.media.audio` | Sim                                                                  |
| Fala para texto por streaming     | Voice Call `streaming.provider: "xai"`  | Sim                                                                   |
| Voz em tempo real                 | -                                       | Ainda não exposta; exige outro contrato de sessão/WebSocket           |
| Arquivos / lotes                  | Somente compatibilidade genérica da API de modelos | Não é uma ferramenta de primeira classe do OpenClaw        |

<Note>
O OpenClaw usa as APIs REST de imagem/vídeo/TTS/STT da xAI para geração de mídia
e transcrição em lote, o WebSocket de STT por streaming da xAI para transcrição
ao vivo de chamadas de voz e a API Responses para ferramentas de conversa,
pesquisa e execução de código.
</Note>

### Compatibilidade legada do modo rápido

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
ainda reescreve configurações antigas da xAI da seguinte forma. Esses IDs de
destino são mantidos apenas para compatibilidade; use os modelos selecionáveis
atuais para novas configurações.

| Modelo de origem | Destino do modo rápido |
| ---------------- | ---------------------- |
| `grok-3`         | `grok-3-fast`          |
| `grok-3-mini`    | `grok-3-mini-fast`     |
| `grok-4`         | `grok-4-fast`          |
| `grok-4-0709`    | `grok-4-fast`          |

### Compatibilidade legada e aliases móveis

Aliases antigos são normalizados da seguinte forma:

| Alias legado                                                   | ID normalizado    |
| -------------------------------------------------------------- | ----------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1`  |

Os IDs datados 0309 são as entradas selecionáveis do catálogo. O OpenClaw envia
todos os outros aliases atuais do Grok 4.20 sem alterações para que a xAI
mantenha o controle da semântica dos aliases estáveis, mais recentes, beta,
experimentais e datados. O alias global `grok-latest` também é preservado sem
alterações.

A xAI descontinuou os seguintes IDs exatos. O OpenClaw os mantém como linhas
ocultas de compatibilidade para configurações já distribuídas, com os limites e
preços dos destinos de redirecionamento atuais:

| IDs descontinuados                                                    | Comportamento atual                      |
| --------------------------------------------------------------------- | --------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 com raciocínio `low`           |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 com raciocínio desativado      |
| `grok-code-fast-1`                                                    | Grok Build 0.1                          |
| `grok-imagine-image-pro`                                              | Grok Imagine Image Quality              |

`openclaw doctor --fix` atualiza os padrões persistidos das ferramentas de
servidor da xAI e o slug descontinuado de imagem de qualidade, remove linhas
obsoletas do catálogo gerado e corrige metadados de contexto obsoletos nas
linhas 4.20 ativas. Ele não fixa aliases `beta-latest` ativos do 4.20 em um
snapshot datado.

## Recursos

<Warning>
  `x_search` e `code_execution` são executados nos servidores da xAI. A xAI
  cobra US$ 5 por 1.000 chamadas de ferramentas, além dos tokens de entrada e
  saída do modelo. Quando a configuração `enabled` de cada ferramenta é
  omitida, o OpenClaw a expõe somente para um modelo xAI ativo. Um provedor de
  modelos conhecido que não seja da xAI exige `enabled: true` explícito por
  ferramenta; um provedor ausente ou não resolvido falha de modo fechado. A
  autenticação da xAI é sempre obrigatória, e `enabled: false` desativa a
  ferramenta para todos os provedores.
</Warning>

<AccordionGroup>
  <Accordion title="Pesquisa na Web">
    O provedor integrado de pesquisa na Web `grok` prefere o OAuth da xAI e,
    em seguida, usa `XAI_API_KEY` ou uma chave de pesquisa na Web do plugin como
    alternativa:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeos">
    O plugin `xai` integrado registra a geração de vídeos por meio da ferramenta
    compartilhada `video_generate`.

    - Modelo padrão: `xai/grok-imagine-video`
    - Modelo adicional: `xai/grok-imagine-video-1.5`
    - Modos clássicos: texto para vídeo, imagem para vídeo, geração com imagem
      de referência, edição remota de vídeo e extensão remota de vídeo
    - Modo Video 1.5: somente imagem para vídeo, com exatamente uma imagem de
      primeiro quadro
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`; quando
      omitida, a geração clássica e a geração de imagem para vídeo com Video
      1.5 herdam a proporção da imagem de origem
    - Resoluções: modo clássico `480P`/`720P`; o Video 1.5 também aceita
      `1080P`; todos os modos de geração usam `480P` por padrão
    - Duração: de 1 a 15 segundos para geração/imagem para vídeo, de 1 a 10
      segundos ao usar funções clássicas `reference_image` e de 2 a 10 segundos
      para extensão clássica
    - Geração com imagem de referência: defina `imageRoles` como
      `reference_image` para cada imagem fornecida; a xAI aceita até 7 dessas
      imagens
    - A edição/extensão de vídeo herda a proporção e a resolução do vídeo de
      entrada; essas operações não aceitam substituições de geometria
    - Tempo limite padrão da operação: 600 segundos, a menos que
      `video_generate.timeoutMs` ou
      `agents.defaults.videoGenerationModel.timeoutMs` esteja definido

    <Warning>
    Buffers de vídeo locais não são aceitos. Use URLs `http(s)` remotas para
    entradas de edição/extensão de vídeo. A geração de imagem para vídeo aceita
    buffers de imagem locais porque o OpenClaw os codifica como URLs de dados
    para a xAI.
    </Warning>

    O Video 1.5 também reconhece os identificadores
    `grok-imagine-video-1.5-preview` e
    `grok-imagine-video-1.5-2026-05-30` da xAI. O OpenClaw encaminha o
    identificador selecionado sem alterações, mas aplica a mesma validação
    exclusiva para imagens.

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
    Consulte [Geração de vídeos](/pt-BR/tools/video-generation) para ver os parâmetros
    compartilhados da ferramenta, a seleção de provedor e o comportamento de
    failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de imagens">
    O plugin `xai` integrado registra a geração de imagens por meio da
    ferramenta compartilhada `image_generate`.

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

    O OpenClaw solicita à xAI respostas de imagem em `b64_json` para que a mídia gerada possa ser
    armazenada e entregue pelo fluxo normal de anexos do canal. Imagens de
    referência locais são convertidas em URLs de dados; referências remotas `http(s)`
    são repassadas sem alterações.

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
    essas opções exclusivas do provedor nativo não são expostas por `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto para fala">
    O plugin `xai` incluído registra a conversão de texto para fala por meio da interface compartilhada do
    provedor `tts`.

    - Vozes: catálogo autenticado e atualizado da xAI; liste-o com
      `openclaw infer tts voices --provider xai`
    - Vozes alternativas sem conexão: `ara`, `eve`, `leo`, `rex`, `sal`
    - Voz padrão: `eve`
    - IDs de vozes personalizadas da conta são encaminhados mesmo quando não estão presentes na
      resposta do catálogo integrado
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: substituição de velocidade nativa do provedor
    - O formato nativo de mensagem de voz Opus não é compatível

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
    O OpenClaw usa o endpoint em lote `/v1/tts` e o catálogo autenticado
    `/v1/tts/voices` da xAI. A xAI também oferece TTS por streaming via WebSocket, mas
    o provedor xAI incluído ainda não implementa essa integração de streaming.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O plugin `xai` incluído registra a conversão de fala para texto em lote por meio da
    interface de transcrição de compreensão de mídia do OpenClaw.

    - Endpoint: REST `/v1/stt` da xAI
    - Caminho de entrada: envio de arquivo de áudio multipart
    - Seleção de modelo: a xAI escolhe internamente o modelo de transcrição; o
      endpoint não possui seletor de modelo
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

    O idioma pode ser fornecido pela configuração compartilhada de mídia de áudio ou pela solicitação de
    transcrição de cada chamada. A interface compartilhada do OpenClaw aceita sugestões de prompt,
    mas a integração REST de STT da xAI encaminha apenas o arquivo e o idioma,
    pois esses campos correspondem ao endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Fala para texto por streaming">
    O plugin `xai` incluído também registra um provedor de transcrição em tempo real
    para áudio de chamadas de voz ao vivo.

    - Endpoint: WebSocket `wss://api.x.ai/v1/stt` da xAI
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Detecção de fim de fala padrão: `800ms`
    - Transcrições provisórias: ativadas por padrão

    O fluxo de mídia do Twilio do Voice Call envia quadros de áudio G.711 mu-law, portanto o
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
    Este provedor de streaming destina-se ao fluxo de transcrição em tempo real do Voice Call.
    O Discord grava segmentos curtos e usa, em vez disso, o fluxo de transcrição em lote
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O plugin xAI incluído expõe `x_search` como uma ferramenta do OpenClaw para
    pesquisar conteúdo do X (antigo Twitter) por meio do Grok.

    Caminho da configuração: `plugins.entries.xai.config.xSearch`

    | Chave             | Tipo    | Padrão                    | Descrição                                                |
    | ----------------- | ------- | ------------------------- | -------------------------------------------------------- |
    | `enabled`         | boolean | Automático para modelos xAI | Desative ou habilite para um provedor conhecido que não seja xAI |
    | `model`           | string  | `grok-4.3`                | Modelo usado nas solicitações de x_search                |
    | `baseUrl`         | string  | -                         | Substituição da URL base de Responses da xAI             |
    | `inlineCitations` | boolean | -                         | Inclui citações em linha nos resultados                  |
    | `maxTurns`        | number  | -                         | Número máximo de turnos da conversa                      |
    | `timeoutSeconds`  | number  | `30`                      | Tempo limite da solicitação em segundos                  |
    | `cacheTtlMinutes` | number  | `15`                      | Tempo de vida do cache em minutos                        |

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
    O plugin xAI incluído expõe `code_execution` como uma ferramenta do OpenClaw para
    execução remota de código no ambiente de sandbox da xAI.

    Caminho da configuração: `plugins.entries.xai.config.codeExecution`

    | Chave            | Tipo    | Padrão                    | Descrição                                                |
    | ---------------- | ------- | ------------------------- | -------------------------------------------------------- |
    | `enabled`        | boolean | Automático para modelos xAI | Desative ou habilite para um provedor conhecido que não seja xAI |
    | `model`          | string  | `grok-4.3`                | Modelo usado nas solicitações de execução de código      |
    | `maxTurns`       | number  | -                         | Número máximo de turnos da conversa                      |
    | `timeoutSeconds` | number  | `30`                      | Tempo limite da solicitação em segundos                  |

    <Note>
    Esta é uma execução remota na sandbox da xAI, não o [`exec`](/pt-BR/tools/exec) local.
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
    - A autenticação da xAI pode usar uma chave de API, variável de ambiente, configuração
      alternativa do plugin ou OAuth com uma conta xAI qualificada. O OAuth usa verificação
      por código de dispositivo sem retorno de chamada para localhost. A xAI decide quais contas
      podem receber tokens de API OAuth, e a página de consentimento pode exibir Grok Build,
      embora o OpenClaw não exija o aplicativo Grok Build.
    - Atualmente, o OpenClaw não expõe a família de modelos multiagente da xAI. A xAI
      disponibiliza esses modelos pela API Responses, mas eles não aceitam
      as ferramentas do lado do cliente ou personalizadas usadas pelo loop de agentes compartilhado do OpenClaw.
      Consulte as
      [limitações dos modelos multiagente da xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - A voz em tempo real da xAI ainda não está registrada como um provedor do OpenClaw. Ela
      exige um contrato diferente de sessão de voz bidirecional em relação ao STT em lote
      ou à transcrição por streaming.
    - A `quality` de imagem, a `mask` de imagem e a proporção nativa `auto` da xAI
      não são expostas até que a ferramenta compartilhada `image_generate` tenha controles
      correspondentes entre provedores.
  </Accordion>

  <Accordion title="Notas avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para esquemas
      e chamadas de ferramentas no fluxo compartilhado do executor.
    - As solicitações nativas da xAI usam `tool_stream: true` por padrão. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false`
      para desativá-lo.
    - O wrapper xAI incluído remove limites de esquema de contagem de itens não compatíveis
      e chaves de carga de *esforço* de raciocínio não compatíveis antes de enviar solicitações
      nativas à xAI. O Grok 4.5 aceita esforço baixo, médio e
      alto (alto por padrão). O Grok 4.3 aceita nenhum, baixo, médio e alto
      (baixo por padrão). Outros modelos xAI com capacidade de raciocínio não expõem um
      controle de esforço configurável, mas ainda solicitam
      `include: ["reasoning.encrypted_content"]` para que o raciocínio criptografado anterior
      possa ser reutilizado em turnos subsequentes.
    - `web_search`, `x_search` e `code_execution` são expostos como ferramentas do OpenClaw.
      O OpenClaw anexa apenas o recurso integrado específico da xAI necessário para cada ferramenta
      à solicitação dessa ferramenta, em vez de anexar todas as ferramentas nativas a cada
      turno da conversa.
    - O `web_search` do Grok lê `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lê `plugins.entries.xai.config.xSearch.baseUrl` e depois
      recorre à URL base da pesquisa na web do Grok.
    - `x_search` e `code_execution` pertencem ao plugin xAI incluído,
      em vez de serem codificados diretamente no runtime principal do modelo.
    - `code_execution` é uma execução remota na sandbox da xAI, não o
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Testes ao vivo

Os fluxos de mídia da xAI são cobertos por testes unitários e conjuntos de testes ao vivo opcionais. Exporte
`XAI_API_KEY` no ambiente do processo antes de executar verificações ao vivo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo live específico do provedor sintetiza TTS normal, TTS PCM adequado para telefonia, transcreve áudio por meio do STT em lote da xAI, transmite o mesmo PCM por meio do STT em tempo real da xAI, gera saída de texto para imagem e edita uma imagem de referência.
O arquivo live compartilhado de imagens verifica o mesmo provedor xAI por meio do caminho de seleção em tempo de execução, fallback, normalização e anexação de mídia do OpenClaw. O caso opcional do Video 1.5 envia uma imagem gerada para o primeiro quadro em 1080P e verifica o download do vídeo concluído.

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Todos os provedores" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais abrangente dos provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
