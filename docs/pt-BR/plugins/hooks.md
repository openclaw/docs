---
read_when:
    - Você está criando um plugin que precisa de `before_tool_call`, `before_agent_reply`, hooks de mensagens ou hooks de ciclo de vida
    - Você precisa bloquear, reescrever ou exigir aprovação para chamadas de ferramentas de um plugin
    - Você está decidindo entre hooks internos e hooks de Plugin
    - Você está projetando os despertares do Cron do OpenClaw em um agendador externo do host
summary: 'Hooks de Plugin: intercepte eventos do ciclo de vida do agente, das ferramentas, das mensagens, da sessão e do Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-07-12T15:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Os hooks de Plugin são pontos de extensão no processo para plugins do OpenClaw: inspecione ou
altere execuções de agentes, chamadas de ferramentas, fluxo de mensagens, ciclo de vida de sessões, roteamento de
subagentes, instalações ou inicialização do Gateway.

Use [hooks internos](/pt-BR/automation/hooks) em vez disso para um pequeno script
`HOOK.md` instalado pelo operador que reage a eventos de comandos e do Gateway, como `/new`,
`/reset`, `/stop`, `agent:bootstrap` ou `gateway:startup`.

## Início rápido

Registre hooks tipados com `api.on(...)` na entrada do plugin:

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Os manipuladores que podem retornar decisões ou modificações são executados sequencialmente em
ordem decrescente de `priority`; manipuladores com a mesma prioridade mantêm a ordem de registro.
Manipuladores somente de observação são executados em paralelo, e despachos de observação
sem espera podem se sobrepor a eventos posteriores. Não use a prioridade para ordenar
efeitos colaterais de observação.

`api.on(name, handler, opts?)` aceita:

| Opção       | Efeito                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Ordenação; valores mais altos são executados primeiro.                                                                                                                                             |
| `timeoutMs` | Limite de espera por hook. Quando ele expira, o OpenClaw deixa de aguardar esse manipulador e prossegue. Isso não cancela o manipulador nem seus efeitos colaterais. Omita para usar o tempo limite padrão por hook do executor. |

Os operadores podem definir limites de hooks sem alterar o código do plugin:

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
`api.on(..., { timeoutMs })` definido pelo autor do plugin. Cada valor deve ser um
número inteiro positivo de até 600000 ms. Prefira substituições por hook para hooks
conhecidamente lentos, para que um plugin não receba um limite maior em todos os lugares.

Uma promessa de manipulador que excedeu o tempo limite continua em execução porque os callbacks de hook não
recebem um sinal de cancelamento. O despacho do hook pode liberar sua admissão no Gateway
enquanto o trabalho desse plugin ainda está em andamento. Plugins que possuem
trabalho de longa duração devem fornecer seu próprio ciclo de vida de cancelamento e encerramento.

Os hooks modificadores de saída `message_sending` e `reply_payload_sending` usam um
padrão de 15 segundos por manipulador. Se um deles exceder o tempo limite, o OpenClaw registra o erro do plugin
e continua com a carga útil mais recente para que a fila de entrega serializada possa
ser concluída. Defina um limite maior por hook para plugins que intencionalmente realizam trabalho mais lento
antes da entrega.

Plugins de canal que usam `createReplyDispatcher` também podem declarar um limite positivo maior
por estágio com `beforeDeliverOptions: { timeoutMs }` ou, ao
acrescentar trabalho, com `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Sem um limite declarado pelo proprietário, esses callbacks usam o mesmo padrão de 15 segundos,
para que um callback travado não possa reter a fila de entrega serializada.

Cada hook recebe `event.context.pluginConfig`, a configuração resolvida para o
plugin que registrou esse manipulador. O OpenClaw a injeta por manipulador sem
alterar o objeto de evento compartilhado que outros plugins veem.

## Catálogo de hooks

Os hooks são agrupados pela superfície que estendem. Nomes em **negrito** aceitam um resultado de
decisão (bloquear, cancelar, substituir ou exigir aprovação); os demais são
somente de observação.

**Turno do agente**

| Hook                            | Finalidade                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Substituir o provedor ou modelo antes que as mensagens da sessão sejam carregadas                       |
| `agent_turn_prepare`            | Consumir injeções de turno de plugins na fila e adicionar contexto ao mesmo turno antes dos hooks de prompt |
| `before_prompt_build`           | Adicionar contexto dinâmico ou texto de prompt do sistema antes da chamada ao modelo                    |
| `before_agent_start`            | Fase combinada somente para compatibilidade; prefira os dois hooks acima                                |
| **`before_agent_run`**          | Inspecionar o prompt final e as mensagens da sessão antes do envio ao modelo; pode bloquear a execução  |
| **`before_agent_reply`**        | Interromper antecipadamente o turno do modelo com uma resposta sintética ou silêncio                    |
| **`before_agent_finalize`**     | Inspecionar a resposta final natural e solicitar mais uma passagem pelo modelo                          |
| `agent_end`                     | Observar mensagens finais, estado de sucesso e duração da execução                                     |
| `heartbeat_prompt_contribution` | Adicionar contexto exclusivo de Heartbeat para plugins de monitoramento em segundo plano e ciclo de vida |

**Observação de conversas**

| Hook                                      | Finalidade                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `model_call_started` / `model_call_ended` | Metadados sanitizados de chamadas ao provedor/modelo: tempo, resultado e hashes limitados de IDs de solicitação. Sem conteúdo de prompt ou resposta. |
| `llm_input`                               | Entrada do provedor: prompt do sistema, prompt, histórico                                                                      |
| `llm_output`                              | Saída do provedor, uso e o `contextTokenBudget` resolvido, quando disponível                                                   |

**Ferramentas**

| Hook                       | Finalidade                                                                        |
| -------------------------- | --------------------------------------------------------------------------------- |
| **`before_tool_call`**     | Reescrever parâmetros da ferramenta, bloquear a execução ou exigir aprovação      |
| `after_tool_call`          | Observar resultados da ferramenta, erros e duração                                |
| `resolve_exec_env`         | Fornecer variáveis de ambiente pertencentes ao plugin para `exec`                  |
| **`tool_result_persist`**  | Reescrever a mensagem do assistente produzida a partir do resultado de uma ferramenta |
| **`before_message_write`** | Inspecionar ou bloquear a gravação de uma mensagem em andamento (raro)             |

**Mensagens e entrega**

| Hook                            | Finalidade                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------- |
| **`inbound_claim`**             | Reivindicar uma mensagem recebida antes do roteamento do agente (respostas sintéticas) |
| **`channel_pairing_requested`** | Observar solicitações de pareamento de DM recém-criadas                         |
| `message_received`              | Observar conteúdo recebido, remetente, thread e metadados                       |
| **`message_sending`**           | Reescrever conteúdo de saída ou cancelar a entrega                              |
| **`reply_payload_sending`**     | Alterar ou cancelar cargas úteis normalizadas de resposta antes da entrega       |
| `message_sent`                  | Observar sucesso ou falha na entrega de saída                                   |
| **`before_dispatch`**           | Inspecionar ou reescrever um despacho de saída antes da transferência ao canal   |
| **`reply_dispatch`**            | Participar do pipeline final de despacho de respostas                            |

**Sessões e Compaction**

| Hook                                     | Finalidade                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Rastrear os limites do ciclo de vida da sessão. `reason` é um entre `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` ou `unknown`. `shutdown`/`restart` são disparados pelo finalizador de encerramento do Gateway quando o processo para ou reinicia com sessões ativas, para que plugins (memória, armazenamentos de transcrições) possam finalizar linhas fantasmas em vez de deixá-las abertas entre reinicializações. O finalizador tem limite de tempo para que um plugin lento não possa bloquear SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Observar ou anotar ciclos de Compaction                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `before_reset`                           | Observar eventos de redefinição de sessão (`/reset`, redefinições programáticas)                                                                                                                                                                                                                                                                                                                                                                                      |

**Subagentes**

- `subagent_spawned` / `subagent_ended` - observam a inicialização e a conclusão de subagentes.
- `subagent_delivery_target` - hook de compatibilidade para entrega de conclusão quando nenhum vínculo de sessão do núcleo consegue projetar uma rota.
- `subagent_spawning` - hook de compatibilidade obsoleto. Agora, o núcleo prepara vínculos de subagentes com `thread: true` por meio de adaptadores de vínculo de sessão do canal antes que `subagent_spawned` seja disparado.
- `subagent_spawned` inclui `resolvedModel` e `resolvedProvider` quando o OpenClaw resolve o modelo nativo da sessão filha antes da inicialização.
- `subagent_ended` contém `targetSessionKey` (identidade — corresponde a `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` ou `"acp"`), `reason`, `outcome` opcional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` ou `"deleted"`), `error` opcional, `runId`, `endedAt`, `accountId` e `sendFarewell`. Ele **não** inclui `agentId` nem `childSessionKey`; use `targetSessionKey` para correlacioná-lo com o evento `subagent_spawned` correspondente.

**Ciclo de vida**

| Hook                             | Finalidade                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Iniciar ou interromper serviços pertencentes ao plugin junto com o Gateway                           |
| `deactivate`                     | Alias de compatibilidade obsoleto para `gateway_stop`; use `gateway_stop` em novos plugins           |
| `cron_reconciled`                | Reconciliar com o estado completo do Cron do Gateway após a inicialização ou recarga                  |
| `cron_changed`                   | Observar alterações no ciclo de vida do Cron pertencente ao Gateway (adicionado, atualizado, removido, iniciado, concluído, agendado) |
| **`before_install`**             | Inspecionar o material preparado para instalação de Skills ou plugins a partir de um runtime de plugin carregado |

### Solicitações de pareamento de canais

Use `channel_pairing_requested` quando um plugin precisar notificar um operador ou
gravar um registro de auditoria depois que o remetente de uma MD não pareado criar uma
solicitação de pareamento pendente. O hook é disparado quando a solicitação é criada; a
entrega pelo canal da resposta de pareamento não é atrasada por manipuladores de hook
lentos ou com falha.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nova solicitação de pareamento de ${event.channel} de ${event.senderId}: ${event.code}`,
  });
});
```

O hook serve somente para observação. Ele não aprova, rejeita, suprime nem reescreve
a resposta de pareamento. O payload inclui o canal, o `accountId` opcional,
o `senderId` no escopo do canal, o `code` de pareamento e os metadados do canal. Trate o
código de pareamento como uma credencial de aprovação ativa e de uso único e entregue-o
somente a um destino confiável de operador. Trate `metadata` como texto de identidade
não confiável fornecido pelo remetente. O hook não inclui o corpo nem a mídia da mensagem
recebida.

## Hooks de depuração do runtime

Use `before_model_resolve` para trocar o provedor ou o modelo em um turno do agente — ele
é executado antes da resolução do modelo. `llm_output` só é executado depois que uma
tentativa do modelo produz uma saída do assistente.

Para comprovar o modelo efetivo da sessão, inspecione os registros do runtime e depois
use `openclaw sessions` ou as superfícies de sessão/status do Gateway. Para depurar
payloads do provedor, inicie o Gateway com `--raw-stream` e
`--raw-stream-path <path>` para gravar eventos brutos do fluxo do modelo em um arquivo jsonl.

## Política de chamadas de ferramentas

`before_tool_call` recebe:

- `event.toolName`
- `event.params`
- `event.toolKind` e `event.toolInputKind` opcionais, discriminadores definidos
  de forma autoritativa pelo host para ferramentas que compartilham nomes intencionalmente;
  por exemplo, chamadas externas de `exec` no modo de código usam
  `toolKind: "code_mode_exec"` e incluem
  `toolInputKind: "javascript" | "typescript"` quando a linguagem da entrada é
  conhecida
- `event.derivedPaths` opcional, dicas de caminhos de destino derivadas pelo host
  em caráter de melhor esforço para envelopes de ferramentas conhecidos, como
  `apply_patch`; esses caminhos podem estar incompletos ou superestimar o que a
  ferramenta realmente modificará (por exemplo, com entradas malformadas ou parciais)
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` e o diagnóstico `ctx.trace`

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
    /** @deprecated Aprovações não resolvidas sempre negam. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Comportamento de proteção para hooks de ciclo de vida tipados:

- `block: true` é terminal e ignora manipuladores de prioridade inferior.
- `block: false` é tratado como ausência de decisão.
- `params` reescreve os parâmetros da ferramenta para execução.
- `requireApproval` pausa a execução do agente e solicita confirmação ao usuário
  por meio das aprovações do plugin. `/approve` pode aprovar tanto aprovações de
  exec quanto do plugin. Em retransmissões nativas de `PreToolUse` no modo de
  relatório do app-server do Codex, isso delega à solicitação de aprovação
  correspondente do app-server; consulte
  [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#hook-boundaries).
- Um `block: true` de prioridade inferior ainda pode bloquear depois que um hook
  de prioridade superior solicitar aprovação.
- `onResolution` recebe a decisão resolvida: `allow-once`, `allow-always`,
  `deny`, `timeout` ou `cancelled`.

Consulte [Solicitações de permissão de plugins](/pt-BR/plugins/plugin-permission-requests)
para saber mais sobre roteamento de aprovações, comportamento das decisões e quando
usar `requireApproval` em vez de ferramentas opcionais ou aprovações de exec.

Plugins que precisam de uma política no nível do host podem registrar políticas
confiáveis de ferramentas com `api.registerTrustedToolPolicy(...)`. Elas são
executadas antes dos hooks `before_tool_call` comuns e antes das decisões normais
dos hooks. As políticas confiáveis integradas são executadas primeiro; as políticas
confiáveis de plugins instalados são executadas em seguida, na ordem de carregamento
dos plugins; os hooks `before_tool_call` comuns são executados depois delas. Os plugins
integrados mantêm o caminho existente de políticas confiáveis. Plugins instalados
devem ser habilitados explicitamente e declarar cada ID de política em
`contracts.trustedToolPolicies`; IDs não declarados são rejeitados antes do registro.
Os IDs de política têm como escopo o plugin que os registra, portanto plugins
diferentes podem reutilizar o mesmo ID local. Use esta camada somente para controles
confiáveis do host, como política do espaço de trabalho, aplicação de orçamento ou
segurança de fluxos de trabalho reservados.

### Hook do ambiente de exec

`resolve_exec_env` permite que plugins contribuam com variáveis de ambiente para
invocações da ferramenta `exec` antes da execução do comando. Ele recebe:

- `event.sessionKey`
- `event.toolName`, atualmente sempre `"exec"`
- `event.host`, um entre `"gateway"`, `"sandbox"` ou `"node"`
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` e `ctx.channelId`

Retorne um `Record<string, string>` para mesclar ao ambiente de exec. Os manipuladores
são executados em ordem de prioridade; resultados posteriores substituem resultados
anteriores para a mesma chave.

A saída do hook é filtrada pela política de chaves do ambiente de exec do host antes
da mesclagem. `PATH` é sempre descartada (a resolução de comandos e as verificações
de binários seguros dependem dela). Chaves inválidas e chaves perigosas de substituição
do host, como `LD_*`, `DYLD_*`, `NODE_OPTIONS`, variáveis de proxy (`HTTP_PROXY`,
`HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`) e variáveis de substituição de TLS
(`NODE_TLS_REJECT_UNAUTHORIZED`, `SSL_CERT_FILE` e similares), são descartadas.
O ambiente filtrado do plugin é incluído nos metadados de aprovação/auditoria do
Gateway e encaminhado às solicitações de execução do host Node.

### Persistência dos resultados de ferramentas

Os resultados das ferramentas podem incluir `details` estruturados para renderização
na IU, diagnósticos, roteamento de mídia ou metadados pertencentes ao plugin. Trate
`details` como metadados do runtime, não como conteúdo do prompt:

- O OpenClaw remove `toolResult.details` antes da reprodução para o provedor e da
  entrada de Compaction, para que os metadados não se tornem contexto do modelo.
- Entradas persistidas da sessão mantêm somente `details` limitados. Detalhes grandes
  demais são substituídos por um resumo compacto e `persistedDetailsTruncated: true`.
- `tool_result_persist` e `before_message_write` são executados antes do limite final
  de persistência. Mantenha os `details` retornados pequenos e evite colocar texto
  relevante para o prompt somente em `details`; coloque a saída da ferramenta visível
  ao modelo em `content`.

## Hooks de prompt e modelo

Use os hooks específicos de cada fase para novos plugins:

- `before_model_resolve`: recebe somente o prompt atual e os metadados dos anexos.
  Retorne `providerOverride` ou `modelOverride`.
- `agent_turn_prepare`: recebe o prompt atual, as mensagens preparadas da sessão
  e quaisquer injeções enfileiradas de execução única consumidas para esta sessão.
  Retorne `prependContext` ou `appendContext`.
- `before_prompt_build`: recebe o prompt atual e as mensagens da sessão.
  Retorne `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` ou `appendSystemContext`.
- `heartbeat_prompt_contribution`: é executado somente em turnos de Heartbeat e retorna
  `prependContext` ou `appendContext`. Destina-se a monitores em segundo plano que
  precisam resumir o estado atual sem alterar turnos iniciados pelo usuário.

`before_agent_start` permanece disponível para compatibilidade. Prefira os hooks
explícitos acima para que o plugin não dependa de uma fase combinada legada.

`before_agent_run` é executado após a construção do prompt e antes de qualquer entrada
do modelo, incluindo o carregamento de imagens locais do prompt e a observação de
`llm_input`. Ele recebe a entrada atual do usuário como `prompt`, além do histórico
carregado da sessão em `messages` e do prompt de sistema ativo. Retorne
`{ outcome: "block", reason, message? }` para interromper a execução antes que o
modelo leia o prompt. `reason` é interno; `message` é o texto substituto exibido ao
usuário. Somente os resultados `pass` e `block` são compatíveis; formatos de decisão
não compatíveis falham de forma fechada.

Quando uma execução é bloqueada, o OpenClaw armazena somente o texto substituto em
`message.content`, além de metadados não confidenciais do bloqueio, como o ID do
plugin bloqueador e o carimbo de data/hora. O texto original do usuário não é mantido
na transcrição nem no contexto futuro. Motivos internos de bloqueio são tratados como
confidenciais e excluídos dos payloads de transcrição, histórico, transmissão, log e
diagnóstico. A observabilidade deve usar campos sanitizados, como ID do bloqueador,
resultado, carimbo de data/hora ou uma categoria segura.

`before_agent_start` e `agent_end` incluem `event.runId` quando o OpenClaw consegue
identificar a execução ativa; o mesmo valor também está em `ctx.runId`. Execuções
orientadas por Cron também expõem `ctx.jobId` (o ID do trabalho Cron de origem) no
contexto do turno do agente, permitindo que os hooks restrinjam métricas, efeitos
colaterais ou estado a um trabalho agendado específico. `ctx.jobId` não faz parte do
contexto de ferramenta de `before_tool_call`.

Para execuções originadas em canais, `ctx.channel` e `ctx.messageProvider` identificam
a superfície do provedor, como `discord` ou `telegram`, enquanto `ctx.channelId` é o
identificador de destino da conversa quando o OpenClaw consegue derivá-lo da chave da
sessão ou dos metadados de entrega.

Quando a identidade do remetente está disponível, os contextos dos hooks do agente
também incluem:

- `ctx.senderId` — ID do remetente no escopo do canal (por exemplo, `open_id` do
  Feishu, ID de usuário do Discord). Preenchido quando a execução se origina de uma
  mensagem de usuário com metadados conhecidos do remetente.
- `ctx.chatId` — identificador de conversa nativo do transporte (por exemplo,
  `chat_id` do Feishu, `chat_id` do Telegram). Preenchido quando o canal de origem
  fornece um ID de conversa nativo.
- `ctx.channelContext.sender.id` — o mesmo ID do remetente que `ctx.senderId`, dentro
  de um objeto pertencente ao canal que os plugins podem estender com campos específicos
  do canal.
- `ctx.channelContext.chat.id` — o mesmo ID de conversa que `ctx.chatId`, dentro de
  um objeto pertencente ao canal que os plugins podem estender com campos específicos
  do canal.

O núcleo define somente os campos `id` aninhados. Plugins de canal que encaminham
metadados mais completos do remetente ou do chat pelo auxiliar de entrada podem
estender `PluginHookChannelSenderContext` ou `PluginHookChannelChatContext` de
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Os plugins de canal encaminham esses campos pelo auxiliar do SDK de entrada:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Esses campos são opcionais e estão ausentes em execuções originadas pelo sistema
(Heartbeat, Cron, evento de exec).

`ctx.senderExternalId` permanece como um campo obsoleto de compatibilidade de código-fonte
para plugins mais antigos. O núcleo não o preenche; novas identidades de remetente
específicas de canais devem residir em `ctx.channelContext.sender` por meio de
extensão de módulo.

`agent_end` é um hook de observação. Os caminhos do Gateway e do harness persistente o executam
sem aguardar o resultado após o turno, enquanto os caminhos de CLI de execução única e curta duração aguardam
a promessa do hook antes da limpeza do processo, para que plugins confiáveis possam descarregar
a observabilidade do terminal ou capturar o estado. O executor de hooks aplica um tempo limite de 30 segundos
para que um plugin travado ou endpoint de embedding não possa deixar a promessa do hook
pendente para sempre. Um tempo limite é registrado e o OpenClaw continua; ele não
cancela o trabalho de rede pertencente ao plugin, a menos que o plugin também use seu próprio sinal de
cancelamento.

Use `model_call_started` e `model_call_ended` para telemetria de chamadas ao provedor
que não deva receber prompts brutos, histórico, respostas, cabeçalhos, corpos de
requisição ou IDs de requisição do provedor. Esses hooks incluem metadados estáveis, como
`runId`, `callId`, `provider`, `model`, `api`/`transport` opcionais,
`durationMs`/`outcome` terminais e `upstreamRequestIdHash` quando o OpenClaw consegue derivar um
hash limitado do ID de requisição do provedor. Quando o runtime tiver resolvido
os metadados da janela de contexto, o evento e o contexto do hook também incluirão
`contextTokenBudget`, o orçamento efetivo de tokens após os limites do modelo/configuração/agente,
além de `contextWindowSource` e `contextWindowReferenceTokens` quando um
limite menor tiver sido aplicado.

`before_agent_finalize` é executado somente quando um harness está prestes a aceitar uma resposta
final natural do assistente. Ele não é o caminho de cancelamento de `/stop` e não é
executado quando o usuário interrompe um turno. Retorne `{ action: "revise", reason }` para solicitar
ao harness mais uma passagem do modelo antes da finalização, `{ action:
"finalize", reason? }` para forçar a finalização ou omita um resultado para continuar.
Os manipuladores têm um orçamento padrão de 15s; em caso de tempo limite, o OpenClaw registra a falha e
continua com a resposta final original.
Hooks `Stop` nativos do Codex são encaminhados para esse hook como decisões
`before_agent_finalize` do OpenClaw.

Ao retornar `action: "revise"`, os plugins podem incluir metadados `retry` para
tornar a passagem adicional do modelo limitada e segura para reexecução:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` é anexada ao motivo da revisão enviado ao harness.
`idempotencyKey` permite que o host conte novas tentativas da mesma solicitação do plugin
entre decisões de finalização equivalentes, e `maxAttempts` limita quantas passagens
adicionais o host permitirá antes de continuar com a resposta final natural.

Plugins não incluídos no pacote que precisem de hooks de conversa bruta (`before_model_resolve`,
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

Hooks que modificam prompts e injeções duráveis no próximo turno podem ser desativados por
plugin com `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Extensões de sessão e injeções no próximo turno

Plugins de fluxo de trabalho podem persistir um pequeno estado de sessão compatível com JSON usando
`api.session.state.registerSessionExtension(...)` e atualizá-lo pelo
método `sessions.pluginPatch` do Gateway. As linhas de sessão projetam o estado das
extensões registradas por meio de `pluginExtensions`, permitindo que a Control UI e outros
clientes renderizem o status pertencente ao plugin sem conhecer os detalhes internos do plugin.
`api.registerSessionExtension(...)` ainda funciona, mas está obsoleto em favor do
namespace `api.session.state`.

Use `api.session.workflow.enqueueNextTurnInjection(...)` quando um plugin precisar
que um contexto durável chegue exatamente uma vez ao próximo turno do modelo (a função de nível superior
`api.enqueueNextTurnInjection(...)` é um alias obsoleto com o mesmo
comportamento). O OpenClaw consome as injeções enfileiradas antes dos hooks de prompt, descarta
injeções expiradas e elimina duplicatas por `idempotencyKey` para cada plugin. Esse é
o ponto de integração adequado para retomadas de aprovação, resumos de políticas, deltas de monitores em
segundo plano e continuações de comandos que devam ficar visíveis para o modelo no
próximo turno, mas não devam se tornar texto permanente do prompt do sistema.

A semântica de limpeza faz parte do contrato. Os callbacks de limpeza de extensões de sessão e
do ciclo de vida do runtime recebem `reset`, `delete`, `disable` ou
`restart`. O host remove o estado persistente das extensões de sessão do plugin
proprietário e as injeções pendentes do próximo turno em caso de redefinição/exclusão/desativação; a reinicialização
mantém o estado durável da sessão, enquanto os callbacks de limpeza permitem que os plugins liberem
tarefas do agendador, contexto de execução e outros recursos fora de banda da geração
anterior do runtime.

## Hooks de mensagem

Use hooks de mensagem para roteamento no nível do canal e política de entrega:

- `message_received`: observa o conteúdo recebido, o remetente, `threadId`,
  `messageId`, `senderId`, a correlação opcional de execução/sessão e os metadados.
- `message_sending`: reescreve `content` ou retorna `{ cancel: true }`.
- `reply_payload_sending`: reescreve objetos `ReplyPayload` normalizados
  (incluindo `presentation`, `delivery`, referências de mídia e texto) ou retorna
  `{ cancel: true }`.
- `message_sent`: observa o sucesso ou a falha final.

Para respostas TTS somente de áudio, `content` pode conter a transcrição falada
oculta mesmo quando o payload do canal não tem texto/legenda visível.
Reescrever esse `content` atualiza apenas a transcrição visível ao hook; ela não é
renderizada como legenda da mídia.

Os eventos `reply_payload_sending` podem incluir `usageState`, um snapshot em tempo real,
de melhor esforço, do modelo/uso/contexto por turno. Entregas duráveis, reexecuções recuperadas e
respostas sem correlação exata com a execução o omitem.

Os contextos dos hooks de mensagem expõem campos de correlação estáveis quando disponíveis:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` e `ctx.callDepth`. Os contextos de entrada
e `before_dispatch` também expõem metadados de resposta quando o canal
tem dados da mensagem citada filtrados por visibilidade: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` e `replyToIsQuote`. Prefira esses
campos de primeira classe antes de ler metadados legados.

Prefira os campos tipados `threadId` e `replyToId` antes de usar metadados
específicos do canal.

Regras de decisão:

- `message_sending` com `cancel: true` é terminal.
- `message_sending` com `cancel: false` é tratado como ausência de decisão.
- O `content` reescrito continua para hooks de prioridade inferior, a menos que um hook posterior
  cancele a entrega.
- `reply_payload_sending` é executado após a normalização do payload e antes da entrega
  pelo canal, incluindo respostas roteadas de volta ao canal de origem.
  Os manipuladores são executados sequencialmente, e cada manipulador vê o payload mais recente produzido
  pelos manipuladores de prioridade superior.
- Os payloads de `reply_payload_sending` não expõem marcadores de confiança do runtime, como
  `trustedLocalMedia`; os plugins podem editar a estrutura do payload, mas não podem conceder confiança
  à mídia local.
- `message_sending` pode retornar `cancelReason` e `metadata` limitados com um
  cancelamento. Novas APIs do ciclo de vida de mensagens expõem isso como um resultado de entrega
  suprimida com o motivo `cancelled_by_message_sending_hook`; a entrega direta
  legada continua retornando uma matriz de resultados vazia por compatibilidade.
- `message_sent` serve apenas para observação. Falhas dos manipuladores são registradas e não
  alteram o resultado da entrega.

## Hooks de instalação

Use `security.installPolicy` para decisões de permissão/bloqueio pertencentes ao operador. Essa
política é executada a partir da configuração do OpenClaw, abrange os caminhos de instalação e atualização da CLI e
falha de modo fechado quando está habilitada, mas indisponível.

`before_install` é um hook do ciclo de vida do runtime do plugin. Ele é executado após
`security.installPolicy` somente no processo do OpenClaw em que os hooks de plugin já
foram carregados, como nos fluxos de instalação apoiados pelo Gateway. Ele é útil para
observações, avisos e verificações de compatibilidade pertencentes ao plugin, mas não é
o principal limite de segurança corporativo ou do host para instalações. O campo
`builtinScan` permanece no payload do evento por compatibilidade, mas o
OpenClaw não executa mais o bloqueio integrado de código perigoso durante a instalação, portanto ele
é um resultado `ok` vazio. Retorne constatações adicionais ou
`{ block: true, blockReason }` para interromper a instalação nesse processo.

`block: true` é terminal. `block: false` é tratado como ausência de decisão. Falhas dos
manipuladores bloqueiam a instalação de modo fechado.

## Ciclo de vida do Gateway

Use `gateway_start` para iniciar serviços gerais do plugin e `gateway_stop` para
limpar recursos de longa duração. O agendador Cron ainda pode estar sendo carregado quando
`gateway_start` é executado, portanto não o use como sinal de referência para uma projeção
Cron externa.

Não dependa do hook interno `gateway:startup` para serviços de runtime
pertencentes ao plugin.

`cron_reconciled` é disparado depois que o agendador Cron do Gateway e seus observadores de saída
reconciliam o estado durável. Ele é disparado tanto na inicialização
quanto na substituição do agendador durante a recarga da configuração. O evento informa
`reason` (`startup` ou `reload`) e o estado efetivo de `enabled`. Um Cron desabilitado
ainda emite o evento com `enabled: false`, permitindo que uma projeção externa
limpe ativações obsoletas. Use `ctx.getCron?.()` para obter a instância exata do agendador que
concluiu a reconciliação; uma recarga posterior não redireciona esse callback.
`ctx.abortSignal` pertence ao mesmo snapshot do agendador. O Gateway o cancela assim
que um agendador mais recente é ativado ou o encerramento começa. Propague-o para todos os
efeitos colaterais duráveis e não aceite o snapshot depois que ele for cancelado.
Esse é um sinal do ciclo de vida do agendador, não um sinal de ativação do plugin: uma
recarga a quente apenas do plugin não o reproduz. Um consumidor recém-habilitado recebe
sua primeira referência na próxima substituição do agendador ou inicialização do Gateway.

Assim como outros hooks de observação, os callbacks de `gateway_start` e `cron_reconciled`
podem se sobrepor. Se ambos os manipuladores compartilharem a inicialização do plugin, coordene-os
com uma promessa de prontidão local ao plugin, em vez de depender da ordem dos callbacks.

`cron_changed` é disparado para eventos do ciclo de vida do Cron pertencentes ao Gateway, com um payload
de evento tipado que abrange os motivos `added`, `updated`, `removed`, `started`, `finished`
e `scheduled`. O evento transporta um snapshot `PluginHookGatewayCronJob`
(incluindo `state.nextRunAtMs`, `state.lastRunStatus` e
`state.lastError`, quando presentes), além de um `PluginHookGatewayCronDeliveryStatus`
de `not-requested` | `delivered` | `not-delivered` | `unknown`. Eventos de remoção
ocorrem após o commit: eles são disparados somente depois que a exclusão durável é concluída com sucesso e ainda carregam
o snapshot da tarefa excluída para que agendadores externos possam reconciliar o estado.

Um evento `scheduled` ocorre após o commit: ele é disparado somente depois que uma gravação durável
bem-sucedida altera o `nextRunAtMs` efetivo de uma tarefa existente, excluindo o evento explícito
`added`, `updated` ou `removed` do ciclo de vida dessa tarefa. O
`event.nextRunAtMs` de nível superior é a próxima ativação confirmada; quando ausente, a tarefa
não tem próxima ativação. Trate esses eventos como indicações de reconciliação, não como um log
ordenado de deltas. Use-os como indicações combináveis para reler o agendador capturado por último pelo
`cron_reconciled`; não adote o agendador de um contexto `cron_changed`.
Mantenha o OpenClaw como fonte da verdade para verificações de vencimento e execução.

### Projeção Cron externa segura

Projete um snapshot completo de ativações em vez de encaminhar deltas de eventos Cron. A
operação `replaceAll` do adaptador externo deve ser atômica e idempotente, e deve
ser concluída somente depois que o host tiver aceitado o snapshot de forma durável. Ela também deve
respeitar o sinal de cancelamento fornecido: se o sinal for cancelado antes da aceitação
durável, o adaptador não deverá aceitar esse snapshot.

Esse padrão mantém em execução apenas um worker com o estado mais recente. Somente `cron_reconciled`
adota uma instância do agendador; `cron_changed` apenas solicita que esse worker releia
a instância autoritativa, para que uma indicação tardia não possa restaurar um agendador mais antigo.
Uma revisão mais recente cancela a tentativa ativa do host antes que ela possa aceitar um snapshot
obsoleto.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Quando `cron_reconciled` informa `enabled: false`, o mesmo caminho chama
`replaceAll([])` e limpa os despertares externos obsoletos. A repetição com recuo neste exemplo
é local ao processo e trata as falhas do adaptador de runtime como transitórias; valide
a configuração que não permite novas tentativas antes do registro. O OpenClaw não fornece uma
caixa de saída para os efeitos dos hooks de plugins. Se o processo for encerrado antes da aceitação durável,
a próxima inicialização do Gateway emitirá um novo snapshot autoritativo de `cron_reconciled`.
`gateway_stop` interrompe o trabalho em andamento no host, aguarda a conclusão do worker e, em seguida,
fecha o adaptador.

## Próximas descontinuações

Algumas superfícies relacionadas a hooks estão obsoletas, mas ainda são compatíveis. Faça a migração
antes da próxima versão principal:

- **Envelopes de canal em texto simples** nos manipuladores `inbound_claim` e
  `message_received`. Leia `BodyForAgent` e os blocos estruturados de contexto do usuário
  em vez de analisar o texto simples do envelope. Consulte
  [Envelopes de canal em texto simples → BodyForAgent](/pt-BR/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** permanece por compatibilidade. Novos plugins devem usar
  `before_model_resolve` e `before_prompt_build` em vez da fase
  combinada.
- **`subagent_spawning`** permanece por compatibilidade com plugins mais antigos, mas
  novos plugins não devem retornar o roteamento de threads por meio dele. O núcleo prepara as
  associações de subagentes com `thread: true` por meio dos adaptadores de associação de sessão do canal
  antes que `subagent_spawned` seja disparado.
- **`deactivate`** permanece como um alias de compatibilidade obsoleto para limpeza até
  depois de 2026-08-16. Novos plugins devem usar `gateway_stop`.
- **`onResolution` em `before_tool_call`** agora usa a união tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) em vez de uma `string` de formato livre.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** permanecem
  como aliases de compatibilidade de nível superior. Novos plugins devem usar
  `api.session.state.registerSessionExtension(...)` e
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Para obter a lista completa — registro de capacidade de memória, perfil de raciocínio
do provedor, provedores de autenticação externos, tipos de descoberta de provedores, acessadores
do runtime de tarefas e a renomeação de `command-auth` → `command-status` — consulte
[Migração do SDK de Plugin → Descontinuações ativas](/pt-BR/plugins/sdk-migration#active-deprecations).

## Relacionados

- [Migração do SDK de Plugin](/pt-BR/plugins/sdk-migration) - descontinuações ativas e cronograma de remoção
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
- [Pontos de entrada de plugins](/pt-BR/plugins/sdk-entrypoints)
- [Hooks internos](/pt-BR/automation/hooks)
- [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals)
