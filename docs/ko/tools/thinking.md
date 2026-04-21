---
read_when:
    - thinking, fast 모드, 또는 verbose 지시어 파싱이나 기본값 조정
summary: '`/think`, `/fast`, `/verbose`, `/trace`, 그리고 reasoning 가시성을 위한 지시어 문법'
title: Thinking Levels
x-i18n:
    generated_at: "2026-04-21T13:38:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking Levels (/think 지시어)

## 기능

- 모든 인바운드 본문에서 인라인 지시어 사용 가능: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (최대 예산)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex 모델 및 Anthropic Claude Opus 4.7 effort)
  - adaptive → provider 관리형 adaptive thinking(Anthropic/Bedrock의 Claude 4.6 및 Anthropic Claude Opus 4.7에서 지원)
  - max → provider 최대 reasoning(현재는 Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high` 는 `xhigh` 로 매핑됩니다.
  - `highest` 는 `high` 로 매핑됩니다.
- provider 참고:
  - Thinking 메뉴와 선택기는 provider profile 기반입니다. provider Plugin은 선택된 모델에 대한 정확한 수준 집합을 선언하며, `on` 같은 이진 라벨도 포함합니다.
  - `adaptive`, `xhigh`, `max` 는 이를 지원하는 provider/모델 profile에 대해서만 표시됩니다. 지원되지 않는 수준의 타입 지시어는 해당 모델의 유효 옵션과 함께 거부됩니다.
  - 모델 전환 후의 이전 `max` 값처럼 기존에 저장된 지원되지 않는 수준은 선택된 모델에서 지원되는 가장 높은 수준으로 다시 매핑됩니다.
  - Anthropic Claude 4.6 모델은 명시적 thinking 수준이 설정되지 않으면 기본값으로 `adaptive` 를 사용합니다.
  - Anthropic Claude Opus 4.7은 adaptive thinking을 기본값으로 사용하지 않습니다. thinking 수준을 명시적으로 설정하지 않으면 API effort 기본값은 provider 소유로 유지됩니다.
  - Anthropic Claude Opus 4.7은 `/think xhigh` 를 adaptive thinking + `output_config.effort: "xhigh"` 로 매핑합니다. `/think` 는 thinking 지시어이고 `xhigh` 는 Opus 4.7 effort 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7은 `/think max` 도 노출하며, 동일한 provider 소유 최대 effort 경로로 매핑됩니다.
  - OpenAI GPT 모델은 모델별 Responses API effort 지원을 통해 `/think` 를 매핑합니다. `/think off` 는 대상 모델이 이를 지원할 때만 `reasoning.effort: "none"` 을 보냅니다. 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내는 대신 비활성화된 reasoning payload를 생략합니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax (`minimax/*`)는 모델 params 또는 요청 params에서 thinking을 명시적으로 설정하지 않으면 기본값으로 `thinking: { type: "disabled" }` 를 사용합니다. 이렇게 하면 MiniMax의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` 델타가 새어 나오는 것을 방지할 수 있습니다.
  - Z.AI (`zai/*`)는 이진 thinking(`on`/`off`)만 지원합니다. `off` 가 아닌 모든 수준은 `on` 으로 처리됩니다(`low` 로 매핑).
  - Moonshot (`moonshot/*`)은 `/think off` 를 `thinking: { type: "disabled" }` 로, `off` 가 아닌 모든 수준을 `thinking: { type: "enabled" }` 로 매핑합니다. thinking이 활성화되면 Moonshot은 `tool_choice` 로 `auto|none` 만 허용하므로, OpenClaw는 호환되지 않는 값을 `auto` 로 정규화합니다.

## 확인 순서

1. 메시지의 인라인 지시어(해당 메시지에만 적용).
2. 세션 재정의(지시어만 있는 메시지를 보내 설정).
3. 에이전트별 기본값(config의 `agents.list[].thinkingDefault`).
4. 전역 기본값(config의 `agents.defaults.thinkingDefault`).
5. 대체값: 사용 가능할 때는 provider 선언 기본값, reasoning 지원으로 표시된 다른 카탈로그 모델은 `low`, 그 외에는 `off`.

## 세션 기본값 설정

- **지시어만** 있는 메시지를 보내세요(공백 허용). 예: `/think:medium` 또는 `/t high`.
- 이 설정은 현재 세션에 유지됩니다(기본적으로 발신자별). `/think:off` 또는 세션 유휴 초기화로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 유효하지 않으면(예: `/thinking big`) 힌트와 함께 명령이 거부되며 세션 상태는 변경되지 않습니다.
- 현재 thinking 수준을 보려면 인자 없이 `/think` (또는 `/think:`) 를 보내세요.

## 에이전트별 적용

- **내장 Pi**: 확인된 수준이 프로세스 내 Pi 에이전트 런타임에 전달됩니다.

## Fast 모드 (/fast)

- 수준: `on|off`.
- 지시어만 있는 메시지는 세션 fast-mode 재정의를 전환하고 `Fast mode enabled.` / `Fast mode disabled.` 로 응답합니다.
- 현재 유효한 fast-mode 상태를 보려면 모드 없이 `/fast` (또는 `/fast status`) 를 보내세요.
- OpenClaw는 fast 모드를 다음 순서로 확인합니다:
  1. 인라인/지시어 전용 `/fast on|off`
  2. 세션 재정의
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 대체값: `off`
- `openai/*` 의 경우 fast 모드는 지원되는 Responses 요청에 `service_tier=priority` 를 보내는 방식으로 OpenAI priority processing에 매핑됩니다.
- `openai-codex/*` 의 경우 fast 모드는 Codex Responses에 동일한 `service_tier=priority` 플래그를 보냅니다. OpenClaw는 두 인증 경로 모두에서 하나의 공유 `/fast` 토글을 유지합니다.
- 직접 public `anthropic/*` 요청(`api.anthropic.com` 으로 전송되는 OAuth 인증 트래픽 포함)의 경우 fast 모드는 Anthropic service tier에 매핑됩니다. `/fast on` 은 `service_tier=auto`, `/fast off` 는 `service_tier=standard_only` 를 설정합니다.
- Anthropic 호환 경로의 `minimax/*` 에서 `/fast on` (또는 `params.fastMode: true`) 은 `MiniMax-M2.7` 을 `MiniMax-M2.7-highspeed` 로 다시 씁니다.
- 명시적 Anthropic `serviceTier` / `service_tier` 모델 params는 둘 다 설정된 경우 fast-mode 기본값보다 우선합니다. OpenClaw는 여전히 Anthropic이 아닌 프록시 base URL에 대해서는 Anthropic service-tier 주입을 건너뜁니다.

## Verbose 지시어 (/verbose 또는 /v)

- 수준: `on` (최소) | `full` | `off` (기본값).
- 지시어만 있는 메시지는 세션 verbose를 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.` 로 응답합니다. 유효하지 않은 수준은 상태를 변경하지 않고 힌트를 반환합니다.
- `/verbose off` 는 명시적 세션 재정의를 저장합니다. Sessions UI에서 `inherit` 를 선택해 해제하세요.
- 인라인 지시어는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 verbose 수준을 보려면 인자 없이 `/verbose` (또는 `/verbose:`) 를 보내세요.
- verbose가 켜져 있으면 구조화된 tool 결과를 내는 에이전트(Pi, 기타 JSON 에이전트)는 각 tool 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능하면 `<emoji> <tool-name>: <arg>` 형식(path/command) 접두사가 붙습니다. 이러한 tool 요약은 각 tool이 시작되는 즉시 전송되며(별도 버블), 스트리밍 델타로 전송되지 않습니다.
- Tool 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 상세 접미사는 verbose가 `on` 또는 `full` 일 때만 표시됩니다.
- verbose가 `full` 이면 tool 출력도 완료 후 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행이 진행 중일 때 `/verbose on|full|off` 를 전환하면 이후 tool 버블은 새 설정을 따릅니다.

## Plugin trace 지시어 (/trace)

- 수준: `on` | `off` (기본값).
- 지시어만 있는 메시지는 세션 Plugin trace 출력을 전환하고 `Plugin trace enabled.` / `Plugin trace disabled.` 로 응답합니다.
- 인라인 지시어는 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 trace 수준을 보려면 인자 없이 `/trace` (또는 `/trace:`) 를 보내세요.
- `/trace` 는 `/verbose` 보다 범위가 좁습니다. Active Memory 디버그 요약 같은 Plugin 소유 trace/debug 줄만 노출합니다.
- Trace 줄은 `/status` 에 나타날 수 있으며, 일반 assistant 응답 뒤에 후속 진단 메시지로도 나타날 수 있습니다.

## Reasoning 가시성 (/reasoning)

- 수준: `on|off|stream`.
- 지시어만 있는 메시지는 응답에서 thinking 블록을 표시할지 여부를 전환합니다.
- 활성화되면 reasoning은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream` (Telegram 전용): 응답 생성 중 reasoning을 Telegram 초안 버블로 스트리밍한 뒤, 최종 답변은 reasoning 없이 전송합니다.
- 별칭: `/reason`.
- 현재 reasoning 수준을 보려면 인자 없이 `/reasoning` (또는 `/reasoning:`) 을 보내세요.
- 확인 순서: 인라인 지시어, 세션 재정의, 에이전트별 기본값(`agents.list[].reasoningDefault`), 대체값(`off`).

## 관련

- Elevated 모드 문서는 [Elevated mode](/ko/tools/elevated) 에 있습니다.

## Heartbeats

- Heartbeat probe 본문은 구성된 heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). heartbeat 메시지의 인라인 지시어는 평소처럼 적용되지만(heartbeat로 세션 기본값을 바꾸는 것은 피하세요).
- Heartbeat 전달 기본값은 최종 payload만 전송하는 것입니다. 별도의 `Reasoning:` 메시지도 함께 보내려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true` 를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 thinking 선택기는 페이지가 로드될 때 인바운드 세션 저장소/config에 저장된 세션 수준을 그대로 반영합니다.
- 다른 수준을 선택하면 `sessions.patch` 를 통해 세션 재정의가 즉시 기록됩니다. 다음 전송까지 기다리지 않으며 일회성 `thinkingOnce` 재정의도 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)` 이며, 여기서 확인된 기본값은 활성 세션 모델의 provider thinking profile에서 가져옵니다.
- 선택기는 gateway session row가 반환하는 `thinkingOptions` 를 사용합니다. 브라우저 UI는 자체 provider regex 목록을 유지하지 않으며, 모델별 수준 집합은 Plugin이 소유합니다.
- `/think:<level>` 도 계속 작동하며 동일한 저장된 세션 수준을 갱신하므로, 채팅 지시어와 선택기는 동기화된 상태를 유지합니다.

## Provider profiles

- provider Plugin은 모델의 지원 수준과 기본값을 정의하기 위해 `resolveThinkingProfile(ctx)` 를 노출할 수 있습니다.
- 각 profile 수준은 저장되는 정식 `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`)를 가지며, 표시용 `label` 을 포함할 수도 있습니다. 이진 provider는 `{ id: "low", label: "on" }` 을 사용합니다.
- 공개된 기존 hook(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 남아 있지만, 새로운 사용자 지정 수준 집합에는 `resolveThinkingProfile` 을 사용해야 합니다.
- Gateway row는 `thinkingOptions` 와 `thinkingDefault` 를 노출하므로 ACP/채팅 클라이언트가 런타임 검증과 동일한 profile을 렌더링할 수 있습니다.
