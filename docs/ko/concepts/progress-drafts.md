---
read_when:
    - 장시간 실행되는 채팅 턴에 표시되는 진행 상황 업데이트 구성
    - 부분, 블록, 진행률 스트리밍 모드 중 선택하기
    - 작업 진행 중 OpenClaw가 하나의 채널 메시지를 업데이트하는 방식 설명
    - 진행 상황 초안, 독립형 진행 상황 메시지 또는 완료 처리 폴백 문제 해결
summary: '진행 상황 초안: 에이전트가 실행되는 동안 업데이트되는 표시 가능한 작업 진행 중 메시지 하나'
title: 진행 중인 초안
x-i18n:
    generated_at: "2026-05-04T06:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

진행 상황 초안은 장시간 실행되는 에이전트 턴이 채팅에서 살아 있는 것처럼 느껴지게 하면서도
대화를 임시 상태 답장의 더미로 만들지 않습니다.

진행 상황 초안을 사용하면 OpenClaw는 턴이 실제 작업을 하고 있음이 확인된 뒤에만
보이는 작업 진행 중 메시지를 하나 만들고, 에이전트가 읽고, 계획하고, 도구를 호출하거나,
승인을 기다리는 동안 이를 업데이트한 다음, 채널에서 안전하게 처리할 수 있으면 그 초안을
최종 답변으로 전환합니다.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

도구 사용이 많은 작업 중에는 깔끔한 상태 메시지 하나를 보여 주고
턴이 끝나면 최종 답변을 보여 주고 싶을 때 진행 상황 초안을 사용하세요.

## 빠른 시작

`streaming.mode: "progress"`로 채널별 진행 상황 초안을 활성화합니다.

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

대개 이것만으로 충분합니다. OpenClaw는 자동 한 단어 레이블을 선택하고, 작업이
최소 5초 동안 지속되거나 두 번째 작업 이벤트를 내보낼 때까지 기다린 뒤, 유용한
작업이 진행되는 동안 간결한 진행 상황 줄을 추가하며, 해당 턴의 중복 독립형 진행 상황
잡담을 억제합니다.

## 사용자에게 보이는 내용

진행 상황 초안에는 두 부분이 있습니다.

| 부분           | 목적                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| 레이블          | `Thinking...` 또는 `Shelling...` 같은 짧은 제목입니다.                       |
| 진행 상황 줄 | 자세한 출력과 동일한 도구 레이블 및 아이콘을 사용하는 간결한 실행 업데이트입니다. |

레이블은 에이전트가 의미 있는 작업을 시작하고 5초 동안 계속 바쁘거나 두 번째 작업 이벤트를
내보낸 뒤에 나타납니다. 일반 텍스트 전용 답장은 진행 상황 초안을 표시하지 않습니다.
진행 상황 줄은 에이전트가 유용한 작업 업데이트를 내보낼 때만 추가됩니다. 예를 들어
`🛠️ Exec`, `🔎 Web Search`, `✍️ Write: to /tmp/file` 같은 항목입니다.
기본적으로 `/verbose`와 동일한 간결한 설명 모드를 사용합니다. 디버깅 중이고 원시
명령/세부 정보도 덧붙이고 싶으면 `agents.defaults.toolProgressDetail: "raw"`를 설정하세요.
가능하면 최종 답변이 초안을 대체합니다. 그렇지 않으면
OpenClaw가 최종 답변을 정상적으로 보내고 채널의 전송 방식에 따라 초안을 정리하거나
업데이트를 중단합니다.

## 모드 선택

`channels.<channel>.streaming.mode`는 보이는 진행 중 동작을 제어합니다.

| 모드       | 가장 적합한 경우                         | 채팅에 표시되는 내용                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 조용한 채널                   | 최종 답변만 표시됩니다.                            |
| `partial`  | 답변 텍스트가 나타나는 과정을 보는 경우      | 최신 답변 텍스트로 편집되는 초안 하나입니다.     |
| `block`    | 더 큰 답변 미리보기 청크     | 더 큰 청크로 업데이트되거나 덧붙는 미리보기 하나입니다. |
| `progress` | 도구 사용이 많거나 장시간 실행되는 턴 | 상태 초안 하나가 표시된 뒤 최종 답변이 표시됩니다.          |

사용자가 답변 텍스트가 토큰 단위로 스트리밍되는 것을 보는 것보다 "무슨 일이 일어나고 있는지"에
더 관심이 있다면 `progress`를 선택하세요.

답변 자체가 진행 신호라면 `partial`을 선택하세요.

더 큰 텍스트 청크로 초안 미리보기 업데이트를 원한다면 `block`을 선택하세요. Discord와
Telegram에서 `streaming.mode: "block"`은 여전히 미리보기 스트리밍이지 일반 블록 전달이
아닙니다. 일반 블록 답장을 원하면 `streaming.block.enabled` 또는 레거시
`blockStreaming`을 사용하세요.

## 레이블 구성

진행 상황 레이블은 `channels.<channel>.streaming.progress` 아래에 있습니다.

기본 레이블은 `auto`이며, OpenClaw의 내장
줄임표가 붙은 한 단어 레이블 풀에서 선택합니다.

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
```

고정 레이블을 사용합니다.

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

사용자 지정 자동 레이블 풀을 사용합니다.

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

레이블을 숨기고 진행 상황 줄만 표시합니다.

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

## 진행 상황 줄 제어

진행 상황 줄은 진행 상황 모드에서 기본적으로 활성화됩니다. 이는 실제 실행 이벤트에서
나옵니다. 도구 시작, 항목 업데이트, 작업 계획, 승인, 명령 출력, 패치 요약 및 유사한
에이전트 활동입니다.

OpenClaw는 진행 상황 초안과 `/verbose`에 동일한 포매터를 사용합니다.

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"`은 기본값이며 `🛠️ Exec: check JS syntax for /tmp/app.js` 같은
간결한 레이블로 초안을 안정적으로 유지합니다. `"raw"`는 사용할 수 있을 때 내부
명령/세부 정보를 덧붙이므로 디버깅 중에는 유용하지만 채팅에서는 더 시끄럽습니다.

예를 들어 같은 명령도 세부 정보 모드에 따라 다르게 표시됩니다.

| 모드      | 진행 상황 줄                                                        |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

보이는 상태로 유지할 줄 수를 제한합니다.

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

초안이 편집되는 동안 채팅 말풍선 재배치를 줄이기 위해 진행 상황 줄은 자동으로 압축됩니다.

OpenClaw는 반복되는 초안 편집이 업데이트마다 다르게 줄바꿈되지 않도록 기본적으로 긴 진행 상황 줄을
잘라냅니다. 접두사는 읽기 쉬운 상태로 유지되고, 경로나 원시 명령 같은 긴 세부 정보는
줄임표로 짧아집니다.

Slack은 진행 상황 줄을 단일 텍스트 본문 대신 구조화된 Block Kit 필드로 렌더링할 수 있습니다.

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

리치 렌더링은 동일한 일반 텍스트 대체 표시를 유지하므로 더 풍부한 형태를 지원하지 않는
채널과 클라이언트도 간결한 진행 상황 텍스트를 계속 표시할 수 있습니다.

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

`toolProgress: false`를 사용하면 OpenClaw는 해당 턴의 이전 독립형
도구 진행 상황 메시지도 계속 억제합니다. 레이블이 구성된 경우를 제외하면 채널은
최종 답변이 올 때까지 시각적으로 조용하게 유지됩니다.

## 채널 동작

각 채널은 지원하는 가장 깔끔한 전송 방식을 사용합니다.

| 채널         | 진행 상황 전송 방식                     | 참고                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 메시지 하나를 보낸 뒤 편집합니다.        | 안전한 미리보기 메시지 하나에 들어가면 최종 텍스트가 제자리에서 편집됩니다.      |
| Matrix          | 이벤트 하나를 보낸 뒤 편집합니다.          | 계정 수준 스트리밍 구성이 계정 수준 초안을 제어합니다.         |
| Microsoft Teams | 개인 채팅에서 네이티브 Teams 스트림을 사용합니다. | `streaming.mode: "block"`은 Teams 블록 전달에 매핑됩니다.               |
| Slack           | 네이티브 스트림 또는 편집 가능한 초안 게시물입니다.  | 스레드 사용 가능 여부가 네이티브 스트리밍 사용 가능 여부에 영향을 줍니다.     |
| Telegram        | 메시지 하나를 보낸 뒤 편집합니다.        | 오래된 보이는 초안은 최종 타임스탬프가 유용하게 유지되도록 대체될 수 있습니다. |
| Mattermost      | 편집 가능한 초안 게시물입니다.                   | 도구 활동은 동일한 초안 스타일 게시물에 접혀 들어갑니다.               |

안전한 편집 지원이 없는 채널은 일반적으로 입력 표시기 또는 최종 전용 전달로 대체됩니다.

## 마무리

최종 답변이 준비되면 OpenClaw는 채팅을 깔끔하게 유지하려고 시도합니다.

- 초안이 안전하게 최종 답변이 될 수 있으면 OpenClaw는 이를 제자리에서 편집합니다.
- 채널이 네이티브 진행 상황 스트리밍을 사용하면, 네이티브 전송 방식이 최종 텍스트를
  받아들일 때 OpenClaw가 해당 스트림을 마무리합니다.
- 최종 답변에 미디어, 승인 프롬프트, 명시적 답장 대상, 너무 많은 청크가 있거나
  편집/전송이 실패하면 OpenClaw는 일반 채널 전달 경로를 통해 최종 답변을 보냅니다.

대체 경로는 의도된 동작입니다. 텍스트를 잃거나, 답장이 잘못된 스레드에 달리거나,
채널이 안전하게 표현할 수 없는 페이로드로 초안을 덮어쓰는 것보다 새 최종 답변을 보내는 편이
낫습니다.

## 문제 해결

**최종 답변만 보입니다.**

메시지를 처리한 계정 또는 채널에 대해 `channels.<channel>.streaming.mode`가
`progress`로 설정되어 있는지 확인하세요. 일부 그룹 또는 인용 답장 경로에서는 채널이 올바른
메시지를 안전하게 편집할 수 없을 때 해당 턴의 초안 미리보기를 비활성화할 수 있습니다.

**레이블은 보이지만 도구 줄은 보이지 않습니다.**

`streaming.progress.toolProgress`를 확인하세요. `false`이면 OpenClaw는
단일 초안 동작을 유지하지만 도구 및 작업 진행 상황 줄을 숨깁니다.

**편집된 초안 대신 새 최종 메시지가 보입니다.**

이는 안전 대체 동작입니다. 미디어 답장, 긴 답변, 명시적 답장 대상, 오래된 Telegram 초안,
누락된 Slack 스레드 대상, 삭제된 미리보기 메시지 또는 네이티브 스트림 마무리 실패에서
발생할 수 있습니다.

**독립형 진행 상황 메시지가 계속 보입니다.**

진행 상황 모드는 초안이 활성화되어 있을 때 기본 독립형 도구 진행 상황 메시지를 억제합니다.
독립형 메시지가 계속 나타나면 해당 턴이 실제로 진행 상황 모드를 사용하고 있으며
`streaming.mode: "off"` 또는 해당 메시지에 대한 초안을 만들 수 없는 채널 경로를
사용하고 있지 않은지 확인하세요.

**Teams가 Discord 또는 Telegram과 다르게 동작합니다.**

Microsoft Teams는 일반적인 보내고 편집하는 미리보기 전송 방식 대신 개인 채팅에서
네이티브 스트림을 사용합니다. 또한 Teams는 Discord와 Telegram에서 사용하는 동일한
초안 미리보기 블록 모드가 없기 때문에 `streaming.mode: "block"`을 Teams 블록 전달로
취급합니다.

## 관련 문서

- [스트리밍 및 청킹](/ko/concepts/streaming)
- [메시지](/ko/concepts/messages)
- [채널 구성](/ko/gateway/config-channels)
- [Discord](/ko/channels/discord)
- [Matrix](/ko/channels/matrix)
- [Microsoft Teams](/ko/channels/msteams)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
