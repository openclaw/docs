---
read_when:
    - 여러 메시지 채널에 동일한 허용 목록 구성하기
    - DM 및 그룹 발신자 접근 규칙 공유
    - 메시지 채널 접근 제어 검토하기
summary: 메시지 채널용 재사용 가능한 발신자 허용 목록
title: 액세스 그룹
x-i18n:
    generated_at: "2026-07-12T00:33:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

액세스 그룹은 `accessGroups` 아래에 한 번 정의하고 채널 허용 목록에서 `accessGroup:<name>`으로 참조하는 이름 있는 발신자 목록입니다.

동일한 사람들을 여러 메시지 채널에서 허용해야 하거나, 신뢰할 수 있는 하나의 집합을 DM과 그룹 발신자 인증 모두에 적용해야 할 때 사용합니다.

그룹 자체는 아무 권한도 부여하지 않습니다. 허용 목록 필드에서 그룹을 참조할 때만 효력이 있습니다.

## 정적 메시지 발신자 그룹

정적 발신자 그룹은 `type: "message.senders"`를 사용합니다. `members`는 메시지 채널 ID를 키로 사용하며, 모든 채널에서 공유되는 항목에는 `"*"`를 사용합니다.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

| 키                         | 의미                                                                         |
| -------------------------- | ---------------------------------------------------------------------------- |
| `"*"`                      | 그룹을 참조하는 모든 메시지 채널에서 확인하는 공유 항목입니다.               |
| `discord`, `telegram`, ... | 해당 채널의 허용 목록 일치 여부를 확인할 때만 검사하는 항목입니다.            |

항목은 대상 채널의 일반적인 `allowFrom` 규칙에 따라 일치 여부를 판단합니다. OpenClaw는 채널 간에 발신자 ID를 변환하지 않습니다. Alice에게 Telegram ID와 Discord ID가 모두 있다면 각각 일치하는 채널 키 아래에 두 ID를 모두 나열하세요.

## 허용 목록에서 그룹 참조

메시지 채널 경로가 발신자 허용 목록을 지원하는 모든 위치에서 `accessGroup:<name>`으로 그룹을 참조할 수 있습니다.

DM 허용 목록 예시:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

그룹 발신자 허용 목록 예시:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

그룹과 직접 항목을 함께 사용할 수 있습니다.

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## 지원되는 메시지 채널 경로

액세스 그룹은 다음과 같은 공유 메시지 채널 인증 경로에서 작동합니다.

- `channels.<channel>.allowFrom`과 같은 DM 발신자 허용 목록
- `channels.<channel>.groupAllowFrom`과 같은 그룹 발신자 허용 목록
- 동일한 발신자 일치 규칙을 사용하는 채널별 방 단위 발신자 허용 목록(예: Google Chat의 `groups.<space>.users`)
- 메시지 채널 발신자 허용 목록을 재사용하는 명령 인증 경로

채널 지원 여부는 해당 채널이 OpenClaw의 공유 발신자 인증 도우미를 통해 연결되어 있는지에 따라 달라집니다. 현재 번들 지원 대상에는 ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo 및 Zalo Personal이 포함됩니다. 정적 `message.senders` 그룹은 채널에 종속되지 않으므로, 새 메시지 채널은 사용자 지정 허용 목록 확장 대신 공유 Plugin SDK 인그레스 도우미를 사용하여 이를 지원할 수 있습니다.

## Discord 채널 대상 사용자

Discord는 동적 액세스 그룹 유형도 지원합니다.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience`는 "현재 이 길드 채널을 볼 수 있는 Discord DM 발신자를 허용한다"는 의미입니다. OpenClaw는 인증 시점에 Discord를 통해 발신자를 확인하고 Discord의 `ViewChannel` 권한 규칙을 적용합니다. `membership`은 선택 사항이며 기본값은 `canViewChannel`입니다.

`#maintainers` 또는 `#on-call`처럼 Discord 채널이 이미 팀의 기준 정보 소스인 경우 이 기능을 사용하세요.

요구 사항 및 실패 시 동작:

- 봇은 길드와 채널에 접근할 수 있어야 합니다.
- 봇에는 Discord Developer Portal의 **Server Members Intent**가 필요합니다.
- Discord가 `Missing Access`를 반환하거나, 발신자를 길드 구성원으로 확인할 수 없거나, 채널이 다른 길드에 속한 경우 액세스 그룹은 접근을 거부하는 방식으로 실패합니다.

Discord 관련 추가 예시: [Discord 액세스 제어](/ko/channels/discord#access-control-and-routing)

## Plugin 진단

Plugin 작성자는 액세스 그룹을 다시 평면 허용 목록으로 확장하지 않고도 구조화된 액세스 그룹 상태를 검사할 수 있습니다.

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

결과에는 참조된 그룹, 일치한 그룹, 누락된 그룹, 지원되지 않는 그룹 및 실패한 그룹이 보고됩니다. 진단 또는 적합성 테스트에 사용하세요. 여전히 평면 `allowFrom` 배열을 기대하는 호환성 경로에서만 `expandAllowFromWithAccessGroups(...)`를 사용하세요.

## 보안 참고 사항

- 액세스 그룹은 역할이 아니라 허용 목록 별칭입니다. 액세스 그룹 자체로는 소유자를 생성하거나, 페어링 요청을 승인하거나, 도구 권한을 부여하지 않습니다.
- `dmPolicy: "open"`도 유효 DM 허용 목록에 `"*"`가 있어야 합니다. 액세스 그룹을 참조하는 것은 공개 접근과 동일하지 않습니다.
- 누락된 그룹 이름은 접근을 거부하는 방식으로 실패합니다. `allowFrom`에 `accessGroup:operators`가 포함되어 있지만 `accessGroups.operators`가 없으면 해당 항목은 누구에게도 권한을 부여하지 않습니다.
- 채널 ID를 안정적으로 유지하세요. 채널이 표시 이름과 숫자/사용자 ID를 모두 지원하는 경우 숫자/사용자 ID를 우선 사용하세요.

## 문제 해결

발신자가 일치해야 하지만 차단되는 경우:

1. 허용 목록 필드에 정확한 `accessGroup:<name>` 참조가 포함되어 있는지 확인합니다.
2. `accessGroups.<name>.type`이 올바른지 확인합니다.
3. 발신자 ID가 일치하는 채널 키 또는 `"*"` 아래에 나열되어 있는지 확인합니다.
4. 항목이 해당 채널의 일반적인 허용 목록 구문을 사용하는지 확인합니다.
5. Discord 채널 대상 사용자의 경우 봇이 길드 채널을 볼 수 있고 Server Members Intent가 활성화되어 있는지 확인합니다.

액세스 제어 구성을 편집한 후 `openclaw doctor`를 실행하세요. 런타임 전에 잘못된 허용 목록 및 정책 조합을 다수 감지합니다.
