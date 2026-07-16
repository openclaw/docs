---
read_when:
    - 채널에서 스트리밍 또는 청크 분할이 작동하는 방식 설명하기
    - 블록 스트리밍 또는 채널 청킹 동작 변경하기
    - 중복/조기 블록 응답 또는 채널 미리보기 스트리밍 디버깅
summary: 스트리밍 + 청킹 동작(블록 응답, 채널 미리보기 스트리밍, 모드 매핑)
title: 스트리밍 및 청킹
x-i18n:
    generated_at: "2026-07-16T12:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw에는 서로 독립적인 두 개의 스트리밍 계층이 있으며, 현재 채널 메시지에는 **진정한
토큰 델타 스트리밍이 없습니다**.

- **블록 스트리밍(채널):** 어시스턴트가 작성하는 동안 완성된 **블록**을
  전송합니다. 이는 토큰 델타가 아니라 일반 채널 메시지입니다.
- **미리보기 스트리밍(Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  생성하는 동안 임시 **미리보기 메시지**를 업데이트합니다(전송 + 편집/추가).

## 블록 스트리밍(채널 메시지)

블록 스트리밍은 어시스턴트 출력을 사용할 수 있게 되는 대로 큰 단위의 청크로 전송합니다.

```text
모델 출력
  └─ text_delta/이벤트
       ├─ (blockStreamingBreak=text_end)
       │    └─ 버퍼가 커지면 청커가 블록을 전송함
       └─ (blockStreamingBreak=message_end)
            └─ 청커가 message_end에서 플러시함
                   └─ 채널 전송(블록 답글)
```

- `text_delta/events`: 모델 스트림 이벤트(비스트리밍 모델에서는 드물 수 있음).
- `chunker`: 최솟값/최댓값 범위와 분할 우선순위를 적용하는 `EmbeddedBlockChunker`.
- `channel send`: 실제 발신 메시지(블록 답글).

**제어 항목**(별도 명시가 없으면 모두 `agents.defaults` 아래에 있음):

| 키                                                          | 값/형식                                                          | 기본값    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (전송 전 스트리밍된 블록 병합) | -          |
| `*.streaming.block.enabled` (채널 재정의)               | `true` / `false`, 채널별(및 계정별)로 블록 스트리밍 강제 적용  | -          |
| `*.textChunkLimit` (예: `channels.whatsapp.textChunkLimit`) | 숫자, 절대 상한                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | UI 잘림을 방지하기 위해 세로로 긴 답글을 분할하는 줄 수의 소프트 상한     | 17         |

`streaming.chunkMode: "newline"`은 모든 줄바꿈이 아니라 빈 줄(문단 경계)을 기준으로 분할하며,
텍스트가 제한을 초과하면 길이 기반 청크 분할로 대체합니다.

번들 채널에서는 이러한 재정의를
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}` 형식으로 표기합니다. 평면형
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` 표기는
모든 번들 채널에서 레거시입니다. `openclaw doctor --fix`은 이를 중첩 형식으로
마이그레이션하며 채널 스키마는 이를 거부합니다. 여전히 평면형 표기를 사용하는
외부 SDK Plugin 구성은 다음 릴리스 주기까지 사용 중단 예정인 대체 동작을 통해
계속 작동합니다(런타임 경고 포함).

`blockStreamingBreak`의 **경계 의미 체계**:

- `text_end`: 청커가 전송하는 즉시 블록을 스트리밍하며, 각 `text_end`에서 플러시합니다.
- `message_end`: 어시스턴트 메시지가 완료될 때까지 기다린 후 버퍼링된
  출력을 플러시합니다. 버퍼링된 텍스트가 `maxChars`을 초과하면 여전히 청커를 사용하므로
  마지막에 여러 청크를 전송할 수 있습니다.

### 블록 스트리밍을 통한 미디어 전송

스트리밍 미디어는 `mediaUrl` 또는
`mediaUrls` 같은 구조화된 페이로드 필드를 사용해야 하며, 스트리밍된 텍스트는 첨부 파일 명령으로 파싱되지 않습니다. 블록
스트리밍이 미디어를 먼저 전송하면 OpenClaw는 해당 턴의 전송 사실을 기억합니다.
최종 어시스턴트 페이로드가 동일한 미디어 URL을 반복하면 최종 전송에서
첨부 파일을 다시 보내는 대신 중복 미디어를 제거합니다.

완전히 동일한 최종 페이로드는 억제됩니다. 최종 페이로드가 이미 스트리밍된
미디어 주변에 별도의 텍스트를 추가하면 OpenClaw는 미디어를 한 번만 전송하면서
새 텍스트는 계속 전송합니다. 이를 통해 Telegram 같은 채널에서 음성
메모나 파일이 중복되는 것을 방지합니다.

## 청크 분할 알고리즘(하한/상한)

블록 청크 분할은 `EmbeddedBlockChunker`에서 구현됩니다.

- **하한:** 강제되지 않는 한 버퍼가 `minChars` 이상이 될 때까지 전송하지 않습니다.
- **상한:** `maxChars` 이전에서 분할하는 것을 우선하며, 강제 시 `maxChars`에서 분할합니다.
- **분할 우선순위:** `paragraph` -> `newline` -> `sentence` ->
  공백 -> 강제 분할.
- **코드 펜스:** 펜스 내부에서는 절대 분할하지 않으며, `maxChars`에서 강제될 경우
  Markdown의 유효성을 유지하도록 펜스를 닫았다가 다시 엽니다.

`maxChars`은 채널의 `textChunkLimit`에 맞춰 제한되므로
채널별 상한을 초과할 수 없습니다.

## 병합(스트리밍된 블록 합치기)

블록 스트리밍이 활성화되면 OpenClaw는 전송 전에 **연속된 블록
청크를 병합**하여 점진적인 출력을 제공하면서 한 줄짜리 메시지가 과도하게 전송되는 것을 줄일 수 있습니다.

- 병합은 플러시하기 전에 **유휴 간격**(`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`으로 제한되며 이를 초과하면 플러시됩니다.
- `minChars`은 충분한 텍스트가 누적될 때까지 작은 조각이 전송되지 않게 합니다
  (최종 플러시에서는 항상 남은 텍스트를 전송합니다).
- 결합자는 `blockStreamingChunk.breakPreference`에서 파생됩니다. `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> 공백.
- 채널 재정의는 `*.streaming.block.coalesce`을 통해 사용할 수 있습니다(계정별
  구성 포함).
- Discord, Signal, Slack의 기본 병합 설정은 재정의하지 않는 한 `{ minChars: 1500, idleMs: 1000 }`입니다.

## 블록 사이의 사람과 유사한 속도 조절

블록 스트리밍이 활성화되면 여러 말풍선으로 구성된 응답이 더 자연스럽게 느껴지도록
첫 번째 블록 이후의 블록 답글 사이에 **무작위 일시 중지**를 추가합니다.

| `agents.defaults.humanDelay.mode` | 동작                |
| --------------------------------- | ----------------------- |
| `off` (기본값)                   | 일시 중지 없음                |
| `natural`                         | 800-2500ms 무작위 일시 중지 |
| `custom`                          | `minMs`/`maxMs`         |

에이전트별로 `agents.list[].humanDelay`을 통해 재정의합니다. **블록
답글**에만 적용되며 최종 답글이나 도구 요약에는 적용되지 않습니다.

## "청크 스트리밍 또는 전체 전송"

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (진행되는 대로 전송). Telegram 이외의 채널에는
  `*.streaming.block.enabled: true`도 필요합니다.
- **마지막에 전체 스트리밍:** `blockStreamingBreak: "message_end"`(한 번
  플러시하며, 매우 길면 여러 청크일 수 있음).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"`(최종 답글만).

`*.streaming.block.enabled`을 명시적으로 `true`으로
설정하지 않으면 블록 스트리밍은 **꺼져 있습니다**(예외: QQ Bot에는 `streaming.block` 키가 없으며
`channels.qqbot.streaming.mode`가 `"off"`이 아닌 한 블록 답글을 스트리밍합니다). 채널은 블록
답글 없이 실시간 미리보기(`channels.<channel>.streaming.mode`)를
스트리밍할 수 있습니다. `blockStreaming*` 기본값은 구성 루트가 아니라 `agents.defaults` 아래에 있습니다.

## 미리보기 스트리밍 모드

표준 키: `channels.<channel>.streaming`(중첩된 `{ mode, ... }`; 레거시
최상위 불리언/문자열 표기는 `openclaw doctor --fix`에서 다시 작성됩니다).

| 모드       | 동작                                                              |
| ---------- | --------------------------------------------------------------------- |
| `off`      | 미리보기 스트리밍 비활성화                                             |
| `partial`  | 단일 미리보기를 최신 텍스트로 교체                              |
| `block`    | 청크 분할/추가 단계로 미리보기 업데이트                             |
| `progress` | 생성 중 진행률/상태 미리보기를 표시하고 완료 시 최종 답변 표시 |

`streaming.mode: "block"`은 Discord 및 Telegram 같은 편집 가능
채널의 미리보기 스트리밍 모드이며, 그 자체로 해당 채널의 블록 전송을
활성화하지는 않습니다. 일반 블록 답글에는 `streaming.block.enabled`을 사용하십시오.
Microsoft Teams는
예외입니다. 초안 미리보기 블록 전송을 지원하지 않으므로 `streaming.mode:
"block"`은 네이티브 스트리밍을 완전히 비활성화하며, 답글은 네이티브 부분/진행률 스트리밍 대신 일반
블록 전송으로 전달됩니다. Mattermost도
다릅니다. `block` 모드에서는 완료된 텍스트와 도구 활동 블록 사이에서 미리보기를 전환하므로
이전 블록은 편집 가능한 하나의 초안에서 덮어쓰이지 않고 별도의 게시물로 계속 표시됩니다.

### 채널 매핑

| 채널    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | 예   | 예       | 예     | 편집 가능한 진행률 초안 |
| Discord    | 예   | 예       | 예     | 편집 가능한 진행률 초안 |
| Slack      | 예   | 예       | 예     | 예                     |
| Mattermost | 예   | 예       | 예     | 예                     |
| MS Teams   | 예   | 예       | 예     | 네이티브 진행률 스트림  |

미리보기 청크 구성(`streaming.preview.chunk.*`, 예:
`channels.discord.streaming` 또는 `channels.telegram.streaming` 아래)의 기본값은
`minChars: 200`, `maxChars: 800`(채널 `textChunkLimit`에 맞춰 제한됨), 그리고
`breakPreference: "paragraph"`입니다.

Slack 전용:

- `channels.slack.streaming.mode="partial"`일 때 `channels.slack.streaming.nativeTransport`은 Slack 네이티브 스트리밍 API
  호출(`chat.startStream`/`chat.appendStream`/`chat.stopStream`)을 전환합니다
  (기본값: `true`).
- Slack 네이티브 스트리밍과 Slack 어시스턴트 스레드 상태에는 답글
  스레드 대상이 필요합니다. 최상위 DM에는 해당 스레드 형식 미리보기가 표시되지 않지만
  Slack 초안 미리보기 게시물과 편집은 계속 사용할 수 있습니다.

### 레거시 키 마이그레이션

| 채널  | 레거시 키                                                 | 상태                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, 스칼라/불리언 `streaming`                    | `openclaw doctor --fix`에 의해 `streaming.mode`으로 다시 작성되며 런타임에서는 읽지 않음                                                                        |
| Discord  | `streamMode`, 불리언 `streaming`                           | `openclaw doctor --fix`에 의해 `streaming.mode`으로 다시 작성되며 런타임에서는 읽지 않음                                                                        |
| Slack    | `streamMode`; 불리언 `streaming`; 레거시 `nativeStreaming` | `openclaw doctor --fix`에 의해 `streaming.mode`(및 불리언/레거시 형식의 경우 `streaming.nativeTransport`)으로 다시 작성되며 런타임에서는 읽지 않음         |
| Matrix   | 스칼라/불리언 `streaming`                                  | `openclaw doctor --fix`에 의해 `streaming.mode`(Matrix의 `"quiet"` 모드 포함)으로 다시 작성되며 런타임에서는 읽지 않음                                    |
| Feishu   | 불리언 `streaming`                                         | `openclaw doctor --fix`에 의해 `streaming.mode`으로 다시 작성되며 런타임에서는 읽지 않음                                                                        |
| QQ Bot   | 불리언 `streaming`; `streaming.c2cStreamApi`               | `openclaw doctor --fix`에 의해 `streaming.mode`(및 불리언/`c2cStreamApi` 형식의 경우 `streaming.nativeTransport`)으로 다시 작성되며 런타임에서는 읽지 않음 |

## 런타임 동작

### Telegram

- DM 및 그룹/주제 전반에서 `sendMessage` + `editMessageText` 미리보기 업데이트를 사용하며,
  최종 텍스트는 활성 미리보기를 그 자리에서 편집합니다. Telegram의
  일시적인 30초 "입력 중" 초안(`sendMessageDraft`)은 답변
  스트리밍에 사용되지 않습니다.
- 짧은 초기 미리보기에는 푸시 알림 UX를 위해 여전히 디바운스가 적용되지만,
  활성 실행이 시각적으로 계속 조용한 상태로 남지 않도록 제한된 지연 후 표시됩니다.
- 긴 최종 답변은 첫 번째 청크에 미리보기 메시지를 재사용하고 나머지
  청크만 전송합니다.
- `block` 모드는 `streaming.preview.chunk.maxChars`에서 미리보기를 새 메시지로
  전환합니다(기본값 800, Telegram의 4096
  편집 제한으로 상한 적용). 다른 모드는 하나의 미리보기를 최대 4096자까지 늘립니다.
- `progress` 모드는 도구 진행 상황을 편집 가능한 상태 초안에 유지하고, 답변 스트리밍이 활성 상태이지만 아직 사용할 수 있는 도구 줄이
  없을 때 상태 레이블을 표시하며, 완료 시 초안을 지우고 최종 답변을
  일반 전송 경로로 보냅니다.
- 완료된 텍스트가 확인되기 전에 최종 편집에 실패하면 OpenClaw는
  일반 최종 전송을 사용하고 오래된 미리보기를 정리합니다.
- 이중 스트리밍을 방지하기 위해 Telegram 블록 스트리밍이 명시적으로
  활성화된 경우 미리보기 스트리밍을 건너뜁니다.
- `/reasoning stream`은 추론 내용을 일시적인 미리보기에 기록할 수 있으며,
  이 미리보기는 최종 전송 후 삭제됩니다.
- Telegram의 선택한 인용 답장은 예외입니다. `replyToMode`가
  `"off"`이 아니고 선택한 인용문 텍스트가 있으면 OpenClaw는 해당 턴의 답변 미리보기
  스트림을 건너뜁니다(최종 답변은 네이티브 인용 답장
  경로를 거쳐야 함). 따라서 도구 진행 상황 미리보기 줄을 렌더링할 수 없습니다. 선택한 인용문 텍스트가 없는
  현재 메시지 답장은 미리보기 스트리밍을 계속 유지합니다. 자세한 내용은
  [Telegram 채널 문서](/ko/channels/telegram)를 참조하십시오.

### Discord

- 미리보기 메시지를 전송한 후 편집하는 방식을 사용합니다.
- `block` 모드는 초안 청크 분할(`draftChunk`)을 사용합니다.
- Discord 블록 스트리밍이 명시적으로 활성화된 경우 미리보기 스트리밍을 건너뜁니다.
- `progress` 모드는 최종 답변에 작은 `-#` 활동 확인 정보(생각/도구 호출
  횟수와 경과 시간)를 추가하고 해당 답변이 전송되면 상태 초안을
  삭제하므로, 사용량이 많은 채널에서 답장 위에 고립된 도구 로그가 남지 않습니다.
  오류로 끝난 경우에는 실패한 턴의 기록으로 초안을 유지합니다.
- 최종 미디어, 오류 및 명시적 답장 페이로드는 새 초안을 플러시하지 않고
  대기 중인 미리보기를 취소한 다음 일반 전송을 사용합니다.

### Slack

- `partial`은 사용 가능한 경우 Slack 네이티브 스트리밍
  (`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`는 추가 방식의 초안 미리보기를 사용합니다.
- `progress`은 상태 미리보기 텍스트를 사용한 다음 최종 답변을 전송합니다.
- 답장 스레드가 없는 최상위 DM에서는 Slack 네이티브 스트리밍 대신
  초안 미리보기 게시물과 편집을 사용합니다.
- 네이티브 및 초안 미리보기 스트리밍은 해당 턴의 블록 답장을 억제하므로,
  Slack 답장은 하나의 전송 경로로만 스트리밍됩니다.
- 최종 미디어/오류 페이로드와 진행 상황 최종 메시지는 일회용 초안
  메시지를 만들지 않습니다. 미리보기를 편집할 수 있는 텍스트/블록 최종 메시지만 대기 중인
  초안 텍스트를 플러시합니다.

### Mattermost

- `partial` 모드에서는 생각 내용과 부분 답장 텍스트를 하나의 초안
  미리보기 게시물로 스트리밍하며, 최종 답변을 안전하게 전송할 수 있을 때 그 자리에서 완료합니다.
- `progress` 모드에서는 생각 내용과 도구 활동을 하나의 상태
  미리보기로 스트리밍하며, 최종 답변을 안전하게 전송할 수 있을 때 그 자리에서 완료합니다.
- `block` 모드에서는 완료된 텍스트 게시물과 도구 활동 게시물을 번갈아 사용합니다.
  병렬 및 연속 도구 업데이트는 현재 도구 활동 게시물을 공유합니다.
- 완료 시점에 미리보기 게시물이 삭제되었거나 달리 사용할 수 없는 경우
  새 최종 게시물 전송으로 대체합니다.
- 최종 미디어/오류 페이로드는 임시 미리보기 게시물을 플러시하는 대신
  일반 전송 전에 대기 중인 미리보기 업데이트를 취소합니다.

### Matrix

- 최종 텍스트가 미리보기 이벤트를 재사용할 수 있으면 초안 미리보기를
  그 자리에서 완료합니다.
- 미디어 전용, 오류 및 답장 대상 불일치 최종 메시지는 일반 전송 전에 대기 중인 미리보기
  업데이트를 취소합니다. 이미 표시된 오래된 미리보기는 삭제 처리됩니다.

## 도구 진행 상황 미리보기 업데이트

미리보기 스트리밍에는 **도구 진행 상황** 업데이트도 포함될 수 있습니다. 이는 도구가 실행되는 동안
최종 답장보다 먼저 같은 미리보기 메시지에 표시되는 "웹 검색 중", "파일 읽는 중",
"도구 호출 중"과 같은 짧은 상태 줄입니다.
Codex 앱 서버 모드에서는 Codex 서문/해설 메시지도 동일한
미리보기 경로를 사용하므로, 짧은 "확인 중입니다..." 진행 메모를
최종 답변의 일부로 포함하지 않고 편집 가능한 초안에 스트리밍할 수 있습니다. 이를 통해
여러 단계로 도구를 사용하는 턴이 첫 번째 생각 미리보기와 최종 답변 사이에서
시각적으로 조용한 상태가 되지 않고 진행 중임을 보여줍니다.

오래 실행되는 도구는 반환 전에 유형화된 진행 상황을 내보낼 수 있습니다. 예를 들어,
`web_fetch`은 시작할 때 5초 타이머를 설정합니다. 가져오기가 여전히
대기 중이면 미리보기에 `Fetching page content...`이 표시되고, 그 전에 가져오기가 완료되거나
취소되면 진행 상황 줄이 출력되지 않습니다. 이후의 최종 도구
결과는 여전히 모델에 정상적으로 전달됩니다.

지원되는 영역:

- **Discord**, **Slack**, **Telegram**, **Matrix**는 미리보기
  스트리밍이 활성화된 경우 기본적으로 도구 진행 상황과 Codex 서문 업데이트를 실시간 미리보기 편집에
  스트리밍합니다. Microsoft Teams는 개인 채팅에서 네이티브 진행 상황 스트림을
  사용합니다.
- Telegram은 `v2026.4.22`부터 도구 진행 상황 미리보기 업데이트를 활성화한 상태로
  출시되었으며, 이를 활성 상태로 유지하면 해당 출시 동작이 보존됩니다.
- **Mattermost**는 `partial` 및 `progress` 모드에서 도구 활동을 하나의 미리보기 게시물에
  통합하거나, `block` 모드에서 텍스트 블록 사이에 하나의 도구 활동 게시물로
  통합합니다(위 내용 참조).
- 도구 진행 상황 편집은 활성 미리보기 스트리밍 모드를 따릅니다. 미리보기 스트리밍이
  `off`이거나 블록 스트리밍이 메시지를 대신 처리한 경우에는
  건너뜁니다. Telegram에서 `streaming.mode: "off"`은 최종 메시지 전용입니다. 일반적인
  진행 상황 메시지도 독립된 상태 메시지로 전달되지 않고 억제되지만,
  승인 프롬프트, 미디어 페이로드 및 오류는 계속 정상적으로 라우팅됩니다.
- 미리보기 스트리밍을 유지하면서 도구 진행 상황 줄을 숨기려면 해당 채널의
  `streaming.preview.toolProgress`을 `false`으로 설정하십시오(기본값
  `true`). 명령/실행 텍스트를 숨기면서 도구 진행 상황 줄을 계속 표시하려면
  `streaming.preview.commandText`을 `"status"`으로 설정하거나
  `streaming.progress.commandText`을 `"status"`으로 설정하십시오. 출시된
  동작을 보존하기 위해 기본값은 `"raw"`입니다. 이 정책은 Discord, Matrix,
  Microsoft Teams, Mattermost, Slack 초안 미리보기, Telegram을 포함하여
  OpenClaw의 간결한 진행 상황 렌더러를 사용하는 초안/진행 상황 채널에서 공유됩니다.
  미리보기 편집을 완전히 비활성화하려면 `streaming.mode`을 `off`으로 설정하십시오.

## 진행 상황 초안 렌더링

진행 상황 모드 초안(`streaming.progress.*`)은 채널별로 제한되고 구성할 수
있습니다.

| 키                                | 기본값        | 동작                                                           |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | 초안 레이블 아래에 유지할 간결한 진행 상황 줄의 최대 개수      |
| `streaming.progress.maxLineChars` | `120`         | 자르기 전 간결한 줄당 최대 문자 수(단어 경계 인식)              |
| `streaming.progress.label`        | `"auto"`      | 초안 제목. 사용자 지정 문자열 또는 숨기려면 `false` |
| `streaming.progress.labels`       | 기본 제공 풀  | `label: "auto"`일 때 사용하는 후보 레이블                    |

### 해설 진행 상황 레인

도구 진행 상황 외에도 간결한 진행 상황 렌더러는 초안에 하나의 레인을
추가로 표시할 수 있습니다.

- **`streaming.progress.commentary`** - 모델의 도구 사용 전
  **해설**(짧은 "확인한 다음... 하겠습니다" 설명)을 진행 상황 초안의
  도구 줄 사이에 렌더링합니다. 진행 상황 모드의 Discord와 Telegram에서는
  이 선택적 레인이 꺼져 있어도 동일한 서문이 상태 제목으로 사용되며,
  다른 채널은 기존 진행 상황 동작을 유지합니다.
  [진행 상황 초안](/ko/concepts/progress-drafts#status-headline)을 참조하십시오.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

진행 상황 줄은 계속 표시하되 원시 명령/실행 텍스트는 숨기십시오.

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

다른 간결한 진행 상황 채널 키 아래에서도 같은 구조를 사용하십시오. 예를 들면
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` 또는 Slack 초안 미리보기가 있습니다. 진행 상황 초안 모드에서는
같은 정책을 `streaming.progress` 아래에 배치하십시오.

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

## 관련 항목

- [메시지 수명 주기 리팩터링](/ko/concepts/message-lifecycle-refactor) - 공유 미리보기, 편집, 스트리밍 및 완료 설계 대상
- [진행 상황 초안](/ko/concepts/progress-drafts) - 긴 턴 동안 업데이트되는 진행 중 작업 표시 메시지
- [메시지](/ko/concepts/messages) - 메시지 수명 주기 및 전송
- [재시도](/ko/concepts/retry) - 전송 실패 시 재시도 동작
- [채널](/ko/channels) - 채널별 스트리밍 지원
