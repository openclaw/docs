---
read_when:
    - 상시 운영 그룹 또는 채널 대화방 구성하기
    - 에이전트가 최종 텍스트를 자동으로 게시하지 않고 방의 대화를 지켜보게 하려는 경우
    - 표시되는 방 메시지 없이 입력 상태 및 토큰 사용량 디버깅하기
sidebarTitle: Ambient room events
summary: 지원되는 그룹 채팅방에서는 에이전트가 메시지 도구로 전송하지 않는 한 조용히 컨텍스트만 제공하도록 허용합니다.
title: 실내 주변 이벤트
x-i18n:
    generated_at: "2026-07-12T00:33:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

주변 룸 이벤트를 사용하면 OpenClaw가 멘션되지 않은 그룹이나 채널의 대화를 조용한 컨텍스트로 처리할 수 있습니다. 에이전트는 메모리와 세션 상태를 업데이트할 수 있지만, 에이전트가 명시적으로 `message` 도구를 호출하지 않는 한 룸에는 아무 메시지도 표시되지 않습니다.

상시 활성 그룹 채팅의 경우 `messages.groupChat.unmentionedInbound: "room_event"`와 `messages.groupChat.visibleReplies: "message_tool"`을 함께 사용하세요. 에이전트는 대화를 듣고 응답이 유용한 시점을 판단하며, 더 이상 `NO_REPLY`로 응답하는 기존 프롬프트 패턴이 필요하지 않습니다.

현재 지원되는 대상은 Discord 길드 채널, Slack 채널 및 비공개 채널, Slack 다중 사용자 DM, Telegram 그룹 또는 슈퍼그룹입니다. 다른 그룹 채널은 해당 채널 페이지에 주변 룸 이벤트를 지원한다고 명시되어 있지 않은 한 기존 그룹 동작을 유지합니다.

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

그런 다음 해당 룸의 멘션 제한을 비활성화하여 상시 활성 상태로 만듭니다. 룸은 여전히 일반적인 `groupPolicy`, 룸 허용 목록, 발신자 허용 목록을 통과해야 합니다.

설정을 저장하면 Gateway가 `messages` 설정을 즉시 적용합니다. 파일 감시 또는 설정 다시 불러오기가 비활성화된 경우(`gateway.reload.mode: "off"`)에만 다시 시작하세요.

## 변경되는 동작

`messages.groupChat.unmentionedInbound: "room_event"`를 사용하면 다음과 같이 동작합니다.

- 멘션되지 않은 허용된 그룹 또는 채널 메시지는 조용한 룸 이벤트가 됩니다
- 멘션된 메시지는 사용자 요청으로 유지됩니다
- 텍스트 제어 명령과 네이티브 명령은 사용자 요청으로 유지됩니다
- 중단 또는 정지 요청은 사용자 요청으로 유지됩니다
- 다이렉트 메시지는 사용자 요청으로 유지됩니다

룸 이벤트에는 엄격한 공개 전송 정책이 적용됩니다. 최종 어시스턴트 텍스트는 비공개로 유지됩니다. 에이전트가 룸에 게시하려면 `message(action=send)`를 호출해야 합니다.

룸 이벤트에서는 입력 중 표시와 수명 주기 상태 반응이 계속 억제됩니다. 유일하게 명시적인 수신 확인 예외는 `messages.ackReactionScope: "all"`이며, 이 설정은 구성된 수신 확인 반응을 전송합니다. 룸을 완전히 조용하게 유지해야 하는 경우 더 제한적인 범위나 `"off"`를 사용하세요.

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

하나의 채널만 주변 룸으로 사용해야 하는 경우 채널별 Discord 설정을 사용하세요. `groupPolicy: "allowlist"`에서는 채널을 목록에 추가해야 허용됩니다(`enabled: false`는 항목을 비활성화합니다).

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
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

Slack 채널 허용 목록은 ID를 우선합니다. `#channel-name`이 아닌 `C12345678`과 같은 채널 ID를 사용하세요. `channels.slack.channels` 아래에 채널을 추가해야 해당 채널이 허용됩니다(`enabled: false`는 항목을 비활성화합니다).

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram 예시

Telegram 그룹에서는 봇이 일반 그룹 메시지를 볼 수 있어야 합니다. `requireMention: false`인 경우 BotFather의 개인정보 보호 모드를 비활성화하거나, 전체 그룹 트래픽을 봇에 전달하는 다른 Telegram 설정을 사용하세요.

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

Telegram 그룹 ID는 일반적으로 `-1001234567890`과 같은 음수입니다. `openclaw logs --follow`에서 `chat.id`를 확인하거나, 그룹 메시지를 ID 도우미 봇에 전달하거나, Bot API의 `getUpdates`를 확인하세요.

## 에이전트별 정책

여러 에이전트가 같은 룸을 공유하지만 하나의 에이전트만 멘션되지 않은 대화를 주변 컨텍스트로 처리해야 하는 경우 에이전트 재정의를 사용하세요.

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

에이전트별 `agents.list[].groupChat.unmentionedInbound` 값은 해당 에이전트의 `messages.groupChat.unmentionedInbound`를 재정의합니다.

## 공개 응답 모드

일반적인 그룹 또는 채널 사용자 요청에서 `messages.groupChat.visibleReplies`의 기본값은 `"automatic"`입니다. 명시적인 메시지 도구 호출 없이 최종 어시스턴트 텍스트를 공개적으로 게시해야 하는 경우 이 기본값을 유지하세요.

상시 활성 주변 룸에서는 여전히 `messages.groupChat.visibleReplies: "message_tool"`을 권장하며, 특히 GPT-5.6 Sol과 같은 최신 세대의 도구 호출 신뢰성이 높은 모델을 사용할 때 유용합니다. 에이전트는 메시지 도구를 호출하여 말할 시점을 결정할 수 있습니다. 모델이 도구를 호출하지 않고 최종 텍스트를 반환하면 OpenClaw는 해당 최종 텍스트를 비공개로 유지하고 억제된 전송 메타데이터를 기록합니다.

다른 그룹 요청이 자동 응답을 사용하더라도 룸 이벤트에는 엄격한 정책이 유지됩니다. 멘션되지 않은 주변 룸 이벤트가 공개 출력을 생성하려면 항상 `message(action=send)`가 필요합니다.

## 기록

`messages.groupChat.historyLimit`는 전역 그룹 기록 기본값을 설정합니다(설정하지 않으면 50이며 양의 정수여야 함). 채널은 `channels.<channel>.historyLimit`로 이를 재정의할 수 있으며, 일부 채널은 계정별 기록 제한도 지원합니다. 해당 채널의 그룹 기록 컨텍스트를 비활성화하려면 채널 수준에서 `historyLimit: 0`을 설정하세요.

룸 이벤트를 지원하는 채널은 최근 주변 룸 메시지를 컨텍스트로 유지합니다. Telegram은 `historyLimit`로 제한되는 그룹별 상시 활성 순환 창을 유지합니다. 사용자 요청 턴은 봇이 마지막으로 기록한 응답 이후의 항목을 선택하는 반면, 룸 이벤트 턴은 모델이 자신이 최근에 게시한 메시지를 볼 수 있도록 전체 최근 창을 받습니다. 사용이 중단된 Telegram `includeGroupHistoryContext` 모드 키는 `openclaw doctor --fix`로 제거됩니다.

## 문제 해결

룸에 입력 중 표시나 토큰 사용량은 나타나지만 공개 메시지가 표시되지 않는 경우:

1. 채널 허용 목록과 발신자 허용 목록에서 룸이 허용되었는지 확인합니다.
2. 예상한 룸 수준에 `requireMention: false`가 설정되어 있는지 확인합니다.
3. `messages.groupChat.unmentionedInbound` 또는 에이전트 재정의가 `"room_event"`인지 확인합니다.
4. 로그에서 억제된 최종 페이로드 메타데이터 또는 `didSendViaMessagingTool: false`를 확인합니다.
5. 일반 그룹 요청에서 최종 응답을 자동으로 게시하려면 `messages.groupChat.visibleReplies: "automatic"`을 유지하거나 복원하세요. `message_tool`을 사용하는 주변 룸에서는 도구를 안정적으로 호출하는 모델과 런타임을 사용하세요.

Telegram 주변 룸이 전혀 작동하지 않으면 BotFather의 개인정보 보호 모드를 확인하고 Gateway가 일반 그룹 메시지를 수신하고 있는지 검증하세요.

Slack 주변 룸이 작동하지 않으면 채널 키가 Slack 채널 ID인지 확인하고 앱에 해당 룸 유형의 기록 범위가 있는지 검증하세요. 공개 채널은 `channels:history`, 비공개 채널은 `groups:history`, 다중 사용자 DM은 `mpim:history`가 필요합니다.

## 관련 문서

- [그룹](/ko/channels/groups)
- [Discord](/ko/channels/discord)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
- [채널 문제 해결](/ko/channels/troubleshooting)
- [채널 설정 참고 자료](/ko/gateway/config-channels)
