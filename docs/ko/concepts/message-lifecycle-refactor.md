---
read_when:
    - 채널 송수신 동작 리팩터링
    - 채널 인바운드, 응답 디스패치, 아웃바운드 큐, 미리보기 스트리밍 또는 Plugin SDK 메시지 API 변경하기
    - 지속적인 전송, 수신 확인, 미리보기, 편집 또는 재시도가 필요한 새 채널 Plugin 설계
summary: '지속성 있는 메시지 수신/전송 수명 주기의 현황: 출시된 내용, 원래 설계에서 변경된 내용, 아직 해결되지 않은 사항'
title: 메시지 수명 주기 리팩터링
x-i18n:
    generated_at: "2026-07-12T00:45:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
이 페이지는 미래 지향적인 설계 제안으로 시작되었습니다. 이후 해당
설계의 핵심은 `src/channels/message/*`와 공개
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound` 하위 경로에
출시되었습니다. 현재 API는 [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)와
[채널 인바운드 API](/ko/plugins/sdk-channel-inbound)를 사용하세요. 이 페이지에서는
출시된 내용, 구현이 원래 구상과 달라진 지점, 아직 해결되지 않은 사항을
추적합니다.
</Note>

## 이 리팩터링을 수행한 이유

채널 스택은 여러 국소적 수정에서 발전했습니다. 성숙도 수준별로 구분된 인바운드
도우미(단순 어댑터용 `runtime.channel.inbound.run`,
기능이 풍부한 어댑터용 `runtime.channel.inbound.runPreparedReply`), 레거시 응답
디스패치 도우미(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
채널별 미리보기 스트리밍, 기존 응답 페이로드 경로에 덧붙인 최종 전달 내구성으로
구성되어 있었습니다. 이러한 구조는 공개 개념을 지나치게 많이 만들었고, 전달
의미 체계가 서로 달라질 수 있는 지점도 지나치게 많았습니다.

재설계를 강제한 안정성 격차는 다음과 같습니다.

```text
Telegram 폴링 업데이트 확인 처리됨
  -> 어시스턴트 최종 텍스트가 존재함
  -> sendMessage 성공 전에 프로세스가 다시 시작됨
  -> 최종 응답이 손실됨
```

목표 불변 조건: 코어가 사용자에게 표시되는 아웃바운드 메시지가 존재해야 한다고
결정하면, 플랫폼 호출을 시도하기 전에 전송 의도를 영속화해야 하며 성공 후에는
플랫폼 수신 확인을 커밋해야 합니다. 이렇게 하면 기본적으로 최소 한 번 복구가
가능합니다. 정확히 한 번 동작은 어댑터가 네이티브 멱등성을 입증하거나, 전송 후
결과를 알 수 없는 시도를 재실행하기 전에 플랫폼 상태와 조정하는 경우에만
가능합니다.

## 출시된 내용

내부 도메인은 `src/channels/message/*`에 있습니다.

| 파일                        | 담당 영역                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | 어댑터, 전송 컨텍스트, 수신 확인 및 영속적 의도 타입 계약                                                  |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — 영속적 전송 컨텍스트                             |
| `receive.ts`                | `createMessageReceiveContext` — 인바운드 확인 처리 정책 상태 머신                                                   |
| `live.ts`                   | 실시간 미리보기 상태 및 제자리 최종화 또는 폴백 로직                                                        |
| `state.ts`                  | `classifyDurableSendRecoveryState` — 중단 후 복구 분류                                    |
| `receipt.ts`                | 플랫폼 전송 결과를 `MessageReceipt`로 정규화                                                             |
| `capabilities.ts`           | 페이로드에서 필요한 영속적 최종 전달 기능을 도출                                                         |
| `contracts.ts`              | 선언된 어댑터 기능의 계약 증명 검증                                                      |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — 레거시 `sendText`/`sendMedia`/`sendPayload`/`sendPoll` 함수를 래핑 |
| `ingress-queue.ts`          | `createChannelIngressQueue` — 영속적 인바운드 이벤트 큐                                                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — 인바운드 중복 제거용 수락/대기/완료/해제 저널                  |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` 및 레거시 이름의 래퍼                                                            |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, 응답 접두사 및 입력 중 콜백 도우미                                             |

공개 표면: `openclaw/plugin-sdk/channel-outbound`(전송/수신 확인/영속성/실시간/응답 파이프라인
도우미) 및 `openclaw/plugin-sdk/channel-inbound`(인바운드 컨텍스트, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). 어댑터 예제, 현재 타입 이름 및 마이그레이션 참고 사항은
해당 페이지를 참조하세요. 아래 구상이 아니라 해당 페이지가 API 구조의
신뢰 가능한 기준입니다.

### 전송 컨텍스트

`withDurableMessageSendContext`는 채널 코드에 하나의 아웃바운드 메시지를 둘러싼
`render`, `previewUpdate`, `send`, `edit`, `delete`, `commit`, `fail` 단계를
제공합니다. `sendDurableMessageBatch`는 일반적인 경우를 위한 래퍼로, 렌더링하고
전송한 다음 `sent`/`suppressed`이면 커밋하고 오류가 발생하면 실패 처리합니다.

`sendDurableMessageBatch`는 다음 판별 결과 중 하나를 반환합니다.

| 상태           | 의미                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | 사용자에게 표시되는 플랫폼 메시지가 하나 이상 전달됨                              |
| `suppressed`     | 누락된 것으로 처리해야 할 플랫폼 메시지가 없음(훅에서 취소됨, 시험 실행 등) |
| `partial_failed` | 이후의 페이로드 또는 부수 효과가 실패하기 전에 메시지가 하나 이상 전달됨      |
| `failed`         | 플랫폼 수신 확인이 생성되지 않음                                                 |

내구성은 `required`, `best_effort`, `disabled` 중 하나입니다
(`src/channels/message/types.ts`의 `MessageDurabilityPolicy`). 영속적 의도를
기록할 수 없으면 `required`는 실패를 기본값으로 적용하고, 영속성을 사용할 수 없으면
`best_effort`는 직접 전송으로 넘어가며, `disabled`는 리팩터링 전의 직접 전송
동작을 유지합니다. 레거시 호환성 도우미의 기본값은 `disabled`이며, 채널에 범용
아웃바운드 어댑터가 있다는 이유만으로 `required`를 추론하지 않습니다.

여전히 위험한 경계는 플랫폼 호출이 성공한 후 수신 확인이 커밋되기 전입니다.
그 시점에 프로세스가 종료되면 어댑터가 `reconcileUnknownSend`를 선언하지 않는 한
코어는 플랫폼 메시지가 존재하는지 알 수 없습니다. 이 훅은 중단된 전송을
`sent`, `not_sent`, `unresolved`로 분류하며, `not_sent`인 경우에만 재실행을
허용합니다. 조정 기능이 없는 채널은 `unknown_after_send` 상태
(`src/channels/message/state.ts`, `src/infra/outbound/delivery-queue-recovery.ts`)로
폴백하며, 사용자에게 중복 메시지가 표시되는 것이 해당 채널에서 허용되고 문서화된
절충안인 경우에만 최소 한 번 재실행을 선택할 수 있습니다.

### 수신 컨텍스트

`createMessageReceiveContext`는 인바운드 이벤트별 확인/거부 상태를 추적하며,
멱등성을 갖는 `ack()`와 명시적 `nack(error)`를 제공합니다. 확인 처리 정책
(`ChannelMessageReceiveAckPolicy`)은 다음 중 하나입니다.

| 정책                 | 확인 처리 시점                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | 코어가 재전달의 중복 제거/라우팅에 충분한 인바운드 메타데이터를 영속화한 후                           |
| `after_agent_dispatch` | 에이전트 실행이 디스패치된 후                                                             |
| `after_durable_send`   | 이 턴의 영속적 아웃바운드 전송이 커밋된 후                                             |
| `manual`               | 호출자가 확인 처리 시점을 명시적으로 제어함(정책을 선언하지 않은 어댑터의 기본값) |

Telegram 폴링은 이를 사용해 안전하게 완료된 업데이트 워터마크
(`extensions/telegram/src/bot-update-tracker.ts`의 `safeCompletedUpdateId`)를
영속화합니다. grammY는 여전히 모든 업데이트가 미들웨어 체인에 진입할 때 이를
관찰하지만, OpenClaw는 디스패치를 완료한 업데이트를 지난 지점까지만 영속된 재시작
워터마크를 진행시키므로 실패했거나 아직 대기 중인 업데이트는 재시작 후 재실행됩니다.
Telegram의 업스트림 `getUpdates` 오프셋은 여전히 grammY가 관리합니다. 이 워터마크를
넘어서는 플랫폼 수준 재전달을 제어하는 완전한 영속적 폴링 소스는 아직 구현되지
않았습니다(미해결 질문 참조).

### 실시간 미리보기

`src/channels/message/live.ts`는 미리보기/편집/최종화를 하나의 수명 주기로
모델링합니다. `createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled`,
`deliverFinalizableLivePreviewAdapter`(초안에서 최종 편집을 생성하고 이를 적용하며,
편집할 수 없거나 실패하면 일반 전송으로 폴백)를 제공합니다.
`LiveMessageState.phase`는 `idle | previewing | finalizing | finalized |
cancelled`이며, `canFinalizeInPlace`는 미리보기가 새로 전송되지 않고 편집을 통해
최종 메시지가 될 수 있는지를 제어합니다.

### 영속적 수신 확인

`MessageReceipt`(`src/channels/message/types.ts`)는 하나의 논리적 전송에서 나온
하나 이상의 플랫폼 메시지 ID를 `platformMessageIds`와 각 부분의 `parts`(종류,
인덱스, 스레드 ID, 답장 대상 ID)로 정규화합니다. 스레딩과 이후 편집을 위해 기본
ID가 유지됩니다. 이를 통해 여러 부분으로 구성된 전달(텍스트와 미디어, 분할된
텍스트, 카드 폴백)을 재시작 후에도 재실행하고 중복을 제거할 수 있습니다.

### 공개 SDK 축소

이 리팩터링은 공개 API로 노출되던 `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, `reply-payload` 도우미,
`inbound-reply-dispatch`, `channel-reply-pipeline` 및 대부분의 공개
`outbound-runtime` 사용을 흡수하거나 지원 중단했습니다.
`src/plugin-sdk/channel-message.ts`는 이제 `channel-outbound` /
`channel-inbound`를 가리키는 `@deprecated` 재내보내기 배럴입니다.
`channel.turn` 런타임 별칭은 제거되었으며, 이전 `/plugins/sdk-channel-turn`
문서 페이지는 [채널 인바운드 API](/ko/plugins/sdk-channel-inbound)로 리디렉션됩니다.
새 Plugin 코드는 `channel-outbound`와 `channel-inbound`를 직접 대상으로 해야 합니다.

## 구현이 원래 설계와 달라진 지점

아래 설계 구상은 설명된 그대로 출시되지 않았습니다. 기록은 역사적 정확성을 위해
유지합니다. 이러한 타입 이름을 현재 API로 간주하지 마세요.

- **`MessageOrigin` / `shouldDropOpenClawEcho`가 없습니다.** 원래 계획에서는
  Gateway 장애 메시지에 `source: "openclaw"` 출처 태그를 추가하고,
  `allowBots` 권한 부여 전에 공유 방에서 태그된 봇 작성 에코를 삭제하는
  공통 조건자를 도입하려 했습니다. 해당 타입과 조건자는 코드베이스에 존재하지
  않습니다. `allowBots` 자체는 실제 채널별 구성 키(Slack, Discord, Google Chat
  등)이지만, 이를 보호하도록 의도된 출처 태그 지정 메커니즘은 구현되지 않았습니다.
  봇이 활성화된 방에서 Gateway 장애 에코를 억제하는 기능은 출시된 보장이 아니라
  여전히 해결되지 않은 공백입니다.
- **통합된 `core.messages.receive/send/live/state` 네임스페이스가 없습니다.**
  출시된 함수는 `core.messages.*` 퍼사드 뒤가 아니라
  `src/channels/message/*`에 직접 존재합니다
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`).
- **범용 `ChannelMessage` / `MessageTarget` / `MessageRelation`
  정규화 메시지 타입이 없습니다.** 코어는 `kind: "reply" |
"followup" | "broadcast" | "system"` 관계를 갖는 하나의 플랫폼 중립적 메시지 구조
  대신, 여전히 구체적인 응답 페이로드(`ReplyPayload`)와 채널별 컨텍스트를 전송
  어댑터에 전달합니다.
- **확인 처리 정책 이름이 구상과 다릅니다.** 출시된 이름:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  원래 구상에서는 Webhook 시간 초과 사유 필드가 있는 `immediate | after-record |
after-durable-send | manual`을 사용했지만, 해당 구조는 구현되지 않았습니다.
- **`DurableFinalDeliveryRequirementMap` 기능 키가 구상된
  `MessageCapabilities` 객체를 대체했습니다.** 기능은 중첩된
  `text.chunking` / `attachments.voice` 방식 구조가 아니라 `text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit` 같은 평면 불리언 플래그이며,
  `verifyDurableFinalCapabilityProofs`를 통해 검증됩니다.

## 구체적인 마이그레이션 위험 요소(여전히 관련 있음)

이러한 채널별 부수 효과는 리팩터링 이전부터 존재했으며 새로운 전송 경로에서도 계속
작동해야 합니다. 이는 가정이 아닙니다. 각각 현재 구현되어 있으며 핵심 동작을 지탱합니다.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): 모니터는 전송에 성공한 후 보낸 메시지를 에코
  캐시에 기록합니다. 내구성 있는 최종 전송에서도 이 캐시를 계속 채워야 합니다.
  그렇지 않으면 OpenClaw가 자체 응답을 수신 사용자 메시지로 다시 수집할 수 있습니다.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): 선택적 모델 서명을
  추가하고 그룹 응답 후 참여한 스레드를 기록합니다. 내구성 있는
  전달에서 이러한 효과를 우회해서는 안 됩니다.
- **Discord 및 기타 준비된 디스패처**는 이미 직접 전달과
  미리보기 동작을 담당합니다. 준비된 디스패처가 최종 메시지를 전송 컨텍스트를 통해
  전달하도록 명시적으로 라우팅해야만 해당 채널이 종단 간 내구성을 갖습니다. 일반 어댑터만으로
  적용 범위가 확보된다고 가정하지 마십시오.
- **Telegram 무음 폴백 전달**은 청킹/폴백
  프로젝션 후 첫 번째 페이로드만이 아니라 프로젝션된 페이로드 배열 전체를 전달해야 합니다.
- **LINE, Zalo, Nostr** 및 이와 유사한 헬퍼 경로에는 응답 토큰
  처리, 미디어 프록시, 보낸 메시지 캐시 또는 콜백 전용 대상이 있을 수 있습니다.
  이러한 의미 체계가 전송 어댑터에 반영되고 테스트로 검증될 때까지는
  채널 소유 전달 방식을 유지합니다.
- **직접 DM 헬퍼**에는 유일하게 올바른 전송 대상인 응답 콜백이 있을 수
  있습니다. 일반 아웃바운드는 원시 플랫폼 필드에서 대상을 추측하여
  해당 콜백을 건너뛰어서는 안 됩니다.

## 실패 분류

어댑터는 전송 실패를 `DeliveryFailureKind` 형식의 폐쇄형
범주(일시적 오류, 속도 제한, 인증, 권한, 찾을 수 없음, 잘못된
페이로드, 충돌, 취소됨, 알 수 없음)로 분류합니다. 코어 정책은 다음과 같습니다.

- 일시적 오류와 속도 제한 오류는 재시도합니다.
- 렌더링 폴백이 없는 한 잘못된 페이로드 오류는 재시도하지 않습니다.
- 구성이 변경될 때까지 인증 또는 권한 오류는 재시도하지 않습니다.
- 찾을 수 없음 오류가 발생하면 채널이 안전하다고 선언한 경우 실시간 최종화가
  편집에서 새 전송으로 폴백하도록 합니다.
- 충돌 발생 시 수신 확인/멱등성 상태를 사용하여 메시지가
  이미 존재하는지 판단합니다.
- 플랫폼 호출은 성공했을 수 있지만 수신 확인을
  커밋하기 전에 발생한 모든 오류는 어댑터가 플랫폼 작업이 수행되지 않았음을
  입증하지 않는 한 `unknown_after_send`가 됩니다.

## 미결 사항

- Telegram이 언젠가 grammY (`1.43.0`) 폴링
  러너를 OpenClaw의 영속적 재시작 워터마크
  (`safeCompletedUpdateId`)뿐만 아니라 플랫폼 수준의 재전달까지 제어하는 완전한 내구성 폴링 소스로
  교체해야 하는지 여부.
- 실시간 미리보기 상태를 최종 전송
  의도와 동일한 레코드에 저장할지, 별도의 실시간 상태 저장소에 저장할지 여부.
- 봇이 활성화된 공유 대화방에서 Gateway 장애 시 에코 억제에
  원래 계획했던 출처 태그 메커니즘이 필요한지, 더 단순한 채널별
  계약이면 충분한지, 아니면 범위 밖인지 여부.
- 봇 간 에코
  억제를 위해 네이티브 출처/메타데이터를 지원하는 채널과 영속적 아웃바운드 레지스트리가 필요한 채널의 구분.

## 관련 항목

- [메시지](/ko/concepts/messages)
- [스트리밍 및 청킹](/ko/concepts/streaming)
- [진행 상황 초안](/ko/concepts/progress-drafts)
- [재시도 정책](/ko/concepts/retry)
- [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)
- [채널 인바운드 API](/ko/plugins/sdk-channel-inbound)
