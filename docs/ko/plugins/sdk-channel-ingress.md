---
read_when:
    - 메시징 채널 Plugin 구축 또는 마이그레이션
    - DM 또는 그룹 허용 목록, 라우팅 게이트, 명령 인증, 이벤트 인증 또는 멘션 활성화 변경
    - 채널 인그레스 민감 정보 제거 또는 SDK 호환성 경계 검토
sidebarTitle: Channel Ingress
summary: 인바운드 메시지 권한 부여를 위한 실험적 채널 수신 API
title: 채널 인그레스 API
x-i18n:
    generated_at: "2026-07-12T01:03:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

채널 인그레스는 인바운드 채널 이벤트를 위한 실험적 접근 제어 경계입니다. Plugin은 플랫폼 관련 사실과 부수 효과를 담당하고, 코어는 일반 정책인 DM/그룹 허용 목록, 페어링 저장소의 DM 항목, 경로 게이트, 명령 게이트, 이벤트 인증, 멘션 활성화, 민감 정보가 제거된 진단, 허용 처리를 담당합니다.

새 수신 경로에는 `openclaw/plugin-sdk/channel-ingress-runtime`을 사용하세요. 이전 `openclaw/plugin-sdk/channel-ingress` 하위 경로는 서드 파티 Plugin을 위한 사용 중단된 호환성 퍼사드로 계속 내보냅니다.

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

유효 허용 목록, 명령 소유자 또는 명령 그룹을 미리 계산하지 마세요. 리졸버는 원시 허용 목록, 저장소 콜백, 경로 설명자, 접근 그룹, 정책, 대화 종류에서 이를 도출합니다.

## 결과

번들 Plugin은 최신 프로젝션을 직접 사용해야 합니다.

| 필드               | 의미                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 순서가 지정된 게이트 결정 및 허용 처리                             |
| `senderAccess`     | 발신자/대화 권한 부여만                                            |
| `routeAccess`      | 경로 및 경로 발신자 프로젝션                                      |
| `commandAccess`    | 명령 권한 부여. 명령 게이트가 실행되지 않았으면 `requested: false` |
| `activationAccess` | 멘션/활성화 결과                                                   |

이벤트 권한 부여는 순서가 지정된 `ingress.graph`와 최종 결정을 내린 `ingress.reasonCode`에서 계속 확인할 수 있으며, 별도의 이벤트 프로젝션은 생성되지 않습니다.

사용 중단된 서드 파티 SDK 도우미는 내부적으로 이전 형태를 다시 구성할 수 있습니다. 새로운 번들 수신 경로에서는 최신 결과를 다시 로컬 DTO로 변환하지 않아야 합니다.

## 접근 그룹

`accessGroup:<name>` 항목은 민감 정보가 제거된 상태로 유지됩니다. 코어는 정적 `message.senders` 그룹을 직접 확인하고, 플랫폼 조회가 필요한 동적 그룹에만 `resolveAccessGroupMembership`을 호출합니다. 누락되거나 지원되지 않거나 확인에 실패한 그룹은 기본적으로 접근을 거부합니다.

## 이벤트 모드

| `authMode`       | 의미                                                     |
| ---------------- | -------------------------------------------------------- |
| `inbound`        | 일반적인 인바운드 발신자 게이트                         |
| `command`        | 콜백 또는 범위가 지정된 버튼의 명령 게이트              |
| `origin-subject` | 행위자가 원본 메시지 주체와 일치해야 함                 |
| `route-only`     | 경로 범위의 신뢰할 수 있는 이벤트에 대한 경로 게이트만  |
| `none`           | Plugin 소유의 내부 이벤트가 공유 인증을 우회함           |

반응, 버튼, 콜백, 네이티브 명령에는 `mayPair: false`를 사용하세요.

## 경로 및 활성화

대화방, 주제, 길드, 스레드 또는 중첩 경로 정책에는 경로 설명자를 사용하세요.

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

Plugin에 선택적 경로 설명자가 여러 개 있으면 `channelIngressRoutes(...)`를 사용하세요. 이 함수는 경로 관련 사실을 일반적인 형태로 유지하면서 비활성화된 분기를 필터링하고, 각 설명자의 `precedence`에 따라 순서를 지정합니다.

멘션 게이팅은 활성화 게이트입니다. 멘션이 일치하지 않으면 `admission: "skip"`을 반환하므로 턴 커널은 관찰 전용 턴을 처리하지 않습니다. 대부분의 채널에서는 활성화 게이트를 발신자 및 명령 게이트 뒤에 두어야 합니다. 발신자 허용 목록으로 인한 불필요한 로그보다 먼저 멘션되지 않은 트래픽을 조용히 처리해야 하는 공개 채팅 표면은 텍스트 명령 우회가 비활성화된 경우 `activation.order: "before-sender"`를 선택할 수 있습니다. 봇 스레드의 답글처럼 암시적 활성화를 사용하는 채널은 `activation.allowedImplicitMentionKinds`를 전달할 수 있습니다. 그러면 프로젝션된 `activationAccess.shouldBypassMention`이 명령 또는 암시적 활성화로 명시적 멘션을 우회한 시점을 나타냅니다.

## 민감 정보 제거

원시 발신자 값과 원시 허용 목록 항목은 리졸버 입력으로만 사용해야 합니다. 이러한 값은 확인된 상태, 결정, 진단, 스냅샷 또는 호환성 관련 사실에 나타나서는 안 됩니다. 불투명한 주체 ID, 항목 ID, 경로 ID 및 진단 ID를 사용하세요.

## 검증

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
