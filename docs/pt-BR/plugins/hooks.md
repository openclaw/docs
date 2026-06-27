---
read_when:
    - Você está criando um plugin que precisa de `before_tool_call`, `before_agent_reply`, hooks de mensagem ou hooks de ciclo de vida
    - Você precisa bloquear, reescrever ou exigir aprovação para chamadas de ferramenta de um Plugin
    - Você está decidindo entre hooks internos e hooks de Plugin
summary: 'Ganchos de Plugin: intercepte eventos de ciclo de vida de agente, ferramenta, mensagem, sessão e Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Hooks de Plugin são pontos de extensão em processo para plugins do OpenClaw. Use-os
quando um plugin precisa inspecionar ou alterar execuções de agente, chamadas de ferramenta, fluxo de mensagens,
ciclo de vida de sessão, roteamento de subagentes, instalações ou inicialização do Gateway.

Use [hooks internos](/pt-BR/automation/hooks) em vez disso quando quiser um pequeno
script `HOOK.md` instalado pelo operador para eventos de comando e Gateway, como
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

Manipuladores de hook são executados sequencialmente em ordem decrescente de `priority`. Hooks
com a mesma prioridade mantêm a ordem de registro.

`api.on(name, handler, opts?)` aceita:

- `priority` - ordenação dos manipuladores (valores mais altos executam primeiro).
- `timeoutMs` - orçamento opcional por hook. Quando definido, o executor de hooks aborta esse
  manipulador depois que o orçamento expira e continua com o próximo, em vez de
  permitir que configuração lenta ou trabalho de recuperação consuma o timeout de modelo
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
`api.on(..., { timeoutMs })` escrito pelo plugin. Cada valor configurado deve
ser um inteiro positivo não maior que 600000 milissegundos. Prefira substituições
por hook para hooks sabidamente lentos, para que um plugin não receba um orçamento maior
em todos os lugares.

Cada hook recebe `event.context.pluginConfig`, a configuração resolvida para o
plugin que registrou esse manipulador. Use-a para decisões de hook que precisam
das opções atuais do plugin; o OpenClaw a injeta por manipulador sem modificar o
objeto de evento compartilhado visto por outros plugins.

## Catálogo de hooks

Hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um
resultado de decisão (bloquear, cancelar, sobrescrever ou exigir aprovação); todos os outros são
somente de observação.

**Turno do agente**

- `before_model_resolve` - substituir provedor ou modelo antes que as mensagens da sessão sejam carregadas
- `agent_turn_prepare` - consumir injeções de turno de plugin enfileiradas e adicionar contexto no mesmo turno antes dos hooks de prompt
- `before_prompt_build` - adicionar contexto dinâmico ou texto de prompt do sistema antes da chamada ao modelo
- `before_agent_start` - fase combinada somente para compatibilidade; prefira os dois hooks acima
- **`before_agent_run`** - inspecionar o prompt final e as mensagens da sessão antes do envio ao modelo e, opcionalmente, bloquear a execução
- **`before_agent_reply`** - interromper o turno do modelo com uma resposta sintética ou silêncio
- **`before_agent_finalize`** - inspecionar a resposta final natural e solicitar mais uma passagem do modelo
- `agent_end` - observar mensagens finais, estado de sucesso e duração da execução
- `heartbeat_prompt_contribution` - adicionar contexto somente de Heartbeat para plugins de monitoramento em segundo plano e ciclo de vida

**Observação da conversa**

- `model_call_started` / `model_call_ended` - observar metadados sanitizados da chamada de provedor/modelo, tempo, resultado e hashes delimitados de IDs de requisição sem conteúdo de prompt ou resposta
- `llm_input` - observar entrada do provedor (prompt do sistema, prompt, histórico)
- `llm_output` - observar saída do provedor, uso e o `contextTokenBudget` resolvido quando disponível

**Ferramentas**

- **`before_tool_call`** - reescrever parâmetros da ferramenta, bloquear execução ou exigir aprovação
- `after_tool_call` - observar resultados da ferramenta, erros e duração
- `resolve_exec_env` - contribuir variáveis de ambiente pertencentes ao plugin para `exec`
- **`tool_result_persist`** - reescrever a mensagem do assistente produzida a partir de um resultado de ferramenta
- **`before_message_write`** - inspecionar ou bloquear uma gravação de mensagem em andamento (raro)

**Mensagens e entrega**

- **`inbound_claim`** - reivindicar uma mensagem de entrada antes do roteamento do agente (respostas sintéticas)
- `message_received` — observar conteúdo de entrada, remetente, thread e metadados
- **`message_sending`** — reescrever conteúdo de saída ou cancelar entrega
- **`reply_payload_sending`** — modificar ou cancelar cargas de resposta normalizadas antes da entrega
- `message_sent` — observar sucesso ou falha da entrega de saída
- **`before_dispatch`** - inspecionar ou reescrever um despacho de saída antes da transferência ao canal
- **`reply_dispatch`** - participar do pipeline final de despacho de resposta

**Sessões e Compaction**

- `session_start` / `session_end` - rastrear limites do ciclo de vida da sessão. O `reason` do evento é um de `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` ou `unknown`. Os valores `shutdown` e `restart` disparam a partir do finalizador de desligamento do gateway quando o processo é parado ou reiniciado enquanto sessões ainda estão ativas, para que plugins downstream (como armazenamentos de memória ou transcrição) possam finalizar linhas fantasmas que, de outra forma, ficariam em estado aberto entre reinicializações. O finalizador é delimitado para que um plugin lento não possa bloquear SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - observar ou anotar ciclos de Compaction
- `before_reset` - observar eventos de redefinição de sessão (`/reset`, redefinições programáticas)

**Subagentes**

- `subagent_spawned` / `subagent_ended` - observar inicialização e conclusão de subagente.
- `subagent_delivery_target` - hook de compatibilidade para entrega de conclusão quando nenhuma vinculação de sessão do core pode projetar uma rota.
- `subagent_spawning` - hook de compatibilidade obsoleto. O core agora prepara vinculações de subagente `thread: true` por meio de adaptadores de vinculação de sessão de canal antes que `subagent_spawned` dispare.
- `subagent_spawned` inclui `resolvedModel` e `resolvedProvider` quando o OpenClaw resolveu o modelo nativo da sessão filha antes da inicialização.
- `subagent_ended` carrega `targetSessionKey` (identidade — isto corresponde a `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` ou `"acp"`), `reason`, `outcome` opcional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` ou `"deleted"`), `error` opcional, `runId`, `endedAt`, `accountId` e `sendFarewell`. Ele **não** inclui `agentId` nem `childSessionKey`; use `targetSessionKey` para correlacionar com o evento `subagent_spawned` correspondente.

**Ciclo de vida**

- `gateway_start` / `gateway_stop` - iniciar ou parar serviços pertencentes ao plugin com o Gateway
- `deactivate` - alias de compatibilidade obsoleto para `gateway_stop`; use `gateway_stop` em novos plugins
- `cron_changed` - observar mudanças do ciclo de vida de Cron pertencentes ao gateway (adicionado, atualizado, removido, iniciado, concluído, agendado)
- **`before_install`** - inspecionar material de instalação preparado de skill ou plugin a partir de um runtime de
  plugin carregado

## Depurar hooks de runtime

Use `before_model_resolve` quando um plugin precisa trocar o provedor ou modelo
para um turno de agente. Ele executa antes da resolução do modelo; `llm_output` só executa depois que
uma tentativa de modelo produz saída do assistente.

Para provar o modelo efetivo da sessão, inspecione os registros de runtime e então
use `openclaw sessions` ou as superfícies de sessão/status do Gateway. Ao depurar
payloads de provedor, inicie o Gateway com `--raw-stream` e
`--raw-stream-path <path>`; essas flags gravam eventos brutos de stream do modelo em um arquivo
jsonl.

## Política de chamada de ferramenta

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
- `event.toolKind` e `event.toolInputKind` opcionais, discriminadores com autoridade
  do host para ferramentas que intencionalmente compartilham nomes; por exemplo, chamadas externas
  de modo de código `exec` usam `toolKind: "code_mode_exec"` e
  incluem `toolInputKind: "javascript" | "typescript"` quando a linguagem de entrada
  é conhecida
- `event.derivedPaths` opcional, contendo dicas de caminhos de destino derivadas pelo host
  em melhor esforço para envelopes de ferramentas conhecidos, como `apply_patch`; quando presentes,
  esses caminhos podem estar incompletos ou podem superestimar o que a ferramenta
  realmente tocará (por exemplo, com entradas malformadas ou parciais)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (definido em execuções acionadas por Cron), `ctx.toolKind`,
  `ctx.toolInputKind` e `ctx.trace` de diagnóstico

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamento de proteção de hook para hooks de ciclo de vida tipados:

- `block: true` é terminal e ignora manipuladores de menor prioridade.
- `block: false` é tratado como nenhuma decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e pergunta ao usuário por meio das
  aprovações de plugin. O comando `/approve` pode aprovar tanto aprovações de exec quanto de plugin.
  Em relays nativos `PreToolUse` em modo de relatório do app-server do Codex, isto é adiado
  para a solicitação de aprovação correspondente do app-server; veja [runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#hook-boundaries).
- Um `block: true` de menor prioridade ainda pode bloquear depois que um hook de maior prioridade
  solicitou aprovação.
- `onResolution` recebe a decisão de aprovação resolvida - `allow-once`,
  `allow-always`, `deny`, `timeout` ou `cancelled`.

Veja [Solicitações de permissão de Plugin](/pt-BR/plugins/plugin-permission-requests) para
roteamento de aprovação, comportamento de decisão e quando usar `requireApproval` em vez
de ferramentas opcionais ou aprovações de exec.

Plugins que precisam de política em nível de host podem registrar políticas de ferramentas confiáveis com
`api.registerTrustedToolPolicy(...)`. Elas executam antes dos hooks
`before_tool_call` comuns e antes das decisões normais de hook. Políticas confiáveis
embutidas executam primeiro; políticas confiáveis de plugins instalados executam em seguida na ordem de
carregamento dos plugins; hooks `before_tool_call` comuns executam depois delas. Plugins embutidos mantêm
o caminho de política confiável existente. Plugins instalados devem ser habilitados explicitamente
e declarar cada ID de política em `contracts.trustedToolPolicies`; IDs não declarados
são rejeitados antes do registro. IDs de política têm escopo no plugin registrador,
então plugins diferentes podem reutilizar o mesmo ID local. Use esta camada somente
para controles confiáveis pelo host, como política de workspace, aplicação de orçamento ou
segurança de fluxos de trabalho reservados.

### Hook de ambiente de exec

`resolve_exec_env` permite que plugins contribuam variáveis de ambiente para invocações da ferramenta
`exec` depois que o ambiente base de exec é construído e antes que o
comando execute. Ele recebe:

- `event.sessionKey`
- `event.toolName`, atualmente sempre `"exec"`
- `event.host`, um de `"gateway"`, `"sandbox"` ou `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` e `ctx.channelId`

Retorne um `Record<string, string>` para mesclar ao ambiente de exec. Manipuladores
executam em ordem de prioridade, e resultados de hooks posteriores substituem resultados de hooks anteriores para
a mesma chave.

A saída do hook é filtrada pela política de chaves do ambiente de execução host antes de ser mesclada. Chaves inválidas, `PATH` e chaves perigosas de sobrescrita do host, como `LD_*`, `DYLD_*`, `NODE_OPTIONS`, variáveis de proxy e variáveis de sobrescrita de TLS, são descartadas. A env filtrada do plugin é incluída nos metadados de aprovação/auditoria do Gateway e encaminhada para solicitações de execução node-host.

### Persistência de resultados de ferramentas

Os resultados de ferramentas podem incluir `details` estruturados para renderização de UI, diagnósticos, roteamento de mídia ou metadados de propriedade do plugin. Trate `details` como metadados de runtime, não como conteúdo de prompt:

- O OpenClaw remove `toolResult.details` antes do replay do provedor e da entrada de Compaction para que os metadados não se tornem contexto do modelo.
- Entradas de sessão persistidas mantêm apenas `details` limitados. Details grandes demais são substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final de persistência. Ainda assim, hooks devem manter os `details` retornados pequenos e evitar colocar texto relevante ao prompt apenas em `details`; coloque a saída da ferramenta visível ao modelo em `content`.

## Hooks de prompt e modelo

Use os hooks específicos de fase para novos plugins:

- `before_model_resolve`: recebe apenas o prompt atual e metadados de anexos. Retorne `providerOverride` ou `modelOverride`.
- `agent_turn_prepare`: recebe o prompt atual, as mensagens de sessão preparadas e quaisquer injeções enfileiradas exatamente uma vez drenadas para esta sessão. Retorne `prependContext` ou `appendContext`.
- `before_prompt_build`: recebe o prompt atual e as mensagens da sessão. Retorne `prependContext`, `appendContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution`: é executado apenas para turnos de Heartbeat e retorna `prependContext` ou `appendContext`. Ele é destinado a monitores em segundo plano que precisam resumir o estado atual sem alterar turnos iniciados pelo usuário.

`before_agent_start` permanece por compatibilidade. Prefira os hooks explícitos acima para que seu plugin não dependa de uma fase combinada legada.

`before_agent_run` é executado depois da construção do prompt e antes de qualquer entrada do modelo, incluindo carregamento de imagens local ao prompt e observação `llm_input`. Ele recebe a entrada atual do usuário como `prompt`, além do histórico de sessão carregado em `messages` e o prompt de sistema ativo. Retorne `{ outcome: "block", reason, message? }` para interromper a execução antes que o modelo possa ler o prompt. `reason` é interno; `message` é a substituição exibida ao usuário. Os únicos resultados compatíveis são `pass` e `block`; formatos de decisão sem suporte falham fechados.

Quando uma execução é bloqueada, o OpenClaw armazena apenas o texto de substituição em `message.content`, além de metadados de bloqueio não sensíveis, como o id do plugin bloqueador e o timestamp. O texto original do usuário não é retido na transcrição nem no contexto futuro. Motivos internos de bloqueio são tratados como sensíveis e excluídos de payloads de transcrição, histórico, broadcast, log e diagnóstico. Observabilidade deve usar campos sanitizados, como id do bloqueador, resultado, timestamp ou uma categoria segura.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue identificar a execução ativa. O mesmo valor também está disponível em `ctx.runId`. Execuções acionadas por Cron também expõem `ctx.jobId` (o id do job Cron de origem) para que hooks de plugin possam escopar métricas, efeitos colaterais ou estado para um job agendado específico.

Para execuções originadas de canais, `ctx.channel` e `ctx.messageProvider` identificam a superfície do provedor, como `discord` ou `telegram`, enquanto `ctx.channelId` é o identificador do alvo da conversa quando o OpenClaw consegue derivá-lo da chave da sessão ou dos metadados de entrega.

Quando a identidade do remetente está disponível, os contextos de hook de agente também incluem:

- `ctx.senderId` — ID do remetente no escopo do canal (por exemplo, Feishu `open_id`, ID de usuário do Discord). Preenchido quando a execução se origina de uma mensagem de usuário com metadados conhecidos do remetente.
- `ctx.chatId` — identificador de conversa nativo do transporte (por exemplo, Feishu `chat_id`, Telegram `chat_id`). Preenchido quando o canal de origem fornece um ID de conversa nativo.
- `ctx.channelContext.sender.id` — o mesmo ID de remetente que `ctx.senderId`, sob um objeto de propriedade do canal que plugins podem estender com campos específicos do canal.
- `ctx.channelContext.chat.id` — o mesmo ID de conversa que `ctx.chatId`, sob um objeto de propriedade do canal que plugins podem estender com campos específicos do canal.

O core define apenas os campos `id` aninhados. Plugins de canal que passam metadados mais ricos de remetente ou chat pelo helper de entrada podem ampliar `PluginHookChannelSenderContext` ou `PluginHookChannelChatContext` de `openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Plugins de canal passam esses campos pelo helper do SDK de entrada:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Esses campos são opcionais e ausentes para execuções originadas pelo sistema (heartbeat, cron, exec-event).

`ctx.senderExternalId` permanece como um campo de compatibilidade de fonte obsoleto para plugins mais antigos. O core não o preenche; novas identidades de remetente específicas de canal devem ficar em `ctx.channelContext.sender` por meio de ampliação de módulo.

`agent_end` é um hook de observação. Caminhos do Gateway e de harness persistente o executam sem aguardar conclusão depois do turno, enquanto caminhos CLI de execução única e curta duração aguardam a promessa do hook antes da limpeza do processo, para que plugins confiáveis possam descarregar observabilidade terminal ou capturar estado. O executor de hooks aplica um timeout de 30 segundos para que um plugin travado ou endpoint incorporado não deixe a promessa do hook pendente para sempre. Um timeout é registrado em log e o OpenClaw continua; ele não cancela trabalho de rede de propriedade do plugin, a menos que o plugin também use seu próprio sinal de abortar.

Use `model_call_started` e `model_call_ended` para telemetria de chamada de provedor que não deve receber prompts brutos, histórico, respostas, cabeçalhos, corpos de requisição ou IDs de requisição do provedor. Esses hooks incluem metadados estáveis, como `runId`, `callId`, `provider`, `model`, `api`/`transport` opcionais, `durationMs`/`outcome` terminal e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um hash limitado do id de requisição do provedor. Quando o runtime resolveu metadados de janela de contexto, o evento e o contexto do hook também incluem `contextTokenBudget`, o orçamento efetivo de tokens depois dos limites de modelo/config/agente, além de `contextWindowSource` e `contextWindowReferenceTokens` quando um limite menor foi aplicado.

`before_agent_finalize` é executado apenas quando um harness está prestes a aceitar uma resposta final natural do assistente. Ele não é o caminho de cancelamento `/stop` e não é executado quando o usuário aborta um turno. Retorne `{ action: "revise", reason }` para pedir ao harness mais uma passagem do modelo antes da finalização, `{ action: "finalize", reason? }` para forçar a finalização, ou omita um resultado para continuar. Hooks nativos `Stop` do Codex são retransmitidos para este hook como decisões `before_agent_finalize` do OpenClaw.

Ao retornar `action: "revise"`, plugins podem incluir metadados `retry` para tornar a passagem extra do modelo limitada e segura para replay:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` é anexado ao motivo de revisão enviado ao harness. `idempotencyKey` permite que o host conte novas tentativas para a mesma solicitação de plugin entre decisões de finalização equivalentes, e `maxAttempts` limita quantas passagens extras o host permitirá antes de continuar com a resposta final natural.

Plugins não empacotados que precisam de hooks de conversa bruta (`before_model_resolve`, `before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`, `agent_end` ou `before_agent_run`) devem definir:

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

Hooks que alteram prompt e injeções duráveis para o próximo turno podem ser desativados por plugin com `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensões de sessão e injeções de próximo turno

Plugins de workflow podem persistir pequenos estados de sessão compatíveis com JSON usando `api.registerSessionExtension(...)` e atualizá-los pelo método `sessions.pluginPatch` do Gateway. Linhas de sessão projetam o estado de extensão registrado por meio de `pluginExtensions`, permitindo que o Control UI e outros clientes renderizem status de propriedade do plugin sem conhecer internals do plugin.

Use `api.enqueueNextTurnInjection(...)` quando um plugin precisar que contexto durável chegue exatamente uma vez ao próximo turno do modelo. O OpenClaw drena injeções enfileiradas antes dos hooks de prompt, descarta injeções expiradas e deduplica por `idempotencyKey` por plugin. Esta é a interface correta para retomadas de aprovação, resumos de política, deltas de monitores em segundo plano e continuações de comando que devem ficar visíveis ao modelo no próximo turno, mas não devem se tornar texto permanente do prompt de sistema.

Semânticas de limpeza fazem parte do contrato. Callbacks de limpeza de extensão de sessão e de ciclo de vida do runtime recebem `reset`, `delete`, `disable` ou `restart`. O host remove o estado persistente de extensão de sessão e as injeções pendentes de próximo turno do plugin proprietário para reset/delete/disable; restart mantém o estado durável da sessão enquanto callbacks de limpeza permitem que plugins liberem jobs de agendador, contexto de execução e outros recursos fora de banda da geração de runtime antiga.

## Hooks de mensagem

Use hooks de mensagem para roteamento em nível de canal e política de entrega:

- `message_received`: observe conteúdo de entrada, remetente, `threadId`, `messageId`, `senderId`, correlação opcional de execução/sessão e metadados.
- `message_sending`: reescreva `content` ou retorne `{ cancel: true }`.
- `reply_payload_sending`: reescreva objetos `ReplyPayload` normalizados (incluindo `presentation`, `delivery`, referências de mídia e texto) ou retorne `{ cancel: true }`.
- `message_sent`: observe sucesso ou falha final.

Para respostas TTS somente áudio, `content` pode conter a transcrição falada oculta mesmo quando o payload do canal não tem texto/legenda visível. Reescrever esse `content` atualiza apenas a transcrição visível ao hook; ela não é renderizada como legenda de mídia.

Eventos `reply_payload_sending` podem incluir `usageState`, um snapshot ao vivo de melhor esforço por turno de modelo/uso/contexto. Entrega durável, replay recuperado e respostas sem correlação exata de execução o omitem.

Contextos de hook de mensagem expõem campos de correlação estáveis quando disponíveis: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Contextos de entrada e `before_dispatch` também expõem metadados de resposta quando o canal tem dados de mensagem citada filtrados por visibilidade: `replyToId`, `replyToIdFull`, `replyToBody`, `replyToSender` e `replyToIsQuote`. Prefira esses campos de primeira classe antes de ler metadados legados.

Prefira os campos tipados `threadId` e `replyToId` antes de usar metadados específicos de canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como nenhuma decisão.
- `content` reescrito continua para hooks de prioridade mais baixa, a menos que um hook posterior
  cancele a entrega.
- `reply_payload_sending` é executado após a normalização do payload e antes da entrega pelo canal,
  incluindo respostas roteadas de volta ao canal de origem. Os handlers
  são executados sequencialmente e cada handler vê o payload mais recente produzido por
  handlers de prioridade mais alta.
- Payloads de `reply_payload_sending` não expõem marcadores de confiança de runtime, como
  `trustedLocalMedia`; plugins podem editar o formato do payload, mas não podem conceder confiança a mídia
  local.
- `message_sending` pode retornar `cancelReason` e `metadata` limitado com um
  cancelamento. Novas APIs de ciclo de vida de mensagens expõem isso como um resultado de entrega
  suprimida com o motivo `cancelled_by_message_sending_hook`; a entrega direta legada
  continua retornando um array de resultados vazio por compatibilidade.
- `message_sent` é apenas de observação. Falhas de handler são registradas em log e não
  alteram o resultado da entrega.

## Hooks de instalação

Use `security.installPolicy` para decisões de permitir/bloquear pertencentes ao operador. Essa
política é executada a partir da configuração do OpenClaw, cobre caminhos de instalação e atualização
pela CLI e falha fechada quando está habilitada, mas indisponível.

`before_install` é um hook de ciclo de vida do runtime de Plugin. Ele é executado após
`security.installPolicy` apenas no processo do OpenClaw em que hooks de Plugin já foram
carregados, como fluxos de instalação apoiados pelo Gateway. Ele é útil para
observações, avisos e verificações de compatibilidade pertencentes ao Plugin, mas não é o
principal limite de segurança empresarial ou do host para instalações. O campo `builtinScan`
permanece no payload do evento por compatibilidade, mas o OpenClaw não executa mais
bloqueio integrado de código perigoso em tempo de instalação, então ele é um resultado `ok`
vazio. Retorne descobertas adicionais ou `{ block: true, blockReason }` para interromper a
instalação nesse processo.

`block: true` é terminal. `block: false` é tratado como nenhuma decisão.
Falhas de handler bloqueiam a instalação com falha fechada.

## Ciclo de vida do Gateway

Use `gateway_start` para serviços de Plugin que precisam de estado pertencente ao Gateway. O
contexto expõe `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para
inspeção e atualizações de cron. Use `gateway_stop` para limpar recursos
de longa duração.

Não dependa do hook interno `gateway:startup` para serviços de runtime
pertencentes ao Plugin.

`cron_changed` dispara para eventos de ciclo de vida de cron pertencentes ao gateway com um payload de
evento tipado cobrindo os motivos `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. O evento carrega um snapshot de `PluginHookGatewayCronJob`
(incluindo `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError` quando presente), além de um `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Eventos removidos
ainda carregam o snapshot do job excluído para que agendadores externos possam
reconciliar o estado. Use `ctx.getCron?.()` e `ctx.config` do contexto de
runtime ao sincronizar agendadores de ativação externos, e mantenha o OpenClaw como a
fonte da verdade para verificações de vencimento e execução.

## Próximas descontinuações

Algumas superfícies adjacentes a hooks estão obsoletas, mas ainda são compatíveis. Migre
antes da próxima versão principal:

- **Envelopes de canal em texto simples** em handlers de `inbound_claim` e `message_received`.
  Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar texto de envelope plano. Veja
  [Envelopes de canal em texto simples → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da fase combinada.
- **`subagent_spawning`** permanece por compatibilidade com plugins mais antigos, mas
  novos plugins não devem retornar roteamento de thread a partir dele. O core prepara
  associações de subagente `thread: true` por meio de adaptadores de associação de sessão de canal
  antes de `subagent_spawned` disparar.
- **`deactivate`** permanece como alias de compatibilidade de limpeza obsoleto até
  depois de 2026-08-16. Novos plugins devem usar `gateway_stop`.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de um `string` livre.

Para a lista completa - registro de capacidade de memória, perfil de pensamento do provedor,
provedores de autenticação externos, tipos de descoberta de provedor, acessores de runtime de tarefa
e a renomeação de `command-auth` → `command-status` - veja
[Migração do Plugin SDK → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionados

- [Migração do Plugin SDK](/pt-BR/plugins/sdk-migration) - descontinuações ativas e cronograma de remoção
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Arquitetura interna de Plugin](/pt-BR/plugins/architecture-internals)
