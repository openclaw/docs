---
read_when:
    - 봇이 작성한 채널 메시지 구성
    - 봇 간 루프 보호 조정
sidebarTitle: Bot loop protection
summary: 봇 간 루프 보호 기본값 및 채널 재정의
title: Bot 루프 보호
x-i18n:
    generated_at: "2026-06-27T17:09:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# 봇 루프 보호

OpenClaw는 `allowBots`를 지원하는 채널에서 다른 봇이 작성한 메시지를 받을 수 있습니다.
이 경로가 활성화되면 쌍 루프 보호가 두 봇 ID가 서로에게 무기한 답장하는 일을 방지합니다.

이 가드는 핵심 인바운드 답장 실행기에서 적용됩니다. 각 지원 채널은
자체 인바운드 이벤트를 계정 또는 범위, 대화 ID, 발신자 봇 ID, 수신자 봇 ID라는
일반 사실로 매핑합니다. 그런 다음 코어는 양방향으로 참여자 쌍을 추적하고,
슬라이딩 윈도우 예산을 적용하며, 예산을 초과한 뒤에는 쿨다운 동안 해당 쌍을 억제합니다.

## 기본값

쌍 루프 보호는 채널이 봇 작성 메시지를 디스패치까지 도달하도록 허용할 때 활성화됩니다.
기본 제공 기본값은 다음과 같습니다.

- `maxEventsPerWindow: 20` - 봇 쌍은 윈도우 내에서 20개의 이벤트를 교환할 수 있음
- `windowSeconds: 60` - 슬라이딩 윈도우 길이
- `cooldownSeconds: 60` - 쌍이 예산을 초과한 뒤의 억제 시간

이 가드는 일반적인 사람이 작성한 메시지, 단일 봇 배포, 자체 메시지 필터링,
또는 예산 이하로 유지되는 일회성 봇 답장에는 영향을 주지 않습니다.

## 공유 기본값 구성

`channels.defaults.botLoopProtection`을 한 번 설정하여 모든 지원 채널에
동일한 기준값을 부여합니다. 채널 및 계정 오버라이드는 여전히 개별
표면을 조정할 수 있습니다.

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

채널 정책이 자동 억제 없이 봇 간 대화를 의도적으로 허용하는 경우에만
`enabled: false`를 설정하세요.

## 채널 또는 계정별 오버라이드

지원 채널은 공유 기본값 위에 자체 구성을 계층화합니다. 우선순위는 다음과 같습니다.

- `channels.<channel>.<room-or-space>.botLoopProtection`, 채널이 대화별 오버라이드를 지원하는 경우
- `channels.<channel>.accounts.<account>.botLoopProtection`, 채널이 계정을 지원하는 경우
- `channels.<channel>.botLoopProtection`, 채널이 최상위 기본값을 지원하는 경우
- `channels.defaults.botLoopProtection`
- 기본 제공 기본값

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## 채널 지원

- Discord: 네이티브 `author.bot` 사실, Discord 계정, 채널, 봇 쌍을 기준으로 키가 지정됩니다.
- Slack: 허용된 봇 작성 메시지에 대한 네이티브 `bot_id` 사실, Slack 계정, 채널, 봇 쌍을 기준으로 키가 지정됩니다.
- Matrix: 구성된 Matrix 봇 계정, Matrix 계정, 방, 구성된 봇 쌍을 기준으로 키가 지정됩니다.
- Google Chat: 허용된 봇 작성 메시지에 대한 네이티브 `sender.type=BOT` 사실, 계정, 스페이스, 봇 쌍을 기준으로 키가 지정됩니다.

신뢰할 수 있는 인바운드 봇 ID를 노출하지 않는 채널은 기존의
자체 메시지 및 액세스 정책 필터를 계속 사용합니다. 이러한 채널은
봇 쌍의 두 참여자를 모두 식별할 수 있을 때까지 이 가드에 참여해서는 안 됩니다.

Plugin 구현 세부 정보는 [SDK 런타임](/ko/plugins/sdk-runtime#reusable-runtime-utilities)을 참조하세요.
