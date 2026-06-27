---
read_when:
    - 상시 그룹 또는 채널 룸 구성하기
    - 상담원이 방 대화를 지켜보되 최종 텍스트를 자동으로 게시하지 않도록 하려는 경우
    - 표시되는 방 메시지 없이 입력 상태와 토큰 사용량 디버깅
sidebarTitle: Ambient room events
summary: 지원되는 그룹 룸이 에이전트가 메시지 도구로 전송할 때를 제외하고 조용한 컨텍스트를 제공하도록 합니다.
title: 주변 방 이벤트
x-i18n:
    generated_at: "2026-06-27T17:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

주변 방 이벤트를 사용하면 OpenClaw가 언급되지 않은 그룹 또는 채널 대화를 조용한 컨텍스트로 처리할 수 있습니다. 에이전트는 메모리와 세션 상태를 업데이트할 수 있지만, 에이전트가 명시적으로 `message` 도구를 호출하지 않는 한 방에는 아무 말도 표시되지 않습니다.

항상 켜져 있는 그룹 채팅의 경우 이 모드를 권장합니다. `messages.groupChat.unmentionedInbound: "room_event"`와 `messages.groupChat.visibleReplies: "message_tool"`을 함께 사용하세요. 에이전트가 듣고, 답장이 유용한 때를 판단하며, `NO_REPLY`로 답하던 이전 프롬프트 패턴을 피해야 할 때 사용하세요.

현재 지원: Discord 길드 채널, Slack 채널 및 비공개 채널, Slack 다중 사용자 DM, Telegram 그룹 또는 슈퍼그룹. 다른 그룹 채널은 해당 채널 페이지에서 주변 방 이벤트를 지원한다고 명시하지 않는 한 기존 그룹 동작을 유지합니다.

## 권장 설정

전역 그룹 채팅 동작을 설정합니다.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

그런 다음 해당 방의 멘션 게이팅을 비활성화하여 방 자체를 항상 켜짐으로 구성합니다. 채널은 여전히 일반 `groupPolicy`, 방 허용 목록, 발신자 허용 목록에서 허용되어야 합니다.

구성을 저장하면 Gateway가 `messages` 설정을 핫 리로드합니다. 파일 감시 또는 구성 리로드가 비활성화된 경우에만 다시 시작하세요.

## 변경 사항

`messages.groupChat.unmentionedInbound: "room_event"`를 사용하면 다음과 같습니다.

- 언급되지 않은 허용된 그룹 또는 채널 메시지가 조용한 방 이벤트가 됩니다
- 언급된 메시지는 사용자 요청으로 유지됩니다
- 텍스트 명령과 네이티브 명령은 사용자 요청으로 유지됩니다
- 중단 또는 중지 요청은 사용자 요청으로 유지됩니다
- 다이렉트 메시지는 사용자 요청으로 유지됩니다

방 이벤트는 엄격한 표시 전달을 사용합니다. 최종 어시스턴트 텍스트는 비공개입니다. 에이전트가 방에 게시하려면 `message(action=send)`를 호출해야 합니다.

## Discord 예시

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

하나의 채널만 주변 모드여야 할 때는 채널별 Discord 구성을 사용하세요.

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack 예시

Slack 채널 허용 목록은 ID 우선입니다. `#channel-name`이 아니라 `C12345678` 같은 채널 ID를 사용하세요.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram 예시

Telegram 그룹의 경우 봇이 일반 그룹 메시지를 볼 수 있어야 합니다. `requireMention: false`인 경우 BotFather 개인정보 보호 모드를 비활성화하거나 전체 그룹 트래픽을 봇에 전달하는 다른 Telegram 설정을 사용하세요.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram 그룹 ID는 보통 `-1001234567890` 같은 음수입니다. `openclaw logs --follow`에서 `chat.id`를 읽거나, 그룹 메시지를 ID 도우미 봇에 전달하거나, Bot API `getUpdates`를 검사하세요.

## 에이전트별 정책

여러 에이전트가 같은 방을 공유하지만 그중 하나만 언급되지 않은 대화를 주변 컨텍스트로 처리해야 할 때는 에이전트 재정의를 사용하세요.

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

에이전트별 `agents.list[].groupChat.unmentionedInbound` 값은 해당 에이전트에 대해 `messages.groupChat.unmentionedInbound`를 재정의합니다.

## 표시 답장 모드

일반 그룹/채널 사용자 요청의 경우 `messages.groupChat.visibleReplies` 기본값은 `"automatic"`입니다. 명시적인 메시지 도구 호출 없이 최종 어시스턴트 텍스트가 표시되도록 게시되길 원하면 이 기본값을 유지하세요.

주변 항상 켜짐 방의 경우, 특히 GPT 5.5처럼 최신 세대의 도구 안정성이 높은 모델과 함께 사용할 때는 `messages.groupChat.visibleReplies: "message_tool"`을 여전히 권장합니다. 이를 통해 에이전트가 메시지 도구를 호출하여 말할 시점을 결정할 수 있습니다. 모델이 도구를 호출하지 않고 최종 텍스트를 반환하면 OpenClaw는 해당 최종 텍스트를 비공개로 유지하고 억제된 전달 메타데이터를 로그에 기록합니다.

다른 그룹 요청이 자동 답장을 사용하더라도 방 이벤트는 엄격하게 유지됩니다. 언급되지 않은 주변 방 이벤트는 표시 출력에 여전히 `message(action=send)`가 필요합니다.

## 기록

`messages.groupChat.historyLimit`는 전역 그룹 기록 기본값을 제어합니다. 채널은 `channels.<channel>.historyLimit`로 이를 재정의할 수 있으며, 일부 채널은 계정별 기록 제한도 지원합니다.

그룹 기록 컨텍스트를 비활성화하려면 `historyLimit: 0`으로 설정하세요.

지원되는 방 이벤트 채널은 최근 주변 방 메시지를 컨텍스트로 유지합니다. Discord는 표시되는 Discord 전송이 성공할 때까지 방 이벤트 기록을 유지하므로, 메시지 도구 전달 전에 조용한 컨텍스트가 손실되지 않습니다.

## 문제 해결

방에 입력 중 표시나 토큰 사용량은 보이지만 표시되는 메시지가 없는 경우:

1. 방이 채널 허용 목록과 발신자 허용 목록에서 허용되는지 확인합니다.
2. 예상한 방 수준에 `requireMention: false`가 설정되어 있는지 확인합니다.
3. `messages.groupChat.unmentionedInbound` 또는 에이전트 재정의가 `"room_event"`인지 확인합니다.
4. 억제된 최종 페이로드 메타데이터 또는 `didSendViaMessagingTool: false`가 있는지 로그를 검사합니다.
5. 일반 그룹 요청의 경우 최종 답장이 자동으로 게시되길 원하면 `messages.groupChat.visibleReplies: "automatic"`을 유지하거나 복원하세요. `message_tool`을 사용하는 주변 방의 경우 도구를 안정적으로 호출하는 모델/런타임을 사용하세요.

Telegram 주변 방이 전혀 트리거되지 않으면 BotFather 개인정보 보호 모드를 확인하고 Gateway가 일반 그룹 메시지를 수신하고 있는지 확인하세요.

Slack 주변 방이 트리거되지 않으면 채널 키가 Slack 채널 ID인지, 앱에 해당 방 유형에 필요한 `channels:history` 또는 `groups:history` 범위가 있는지 확인하세요.

## 관련 항목

- [그룹](/ko/channels/groups)
- [Discord](/ko/channels/discord)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
- [채널 문제 해결](/ko/channels/troubleshooting)
- [채널 구성 참조](/ko/gateway/config-channels)
