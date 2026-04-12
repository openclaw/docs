---
read_when:
    - thinking, 빠른 모드 또는 상세 directive 파싱이나 기본값 조정
summary: '`/think`, `/fast`, `/verbose`, `/trace`, 그리고 추론 가시성을 위한 directive 문법'
title: Thinking 수준
x-i18n:
    generated_at: "2026-04-12T23:33:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3b1341281f07ba4e9061e3355845dca234be04cc0d358594312beeb7676e68
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking 수준 (`/think` directive)

## 기능 설명

- 모든 인바운드 본문에서 인라인 directive 사용 가능: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “생각”
  - low → “더 깊게 생각”
  - medium → “훨씬 더 깊게 생각”
  - high → “ultrathink” (최대 예산)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex 모델 전용)
  - adaptive → provider가 관리하는 적응형 추론 예산(Anthropic Claude 4.6 모델 제품군에서 지원)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`, `max`는 `high`로 매핑됩니다.
- provider 참고 사항:
  - Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않으면 기본적으로 `adaptive`를 사용합니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax (`minimax/*`)는 모델 params 또는 요청 params에서 명시적으로 thinking을 설정하지 않으면 기본적으로 `thinking: { type: "disabled" }`를 사용합니다. 이렇게 하면 MiniMax의 비기본 Anthropic 스트림 형식에서 `reasoning_content` 델타가 누출되는 것을 방지할 수 있습니다.
  - Z.AI (`zai/*`)는 이진 thinking(`on`/`off`)만 지원합니다. `off`가 아닌 모든 수준은 `on`으로 처리됩니다(`low`로 매핑).
  - Moonshot (`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로, `off`가 아닌 모든 수준을 `thinking: { type: "enabled" }`로 매핑합니다. thinking이 활성화되면 Moonshot는 `tool_choice`로 `auto|none`만 허용하므로, OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 해석 순서

1. 메시지의 인라인 directive(해당 메시지에만 적용).
2. 세션 재정의(directive만 있는 메시지를 보내 설정).
3. agent별 기본값(config의 `agents.list[].thinkingDefault`).
4. 전역 기본값(config의 `agents.defaults.thinkingDefault`).
5. 폴백: Anthropic Claude 4.6 모델은 `adaptive`, 그 외 추론 가능 모델은 `low`, 나머지는 `off`.

## 세션 기본값 설정

- 예를 들어 `/think:medium` 또는 `/t high`처럼 **directive만** 있는 메시지를 보내세요(공백 허용).
- 이 설정은 현재 세션(기본적으로 발신자별)에 유지되며, `/think:off` 또는 세션 유휴 재설정으로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 잘못된 경우(예: `/thinking big`) 명령은 힌트와 함께 거부되며 세션 상태는 변경되지 않습니다.
- 현재 thinking 수준을 보려면 인자 없이 `/think`(또는 `/think:`)를 보내세요.

## agent별 적용

- **Embedded Pi**: 해석된 수준이 프로세스 내 Pi agent 런타임으로 전달됩니다.

## 빠른 모드 (`/fast`)

- 수준: `on|off`.
- directive만 있는 메시지는 세션 빠른 모드 재정의를 전환하고 `Fast mode enabled.` / `Fast mode disabled.`로 응답합니다.
- 현재 유효한 빠른 모드 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보내세요.
- OpenClaw는 다음 순서로 빠른 모드를 해석합니다:
  1. 인라인/directive 전용 `/fast on|off`
  2. 세션 재정의
  3. agent별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 폴백: `off`
- `openai/*`의 경우 빠른 모드는 지원되는 Responses 요청에서 `service_tier=priority`를 보내 OpenAI 우선 처리로 매핑됩니다.
- `openai-codex/*`의 경우 빠른 모드는 Codex Responses에서 동일한 `service_tier=priority` 플래그를 보냅니다. OpenClaw는 두 인증 경로 모두에서 하나의 공유 `/fast` 전환을 유지합니다.
- 직접적인 공개 `anthropic/*` 요청에서는 `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함해 빠른 모드가 Anthropic 서비스 계층으로 매핑됩니다. `/fast on`은 `service_tier=auto`, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에서는 `/fast on`(또는 `params.fastMode: true`)이 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 명시적인 Anthropic `serviceTier` / `service_tier` 모델 params가 둘 다 설정되어 있으면 빠른 모드 기본값보다 우선합니다. OpenClaw는 비 Anthropic 프록시 base URL에 대해서는 여전히 Anthropic 서비스 계층 주입을 건너뜁니다.

## 상세 directive (`/verbose` 또는 `/v`)

- 수준: `on`(최소) | `full` | `off`(기본값).
- directive만 있는 메시지는 세션 상세 모드를 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 잘못된 수준은 상태를 바꾸지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 재정의를 저장합니다. 이를 지우려면 Sessions UI에서 `inherit`를 선택하세요.
- 인라인 directive는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 상세 수준을 보려면 인자 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- 상세 모드가 켜져 있으면 구조화된 도구 결과를 내보내는 agent(Pi, 기타 JSON agent)는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능한 경우 `<emoji> <tool-name>: <arg>` 형식(경로/명령) 접두사가 붙습니다. 이 도구 요약은 각 도구가 시작되는 즉시 전송되며(별도 버블), 스트리밍 델타로 전송되지 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 세부 접미사는 verbose가 `on` 또는 `full`일 때만 표시됩니다.
- verbose가 `full`이면 도구 출력도 완료 후 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행 중에 `/verbose on|full|off`를 전환하면 이후의 도구 버블은 새 설정을 따릅니다.

## Plugin 추적 directive (`/trace`)

- 수준: `on` | `off`(기본값).
- directive만 있는 메시지는 세션 Plugin 추적 출력을 전환하고 `Plugin trace enabled.` / `Plugin trace disabled.`로 응답합니다.
- 인라인 directive는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 추적 수준을 보려면 인자 없이 `/trace`(또는 `/trace:`)를 보내세요.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Active Memory 디버그 요약 같은 Plugin 소유의 추적/디버그 줄만 노출합니다.
- 추적 줄은 `/status`에 나타나거나 일반 assistant 응답 뒤의 후속 진단 메시지로 나타날 수 있습니다.

## 추론 가시성 (`/reasoning`)

- 수준: `on|off|stream`.
- directive만 있는 메시지는 응답에서 thinking 블록을 표시할지 여부를 전환합니다.
- 활성화되면 추론은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`(Telegram 전용): 응답 생성 중 추론을 Telegram 초안 버블에 스트리밍하고, 최종 답변은 추론 없이 전송합니다.
- 별칭: `/reason`.
- 현재 추론 수준을 보려면 인자 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.
- 해석 순서: 인라인 directive, 세션 재정의, agent별 기본값(`agents.list[].reasoningDefault`), 폴백(`off`).

## 관련 항목

- 권한 상승 모드 문서는 [Elevated mode](/ko/tools/elevated)에 있습니다.

## Heartbeat

- Heartbeat probe 본문은 구성된 heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 directive는 평소처럼 적용되지만(단, Heartbeat에서 세션 기본값을 바꾸는 것은 피하세요).
- Heartbeat 전달은 기본적으로 최종 페이로드만 보냅니다. 별도의 `Reasoning:` 메시지도 함께 보내려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 agent별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 thinking 선택기는 페이지가 로드될 때 인바운드 세션 저장소/config에 저장된 세션 수준을 그대로 반영합니다.
- 다른 수준을 선택하면 즉시 `sessions.patch`를 통해 세션 재정의를 기록합니다. 다음 전송까지 기다리지 않으며, 일회성 `thinkingOnce` 재정의도 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)`이며, 해석된 기본값은 활성 세션 모델에서 결정됩니다. Anthropic/Bedrock의 Claude 4.6은 `adaptive`, 그 외 추론 가능 모델은 `low`, 나머지는 `off`입니다.
- 선택기는 계속 provider를 인식합니다:
  - 대부분의 provider는 `off | minimal | low | medium | high | adaptive`를 표시합니다
  - Z.AI는 이진 `off | on`을 표시합니다
- `/think:<level>`도 계속 동작하며 동일하게 저장된 세션 수준을 갱신하므로, 채팅 directive와 선택기는 항상 동기화됩니다.
