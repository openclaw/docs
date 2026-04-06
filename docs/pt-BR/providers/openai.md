---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer usar auth por assinatura do Codex em vez de chaves de API
summary: Use a OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T03:11:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e04db5787f6ed7b1eda04d965c10febae10809fc82ae4d9769e7163234471f5
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

A OpenAI oferece APIs para desenvolvedores para modelos GPT. O Codex oferece suporte a **login com ChatGPT** para
acesso por assinatura ou **login com chave de API** para acesso baseado em uso. O Codex cloud exige login com ChatGPT.
A OpenAI oferece suporte explícito ao uso de OAuth por assinatura em ferramentas/fluxos de trabalho externos como o OpenClaw.

## Estilo de interação padrão

O OpenClaw pode adicionar uma pequena sobreposição de prompt específica da OpenAI para execuções `openai/*` e
`openai-codex/*`. Por padrão, a sobreposição mantém o assistente acolhedor,
colaborativo, conciso, direto e um pouco mais expressivo emocionalmente,
sem substituir o prompt de sistema base do OpenClaw. A sobreposição amigável também
permite o uso ocasional de emoji quando isso se encaixa naturalmente, mantendo a
saída geral concisa.

Chave de configuração:

`plugins.entries.openai.config.personality`

Valores permitidos:

- `"friendly"`: padrão; habilita a sobreposição específica da OpenAI.
- `"off"`: desabilita a sobreposição e usa apenas o prompt base do OpenClaw.

Escopo:

- Aplica-se a modelos `openai/*`.
- Aplica-se a modelos `openai-codex/*`.
- Não afeta outros providers.

Esse comportamento vem habilitado por padrão. Mantenha `"friendly"` explicitamente se quiser que
isso sobreviva a futuras mudanças locais de configuração:

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

### Desabilitar a sobreposição de prompt da OpenAI

Se você quiser o prompt base não modificado do OpenClaw, defina a sobreposição como `"off"`:

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

Você também pode defini-la diretamente com a CLI de configuração:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Opção A: chave de API da OpenAI (OpenAI Platform)

**Melhor para:** acesso direto à API e cobrança baseada em uso.
Obtenha sua chave de API no painel da OpenAI.

### Configuração pela CLI

```bash
openclaw onboard --auth-choice openai-api-key
# ou de forma não interativa
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Exemplo de configuração

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

A documentação atual de modelos de API da OpenAI lista `gpt-5.4` e `gpt-5.4-pro` para uso direto
da API da OpenAI. O OpenClaw encaminha ambos pelo caminho `openai/*` Responses.
O OpenClaw intencionalmente suprime a entrada desatualizada `openai/gpt-5.3-codex-spark`,
porque chamadas diretas à API da OpenAI a rejeitam em tráfego real.

O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark` no caminho direto da API da OpenAI.
O `pi-ai` ainda inclui uma entrada integrada para esse modelo, mas solicitações reais da API da OpenAI
atualmente o rejeitam. O Spark é tratado como exclusivo do Codex no OpenClaw.

## Geração de imagem

O plugin empacotado `openai` também registra geração de imagem por meio da ferramenta compartilhada
`image_generate`.

- Modelo de imagem padrão: `openai/gpt-image-1`
- Geração: até 4 imagens por solicitação
- Modo de edição: habilitado, com até 5 imagens de referência
- Suporta `size`
- Limitação atual específica da OpenAI: o OpenClaw não encaminha sobrescritas de `aspectRatio` nem
  `resolution` para a OpenAI Images API no momento

Para usar a OpenAI como provider padrão de imagem:

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

Consulte [Geração de imagem](/pt-BR/tools/image-generation) para os parâmetros
compartilhados da ferramenta, seleção de provider e comportamento de failover.

## Geração de vídeo

O plugin empacotado `openai` também registra geração de vídeo por meio da ferramenta compartilhada
`video_generate`.

- Modelo de vídeo padrão: `openai/sora-2`
- Modos: texto para vídeo, imagem para vídeo e fluxos de referência/edição com um único vídeo
- Limites atuais: 1 imagem ou 1 vídeo de referência
- Limitação atual específica da OpenAI: o OpenClaw atualmente encaminha apenas sobrescritas de `size`
  para geração nativa de vídeo da OpenAI. Sobrescritas opcionais não suportadas
  como `aspectRatio`, `resolution`, `audio` e `watermark` são ignoradas
  e retornadas como aviso de ferramenta.

Para usar a OpenAI como provider padrão de vídeo:

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

Consulte [Geração de vídeo](/tools/video-generation) para os parâmetros
compartilhados da ferramenta, seleção de provider e comportamento de failover.

## Opção B: assinatura OpenAI Code (Codex)

**Melhor para:** usar acesso por assinatura do ChatGPT/Codex em vez de uma chave de API.
O Codex cloud exige login com ChatGPT, enquanto a CLI do Codex oferece suporte a login com ChatGPT ou chave de API.

### Configuração pela CLI (Codex OAuth)

```bash
# Executar o OAuth do Codex no assistente
openclaw onboard --auth-choice openai-codex

# Ou executar o OAuth diretamente
openclaw models auth login --provider openai-codex
```

### Exemplo de configuração (assinatura Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

A documentação atual do Codex da OpenAI lista `gpt-5.4` como o modelo atual do Codex. O OpenClaw
o mapeia para `openai-codex/gpt-5.4` para uso com OAuth do ChatGPT/Codex.

Se o onboarding reutilizar um login existente da CLI do Codex, essas credenciais continuarão
sendo gerenciadas pela CLI do Codex. Quando expirarem, o OpenClaw relê primeiro a fonte externa do Codex
e, quando o provider consegue renová-las, grava a credencial renovada
de volta no armazenamento do Codex em vez de assumir a posse em uma cópia separada apenas do OpenClaw.

Se sua conta do Codex tiver direito ao Codex Spark, o OpenClaw também oferece suporte a:

- `openai-codex/gpt-5.3-codex-spark`

O OpenClaw trata Codex Spark como exclusivo do Codex. Ele não expõe um caminho direto de chave de API
`openai/gpt-5.3-codex-spark`.

O OpenClaw também preserva `openai-codex/gpt-5.3-codex-spark` quando o `pi-ai`
o descobre. Trate-o como dependente de direito de uso e experimental: o Codex Spark é
separado do GPT-5.4 `/fast`, e a disponibilidade depende da conta Codex /
ChatGPT conectada.

### Limite de janela de contexto do Codex

O OpenClaw trata os metadados do modelo Codex e o limite de contexto do runtime como
valores separados.

Para `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- limite padrão de `contextTokens` em runtime: `272000`

Isso mantém os metadados do modelo fiéis, preservando ao mesmo tempo a menor janela
padrão de runtime que, na prática, tem melhores características de latência e qualidade.

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

Use `contextWindow` apenas quando estiver declarando ou sobrescrevendo metadados nativos
do modelo. Use `contextTokens` quando quiser limitar o orçamento de contexto em runtime.

### Transporte padrão

O OpenClaw usa `pi-ai` para streaming de modelos. Para `openai/*` e
`openai-codex/*`, o transporte padrão é `"auto"` (WebSocket primeiro, depois
fallback para SSE).

No modo `"auto"`, o OpenClaw também tenta novamente uma falha inicial de WebSocket que possa ser repetida
antes de fazer fallback para SSE. O modo `"websocket"` forçado ainda expõe erros de transporte diretamente
em vez de escondê-los por trás do fallback.

Após uma falha de conexão ou uma falha inicial de turno de WebSocket no modo `"auto"`, o OpenClaw marca
o caminho de WebSocket daquela sessão como degradado por cerca de 60 segundos e envia
os turnos seguintes por SSE durante o período de resfriamento, em vez de alternar
entre transportes de forma instável.

Para endpoints nativos da família OpenAI (`openai/*`, `openai-codex/*` e Azure
OpenAI Responses), o OpenClaw também anexa estado estável de identidade de sessão e turno
às solicitações para que tentativas, reconexões e fallback para SSE permaneçam alinhados à mesma
identidade de conversa. Em rotas nativas da família OpenAI isso inclui cabeçalhos estáveis de identidade de solicitação
de sessão/turno, além de metadados de transporte correspondentes.

O OpenClaw também normaliza contadores de uso da OpenAI entre variantes de transporte antes que
eles cheguem às superfícies de sessão/status. O tráfego nativo OpenAI/Codex Responses pode
relatar uso como `input_tokens` / `output_tokens` ou
`prompt_tokens` / `completion_tokens`; o OpenClaw trata isso como os mesmos contadores de entrada
e saída para `/status`, `/usage` e logs de sessão. Quando o tráfego nativo
de WebSocket omite `total_tokens` (ou relata `0`), o OpenClaw usa fallback para
o total normalizado de entrada + saída para que as exibições de sessão/status permaneçam preenchidas.

Você pode definir `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: força SSE
- `"websocket"`: força WebSocket
- `"auto"`: tenta WebSocket e depois faz fallback para SSE

Para `openai/*` (Responses API), o OpenClaw também habilita aquecimento de WebSocket por padrão
(`openaiWsWarmup: true`) quando o transporte WebSocket é usado.

Documentação relacionada da OpenAI:

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

### Aquecimento de WebSocket da OpenAI

A documentação da OpenAI descreve o aquecimento como opcional. O OpenClaw o habilita por padrão para
`openai/*` para reduzir a latência do primeiro turno ao usar transporte WebSocket.

### Desabilitar o aquecimento

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

### Habilitar o aquecimento explicitamente

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

### Processamento prioritário da OpenAI e do Codex

A API da OpenAI expõe processamento prioritário por meio de `service_tier=priority`. No
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

O OpenClaw encaminha `params.serviceTier` para solicitações Responses diretas `openai/*`
e solicitações Codex Responses `openai-codex/*` quando esses modelos apontam
para os endpoints nativos OpenAI/Codex.

Comportamento importante:

- `openai/*` direto deve apontar para `api.openai.com`
- `openai-codex/*` deve apontar para `chatgpt.com/backend-api`
- se você rotear qualquer um dos providers por outra URL base ou proxy, o OpenClaw deixará `service_tier` inalterado

### Modo rápido da OpenAI

O OpenClaw expõe uma alternância compartilhada de modo rápido para sessões `openai/*` e
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Configuração: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando o modo rápido está habilitado, o OpenClaw o mapeia para processamento prioritário da OpenAI:

- chamadas Responses diretas `openai/*` para `api.openai.com` enviam `service_tier = "priority"`
- chamadas Responses `openai-codex/*` para `chatgpt.com/backend-api` também enviam `service_tier = "priority"`
- valores existentes de `service_tier` no payload são preservados
- o modo rápido não reescreve `reasoning` nem `text.verbosity`

Para o GPT 5.4 especificamente, a configuração mais comum é:

- enviar `/fast on` em uma sessão usando `openai/gpt-5.4` ou `openai-codex/gpt-5.4`
- ou definir `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- se você também usa OAuth do Codex, defina `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` também

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

Sobrescritas de sessão têm precedência sobre a configuração. Limpar a sobrescrita da sessão na UI de Sessions
faz a sessão voltar ao padrão configurado.

### Rotas nativas OpenAI versus rotas compatíveis com OpenAI

O OpenClaw trata endpoints diretos OpenAI, Codex e Azure OpenAI de forma diferente
de proxies genéricos compatíveis com OpenAI `/v1`:

- rotas nativas `openai/*`, `openai-codex/*` e Azure OpenAI mantêm
  `reasoning: { effort: "none" }` intacto quando você desabilita reasoning explicitamente
- rotas nativas da família OpenAI usam schemas de ferramenta em modo estrito por padrão
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version` e
  `User-Agent`) são anexados apenas em hosts nativos OpenAI verificados
  (`api.openai.com`) e hosts nativos Codex (`chatgpt.com/backend-api`)
- rotas nativas OpenAI/Codex mantêm formatação de solicitação exclusiva da OpenAI, como
  `service_tier`, Responses `store`, payloads de compatibilidade de reasoning da OpenAI e
  dicas de cache de prompt
- rotas compatíveis com OpenAI em estilo proxy mantêm o comportamento compatível mais flexível e não
  forçam schemas de ferramenta estritos, formatação de solicitação exclusiva das rotas nativas nem
  cabeçalhos ocultos de atribuição OpenAI/Codex

O Azure OpenAI continua no grupo de roteamento nativo para comportamento de transporte e compatibilidade,
mas não recebe os cabeçalhos ocultos de atribuição OpenAI/Codex.

Isso preserva o comportamento atual do OpenAI Responses nativo sem impor shims
mais antigos compatíveis com OpenAI em backends `/v1` de terceiros.

### Compactação no lado do servidor do OpenAI Responses

Para modelos diretos OpenAI Responses (`openai/*` usando `api: "openai-responses"` com
`baseUrl` em `api.openai.com`), o OpenClaw agora habilita automaticamente
dicas de payload de compactação no lado do servidor da OpenAI:

- Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
- Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`

Por padrão, `compact_threshold` é `70%` do `contextWindow` do modelo (ou `80000`
quando indisponível).

### Habilitar explicitamente a compactação no lado do servidor

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

### Habilitar com um limite personalizado

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

### Desabilitar a compactação no lado do servidor

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

- Refs de modelo sempre usam `provider/model` (consulte [/concepts/models](/pt-BR/concepts/models)).
- Detalhes de auth + regras de reutilização estão em [/concepts/oauth](/pt-BR/concepts/oauth).
