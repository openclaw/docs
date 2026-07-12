---
read_when:
    - 채널에서 스트리밍 또는 청킹이 작동하는 방식 설명하기
    - 블록 스트리밍 또는 채널 청킹 동작 변경
    - 중복/조기 블록 응답 또는 채널 미리보기 스트리밍 디버깅
summary: 스트리밍 + 청킹 동작(블록 응답, 채널 미리보기 스트리밍, 모드 매핑)
title: 스트리밍 및 청킹
x-i18n:
    generated_at: "2026-07-12T15:12:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw에는 서로 독립적인 두 개의 스트리밍 계층이 있으며, 현재 채널 메시지에는 **진정한
토큰 델타 스트리밍이 없습니다**.

- **블록 스트리밍(채널):** 어시스턴트가 작성하는 동안 완료된 **블록**을
  내보냅니다. 이는 토큰 델타가 아니라 일반 채널 메시지입니다.
- **미리보기 스트리밍(Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  생성 중에 임시 **미리보기 메시지**를 업데이트합니다(전송 + 편집/추가).

## 블록 스트리밍(채널 메시지)

블록 스트리밍은 어시스턴트 출력이 준비되는 대로 큰 단위의 청크로 전송합니다.

```text
모델 출력
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ 버퍼가 증가함에 따라 청커가 블록을 내보냄
       └─ (blockStreamingBreak=message_end)
            └─ message_end에서 청커가 플러시됨
                   └─ 채널 전송(블록 답글)
```

- `text_delta/events`: 모델 스트림 이벤트입니다(비스트리밍 모델에서는 드물 수 있음).
- `chunker`: 최소/최대 범위와 분할 지점 우선순위를 적용하는 `EmbeddedBlockChunker`입니다.
- `channel send`: 실제 발신 메시지입니다(블록 답글).

**제어 항목**(별도 표기가 없으면 모두 `agents.defaults` 아래에 있음):

| 키                                                           | 값 / 형태                                                               | 기본값     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (전송 전에 스트리밍된 블록 병합)    | -          |
| `*.blockStreaming` (채널 재정의)                             | `true` / `false`, 채널별(및 계정별) 블록 스트리밍 강제                   | -          |
| `*.textChunkLimit` (예: `channels.whatsapp.textChunkLimit`)  | 숫자, 절대 상한                                                         | 4000       |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 숫자, UI 잘림을 방지하기 위해 긴 답글을 분할하는 유연한 줄 수 상한       | 17         |

`chunkMode: "newline"`은 모든 줄 바꿈이 아니라 빈 줄(단락 경계)을 기준으로 분할하며,
텍스트가 제한을 초과하면 길이 기반 청크 분할로 대체합니다.

중첩된 `streaming` 구성을 사용하는 채널(Telegram, Discord, Slack, iMessage,
Microsoft Teams)은 이러한 재정의를
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`로 표기합니다. 중첩
구성이 없는 채널(예: Signal, IRC, Google Chat, WhatsApp,
Mattermost)에는 평면 형식인 `*.chunkMode` / `*.blockStreaming` /
`*.blockStreamingCoalesce`가 적용됩니다. 중첩 스트리밍 채널의 오래된 평면 키는
`openclaw doctor --fix`를 통해 마이그레이션되며 런타임에서 읽지 않습니다.

`blockStreamingBreak`의 **경계 의미**:

- `text_end`: 청커가 내보내는 즉시 블록을 스트리밍하고 각 `text_end`에서 플러시합니다.
- `message_end`: 어시스턴트 메시지가 완료될 때까지 기다린 후 버퍼링된
  출력을 플러시합니다. 버퍼링된 텍스트가 `maxChars`를 초과하면 여전히 청커를 사용하므로
  마지막에 여러 청크를 내보낼 수 있습니다.

### 블록 스트리밍을 통한 미디어 전달

스트리밍 미디어는 `mediaUrl` 또는 `mediaUrls` 같은 구조화된 페이로드 필드를
사용해야 합니다. 스트리밍된 텍스트는 첨부 파일 명령으로 파싱되지 않습니다. 블록
스트리밍이 미디어를 일찍 전송하면 OpenClaw는 해당 턴의 전송 사실을 기억합니다. 최종
어시스턴트 페이로드가 동일한 미디어 URL을 반복하면 첨부 파일을 다시 전송하지 않고
최종 전송에서 중복 미디어를 제거합니다.

완전히 동일한 최종 페이로드는 억제됩니다. 최종 페이로드가 이미 스트리밍된 미디어
주변에 별도의 텍스트를 추가하면 OpenClaw는 미디어를 한 번만 전송하면서 새 텍스트는
계속 전송합니다. 이를 통해 Telegram 같은 채널에서 음성
메모나 파일이 중복되는 것을 방지합니다.

## 청크 분할 알고리즘(하한/상한)

블록 청크 분할은 `EmbeddedBlockChunker`로 구현됩니다.

- **하한:** 버퍼가 `minChars` 이상이 될 때까지 내보내지 않습니다(강제 시 제외).
- **상한:** `maxChars` 이전의 분할 지점을 우선하며, 강제 시 `maxChars`에서 분할합니다.
- **분할 지점 우선순위 체인:** `paragraph` -> `newline` -> `sentence` ->
  공백 -> 강제 분할.
- **코드 펜스:** 펜스 내부에서는 절대 분할하지 않습니다. `maxChars`에서 강제로 분할할 때는
  Markdown을 유효하게 유지하도록 펜스를 닫았다가 다시 엽니다.

`maxChars`는 채널의 `textChunkLimit`로 제한되므로 채널별 상한을
초과할 수 없습니다.

## 병합(스트리밍된 블록 합치기)

블록 스트리밍이 활성화되면 OpenClaw는 전송 전에 **연속된 블록
청크를 병합**하여 점진적인 출력을 계속 제공하면서 한 줄 메시지가 연속으로 전송되는 현상을
줄일 수 있습니다.

- 병합은 플러시 전에 **유휴 간격**(`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`로 제한되며 이를 초과하면 플러시됩니다.
- `minChars`는 충분한 텍스트가 누적될 때까지 작은 조각이 전송되지 않게 합니다
  (최종 플러시에서는 남은 텍스트를 항상 전송함).
- 연결자는 `blockStreamingChunk.breakPreference`에서 결정됩니다. `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> 공백입니다.
- 채널 재정의는 `*.blockStreamingCoalesce`를 통해 사용할 수 있습니다
  (계정별 구성 포함).
- 별도로 재정의하지 않으면 Discord, Signal, Slack의 기본 병합 설정은 `{ minChars: 1500, idleMs: 1000 }`입니다.

## 블록 사이의 사람과 유사한 속도 조절

블록 스트리밍이 활성화되면 여러 말풍선으로 구성된 응답이 더 자연스럽게 느껴지도록
첫 번째 블록 이후 블록 답글 사이에 **무작위 일시 중지**를 추가합니다.

| `agents.defaults.humanDelay.mode` | 동작                         |
| --------------------------------- | ---------------------------- |
| `off` (기본값)                    | 일시 중지 없음               |
| `natural`                         | 800-2500ms 무작위 일시 중지  |
| `custom`                          | `minMs`/`maxMs`              |

에이전트별로 `agents.list[].humanDelay`를 통해 재정의합니다. **블록
답글**에만 적용되며 최종 답글이나 도구 요약에는 적용되지 않습니다.

## "청크 스트리밍 또는 전체 스트리밍"

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (진행에 따라 내보냄). Telegram 이외의 채널에는 `*.blockStreaming: true`도 필요합니다.
- **마지막에 전체 스트리밍:** `blockStreamingBreak: "message_end"` (한 번
  플러시하되, 매우 길면 여러 청크가 될 수 있음).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"` (최종 답글만 전송).

`*.blockStreaming`을 명시적으로 `true`로 설정하지 않으면 블록 스트리밍은
**비활성화됩니다**. 채널은 블록 답글 없이도 실시간 미리보기
(`channels.<channel>.streaming`)를 스트리밍할 수 있습니다.
`blockStreaming*` 기본값은 구성 루트가 아니라 `agents.defaults` 아래에 있습니다.

## 미리보기 스트리밍 모드

정식 키: `channels.<channel>.streaming`(중첩된 `{ mode, ... }` 형식이며, 기존의
최상위 불리언/문자열 표기법은 `openclaw doctor --fix`로 다시 작성됨).

| 모드       | 동작                                                              |
| ---------- | ----------------------------------------------------------------- |
| `off`      | 미리보기 스트리밍 비활성화                                        |
| `partial`  | 단일 미리보기를 최신 텍스트로 교체                                |
| `block`    | 청크 분할/추가 단계에 따라 미리보기 업데이트                      |
| `progress` | 생성 중 진행률/상태 미리보기, 완료 시 최종 답변                   |

`streaming.mode: "block"`은 Discord 및 Telegram처럼 편집을 지원하는
채널의 미리보기 스트리밍 모드이며, 그 자체로 해당 채널의
블록 전달을 활성화하지는 않습니다. 일반 블록 답글에는 `streaming.block.enabled`를
사용합니다(중첩된 `streaming` 구성이 없는 채널은 대신 평면 `blockStreaming`
키를 유지함). Microsoft Teams는
예외입니다. 초안 미리보기 블록 전송을 지원하지 않으므로 `streaming.mode:
"block"`은 네이티브 스트리밍을 완전히 비활성화하며, 답글은 네이티브
부분/진행률 스트리밍 대신 일반 블록 전달로 게시됩니다. Mattermost도
다릅니다. `block` 모드에서는 완료된 텍스트 블록과
도구 활동 블록 사이에서 미리보기를 전환하므로, 이전 블록이 편집 가능한 하나의 초안에서
덮어쓰기되는 대신 별도 게시물로 계속 표시됩니다.

### 채널 매핑

| 채널       | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | 예    | 예        | 예      | 편집 가능한 진행률 초안    |
| Discord    | 예    | 예        | 예      | 편집 가능한 진행률 초안    |
| Slack      | 예    | 예        | 예      | 예                         |
| Mattermost | 예    | 예        | 예      | 예                         |
| MS Teams   | 예    | 예        | 예      | 네이티브 진행률 스트림     |

미리보기 청크 구성(`streaming.preview.chunk.*`, 예:
`channels.discord.streaming` 또는 `channels.telegram.streaming` 아래)의 기본값은
`minChars: 200`, `maxChars: 800`(채널 `textChunkLimit`로 제한됨),
`breakPreference: "paragraph"`입니다.

Slack 전용:

- `channels.slack.streaming.nativeTransport`는
  `channels.slack.streaming.mode="partial"`일 때 Slack 네이티브 스트리밍 API
  호출(`chat.startStream`/`chat.appendStream`/`chat.stopStream`)을 전환합니다
  (기본값: `true`).
- Slack 네이티브 스트리밍과 Slack 어시스턴트 스레드 상태에는 답글
  스레드 대상이 필요합니다. 최상위 DM에는 이러한 스레드 형식의 미리보기가 표시되지 않지만,
  Slack 초안 미리보기 게시물과 편집은 계속 사용할 수 있습니다.

### 기존 키 마이그레이션

| 채널     | 기존 키                                                    | 상태                                                                                                                                                              |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, 스칼라/불리언 `streaming`                   | `openclaw doctor --fix`를 통해 `streaming.mode`로 다시 작성되며 런타임에서 읽지 않음                                                                               |
| Discord  | `streamMode`, 불리언 `streaming`                          | `openclaw doctor --fix`를 통해 `streaming.mode`로 다시 작성되며 런타임에서 읽지 않음                                                                               |
| Slack    | `streamMode`; 불리언 `streaming`; 기존 `nativeStreaming` | `openclaw doctor --fix`를 통해 `streaming.mode`로 다시 작성되며(불리언/기존 형식의 경우 `streaming.nativeTransport`도 해당) 런타임에서 읽지 않음                     |

## 런타임 동작

### Telegram

- DM 및 그룹/토픽 전반에서 `sendMessage` + `editMessageText` 미리보기 업데이트를 사용하며, 최종 텍스트는 활성 미리보기를 그 자리에서 편집합니다. Telegram의 임시 30초 "입력 중" 초안(`sendMessageDraft`)은 답변 스트리밍에 사용하지 않습니다.
- 짧은 초기 미리보기에는 푸시 알림 UX를 위해 여전히 디바운스를 적용하지만, 활성 실행이 시각적으로 아무 표시 없이 유지되지 않도록 제한된 지연 후에 표시합니다.
- 긴 최종 답변은 첫 번째 청크에 미리보기 메시지를 재사용하고 나머지 청크만 전송합니다.
- `block` 모드는 `streaming.preview.chunk.maxChars`(기본값 800, Telegram의 편집 제한인 4096으로 상한 설정)에 도달하면 미리보기를 새 메시지로 전환하며, 다른 모드는 하나의 미리보기를 최대 4096자까지 늘립니다.
- `progress` 모드는 도구 진행 상황을 편집 가능한 상태 초안에 유지하고, 답변 스트리밍이 활성 상태이지만 아직 사용할 수 있는 도구 줄이 없으면 상태 레이블을 표시하며, 완료 시 초안을 지우고 일반 전송을 통해 최종 답변을 보냅니다.
- 완료된 텍스트가 확인되기 전에 최종 편집이 실패하면 OpenClaw는 일반 최종 전송을 사용하고 오래된 미리보기를 정리합니다.
- 이중 스트리밍을 방지하기 위해 Telegram 블록 스트리밍이 명시적으로 활성화된 경우 미리보기 스트리밍을 건너뜁니다.
- `/reasoning stream`은 최종 전송 후 삭제되는 일시적인 미리보기에 추론 내용을 작성할 수 있습니다.
- Telegram의 선택 인용 답장은 예외입니다. `replyToMode`가 `"off"`가 아니고 선택한 인용 텍스트가 있으면 OpenClaw는 해당 턴의 답변 미리보기 스트림을 건너뜁니다(최종 답변은 네이티브 인용 답장 경로를 거쳐야 합니다). 따라서 도구 진행 상황 미리보기 줄을 렌더링할 수 없습니다. 선택한 인용 텍스트가 없는 현재 메시지 답장은 미리보기 스트리밍을 계속 유지합니다. 자세한 내용은 [Telegram 채널 문서](/ko/channels/telegram)를 참조하십시오.

### Discord

- 메시지 전송 및 편집 방식의 미리보기를 사용합니다.
- `block` 모드는 초안 청크 분할(`draftChunk`)을 사용합니다.
- Discord 블록 스트리밍이 명시적으로 활성화된 경우 미리보기 스트리밍을 건너뜁니다.
- `progress` 모드는 작은 `-#` 활동 내역(생각/도구 호출 횟수 및 경과 시간)을 최종 답변에 추가하고, 해당 답변이 전송되면 상태 초안을 삭제하므로 활동이 많은 채널에서도 답장 위에 고립된 도구 로그가 남지 않습니다. 오류 최종 응답의 경우 실패한 턴의 기록으로 초안을 유지합니다.
- 최종 미디어, 오류 및 명시적 답장 페이로드는 새 초안을 플러시하지 않고 대기 중인 미리보기를 취소한 후 일반 전송을 사용합니다.

### Slack

- 사용 가능한 경우 `partial`은 Slack 네이티브 스트리밍(`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`은 추가 방식의 초안 미리보기를 사용합니다.
- `progress`는 상태 미리보기 텍스트를 사용한 다음 최종 답변을 전송합니다.
- 답장 스레드가 없는 최상위 DM은 Slack 네이티브 스트리밍 대신 초안 미리보기 게시물과 편집을 사용합니다.
- 네이티브 및 초안 미리보기 스트리밍은 해당 턴의 블록 답장을 억제하므로 Slack 답장은 하나의 전송 경로로만 스트리밍됩니다.
- 최종 미디어/오류 페이로드와 진행 상황 최종 응답은 일회성 초안 메시지를 만들지 않습니다. 미리보기를 편집할 수 있는 텍스트/블록 최종 응답만 대기 중인 초안 텍스트를 플러시합니다.

### Mattermost

- `partial` 모드에서는 사고 과정과 부분 응답 텍스트를 하나의 초안 미리보기 게시물로 스트리밍하며, 최종 답변을 안전하게 보낼 수 있게 되면 해당 게시물을 그 자리에서 최종 확정합니다.
- `progress` 모드에서는 사고 과정과 도구 활동을 하나의 상태 미리보기로 스트리밍하며, 최종 답변을 안전하게 보낼 수 있게 되면 해당 미리보기를 그 자리에서 최종 확정합니다.
- `block` 모드에서는 완성된 텍스트 게시물과 도구 활동 게시물을 번갈아 사용하며, 병렬 및 연속 도구 업데이트는 현재 도구 활동 게시물을 공유합니다.
- 미리보기 게시물이 삭제되었거나 최종 확정 시점에 다른 이유로 사용할 수 없는 경우 새로운 최종 게시물을 보내는 방식으로 대체합니다.
- 최종 미디어/오류 페이로드는 임시 미리보기 게시물을 플러시하지 않고, 정상 전달 전에 대기 중인 미리보기 업데이트를 취소합니다.

### Matrix

- 최종 텍스트에서 미리보기 이벤트를 재사용할 수 있으면 초안 미리보기를 그 자리에서 최종 확정합니다.
- 미디어 전용, 오류 및 응답 대상 불일치 최종 결과는 정상 전달 전에 대기 중인 미리보기 업데이트를 취소하며, 이미 표시된 오래된 미리보기는 삭제 처리합니다.

## 도구 진행 상황 미리보기 업데이트

미리보기 스트리밍에는 **도구 진행 상황** 업데이트도 포함될 수 있습니다. 도구가 실행되는 동안 최종 답변에 앞서 동일한 미리보기 메시지에 "웹 검색 중", "파일 읽는 중", "도구 호출 중"과 같은 짧은 상태 표시 줄이 나타납니다.
Codex 앱 서버 모드에서는 Codex 서문/해설 메시지도 이와 동일한 미리보기 경로를 사용하므로, "확인하고 있습니다..."와 같은 짧은 진행 상황 안내가 최종 답변의 일부가 되지 않으면서 편집 가능한 초안에 스트리밍될 수 있습니다. 이를 통해 여러 단계로 도구를 사용하는 턴에서 첫 번째 사고 과정 미리보기와 최종 답변 사이가 조용히 멈춰 있는 대신 시각적으로 진행 중임을 보여 줍니다.

장시간 실행되는 도구는 반환하기 전에 유형이 지정된 진행 상태를 내보낼 수 있습니다. 예를 들어,
`web_fetch`은 시작할 때 5초 타이머를 설정합니다. 가져오기가 여전히
대기 중이면 미리 보기에 `Fetching page content...`이 표시됩니다. 그 전에 가져오기가 완료되거나
취소되면 진행 상태 줄이 출력되지 않습니다. 이후의 최종 도구
결과는 여전히 모델에 정상적으로 전달됩니다.

지원되는 인터페이스:

- **Discord**, **Slack**, **Telegram**, **Matrix**는 미리보기 스트리밍이 활성화되어 있으면 기본적으로 도구 진행 상황과
  Codex 서문 업데이트를 실시간 미리보기 편집에 스트리밍합니다. Microsoft Teams는
  개인 채팅에서 네이티브 진행 상황 스트림을 사용합니다.
- Telegram은 `v2026.4.22`부터 도구 진행 상황 미리보기 업데이트가 활성화된 상태로
  출시되었으며, 이를 계속 활성화하면 해당 출시 동작이 유지됩니다.
- **Mattermost**는 `partial` 및 `progress` 모드에서 도구 활동을 하나의 미리보기 게시물로
  통합하거나, `block` 모드에서는 텍스트 블록 사이에 하나의 도구 활동 게시물로
  통합합니다(위 내용 참조).
- 도구 진행 상황 편집은 활성 미리보기 스트리밍 모드를 따르며, 미리보기 스트리밍이
  `off`이거나 블록 스트리밍이 메시지를 대신 처리하는 경우 건너뜁니다. Telegram에서
  `streaming.mode: "off"`는 최종 결과만 전송합니다. 즉, 일반적인 진행 상황 안내도
  독립적인 상태 메시지로 전송되지 않고 억제되지만, 승인 프롬프트, 미디어 페이로드,
  오류는 계속 정상적으로 라우팅됩니다.
- 미리보기 스트리밍을 유지하면서 도구 진행 상황 줄을 숨기려면 해당 채널의
  `streaming.preview.toolProgress`를 `false`로 설정하십시오(기본값:
  `true`). 명령/실행 텍스트를 숨기면서 도구 진행 상황 줄은 계속 표시하려면
  `streaming.preview.commandText`를 `"status"`로 설정하거나
  `streaming.progress.commandText`를 `"status"`로 설정하십시오. 기본값은 출시된
  동작을 유지하기 위한 `"raw"`입니다. 이 정책은 Discord, Matrix,
  Microsoft Teams, Mattermost, Slack 초안 미리보기, Telegram을 비롯하여
  OpenClaw의 압축 진행 상황 렌더러를 사용하는 초안/진행 상황 채널에서 공유됩니다.
  미리보기 편집을 완전히 비활성화하려면 `streaming.mode`를 `off`로 설정하십시오.

## 진행 상황 초안 렌더링

진행 상황 모드 초안(`streaming.progress.*`)은 크기가 제한되며 채널별로
구성할 수 있습니다.

| 키                                | 기본값          | 동작                                                             |
| --------------------------------- | --------------- | ---------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`             | 초안 레이블 아래에 유지할 압축 진행 상황 줄의 최대 개수          |
| `streaming.progress.maxLineChars` | `120`           | 잘리기 전 압축 줄당 최대 문자 수(단어 경계 고려)                  |
| `streaming.progress.label`        | `"auto"`        | 초안 제목이며, 사용자 지정 문자열 또는 숨기기 위한 `false`       |
| `streaming.progress.labels`       | 기본 제공 풀     | `label: "auto"`일 때 사용할 후보 레이블                           |

### 해설 진행 상황 레인

도구 진행 상황 외에도 압축 진행 상황 렌더러는 초안에 하나의 레인을 더
표시할 수 있습니다.

- **`streaming.progress.commentary`** - 모델의 도구 사용 전
  **해설**(“확인한 다음...”과 같은 짧은 진행 설명)을 진행 상황 초안의
  도구 줄 사이에 배치하여 렌더링합니다.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

진행 상황 줄은 계속 표시하되 원시 명령/실행 텍스트는 숨깁니다.

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

다른 압축 진행 상황 채널 키 아래에서도 동일한 구조를 사용하십시오. 예를 들면
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` 또는 Slack 초안 미리보기가 있습니다. 진행 상황 초안 모드에서는
동일한 정책을 `streaming.progress` 아래에 배치하십시오.

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## 관련 문서

- [메시지 수명 주기 리팩터링](/ko/concepts/message-lifecycle-refactor) - 공유 미리보기, 편집, 스트림 및 완료 처리의 목표 설계
- [진행 상황 초안](/ko/concepts/progress-drafts) - 긴 턴이 진행되는 동안 업데이트되는 작업 진행 중 메시지
- [메시지](/ko/concepts/messages) - 메시지 수명 주기 및 전달
- [재시도](/ko/concepts/retry) - 전달 실패 시 재시도 동작
- [채널](/ko/channels) - 채널별 스트리밍 지원
