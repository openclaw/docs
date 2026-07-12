---
read_when:
    - 하나의 활성 세션에 대한 답장을 Telegram에서 Discord, Slack, Mattermost 또는 연결된 다른 채널로 옮기려는 경우
    - 채널 간 다이렉트 메시지를 위해 `session.identityLinks`를 구성하고 있습니다
    - /dock 명령에서 발신자가 연결되어 있지 않거나 활성 세션이 없다고 표시됩니다
summary: 연결된 채팅 채널 간에 OpenClaw 세션 하나의 응답 경로 이동하기
title: 채널 도킹
x-i18n:
    generated_at: "2026-07-12T00:44:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

채널 도킹은 하나의 OpenClaw 세션에 대한 착신 전환입니다. 동일한
대화 컨텍스트를 유지하면서 해당 세션의 향후 응답이 전달되는 위치를
변경합니다. 도킹은 다이렉트 채팅에서만 작동하며 그룹 채팅에서는 실행되지
않습니다.

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

Alice가 Telegram 다이렉트 채팅에서 다음 명령을 보내면:

```text
/dock_discord
```

OpenClaw는 현재 세션 컨텍스트를 유지하고 응답 경로를 변경합니다.

| 도킹 전                      | `/dock_discord` 실행 후     |
| ---------------------------- | --------------------------- |
| 응답이 Telegram `123`으로 전달됨 | 응답이 Discord `456`으로 전달됨 |

세션은 다시 생성되지 않습니다. 대화 기록은 동일한 세션에 계속 연결되어
있습니다.

## 사용 이유

한 채팅 앱에서 작업을 시작했지만 다음 응답을 다른 곳에서 받아야 할 때
도킹을 사용합니다.

일반적인 흐름:

1. Telegram에서 에이전트 작업을 시작합니다.
2. 작업을 조율하고 있는 Discord로 이동합니다.
3. Telegram 다이렉트 채팅에서 `/dock_discord`를 보냅니다.
4. 동일한 OpenClaw 세션을 유지하면서 향후 응답은 Discord에서 받습니다.

## 필수 설정

도킹에는 `session.identityLinks`가 필요합니다. 출발지 발신자와 대상 피어는
동일한 ID 그룹에 속해야 합니다.

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
| `discord:456`  | Discord 다이렉트 피어 ID `456` |
| `slack:U123`   | Slack 사용자 ID `U123`       |

정규 키(위 예시의 `alice`)는 공유 ID 그룹의 이름일 뿐입니다. 도킹 명령은
채널 접두사가 붙은 값을 사용하여 출발지 발신자와 대상 피어가 동일인임을
증명합니다.

## 명령

OpenClaw는 네이티브 명령을 지원하는 로드된 모든 채널 Plugin에 대해
`/dock-<channel>` 명령을 하나씩 생성하므로 Plugin이 추가될수록 목록도
늘어납니다. 현재 이를 지원하는 번들 Plugin은 다음과 같습니다.

| 대상 채널   | 명령               | 별칭               |
| ----------- | ------------------ | ------------------ |
| Discord     | `/dock-discord`    | `/dock_discord`    |
| Mattermost  | `/dock-mattermost` | `/dock_mattermost` |
| Slack       | `/dock-slack`      | `/dock_slack`      |
| Telegram    | `/dock-telegram`   | `/dock_telegram`   |

밑줄 형식은 Telegram처럼 슬래시 명령을 직접 제공하는 환경에서 사용하는
네이티브 명령 이름이기도 합니다.

## 변경되는 항목

도킹은 활성 세션의 전달 필드를 업데이트합니다.

| 세션 필드       | `/dock_discord` 실행 후 예시             |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | 대상 채널 계정 또는 `default`            |

이 필드들은 세션 저장소에 영구 저장되며 해당 세션의 이후 응답 전달에
사용됩니다.

## 변경되지 않는 항목

도킹은 다음 작업을 수행하지 않습니다.

- 채널 계정 생성
- 새로운 Discord, Telegram, Slack 또는 Mattermost 봇 연결
- 사용자에게 접근 권한 부여
- 채널 허용 목록 또는 DM 정책 우회
- 대화 기록을 다른 세션으로 이동
- 관련 없는 사용자들이 세션을 공유하도록 설정

도킹은 현재 세션의 전달 경로만 변경합니다.

## 문제 해결

**명령에서 발신자가 연결되어 있지 않다고 표시됩니다.**

현재 발신자와 대상 피어를 동일한 `session.identityLinks` 그룹에 모두
추가하세요. 예를 들어 Telegram 발신자 `123`을 Discord 피어 `456`에
도킹하려면 `telegram:123`과 `discord:456`을 모두 포함하세요.

**명령에서 도킹은 다이렉트 채팅에서만 사용할 수 있다고 표시됩니다.**

그룹 채팅이 아닌 OpenClaw와의 다이렉트 채팅에서 도킹 명령을 보내세요.

**명령에서 활성 세션이 없다고 표시됩니다.**

기존 다이렉트 채팅 세션에서 도킹하세요. 새 경로를 영구 저장하려면 명령에
활성 세션 항목이 필요합니다.

**응답이 여전히 이전 채널로 전달됩니다.**

명령에 성공 메시지가 표시되었는지 확인하고 대상 피어 ID가 해당 채널에서
사용하는 ID와 일치하는지 확인하세요. 도킹은 활성 세션의 경로만 변경하며
다른 세션은 여전히 다른 곳으로 라우팅될 수 있습니다.

**원래 채널로 다시 전환해야 합니다.**

연결된 발신자에서 `/dock_telegram` 또는 `/dock-telegram`과 같이 원래
채널에 해당하는 명령을 보내세요.
