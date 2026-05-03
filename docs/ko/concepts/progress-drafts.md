---
read_when:
    - 장시간 실행되는 채팅 턴에 표시되는 진행 상황 업데이트 구성
    - 부분, 블록, 진행률 스트리밍 모드 중 선택하기
    - 작업이 진행 중일 때 OpenClaw가 하나의 채널 메시지를 업데이트하는 방식을 설명합니다
    - 진행 상황 초안, 독립 실행형 진행 상황 메시지 또는 최종화 폴백 문제 해결
summary: '진행 초안: 에이전트가 실행되는 동안 업데이트되는 하나의 표시되는 작업 진행 중 메시지'
title: 진행 중인 초안
x-i18n:
    generated_at: "2026-05-03T21:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

진행 상황 초안은 오래 실행되는 에이전트 턴이 채팅에서 살아 움직이는 것처럼 느껴지게 하면서도
대화를 임시 상태 답장 더미로 만들지 않습니다.

진행 상황 초안을 활성화하면 OpenClaw는 보이는 작업 중 메시지를 하나 만들고,
에이전트가 읽고, 계획하고, 도구를 호출하거나, 승인을 기다리는 동안 이를 업데이트한 뒤,
채널에서 안전하게 처리할 수 있으면 그 초안을 최종 답변으로 전환합니다.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

도구 사용이 많은 작업 중에는 깔끔한 상태 메시지 하나를 보여 주고,
턴이 끝나면 최종 답변을 보여 주고 싶을 때 진행 상황 초안을 사용하세요.

## 빠른 시작

채널별로 `streaming.mode: "progress"`를 설정해 진행 상황 초안을 활성화합니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

대부분은 이것으로 충분합니다. OpenClaw는 자동으로 한 단어 라벨을 선택하고,
유용한 작업이 진행되는 동안 간결한 진행 줄을 추가하며,
해당 턴의 중복 단독 진행 상황 잡담을 억제합니다.

## 사용자가 보는 내용

진행 상황 초안은 두 부분으로 구성됩니다.

| 부분       | 목적                                                          |
| ---------- | ------------------------------------------------------------- |
| 라벨       | `Thinking` 또는 `Shelling` 같은 짧은 제목입니다.              |
| 진행 줄    | 도구 호출, 작업 단계, 승인 같은 간결한 실행 업데이트입니다. |

라벨은 에이전트가 답장을 시작하면 즉시 표시됩니다. 진행 줄은 에이전트가 유용한 작업 업데이트를 내보낼 때만
추가됩니다. 가능하면 최종 답변이 초안을 대체합니다. 그렇지 않으면 OpenClaw는 최종 답변을 일반 방식으로 보내고,
채널의 전송 방식에 따라 초안을 정리하거나 업데이트를 중단합니다.

## 모드 선택

`channels.<channel>.streaming.mode`는 보이는 진행 중 동작을 제어합니다.

| 모드       | 적합한 경우                       | 채팅에 표시되는 내용                                  |
| ---------- | --------------------------------- | ----------------------------------------------------- |
| `off`      | 조용한 채널                       | 최종 답변만 표시됩니다.                               |
| `partial`  | 답변 텍스트가 나타나는 것을 보기  | 최신 답변 텍스트로 편집되는 초안 하나입니다.          |
| `block`    | 더 큰 답변 미리보기 청크          | 더 큰 청크로 업데이트되거나 추가되는 미리보기 하나입니다. |
| `progress` | 도구 사용이 많거나 오래 걸리는 턴 | 상태 초안 하나와 이후 최종 답변입니다.                |

사용자가 답변 텍스트가 토큰 단위로 스트리밍되는 것보다 “무슨 일이 일어나고 있는지”를 더 중요하게 여길 때
`progress`를 선택하세요.

답변 자체가 진행 상황 신호라면 `partial`을 선택하세요.

더 큰 텍스트 청크로 초안 미리보기 업데이트를 원하면 `block`을 선택하세요. Discord와 Telegram에서
`streaming.mode: "block"`은 여전히 미리보기 스트리밍이며, 일반 블록 전달이 아닙니다.
일반 블록 답장을 원하면 `streaming.block.enabled` 또는 레거시 `blockStreaming`을 사용하세요.

## 라벨 구성

진행 상황 라벨은 `channels.<channel>.streaming.progress` 아래에 있습니다.

기본 라벨은 `auto`이며, OpenClaw의 기본 제공 한 단어 라벨 풀에서 선택합니다.

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

고정 라벨을 사용합니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

직접 만든 자동 라벨 풀을 사용합니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

라벨을 숨기고 진행 줄만 표시합니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## 진행 줄 제어

진행 줄은 진행 상황 모드에서 기본적으로 활성화됩니다. 이는 실제 실행 이벤트에서 나옵니다.
도구 시작, 항목 업데이트, 작업 계획, 승인, 명령 출력, 패치 요약 및 유사한 에이전트 활동이 해당됩니다.

계속 보이도록 유지할 줄 수를 제한합니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

단일 진행 상황 초안은 유지하되 도구 및 작업 줄을 숨깁니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

`toolProgress: false`를 설정해도 OpenClaw는 해당 턴의 이전 단독
도구 진행 상황 메시지를 계속 억제합니다. 라벨이 구성되어 있는 경우를 제외하면,
채널은 최종 답변이 나올 때까지 시각적으로 조용하게 유지됩니다.

## 채널 동작

각 채널은 지원하는 가장 깔끔한 전송 방식을 사용합니다.

| 채널            | 진행 상황 전송 방식                    | 참고                                                                  |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 메시지 하나를 보낸 뒤 편집합니다.      | 하나의 안전한 미리보기 메시지에 들어가면 최종 텍스트를 제자리에서 편집합니다. |
| Matrix          | 이벤트 하나를 보낸 뒤 편집합니다.      | 계정 수준 스트리밍 구성이 계정 수준 초안을 제어합니다.                |
| Microsoft Teams | 개인 채팅에서 네이티브 Teams 스트림을 사용합니다. | `streaming.mode: "block"`은 Teams 블록 전달에 매핑됩니다.             |
| Slack           | 네이티브 스트림 또는 편집 가능한 초안 게시물입니다. | 스레드 사용 가능 여부가 네이티브 스트리밍 사용 가능 여부에 영향을 줍니다. |
| Telegram        | 메시지 하나를 보낸 뒤 편집합니다.      | 최종 타임스탬프가 유용하게 유지되도록 이전에 보이던 초안이 대체될 수 있습니다. |
| Mattermost      | 편집 가능한 초안 게시물입니다.         | 도구 활동이 동일한 초안 스타일 게시물에 접힙니다.                    |

안전한 편집 지원이 없는 채널은 보통 입력 표시기 또는 최종 답변만 전달하는 방식으로 대체됩니다.

## 최종화

최종 답변이 준비되면 OpenClaw는 채팅을 깔끔하게 유지하려고 합니다.

- 초안을 안전하게 최종 답변으로 만들 수 있으면 OpenClaw가 제자리에서 편집합니다.
- 채널이 네이티브 진행 상황 스트리밍을 사용하는 경우, 네이티브 전송 방식이 최종 텍스트를 수락하면 OpenClaw가 해당 스트림을 최종화합니다.
- 최종 답변에 미디어, 승인 프롬프트, 명시적인 답장 대상, 너무 많은 청크가 있거나 편집/전송에 실패하면 OpenClaw는 일반 채널 전달 경로를 통해 최종 답변을 보냅니다.

대체 경로는 의도된 동작입니다. 텍스트를 잃거나, 답장을 잘못된 스레드에 붙이거나,
채널이 안전하게 표현할 수 없는 페이로드로 초안을 덮어쓰는 것보다
새 최종 답변을 보내는 편이 낫습니다.

## 문제 해결

**최종 답변만 보입니다.**

메시지를 처리한 계정 또는 채널에 대해 `channels.<channel>.streaming.mode`가 `progress`로 설정되어 있는지 확인하세요.
일부 그룹 또는 인용 답장 경로에서는 채널이 올바른 메시지를 안전하게 편집할 수 없을 때
해당 턴의 초안 미리보기가 비활성화될 수 있습니다.

**라벨은 보이지만 도구 줄은 보이지 않습니다.**

`streaming.progress.toolProgress`를 확인하세요. 값이 `false`이면 OpenClaw는
단일 초안 동작을 유지하지만 도구 및 작업 진행 줄을 숨깁니다.

**편집된 초안 대신 새 최종 메시지가 보입니다.**

이는 안전 대체 동작입니다. 미디어 답장, 긴 답변,
명시적인 답장 대상, 오래된 Telegram 초안, 누락된 Slack 스레드 대상,
삭제된 미리보기 메시지 또는 네이티브 스트림 최종화 실패에서 발생할 수 있습니다.

**단독 진행 상황 메시지가 계속 보입니다.**

초안이 활성화되어 있으면 진행 상황 모드는 기본 단독 도구 진행 상황 메시지를 억제합니다.
단독 메시지가 계속 나타나면 해당 턴이 실제로 진행 상황 모드를 사용하고 있는지,
그리고 `streaming.mode: "off"`나 해당 메시지에 초안을 만들 수 없는 채널 경로를 사용 중이 아닌지 확인하세요.

**Teams가 Discord 또는 Telegram과 다르게 동작합니다.**

Microsoft Teams는 개인 채팅에서 일반적인 보내고 편집하는 미리보기 전송 방식 대신
네이티브 스트림을 사용합니다. 또한 Teams는 `streaming.mode: "block"`을 Teams 블록 전달로 처리합니다.
Discord와 Telegram에서 사용하는 같은 초안 미리보기 블록 모드가 없기 때문입니다.

## 관련 항목

- [스트리밍 및 청크 처리](/ko/concepts/streaming)
- [메시지](/ko/concepts/messages)
- [채널 구성](/ko/gateway/config-channels)
- [Discord](/ko/channels/discord)
- [Matrix](/ko/channels/matrix)
- [Microsoft Teams](/ko/channels/msteams)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
