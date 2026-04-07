---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer usar autenticação por assinatura Codex em vez de chaves de API
summary: Use o OpenAI via chaves de API ou assinatura Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-07T05:31:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

O OpenAI fornece APIs para desenvolvedores dos modelos GPT. O Codex oferece suporte a **login com ChatGPT** para acesso
por assinatura ou **login com chave de API** para acesso baseado em uso. O Codex cloud exige login com ChatGPT.
O OpenAI oferece suporte explícito ao uso de OAuth por assinatura em ferramentas/fluxos externos como o OpenClaw.

## Estilo de interação padrão

O OpenClaw pode adicionar uma pequena sobreposição de prompt específica do OpenAI para execuções `openai/*` e
`openai-codex/*`. Por padrão, a sobreposição mantém o assistente acolhedor,
colaborativo, conciso, direto e um pouco mais expressivo emocionalmente,
sem substituir o prompt de sistema base do OpenClaw. A sobreposição amigável também
permite emoji ocasionais quando fizer sentido naturalmente, mantendo a
saída geral concisa.

Chave de configuração:

`plugins.entries.openai.config.personality`

Valores permitidos:

- `"friendly"`: padrão; ativa a sobreposição específica do OpenAI.
- `"on"`: alias para `"friendly"`.
- `"off"`: desativa a sobreposição e usa apenas o prompt base do OpenClaw.

Escopo:

- Aplica-se a modelos `openai/*`.
- Aplica-se a modelos `openai-codex/*`.
- Não afeta outros provedores.

Esse comportamento vem ativado por padrão. Mantenha `"friendly"` explicitamente se quiser que isso
sobreviva a futuras mudanças locais na configuração:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Desativar a sobreposição de prompt do OpenAI

Se você quiser o prompt base do OpenClaw sem modificações, defina a sobreposição como `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Você também pode definir isso diretamente com a CLI de configuração:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

O OpenClaw normaliza essa configuração sem diferenciar maiúsculas de minúsculas em runtime, então valores como
`"Off"` também desativam a sobreposição amigável.

## Opção A: chave de API do OpenAI (OpenAI Platform)

**Ideal para:** acesso direto à API e cobrança baseada em uso.
Obtenha sua chave de API no painel do OpenAI.

Resumo de rota:

- `openai/gpt-5.4` = rota direta da API OpenAI Platform
- Exige `OPENAI_API_KEY` (ou configuração equivalente do provedor OpenAI)
- No OpenClaw, login do ChatGPT/Codex é roteado por `openai-codex/*`, não por `openai/*`

### Configuração pela CLI

```bash
openclaw onboard --auth-choice openai-api-key
# ou sem interação
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Exemplo de configuração

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

A documentação atual de modelos de API do OpenAI lista `gpt-5.4` e `gpt-5.4-pro` para uso direto
da API OpenAI. O OpenClaw encaminha ambos pelo caminho `openai/*` Responses.
O OpenClaw oculta intencionalmente a linha desatualizada `openai/gpt-5.3-codex-spark`,
porque chamadas diretas à API OpenAI a rejeitam em tráfego real.

O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark` no caminho direto da
API OpenAI. `pi-ai` ainda fornece uma linha integrada para esse modelo, mas requisições reais da API OpenAI
atualmente o rejeitam. O Spark é tratado como exclusivo do Codex no OpenClaw.

## Geração de imagem

O plugin integrado `openai` também registra geração de imagem por meio da ferramenta compartilhada
`image_generate`.

- Modelo de imagem padrão: `openai/gpt-image-1`
- Gerar: até 4 imagens por solicitação
- Modo de edição: ativado, até 5 imagens de referência
- Oferece suporte a `size`
- Restrição atual específica do OpenAI: o OpenClaw atualmente não encaminha sobrescritas de `aspectRatio` nem
  de `resolution` para a API OpenAI Images

Para usar o OpenAI como provedor de imagem padrão:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Veja [Geração de Imagem](/pt-BR/tools/image-generation) para os parâmetros da ferramenta compartilhada,
seleção de provedor e comportamento de failover.

## Geração de vídeo

O plugin integrado `openai` também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `openai/sora-2`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência/edição com um único vídeo
- Limites atuais: 1 imagem ou 1 vídeo de referência como entrada
- Restrição atual específica do OpenAI: o OpenClaw atualmente encaminha apenas sobrescritas de `size`
  para geração nativa de vídeo do OpenAI. Sobrescritas opcionais sem suporte
  como `aspectRatio`, `resolution`, `audio` e `watermark` são ignoradas
  e reportadas de volta como um aviso da ferramenta.

Para usar o OpenAI como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Veja [Geração de Vídeo](/pt-BR/tools/video-generation) para os parâmetros da ferramenta compartilhada,
seleção de provedor e comportamento de failover.

## Opção B: assinatura OpenAI Code (Codex)

**Ideal para:** usar acesso por assinatura do ChatGPT/Codex em vez de uma chave de API.
O Codex cloud exige login com ChatGPT, enquanto a CLI do Codex aceita login com ChatGPT ou com chave de API.

Resumo de rota:

- `openai-codex/gpt-5.4` = rota OAuth do ChatGPT/Codex
- Usa login do ChatGPT/Codex, não uma chave direta da API OpenAI Platform
- Limites do lado do provedor para `openai-codex/*` podem diferir da experiência web/app do ChatGPT

### Configuração pela CLI (OAuth do Codex)

```bash
# Execute o OAuth do Codex no wizard
openclaw onboard --auth-choice openai-codex

# Ou execute o OAuth diretamente
openclaw models auth login --provider openai-codex
```

### Exemplo de configuração (assinatura Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

A documentação atual do Codex do OpenAI lista `gpt-5.4` como o modelo atual do Codex. O OpenClaw
mapeia isso para `openai-codex/gpt-5.4` para uso com OAuth do ChatGPT/Codex.

Essa rota é intencionalmente separada de `openai/gpt-5.4`. Se você quiser o
caminho direto da API OpenAI Platform, use `openai/*` com uma chave de API. Se quiser
login com ChatGPT/Codex, use `openai-codex/*`.

Se o onboarding reutilizar um login existente da CLI do Codex, essas credenciais continuarão
sendo gerenciadas pela CLI do Codex. Quando expirarem, o OpenClaw relê primeiro a fonte externa do Codex
e, quando o provedor consegue renová-la, grava a credencial renovada
de volta no armazenamento do Codex em vez de assumir a posse em uma cópia separada apenas do OpenClaw.

Se sua conta Codex tiver direito ao Codex Spark, o OpenClaw também oferece suporte a:

- `openai-codex/gpt-5.3-codex-spark`

O OpenClaw trata o Codex Spark como exclusivo do Codex. Ele não expõe um caminho direto com chave de API
`openai/gpt-5.3-codex-spark`.

O OpenClaw também preserva `openai-codex/gpt-5.3-codex-spark` quando `pi-ai`
o descobre. Trate-o como dependente de direito e experimental: o Codex Spark é
separado de GPT-5.4 `/fast`, e a disponibilidade depende da conta Codex /
ChatGPT conectada.

### Limite de janela de contexto do Codex

O OpenClaw trata os metadados de modelo do Codex e o limite de contexto em runtime como
valores separados.

Para `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- limite padrão de `contextTokens` em runtime: `272000`

Isso mantém os metadados do modelo fiéis, preservando ao mesmo tempo a janela menor
de runtime que, na prática, tem melhores características de latência e qualidade.

Se você quiser um limite efetivo diferente, defina `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Use `contextWindow` apenas quando estiver declarando ou sobrescrevendo metadados nativos do modelo.
Use `contextTokens` quando quiser limitar o orçamento de contexto em runtime.

### Transporte padrão

O OpenClaw usa `pi-ai` para streaming de modelo. Para `openai/*` e
`openai-codex/*`, o transporte padrão é `"auto"` (WebSocket primeiro, depois
fallback para SSE).

No modo `"auto"`, o OpenClaw também tenta novamente uma falha inicial e recuperável de WebSocket
antes de cair para SSE. O modo forçado `"websocket"` ainda expõe erros de transporte
diretamente, em vez de ocultá-los atrás do fallback.

Após uma falha de conexão ou de WebSocket no início do turno no modo `"auto"`, o OpenClaw marca
o caminho de WebSocket dessa sessão como degradado por cerca de 60 segundos e envia
turnos subsequentes por SSE durante o período de resfriamento, em vez de oscilar entre
transportes.

Para endpoints nativos da família OpenAI (`openai/*`, `openai-codex/*` e Azure
OpenAI Responses), o OpenClaw também anexa estado estável de identidade de sessão e turno
às requisições para que tentativas, reconexões e fallback para SSE permaneçam alinhados à mesma
identidade de conversa. Em rotas nativas da família OpenAI, isso inclui cabeçalhos estáveis
de identidade de requisição de sessão/turno, além de metadados de transporte correspondentes.

O OpenClaw também normaliza contadores de uso do OpenAI entre variantes de transporte antes
que eles cheguem às superfícies de sessão/status. O tráfego nativo OpenAI/Codex Responses pode
informar uso como `input_tokens` / `output_tokens` ou
`prompt_tokens` / `completion_tokens`; o OpenClaw trata isso como os mesmos contadores de entrada
e saída para `/status`, `/usage` e logs de sessão. Quando o tráfego nativo por
WebSocket omite `total_tokens` (ou informa `0`), o OpenClaw recorre ao total
normalizado de entrada + saída para que exibições de sessão/status continuem preenchidas.

Você pode definir `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: força SSE
- `"websocket"`: força WebSocket
- `"auto"`: tenta WebSocket e depois usa fallback para SSE

Para `openai/*` (API Responses), o OpenClaw também ativa aquecimento de WebSocket por
padrão (`openaiWsWarmup: true`) quando o transporte WebSocket é usado.

Documentação relacionada do OpenAI:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Aquecimento de WebSocket do OpenAI

A documentação do OpenAI descreve o aquecimento como opcional. O OpenClaw o ativa por padrão para
`openai/*` para reduzir a latência do primeiro turno ao usar transporte WebSocket.

### Desativar aquecimento

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Ativar aquecimento explicitamente

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Processamento prioritário do OpenAI e Codex

A API do OpenAI expõe processamento prioritário via `service_tier=priority`. No
OpenClaw, defina `agents.defaults.models["<provider>/<model>"].params.serviceTier`
para encaminhar esse campo em endpoints nativos OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Os valores compatíveis são `auto`, `default`, `flex` e `priority`.

O OpenClaw encaminha `params.serviceTier` tanto para requisições diretas `openai/*` Responses
quanto para requisições `openai-codex/*` Codex Responses quando esses modelos apontam
para os endpoints nativos OpenAI/Codex.

Comportamento importante:

- `openai/*` direto deve apontar para `api.openai.com`
- `openai-codex/*` deve apontar para `chatgpt.com/backend-api`
- se você rotear qualquer um dos provedores por outra URL base ou proxy, o OpenClaw deixa `service_tier` inalterado

### Modo rápido do OpenAI

O OpenClaw expõe uma alternância compartilhada de modo rápido para sessões `openai/*` e
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Configuração: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando o modo rápido está ativado, o OpenClaw o mapeia para processamento prioritário do OpenAI:

- chamadas diretas `openai/*` Responses para `api.openai.com` enviam `service_tier = "priority"`
- chamadas `openai-codex/*` Responses para `chatgpt.com/backend-api` também enviam `service_tier = "priority"`
- valores `service_tier` já existentes no payload são preservados
- o modo rápido não reescreve `reasoning` nem `text.verbosity`

Para GPT 5.4 especificamente, a configuração mais comum é:

- enviar `/fast on` em uma sessão usando `openai/gpt-5.4` ou `openai-codex/gpt-5.4`
- ou definir `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- se você também usar OAuth do Codex, defina `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` também

Exemplo:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Sobrescritas de sessão têm precedência sobre a configuração. Limpar a sobrescrita da sessão na UI de Sessões
retorna a sessão ao padrão configurado.

### Rotas nativas OpenAI versus rotas compatíveis com OpenAI

O OpenClaw trata endpoints diretos OpenAI, Codex e Azure OpenAI de forma diferente
de proxies genéricos compatíveis com OpenAI em `/v1`:

- rotas nativas `openai/*`, `openai-codex/*` e Azure OpenAI mantêm
  `reasoning: { effort: "none" }` intacto quando você desativa explicitamente o reasoning
- rotas nativas da família OpenAI usam modo estrito por padrão para schemas de ferramentas
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version` e
  `User-Agent`) são anexados apenas em hosts nativos verificados do OpenAI
  (`api.openai.com`) e hosts nativos do Codex (`chatgpt.com/backend-api`)
- rotas nativas OpenAI/Codex preservam modelagem de requisição exclusiva do OpenAI, como
  `service_tier`, `store` de Responses, payloads de compatibilidade de reasoning do OpenAI e
  dicas de prompt-cache
- rotas compatíveis com OpenAI em estilo proxy mantêm o comportamento de compatibilidade mais flexível e
  não forçam schemas estritos de ferramentas, modelagem de requisição exclusiva nativa nem
  cabeçalhos ocultos de atribuição OpenAI/Codex

O Azure OpenAI permanece no grupo de roteamento nativo para comportamento de transporte e compatibilidade,
mas não recebe os cabeçalhos ocultos de atribuição OpenAI/Codex.

Isso preserva o comportamento atual do OpenAI Responses nativo sem forçar
shims antigos compatíveis com OpenAI em backends `/v1` de terceiros.

### Compactação no lado do servidor do OpenAI Responses

Para modelos diretos OpenAI Responses (`openai/*` usando `api: "openai-responses"` com
`baseUrl` em `api.openai.com`), o OpenClaw agora ativa automaticamente
dicas de payload de compactação no lado do servidor do OpenAI:

- Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
- Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`

Por padrão, `compact_threshold` é `70%` de `contextWindow` do modelo (ou `80000`
quando indisponível).

### Ativar explicitamente a compactação no lado do servidor

Use isso quando quiser forçar a injeção de `context_management` em modelos
Responses compatíveis (por exemplo Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Ativar com limite personalizado

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

### Desativar compactação no lado do servidor

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` controla apenas a injeção de `context_management`.
Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina
`supportsStore: false`.

## Observações

- Referências de modelo sempre usam `provider/model` (veja [/concepts/models](/pt-BR/concepts/models)).
- Detalhes de autenticação + regras de reutilização estão em [/concepts/oauth](/pt-BR/concepts/oauth).
