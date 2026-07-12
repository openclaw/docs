---
read_when:
    - 메시징 채널 Plugin 구축 또는 마이그레이션
    - DM 또는 그룹 허용 목록, 라우트 게이트, 명령 인증, 이벤트 인증 또는 멘션 활성화 변경
    - 채널 인그레스 마스킹 또는 SDK 호환성 경계 검토하기
sidebarTitle: Channel Ingress
summary: 인바운드 메시지 권한 부여를 위한 실험적 채널 수신 API
title: 채널 인그레스 API
x-i18n:
    generated_at: "2026-07-12T15:36:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

채널 인그레스는 인바운드 채널 이벤트에 대한 실험적 액세스 제어 경계입니다. Plugin은 플랫폼 정보와 부수 효과를 소유하고, 코어는 일반 정책을 소유합니다. 여기에는 DM/그룹 허용 목록, 페어링 저장소의 DM 항목, 경로 게이트, 명령 게이트, 이벤트 인증, 멘션 활성화, 민감 정보가 제거된 진단, 수락이 포함됩니다.

새 수신 경로에는 `openclaw/plugin-sdk/channel-ingress-runtime`을 사용하십시오. 이전 `openclaw/plugin-sdk/channel-ingress` 하위 경로는 서드 파티 Plugin을 위한 더 이상 사용되지 않는 호환성 퍼사드로 계속 내보냅니다.

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

유효 허용 목록, 명령 소유자 또는 명령 그룹을 미리 계산하지 마십시오. 리졸버는 원시 허용 목록, 저장소 콜백, 경로 설명자, 액세스 그룹, 정책, 대화 종류로부터 이를 도출합니다.

## 결과

번들 Plugin은 최신 프로젝션을 직접 사용해야 합니다.

| 필드               | 의미                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | 순서가 지정된 게이트 결정 및 수락                                  |
| `senderAccess`     | 발신자/대화 권한 부여만 해당                                       |
| `routeAccess`      | 경로 및 경로 발신자 프로젝션                                       |
| `commandAccess`    | 명령 권한 부여. 명령 게이트가 실행되지 않은 경우 `requested: false` |
| `activationAccess` | 멘션/활성화 결과                                                    |

이벤트 권한 부여는 순서가 지정된 `ingress.graph`와 결정적 `ingress.reasonCode`에서 계속 사용할 수 있으며, 별도의 이벤트 프로젝션은 내보내지 않습니다.

더 이상 사용되지 않는 서드 파티 SDK 도우미는 내부적으로 이전 형식을 재구성할 수 있습니다. 새로운 번들 수신 경로는 최신 결과를 다시 로컬 DTO로 변환해서는 안 됩니다.

## 액세스 그룹

`accessGroup:<name>` 항목은 계속 민감 정보가 제거된 상태로 유지됩니다. 코어는 정적 `message.senders` 그룹을 직접 확인하고, 플랫폼 조회가 필요한 동적 그룹에 대해서만 `resolveAccessGroupMembership`을 호출합니다. 누락되거나 지원되지 않거나 실패한 그룹은 실패 시 차단됩니다.

## 이벤트 모드

| `authMode`       | 의미                                            |
| ---------------- | ----------------------------------------------- |
| `inbound`        | 일반 인바운드 발신자 게이트                    |
| `command`        | 콜백 또는 범위가 지정된 버튼의 명령 게이트     |
| `origin-subject` | 행위자가 원본 메시지 주체와 일치해야 함         |
| `route-only`     | 경로 범위의 신뢰할 수 있는 이벤트용 경로 게이트만 |
| `none`           | Plugin 소유 내부 이벤트가 공유 인증을 우회함    |

반응, 버튼, 콜백 및 네이티브 명령에는 `mayPair: false`를 사용하십시오.

## 경로 및 활성화

방, 주제, 길드, 스레드 또는 중첩 경로 정책에는 경로 설명자를 사용하십시오.

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

Plugin에 선택적 경로 설명자가 여러 개 있는 경우 `channelIngressRoutes(...)`를 사용하십시오. 이 함수는 경로 정보를 일반적인 형태로 유지하면서 비활성화된 분기를 필터링하고, 각 설명자의 `precedence`에 따라 순서를 지정합니다.

멘션 게이팅은 활성화 게이트입니다. 멘션이 일치하지 않으면 `admission: "skip"`을 반환하므로 턴 커널은 관찰 전용 턴을 처리하지 않습니다. 대부분의 채널은 활성화 게이트를 발신자 및 명령 게이트 뒤에 두어야 합니다. 발신자 허용 목록 관련 노이즈보다 먼저 멘션되지 않은 트래픽을 억제해야 하는 공개 채팅 화면은 텍스트 명령 우회가 비활성화된 경우 `activation.order: "before-sender"`를 선택할 수 있습니다. 봇 스레드의 답글처럼 암시적으로 활성화되는 채널은 `activation.allowedImplicitMentionKinds`를 전달할 수 있습니다. 그러면 프로젝션된 `activationAccess.shouldBypassMention`은 명령 또는 암시적 활성화가 명시적 멘션을 우회한 경우를 보고합니다.

## 민감 정보 제거

원시 발신자 값과 원시 허용 목록 항목은 리졸버 입력으로만 사용됩니다. 확인된 상태, 결정, 진단, 스냅샷 또는 호환성 정보에 이러한 값이 나타나서는 안 됩니다. 불투명한 주체 ID, 항목 ID, 경로 ID 및 진단 ID를 사용하십시오.

## 검증

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
