---
read_when:
    - Você está criando um Plugin que precisa de `before_tool_call`, `before_agent_reply`, hooks de mensagem ou hooks de ciclo de vida
    - Você precisa bloquear, reescrever ou exigir aprovação para chamadas de ferramenta a partir de um Plugin
    - Você está decidindo entre hooks internos e hooks de Plugin
summary: 'Hooks de Plugin: interceptar eventos do ciclo de vida do agente, ferramenta, mensagem, sessão e Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Hooks de Plugin são pontos de extensão em processo para plugins do OpenClaw. Use-os
quando um plugin precisar inspecionar ou alterar execuções de agente, chamadas de ferramenta, fluxo de mensagens,
ciclo de vida de sessão, roteamento de subagente, instalações ou inicialização do Gateway.

Use [hooks internos](/pt-BR/automation/hooks) em vez disso quando você quiser um pequeno
script `HOOK.md` instalado pelo operador para eventos de comando e Gateway como
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

Handlers de hook são executados sequencialmente em ordem decrescente de `priority`. Hooks com a mesma prioridade
mantêm a ordem de registro.

## Catálogo de hooks

Os hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, substituir ou exigir aprovação); todos os demais são
apenas de observação.

**Turno do agente**

- `before_model_resolve` — substitui provedor ou modelo antes do carregamento das mensagens da sessão
- `before_prompt_build` — adiciona contexto dinâmico ou texto de prompt de sistema antes da chamada do modelo
- `before_agent_start` — fase combinada apenas para compatibilidade; prefira os dois hooks acima
- **`before_agent_reply`** — interrompe o turno do modelo com uma resposta sintética ou silêncio
- **`before_agent_finalize`** — inspeciona a resposta final natural e solicita mais uma passagem do modelo
- `agent_end` — observa mensagens finais, estado de sucesso e duração da execução

**Observação de conversa**

- `model_call_started` / `model_call_ended` — observam metadados saneados de chamada de provedor/modelo, tempo, resultado e hashes limitados de request-id sem conteúdo de prompt ou resposta
- `llm_input` — observa a entrada do provedor (prompt de sistema, prompt, histórico)
- `llm_output` — observa a saída do provedor

**Ferramentas**

- **`before_tool_call`** — reescreve parâmetros de ferramenta, bloqueia execução ou exige aprovação
- `after_tool_call` — observa resultados de ferramenta, erros e duração
- **`tool_result_persist`** — reescreve a mensagem do assistente produzida a partir de um resultado de ferramenta
- **`before_message_write`** — inspeciona ou bloqueia uma gravação de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** — reivindica uma mensagem recebida antes do roteamento para o agente (respostas sintéticas)
- `message_received` — observa conteúdo recebido, remetente, thread e metadados
- **`message_sending`** — reescreve conteúdo de saída ou cancela a entrega
- `message_sent` — observa sucesso ou falha da entrega de saída
- **`before_dispatch`** — inspeciona ou reescreve um dispatch de saída antes do handoff para o canal
- **`reply_dispatch`** — participa do pipeline final de dispatch da resposta

**Sessões e Compaction**

- `session_start` / `session_end` — acompanham limites do ciclo de vida da sessão
- `before_compaction` / `after_compaction` — observam ou anotam ciclos de Compaction
- `before_reset` — observa eventos de redefinição de sessão (`/reset`, redefinições programáticas)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordenam roteamento de subagente e entrega da conclusão

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — iniciam ou interrompem serviços pertencentes ao plugin com o Gateway
- **`before_install`** — inspeciona varreduras de instalação de skill ou plugin e opcionalmente bloqueia

## Política de chamada de ferramenta

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

- `block: true` é terminal e ignora handlers de menor prioridade.
- `block: false` é tratado como nenhuma decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e pergunta ao usuário por aprovações de plugin.
  O comando `/approve` pode aprovar tanto aprovações de exec quanto de plugin.
- Um `block: true` de menor prioridade ainda pode bloquear após um hook de maior prioridade
  ter solicitado aprovação.
- `onResolution` recebe a decisão de aprovação resolvida — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

### Persistência de resultado de ferramenta

Resultados de ferramenta podem incluir `details` estruturados para renderização de UI, diagnósticos,
roteamento de mídia ou metadados pertencentes ao plugin. Trate `details` como metadados de runtime,
não como conteúdo de prompt:

- O OpenClaw remove `toolResult.details` antes do replay do provedor e da entrada de Compaction, para que metadados não virem contexto do modelo.
- Entradas persistidas de sessão mantêm apenas `details` limitados. Details superdimensionados são
  substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final
  de persistência. Hooks ainda devem manter os `details` retornados pequenos e evitar
  colocar texto relevante para prompt apenas em `details`; coloque a saída visível para o modelo
  em `content`.

## Hooks de prompt e modelo

Use os hooks específicos de fase para novos plugins:

- `before_model_resolve`: recebe apenas o prompt atual e metadados
  de anexo. Retorne `providerOverride` ou `modelOverride`.
- `before_prompt_build`: recebe o prompt atual e mensagens da sessão.
  Retorne `prependContext`, `systemPrompt`, `prependSystemContext` ou
  `appendSystemContext`.

`before_agent_start` permanece por compatibilidade. Prefira os hooks explícitos acima
para que seu plugin não dependa de uma fase combinada legada.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa. O mesmo valor também está disponível em `ctx.runId`.
Execuções acionadas por Cron também expõem `ctx.jobId` (o ID do job Cron de origem), para que
hooks de plugin possam delimitar métricas, efeitos colaterais ou estado a um job
agendado específico.

Use `model_call_started` e `model_call_ended` para telemetria de chamada de provedor
que não deve receber prompts brutos, histórico, respostas, cabeçalhos, corpos de requisição
ou IDs de requisição do provedor. Esses hooks incluem metadados estáveis como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionais, `durationMs`/`outcome`
terminais e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash limitado do request-id do provedor.

`before_agent_finalize` é executado apenas quando um harness está prestes a aceitar uma resposta natural final do assistente. Ele não é o caminho de cancelamento `/stop` e não é executado quando o usuário aborta um turno. Retorne `{ action: "revise", reason }` para pedir
ao harness mais uma passagem do modelo antes da finalização, `{ action:
"finalize", reason? }` para forçar a finalização ou omita um resultado para continuar.
Hooks nativos `Stop` do Codex são retransmitidos para esse hook como decisões
`before_agent_finalize` do OpenClaw.

Plugins não incluídos que precisem de `llm_input`, `llm_output`,
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

Hooks que modificam prompt podem ser desativados por plugin com
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooks de mensagem

Use hooks de mensagem para roteamento em nível de canal e política de entrega:

- `message_received`: observa conteúdo recebido, remetente, `threadId`, `messageId`,
  `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescreve `content` ou retorna `{ cancel: true }`.
- `message_sent`: observa sucesso ou falha final.

Para respostas TTS somente de áudio, `content` pode conter a transcrição falada oculta
mesmo quando a carga útil do canal não tem texto/legenda visível. Reescrever esse
`content` atualiza apenas a transcrição visível ao hook; isso não é renderizado como
legenda da mídia.

Contextos de hooks de mensagem expõem campos estáveis de correlação quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Prefira
esses campos de primeira classe antes de ler metadados legados.

Prefira campos tipados `threadId` e `replyToId` antes de usar metadados específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como nenhuma decisão.
- `content` reescrito continua para hooks de menor prioridade, a menos que um hook posterior
  cancele a entrega.

## Hooks de instalação

`before_install` é executado após a varredura integrada para instalações de skill e plugin.
Retorne achados adicionais ou `{ block: true, blockReason }` para interromper a
instalação.

`block: true` é terminal. `block: false` é tratado como nenhuma decisão.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços do plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualização do Cron. Use `gateway_stop` para limpar recursos de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime pertencentes ao plugin.

## Descontinuações futuras

Algumas superfícies adjacentes a hooks estão obsoletas, mas ainda são compatíveis. Migre
antes da próxima versão principal:

- **Envelopes de canal em texto simples** em handlers `inbound_claim` e `message_received`.
  Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar texto plano do envelope. Consulte
  [Envelopes de canal em texto simples → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da
  fase combinada.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de um `string` de formato livre.

Para a lista completa — registro de capacidade de memória, perfil de thinking
do provedor, provedores externos de auth, tipos de descoberta de provedor, acessores
de runtime de task e a renomeação de `command-auth` → `command-status` — consulte
[Migração do SDK de Plugin → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migração do SDK de Plugin](/pt-BR/plugins/sdk-migration) — descontinuações ativas e cronograma de remoção
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals)
