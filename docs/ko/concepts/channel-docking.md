---
read_when:
    - 하나의 활성 세션에 대한 응답을 Telegram에서 Discord, Slack, Mattermost 또는 다른 연결된 채널로 이동하려는 경우
    - 채널 간 다이렉트 메시지를 위해 session.identityLinks를 구성하고 있습니다
    - /dock 명령에서 발신자가 연결되어 있지 않거나 활성 세션이 없다고 표시됩니다
summary: 연결된 채팅 채널 간에 단일 OpenClaw 세션의 응답 경로 이동
title: 채널 도킹
x-i18n:
    generated_at: "2026-04-30T06:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

채널 도킹은 하나의 OpenClaw 세션에 대한 착신 전환입니다.

같은 대화 컨텍스트를 유지하지만, 해당 세션의 향후 답장이 전달되는 위치를
변경합니다.

## 예시

Alice는 Telegram과 Discord에서 OpenClaw에 메시지를 보낼 수 있습니다.

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Alice가 Telegram에서 다음을 보내면:

```text
/dock_discord
```

OpenClaw는 현재 세션 컨텍스트를 유지하고 답장 경로를 변경합니다.

| 도킹 전                         | `/dock_discord` 후              |
| ---------------------------- | --------------------------- |
| 답장이 Telegram `123`으로 이동 | 답장이 Discord `456`으로 이동 |

세션은 다시 생성되지 않습니다. 대화 기록은 같은 세션에 계속 연결된 상태로
유지됩니다.

## 사용하는 이유

한 채팅 앱에서 작업이 시작되었지만 다음 답장이 다른 곳에 도착해야 할 때
도킹을 사용합니다.

일반적인 흐름:

1. Telegram에서 에이전트 작업을 시작합니다.
2. 작업을 조율하고 있는 Discord로 이동합니다.
3. Telegram 세션에서 `/dock_discord`를 보냅니다.
4. 같은 OpenClaw 세션을 유지하되, 향후 답장은 Discord에서 받습니다.

## 필수 설정

도킹에는 `session.identityLinks`가 필요합니다. 소스 발신자와 대상 피어가
같은 ID 그룹에 있어야 합니다.

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

값은 채널 접두사가 붙은 피어 ID입니다.

| 값             | 의미                         |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram 발신자 ID `123`     |
| `discord:456`  | Discord 직접 피어 ID `456`   |
| `slack:U123`   | Slack 사용자 ID `U123`       |

정식 키(위의 `alice`)는 공유 ID 그룹 이름일 뿐입니다. 도킹 명령은
채널 접두사가 붙은 값을 사용해 소스 발신자와 대상 피어가 같은 사람임을
증명합니다.

## 명령

도킹 명령은 네이티브 명령을 지원하는 로드된 채널 Plugin에서 생성됩니다.
현재 번들로 제공되는 명령은 다음과 같습니다.

| 대상 채널 | 명령               | 별칭               |
| -------------- | ------------------ | ------------------ |
| Discord        | `/dock-discord`    | `/dock_discord`    |
| Mattermost     | `/dock-mattermost` | `/dock_mattermost` |
| Slack          | `/dock-slack`      | `/dock_slack`      |
| Telegram       | `/dock-telegram`   | `/dock_telegram`   |

밑줄 별칭은 Telegram 같은 네이티브 명령 표면에서 유용합니다.

## 변경되는 것

도킹은 활성 세션 전달 필드를 업데이트합니다.

| 세션 필드       | `/dock_discord` 후 예시                  |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | 대상 채널 계정 또는 `default`            |

이 필드는 세션 저장소에 유지되며, 이후 해당 세션의 답장 전달에 사용됩니다.

## 변경되지 않는 것

도킹은 다음을 하지 않습니다.

- 채널 계정 생성
- 새 Discord, Telegram, Slack 또는 Mattermost 봇 연결
- 사용자에게 접근 권한 부여
- 채널 허용 목록 또는 DM 정책 우회
- 대화 기록을 다른 세션으로 이동
- 관련 없는 사용자가 세션을 공유하도록 만들기

현재 세션의 전달 경로만 변경합니다.

## 문제 해결

**명령에 발신자가 연결되어 있지 않다고 표시됩니다.**

현재 발신자와 대상 피어를 모두 같은 `session.identityLinks` 그룹에
추가하세요. 예를 들어 Telegram 발신자 `123`을 Discord 피어 `456`에
도킹해야 한다면 `telegram:123`과 `discord:456`을 모두 포함하세요.

**명령에 활성 세션이 없다고 표시됩니다.**

기존 직접 채팅 세션에서 도킹하세요. 명령이 새 경로를 유지하려면 활성 세션
항목이 필요합니다.

**답장이 여전히 이전 채널로 이동합니다.**

명령이 성공 메시지로 응답했는지 확인하고, 대상 피어 ID가 해당 채널에서
사용하는 ID와 일치하는지 확인하세요. 도킹은 활성 세션 경로만 변경합니다.
다른 세션은 여전히 다른 곳으로 라우팅될 수 있습니다.

**다시 전환해야 합니다.**

연결된 발신자에서 `/dock_telegram` 또는 `/dock-telegram` 같은 원래 채널에
해당하는 명령을 보내세요.
