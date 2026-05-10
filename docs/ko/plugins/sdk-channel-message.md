---
read_when:
    - 메시징 채널 Plugin을 만들거나 리팩터링하고 있습니다
    - 지속성이 보장되는 최종 응답 전달, 수신 확인, 라이브 미리보기 확정 또는 수신 승인 정책이 필요한 경우
    - 레거시 응답 파이프라인 또는 인바운드 응답 디스패치 헬퍼에서 마이그레이션하는 경우
summary: '메시지 수명 주기 API: 채널 Plugin의 내구성 있는 전송, 수신 확인, 실시간 미리보기, 수신 확인 응답 정책, 레거시 마이그레이션 포함'
title: 채널 메시지 API
x-i18n:
    generated_at: "2026-05-10T19:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
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

`channel-message` 하위 경로는 `channel.ts` 같은 핫 Plugin 부트스트랩 파일에서도 충분히 가볍도록 의도되었습니다. 이 경로는 아웃바운드 전달을 로드하지 않고 어댑터 계약, 기능 증명, 수신 확인, 호환성 파사드를 노출합니다. 런타임 전달 헬퍼는 이미 비동기 메시지 I/O를 수행하는 모니터/send 코드 경로를 위해 `openclaw/plugin-sdk/channel-message-runtime`에서 사용할 수 있습니다.

새 채널 및 Plugin send 코드는 `openclaw/plugin-sdk/channel-message-runtime`의 메시지 수명 주기 헬퍼인 `sendDurableMessageBatch`, `withDurableMessageSendContext`, 또는 `deliverInboundReplyWithMessageSendContext`를 사용해야 합니다. `openclaw/plugin-sdk/outbound-runtime`의 이전 `deliverOutboundPayloads(...)` 헬퍼는 아웃바운드 내부, 복구, 레거시 어댑터를 위한 사용 중단된 호환성/런타임 기반입니다. 새 채널 또는 Plugin send 경로에는 사용하지 마세요.

`sendDurableMessageBatch(...)`는 명시적인 수명 주기 결과를 반환합니다.

- `sent` - 하나 이상의 보이는 플랫폼 메시지가 전달되었습니다.
- `suppressed` - 플랫폼 메시지가 누락된 것으로 처리되면 안 됩니다. 안정적인 이유에는 `cancelled_by_message_sending_hook`, `empty_after_message_sending_hook`, `no_visible_payload`, `adapter_returned_no_identity`, 레거시 `no_visible_result`가 포함됩니다.
- `partial_failed` - 이후 payload 또는 부수 효과가 실패하기 전에 하나 이상의 플랫폼 메시지가 전달되었습니다. 결과에는 전달된 수신 확인 접두사와 실패가 포함됩니다.
- `failed` - 플랫폼 수신 확인이 생성되지 않았습니다.

배치에 전송됨, 억제됨, 실패한 payload가 섞여 있으면 `payloadOutcomes`를 사용하세요. 이전 직접 전달 배열이 비어 있는지 확인해 훅 취소를 추론하지 마세요.

아직 버퍼링된 답장 디스패처가 필요한 호환성 디스패처는 `openclaw/plugin-sdk/channel-message`의 `createChannelMessageReplyPipeline(...)`로 답장 접두사 옵션을 만든 다음, 런타임의 `channel.turn.runPrepared(...)`를 호출해야 합니다. 이렇게 하면 또 다른 공개 turn 래퍼를 추가하지 않고도 세션 기록과 디스패치 순서를 공유 turn 수명 주기에 유지할 수 있습니다.

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

그런 다음 채널 Plugin에 연결하세요.

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

## 아웃바운드 브리지

채널에 이미 호환되는 `outbound` 어댑터가 있다면 send 코드를 중복하지 말고 메시지 어댑터를 파생하는 것을 선호하세요.

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

브리지는 이전 아웃바운드 send 결과를 `MessageReceipt` 값으로 변환합니다. 새 코드는 수신 확인을 끝까지 전달하고, 호환성 경계에서만 `listMessageReceiptPlatformIds(...)` 또는 `resolveMessageReceiptPrimaryId(...)`로 레거시 ID를 파생해야 합니다.
수신 정책이 제공되지 않으면 `createChannelMessageAdapterFromOutbound(...)`는 `manual` 수신 승인 정책을 사용합니다. 이렇게 하면 일반 수신 컨텍스트 밖에서 Webhook, 소켓, 폴링 오프셋을 승인하는 채널을 변경하지 않고도 Plugin 소유 플랫폼 승인이 명시적이 됩니다.

## 메시지 도구 전송

공유 `message(action="send")` 경로는 최종 답장과 동일한 코어 전달 수명 주기를 사용해야 합니다. 채널이 도구 send에 대해 제공자별 형태 조정이 필요하다면 `actions.handleAction(...)`에서 직접 보내지 말고 `actions.prepareSendPayload(...)`를 구현하세요.

`prepareSendPayload(...)`는 정규화된 코어 `ReplyPayload`와 전체 작업 컨텍스트를 받습니다. `payload.channelData.<channel>`에 채널별 데이터가 포함된 payload를 반환하고, 코어가 `sendMessage(...)`, 메시지 수명 주기 런타임, write-ahead 큐, 메시지 전송 훅, 재시도, 복구, ack 정리를 호출하게 하세요. 수명 주기 런타임은 내부적으로 호환성 기반으로 `deliverOutboundPayloads(...)`를 호출할 수 있지만, 채널 Plugin은 새 send 동작을 위해 직접 호출해서는 안 됩니다.

send를 내구성 있는 payload로 표현할 수 없는 경우에만 `null`을 반환하세요. 예를 들어 직렬화할 수 없는 컴포넌트 팩터리가 포함된 경우입니다. 코어는 호환성을 위해 레거시 Plugin 작업 폴백을 유지하지만, 새 채널 send 기능은 내구성 있는 payload 데이터로 표현할 수 있어야 합니다.

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

그런 다음 아웃바운드 어댑터는 `sendPayload` 내부에서 `payload.channelData.demo`를 읽습니다. 이렇게 하면 플랫폼별 렌더링은 Plugin에 유지하면서도 코어가 여전히 지속, 재시도, 복구, 훅, ack를 소유합니다.

준비된 `message(action="send")` payload와 일반 최종 답장 전달은 기본적으로 최선 노력 큐잉을 사용하는 코어 전달을 사용합니다. 필수 내구성 큐잉은 코어가 충돌 후 결과를 알 수 없는 send를 채널이 조정할 수 있음을 검증한 뒤에만 유효합니다. 어댑터가 `reconcileUnknownSend`를 구현할 수 없다면 준비된 send 경로를 최선 노력으로 유지하세요. 코어는 여전히 write-ahead 큐를 시도하지만, 큐 지속성이나 불확실한 충돌 복구는 필수 전달 계약의 일부가 아닙니다.

## 내구성 있는 최종 기능

내구성 있는 최종 전달은 부수 효과별로 옵트인됩니다. 코어는 어댑터가 payload와 전달 옵션에 필요한 모든 기능을 선언한 경우에만 일반 내구성 전달을 사용합니다.

| 기능                   | 선언 시점                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | 어댑터가 텍스트를 보내고 수신 확인을 반환할 수 있습니다.                            |
| `media`                | 미디어 send가 모든 보이는 플랫폼 메시지에 대한 수신 확인을 반환합니다.              |
| `payload`              | 어댑터가 텍스트와 하나의 미디어 URL만이 아니라 풍부한 답장 payload 의미 체계를 보존합니다. |
| `replyTo`              | 네이티브 답장 대상이 플랫폼에 도달합니다.                                             |
| `thread`               | 네이티브 스레드, 주제 또는 채널 스레드 대상이 플랫폼에 도달합니다.                  |
| `silent`               | 알림 억제가 플랫폼에 도달합니다.                                                     |
| `nativeQuote`          | 선택된 인용 메타데이터가 플랫폼에 도달합니다.                                        |
| `messageSendingHooks`  | 코어 메시지 전송 훅이 플랫폼 I/O 전에 콘텐츠를 취소하거나 다시 작성할 수 있습니다.  |
| `batch`                | 여러 부분으로 렌더링된 배치를 하나의 내구성 있는 계획으로 재생할 수 있습니다.       |
| `reconcileUnknownSend` | 어댑터가 블라인드 재생 없이 `unknown_after_send` 복구를 해결할 수 있습니다.          |
| `afterSendSuccess`     | 채널 로컬 after-send 부수 효과가 한 번 실행됩니다.                                  |
| `afterCommit`          | 채널 로컬 after-commit 부수 효과가 한 번 실행됩니다.                                |

최선 노력 최종 전달에는 `reconcileUnknownSend`가 필요하지 않습니다. 어댑터가 payload의 보이는 의미 체계를 보존할 때 공유 수명 주기를 사용하고, 큐 지속성을 사용할 수 없으면 직접 플랫폼 I/O로 폴백합니다. 필수 내구성 최종 전달은 `reconcileUnknownSend`를 명시적으로 요구해야 합니다. 어댑터가 시작되었거나 알 수 없는 send가 플랫폼에 도달했는지 확인할 수 없다면 해당 기능을 선언하지 마세요. 코어는 큐잉 전에 필수 내구성 전달을 거부합니다.

호출자가 내구성 있는 전달이 필요할 때는 직접 맵을 만들지 말고 요구 사항을 파생하세요.

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

`messageSendingHooks`는 기본적으로 필요합니다. 전역 메시지 전송 훅을 의도적으로 실행할 수 없는 경로에만 `messageSendingHooks: false`를 설정하세요.

## 내구성 있는 send 계약

내구성 있는 최종 send는 레거시 채널 소유 전달보다 더 엄격한 의미 체계를 가집니다.

- 플랫폼 I/O 전에 내구성 있는 의도를 생성합니다.
- 내구성 있는 전달이 처리된 결과를 반환하면 레거시 send로 폴백하지 않습니다.
- 훅 취소와 no-send 결과를 종료 상태로 처리합니다.
- `unsupported`는 pre-intent 결과로만 처리합니다.
- 필수 내구성의 경우, 큐가 플랫폼 send가 시작되었음을 기록할 수 없으면 플랫폼 I/O 전에 실패합니다.
- 필수 최종 전달과 필수 준비된 메시지 도구 send의 경우 `reconcileUnknownSend`를 사전 점검합니다. 복구는 이미 전송된 메시지를 ack할 수 있거나, 어댑터가 원래 send가 발생하지 않았음을 증명한 뒤에만 재생할 수 있어야 합니다.
- `best_effort`의 경우 큐 쓰기 실패는 직접 플랫폼 I/O로 폴백할 수 있습니다.
- 중단 신호를 미디어 로딩과 플랫폼 send에 전달합니다.
- 큐 ack 후 after-commit 훅을 실행합니다. 직접 최선 노력 폴백은 내구성 있는 큐 commit이 없으므로 성공적인 플랫폼 I/O 후에 이를 실행합니다.
- 보이는 모든 플랫폼 메시지 ID에 대해 수신 확인을 반환합니다.
- 플랫폼이 불확실한 send가 이미 사용자에게 도달했는지 확인할 수 있을 때 `reconcileUnknownSend`를 사용합니다.

이 계약은 충돌 후 중복 send를 방지하고 메시지 전송 취소 훅 우회를 방지합니다.

## 수신 확인

`MessageReceipt`는 플랫폼이 수락한 내용을 나타내는 새 내부 기록입니다:

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

기존 전송 결과를 어댑트할 때는 `createMessageReceiptFromOutboundResults(...)`를 사용하세요. 실시간 미리 보기 메시지가 최종 수신 정보가 될 때는 `createPreviewMessageReceipt(...)`를 사용하세요. 새로운 소유자 로컬 `messageIds` 필드를 추가하지 마세요. 레거시 `ChannelDeliveryResult.messageIds`는 호환성 경계에서 여전히 생성됩니다.

## 실시간 미리 보기

초안 미리 보기나 진행 상황 업데이트를 스트리밍하는 채널은 실시간 기능을 선언해야 합니다.

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

런타임 최종화에는 `defineFinalizableLivePreviewAdapter(...)`와 `deliverWithFinalizableLivePreviewAdapter(...)`를 사용하세요. 최종화기는 최종 답장이 미리 보기를 제자리에서 편집할지, 일반 폴백을 보낼지, 보류 중인 미리 보기 상태를 폐기할지, 메시지를 중복하지 않고 모호하게 실패한 편집을 유지할지 결정하고 최종 수신 정보를 반환합니다.

## 수신 확인 정책

플랫폼 확인 시점을 제어하는 인바운드 수신기는 수신 정책을 선언해야 합니다.

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

수신 정책을 선언하지 않는 어댑터의 기본값은 다음과 같습니다.

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

플랫폼에 지연할 확인이 없거나, 비동기 처리 전에 이미 확인하거나, 프로토콜별 응답 의미론이 필요한 경우 기본값을 사용하세요. 수신기가 실제로 수신 컨텍스트를 사용해 플랫폼 확인을 나중으로 미루는 경우에만 단계별 정책 중 하나를 선언하세요.

정책:

| 정책                   | 사용 시점                                                                 |
| ---------------------- | ------------------------------------------------------------------------- |
| `after_receive_record` | 인바운드 이벤트가 파싱되고 기록된 뒤 플랫폼에 확인할 수 있습니다.         |
| `after_agent_dispatch` | 에이전트 디스패치가 수락될 때까지 플랫폼이 기다려야 합니다.              |
| `after_durable_send`   | 최종 전달에 내구성 있는 결정이 내려질 때까지 플랫폼이 기다려야 합니다.   |
| `manual`               | 플랫폼 의미론이 일반 단계와 맞지 않아 Plugin이 확인을 소유합니다.         |

확인 상태를 지연하는 수신기에서는 `createMessageReceiveContext(...)`를 사용하고, 한 단계가 구성된 정책을 충족했는지 수신기가 테스트해야 할 때는 `shouldAckMessageAfterStage(...)`를 사용하세요.

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

어댑터가 해당 기능을 선언하는 경우 실시간 및 수신 증명 스위트를 추가하세요. 누락된 증명은 내구성 있는 표면을 조용히 넓히는 대신 테스트를 실패시켜야 합니다.

## 사용 중단된 호환성 API

이 API들은 서드파티 호환성을 위해 계속 import할 수 있습니다. 새 채널 코드에는 사용하지 마세요.

| 사용 중단된 API                              | 대체 항목                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                       |
| `createChannelTurnReplyPipeline(...)`        | 호환성 디스패처에는 `createChannelMessageReplyPipeline(...)`, 새 채널 코드에는 `message` 어댑터                            |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)`와 `channel.turn.runPrepared(...)`, 또는 새 채널 코드에는 `message` 어댑터          |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)`와 `channel.turn.runPrepared(...)`, 또는 새 채널 코드에는 `message` 어댑터          |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)`와 `channel.turn.runPrepared(...)`, 또는 새 채널 코드에는 `message` 어댑터          |
| `deliverOutboundPayloads(...)`               | `channel-message-runtime`의 `sendDurableMessageBatch(...)` 또는 `deliverInboundReplyWithMessageSendContext(...)`            |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime`의 `deliverInboundReplyWithMessageSendContext(...)`                            |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)`와 `channel.turn.runPrepared(...)`, 또는 새 채널 코드에는 `message` 어댑터          |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)`와 `channel.turn.runPrepared(...)`, 또는 새 채널 코드에는 `message` 어댑터          |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                         |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)`와 `deliverWithFinalizableLivePreviewAdapter(...)`                                |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                 |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                                |

호환성 디스패처는 메시지 파사드를 통해 `createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)`, `createTypingCallbacks(...)`를 계속 사용할 수 있습니다. 새 수명 주기 코드는 기존 `channel-reply-pipeline` 하위 경로를 피해야 합니다.

## 마이그레이션 체크리스트

1. 채널 Plugin에 `message: defineChannelMessageAdapter(...)` 또는 `message: createChannelMessageAdapterFromOutbound(...)`를 추가합니다.
2. 텍스트, 미디어, 페이로드 전송에서 `MessageReceipt`를 반환합니다.
3. 네이티브 동작과 테스트로 뒷받침되는 기능만 선언합니다.
4. 손으로 작성한 내구성 요구 사항 맵을 `deriveDurableFinalDeliveryRequirements(...)`로 교체합니다.
5. 채널이 초안 메시지를 제자리에서 편집하는 경우 실시간 미리 보기 헬퍼를 통해 미리 보기 최종화를 이동합니다.
6. 수신기가 실제로 플랫폼 확인을 지연할 수 있는 경우에만 수신 확인 정책을 선언합니다.
7. 레거시 답장 디스패치 헬퍼는 호환성 경계에서만 유지합니다.
