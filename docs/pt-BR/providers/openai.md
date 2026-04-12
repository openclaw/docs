---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer auth por assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução do agente mais restrito para o GPT-5
summary: Use o OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T23:32:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aeb756618c5611fed56e4bf89015a2304ff2e21596104b470ec6e7cb459d1c9
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

A OpenAI fornece APIs para desenvolvedores para modelos GPT. O OpenClaw oferece suporte a duas rotas de auth:

- **Chave de API** — acesso direto à OpenAI Platform com cobrança baseada em uso (modelos `openai/*`)
- **Assinatura do Codex** — login no ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)

A OpenAI oferece suporte explicitamente ao uso de OAuth de assinatura em ferramentas e fluxos de trabalho externos como o OpenClaw.

## Primeiros passos

Escolha seu método de auth preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Ideal para:** acesso direto à API e cobrança baseada em uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Execute o onboarding">
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

    | Model ref | Rota | Auth |
    |-----------|------|------|
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
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark` no caminho direto da API. Solicitações ao vivo para a API da OpenAI rejeitam esse modelo. Spark é exclusivo do Codex.
    </Warning>

  </Tab>

  <Tab title="Assinatura do Codex">
    **Ideal para:** usar sua assinatura do ChatGPT/Codex em vez de uma chave de API separada. O Codex cloud exige login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Defina o modelo padrão">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Model ref | Rota | Auth |
    |-----------|------|------|
    | `openai-codex/gpt-5.4` | OAuth do ChatGPT/Codex | login do Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth do ChatGPT/Codex | login do Codex (dependente de entitlement) |

    <Note>
    Esta rota é intencionalmente separada de `openai/gpt-5.4`. Use `openai/*` com uma chave de API para acesso direto à Platform e `openai-codex/*` para acesso por assinatura do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Se o onboarding reutilizar um login existente do Codex CLI, essas credenciais continuarão sendo gerenciadas pelo Codex CLI. Ao expirar, o OpenClaw relê primeiro a fonte externa do Codex e grava a credencial atualizada de volta no armazenamento do Codex.
    </Tip>

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto em tempo de execução como valores separados.

    Para `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - Limite padrão de `contextTokens` em tempo de execução: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Substitua-o com `contextTokens`:

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
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto em tempo de execução.
    </Note>

  </Tab>
</Tabs>

## Geração de imagem

O plugin `openai` integrado registra a geração de imagem por meio da ferramenta `image_generate`.

| Capacidade                | Valor                              |
| ------------------------- | ---------------------------------- |
| Modelo padrão             | `openai/gpt-image-1`               |
| Máximo de imagens por solicitação | 4                           |
| Modo de edição            | Ativado (até 5 imagens de referência) |
| Substituições de tamanho  | Compatíveis                        |
| Proporção / resolução     | Não encaminhadas para a OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Consulte [Geração de imagem](/pt-BR/tools/image-generation) para ver parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Geração de vídeo

O plugin `openai` integrado registra a geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de um único vídeo                     |
| Entradas de referência | 1 imagem ou 1 vídeo                                                         |
| Substituições de tamanho | Compatíveis                                                                |
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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Overlay de personalidade

O OpenClaw adiciona um pequeno overlay de prompt específico da OpenAI para execuções `openai/*` e `openai-codex/*`. O overlay mantém o assistente caloroso, colaborativo, conciso e um pouco mais expressivo emocionalmente, sem substituir o prompt base do sistema.

| Valor                  | Efeito                              |
| ---------------------- | ----------------------------------- |
| `"friendly"` (padrão)  | Ativa o overlay específico da OpenAI |
| `"on"`                 | Alias para `"friendly"`             |
| `"off"`                | Usa apenas o prompt base do OpenClaw |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas em tempo de execução, então `"Off"` e `"off"` desativam o overlay.
</Tip>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O plugin `openai` integrado registra síntese de fala para a superfície `messages.tts`.

    | Setting | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, apenas `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Defina `OPENAI_TTS_BASE_URL` para substituir a base URL de TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O plugin `openai` integrado registra transcrição em tempo real para o Plugin Voice Call.

    | Setting | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O plugin `openai` integrado registra voz em tempo real para o Plugin Voice Call.

    | Setting | Caminho de configuração | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |

    <Note>
    Compatível com Azure OpenAI por meio das chaves de configuração `azureEndpoint` e `azureDeployment`. Compatível com chamada de ferramentas bidirecional. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente uma falha inicial de WebSocket antes de usar fallback para SSE
    - Após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de resfriamento
    - Anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw ativa o aquecimento de WebSocket por padrão para `openai/*` para reduzir a latência do primeiro turno.

    ```json5
    // Desativar aquecimento
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

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

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
    Substituições no nível da sessão têm prioridade sobre a configuração. Limpar a substituição da sessão na UI de Sessions faz a sessão voltar ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por meio de `service_tier`. Defina isso por modelo no OpenClaw:

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

  <Accordion title="Compaction no lado do servidor (Responses API)">
    Para modelos Responses diretos da OpenAI (`openai/*` em `api.openai.com`), o OpenClaw ativa automaticamente Compaction no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    <Tabs>
      <Tab title="Ativar explicitamente">
        Útil para endpoints compatíveis como Azure OpenAI Responses:

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
      <Tab title="Desativar">
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
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos Responses diretos da OpenAI ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agêntico estrito">
    Para execuções da família GPT-5 em `openai/*` e `openai-codex/*`, o OpenClaw pode usar um contrato de execução embutido mais estrito:

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
    - Não trata mais um turno apenas com plano como progresso bem-sucedido quando há uma ação de ferramenta disponível
    - Tenta novamente o turno com uma orientação para agir agora
    - Ativa automaticamente `update_plan` para trabalho substancial
    - Expõe um estado explícito de bloqueio se o modelo continuar planejando sem agir

    <Note>
    Escopo apenas para execuções da família GPT-5 da OpenAI e do Codex. Outros provedores e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos compatíveis com OpenAI em `/v1`:

    **Rotas nativas** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` intacto quando o raciocínio está explicitamente desativado
    - Usam por padrão esquemas de ferramentas em modo estrito
    - Anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - Mantêm a formatação de solicitação exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de reasoning, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - Usam comportamento de compatibilidade mais flexível
    - Não forçam esquemas de ferramentas estritos nem cabeçalhos exclusivos nativos

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade nativa, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="OAuth e auth" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de auth e regras de reutilização de credenciais.
  </Card>
</CardGroup>
