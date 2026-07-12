---
read_when:
    - 봇이 작성한 채널 메시지 구성하기
    - 봇 간 루프 방지 조정
sidebarTitle: Bot loop protection
summary: 봇 간 루프 방지 기본값 및 채널별 재정의
title: 봇 루프 방지
x-i18n:
    generated_at: "2026-07-12T14:57:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw은 `allowBots`를 지원하는 채널에서 다른 봇이 작성한 메시지를 수신할 수 있습니다. 이 경로가 활성화되면 페어 루프 보호가 두 봇 ID가 서로에게 무한정 응답하는 것을 방지합니다.

이 보호 기능은 코어 인바운드 응답 실행기에서 적용됩니다. 지원되는 각 채널은 인바운드 이벤트를 계정 또는 범위, 대화 ID, 발신 봇 ID, 수신 봇 ID라는 일반 정보로 매핑합니다. 코어는 참여자 페어를 양방향으로 추적하고(A에서 B로와 B에서 A로를 동일한 페어로 간주), 슬라이딩 윈도 예산을 적용하며, 예산이 초과되면 쿨다운 기간 동안 해당 페어를 억제합니다.

## 기본값

채널이 봇이 작성한 메시지를 디스패치에 전달하도록 허용할 때마다 페어 루프 보호가 활성화됩니다. 기본 제공 기본값은 다음과 같습니다.

| 키                   | 기본값  | 의미                                                |
| -------------------- | ------- | --------------------------------------------------- |
| `enabled`            | `true`  | 이를 지원하는 채널에서 보호 기능이 활성화됩니다.    |
| `maxEventsPerWindow` | `20`    | 봇 페어가 윈도 내에서 교환할 수 있는 이벤트 수입니다. |
| `windowSeconds`      | `60`    | 슬라이딩 윈도 길이입니다.                            |
| `cooldownSeconds`    | `60`    | 페어가 예산을 초과한 후 억제되는 시간입니다.         |

이 보호 기능은 사람이 작성한 메시지, 단일 봇 배포, 자체 메시지 필터링 또는 예산 이내의 봇 응답에는 영향을 주지 않습니다.

## 공유 기본값 구성

모든 지원 채널에 동일한 기준값을 적용하려면 `channels.defaults.botLoopProtection`을 한 번 설정하십시오. 채널, 계정 및 방 재정의를 통해 개별 영역을 계속 조정할 수 있습니다.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

채널 정책에서 자동 억제 없이 봇 간 대화를 의도적으로 허용하는 경우에만 `enabled: false`를 설정하십시오.

## 채널, 계정 또는 방별 재정의

지원 채널은 자체 구성을 공유 기본값 위에 키별로 계층화합니다. 가장 좁은 범위부터 적용되는 우선순위는 다음과 같습니다.

1. 채널이 대화별 재정의를 지원하는 경우 `channels.<channel>.<room-or-space>.botLoopProtection`
2. 채널이 계정을 지원하는 경우 `channels.<channel>.accounts.<account>.botLoopProtection`
3. 채널이 최상위 기본값을 지원하는 경우 `channels.<channel>.botLoopProtection`
4. `channels.defaults.botLoopProtection`
5. 기본 제공 기본값

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## 채널 지원

- Discord: 기본 `author.bot` 정보이며, Discord 계정, 채널 및 봇 페어를 키로 사용합니다.
- Google Chat: 허용된 봇 작성 메시지의 기본 `sender.type=BOT` 정보이며, 계정, 스페이스 및 봇 페어를 키로 사용합니다.
- Matrix: 구성된 Matrix 봇 계정이며, Matrix 계정, 방 및 구성된 봇 페어를 키로 사용합니다.
- Slack: 허용된 봇 작성 메시지의 기본 `bot_id` 정보이며, Slack 계정, 채널 및 봇 페어를 키로 사용합니다.

신뢰할 수 있는 인바운드 봇 ID를 노출하지 않는 채널은 기존의 자체 메시지 및 액세스 정책 필터를 계속 사용합니다. 이러한 채널은 봇 페어의 두 참여자를 모두 식별할 수 있을 때까지 이 보호 기능을 사용해서는 안 됩니다.

Plugin 구현 세부 정보는 [SDK 런타임](/ko/plugins/sdk-runtime#reusable-runtime-utilities)을 참조하십시오.
