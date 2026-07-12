---
read_when:
    - 상시 운영되는 그룹 또는 채널 대화방 구성하기
    - 에이전트가 최종 텍스트를 자동으로 게시하지 않고 대화방의 대화를 지켜보도록 하려는 경우
    - 표시되는 방 메시지가 없을 때 입력 표시 및 토큰 사용량 디버깅하기
sidebarTitle: Ambient room events
summary: 지원되는 그룹 채팅방에서는 에이전트가 메시지 도구로 전송하지 않는 한 조용히 컨텍스트만 제공하도록 합니다.
title: 주변 방 이벤트
x-i18n:
    generated_at: "2026-07-12T14:56:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

앰비언트 룸 이벤트를 사용하면 OpenClaw가 멘션되지 않은 그룹 또는 채널 대화를 조용한 컨텍스트로 처리할 수 있습니다. 에이전트는 메모리와 세션 상태를 업데이트할 수 있지만, 에이전트가 `message` 도구를 명시적으로 호출하지 않는 한 방에는 아무 메시지도 표시되지 않습니다.

상시 활성 그룹 채팅에는 `messages.groupChat.unmentionedInbound: "room_event"`와 `messages.groupChat.visibleReplies: "message_tool"`을 함께 사용하십시오. 에이전트는 대화를 듣고 응답이 유용한 시점을 판단하며, 더 이상 `NO_REPLY`로 답변하는 기존 프롬프트 패턴을 사용할 필요가 없습니다.

현재 지원 대상: Discord 길드 채널, Slack 채널 및 비공개 채널, Slack 다자간 DM, Telegram 그룹 또는 슈퍼그룹입니다. 다른 그룹 채널은 해당 채널 페이지에 앰비언트 룸 이벤트 지원이 명시되어 있지 않은 한 기존 그룹 동작을 유지합니다.

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

그런 다음 해당 방의 멘션 게이팅을 비활성화하여 상시 활성화합니다. 방은 계속해서 일반적인 `groupPolicy`, 방 허용 목록, 발신자 허용 목록을 통과해야 합니다.

구성을 저장하면 Gateway가 `messages` 설정을 즉시 적용합니다. 파일 감시 또는 구성 다시 로드가 비활성화된 경우에만 다시 시작하십시오(`gateway.reload.mode: "off"`).

## 변경되는 동작

`messages.groupChat.unmentionedInbound: "room_event"`를 사용하면 다음과 같이 동작합니다.

- 멘션되지 않은 허용된 그룹 또는 채널 메시지는 조용한 룸 이벤트가 됩니다
- 멘션된 메시지는 사용자 요청으로 유지됩니다
- 텍스트 제어 명령과 네이티브 명령은 사용자 요청으로 유지됩니다
- 중단 또는 정지 요청은 사용자 요청으로 유지됩니다
- 다이렉트 메시지는 사용자 요청으로 유지됩니다

룸 이벤트에는 엄격한 표시 전송이 적용됩니다. 어시스턴트의 최종 텍스트는 비공개입니다. 에이전트가 방에 게시하려면 `message(action=send)`를 호출해야 합니다.

룸 이벤트에서는 입력 중 표시와 수명 주기 상태 반응이 계속 억제됩니다. 명시적인 수신 확인의 유일한 예외는 구성된 수신 확인 반응을 보내는 `messages.ackReactionScope: "all"`입니다. 방을 완전히 조용하게 유지해야 한다면 더 제한적인 범위나 `"off"`를 사용하십시오.

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

하나의 채널만 앰비언트 방식으로 동작해야 한다면 채널별 Discord 구성을 사용하십시오. `groupPolicy: "allowlist"`에서는 채널을 나열해야 허용됩니다(`enabled: false`는 항목을 비활성화합니다).

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

Slack 채널 허용 목록은 ID를 우선합니다. `#channel-name`이 아니라 `C12345678`과 같은 채널 ID를 사용하십시오. `channels.slack.channels` 아래에 채널을 나열해야 허용됩니다(`enabled: false`는 항목을 비활성화합니다).

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

Telegram 그룹에서 봇은 일반 그룹 메시지를 볼 수 있어야 합니다. `requireMention: false`인 경우 BotFather 개인정보 보호 모드를 비활성화하거나 전체 그룹 트래픽을 봇에 전달하는 다른 Telegram 설정을 사용하십시오.

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

Telegram 그룹 ID는 일반적으로 `-1001234567890`과 같은 음수입니다. `openclaw logs --follow`에서 `chat.id`를 확인하거나, 그룹 메시지를 ID 확인용 도우미 봇으로 전달하거나, Bot API `getUpdates`를 살펴보십시오.

## 에이전트별 정책

여러 에이전트가 같은 방을 공유하지만 하나의 에이전트만 멘션되지 않은 대화를 앰비언트 컨텍스트로 처리해야 한다면 에이전트 재정의를 사용하십시오.

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

## 표시 응답 모드

일반 그룹/채널 사용자 요청에서 `messages.groupChat.visibleReplies`의 기본값은 `"automatic"`입니다. 명시적인 메시지 도구 호출 없이 어시스턴트의 최종 텍스트를 표시되도록 게시하려면 이 기본값을 유지하십시오.

앰비언트 상시 활성 방에서는 여전히 `messages.groupChat.visibleReplies: "message_tool"`을 권장하며, 특히 GPT-5.6 Sol처럼 최신 세대의 도구 호출 신뢰성이 높은 모델에 적합합니다. 에이전트는 메시지 도구를 호출하여 언제 말할지 결정할 수 있습니다. 모델이 도구를 호출하지 않고 최종 텍스트를 반환하면 OpenClaw는 해당 최종 텍스트를 비공개로 유지하고 전송 억제 메타데이터를 기록합니다.

다른 그룹 요청에서 자동 응답을 사용하더라도 룸 이벤트에는 엄격한 동작이 유지됩니다. 멘션되지 않은 앰비언트 룸 이벤트의 출력을 표시하려면 항상 `message(action=send)`가 필요합니다.

## 기록

`messages.groupChat.historyLimit`는 전역 그룹 기록 기본값을 설정합니다(설정하지 않으면 50이며, 양의 정수여야 합니다). 채널은 `channels.<channel>.historyLimit`로 이를 재정의할 수 있으며, 일부 채널은 계정별 기록 제한도 지원합니다. 해당 채널의 그룹 기록 컨텍스트를 비활성화하려면 채널 수준의 `historyLimit: 0`을 설정하십시오.

룸 이벤트를 지원하는 채널은 최근 앰비언트 룸 메시지를 컨텍스트로 유지합니다. Telegram은 `historyLimit`로 제한되는 그룹별 상시 활성 순환 창을 유지합니다. 사용자 요청 턴은 봇이 마지막으로 기록한 응답 이후의 항목을 선택하지만, 룸 이벤트 턴은 모델이 자신의 최근 게시물도 볼 수 있도록 최근 창 전체를 받습니다. 폐기된 Telegram `includeGroupHistoryContext` 모드 키는 `openclaw doctor --fix`로 제거됩니다.

## 문제 해결

방에 입력 중 표시나 토큰 사용량은 나타나지만 메시지가 표시되지 않는 경우:

1. 채널 허용 목록과 발신자 허용 목록에서 방이 허용되었는지 확인하십시오.
2. 예상한 방 수준에 `requireMention: false`가 설정되어 있는지 확인하십시오.
3. `messages.groupChat.unmentionedInbound` 또는 에이전트 재정의가 `"room_event"`인지 확인하십시오.
4. 전송이 억제된 최종 페이로드 메타데이터 또는 `didSendViaMessagingTool: false`가 로그에 있는지 살펴보십시오.
5. 일반 그룹 요청에서 최종 응답이 자동으로 게시되도록 하려면 `messages.groupChat.visibleReplies: "automatic"`을 유지하거나 복원하십시오. `message_tool`을 사용하는 앰비언트 방에서는 도구를 안정적으로 호출하는 모델/런타임을 사용하십시오.

Telegram 앰비언트 방이 전혀 트리거되지 않으면 BotFather 개인정보 보호 모드를 확인하고 Gateway가 일반 그룹 메시지를 수신하는지 검증하십시오.

Slack 앰비언트 방이 트리거되지 않으면 채널 키가 Slack 채널 ID인지 확인하고 앱에 해당 방 유형의 기록 범위가 있는지 검증하십시오. 공개 채널은 `channels:history`, 비공개 채널은 `groups:history`, 다자간 DM은 `mpim:history`가 필요합니다.

## 관련 문서

- [그룹](/ko/channels/groups)
- [Discord](/ko/channels/discord)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
- [채널 문제 해결](/ko/channels/troubleshooting)
- [채널 구성 참조](/ko/gateway/config-channels)
