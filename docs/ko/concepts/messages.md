---
read_when:
    - 수신 메시지가 응답으로 변환되는 방식 설명
    - 세션, 대기열 모드 또는 스트리밍 동작 명확히 하기
    - 추론 가시성과 사용 영향 문서화
summary: 메시지 흐름, 세션, 대기열 처리, 추론 가시성
title: 메시지
x-i18n:
    generated_at: "2026-04-30T16:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw는 세션 해석, 큐잉, 스트리밍, 도구 실행, 추론 가시성의 파이프라인을 통해 인바운드 메시지를 처리합니다. 이 페이지는 인바운드 메시지에서 응답까지의 경로를 설명합니다.

## 메시지 흐름(상위 수준)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

주요 조정 항목은 구성에 있습니다.

- 접두사, 큐잉, 그룹 동작은 `messages.*`.
- 블록 스트리밍 및 청킹 기본값은 `agents.defaults.*`.
- 한도와 스트리밍 토글은 채널 재정의(`channels.whatsapp.*`, `channels.telegram.*` 등).

전체 스키마는 [구성](/ko/gateway/configuration)을 참조하세요.

## 인바운드 중복 제거

채널은 재연결 후 같은 메시지를 다시 전달할 수 있습니다. OpenClaw는 채널/계정/피어/세션/메시지 ID를 키로 하는 단기 캐시를 유지하여 중복 전달이 또 다른 에이전트 실행을 트리거하지 않도록 합니다.

## 인바운드 디바운싱

**같은 발신자**의 빠른 연속 메시지는 `messages.inbound`를 통해 단일 에이전트 턴으로 묶을 수 있습니다. 디바운싱은 채널 + 대화별로 범위가 지정되며, 응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

구성(전역 기본값 + 채널별 재정의):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

참고:

- 디바운스는 **텍스트 전용** 메시지에 적용됩니다. 미디어/첨부 파일은 즉시 플러시됩니다.
- 제어 명령은 독립적으로 유지되도록 디바운싱을 우회합니다. 단, 채널이 같은 발신자 DM 병합을 명시적으로 선택한 경우는 **예외**입니다(예: [BlueBubbles `coalesceSameSenderDms`](/ko/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)). 이 경우 분할 전송 페이로드가 같은 에이전트 턴에 합류할 수 있도록 DM 명령은 디바운스 창 안에서 대기합니다.

## 세션과 기기

세션은 클라이언트가 아니라 Gateway가 소유합니다.

- 직접 채팅은 에이전트 기본 세션 키로 통합됩니다.
- 그룹/채널은 자체 세션 키를 갖습니다.
- 세션 저장소와 트랜스크립트는 Gateway 호스트에 있습니다.

여러 기기/채널이 같은 세션에 매핑될 수 있지만, 기록이 모든 클라이언트로 완전히 동기화되지는 않습니다. 권장 사항: 긴 대화에서는 컨텍스트가 갈라지는 것을 피하기 위해 하나의 기본 기기를 사용하세요. Control UI와 TUI는 항상 Gateway 기반 세션 트랜스크립트를 표시하므로, 이것이 신뢰할 수 있는 원본입니다.

자세한 내용: [세션 관리](/ko/concepts/session).

## 도구 결과 메타데이터

도구 결과 `content`는 모델에 표시되는 결과입니다. 도구 결과 `details`는 UI 렌더링, 진단, 미디어 전달, Plugin을 위한 런타임 메타데이터입니다.

OpenClaw는 이 경계를 명시적으로 유지합니다.

- `toolResult.details`는 provider 재생 및 Compaction 입력 전에 제거됩니다.
- 영구 저장된 세션 트랜스크립트는 제한된 `details`만 유지합니다. 너무 큰 메타데이터는 `persistedDetailsTruncated: true`로 표시된 간결한 요약으로 대체됩니다.
- Plugin과 도구는 모델이 읽어야 하는 텍스트를 `details`에만 두지 말고 `content`에 넣어야 합니다.

## 인바운드 본문과 기록 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 분리합니다.

- `BodyForAgent`: 현재 메시지의 기본 모델 대상 텍스트입니다. 채널 Plugin은 발신자의 현재 프롬프트 포함 텍스트에 집중되도록 유지해야 합니다.
- `Body`: 레거시 프롬프트 대체값입니다. 채널 봉투와 선택적 기록 래퍼를 포함할 수 있지만, 현재 채널은 `BodyForAgent`를 사용할 수 있을 때 이를 기본 모델 입력으로 의존해서는 안 됩니다.
- `CommandBody`: 지시문/명령 파싱을 위한 원시 사용자 텍스트입니다.
- `RawBody`: `CommandBody`의 레거시 별칭입니다(호환성을 위해 유지됨).

채널이 기록을 제공할 때는 공유 래퍼를 사용합니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**비직접 채팅**(그룹/채널/룸)의 경우 **현재 메시지 본문**에는 발신자 레이블이 접두사로 붙습니다(기록 항목에 사용되는 것과 같은 스타일). 이렇게 하면 에이전트 프롬프트에서 실시간 메시지와 큐/기록 메시지가 일관되게 유지됩니다.

기록 버퍼는 **대기 중 항목 전용**입니다. 실행을 트리거하지 _않은_ 그룹 메시지(예: 멘션 게이트 메시지)를 포함하고, 세션 트랜스크립트에 이미 있는 메시지는 **제외**합니다.

지시문 제거는 **현재 메시지** 섹션에만 적용되므로 기록은 그대로 유지됩니다. 기록을 래핑하는 채널은 `CommandBody`(또는 `RawBody`)를 원래 메시지 텍스트로 설정하고 `Body`는 결합된 프롬프트로 유지해야 합니다. 구조화된 기록, 응답, 전달됨, 채널 메타데이터는 프롬프트 조립 중 사용자 역할의 신뢰할 수 없는 컨텍스트 블록으로 렌더링됩니다.
기록 버퍼는 `messages.groupChat.historyLimit`(전역 기본값) 및 `channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의로 구성할 수 있습니다(비활성화하려면 `0`으로 설정).

## 큐잉과 후속 처리

실행이 이미 활성 상태인 경우, 인바운드 메시지는 큐에 넣거나, 현재 실행으로 유도하거나, 후속 턴을 위해 수집할 수 있습니다.

- `messages.queue`(및 `messages.queue.byChannel`)를 통해 구성합니다.
- 기본 모드는 `steer`이며, 유도가 큐에 넣은 후속 전달로 폴백될 때 500ms 후속 디바운스가 적용됩니다.
- 모드: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt`, 그리고 레거시 한 번에 하나씩 처리하는 `queue` 모드.

자세한 내용: [명령 큐](/ko/concepts/queue) 및 [Steering 큐](/ko/concepts/queue-steering).

## 채널 실행 소유권

채널 Plugin은 메시지가 세션 큐에 들어가기 전에 순서 보존, 입력 디바운스, 전송 백프레셔 적용을 수행할 수 있습니다. 에이전트 턴 자체에 별도의 타임아웃을 부과해서는 안 됩니다. 메시지가 세션으로 라우팅되면 장시간 실행 작업은 세션, 도구, 런타임 수명 주기에 의해 관리되므로 모든 채널이 느린 턴을 일관되게 보고하고 복구합니다.

## 스트리밍, 청킹, 배칭

블록 스트리밍은 모델이 텍스트 블록을 생성할 때 부분 응답을 전송합니다.
청킹은 채널 텍스트 제한을 준수하고 fenced code 분할을 피합니다.

주요 설정:

- `agents.defaults.blockStreamingDefault`(`on|off`, 기본값 off)
- `agents.defaults.blockStreamingBreak`(`text_end|message_end`)
- `agents.defaults.blockStreamingChunk`(`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce`(유휴 기반 배칭)
- `agents.defaults.humanDelay`(블록 응답 사이의 사람 같은 일시 정지)
- 채널 재정의: `*.blockStreaming` 및 `*.blockStreamingCoalesce`(Telegram이 아닌 채널은 명시적인 `*.blockStreaming: true` 필요)

자세한 내용: [스트리밍 + 청킹](/ko/concepts/streaming).

## 추론 가시성과 토큰

OpenClaw는 모델 추론을 노출하거나 숨길 수 있습니다.

- `/reasoning on|off|stream`은 가시성을 제어합니다.
- 모델이 생성한 추론 콘텐츠는 여전히 토큰 사용량에 포함됩니다.
- Telegram은 추론 스트림을 초안 말풍선으로 보내는 기능을 지원합니다.

자세한 내용: [사고 + 추론 지시문](/ko/tools/thinking) 및 [토큰 사용](/ko/reference/token-use).

## 접두사, 스레딩, 응답

아웃바운드 메시지 형식은 `messages`에 중앙화되어 있습니다.

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`(아웃바운드 접두사 계단식 적용), 그리고 `channels.whatsapp.messagePrefix`(WhatsApp 인바운드 접두사)
- `replyToMode` 및 채널별 기본값을 통한 응답 스레딩

자세한 내용: [구성](/ko/gateway/config-agents#messages) 및 채널 문서.

## 무음 응답

정확한 무음 토큰 `NO_REPLY` / `no_reply`는 “사용자에게 보이는 응답을 전달하지 않음”을 의미합니다.
턴에 생성된 TTS 오디오 같은 대기 중인 도구 미디어도 있을 경우, OpenClaw는 무음 텍스트를 제거하지만 미디어 첨부 파일은 계속 전달합니다.
OpenClaw는 대화 유형에 따라 이 동작을 해석합니다.

- 직접 대화는 기본적으로 무음을 허용하지 않으며, 단독 무음 응답을 짧고 표시되는 대체 응답으로 다시 작성합니다.
- 그룹/채널은 기본적으로 무음을 허용합니다.
- 내부 오케스트레이션은 기본적으로 무음을 허용합니다.

OpenClaw는 비직접 채팅에서 assistant 응답이 발생하기 전에 생기는 내부 runner 실패에도 무음 응답을 사용하므로, 그룹/채널에는 Gateway 오류 상용 문구가 표시되지 않습니다. 직접 채팅은 기본적으로 간결한 실패 문구를 표시합니다. 원시 runner 세부 정보는 `/verbose`가 `on` 또는 `full`일 때만 표시됩니다.

기본값은 `agents.defaults.silentReply` 및 `agents.defaults.silentReplyRewrite` 아래에 있으며, `surfaces.<id>.silentReply` 및 `surfaces.<id>.silentReplyRewrite`는 표면별로 이를 재정의할 수 있습니다.

상위 세션에 대기 중인 spawned 하위 에이전트 실행이 하나 이상 있는 경우, 단독 무음 응답은 다시 작성되지 않고 모든 표면에서 삭제됩니다. 그래서 자식 완료 이벤트가 실제 응답을 전달할 때까지 상위 세션은 조용히 유지됩니다.

## 관련 항목

- [스트리밍](/ko/concepts/streaming) — 실시간 메시지 전달
- [재시도](/ko/concepts/retry) — 메시지 전달 재시도 동작
- [큐](/ko/concepts/queue) — 메시지 처리 큐
- [채널](/ko/channels) — 메시징 플랫폼 통합
