---
read_when:
    - Você está criando um Plugin que precisa de before_tool_call, before_agent_reply, ganchos de mensagem ou ganchos de ciclo de vida
    - É necessário bloquear, reescrever ou exigir aprovação para chamadas de ferramentas de um Plugin
    - Você está decidindo entre ganchos internos e ganchos de Plugin
summary: 'Ganchos de Plugin: intercepte eventos de ciclo de vida de agente, ferramenta, mensagem, sessão e Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Os hooks de Plugin são pontos de extensão in-process para plugins do OpenClaw. Use-os
quando um plugin precisa inspecionar ou alterar execuções de agentes, chamadas de ferramentas, fluxo de mensagens,
ciclo de vida de sessões, roteamento de subagentes, instalações ou inicialização do Gateway.

Use [hooks internos](/pt-BR/automation/hooks) quando quiser um pequeno script
`HOOK.md` instalado pelo operador para eventos de comando e Gateway, como
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Início rápido

Registre hooks tipados de plugin com `api.on(...)` a partir da entrada do seu plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Os manipuladores de hook são executados sequencialmente em ordem decrescente de `priority`.
Hooks com a mesma prioridade mantêm a ordem de registro.

`api.on(name, handler, opts?)` aceita:

- `priority` - ordenação do manipulador (maior executa primeiro).
- `timeoutMs` - orçamento opcional por hook. Quando definido, o executor de hooks aborta esse
  manipulador depois que o orçamento expira e continua com o próximo, em vez de
  permitir que uma configuração lenta ou um trabalho de recall consuma o timeout de modelo
  configurado pelo chamador. Omita para usar o timeout padrão de observação/decisão que o
  executor de hooks aplica genericamente.

Operadores também podem definir orçamentos de hook sem modificar código de plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` sobrescreve `hooks.timeoutMs`, que sobrescreve o
valor `api.on(..., { timeoutMs })` criado pelo plugin. Cada valor configurado deve
ser um inteiro positivo não maior que 600000 milissegundos. Prefira substituições
por hook para hooks sabidamente lentos, para que um plugin não receba um orçamento maior
em todos os lugares.

Cada hook recebe `event.context.pluginConfig`, a configuração resolvida para o
plugin que registrou esse manipulador. Use-a para decisões de hook que precisam das
opções atuais do plugin; o OpenClaw a injeta por manipulador sem modificar o
objeto de evento compartilhado visto por outros plugins.

## Catálogo de hooks

Os hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, sobrescrever ou exigir aprovação); todos os outros são
somente de observação.

**Turno do agente**

- `before_model_resolve` - sobrescreve o provedor ou o modelo antes que as mensagens da sessão sejam carregadas
- `agent_turn_prepare` - consome injeções de turno de plugin enfileiradas e adiciona contexto no mesmo turno antes dos hooks de prompt
- `before_prompt_build` - adiciona contexto dinâmico ou texto de prompt do sistema antes da chamada ao modelo
- `before_agent_start` - fase combinada apenas para compatibilidade; prefira os dois hooks acima
- **`before_agent_run`** - inspeciona o prompt final e as mensagens da sessão antes do envio ao modelo e, opcionalmente, bloqueia a execução
- **`before_agent_reply`** - interrompe o turno do modelo com uma resposta sintética ou silêncio
- **`before_agent_finalize`** - inspeciona a resposta final natural e solicita mais uma passagem pelo modelo
- `agent_end` - observa mensagens finais, estado de sucesso e duração da execução
- `heartbeat_prompt_contribution` - adiciona contexto apenas de Heartbeat para plugins de monitoramento em segundo plano e ciclo de vida

**Observação da conversa**

- `model_call_started` / `model_call_ended` - observa metadados higienizados de chamadas de provedor/modelo, temporização, resultado e hashes delimitados de ID de solicitação sem conteúdo de prompt ou resposta
- `llm_input` - observa a entrada do provedor (prompt do sistema, prompt, histórico)
- `llm_output` - observa a saída do provedor

**Ferramentas**

- **`before_tool_call`** - reescreve parâmetros da ferramenta, bloqueia a execução ou exige aprovação
- `after_tool_call` - observa resultados da ferramenta, erros e duração
- **`tool_result_persist`** - reescreve a mensagem do assistente produzida a partir do resultado de uma ferramenta
- **`before_message_write`** - inspeciona ou bloqueia uma gravação de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** - reivindica uma mensagem recebida antes do roteamento do agente (respostas sintéticas)
- `message_received` - observa conteúdo recebido, remetente, thread e metadados
- **`message_sending`** - reescreve conteúdo de saída ou cancela a entrega
- `message_sent` - observa sucesso ou falha na entrega de saída
- **`before_dispatch`** - inspeciona ou reescreve um despacho de saída antes da entrega ao canal
- **`reply_dispatch`** - participa do pipeline final de despacho de resposta

**Sessões e Compaction**

- `session_start` / `session_end` - rastreia limites do ciclo de vida da sessão
- `before_compaction` / `after_compaction` - observa ou anota ciclos de Compaction
- `before_reset` - observa eventos de redefinição de sessão (`/reset`, redefinições programáticas)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordena o roteamento de subagentes e a entrega de conclusão

**Ciclo de vida**

- `gateway_start` / `gateway_stop` - inicia ou para serviços pertencentes ao plugin com o Gateway
- `cron_changed` - observa mudanças no ciclo de vida de Cron pertencente ao gateway (adicionado, atualizado, removido, iniciado, finalizado, agendado)
- **`before_install`** - inspeciona varreduras de instalação de skill ou plugin e, opcionalmente, bloqueia

## Política de chamada de ferramenta

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
- `event.derivedPaths` opcional, contendo dicas de caminho de destino derivadas do host em melhor esforço
  para envelopes de ferramenta conhecidos, como `apply_patch`; quando presentes,
  esses caminhos podem estar incompletos ou podem superestimar o que a ferramenta
  realmente tocará (por exemplo, com entradas malformadas ou parciais)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (definido em execuções acionadas por Cron) e `ctx.trace` de diagnóstico

Ele pode retornar:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Regras:

- `block: true` é terminal e ignora manipuladores de menor prioridade.
- `block: false` é tratado como nenhuma decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e solicita ao usuário por meio de aprovações
  de plugin. O comando `/approve` pode aprovar tanto exec quanto aprovações de plugin.
- Um `block: true` de menor prioridade ainda pode bloquear depois que um hook de maior prioridade
  solicitou aprovação.
- `onResolution` recebe a decisão de aprovação resolvida - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Plugins incluídos que precisam de política em nível de host podem registrar políticas de ferramenta confiáveis
com `api.registerTrustedToolPolicy(...)`. Elas são executadas antes dos hooks comuns de
`before_tool_call` e antes de decisões de plugins externos. Use-as apenas
para gates confiáveis pelo host, como política de workspace, aplicação de orçamento ou
segurança de fluxos de trabalho reservados. Plugins externos devem usar hooks normais de `before_tool_call`.

### Persistência de resultado de ferramenta

Resultados de ferramentas podem incluir `details` estruturados para renderização de UI, diagnósticos,
roteamento de mídia ou metadados pertencentes ao plugin. Trate `details` como metadados de runtime,
não como conteúdo de prompt:

- O OpenClaw remove `toolResult.details` antes da reprodução pelo provedor e da entrada de Compaction
  para que metadados não se tornem contexto do modelo.
- Entradas de sessão persistidas mantêm apenas `details` delimitados. Detalhes grandes demais são
  substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final
  de persistência. Ainda assim, hooks devem manter `details` retornados pequenos e evitar
  colocar texto relevante ao prompt apenas em `details`; coloque a saída de ferramenta visível ao modelo
  em `content`.

## Hooks de prompt e modelo

Use os hooks específicos por fase para novos plugins:

- `before_model_resolve`: recebe apenas o prompt atual e os metadados de anexos.
  Retorne `providerOverride` ou `modelOverride`.
- `agent_turn_prepare`: recebe o prompt atual, mensagens de sessão preparadas
  e quaisquer injeções enfileiradas exatamente uma vez drenadas para esta sessão. Retorne
  `prependContext` ou `appendContext`.
- `before_prompt_build`: recebe o prompt atual e as mensagens da sessão.
  Retorne `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution`: executa apenas para turnos de Heartbeat e retorna
  `prependContext` ou `appendContext`. Ele é destinado a monitores em segundo plano
  que precisam resumir o estado atual sem alterar turnos iniciados pelo usuário.

`before_agent_start` permanece para compatibilidade. Prefira os hooks explícitos acima
para que seu plugin não dependa de uma fase combinada legada.

`before_agent_run` executa depois da construção do prompt e antes de qualquer entrada de modelo,
incluindo o carregamento de imagens locais ao prompt e a observação `llm_input`. Ele recebe
a entrada atual do usuário como `prompt`, além do histórico da sessão carregado em `messages`
e o prompt do sistema ativo. Retorne `{ outcome: "block", reason, message? }`
para interromper a execução antes que o modelo possa ler o prompt. `reason` é interno;
`message` é a substituição voltada ao usuário. Os únicos resultados compatíveis são
`pass` e `block`; formatos de decisão sem suporte falham fechados.

Quando uma execução é bloqueada, o OpenClaw armazena apenas o texto de substituição em
`message.content` mais metadados de bloqueio não sensíveis, como o ID do plugin bloqueador
e o carimbo de data/hora. O texto original do usuário não é retido na transcrição nem no contexto futuro.
Motivos internos de bloqueio são tratados como sensíveis e excluídos de
transcrição, histórico, broadcast, log e cargas de diagnóstico. A observabilidade
deve usar campos higienizados, como ID do bloqueador, resultado, carimbo de data/hora ou uma categoria
segura.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa. O mesmo valor também está disponível em `ctx.runId`.
Execuções acionadas por Cron também expõem `ctx.jobId` (o ID do trabalho Cron de origem) para que
hooks de plugin possam escopar métricas, efeitos colaterais ou estado a um trabalho agendado
específico.

Para execuções originadas por canal, `ctx.messageProvider` é a superfície do provedor, como
`discord` ou `telegram`, enquanto `ctx.channelId` é o identificador de destino da conversa
quando o OpenClaw consegue derivá-lo da chave da sessão ou dos metadados de entrega.

`agent_end` é um hook de observação e executa fire-and-forget após o turno. O
executor de hooks aplica um timeout de 30 segundos para que um plugin travado ou endpoint
de embedding não deixe a promise do hook pendente para sempre. Um timeout é registrado em log e
o OpenClaw continua; ele não cancela trabalho de rede pertencente ao plugin, a menos que o
plugin também use seu próprio sinal de aborto.

Use `model_call_started` e `model_call_ended` para telemetria de chamadas de provedor
que não deve receber prompts brutos, histórico, respostas, cabeçalhos, corpos de solicitação
ou IDs de solicitação do provedor. Esses hooks incluem metadados estáveis, como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionais,
`durationMs`/`outcome` terminal e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash delimitado do ID de solicitação do provedor.

`before_agent_finalize` é executado somente quando um harness está prestes a aceitar uma
resposta final natural do assistente. Ele não é o caminho de cancelamento `/stop` e não
é executado quando o usuário aborta um turno. Retorne `{ action: "revise", reason }` para pedir
ao harness mais uma passagem do modelo antes da finalização, `{ action:
"finalize", reason? }` para forçar a finalização, ou omita um resultado para continuar.
Hooks `Stop` nativos do Codex são repassados para este hook como decisões
`before_agent_finalize` do OpenClaw.

Ao retornar `action: "revise"`, plugins podem incluir metadados `retry` para tornar
a passagem extra do modelo limitada e segura para repetição:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` é anexada ao motivo de revisão enviado ao harness.
`idempotencyKey` permite que o host conte novas tentativas para a mesma solicitação de plugin entre
decisões de finalização equivalentes, e `maxAttempts` limita quantas passagens extras o
host permitirá antes de continuar com a resposta final natural.

Plugins não empacotados que precisam de hooks de conversa brutos (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` ou `before_agent_run`) devem definir:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hooks que modificam prompts e injeções duráveis no próximo turno podem ser desativados por plugin
com `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensões de sessão e injeções no próximo turno

Plugins de fluxo de trabalho podem persistir um pequeno estado de sessão compatível com JSON usando
`api.registerSessionExtension(...)` e atualizá-lo por meio do método do Gateway
`sessions.pluginPatch`. Linhas de sessão projetam o estado de extensão registrado
por meio de `pluginExtensions`, permitindo que a Control UI e outros clientes renderizem
status pertencente ao plugin sem conhecer detalhes internos do plugin.

Use `api.enqueueNextTurnInjection(...)` quando um plugin precisar que contexto durável
chegue ao próximo turno do modelo exatamente uma vez. O OpenClaw drena injeções enfileiradas antes dos
hooks de prompt, descarta injeções expiradas e desduplica por `idempotencyKey`
por plugin. Esta é a interface correta para retomadas de aprovação, resumos de política,
deltas de monitores em segundo plano e continuações de comandos que devem ficar visíveis para
o modelo no próximo turno, mas não devem se tornar texto permanente do prompt de sistema.

As semânticas de limpeza fazem parte do contrato. Callbacks de limpeza de extensão de sessão e
de limpeza do ciclo de vida de runtime recebem `reset`, `delete`, `disable` ou
`restart`. O host remove o estado persistente de extensão de sessão do plugin proprietário
e as injeções pendentes no próximo turno para reset/delete/disable; restart mantém
o estado durável da sessão enquanto callbacks de limpeza permitem que plugins liberem jobs do agendador,
contexto de execução e outros recursos fora de banda para a geração antiga do runtime.

## Hooks de mensagem

Use hooks de mensagem para roteamento e política de entrega no nível do canal:

- `message_received`: observe conteúdo de entrada, remetente, `threadId`, `messageId`,
  `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescreva `content` ou retorne `{ cancel: true }`.
- `message_sent`: observe sucesso ou falha final.

Para respostas TTS somente com áudio, `content` pode conter a transcrição falada oculta
mesmo quando a carga útil do canal não tem texto/legenda visível. Reescrever esse
`content` atualiza apenas a transcrição visível ao hook; ela não é renderizada como
legenda de mídia.

Contextos de hooks de mensagem expõem campos de correlação estáveis quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Prefira
esses campos de primeira classe antes de ler metadados legados.

Prefira os campos tipados `threadId` e `replyToId` antes de usar metadados
específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como ausência de decisão.
- `content` reescrito continua para hooks de menor prioridade, a menos que um hook posterior
  cancele a entrega.
- `message_sending` pode retornar `cancelReason` e `metadata` limitado com um
  cancelamento. Novas APIs de ciclo de vida de mensagem expõem isso como um resultado de entrega suprimida
  com motivo `cancelled_by_message_sending_hook`; a entrega direta legada
  continua retornando um array de resultados vazio por compatibilidade.
- `message_sent` é apenas observação. Falhas de handlers são registradas em log e não
  alteram o resultado da entrega.

## Hooks de instalação

`before_install` é executado após a varredura integrada para instalações de Skills e plugins.
Retorne achados adicionais ou `{ block: true, blockReason }` para interromper a
instalação.

`block: true` é terminal. `block: false` é tratado como ausência de decisão.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços de plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualizações de cron. Use `gateway_stop` para limpar recursos
de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime
pertencentes ao plugin.

`cron_changed` é disparado para eventos de ciclo de vida de cron pertencentes ao Gateway com uma carga útil de evento
tipada cobrindo os motivos `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. O evento carrega um snapshot `PluginHookGatewayCronJob`
(incluindo `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presentes) mais um `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Eventos removidos
ainda carregam o snapshot do job excluído para que agendadores externos possam
reconciliar o estado. Use `ctx.getCron?.()` e `ctx.config` do contexto de runtime
ao sincronizar agendadores externos de despertar, e mantenha o OpenClaw como a
fonte da verdade para verificações de vencimento e execução.

## Descontinuações futuras

Algumas superfícies adjacentes a hooks foram descontinuadas, mas ainda têm suporte. Migre
antes do próximo lançamento principal:

- **Envelopes de canal em texto simples** em handlers `inbound_claim` e `message_received`.
  Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar texto de envelope plano. Consulte
  [Envelopes de canal em texto simples → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da fase combinada.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de uma `string` de formato livre.

Para a lista completa - registro de capacidade de memória, perfil de raciocínio do provedor,
provedores de autenticação externa, tipos de descoberta de provedores, acessores de runtime de tarefas
e a renomeação `command-auth` → `command-status` - consulte
[Migração do Plugin SDK → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migração do Plugin SDK](/pt-BR/plugins/sdk-migration) - descontinuações ativas e cronograma de remoção
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada do Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals)
