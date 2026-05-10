---
read_when:
    - 채널 전송 또는 수신 동작 리팩터링
    - 채널 턴, 답장 디스패치, 아웃바운드 큐, 미리보기 스트리밍 또는 Plugin SDK 메시지 API 변경
    - 내구성 있는 전송, 수신 확인, 미리보기, 수정 또는 재시도가 필요한 새 채널 Plugin 설계
summary: 통합 영속 메시지 수신, 전송, 미리보기, 편집 및 스트리밍 수명 주기 설계 계획
title: 메시지 수명 주기 리팩터링
x-i18n:
    generated_at: "2026-05-10T19:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

이 페이지는 흩어져 있는 채널 턴, 응답 디스패치,
미리보기 스트리밍, 아웃바운드 전달 헬퍼를 하나의 내구성 있는
메시지 수명 주기로 대체하기 위한 목표 설계입니다.

짧게 요약하면 다음과 같습니다.

- 핵심 프리미티브는 **reply**가 아니라 **receive**와 **send**여야 합니다.
- 응답은 아웃바운드 메시지의 관계일 뿐입니다.
- 턴은 인바운드 처리를 위한 편의 기능이지 전달의 소유자가 아닙니다.
- 전송은 컨텍스트 기반이어야 합니다: `begin`, 렌더링, 미리보기 또는 스트림, 최종 전송,
  커밋, 실패.
- 수신도 컨텍스트 기반이어야 합니다: 정규화, 중복 제거, 라우팅, 기록,
  디스패치, 플랫폼 ack, 실패.
- 공개 Plugin SDK는 하나의 작은 채널 메시지 표면으로 축소되어야 합니다.

## 문제

현재 채널 스택은 여러 타당한 로컬 요구에서 성장했습니다.

- 단순 인바운드 어댑터는 `runtime.channel.turn.run`을 사용합니다.
- 풍부한 기능의 어댑터는 `runtime.channel.turn.runPrepared`를 사용합니다.
- 레거시 헬퍼는 `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, 응답 페이로드 헬퍼, 응답 청킹,
  응답 참조, 아웃바운드 런타임 헬퍼를 사용합니다.
- 미리보기 스트리밍은 채널별 디스패처에 있습니다.
- 최종 전달 내구성은 기존 응답 페이로드 경로 위에 추가되고 있습니다.

이 구조는 로컬 버그를 해결하지만, OpenClaw에 너무 많은 공개
개념과 전달 의미가 어긋날 수 있는 지점을 너무 많이 남깁니다.

이 문제를 드러낸 안정성 이슈는 다음과 같습니다.

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

목표 불변 조건은 Telegram보다 더 넓습니다. 코어가 표시 가능한
아웃바운드 메시지가 존재해야 한다고 결정하면, 플랫폼 전송을 시도하기
전에 그 의도가 내구성 있게 저장되어야 하며, 성공 후에는 플랫폼 수신증이
커밋되어야 합니다. 이를 통해 OpenClaw는 at-least-once 복구를 갖습니다.
exactly-once 동작은 네이티브 멱등성을 증명할 수 있거나
전송 후 알 수 없는 시도를 재생하기 전에 플랫폼 상태와 조정할 수 있는
어댑터에만 존재합니다.

이것이 이 리팩터링의 최종 상태이지 모든 현재 경로에 대한 설명은
아닙니다. 마이그레이션 중에는 best-effort 큐 쓰기가 실패할 때 기존
아웃바운드 헬퍼가 여전히 직접 전송으로 폴스루할 수 있습니다. 내구성 있는
최종 전송이 fail closed되거나 문서화된 비내구성 정책으로 명시적으로
옵트아웃할 때만 리팩터링이 완료됩니다.

## 목표

- 모든 채널 메시지 수신 및 전송 경로에 대해 하나의 코어 수명 주기.
- 어댑터가 재생 안전 동작을 선언한 뒤 새 메시지 수명 주기에서 기본적으로 내구성 있는 최종 전송.
- 공유 미리보기, 편집, 스트림, 최종화, 재시도, 복구, 수신증 의미.
- 서드파티 Plugin이 배우고 유지할 수 있는 작은 Plugin SDK 표면.
- 마이그레이션 중 기존 `channel.turn` 호출자와의 호환성.
- 새 채널 기능을 위한 명확한 확장 지점.
- 코어에 플랫폼별 분기 없음.
- 토큰 델타 채널 메시지 없음. 채널 스트리밍은 메시지 미리보기,
  편집, 추가, 또는 완료된 블록 전달로 유지됩니다.
- 표시되는 Gateway 실패가 공유 봇 사용 방에서 새 프롬프트로 다시 들어가지 않도록
  운영/시스템 출력을 위한 구조화된 OpenClaw 출처 메타데이터.

## 비목표

- 첫 단계에서 `runtime.channel.turn.*`를 제거하지 않습니다.
- 모든 채널에 동일한 네이티브 전송 동작을 강제하지 않습니다.
- 코어에 Telegram 토픽, Slack 네이티브 스트림, Matrix 삭제 표시,
  Feishu 카드, QQ 음성, Teams 활동을 가르치지 않습니다.
- 모든 내부 마이그레이션 헬퍼를 안정적인 SDK API로 공개하지 않습니다.
- 재시도가 완료된 비멱등 플랫폼 작업을 재생하게 만들지 않습니다.

## 참조 모델

Vercel Chat에는 좋은 공개 멘탈 모델이 있습니다.

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping`, 기록 가져오기 같은 어댑터 메서드
- 중복 제거, 잠금, 큐, 영속성을 위한 상태 어댑터

OpenClaw는 표면을 복사하지 말고 어휘를 빌려야 합니다.

OpenClaw에 그 모델을 넘어 필요한 것:

- 직접 전송 호출 전에 내구성 있는 아웃바운드 전송 의도.
- begin, commit, fail이 있는 명시적 전송 컨텍스트.
- 플랫폼 ack 정책을 아는 수신 컨텍스트.
- 재시작 후에도 살아남아 편집, 삭제, 복구, 중복 억제를 구동할 수 있는 수신증.
- 더 작은 공개 SDK. 번들 Plugin은 내부 런타임 헬퍼를 사용할 수 있지만,
  서드파티 Plugin에는 하나의 일관된 메시지 API가 보여야 합니다.
- 에이전트별 동작: 세션, 트랜스크립트, 블록 스트리밍, 도구
  진행, 승인, 미디어 지시문, 무음 응답, 그룹 멘션 기록.

`thread.post()` 스타일의 프로미스만으로는 OpenClaw에 충분하지 않습니다. 그것들은
전송을 복구 가능하게 할지 결정하는 트랜잭션 경계를 숨깁니다.

## 코어 모델

새 도메인은 `src/channels/message/*` 같은 내부 코어 네임스페이스 아래에
위치해야 합니다.

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

`state`는 내구성 있는 의도 저장소, 수신증, 멱등성, 복구, 잠금,
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

이를 통해 동일한 전송 경로가 일반 응답, Cron 알림, 승인
프롬프트, 작업 완료, 메시지 도구 전송, CLI 또는 Control UI 전송, 서브에이전트
결과, 자동화 전송을 처리할 수 있습니다.

### 출처

출처는 누가 메시지를 생성했는지, 그리고 OpenClaw가 그 메시지의 에코를
어떻게 처리해야 하는지를 설명합니다. 이는 관계와 별개입니다. 메시지는 사용자에
대한 응답이면서도 OpenClaw 출처의 운영 출력일 수 있습니다.

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

코어는 OpenClaw 출처 출력의 의미를 소유합니다. 채널은 그 출처가
전송 계층에 인코딩되는 방식을 소유합니다.

첫 번째 필수 사용 사례는 Gateway 실패 출력입니다. 사용자는 여전히
"Agent failed before reply" 또는 "Missing API key" 같은 메시지를 봐야 하지만,
태그가 지정된 OpenClaw 운영 출력은 `allowBots`가 활성화된 공유 방에서
봇이 작성한 입력으로 수락되어서는 안 됩니다.

### 수신증

수신증은 일급 개념입니다.

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

수신증은 내구성 있는 의도에서 향후 편집, 삭제, 미리보기
최종화, 중복 억제, 복구로 이어지는 다리입니다.

수신증은 하나의 플랫폼 메시지 또는 여러 부분으로 된 전달을 설명할 수 있습니다. 청크된
텍스트, 미디어와 텍스트, 음성과 텍스트, 카드 폴백은 모두
스레딩과 이후 편집을 위한 기본 ID를 노출하면서도 모든 플랫폼 ID를
보존해야 합니다.

## 수신 컨텍스트

수신은 단순한 헬퍼 호출이어서는 안 됩니다. 코어에는 중복 제거,
라우팅, 세션 기록, 플랫폼 ack 정책을 아는 컨텍스트가 필요합니다.

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

Ack는 하나의 개념이 아닙니다. 수신 계약은 다음 신호들을 분리해 유지해야 합니다.

- **전송 ack:** 플랫폼 Webhook 또는 소켓에 OpenClaw가
  이벤트 봉투를 수락했음을 알립니다. 일부 플랫폼은 디스패치 전에 이를 요구합니다.
- **폴링 오프셋 ack:** 동일한 이벤트를 다시 가져오지 않도록 커서를 전진시킵니다.
  복구할 수 없는 작업을 지나 전진해서는 안 됩니다.
- **인바운드 기록 ack:** OpenClaw가 재전달을 중복 제거하고 라우팅하기에 충분한
  인바운드 메타데이터를 영속화했음을 확인합니다.
- **사용자 표시 수신증:** 선택적 읽음/상태/입력 중 동작이며, 절대
  내구성 경계가 아닙니다.

`ReceiveAckPolicy`는 전송 또는 폴링 확인만 제어합니다. 읽음 수신증이나
상태 반응에 재사용되어서는 안 됩니다.

봇 권한 부여 전에, 채널이 메시지 출처 메타데이터를 디코딩할 수 있을 때 수신은
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

이 드롭은 태그 기반이지 텍스트 기반이 아닙니다. 동일하게 보이는 Gateway 실패
텍스트가 있지만 OpenClaw 출처 메타데이터가 없는 봇 작성 방 메시지는 여전히
일반 `allowBots` 권한 부여를 거칩니다.

Ack 정책은 명시적입니다.

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 폴링은 이제 영속화된 재시작 워터마크에 수신 컨텍스트 ack 정책을
사용합니다. 트래커는 grammY 업데이트가 미들웨어 체인에 들어올 때 계속 관찰하지만,
OpenClaw는 성공적인 디스패치 후 안전하게 완료된 업데이트 ID만 영속화하여,
실패했거나 더 낮은 보류 업데이트가 재시작 후 재생 가능하게 남겨 둡니다. Telegram의
업스트림 `getUpdates` 가져오기 오프셋은 여전히 폴링 라이브러리가 제어하므로,
OpenClaw의 재시작 워터마크를 넘어 플랫폼 수준 재전달이 필요하다면 남은 더 깊은
작업은 완전히 내구성 있는 폴링 소스입니다. Webhook 플랫폼은 즉시 HTTP ack가
필요할 수 있지만, Webhook은 재전달될 수 있으므로 여전히 인바운드 중복 제거와
내구성 있는 아웃바운드 전송 의도가 필요합니다.

## 전송 컨텍스트

전송도 컨텍스트 기반입니다:

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

권장 오케스트레이션:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

이 helper는 다음으로 확장됩니다.

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

이 의도는 전송 I/O 전에 존재해야 합니다. 시작 후 커밋 전에 재시작이 발생해도
복구할 수 있습니다.

위험한 경계는 플랫폼 성공 이후부터 전송 확인 정보 커밋 이전까지입니다. 그 지점에서
프로세스가 종료되면, 어댑터가 네이티브 멱등성이나 전송 확인 정보 조정 경로를
제공하지 않는 한 OpenClaw는 플랫폼 메시지가 존재하는지 알 수 없습니다. 그런 시도는
무작정 재생하지 말고 `unknown_after_send`에서 재개해야 합니다. 조정 기능이 없는 채널은
중복으로 보이는 메시지가 해당 채널과 관계에서 허용 가능한 문서화된 절충안인 경우에만
최소 1회 재생을 선택할 수 있습니다. 현재 SDK 조정 bridge는 어댑터가
`reconcileUnknownSend`를 선언하도록 요구한 다음, `durableFinal.reconcileUnknownSend`에
알 수 없는 항목을 `sent`, `not_sent`, `unresolved`로 분류하도록 요청합니다. 오직
`not_sent`만 재생을 허용하며, 해결되지 않은 항목은 terminal 상태로 남거나 조정 검사만
재시도합니다.

지속성 정책은 명시적이어야 합니다.

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required`는 core가 지속성 있는 의도를 쓸 수 없을 때 닫힌 상태로 실패해야 함을
의미합니다. `best_effort`는 영속성을 사용할 수 없을 때도 계속 진행할 수 있습니다.
`disabled`는 기존 직접 전송 동작을 유지합니다. 마이그레이션 중에는 legacy wrapper와
공개 호환성 helper가 기본적으로 `disabled`를 사용합니다. 채널에 일반 outbound 어댑터가
있다는 사실만으로 `required`를 추론해서는 안 됩니다.

전송 context는 채널 로컬 전송 후 효과도 소유합니다. 지속성 있는 delivery가 이전에
채널의 직접 전송 경로에 붙어 있던 로컬 동작을 우회한다면 마이그레이션은 안전하지
않습니다. 예로는 자기 에코 억제 캐시, 스레드 참여 marker, 네이티브 편집 anchor,
모델 서명 렌더링, 플랫폼별 중복 guard가 있습니다. 해당 채널이 지속성 있는 일반 최종
delivery를 활성화하기 전에 이런 효과는 전송 어댑터, 렌더링 어댑터, 또는 이름 있는
전송 context hook으로 이동해야 합니다.

전송 helper는 caller까지 전송 확인 정보를 그대로 반환해야 합니다. 지속성 wrapper는
메시지 id를 삼키거나 채널 delivery 결과를 `undefined`로 대체할 수 없습니다. 버퍼링된
dispatcher는 해당 id를 스레드 anchor, 이후 편집, preview 최종화, 중복 억제에 사용합니다.

Fallback 전송은 단일 payload가 아니라 batch에서 동작합니다. 무음 reply 재작성, 미디어
fallback, 카드 fallback, chunk projection은 모두 하나보다 많은 deliverable message를
생성할 수 있으므로, 전송 context는 projected batch 전체를 전달하거나 왜 하나의 payload만
유효한지 명시적으로 문서화해야 합니다.

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

그런 fallback이 지속성 있는 경우, 전체 projected batch는 하나의 지속성 있는 전송 의도나
다른 원자적 batch 계획으로 표현되어야 합니다. 각 payload를 하나씩 기록하는 것만으로는
충분하지 않습니다. payload 사이에서 crash가 발생하면 남은 payload에 대한 지속성 기록 없이
부분적으로 보이는 fallback이 남을 수 있습니다. 복구는 어떤 unit에 이미 전송 확인 정보가
있는지 알아야 하며, 누락된 unit만 재생하거나 어댑터가 이를 조정할 때까지 batch를
`unknown_after_send`로 표시해야 합니다.

## Live context

Preview, 편집, 진행률, stream 동작은 하나의 opt-in lifecycle이어야 합니다.

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

Live 상태는 복구하거나 중복을 억제할 수 있을 만큼 지속성을 가집니다.

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

- Telegram 전송 및 편집 preview, 오래된 preview age 이후 새 최종본.
- Discord 전송 및 편집 preview, 미디어/오류/명시적 reply 시 취소.
- 스레드 형태에 따른 Slack 네이티브 stream 또는 draft preview.
- Mattermost draft post 최종화.
- Matrix draft event 최종화 또는 불일치 시 redaction.
- Teams 네이티브 진행률 stream.
- QQ Bot stream 또는 누적 fallback.

## Adapter surface

공개 SDK 대상은 하나의 subpath여야 합니다.

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

preflight 인가 전에, core는 `origin.decode`가 OpenClaw-origin metadata를 반환할 때마다
공유 OpenClaw echo predicate를 실행해야 합니다. 수신 어댑터는 bot 작성자와 room 형태 같은
플랫폼 fact를 제공합니다. core는 drop 결정과 ordering을 소유하므로 채널은 text filter를
다시 구현하지 않습니다.

Origin 어댑터:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core가 `MessageOrigin`을 설정합니다. 채널은 이를 네이티브 transport metadata로, 그리고
그 반대로 변환하기만 합니다. Slack은 이를 `chat.postMessage({ metadata })`와 inbound
`message.metadata`에 매핑하고, Matrix는 이를 추가 event content에 매핑할 수 있습니다.
네이티브 metadata가 없는 채널은 그것이 사용 가능한 최선의 근사치일 때 전송 확인 정보 또는
outbound registry를 사용할 수 있습니다.

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

## Public SDK reduction

새 공개 surface는 다음 개념 영역을 흡수하거나 deprecate해야 합니다.

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime`의 대부분 공개 사용
- ad hoc draft stream lifecycle helper

호환성 subpath는 wrapper로 남을 수 있지만, 새 third-party Plugin은 이를 필요로 하지
않아야 합니다.

Bundled Plugin은 마이그레이션 중에 예약된 runtime subpath를 통해 내부 helper import를
유지할 수 있습니다. 공개 문서는 `plugin-sdk/channel-message`가 존재하게 되면 Plugin
작성자를 그쪽으로 안내해야 합니다.

## Relationship to channel turn

`runtime.channel.turn.*`은 마이그레이션 중 유지되어야 합니다.

이는 호환성 어댑터가 되어야 합니다.

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared`도 처음에는 남아 있어야 합니다.

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

모든 bundled Plugin과 알려진 third-party 호환성 경로가 bridge된 뒤에는 `channel.turn`을
deprecate할 수 있습니다. 공개된 SDK 마이그레이션 경로와 contract test가 기존 Plugin이
계속 동작하거나 명확한 버전 오류로 실패함을 증명하기 전까지는 제거해서는 안 됩니다.

## Compatibility guardrails

마이그레이션 중에는 기존 delivery callback에 "이 payload를 전송"하는 것 이상의 side
effect가 있는 모든 채널에서 일반 지속성 delivery가 opt-in입니다.

Legacy entry point는 기본적으로 지속성이 없습니다.

- `channel.turn.run`과 `dispatchAssembledChannelTurn`은 해당 채널이 감사된 지속성
  policy/options object를 명시적으로 제공하지 않는 한 채널의 delivery callback을 사용합니다.
- `channel.turn.runPrepared`는 prepared dispatcher가 명시적으로 전송 context를 호출할
  때까지 채널 소유로 남습니다.
- `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase`, direct-DM
  helper 같은 공개 호환성 helper는 caller가 제공한 `deliver` 또는 `reply` callback보다
  먼저 일반 지속성 delivery를 주입하지 않습니다.

마이그레이션 bridge type에서 `durable: undefined`는 "지속성이 없음"을 의미합니다.
지속성 경로는 명시적인 policy/options 값으로만 활성화됩니다. `durable: false`는 호환성
표기로 남을 수 있지만, 구현은 마이그레이션되지 않은 모든 채널이 이를 추가하도록 요구해서는
안 됩니다.

현재 bridge code는 지속성 결정을 명시적으로 유지해야 합니다:

- 지속성 최종 전달은 판별 가능한 상태를 반환합니다. `handled_visible` 및
  `handled_no_send`는 종료 상태이며, `unsupported` 및 `not_applicable`은
  채널 소유 전달로 폴백할 수 있고, `failed`는 전송 실패를 전파합니다.
- 범용 지속성 최종 전달은 무음 전달, 답장 대상 보존, 네이티브 인용 보존,
  메시지 전송 훅과 같은 어댑터 기능에 의해 제한됩니다. 동등성이 누락된
  경우, 사용자에게 보이는 동작을 바꾸는 범용 전송이 아니라 채널 소유 전달을
  선택해야 합니다.
- 큐 기반 지속성 전송은 전달 의도 참조를 노출합니다. 기존
  `pendingFinalDelivery*` 세션 필드는 전환 중에 의도 ID를 전달할 수 있으며,
  최종 상태는 고정된 답장 텍스트와 임시 컨텍스트 필드가 아니라
  `MessageSendIntent` 저장소입니다.

다음 조건이 모두 참이 될 때까지 채널에 범용 지속성 경로를 활성화하지
마세요.

- 범용 전송 어댑터가 기존 직접 경로와 동일한 렌더링 및 전송 동작을 실행합니다.
- 로컬 전송 후 부수 효과가 전송 컨텍스트를 통해 보존됩니다.
- 어댑터가 모든 플랫폼 메시지 ID가 포함된 수신 확인 또는 전달 결과를 반환합니다.
- 준비된 디스패처 경로가 새 전송 컨텍스트를 호출하거나, 지속성 보장 범위
  밖에 있음을 문서화한 상태로 유지됩니다.
- 폴백 전달이 첫 번째 페이로드뿐만 아니라 모든 예상 페이로드를 처리합니다.
- 지속성 폴백 전달이 전체 예상 페이로드 배열을 하나의 재생 가능한 의도 또는
  배치 계획으로 기록합니다.

보존해야 할 구체적인 마이그레이션 위험:

- iMessage 모니터 전달은 성공적인 전송 후 에코 캐시에 전송된 메시지를
  기록합니다. 지속성 최종 전송도 해당 캐시를 채워야 합니다. 그렇지 않으면
  OpenClaw가 자체 최종 답장을 인바운드 사용자 메시지로 다시 수집할 수
  있습니다.
- Tlon은 선택적 모델 서명을 추가하고 그룹 답장 후 참여한 스레드를
  기록합니다. 범용 지속성 전달은 이러한 효과를 우회해서는 안 됩니다. 이를
  Tlon 렌더링/전송/최종화 어댑터로 옮기거나 Tlon을 채널 소유 경로에
  유지하세요.
- Discord 및 기타 준비된 디스패처는 이미 직접 전달과 미리보기 동작을
  소유합니다. 준비된 디스패처가 최종 응답을 전송 컨텍스트를 통해 명시적으로
  라우팅할 때까지, 이들은 조립된 턴 지속성 보장의 적용을 받지 않습니다.
- Telegram 무음 폴백 전달은 전체 예상 페이로드 배열을 전달해야 합니다.
  단일 페이로드 단축 경로는 예상 처리 후 추가 폴백 페이로드를 누락할 수
  있습니다.
- LINE, Zalo, Nostr 및 기타 기존 조립/헬퍼 경로에는 답장 토큰 처리,
  미디어 프록시, 전송 메시지 캐시, 로딩/상태 정리 또는 콜백 전용 대상이
  있을 수 있습니다. 이러한 의미가 전송 어댑터로 표현되고 테스트로 검증될
  때까지 이들은 채널 소유 전달에 유지됩니다.
- 직접 DM 헬퍼에는 유일하게 올바른 전송 대상인 답장 콜백이 있을 수 있습니다.
  범용 아웃바운드는 `OriginatingTo` 또는 `To`에서 추측하여 해당 콜백을
  건너뛰어서는 안 됩니다.
- OpenClaw Gateway 실패 출력은 사람이 볼 수 있어야 하지만, 태그가 지정된
  봇 작성 방 에코는 `allowBots` 권한 부여 전에 삭제되어야 합니다. 채널은
  짧은 긴급 임시 조치를 제외하고 이를 보이는 텍스트 접두사 필터로 구현해서는
  안 됩니다. 지속성 계약은 구조화된 원본 메타데이터입니다.

## 내부 저장소

지속성 큐는 답장 페이로드가 아니라 메시지 전송 의도를 저장해야 합니다.

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

큐는 재시작 후에도 동일한 계정, 스레드, 대상, 서식 정책, 미디어 규칙을 통해
재생할 수 있을 만큼 충분한 ID 정보를 유지해야 합니다.

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

- `transient` 및 `rate_limit`은 재시도합니다.
- 렌더링 폴백이 없는 한 `invalid_payload`는 재시도하지 않습니다.
- 구성이 변경될 때까지 `auth` 또는 `permission`은 재시도하지 않습니다.
- `not_found`의 경우, 채널이 안전하다고 선언하면 실시간 최종화가 편집에서
  새 전송으로 폴백하도록 합니다.
- `conflict`의 경우, 수신 확인/멱등성 규칙을 사용하여 메시지가 이미 존재하는지
  판단합니다.
- 어댑터가 플랫폼 I/O를 완료했을 수 있으나 수신 확인 커밋 전에 발생한 오류는
  어댑터가 플랫폼 작업이 발생하지 않았음을 증명할 수 없는 한
  `unknown_after_send`가 됩니다.

## 채널 매핑

| 채널            | 대상 마이그레이션                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | ack 정책과 지속성 있는 최종 전송을 받습니다. 라이브 어댑터는 전송과 편집 미리보기, 오래된 미리보기의 최종 전송, 주제, 인용-답장 미리보기 건너뛰기, 미디어 폴백, retry-after 처리를 소유합니다.                                                                                                                                                                      |
| Discord         | 전송 어댑터가 기존의 지속성 있는 페이로드 전달을 래핑합니다. 라이브 어댑터는 초안 편집, 진행 상황 초안, 미디어/오류 미리보기 취소, 답장 대상 보존, 메시지 id 수신 확인을 소유합니다. 공유 방에서 봇이 작성한 gateway-failure echo를 감사합니다. Discord가 일반 메시지에 원본 메타데이터를 담을 수 없다면 아웃바운드 레지스트리나 다른 네이티브 등가물을 사용합니다. |
| Slack           | 전송 어댑터가 일반 채팅 게시를 처리합니다. 라이브 어댑터는 스레드 형태가 지원할 때 네이티브 스트림을 선택하고, 그렇지 않으면 초안 미리보기를 선택합니다. 수신 확인은 스레드 타임스탬프를 보존합니다. 원본 어댑터는 OpenClaw Gateway 실패를 Slack `chat.postMessage.metadata`에 매핑하고, `allowBots` 승인 전에 태그된 봇 방 echo를 버립니다.                  |
| WhatsApp        | 전송 어댑터는 지속성 있는 최종 인텐트와 함께 텍스트/미디어 전송을 소유합니다. 수신 어댑터는 그룹 멘션과 발신자 ID를 처리합니다. WhatsApp에 편집 가능한 전송 방식이 생길 때까지 라이브는 없어도 됩니다.                                                                                                                                                            |
| Matrix          | 라이브 어댑터는 초안 이벤트 편집, 최종화, 삭제, 암호화된 미디어 제약, 답장 대상 불일치 폴백을 소유합니다. 수신 어댑터는 암호화된 이벤트 하이드레이션과 중복 제거를 소유합니다. 원본 어댑터는 OpenClaw Gateway 실패 원본을 Matrix 이벤트 콘텐츠에 인코딩하고, `allowBots` 처리 전에 구성된 봇 방 echo를 버려야 합니다.                                           |
| Mattermost      | 라이브 어댑터는 하나의 초안 게시물, 진행 상황/도구 접기, 제자리 최종화, 새 전송 폴백을 소유합니다.                                                                                                                                                                                                                                                                     |
| Microsoft Teams | 라이브 어댑터는 네이티브 진행 상황과 블록 스트림 동작을 소유합니다. 전송 어댑터는 활동과 첨부 파일/카드 수신 확인을 소유합니다.                                                                                                                                                                                                                                      |
| Feishu          | 렌더 어댑터는 텍스트/카드/원시 렌더링을 소유합니다. 라이브 어댑터는 스트리밍 카드와 중복 최종 억제를 소유합니다. 전송 어댑터는 댓글, 주제 세션, 미디어, 음성 억제를 소유합니다.                                                                                                                                                                                    |
| QQ Bot          | 라이브 어댑터는 C2C 스트리밍, 누산기 타임아웃, 폴백 최종 전송을 소유합니다. 렌더 어댑터는 미디어 태그와 텍스트-음성 변환을 소유합니다.                                                                                                                                                                                                                              |
| Signal          | 단순 수신 및 전송 어댑터입니다. signal-cli가 신뢰할 수 있는 편집 지원을 추가하지 않는 한 라이브 어댑터는 없습니다.                                                                                                                                                                                                                                                  |
| iMessage        | 단순 수신 및 전송 어댑터입니다. 지속성 있는 최종 전송이 모니터 전달을 우회할 수 있으려면 iMessage 전송은 먼저 모니터 echo-cache 채우기를 보존해야 합니다.                                                                                                                                                                                                            |
| Google Chat     | 스레드 관계를 스페이스와 스레드 id에 매핑하는 단순 수신 및 전송 어댑터입니다. 태그된 OpenClaw Gateway 실패 echo에 대해 `allowBots=true` 방 동작을 감사합니다.                                                                                                                                                                                                         |
| LINE            | reply-token 제약을 대상/관계 기능으로 모델링하는 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                      |
| Nextcloud Talk  | SDK 수신 브리지와 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                 |
| IRC             | 단순 수신 및 전송 어댑터이며, 지속성 있는 편집 수신 확인은 없습니다.                                                                                                                                                                                                                                                                                                  |
| Nostr           | 암호화된 DM용 수신 및 전송 어댑터입니다. 수신 확인은 이벤트 id입니다.                                                                                                                                                                                                                                                                                                 |
| QA Channel      | 수신, 전송, 라이브, 재시도, 복구 동작을 위한 계약 테스트 어댑터입니다.                                                                                                                                                                                                                                                                                                 |
| Synology Chat   | 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                      |
| Tlon            | 범용 지속성 있는 최종 전달을 활성화하기 전에 전송 어댑터는 모델 서명 렌더링과 참여한 스레드 추적을 보존해야 합니다.                                                                                                                                                                                                                                                 |
| Twitch          | rate-limit 분류가 있는 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                               |
| Zalo            | 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                      |
| Zalo Personal   | 단순 수신 및 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                                      |

## 마이그레이션 계획

### 1단계: 내부 메시지 도메인

- 메시지, 대상, 관계, 원본, 수신 확인, 기능, 지속성 있는 인텐트, 수신
  컨텍스트, 전송 컨텍스트, 라이브 컨텍스트, 실패 클래스에 대한
  `src/channels/message/*` 타입을 추가합니다.
- 현재 답장 전달에서 사용하는 마이그레이션 브리지 페이로드 타입에
  `origin?: MessageOrigin`을 추가한 다음, 리팩터링이 답장 페이로드를
  대체하면서 해당 필드를 `ChannelMessage`와 렌더링된 메시지 타입으로
  옮깁니다.
- 어댑터와 테스트가 형태를 입증할 때까지 이를 내부로 유지합니다.
- 상태 전이와 직렬화에 대한 순수 단위 테스트를 추가합니다.

### 2단계: 지속성 있는 전송 코어

- 기존 아웃바운드 큐를 답장-페이로드 지속성에서 지속성 있는
  메시지 전송 인텐트로 이동합니다.
- 지속성 있는 전송 인텐트가 하나의 답장 페이로드뿐 아니라 투영된
  페이로드 배열이나 배치 계획을 담을 수 있게 합니다.
- 호환성 변환을 통해 현재 큐 복구 동작을 보존합니다.
- `deliverOutboundPayloads`가 `messages.send`를 호출하게 합니다.
- 어댑터가 replay 안전성을 선언한 뒤, 새 메시지 수명 주기에서 지속성
  있는 인텐트를 쓸 수 없을 때 최종 전송 지속성을 기본값으로 삼고
  fail closed합니다. 이 단계 동안 기존 채널 턴과 SDK 호환성 경로는
  기본적으로 직접 전송으로 유지됩니다.
- 수신 확인을 일관되게 기록합니다.
- 지속성 있는 전송을 종단 부수 효과로 취급하는 대신, 수신 확인과
  전달 결과를 원래 디스패처 호출자에게 반환합니다.
- 복구, replay, 청크 전송이 OpenClaw 운영 출처를 보존하도록 지속성
  있는 전송 인텐트를 통해 메시지 원본을 유지합니다.

### 3단계: 채널 턴 브리지

- `channel.turn.run`과 `dispatchAssembledChannelTurn`을 `messages.receive`와
  `messages.send` 위에서 다시 구현합니다.
- 현재 fact 타입을 안정적으로 유지합니다.
- 기본적으로 레거시 동작을 유지합니다. 조립된 턴 채널은 어댑터가
  replay-safe 지속성 정책으로 명시적으로 옵트인할 때만 지속성을
  갖습니다.
- 네이티브 편집을 최종화하고 아직 안전하게 replay할 수 없는 경로를
  위한 호환성 탈출구로 `durable: false`를 유지하되, 마이그레이션되지
  않은 채널을 보호하기 위해 `false` 마커에 의존하지는 않습니다.
- 채널 매핑이 범용 전송 경로가 기존 채널 전달 의미론을 보존한다는
  점을 입증한 뒤, 새 메시지 수명 주기에서만 조립된 턴 지속성을
  기본값으로 설정합니다.

### 4단계: 준비된 디스패처 브리지

- `deliverDurableInboundReplyPayload`를 전송 컨텍스트 브리지로 대체합니다.
- 기존 helper는 wrapper로 유지합니다.
- Telegram, WhatsApp, Slack, Signal, iMessage, Discord를 먼저 포팅합니다. 이들은
  이미 내구성 있는 최종 처리 작업이 있거나 전송 경로가 더 단순하기 때문입니다.
- 모든 준비된 dispatcher는 전송 컨텍스트를 명시적으로 옵트인하기 전까지
  커버되지 않은 것으로 취급합니다. 문서와 changelog 항목은 모든
  자동 최종 답장을 주장하기보다 "조립된 채널 턴"이라고 말하거나 마이그레이션된
  채널 경로의 이름을 명시해야 합니다.
- `recordInboundSessionAndDispatchReply`, direct-DM helper 및 유사한
  공개 호환성 helper는 동작을 보존해야 합니다. 나중에 명시적인
  전송 컨텍스트 옵트인을 노출할 수 있지만, 호출자가 소유한 전달 callback보다 먼저
  generic 내구성 전달을 자동으로 시도해서는 안 됩니다.

### 5단계: 통합 Live 수명 주기

- 두 개의 증명 adapter로 `messages.live`를 빌드합니다.
  - Telegram: 전송, 수정, 오래된 최종 전송.
  - Matrix: draft 최종화와 redaction fallback.
- 그런 다음 Discord, Slack, Mattermost, Teams, QQ Bot, Feishu를 마이그레이션합니다.
- 각 채널에 동등성 테스트가 생긴 뒤에만 중복된 preview 최종화 코드를 삭제합니다.

### 6단계: 공개 SDK

- `openclaw/plugin-sdk/channel-message`를 추가합니다.
- 이를 권장 채널 Plugin API로 문서화합니다.
- package exports, entrypoint inventory, 생성된 API baseline, Plugin SDK 문서를 업데이트합니다.
- `MessageOrigin`, origin encode/decode hook, 공유
  `shouldDropOpenClawEcho` predicate를 channel-message SDK 표면에 포함합니다.
- 이전 subpath에 대한 호환성 wrapper를 유지합니다.
- bundled Plugin이 마이그레이션된 뒤 docs에서 reply 이름이 붙은 SDK helper를 deprecated로 표시합니다.

### 7단계: 모든 Sender

reply가 아닌 모든 outbound producer를 `messages.send`로 옮깁니다.

- cron 및 heartbeat 알림
- task 완료
- hook 결과
- approval prompt 및 approval 결과
- message tool 전송
- subagent 완료 공지
- 명시적 CLI 또는 Control UI 전송
- automation/broadcast 경로

여기서 model은 "agent replies"를 멈추고 "OpenClaw sends
messages"가 됩니다.

### 8단계: Turn 사용 중단

- `channel.turn`을 최소 한 번의 호환성 기간 동안 wrapper로 유지합니다.
- 마이그레이션 노트를 게시합니다.
- 이전 import에 대해 Plugin SDK 호환성 테스트를 실행합니다.
- bundled Plugin이 더 이상 필요로 하지 않고 third-party contract에 안정적인 대체물이 생긴 뒤에만
  이전 internal helper를 제거하거나 숨깁니다.

## 테스트 계획

Unit 테스트:

- 내구성 있는 전송 intent 직렬화 및 복구.
- idempotency key 재사용 및 중복 억제.
- receipt commit 및 replay skip.
- adapter가 reconciliation을 지원할 때 replay 전에 reconcile하는 `unknown_after_send` 복구.
- 실패 분류 정책.
- receive ack policy sequencing.
- reply, followup, system, broadcast 전송에 대한 relation mapping.
- Gateway 실패 origin factory 및 `shouldDropOpenClawEcho` predicate.
- payload normalization, chunking, durable queue serialization, recovery를 통한 origin 보존.

Integration 테스트:

- `channel.turn.run` 단순 adapter가 여전히 기록하고 전송합니다.
- legacy 조립된-turn 전달은 채널이 명시적으로 옵트인하지 않는 한 durable이 되지 않습니다.
- `channel.turn.runPrepared` bridge가 여전히 기록하고 최종화합니다.
- 공개 호환성 helper는 기본적으로 호출자가 소유한 delivery callback을 호출하며
  해당 callback보다 먼저 generic-send하지 않습니다.
- Durable fallback delivery는 restart 후 전체 projected payload array를 replay하며,
  이른 crash 후에도 이후 payload가 기록되지 않은 상태로 남을 수 없습니다.
- Durable assembled-turn delivery는 platform message id를 buffered
  dispatcher에 반환합니다.
- custom delivery hook은 durable delivery가 비활성화되었거나 사용할 수 없을 때도
  platform message id를 반환합니다.
- 최종 reply는 assistant completion과 platform send 사이의 restart에서도 살아남습니다.
- 허용되는 경우 preview draft가 제자리에서 최종화됩니다.
- media/error/reply-target mismatch로 normal delivery가 필요할 때 preview draft는 취소되거나 redacted됩니다.
- block streaming과 preview streaming이 같은 텍스트를 둘 다 전달하지 않습니다.
- 일찍 stream된 media가 final delivery에서 중복되지 않습니다.

채널 테스트:

- Telegram topic reply에서 polling ack는 receive context의 safe
  completed watermark까지 지연됩니다.
- accepted-but-not-delivered update에 대한 Telegram polling recovery는
  persisted safe-completed offset model로 커버됩니다.
- Telegram stale preview는 fresh final을 전송하고 preview를 정리합니다.
- Telegram silent fallback은 모든 projected fallback payload를 전송합니다.
- Telegram silent fallback durability는 루프 iteration마다 single-payload durable intent 하나가 아니라
  전체 projected fallback array를 atomically 기록합니다.
- Discord preview cancel on media/error/explicit reply.
- Discord prepared dispatcher final은 docs나 changelog가 Discord final-reply durability를 주장하기 전에
  send context를 통해 route됩니다.
- iMessage durable final send는 monitor sent-message echo cache를 채웁니다.
- LINE, Zalo, Nostr legacy delivery path는 adapter parity test가 생길 때까지
  generic durable send로 우회되지 않습니다.
- Direct-DM/Nostr callback delivery는 complete message target과 replay-safe send adapter로
  명시적으로 마이그레이션되지 않는 한 authoritative로 유지됩니다.
- Slack tagged OpenClaw gateway failure message는 outbound에서 visible 상태로 유지되고, tagged
  bot-room echo는 `allowBots` 전에 drop되며, 같은 visible text를 가진 untagged bot message는
  여전히 normal bot authorization을 따릅니다.
- Slack native stream fallback to draft preview in top-level DMs.
- Matrix preview finalization 및 redaction fallback.
- Matrix tagged OpenClaw gateway-failure room echo는 configured bot
  account에서 온 경우 `allowBots` handling 전에 drop됩니다.
- Discord 및 Google Chat shared-room gateway-failure cascade audit는
  generic protection을 주장하기 전에 `allowBots` mode를 커버합니다.
- Mattermost draft finalization 및 fresh-send fallback.
- Teams native progress finalization.
- Feishu duplicate final suppression.
- QQ Bot accumulator timeout fallback.
- Tlon durable final send는 model-signature rendering 및 participated
  thread tracking을 보존합니다.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo, Zalo Personal simple durable final
  send.

검증:

- 개발 중 targeted Vitest file.
- 전체 changed surface에 대해 Testbox에서 `pnpm check:changed`.
- complete refactor를 land하기 전 또는 public SDK/export 변경 후
  Testbox에서 더 넓은 `pnpm check`.
- compatibility wrapper를 제거하기 전에 edit-capable 채널 하나와
  simple send-only 채널 하나 이상에 대한 live 또는 qa-channel smoke.

## 열린 질문

- Telegram이 결국 grammY runner source를 platform-level redelivery를 제어할 수 있는
  완전히 durable한 polling source로 대체해야 하는지 여부. OpenClaw의 persisted restart watermark만
  제어하는 것이 아닙니다.
- durable live preview state를 final send intent와 같은 queue record에 저장해야 하는지,
  아니면 sibling live-state store에 저장해야 하는지 여부.
- `plugin-sdk/channel-message`가 출시된 뒤 compatibility wrapper를 얼마나 오래 문서화할지.
- third-party Plugin이 receive adapter를 직접 구현해야 하는지, 아니면
  `defineChannelMessageAdapter`를 통해 normalize/send/live hook만 제공해야 하는지.
- 어떤 receipt field를 public SDK에 노출해도 안전하고, 어떤 것이 internal runtime
  state인지.
- self-echo cache 및 participated-thread marker 같은 side effect를
  send-context hook, adapter-owned finalize step 또는 receipt subscriber로 모델링해야 하는지 여부.
- 어떤 채널에 native origin metadata가 있고, 어떤 채널에 persisted outbound
  registry가 필요하며, 어떤 채널이 reliable cross-bot echo suppression을 제공할 수 없는지.

## 승인 기준

- 모든 bundled message channel은 최종 visible output을
  `messages.send`를 통해 전송합니다.
- 모든 inbound message channel은 `messages.receive` 또는
  문서화된 compatibility wrapper를 통해 진입합니다.
- 모든 preview/edit/stream 채널은 draft state 및
  finalization에 `messages.live`를 사용합니다.
- `channel.turn`은 wrapper일 뿐입니다.
- reply 이름이 붙은 SDK helper는 compatibility export이지 권장 경로가 아닙니다.
- Durable recovery는 restart 후 pending final send를 replay할 수 있으며,
  final response를 잃거나 이미 committed send를 중복하지 않습니다. platform outcome이
  unknown인 send는 replay 전에 reconciled되거나 해당 adapter에 대해
  at-least-once로 문서화됩니다.
- Durable final send는 durable intent를 쓸 수 없을 때 fail closed됩니다.
  단, 호출자가 문서화된 non-durable mode를 명시적으로 선택한 경우는 예외입니다.
- Legacy channel-turn 및 SDK compatibility helper는 기본적으로 직접
  channel-owned delivery를 사용합니다. generic durable send는 명시적 opt-in일 때만 가능합니다.
- receipt는 multi-part delivery의 모든 platform message id와 threading/edit convenience를 위한
  primary id를 보존합니다.
- Durable wrapper는 direct delivery callback을 대체하기 전에 channel-local side effect를 보존합니다.
- prepared dispatcher는 final delivery path가 send context를 명시적으로 사용할 때까지
  durable로 간주되지 않습니다.
- fallback delivery는 모든 projected payload를 처리합니다.
- Durable fallback delivery는 모든 projected payload를 replay 가능한
  하나의 intent 또는 batch plan에 기록합니다.
- OpenClaw-originated gateway failure output은 사람에게 visible하지만,
  origin contract 지원을 선언한 채널에서는 tagged bot-authored room echo가
  bot authorization 전에 drop됩니다.
- docs는 send, receive, live, state, receipts, relations, failure
  policy, migration, test coverage를 설명합니다.

## 관련 항목

- [Messages](/ko/concepts/messages)
- [Streaming and chunking](/ko/concepts/streaming)
- [Progress drafts](/ko/concepts/progress-drafts)
- [Retry policy](/ko/concepts/retry)
- [Channel turn kernel](/ko/plugins/sdk-channel-turn)
