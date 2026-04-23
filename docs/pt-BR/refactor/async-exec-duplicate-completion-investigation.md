---
read_when:
    - Depurar eventos repetidos de conclusão de exec de Node
    - Trabalhar em deduplicação de Heartbeat/evento do sistema
summary: Notas de investigação sobre injeção duplicada de conclusão assíncrona de exec
title: Investigação de conclusão duplicada de exec assíncrono
x-i18n:
    generated_at: "2026-04-23T14:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Investigação de conclusão duplicada de exec assíncrono

## Escopo

- Sessão: `agent:main:telegram:group:-1003774691294:topic:1`
- Sintoma: a mesma conclusão de exec assíncrono para a sessão/execução `keen-nexus` foi registrada duas vezes no LCM como turnos do usuário.
- Objetivo: identificar se o caso mais provável é injeção duplicada na sessão ou simples nova tentativa de entrega de saída.

## Conclusão

O mais provável é que isso seja **injeção duplicada na sessão**, não uma simples nova tentativa de entrega de saída.

A lacuna mais forte no lado do gateway está no **caminho de conclusão de exec do Node**:

1. Um término de exec no lado do Node emite `exec.finished` com o `runId` completo.
2. `server-node-events` do Gateway converte isso em um evento do sistema e solicita um Heartbeat.
3. A execução do Heartbeat injeta o bloco drenado de eventos do sistema no prompt do agente.
4. O runner incorporado persiste esse prompt como um novo turno do usuário na transcrição da sessão.

Se o mesmo `exec.finished` chegar ao gateway duas vezes para o mesmo `runId` por qualquer motivo (replay, duplicação em reconexão, reenvio upstream, produtor duplicado), o OpenClaw atualmente **não tem verificação de idempotência indexada por `runId`/`contextKey`** nesse caminho. A segunda cópia se tornará uma segunda mensagem de usuário com o mesmo conteúdo.

## Caminho exato no código

### 1. Produtor: evento de conclusão de exec do Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emite `node.event` com o evento `exec.finished`.
  - O payload inclui `sessionKey` e o `runId` completo.

### 2. Ingestão de eventos no Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Trata `exec.finished`.
  - Monta o texto:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Enfileira por meio de:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Solicita imediatamente um wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Fraqueza na deduplicação de eventos do sistema

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` apenas suprime **texto duplicado consecutivo**:
    - `if (entry.lastText === cleaned) return false`
  - Ele armazena `contextKey`, mas **não** usa `contextKey` para idempotência.
  - Após o drain, a supressão de duplicatas é redefinida.

Isso significa que um `exec.finished` repetido com o mesmo `runId` pode ser aceito novamente mais tarde, embora o código já tivesse um candidato estável para idempotência (`exec:<runId>`).

### 4. O tratamento de wake não é o principal duplicador

- `src/infra/heartbeat-wake.ts:79-117`
  - Wakes são coalescidos por `(agentId, sessionKey)`.
  - Solicitações duplicadas de wake para o mesmo destino colapsam em uma única entrada pendente de wake.

Isso faz da **duplicação apenas no tratamento de wake** uma explicação mais fraca do que a ingestão duplicada do evento.

### 5. Heartbeat consome o evento e o transforma em entrada de prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - O preflight faz peek nos eventos de sistema pendentes e classifica execuções de tipo exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` drena a fila da sessão.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - O bloco drenado de eventos do sistema é prefixado ao corpo do prompt do agente.

### 6. Ponto de injeção na transcrição

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` envia o prompt completo para a sessão PI incorporada.
  - Esse é o ponto em que o prompt derivado da conclusão se torna um turno persistido do usuário.

Portanto, quando o mesmo evento do sistema é reconstruído no prompt duas vezes, mensagens duplicadas de usuário no LCM são esperadas.

## Por que uma simples nova tentativa de entrega de saída é menos provável

Existe um caminho real de falha de saída no runner de Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - A resposta é gerada primeiro.
  - A entrega de saída acontece depois, por meio de `deliverOutboundPayloads(...)`.
  - Falha ali retorna `{ status: "failed" }`.

No entanto, para a mesma entrada da fila de eventos do sistema, isso por si só **não é suficiente** para explicar os turnos duplicados do usuário:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - A fila de eventos do sistema já foi drenada antes da entrega de saída.

Então, uma nova tentativa de envio no canal, sozinha, não recriaria exatamente o mesmo evento enfileirado. Isso poderia explicar entrega externa ausente/com falha, mas não, por si só, uma segunda mensagem idêntica de usuário na sessão.

## Possibilidade secundária, com menor confiança

Existe um loop de nova tentativa da execução completa no runner do agente:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Certas falhas transitórias podem repetir a execução inteira e reenviar o mesmo `commandBody`.

Isso pode duplicar um prompt de usuário persistido **dentro da mesma execução de resposta** se o prompt já tiver sido anexado antes de a condição de nova tentativa ser acionada.

Eu classifico isso abaixo da ingestão duplicada de `exec.finished` porque:

- o intervalo observado foi de cerca de 51 segundos, o que parece mais um segundo wake/turno do que uma nova tentativa em processo;
- o relatório já menciona falhas repetidas no envio de mensagem, o que aponta mais para um turno posterior separado do que para uma nova tentativa imediata de modelo/runtime.

## Hipótese de causa raiz

Hipótese de maior confiança:

- A conclusão `keen-nexus` passou pelo **caminho de evento de exec do Node**.
- O mesmo `exec.finished` foi entregue duas vezes a `server-node-events`.
- O Gateway aceitou os dois porque `enqueueSystemEvent(...)` não faz deduplicação por `contextKey` / `runId`.
- Cada evento aceito acionou um Heartbeat e foi injetado como turno do usuário na transcrição PI.

## Pequena correção cirúrgica proposta

Se uma correção for desejada, a menor mudança de alto valor é:

- fazer a idempotência de exec/evento do sistema respeitar `contextKey` por uma janela curta, ao menos para repetições exatas de `(sessionKey, contextKey, text)`;
- ou adicionar uma deduplicação dedicada em `server-node-events` para `exec.finished`, indexada por `(sessionKey, runId, kind do evento)`.

Isso bloquearia diretamente duplicatas repetidas de `exec.finished` antes que se tornem turnos de sessão.
