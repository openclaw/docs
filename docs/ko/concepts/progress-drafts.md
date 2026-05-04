---
read_when:
    - 장시간 실행되는 채팅 턴에 표시되는 진행 상황 업데이트 구성
    - 부분, 블록 및 진행 상황 스트리밍 모드 중 선택
    - 작업이 진행되는 동안 OpenClaw가 하나의 채널 메시지를 업데이트하는 방법 설명
    - 진행 초안, 독립형 진행 메시지 또는 최종화 폴백 문제 해결
summary: '진행 초안: 에이전트가 실행되는 동안 업데이트되는 표시 가능한 작업 진행 중 메시지 하나'
title: 진행 중인 초안
x-i18n:
    generated_at: "2026-05-04T02:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

진행 상황 초안은 장시간 실행되는 에이전트 턴이 채팅에서 살아 움직이는 것처럼 느껴지게 하면서도
대화를 임시 상태 답글 더미로 만들지 않습니다.

진행 상황 초안을 활성화하면 OpenClaw는 턴이 실제 작업을 하고 있음이 확인된 뒤에만
보이는 작업 진행 중 메시지를 하나 만들고, 에이전트가 읽기, 계획 수립, 도구 호출 또는 승인 대기를 하는 동안 이를 업데이트한 다음,
채널이 안전하게 처리할 수 있으면 그 초안을 최종 답변으로 전환합니다.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

도구 사용이 많은 작업 중에는 깔끔한 상태 메시지 하나를 보여 주고
턴이 끝나면 최종 답변을 표시하고 싶을 때 진행 상황 초안을 사용하세요.

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

대개 이것만으로 충분합니다. OpenClaw는 자동 한 단어 라벨을 선택하고, 작업이 최소 5초 동안 지속되거나 두 번째 작업 이벤트가 발생할 때까지 기다린 뒤, 유용한 작업이 진행되는 동안 간결한 진행 상황 줄을 추가하며, 해당 턴의 중복된 독립 실행형 진행 상황 잡담을 억제합니다.

## 사용자에게 보이는 내용

진행 상황 초안은 두 부분으로 구성됩니다.

| 부분           | 목적                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| 라벨          | `Thinking...` 또는 `Shelling...` 같은 짧은 제목.                       |
| 진행 상황 줄 | 상세 출력과 동일한 도구 라벨 및 아이콘을 사용하는 간결한 실행 업데이트. |

라벨은 에이전트가 의미 있는 작업을 시작한 뒤 5초 동안 계속 바쁘거나 두 번째 작업 이벤트를 발생시키면 표시됩니다. 일반 텍스트만 있는 답글에는 진행 상황 초안이 표시되지 않습니다. 진행 상황 줄은 에이전트가 유용한 작업 업데이트를 발생시킬 때만 추가됩니다. 예를 들어 `🛠️ Exec`, `🔎 Web Search`, `✍️ Write: to /tmp/file` 같은 항목입니다.
기본적으로 `/verbose`와 동일한 간결한 설명 모드를 사용합니다. 디버깅 중이고 원시 명령/세부 정보도 추가하고 싶다면
`agents.defaults.toolProgressDetail: "raw"`를 설정하세요.
가능하면 최종 답변이 초안을 대체합니다. 그렇지 않으면
OpenClaw는 최종 답변을 일반 방식으로 보내고 채널 전송 방식에 따라
초안을 정리하거나 업데이트를 중단합니다.

## 모드 선택

`channels.<channel>.streaming.mode`는 보이는 진행 중 동작을 제어합니다.

| 모드       | 적합한 경우                         | 채팅에 표시되는 내용                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 조용한 채널                   | 최종 답변만 표시.                            |
| `partial`  | 답변 텍스트가 나타나는 과정을 보고 싶을 때      | 최신 답변 텍스트로 편집되는 초안 하나.     |
| `block`    | 더 큰 답변 미리보기 청크     | 더 큰 청크 단위로 업데이트되거나 추가되는 미리보기 하나. |
| `progress` | 도구 사용이 많거나 장시간 실행되는 턴 | 상태 초안 하나, 이후 최종 답변.          |

사용자가 답변 텍스트가 토큰 단위로 스트리밍되는 것보다 "무슨 일이 일어나고 있는지"에 더 관심이 있을 때 `progress`를 선택하세요.

답변 자체가 진행 상황 신호라면 `partial`을 선택하세요.

더 큰 텍스트 청크로 초안 미리보기 업데이트를 원할 때는 `block`을 선택하세요. Discord와 Telegram에서 `streaming.mode: "block"`은 여전히 일반 블록 전달이 아니라 미리보기 스트리밍입니다. 일반 블록 답글을 원할 때는 `streaming.block.enabled` 또는 레거시 `blockStreaming`을 사용하세요.

## 라벨 구성

진행 상황 라벨은 `channels.<channel>.streaming.progress` 아래에 있습니다.

기본 라벨은 `auto`이며, OpenClaw의 내장
줄임표가 붙은 한 단어 라벨 풀에서 선택합니다.

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

직접 정의한 자동 라벨 풀을 사용합니다.

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

라벨을 숨기고 진행 상황 줄만 표시합니다.

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

진행 상황 줄은 진행 상황 모드에서 기본적으로 활성화됩니다. 이 줄은 실제 실행 이벤트에서 생성됩니다. 도구 시작, 항목 업데이트, 작업 계획, 승인, 명령 출력, 패치 요약 및 이와 유사한 에이전트 활동이 여기에 포함됩니다.

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

`"explain"`은 기본값이며 `🛠️ Exec: check JS syntax for /tmp/app.js` 같은 간결한 라벨로 초안을 안정적으로 유지합니다. `"raw"`는 사용할 수 있을 때 내부 명령/세부 정보를 추가하므로 디버깅 중에는 유용하지만 채팅에서는 더 시끄럽습니다.

예를 들어 동일한 명령도 세부 정보 모드에 따라 다르게 표시됩니다.

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

`toolProgress: false`를 설정해도 OpenClaw는 해당 턴의 이전 독립 실행형
도구 진행 상황 메시지를 계속 억제합니다. 라벨이 구성된 경우를 제외하면 채널은 최종 답변이 나올 때까지 시각적으로 조용하게 유지됩니다.

## 채널 동작

각 채널은 지원하는 가장 깔끔한 전송 방식을 사용합니다.

| 채널         | 진행 상황 전송 방식                     | 참고                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 메시지 하나를 보낸 뒤 편집.        | 하나의 안전한 미리보기 메시지에 들어갈 때 최종 텍스트를 제자리에서 편집.      |
| Matrix          | 이벤트 하나를 보낸 뒤 편집.          | 계정 수준 스트리밍 구성이 계정 수준 초안을 제어.         |
| Microsoft Teams | 개인 채팅에서 네이티브 Teams 스트림. | `streaming.mode: "block"`은 Teams 블록 전달에 매핑됨.               |
| Slack           | 네이티브 스트림 또는 편집 가능한 초안 게시물.  | 스레드 사용 가능 여부가 네이티브 스트리밍 사용 가능 여부에 영향을 줌.     |
| Telegram        | 메시지 하나를 보낸 뒤 편집.        | 최종 타임스탬프가 유용하게 유지되도록 이전의 보이는 초안이 대체될 수 있음. |
| Mattermost      | 편집 가능한 초안 게시물.                   | 도구 활동은 동일한 초안 스타일 게시물에 접힘.               |

안전한 편집 지원이 없는 채널은 일반적으로 입력 표시기 또는 최종 답변만 전달하는 방식으로 대체됩니다.

## 마무리

최종 답변이 준비되면 OpenClaw는 채팅을 깔끔하게 유지하려고 합니다.

- 초안을 최종 답변으로 안전하게 전환할 수 있으면 OpenClaw는 이를 제자리에서 편집합니다.
- 채널이 네이티브 진행 상황 스트리밍을 사용하면 OpenClaw는 네이티브 전송이 최종 텍스트를 수락할 때 해당 스트림을 마무리합니다.
- 최종 답변에 미디어, 승인 프롬프트, 명시적 답글 대상, 너무 많은 청크가 있거나 편집/전송 실패가 발생하면 OpenClaw는 일반 채널 전달 경로를 통해 최종 답변을 보냅니다.

대체 경로는 의도된 동작입니다. 텍스트를 잃거나, 답글이 잘못된 스레드에 달리거나, 채널이 안전하게 표현할 수 없는 페이로드로 초안을 덮어쓰는 것보다 새 최종 답변을 보내는 편이 낫습니다.

## 문제 해결

**최종 답변만 보입니다.**

메시지를 처리한 계정 또는 채널에 대해 `channels.<channel>.streaming.mode`가 `progress`로 설정되어 있는지 확인하세요. 일부 그룹 또는 인용 답글 경로에서는 채널이 올바른 메시지를 안전하게 편집할 수 없을 때 해당 턴의 초안 미리보기가 비활성화될 수 있습니다.

**라벨은 보이지만 도구 줄이 보이지 않습니다.**

`streaming.progress.toolProgress`를 확인하세요. `false`이면 OpenClaw는 단일 초안 동작은 유지하지만 도구 및 작업 진행 상황 줄을 숨깁니다.

**편집된 초안 대신 새 최종 메시지가 보입니다.**

이는 안전 대체 동작입니다. 미디어 답글, 긴 답변, 명시적 답글 대상, 오래된 Telegram 초안, 누락된 Slack 스레드 대상, 삭제된 미리보기 메시지 또는 네이티브 스트림 마무리 실패에서 발생할 수 있습니다.

**독립 실행형 진행 상황 메시지가 계속 보입니다.**

진행 상황 모드는 초안이 활성화되어 있을 때 기본 독립 실행형 도구 진행 상황 메시지를 억제합니다. 독립 실행형 메시지가 계속 표시된다면 해당 턴이 실제로 진행 상황 모드를 사용하고 있는지, 그리고 `streaming.mode: "off"`나 해당 메시지에 대해 초안을 만들 수 없는 채널 경로를 사용하고 있지 않은지 확인하세요.

**Teams가 Discord 또는 Telegram과 다르게 동작합니다.**

Microsoft Teams는 일반적인 보내기-편집 미리보기 전송 방식 대신 개인 채팅에서 네이티브 스트림을 사용합니다. 또한 Teams는 Discord와 Telegram에서 사용하는 것과 같은 초안 미리보기 블록 모드가 없기 때문에 `streaming.mode: "block"`을 Teams 블록 전달로 처리합니다.

## 관련 항목

- [스트리밍 및 청킹](/ko/concepts/streaming)
- [메시지](/ko/concepts/messages)
- [채널 구성](/ko/gateway/config-channels)
- [Discord](/ko/channels/discord)
- [Matrix](/ko/channels/matrix)
- [Microsoft Teams](/ko/channels/msteams)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
