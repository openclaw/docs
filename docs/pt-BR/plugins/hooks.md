---
read_when:
    - Você está criando um Plugin que precisa de `before_tool_call`, `before_agent_reply`, hooks de mensagem ou hooks de ciclo de vida
    - Você precisa bloquear, reescrever ou exigir aprovação para chamadas de ferramenta a partir de um Plugin
    - Você está decidindo entre hooks internos e hooks de Plugin
summary: 'Hooks de Plugin: interceptar eventos do ciclo de vida do agente, da ferramenta, da mensagem, da sessão e do Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-04-25T18:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

Hooks de Plugin são pontos de extensão em processo para Plugins do OpenClaw. Use-os
quando um Plugin precisar inspecionar ou alterar execuções de agente, chamadas de ferramenta, fluxo de mensagens,
ciclo de vida de sessão, roteamento de subagentes, instalações ou inicialização do Gateway.

Use [internal hooks](/pt-BR/automation/hooks) em vez disso quando quiser um pequeno
script `HOOK.md` instalado pelo operador para comandos e eventos do Gateway como
`/new`, `/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Início rápido

Registre hooks tipados de Plugin com `api.on(...)` a partir da entrada do seu Plugin:

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

Os handlers de hook são executados sequencialmente em ordem decrescente de `priority`. Hooks com a mesma prioridade
mantêm a ordem de registro.

## Catálogo de hooks

Os hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, sobrescrever ou exigir aprovação); todos os demais são
somente de observação.

**Turno do agente**

- `before_model_resolve` — sobrescreve o provedor ou modelo antes de as mensagens da sessão serem carregadas
- `before_prompt_build` — adiciona contexto dinâmico ou texto de prompt de sistema antes da chamada ao modelo
- `before_agent_start` — fase combinada somente para compatibilidade; prefira os dois hooks acima
- **`before_agent_reply`** — interrompe o turno do modelo com uma resposta sintética ou silêncio
- `agent_end` — observa mensagens finais, estado de sucesso e duração da execução

**Observação da conversa**

- `model_call_started` / `model_call_ended` — observa metadados saneados da chamada de provedor/modelo, temporização, resultado e hashes limitados de ID de requisição sem conteúdo de prompt ou resposta
- `llm_input` — observa a entrada do provedor (prompt de sistema, prompt, histórico)
- `llm_output` — observa a saída do provedor

**Ferramentas**

- **`before_tool_call`** — reescreve parâmetros de ferramenta, bloqueia a execução ou exige aprovação
- `after_tool_call` — observa resultados de ferramenta, erros e duração
- **`tool_result_persist`** — reescreve a mensagem do assistente produzida a partir do resultado de uma ferramenta
- **`before_message_write`** — inspeciona ou bloqueia uma gravação de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** — reivindica uma mensagem recebida antes do roteamento do agente (respostas sintéticas)
- `message_received` — observa conteúdo recebido, remetente, thread e metadados
- **`message_sending`** — reescreve conteúdo de saída ou cancela a entrega
- `message_sent` — observa sucesso ou falha da entrega de saída
- **`before_dispatch`** — inspeciona ou reescreve um despacho de saída antes da transferência para o canal
- **`reply_dispatch`** — participa do pipeline final de despacho de resposta

**Sessões e Compaction**

- `session_start` / `session_end` — acompanham os limites do ciclo de vida da sessão
- `before_compaction` / `after_compaction` — observam ou anotam ciclos de Compaction
- `before_reset` — observa eventos de reset de sessão (`/reset`, resets programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordenam o roteamento de subagentes e a entrega de conclusão

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — iniciam ou encerram serviços pertencentes ao Plugin com o Gateway
- **`before_install`** — inspeciona varreduras de instalação de Skills ou Plugins e opcionalmente bloqueia

## Política de chamada de ferramenta

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` e
  `ctx.trace` de diagnóstico

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

- `block: true` é terminal e ignora handlers de prioridade mais baixa.
- `block: false` é tratado como nenhuma decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e pergunta ao usuário por meio de
  aprovações de Plugin. O comando `/approve` pode aprovar tanto aprovações de exec quanto de Plugin.
- Um `block: true` de prioridade mais baixa ainda pode bloquear depois que um hook de prioridade mais alta
  solicitou aprovação.
- `onResolution` recebe a decisão de aprovação resolvida — `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

## Hooks de prompt e modelo

Use os hooks específicos por fase para novos Plugins:

- `before_model_resolve`: recebe apenas o prompt atual e metadados de
  anexos. Retorne `providerOverride` ou `modelOverride`.
- `before_prompt_build`: recebe o prompt atual e as mensagens da sessão.
  Retorne `prependContext`, `systemPrompt`, `prependSystemContext` ou
  `appendSystemContext`.

`before_agent_start` permanece por compatibilidade. Prefira os hooks explícitos acima
para que seu Plugin não dependa de uma fase combinada legada.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa. O mesmo valor também está disponível em `ctx.runId`.

Use `model_call_started` e `model_call_ended` para telemetria de chamada de provedor
que não deve receber prompts brutos, histórico, respostas, headers, corpos de
requisição ou IDs de requisição do provedor. Esses hooks incluem metadados estáveis como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionais,
`durationMs`/`outcome` terminais e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash limitado do ID de requisição do provedor.

Plugins não empacotados que precisam de `llm_input`, `llm_output` ou `agent_end` devem definir:

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

Hooks que modificam prompt podem ser desativados por Plugin com
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooks de mensagem

Use hooks de mensagem para roteamento em nível de canal e política de entrega:

- `message_received`: observa conteúdo recebido, remetente, `threadId`, `messageId`,
  `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescreve `content` ou retorna `{ cancel: true }`.
- `message_sent`: observa sucesso ou falha final.

Para respostas TTS somente de áudio, `content` pode conter a transcrição falada oculta
mesmo quando a carga útil do canal não tem texto/legenda visível. Reescrever esse
`content` atualiza apenas a transcrição visível para hooks; isso não é renderizado como
legenda da mídia.

Os contextos de hook de mensagem expõem campos de correlação estáveis quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Prefira esses
campos de primeira classe antes de ler metadados legados.

Prefira campos tipados `threadId` e `replyToId` antes de usar metadados específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como nenhuma decisão.
- `content` reescrito continua para hooks de prioridade mais baixa, a menos que um hook posterior
  cancele a entrega.

## Hooks de instalação

`before_install` é executado após a varredura interna para instalações de Skills e Plugins.
Retorne descobertas adicionais ou `{ block: true, blockReason }` para interromper a
instalação.

`block: true` é terminal. `block: false` é tratado como nenhuma decisão.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços do Plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualizações de Cron. Use `gateway_stop` para limpar recursos de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime pertencentes ao Plugin.

## Descontinuações futuras

Algumas superfícies adjacentes a hooks estão descontinuadas, mas ainda são compatíveis. Migre
antes do próximo grande release:

- **Envelopes de canal em texto simples** em handlers `inbound_claim` e `message_received`.
  Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar texto simples de envelope. Veja
  [Plaintext channel envelopes → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos Plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da
  fase combinada.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de uma `string` de formato livre.

Para a lista completa — registro de capacidade de memória, perfil de thinking
do provedor, provedores externos de auth, tipos de descoberta de provedor, acessores
de runtime de tarefa e a renomeação de `command-auth` → `command-status` — consulte
[Plugin SDK migration → Active deprecations](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Plugin SDK migration](/pt-BR/plugins/sdk-migration) — descontinuações ativas e cronograma de remoção
- [Building plugins](/pt-BR/plugins/building-plugins)
- [Plugin SDK overview](/pt-BR/plugins/sdk-overview)
- [Plugin entry points](/pt-BR/plugins/sdk-entrypoints)
- [Internal hooks](/pt-BR/automation/hooks)
- [Plugin architecture internals](/pt-BR/plugins/architecture-internals)
