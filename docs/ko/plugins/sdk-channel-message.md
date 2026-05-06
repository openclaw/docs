---
read_when:
    - 메시징 채널 Plugin을 구축하거나 리팩터링하고 있습니다
    - 내구성 있는 최종 답변 전달, 수신 확인, 실시간 미리보기 최종화 또는 수신 승인 정책이 필요합니다
    - 레거시 답장 파이프라인 또는 인바운드 답장 디스패치 헬퍼에서 마이그레이션하는 중입니다
summary: 채널 Plugin용 메시지 수명 주기 API로, 영속적 전송, 수신 확인, 실시간 미리보기, 수신 확인 응답 정책 및 레거시 마이그레이션을 포함합니다
title: 채널 메시지 API
x-i18n:
    generated_at: "2026-05-06T06:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

채널 Plugin은 `openclaw/plugin-sdk/channel-message`에서 하나의 `message` 어댑터를 노출해야 합니다. 이 어댑터는 플랫폼이 지원하는 네이티브 메시지 수명 주기를 설명합니다.

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

코어는 큐잉, 내구성, 일반 재시도 정책, 훅, 수신 확인, 공유 `message` 도구를 소유합니다. Plugin은 네이티브 send/edit/delete 호출, 대상 정규화, 플랫폼 스레딩, 선택된 인용, 알림 플래그, 계정 상태, 플랫폼별 부수 효과를 소유합니다.

이 페이지는 [채널 Plugin 빌드](/ko/plugins/sdk-channel-plugins)와 함께 사용하세요.

`channel-message` 하위 경로는 `channel.ts` 같은 핫 Plugin 부트스트랩 파일에서 사용할 수 있을 만큼 의도적으로 가볍습니다. outbound 전달을 로드하지 않고 어댑터 계약, 기능 증명, 수신 확인, 호환성 파사드를 노출합니다. 이미 비동기 메시지 I/O를 수행하는 monitor/send 코드 경로에서는 `openclaw/plugin-sdk/channel-message-runtime`에서 런타임 전달 헬퍼를 사용할 수 있습니다.

## 최소 어댑터

대부분의 새 채널 Plugin은 작은 어댑터로 시작할 수 있습니다.

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

그런 다음 채널 Plugin에 연결합니다.

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

어댑터가 실제로 보존하는 기능만 선언하세요. 선언된 모든 기능에는 계약 테스트가 있어야 합니다.

## Outbound 브리지

채널에 이미 호환되는 `outbound` 어댑터가 있다면, 전송 코드를 중복하지 말고 메시지 어댑터를 파생하는 방식을 선호하세요.

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

브리지는 기존 outbound 전송 결과를 `MessageReceipt` 값으로 변환합니다. 새 코드는 수신 확인을 끝까지 전달하고, 호환성 경계에서만 `listMessageReceiptPlatformIds(...)` 또는 `resolveMessageReceiptPrimaryId(...)`를 사용해 레거시 ID를 파생해야 합니다.
수신 정책이 제공되지 않으면 `createChannelMessageAdapterFromOutbound(...)`는 `manual` 수신 승인 정책을 사용합니다. 이렇게 하면 웹훅, 소켓, 폴링 오프셋을 일반 수신 컨텍스트 외부에서 승인하는 채널을 변경하지 않고도 Plugin 소유 플랫폼 승인을 명시적으로 만들 수 있습니다.

## 메시지 도구 전송

공유 `message(action="send")` 경로는 최종 답장과 동일한 코어 전달 수명 주기를 사용해야 합니다. 채널이 도구 전송을 위해 제공자별 shaping이 필요하다면 `actions.handleAction(...)`에서 직접 전송하지 말고 `actions.prepareSendPayload(...)`를 구현하세요.

`prepareSendPayload(...)`는 정규화된 코어 `ReplyPayload`와 전체 액션 컨텍스트를 받습니다. `payload.channelData.<channel>`에 채널별 데이터를 담은 페이로드를 반환하고, 코어가 `sendMessage(...)`, `deliverOutboundPayloads(...)`, write-ahead 큐, 메시지 전송 훅, 재시도, 복구, ack 정리를 호출하도록 하세요.

내구성 있는 페이로드로 표현할 수 없는 경우에만 `null`을 반환하세요. 예를 들어 직렬화할 수 없는 컴포넌트 팩토리가 포함된 경우입니다. 코어는 호환성을 위해 레거시 Plugin 액션 fallback을 유지하지만, 새 채널 전송 기능은 내구성 있는 페이로드 데이터로 표현할 수 있어야 합니다.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

그러면 outbound 어댑터는 `sendPayload` 안에서 `payload.channelData.demo`를 읽습니다. 이렇게 하면 플랫폼별 렌더링은 Plugin에 남기면서도, persist, retry, recover, hooks, ack는 여전히 코어가 소유합니다.

준비된 `message(action="send")` 페이로드와 일반 최종 답장 전달은 기본적으로 best-effort 큐잉을 사용하는 코어 전달을 사용합니다. 필수 내구성 큐잉은 코어가 채널이 충돌 후 결과를 알 수 없는 전송을 조정할 수 있음을 검증한 뒤에만 유효합니다. 어댑터가 `reconcileUnknownSend`를 구현할 수 없다면 준비된 전송 경로는 best-effort로 유지하세요. 코어는 여전히 write-ahead 큐를 시도하지만, 큐 영속성이나 불확실한 충돌 복구는 필수 전달 계약의 일부가 아닙니다.

## 내구성 있는 최종 기능

내구성 있는 최종 전달은 각 부수 효과별로 옵트인됩니다. 코어는 어댑터가 페이로드와 전달 옵션에 필요한 모든 기능을 선언한 경우에만 일반 내구성 전달을 사용합니다.

| 기능                   | 선언해야 하는 경우                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | 어댑터가 텍스트를 전송하고 수신 확인을 반환할 수 있습니다.                           |
| `media`                | 미디어 전송이 표시되는 모든 플랫폼 메시지에 대한 수신 확인을 반환합니다.             |
| `payload`              | 어댑터가 텍스트와 하나의 미디어 URL뿐 아니라 rich reply 페이로드 의미론을 보존합니다. |
| `replyTo`              | 네이티브 답장 대상이 플랫폼에 도달합니다.                                             |
| `thread`               | 네이티브 스레드, 주제 또는 채널 스레드 대상이 플랫폼에 도달합니다.                   |
| `silent`               | 알림 억제가 플랫폼에 도달합니다.                                                      |
| `nativeQuote`          | 선택된 인용 메타데이터가 플랫폼에 도달합니다.                                        |
| `messageSendingHooks`  | 코어 메시지 전송 훅이 플랫폼 I/O 전에 콘텐츠를 취소하거나 다시 작성할 수 있습니다.   |
| `batch`                | 여러 부분으로 렌더링된 배치를 하나의 내구성 있는 계획으로 재생할 수 있습니다.         |
| `reconcileUnknownSend` | 어댑터가 blind replay 없이 `unknown_after_send` 복구를 해결할 수 있습니다.           |
| `afterSendSuccess`     | 채널 로컬 after-send 부수 효과가 한 번 실행됩니다.                                   |
| `afterCommit`          | 채널 로컬 after-commit 부수 효과가 한 번 실행됩니다.                                 |

Best-effort 최종 전달에는 `reconcileUnknownSend`가 필요하지 않습니다. 어댑터가 페이로드의 표시 의미론을 보존할 때 공유 수명 주기를 사용하고, 큐 영속성을 사용할 수 없으면 직접 플랫폼 I/O로 fallback합니다. 필수 내구성 최종 전달은 `reconcileUnknownSend`를 명시적으로 요구해야 합니다. 어댑터가 시작되었지만 알 수 없는 전송이 플랫폼에 도달했는지 확인할 수 없다면 해당 기능을 선언하지 마세요. 코어는 큐잉 전에 필수 내구성 전달을 거부합니다.

호출자가 내구성 있는 전달이 필요할 때는 맵을 직접 만들지 말고 요구 사항을 파생하세요.

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks`는 기본적으로 필요합니다. 전역 메시지 전송 훅을 의도적으로 실행할 수 없는 경로에 대해서만 `messageSendingHooks: false`를 설정하세요.

## 내구성 있는 전송 계약

내구성 있는 최종 전송은 레거시 채널 소유 전달보다 더 엄격한 의미론을 가집니다.

- 플랫폼 I/O 전에 내구성 있는 intent를 생성합니다.
- 내구성 있는 전달이 처리된 결과를 반환하면 레거시 전송으로 fallback하지 않습니다.
- 훅 취소와 no-send 결과를 terminal로 취급합니다.
- `unsupported`는 pre-intent 결과로만 취급합니다.
- 필수 내구성의 경우, 큐가 플랫폼 전송이 시작되었음을 기록할 수 없으면 플랫폼 I/O 전에 실패합니다.
- 필수 최종 전달과 필수 준비된 메시지 도구 전송의 경우 `reconcileUnknownSend`를 preflight합니다. 복구는 이미 전송된 메시지를 ack할 수 있거나, 어댑터가 원래 전송이 발생하지 않았음을 증명한 뒤에만 replay할 수 있어야 합니다.
- `best_effort`의 경우 큐 쓰기 실패가 직접 플랫폼 I/O로 fallback할 수 있습니다.
- abort signal을 미디어 로딩과 플랫폼 전송으로 전달합니다.
- queue ack 후 after-commit 훅을 실행합니다. 직접 best-effort fallback은 내구성 있는 큐 commit이 없기 때문에 성공적인 플랫폼 I/O 후에 이를 실행합니다.
- 표시되는 모든 플랫폼 메시지 ID에 대해 수신 확인을 반환합니다.
- 플랫폼이 불확실한 전송이 이미 사용자에게 도달했는지 확인할 수 있다면 `reconcileUnknownSend`를 사용합니다.

이 계약은 충돌 후 중복 전송을 방지하고 메시지 전송 취소 훅을 우회하지 않도록 합니다.

## 수신 확인

`MessageReceipt`는 플랫폼이 수락한 내용을 나타내는 새 내부 레코드입니다.

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

기존 전송 결과를 어댑트할 때는 `createMessageReceiptFromOutboundResults(...)`를 사용하세요. live preview 메시지가 최종 수신 확인이 될 때는 `createPreviewMessageReceipt(...)`를 사용하세요. 새 owner-local `messageIds` 필드를 추가하지 마세요. 레거시 `ChannelDeliveryResult.messageIds`는 여전히 호환성 경계에서 생성됩니다.

## Live preview

draft preview나 진행 업데이트를 스트리밍하는 채널은 live 기능을 선언해야 합니다.

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

런타임 finalization에는 `defineFinalizableLivePreviewAdapter(...)`와 `deliverWithFinalizableLivePreviewAdapter(...)`를 사용하세요. finalizer는 최종 답장이 preview를 제자리에서 편집할지, 일반 fallback을 보낼지, 대기 중인 preview 상태를 폐기할지, 모호하게 실패한 편집을 메시지 중복 없이 유지할지 결정하고 최종 수신 확인을 반환합니다.

## 수신 ack 정책

플랫폼 승인 타이밍을 제어하는 inbound receiver는 수신 정책을 선언해야 합니다.

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

수신 정책을 선언하지 않는 어댑터는 다음을 기본값으로 사용합니다.

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

플랫폼에 연기할 확인 응답이 없거나, 비동기 처리 전에 이미 확인 응답을 하거나, 프로토콜별 응답 의미가 필요한 경우 기본값을 사용하세요. 수신기가 실제로 수신 컨텍스트를 사용해 플랫폼 확인 응답을 나중으로 옮기는 경우에만 단계별 정책 중 하나를 선언하세요.

정책:

| 정책                   | 사용 시점                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `after_receive_record` | 인바운드 이벤트가 파싱되고 기록된 뒤 플랫폼에 확인 응답할 수 있습니다.                   |
| `after_agent_dispatch` | 에이전트 디스패치가 수락될 때까지 플랫폼이 기다려야 합니다.                              |
| `after_durable_send`   | 최종 전달에 지속성 있는 결정이 내려질 때까지 플랫폼이 기다려야 합니다.                   |
| `manual`               | 플랫폼 의미가 일반 단계와 맞지 않아 Plugin이 확인 응답을 소유합니다.                     |

ack 상태를 연기하는 수신기에서는 `createMessageReceiveContext(...)`를 사용하고, 단계가 구성된 정책을 충족했는지 수신기가 테스트해야 할 때는 `shouldAckMessageAfterStage(...)`를 사용하세요.

## 계약 테스트

기능 선언은 Plugin 계약의 일부입니다. 테스트로 뒷받침하세요.

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

어댑터가 해당 기능을 선언하는 경우 라이브 및 수신 증명 스위트를 추가하세요. 증명이 누락되면 지속성 있는 표면을 조용히 넓히는 대신 테스트가 실패해야 합니다.

## 사용 중단된 호환성 API

이 API들은 타사 호환성을 위해 계속 가져올 수 있습니다. 새 채널 코드에는 사용하지 마세요.

| 사용 중단된 API                              | 대체 항목                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                |
| `createChannelTurnReplyPipeline(...)`        | 호환성 디스패처에는 `createChannelMessageReplyPipeline(...)`, 새 채널 코드에는 `message` 어댑터                     |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime`의 `deliverInboundReplyWithMessageSendContext(...)`                     |
| `dispatchInboundReplyWithBase(...)`          | 호환성 디스패처에만 `dispatchChannelMessageReplyWithBase(...)`                                                       |
| `recordInboundSessionAndDispatchReply(...)`  | 호환성 디스패처에만 `recordChannelMessageReplyDispatch(...)`                                                         |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                  |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)`와 `deliverWithFinalizableLivePreviewAdapter(...)`                         |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                          |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                         |

호환성 디스패처는 메시지 파사드를 통해 계속 `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)`, `createTypingCallbacks(...)`를 사용할 수 있습니다. 새 수명 주기 코드는 이전 `channel-reply-pipeline` 하위 경로를 피해야 합니다.

## 마이그레이션 체크리스트

1. 채널 Plugin에 `message: defineChannelMessageAdapter(...)` 또는 `message: createChannelMessageAdapterFromOutbound(...)`를 추가합니다.
2. 텍스트, 미디어, 페이로드 전송에서 `MessageReceipt`를 반환합니다.
3. 네이티브 동작과 테스트로 뒷받침되는 기능만 선언합니다.
4. 직접 작성한 지속성 요구 사항 맵을 `deriveDurableFinalDeliveryRequirements(...)`로 교체합니다.
5. 채널이 초안 메시지를 제자리에서 편집하는 경우 라이브 미리보기 헬퍼를 통해 미리보기 최종화를 이동합니다.
6. 수신기가 실제로 플랫폼 확인 응답을 연기할 수 있는 경우에만 수신 ack 정책을 선언합니다.
7. 레거시 답장 디스패치 헬퍼는 호환성 경계에서만 유지합니다.
