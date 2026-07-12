---
read_when:
    - 장시간 실행되는 채팅 응답의 진행 상황 업데이트 표시 구성하기
    - 부분, 블록 및 진행 상황 스트리밍 모드 중에서 선택하기
    - 작업이 진행되는 동안 OpenClaw가 하나의 채널 메시지를 업데이트하는 방식을 설명합니다
    - 문제 해결 진행 상황 초안, 독립형 진행 상황 메시지 또는 마무리 대체 수단
summary: '진행 상황 초안: 에이전트가 실행되는 동안 업데이트되는 하나의 표시 가능한 작업 진행 중 메시지'
title: 진행 중인 초안
x-i18n:
    generated_at: "2026-07-12T15:11:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a7d2e60768718922b3d00c72817ff8e342a1e37c6d9a43eef30972412ad9a49
    source_path: concepts/progress-drafts.md
    workflow: 16
---

진행 상황 초안은 에이전트가 작업하는 동안 하나의 채널 메시지를 실시간 상태 표시줄로 바꿔, 임시 "아직 작업 중" 답변이 쌓이지 않도록 합니다.
`channels.<channel>.streaming.mode: "progress"`를 설정하면 OpenClaw는 실제 작업이 시작될 때 메시지를 한 번 생성하고, 에이전트가 읽고, 계획하고, 도구를 호출하거나 승인을 기다리는 동안 메시지를 수정한 다음, 이를 최종 답변으로 바꿉니다.

```text
셸 작업 중...
📖 docs/concepts/progress-drafts.md에서 읽는 중
🔎 웹 검색: "discord edit message" 검색
🛠️ Bash: 테스트 실행
```

<Note>
  `channels.discord.streaming`이 설정되지 않은 경우 Discord는 이미
  `streaming.mode: "progress"`를 기본값으로 사용하므로 별도의 설정 없이
  진행 상황 초안이 표시됩니다. 다른 모든 채널의 기본값은 `partial`
  또는 `off`입니다. 채널별 기본값 전체 표는
  [스트리밍 및 청킹](/ko/concepts/streaming#channel-mapping)을 참조하십시오.
</Note>

## 빠른 시작

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

이후의 기본값은 자동 한 단어 레이블, 5초의 시작 지연(또는 두 번째 작업 이벤트 발생 시 즉시 시작), 유용한 작업이 진행되는 동안 표시되는 간결한 진행 상황 줄, 해당 턴에서 이전의 독립형 진행 상황 메시지 억제입니다.

이 페이지에서는 진행 상황 초안 경험과 해당 설정 옵션을 설명합니다. 전체 스트리밍 모드 매트릭스, 채널별 런타임 참고 사항, 레거시 키 마이그레이션은 [스트리밍 및 청킹](/ko/concepts/streaming)을 참조하십시오.

## 사용자에게 표시되는 내용

| 부분           | 목적                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| 레이블          | `Working` 또는 `Shelling` 같은 짧은 시작/상태 줄입니다.                        |
| 진행 상황 줄 | `/verbose`와 동일한 도구 아이콘 및 세부 정보 포매터를 사용하는 간결한 실행 업데이트입니다. |

에이전트가 의미 있는 작업을 시작하고 초기 지연 시간 동안 계속 작업 중이거나, 두 번째 작업 이벤트가 즉시 발생하면 레이블이 표시됩니다. 레이블은 순환하는 진행 상황 줄 목록의 맨 위에 있으므로 구체적인 작업 줄이 충분히 표시되면 스크롤되어 사라집니다. 일반 텍스트만 포함된 답변에는 진행 상황 초안이 표시되지 않습니다. 실제 작업 업데이트에만 줄이 표시됩니다. 예를 들면 `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`, `✍️ Write: to /tmp/file` 등이 있습니다.

채널이 안전하게 처리할 수 있으면 최종 답변이 초안을 그 자리에서 대체합니다. 그렇지 않으면 OpenClaw는 일반 전송 방식으로 최종 답변을 보내고 초안을 정리하거나 업데이트를 중지합니다([완료 처리](#finalization) 참조).

## 모드 선택

`channels.<channel>.streaming.mode`는 진행 중 표시 동작을 제어합니다.

| 모드       | 적합한 용도                         | 채팅에 표시되는 내용                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 조용한 채널                   | 최종 답변만 표시됩니다.                            |
| `partial`  | 답변 텍스트가 나타나는 과정 보기      | 최신 답변 텍스트로 수정되는 하나의 초안입니다.     |
| `block`    | 더 큰 답변 미리보기 청크     | 더 큰 청크 단위로 업데이트되거나 추가되는 하나의 미리보기입니다. |
| `progress` | 도구를 많이 사용하거나 오래 실행되는 턴 | 하나의 상태 초안과 이어지는 최종 답변입니다.          |

사용자가 답변 텍스트가 토큰 단위로 스트리밍되는 것을 보는 것보다 "무슨 일이 진행 중인지"를 더 중요하게 여길 때는 `progress`를 선택하십시오. 답변 텍스트 자체가 진행 신호일 때는 `partial`, 더 큰 미리보기 청크에는 `block`을 사용하십시오. Discord와 Telegram에서 `streaming.mode: "block"`은 여전히 일반 블록 답변 전송이 아니라 미리보기 스트리밍입니다. 일반 블록 답변 전송에는 `streaming.block.enabled`를 사용하십시오.

## 레이블 설정

진행 상황 레이블은 `channels.<channel>.streaming.progress` 아래에 있습니다. 기본 `label`은 `"auto"`이며, OpenClaw에 내장된 다음 한 단어 레이블 풀에서 선택합니다.

```text
Working, Shelling, Scuttling, Clawing, Pinching, Molting, Bubbling, Tiding,
Reefing, Cracking, Sifting, Brining, Nautiling, Krilling, Barnacling,
Lobstering, Tidepooling, Pearling, Snapping, Surfacing
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

사용자 지정 레이블 풀을 사용합니다(`label: "auto"`일 때도 무작위/시드에 따라 선택됨).

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

진행 상황 줄은 도구 시작, 항목 업데이트, 작업 계획, 승인, 명령 출력, 패치 요약 및 이와 유사한 에이전트 활동과 같은 실제 실행 이벤트에서 생성됩니다.
기본적으로 활성화됩니다(`progress.toolProgress`, 기본값 `true`).

도구는 단일 호출이 아직 실행 중인 동안 형식화된 진행 상황을 내보낼 수도 있습니다. 이를 통해 느린 가져오기 또는 검색이 최종 결과를 반환하기 전에 표시되는 초안을 업데이트할 수 있습니다. 진행 상황 업데이트는 모델 콘텐츠가 비어 있고 명시적인 공개 채널 메타데이터가 포함된 부분 도구 결과입니다.

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

OpenClaw는 채널 진행 상황 UI에서 `progress.text`만 렌더링합니다. 일반 도구 결과는 나중에 `content`/`details`로 계속 전달되며, 모델에 반환되는 유일한 부분입니다.

도구에 진행 상황을 추가할 때는 짧고 일반적인 메시지를 내보내고, 작업이 유용할 만큼 충분히 오래 대기 중인 경우에만 표시되도록 지연하십시오. `web_fetch`는 정확히 5초 지연으로 이 작업을 수행합니다.

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

빠른 호출에는 진행 상황 줄이 표시되지 않습니다. 오래 걸리는 호출에는 아직 대기 중일 때 진행 상황 줄이 표시됩니다. 취소된 호출은 오래된 진행 상황이 나타나기 전에 타이머를 지웁니다. 진행 상황 텍스트는 공개 UI 보조 채널이므로 비밀, 원시 인수, 가져온 콘텐츠, 명령 출력 또는 페이지 텍스트를 절대 포함해서는 안 됩니다.

### 세부 정보 모드

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

`"explain"`은 기본값이며 간결한 레이블로 초안을 안정적으로 유지합니다.
`"raw"`는 사용 가능한 경우 내부 명령을 추가합니다. 디버깅할 때 유용하지만 채팅에서 더 많은 잡음을 만듭니다. 예를 들어 `node --check /tmp/app.js` 호출은 모드에 따라 다르게 렌더링됩니다.

| 모드      | 진행 상황 줄                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 명령/실행 텍스트

`streaming.progress.commandText`(기본값 `"raw"`)는 위의 세부 정보 모드와 별개로 exec/bash 진행 상황 줄 옆에 표시되는 명령 세부 정보의 양을 제어합니다. 명령 텍스트를 완전히 숨기면서 도구 진행 상황 줄은 계속 표시하려면 `"status"`로 설정하십시오.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### 코멘터리 레인

`streaming.progress.commentary`(기본값 `false`)는 모델의 도구 실행 전 코멘터리/서문 설명(💬, 예: "확인한 다음 ...하겠습니다")을 초안의 도구 줄 사이에 배치합니다. 채널 간 공유 설정 형식은 [스트리밍 및 청킹](/ko/concepts/streaming#commentary-progress-lane)을 참조하십시오.

### 서술형 상태

에이전트에 유틸리티 모델이 결정되면, 즉 명시적인 [`utilityModel`](/ko/gateway/config-agents#utilitymodel) 또는 주 제공자가 선언한 소형 모델 기본값(OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`)이 있으면 진행 상황 초안은 순환하는 도구 줄을 에이전트가 수행 중인 작업에 대한 짧고 일반적인 언어의 설명으로 대체합니다. 이 설명은 더 저렴한 모델이 작성하며 작업 진행에 따라 새로 고쳐집니다.

```text
Clawing

설정의 기본 모델을 업데이트한 다음 적용되도록 Gateway를 다시 시작하고
있습니다. 에이전트 목록 호출 하나가 실패하여 다시 시도하고 있습니다.
```

서술은 기본적으로 활성화되며(`streaming.progress.narration`, 기본값 `true`) 기본 모델로 절대 폴백하지 않습니다. 명시적인 `utilityModel` 또는 에이전트의 주 제공자가 선언한 기본 모델이 있을 때만 실행됩니다. 유틸리티 라우팅을 완전히 비활성화하려면 `utilityModel: ""`로 설정하십시오. 도구 줄은 아래에서 계속 누적되며 서술이 중지되면 다시 표시됩니다. 또한 서술 텍스트가 실제로 변경될 때만 초안이 수정되므로 사용량이 많은 채널에서 수정 빈도도 줄어듭니다. 원시 도구 줄을 유지하려면 비활성화하십시오.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

서술 입력은 제한되고 민감 정보가 제거됩니다. 유틸리티 모델은 수신 요청 텍스트와 초안이 렌더링할 것과 동일한 간결하고 민감 정보가 제거된 도구 요약을 받으며, 원시 명령 출력이나 도구 결과는 절대 받지 않습니다. `commandText: "status"`를 사용하면 서술 입력에서도 exec/bash 명령 텍스트가 생략되어 초안에 표시되는 내용과 일치합니다.

### 줄 제한

표시 상태로 유지할 줄 수를 제한합니다(기본값 8).

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

초안이 수정되는 동안 채팅 말풍선의 재배치를 줄이기 위해 진행 상황 줄은 자동으로 압축됩니다. 또한 OpenClaw는 초안을 반복해서 수정할 때마다 줄바꿈 위치가 달라지지 않도록 긴 줄을 잘라냅니다. 줄당 기본 제한은 120자입니다. 일반 문장은 단어 경계에서 잘리며, 경로나 원시 명령과 같은 긴 세부 정보는 접미사가 계속 표시되도록 중간 줄임표를 사용해 축약됩니다.

줄당 제한을 조정합니다.

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

### 리치 렌더링(Slack)

Slack은 진행 상황 줄을 일반 텍스트 대신 구조화된 Block Kit 필드로 렌더링할 수 있습니다.

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

리치 렌더링은 항상 Block Kit 필드와 함께 동일한 일반 텍스트 본문을 전송하므로, 더 풍부한 형식을 렌더링할 수 없는 클라이언트에서도 간결한 진행 상황 텍스트가 표시됩니다.

### 도구/작업 줄 숨기기

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

`toolProgress: false`를 사용해도 OpenClaw는 해당 턴에서 이전의 독립형 도구 진행 상황 메시지를 계속 억제합니다. 레이블이 설정된 경우 이를 제외하면 최종 답변이 표시될 때까지 채널은 시각적으로 조용한 상태를 유지합니다.

## 채널 동작

| 채널            | 진행 상황 전송 방식                     | 참고                                                                                                                                                                    |
| --------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 메시지 하나를 보낸 후 편집합니다.       | 기본값은 `progress` 모드입니다. 최종 답변에는 `-#` 활동 확인 표시가 포함되며, 답변이 전송된 후 상태 초안은 삭제됩니다.                                                    |
| Matrix          | 이벤트 하나를 보낸 후 편집합니다.       | 계정 수준 스트리밍 구성이 계정 수준 초안을 제어합니다.                                                                                                                  |
| Microsoft Teams | 개인 채팅에서 기본 Teams 스트림을 사용합니다. | 대신 `streaming.mode: "block"`은 Teams 블록 전송에 매핑됩니다.                                                                                                          |
| Slack           | 기본 스트림 또는 편집 가능한 초안 게시물입니다. | 답글 스레드 대상이 필요합니다. 대상이 없는 최상위 DM에서도 초안 미리보기 게시물과 편집 기능은 계속 제공됩니다.                                                           |
| Telegram        | 메시지 하나를 보낸 후 편집합니다.       | 진행 상황 초안과 답변 사이에 메시지가 전송되면, 클라이언트의 스크롤 위치를 갑자기 이동시키는 대신 초안을 해당 메시지 아래에 다시 게시합니다(새 게시물 생성 후 기존 게시물 삭제). |
| Mattermost      | 편집 가능한 초안 게시물입니다.          | `block` 모드에서는 완성된 텍스트 게시물과 도구 활동 게시물을 번갈아 사용하며, 다른 모드에서는 도구 활동을 동일한 초안 형식 게시물에 통합합니다.                           |

안전한 편집을 지원하지 않는 채널은 입력 중 표시기 또는
최종 답변만 전송하는 방식으로 대체됩니다. 채널별 전체 런타임 동작에 대한 자세한 내용은
[스트리밍 및 청크 분할](/ko/concepts/streaming)을 참조하십시오.

## 마무리

최종 답변이 준비되면 OpenClaw는 채팅을 깔끔하게 유지하려고 합니다:

- Discord의 `progress` 모드에서는 최종 답변이 새 메시지로 전송되며,
  작은 `-#` 활동 확인 표시가 추가됩니다(예:
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`). 해당 답변이 전달되면 상태 초안은
  삭제됩니다. 사용량이 많은 채널에서도 답변 위에 고립된 도구
  로그가 남지 않으며, 오류로 종료된 경우에는 실패한 턴의 가시적 기록으로
  초안이 유지됩니다.
- 초안을 안전하게 최종 답변으로 전환할 수 있는 경우(`partial`/`block` 모드),
  OpenClaw는 초안을 그 자리에서 수정합니다.
- 채널이 네이티브 진행 상황 스트리밍을 사용하는 경우, 네이티브 전송 계층에서
  최종 텍스트를 수락하면 OpenClaw가 해당 스트림을 완료합니다.
- 그 외의 경우(미디어, 승인 프롬프트, 명시적 답장 대상, 너무 많은
  청크 또는 수정/전송 실패) OpenClaw는 초안을 덮어쓰지 않고
  일반 채널 전달 경로를 통해 최종 답변을 전송합니다.

이 폴백은 의도된 것입니다. 채널이 안전하게 표현할 수 없는 페이로드로 인해 텍스트가 유실되거나,
답장이 잘못된 스레드에 연결되거나, 초안을 덮어쓰는 것보다 새로운 최종 답변을 보내는 편이 낫습니다.

## 문제 해결

**최종 답변만 표시됩니다.**

메시지를 처리한 계정 또는 채널의 `channels.<channel>.streaming.mode`가 `progress`인지 확인하십시오. 일부 그룹 또는 인용 답장 경로에서는 채널이 올바른 메시지를 안전하게 수정할 수 없는 경우 해당 턴의 초안 미리보기가 비활성화됩니다.

**레이블은 보이지만 도구 줄은 표시되지 않습니다.**

`streaming.progress.toolProgress`를 확인하십시오. 값이 `false`이면 OpenClaw는
단일 초안 동작을 유지하지만 도구 및 작업 진행 상황 줄을 숨깁니다.

**편집된 초안 대신 새로운 최종 메시지가 표시됩니다.**

이는 [완료 처리](#finalization)에 설명된 안전 대체 동작입니다. 미디어 답장,
긴 답변, 명시적 답장 대상, 오래된 Telegram 초안, 누락된 Slack 스레드 대상,
삭제된 미리보기 메시지 또는 네이티브 스트림 완료 실패 시 발생할 수 있습니다.

**독립적인 진행 상황 메시지가 계속 표시됩니다.**

초안이 활성화되어 있으면 진행 상황 모드는 기본 독립형 도구 진행 상황 메시지를
표시하지 않습니다. 독립형 메시지가 계속 표시되면 해당 턴에서 실제로 `progress`
모드를 사용하고 있으며 `streaming.mode: "off"` 또는 해당 메시지의 초안을 생성할
수 없는 채널 경로를 사용하지 않는지 확인하십시오.

**Teams는 Discord 또는 Telegram과 다르게 동작합니다.**

Microsoft Teams는 일반적인 전송 후 편집 방식의 미리보기 전송 대신 개인 채팅에서
네이티브 스트림을 사용하며, Discord와 Telegram 같은 초안 미리보기 블록 모드가
없으므로 `streaming.mode: "block"`을 Teams 블록 전송에 매핑합니다.

## 관련 문서

- [스트리밍 및 청킹](/ko/concepts/streaming)
- [메시지](/ko/concepts/messages)
- [채널 구성](/ko/gateway/config-channels)
- [Discord](/ko/channels/discord)
- [Matrix](/ko/channels/matrix)
- [Microsoft Teams](/ko/channels/msteams)
- [Slack](/ko/channels/slack)
- [Telegram](/ko/channels/telegram)
- [Mattermost](/ko/channels/mattermost)
