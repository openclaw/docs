---
read_when:
    - 수신 메시지가 어떻게 답변이 되는지 설명하기
    - 세션, 대기열 모드 또는 스트리밍 동작 명확히 하기
    - 추론 가시성과 사용상 영향 문서화하기
summary: 메시지 흐름, 세션, 대기열 처리, 그리고 추론 가시성
title: 메시지
x-i18n:
    generated_at: "2026-04-25T18:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

이 페이지는 OpenClaw가 수신 메시지, 세션, 대기열 처리,
스트리밍, 그리고 추론 가시성을 어떻게 처리하는지 함께 설명합니다.

## 메시지 흐름(개요)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

핵심 조절 항목은 구성에 있습니다.

- 접두사, 대기열 처리, 그룹 동작은 `messages.*`
- 블록 스트리밍 및 청킹 기본값은 `agents.defaults.*`
- 제한 및 스트리밍 토글은 채널별 재정의(`channels.whatsapp.*`, `channels.telegram.*` 등)

전체 스키마는 [구성](/ko/gateway/configuration)을 참고하세요.

## 수신 중복 제거

채널은 재연결 후 동일한 메시지를 다시 전달할 수 있습니다. OpenClaw는
채널/계정/피어/세션/메시지 ID를 키로 하는 단기 캐시를 유지하므로 중복
전달이 또 다른 에이전트 실행을 유발하지 않습니다.

## 수신 디바운싱

**같은 발신자**가 빠르게 연속해서 보낸 메시지는 `messages.inbound`를 통해 단일
에이전트 턴으로 묶을 수 있습니다. 디바운싱은 채널 + 대화별로 적용되며,
답글 스레딩/ID에는 가장 최근 메시지를 사용합니다.

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

- 디바운스는 **텍스트 전용** 메시지에 적용되며, 미디어/첨부파일은 즉시 플러시됩니다.
- 제어 명령은 단독으로 유지되도록 디바운싱을 우회합니다. 단, 채널이 같은 발신자의 DM 병합을 명시적으로 선택한 경우는 예외입니다(예: [BlueBubbles `coalesceSameSenderDms`](/ko/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)). 이 경우 DM 명령은 분할 전송 페이로드가 같은 에이전트 턴에 합류할 수 있도록 디바운스 창 안에서 대기합니다.

## 세션과 디바이스

세션은 클라이언트가 아니라 Gateway가 소유합니다.

- 직접 채팅은 에이전트의 메인 세션 키로 합쳐집니다.
- 그룹/채널은 각각 자체 세션 키를 가집니다.
- 세션 저장소와 기록은 Gateway 호스트에 저장됩니다.

여러 디바이스/채널이 같은 세션에 매핑될 수 있지만, 기록이 모든 클라이언트에
완전히 다시 동기화되지는 않습니다. 권장 사항: 컨텍스트 분기를 피하려면 긴
대화에는 하나의 기본 디바이스를 사용하세요. Control UI와 TUI는 항상
Gateway 기반 세션 기록을 표시하므로, 이것이 기준 정보입니다.

자세한 내용: [세션 관리](/ko/concepts/session)

## 수신 본문과 기록 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 분리합니다.

- `Body`: 에이전트에 전송되는 프롬프트 텍스트입니다. 여기에 채널 엔벌로프와
  선택적 기록 래퍼가 포함될 수 있습니다.
- `CommandBody`: 지시문/명령 파싱을 위한 원시 사용자 텍스트입니다.
- `RawBody`: `CommandBody`의 레거시 별칭입니다(호환성을 위해 유지).

채널이 기록을 제공할 때는 공용 래퍼를 사용합니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**비직접 채팅**(그룹/채널/룸)의 경우, **현재 메시지 본문** 앞에는 발신자 레이블이 붙습니다
(기록 항목에 사용하는 것과 같은 형식). 이렇게 하면 실시간 메시지와 대기열/기록
메시지가 에이전트 프롬프트에서 일관되게 유지됩니다.

기록 버퍼는 **보류 중 메시지 전용**입니다. 즉, 실행을 유발하지 않은 그룹 메시지
(예: 멘션 게이트 메시지)는 포함하고, 이미 세션 기록에 있는 메시지는
제외합니다.

지시문 제거는 **현재 메시지** 섹션에만 적용되므로 기록은 그대로 유지됩니다.
기록을 래핑하는 채널은 `CommandBody`(또는 `RawBody`)를 원래 메시지 텍스트로 설정하고,
`Body`는 결합된 프롬프트로 유지해야 합니다. 기록 버퍼는 `messages.groupChat.historyLimit`
(전역 기본값)과 `channels.slack.historyLimit` 또는
`channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의를 통해 구성할 수 있으며
(비활성화하려면 `0`으로 설정), 됩니다.

## 대기열 처리와 후속 메시지

이미 실행이 진행 중이면, 수신 메시지는 대기열에 넣거나, 현재 실행으로 유도하거나,
후속 턴용으로 수집할 수 있습니다.

- `messages.queue`(및 `messages.queue.byChannel`)로 구성합니다.
- 모드: `interrupt`, `steer`, `followup`, `collect` 및 backlog 변형

자세한 내용: [대기열 처리](/ko/concepts/queue)

## 스트리밍, 청킹, 배치

블록 스트리밍은 모델이 텍스트 블록을 생성하는 동안 부분 답변을 보냅니다.
청킹은 채널의 텍스트 제한을 준수하며, 펜스 코드가 분리되지 않도록 합니다.

주요 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 시간 기반 배치)
- `agents.defaults.humanDelay` (블록 답변 사이의 사람 같은 지연)
- 채널 재정의: `*.blockStreaming` 및 `*.blockStreamingCoalesce` (Telegram이 아닌 채널은 명시적인 `*.blockStreaming: true`가 필요)

자세한 내용: [스트리밍 + 청킹](/ko/concepts/streaming)

## 추론 가시성과 토큰

OpenClaw는 모델 추론을 노출하거나 숨길 수 있습니다.

- `/reasoning on|off|stream`은 가시성을 제어합니다.
- 추론 내용은 모델이 생성한 경우에도 토큰 사용량에 포함됩니다.
- Telegram은 초안 버블로의 추론 스트림을 지원합니다.

자세한 내용: [Thinking + reasoning directives](/ko/tools/thinking) 및 [토큰 사용](/ko/reference/token-use)

## 접두사, 스레딩, 답글

발신 메시지 형식은 `messages`에서 중앙 관리됩니다.

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`(발신 접두사 계단식 적용), 그리고 `channels.whatsapp.messagePrefix`(WhatsApp 수신 접두사)
- `replyToMode` 및 채널별 기본값을 통한 답글 스레딩

자세한 내용: [구성](/ko/gateway/config-agents#messages) 및 채널 문서를 참고하세요.

## 무음 답변

정확한 무음 토큰 `NO_REPLY` / `no_reply`는 “사용자에게 보이는 답변을 전달하지 않음”을 뜻합니다.
턴에 생성된 TTS 오디오 같은 보류 중인 도구 미디어도 함께 있을 경우, OpenClaw는
무음 텍스트는 제거하되 미디어 첨부파일은 계속 전달합니다.
OpenClaw는 대화 유형별로 이 동작을 결정합니다.

- 직접 대화에서는 기본적으로 무음을 허용하지 않으며, 순수 무음 답변을
  짧은 가시적 대체 응답으로 다시 작성합니다.
- 그룹/채널에서는 기본적으로 무음을 허용합니다.
- 내부 오케스트레이션에서는 기본적으로 무음을 허용합니다.

기본값은 `agents.defaults.silentReply` 및
`agents.defaults.silentReplyRewrite` 아래에 있으며, `surfaces.<id>.silentReply`와
`surfaces.<id>.silentReplyRewrite`로 surface별 재정의가 가능합니다.

상위 세션에 보류 중인 생성된 하위 에이전트 실행이 하나 이상 있는 경우,
순수 무음 답변은 다시 작성되지 않고 모든 surface에서 삭제되므로, 실제 답변을
하위 완료 이벤트가 전달할 때까지 상위는 조용히 유지됩니다.

## 관련 항목

- [스트리밍](/ko/concepts/streaming) — 실시간 메시지 전달
- [재시도](/ko/concepts/retry) — 메시지 전달 재시도 동작
- [대기열](/ko/concepts/queue) — 메시지 처리 대기열
- [채널](/ko/channels) — 메시징 플랫폼 통합
