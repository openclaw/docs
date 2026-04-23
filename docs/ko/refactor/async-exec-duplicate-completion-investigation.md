---
read_when:
    - 반복되는 node exec 완료 이벤트 디버깅
    - Heartbeat/시스템 이벤트 dedupe 작업 중
summary: 중복 비동기 exec 완료 주입에 대한 조사 노트
title: 비동기 Exec 중복 완료 조사
x-i18n:
    generated_at: "2026-04-23T14:08:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# 비동기 Exec 중복 완료 조사

## 범위

- 세션: `agent:main:telegram:group:-1003774691294:topic:1`
- 증상: 동일한 세션/실행 `keen-nexus`에 대한 동일한 비동기 exec 완료가 LCM에 사용자 턴으로 두 번 기록됨
- 목표: 이것이 중복 세션 주입인지, 아니면 단순 outbound 전송 재시도인지 식별

## 결론

가장 가능성이 높은 것은 순수한 outbound 전송 재시도가 아니라 **중복 세션 주입**입니다.

Gateway 측에서 가장 강한 공백은 **node exec 완료 경로**에 있습니다.

1. node 측 exec 종료가 전체 `runId`를 포함한 `exec.finished`를 발생시킵니다.
2. Gateway `server-node-events`가 이를 시스템 이벤트로 변환하고 heartbeat를 요청합니다.
3. heartbeat 실행이 소진된 시스템 이벤트 블록을 에이전트 프롬프트에 주입합니다.
4. 임베드된 러너가 해당 프롬프트를 세션 transcript에 새로운 사용자 턴으로 저장합니다.

어떤 이유로든(재생, 재연결 중복, 상위 재전송, 중복 producer) 동일한 `runId`에 대해 같은 `exec.finished`가 gateway에 두 번 도달하면, 현재 OpenClaw에는 이 경로에 대해 `runId`/`contextKey` 기반 idempotency 검사가 **없습니다**. 따라서 두 번째 복사본은 동일한 내용의 두 번째 사용자 메시지가 됩니다.

## 정확한 코드 경로

### 1. Producer: node exec 완료 이벤트

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)`가 이벤트 `exec.finished`로 `node.event`를 발생시킵니다.
  - payload에는 `sessionKey`와 전체 `runId`가 포함됩니다.

### 2. Gateway 이벤트 수집

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished`를 처리합니다.
  - 다음 텍스트를 구성합니다.
    - `Exec finished (node=..., id=<runId>, code ...)`
  - 다음을 통해 큐에 넣습니다.
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - 즉시 wake를 요청합니다.
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. 시스템 이벤트 dedupe 취약점

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)`는 **연속된 중복 텍스트**만 억제합니다.
    - `if (entry.lastText === cleaned) return false`
  - `contextKey`는 저장하지만, idempotency에는 사용하지 않습니다.
  - drain 후에는 duplicate suppression이 초기화됩니다.

즉, 동일한 `runId`를 가진 재생된 `exec.finished`는 나중에 다시 수락될 수 있으며, 코드에는 이미 안정적인 idempotency 후보(`exec:<runId>`)가 있는데도 이를 사용하지 않습니다.

### 4. Wake 처리 자체는 주된 중복 원인이 아님

- `src/infra/heartbeat-wake.ts:79-117`
  - wake는 `(agentId, sessionKey)` 기준으로 병합됩니다.
  - 동일 대상에 대한 중복 wake 요청은 하나의 대기 wake 항목으로 축약됩니다.

따라서 **wake 처리 중복만으로** 설명하는 것은 중복 이벤트 수집보다 더 약한 설명입니다.

### 5. Heartbeat가 이벤트를 소비하고 프롬프트 입력으로 변환

- `src/infra/heartbeat-runner.ts:535-574`
  - 사전 점검 단계에서 대기 중인 시스템 이벤트를 미리 보고 exec-event 실행을 분류합니다.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)`가 해당 세션의 큐를 소진합니다.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - 소진된 시스템 이벤트 블록이 에이전트 프롬프트 본문 앞에 추가됩니다.

### 6. Transcript 주입 지점

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)`가 전체 프롬프트를 임베드된 PI 세션에 제출합니다.
  - 이 시점에서 완료 기반 프롬프트가 영속 사용자 턴이 됩니다.

따라서 동일한 시스템 이벤트가 두 번 프롬프트로 재구성되면, LCM에 중복 사용자 메시지가 생기는 것은 예상된 결과입니다.

## 단순 outbound 전송 재시도 가능성이 더 낮은 이유

heartbeat runner에는 실제 outbound 실패 경로가 존재합니다.

- `src/infra/heartbeat-runner.ts:1194-1242`
  - 먼저 답글이 생성됩니다.
  - outbound 전송은 이후 `deliverOutboundPayloads(...)`를 통해 이루어집니다.
  - 여기서 실패하면 `{ status: "failed" }`를 반환합니다.

하지만 동일한 시스템 이벤트 큐 항목에 대해서는 이것만으로는 **중복 사용자 턴**을 설명하기에 충분하지 않습니다.

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - 시스템 이벤트 큐는 outbound 전송 전에 이미 소진됩니다.

즉, 채널 전송 재시도만으로는 동일한 큐 항목이 다시 생성되지 않습니다. 외부 전송 누락/실패는 설명할 수 있지만, 그 자체만으로 동일한 세션 사용자 메시지가 두 번째로 생기지는 않습니다.

## 부차적이고 신뢰도가 더 낮은 가능성

에이전트 러너에는 전체 실행 재시도 루프가 있습니다.

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - 특정 일시적 실패는 전체 실행을 재시도하고 동일한 `commandBody`를 다시 제출할 수 있습니다.

이는 재시도 조건이 트리거되기 전에 프롬프트가 이미 추가된 경우, **같은 reply 실행 내부에서** 영속 사용자 프롬프트를 중복시킬 수 있습니다.

하지만 이를 duplicate `exec.finished` 수집보다 낮게 평가하는 이유는 다음과 같습니다.

- 관찰된 간격이 약 51초였는데, 이는 프로세스 내부 재시도보다는 두 번째 wake/turn처럼 보입니다.
- 보고서에 이미 반복적인 메시지 전송 실패가 언급되어 있어, 즉시 모델/런타임 재시도보다는 분리된 이후 턴을 더 강하게 시사합니다.

## 근본 원인 가설

가장 신뢰도가 높은 가설:

- `keen-nexus` 완료는 **node exec 이벤트 경로**를 통해 들어왔습니다.
- 동일한 `exec.finished`가 `server-node-events`에 두 번 전달되었습니다.
- Gateway는 `enqueueSystemEvent(...)`가 `contextKey` / `runId` 기준 dedupe를 하지 않기 때문에 둘 다 수락했습니다.
- 수락된 각 이벤트는 heartbeat를 트리거했고, PI transcript에 사용자 턴으로 주입되었습니다.

## 제안하는 작은 외과적 수정

수정이 필요하다면, 가장 작으면서 효과가 큰 변경은 다음입니다.

- 최소한 정확한 `(sessionKey, contextKey, text)` 반복에 대해 짧은 시간 범위 동안 `contextKey` 기반 idempotency를 exec/system-event에 적용
- 또는 `(sessionKey, runId, event kind)`를 키로 하는 `exec.finished` 전용 dedupe를 `server-node-events`에 추가

이렇게 하면 재생된 `exec.finished` 중복이 세션 턴이 되기 전에 직접 차단됩니다.
