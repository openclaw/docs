---
read_when:
    - 메시징 채널 Plugin의 전송 경로를 구축하거나 리팩터링하고 있습니다
    - 지속성 있는 최종 답변 전달, 수신 확인, 실시간 미리보기 확정 또는 수신 확인 정책이 필요합니다.
    - channel-message, channel-message-runtime 또는 레거시 응답 디스패치 헬퍼에서 마이그레이션하고 있습니다
summary: '채널 플러그인용 아웃바운드 메시지 수명 주기 API: 어댑터, 수신 확인, 영구 전송, 실시간 미리보기 및 답장 파이프라인 헬퍼'
title: 채널 아웃바운드 API
x-i18n:
    generated_at: "2026-07-12T15:31:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

채널 Plugin은
`openclaw/plugin-sdk/channel-outbound`에서 발신 메시지 동작을 노출합니다. 수신/컨텍스트/디스패치
오케스트레이션에는 `openclaw/plugin-sdk/channel-inbound`를 사용하십시오.

코어는 큐잉, 내구성, 일반 재시도 정책, 훅, 수신 확인 및
공유 `message` 도구를 담당합니다. Plugin은 네이티브 전송/편집/삭제 호출,
대상 정규화, 플랫폼 스레딩, 선택된 인용문, 알림
플래그, 계정 상태 및 플랫폼별 부수 효과를 담당합니다.

## 어댑터

대부분의 Plugin은 하나의 `message` 어댑터를 정의합니다.

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

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

네이티브 전송 계층이 실제로 보존하는 기능만 선언하십시오. 선언한 각
전송, 수신 확인, 실시간 미리 보기 및 수신 확인 응답 기능을 이 하위 경로에서
내보낸 계약 도우미로 검증하십시오.

## 일반 텍스트 정리

발신 어댑터에서 지원되는 HTML 서식 태그를 가벼운 텍스트 마크업으로
변환해야 할 때 `sanitizeForPlainText(...)`를 사용하십시오. 기본값은 기존
채팅 스타일의 굵게 및 취소선 마커를 유지합니다. 채널이 결과를 Markdown으로
다시 파싱하는 경우에만 `{ style: "markdown" }`을 전달하십시오.

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown 스타일은 `**bold**`와 `~~strikethrough~~`를 사용하며, 두 스타일 모두
기울임꼴과 인라인 코드는 `_italic_` 및 백틱 마커를 유지합니다. 정리 후 마커
텍스트를 다시 작성하지 말고 채널 경계에서 스타일을 선택하십시오.

## 전달 증거

`MessageReceipt`는 채널 어댑터가 반환한 결과를 기록합니다. 구체적인
플랫폼 메시지 식별자는 플랫폼 전송 경로가 메시지를 수락했음을 나타내지만,
수신자의 기기에 메시지가 표시되었거나 수신자가 읽었다는 것을 증명하지는
않습니다. 플랫폼 메시지 식별자가 없는 수신 확인은 로컬 수신 확인 메타데이터일
뿐입니다. 읽음 확인 또는 기기 전달 상태를 지원하는 채널은 이러한 사실을
별도의 채널별 경로를 통해 추적해야 합니다.

채널 어댑터가 실패를 재시도해도 수신자에게 표시되는 전송이 중복될 수 없고
최종화 가능한 호출이 시작되지 않았음을 증명할 수 있다면,
`openclaw/plugin-sdk/error-runtime`에서
`new PlatformMessageNotDispatchedError("...", { cause: error })`를 throw하십시오.
그러면 코어는 오래된 전송 시도 증거를 지우고 큐에 저장된 의도를 안전하게
재시도할 수 있습니다. 최종 디스패치 경계를 소유한 어댑터만 이 사실을
단언할 수 있습니다. 최종화/전송 호출이 시작된 후 또는 모호한 결과를 반환한
후에는 이 마커를 절대 사용하지 마십시오. 잘못 표시하면 메시지가 중복될 수
있습니다.

## 기존 발신 어댑터

채널에 이미 호환되는 `outbound` 어댑터가 있다면 전송 코드를 중복하지 말고
메시지 어댑터를 파생하십시오.

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## 내구성 있는 전송

런타임 전송 도우미도 `channel-outbound`에 있습니다.

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- `resolveChannelDraftStreamingChunking(...)` 등의 초안 스트리밍/진행률 도우미

`sendDurableMessageBatch(...)`는 다음 중 하나의 명시적 결과를 반환합니다.

| 결과             | 의미                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| `sent`           | 표시되는 플랫폼 메시지가 하나 이상 플랫폼 전송 경로에서 수락됨                      |
| `suppressed`     | 누락된 것으로 처리해야 할 플랫폼 메시지가 없음                                      |
| `partial_failed` | 이후 페이로드 또는 부수 효과가 실패하기 전에 플랫폼 메시지가 하나 이상 수락됨       |
| `failed`         | 플랫폼 수신 확인이 생성되지 않음                                                     |

배치에 전송, 억제 및 실패한 페이로드가 혼합되어 있으면
`payloadOutcomes`를 사용하십시오. 비어 있는 레거시 직접 전달 결과로 훅 취소를
추론하지 마십시오.

## 지연 전달 허용

확인된 계정이 코어에서 관리하는 발신 또는 지연 전달을 안전하게 수락할 수
없을 때 `message.durableFinal.admitDeferredDelivery(...)`를 사용하십시오.
코어는 큐 지속성을 건너뛰는 경로를 포함해 실시간 발신 작업 전에 이 훅을
동기적으로 호출하고, 복구된 의도를 재생하기 전에도 다시 호출합니다. 컨텍스트에는
`cfg`, `channel`, `to`, `accountId` 및 `live` 또는 `recovery`인 `phase`가
포함됩니다.

계속하려면 `{ status: "allowed" }`를 반환하십시오. 전달을 지속하거나 직접
전송하거나 재생해서는 안 되는 경우
`{ status: "permanent_rejection", reason }`을 반환하십시오. 실시간 거부는 큐
생성, 메시지 훅 또는 플랫폼 작업 전에 실패합니다. 복구 거부는 큐 레코드를
실패로 표시하고 조정 및 재생을 건너뜁니다. 훅을 생략하면 허용된 것으로
간주합니다.

이 훅은 동기식 허용 결정이며 전송 경로가 아닙니다. 이미 로드된 구성 또는
런타임 상태만 읽고, 네트워크, 파일 시스템 또는 기타 비동기 I/O를 수행하지
마십시오. 계약 테스트에서는 `openclaw/plugin-sdk/channel-outbound`의
`ChannelMessageDurableFinalAdapter`를 통해 두 단계와 두 결과 변형을 모두
검증해야 합니다.

## 호환성 디스패치

`channel-inbound`의 `dispatchChannelInboundReply(...)`를 통해 수신 답장
디스패치를 구성하십시오. 플랫폼 전달은 전달 어댑터에 유지하고, 메시지 어댑터,
내구성 있는 전송, 수신 확인, 실시간 미리 보기 및 답장 파이프라인 옵션에는
`channel-outbound`를 사용하십시오.
