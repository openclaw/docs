---
read_when:
    - Você está criando um Plugin que precisa de before_tool_call, before_agent_reply, hooks de mensagem ou hooks de ciclo de vida
    - É necessário bloquear, reescrever ou exigir aprovação para chamadas de ferramenta de um Plugin
    - Você está decidindo entre ganchos internos e ganchos de Plugin
summary: 'Ganchos de Plugin: intercepte eventos do ciclo de vida de agente, ferramenta, mensagem, sessão e Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-05-03T21:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Hooks de plugins são pontos de extensão em processo para plugins do OpenClaw. Use-os
quando um plugin precisar inspecionar ou alterar execuções de agentes, chamadas de ferramentas, fluxo de mensagens,
ciclo de vida de sessões, roteamento de subagentes, instalações ou inicialização do Gateway.

Use [hooks internos](/pt-BR/automation/hooks) em vez disso quando quiser um pequeno
script `HOOK.md` instalado pelo operador para eventos de comando e do Gateway, como
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

Manipuladores de hook são executados sequencialmente em ordem decrescente de `priority`. Hooks com a mesma prioridade
mantêm a ordem de registro.

`api.on(name, handler, opts?)` aceita:

- `priority` — ordenação do manipulador (maior executa primeiro).
- `timeoutMs` — orçamento opcional por hook. Quando definido, o executor de hooks interrompe esse
  manipulador após o orçamento expirar e continua com o próximo, em vez de
  permitir que uma configuração lenta ou trabalho de recordação consuma o timeout de modelo
  configurado pelo chamador. Omita para usar o timeout padrão de observação/decisão que o
  executor de hooks aplica genericamente.

Operadores também podem definir orçamentos de hook sem alterar o código do plugin:

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

`hooks.timeouts.<hookName>` substitui `hooks.timeoutMs`, que substitui o valor
`api.on(..., { timeoutMs })` criado pelo plugin. Cada valor configurado deve
ser um inteiro positivo não maior que 600000 milissegundos. Prefira substituições por hook
para hooks conhecidos por serem lentos, para que um plugin não receba um orçamento maior
em todos os lugares.

Cada hook recebe `event.context.pluginConfig`, a configuração resolvida para o
plugin que registrou aquele manipulador. Use isso para decisões de hook que precisam das
opções atuais do plugin; o OpenClaw a injeta por manipulador sem modificar o
objeto de evento compartilhado visto por outros plugins.

## Catálogo de hooks

Hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, substituir ou exigir aprovação); todos os outros são
somente de observação.

**Turno do agente**

- `before_model_resolve` — substitui o provedor ou modelo antes de carregar as mensagens da sessão
- `agent_turn_prepare` — consome injeções de turno de plugin enfileiradas e adiciona contexto no mesmo turno antes dos hooks de prompt
- `before_prompt_build` — adiciona contexto dinâmico ou texto de prompt de sistema antes da chamada do modelo
- `before_agent_start` — fase combinada apenas para compatibilidade; prefira os dois hooks acima
- **`before_agent_reply`** — interrompe o turno do modelo com uma resposta sintética ou silêncio
- **`before_agent_finalize`** — inspeciona a resposta final natural e solicita mais uma passagem do modelo
- `agent_end` — observa mensagens finais, estado de sucesso e duração da execução
- `heartbeat_prompt_contribution` — adiciona contexto somente de Heartbeat para plugins de monitoramento em segundo plano e ciclo de vida

**Observação de conversa**

- `model_call_started` / `model_call_ended` — observa metadados higienizados de chamada de provedor/modelo, temporização, resultado e hashes limitados de IDs de solicitação sem conteúdo de prompt ou resposta
- `llm_input` — observa a entrada do provedor (prompt de sistema, prompt, histórico)
- `llm_output` — observa a saída do provedor

**Ferramentas**

- **`before_tool_call`** — reescreve parâmetros da ferramenta, bloqueia a execução ou exige aprovação
- `after_tool_call` — observa resultados de ferramenta, erros e duração
- **`tool_result_persist`** — reescreve a mensagem do assistente produzida a partir de um resultado de ferramenta
- **`before_message_write`** — inspeciona ou bloqueia uma gravação de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** — reivindica uma mensagem recebida antes do roteamento do agente (respostas sintéticas)
- `message_received` — observa conteúdo recebido, remetente, thread e metadados
- **`message_sending`** — reescreve conteúdo de saída ou cancela a entrega
- `message_sent` — observa sucesso ou falha na entrega de saída
- **`before_dispatch`** — inspeciona ou reescreve um despacho de saída antes da entrega ao canal
- **`reply_dispatch`** — participa do pipeline final de despacho de resposta

**Sessões e Compaction**

- `session_start` / `session_end` — rastreia limites do ciclo de vida da sessão
- `before_compaction` / `after_compaction` — observa ou anota ciclos de Compaction
- `before_reset` — observa eventos de redefinição de sessão (`/reset`, redefinições programáticas)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordena roteamento de subagentes e entrega de conclusão

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — inicia ou interrompe serviços pertencentes ao plugin junto com o Gateway
- `cron_changed` — observa mudanças no ciclo de vida de Cron pertencente ao gateway (adicionado, atualizado, removido, iniciado, finalizado, agendado)
- **`before_install`** — inspeciona varreduras de instalação de Skills ou plugins e opcionalmente bloqueia

## Política de chamadas de ferramenta

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
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

- `block: true` é terminal e ignora manipuladores de prioridade menor.
- `block: false` é tratado como ausência de decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e pergunta ao usuário por meio de aprovações
  de plugin. O comando `/approve` pode aprovar aprovações de exec e de plugin.
- Um `block: true` de prioridade menor ainda pode bloquear após um hook de prioridade maior
  ter solicitado aprovação.
- `onResolution` recebe a decisão de aprovação resolvida — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Plugins incluídos que precisam de política em nível de host podem registrar políticas de ferramenta confiáveis
com `api.registerTrustedToolPolicy(...)`. Elas são executadas antes dos hooks
`before_tool_call` comuns e antes das decisões de plugins externos. Use-as apenas
para verificações confiadas pelo host, como política de workspace, aplicação de orçamento ou
segurança de fluxos de trabalho reservados. Plugins externos devem usar hooks normais
`before_tool_call`.

### Persistência de resultado de ferramenta

Resultados de ferramenta podem incluir `details` estruturados para renderização de UI, diagnósticos,
roteamento de mídia ou metadados pertencentes ao plugin. Trate `details` como metadados de runtime,
não como conteúdo de prompt:

- O OpenClaw remove `toolResult.details` antes da reprodução no provedor e da entrada de Compaction,
  para que metadados não se tornem contexto do modelo.
- Entradas de sessão persistidas mantêm apenas `details` limitados. Detalhes grandes demais são
  substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final
  de persistência. Hooks ainda devem manter `details` retornados pequenos e evitar
  colocar texto relevante para o prompt apenas em `details`; coloque a saída de ferramenta visível ao modelo
  em `content`.

## Hooks de prompt e modelo

Use os hooks específicos de fase para novos plugins:

- `before_model_resolve`: recebe apenas o prompt atual e metadados de anexo.
  Retorne `providerOverride` ou `modelOverride`.
- `agent_turn_prepare`: recebe o prompt atual, mensagens de sessão preparadas
  e quaisquer injeções enfileiradas de execução única drenadas para esta sessão. Retorne
  `prependContext` ou `appendContext`.
- `before_prompt_build`: recebe o prompt atual e mensagens da sessão.
  Retorne `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution`: executa apenas para turnos de Heartbeat e retorna
  `prependContext` ou `appendContext`. Destina-se a monitores em segundo plano
  que precisam resumir o estado atual sem alterar turnos iniciados pelo usuário.

`before_agent_start` permanece para compatibilidade. Prefira os hooks explícitos acima
para que seu plugin não dependa de uma fase combinada legada.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa. O mesmo valor também está disponível em `ctx.runId`.
Execuções acionadas por Cron também expõem `ctx.jobId` (o ID do job Cron de origem) para que
hooks de plugin possam escopar métricas, efeitos colaterais ou estado para um job agendado
específico.

Para execuções originadas em canais, `ctx.messageProvider` é a superfície do provedor, como
`discord` ou `telegram`, enquanto `ctx.channelId` é o identificador de destino da conversa
quando o OpenClaw consegue derivar um a partir da chave de sessão ou dos metadados de
entrega.

`agent_end` é um hook de observação e executa em modo fire-and-forget após o turno. O
executor de hooks aplica um timeout de 30 segundos para que um plugin travado ou endpoint
de embeddings não possa deixar a promessa do hook pendente para sempre. Um timeout é registrado e
o OpenClaw continua; ele não cancela trabalho de rede pertencente ao plugin, a menos que o
plugin também use seu próprio sinal de aborto.

Use `model_call_started` e `model_call_ended` para telemetria de chamadas de provedor
que não deve receber prompts brutos, histórico, respostas, cabeçalhos, corpos de solicitação
ou IDs de solicitação do provedor. Esses hooks incluem metadados estáveis, como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcional,
`durationMs`/`outcome` terminal e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash limitado de ID de solicitação do provedor.

`before_agent_finalize` executa apenas quando um harness está prestes a aceitar uma resposta
final natural do assistente. Ele não é o caminho de cancelamento `/stop` e não
executa quando o usuário interrompe um turno. Retorne `{ action: "revise", reason }` para pedir
ao harness mais uma passagem do modelo antes da finalização, `{ action:
"finalize", reason? }` para forçar a finalização, ou omita um resultado para continuar.
Hooks nativos `Stop` do Codex são retransmitidos para este hook como decisões
`before_agent_finalize` do OpenClaw.

Plugins não incluídos que precisam de `llm_input`, `llm_output`,
`before_agent_finalize` ou `agent_end` devem definir:

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

Hooks que modificam prompts e injeções duráveis para o próximo turno podem ser desabilitados por plugin
com `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensões de sessão e injeções no próximo turno

Plugins de fluxo de trabalho podem persistir pequeno estado de sessão compatível com JSON com
`api.registerSessionExtension(...)` e atualizá-lo pelo método
`sessions.pluginPatch` do Gateway. Linhas de sessão projetam estado de extensão registrado
por meio de `pluginExtensions`, permitindo que Control UI e outros clientes renderizem
status pertencente ao plugin sem conhecer os detalhes internos do plugin.

Use `api.enqueueNextTurnInjection(...)` quando um plugin precisa de contexto durável para
chegar ao próximo turno do modelo exatamente uma vez. O OpenClaw drena as injeções enfileiradas antes dos
hooks de prompt, descarta injeções expiradas e faz deduplicação por `idempotencyKey`
por plugin. Esta é a interface correta para retomadas de aprovação, resumos de política,
deltas de monitores em segundo plano e continuações de comandos que devem ficar visíveis para
o modelo no próximo turno, mas não devem se tornar texto permanente do prompt do sistema.

As semânticas de limpeza fazem parte do contrato. A limpeza de extensão de sessão e os
callbacks de limpeza do ciclo de vida em runtime recebem `reset`, `delete`, `disable` ou
`restart`. O host remove o estado persistente da extensão de sessão do plugin proprietário
e as injeções pendentes do próximo turno para reset/delete/disable; restart mantém
o estado durável da sessão enquanto os callbacks de limpeza permitem que os plugins liberem tarefas de
agendador, contexto de execução e outros recursos fora de banda da antiga geração de
runtime.

## Hooks de mensagem

Use hooks de mensagem para roteamento e política de entrega no nível do canal:

- `message_received`: observe conteúdo de entrada, remetente, `threadId`, `messageId`,
  `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescreva `content` ou retorne `{ cancel: true }`.
- `message_sent`: observe sucesso ou falha final.

Para respostas TTS somente com áudio, `content` pode conter a transcrição falada oculta
mesmo quando o payload do canal não tem texto/legenda visível. Reescrever esse
`content` atualiza apenas a transcrição visível ao hook; ela não é renderizada como uma
legenda de mídia.

Os contextos de hooks de mensagem expõem campos de correlação estáveis quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Prefira
esses campos de primeira classe antes de ler metadados legados.

Prefira os campos tipados `threadId` e `replyToId` antes de usar metadados
específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como nenhuma decisão.
- `content` reescrito continua para hooks de menor prioridade, a menos que um hook posterior
  cancele a entrega.

## Hooks de instalação

`before_install` executa após a varredura integrada para instalações de skill e plugin.
Retorne achados adicionais ou `{ block: true, blockReason }` para interromper a
instalação.

`block: true` é terminal. `block: false` é tratado como nenhuma decisão.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços de plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualizações de Cron. Use `gateway_stop` para limpar recursos
de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime
pertencentes ao plugin.

`cron_changed` dispara para eventos de ciclo de vida de Cron pertencentes ao Gateway com um payload de
evento tipado que cobre os motivos `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. O evento carrega um snapshot `PluginHookGatewayCronJob`
(incluindo `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presente), além de um `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Eventos removidos
ainda carregam o snapshot da tarefa excluída para que agendadores externos possam
reconciliar o estado. Use `ctx.getCron?.()` e `ctx.config` do contexto de runtime
ao sincronizar agendadores externos de ativação, e mantenha o OpenClaw como a
fonte da verdade para verificações de vencimento e execução.

## Próximas descontinuações

Algumas superfícies adjacentes a hooks estão obsoletas, mas ainda são compatíveis. Migre
antes da próxima versão principal:

- **Envelopes de canal em texto simples** em handlers `inbound_claim` e `message_received`.
  Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar texto plano de envelope. Consulte
  [Envelopes de canal em texto simples → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da fase
  combinada.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de uma `string` de formato livre.

Para a lista completa — registro de capacidade de memória, perfil de raciocínio do provedor,
provedores externos de autenticação, tipos de descoberta de provedor, acessores de runtime
de tarefa e a renomeação de `command-auth` → `command-status` — consulte
[Migração do Plugin SDK → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionados

- [Migração do Plugin SDK](/pt-BR/plugins/sdk-migration) — descontinuações ativas e cronograma de remoção
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada de plugin](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals)
