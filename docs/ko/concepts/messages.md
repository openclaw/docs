---
read_when:
    - 수신 메시지가 답장으로 변환되는 방식 설명하기
    - 세션, 대기열 모드 또는 스트리밍 동작 명확히 설명하기
    - 추론 공개 범위 및 사용량에 미치는 영향 문서화
summary: 메시지 흐름, 세션, 대기열 처리 및 추론 표시 여부
title: 메시지
x-i18n:
    generated_at: "2026-07-16T12:29:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

수신 메시지는 라우팅, 중복 제거/디바운스, 에이전트 실행, 발신 전달 과정을 거칩니다.

```text
수신 메시지
  -> 라우팅/바인딩 -> 세션 키
  -> 중복 제거 + 디바운스
  -> 대기열(실행이 이미 활성 상태인 경우)
  -> 에이전트 실행(스트리밍 + 도구)
  -> 발신 응답(채널 제한 + 청킹)
```

주요 구성 표면:

- `messages.*`: 접두사, 대기열 처리, 수신 디바운스, 그룹 동작.
- `agents.defaults.*`: 블록 스트리밍, 청킹, 무응답 기본값.
- 채널별 한도와 스트리밍 토글을 위한 채널 재정의(`channels.telegram.*`, `channels.whatsapp.*` 등).

전체 스키마는 [구성](/ko/gateway/configuration)을 참조하십시오.

## 수신 중복 제거

채널은 재연결 후 동일한 메시지를 다시 전달할 수 있습니다. OpenClaw는 에이전트 범위, 채널 경로(채널 + 상대 + 계정 + 스레드), 메시지 ID를 키로 사용하는 인메모리 캐시를 유지하므로 다시 전달된 메시지가 두 번째 에이전트 실행을 트리거하지 않습니다. 캐시 항목은 20분 후 또는 추적 항목이 5000개에 도달하면 만료되며, 둘 중 먼저 발생하는 시점이 적용됩니다.

## 수신 디바운스

동일한 발신자가 빠르게 연속으로 보낸 텍스트 메시지는 `messages.inbound`을 통해 하나의 에이전트 턴으로 일괄 처리할 수 있습니다. 디바운스는 채널 + 대화별로 적용되며, 응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- 디바운스는 텍스트 전용 메시지에 적용되며, 미디어/첨부 파일은 즉시 플러시됩니다.
- 제어 명령(stop/abort/status 등)은 디바운스를 우회하여 즉시 디스패치됩니다.
- 기본적으로 비활성화됩니다. `messages.inbound.debounceMs`에는 기본 제공 기본값이 없으므로 전역 또는 채널별로 설정한 후에만 디바운스가 활성화됩니다.
- iMessage의 `coalesceSameSenderDms` 옵트인이 유일한 예외입니다. Apple의 명령+URL 분할 전송이 하나의 턴으로 도착하도록 동일 발신자의 모든 DM 텍스트(명령 포함)를 충분히 오래 보류합니다. 그룹 채팅은 이 설정과 관계없이 항상 즉시 디스패치됩니다.

## 세션 및 기기

세션은 클라이언트가 아니라 Gateway에서 소유합니다.

- 다이렉트 채팅은 에이전트의 기본 세션 키로 통합됩니다.
- 그룹/채널에는 각각 고유한 세션 키가 부여됩니다.
- 세션 저장소와 트랜스크립트는 Gateway 호스트에 있습니다.

여러 기기/채널을 동일한 세션에 매핑할 수 있지만, 기록이 모든 클라이언트에 완전히 동기화되지는 않습니다. 컨텍스트가 서로 달라지는 것을 방지하려면 긴 대화에는 하나의 기본 기기를 사용하십시오. Control UI와 TUI에는 항상 Gateway 기반 세션 트랜스크립트가 표시되므로 이것이 신뢰할 수 있는 원본입니다.

자세한 내용은 [세션 관리](/ko/concepts/session)를 참조하십시오.

## 프롬프트 본문 및 기록 컨텍스트

채널 Plugin은 우선순위가 높은 순서대로 수신 컨텍스트의 여러 텍스트 필드를 채웁니다.

| 필드              | 용도                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 현재 턴에서 모델에 제공되는 텍스트입니다. 설정되지 않은 경우 `CommandBody` / `RawBody` / `Body`으로 대체됩니다.        |
| `BodyForCommands` | 지시문/명령 구문 분석에 사용되는 정리된 텍스트입니다. 설정되지 않은 경우 `CommandBody` / `RawBody` / `Body`으로 대체됩니다. |
| `CommandBody`     | 레거시 중간 본문입니다. `BodyForCommands`을 사용하는 것이 좋습니다.                                         |
| `RawBody`         | `CommandBody`의 사용 중단된 별칭입니다.                                                                  |
| `Body`            | 레거시 프롬프트 본문이며, 채널 봉투와 기록 래퍼가 포함될 수 있습니다.                                        |

채널이 기록을 제공할 때는 다음으로 감쌉니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

다이렉트 채팅이 아닌 경우(그룹/채널/대화방), 현재 메시지 본문 앞에 기록 항목과 동일한 형식의 발신자 레이블이 붙습니다. 지시문 제거는 현재 메시지 섹션에만 적용되므로 기록은 그대로 유지됩니다. 기록을 감싸는 채널은 `BodyForCommands`(또는 레거시 `CommandBody` / `RawBody`)을 원본 메시지 텍스트로 설정하고, `Body`에는 결합된 프롬프트를 유지해야 합니다.

기록 버퍼에는 대기 중인 항목만 포함됩니다. 실행을 트리거하지 않은 그룹 메시지(예: 멘션이 있어야 처리되는 메시지)는 포함하고, 이미 세션 트랜스크립트에 있는 메시지는 제외합니다. 구조화된 기록, 응답, 전달된 메시지, 채널 메타데이터는 프롬프트 조립 중 신뢰할 수 없는 사용자 역할 컨텍스트 블록으로 렌더링됩니다.

기록 크기는 `messages.groupChat.historyLimit`(전역 기본값) 또는 `channels.slack.historyLimit`, `channels.telegram.accounts.<id>.historyLimit` 등의 채널별 재정의로 구성하십시오(비활성화하려면 `0`로 설정).

## 도구 결과 메타데이터

도구 결과의 `content`은 모델에 표시되는 결과이며, `details`은 UI 렌더링, 진단, 미디어 전달, Plugin을 위한 런타임 메타데이터입니다.

- `toolResult.details`은 공급자 재실행 전과 Compaction 입력 전에 제거됩니다.
- 지속되는 세션 트랜스크립트에는 제한된 `details`만 유지되며, 너무 큰 메타데이터는 `persistedDetailsTruncated: true`로 표시된 간결한 요약으로 대체됩니다.
- Plugin과 도구는 모델이 읽어야 하는 텍스트를 `details`에만 넣지 말고 `content`에 넣어야 합니다.

## 대기열 처리 및 후속 처리

실행이 이미 활성 상태이면 수신 메시지는 기본적으로 해당 실행을 조정합니다. `messages.queue`이 모드를 제어합니다.

| 모드              | 동작                                                |
| ----------------- | --------------------------------------------------- |
| `steer` (기본값) | 새 프롬프트를 활성 실행에 주입합니다.               |
| `followup`        | 활성 실행이 완료된 후 메시지를 실행합니다.          |
| `collect`         | 호환되는 메시지를 이후 하나의 턴으로 일괄 처리합니다. |
| `interrupt`       | 활성 실행을 중단한 후 최신 프롬프트를 시작합니다.   |

기본값: `messages.queue.debounceMs`은 500ms(조정, 후속 처리, 수집 일괄 처리에 모두 적용), `messages.queue.cap`은 대기 메시지 20개, `messages.queue.drop`은 `summarize`입니다(`old` 및 `new`도 사용 가능). `messages.queue.byChannel` 및 `messages.queue.debounceMsByChannel`을 통해 채널별 재정의를 구성하십시오.

자세한 내용은 [명령 대기열](/ko/concepts/queue) 및 [조정 대기열](/ko/concepts/queue-steering)을 참조하십시오.

## 채널 실행 소유권

채널 Plugin은 메시지가 세션 대기열에 들어가기 전에 순서를 유지하고, 입력을 디바운스하며, 전송 백프레셔를 적용할 수 있습니다. 에이전트 턴 자체에는 별도의 시간 제한을 적용해서는 안 됩니다. 메시지가 세션으로 라우팅된 후에는 세션, 도구, 런타임 수명 주기가 장기 실행 작업을 관리하므로 모든 채널이 느린 턴을 일관되게 보고하고 복구할 수 있습니다.

## 스트리밍, 청킹, 일괄 처리

블록 스트리밍은 모델이 텍스트 블록을 생성하는 동안 부분 응답을 전송합니다. 청킹은 채널 텍스트 제한을 준수하며 펜스 코드가 분할되지 않도록 합니다.

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 시간 기반 일괄 처리)
- `agents.defaults.humanDelay` (블록 응답 사이의 사람과 유사한 일시 정지)
- 채널 재정의: 번들 채널에서는 `*.streaming.block.enabled` 및 `*.streaming.block.coalesce`을 사용하며, 오래된 플랫 키는 `openclaw doctor --fix`에 의해 마이그레이션됩니다. Telegram을 포함한 모든 채널에서 블록 스트리밍은 명시적으로 활성화하지 않는 한 꺼져 있습니다. QQ Bot은 예외입니다. `streaming.block` 키가 없으며, `channels.qqbot.streaming.mode`이 `"off"`이 아닌 한 블록 응답을 스트리밍합니다.

자세한 내용은 [스트리밍 + 청킹](/ko/concepts/streaming)을 참조하십시오.

## 추론 표시 여부 및 토큰

- `/reasoning on|off|stream`이 표시 여부를 제어합니다.
- 모델이 추론 콘텐츠를 생성하면 해당 콘텐츠도 토큰 사용량에 포함됩니다.
- Telegram은 최종 전달 후 삭제되는 임시 초안 말풍선에 추론을 스트리밍할 수 있습니다. 추론 출력을 지속하려면 `/reasoning on`을 사용하십시오.

자세한 내용은 [사고 + 추론 지시문](/ko/tools/thinking) 및 [토큰 사용량](/ko/reference/token-use)을 참조하십시오.

## 접두사, 스레딩, 응답

- 발신 접두사 계단식 적용: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp에는 수신 접두사용 `channels.whatsapp.messagePrefix`도 있습니다.
- `replyToMode` 및 채널별 기본값을 통한 응답 스레딩.

자세한 내용은 [구성](/ko/gateway/config-agents#messages) 및 채널 문서를 참조하십시오.

## 무응답

무응답 토큰 `NO_REPLY`(대소문자를 구분하지 않으므로 `no_reply`도 일치)은 "사용자에게 표시되는 응답을 전달하지 않음"을 의미합니다. 턴에 생성된 TTS 오디오와 같은 대기 중인 도구 미디어도 있으면 OpenClaw는 무응답 텍스트를 제거하지만 미디어 첨부 파일은 계속 전달합니다.

무응답 정책은 대화 유형에 따라 결정됩니다.

- 다이렉트 대화에는 `NO_REPLY` 프롬프트 지침이 절대 제공되지 않습니다. 다이렉트 실행에서 실수로 무응답 토큰만 반환하면 OpenClaw는 이를 다시 작성하거나 전달하지 않고 억제합니다.
- 그룹/채널은 기본적으로 무응답을 허용합니다. `message_tool` 표시 응답 모드에서 무응답은 모델이 `message(action=send)`을 호출하지 않음을 의미합니다.
- 내부 오케스트레이션은 기본적으로 무응답을 허용합니다.

기본값은 `agents.defaults.silentReply` 아래에 있으며, `surfaces.<id>.silentReply`은 표면별로 그룹/내부 정책을 재정의할 수 있습니다.

OpenClaw는 다이렉트 채팅이 아닌 곳의 일반적인 내부 실행기 실패에도 무응답을 사용하므로 그룹/채널에는 Gateway 오류 상용 문구가 표시되지 않습니다. 인증 누락, 사용량 제한, 과부하 알림처럼 사용자에게 표시되는 복구 문구가 있는 분류된 실패는 계속 전달될 수 있습니다. 다이렉트 채팅에는 기본적으로 간결한 실패 문구가 표시되며, 원시 실행기 세부 정보는 `/verbose full`이 활성화된 경우에만 표시됩니다.

무응답 토큰만 있는 응답은 모든 표면에서 삭제되므로 상위 세션은 센티널 텍스트를 대체 잡담으로 다시 작성하는 대신 조용히 유지됩니다.

## 관련 항목

- [메시지 수명 주기 리팩터링](/ko/concepts/message-lifecycle-refactor) - 지속 가능한 송수신 설계 목표
- [스트리밍](/ko/concepts/streaming) - 실시간 메시지 전달
- [재시도](/ko/concepts/retry) - 메시지 전달 재시도 동작
- [대기열](/ko/concepts/queue) - 메시지 처리 대기열
- [채널](/ko/channels) - 메시징 플랫폼 통합
