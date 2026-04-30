---
read_when:
    - Você está criando um Plugin que precisa de `before_tool_call`, `before_agent_reply`, hooks de mensagem ou hooks de ciclo de vida
    - Você precisa bloquear, reescrever ou exigir aprovação para chamadas de ferramentas de um Plugin
    - Você está decidindo entre ganchos internos e ganchos de Plugin
summary: 'Ganchos de Plugin: intercepte eventos de ciclo de vida do agente, da ferramenta, da mensagem, da sessão e do Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-04-30T09:59:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Hooks de Plugin são pontos de extensão em processo para plugins do OpenClaw. Use-os
quando um plugin precisar inspecionar ou alterar execuções de agentes, chamadas de ferramentas, fluxo de mensagens,
ciclo de vida da sessão, roteamento de subagentes, instalações ou inicialização do Gateway.

Use [hooks internos](/pt-BR/automation/hooks) em vez disso quando quiser um pequeno
script `HOOK.md` instalado pelo operador para eventos de comando e do Gateway, como
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Início rápido

Registre hooks de plugin tipados com `api.on(...)` a partir da entrada do seu plugin:

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

- `priority` — ordenação dos manipuladores (valores maiores são executados primeiro).
- `timeoutMs` — orçamento opcional por hook. Quando definido, o executor de hooks aborta esse
  manipulador depois que o orçamento se esgota e continua com o próximo, em vez de
  permitir que configuração lenta ou trabalho de recuperação consuma o timeout de modelo
  configurado pelo chamador. Omita para usar o timeout padrão de observação/decisão que o
  executor de hooks aplica genericamente.

Cada hook recebe `event.context.pluginConfig`, a configuração resolvida para o
plugin que registrou esse manipulador. Use-a para decisões de hook que precisam das
opções atuais do plugin; o OpenClaw a injeta por manipulador sem modificar o
objeto de evento compartilhado visto por outros plugins.

## Catálogo de hooks

Hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, sobrescrever ou exigir aprovação); todos os outros são
somente de observação.

**Turno do agente**

- `before_model_resolve` — sobrescrever provedor ou modelo antes de as mensagens da sessão carregarem
- `agent_turn_prepare` — consumir injeções de turno de plugin enfileiradas e adicionar contexto do mesmo turno antes dos hooks de prompt
- `before_prompt_build` — adicionar contexto dinâmico ou texto de prompt do sistema antes da chamada ao modelo
- `before_agent_start` — fase combinada apenas para compatibilidade; prefira os dois hooks acima
- **`before_agent_reply`** — interromper o turno do modelo com uma resposta sintética ou silêncio
- **`before_agent_finalize`** — inspecionar a resposta final natural e solicitar mais uma passagem do modelo
- `agent_end` — observar mensagens finais, estado de sucesso e duração da execução
- `heartbeat_prompt_contribution` — adicionar contexto somente de Heartbeat para plugins de monitor em segundo plano e ciclo de vida

**Observação da conversa**

- `model_call_started` / `model_call_ended` — observar metadados sanitizados de chamada de provedor/modelo, tempo, resultado e hashes limitados de IDs de solicitação sem conteúdo de prompt ou resposta
- `llm_input` — observar entrada do provedor (prompt do sistema, prompt, histórico)
- `llm_output` — observar saída do provedor

**Ferramentas**

- **`before_tool_call`** — reescrever parâmetros da ferramenta, bloquear execução ou exigir aprovação
- `after_tool_call` — observar resultados, erros e duração da ferramenta
- **`tool_result_persist`** — reescrever a mensagem do assistente produzida a partir de um resultado de ferramenta
- **`before_message_write`** — inspecionar ou bloquear uma gravação de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** — reivindicar uma mensagem recebida antes do roteamento do agente (respostas sintéticas)
- `message_received` — observar conteúdo recebido, remetente, conversa e metadados
- **`message_sending`** — reescrever conteúdo de saída ou cancelar a entrega
- `message_sent` — observar sucesso ou falha da entrega de saída
- **`before_dispatch`** — inspecionar ou reescrever um despacho de saída antes da transferência para o canal
- **`reply_dispatch`** — participar do pipeline final de despacho de resposta

**Sessões e Compaction**

- `session_start` / `session_end` — rastrear limites do ciclo de vida da sessão
- `before_compaction` / `after_compaction` — observar ou anotar ciclos de Compaction
- `before_reset` — observar eventos de redefinição de sessão (`/reset`, redefinições programáticas)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordenar roteamento de subagentes e entrega de conclusão

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — iniciar ou parar serviços pertencentes ao plugin com o Gateway
- `cron_changed` — observar alterações no ciclo de vida do Cron pertencente ao Gateway (adicionado, atualizado, removido, iniciado, finalizado, agendado)
- **`before_install`** — inspecionar varreduras de instalação de skill ou plugin e, opcionalmente, bloquear

## Política de chamada de ferramenta

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (definido em execuções orientadas por Cron) e `ctx.trace` diagnóstico

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
- `block: false` é tratado como ausência de decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e pergunta ao usuário por meio das aprovações
  de plugin. O comando `/approve` pode aprovar aprovações de exec e de plugin.
- Um `block: true` de menor prioridade ainda pode bloquear depois que um hook de maior prioridade
  solicitou aprovação.
- `onResolution` recebe a decisão de aprovação resolvida — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Plugins incluídos que precisam de política no nível do host podem registrar políticas de ferramentas confiáveis
com `api.registerTrustedToolPolicy(...)`. Elas são executadas antes de hooks
`before_tool_call` comuns e antes de decisões de plugins externos. Use-as somente
para controles confiáveis pelo host, como política de workspace, aplicação de orçamento ou
segurança de fluxos de trabalho reservados. Plugins externos devem usar hooks normais de `before_tool_call`.

### Persistência de resultado de ferramenta

Resultados de ferramentas podem incluir `details` estruturados para renderização de UI, diagnósticos,
roteamento de mídia ou metadados pertencentes ao plugin. Trate `details` como metadados de runtime,
não como conteúdo de prompt:

- O OpenClaw remove `toolResult.details` antes de repetição do provedor e entrada de Compaction
  para que metadados não se tornem contexto do modelo.
- Entradas de sessão persistidas mantêm apenas `details` limitados. Detalhes grandes demais são
  substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final
  de persistência. Hooks ainda devem manter `details` retornados pequenos e evitar
  colocar texto relevante ao prompt apenas em `details`; coloque a saída de ferramenta visível ao modelo
  em `content`.

## Hooks de prompt e modelo

Use os hooks específicos de fase para novos plugins:

- `before_model_resolve`: recebe apenas o prompt atual e metadados de anexos.
  Retorne `providerOverride` ou `modelOverride`.
- `agent_turn_prepare`: recebe o prompt atual, mensagens de sessão preparadas
  e quaisquer injeções enfileiradas exatamente uma vez drenadas para esta sessão. Retorne
  `prependContext` ou `appendContext`.
- `before_prompt_build`: recebe o prompt atual e mensagens da sessão.
  Retorne `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution`: é executado apenas para turnos de Heartbeat e retorna
  `prependContext` ou `appendContext`. Destina-se a monitores em segundo plano
  que precisam resumir o estado atual sem alterar turnos iniciados pelo usuário.

`before_agent_start` permanece por compatibilidade. Prefira os hooks explícitos acima
para que seu plugin não dependa de uma fase combinada legada.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa. O mesmo valor também está disponível em `ctx.runId`.
Execuções orientadas por Cron também expõem `ctx.jobId` (o ID do job Cron de origem) para que
hooks de plugin possam escopar métricas, efeitos colaterais ou estado a um job agendado
específico.

`agent_end` é um hook de observação e é executado em modo dispara-e-esquece após o turno. O
executor de hooks aplica um timeout de 30 segundos para que um plugin travado ou endpoint
de embedding não deixe a promessa do hook pendente para sempre. Um timeout é registrado e
o OpenClaw continua; ele não cancela trabalho de rede pertencente ao plugin, a menos que o
plugin também use seu próprio sinal de abortamento.

Use `model_call_started` e `model_call_ended` para telemetria de chamada de provedor
que não deve receber prompts brutos, histórico, respostas, cabeçalhos, corpos de solicitação
ou IDs de solicitação do provedor. Esses hooks incluem metadados estáveis, como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcional,
`durationMs`/`outcome` terminal e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash limitado de ID de solicitação do provedor.

`before_agent_finalize` é executado apenas quando um harness está prestes a aceitar uma
resposta final natural do assistente. Ele não é o caminho de cancelamento de `/stop` e não
é executado quando o usuário aborta um turno. Retorne `{ action: "revise", reason }` para pedir
ao harness mais uma passagem do modelo antes da finalização, `{ action:
"finalize", reason? }` para forçar a finalização, ou omita um resultado para continuar.
Hooks `Stop` nativos do Codex são retransmitidos para este hook como decisões
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

### Extensões de sessão e injeções para o próximo turno

Plugins de fluxo de trabalho podem persistir pequenos estados de sessão compatíveis com JSON com
`api.registerSessionExtension(...)` e atualizá-los por meio do método
`sessions.pluginPatch` do Gateway. Linhas de sessão projetam o estado de extensão registrado
por meio de `pluginExtensions`, permitindo que a Control UI e outros clientes renderizem
status pertencente ao plugin sem conhecer os detalhes internos do plugin.

Use `api.enqueueNextTurnInjection(...)` quando um plugin precisar que contexto durável
chegue ao próximo turno do modelo exatamente uma vez. O OpenClaw drena injeções enfileiradas antes dos
hooks de prompt, descarta injeções expiradas e deduplica por `idempotencyKey`
por plugin. Esta é a interface correta para retomadas de aprovação, resumos de política,
deltas de monitores em segundo plano e continuações de comandos que devem ficar visíveis para
o modelo no próximo turno, mas não devem se tornar texto permanente do prompt do sistema.

Semânticas de limpeza fazem parte do contrato. Callbacks de limpeza de extensões de sessão e
de ciclo de vida de runtime recebem `reset`, `delete`, `disable` ou
`restart`. O host remove o estado persistente de extensão de sessão do plugin proprietário
e injeções pendentes para o próximo turno em reset/delete/disable; restart mantém
o estado durável da sessão enquanto callbacks de limpeza permitem que plugins liberem jobs do agendador,
contexto de execução e outros recursos fora de banda para a geração antiga do runtime.

## Hooks de mensagem

Use hooks de mensagem para roteamento no nível do canal e política de entrega:

- `message_received`: observar conteúdo recebido, remetente, `threadId`, `messageId`,
  `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescrever `content` ou retornar `{ cancel: true }`.
- `message_sent`: observar sucesso ou falha final.

Para respostas TTS apenas com áudio, `content` pode conter a transcrição falada oculta
mesmo quando o payload do canal não tem texto/legenda visível. Reescrever esse
`content` atualiza apenas a transcrição visível para o hook; ela não é renderizada como uma
legenda de mídia.

Os contextos de hooks de mensagem expõem campos de correlação estáveis quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Prefira
esses campos de primeira classe antes de ler metadados legados.

Prefira os campos tipados `threadId` e `replyToId` antes de usar metadados
específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como ausência de decisão.
- `content` reescrito continua para hooks de prioridade mais baixa, a menos que um hook posterior
  cancele a entrega.

## Instalar hooks

`before_install` é executado após a varredura integrada para instalações de Skills e plugins.
Retorne descobertas adicionais ou `{ block: true, blockReason }` para interromper a
instalação.

`block: true` é terminal. `block: false` é tratado como ausência de decisão.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços de Plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualizações de Cron. Use `gateway_stop` para limpar recursos
de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime
pertencentes a Plugin.

`cron_changed` dispara para eventos de ciclo de vida de Cron pertencentes ao Gateway com um payload
de evento tipado cobrindo os motivos `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. O evento carrega um snapshot `PluginHookGatewayCronJob`
(incluindo `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presentes), além de um `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Eventos removidos
ainda carregam o snapshot do job excluído para que agendadores externos possam
reconciliar o estado. Use `ctx.getCron?.()` e `ctx.config` do contexto de runtime
ao sincronizar agendadores externos de despertar, e mantenha o OpenClaw como a
fonte da verdade para verificações de vencimento e execução.

## Próximas descontinuações

Algumas superfícies adjacentes a hooks estão descontinuadas, mas ainda têm suporte. Migre
antes da próxima versão principal:

- **Envelopes de canal em texto simples** em handlers `inbound_claim` e `message_received`.
  Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar texto de envelope plano. Consulte
  [Envelopes de canal em texto simples → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da fase
  combinada.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de uma `string` de formato livre.

Para a lista completa — registro de capacidade de memória, perfil de thinking
do provedor, provedores externos de autenticação, tipos de descoberta de provedores, acessadores de runtime
de tarefas e a renomeação de `command-auth` → `command-status` — consulte
[Migração do SDK de Plugin → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionados

- [Migração do SDK de Plugin](/pt-BR/plugins/sdk-migration) — descontinuações ativas e cronograma de remoção
- [Como criar plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Arquitetura interna de Plugin](/pt-BR/plugins/architecture-internals)
