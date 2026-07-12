---
read_when:
    - 수신 메시지가 답장으로 변환되는 방식 설명
    - 세션, 큐잉 모드 또는 스트리밍 동작 명확히 설명하기
    - 추론 표시 및 사용량에 미치는 영향 문서화
summary: 메시지 흐름, 세션, 대기열 처리 및 추론 표시 여부
title: 메시지
x-i18n:
    generated_at: "2026-07-12T15:10:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
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
  -> 발신 응답(채널 제한 + 청크 분할)
```

주요 구성 영역은 다음과 같습니다.

- 접두사, 대기열 처리, 수신 디바운스 및 그룹 동작은 `messages.*`에서 구성합니다.
- 블록 스트리밍, 청크 분할 및 무응답 기본값은 `agents.defaults.*`에서 구성합니다.
- 채널별 한도와 스트리밍 전환 설정은 채널 재정의(`channels.telegram.*`, `channels.whatsapp.*` 등)에서 구성합니다.

전체 스키마는 [구성](/ko/gateway/configuration)을 참조하십시오.

## 수신 중복 제거

채널은 다시 연결된 후 동일한 메시지를 재전달할 수 있습니다. OpenClaw는 에이전트 범위, 채널 경로(채널 + 피어 + 계정 + 스레드), 메시지 ID를 키로 사용하는 인메모리 캐시를 유지하므로 재전달된 메시지가 두 번째 에이전트 실행을 트리거하지 않습니다. 캐시 항목은 20분 후 또는 추적되는 항목 수가 5000개에 도달하는 시점 중 먼저 도래하는 때에 만료됩니다.

## 수신 디바운스

동일한 발신자가 빠르게 연속으로 보낸 텍스트 메시지는 `messages.inbound`를 통해 하나의 에이전트 턴으로 일괄 처리할 수 있습니다. 디바운스의 범위는 채널 + 대화별로 지정되며, 응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

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
- 제어 명령(중지/중단/상태 등)은 디바운스를 우회하므로 즉시 디스패치됩니다.
- 기본적으로 비활성화됩니다. `messages.inbound.debounceMs`에는 기본 제공 기본값이 없으므로 전역 또는 채널별로 설정한 후에만 디바운스가 활성화됩니다.
- iMessage의 `coalesceSameSenderDms` 옵트인이 유일한 예외입니다. Apple에서 명령과 URL을 분할 전송하는 경우 하나의 턴으로 도착할 수 있도록 동일 발신자의 모든 DM 텍스트(명령 포함)를 충분한 시간 동안 보류합니다. 그룹 채팅은 이 설정과 관계없이 항상 즉시 디스패치됩니다.

## 세션 및 기기

세션은 클라이언트가 아니라 Gateway가 소유합니다.

- 직접 채팅은 에이전트의 기본 세션 키로 통합됩니다.
- 그룹/채널에는 각각 자체 세션 키가 할당됩니다.
- 세션 저장소와 대화 기록은 Gateway 호스트에 저장됩니다.

여러 기기/채널이 동일한 세션에 매핑될 수 있지만, 기록이 모든 클라이언트에 완전히 다시 동기화되지는 않습니다. 컨텍스트가 서로 달라지는 것을 방지하려면 긴 대화에는 하나의 기본 기기를 사용하십시오. Control UI와 TUI에는 항상 Gateway 기반 세션 대화 기록이 표시되므로 이를 기준 정보로 사용하십시오.

자세한 내용: [세션 관리](/ko/concepts/session).

## 프롬프트 본문 및 기록 컨텍스트

채널 Plugin은 인바운드 컨텍스트의 여러 텍스트 필드를 다음과 같은 우선순위로 채웁니다.

| 필드              | 용도                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 현재 턴에서 모델에 전달되는 텍스트입니다. 설정되지 않은 경우 `CommandBody` / `RawBody` / `Body`를 차례로 사용합니다.        |
| `BodyForCommands` | 지시문/명령 구문 분석에 사용되는 정제된 텍스트입니다. 설정되지 않은 경우 `CommandBody` / `RawBody` / `Body`를 차례로 사용합니다. |
| `CommandBody`     | 레거시 중간 본문입니다. `BodyForCommands`를 우선 사용하십시오.                                                             |
| `RawBody`         | 더 이상 사용되지 않는 `CommandBody`의 별칭입니다.                                                                          |
| `Body`            | 레거시 프롬프트 본문입니다. 채널 봉투와 기록 래퍼가 포함될 수 있습니다.                                                     |

채널에서 기록을 제공할 때는 다음과 같이 감쌉니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

다이렉트 채팅이 아닌 경우(그룹/채널/대화방)에는 기록 항목에 사용되는 형식과 동일하게 현재 메시지 본문 앞에 발신자 레이블이 추가됩니다. 지시문 제거는 현재 메시지 섹션에만 적용되므로 기록은 그대로 유지됩니다. 기록을 래핑하는 채널은 `BodyForCommands`(또는 레거시 `CommandBody` / `RawBody`)를 원본 메시지 텍스트로 설정하고, `Body`는 결합된 프롬프트로 유지해야 합니다.

히스토리 버퍼에는 대기 중인 항목만 포함됩니다. 즉, 실행을 트리거하지 않은 그룹 메시지(예: 멘션이 있어야 처리되는 메시지)는 포함하고, 이미 세션 트랜스크립트에 있는 메시지는 제외합니다. 구조화된 히스토리, 답글, 전달된 메시지 및 채널 메타데이터는 프롬프트를 구성할 때 신뢰할 수 없는 사용자 역할 컨텍스트 블록으로 렌더링됩니다.

히스토리 크기는 `messages.groupChat.historyLimit`(전역 기본값) 또는 `channels.slack.historyLimit`, `channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의로 구성합니다(비활성화하려면 `0`으로 설정).

## 도구 결과 메타데이터

도구 결과의 `content`는 모델에 표시되는 결과이며, `details`는 UI 렌더링, 진단, 미디어 전송 및 Plugin을 위한 런타임 메타데이터입니다.

- `toolResult.details`는 제공자 재실행 전과 Compaction 입력 전에 제거됩니다.
- 영구 저장된 세션 트랜스크립트에는 크기가 제한된 `details`만 유지되며, 너무 큰 메타데이터는 `persistedDetailsTruncated: true`로 표시된 간결한 요약으로 대체됩니다.
- Plugin과 도구는 모델이 읽어야 하는 텍스트를 `details`에만 넣지 말고 `content`에 넣어야 합니다.

## 큐잉 및 후속 메시지

실행이 이미 활성화된 경우 수신 메시지는 기본적으로 해당 실행을 조정합니다. `messages.queue`가 모드를 제어합니다.

| 모드              | 동작                                                |
| ----------------- | --------------------------------------------------- |
| `steer` (기본값)  | 새 프롬프트를 활성 실행에 주입합니다.               |
| `followup`        | 활성 실행이 완료된 후 메시지를 실행합니다.          |
| `collect`         | 호환되는 메시지를 이후 한 차례로 일괄 처리합니다.   |
| `interrupt`       | 활성 실행을 중단한 후 최신 프롬프트를 시작합니다.   |

기본값: `messages.queue.debounceMs`는 500ms이며(steer, followup 및 collect 일괄 처리에 모두 동일하게 적용), `messages.queue.cap`은 대기 메시지 20개이고, `messages.queue.drop`은 `summarize`입니다(`old`와 `new`도 사용할 수 있습니다). `messages.queue.byChannel` 및 `messages.queue.debounceMsByChannel`을 통해 채널별 재정의를 구성합니다.

자세한 내용: [명령 큐](/ko/concepts/queue) 및 [조정 큐](/ko/concepts/queue-steering).

## 채널 실행 소유권

채널 Plugin은 메시지가 세션 큐에 들어가기 전에 순서를 보존하고, 입력에 디바운스를 적용하며, 전송 백프레셔를 적용할 수 있습니다. 에이전트 턴 자체에는 별도의 타임아웃을 적용해서는 안 됩니다. 메시지가 세션으로 라우팅된 이후에는 세션, 도구 및 런타임 수명 주기가 장시간 실행 작업을 관리하므로 모든 채널이 느린 턴을 일관되게 보고하고 복구할 수 있습니다.

## 스트리밍, 청킹 및 일괄 처리

블록 스트리밍은 모델이 텍스트 블록을 생성하는 동안 부분 응답을 전송합니다. 청킹은 채널 텍스트 제한을 준수하며 펜스 코드의 분할을 방지합니다.

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 시간 기반 일괄 처리)
- `agents.defaults.humanDelay` (블록 응답 사이의 사람과 유사한 일시 중지)
- 채널 재정의: 중첩 스트리밍 채널(Telegram, Discord, Slack, iMessage, Microsoft Teams)에서는 `*.streaming.block.enabled` 및 `*.streaming.block.coalesce`를 사용하고, 중첩 스트리밍 구성이 없는 채널에서는 단순한 `*.blockStreaming` / `*.blockStreamingCoalesce`를 사용합니다. Telegram을 포함한 모든 채널에서 명시적으로 활성화하지 않는 한 블록 스트리밍은 꺼져 있습니다.

자세한 내용: [스트리밍 및 청킹](/ko/concepts/streaming).

## 추론 표시 및 토큰

- `/reasoning on|off|stream`은 표시 여부를 제어합니다.
- 모델이 추론 콘텐츠를 생성하면 해당 콘텐츠도 토큰 사용량에 포함됩니다.
- Telegram은 최종 전달 후 삭제되는 임시 초안 말풍선으로 추론을 스트리밍하는 기능을 지원합니다. 추론 출력을 영구적으로 유지하려면 `/reasoning on`을 사용합니다.

자세한 내용: [사고 및 추론 지시문](/ko/tools/thinking) 및 [토큰 사용량](/ko/reference/token-use).

## 접두사, 스레딩 및 응답

- 발신 접두사 적용 순서: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp에는 수신 접두사용 `channels.whatsapp.messagePrefix`도 있습니다.
- `replyToMode` 및 채널별 기본값을 통한 응답 스레딩.

자세한 내용: [구성](/ko/gateway/config-agents#messages) 및 채널 문서.

## 무응답

무응답 토큰 `NO_REPLY`(대소문자를 구분하지 않으므로 `no_reply`도 일치)는 "사용자에게 표시되는 응답을 전달하지 않음"을 의미합니다. 턴에 생성된 TTS 오디오와 같이 대기 중인 도구 미디어도 있는 경우 OpenClaw는 무응답 텍스트를 제거하지만 미디어 첨부 파일은 계속 전달합니다.

무응답 정책은 대화 유형에 따라 결정됩니다.

- 직접 대화에는 `NO_REPLY` 프롬프트 지침이 제공되지 않습니다. 직접 실행이 실수로 무응답 토큰만 반환하면 OpenClaw는 이를 다시 작성하거나 전달하지 않고 억제합니다.
- 그룹/채널에서는 기본적으로 무응답을 허용합니다. `message_tool` 표시 응답 모드에서 무응답은 모델이 `message(action=send)`를 호출하지 않는다는 의미입니다.
- 내부 오케스트레이션에서는 기본적으로 무응답을 허용합니다.

기본값은 `agents.defaults.silentReply` 아래에 있으며, `surfaces.<id>.silentReply`로 화면별 그룹/내부 정책을 재정의할 수 있습니다.

또한 OpenClaw는 직접 대화가 아닌 채팅에서 일반적인 내부 실행기 실패에 무응답을 사용하므로 그룹/채널에는 Gateway 오류 상용구가 표시되지 않습니다. 인증 누락, 속도 제한 또는 과부하 알림처럼 사용자를 위한 복구 문구가 있는 분류된 실패는 계속 전달될 수 있습니다. 직접 채팅에는 기본적으로 간결한 실패 문구가 표시되며, 원시 실행기 세부 정보는 `/verbose full`이 활성화된 경우에만 표시됩니다.

무응답 토큰만 있는 응답은 모든 화면에서 삭제되므로 상위 세션은 센티널 텍스트를 대체 잡담으로 다시 작성하지 않고 조용히 유지됩니다.

## 관련 항목

- [메시지 수명 주기 리팩터링](/ko/concepts/message-lifecycle-refactor) - 내구성 있는 송수신 설계 목표
- [스트리밍](/ko/concepts/streaming) - 실시간 메시지 전달
- [재시도](/ko/concepts/retry) - 메시지 전달 재시도 동작
- [큐](/ko/concepts/queue) - 메시지 처리 큐
- [채널](/ko/channels) - 메시징 플랫폼 통합
