---
read_when:
    - Você está criando um Plugin que precisa de before_tool_call, before_agent_reply, ganchos de mensagem ou ganchos de ciclo de vida
    - Você precisa bloquear, reescrever ou exigir aprovação para chamadas de ferramentas de um Plugin
    - Você está decidindo entre ganchos internos e ganchos de Plugin
summary: 'Hooks de Plugin: interceptam eventos do ciclo de vida de agente, ferramenta, mensagem, sessão e Gateway'
title: Ganchos de Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Os ganchos de Plugin são pontos de extensão em processo para Plugins do OpenClaw. Use-os
quando um Plugin precisar inspecionar ou alterar execuções de agentes, chamadas de ferramentas, fluxo de mensagens,
ciclo de vida de sessão, roteamento de subagentes, instalações ou inicialização do Gateway.

Use [ganchos internos](/pt-BR/automation/hooks) em vez disso quando quiser um pequeno
script `HOOK.md` instalado pelo operador para eventos de comando e Gateway, como
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Início rápido

Registre ganchos de Plugin tipados com `api.on(...)` a partir da entrada do seu Plugin:

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

Os manipuladores de gancho são executados sequencialmente em `priority` decrescente. Ganchos com a mesma prioridade
mantêm a ordem de registro.

`api.on(name, handler, opts?)` aceita:

- `priority` - ordenação dos manipuladores (valores mais altos são executados primeiro).
- `timeoutMs` - orçamento opcional por gancho. Quando definido, o executor de ganchos aborta esse
  manipulador após o orçamento transcorrer e continua com o próximo, em vez de
  permitir que configuração lenta ou trabalho de recuperação consuma o tempo limite de modelo configurado
  pelo chamador. Omita para usar o tempo limite padrão de observação/decisão que o
  executor de ganchos aplica genericamente.

Operadores também podem definir orçamentos de gancho sem corrigir o código do Plugin:

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
`api.on(..., { timeoutMs })` criado pelo autor do Plugin. Cada valor configurado deve
ser um inteiro positivo não maior que 600000 milissegundos. Prefira substituições por gancho
para ganchos conhecidos por serem lentos, para que um Plugin não receba um orçamento maior
em todos os lugares.

Cada gancho recebe `event.context.pluginConfig`, a configuração resolvida para o
Plugin que registrou esse manipulador. Use-a para decisões de gancho que precisam das
opções atuais do Plugin; o OpenClaw a injeta por manipulador sem mutar o
objeto de evento compartilhado visto por outros Plugins.

## Catálogo de ganchos

Os ganchos são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, substituir ou exigir aprovação); todos os outros são
apenas de observação.

**Turno do agente**

- `before_model_resolve` - substitui provedor ou modelo antes que as mensagens de sessão sejam carregadas
- `agent_turn_prepare` - consome injeções de turno de Plugin enfileiradas e adiciona contexto no mesmo turno antes dos ganchos de prompt
- `before_prompt_build` - adiciona contexto dinâmico ou texto de prompt do sistema antes da chamada ao modelo
- `before_agent_start` - fase combinada apenas para compatibilidade; prefira os dois ganchos acima
- **`before_agent_run`** - inspeciona o prompt final e as mensagens de sessão antes do envio ao modelo e, opcionalmente, bloqueia a execução
- **`before_agent_reply`** - interrompe o turno do modelo com uma resposta sintética ou silêncio
- **`before_agent_finalize`** - inspeciona a resposta final natural e solicita mais uma passagem do modelo
- `agent_end` - observa mensagens finais, estado de sucesso e duração da execução
- `heartbeat_prompt_contribution` - adiciona contexto somente de Heartbeat para monitor em segundo plano e Plugins de ciclo de vida

**Observação de conversa**

- `model_call_started` / `model_call_ended` - observa metadados sanitizados de chamada de provedor/modelo, temporização, resultado e hashes limitados de ID de solicitação sem conteúdo de prompt ou resposta
- `llm_input` - observa a entrada do provedor (prompt do sistema, prompt, histórico)
- `llm_output` - observa a saída do provedor

**Ferramentas**

- **`before_tool_call`** - reescreve parâmetros de ferramenta, bloqueia a execução ou exige aprovação
- `after_tool_call` - observa resultados de ferramenta, erros e duração
- **`tool_result_persist`** - reescreve a mensagem do assistente produzida a partir de um resultado de ferramenta
- **`before_message_write`** - inspeciona ou bloqueia uma escrita de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** - reivindica uma mensagem de entrada antes do roteamento do agente (respostas sintéticas)
- `message_received` - observa conteúdo de entrada, remetente, thread e metadados
- **`message_sending`** - reescreve conteúdo de saída ou cancela a entrega
- `message_sent` - observa sucesso ou falha de entrega de saída
- **`before_dispatch`** - inspeciona ou reescreve um despacho de saída antes da transferência ao canal
- **`reply_dispatch`** - participa do pipeline final de despacho de resposta

**Sessões e Compaction**

- `session_start` / `session_end` - rastreia limites do ciclo de vida da sessão. O `reason` do evento é um de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` ou `unknown`. Os valores `shutdown` e `restart` disparam a partir do finalizador de desligamento do Gateway quando o processo é parado ou reiniciado enquanto sessões ainda estão ativas, para que Plugins downstream (como memória ou armazenamentos de transcrições) possam finalizar linhas fantasma que, de outra forma, permaneceriam em estado aberto entre reinicializações. O finalizador é limitado para que um Plugin lento não possa bloquear SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - observa ou anota ciclos de Compaction
- `before_reset` - observa eventos de redefinição de sessão (`/reset`, redefinições programáticas)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - coordena roteamento de subagentes e entrega de conclusão

**Ciclo de vida**

- `gateway_start` / `gateway_stop` - inicia ou para serviços pertencentes ao Plugin com o Gateway
- `cron_changed` - observa alterações de ciclo de vida de Cron pertencente ao Gateway (adicionado, atualizado, removido, iniciado, concluído, agendado)
- **`before_install`** - inspeciona varreduras de instalação de skill ou Plugin e, opcionalmente, bloqueia

## Política de chamada de ferramenta

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
- `event.derivedPaths` opcional, contendo dicas de caminho de destino derivadas do host em regime de melhor esforço
  para envelopes de ferramentas conhecidos, como `apply_patch`; quando presentes,
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

- `block: true` é terminal e pula manipuladores de prioridade mais baixa.
- `block: false` é tratado como ausência de decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e pergunta ao usuário por meio de aprovações de Plugin. O comando `/approve` pode aprovar aprovações de exec e de Plugin.
- Um `block: true` de prioridade mais baixa ainda pode bloquear depois que um gancho de prioridade mais alta
  solicitou aprovação.
- `onResolution` recebe a decisão de aprovação resolvida - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Plugins incluídos que precisam de política em nível de host podem registrar políticas de ferramenta confiáveis
com `api.registerTrustedToolPolicy(...)`. Elas são executadas antes dos ganchos
`before_tool_call` comuns e antes de decisões de Plugins externos. Use-as somente
para barreiras confiáveis pelo host, como política de espaço de trabalho, aplicação de orçamento ou
segurança de fluxos de trabalho reservados. Plugins externos devem usar ganchos `before_tool_call`
normais.

### Persistência de resultado de ferramenta

Resultados de ferramenta podem incluir `details` estruturados para renderização da UI, diagnósticos,
roteamento de mídia ou metadados pertencentes ao Plugin. Trate `details` como metadados de runtime,
não como conteúdo de prompt:

- O OpenClaw remove `toolResult.details` antes de repetição pelo provedor e entrada de Compaction
  para que metadados não se tornem contexto do modelo.
- Entradas de sessão persistidas mantêm apenas `details` limitados. Detalhes grandes demais são
  substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final
  de persistência. Ganchos ainda devem manter os `details` retornados pequenos e evitar
  colocar texto relevante para prompt apenas em `details`; coloque a saída de ferramenta visível ao modelo
  em `content`.

## Ganchos de prompt e modelo

Use os ganchos específicos de fase para novos Plugins:

- `before_model_resolve`: recebe apenas o prompt atual e metadados de anexos.
  Retorne `providerOverride` ou `modelOverride`.
- `agent_turn_prepare`: recebe o prompt atual, mensagens de sessão preparadas
  e quaisquer injeções enfileiradas exatamente uma vez drenadas para esta sessão. Retorne
  `prependContext` ou `appendContext`.
- `before_prompt_build`: recebe o prompt atual e mensagens de sessão.
  Retorne `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution`: é executado somente para turnos de Heartbeat e retorna
  `prependContext` ou `appendContext`. Ele é destinado a monitores em segundo plano
  que precisam resumir o estado atual sem alterar turnos iniciados pelo usuário.

`before_agent_start` permanece para compatibilidade. Prefira os ganchos explícitos acima
para que seu Plugin não dependa de uma fase combinada legada.

`before_agent_run` é executado após a construção do prompt e antes de qualquer entrada do modelo,
incluindo carregamento de imagens locais ao prompt e observação de `llm_input`. Ele recebe
a entrada atual do usuário como `prompt`, além do histórico de sessão carregado em `messages`
e o prompt do sistema ativo. Retorne `{ outcome: "block", reason, message? }`
para parar a execução antes que o modelo possa ler o prompt. `reason` é interno;
`message` é a substituição exibida ao usuário. Os únicos resultados suportados são
`pass` e `block`; formatos de decisão não suportados falham fechados.

Quando uma execução é bloqueada, o OpenClaw armazena apenas o texto de substituição em
`message.content`, além de metadados de bloqueio não sensíveis, como o ID do Plugin bloqueador
e o timestamp. O texto original do usuário não é retido na transcrição nem no contexto futuro.
Motivos internos de bloqueio são tratados como sensíveis e excluídos de
transcrição, histórico, broadcast, log e cargas de diagnóstico. A observabilidade
deve usar campos sanitizados, como ID do bloqueador, resultado, timestamp ou uma categoria
segura.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa. O mesmo valor também fica disponível em `ctx.runId`.
Execuções acionadas por Cron também expõem `ctx.jobId` (o ID do job de Cron de origem) para que
ganchos de Plugin possam delimitar métricas, efeitos colaterais ou estado a um job agendado
específico.

Para execuções originadas por canal, `ctx.messageProvider` é a superfície de provedor, como
`discord` ou `telegram`, enquanto `ctx.channelId` é o identificador do alvo da conversa
quando o OpenClaw consegue derivá-lo da chave de sessão ou dos metadados de entrega.

`agent_end` é um gancho de observação e é executado fire-and-forget após o turno. O
executor de ganchos aplica um tempo limite de 30 segundos para que um Plugin travado ou endpoint
de embedding não possa deixar a promessa do gancho pendente para sempre. Um tempo limite é registrado e
o OpenClaw continua; ele não cancela trabalho de rede pertencente ao Plugin, a menos que o
Plugin também use seu próprio sinal de abortamento.

Use `model_call_started` e `model_call_ended` para telemetria de chamadas de provedor
que não deve receber prompts brutos, histórico, respostas, cabeçalhos, corpos de
requisição ou IDs de requisição do provedor. Esses hooks incluem metadados estáveis, como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionais,
`durationMs`/`outcome` terminais e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash limitado do ID de requisição do provedor.

`before_agent_finalize` é executado somente quando um harness está prestes a aceitar uma resposta
final natural do assistente. Ele não é o caminho de cancelamento `/stop` e não é
executado quando o usuário aborta um turno. Retorne `{ action: "revise", reason }` para pedir
ao harness mais uma passagem de modelo antes da finalização, `{ action:
"finalize", reason? }` para forçar a finalização, ou omita um resultado para continuar.
Hooks nativos `Stop` do Codex são retransmitidos para este hook como decisões
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

`instruction` é acrescentada ao motivo de revisão enviado ao harness.
`idempotencyKey` permite que o host conte novas tentativas para a mesma solicitação de plugin em
decisões de finalização equivalentes, e `maxAttempts` limita quantas passagens extras o
host permitirá antes de continuar com a resposta final natural.

Plugins não empacotados que precisam de hooks de conversa bruta (`before_model_resolve`,
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

Hooks que alteram prompts e injeções duráveis para o próximo turno podem ser desabilitados por plugin
com `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensões de sessão e injeções para o próximo turno

Plugins de fluxo de trabalho podem persistir pequenos estados de sessão compatíveis com JSON usando
`api.registerSessionExtension(...)` e atualizá-los por meio do método
`sessions.pluginPatch` do Gateway. Linhas de sessão projetam o estado de extensão registrado
por meio de `pluginExtensions`, permitindo que a UI de Controle e outros clientes renderizem
status de propriedade do plugin sem conhecer os detalhes internos do plugin.

Use `api.enqueueNextTurnInjection(...)` quando um plugin precisar que contexto durável
chegue ao próximo turno do modelo exatamente uma vez. O OpenClaw drena injeções enfileiradas antes
dos hooks de prompt, descarta injeções expiradas e deduplica por `idempotencyKey`
por plugin. Este é o ponto de integração correto para retomadas de aprovação, resumos de política,
deltas de monitoramento em segundo plano e continuações de comando que devem ficar visíveis para
o modelo no próximo turno, mas não devem se tornar texto permanente do prompt do sistema.

As semânticas de limpeza fazem parte do contrato. A limpeza de extensões de sessão e os callbacks
de limpeza do ciclo de vida do runtime recebem `reset`, `delete`, `disable` ou
`restart`. O host remove o estado persistente de extensão de sessão do plugin proprietário
e as injeções pendentes para o próximo turno em reset/delete/disable; restart mantém
o estado durável da sessão enquanto os callbacks de limpeza permitem que plugins liberem trabalhos
do agendador, contexto de execução e outros recursos fora de banda da geração antiga do runtime.

## Hooks de mensagem

Use hooks de mensagem para roteamento e política de entrega no nível do canal:

- `message_received`: observa conteúdo de entrada, remetente, `threadId`, `messageId`,
  `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescreve `content` ou retorna `{ cancel: true }`.
- `message_sent`: observa sucesso ou falha final.

Para respostas TTS somente com áudio, `content` pode conter a transcrição falada oculta
mesmo quando o payload do canal não tiver texto/legenda visível. Reescrever esse
`content` atualiza somente a transcrição visível ao hook; ela não é renderizada como uma
legenda de mídia.

Contextos de hook de mensagem expõem campos de correlação estáveis quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Prefira
esses campos de primeira classe antes de ler metadados legados.

Prefira os campos tipados `threadId` e `replyToId` antes de usar metadados
específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como nenhuma decisão.
- `content` reescrito continua para hooks de prioridade menor, a menos que um hook posterior
  cancele a entrega.
- `message_sending` pode retornar `cancelReason` e `metadata` limitados com um
  cancelamento. Novas APIs de ciclo de vida de mensagem expõem isso como um resultado de entrega suprimida
  com o motivo `cancelled_by_message_sending_hook`; a entrega direta legada
  continua retornando um array de resultados vazio por compatibilidade.
- `message_sent` é somente observação. Falhas de handler são registradas e não
  alteram o resultado da entrega.

## Hooks de instalação

`before_install` é executado após a varredura integrada de instalações de Skills e plugins.
Retorne descobertas adicionais ou `{ block: true, blockReason }` para interromper a
instalação.

`block: true` é terminal. `block: false` é tratado como nenhuma decisão.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços de plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualizações de cron. Use `gateway_stop` para limpar recursos
de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime
pertencentes ao plugin.

`cron_changed` dispara para eventos de ciclo de vida de cron pertencentes ao gateway, com um
payload de evento tipado cobrindo os motivos `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. O evento carrega um snapshot `PluginHookGatewayCronJob`
(incluindo `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presentes), além de um `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Eventos removidos
ainda carregam o snapshot do trabalho excluído para que agendadores externos possam
reconciliar o estado. Use `ctx.getCron?.()` e `ctx.config` do contexto de runtime
ao sincronizar agendadores externos de ativação, e mantenha o OpenClaw como a
fonte da verdade para verificações de vencimento e execução.

## Próximas descontinuações

Algumas superfícies adjacentes a hooks estão obsoletas, mas ainda têm suporte. Migre
antes da próxima versão principal:

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
provedores de autenticação externos, tipos de descoberta de provedor, acessores de runtime
de tarefa e a renomeação `command-auth` → `command-status` - consulte
[Migração do Plugin SDK → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionados

- [Migração do Plugin SDK](/pt-BR/plugins/sdk-migration) - descontinuações ativas e cronograma de remoção
- [Como criar plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada de plugin](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals)
