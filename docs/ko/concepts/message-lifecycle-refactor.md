---
read_when:
    - 채널 전송 또는 수신 동작 리팩터링
    - 채널 인바운드, 응답 디스패치, 아웃바운드 큐, 미리보기 스트리밍 또는 Plugin SDK 메시지 API 변경
    - 내구성 있는 전송, 수신 확인, 미리 보기, 편집 또는 재시도가 필요한 새 채널 Plugin 설계하기
summary: 통합된 영속적 메시지 수신, 전송, 미리보기, 편집 및 스트리밍 수명 주기를 위한 설계 계획
title: 메시지 수명 주기 리팩터링
x-i18n:
    generated_at: "2026-06-27T17:23:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

이 페이지는 흩어져 있는 채널 인바운드, 응답 디스패치, 미리 보기 스트리밍, 아웃바운드 전달 헬퍼를 하나의 지속 가능한 메시지 수명 주기로 대체하기 위한 목표 설계입니다.

요약:

- 핵심 프리미티브는 **reply**가 아니라 **receive**와 **send**여야 합니다.
- 응답은 아웃바운드 메시지의 관계일 뿐입니다.
- 턴은 인바운드 처리 편의를 위한 것이며, 전달의 소유자가 아닙니다.
- 전송은 컨텍스트 기반이어야 합니다: `begin`, 렌더링, 미리 보기 또는 스트림, 최종 전송,
  커밋, 실패.
- 수신도 컨텍스트 기반이어야 합니다: 정규화, 중복 제거, 라우팅, 기록,
  디스패치, 플랫폼 확인 응답, 실패.
- 공개 Plugin SDK는 하나의 작은 채널 아웃바운드 표면으로 축소되어야 합니다.

## 문제

현재 채널 스택은 여러 타당한 로컬 요구에서 성장했습니다.

- 단순 인바운드 어댑터는 `runtime.channel.inbound.run`을 사용합니다.
- 풍부한 기능의 어댑터는 `runtime.channel.inbound.runPreparedReply`를 사용합니다.
- 레거시 헬퍼는 `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, 응답 페이로드 헬퍼, 응답 청킹,
  응답 참조, 아웃바운드 런타임 헬퍼를 사용합니다.
- 미리 보기 스트리밍은 채널별 디스패처 안에 있습니다.
- 최종 전달 내구성은 기존 응답 페이로드 경로 주변에 추가되고 있습니다.

이 형태는 로컬 버그를 해결하지만, OpenClaw에 너무 많은 공개 개념과
전달 의미가 달라질 수 있는 너무 많은 지점을 남깁니다.

이를 드러낸 안정성 문제는 다음과 같습니다.

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

목표 불변 조건은 Telegram보다 넓습니다. 코어가 보이는 아웃바운드 메시지가
존재해야 한다고 결정하면, 플랫폼 전송을 시도하기 전에 그 의도가 지속 가능해야 하며,
성공 후에는 플랫폼 수신 확인이 커밋되어야 합니다.
이를 통해 OpenClaw는 최소 1회 복구를 제공합니다. 정확히 1회 동작은
네이티브 멱등성을 증명할 수 있거나, 재생 전에 플랫폼 상태에 대해
전송 후 알 수 없는 시도를 조정할 수 있는 어댑터에만 존재합니다.

이것이 이 리팩터의 최종 상태이며, 모든 현재 경로에 대한 설명은 아닙니다.
마이그레이션 중에는 최선 노력 큐 쓰기가 실패할 때 기존 아웃바운드 헬퍼가
여전히 직접 전송으로 폴스루할 수 있습니다. 지속 가능한 최종 전송이
실패 시 닫히거나 문서화된 비지속 정책으로 명시적으로 옵트아웃할 때에만
리팩터가 완료됩니다.

## 목표

- 모든 채널 메시지 수신 및 전송 경로를 위한 하나의 코어 수명 주기.
- 어댑터가 재생 안전 동작을 선언한 후 새 메시지 수명 주기에서 기본적으로 지속 가능한 최종 전송.
- 공유 미리 보기, 편집, 스트림, 최종화, 재시도, 복구, 수신 확인 의미.
- 서드파티 Plugin이 배우고 유지 관리할 수 있는 작은 Plugin SDK 표면.
- 마이그레이션 중 기존 인바운드 응답 호환성 호출자에 대한 호환성.
- 새 채널 기능을 위한 명확한 확장 지점.
- 코어에 플랫폼별 분기 없음.
- 토큰 델타 채널 메시지 없음. 채널 스트리밍은 메시지 미리 보기,
  편집, 추가, 또는 완료된 블록 전달로 유지됩니다.
- 보이는 Gateway 실패가 공유된 봇 사용 방에 새 프롬프트로 다시 들어가지 않도록 하는
  운영/시스템 출력용 구조화된 OpenClaw 출처 메타데이터.

## 비목표

- 첫 단계에서 모든 기존 채널을 지속 가능한 메시지 전달로 강제하지 않습니다.
- 모든 채널을 동일한 네이티브 전송 동작으로 강제하지 않습니다.
- 코어에 Telegram 토픽, Slack 네이티브 스트림, Matrix 수정 삭제,
  Feishu 카드, QQ 음성, 또는 Teams 활동을 가르치지 않습니다.
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
- 중복 제거, 잠금, 큐, 지속성을 위한 상태 어댑터

OpenClaw는 표면을 복사하지 말고 용어를 차용해야 합니다.

그 모델을 넘어 OpenClaw에 필요한 것:

- 직접 전송 호출 전에 지속 가능한 아웃바운드 전송 의도.
- 시작, 커밋, 실패가 있는 명시적 전송 컨텍스트.
- 플랫폼 확인 응답 정책을 아는 수신 컨텍스트.
- 재시작 후에도 유지되고 편집, 삭제, 복구, 중복 억제를 구동할 수 있는 수신 확인.
- 더 작은 공개 SDK. 번들 Plugin은 내부 런타임 헬퍼를 사용할 수 있지만,
  서드파티 Plugin은 하나의 일관된 메시지 API를 보아야 합니다.
- 에이전트별 동작: 세션, 전사, 블록 스트리밍, 도구
  진행률, 승인, 미디어 지시문, 무음 응답, 그룹 멘션
  기록.

`thread.post()` 스타일의 프로미스만으로는 OpenClaw에 충분하지 않습니다. 이는
전송이 복구 가능한지를 결정하는 트랜잭션 경계를 숨깁니다.

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

`live`는 미리 보기, 편집, 진행률, 스트림 상태를 소유합니다.

`state`는 지속 가능한 의도 저장소, 수신 확인, 멱등성, 복구, 잠금,
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

응답은 API 루트가 아니라 관계입니다.

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

이를 통해 동일한 전송 경로가 일반 응답, cron 알림, 승인
프롬프트, 작업 완료, 메시지 도구 전송, CLI 또는 Control UI 전송, 서브에이전트
결과, 자동화 전송을 처리할 수 있습니다.

### 출처

출처는 누가 메시지를 생성했는지와 OpenClaw가 그 메시지의 에코를 어떻게 처리해야 하는지를 설명합니다.
이는 관계와 별개입니다. 메시지는 사용자에 대한 응답이면서도
OpenClaw 출처의 운영 출력일 수 있습니다.

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

코어는 OpenClaw 출처 출력의 의미를 소유합니다. 채널은 그
출처를 전송 방식에 인코딩하는 방법을 소유합니다.

첫 번째 필수 사용 사례는 Gateway 실패 출력입니다. 사람은 여전히
"Agent failed before reply" 또는 "Missing API key" 같은 메시지를 보아야 하지만,
태그가 지정된 OpenClaw 운영 출력은 `allowBots`가 활성화된 공유 방에서
봇이 작성한 입력으로 수락되어서는 안 됩니다.

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

수신 확인은 지속 가능한 의도에서 향후 편집, 삭제, 미리 보기
최종화, 중복 억제, 복구로 이어지는 다리입니다.

수신 확인은 하나의 플랫폼 메시지 또는 여러 부분 전달을 설명할 수 있습니다. 청크된
텍스트, 미디어와 텍스트, 음성과 텍스트, 카드 폴백은 스레딩과 이후 편집을 위한
기본 ID를 계속 노출하면서 모든 플랫폼 ID를 보존해야 합니다.

## 수신 컨텍스트

수신은 단순한 헬퍼 호출이어서는 안 됩니다. 코어에는
중복 제거, 라우팅, 세션 기록, 플랫폼 확인 응답 정책을 아는 컨텍스트가 필요합니다.

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

확인 응답은 하나가 아닙니다. 수신 계약은 이러한 신호를 분리해서 유지해야 합니다.

- **전송 확인 응답:** OpenClaw가 이벤트 엔벌로프를 수락했음을 플랫폼 Webhook 또는 소켓에 알립니다.
  일부 플랫폼은 디스패치 전에 이를 요구합니다.
- **폴링 오프셋 확인 응답:** 동일한 이벤트가 다시 가져와지지 않도록 커서를 전진시킵니다.
  이는 복구할 수 없는 작업을 지나 전진해서는 안 됩니다.
- **인바운드 기록 확인 응답:** OpenClaw가 재전달을 중복 제거하고 라우팅하기에 충분한
  인바운드 메타데이터를 지속화했음을 확인합니다.
- **사용자에게 보이는 수신 확인:** 선택적 읽음/상태/입력 중 동작입니다. 절대
  내구성 경계가 아닙니다.

`ReceiveAckPolicy`는 전송 또는 폴링 확인 응답만 제어합니다. 이를
읽음 확인이나 상태 반응에 재사용해서는 안 됩니다.

봇 권한 부여 전에, 채널이 메시지 출처 메타데이터를 디코딩할 수 있을 때
수신은 공유 OpenClaw 에코 정책을 적용해야 합니다.

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

이 드롭은 텍스트 기반이 아니라 태그 기반입니다. 동일한 보이는 Gateway 실패 텍스트를 가진
봇 작성 방 메시지라도 OpenClaw 출처 메타데이터가 없으면 여전히
일반 `allowBots` 권한 부여를 거칩니다.

확인 응답 정책은 명시적입니다.

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 폴링은 이제 지속된 재시작 워터마크에 수신 컨텍스트 확인 응답 정책을 사용합니다.
트래커는 여전히 grammY 업데이트가 미들웨어 체인에 들어올 때 관찰하지만,
OpenClaw는 성공적인 디스패치 후 안전하게 완료된 업데이트 ID만 지속화하여,
실패했거나 더 낮은 대기 중 업데이트가 재시작 후 재생 가능하게 남겨 둡니다.
Telegram의 업스트림 `getUpdates` 가져오기 오프셋은 여전히
폴링 라이브러리가 제어하므로, OpenClaw의 재시작
워터마크를 넘어 플랫폼 수준 재전달이 필요하다면 남은 더 깊은 개선은 완전히 지속 가능한 폴링
소스입니다. Webhook 플랫폼은 즉시 HTTP 확인 응답이 필요할 수 있지만,
Webhook은 재전달될 수 있으므로 여전히 인바운드 중복 제거와 지속 가능한 아웃바운드 전송 의도가 필요합니다.

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

intent는 transport I/O 전에 존재해야 합니다. begin 이후 commit 이전에 재시작되더라도
복구할 수 있습니다.

위험한 경계는 플랫폼 성공 이후 receipt commit 이전입니다. 그 지점에서
프로세스가 종료되면, 어댑터가 네이티브 멱등성 또는 receipt 조정 경로를 제공하지 않는 한
OpenClaw는 플랫폼 메시지가 존재하는지 알 수 없습니다.
그러한 시도는 맹목적으로 재실행하지 말고 `unknown_after_send`에서 재개해야 합니다. 조정 기능이 없는 채널은
중복으로 보이는 메시지가 해당 채널과 관계에서 허용 가능하고 문서화된 트레이드오프인 경우에만 at-least-once 재실행을 선택할 수 있습니다.
현재 SDK 조정 브리지는 어댑터가
`reconcileUnknownSend`를 선언하도록 요구한 다음, `durableFinal.reconcileUnknownSend`에
알 수 없는 항목을 `sent`, `not_sent`, 또는 `unresolved`로 분류하도록 요청합니다. `not_sent`만
재실행을 허용하며, 해결되지 않은 항목은 terminal 상태로 남거나 조정 확인만 재시도합니다.

내구성 정책은 명시적이어야 합니다.

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required`는 core가 durable intent를 쓸 수 없을 때 fail closed해야 함을 의미합니다.
`best_effort`는 persistence를 사용할 수 없을 때 그대로 진행할 수 있습니다. `disabled`는
기존 직접 전송 동작을 유지합니다. 마이그레이션 중에는 레거시 래퍼와 공개
호환성 헬퍼의 기본값이 `disabled`입니다. 채널에 일반 outbound 어댑터가 있다는 사실만으로
`required`를 추론해서는 안 됩니다.

전송 컨텍스트는 채널 로컬 post-send 효과도 소유합니다. durable delivery가
이전에 채널의 직접 전송 경로에 붙어 있던 로컬 동작을 우회한다면 마이그레이션은 안전하지 않습니다.
예로는 self-echo 억제 캐시,
스레드 참여 마커, 네이티브 edit 앵커, model-signature 렌더링,
플랫폼별 중복 가드가 있습니다. 이러한 효과는 해당
채널이 durable generic final delivery를 활성화하기 전에 send 어댑터, render 어댑터, 또는 이름이 있는 send-context 훅으로 이동해야 합니다.

전송 헬퍼는 receipt를 호출자까지 끝까지 반환해야 합니다. Durable
래퍼는 메시지 id를 삼키거나 채널 전달 결과를
`undefined`로 대체할 수 없습니다. 버퍼링된 디스패처는 이러한 id를 스레드 앵커, 이후 edit,
preview finalization, 중복 억제에 사용합니다.

Fallback 전송은 단일 페이로드가 아니라 배치 단위로 동작합니다. Silent-reply 재작성,
미디어 fallback, 카드 fallback, 청크 프로젝션은 모두 둘 이상의 deliverable 메시지를 생성할 수 있으므로,
전송 컨텍스트는 투영된 배치 전체를 전달하거나 왜 하나의 페이로드만 유효한지 명시적으로 문서화해야 합니다.

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

이러한 fallback이 durable일 때, 투영된 배치 전체는
하나의 durable send intent 또는 다른 atomic batch plan으로 표현되어야 합니다. 각 페이로드를
하나씩 기록하는 것만으로는 충분하지 않습니다. 페이로드 사이에서 충돌이 발생하면 남은 페이로드에 대한
durable record 없이 부분적으로 보이는 fallback이 남을 수 있습니다. 복구는
어떤 unit이 이미 receipt를 갖고 있는지 알아야 하며, 누락된 unit만 재실행하거나
어댑터가 조정할 때까지 배치를 `unknown_after_send`로 표시해야 합니다.

## Live 컨텍스트

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

Live 상태는 복구하거나 중복을 억제할 수 있을 만큼 durable합니다.

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

- Telegram 전송과 edit preview, preview가 오래되면 fresh final 사용.
- Discord 전송과 edit preview, 미디어/오류/명시적 답장 시 취소.
- Slack 네이티브 스트림 또는 스레드 형태에 따른 초안 preview.
- Mattermost 초안 게시물 finalization.
- Matrix 초안 이벤트 finalization 또는 불일치 시 redaction.
- Teams 네이티브 progress 스트림.
- QQ Bot 스트림 또는 누적 fallback.

## 어댑터 표면

공개 SDK 대상은 하나의 subpath여야 합니다.

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

preflight authorization 전에 core는 `origin.decode`가 OpenClaw-origin metadata를 반환할 때마다
공유 OpenClaw echo predicate를 실행해야 합니다. receive 어댑터는
bot author와 room shape 같은 플랫폼 facts를 제공합니다. core는 drop
decision과 ordering을 소유하므로 채널이 텍스트 필터를 다시 구현하지 않습니다.

Origin 어댑터:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core가 `MessageOrigin`을 설정합니다. 채널은 이를 네이티브
transport metadata로, 또는 그 반대로 변환하기만 합니다. Slack은 이를 `chat.postMessage({ metadata })`와
inbound `message.metadata`에 매핑하고, Matrix는 추가 이벤트 콘텐츠에 매핑할 수 있습니다. 네이티브 metadata가 없는 채널은
그것이 사용 가능한 최선의 근사치일 때 receipt/outbound registry를 사용할 수 있습니다.

기능:

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
- `outbound-runtime`의 대부분의 공개 사용
- 임시 draft stream lifecycle 헬퍼

호환성 subpath는 래퍼로 남을 수 있지만, 새 third-party plugins에는
필요하지 않아야 합니다.

번들 Plugin은 마이그레이션 중에 예약된 runtime
subpath를 통해 내부 헬퍼 import를 유지할 수 있습니다. 공개 문서는 Plugin 작성자를
`plugin-sdk/channel-outbound`가 생기면 그쪽으로 안내해야 합니다.

## 채널 inbound와의 관계

`runtime.channel.inbound.*`는 마이그레이션 중 runtime 브리지입니다.

이는 호환성 어댑터가 되어야 합니다.

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply`도 처음에는 남아 있어야 합니다.

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

기존 `channel.turn` runtime 표면은 제거되었습니다. Runtime 호출자는
`channel.inbound.*`를 사용하고, 채널 문서와 SDK subpath는 inbound/message 명사를 사용합니다.

## 호환성 가드레일

마이그레이션 중에는 기존 delivery callback이 "이 페이로드를 전송" 이상의 부수 효과를 갖는 모든 채널에 대해
generic durable delivery는 opt-in입니다.

레거시 진입점은 기본적으로 non-durable입니다.

- `channel.inbound.run`과 `dispatchChannelInboundReply`는 해당 채널이 감사된 durable
  policy/options 객체를 명시적으로 제공하지 않는 한 채널의
  delivery callback을 사용합니다.
- `channel.inbound.runPreparedReply`는 prepared dispatcher가
  send context를 명시적으로 호출할 때까지 channel-owned 상태로 남습니다.
- `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase`, direct-DM 헬퍼 같은 공개 호환성 헬퍼는 caller-provided `deliver` 또는 `reply` callback 전에 generic
  durable delivery를 절대 주입하지 않습니다.

마이그레이션 브리지 타입에서 `durable: undefined`는 "durable 아님"을 의미합니다.
durable 경로는 명시적 policy/options 값으로만 활성화됩니다. `durable:
false`는 호환성 표기로 남을 수 있지만, 구현이 마이그레이션되지 않은 모든 채널에
이를 추가하도록 요구해서는 안 됩니다.

현재 브리지 코드는 내구성 결정을 명시적으로 유지해야 합니다.

- 내구성 있는 최종 전달은 구별된 상태를 반환합니다. `handled_visible` 및
  `handled_no_send`는 터미널 상태이며, `unsupported` 및 `not_applicable`은
  채널 소유 전달로 폴백할 수 있고, `failed`는 전송 실패를 전파합니다.
- 일반 내구성 있는 최종 전달은 무음 전달, 답장 대상 보존, 네이티브 인용 보존,
  메시지 전송 훅 같은 어댑터 기능으로 제한됩니다. 동등성이 없으면 사용자에게
  보이는 동작을 바꾸는 일반 전송이 아니라 채널 소유 전달을 선택해야 합니다.
- 큐 기반 내구성 있는 전송은 전달 의도 참조를 노출합니다. 기존
  `pendingFinalDelivery*` 세션 필드는 전환 중에 의도 ID를 전달할 수 있으며,
  최종 상태는 고정된 답장 텍스트와 임시 컨텍스트 필드가 아니라
  `MessageSendIntent` 저장소입니다.

다음이 모두 참이 될 때까지 채널에 일반 내구성 경로를 활성화하지 마세요.

- 일반 전송 어댑터가 이전 직접 경로와 동일한 렌더링 및 전송 동작을 실행합니다.
- 로컬 전송 후 부수 효과가 전송 컨텍스트를 통해 보존됩니다.
- 어댑터가 모든 플랫폼 메시지 ID가 포함된 수신 확인 또는 전달 결과를 반환합니다.
- 준비된 디스패처 경로가 새 전송 컨텍스트를 호출하거나 내구성 보장의 범위 밖으로 문서화된 상태로 유지됩니다.
- 폴백 전달이 첫 번째 항목만이 아니라 모든 투영된 페이로드를 처리합니다.
- 내구성 있는 폴백 전달이 전체 투영된 페이로드 배열을 하나의 재생 가능한 의도 또는 배치 계획으로 기록합니다.

보존해야 할 구체적인 마이그레이션 위험:

- iMessage 모니터 전달은 성공적인 전송 후 전송된 메시지를 에코 캐시에 기록합니다.
  내구성 있는 최종 전송도 여전히 해당 캐시를 채워야 합니다. 그렇지 않으면
  OpenClaw가 자체 최종 답장을 인바운드 사용자 메시지로 다시 수집할 수 있습니다.
- Tlon은 선택적 모델 서명을 추가하고 그룹 답장 후 참여한 스레드를 기록합니다.
  일반 내구성 전달은 이러한 효과를 우회해서는 안 됩니다. 해당 효과를 Tlon 렌더링/전송/최종화 어댑터로 옮기거나 Tlon을 채널 소유 경로에 유지하세요.
- Discord 및 기타 준비된 디스패처는 이미 직접 전달과 미리보기 동작을 소유합니다.
  준비된 디스패처가 최종 메시지를 전송 컨텍스트로 명시적으로 라우팅하기 전까지는 조립된 턴의 내구성 보장에 포함되지 않습니다.
- Telegram 무음 폴백 전달은 전체 투영된 페이로드 배열을 전달해야 합니다.
  단일 페이로드 단축 경로는 투영 후 추가 폴백 페이로드를 누락시킬 수 있습니다.
- LINE, Zalo, Nostr 및 기타 기존 조립/헬퍼 경로에는 답장 토큰 처리,
  미디어 프록시, 전송 메시지 캐시, 로딩/상태 정리 또는 콜백 전용 대상이
  있을 수 있습니다. 이러한 의미가 전송 어댑터로 표현되고 테스트로 검증될 때까지
  채널 소유 전달에 남아 있습니다.
- Direct-DM 헬퍼에는 유일하게 올바른 전송 대상인 답장 콜백이 있을 수 있습니다.
  일반 아웃바운드는 `OriginatingTo` 또는 `To`에서 추측해 해당 콜백을 건너뛰면 안 됩니다.
- OpenClaw Gateway 실패 출력은 사람이 볼 수 있게 유지되어야 하지만, 태그가 지정된
  봇 작성 룸 에코는 `allowBots` 승인 전에 삭제되어야 합니다. 채널은 짧은 긴급
  임시 조치를 제외하고 이를 보이는 텍스트 접두사 필터로 구현해서는 안 됩니다.
  내구성 계약은 구조화된 출처 메타데이터입니다.

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

큐는 재시작 후 동일한 계정, 스레드, 대상, 형식 지정 정책 및 미디어 규칙을 통해
재생할 수 있을 만큼 충분한 식별 정보를 유지해야 합니다.

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

- `transient` 및 `rate_limit`를 재시도합니다.
- 렌더링 폴백이 존재하지 않는 한 `invalid_payload`를 재시도하지 않습니다.
- 구성이 변경될 때까지 `auth` 또는 `permission`을 재시도하지 않습니다.
- `not_found`의 경우, 채널이 안전하다고 선언하면 라이브 최종화가 편집에서 새 전송으로 폴백하도록 합니다.
- `conflict`의 경우, 수신 확인/멱등성 규칙을 사용하여 메시지가 이미 존재하는지 결정합니다.
- 어댑터가 플랫폼 I/O를 완료했을 수 있지만 수신 확인 커밋 전에 발생한 모든 오류는
  어댑터가 플랫폼 작업이 발생하지 않았음을 증명할 수 없는 한 `unknown_after_send`가 됩니다.

## 채널 매핑

| 채널            | 대상 마이그레이션                                                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | ack 정책과 내구성 있는 최종 전송을 수신합니다. 라이브 어댑터는 전송과 편집 미리보기, 오래된 미리보기 최종 전송, 주제, 인용-답장 미리보기 건너뛰기, 미디어 폴백, retry-after 처리를 담당합니다.                                                                                                                                                |
| Discord         | 전송 어댑터가 기존의 내구성 있는 페이로드 전달을 래핑합니다. 라이브 어댑터는 초안 편집, 진행 상황 초안, 미디어/오류 미리보기 취소, 답장 대상 보존, 메시지 ID 수신 확인을 담당합니다. 공유 방에서 봇이 작성한 Gateway 실패 에코를 감사합니다. Discord가 일반 메시지에 출처 메타데이터를 담을 수 없다면 아웃바운드 레지스트리나 다른 네이티브 동등 수단을 사용합니다. |
| Slack           | 전송 어댑터가 일반 채팅 게시물을 처리합니다. 라이브 어댑터는 스레드 형태가 지원할 때 네이티브 스트림을 선택하고, 그렇지 않으면 초안 미리보기를 사용합니다. 수신 확인은 스레드 타임스탬프를 보존합니다. 출처 어댑터는 OpenClaw Gateway 실패를 Slack `chat.postMessage.metadata`에 매핑하고, `allowBots` 승인 전에 태그가 지정된 봇 방 에코를 삭제합니다. |
| WhatsApp        | 전송 어댑터가 내구성 있는 최종 인텐트로 텍스트/미디어 전송을 담당합니다. 수신 어댑터는 그룹 멘션과 발신자 ID를 처리합니다. WhatsApp에 편집 가능한 전송 수단이 생길 때까지 라이브는 없어도 됩니다.                                                                                                                                               |
| Matrix          | 라이브 어댑터가 초안 이벤트 편집, 최종화, 삭제, 암호화된 미디어 제약, 답장 대상 불일치 폴백을 담당합니다. 수신 어댑터는 암호화된 이벤트 하이드레이션과 중복 제거를 담당합니다. 출처 어댑터는 OpenClaw Gateway 실패 출처를 Matrix 이벤트 콘텐츠에 인코딩하고, `allowBots` 처리 전에 구성된 봇 방 에코를 삭제해야 합니다.                      |
| Mattermost      | 라이브 어댑터가 단일 초안 게시물, 진행 상황/도구 접기, 제자리 최종화, 새 전송 폴백을 담당합니다.                                                                                                                                                                                                                                                |
| Microsoft Teams | 라이브 어댑터가 네이티브 진행 상황과 블록 스트림 동작을 담당합니다. 전송 어댑터는 활동과 첨부 파일/카드 수신 확인을 담당합니다.                                                                                                                                                                                                                 |
| Feishu          | 렌더링 어댑터가 텍스트/카드/원시 렌더링을 담당합니다. 라이브 어댑터가 스트리밍 카드와 중복 최종 억제를 담당합니다. 전송 어댑터가 댓글, 주제 세션, 미디어, 음성 억제를 담당합니다.                                                                                                                                                           |
| QQ Bot          | 라이브 어댑터가 C2C 스트리밍, 누산기 타임아웃, 폴백 최종 전송을 담당합니다. 렌더링 어댑터가 미디어 태그와 음성으로서의 텍스트를 담당합니다.                                                                                                                                                                                                     |
| Signal          | 단순 수신과 전송 어댑터입니다. signal-cli가 신뢰할 수 있는 편집 지원을 추가하지 않는 한 라이브 어댑터는 없습니다.                                                                                                                                                                                                                              |
| iMessage        | 단순 수신과 전송 어댑터입니다. 내구성 있는 최종 전송이 모니터 전달을 우회할 수 있으려면 먼저 iMessage 전송이 모니터 에코 캐시 채우기를 보존해야 합니다.                                                                                                                                                                                         |
| Google Chat     | 스페이스와 스레드 ID에 매핑된 스레드 관계를 포함하는 단순 수신과 전송 어댑터입니다. 태그가 지정된 OpenClaw Gateway 실패 에코에 대해 `allowBots=true` 방 동작을 감사합니다.                                                                                                                                                                    |
| LINE            | 답장 토큰 제약을 대상/관계 기능으로 모델링하는 단순 수신과 전송 어댑터입니다.                                                                                                                                                                                                                                                                    |
| Nextcloud Talk  | SDK 수신 브리지와 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                            |
| IRC             | 단순 수신과 전송 어댑터이며, 내구성 있는 편집 수신 확인은 없습니다.                                                                                                                                                                                                                                                                              |
| Nostr           | 암호화된 DM을 위한 수신과 전송 어댑터이며, 수신 확인은 이벤트 ID입니다.                                                                                                                                                                                                                                                                          |
| QA Channel      | 수신, 전송, 라이브, 재시도, 복구 동작을 위한 계약 테스트 어댑터입니다.                                                                                                                                                                                                                                                                            |
| Synology Chat   | 단순 수신과 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                   |
| Tlon            | 일반적인 내구성 있는 최종 전달을 활성화하기 전에 전송 어댑터가 모델 서명 렌더링과 참여한 스레드 추적을 보존해야 합니다.                                                                                                                                                                                                                        |
| Twitch          | 속도 제한 분류를 포함하는 단순 수신과 전송 어댑터입니다.                                                                                                                                                                                                                                                                                         |
| Zalo            | 단순 수신과 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                   |
| Zalo Personal   | 단순 수신과 전송 어댑터입니다.                                                                                                                                                                                                                                                                                                                   |

## 마이그레이션 계획

### 1단계: 내부 메시지 도메인

- 메시지, 대상, 관계, 출처, 수신 확인, 기능, 내구성 있는 인텐트, 수신
  컨텍스트, 전송 컨텍스트, 라이브 컨텍스트, 실패 클래스에 대한
  `src/channels/message/*` 타입을 추가합니다.
- 현재 답장 전달에서 사용하는 마이그레이션 브리지 페이로드 타입에
  `origin?: MessageOrigin`을 추가한 다음, 리팩터링이 답장 페이로드를
  대체하면서 해당 필드를 `ChannelMessage`와 렌더링된 메시지 타입으로
  이동합니다.
- 어댑터와 테스트가 형태를 증명할 때까지 이를 내부에 유지합니다.
- 상태 전환과 직렬화에 대한 순수 단위 테스트를 추가합니다.

### 2단계: 내구성 있는 전송 코어

- 기존 아웃바운드 큐를 답장 페이로드 내구성에서 내구성 있는 메시지
  전송 인텐트로 이동합니다.
- 내구성 있는 전송 인텐트가 단일 답장 페이로드만이 아니라 투영된
  페이로드 배열이나 배치 계획을 담을 수 있게 합니다.
- 호환성 변환을 통해 현재 큐 복구 동작을 보존합니다.
- `deliverOutboundPayloads`가 `messages.send`를 호출하게 합니다.
- 어댑터가 재생 안전성을 선언한 뒤, 새 메시지 수명 주기에서 내구성
  있는 인텐트를 쓸 수 없을 때 최종 전송 내구성을 기본값으로 하고
  실패 시 닫히도록 합니다. 이 단계 동안 기존 인바운드 러너와 SDK
  호환성 경로는 기본적으로 직접 전송으로 유지됩니다.
- 수신 확인을 일관되게 기록합니다.
- 내구성 있는 전송을 터미널 부작용으로 취급하는 대신, 수신 확인과
  전달 결과를 원래 디스패처 호출자에게 반환합니다.
- 내구성 있는 전송 인텐트를 통해 메시지 출처를 유지하여 복구, 재생,
  청크 전송이 OpenClaw 운영 출처를 보존하게 합니다.

### 3단계: 채널 인바운드 브리지

- `messages.receive`와 `messages.send` 위에서 `channel.inbound.run`과
  `dispatchChannelInboundReply`를 다시 구현합니다.
- 현재 팩트 타입을 안정적으로 유지합니다.
- 기본적으로 레거시 동작을 유지합니다. 조립된 턴 채널은 어댑터가
  재생 안전 내구성 정책으로 명시적으로 옵트인할 때만 내구성을 갖습니다.
- 네이티브 편집을 최종화하고 아직 안전하게 재생할 수 없는 경로를 위한
  호환성 탈출구로 `durable: false`를 유지하되, 마이그레이션되지 않은
  채널을 보호하기 위해 `false` 마커에 의존하지 않습니다.
- 채널 매핑이 일반 전송 경로가 기존 채널 전달 의미론을 보존한다는
  것을 증명한 뒤, 새 메시지 수명 주기에서만 조립된 턴 내구성을
  기본값으로 설정합니다.

### 4단계: 준비된 디스패처 브리지

- `deliverDurableInboundReplyPayload`를 전송 컨텍스트 브리지로 교체합니다.
- 기존 헬퍼는 래퍼로 유지합니다.
- Telegram, WhatsApp, Slack, Signal, iMessage, Discord는 이미 내구성 최종 작업이 있거나 전송 경로가 더 단순하므로 먼저 이식합니다.
- 준비된 모든 디스패처는 전송 컨텍스트에 명시적으로 옵트인하기 전까지는 미적용 상태로 취급합니다. 문서와 changelog 항목은 모든 자동 최종 응답을 주장하지 말고 "조립된 채널 턴"이라고 말하거나 마이그레이션된 채널 경로의 이름을 명시해야 합니다.
- `recordInboundSessionAndDispatchReply`, 직접 DM 헬퍼, 유사한 공개 호환성 헬퍼는 동작을 보존합니다. 나중에 명시적인 전송 컨텍스트 옵트인을 노출할 수 있지만, 호출자 소유 전달 콜백보다 먼저 일반 내구성 전달을 자동으로 시도해서는 안 됩니다.

### 5단계: 통합 라이브 수명 주기

- 두 개의 증명 어댑터로 `messages.live`를 빌드합니다.
  - 전송, 편집, 오래된 최종 전송을 위한 Telegram.
  - 초안 최종화와 삭제 대체 처리를 위한 Matrix.
- 그런 다음 Discord, Slack, Mattermost, Teams, QQ Bot, Feishu를 마이그레이션합니다.
- 각 채널에 동등성 테스트가 생긴 뒤에만 중복된 미리보기 최종화 코드를 삭제합니다.

### 6단계: 공개 SDK

- `openclaw/plugin-sdk/channel-outbound`를 추가합니다.
- 이를 권장 채널 Plugin API로 문서화합니다.
- 패키지 exports, 엔트리포인트 인벤토리, 생성된 API 기준선, Plugin SDK 문서를 업데이트합니다.
- 채널 아웃바운드 SDK 표면에 `MessageOrigin`, 원본 인코드/디코드 훅, 공유 `shouldDropOpenClawEcho` 조건자를 포함합니다.
- 기존 하위 경로에 대한 호환성 래퍼를 유지합니다.
- 번들 Plugin이 마이그레이션된 뒤 응답 명명 SDK 헬퍼를 문서에서 deprecated로 표시합니다.

### 7단계: 모든 발신자

응답이 아닌 모든 아웃바운드 생산자를 `messages.send`로 이동합니다.

- cron 및 Heartbeat 알림
- 작업 완료
- 훅 결과
- 승인 프롬프트 및 승인 결과
- 메시지 도구 전송
- 하위 에이전트 완료 알림
- 명시적 CLI 또는 Control UI 전송
- 자동화/브로드캐스트 경로

여기서 모델은 "에이전트 응답"이기를 멈추고 "OpenClaw가 메시지를 보냄"이 됩니다.

### 8단계: 턴 명명 호환성 제거

- 인바운드/메시지 명명 래퍼를 호환성 기간 동안 유지합니다.
- 마이그레이션 노트를 게시합니다.
- 기존 import에 대해 Plugin SDK 호환성 테스트를 실행합니다.
- 번들 Plugin이 더 이상 필요로 하지 않고 서드파티 계약에 안정적인 대체물이 생긴 뒤에만 기존 내부 헬퍼를 제거하거나 숨깁니다.

## 테스트 계획

단위 테스트:

- 내구성 전송 의도 직렬화 및 복구.
- 멱등성 키 재사용 및 중복 억제.
- 수신 확인 커밋 및 재생 건너뛰기.
- 어댑터가 조정을 지원할 때 재생 전에 조정하는 `unknown_after_send` 복구.
- 실패 분류 정책.
- 수신 ack 정책 순서.
- 응답, 후속, 시스템, 브로드캐스트 전송에 대한 관계 매핑.
- Gateway 실패 원본 팩터리 및 `shouldDropOpenClawEcho` 조건자.
- 페이로드 정규화, 청킹, 내구성 큐 직렬화, 복구를 거치는 원본 보존.

통합 테스트:

- `channel.inbound.run` 단순 어댑터가 여전히 기록하고 전송합니다.
- 레거시 조립 이벤트 전달은 채널이 명시적으로 옵트인하지 않는 한 내구성을 갖지 않습니다.
- `channel.inbound.runPreparedReply` 브리지가 여전히 기록하고 최종화합니다.
- 공개 호환성 헬퍼는 기본적으로 호출자 소유 전달 콜백을 호출하며, 해당 콜백보다 먼저 일반 전송을 하지 않습니다.
- 내구성 대체 전달은 재시작 후 전체 투영 페이로드 배열을 재생하며, 초기 크래시 후 이후 페이로드가 기록되지 않은 상태로 남을 수 없습니다.
- 내구성 조립 이벤트 전달은 버퍼링된 디스패처에 플랫폼 메시지 ID를 반환합니다.
- 커스텀 전달 훅은 내구성 전달이 비활성화되었거나 사용할 수 없을 때도 플랫폼 메시지 ID를 반환합니다.
- 최종 응답은 어시스턴트 완료와 플랫폼 전송 사이의 재시작을 견딥니다.
- 미리보기 초안은 허용될 때 제자리에서 최종화됩니다.
- 미디어/오류/응답 대상 불일치로 일반 전달이 필요할 때 미리보기 초안은 취소되거나 삭제됩니다.
- 블록 스트리밍과 미리보기 스트리밍이 동일한 텍스트를 둘 다 전달하지 않습니다.
- 일찍 스트리밍된 미디어는 최종 전달에서 중복되지 않습니다.

채널 테스트:

- Telegram 주제 응답에서 폴링 ack가 수신 컨텍스트의 안전한 완료 워터마크까지 지연됩니다.
- 수락되었지만 전달되지 않은 업데이트에 대한 Telegram 폴링 복구가 영속화된 안전 완료 오프셋 모델로 커버됩니다.
- Telegram 오래된 미리보기가 새로운 최종을 전송하고 미리보기를 정리합니다.
- Telegram 무음 대체 처리가 모든 투영 대체 페이로드를 전송합니다.
- Telegram 무음 대체 내구성은 루프 반복마다 단일 페이로드 내구성 의도 하나가 아니라 전체 투영 대체 배열을 원자적으로 기록합니다.
- Discord 미리보기가 미디어/오류/명시적 응답에서 취소됩니다.
- Discord 준비된 디스패처 최종은 문서나 changelog가 Discord 최종 응답 내구성을 주장하기 전에 전송 컨텍스트를 통해 라우팅됩니다.
- iMessage 내구성 최종 전송은 모니터 전송 메시지 echo 캐시를 채웁니다.
- LINE, Zalo, Nostr 레거시 전달 경로는 어댑터 동등성 테스트가 생길 때까지 일반 내구성 전송으로 우회되지 않습니다.
- 직접 DM/Nostr 콜백 전달은 완전한 메시지 대상과 재생 안전 전송 어댑터로 명시적으로 마이그레이션되지 않는 한 권한 있는 경로로 남습니다.
- Slack 태그된 OpenClaw Gateway 실패 메시지는 아웃바운드에서 계속 보이고, 태그된 봇 룸 echo는 `allowBots` 전에 드롭되며, 동일한 표시 텍스트를 가진 태그 없는 봇 메시지는 여전히 정상 봇 권한 부여를 따릅니다.
- Slack 네이티브 스트림이 최상위 DM에서 초안 미리보기로 대체됩니다.
- Matrix 미리보기 최종화 및 삭제 대체 처리.
- Matrix 태그된 OpenClaw Gateway 실패 룸 echo가 설정된 봇 계정에서 오면 `allowBots` 처리 전에 드롭됩니다.
- Discord와 Google Chat 공유 룸 Gateway 실패 연쇄 감사는 해당 위치에서 일반 보호를 주장하기 전에 `allowBots` 모드를 커버합니다.
- Mattermost 초안 최종화 및 새 전송 대체 처리.
- Teams 네이티브 진행 상태 최종화.
- Feishu 중복 최종 억제.
- QQ Bot 누산기 타임아웃 대체 처리.
- Tlon 내구성 최종 전송은 모델 서명 렌더링과 참여한 스레드 추적을 보존합니다.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal 단순 내구성 최종 전송.

검증:

- 개발 중 대상 Vitest 파일.
- 전체 변경 표면에 대해 Testbox에서 `pnpm check:changed`.
- 전체 리팩터를 랜딩하기 전 또는 공개 SDK/export 변경 후 Testbox에서 더 넓은 `pnpm check`.
- 호환성 래퍼를 제거하기 전, 편집 가능한 채널 하나와 단순 전송 전용 채널 하나 이상에 대해 라이브 또는 qa-channel 스모크.

## 열린 질문

- Telegram이 결국 OpenClaw의 영속화된 재시작 워터마크뿐 아니라 플랫폼 수준 재전달을 제어할 수 있는 완전한 내구성 폴링 소스로 grammY 러너 소스를 교체해야 하는지 여부.
- 내구성 라이브 미리보기 상태를 최종 전송 의도와 같은 큐 레코드에 저장해야 하는지, 아니면 형제 라이브 상태 저장소에 저장해야 하는지 여부.
- `plugin-sdk/channel-outbound`가 출시된 후 호환성 래퍼를 문서화 상태로 얼마나 오래 유지할지.
- 서드파티 Plugin이 수신 어댑터를 직접 구현해야 하는지, 아니면 `defineChannelMessageAdapter`를 통해 정규화/전송/라이브 훅만 제공해야 하는지.
- 어떤 수신 확인 필드를 공개 SDK에 노출해도 안전하고, 어떤 필드는 내부 런타임 상태로 두어야 하는지.
- 자체 echo 캐시와 참여한 스레드 마커 같은 부수 효과를 전송 컨텍스트 훅, 어댑터 소유 최종화 단계, 수신 확인 구독자 중 무엇으로 모델링해야 하는지.
- 어떤 채널이 네이티브 원본 메타데이터를 갖고, 어떤 채널이 영속화된 아웃바운드 레지스트리를 필요로 하며, 어떤 채널이 신뢰할 수 있는 교차 봇 echo 억제를 제공할 수 없는지.

## 승인 기준

- 모든 번들 메시지 채널은 최종 표시 출력을 `messages.send`를 통해 전송합니다.
- 모든 인바운드 메시지 채널은 `messages.receive` 또는 문서화된 호환성 래퍼를 통해 진입합니다.
- 모든 미리보기/편집/스트림 채널은 초안 상태와 최종화에 `messages.live`를 사용합니다.
- `channel.inbound`는 래퍼일 뿐입니다.
- 응답 명명 SDK 헬퍼는 호환성 export이지 권장 경로가 아닙니다.
- 내구성 복구는 재시작 후 대기 중인 최종 전송을 재생하면서 최종 응답을 잃거나 이미 커밋된 전송을 중복하지 않을 수 있습니다. 플랫폼 결과를 알 수 없는 전송은 재생 전에 조정되거나 해당 어댑터에 대해 최소 1회로 문서화됩니다.
- 내구성 최종 전송은 호출자가 문서화된 비내구성 모드를 명시적으로 선택하지 않는 한, 내구성 의도를 기록할 수 없을 때 실패 폐쇄됩니다.
- 레거시 SDK 호환성 헬퍼는 기본적으로 직접 채널 소유 전달을 사용합니다. 일반 내구성 전송은 명시적 옵트인일 때만 사용됩니다.
- 수신 확인은 다중 파트 전달의 모든 플랫폼 메시지 ID와 스레딩/편집 편의를 위한 기본 ID를 보존합니다.
- 내구성 래퍼는 직접 전달 콜백을 대체하기 전에 채널 로컬 부수 효과를 보존합니다.
- 준비된 디스패처는 최종 전달 경로가 전송 컨텍스트를 명시적으로 사용하기 전까지 내구성이 있는 것으로 계산되지 않습니다.
- 대체 전달은 모든 투영 페이로드를 처리합니다.
- 내구성 대체 전달은 모든 투영 페이로드를 하나의 재생 가능한 의도 또는 배치 계획에 기록합니다.
- OpenClaw에서 시작된 Gateway 실패 출력은 사람에게 보이지만, 태그된 봇 작성 룸 echo는 원본 계약 지원을 선언한 채널에서 봇 권한 부여 전에 드롭됩니다.
- 문서는 전송, 수신, 라이브, 상태, 수신 확인, 관계, 실패 정책, 마이그레이션, 테스트 커버리지를 설명합니다.

## 관련

- [메시지](/ko/concepts/messages)
- [스트리밍 및 청킹](/ko/concepts/streaming)
- [진행 초안](/ko/concepts/progress-drafts)
- [재시도 정책](/ko/concepts/retry)
- [채널 인바운드 API](/ko/plugins/sdk-channel-inbound)
