---
read_when:
    - 수신 메시지가 응답으로 바뀌는 방식을 설명하기
    - 세션, 큐잉 모드 또는 스트리밍 동작 설명하기
    - 추론 표시 여부와 사용상 의미 문서화하기
summary: 메시지 흐름, 세션, 큐잉 및 추론 표시 여부
title: 메시지
x-i18n:
    generated_at: "2026-04-26T11:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

이 페이지는 OpenClaw가 수신 메시지, 세션, 큐잉,
스트리밍, 추론 표시 여부를 처리하는 방식을 함께 설명합니다.

## 메시지 흐름(개요)

```
수신 메시지
  -> 라우팅/bindings -> 세션 키
  -> 큐(실행이 활성 상태인 경우)
  -> 에이전트 실행(스트리밍 + 도구)
  -> 아웃바운드 응답(채널 제한 + 청크 분할)
```

핵심 설정 항목은 config에 있습니다:

- 접두사, 큐잉, 그룹 동작은 `messages.*`
- block streaming 및 chunking 기본값은 `agents.defaults.*`
- 제한과 스트리밍 토글은 채널별 재정의(`channels.whatsapp.*`, `channels.telegram.*` 등)

전체 스키마는 [Configuration](/ko/gateway/configuration)을 참조하세요.

## 수신 중복 제거

채널은 재연결 후 동일한 메시지를 다시 전달할 수 있습니다. OpenClaw는 channel/account/peer/session/message id를 키로 하는 단기 캐시를 유지하여 중복 전달이 또 다른 에이전트 실행을 트리거하지 않도록 합니다.

## 수신 디바운싱

**동일 발신자**의 연속된 빠른 메시지는 `messages.inbound`를 통해 하나의 에이전트 턴으로 묶을 수 있습니다. 디바운싱은 채널 + 대화 단위로 적용되며, 응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

Config(전역 기본값 + 채널별 재정의):

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

- 디바운스는 **텍스트 전용** 메시지에 적용되며, 미디어/첨부 파일은 즉시 플러시됩니다.
- 제어 명령은 디바운싱을 우회하여 독립적으로 유지됩니다. 단, 채널이 동일 발신자 DM 병합을 명시적으로 opt-in한 경우는 예외입니다(예: [BlueBubbles `coalesceSameSenderDms`](/ko/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)). 이 경우 분할 전송 payload가 동일한 에이전트 턴에 합류할 수 있도록 DM 명령이 디바운스 창 안에서 대기합니다.

## 세션과 디바이스

세션은 클라이언트가 아니라 Gateway가 소유합니다.

- 직접 채팅은 에이전트 main 세션 키로 병합됩니다.
- 그룹/채널은 자체 세션 키를 가집니다.
- 세션 저장소와 transcript는 Gateway 호스트에 있습니다.

여러 디바이스/채널이 동일한 세션에 매핑될 수 있지만, 기록이 모든 클라이언트에 완전히 다시 동기화되지는 않습니다. 권장 사항: 컨텍스트가 갈라지는 것을 피하기 위해 긴 대화에는 하나의 기본 디바이스를 사용하세요. Control UI와 TUI는 항상 Gateway 기반 세션 transcript를 표시하므로 이것이 신뢰 가능한 원본입니다.

자세한 내용: [세션 관리](/ko/concepts/session).

## 도구 결과 메타데이터

도구 결과 `content`는 모델이 볼 수 있는 결과입니다. 도구 결과 `details`는 UI 렌더링, 진단, 미디어 전달, Plugin용 런타임 메타데이터입니다.

OpenClaw는 이 경계를 명확하게 유지합니다:

- `toolResult.details`는 provider 재생 및 Compaction 입력 전에 제거됩니다.
- 저장된 세션 transcript에는 제한된 `details`만 유지되며, 너무 큰 메타데이터는 `persistedDetailsTruncated: true`로 표시된 간단한 요약으로 대체됩니다.
- Plugins와 도구는 모델이 반드시 읽어야 하는 텍스트를 `details`에만 두지 말고 `content`에 넣어야 합니다.

## 수신 본문과 기록 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 구분합니다:

- `Body`: 에이전트에 전송되는 프롬프트 텍스트입니다. 여기에는 채널 envelope와 선택적 기록 래퍼가 포함될 수 있습니다.
- `CommandBody`: directive/명령 파싱용 원시 사용자 텍스트입니다.
- `RawBody`: `CommandBody`의 레거시 별칭입니다(호환성을 위해 유지됨).

채널이 기록을 제공할 때는 공통 래퍼를 사용합니다:

- `[마지막 응답 이후 채팅 메시지 - 컨텍스트용]`
- `[현재 메시지 - 이에 응답하세요]`

**비직접 채팅**(그룹/채널/룸)의 경우 **현재 메시지 본문** 앞에는 발신자 레이블이 붙습니다(기록 항목에 사용하는 것과 같은 형식). 이렇게 하면 실시간 메시지와 큐/기록 메시지가 에이전트 프롬프트에서 일관되게 유지됩니다.

기록 버퍼는 **보류 중 메시지만** 포함합니다. 즉, 실행을 트리거하지 않은 그룹 메시지(예: 멘션 게이트 메시지)는 포함하고, 이미 세션 transcript에 있는 메시지는 **제외**합니다.

directive 제거는 **현재 메시지** 섹션에만 적용되므로 기록은 그대로 유지됩니다. 기록을 래핑하는 채널은 `CommandBody`(또는 `RawBody`)를 원래 메시지 텍스트로 설정하고, `Body`는 결합된 프롬프트로 유지해야 합니다. 기록 버퍼는 `messages.groupChat.historyLimit`(전역 기본값)와 `channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의로 구성할 수 있습니다(`0`으로 설정하면 비활성화).

## 큐잉과 후속 메시지

이미 실행이 활성 상태이면 수신 메시지를 큐에 넣거나, 현재 실행으로 유도하거나, 후속 턴용으로 수집할 수 있습니다.

- `messages.queue`(및 `messages.queue.byChannel`)로 구성합니다.
- 모드: `interrupt`, `steer`, `followup`, `collect`, 그리고 backlog 변형

자세한 내용: [Queueing](/ko/concepts/queue).

## 스트리밍, 청크 분할, 배치 처리

Block streaming은 모델이 텍스트 블록을 생성하는 대로 부분 응답을 전송합니다.
Chunking은 채널 텍스트 제한을 준수하며 fenced code가 분리되지 않도록 합니다.

핵심 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle 기반 배치 처리)
- `agents.defaults.humanDelay` (블록 응답 사이의 사람 같은 일시 정지)
- 채널별 재정의: `*.blockStreaming` 및 `*.blockStreamingCoalesce` (Telegram이 아닌 채널은 명시적인 `*.blockStreaming: true` 필요)

자세한 내용: [Streaming + chunking](/ko/concepts/streaming).

## 추론 표시 여부와 토큰

OpenClaw는 모델 추론을 표시하거나 숨길 수 있습니다:

- `/reasoning on|off|stream`으로 표시 여부를 제어합니다.
- 모델이 추론 내용을 생성하면 그 내용도 여전히 토큰 사용량에 포함됩니다.
- Telegram은 초안 버블로 추론 스트리밍을 지원합니다.

자세한 내용: [Thinking + reasoning directives](/ko/tools/thinking) 및 [Token use](/ko/reference/token-use).

## 접두사, 스레딩, 응답

아웃바운드 메시지 형식은 `messages`에서 중앙 관리됩니다:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`(아웃바운드 접두사 계층), 그리고 `channels.whatsapp.messagePrefix`(WhatsApp 수신 접두사)
- `replyToMode`와 채널별 기본값을 통한 응답 스레딩

자세한 내용: [Configuration](/ko/gateway/config-agents#messages) 및 채널 문서를 참조하세요.

## 무응답 응답

정확한 silent token `NO_REPLY` / `no_reply`는 “사용자에게 보이는 응답을 전달하지 않음”을 의미합니다.
턴에 생성된 TTS 오디오 같은 보류 중인 도구 미디어가 함께 있으면 OpenClaw는 silent 텍스트를 제거하되 미디어 첨부 파일은 계속 전달합니다.
OpenClaw는 이 동작을 대화 유형별로 확인합니다:

- 직접 대화는 기본적으로 무응답을 허용하지 않으며, 단독 silent 응답을 짧은 표시용 폴백으로 다시 씁니다.
- 그룹/채널은 기본적으로 무응답을 허용합니다.
- 내부 orchestration은 기본적으로 무응답을 허용합니다.

OpenClaw는 또한 비직접 채팅에서 어떤 assistant 응답보다 먼저 발생하는 내부 runner 실패에도 silent 응답을 사용하므로, 그룹/채널에 Gateway 오류 boilerplate가 보이지 않습니다. 직접 채팅은 기본적으로 간단한 실패 문구를 표시하며, 원시 runner 세부 정보는 `/verbose`가 `on` 또는 `full`일 때만 표시됩니다.

기본값은 `agents.defaults.silentReply`와
`agents.defaults.silentReplyRewrite` 아래에 있으며,
`surfaces.<id>.silentReply`와
`surfaces.<id>.silentReplyRewrite`로 표면별 재정의가 가능합니다.

상위 세션에 하나 이상의 보류 중인 생성된 하위 에이전트 실행이 있으면, 단독 silent 응답은 다시 쓰이지 않고 모든 표면에서 제거되므로 하위 완료 이벤트가 실제 응답을 전달할 때까지 상위는 조용히 유지됩니다.

## 관련

- [Streaming](/ko/concepts/streaming) — 실시간 메시지 전달
- [Retry](/ko/concepts/retry) — 메시지 전달 재시도 동작
- [Queue](/ko/concepts/queue) — 메시지 처리 큐
- [Channels](/ko/channels) — 메시징 플랫폼 통합
