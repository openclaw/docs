---
read_when:
    - 오래 실행되는 채팅 턴에 표시되는 진행 상황 업데이트 구성하기
    - partial, block, progress 스트리밍 모드 중 선택하기
    - 작업이 진행 중일 때 OpenClaw가 하나의 채널 메시지를 업데이트하는 방식 설명
    - 진행 상황 초안, 독립 실행형 진행 상황 메시지 또는 최종화 fallback 문제 해결
summary: '진행 중 초안: 에이전트가 실행되는 동안 업데이트되는 하나의 표시되는 진행 중 메시지'
title: 진행 중인 초안
x-i18n:
    generated_at: "2026-06-27T17:25:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

진행 초안은 오래 실행되는 에이전트 턴이 채팅에서 살아 움직이는 것처럼 느껴지게 하면서도
대화를 임시 상태 답장 더미로 만들지 않습니다.

진행 초안이 활성화되면 OpenClaw는 턴이 실제 작업을 수행 중임이 확인된 뒤에만
보이는 작업 진행 중 메시지 하나를 만들고, 에이전트가 읽고, 계획하고, 도구를 호출하거나
승인을 기다리는 동안 이를 업데이트한 다음, 채널에서 안전하게 처리할 수 있으면 그 초안을
최종 답변으로 전환합니다.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

도구를 많이 사용하는 작업 중에는 깔끔한 상태 메시지 하나를 보여 주고,
턴이 끝나면 최종 답변을 보여 주고 싶을 때 진행 초안을 사용하세요.

## 빠른 시작

`streaming.mode: "progress"`로 채널별 진행 초안을 활성화합니다.

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

보통은 이것만으로 충분합니다. OpenClaw는 자동 한 단어 레이블을 선택하고, 작업이 최소
5초 동안 지속되거나 두 번째 작업 이벤트를 내보낼 때까지 기다린 뒤, 유용한 작업이
진행되는 동안 간결한 진행 줄을 추가하며, 해당 턴의 중복 독립 진행 메시지를 억제합니다.

## 사용자가 보는 내용

진행 초안에는 두 부분이 있습니다.

| 부분      | 목적                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| 레이블    | `Working` 또는 `Shelling` 같은 짧은 시작/상태 줄입니다.                               |
| 진행 줄   | 자세한 출력과 동일한 도구 아이콘 및 세부 형식 지정기를 사용하는 간결한 실행 업데이트입니다. |

레이블은 에이전트가 의미 있는 작업을 시작하고 5초 동안 계속 바쁘거나 두 번째 작업 이벤트를
내보낸 뒤에 나타납니다. 레이블은 순환 진행 줄 목록의 일부이므로, 충분한 구체적 작업이
표시되면 시작 상태는 위로 밀려 사라집니다. 일반 텍스트 전용 답장에는 진행 초안이 표시되지
않습니다. 진행 줄은 에이전트가 유용한 작업 업데이트를 내보낼 때만 추가됩니다. 예를 들어
`🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`, 또는
`✍️ Write: to /tmp/file` 같은 항목입니다.
기본적으로 `/verbose`와 같은 간결한 설명 모드를 사용합니다. 디버깅 중이고 원시
명령/세부 정보도 함께 덧붙이고 싶다면 `agents.defaults.toolProgressDetail: "raw"`를
설정하세요.
가능한 경우 최종 답변이 초안을 대체합니다. 그렇지 않으면 OpenClaw는 최종 답변을 일반적인
방식으로 보내고, 채널의 전송 방식에 따라 초안을 정리하거나 더 이상 업데이트하지 않습니다.

## 모드 선택

`channels.<channel>.streaming.mode`는 표시되는 진행 중 동작을 제어합니다.

| 모드       | 적합한 용도                         | 채팅에 표시되는 내용                                  |
| ---------- | ----------------------------------- | ----------------------------------------------------- |
| `off`      | 조용한 채널                         | 최종 답변만 표시됩니다.                               |
| `partial`  | 답변 텍스트가 나타나는 과정을 보기  | 최신 답변 텍스트로 편집되는 초안 하나입니다.          |
| `block`    | 더 큰 답변 미리 보기 조각           | 더 큰 조각으로 업데이트되거나 추가되는 미리 보기 하나입니다. |
| `progress` | 도구를 많이 쓰거나 오래 실행되는 턴 | 상태 초안 하나가 표시된 뒤 최종 답변이 표시됩니다.    |

사용자가 답변 텍스트가 토큰 단위로 스트리밍되는 것을 보는 것보다 “무슨 일이 일어나고 있는지”를
더 중요하게 여길 때는 `progress`를 선택하세요.

답변 자체가 진행 신호라면 `partial`을 선택하세요.

더 큰 텍스트 조각으로 초안 미리 보기 업데이트를 원한다면 `block`을 선택하세요. Discord와
Telegram에서 `streaming.mode: "block"`은 여전히 일반 블록 전달이 아니라 미리 보기
스트리밍입니다. 일반 블록 답장을 원한다면 `streaming.block.enabled` 또는 레거시
`blockStreaming`을 사용하세요.

## 레이블 구성

진행 레이블은 `channels.<channel>.streaming.progress` 아래에 있습니다.

기본 레이블은 `auto`이며, OpenClaw의 내장 단일 단어 레이블 풀에서 선택합니다.

```text
Working
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

자체 자동 레이블 풀을 사용합니다.

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

레이블을 숨기고 진행 줄만 표시합니다.

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

진행 줄은 진행 모드에서 기본적으로 활성화됩니다. 진행 줄은 실제 실행 이벤트에서 나옵니다.
도구 시작, 항목 업데이트, 작업 계획, 승인, 명령 출력, 패치 요약 및 이와 유사한 에이전트
활동이 여기에 해당합니다.

도구는 단일 도구 호출이 아직 실행 중일 때도 형식화된 진행 상태를 내보낼 수 있습니다.
이 방식으로 느린 가져오기나 검색은 도구가 최종 결과를 반환하기 전에 보이는 초안을
업데이트할 수 있습니다. 진행 업데이트는 비어 있는 모델 콘텐츠와 명시적인 공개 채널
메타데이터를 가진 부분 도구 결과입니다.

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw는 채널 진행 UI에서 `progress.text`만 렌더링합니다.
일반 도구 결과는 나중에 `content` 및 `details`로 계속 도착하며, 모델에 반환되는 유일한
부분입니다.

도구에 진행 상태를 추가할 때는 짧고 일반적인 메시지를 사용하고, 작업이 유용할 만큼 충분히
오래 대기 중일 때까지 지연하세요.

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

이 패턴은 빠른 호출은 진행률 줄을 표시하지 않고, 긴 호출은 아직 대기 중일 때 진행률 줄을 표시하며, 취소된 호출은 오래된 진행률이 나타나기 전에 타이머를 지운다는 뜻입니다. 진행률 텍스트는 공개 UI 보조 채널이므로 비밀, 원시 인수, 가져온 콘텐츠, 명령 출력 또는 페이지 텍스트를 포함해서는 안 됩니다.

OpenClaw는 진행률 초안과 `/verbose`에 같은 포매터를 사용합니다.

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"`이 기본값이며 `🛠️ check JS syntax for /tmp/app.js` 같은 간결한 레이블로 초안을 안정적으로 유지합니다. `"raw"`는 사용 가능할 때 기본 명령/세부 정보를 덧붙이며, 디버깅 중에는 유용하지만 채팅에서는 더 산만합니다.

예를 들어 같은 명령도 세부 정보 모드에 따라 다르게 표시됩니다.

| 모드      | 진행률 줄                                                  |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

표시되는 줄 수를 제한합니다.

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

초안이 편집되는 동안 채팅 말풍선의 재배치를 줄이기 위해 진행률 줄은 자동으로 압축됩니다.

OpenClaw는 반복적인 초안 편집이 매번 업데이트될 때마다 다르게 줄바꿈되지 않도록 기본적으로 긴 진행률 줄을 잘라냅니다. 기본 줄당 예산은 120자입니다. 산문은 단어 경계에서 잘리고, 경로나 원시 명령 같은 긴 세부 정보는 접미사가 계속 보이도록 가운데 줄임표로 축약됩니다.

줄당 예산을 조정합니다.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack은 진행률 줄을 단일 텍스트 본문 대신 구조화된 Block Kit 필드로 렌더링할 수 있습니다.

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

풍부한 렌더링은 같은 일반 텍스트 대체 표시를 유지하므로 더 풍부한 형식을 지원하지 않는 채널과 클라이언트도 압축된 진행률 텍스트를 계속 표시할 수 있습니다.

단일 진행률 초안은 유지하되 도구 및 작업 줄은 숨깁니다.

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

`toolProgress: false`를 사용하면 OpenClaw는 해당 턴에 대해 이전의 독립형 도구 진행률 메시지도 계속 억제합니다. 레이블이 구성되어 있는 경우를 제외하면, 최종 답변 전까지 채널은 시각적으로 조용하게 유지됩니다.

## 채널 동작

각 채널은 지원하는 가장 깔끔한 전송 방식을 사용합니다.

| 채널         | 진행률 전송 방식                     | 참고                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 메시지 하나를 보낸 다음 편집합니다.        | 최종 텍스트가 안전한 미리보기 메시지 하나에 들어가면 그 자리에서 편집됩니다.      |
| Matrix          | 이벤트 하나를 보낸 다음 편집합니다.          | 계정 수준 스트리밍 구성이 계정 수준 초안을 제어합니다.         |
| Microsoft Teams | 개인 채팅에서 네이티브 Teams 스트림을 사용합니다. | `streaming.mode: "block"`은 Teams 블록 전송에 매핑됩니다.               |
| Slack           | 네이티브 스트림 또는 편집 가능한 초안 게시물을 사용합니다.  | 스레드 사용 가능 여부는 네이티브 스트리밍을 사용할 수 있는지에 영향을 줍니다.     |
| Telegram        | 메시지 하나를 보낸 다음 편집합니다.        | 최종 타임스탬프가 유용하게 유지되도록 이전의 보이는 초안이 교체될 수 있습니다. |
| Mattermost      | 편집 가능한 초안 게시물을 사용합니다.                   | 도구 활동은 같은 초안 스타일 게시물에 접혀 들어갑니다.               |

안전한 편집 지원이 없는 채널은 일반적으로 입력 표시기 또는 최종 답변만 전달하는 방식으로 대체됩니다.

## 마무리

최종 답변이 준비되면 OpenClaw는 채팅을 깔끔하게 유지하려고 시도합니다.

- 초안을 안전하게 최종 답변으로 만들 수 있으면 OpenClaw가 그 자리에서 편집합니다.
- 채널이 네이티브 진행률 스트리밍을 사용하는 경우, 네이티브 전송 방식이 최종 텍스트를 수락하면 OpenClaw가 해당 스트림을 마무리합니다.
- 최종 답변에 미디어, 승인 프롬프트, 명시적 답장 대상, 너무 많은 청크가 있거나 편집/전송에 실패한 경우, OpenClaw는 일반 채널 전달 경로를 통해 최종 답변을 보냅니다.

대체 경로는 의도된 것입니다. 텍스트를 잃거나, 답장을 잘못 스레드에 연결하거나, 채널이 안전하게 표현할 수 없는 페이로드로 초안을 덮어쓰는 것보다 새 최종 답변을 보내는 편이 낫습니다.

## 문제 해결

**최종 답변만 보입니다.**

메시지를 처리한 계정 또는 채널에 대해 `channels.<channel>.streaming.mode`가 `progress`로 설정되어 있는지 확인하세요. 일부 그룹 또는 인용 답장 경로에서는 채널이 올바른 메시지를 안전하게 편집할 수 없을 때 해당 턴의 초안 미리보기를 비활성화할 수 있습니다.

**레이블은 보이지만 도구 줄은 보이지 않습니다.**

`streaming.progress.toolProgress`를 확인하세요. `false`이면 OpenClaw는 단일 초안 동작은 유지하지만 도구 및 작업 진행률 줄을 숨깁니다.

**편집된 초안 대신 새 최종 메시지가 보입니다.**

이는 안전 대체 동작입니다. 미디어 답장, 긴 답변, 명시적 답장 대상, 오래된 Telegram 초안, 누락된 Slack 스레드 대상, 삭제된 미리보기 메시지 또는 네이티브 스트림 마무리 실패 때문에 발생할 수 있습니다.

**독립형 진행률 메시지가 아직 보입니다.**

진행률 모드는 초안이 활성 상태일 때 기본 독립형 도구 진행률 메시지를 억제합니다. 독립형 메시지가 계속 나타나면 해당 턴이 실제로 진행률 모드를 사용하고 있는지, `streaming.mode: "off"`나 해당 메시지에 대한 초안을 만들 수 없는 채널 경로를 사용하고 있지는 않은지 확인하세요.

**Teams가 Discord 또는 Telegram과 다르게 동작합니다.**

Microsoft Teams는 개인 채팅에서 일반적인 보내기-및-편집 미리보기 전송 대신 네이티브 스트림을 사용합니다. 또한 Teams는 Discord와 Telegram에서 사용하는 동일한 초안 미리보기 블록 모드가 없기 때문에 `streaming.mode: "block"`을 Teams 블록 전달로 처리합니다.

## 관련

- [스트리밍 및 청킹](/ko/concepts/streaming)
- [메시지](/ko/concepts/messages)
- [채널 구성](/ko/gateway/config-channels)
- [Discord](/ko/channels/discord)
- [Matrix](/ko/channels/matrix)
- [Microsoft Teams](/ko/channels/msteams)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
