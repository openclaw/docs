---
read_when:
    - thinking, fast-mode, 또는 verbose directive 파싱이나 기본값 조정하기
summary: '`/think`, `/fast`, `/verbose`, `/trace`, 그리고 reasoning 가시성을 위한 directive 문법'
title: thinking 수준
x-i18n:
    generated_at: "2026-04-25T06:13:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## 기능

- 모든 인바운드 본문에서 인라인 directive 지원: `/t <level>`, `/think:<level>`, 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (최대 예산)
  - xhigh → “ultrathink+” (GPT-5.2+ 및 Codex 모델, 그리고 Anthropic Claude Opus 4.7 effort)
  - adaptive → provider 관리형 adaptive thinking (Anthropic/Bedrock의 Claude 4.6, Anthropic Claude Opus 4.7, Google Gemini dynamic thinking에서 지원)
  - max → provider 최대 reasoning (현재 Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`는 `high`로 매핑됩니다.
- provider 참고:
  - Thinking 메뉴와 picker는 provider profile 기반입니다. Provider Plugin은 binary `on` 같은 레이블을 포함해 선택된 모델에 대한 정확한 수준 집합을 선언합니다.
  - `adaptive`, `xhigh`, `max`는 이를 지원하는 provider/model profile에 대해서만 표시됩니다. 지원되지 않는 수준에 대한 typed directive는 해당 모델의 유효한 옵션과 함께 거부됩니다.
  - 기존에 저장된 지원되지 않는 수준은 provider profile 순위에 따라 재매핑됩니다. `adaptive`는 non-adaptive 모델에서 `medium`으로 폴백하고, `xhigh`와 `max`는 선택된 모델이 지원하는 가장 큰 non-off 수준으로 폴백합니다.
  - Anthropic Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않으면 기본적으로 `adaptive`를 사용합니다.
  - Anthropic Claude Opus 4.7은 adaptive thinking을 기본값으로 사용하지 않습니다. 해당 API effort 기본값은 thinking 수준을 명시적으로 설정하지 않는 한 provider가 소유합니다.
  - Anthropic Claude Opus 4.7은 `/think xhigh`를 adaptive thinking + `output_config.effort: "xhigh"`로 매핑합니다. `/think`는 thinking directive이고 `xhigh`는 Opus 4.7 effort 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7은 `/think max`도 노출하며, 이는 같은 provider 소유 max effort 경로로 매핑됩니다.
  - OpenAI GPT 모델은 `/think`를 모델별 Responses API effort 지원에 따라 매핑합니다. `/think off`는 대상 모델이 이를 지원할 때만 `reasoning.effort: "none"`을 전송합니다. 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내는 대신 비활성화된 reasoning 페이로드를 생략합니다.
  - Google Gemini는 `/think adaptive`를 Gemini의 provider 소유 dynamic thinking으로 매핑합니다. Gemini 3 요청은 고정 `thinkingLevel`을 생략하고, Gemini 2.5 요청은 `thinkingBudget: -1`을 전송합니다. 고정 수준은 여전히 해당 모델 계열에 가장 가까운 Gemini `thinkingLevel` 또는 budget으로 매핑됩니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax (`minimax/*`)는 모델 params 또는 요청 params에서 thinking을 명시적으로 설정하지 않는 한 기본적으로 `thinking: { type: "disabled" }`를 사용합니다. 이렇게 하면 MiniMax의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` delta가 새는 것을 방지합니다.
  - Z.AI (`zai/*`)는 binary thinking (`on`/`off`)만 지원합니다. `off`가 아닌 수준은 모두 `on`으로 처리됩니다(`low`로 매핑).
  - Moonshot (`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로, `off`가 아닌 수준은 모두 `thinking: { type: "enabled" }`로 매핑합니다. thinking이 활성화되면 Moonshot은 `tool_choice`로 `auto|none`만 허용하므로, OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 확인 순서

1. 메시지의 인라인 directive(해당 메시지에만 적용).
2. 세션 override(directive만 있는 메시지를 보내 설정).
3. 에이전트별 기본값(config의 `agents.list[].thinkingDefault`).
4. 전역 기본값(config의 `agents.defaults.thinkingDefault`).
5. 폴백: 사용 가능한 경우 provider가 선언한 기본값, 그렇지 않으면 reasoning-capable 모델은 `medium` 또는 해당 모델이 지원하는 가장 가까운 non-`off` 수준으로 확인되고, non-reasoning 모델은 `off`를 유지합니다.

## 세션 기본값 설정

- **directive만** 있는 메시지를 보냅니다(공백 허용). 예: `/think:medium` 또는 `/t high`.
- 이는 현재 세션에 유지됩니다(기본적으로 발신자별). `/think:off` 또는 세션 유휴 리셋으로 해제됩니다.
- 확인 응답이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 잘못되면(예: `/thinking big`) 명령은 힌트와 함께 거부되고 세션 상태는 변경되지 않습니다.
- 현재 thinking 수준을 보려면 인자 없이 `/think`(또는 `/think:`)를 보내세요.

## 에이전트별 적용

- **Embedded Pi**: 확인된 수준이 인프로세스 Pi 에이전트 런타임에 전달됩니다.

## Fast mode (/fast)

- 수준: `on|off`.
- directive만 있는 메시지는 세션 fast-mode override를 토글하고 `Fast mode enabled.` / `Fast mode disabled.`로 응답합니다.
- 현재 유효한 fast-mode 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보내세요.
- OpenClaw는 fast mode를 다음 순서로 확인합니다:
  1. 인라인/directive-only `/fast on|off`
  2. 세션 override
  3. 에이전트별 기본값 (`agents.list[].fastModeDefault`)
  4. 모델별 config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 폴백: `off`
- `openai/*`의 경우 fast mode는 지원되는 Responses 요청에 `service_tier=priority`를 보내는 방식으로 OpenAI priority processing에 매핑됩니다.
- `openai-codex/*`의 경우 fast mode는 Codex Responses에서 동일한 `service_tier=priority` 플래그를 보냅니다. OpenClaw는 두 auth 경로 모두에서 하나의 공통 `/fast` 토글을 유지합니다.
- `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함해 직접 공개 `anthropic/*` 요청의 경우, fast mode는 Anthropic service tier로 매핑됩니다: `/fast on`은 `service_tier=auto`, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에서는 `/fast on`(또는 `params.fastMode: true`)이 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 둘 다 설정된 경우 명시적 Anthropic `serviceTier` / `service_tier` 모델 params가 fast-mode 기본값보다 우선합니다. OpenClaw는 여전히 Anthropic이 아닌 proxy base URL에 대해서는 Anthropic service-tier 주입을 건너뜁니다.
- `/status`는 fast mode가 활성화된 경우에만 `Fast`를 표시합니다.

## Verbose directive (/verbose 또는 /v)

- 수준: `on` (minimal) | `full` | `off` (기본값).
- directive만 있는 메시지는 세션 verbose를 토글하고 `Verbose logging enabled.` / `Verbose logging disabled.`로 응답합니다. 잘못된 수준은 상태를 바꾸지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 override를 저장합니다. Sessions UI에서 `inherit`를 선택해 해제할 수 있습니다.
- 인라인 directive는 해당 메시지에만 영향을 주며, 그렇지 않으면 세션/전역 기본값이 적용됩니다.
- 현재 verbose 수준을 보려면 인자 없이 `/verbose`(또는 `/verbose:`)를 보내세요.
- verbose가 켜져 있으면 구조화된 도구 결과를 내보내는 에이전트(Pi, 기타 JSON 에이전트)는 각 도구 호출을 별도의 메타데이터 전용 메시지로 다시 보냅니다. 가능한 경우 `<emoji> <tool-name>: <arg>` 형식(경로/명령)으로 접두사가 붙습니다. 이러한 도구 요약은 각 도구가 시작되는 즉시 전송되며(별도 버블), 스트리밍 delta로 전송되지 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 보이지만, 원시 오류 상세 접미사는 verbose가 `on` 또는 `full`일 때만 표시됩니다.
- verbose가 `full`이면 도구 출력도 완료 후 전달됩니다(별도 버블, 안전한 길이로 잘림). 실행 중에 `/verbose on|full|off`를 토글하면 이후 도구 버블은 새 설정을 따릅니다.

## Plugin trace directive (/trace)

- 수준: `on` | `off` (기본값).
- directive만 있는 메시지는 세션 plugin trace 출력을 토글하고 `Plugin trace enabled.` / `Plugin trace disabled.`로 응답합니다.
- 인라인 directive는 해당 메시지에만 영향을 주며, 그렇지 않으면 세션/전역 기본값이 적용됩니다.
- 현재 trace 수준을 보려면 인자 없이 `/trace`(또는 `/trace:`)를 보내세요.
- `/trace`는 `/verbose`보다 더 좁습니다. Active Memory 디버그 요약 같은 plugin 소유 trace/debug 줄만 노출합니다.
- Trace 줄은 `/status`에 나타나거나 일반 assistant 응답 뒤에 후속 진단 메시지로 나타날 수 있습니다.

## Reasoning 가시성 (/reasoning)

- 수준: `on|off|stream`.
- directive만 있는 메시지는 응답에서 thinking 블록을 표시할지 여부를 토글합니다.
- 활성화되면 reasoning은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream` (Telegram 전용): 응답 생성 중 reasoning을 Telegram 초안 버블에 스트리밍하고, 이후 최종 응답은 reasoning 없이 전송합니다.
- 별칭: `/reason`.
- 현재 reasoning 수준을 보려면 인자 없이 `/reasoning`(또는 `/reasoning:`)을 보내세요.
- 확인 순서: 인라인 directive, 세션 override, 에이전트별 기본값(`agents.list[].reasoningDefault`), 폴백(`off`).

## 관련 항목

- Elevated mode 문서는 [Elevated mode](/ko/tools/elevated)에 있습니다.

## Heartbeat

- Heartbeat probe 본문은 구성된 Heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 directive는 평소처럼 적용되지만(단, Heartbeat에서 세션 기본값을 바꾸는 것은 피하세요).
- Heartbeat 전달은 기본적으로 최종 페이로드만 사용합니다. 별도의 `Reasoning:` 메시지도 함께 보내려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정하세요.

## 웹 채팅 UI

- 웹 채팅 thinking 선택기는 페이지가 로드될 때 인바운드 세션 저장소/config에 저장된 세션 수준을 반영합니다.
- 다른 수준을 선택하면 `sessions.patch`를 통해 세션 override를 즉시 기록합니다. 다음 전송까지 기다리지 않으며, 일회성 `thinkingOnce` override도 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)`이며, 여기서 확인된 기본값은 활성 세션 모델의 provider thinking profile과 `/status`, `session_status`가 사용하는 것과 동일한 폴백 로직에서 나옵니다.
- picker는 gateway 세션 행/기본값이 반환하는 `thinkingLevels`를 사용하고, `thinkingOptions`는 레거시 레이블 목록으로 유지됩니다. 브라우저 UI는 자체 provider regex 목록을 유지하지 않으며, 모델별 수준 집합은 Plugin이 소유합니다.
- `/think:<level>`도 여전히 동작하며 동일한 저장된 세션 수준을 업데이트하므로, 채팅 directive와 picker는 서로 동기화된 상태를 유지합니다.

## Provider profile

- Provider Plugin은 모델이 지원하는 수준과 기본값을 정의하기 위해 `resolveThinkingProfile(ctx)`를 노출할 수 있습니다.
- 각 profile 수준은 저장되는 정식 `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`)를 가지며, 표시용 `label`을 포함할 수도 있습니다. Binary provider는 `{ id: "low", label: "on" }`를 사용합니다.
- 공개된 레거시 hook(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 계속 남아 있지만, 새로운 사용자 지정 수준 집합에는 `resolveThinkingProfile`을 사용해야 합니다.
- Gateway 행/기본값은 `thinkingLevels`, `thinkingOptions`, `thinkingDefault`를 노출하므로 ACP/채팅 클라이언트가 런타임 검증이 사용하는 것과 같은 profile id와 레이블을 렌더링할 수 있습니다.
