---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer autenticação por assinatura Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agent mais estrito no GPT-5
summary: Usar OpenAI por chaves de API ou assinatura Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T14:06:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  A OpenAI fornece APIs para desenvolvedores dos modelos GPT. O OpenClaw oferece suporte a duas rotas de autenticação:

  - **Chave de API** — acesso direto à OpenAI Platform com cobrança por uso (modelos `openai/*`)
  - **Assinatura Codex** — login do ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)

  A OpenAI oferece suporte explicitamente ao uso de OAuth por assinatura em ferramentas e fluxos externos como o OpenClaw.

  ## Cobertura de recursos no OpenClaw

  | Capacidade OpenAI         | Superfície no OpenClaw                    | Status                                                 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | provedor de modelo `openai/<model>`       | Sim                                                    |
  | Modelos por assinatura Codex | provedor de modelo `openai-codex/<model>` | Sim                                                 |
  | Pesquisa web no servidor  | Ferramenta nativa OpenAI Responses        | Sim, quando a pesquisa web está habilitada e nenhum provedor está fixado |
  | Imagens                   | `image_generate`                          | Sim                                                    |
  | Vídeos                    | `video_generate`                          | Sim                                                    |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts` | Sim                                                    |
  | Speech-to-text em lote    | `tools.media.audio` / entendimento de mídia | Sim                                                  |
  | Speech-to-text em streaming | Voice Call `streaming.provider: "openai"` | Sim                                                 |
  | Voz em tempo real         | Voice Call `realtime.provider: "openai"`  | Sim                                                    |
  | Embeddings                | provedor de embeddings de memória         | Sim                                                    |

  ## Introdução

  Escolha seu método de autenticação preferido e siga as etapas de configuração.

  <Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança por uso.

    <Steps>
      <Step title="Obter sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Model ref | Rota | Autenticação |
    |-----------|------|--------------|
    | `openai/gpt-5.4` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API direta da OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    O login do ChatGPT/Codex é roteado por `openai-codex/*`, não por `openai/*`.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark` no caminho da API direta. Solicitações reais à OpenAI API rejeitam esse modelo. Spark é somente Codex.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Melhor para:** usar sua assinatura do ChatGPT/Codex em vez de uma chave de API separada. O Codex cloud exige login do ChatGPT.

    <Steps>
      <Step title="Executar OAuth do Codex">
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
      <Step title="Definir o modelo padrão">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Model ref | Rota | Autenticação |
    |-----------|------|--------------|
    | `openai-codex/gpt-5.4` | OAuth do ChatGPT/Codex | login do Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth do ChatGPT/Codex | login do Codex (dependente de entitlement) |

    <Note>
    Essa rota é intencionalmente separada de `openai/gpt-5.4`. Use `openai/*` com uma chave de API para acesso direto à Platform e `openai-codex/*` para acesso por assinatura Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    O onboarding não importa mais material OAuth de `~/.codex`. Entre com OAuth no navegador (padrão) ou com o fluxo de código de dispositivo acima — o OpenClaw gerencia as credenciais resultantes em seu próprio armazenamento de autenticação do agent.
    </Note>

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto em runtime como valores separados.

    Para `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - Limite padrão de `contextTokens` em runtime: `272000`

    O limite padrão menor tem melhor latência e características de qualidade na prática. Substitua-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto em runtime.
    </Note>

  </Tab>
</Tabs>

## Geração de imagem

O plugin integrado `openai` registra geração de imagem por meio da ferramenta `image_generate`.

| Capacidade               | Valor                              |
| ------------------------ | ---------------------------------- |
| Modelo padrão            | `openai/gpt-image-2`               |
| Máximo de imagens por solicitação | 4                          |
| Modo de edição           | Habilitado (até 5 imagens de referência) |
| Substituições de tamanho | Compatível, incluindo tamanhos 2K/4K |
| Proporção / resolução    | Não são encaminhadas para a OpenAI Images API |

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

`gpt-image-2` é o padrão tanto para geração de imagem a partir de texto quanto para
edição de imagem na OpenAI. `gpt-image-1` continua utilizável como substituição explícita de modelo, mas novos
fluxos de imagem da OpenAI devem usar `openai/gpt-image-2`.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Um pôster de lançamento refinado do OpenClaw no macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve a forma do objeto, mude o material para vidro translúcido" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O plugin integrado `openai` registra geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
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

O OpenClaw adiciona uma contribuição compartilhada de prompt do GPT-5 para execuções da família GPT-5 em todos os provedores. Ela se aplica por id de modelo, então `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` e outras referências GPT-5 compatíveis recebem a mesma sobreposição. Modelos GPT-4.x mais antigos não recebem.

O provedor nativo integrado de harness do Codex (`codex/*`) usa o mesmo comportamento de GPT-5 e a mesma sobreposição de Heartbeat por meio de instruções de desenvolvedor do app-server do Codex, então sessões `codex/gpt-5.x` mantêm a mesma orientação de acompanhamento e Heartbeat proativo, embora o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento marcado para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento específico do canal para resposta e mensagens silenciosas permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre habilitada para modelos correspondentes. A camada amigável de estilo de interação é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Habilita a camada amigável de estilo de interação |
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
O legado `plugins.entries.openai.config.personality` ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O plugin integrado `openai` registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de configuração | Padrão |
    |-------------|--------------------------|--------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, apenas `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para mensagens de voz, `mp3` para arquivos |
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
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base de TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    O plugin integrado `openai` registra speech-to-text em lote por meio da
    superfície de transcrição de entendimento de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST da OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload multipart de arquivo de áudio
    - Compatível no OpenClaw sempre que a transcrição de áudio recebido usar
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canais

    Para forçar OpenAI para transcrição de áudio recebido:

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
    configuração compartilhada de mídia de áudio ou pela solicitação de transcrição por chamada.

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
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Esse provedor de streaming é para o caminho de transcrição em tempo real do Voice Call; atualmente, voz do Discord grava segmentos curtos e usa o caminho de transcrição em lote `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O plugin integrado `openai` registra voz em tempo real para o plugin Voice Call.

    | Configuração | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa `OPENAI_API_KEY` como fallback |

    <Note>
    Oferece suporte ao Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment`. Oferece suporte a chamadas bidirecionais de ferramenta. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor integrado `openai` pode apontar para um recurso Azure OpenAI para geração de
imagem substituindo a URL base. No caminho de geração de imagem, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e alterna para
o formato de solicitação do Azure automaticamente.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o accordion **Voz em
tempo real** em [Voz e fala](#voice-and-speech) para suas configurações do Azure.
</Note>

Use Azure OpenAI quando:

- Você já possui assinatura, cota ou contrato corporativo do Azure OpenAI
- Você precisa de residência regional de dados ou controles de conformidade fornecidos pelo Azure
- Você quer manter o tráfego dentro de uma tenancy Azure existente

### Configuração

Para geração de imagem no Azure por meio do provedor integrado `openai`, aponte
`models.providers.openai.baseUrl` para seu recurso Azure e defina `apiKey` como
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

Para solicitações de geração de imagem em um host Azure reconhecido, o OpenClaw:

- Envia o header `api-key` em vez de `Authorization: Bearer`
- Usa caminhos com escopo de deployment (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato padrão
de solicitação de imagem da OpenAI.

<Note>
O roteamento Azure para o caminho de geração de imagem do provedor `openai` exige
OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falham com deployments
de imagem do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão preview ou GA específica do Azure
para o caminho de geração de imagem do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Nomes de modelo são nomes de deployment

O Azure OpenAI vincula modelos a deployments. Para solicitações de geração de imagem do Azure
roteadas pelo provedor integrado `openai`, o campo `model` no OpenClaw
deve ser o **nome do deployment do Azure** que você configurou no portal do Azure, e não
o id público do modelo OpenAI.

Se você criar um deployment chamado `gpt-image-2-prod` que serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Um pôster limpo" size=1024x1024 count=1
```

A mesma regra de nome de deployment se aplica a chamadas de geração de imagem roteadas pelo
provedor integrado `openai`.

### Disponibilidade regional

A geração de imagem no Azure está atualmente disponível apenas em um subconjunto de regiões
(por exemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Verifique a lista atual de regiões da Microsoft antes de criar um
deployment e confirme se o modelo específico é oferecido na sua região.

### Diferenças de parâmetros

O Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções que a OpenAI pública permite (por exemplo certos
valores de `background` em `gpt-image-2`) ou expô-las apenas em versões específicas
do modelo. Essas diferenças vêm do Azure e do modelo subjacente, não
do OpenClaw. Se uma solicitação ao Azure falhar com erro de validação, verifique o
conjunto de parâmetros compatíveis pelo seu deployment e versão de API específicos no
portal do Azure.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os headers ocultos de atribuição do OpenClaw. Consulte o accordion **Rotas nativas vs compatíveis com OpenAI**
em [Configuração avançada](#advanced-configuration)
para detalhes.
</Note>

<Tip>
Para um provedor separado de Azure OpenAI Responses (distinto do provedor `openai`), consulte as referências de modelo `azure-openai-responses/*` no accordion
[Compaction no servidor](#server-side-compaction-responses-api).
</Tip>

<Note>
O tráfego de chat e Responses do Azure precisa de configuração de provedor/API específica do Azure além da substituição da URL base. Se você quiser chamadas de modelo do Azure além de geração
de imagem, use o fluxo de onboarding ou uma configuração de provedor que defina o
formato apropriado de API/autenticação do Azure, em vez de presumir que apenas `openai.baseUrl`
seja suficiente.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de recorrer a SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o cooldown
    - Anexa headers estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|---------------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Força apenas SSE |
    | `"websocket"` | Força apenas WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [Realtime API com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming de respostas da API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw habilita aquecimento de WebSocket por padrão para `openai/*` para reduzir a latência do primeiro turno.

    ```json5
    // Desabilitar aquecimento
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Modo rápido">
    O OpenClaw expõe um toggle compartilhado de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando habilitado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Substituições de sessão têm prioridade sobre a configuração. Limpar a substituição da sessão na UI de sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário via `service_tier`. Defina por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um dos provedores por um proxy, o OpenClaw deixará `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no servidor (Responses API)">
    Para modelos OpenAI Responses diretos (`openai/*` em `api.openai.com`), o OpenClaw habilita automaticamente Compaction no servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    <Tabs>
      <Tab title="Habilitar explicitamente">
        Útil para endpoints compatíveis, como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agentic estrito">
    Para execuções da família GPT-5 em `openai/*` e `openai-codex/*`, o OpenClaw pode usar um contrato de execução incorporado mais estrito:

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
    - Não trata mais um turno apenas de plano como progresso bem-sucedido quando há uma ação de ferramenta disponível
    - Tenta novamente o turno com uma orientação para agir agora
    - Habilita automaticamente `update_plan` para trabalho substancial
    - Exibe um estado explícito de bloqueio se o modelo continuar planejando sem agir

    <Note>
    Restrito apenas a execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos compatíveis com OpenAI em `/v1`:

    **Rotas nativas** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao esforço `none` da OpenAI
    - Omitem reasoning desabilitado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - Definem schemas de ferramenta em modo estrito por padrão
    - Anexam headers ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm o formato de solicitação exclusivo da OpenAI (`service_tier`, `store`, compatibilidade de reasoning, dicas de prompt-cache)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Não forçam schemas de ferramenta estritos nem headers exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe os headers ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados de ferramentas de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados de ferramentas de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
