---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando a autenticação da xAI ou IDs de modelo
summary: Use modelos xAI Grok no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:07:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

O OpenClaw inclui um Plugin de provedor `xai` integrado para modelos Grok. Para a maioria
dos usuários, o caminho recomendado é o OAuth do Grok com uma assinatura SuperGrok ou X Premium
qualificada. O OpenClaw permanece local-first: o Gateway, a configuração, o roteamento e as
ferramentas são executados na sua máquina, enquanto as solicitações de modelo do Grok se autenticam pelo xAI
e são enviadas para a API da xAI.

O OAuth não exige uma chave de API da xAI e não exige o aplicativo Grok Build.
A xAI ainda pode mostrar Grok Build na tela de consentimento porque o OpenClaw usa
o cliente OAuth compartilhado da xAI.

## Escolha seu caminho de configuração

Use o caminho que corresponde ao estado da sua instalação do OpenClaw:

<Steps>
  <Step title="Nova instalação do OpenClaw">
    Execute o onboarding com instalação do daemon quando estiver configurando um novo Gateway
    local e, em seguida, escolha a opção de OAuth xAI/Grok na etapa de modelo/autenticação:

    ```bash
    openclaw onboard --install-daemon
    ```

    Em um VPS ou via SSH, selecione o OAuth da xAI diretamente; o OpenClaw usa verificação por
    código de dispositivo e não exige um callback localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    O OAuth não exige uma chave de API da xAI. O OpenClaw não exige o aplicativo Grok
    Build. A xAI ainda pode rotular o aplicativo de consentimento como Grok Build porque
    o OpenClaw usa o cliente OAuth compartilhado da xAI.

  </Step>
  <Step title="Instalação existente do OpenClaw">
    Se o OpenClaw já estiver configurado, entre somente na xAI. Não execute novamente o
    onboarding completo nem reinstale o daemon apenas para conectar o Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Para tornar o Grok o modelo padrão depois de entrar, aplique isso separadamente:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Execute novamente o onboarding completo somente se você quiser alterar intencionalmente o Gateway,
    daemon, canal, workspace ou outras escolhas de configuração.

  </Step>
  <Step title="Caminho com chave de API">
    A configuração com chave de API ainda funciona para chaves do xAI Console e para superfícies de mídia que
    exigem configuração de provedor baseada em chave:

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
O OpenClaw usa a API Responses da xAI como o transporte xAI integrado. A mesma
credencial de `openclaw models auth login --provider xai --method oauth` ou
`openclaw models auth login --provider xai --method api-key` também pode alimentar recursos first-class de
`web_search`, `x_search`, `code_execution` remoto e geração de imagens/vídeos da xAI.
Fala e transcrição atualmente exigem `XAI_API_KEY` ou configuração de provedor.
`web_search` com Grok prefere OAuth da xAI e recorre a `XAI_API_KEY` ou à
configuração de pesquisa na web do plugin.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provedor de modelo xAI integrado também reutilizará essa chave como fallback.
Defina `plugins.entries.xai.config.webSearch.baseUrl` para rotear o `web_search` do Grok
e, por padrão, o `x_search` por meio de um proxy da API Responses da xAI do operador.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.
</Note>

## Solução de problemas do OAuth

- Para SSH, Docker, VPS ou outras configurações remotas, use
  `openclaw models auth login --provider xai --method oauth`; o OAuth da xAI usa
  verificação por código de dispositivo em vez de um callback localhost.
- Se o login for bem-sucedido, mas o Grok não for o modelo padrão, execute
  `openclaw models set xai/grok-4.3`.
- Para inspecionar perfis de autenticação xAI salvos, execute:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- A xAI decide quais contas podem receber tokens de API OAuth. Se uma conta não for
  qualificada, tente o caminho com chave de API ou verifique a assinatura no lado da xAI.

<Tip>
Use `xai-oauth` ao entrar via SSH, Docker ou VPS. O OpenClaw imprime uma
URL da xAI e um código curto; conclua o login em qualquer navegador local enquanto o processo
remoto consulta a xAI pelo token exchange concluído.
</Tip>

## Catálogo integrado

O OpenClaw inclui os modelos de chat xAI atuais por padrão, ordenados do mais recente
para o mais antigo nos seletores de modelo:

| Família        | IDs de modelo                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

O plugin ainda resolve encaminhamentos de slugs antigos do Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast e Grok Code para configurações existentes. Aliases oficiais do Grok Code Fast
são normalizados para `grok-build-0.1`; o OpenClaw não mostra mais os outros slugs
upstream aposentados no catálogo selecionável.

<Tip>
Use `grok-4.3` para chat geral e `grok-build-0.1` para cargas de trabalho focadas
em build/codificação, a menos que você precise explicitamente de um alias beta do Grok 4.20.
</Tip>

## Cobertura de recursos do OpenClaw

O plugin integrado mapeia a superfície atual da API pública da xAI para os contratos
compartilhados de provedor e ferramentas do OpenClaw. Capacidades que não se encaixam no contrato compartilhado
(por exemplo, TTS em streaming e voz em tempo real) não são expostas - veja a tabela
abaixo.

| Capacidade da xAI          | Superfície do OpenClaw                    | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | provedor de modelo `xai/<model>`          | Sim                                                                 |
| Pesquisa web no servidor   | provedor `web_search` `grok`              | Sim                                                                 |
| Pesquisa X no servidor     | ferramenta `x_search`                     | Sim                                                                 |
| Execução de código no servidor | ferramenta `code_execution`            | Sim                                                                 |
| Imagens                    | `image_generate`                          | Sim                                                                 |
| Vídeos                     | `video_generate`                          | Sim                                                                 |
| Texto para fala em lote    | `messages.tts.provider: "xai"` / `tts`    | Sim                                                                 |
| TTS em streaming           | -                                         | Não exposto; o contrato TTS do OpenClaw retorna buffers de áudio completos |
| Fala para texto em lote    | `tools.media.audio` / compreensão de mídia | Sim                                                                |
| Fala para texto em streaming | Voice Call `streaming.provider: "xai"`  | Sim                                                                 |
| Voz em tempo real          | -                                         | Ainda não exposto; contrato de sessão/WebSocket diferente           |
| Arquivos / lotes           | Somente compatibilidade genérica com API de modelo | Não é uma ferramenta first-class do OpenClaw                    |

<Note>
O OpenClaw usa as APIs REST de imagem/vídeo/TTS/STT da xAI para geração de mídia,
fala e transcrição em lote, o WebSocket de STT em streaming da xAI para transcrição
de chamadas de voz ao vivo e a API Responses para ferramentas de modelo, pesquisa e
execução de código. Recursos que precisam de contratos diferentes do OpenClaw, como
sessões de voz em tempo real, são documentados aqui como capacidades upstream, em vez
de comportamento oculto do plugin.
</Note>

### Mapeamentos de modo rápido

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescreve solicitações nativas da xAI da seguinte forma:

| Modelo de origem | Destino do modo rápido |
| ---------------- | ---------------------- |
| `grok-3`         | `grok-3-fast`          |
| `grok-3-mini`    | `grok-3-mini-fast`     |
| `grok-4`         | `grok-4-fast`          |
| `grok-4-0709`    | `grok-4-fast`          |

### Aliases de compatibilidade legada

Aliases legados ainda são normalizados para os IDs integrados canônicos:

| Alias legado              | ID canônico                            |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Recursos

<AccordionGroup>
  <Accordion title="Pesquisa web">
    O provedor de pesquisa web `grok` integrado prefere OAuth da xAI e, depois, recorre
    a `XAI_API_KEY` ou a uma chave de pesquisa web do plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeo">
    O plugin `xai` integrado registra geração de vídeo por meio da ferramenta compartilhada
    `video_generate`.

    - Modelo de vídeo padrão: `xai/grok-imagine-video`
    - Modos: texto para vídeo, imagem para vídeo, geração com imagem de referência, edição de vídeo
      remoto e extensão de vídeo remoto
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluções: `480P`, `720P`
    - Duração: 1-15 segundos para geração/imagem para vídeo, 1-10 segundos ao
      usar funções `reference_image`, 2-10 segundos para extensão
    - Geração com imagem de referência: defina `imageRoles` como `reference_image` para
      cada imagem fornecida; a xAI aceita até 7 dessas imagens
    - Tempo limite padrão da operação: 600 segundos, a menos que `video_generate.timeoutMs`
      ou `agents.defaults.videoGenerationModel.timeoutMs` esteja definido

    <Warning>
    Buffers de vídeo locais não são aceitos. Use URLs `http(s)` remotas para
    entradas de edição/extensão de vídeo. Imagem para vídeo aceita buffers de imagem locais porque
    o OpenClaw pode codificá-los como URLs de dados para a xAI.
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
    Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros de ferramenta compartilhados,
    seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de imagem">
    O plugin `xai` integrado registra geração de imagem por meio da ferramenta compartilhada
    `image_generate`.

    - Modelo de imagem padrão: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-quality`
    - Modos: texto para imagem e edição com imagem de referência
    - Entradas de referência: uma `image` ou até cinco `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Quantidade: até 4 imagens
    - Tempo limite padrão da operação: 600 segundos, a menos que `image_generate.timeoutMs`
      ou `agents.defaults.imageGenerationModel.timeoutMs` esteja definido

    O OpenClaw solicita à xAI respostas de imagem `b64_json` para que a mídia gerada possa ser
    armazenada e entregue pelo caminho normal de anexos do canal. Imagens de referência
    locais são convertidas em URLs de dados; referências remotas `http(s)` são
    repassadas.

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
    adicionais, como `1:2`, `2:1`, `9:20` e `20:9`. Hoje, o OpenClaw encaminha
    apenas os controles de imagem compartilhados entre provedores; controles
    nativos não compatíveis são intencionalmente não expostos por meio de
    `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto para fala">
    O plugin `xai` incluído registra texto para fala por meio da superfície de
    provedor `tts` compartilhada.

    - Vozes: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz padrão: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: substituição de velocidade nativa do provedor
    - O formato nativo Opus para nota de voz não é compatível

    Para usar a xAI como o provedor TTS padrão:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    O OpenClaw usa o endpoint em lote `/v1/tts` da xAI. A xAI também oferece TTS
    por streaming via WebSocket, mas o contrato do provedor de fala do OpenClaw
    atualmente espera um buffer de áudio completo antes da entrega da resposta.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O plugin `xai` incluído registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `grok-stt`
    - Endpoint: REST da xAI `/v1/stt`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível no OpenClaw em qualquer lugar onde a transcrição de áudio de
      entrada use `tools.media.audio`, incluindo segmentos de canais de voz do
      Discord e anexos de áudio de canais

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

    O idioma pode ser fornecido pela configuração de mídia de áudio
    compartilhada ou pela solicitação de transcrição por chamada. Dicas de prompt
    são aceitas pela superfície compartilhada do OpenClaw, mas a integração STT
    REST da xAI encaminha apenas arquivo, modelo e idioma, porque eles mapeiam
    claramente para o endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Fala para texto por streaming">
    O plugin `xai` incluído também registra um provedor de transcrição em tempo
    real para áudio de chamadas de voz ao vivo.

    - Endpoint: WebSocket da xAI `wss://api.x.ai/v1/stt`
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Endpointing padrão: `800ms`
    - Transcrições intermediárias: habilitadas por padrão

    O stream de mídia da Twilio do Voice Call envia quadros de áudio G.711 µ-law,
    então o provedor xAI pode encaminhar esses quadros diretamente, sem
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
    compatíveis são `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`,
    `mulaw` ou `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Este provedor de streaming é para o caminho de transcrição em tempo real do
    Voice Call. Atualmente, a voz do Discord grava segmentos curtos e usa o
    caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O plugin xAI incluído expõe `x_search` como uma ferramenta do OpenClaw para
    pesquisar conteúdo do X (antigo Twitter) via Grok.

    Caminho de configuração: `plugins.entries.xai.config.xSearch`

    | Chave              | Tipo    | Padrão             | Descrição                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Habilitar ou desabilitar x_search    |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitações x_search |
    | `baseUrl`          | string  | -                  | Substituição da URL base de Responses da xAI |
    | `inlineCitations`  | boolean | -                  | Incluir citações em linha nos resultados |
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
    O plugin xAI incluído expõe `code_execution` como uma ferramenta do OpenClaw
    para execução remota de código no ambiente sandbox da xAI.

    Caminho de configuração: `plugins.entries.xai.config.codeExecution`

    | Chave             | Tipo    | Padrão            | Descrição                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se a chave estiver disponível) | Habilitar ou desabilitar a execução de código |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitações de execução de código |
    | `maxTurns`        | number  | -                  | Máximo de turnos de conversa             |
    | `timeoutSeconds`  | number  | -                  | Tempo limite da solicitação em segundos  |

    <Note>
    Esta é execução remota no sandbox da xAI, não [`exec`](/pt-BR/tools/exec) local.
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
    - A autenticação da xAI pode usar uma chave de API, variável de ambiente,
      fallback de configuração de plugin ou OAuth com uma conta xAI qualificada.
      O OAuth usa verificação por código de dispositivo sem callback localhost.
      A xAI decide quais contas podem receber tokens de API OAuth, e a página de
      consentimento pode mostrar Grok Build mesmo que o OpenClaw não exija o app
      Grok Build.
    - Atualmente, o OpenClaw não expõe a família de modelos multiagente da xAI.
      A xAI fornece esses modelos por meio da API Responses, mas eles não aceitam
      as ferramentas do lado do cliente ou personalizadas usadas pelo loop de
      agente compartilhado do OpenClaw. Consulte as
      [limitações multiagente da xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - A voz em tempo real da xAI ainda não está registrada como um provedor do
      OpenClaw. Ela precisa de um contrato de sessão de voz bidirecional
      diferente de STT em lote ou transcrição por streaming.
    - `quality` de imagem, `mask` de imagem e proporções extras apenas nativas
      da xAI não são expostas até que a ferramenta compartilhada
      `image_generate` tenha controles correspondentes entre provedores.
  </Accordion>

  <Accordion title="Notas avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade de esquema
      de ferramentas e chamadas de ferramenta específicas da xAI no caminho do
      runner compartilhado.
    - Solicitações nativas da xAI usam `tool_stream: true` por padrão. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false`
      para desabilitá-lo.
    - O wrapper xAI incluído remove flags de esquema de ferramenta estritas não
      compatíveis e chaves de payload de *esforço* de raciocínio antes de enviar
      solicitações nativas da xAI. Apenas `grok-4.3` / `grok-4.3-*` anunciam
      esforço de raciocínio configurável; todos os outros modelos da xAI com
      capacidade de raciocínio ainda solicitam
      `include: ["reasoning.encrypted_content"]` para que o raciocínio
      criptografado anterior possa ser reproduzido em turnos de acompanhamento.
    - `web_search`, `x_search` e `code_execution` são expostos como ferramentas
      do OpenClaw. O OpenClaw habilita o recurso integrado específico da xAI de
      que precisa dentro de cada solicitação de ferramenta, em vez de anexar
      todas as ferramentas nativas a cada turno de chat.
    - O `web_search` do Grok lê `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` lê `plugins.entries.xai.config.xSearch.baseUrl` e depois usa
      como fallback a URL base de pesquisa na web do Grok.
    - `x_search` e `code_execution` pertencem ao plugin xAI incluído, em vez de
      serem codificados diretamente no runtime de modelo principal.
    - `code_execution` é execução remota no sandbox da xAI, não
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Testes ao vivo

Os caminhos de mídia da xAI são cobertos por testes unitários e suítes ao vivo
opt-in. Exporte `XAI_API_KEY` no ambiente do processo antes de executar probes
ao vivo.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo ao vivo específico do provedor sintetiza TTS normal, TTS PCM adequado
para telefonia, transcreve áudio por STT em lote da xAI, transmite o mesmo PCM
por STT em tempo real da xAI, gera saída de texto para imagem e edita uma imagem
de referência. O arquivo ao vivo de imagem compartilhado verifica o mesmo
provedor xAI por meio do caminho de seleção de runtime, fallback, normalização e
anexo de mídia do OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta de vídeo compartilhada e seleção de provedor.
  </Card>
  <Card title="Todos os provedores" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais ampla dos provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
