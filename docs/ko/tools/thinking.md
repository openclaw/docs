---
read_when:
    - thinking, fast-mode 또는 verbose 지시문 파싱이나 기본값 조정
summary: '`/think`, `/fast`, `/verbose`, `/trace` 및 reasoning 가시성에 대한 지시문 구문'
title: Thinking 수준
x-i18n:
    generated_at: "2026-04-23T14:09:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking 수준(/think 지시문)

## 동작 방식

- 모든 인바운드 본문에서 인라인 지시문 사용 가능: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”(최대 예산)
  - xhigh → “ultrathink+”(GPT-5.2 + Codex 모델 및 Anthropic Claude Opus 4.7 effort)
  - adaptive → provider 관리 적응형 thinking(Anthropic/Bedrock의 Claude 4.6 및 Anthropic Claude Opus 4.7에서 지원)
  - max → provider 최대 reasoning(현재 Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`는 `high`로 매핑됩니다.
- provider 참고:
  - Thinking 메뉴와 선택기는 provider profile 기반입니다. provider plugin이 선택된 모델의 정확한 수준 집합을 선언하며, 여기에는 이진형 `on` 같은 라벨도 포함됩니다.
  - `adaptive`, `xhigh`, `max`는 이를 지원하는 provider/모델 profile에 대해서만 광고됩니다. 지원되지 않는 수준을 입력한 지시문은 해당 모델의 유효한 옵션과 함께 거부됩니다.
  - 기존에 저장된 지원되지 않는 수준은 provider profile 순위에 따라 다시 매핑됩니다. `adaptive`는 비적응형 모델에서는 `medium`으로 폴백하고, `xhigh`와 `max`는 선택된 모델이 지원하는 가장 큰 비-`off` 수준으로 폴백합니다.
  - Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않았을 때 기본값으로 `adaptive`를 사용합니다.
  - Anthropic Claude Opus 4.7은 adaptive thinking을 기본으로 사용하지 않습니다. API effort 기본값은 thinking 수준을 명시적으로 설정하지 않는 한 provider 소유입니다.
  - Anthropic Claude Opus 4.7은 `/think xhigh`를 adaptive thinking + `output_config.effort: "xhigh"`로 매핑합니다. `/think`는 thinking 지시문이고 `xhigh`는 Opus 4.7 effort 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7은 `/think max`도 노출하며, 이는 동일한 provider 소유 max effort 경로로 매핑됩니다.
  - OpenAI GPT 모델은 `/think`를 모델별 Responses API effort 지원을 통해 매핑합니다. `/think off`는 대상 모델이 이를 지원할 때만 `reasoning.effort: "none"`을 전송하며, 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내지 않고 비활성 reasoning payload를 생략합니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax(`minimax/*`)는 모델 params 또는 요청 params에서 thinking을 명시적으로 설정하지 않는 한 기본값으로 `thinking: { type: "disabled" }`를 사용합니다. 이렇게 하면 MiniMax의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` delta가 누출되는 것을 방지합니다.
  - Z.AI(`zai/*`)는 이진 thinking(`on`/`off`)만 지원합니다. `off`가 아닌 모든 수준은 `on`으로 처리됩니다(`low`로 매핑).
  - Moonshot(`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로, `off`가 아닌 모든 수준을 `thinking: { type: "enabled" }`로 매핑합니다. thinking이 활성화되면 Moonshot은 `tool_choice`로 `auto|none`만 허용하므로, OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 확인 순서

1. 메시지의 인라인 지시문(해당 메시지에만 적용)
2. 세션 재정의(지시문만 있는 메시지를 보내 설정)
3. 에이전트별 기본값(구성의 `agents.list[].thinkingDefault`)
4. 전역 기본값(구성의 `agents.defaults.thinkingDefault`)
5. 폴백: 가능하면 provider 선언 기본값, 그렇지 않으면 reasoning 가능한 모델은 `medium` 또는 해당 모델에서 가장 가까운 지원 비-`off` 수준으로 확인되고, non-reasoning 모델은 `off` 유지

## 세션 기본값 설정

- 공백은 허용되지만 **지시문만** 있는 메시지를 보내세요. 예: `/think:medium` 또는 `/t high`
- 이는 현재 세션에 유지됩니다(기본적으로 발신자별). `/think:off` 또는 세션 idle reset으로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 유효하지 않으면(예: `/thinking big`) 힌트와 함께 명령이 거부되고 세션 상태는 변경되지 않습니다.
- 현재 thinking 수준을 보려면 인수 없이 `/think`(또는 `/think:`)를 보내세요.

## 에이전트별 적용

- **내장 Pi**: 확인된 수준이 인프로세스 Pi 에이전트 런타임으로 전달됩니다.

## Fast 모드(/fast)

- 수준: `on|off`
- 지시문만 있는 메시지는 세션 fast-mode 재정의를 토글하고 `Fast mode enabled.` / `Fast mode disabled.`로 응답합니다.
- 현재 유효 fast-mode 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보내세요.
- OpenClaw는 fast 모드를 다음 순서로 확인합니다.
  1. 인라인/지시문 전용 `/fast on|off`
  2. 세션 재정의
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 폴백: `off`
- `openai/*`의 경우 fast 모드는 지원되는 Responses 요청에 `service_tier=priority`를 전송해 OpenAI 우선 처리로 매핑됩니다.
- `openai-codex/*`의 경우 fast 모드는 Codex Responses에 동일한 `service_tier=priority` 플래그를 전송합니다. OpenClaw는 두 인증 경로에 걸쳐 하나의 공유 `/fast` 토글을 유지합니다.
- `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함한 직접 public `anthropic/*` 요청의 경우 fast 모드는 Anthropic 서비스 티어로 매핑됩니다. `/fast on`은 `service_tier=auto`를, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에서는 `/fast on`(또는 `params.fastMode: true`)이 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 명시적인 Anthropic `serviceTier` / `service_tier` 모델 params는 둘 다 설정되어 있을 때 fast-mode 기본값보다 우선합니다. OpenClaw는 비-Anthropic 프록시 base URL에 대해서는 여전히 Anthropic service-tier 주입을 건너뜁니다.
- `/status`는 fast 모드가 활성화된 경우에만 `Fast`를 표시합니다.

## Verbose 지시문(`/verbose` 또는 `/v`)

- 수준: `on`(최소) | `full` | `off`(기본값)
- 지시문만 있는 메시지는 세션 verbose를 토글하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 유효하지 않은 수준은 상태를 바꾸지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 재정의를 저장합니다. Sessions UI에서 `inherit`를 선택해 해제할 수 있습니다.
- 인라인 지시문은 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 verbose 수준을 보려면 인수 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- verbose가 켜져 있으면 구조화된 도구 결과를 내는 에이전트(Pi, 기타 JSON 에이전트)는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능한 경우 `<emoji> <tool-name>: <arg>`(경로/명령) 접두사가 붙습니다. 이 도구 요약은 각 도구가 시작하자마자 전송되며(별도 버블), 스트리밍 delta로 전송되지는 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 보이지만, 원시 오류 세부 접미사는 verbose가 `on` 또는 `full`이 아니면 숨겨집니다.
- verbose가 `full`이면 도구 출력도 완료 후 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행 중에 `/verbose on|full|off`를 토글하면 이후 도구 버블은 새 설정을 따릅니다.

## Plugin trace 지시문(`/trace`)

- 수준: `on` | `off`(기본값)
- 지시문만 있는 메시지는 세션 plugin trace 출력을 토글하고 `Plugin trace enabled.` / `Plugin trace disabled.`로 응답합니다.
- 인라인 지시문은 해당 메시지에만 영향을 주며, 그 외에는 세션/전역 기본값이 적용됩니다.
- 현재 trace 수준을 보려면 인수 없이 `/trace`(또는 `/trace:`)를 보내세요.
- `/trace`는 `/verbose`보다 더 좁습니다. Active Memory 디버그 요약 같은 plugin 소유 trace/debug 줄만 노출합니다.
- Trace 줄은 `/status`와 일반 어시스턴트 답변 뒤의 후속 진단 메시지로 나타날 수 있습니다.

## reasoning 가시성(`/reasoning`)

- 수준: `on|off|stream`
- 지시문만 있는 메시지는 답변에 thinking 블록을 표시할지 여부를 토글합니다.
- 활성화되면 reasoning은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`(Telegram 전용): 답변 생성 중 reasoning을 Telegram draft 버블에 스트리밍한 뒤, 최종 답변은 reasoning 없이 전송합니다.
- 별칭: `/reason`
- 현재 reasoning 수준을 보려면 인수 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.
- 확인 순서: 인라인 지시문, 세션 재정의, 에이전트별 기본값(`agents.list[].reasoningDefault`), 폴백(`off`)

## 관련 문서

- Elevated mode 문서는 [Elevated mode](/ko/tools/elevated)에 있습니다.

## Heartbeat

- Heartbeat 프로브 본문은 구성된 Heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 지시문도 평소처럼 적용되지만(Heartbeat에서 세션 기본값 변경은 피하세요).
- Heartbeat 전달은 기본적으로 최종 payload만 전송합니다. 별도의 `Reasoning:` 메시지도 함께 보내려면(가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 thinking 선택기는 페이지가 로드될 때 인바운드 세션 저장소/구성의 세션 저장 수준을 반영합니다.
- 다른 수준을 선택하면 `sessions.patch`를 통해 세션 재정의를 즉시 기록합니다. 다음 전송까지 기다리지 않으며 일회성 `thinkingOnce` 재정의도 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)`이며, 여기서 확인된 기본값은 활성 세션 모델의 provider thinking profile과 `/status` 및 `session_status`가 사용하는 것과 동일한 폴백 로직에서 나옵니다.
- 선택기는 Gateway 세션 행이 반환한 `thinkingOptions`를 사용합니다. 브라우저 UI는 자체 provider regex 목록을 유지하지 않으며, 모델별 수준 집합은 plugin이 소유합니다.
- `/think:<level>`도 계속 동작하고 같은 저장된 세션 수준을 업데이트하므로 채팅 지시문과 선택기는 동기화된 상태를 유지합니다.

## provider profile

- provider plugin은 모델의 지원 수준과 기본값을 정의하기 위해 `resolveThinkingProfile(ctx)`를 노출할 수 있습니다.
- 각 profile 수준은 저장된 정식 `id`(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, 또는 `max`)를 가지며 표시용 `label`을 포함할 수 있습니다. 이진 provider는 `{ id: "low", label: "on" }`을 사용합니다.
- 공개된 레거시 hook(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 유지되지만, 새 사용자 지정 수준 집합에는 `resolveThinkingProfile`을 사용해야 합니다.
- Gateway 행은 `thinkingOptions`와 `thinkingDefault`를 노출하므로 ACP/채팅 클라이언트가 런타임 검증이 사용하는 것과 같은 profile을 렌더링합니다.
