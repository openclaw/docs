---
read_when:
    - Depurando eventos repetidos de conclusão de exec do Node
    - Trabalhando em deduplicação de eventos de sistema/Heartbeat
summary: Notas de investigação sobre injeção duplicada de conclusão assíncrona de exec
title: Investigação de conclusão duplicada assíncrona de exec
x-i18n:
    generated_at: "2026-04-24T06:10:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Escopo

- Sessão: `agent:main:telegram:group:-1003774691294:topic:1`
- Sintoma: a mesma conclusão assíncrona de exec para sessão/run `keen-nexus` foi registrada duas vezes no LCM como turnos do usuário.
- Objetivo: identificar se isso é mais provavelmente uma injeção duplicada na sessão ou uma simples nova tentativa de entrega de saída.

## Conclusão

Muito provavelmente isso é **injeção duplicada na sessão**, e não uma simples nova tentativa de entrega de saída.

A lacuna mais forte no lado do gateway está no **caminho de conclusão de exec do node**:

1. Um término de exec no lado do node emite `exec.finished` com o `runId` completo.
2. O gateway `server-node-events` converte isso em um evento de sistema e solicita um heartbeat.
3. A execução de heartbeat injeta o bloco drenado de evento de sistema no prompt do agente.
4. O runner incorporado persiste esse prompt como um novo turno do usuário na transcrição da sessão.

Se o mesmo `exec.finished` chegar ao gateway duas vezes para o mesmo `runId` por qualquer motivo (replay, duplicata de reconexão, reenvio upstream, produtor duplicado), o OpenClaw atualmente **não tem verificação de idempotência indexada por `runId`/`contextKey`** nesse caminho. A segunda cópia se tornará uma segunda mensagem de usuário com o mesmo conteúdo.

## Caminho exato do código

### 1. Produtor: evento de conclusão de exec do node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emite `node.event` com o evento `exec.finished`.
  - O payload inclui `sessionKey` e o `runId` completo.

### 2. Ingestão de evento no gateway

- `src/gateway/server-node-events.ts:574-640`
  - Trata `exec.finished`.
  - Monta o texto:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Enfileira por:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Solicita imediatamente um wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Fragilidade na deduplicação de evento de sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` só suprime **texto duplicado consecutivo**:
    - `if (entry.lastText === cleaned) return false`
  - Ele armazena `contextKey`, mas **não** usa `contextKey` para idempotência.
  - Após o drain, a supressão de duplicatas é redefinida.

Isso significa que um `exec.finished` repetido com o mesmo `runId` pode ser aceito novamente mais tarde, mesmo que o código já tivesse um candidato estável de idempotência (`exec:<runId>`).

### 4. O tratamento de wake não é o principal duplicador

- `src/infra/heartbeat-wake.ts:79-117`
  - Wakes são coalescidos por `(agentId, sessionKey)`.
  - Solicitações duplicadas de wake para o mesmo alvo colapsam em uma única entrada pendente de wake.

Isso faz com que **apenas o tratamento duplicado de wake** seja uma explicação mais fraca do que a ingestão duplicada de evento.

### 5. O heartbeat consome o evento e o transforma em entrada de prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - O preflight faz peek em eventos de sistema pendentes e classifica execuções de evento exec.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena a fila da sessão.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - O bloco drenado de evento de sistema é prefixado ao corpo do prompt do agente.

### 6. Ponto de injeção na transcrição

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` envia o prompt completo para a sessão PI incorporada.
  - Esse é o ponto em que o prompt derivado da conclusão se torna um turno persistido do usuário.

Portanto, uma vez que o mesmo evento de sistema é reconstruído no prompt duas vezes, mensagens duplicadas de usuário no LCM são esperadas.

## Por que uma simples nova tentativa de entrega de saída é menos provável

Existe um caminho real de falha de saída no runner de heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - A resposta é gerada primeiro.
  - A entrega de saída acontece depois via `deliverOutboundPayloads(...)`.
  - Falha ali retorna `{ status: "failed" }`.

No entanto, para a mesma entrada da fila de evento de sistema, isso **não é suficiente** por si só para explicar turnos duplicados do usuário:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - A fila de eventos de sistema já é drenada antes da entrega de saída.

Então, uma nova tentativa de envio do canal por si só não recriaria o mesmo evento enfileirado. Ela poderia explicar entrega externa ausente/com falha, mas não, sozinha, uma segunda mensagem idêntica de usuário na sessão.

## Possibilidade secundária, de menor confiança

Existe um loop completo de nova tentativa de execução no runner do agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Certas falhas transitórias podem tentar novamente toda a execução e reenviar o mesmo `commandBody`.

Isso pode duplicar um prompt persistido de usuário **dentro da mesma execução de resposta** se o prompt já tiver sido anexado antes que a condição de nova tentativa fosse acionada.

Eu classifico isso como menos provável do que ingestão duplicada de `exec.finished` porque:

- a lacuna observada foi de cerca de 51 segundos, o que parece mais um segundo wake/turno do que uma nova tentativa em processo;
- o relato já menciona falhas repetidas no envio de mensagens, o que aponta mais para um turno posterior separado do que para uma nova tentativa imediata do modelo/runtime.

## Hipótese de causa raiz

Hipótese de maior confiança:

- A conclusão `keen-nexus` veio pelo **caminho de evento exec do node**.
- O mesmo `exec.finished` foi entregue duas vezes a `server-node-events`.
- O gateway aceitou ambos porque `enqueueSystemEvent(...)` não deduplica por `contextKey` / `runId`.
- Cada evento aceito disparou um heartbeat e foi injetado como turno do usuário na transcrição PI.

## Pequena correção cirúrgica proposta

Se uma correção for desejada, a menor mudança de alto valor é:

- fazer a idempotência de evento exec/sistema respeitar `contextKey` por um curto horizonte, ao menos para repetições exatas de `(sessionKey, contextKey, text)`;
- ou adicionar uma deduplicação dedicada em `server-node-events` para `exec.finished`, indexada por `(sessionKey, runId, kind do evento)`.

Isso bloquearia diretamente duplicatas repetidas de `exec.finished` antes que elas se transformem em turnos de sessão.

## Relacionado

- [Tool Exec](/pt-BR/tools/exec)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
