---
read_when:
    - 채널 Plugin을 빌드하고 있으며 공유 인바운드 턴 수명 주기를 원하는 경우
    - 채널 모니터를 수작업으로 만든 레코드/디스패치 연결 코드에서 벗어나도록 마이그레이션하고 있습니다
    - 접수, 수집, 분류, 사전 점검, 해결, 기록, 전달 및 마무리 단계를 이해해야 합니다
sidebarTitle: Channel turn
summary: runtime.channel.turn -- 번들 및 타사 채널 Plugin이 에이전트 턴을 기록, 디스패치하고 최종화하는 데 사용하는 공유 인바운드 턴 커널
title: 채널 턴 커널
x-i18n:
    generated_at: "2026-04-30T06:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

채널 턴 커널은 정규화된 플랫폼 이벤트를 에이전트 턴으로 바꾸는 공유 인바운드 상태 머신입니다. 채널 plugins는 플랫폼 사실과 전달 콜백을 제공합니다. Core는 오케스트레이션을 소유합니다: 수집, 분류, 사전 확인, 해석, 권한 부여, 조립, 기록, 디스패치, 마무리입니다.

Plugin이 인바운드 메시지 핵심 경로에 있을 때 이것을 사용하세요. 메시지가 아닌 이벤트(슬래시 명령, 모달, 버튼 상호작용, 생명주기 이벤트, 반응, 음성 상태)는 Plugin 내부에 유지하세요. 커널은 에이전트 텍스트 턴이 될 수 있는 이벤트만 소유합니다.

<Info>
  커널은 주입된 Plugin 런타임을 통해 `runtime.channel.turn.*`로 도달합니다. Plugin 런타임 타입은 `openclaw/plugin-sdk/core`에서 내보내므로, 서드파티 네이티브 plugins도 번들 채널 plugins와 같은 방식으로 이 진입점을 사용할 수 있습니다.
</Info>

## 공유 커널이 필요한 이유

채널 plugins는 같은 인바운드 흐름을 반복합니다: 정규화, 라우팅, 게이트, 컨텍스트 빌드, 세션 메타데이터 기록, 에이전트 턴 디스패치, 전달 상태 마무리입니다. 공유 커널이 없으면 멘션 게이팅, 도구 전용 표시 응답, 세션 메타데이터, 대기 중인 기록, 디스패치 마무리 변경을 채널마다 적용해야 합니다.

커널은 네 가지 개념을 의도적으로 분리합니다:

- `ConversationFacts`: 메시지가 온 위치
- `RouteFacts`: 처리해야 할 에이전트와 세션
- `ReplyPlanFacts`: 표시 응답이 가야 할 위치
- `MessageFacts`: 에이전트가 봐야 할 본문과 보조 컨텍스트

Slack DM, Telegram 토픽, Matrix 스레드, Feishu 토픽 세션은 모두 실제로 이를 구분합니다. 이를 하나의 식별자로 취급하면 시간이 지나며 드리프트가 발생합니다.

## 단계 생명주기

커널은 채널과 관계없이 같은 고정 파이프라인을 실행합니다:

1. `ingest` -- 어댑터가 원시 플랫폼 이벤트를 `NormalizedTurnInput`으로 변환
2. `classify` -- 어댑터가 이 이벤트가 에이전트 턴을 시작할 수 있는지 선언
3. `preflight` -- 어댑터가 중복 제거, 자기 에코, 하이드레이션, 디바운스, 복호화, 부분 사실 사전 채우기 수행
4. `resolve` -- 어댑터가 완전히 조립된 턴(라우트, 응답 계획, 메시지, 전달)을 반환
5. `authorize` -- 조립된 사실에 DM, 그룹, 멘션, 명령 정책 적용
6. `assemble` -- `buildContext`를 통해 사실에서 `FinalizedMsgContext` 빌드
7. `record` -- 인바운드 세션 메타데이터와 마지막 라우트 저장
8. `dispatch` -- 버퍼링된 블록 디스패처를 통해 에이전트 턴 실행
9. `finalize` -- 디스패치 오류가 있어도 어댑터 `onFinalize` 실행

`log` 콜백이 제공되면 각 단계가 구조화된 로그 이벤트를 내보냅니다. [관찰 가능성](#observability)을 참조하세요.

## 허용 종류

커널은 턴이 게이트될 때 throw하지 않습니다. `ChannelTurnAdmission`을 반환합니다:

| 종류          | 시점                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 턴이 허용됩니다. 에이전트 턴이 실행되고 표시 응답 경로가 수행됩니다.                                                                   |
| `observeOnly` | 턴은 끝까지 실행되지만 전달 어댑터는 표시되는 내용을 보내지 않습니다. 브로드캐스트 관찰자 에이전트와 기타 수동 다중 에이전트 흐름에 사용됩니다. |
| `handled`     | 플랫폼 이벤트가 로컬에서 소비되었습니다(생명주기, 반응, 버튼, 모달). 커널은 디스패치를 건너뜁니다.                                           |
| `drop`        | 건너뛰기 경로입니다. 선택적으로 `recordHistory: true`는 향후 멘션이 컨텍스트를 갖도록 메시지를 대기 중인 그룹 기록에 유지합니다.                      |

허용은 `classify`(이벤트 클래스가 턴을 시작할 수 없다고 함), `preflight`(중복 제거, 자기 에코, 기록을 남기는 누락된 멘션), 또는 `resolveTurn` 자체에서 올 수 있습니다.

## 진입점

런타임은 어댑터가 채널에 맞는 수준에서 선택적으로 사용할 수 있도록 세 가지 권장 진입점을 노출합니다.

```typescript
runtime.channel.turn.run(...)             // 어댑터 주도 전체 파이프라인
runtime.channel.turn.runPrepared(...)     // 채널이 디스패치를 소유; 커널은 record + finalize 실행
runtime.channel.turn.buildContext(...)    // 순수 사실에서 FinalizedMsgContext로 매핑
```

Plugin SDK 호환성을 위해 두 개의 이전 런타임 헬퍼가 계속 제공됩니다:

```typescript
runtime.channel.turn.runResolved(...)      // 사용 중단된 호환성 별칭; run 권장
runtime.channel.turn.dispatchAssembled(...) // 사용 중단된 호환성 별칭; run 또는 runPrepared 권장
```

### run

채널이 인바운드 흐름을 `ChannelTurnAdapter<TRaw>`로 표현할 수 있을 때 사용하세요. 어댑터에는 `ingest`, 선택적 `classify`, 선택적 `preflight`, 필수 `resolveTurn`, 선택적 `onFinalize` 콜백이 있습니다.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run`은 채널에 작은 어댑터 로직이 있고 훅을 통해 생명주기를 소유하는 이점이 있을 때 알맞은 형태입니다.

### runPrepared

채널에 미리보기, 재시도, 편집, 또는 채널 소유로 유지해야 하는 스레드 부트스트랩이 있는 복잡한 로컬 디스패처가 있을 때 사용하세요. 커널은 여전히 디스패치 전에 인바운드 세션을 기록하고 균일한 `DispatchedChannelTurnResult`를 노출합니다.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

풍부한 채널(Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot)은 디스패처가 커널이 알아서는 안 되는 플랫폼별 동작을 오케스트레이션하기 때문에 `runPrepared`를 사용합니다.

### buildContext

사실 번들을 `FinalizedMsgContext`로 매핑하는 순수 함수입니다. 채널이 파이프라인 일부를 직접 작성하지만 일관된 컨텍스트 형태를 원할 때 사용하세요.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext`는 `run`을 위한 턴을 조립할 때 `resolveTurn` 콜백 내부에서도 유용합니다.

<Note>
  `dispatchInboundReplyWithBase` 같은 사용 중단된 SDK 헬퍼는 여전히 조립된 턴 헬퍼를 통해 브리지됩니다. 새 Plugin 코드는 `run` 또는 `runPrepared`를 사용해야 합니다.
</Note>

## 사실 타입

커널이 어댑터에서 소비하는 사실은 플랫폼에 구애받지 않습니다. 플랫폼 객체를 이 형태로 변환한 뒤 커널에 전달하세요.

### NormalizedTurnInput

| 필드             | 목적                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | 중복 제거와 로그에 사용되는 안정적인 메시지 id                                   |
| `timestamp`       | 선택적 epoch ms                                                            |
| `rawText`         | 플랫폼에서 받은 본문                                           |
| `textForAgent`    | 에이전트를 위한 선택적 정리된 본문(멘션 제거, 타이핑 정리)             |
| `textForCommands` | `/command` 파싱에 사용되는 선택적 본문                                    |
| `raw`             | 원본이 필요한 어댑터 콜백을 위한 선택적 패스스루 참조 |

### ChannelEventClass

| 필드                  | 목적                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | false이면 커널이 `{ kind: "handled" }`를 반환                       |
| `requiresImmediateAck` | 디스패치 전에 ACK가 필요한 어댑터를 위한 힌트                      |

### SenderFacts

| 필드          | 목적                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | 안정적인 플랫폼 발신자 id                                      |
| `name`         | 표시 이름                                                   |
| `username`     | `name`과 구분되는 경우의 핸들                                 |
| `tag`          | Discord 스타일 구분자 또는 플랫폼 태그                    |
| `roles`        | 멤버 역할 허용 목록 매칭에 사용되는 역할 id              |
| `isBot`        | 발신자가 알려진 봇이면 true(커널이 드롭에 사용) |
| `isSelf`       | 발신자가 구성된 에이전트 자체이면 true            |
| `displayLabel` | 봉투 텍스트를 위한 사전 렌더링된 라벨                           |

### ConversationFacts

| 필드             | 목적                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group`, 또는 `channel`                                      |
| `id`              | 라우팅에 사용되는 대화 id                                     |
| `label`           | 봉투를 위한 사람이 읽을 수 있는 라벨                                         |
| `spaceId`         | 선택적 외부 공간 식별자(Slack 워크스페이스, Matrix 홈서버) |
| `parentId`        | 이것이 스레드일 때 외부 대화 id                          |
| `threadId`        | 이 메시지가 스레드 안에 있을 때 스레드 id                       |
| `nativeChannelId` | 라우팅 id와 다를 때 플랫폼 네이티브 채널 id        |
| `routePeer`       | `resolveAgentRoute` 조회에 사용되는 피어                             |

### RouteFacts

| 필드                   | 목적                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 이 턴을 처리해야 하는 에이전트                         |
| `accountId`             | 선택적 오버라이드(다중 계정 채널)                 |
| `routeSessionKey`       | 라우팅에 사용되는 세션 키                               |
| `dispatchSessionKey`    | 라우트 키와 다를 때 디스패치에서 사용되는 세션 키 |
| `persistedSessionKey`   | 저장된 세션 메타데이터에 기록되는 세션 키          |
| `parentSessionKey`      | 분기/스레드 세션의 부모                      |
| `modelParentSessionKey` | 분기 세션의 모델 측 부모                    |
| `mainSessionKey`        | 직접 대화의 기본 DM 소유자 핀                 |
| `createIfMissing`       | 기록 단계에서 누락된 세션 행을 생성하도록 허용          |

### ReplyPlanFacts

| 필드                     | 목적                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | 컨텍스트 `To`에 기록되는 논리적 답장 대상          |
| `originatingTo`           | 원본 컨텍스트 대상(`OriginatingTo`)            |
| `nativeChannelId`         | 전달을 위한 플랫폼 네이티브 채널 ID                 |
| `replyTarget`             | `to`와 다른 경우 최종적으로 보이는 답장 대상 |
| `deliveryTarget`          | 하위 수준 전달 오버라이드                           |
| `replyToId`               | 인용/고정된 메시지 ID                              |
| `replyToIdFull`           | 플랫폼에 두 형식이 모두 있을 때의 전체 형식 인용 ID          |
| `messageThreadId`         | 전달 시점의 스레드 ID                              |
| `threadParentId`          | 스레드의 부모 메시지 ID                         |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` 또는 `none`       |

### AccessFacts

`AccessFacts`는 authorize 단계에 필요한 불리언을 담습니다. 신원 매칭은 채널에 남아 있으며, 커널은 결과만 소비합니다.

| 필드      | 목적                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM 허용/페어링/거부 결정 및 `allowFrom` 목록                       |
| `group`    | 그룹 정책, 경로 허용, 보낸 사람 허용, 허용 목록, 멘션 요구 사항   |
| `commands` | 구성된 authorizer 전반의 명령 권한 부여                       |
| `mentions` | 멘션 감지가 가능한지와 에이전트가 멘션되었는지 여부 |

### MessageFacts

| 필드            | 목적                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | 최종 엔벨로프 본문(서식 적용됨)                                |
| `rawBody`        | 원시 인바운드 본문                                               |
| `bodyForAgent`   | 에이전트가 보는 본문                                            |
| `commandBody`    | 명령 파싱에 사용되는 본문                                  |
| `envelopeFrom`   | 엔벨로프용으로 미리 렌더링된 보낸 사람 레이블                     |
| `senderLabel`    | 렌더링된 보낸 사람에 대한 선택적 오버라이드                      |
| `preview`        | 로그용 짧은 마스킹된 미리보기                                |
| `inboundHistory` | 채널이 버퍼를 유지할 때의 최근 인바운드 기록 항목 |

### SupplementalContextFacts

보조 컨텍스트는 인용, 전달됨, 스레드 부트스트랩 컨텍스트를 다룹니다. 커널은 구성된 `contextVisibility` 정책을 적용합니다. 채널 어댑터는 채널 간 정책이 일관되게 유지되도록 팩트와 `senderAllowed` 플래그만 제공합니다.

### InboundMediaFacts

미디어는 팩트 형태입니다. 플랫폼 다운로드, 인증, SSRF 정책, CDN 규칙, 복호화는 채널 로컬에 남습니다. 커널은 팩트를 `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes`, `MediaTranscribedIndexes`로 매핑합니다.

## 어댑터 계약

전체 `run`에 대한 어댑터 형태는 다음과 같습니다.

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn`은 선택적 admission 종류가 있는 `AssembledChannelTurn`인 `ChannelTurnResolved`를 반환합니다. `{ admission: { kind: "observeOnly" } }`를 반환하면 표시되는 출력을 생성하지 않고 턴을 실행합니다. 어댑터는 여전히 전달 콜백을 소유하며, 해당 턴에서는 아무 작업도 하지 않게 됩니다.

`onFinalize`는 디스패치 오류를 포함한 모든 결과에서 실행됩니다. 이를 사용해 대기 중인 그룹 기록을 지우고, 확인 반응을 제거하고, 상태 표시기를 중지하고, 로컬 상태를 플러시하세요.

## 전달 어댑터

커널은 플랫폼을 직접 호출하지 않습니다. 채널은 커널에 `ChannelTurnDeliveryAdapter`를 전달합니다.

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver`는 버퍼링된 답장 청크마다 한 번 호출됩니다. 채널에 플랫폼 메시지 ID가 있으면 반환하여 디스패처가 스레드 앵커를 보존하고 이후 청크를 편집할 수 있게 하세요. 관찰 전용 턴의 경우 `{ visibleReplySent: false }`를 반환하거나 `createNoopChannelTurnDeliveryAdapter()`를 사용하세요.

## 기록 옵션

기록 단계는 `recordInboundSession`을 래핑합니다. 대부분의 채널은 기본값을 사용할 수 있습니다. `record`를 통해 오버라이드하세요.

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

디스패처는 기록 단계를 기다립니다. 기록에서 예외가 발생하면 커널은 `onPreDispatchFailure`를 실행하고(`runPrepared`에 제공된 경우) 다시 예외를 던집니다.

## 관찰 가능성

`log` 콜백이 제공되면 각 단계는 구조화된 이벤트를 내보냅니다.

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

로그에 기록되는 단계는 `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`입니다. 원시 본문 로깅은 피하고, 짧은 마스킹된 미리보기에는 `MessageFacts.preview`를 사용하세요.

## 채널 로컬에 남는 항목

커널은 오케스트레이션을 소유합니다. 채널은 여전히 다음을 소유합니다.

- 플랫폼 전송 수단(Gateway, REST, websocket, 폴링, Webhook)
- 신원 확인 및 표시 이름 매칭
- 네이티브 명령, 슬래시 명령, 자동 완성, 모달, 버튼, 음성 상태
- 카드, 모달, 적응형 카드 렌더링
- 미디어 인증, CDN 규칙, 암호화된 미디어, 전사
- 편집, 반응, 마스킹, 프레즌스 API
- 백필 및 플랫폼 측 기록 가져오기
- 플랫폼별 확인이 필요한 페어링 흐름

두 채널이 이 중 하나에 대해 같은 헬퍼를 필요로 하기 시작하면, 커널로 밀어 넣는 대신 공유 SDK 헬퍼로 추출하세요.

## 안정성

`runtime.channel.turn.*`는 공개 Plugin 런타임 표면의 일부입니다. 팩트 타입(`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`)과 admission 형태(`ChannelTurnAdmission`, `ChannelEventClass`)는 `openclaw/plugin-sdk/core`의 `PluginRuntime`을 통해 접근할 수 있습니다.

하위 호환성 규칙이 적용됩니다. 새 팩트 필드는 추가 방식이어야 하고, admission 종류의 이름은 변경하지 않으며, 진입점 이름은 안정적으로 유지됩니다. 비추가적 변경이 필요한 새 채널 요구 사항은 Plugin SDK 마이그레이션 프로세스를 거쳐야 합니다.

## 관련 항목

- 더 넓은 채널 Plugin 계약은 [채널 Plugin 빌드](/ko/plugins/sdk-channel-plugins)를 참조하세요
- 다른 `runtime.*` 표면은 [Plugin 런타임 헬퍼](/ko/plugins/sdk-runtime)를 참조하세요
- 로드 파이프라인 및 레지스트리 메커니즘은 [Plugin 내부 구조](/ko/plugins/architecture-internals)를 참조하세요
