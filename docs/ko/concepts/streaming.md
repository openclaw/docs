---
read_when:
    - 채널에서 스트리밍 또는 청크 처리가 작동하는 방식 설명
    - 블록 스트리밍 또는 채널 청크 처리 동작 변경
    - 중복/조기 블록 응답 또는 채널 미리보기 스트리밍 디버깅
summary: 스트리밍 + 청크 처리 동작(블록 답장, 채널 미리보기 스트리밍, 모드 매핑)
title: 스트리밍 및 청크 처리
x-i18n:
    generated_at: "2026-05-03T21:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw에는 두 개의 별도 스트리밍 계층이 있습니다.

- **블록 스트리밍(채널):** 어시스턴트가 작성하는 동안 완료된 **블록**을 내보냅니다. 이는 일반 채널 메시지입니다(토큰 델타가 아님).
- **미리보기 스트리밍(Telegram/Discord/Slack):** 생성 중 임시 **미리보기 메시지**를 업데이트합니다.

현재 채널 메시지에는 **진정한 토큰 델타 스트리밍**이 없습니다. 미리보기 스트리밍은 메시지 기반입니다(전송 + 편집/추가).

## 블록 스트리밍(채널 메시지)

블록 스트리밍은 어시스턴트 출력을 사용 가능해지는 대로 큰 단위의 청크로 전송합니다.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

범례:

- `text_delta/events`: 모델 스트림 이벤트(비스트리밍 모델에서는 드물 수 있음).
- `chunker`: 최소/최대 경계와 중단 선호도를 적용하는 `EmbeddedBlockChunker`.
- `channel send`: 실제 발신 메시지(블록 답장).

**제어 항목:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`(기본값 off).
- 채널 재정의: 채널별로 `"on"`/`"off"`를 강제하는 `*.blockStreaming`(및 계정별 변형).
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`(전송 전 스트리밍된 블록 병합).
- 채널 하드 한도: `*.textChunkLimit`(예: `channels.whatsapp.textChunkLimit`).
- 채널 청크 모드: `*.chunkMode`(`length` 기본값, `newline`은 길이 청크 전에 빈 줄(문단 경계)에서 분할).
- Discord 소프트 한도: `channels.discord.maxLinesPerMessage`(기본값 17)는 UI 잘림을 피하기 위해 긴 답장을 분할합니다.

**경계 의미:**

- `text_end`: chunker가 내보내는 즉시 블록을 스트리밍하고, 각 `text_end`에서 플러시합니다.
- `message_end`: 어시스턴트 메시지가 끝날 때까지 기다린 뒤 버퍼링된 출력을 플러시합니다.

버퍼링된 텍스트가 `maxChars`를 초과하면 `message_end`도 chunker를 사용하므로, 끝에서 여러 청크를 내보낼 수 있습니다.

### 블록 스트리밍에서의 미디어 전달

`MEDIA:` 지시문은 일반 전달 메타데이터입니다. 블록 스트리밍이 미디어 블록을 일찍 전송하면 OpenClaw는 해당 턴의 전달을 기억합니다. 최종 어시스턴트 페이로드가 같은 미디어 URL을 반복하면, 최종 전달은 첨부 파일을 다시 보내는 대신 중복 미디어를 제거합니다.

정확히 중복되는 최종 페이로드는 억제됩니다. 최종 페이로드가 이미 스트리밍된 미디어 주변에 별도의 텍스트를 추가하면, OpenClaw는 미디어를 한 번만 전달하면서 새 텍스트는 계속 전송합니다. 이를 통해 에이전트가 스트리밍 중 `MEDIA:`를 내보내고 제공자도 완료된 답장에 이를 포함하는 경우 Telegram 같은 채널에서 음성 메모나 파일이 중복되는 것을 방지합니다.

## 청크 처리 알고리즘(하한/상한)

블록 청크 처리는 `EmbeddedBlockChunker`로 구현됩니다.

- **하한:** 버퍼 >= `minChars`가 될 때까지 내보내지 않습니다(강제된 경우 제외).
- **상한:** `maxChars` 전에 분할하는 것을 선호합니다. 강제된 경우 `maxChars`에서 분할합니다.
- **중단 선호도:** `paragraph` → `newline` → `sentence` → `whitespace` → 강제 중단.
- **코드 펜스:** 펜스 내부에서는 절대 분할하지 않습니다. `maxChars`에서 강제될 때는 Markdown을 유효하게 유지하기 위해 펜스를 닫고 다시 엽니다.

`maxChars`는 채널 `textChunkLimit`로 제한되므로 채널별 한도를 초과할 수 없습니다.

## 병합(스트리밍된 블록 병합)

블록 스트리밍이 활성화되면 OpenClaw는 전송 전에 **연속된 블록 청크를 병합**할 수 있습니다. 이는 점진적 출력을 제공하면서도 “한 줄 스팸”을 줄입니다.

- 병합은 플러시 전에 **유휴 간격**(`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`로 제한되며 이를 초과하면 플러시됩니다.
- `minChars`는 충분한 텍스트가 누적될 때까지 작은 조각이 전송되지 않도록 합니다(최종 플러시는 남은 텍스트를 항상 전송).
- 연결자는 `blockStreamingChunk.breakPreference`에서 파생됩니다
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 공백).
- 채널 재정의는 `*.blockStreamingCoalesce`를 통해 사용할 수 있습니다(계정별 구성 포함).
- 재정의되지 않는 한 Signal/Slack/Discord의 기본 병합 `minChars`는 1500으로 올라갑니다.

## 블록 사이의 사람 같은 속도 조절

블록 스트리밍이 활성화되면 블록 답장 사이(첫 번째 블록 이후)에 **무작위 일시 중지**를 추가할 수 있습니다. 이렇게 하면 여러 말풍선 응답이 더 자연스럽게 느껴집니다.

- 구성: `agents.defaults.humanDelay`(`agents.list[].humanDelay`로 에이전트별 재정의).
- 모드: `off`(기본값), `natural`(800-2500ms), `custom`(`minMs`/`maxMs`).
- **블록 답장**에만 적용되며, 최종 답장이나 도구 요약에는 적용되지 않습니다.

## "청크 스트리밍 또는 전체 스트리밍"

이는 다음에 대응됩니다.

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`(진행하면서 내보냄). Telegram이 아닌 채널은 `*.blockStreaming: true`도 필요합니다.
- **끝에서 전체 스트리밍:** `blockStreamingBreak: "message_end"`(한 번 플러시, 매우 길면 여러 청크 가능).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"`(최종 답장만).

**채널 참고:** `*.blockStreaming`이 명시적으로 `true`로 설정되지 않으면 블록 스트리밍은 **꺼져 있습니다**. 채널은 블록 답장 없이도 실시간 미리보기(`channels.<channel>.streaming`)를 스트리밍할 수 있습니다.

구성 위치 알림: `blockStreaming*` 기본값은 루트 구성이 아니라 `agents.defaults` 아래에 있습니다.

## 미리보기 스트리밍 모드

정식 키: `channels.<channel>.streaming`

모드:

- `off`: 미리보기 스트리밍을 비활성화합니다.
- `partial`: 최신 텍스트로 교체되는 단일 미리보기.
- `block`: 청크/추가 단계로 미리보기를 업데이트합니다.
- `progress`: 생성 중 진행/상태 미리보기, 완료 시 최종 답변.

`streaming.mode: "block"`은 Discord 및 Telegram 같은 편집 가능한 채널을 위한 미리보기 스트리밍 모드입니다. 이는 해당 채널에서 채널 블록 전달을 활성화하지 않습니다. 일반 블록 답장을 원할 때는 `streaming.block.enabled` 또는 레거시 `blockStreaming` 채널 키를 사용하세요. Microsoft Teams는 예외입니다. 초안 미리보기 블록 전송 수단이 없으므로 `streaming.mode: "block"`은 네이티브 partial/progress 스트리밍 대신 Teams 블록 전달에 매핑됩니다.

### 채널 매핑

| 채널       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | 편집 가능한 진행 초안   |
| Discord    | ✅    | ✅        | ✅      | 편집 가능한 진행 초안   |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | 네이티브 진행 스트림    |

Slack 전용:

- `channels.slack.streaming.nativeTransport`는 `channels.slack.streaming.mode="partial"`일 때 Slack 네이티브 스트리밍 API 호출을 전환합니다(기본값: `true`).
- Slack 네이티브 스트리밍과 Slack 어시스턴트 스레드 상태에는 답장 스레드 대상이 필요합니다. 최상위 DM은 해당 스레드 스타일 미리보기를 표시하지 않지만, Slack 초안 미리보기 게시물과 편집은 계속 사용할 수 있습니다.

레거시 키 마이그레이션:

- Telegram: 레거시 `streamMode` 및 스칼라/불리언 `streaming` 값은 doctor/config 호환성 경로에서 감지되어 `streaming.mode`로 마이그레이션됩니다.
- Discord: `streamMode` + 불리언 `streaming`은 `streaming` 열거형으로 자동 마이그레이션됩니다.
- Slack: `streamMode`는 `streaming.mode`로 자동 마이그레이션됩니다. 불리언 `streaming`은 `streaming.mode` 및 `streaming.nativeTransport`로 자동 마이그레이션됩니다. 레거시 `nativeStreaming`은 `streaming.nativeTransport`로 자동 마이그레이션됩니다.

### 런타임 동작

Telegram:

- DM 및 그룹/토픽 전반에서 `sendMessage` + `editMessageText` 미리보기 업데이트를 사용합니다.
- 미리보기가 약 1분 동안 표시된 경우 제자리 편집 대신 새 최종 메시지를 보낸 뒤 미리보기를 정리하여 Telegram 타임스탬프가 답장 완료를 반영하도록 합니다.
- Telegram 블록 스트리밍이 명시적으로 활성화되면 미리보기 스트리밍을 건너뜁니다(이중 스트리밍 방지).
- `/reasoning stream`은 추론을 미리보기에 쓸 수 있습니다.

Discord:

- 전송 + 편집 미리보기 메시지를 사용합니다.
- `block` 모드는 초안 청크 처리(`draftChunk`)를 사용합니다.
- Discord 블록 스트리밍이 명시적으로 활성화되면 미리보기 스트리밍을 건너뜁니다.
- 최종 미디어, 오류, 명시적 답장 페이로드는 새 초안을 플러시하지 않고 대기 중인 미리보기를 취소한 뒤 일반 전달을 사용합니다.

Slack:

- `partial`은 사용 가능한 경우 Slack 네이티브 스트리밍(`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`은 추가 스타일 초안 미리보기를 사용합니다.
- `progress`는 상태 미리보기 텍스트를 사용한 뒤 최종 답변을 보냅니다.
- 답장 스레드가 없는 최상위 DM은 Slack 네이티브 스트리밍 대신 초안 미리보기 게시물과 편집을 사용합니다.
- 네이티브 및 초안 미리보기 스트리밍은 해당 턴의 블록 답장을 억제하므로 Slack 답장은 하나의 전달 경로로만 스트리밍됩니다.
- 최종 미디어/오류 페이로드와 진행 최종 응답은 일회용 초안 메시지를 만들지 않습니다. 미리보기를 편집할 수 있는 텍스트/블록 최종 응답만 대기 중인 초안 텍스트를 플러시합니다.

Mattermost:

- 생각, 도구 활동, 부분 답장 텍스트를 단일 초안 미리보기 게시물로 스트리밍하며, 최종 답변을 안전하게 보낼 수 있을 때 제자리에서 완료합니다.
- 미리보기 게시물이 삭제되었거나 완료 시 사용할 수 없는 경우 새 최종 게시물 전송으로 폴백합니다.
- 최종 미디어/오류 페이로드는 임시 미리보기 게시물을 플러시하는 대신 일반 전달 전에 대기 중인 미리보기 업데이트를 취소합니다.

Matrix:

- 최종 텍스트가 미리보기 이벤트를 재사용할 수 있으면 초안 미리보기를 제자리에서 완료합니다.
- 미디어 전용, 오류, 답장 대상 불일치 최종 응답은 일반 전달 전에 대기 중인 미리보기 업데이트를 취소합니다. 이미 표시된 오래된 미리보기는 삭제 처리됩니다.

### 도구 진행률 미리보기 업데이트

미리보기 스트리밍은 **도구 진행률** 업데이트도 포함할 수 있습니다. 이는 "웹 검색 중", "파일 읽는 중", "도구 호출 중" 같은 짧은 상태 줄이며, 도구가 실행되는 동안 최종 답장보다 앞서 같은 미리보기 메시지에 표시됩니다. 이렇게 하면 여러 단계의 도구 턴이 첫 번째 생각 미리보기와 최종 답변 사이에서 침묵하는 대신 시각적으로 계속 살아 있게 됩니다.

지원 표면:

- **Discord**, **Slack**, **Telegram**, **Matrix**는 미리보기 스트리밍이 활성화된 경우 기본적으로 도구 진행률을 실시간 미리보기 편집에 스트리밍합니다. Microsoft Teams는 개인 채팅에서 네이티브 진행 스트림을 사용합니다.
- Telegram은 `v2026.4.22`부터 도구 진행률 미리보기 업데이트를 활성화한 상태로 출시되었습니다. 이를 계속 활성화하면 출시된 동작이 유지됩니다.
- **Mattermost**는 이미 도구 활동을 단일 초안 미리보기 게시물에 접어 넣습니다(위 참조).
- 도구 진행률 편집은 활성 미리보기 스트리밍 모드를 따릅니다. 미리보기 스트리밍이 `off`이거나 블록 스트리밍이 메시지를 가져간 경우 건너뜁니다. Telegram에서 `streaming.mode: "off"`는 최종 전용입니다. 일반 진행 잡담도 독립 상태 메시지로 전달되는 대신 억제되지만, 승인 프롬프트, 미디어 페이로드, 오류는 계속 정상적으로 라우팅됩니다.
- 미리보기 스트리밍은 유지하되 도구 진행률 줄을 숨기려면 해당 채널의 `streaming.preview.toolProgress`를 `false`로 설정하세요. 미리보기 편집을 완전히 비활성화하려면 `streaming.mode`를 `off`로 설정하세요.
- Telegram 선택 인용 답장은 예외입니다. `replyToMode`가 `"off"`가 아니고 선택된 인용 텍스트가 있으면, OpenClaw는 해당 턴의 답변 미리보기 스트림을 건너뛰므로 도구 진행률 미리보기 줄을 렌더링할 수 없습니다. 선택된 인용 텍스트가 없는 현재 메시지 답장은 미리보기 스트리밍을 계속 유지합니다. 자세한 내용은 [Telegram 채널 문서](/ko/channels/telegram)를 참고하세요.

예:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## 관련 항목

- [진행 초안](/ko/concepts/progress-drafts) — 긴 턴 동안 업데이트되는 보이는 진행 중 작업 메시지
- [메시지](/ko/concepts/messages) — 메시지 수명 주기 및 전달
- [재시도](/ko/concepts/retry) — 전달 실패 시 재시도 동작
- [채널](/ko/channels) — 채널별 스트리밍 지원
