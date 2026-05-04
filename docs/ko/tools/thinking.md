---
read_when:
    - thinking, fast-mode 또는 verbose 지시문 구문 분석이나 기본값 조정
summary: /think, /fast, /verbose, /trace 및 추론 표시 여부를 위한 지시문 구문
title: 사고 수준
x-i18n:
    generated_at: "2026-05-04T18:24:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
    source_path: tools/thinking.md
    workflow: 16
---

## 기능

- 모든 수신 본문의 인라인 지시문: `/t <level>`, `/think:<level>` 또는 `/thinking <level>`.
- 수준(별칭): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “생각”
  - low → “깊이 생각”
  - medium → “더 깊이 생각”
  - high → “초고강도 사고” (최대 예산)
  - xhigh → “초고강도 사고+” (GPT-5.2+ 및 Codex 모델, Anthropic Claude Opus 4.7 노력 수준 포함)
  - adaptive → 제공자 관리형 적응형 사고(Anthropic/Bedrock의 Claude 4.6, Anthropic Claude Opus 4.7, Google Gemini 동적 사고에서 지원)
  - max → 제공자 최대 추론(Anthropic Claude Opus 4.7; Ollama는 이를 자체 최고 `think` 노력 수준으로 매핑)
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high`는 `xhigh`로 매핑됩니다.
  - `highest`는 `high`로 매핑됩니다.
- 제공자 참고 사항:
  - 사고 메뉴와 선택기는 제공자 프로필 기반입니다. 제공자 Plugin은 선택한 모델에 대한 정확한 수준 세트를 선언하며, 이진 `on` 같은 레이블도 포함합니다.
  - `adaptive`, `xhigh`, `max`는 이를 지원하는 제공자/모델 프로필에 대해서만 표시됩니다. 지원되지 않는 수준의 입력된 지시문은 해당 모델의 유효한 옵션과 함께 거부됩니다.
  - 기존에 저장된 지원되지 않는 수준은 제공자 프로필 순위에 따라 다시 매핑됩니다. `adaptive`는 비적응형 모델에서 `medium`으로 대체되고, `xhigh` 및 `max`는 선택한 모델에서 지원되는 가장 큰 비-`off` 수준으로 대체됩니다.
  - Anthropic Claude 4.6 모델은 명시적인 사고 수준이 설정되지 않은 경우 기본값으로 `adaptive`를 사용합니다.
  - Anthropic Claude Opus 4.7은 기본적으로 적응형 사고를 사용하지 않습니다. 사고 수준을 명시적으로 설정하지 않는 한 API 노력 수준 기본값은 제공자가 소유합니다.
  - Anthropic Claude Opus 4.7은 `/think xhigh`를 적응형 사고와 `output_config.effort: "xhigh"`로 매핑합니다. `/think`는 사고 지시문이고 `xhigh`는 Opus 4.7 노력 수준 설정이기 때문입니다.
  - Anthropic Claude Opus 4.7은 `/think max`도 노출하며, 동일한 제공자 소유 최대 노력 수준 경로로 매핑됩니다.
  - DeepSeek V4 모델은 `/think xhigh|max`를 노출합니다. 둘 다 DeepSeek `reasoning_effort: "max"`로 매핑되고, 더 낮은 비-`off` 수준은 `high`로 매핑됩니다.
  - Ollama 사고 가능 모델은 `/think low|medium|high|max`를 노출합니다. Ollama의 네이티브 API가 `low`, `medium`, `high` 노력 수준 문자열을 허용하므로 `max`는 네이티브 `think: "high"`로 매핑됩니다.
  - OpenAI GPT 모델은 모델별 Responses API 노력 수준 지원을 통해 `/think`를 매핑합니다. `/think off`는 대상 모델이 지원하는 경우에만 `reasoning.effort: "none"`을 전송합니다. 그렇지 않으면 OpenClaw는 지원되지 않는 값을 보내는 대신 비활성화된 추론 페이로드를 생략합니다.
  - 사용자 지정 OpenAI 호환 카탈로그 항목은 `models.providers.<provider>.models[].compat.supportedReasoningEfforts`에 `"xhigh"`를 포함하도록 설정하여 `/think xhigh`를 선택할 수 있습니다. 이는 아웃바운드 OpenAI 추론 노력 수준 페이로드를 매핑하는 것과 동일한 호환성 메타데이터를 사용하므로 메뉴, 세션 유효성 검사, 에이전트 CLI, `llm-task`가 전송 동작과 일치합니다.
  - 오래된 구성의 OpenRouter Hunter Alpha 참조는 프록시 추론 삽입을 건너뜁니다. 해당 폐기된 경로가 추론 필드를 통해 최종 답변 텍스트를 반환할 수 있기 때문입니다.
  - Google Gemini는 `/think adaptive`를 Gemini의 제공자 소유 동적 사고로 매핑합니다. Gemini 3 요청은 고정 `thinkingLevel`을 생략하고, Gemini 2.5 요청은 `thinkingBudget: -1`을 전송합니다. 고정 수준은 여전히 해당 모델 계열에 가장 가까운 Gemini `thinkingLevel` 또는 예산으로 매핑됩니다.
  - Anthropic 호환 스트리밍 경로의 MiniMax(`minimax/*`)는 모델 매개변수나 요청 매개변수에서 사고를 명시적으로 설정하지 않는 한 기본값으로 `thinking: { type: "disabled" }`를 사용합니다. 이는 MiniMax의 비네이티브 Anthropic 스트림 형식에서 `reasoning_content` 델타가 누출되는 것을 방지합니다.
  - Z.AI(`zai/*`)는 이진 사고(`on`/`off`)만 지원합니다. 비-`off` 수준은 모두 `on`으로 처리됩니다(`low`로 매핑).
  - Moonshot(`moonshot/*`)은 `/think off`를 `thinking: { type: "disabled" }`로 매핑하고, 모든 비-`off` 수준을 `thinking: { type: "enabled" }`로 매핑합니다. 사고가 활성화되면 Moonshot은 `tool_choice` `auto|none`만 허용합니다. OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다.

## 결정 순서

1. 메시지의 인라인 지시문(해당 메시지에만 적용).
2. 세션 재정의(지시문만 포함된 메시지를 보내 설정).
3. 에이전트별 기본값(구성의 `agents.list[].thinkingDefault`).
4. 전역 기본값(구성의 `agents.defaults.thinkingDefault`).
5. 대체값: 제공자가 선언한 기본값이 있으면 사용합니다. 그렇지 않으면 추론 가능 모델은 `medium` 또는 해당 모델에서 지원되는 가장 가까운 비-`off` 수준으로 결정되고, 비추론 모델은 `off`로 유지됩니다.

## 세션 기본값 설정

- 지시문**만** 포함된 메시지를 보냅니다(공백 허용). 예: `/think:medium` 또는 `/t high`.
- 현재 세션에 유지됩니다(기본적으로 발신자별). `/think:off` 또는 세션 유휴 재설정으로 해제됩니다.
- 확인 답장이 전송됩니다(`Thinking level set to high.` / `Thinking disabled.`). 수준이 유효하지 않은 경우(예: `/thinking big`) 명령은 힌트와 함께 거부되고 세션 상태는 변경되지 않습니다.
- 현재 사고 수준을 보려면 인수 없이 `/think`(또는 `/think:`)를 보냅니다.

## 에이전트별 적용

- **임베디드 Pi**: 결정된 수준이 프로세스 내 Pi 에이전트 런타임에 전달됩니다.
- **Claude CLI 백엔드**: `claude-cli`를 사용할 때 비-off 수준이 Claude Code에 `--effort`로 전달됩니다. [CLI 백엔드](/ko/gateway/cli-backends)를 참조하세요.

## 빠른 모드(/fast)

- 수준: `on|off`.
- 지시문만 포함된 메시지는 세션 빠른 모드 재정의를 전환하고 `Fast mode enabled.` / `Fast mode disabled.`라고 답합니다.
- 현재 유효한 빠른 모드 상태를 보려면 모드 없이 `/fast`(또는 `/fast status`)를 보냅니다.
- OpenClaw는 다음 순서로 빠른 모드를 결정합니다.
  1. 인라인/지시문 전용 `/fast on|off`
  2. 세션 재정의
  3. 에이전트별 기본값(`agents.list[].fastModeDefault`)
  4. 모델별 구성: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 대체값: `off`
- `openai/*`의 경우 빠른 모드는 지원되는 Responses 요청에서 `service_tier=priority`를 전송하여 OpenAI 우선 처리로 매핑됩니다.
- `openai-codex/*`의 경우 빠른 모드는 Codex Responses에 동일한 `service_tier=priority` 플래그를 전송합니다. OpenClaw는 두 인증 경로 모두에서 하나의 공유 `/fast` 토글을 유지합니다.
- `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함한 직접 공개 `anthropic/*` 요청의 경우 빠른 모드는 Anthropic 서비스 티어로 매핑됩니다. `/fast on`은 `service_tier=auto`를 설정하고, `/fast off`는 `service_tier=standard_only`를 설정합니다.
- Anthropic 호환 경로의 `minimax/*`에 대해 `/fast on`(또는 `params.fastMode: true`)은 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.
- 명시적인 Anthropic `serviceTier` / `service_tier` 모델 매개변수는 둘 다 설정된 경우 빠른 모드 기본값을 재정의합니다. OpenClaw는 여전히 비-Anthropic 프록시 기본 URL에 대해 Anthropic 서비스 티어 삽입을 건너뜁니다.
- `/status`는 빠른 모드가 활성화된 경우에만 `Fast`를 표시합니다.

## 상세 출력 지시문(/verbose 또는 /v)

- 수준: `on`(최소) | `full` | `off`(기본값).
- 지시문만 포함된 메시지는 세션 상세 출력을 전환하고 `Verbose logging enabled.` / `Verbose logging disabled.`라고 답합니다. 유효하지 않은 수준은 상태를 변경하지 않고 힌트를 반환합니다.
- `/verbose off`는 명시적인 세션 재정의를 저장합니다. Sessions UI에서 `inherit`을 선택하여 해제합니다.
- 인라인 지시문은 해당 메시지에만 영향을 주며, 그렇지 않으면 세션/전역 기본값이 적용됩니다.
- 현재 상세 출력 수준을 보려면 인수 없이 `/verbose`(또는 `/verbose:`)를 보냅니다.
- 상세 출력이 켜져 있으면 구조화된 도구 결과를 내보내는 에이전트(Pi, 기타 JSON 에이전트)가 각 도구 호출을 자체 메타데이터 전용 메시지로 다시 보내며, 사용 가능한 경우 `<emoji> <tool-name>: <arg>` 접두사가 붙습니다. 이러한 도구 요약은 각 도구가 시작되는 즉시 전송되며(별도 말풍선), 스트리밍 델타로 전송되지 않습니다.
- 도구 실패 요약은 일반 모드에서도 계속 표시되지만, 원시 오류 세부 접미사는 상세 출력이 `on` 또는 `full`이 아닌 한 숨겨집니다.
- 상세 출력이 `full`이면 도구 출력도 완료 후 전달됩니다(별도 말풍선, 안전한 길이로 잘림). 실행 중에 `/verbose on|full|off`를 전환하면 이후 도구 말풍선은 새 설정을 따릅니다.
- `agents.defaults.toolProgressDetail`은 `/verbose` 도구 요약과 진행 초안 도구 줄의 형식을 제어합니다. `🛠️ Exec: checking JS syntax` 같은 간결한 사람이 읽는 레이블에는 `"explain"`(기본값)을 사용하고, 디버깅을 위해 원시 명령/세부 정보도 덧붙이고 싶을 때는 `"raw"`를 사용합니다. 에이전트별 `agents.list[].toolProgressDetail`은 기본값을 재정의합니다.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin 추적 지시문(/trace)

- 수준: `on` | `off`(기본값).
- 지시문만 포함된 메시지는 세션 Plugin 추적 출력을 전환하고 `Plugin trace enabled.` / `Plugin trace disabled.`라고 답합니다.
- 인라인 지시문은 해당 메시지에만 영향을 주며, 그렇지 않으면 세션/전역 기본값이 적용됩니다.
- 현재 추적 수준을 보려면 인수 없이 `/trace`(또는 `/trace:`)를 보냅니다.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Active Memory 디버그 요약 같은 Plugin 소유 추적/디버그 줄만 노출합니다.
- 추적 줄은 `/status`에 나타나거나 일반 어시스턴트 답변 이후 후속 진단 메시지로 나타날 수 있습니다.

## 추론 표시 여부(/reasoning)

- 수준: `on|off|stream`.
- 지시문만 포함된 메시지는 사고 블록을 답장에 표시할지 여부를 전환합니다.
- 활성화되면 추론은 `Reasoning:` 접두사가 붙은 **별도 메시지**로 전송됩니다.
- `stream`(Telegram만 해당): 답변이 생성되는 동안 추론을 Telegram 초안 말풍선으로 스트리밍한 다음, 추론 없이 최종 답변을 전송합니다.
- 별칭: `/reason`.
- 현재 추론 수준을 보려면 인수 없이 `/reasoning`(또는 `/reasoning:`)을 보냅니다.
- 결정 순서: 인라인 지시문, 세션 재정의, 에이전트별 기본값(`agents.list[].reasoningDefault`), 대체값(`off`).

잘못된 로컬 모델 추론 태그는 보수적으로 처리됩니다. 닫힌 `<think>...</think>` 블록은 일반 답장에서 숨겨진 상태로 유지되고, 이미 표시된 텍스트 이후의 닫히지 않은 추론도 숨겨집니다. 답장이 하나의 닫히지 않은 여는 태그로 완전히 감싸져 있고 그대로라면 빈 텍스트로 전달될 경우, OpenClaw는 잘못된 여는 태그를 제거하고 남은 텍스트를 전달합니다.

## 관련 항목

- 상승 모드 문서는 [상승 모드](/ko/tools/elevated)에 있습니다.

## Heartbeat

- Heartbeat 프로브 본문은 구성된 Heartbeat 프롬프트입니다(기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat 메시지의 인라인 지시문은 평소처럼 적용됩니다(다만 Heartbeat에서 세션 기본값을 변경하는 것은 피하세요).
- Heartbeat 전달은 기본적으로 최종 페이로드만 사용합니다. 별도의 `Reasoning:` 메시지도 전송하려면(사용 가능한 경우) `agents.defaults.heartbeat.includeReasoning: true` 또는 에이전트별 `agents.list[].heartbeat.includeReasoning: true`를 설정합니다.

## 웹 채팅 UI

- 웹 채팅 사고 선택기는 페이지가 로드될 때 인바운드 세션 저장소/구성에서 세션에 저장된 수준을 반영합니다.
- 다른 수준을 선택하면 `sessions.patch`를 통해 세션 재정의가 즉시 기록됩니다. 다음 전송을 기다리지 않으며 일회성 `thinkingOnce` 재정의가 아닙니다.
- 첫 번째 옵션은 항상 `Default (<resolved level>)`이며, 여기서 결정된 기본값은 활성 세션 모델의 제공자 사고 프로필과 `/status` 및 `session_status`가 사용하는 동일한 대체 로직에서 옵니다.
- 선택기는 Gateway 세션 행/기본값이 반환한 `thinkingLevels`를 사용하며, `thinkingOptions`는 레거시 레이블 목록으로 유지됩니다. 브라우저 UI는 자체 제공자 정규식 목록을 유지하지 않습니다. Plugin이 모델별 수준 세트를 소유합니다.
- `/think:<level>`도 계속 작동하며 동일하게 저장된 세션 수준을 업데이트하므로 채팅 지시문과 선택기가 동기화됩니다.

## 제공자 프로필

- Provider Plugin은 모델이 지원하는 수준과 기본값을 정의하기 위해 `resolveThinkingProfile(ctx)`를 노출할 수 있습니다.
- Claude 모델을 프록시하는 Provider Plugin은 직접 Anthropic 카탈로그와 프록시 카탈로그가 일치하도록 `openclaw/plugin-sdk/provider-model-shared`의 `resolveClaudeThinkingProfile(modelId)`를 재사용해야 합니다.
- 각 프로필 수준에는 저장된 정식 `id`(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` 또는 `max`)가 있으며, 표시용 `label`을 포함할 수 있습니다. 이진 제공자는 `{ id: "low", label: "on" }`을 사용합니다.
- 명시적인 thinking 재정의를 검증해야 하는 Tool Plugin은 `api.runtime.agent.resolveThinkingPolicy({ provider, model })`와 `api.runtime.agent.normalizeThinkingLevel(...)`를 사용해야 하며, 자체 provider/model 수준 목록을 유지해서는 안 됩니다.
- 구성된 사용자 지정 모델 메타데이터에 접근할 수 있는 Tool Plugin은 `resolveThinkingPolicy`에 `catalog`를 전달하여 `compat.supportedReasoningEfforts` 옵트인이 Plugin 측 검증에 반영되도록 할 수 있습니다.
- 게시된 레거시 훅(`supportsXHighThinking`, `isBinaryThinking`, `resolveDefaultThinkingLevel`)은 호환성 어댑터로 남아 있지만, 새로운 사용자 지정 수준 집합은 `resolveThinkingProfile`을 사용해야 합니다.
- Gateway 행/기본값은 `thinkingLevels`, `thinkingOptions`, `thinkingDefault`를 노출하여 ACP/chat 클라이언트가 런타임 검증에서 사용하는 것과 동일한 프로필 ID와 레이블을 렌더링하도록 합니다.
