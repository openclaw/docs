---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução do agente GPT-5 mais rigoroso
summary: Use a OpenAI por meio de chaves de API ou da assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  A OpenAI fornece APIs para desenvolvedores para modelos GPT, e o Codex também está disponível como um agente de programação do plano ChatGPT por meio dos clientes Codex da OpenAI. O OpenClaw mantém essas superfícies separadas para que a configuração permaneça previsível.

  O OpenClaw oferece suporte a três rotas da família OpenAI. O prefixo do modelo seleciona a rota de provedor/autenticação; uma configuração de runtime separada seleciona quem executa o loop do agente incorporado:

  - **Chave de API** — acesso direto à OpenAI Platform com cobrança baseada em uso (modelos `openai/*`)
  - **Assinatura do Codex por meio do PI** — login no ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)
  - **Harness app-server do Codex** — execução nativa do app-server do Codex (modelos `openai/*` mais `agents.defaults.agentRuntime.id: "codex"`)

  A OpenAI oferece suporte explicitamente ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos, como o OpenClaw.

  Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos estiverem sendo confundidos, leia [Runtimes de agente](/pt-BR/concepts/agent-runtimes) antes de alterar a configuração.

  ## Escolha rápida

  | Objetivo                                      | Use                                              | Observações                                                                 |
  | --------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
  | Cobrança direta por chave de API              | `openai/gpt-5.5`                                 | Defina `OPENAI_API_KEY` ou execute a integração de chave de API da OpenAI.  |
  | GPT-5.5 com autenticação por assinatura ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Rota padrão do PI para OAuth do Codex. Melhor primeira escolha para configurações com assinatura. |
  | GPT-5.5 com comportamento nativo do app-server do Codex | `openai/gpt-5.5` mais `agentRuntime.id: "codex"` | Força o harness app-server do Codex para essa referência de modelo.         |
  | Geração ou edição de imagem                   | `openai/gpt-image-2`                             | Funciona com `OPENAI_API_KEY` ou OAuth do OpenAI Codex.                     |
  | Imagens com fundo transparente                | `openai/gpt-image-1.5`                           | Use `outputFormat=png` ou `webp` e `openai.background=transparent`.         |

  ## Mapa de nomes

  Os nomes são parecidos, mas não são intercambiáveis:

  | Nome que você vê                    | Camada            | Significado                                                                                       |
  | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
  | `openai`                            | Prefixo do provedor | Rota direta da API da OpenAI Platform.                                                           |
  | `openai-codex`                      | Prefixo do provedor | Rota de OAuth/assinatura do OpenAI Codex por meio do runner PI normal do OpenClaw.              |
  | Plugin `codex`                      | Plugin            | Plugin integrado do OpenClaw que fornece runtime nativo do app-server do Codex e controles de chat `/codex`. |
  | `agentRuntime.id: codex`            | Runtime do agente | Força o harness nativo do app-server do Codex para turnos incorporados.                          |
  | `/codex ...`                        | Conjunto de comandos de chat | Vincula/controla threads do app-server do Codex a partir de uma conversa.               |
  | `runtime: "acp", agentId: "codex"`  | Rota de sessão ACP | Caminho de fallback explícito que executa o Codex por meio de ACP/acpx.                         |

  Isso significa que uma configuração pode conter intencionalmente tanto `openai-codex/*` quanto o plugin `codex`. Isso é válido quando você quer OAuth do Codex por meio do PI e também quer ter os controles nativos de chat `/codex` disponíveis. `openclaw doctor` emite um aviso sobre essa combinação para que você possa confirmar que ela é intencional; ele não a reescreve.

  <Note>
  O GPT-5.5 está disponível tanto por acesso direto à OpenAI Platform com chave de API quanto por rotas de assinatura/OAuth. Use `openai/gpt-5.5` para tráfego direto com `OPENAI_API_KEY`, `openai-codex/gpt-5.5` para OAuth do Codex por meio do PI, ou `openai/gpt-5.5` com `agentRuntime.id: "codex"` para o harness nativo do app-server do Codex.
  </Note>

  <Note>
  Habilitar o plugin OpenAI, ou selecionar um modelo `openai-codex/*`, não habilita o plugin integrado do app-server do Codex. O OpenClaw habilita esse plugin apenas quando você seleciona explicitamente o harness nativo do Codex com `agentRuntime.id: "codex"` ou usa uma referência de modelo legada `codex/*`.
  Se o plugin integrado `codex` estiver habilitado, mas `openai-codex/*` ainda for resolvido por meio do PI, `openclaw doctor` emite um aviso e deixa a rota inalterada.
  </Note>

  ## Cobertura de recursos do OpenClaw

  | Recurso da OpenAI         | Superfície do OpenClaw                                     | Status                                                 |
  | ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | provedor de modelo `openai/<model>`                        | Sim                                                    |
  | Modelos com assinatura Codex | `openai-codex/<model>` com OAuth `openai-codex`         | Sim                                                    |
  | Harness app-server do Codex | `openai/<model>` com `agentRuntime.id: codex`            | Sim                                                    |
  | Pesquisa na web no lado do servidor | ferramenta nativa OpenAI Responses                | Sim, quando a pesquisa na web está habilitada e nenhum provedor está fixado |
  | Imagens                   | `image_generate`                                           | Sim                                                    |
  | Vídeos                    | `video_generate`                                           | Sim                                                    |
  | Texto para fala           | `messages.tts.provider: "openai"` / `tts`                  | Sim                                                    |
  | Fala para texto em lote   | `tools.media.audio` / compreensão de mídia                 | Sim                                                    |
  | Fala para texto por streaming | Voice Call `streaming.provider: "openai"`              | Sim                                                    |
  | Voz em tempo real         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sim                                                    |
  | Embeddings                | provedor de embeddings da memória                          | Sim                                                    |

  ## Primeiros passos

  Escolha seu método de autenticação preferido e siga as etapas de configuração.

  <Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança baseada em uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Execute a integração">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Referência de modelo    | Configuração de runtime        | Rota                        | Autenticação     |
    | ----------------------- | ------------------------------ | --------------------------- | ---------------- |
    | `openai/gpt-5.5`        | omitido / `agentRuntime.id: "pi"`    | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`   | omitido / `agentRuntime.id: "pi"`    | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`        | `agentRuntime.id: "codex"`           | Harness app-server do Codex   | App-server do Codex |

    <Note>
    `openai/*` é a rota direta com chave de API da OpenAI, a menos que você force explicitamente o harness app-server do Codex. Use `openai-codex/*` para OAuth do Codex por meio do runner PI padrão, ou use `openai/gpt-5.5` com `agentRuntime.id: "codex"` para execução nativa do app-server do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark`. Solicitações ativas à API da OpenAI rejeitam esse modelo, e o catálogo atual do Codex também não o expõe.
    </Warning>

  </Tab>

  <Tab title="Assinatura do Codex">
    **Melhor para:** usar sua assinatura do ChatGPT/Codex em vez de uma chave de API separada. O Codex em nuvem exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configurações headless ou hostis a callback, adicione `--device-code` para entrar com um fluxo de código de dispositivo do ChatGPT em vez do callback do navegador em localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Defina o modelo padrão">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Referência de modelo | Configuração de runtime | Rota | Autenticação |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitido / `runtime: "pi"` | OAuth do ChatGPT/Codex por meio do PI | Login do Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Ainda PI, a menos que um plugin reivindique explicitamente `openai-codex` | Login do Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness app-server do Codex | Autenticação do app-server do Codex |

    <Note>
    Continue usando o id do provedor `openai-codex` para comandos de autenticação/perfil. O prefixo de modelo `openai-codex/*` também é a rota PI explícita para OAuth do Codex.
    Ele não seleciona nem habilita automaticamente o harness integrado do app-server do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    A integração não importa mais material OAuth de `~/.codex`. Entre usando OAuth no navegador (padrão) ou o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação do agente.
    </Note>

    ### Indicador de status

    O chat `/status` mostra qual runtime de modelo está ativo para a sessão atual.
    O harness PI padrão aparece como `Runtime: OpenClaw Pi Default`. Quando o
    harness integrado do app-server do Codex é selecionado, `/status` mostra
    `Runtime: OpenAI Codex`. Sessões existentes mantêm seu id de harness registrado, então use
    `/new` ou `/reset` após alterar `agentRuntime` se você quiser que `/status`
    reflita uma nova escolha entre PI/Codex.

    ### Aviso do doctor

    Se o plugin integrado `codex` estiver habilitado enquanto a rota
    `openai-codex/*` desta aba estiver selecionada, `openclaw doctor` avisa que o modelo
    ainda é resolvido por meio do PI. Mantenha a configuração inalterada quando essa for a
    rota pretendida de autenticação por assinatura. Mude para `openai/<model>` mais
    `agentRuntime.id: "codex"` somente quando quiser execução nativa do
    app-server do Codex.

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores separados.

    Para `openai-codex/gpt-5.5` por meio de OAuth do Codex:

    - `contextWindow` nativo: `1000000`
    - Limite padrão de `contextTokens` do runtime: `272000`

    O limite padrão menor tem, na prática, melhores características de latência e qualidade. Substitua-o com `contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

<Note>
Use `contextWindow` para declarar os metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do runtime.
</Note>

### Recuperação do catálogo

O OpenClaw usa metadados do catálogo upstream do Codex para `gpt-5.5` quando eles estão
presentes. Se a descoberta ativa do Codex omitir a linha `openai-codex/gpt-5.5` enquanto
a conta estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que
execuções de Cron, subagente e modelo padrão configurado não falhem com
`Unknown model`.

  </Tab>
</Tabs>

## Geração de imagem

O plugin integrado `openai` registra a geração de imagem por meio da ferramenta `image_generate`.
Ele oferece suporte tanto à geração de imagem com chave de API da OpenAI quanto à geração de imagem
com OAuth do Codex usando a mesma referência de modelo `openai/gpt-image-2`.

| Recurso                  | Chave de API da OpenAI               | OAuth do Codex                        |
| ------------------------ | ------------------------------------ | ------------------------------------- |
| Referência de modelo     | `openai/gpt-image-2`                 | `openai/gpt-image-2`                  |
| Autenticação             | `OPENAI_API_KEY`                     | Login com OAuth do OpenAI Codex       |
| Transporte               | API Images da OpenAI                 | Backend Codex Responses               |
| Máximo de imagens por solicitação | 4                           | 4                                     |
| Modo de edição           | Habilitado (até 5 imagens de referência) | Habilitado (até 5 imagens de referência) |
| Substituições de tamanho | Compatível, incluindo tamanhos 2K/4K | Compatível, incluindo tamanhos 2K/4K  |
| Proporção / resolução    | Não encaminhada para a API Images da OpenAI | Mapeada para um tamanho compatível quando seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Geração de imagem](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de texto para imagem da OpenAI quanto para edição de imagem. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` continuam utilizáveis como substituições explícitas de modelo. Use `openai/gpt-image-1.5` para saída PNG/WebP com fundo transparente; a API atual `gpt-image-2` rejeita
`background: "transparent"`.

Para uma solicitação com fundo transparente, os agentes devem chamar `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção legada de provedor `openai.background` ainda é
aceita. O OpenClaw também protege as rotas públicas da OpenAI e do
OAuth do OpenAI Codex reescrevendo solicitações transparentes padrão de `openai/gpt-image-2`
para `gpt-image-1.5`; endpoints Azure e OpenAI-compatíveis personalizados mantêm
seus nomes de implantação/modelo configurados.

A mesma configuração é exposta para execuções headless de CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Use as mesmas flags `--output-format` e `--background` com
`openclaw infer image edit` ao começar a partir de um arquivo de entrada.
`--openai-background` continua disponível como alias específico da OpenAI.

Para instalações com OAuth do Codex, mantenha a mesma referência `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` estiver configurado, o OpenClaw resolve esse token de acesso OAuth armazenado e envia solicitações de imagem por meio do backend Codex Responses. Ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API nessa
solicitação. Configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure quando quiser a rota direta da
API Images da OpenAI.
Se esse endpoint de imagem personalizado estiver em uma LAN confiável/endereço privado, também defina
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw mantém
endpoints de imagem OpenAI-compatíveis privados/internos bloqueados, a menos que essa ativação explícita esteja
presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Gerar um PNG com fundo transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O plugin integrado `openai` registra a geração de vídeo por meio da ferramenta `video_generate`.

| Recurso          | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                         |
| Substituições de tamanho | Compatível                                                                 |
| Outras substituições | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição de prompt compartilhada do GPT-5 para execuções da família GPT-5 em todos os provedores. Ela se aplica por id do modelo, portanto `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e outras referências compatíveis de GPT-5 recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O harness nativo integrado do Codex usa o mesmo comportamento do GPT-5 e a mesma sobreposição de Heartbeat por meio de instruções de desenvolvedor do app-server do Codex, então sessões `openai/gpt-5.x` forçadas por `agentRuntime.id: "codex"` mantêm a mesma orientação de acompanhamento e Heartbeat proativo, mesmo que o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento com tags para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento de resposta específico do canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre habilitada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Habilita a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                     |
| `"off"`                | Desabilita apenas a camada de estilo amigável |

<Tabs>
  <Tab title="Configuração">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desabilitam a camada de estilo amigável.
</Tip>

<Note>
O `plugins.entries.openai.config.personality` legado ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O plugin integrado `openai` registra a síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, somente `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base do TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O plugin integrado `openai` registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Caminho de entrada: upload multipart de arquivo de áudio
    - Compatível com o OpenClaw onde quer que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canais

    Para forçar a OpenAI na transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dicas de idioma e prompt são encaminhadas para a OpenAI quando fornecidas pela
    configuração compartilhada de mídia de áudio ou por solicitação de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O plugin integrado `openai` registra transcrição em tempo real para o plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Usa uma conexão WebSocket para `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Esse provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O plugin integrado `openai` registra voz em tempo real para o plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Compatível com Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment`. Compatível com chamada bidirecional de ferramentas. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor integrado `openai` pode apontar para um recurso do Azure OpenAI para geração de imagem
substituindo a URL base. No caminho de geração de imagem, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e muda para
o formato de solicitação do Azure automaticamente.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o accordion **Voz
em tempo real** em [Voz e fala](#voice-and-speech) para as configurações do
Azure.
</Note>

Use Azure OpenAI quando:

- Você já tem uma assinatura, cota ou contrato corporativo do Azure OpenAI
- Você precisa de residência de dados regional ou controles de conformidade que o Azure oferece
- Você quer manter o tráfego dentro de uma locação existente do Azure

### Configuração

Para geração de imagem no Azure por meio do provedor integrado `openai`, aponte
`models.providers.openai.baseUrl` para seu recurso do Azure e defina `apiKey` como
a chave do Azure OpenAI (não uma chave da OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração de imagem do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitações de geração de imagem em um host do Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação
- Usa um timeout padrão de 600s para chamadas de geração de imagem no Azure.
  Valores `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato
padrão de solicitação de imagem da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagem do provedor `openai` exige
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizada como o endpoint público da OpenAI e falharão com implantações de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica preview ou GA do Azure
para o caminho de geração de imagem do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de implantação

O Azure OpenAI vincula modelos a implantações. Para solicitações de geração de imagem do Azure
roteadas por meio do provedor integrado `openai`, o campo `model` no OpenClaw
deve ser o **nome da implantação do Azure** que você configurou no portal do Azure, não
o id público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a chamadas de geração de imagem roteadas por meio
do provedor integrado `openai`.

### Disponibilidade regional

A geração de imagem no Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo determinados
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas
do modelo. Essas diferenças vêm do Azure e do modelo subjacente, não do
OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, verifique o
conjunto de parâmetros compatível com sua implantação e versão da API específicas no
portal do Azure.

<Note>
O Azure OpenAI usa comportamento nativo de transporte e compatibilidade, mas não recebe
os cabeçalhos de atribuição ocultos do OpenClaw — consulte o accordion **Rotas
nativas vs OpenAI-compatíveis** em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além da geração de imagem), use o
fluxo de integração ou uma configuração dedicada de provedor Azure — `openai.baseUrl` sozinho
não adota o formato de API/autenticação do Azure. Existe um provedor separado
`azure-openai-responses/*`; consulte
o accordion de Compaction no lado do servidor abaixo.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de resfriamento
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Força somente SSE |
    | `"websocket"` | Força somente WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [API Realtime com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas de API por streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw habilita o aquecimento de WebSocket por padrão para `openai/*` e `openai-codex/*` para reduzir a latência do primeiro turno.

    ```json5
    // Desabilitar aquecimento
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando habilitado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições no nível da sessão têm prioridade sobre a configuração. Limpar a substituição da sessão na UI de Sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por meio de `service_tier`. Defina isso por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por meio de um proxy, o OpenClaw deixa `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (Responses API)">
    Para modelos diretos de OpenAI Responses (`openai/*` em `api.openai.com`), o wrapper de stream do harness Pi do plugin OpenAI habilita automaticamente Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    Isso se aplica ao caminho integrado do harness Pi e aos hooks do provedor OpenAI usados por execuções incorporadas. O harness nativo do app-server do Codex gerencia seu próprio contexto por meio do Codex e é configurado separadamente com `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Habilitar explicitamente">
        Útil para endpoints compatíveis como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Limite personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Desabilitar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos de OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agêntico estrito">
    Para execuções da família GPT-5 em `openai/*`, o OpenClaw pode usar um contrato de execução incorporado mais rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Com `strict-agentic`, o OpenClaw:
    - Não trata mais um turno somente de plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - Tenta novamente o turno com uma orientação para agir agora
    - Habilita automaticamente `update_plan` para trabalho substancial
    - Exibe um estado explicitamente bloqueado se o modelo continuar planejando sem agir

    <Note>
    Aplicável apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs OpenAI-compatíveis">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos `/v1` compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao esforço `none` da OpenAI
    - Omitem reasoning desabilitado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Usam schemas de ferramenta em modo estrito por padrão
    - Anexam cabeçalhos de atribuição ocultos apenas em hosts nativos verificados
    - Mantêm a modelagem de solicitação exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de reasoning, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON pass-through avançado `params.extra_body`/`params.extraBody` para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI, como vLLM
    - Não forçam schemas de ferramenta estritos nem cabeçalhos exclusivos de rotas nativas

    Azure OpenAI usa comportamento nativo de transporte e compatibilidade, mas não recebe os cabeçalhos de atribuição ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
