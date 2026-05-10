---
read_when:
    - 메시징 채널 Plugin 빌드 또는 마이그레이션
    - 다이렉트 메시지 또는 그룹 허용 목록, 라우트 게이트, 명령 인증, 이벤트 인증 또는 멘션 활성화 변경
    - 채널 인그레스 수정 처리 또는 SDK 호환성 경계 검토
sidebarTitle: Channel Ingress
summary: 수신 메시지 권한 부여를 위한 실험적 채널 인그레스 API
title: 채널 인그레스 API
x-i18n:
    generated_at: "2026-05-10T19:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# 채널 인그레스 API

채널 인그레스는 인바운드 채널 이벤트를 위한 실험적 접근 제어 경계입니다. 수신 경로에는 `openclaw/plugin-sdk/channel-ingress-runtime`을 사용하세요. 기존 `openclaw/plugin-sdk/channel-ingress` 하위 경로는 서드파티 plugins를 위한 사용 중단된 호환성 파사드로 계속 내보내집니다.

Plugins는 플랫폼 정보와 부수 효과를 소유합니다. 코어는 일반 정책을 소유합니다: DM/그룹 허용 목록, 페어링 저장소 DM 항목, 라우트 게이트, 명령 게이트, 이벤트 인증, 멘션 활성화, 마스킹된 진단, 허용 판정.

## 런타임 리졸버

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

유효 허용 목록, 명령 소유자, 명령 그룹을 미리 계산하지 마세요. 리졸버는 원시 허용 목록, 저장소 콜백, 라우트 서술자, 접근 그룹, 정책, 대화 종류에서 이를 파생합니다.

## 결과

번들 plugins는 최신 프로젝션을 직접 사용해야 합니다.

- `ingress`: 순서가 지정된 게이트 결정 및 허용 판정
- `senderAccess`: 발신자/대화 권한 부여만
- `routeAccess`: 라우트 및 라우트 발신자 프로젝션
- `commandAccess`: 명령 권한 부여; 명령 게이트가 실행되지 않으면 false
- `activationAccess`: 멘션/활성화 결과

이벤트 권한 부여는 순서가 지정된 `ingress.graph`와 결정적인 `ingress.reasonCode`에서 계속 사용할 수 있습니다. 별도의 이벤트 프로젝션은 내보내지 않습니다.

사용 중단된 서드파티 SDK 헬퍼는 내부적으로 이전 형태를 다시 구성할 수 있습니다. 새 번들 수신 경로는 최신 결과를 로컬 DTO로 다시 변환하지 않아야 합니다.

## 접근 그룹

`accessGroup:<name>` 항목은 계속 마스킹됩니다. 코어는 정적 `message.senders` 그룹을 자체적으로 해석하고, 플랫폼 조회가 필요한 동적 그룹에 대해서만 `resolveAccessGroupMembership`을 호출합니다. 누락되었거나, 지원되지 않거나, 실패한 그룹은 닫힌 상태로 실패합니다.

## 이벤트 모드

| `authMode`       | 의미                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 일반 인바운드 발신자 게이트                      |
| `command`        | 콜백 또는 범위 지정 버튼을 위한 명령 게이트      |
| `origin-subject` | 행위자가 원본 메시지 주체와 일치해야 함          |
| `route-only`     | 라우트 범위의 신뢰된 이벤트에 대해서만 라우트 게이트 |
| `none`           | Plugin이 소유한 내부 이벤트는 공유 인증을 우회   |

반응, 버튼, 콜백, 네이티브 명령에는 `mayPair: false`를 사용하세요.

## 라우트 및 활성화

방, 토픽, 길드, 스레드 또는 중첩 라우트 정책에는 라우트 서술자를 사용하세요.

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Plugin에 여러 선택적 라우트 서술자가 있는 경우 `channelIngressRoutes(...)`를 사용하세요. 이 함수는 비활성화된 분기를 필터링하면서 라우트 정보를 일반적으로 유지하고 각 서술자의 `precedence`에 따라 정렬합니다.

멘션 게이팅은 활성화 게이트입니다. 멘션 누락은 `admission: "skip"`을 반환하므로 턴 커널은 관찰 전용 턴을 처리하지 않습니다. 대부분의 채널은 발신자 및 명령 게이트 이후에 활성화를 두어야 합니다. 공개 채팅 표면에서 발신자 허용 목록 노이즈보다 먼저 멘션되지 않은 트래픽을 조용히 처리해야 하는 경우, 텍스트 명령 우회가 비활성화되어 있을 때 `activation.order: "before-sender"`를 선택할 수 있습니다. 봇 스레드의 답장처럼 암시적 활성화가 있는 채널은 `activation.allowedImplicitMentionKinds`를 전달할 수 있습니다. 그러면 프로젝션된 `activationAccess.shouldBypassMention`이 명령 또는 암시적 활성화가 명시적 멘션을 우회했는지 보고합니다.

## 마스킹

원시 발신자 값과 원시 허용 목록 항목은 리졸버 입력으로만 사용됩니다. 해석된 상태, 결정, 진단, 스냅샷 또는 호환성 정보에 나타나서는 안 됩니다. 불투명한 주체 ID, 항목 ID, 라우트 ID, 진단 ID를 사용하세요.

## 검증

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
