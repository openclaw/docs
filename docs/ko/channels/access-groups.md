---
read_when:
    - 여러 메시지 채널에 걸쳐 동일한 허용 목록 구성하기
    - 다이렉트 메시지 및 그룹 발신자 접근 규칙 공유
    - 메시지 채널 접근 제어 검토
summary: 메시지 채널용 재사용 가능한 발신자 허용 목록
title: 액세스 그룹
x-i18n:
    generated_at: "2026-05-10T19:21:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

액세스 그룹은 한 번 정의한 뒤 `accessGroup:<name>`으로 채널 허용 목록에서 참조하는 이름 있는 발신자 목록입니다.

같은 사람들이 여러 메시지 채널에서 허용되어야 하거나, 하나의 신뢰된 집합을 DM과 그룹 발신자 승인 모두에 적용해야 할 때 사용하세요.

액세스 그룹은 그 자체로 액세스를 부여하지 않습니다. 그룹은 허용 목록 필드가 이를 참조할 때만 의미가 있습니다.

## 정적 메시지 발신자 그룹

정적 발신자 그룹은 `type: "message.senders"`를 사용합니다.

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

멤버 목록은 메시지 채널 id를 키로 사용합니다.

| 키         | 의미                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | 그룹을 참조하는 모든 메시지 채널에서 확인되는 공유 항목입니다.          |
| `discord`  | Discord 허용 목록 매칭에만 확인되는 항목입니다.                         |
| `telegram` | Telegram 허용 목록 매칭에만 확인되는 항목입니다.                        |
| `whatsapp` | WhatsApp 허용 목록 매칭에만 확인되는 항목입니다.                        |

항목은 대상 채널의 일반 `allowFrom` 규칙으로 매칭됩니다. OpenClaw는 채널 간 발신자 id를 변환하지 않습니다. Alice에게 Telegram id와 Discord id가 있다면, 두 id를 모두 적절한 키 아래에 나열하세요.

## 허용 목록에서 그룹 참조

메시지 채널 경로가 발신자 허용 목록을 지원하는 곳이면 어디서나 `accessGroup:<name>`으로 그룹을 참조하세요.

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
      spaces: {
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

액세스 그룹은 다음을 포함한 공유 메시지 채널 승인 경로에서 사용할 수 있습니다.

- `channels.<channel>.allowFrom` 같은 DM 발신자 허용 목록
- `channels.<channel>.groupAllowFrom` 같은 그룹 발신자 허용 목록
- 동일한 발신자 매칭 규칙을 사용하는 채널별 방 단위 발신자 허용 목록
- 메시지 채널 발신자 허용 목록을 재사용하는 명령 승인 경로

채널 지원 여부는 해당 채널이 공유 OpenClaw 발신자 승인 헬퍼를 통해 연결되어 있는지에 따라 달라집니다. 현재 번들 지원에는 Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo, Zalo Personal이 포함됩니다. 정적 `message.senders` 그룹은 채널에 구애받지 않도록 설계되었으므로, 새 메시지 채널은 사용자 지정 허용 목록 확장 대신 공유 Plugin SDK 헬퍼를 사용해 이를 지원해야 합니다.

## Plugin 진단

Plugin 작성자는 구조화된 액세스 그룹 상태를 다시 평면 허용 목록으로 확장하지 않고도 검사할 수 있습니다.

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

결과는 참조된 그룹, 매칭된 그룹, 누락된 그룹, 지원되지 않는 그룹, 실패한 그룹을 보고합니다. 진단 또는 적합성 테스트가 필요할 때 사용하세요. 여전히 평면 `allowFrom` 배열을 기대하는 호환성 경로에서만 `expandAllowFromWithAccessGroups(...)`를 사용하세요.

## Discord 채널 대상

Discord는 동적 액세스 그룹 타입도 지원합니다.

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

`discord.channelAudience`는 "현재 이 길드 채널을 볼 수 있는 Discord DM 발신자를 허용한다"는 의미입니다. OpenClaw는 승인 시점에 Discord를 통해 발신자를 확인하고 Discord `ViewChannel` 권한 규칙을 적용합니다.

`#maintainers` 또는 `#on-call`처럼 Discord 채널이 이미 팀의 신뢰할 수 있는 출처일 때 사용하세요.

요구 사항 및 실패 동작:

- 봇은 길드와 채널에 액세스할 수 있어야 합니다.
- 봇에는 Discord Developer Portal **Server Members Intent**가 필요합니다.
- Discord가 `Missing Access`를 반환하거나, 발신자를 길드 멤버로 확인할 수 없거나, 채널이 다른 길드에 속한 경우 액세스 그룹은 닫힌 상태로 실패합니다.

더 많은 Discord별 예시: [Discord 액세스 제어](/ko/channels/discord#access-control-and-routing)

## 보안 참고 사항

- 액세스 그룹은 역할이 아니라 허용 목록 별칭입니다. 그 자체로 소유자를 만들거나, 페어링 요청을 승인하거나, 도구 권한을 부여하지 않습니다.
- `dmPolicy: "open"`은 여전히 유효 DM 허용 목록에 `"*"`가 필요합니다. 액세스 그룹을 참조하는 것은 공개 액세스와 같지 않습니다.
- 누락된 그룹 이름은 닫힌 상태로 실패합니다. `allowFrom`에 `accessGroup:operators`가 포함되어 있고 `accessGroups.operators`가 없으면, 해당 항목은 아무도 승인하지 않습니다.
- 채널 id를 안정적으로 유지하세요. 채널이 둘 다 지원하는 경우 표시 이름보다 숫자/사용자 id를 선호하세요.

## 문제 해결

발신자가 매칭되어야 하는데 차단되는 경우:

1. 허용 목록 필드에 정확한 `accessGroup:<name>` 참조가 포함되어 있는지 확인하세요.
2. `accessGroups.<name>.type`이 올바른지 확인하세요.
3. 발신자 id가 매칭되는 채널 키 아래 또는 `"*"` 아래에 나열되어 있는지 확인하세요.
4. 항목이 해당 채널의 일반 허용 목록 구문을 사용하는지 확인하세요.
5. Discord 채널 대상의 경우, 봇이 길드 채널을 볼 수 있고 Server Members Intent가 활성화되어 있는지 확인하세요.

액세스 제어 구성을 편집한 후 `openclaw doctor`를 실행하세요. 런타임 전에 많은 잘못된 허용 목록 및 정책 조합을 잡아냅니다.
