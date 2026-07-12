---
read_when:
    - 메시징 채널 Plugin의 수신 경로를 구축하거나 리팩터링하고 있습니다
    - 공유 인바운드 컨텍스트 구성, 세션 기록 또는 준비된 응답 디스패치가 필요합니다.
    - 기존 채널 턴 도우미를 인바운드/메시지 API로 마이그레이션하고 있습니다
summary: '채널 Plugin용 인바운드 이벤트 헬퍼: 컨텍스트 구성, 공유 실행기 오케스트레이션, 세션 레코드 및 준비된 응답 디스패치'
title: 채널 인바운드 API
x-i18n:
    generated_at: "2026-07-12T15:31:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

채널 수신 경로는 하나의 흐름을 따릅니다.

```text
플랫폼 이벤트 -> 인바운드 정보/컨텍스트 -> 에이전트 응답 -> 메시지 전달
```

인바운드 이벤트 정규화, 형식 지정, 루트, 오케스트레이션에는 `openclaw/plugin-sdk/channel-inbound`를 사용합니다.
네이티브 전송, 수신 확인, 내구성 있는 전달, 실시간 미리보기 동작에는
`openclaw/plugin-sdk/channel-outbound`를 사용합니다.

## 핵심 헬퍼

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: 정규화된 채널 정보를
  프롬프트/세션 컨텍스트로 투영합니다. 채널이 소유한 발신자/채팅 메타데이터는
  `channelContext`를 통해 전달하며, Plugin 훅에서는 이를 `ctx.channelContext`로 확인합니다.
  채널별 필드가 필요하면 이 하위 경로의 `PluginHookChannelSenderContext` 또는
  `PluginHookChannelChatContext`를 확장하십시오.
- `runChannelInboundEvent(...)`: 하나의 인바운드 플랫폼 이벤트에 대해 수집, 분류,
  사전 점검, 확인, 기록, 디스패치, 마무리를 실행합니다.
- `dispatchChannelInboundReply(...)`: 이미 구성된 인바운드 응답을 기록하고
  전달 어댑터를 사용하여 디스패치합니다.

주입된 Plugin 런타임 객체를 이미 받는 번들/네이티브 채널은
이 하위 경로를 직접 가져오는 대신 `runtime.channel.inbound.*` 아래의
동일한 헬퍼를 호출할 수 있습니다.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

플랫폼 전달을 전달 어댑터에 유지하는 호환성 디스패처에는
`dispatchChannelInboundReply(...)` 입력을 구성하십시오. 새로운 전송 경로에서는
대신 `channel-outbound`의 메시지 어댑터와 내구성 있는 메시지 헬퍼를
사용해야 합니다.

## 마이그레이션

`runtime.channel.turn.*` 런타임 별칭은 제거되었습니다. 다음을 사용하십시오.

- 원시 인바운드 이벤트에는 `runtime.channel.inbound.run(...)`을 사용합니다.
- 구성된 응답 컨텍스트에는 `runtime.channel.inbound.dispatchReply(...)`를 사용합니다.
- 인바운드 컨텍스트 페이로드에는 `runtime.channel.inbound.buildContext(...)`를 사용합니다.
- 더 이상 사용되지 않는 `runtime.channel.inbound.runPreparedReply(...)`는 자체
  디스패치 클로저를 이미 구성하는 채널 소유의 준비된 디스패치 경로에만 사용합니다.

새 Plugin 코드에는 `turn`이라는 이름의 채널 API를 도입하지 마십시오. 모델 또는
에이전트 턴 용어는 에이전트/제공자 코드 내부에서만 사용하고, 채널 Plugin에서는 인바운드,
메시지, 전달, 응답이라는 용어를 사용합니다.
