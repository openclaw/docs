---
read_when:
    - 채널 송신 또는 수신 동작 리팩터링
    - 채널 턴, 답장 디스패치, 아웃바운드 큐, 미리보기 스트리밍 또는 Plugin SDK 메시지 API 변경
    - 지속성 있는 전송, 수신 확인, 미리보기, 수정 또는 재시도가 필요한 새 채널 Plugin 설계
summary: 통합 영속 메시지 수신, 전송, 미리보기, 편집 및 스트리밍 수명 주기를 위한 설계 계획
title: 메시지 수명 주기 리팩터링
x-i18n:
    generated_at: "2026-05-06T06:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

이 페이지는 흩어져 있는 채널 턴, 응답 디스패치, 미리보기 스트리밍, 아웃바운드 전달 헬퍼를 하나의 내구성 있는 메시지 수명 주기로 대체하기 위한 목표 설계입니다.

짧게 말하면:

- 코어 프리미티브는 **reply**가 아니라 **receive**와 **send**여야 합니다.
- 응답은 아웃바운드 메시지의 관계일 뿐입니다.
- 턴은 인바운드 처리 편의 기능이지, 전달의 소유자가 아닙니다.
- 전송은 컨텍스트 기반이어야 합니다: `begin`, 렌더링, 미리보기 또는 스트리밍, 최종 전송,
  커밋, 실패.
- 수신도 컨텍스트 기반이어야 합니다: 정규화, 중복 제거, 라우팅, 기록,
  디스패치, 플랫폼 ack, 실패.
- 공개 Plugin SDK는 하나의 작은 채널 메시지 표면으로 접혀야 합니다.

## 문제

현재 채널 스택은 여러 타당한 로컬 요구에서 성장했습니다.

- 단순 인바운드 어댑터는 `runtime.channel.turn.run`을 사용합니다.
- 풍부한 기능의 어댑터는 `runtime.channel.turn.runPrepared`를 사용합니다.
- 레거시 헬퍼는 `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, 응답 페이로드 헬퍼, 응답 청킹,
  응답 참조, 아웃바운드 런타임 헬퍼를 사용합니다.
- 미리보기 스트리밍은 채널별 디스패처 안에 있습니다.
- 최종 전달 내구성은 기존 응답 페이로드 경로 주변에 추가되고 있습니다.

이 형태는 로컬 버그를 해결하지만, OpenClaw에는 너무 많은 공개 개념과
전달 의미가 달라질 수 있는 너무 많은 지점이 남습니다.

이를 드러낸 신뢰성 문제는 다음과 같습니다.

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

목표 불변 조건은 Telegram보다 더 넓습니다. 코어가 표시되는
아웃바운드 메시지가 존재해야 한다고 결정하면, 플랫폼 전송을 시도하기 전에
그 의도가 내구성 있게 저장되어야 하며, 성공 후에는 플랫폼 수신 확인이
커밋되어야 합니다. 이를 통해 OpenClaw는 최소 1회 복구를 제공합니다. 정확히 1회 동작은
네이티브 멱등성을 증명할 수 있거나, 재생 전에 플랫폼 상태에 대해
전송 후 알 수 없음 시도를 조정할 수 있는 어댑터에만 존재합니다.

이는 이 리팩터의 최종 상태이지, 모든 현재 경로에 대한 설명이 아닙니다.
마이그레이션 중에는 최선 노력 큐 쓰기가 실패할 때 기존 아웃바운드 헬퍼가
여전히 직접 전송으로 빠질 수 있습니다. 내구성 있는 최종 전송이 닫힌 상태로 실패하거나
문서화된 비내구성 정책으로 명시적으로 옵트아웃할 때만 리팩터가 완료됩니다.

## 목표

- 모든 채널 메시지 수신 및 전송 경로를 위한 하나의 코어 수명 주기.
- 어댑터가 재생 안전 동작을 선언한 후 새 메시지 수명 주기에서 기본으로 내구성 있는 최종 전송.
- 공유 미리보기, 편집, 스트리밍, 최종화, 재시도, 복구, 수신 확인
  의미.
- 서드파티 플러그인이 배우고 유지할 수 있는 작은 Plugin SDK 표면.
- 마이그레이션 중 기존 `channel.turn` 호출자와의 호환성.
- 새 채널 기능을 위한 명확한 확장 지점.
- 코어 안의 플랫폼별 분기 없음.
- 토큰 델타 채널 메시지 없음. 채널 스트리밍은 메시지 미리보기,
  편집, 추가 또는 완료된 블록 전달로 유지됩니다.
- 운영/시스템 출력을 위한 구조화된 OpenClaw 기원 메타데이터. 표시되는
  Gateway 실패가 봇이 활성화된 공유 방에 새 프롬프트로 다시 들어가지 않도록 합니다.

## 비목표

- 첫 단계에서 `runtime.channel.turn.*`를 제거하지 않습니다.
- 모든 채널에 같은 네이티브 전송 동작을 강제하지 않습니다.
- 코어에 Telegram 주제, Slack 네이티브 스트림, Matrix 삭제,
  Feishu 카드, QQ 음성 또는 Teams 활동을 가르치지 않습니다.
- 모든 내부 마이그레이션 헬퍼를 안정적인 SDK API로 게시하지 않습니다.
- 재시도가 완료된 비멱등 플랫폼 작업을 재생하게 만들지 않습니다.

## 참조 모델

Vercel Chat에는 좋은 공개 멘탈 모델이 있습니다.

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping`, 기록 가져오기 같은 어댑터 메서드
- 중복 제거, 락, 큐, 영속성을 위한 상태 어댑터

OpenClaw는 표면을 복사하지 말고 어휘를 빌려야 합니다.

그 모델을 넘어 OpenClaw에 필요한 것:

- 직접 전송 호출 전에 내구성 있는 아웃바운드 전송 의도.
- 시작, 커밋, 실패가 있는 명시적 전송 컨텍스트.
- 플랫폼 ack 정책을 아는 수신 컨텍스트.
- 재시작 후에도 유지되며 편집, 삭제, 복구, 중복 억제를 구동할 수 있는 수신 확인.
- 더 작은 공개 SDK. 번들 Plugin은 내부 런타임 헬퍼를 사용할 수 있지만,
  서드파티 플러그인에는 하나의 일관된 메시지 API가 보여야 합니다.
- 에이전트별 동작: 세션, transcript, 블록 스트리밍, 도구
  진행, 승인, 미디어 지시문, 무음 응답, 그룹 멘션
  기록.

`thread.post()` 스타일 프라미스만으로는 OpenClaw에 충분하지 않습니다. 이들은
전송이 복구 가능한지 결정하는 트랜잭션 경계를 숨깁니다.

## 코어 모델

새 도메인은 `src/channels/message/*` 같은 내부 코어 네임스페이스 아래에 있어야 합니다.

네 가지 개념이 있습니다.

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive`는 인바운드 수명 주기를 소유합니다.

`send`는 아웃바운드 수명 주기를 소유합니다.

`live`는 미리보기, 편집, 진행, 스트림 상태를 소유합니다.

`state`는 내구성 있는 의도 저장, 수신 확인, 멱등성, 복구, 락,
중복 제거를 소유합니다.

## 메시지 용어

### 메시지

정규화된 메시지는 플랫폼 중립적입니다.

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### 대상

대상은 메시지가 존재하는 위치를 설명합니다.

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### 관계

응답은 관계이지 API 루트가 아닙니다.

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

이를 통해 같은 전송 경로가 일반 응답, Cron 알림, 승인
프롬프트, 작업 완료, message-tool 전송, CLI 또는 Control UI 전송, 하위 에이전트
결과, 자동화 전송을 처리할 수 있습니다.

### 기원

기원은 누가 메시지를 생성했는지와 OpenClaw가 해당 메시지의 에코를 어떻게 처리해야 하는지를 설명합니다.
이는 관계와 별개입니다. 메시지는 사용자에 대한 응답이면서도
OpenClaw에서 비롯된 운영 출력일 수 있습니다.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

코어는 OpenClaw에서 비롯된 출력의 의미를 소유합니다. 채널은 그
기원이 전송 계층에 인코딩되는 방식을 소유합니다.

첫 번째 필수 사용 사례는 Gateway 실패 출력입니다. 사람은 여전히
"응답 전 에이전트 실패" 또는 "API 키 누락" 같은 메시지를 볼 수 있어야 하지만, 태그가 붙은
OpenClaw 운영 출력은 `allowBots`가 활성화된 공유
방에서 봇 작성 입력으로 받아들여지면 안 됩니다.

### 수신 확인

수신 확인은 일급 개념입니다.

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

수신 확인은 내구성 있는 의도에서 향후 편집, 삭제, 미리보기
최종화, 중복 억제, 복구로 이어지는 다리입니다.

수신 확인은 하나의 플랫폼 메시지 또는 여러 부분으로 된 전달을 설명할 수 있습니다. 청크된
텍스트, 미디어와 텍스트, 음성과 텍스트, 카드 폴백은 모든
플랫폼 ID를 보존하면서도 스레딩과 이후 편집을 위한 기본 ID를 노출해야 합니다.

## 수신 컨텍스트

수신은 단순한 헬퍼 호출이면 안 됩니다. 코어에는
중복 제거, 라우팅, 세션 기록, 플랫폼 ack 정책을 아는 컨텍스트가 필요합니다.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

수신 흐름:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Ack는 하나가 아닙니다. 수신 계약은 다음 신호를 분리해서 유지해야 합니다.

- **전송 ack:** OpenClaw가 이벤트 envelope을 수락했음을 플랫폼 Webhook 또는 소켓에 알립니다.
  일부 플랫폼은 디스패치 전에 이것을 요구합니다.
- **폴링 오프셋 ack:** 같은 이벤트를 다시 가져오지 않도록 커서를 전진시킵니다.
  복구할 수 없는 작업을 지나 전진하면 안 됩니다.
- **인바운드 기록 ack:** OpenClaw가 재전달을 중복 제거하고 라우팅하기에 충분한 인바운드 메타데이터를
  영속화했음을 확인합니다.
- **사용자에게 보이는 수신 확인:** 선택적 읽음/상태/입력 중 동작이며, 절대
  내구성 경계가 아닙니다.

`ReceiveAckPolicy`는 전송 또는 폴링 승인만 제어합니다. 읽음 확인이나 상태 반응에
재사용하면 안 됩니다.

봇 승인 전에, 채널이 메시지 기원 메타데이터를 디코딩할 수 있을 때 수신은
공유 OpenClaw 에코 정책을 적용해야 합니다.

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

이 드롭은 텍스트 기반이 아니라 태그 기반입니다. 같은 표시 Gateway 실패 텍스트가 있지만
OpenClaw 기원 메타데이터가 없는 봇 작성 방 메시지는 여전히
일반 `allowBots` 승인을 거칩니다.

Ack 정책은 명시적입니다.

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 폴링은 이제 영속화된 재시작 watermark에 수신 컨텍스트 ack 정책을 사용합니다.
추적기는 여전히 grammY 업데이트가 미들웨어 체인에 들어올 때 관찰하지만,
OpenClaw는 성공적인 디스패치 후 안전하게 완료된 업데이트 ID만 영속화하여
실패했거나 더 낮은 보류 중 업데이트가 재시작 후 재생 가능하게 남깁니다. Telegram의 upstream `getUpdates` fetch offset은 여전히
폴링 라이브러리가 제어하므로, OpenClaw의 재시작
watermark를 넘어선 플랫폼 수준 재전달이 필요해지면 남은 더 깊은 작업은 완전히 내구성 있는 폴링
소스입니다. Webhook 플랫폼은 즉시 HTTP ack가 필요할 수 있지만, Webhook은 재전달될 수 있으므로
여전히 인바운드 중복 제거와 내구성 있는 아웃바운드 전송 의도가 필요합니다.

## 전송 컨텍스트

전송도 컨텍스트 기반입니다.

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

선호하는 오케스트레이션:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

헬퍼는 다음으로 확장됩니다.

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

인텐트는 전송 I/O 전에 존재해야 합니다. begin 이후 commit 전의 재시작은 복구할 수 있습니다.

위험한 경계는 플랫폼 성공 이후와 receipt commit 이전입니다. 프로세스가 그 지점에서 종료되면, 어댑터가 네이티브 멱등성이나 receipt 조정 경로를 제공하지 않는 한 OpenClaw는 플랫폼 메시지가 존재하는지 알 수 없습니다. 이러한 시도는 무작정 재실행하지 말고 `unknown_after_send`에서 재개해야 합니다. 조정이 없는 채널은 중복으로 보이는 메시지가 해당 채널과 관계에서 허용 가능한 문서화된 트레이드오프인 경우에만 at-least-once 재실행을 선택할 수 있습니다. 현재 SDK 조정 브리지는 어댑터가 `reconcileUnknownSend`를 선언하도록 요구한 다음, `durableFinal.reconcileUnknownSend`에 알 수 없는 항목을 `sent`, `not_sent`, 또는 `unresolved`로 분류하도록 요청합니다. `not_sent`만 재실행을 허용하며, 해결되지 않은 항목은 터미널 상태로 남거나 조정 검사만 재시도합니다.

내구성 정책은 명시적이어야 합니다.

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required`는 코어가 durable intent를 쓸 수 없을 때 닫힌 상태로 실패해야 함을 의미합니다. `best_effort`는 영속성을 사용할 수 없을 때 그대로 통과할 수 있습니다. `disabled`는 기존 직접 전송 동작을 유지합니다. 마이그레이션 중에는 레거시 래퍼와 공개 호환성 헬퍼가 기본값으로 `disabled`를 사용합니다. 채널에 일반 outbound 어댑터가 있다는 사실만으로 `required`를 추론해서는 안 됩니다.

전송 컨텍스트는 채널 로컬 post-send 효과도 소유합니다. durable delivery가 이전에 채널의 직접 전송 경로에 연결되어 있던 로컬 동작을 우회하면 마이그레이션은 안전하지 않습니다. 예로는 self-echo 억제 캐시, 스레드 참여 표시자, 네이티브 편집 앵커, 모델 서명 렌더링, 플랫폼별 중복 방지 장치가 있습니다. 해당 채널이 durable generic final delivery를 활성화하기 전에 이러한 효과는 전송 어댑터, 렌더 어댑터, 또는 명명된 send-context 훅으로 이동해야 합니다.

전송 헬퍼는 receipt를 호출자까지 끝까지 반환해야 합니다. Durable 래퍼는 메시지 ID를 삼키거나 채널 전달 결과를 `undefined`로 대체할 수 없습니다. 버퍼링된 디스패처는 이러한 ID를 스레드 앵커, 이후 편집, preview finalization, 중복 억제에 사용합니다.

Fallback 전송은 단일 페이로드가 아니라 배치 단위로 동작합니다. Silent-reply 재작성, 미디어 fallback, 카드 fallback, 청크 투영은 모두 둘 이상의 전달 가능한 메시지를 만들 수 있으므로, 전송 컨텍스트는 투영된 전체 배치를 전달하거나 왜 하나의 페이로드만 유효한지 명시적으로 문서화해야 합니다.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

이러한 fallback이 durable할 때, 투영된 전체 배치는 하나의 durable send intent 또는 다른 원자적 배치 계획으로 표현되어야 합니다. 각 페이로드를 하나씩 기록하는 것만으로는 충분하지 않습니다. 페이로드 사이에 크래시가 발생하면 남은 페이로드에 대한 durable record 없이 부분적으로 보이는 fallback이 남을 수 있습니다. 복구는 어떤 유닛에 이미 receipt가 있는지 알아야 하며, 누락된 유닛만 재실행하거나 어댑터가 조정할 때까지 배치를 `unknown_after_send`로 표시해야 합니다.

## 라이브 컨텍스트

Preview, edit, progress, stream 동작은 하나의 opt-in lifecycle이어야 합니다.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Live state는 중복을 복구하거나 억제할 수 있을 만큼 durable합니다.

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

이는 현재 동작을 포괄해야 합니다.

- Telegram 전송 후 edit preview, stale preview 나이가 지난 뒤 새 final.
- Discord 전송 후 edit preview, 미디어/오류/명시적 답장 시 취소.
- 스레드 형태에 따라 Slack 네이티브 스트림 또는 draft preview.
- Mattermost draft post finalization.
- Matrix draft event finalization 또는 불일치 시 redaction.
- Teams 네이티브 progress stream.
- QQ Bot stream 또는 누적된 fallback.

## 어댑터 인터페이스

공개 SDK 대상은 하나의 하위 경로여야 합니다.

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

대상 형태:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

전송 어댑터:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

수신 어댑터:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Preflight 권한 부여 전에, `origin.decode`가 OpenClaw-origin 메타데이터를 반환할 때마다 코어는 공유 OpenClaw echo predicate를 실행해야 합니다. 수신 어댑터는 봇 작성자와 room shape 같은 플랫폼 사실을 제공합니다. 코어가 drop 결정과 순서를 소유하므로 채널이 텍스트 필터를 다시 구현하지 않습니다.

Origin 어댑터:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

코어가 `MessageOrigin`을 설정합니다. 채널은 이를 네이티브 전송 메타데이터로, 그리고 그 반대로만 변환합니다. Slack은 이를 `chat.postMessage({ metadata })`와 inbound `message.metadata`에 매핑합니다. Matrix는 이를 추가 이벤트 콘텐츠에 매핑할 수 있습니다. 네이티브 메타데이터가 없는 채널은 그것이 사용 가능한 최선의 근사치일 때 receipt/outbound registry를 사용할 수 있습니다.

Capabilities:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## 공개 SDK 축소

새 공개 표면은 다음 개념 영역을 흡수하거나 폐기 예정으로 표시해야 합니다.

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime`의 대부분 공개 사용
- 임시 draft stream lifecycle 헬퍼

호환성 하위 경로는 래퍼로 남을 수 있지만, 새 third-party plugins에는 필요하지 않아야 합니다.

번들 Plugin은 마이그레이션 중 예약된 runtime 하위 경로를 통해 내부 헬퍼 import를 유지할 수 있습니다. 공개 문서는 `plugin-sdk/channel-message`가 생기면 Plugin 작성자를 그쪽으로 안내해야 합니다.

## 채널 턴과의 관계

`runtime.channel.turn.*`은 마이그레이션 중 유지되어야 합니다.

이는 호환성 어댑터가 되어야 합니다.

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared`도 처음에는 유지되어야 합니다.

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

모든 번들 Plugin과 알려진 third-party compatibility path가 브리지된 뒤에는 `channel.turn`을 폐기 예정으로 표시할 수 있습니다. 게시된 SDK 마이그레이션 경로와 기존 Plugin이 계속 작동하거나 명확한 버전 오류로 실패함을 증명하는 contract tests가 있기 전에는 제거해서는 안 됩니다.

## 호환성 보호 장치

마이그레이션 중에는 기존 delivery callback이 "이 페이로드를 전송"하는 것 이상의 사이드 이펙트를 가진 모든 채널에 대해 generic durable delivery는 opt-in입니다.

레거시 진입점은 기본적으로 non-durable입니다.

- `channel.turn.run`과 `dispatchAssembledChannelTurn`은 해당 채널이 감사된 durable policy/options 객체를 명시적으로 제공하지 않는 한 채널의 delivery callback을 사용합니다.
- `channel.turn.runPrepared`는 prepared dispatcher가 send context를 명시적으로 호출할 때까지 channel-owned 상태로 남습니다.
- `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, 직접 DM 헬퍼 같은 공개 호환성 헬퍼는 호출자가 제공한 `deliver` 또는 `reply` callback 전에 generic durable delivery를 절대 주입하지 않습니다.

마이그레이션 브리지 타입에서 `durable: undefined`는 "durable 아님"을 의미합니다. durable 경로는 명시적인 policy/options 값으로만 활성화됩니다. `durable: false`는 호환성 표기로 남을 수 있지만, 구현이 모든 미마이그레이션 채널에 이를 추가하도록 요구해서는 안 됩니다.

현재 브리지 코드는 내구성 결정을 명시적으로 유지해야 합니다:

- 내구성 있는 최종 전달은 판별된 상태를 반환합니다. `handled_visible` 및
  `handled_no_send`는 종료 상태이며, `unsupported` 및 `not_applicable`은
  채널 소유 전달로 폴백할 수 있고, `failed`는 전송 실패를 전파합니다.
- 일반 내구성 있는 최종 전달은 무음 전달, 답장 대상 보존, 네이티브 인용 보존,
  메시지 전송 훅 같은 어댑터 기능으로 제한됩니다. 동등성이 누락된 경우,
  사용자에게 보이는 동작을 바꾸는 일반 전송이 아니라 채널 소유 전달을 선택해야 합니다.
- 큐 기반 내구성 있는 전송은 전달 의도 참조를 노출합니다. 기존
  `pendingFinalDelivery*` 세션 필드는 전환 중에 의도 ID를 전달할 수 있으며,
  최종 상태는 고정된 답장 텍스트와 임시 컨텍스트 필드가 아니라
  `MessageSendIntent` 저장소입니다.

다음이 모두 참이 될 때까지 채널에 일반 내구성 경로를 활성화하지 마세요.

- 일반 전송 어댑터가 기존 직접 경로와 동일한 렌더링 및 전송 동작을 실행합니다.
- 로컬 전송 후 부수 효과가 전송 컨텍스트를 통해 보존됩니다.
- 어댑터가 모든 플랫폼 메시지 ID가 포함된 수신 확인 또는 전달 결과를 반환합니다.
- 준비된 디스패처 경로가 새 전송 컨텍스트를 호출하거나, 내구성 보장 범위 밖으로 문서화된 상태로 유지됩니다.
- 폴백 전달이 첫 번째 페이로드뿐 아니라 모든 투영된 페이로드를 처리합니다.
- 내구성 있는 폴백 전달이 전체 투영된 페이로드 배열을 하나의 재생 가능한 의도 또는 배치 계획으로 기록합니다.

보존해야 할 구체적인 마이그레이션 위험:

- iMessage 모니터 전달은 성공적인 전송 후 보낸 메시지를 에코 캐시에 기록합니다. 내구성 있는 최종 전송도 여전히 그 캐시를 채워야 하며, 그렇지 않으면 OpenClaw가 자신의 최종 답장을 인바운드 사용자 메시지로 다시 수집할 수 있습니다.
- Tlon은 선택적 모델 서명을 추가하고 그룹 답장 후 참여한 스레드를 기록합니다. 일반 내구성 전달은 이러한 효과를 우회해서는 안 됩니다. 이를 Tlon 렌더링/전송/최종화 어댑터로 옮기거나, Tlon을 채널 소유 경로에 유지하세요.
- Discord 및 다른 준비된 디스패처는 이미 직접 전달과 미리보기 동작을 소유합니다. 준비된 디스패처가 최종 메시지를 전송 컨텍스트를 통해 명시적으로 라우팅할 때까지, 이들은 조립된 턴 내구성 보장에 포함되지 않습니다.
- Telegram 무음 폴백 전달은 전체 투영된 페이로드 배열을 전달해야 합니다. 단일 페이로드 단축 경로는 투영 후 추가 폴백 페이로드를 누락할 수 있습니다.
- LINE, BlueBubbles, Zalo, Nostr 및 다른 기존 조립/도우미 경로에는 답장 토큰 처리, 미디어 프록시, 보낸 메시지 캐시, 로딩/상태 정리 또는 콜백 전용 대상이 있을 수 있습니다. 이러한 의미가 전송 어댑터로 표현되고 테스트로 검증될 때까지, 해당 경로는 채널 소유 전달에 유지됩니다.
- Direct-DM 도우미에는 유일하게 올바른 전송 대상인 답장 콜백이 있을 수 있습니다. 일반 아웃바운드는 `OriginatingTo` 또는 `To`에서 추측하여 그 콜백을 건너뛰면 안 됩니다.
- OpenClaw Gateway 실패 출력은 사람이 볼 수 있어야 하지만, 태그가 지정된 봇 작성 방 에코는 `allowBots` 승인 전에 삭제되어야 합니다. 채널은 짧은 긴급 임시 조치를 제외하고 이를 표시 텍스트 접두사 필터로 구현해서는 안 됩니다. 내구성 계약은 구조화된 원본 메타데이터입니다.

## 내부 저장소

내구성 큐는 답장 페이로드가 아니라 메시지 전송 의도를 저장해야 합니다.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

복구 루프:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

큐는 재시작 후에도 동일한 계정, 스레드, 대상, 형식 지정 정책 및 미디어 규칙을 통해 재생할 수 있도록 충분한 식별 정보를 유지해야 합니다.

## 실패 클래스

채널 어댑터는 전송 실패를 닫힌 범주로 분류합니다.

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

코어 정책:

- `transient` 및 `rate_limit`을 재시도합니다.
- 렌더링 폴백이 없는 한 `invalid_payload`를 재시도하지 않습니다.
- 구성이 변경될 때까지 `auth` 또는 `permission`을 재시도하지 않습니다.
- `not_found`의 경우, 채널이 안전하다고 선언하면 라이브 최종화가 편집에서 새 전송으로 폴백하도록 합니다.
- `conflict`의 경우, 수신 확인/멱등성 규칙을 사용하여 메시지가 이미 존재하는지 결정합니다.
- 어댑터가 플랫폼 I/O를 완료했을 수 있지만 수신 확인 커밋 전에 발생한 모든 오류는, 어댑터가 플랫폼 작업이 발생하지 않았음을 증명할 수 없는 한 `unknown_after_send`가 됩니다.

## 채널 매핑

| 채널                     | 목표 마이그레이션                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | ack 정책과 내구성 있는 최종 전송을 수신합니다. 라이브 어댑터는 전송과 편집 미리보기, 오래된 미리보기 최종 전송, 토픽, 인용 답장 미리보기 건너뛰기, 미디어 폴백, retry-after 처리를 소유합니다.                                                                                                                                                                |
| Discord                  | 전송 어댑터는 기존의 내구성 있는 페이로드 전달을 래핑합니다. 라이브 어댑터는 초안 편집, 진행률 초안, 미디어/오류 미리보기 취소, 답장 대상 보존, 메시지 ID 수신 확인을 소유합니다. 공유 방에서 봇이 작성한 Gateway 실패 에코를 감사하세요. Discord가 일반 메시지에 원본 메타데이터를 담을 수 없다면 아웃바운드 레지스트리나 그 밖의 네이티브 동등 기능을 사용하세요. |
| Slack                    | 전송 어댑터는 일반 채팅 게시물을 처리합니다. 라이브 어댑터는 스레드 구조가 지원할 때 네이티브 스트림을 선택하고, 그렇지 않으면 초안 미리보기를 선택합니다. 수신 확인은 스레드 타임스탬프를 보존합니다. 원본 어댑터는 OpenClaw Gateway 실패를 Slack `chat.postMessage.metadata`에 매핑하고 `allowBots` 승인 전에 태그된 봇 방 에코를 삭제합니다.                 |
| WhatsApp                 | 전송 어댑터는 내구성 있는 최종 인텐트가 포함된 텍스트/미디어 전송을 소유합니다. 수신 어댑터는 그룹 멘션과 보낸 사람 ID를 처리합니다. WhatsApp에 편집 가능한 전송 수단이 생길 때까지 라이브는 없어도 됩니다.                                                                                                                                                    |
| Matrix                   | 라이브 어댑터는 초안 이벤트 편집, 최종화, 교정, 암호화된 미디어 제약, 답장 대상 불일치 폴백을 소유합니다. 수신 어댑터는 암호화된 이벤트 하이드레이션과 중복 제거를 소유합니다. 원본 어댑터는 OpenClaw Gateway 실패 원본을 Matrix 이벤트 콘텐츠에 인코딩하고 `allowBots` 처리 전에 구성된 봇 방 에코를 삭제해야 합니다.                                     |
| Mattermost               | 라이브 어댑터는 하나의 초안 게시물, 진행률/도구 접기, 제자리 최종화, 새 전송 폴백을 소유합니다.                                                                                                                                                                                                                                                                |
| Microsoft Teams          | 라이브 어댑터는 네이티브 진행률과 블록 스트림 동작을 소유합니다. 전송 어댑터는 활동과 첨부 파일/카드 수신 확인을 소유합니다.                                                                                                                                                                                                                                   |
| Feishu                   | 렌더 어댑터는 텍스트/카드/원시 렌더링을 소유합니다. 라이브 어댑터는 스트리밍 카드와 중복 최종본 억제를 소유합니다. 전송 어댑터는 댓글, 토픽 세션, 미디어, 음성 억제를 소유합니다.                                                                                                                                                                             |
| QQ Bot                   | 라이브 어댑터는 C2C 스트리밍, 누산기 타임아웃, 폴백 최종 전송을 소유합니다. 렌더 어댑터는 미디어 태그와 텍스트를 음성으로 변환하는 기능을 소유합니다.                                                                                                                                                                                                          |
| Signal                   | 단순 수신 및 전송 어댑터입니다. signal-cli가 신뢰할 수 있는 편집 지원을 추가하지 않는 한 라이브 어댑터는 없습니다.                                                                                                                                                                                                                                            |
| iMessage 및 BlueBubbles | 단순 수신 및 전송 어댑터입니다. iMessage 전송은 내구성 있는 최종본이 모니터 전달을 우회할 수 있기 전에 모니터 에코 캐시 채우기를 보존해야 합니다. BlueBubbles 전용 입력 상태, 반응, 첨부 파일은 어댑터 기능으로 남습니다.                                                                                                                                    |
| Google Chat              | 공간과 스레드 ID에 매핑된 스레드 관계가 포함된 단순 수신 및 전송 어댑터입니다. 태그된 OpenClaw Gateway 실패 에코에 대해 `allowBots=true` 방 동작을 감사하세요.                                                                                                                                                                                                 |
| LINE                     | 답장 토큰 제약을 대상/관계 기능으로 모델링한 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                   |
| Nextcloud Talk           | SDK 수신 브리지와 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                           |
| IRC                      | 단순 수신 및 전송 어댑터이며, 내구성 있는 편집 수신 확인은 없습니다.                                                                                                                                                                                                                                                                                           |
| Nostr                    | 암호화된 DM을 위한 수신 및 전송 어댑터입니다. 수신 확인은 이벤트 ID입니다.                                                                                                                                                                                                                                                                                      |
| QA 채널                  | 수신, 전송, 라이브, 재시도, 복구 동작을 위한 계약 테스트 어댑터입니다.                                                                                                                                                                                                                                                                                          |
| Synology Chat            | 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                |
| Tlon                     | 일반 내구성 최종 전달을 활성화하기 전에 전송 어댑터는 모델 서명 렌더링과 참여한 스레드 추적을 보존해야 합니다.                                                                                                                                                                                                                                                |
| Twitch                   | 속도 제한 분류가 포함된 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                        |
| Zalo                     | 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                |
| Zalo Personal            | 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                |

## 마이그레이션 계획

### 1단계: 내부 메시지 도메인

- 메시지, 대상, 관계,
  원본, 수신 확인, 기능, 내구성 있는 인텐트, 수신 컨텍스트, 전송
  컨텍스트, 라이브 컨텍스트, 실패 클래스를 위한 `src/channels/message/*` 타입을 추가합니다.
- 현재 답장 전달에서 사용하는 마이그레이션 브리지 페이로드 타입에
  `origin?: MessageOrigin`을 추가한 다음, 리팩터링이 답장 페이로드를 대체하면서
  그 필드를 `ChannelMessage`와 렌더링된 메시지 타입으로 옮깁니다.
- 어댑터와 테스트가 형태를 입증할 때까지 이를 내부로 유지합니다.
- 상태 전환과 직렬화를 위한 순수 단위 테스트를 추가합니다.

### 2단계: 내구성 있는 전송 코어

- 기존 아웃바운드 큐를 답장 페이로드 내구성에서 내구성 있는
  메시지 전송 인텐트로 옮깁니다.
- 내구성 있는 전송 인텐트가 하나의 답장 페이로드만이 아니라
  투영된 페이로드 배열이나 배치 계획을 담을 수 있게 합니다.
- 호환성 변환을 통해 현재 큐 복구 동작을 보존합니다.
- `deliverOutboundPayloads`가 `messages.send`를 호출하게 합니다.
- 어댑터가 재생 안전성을 선언한 뒤, 새 메시지 수명 주기에서 내구성 있는 인텐트를
  쓸 수 없으면 최종 전송 내구성을 기본값으로 삼고 닫힌 상태로 실패하게 합니다.
  기존 채널 턴과 SDK 호환성 경로는 이 단계 동안 기본적으로 직접 전송으로 유지됩니다.
- 수신 확인을 일관되게 기록합니다.
- 내구성 있는 전송을 최종 부수 효과로 취급하는 대신, 원래 디스패처 호출자에게
  수신 확인과 전달 결과를 반환합니다.
- 복구, 재생, 청크 전송이 OpenClaw 운영 출처를 보존하도록 메시지 원본을
  내구성 있는 전송 인텐트에 유지합니다.

### 3단계: 채널 턴 브리지

- `messages.receive`와 `messages.send` 위에서
  `channel.turn.run`과 `dispatchAssembledChannelTurn`을 다시 구현합니다.
- 현재 팩트 타입을 안정적으로 유지합니다.
- 기본적으로 레거시 동작을 유지합니다. 조립된 턴 채널은 어댑터가 재생 안전 내구성
  정책으로 명시적으로 옵트인할 때만 내구성을 갖습니다.
- 네이티브 편집을 최종화하며 아직 안전하게 재생할 수 없는 경로를 위한
  호환성 탈출구로 `durable: false`를 유지하되, 마이그레이션되지 않은 채널을 보호하기 위해
  `false` 마커에 의존하지는 않습니다.
- 채널 매핑이 일반 전송 경로가 이전 채널 전달 의미 체계를 보존함을 입증한 뒤,
  새 메시지 수명 주기에서만 조립된 턴 내구성을 기본값으로 삼습니다.

### 4단계: 준비된 디스패처 브리지

- `deliverDurableInboundReplyPayload`를 send-context 브리지로 교체합니다.
- 이전 헬퍼는 래퍼로 유지합니다.
- Telegram, WhatsApp, Slack, Signal, iMessage, Discord는 이미 durable-final 작업이 있거나 send 경로가 더 단순하므로 먼저 포팅합니다.
- 모든 준비된 dispatcher는 send context에 명시적으로 옵트인하기 전까지는 커버되지 않은 것으로 간주합니다. 문서와 changelog 항목은 모든 자동 최종 답장을 주장하기보다 "조립된 채널 turn"이라고 말하거나 마이그레이션된 채널 경로를 이름으로 언급해야 합니다.
- `recordInboundSessionAndDispatchReply`, direct-DM 헬퍼, 그리고 유사한 공개 호환성 헬퍼는 동작을 보존합니다. 나중에 명시적인 send-context 옵트인을 노출할 수는 있지만, 호출자가 소유한 전달 콜백보다 먼저 일반 durable delivery를 자동으로 시도해서는 안 됩니다.

### 5단계: 통합 라이브 라이프사이클

- 두 개의 증명 adapter로 `messages.live`를 빌드합니다.
  - send, edit, stale final send용 Telegram.
  - draft finalization 및 redaction fallback용 Matrix.
- 그런 다음 Discord, Slack, Mattermost, Teams, QQ Bot, Feishu를 마이그레이션합니다.
- 각 채널에 parity 테스트가 생긴 후에만 중복 preview finalization 코드를 삭제합니다.

### 6단계: 공개 SDK

- `openclaw/plugin-sdk/channel-message`를 추가합니다.
- 이를 권장 채널 Plugin API로 문서화합니다.
- package exports, entrypoint inventory, 생성된 API baseline, Plugin SDK 문서를 업데이트합니다.
- `MessageOrigin`, origin encode/decode hook, 공유 `shouldDropOpenClawEcho` predicate를 channel-message SDK 표면에 포함합니다.
- 이전 하위 경로에 대한 호환성 래퍼를 유지합니다.
- 번들 Plugin이 마이그레이션된 후 reply 이름의 SDK 헬퍼를 문서에서 deprecated로 표시합니다.

### 7단계: 모든 송신자

모든 non-reply outbound producer를 `messages.send`로 이동합니다.

- cron 및 Heartbeat 알림
- task 완료
- hook 결과
- 승인 프롬프트 및 승인 결과
- message tool send
- subagent 완료 알림
- 명시적 CLI 또는 Control UI send
- automation/broadcast 경로

여기서 모델은 "agent 답장"이 아니라 "OpenClaw가 메시지를 보냄"이 됩니다.

### 8단계: Turn 사용 중단

- `channel.turn`은 최소 한 번의 호환성 기간 동안 래퍼로 유지합니다.
- 마이그레이션 노트를 게시합니다.
- 이전 import에 대해 Plugin SDK 호환성 테스트를 실행합니다.
- 번들 Plugin이 더 이상 필요로 하지 않고 third-party contract에 안정적인 대체가 생긴 후에만 이전 내부 헬퍼를 제거하거나 숨깁니다.

## 테스트 계획

Unit 테스트:

- durable send intent serialization 및 recovery.
- Idempotency key 재사용 및 중복 억제.
- Receipt commit 및 replay skip.
- adapter가 reconciliation을 지원할 때 replay 전에 reconcile하는 `unknown_after_send` recovery.
- 실패 분류 정책.
- Receive ack policy sequencing.
- reply, followup, system, broadcast send에 대한 relation mapping.
- Gateway-failure origin factory 및 `shouldDropOpenClawEcho` predicate.
- payload normalization, chunking, durable queue serialization, recovery를 통한 origin 보존.

Integration 테스트:

- `channel.turn.run` 단순 adapter가 여전히 기록하고 send합니다.
- Legacy assembled-turn delivery는 채널이 명시적으로 옵트인하지 않는 한 durable이 되지 않습니다.
- `channel.turn.runPrepared` 브리지는 여전히 기록하고 finalizes합니다.
- 공개 호환성 헬퍼는 기본적으로 호출자가 소유한 전달 콜백을 호출하며, 해당 콜백보다 먼저 generic-send를 하지 않습니다.
- Durable fallback delivery는 재시작 후 전체 projected payload array를 replay하며, 초기 crash 후 나중 payload가 기록되지 않은 상태로 남을 수 없습니다.
- Durable assembled-turn delivery는 platform message id를 buffered dispatcher에 반환합니다.
- durable delivery가 비활성화되었거나 사용할 수 없을 때 custom delivery hook은 여전히 platform message id를 반환합니다.
- 최종 답장은 assistant completion과 platform send 사이에 재시작해도 유지됩니다.
- Preview draft는 허용될 때 제자리에서 finalizes됩니다.
- media/error/reply-target mismatch로 normal delivery가 필요할 때 Preview draft는 취소되거나 redacted됩니다.
- Block streaming과 preview streaming은 동일한 텍스트를 둘 다 전달하지 않습니다.
- 일찍 streaming된 media는 final delivery에서 중복되지 않습니다.

Channel 테스트:

- Telegram topic reply는 receive context의 safe completed watermark까지 polling ack가 지연됩니다.
- accepted-but-not-delivered update에 대한 Telegram polling recovery는 persisted safe-completed offset model로 커버됩니다.
- Telegram stale preview는 새로운 final을 send하고 preview를 정리합니다.
- Telegram silent fallback은 모든 projected fallback payload를 send합니다.
- Telegram silent fallback durability는 루프 반복마다 single-payload durable intent 하나가 아니라 전체 projected fallback array를 atomically 기록합니다.
- Discord preview cancel on media/error/explicit reply.
- 문서나 changelog가 Discord final-reply durability를 주장하기 전에 Discord prepared dispatcher final은 send context를 통해 라우팅됩니다.
- iMessage durable final send는 monitor sent-message echo cache를 채웁니다.
- LINE, BlueBubbles, Zalo, Nostr legacy delivery path는 adapter parity 테스트가 존재할 때까지 generic durable send로 우회되지 않습니다.
- Direct-DM/Nostr callback delivery는 complete message target 및 replay-safe send adapter로 명시적으로 마이그레이션되지 않는 한 authoritative로 유지됩니다.
- Slack tagged OpenClaw gateway failure message는 outbound에서 보이는 상태로 유지되고, tagged bot-room echo는 `allowBots` 전에 drop되며, 동일한 visible text를 가진 untagged bot message는 여전히 일반 bot authorization을 따릅니다.
- Slack native stream은 top-level DM에서 draft preview로 fallback합니다.
- Matrix preview finalization 및 redaction fallback.
- 설정된 bot account에서 온 Matrix tagged OpenClaw gateway-failure room echo는 `allowBots` 처리 전에 drop됩니다.
- Discord 및 Google Chat shared-room gateway-failure cascade audit는 해당 위치에서 generic protection을 주장하기 전에 `allowBots` mode를 커버합니다.
- Mattermost draft finalization 및 fresh-send fallback.
- Teams native progress finalization.
- Feishu duplicate final suppression.
- QQ Bot accumulator timeout fallback.
- Tlon durable final send는 model-signature rendering 및 participated thread tracking을 보존합니다.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal 단순 durable final send.

Validation:

- 개발 중 targeted Vitest 파일.
- 전체 변경 표면에 대해 Testbox에서 `pnpm check:changed`.
- 전체 refactor를 landing하기 전 또는 공개 SDK/export 변경 후 Testbox에서 더 넓은 `pnpm check`.
- 호환성 래퍼를 제거하기 전에 edit-capable 채널 하나와 simple send-only 채널 하나 이상에 대한 live 또는 qa-channel smoke.

## 열린 질문

- Telegram이 결국 OpenClaw의 persisted restart watermark뿐 아니라 platform-level redelivery를 제어할 수 있는 fully durable polling source로 grammY runner source를 대체해야 하는지 여부.
- durable live preview state를 final send intent와 동일한 queue record에 저장해야 하는지, sibling live-state store에 저장해야 하는지 여부.
- `plugin-sdk/channel-message`가 출시된 후 compatibility wrapper가 얼마나 오래 문서화된 상태로 남을지.
- third-party Plugin이 receive adapter를 직접 구현해야 하는지, 아니면 `defineChannelMessageAdapter`를 통해 normalize/send/live hook만 제공해야 하는지 여부.
- 어떤 receipt field를 public SDK에 노출해도 안전하고 어떤 field가 internal runtime state인지.
- self-echo cache 및 participated-thread marker와 같은 side effect를 send-context hook, adapter-owned finalize step, receipt subscriber 중 무엇으로 모델링해야 하는지.
- 어떤 채널에 native origin metadata가 있고, 어떤 채널에 persisted outbound registry가 필요하며, 어떤 채널이 신뢰할 수 있는 cross-bot echo suppression을 제공할 수 없는지.

## 승인 기준

- 모든 번들 message channel은 `messages.send`를 통해 최종 visible output을 send합니다.
- 모든 inbound message channel은 `messages.receive` 또는 문서화된 compatibility wrapper를 통해 들어옵니다.
- 모든 preview/edit/stream channel은 draft state 및 finalization에 `messages.live`를 사용합니다.
- `channel.turn`은 래퍼일 뿐입니다.
- Reply 이름의 SDK 헬퍼는 compatibility export이지 권장 경로가 아닙니다.
- Durable recovery는 재시작 후 pending final send를 replay할 수 있으며, final response를 잃거나 이미 committed된 send를 중복하지 않습니다. platform outcome이 unknown인 send는 replay 전에 reconcile되거나 해당 adapter에 대해 at-least-once로 문서화됩니다.
- durable intent를 쓸 수 없으면 durable final send는 fail closed합니다. 단, 호출자가 문서화된 non-durable mode를 명시적으로 선택한 경우는 예외입니다.
- Legacy channel-turn 및 SDK compatibility helper는 기본적으로 direct channel-owned delivery를 사용합니다. generic durable send는 명시적 옵트인 전용입니다.
- Receipt는 multi-part delivery의 모든 platform message id와 threading/edit 편의를 위한 primary id를 보존합니다.
- Durable wrapper는 direct delivery callback을 대체하기 전에 channel-local side effect를 보존합니다.
- Prepared dispatcher는 final delivery path가 명시적으로 send context를 사용할 때까지 durable로 계산되지 않습니다.
- Fallback delivery는 모든 projected payload를 처리합니다.
- Durable fallback delivery는 모든 projected payload를 하나의 replayable intent 또는 batch plan에 기록합니다.
- OpenClaw-originated gateway failure output은 사람에게 보이지만, origin contract 지원을 선언한 채널에서는 tagged bot-authored room echo가 bot authorization 전에 drop됩니다.
- 문서는 send, receive, live, state, receipt, relation, failure policy, migration, test coverage를 설명합니다.

## 관련 항목

- [메시지](/ko/concepts/messages)
- [Streaming 및 chunking](/ko/concepts/streaming)
- [Progress draft](/ko/concepts/progress-drafts)
- [Retry policy](/ko/concepts/retry)
- [Channel turn kernel](/ko/plugins/sdk-channel-turn)
